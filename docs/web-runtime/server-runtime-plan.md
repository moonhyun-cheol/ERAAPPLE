# 서버형 런타임 전환 계획 (Server-Authoritative Runtime)

상태: **계획 초안 v8 — S1 완료 기준 충족 + S2(세션 레지스트리·유예 재연결) 헤드리스 검증 완료(실기기·별도 호스트 미착수).** 이 문서는 방향 제안이며, §13에 명시된 부분외에는 구현·배포·검증된 사실이 아니다. (v8: S2 세션 레지스트리+grace 재연결 구현·헤드리스 검증 완료를 §13에 반영, S2를 미착수 목록에서 제거. v7: 실게임 replay를 SHOP 자동세이브(`save99.sav`)까지 구동해 A·B 저장 해시 바이트 동일까지 대조 — 저장 해시 대조를 non-trivial로 격상, S1 완료 기준 충족을 §13에 반영. v6: S1 Layer B(WS 전송)와 실게임 소스 로드+replay 출력-해시 등가성 검증을 §13에 반영. v5: `server` 브랜치 분기 + S1 Layer A(`server/engine-session.mjs`·`save-store.mjs`·`config.mjs`) 실제 구현·헤드리스 검증을 §11·§13에 반영. v4: §11 위생 실행 갱신, §9 호스트 토폴로지 신설, §12 iOS wss 추가)

**사용자 확정 전제:**
- **단일 사용자(본인 전용).** 서버는 혼자 쓴다 → 다중 계정·공개 인증·동접 큐잉은 초기 비목표. 최소한의 접근 보호(단일 토큰/사설망)만 둔다.
- **나중에 서버 PC 이전을 고려한다.** 지금은 집 PC 등에서 돌리더라도, 이후 다른 PC·VPS로 통째로 옮길 수 있게 **이식성(portability)을 처음부터 설계 제약으로 둔다**(→ §8).
- **오프라인 포기 확정.** 사용자가 오프라인 플레이 포기를 승인했다 → **S0 결정 입력이 모두 충족됨.** 기본 경로는 확정: **S1(로컬 Node + WS, VM 1개) → S2(세션·재연결) → S3(폰 접속)**. 남은 문은 "기존 PWA 유지" 대안뿐인데, 이는 병행 여부만 남았을 뿐 서버형 착수를 막지 않는다.

[문서 지도](README.md) · [기존 아키텍처](architecture.md) · [계약](contracts.md) · [확장 런타임 계획](scalable-runtime-plan.md)

## 0. 왜 서버형을 검토하는가 (동기)

현재 증상: 아이폰 홈 화면 PWA에서 상점/메인 메뉴 등을 누르면 진행이 멈춘다. 지금까지 확인된 사실:

- 엔진 로직 자체는 정상(Node 격리 프로브에서 세이브·상점·날짜 전환 `ok:true`).
- 헤드리스 데스크톱에서는 먹통이 **재현되지 않음**(iOS Safari의 백그라운드 타이머/워커 스로틀·메모리 압박이 데스크톱에는 없음).
- 즉 남은 불씨의 핵심 변수는 **iOS의 브라우저 실행 환경**(Web Worker 스로틀, Jetsam 메모리 종료, 포그라운드 복귀 시 메시지 유실)이다.

서버형의 발상: **무거운 VM을 폰의 브라우저 밖(서버)에서 돌리고, 폰은 텍스트/선택지를 받아 그리고 입력만 올리는 얇은 단말**로 만든다. 그러면 iOS 워커 스로틀·Jetsam이라는 변수 자체가 게임 실행에서 사라진다.

> ⚠️ **이 전환은 기존 명시적 비목표와 충돌한다.** `architecture.md §7`과 `scalable-runtime-plan.md`는 "클라우드/서버 상시 실행 전환", "계정·클라우드 동기화"를 초기 비목표로 두고 **오프라인 PWA**를 전제했다. 서버형은 그 전제를 바꾸는 **별도 제품 결정**이며, 그 대가(오프라인 포기·상시 서버 필요·세이브가 서버에 저장)를 **사용자가 승인함(확정)**. 단일 사용자 전제라 상시 서버 비용·프라이버시 위험은 최소화된다. (근거: `architecture.md` §5·§7, `scalable-runtime-plan.md` §1·§7)

## 1. 현재 구조에서 절단면(seam)은 이미 깨끗하다

이 전환이 현실적인 이유: 엔진은 **이미 Node에서 그대로 실행**된다. `tools/web-engine-probe/`의 모든 프로브(`eramaou128-save-probe.mjs`, `game-browser-test.mjs`의 Node측 등)가 브라우저 없이 `dist/engine*.mjs`를 import해 컴파일·플레이·저장까지 돌린다. 브라우저 워커와 Node 프로브는 **같은 엔진 코드**를 쓴다.

워커 엔트리 `engine-worker.mjs`를 보면 UI와의 접점이 딱 두 가지다:

1. **엔진 → 바깥**: `postMessage({type})` — `render`(배치 출력), `waiting`(입력 대기), `running`, `saved`, `ended`, `error`, 진행률.
2. **바깥 → 엔진**: `self.onmessage` — `start`, `input`, `resume`, `rendered`(ack), `waiting-ack`.

그리고 엔진 실행 자체는 제너레이터 루프다:

```js
vm = compile(source);
generator = vm.start({
  getSavedata: async key => store.get(key),                 // 저장 읽기 콜백
  setSavedata: async (key, value) => store.set(key, value),  // 저장 쓰기 콜백
  saveProgress, getTime, getFont
});
await advance(null); // generator.next(value) 루프: 출력 batch/입력 대기 이벤트를 방출
```

**핵심:** `store`(현재 IndexedDB, `browser-store.mjs`)와 `postMessage` 전송/수신 함수만 바꾸면, **엔진·제너레이터 루프·입력 게이트·배치 채널·waiting 릴레이 로직은 그대로 서버로 옮길 수 있다.** 즉 서버형은 엔진 재작성이 아니라 **전송 계층(transport)과 저장 백엔드 교체**다. (근거: `engine-worker.mjs` L1–132, `browser-store.mjs`)

게다가 서버 이식에 필요한 도구가 이미 저장소에 있다: `tools/web-engine-probe/package.json`에 esbuild 빌드(`build.mjs`)·Playwright·Node 테스트 러너와 **이미 `serve-pwa.mjs`/`serve.mjs`(정적 HTTP)와 `test:server` 스크립트**가 있다. 서버형은 이 정적 서버를 **WS 세션 서버로 확장**하는 형태로 시작할 수 있고, 게임 소스 번들도 기존 `build.mjs` 파이프라인을 그대로 재사용한다. (근거: `package.json` scripts, `serve-pwa.mjs`)

## 2. 목표 아키텍처

```text
iPhone Safari / 홈 화면 PWA (얇은 단말)
  Thin Client: render 이벤트를 DOM에 그림 · 입력 토큰 전송 · 재연결
    │  WebSocket (또는 SSE+POST) — 기존 postMessage 메시지를 그대로 프레이밍
    ▼
서버 (Node)
  Gateway: 인증 · 세션 라우팅 · rate limit · 백프레셔
    SessionManager: 사용자당 1 VM, 유휴 타임아웃, 재연결 버퍼
      Engine Runtime (= 현재 engine-worker 로직을 서버 프로세스/워커스레드로)
        compile(source) + vm.start({getSavedata,setSavedata,...})
    SaveStore: 파일시스템/DB (기존 IndexedDB 저장을 서버 저장으로)
```

- **단말은 Emuera를 모른다**(기존 원칙 유지). render/waiting/input 계약만 안다.
- **서버가 권위(authoritative)**: 게임 상태·저장은 서버가 소유. 폰은 화면 상태만 캐시.
- **한 사용자 = 한 VM**. 단일 사용자 전제이므로 서버는 사실상 **VM 1개**만 상주시키면 된다(동접 큐잉·다중 세션 스케일아웃 불필요). 다만 폰 재연결/포그라운드 복귀를 위해 세션 1개의 수명·재동기화는 필요하다.

## 3. 전송 계약 매핑 (postMessage → 네트워크)

기존 메시지를 **그대로** 네트워크 프레임으로 옮긴다. 새 의미를 만들지 않는다.

| 현재 (worker) | 방향 | 서버형 프레임 | 비고 |
| --- | --- | --- | --- |
| `start {mode,bin,db}` | C→S | `session.start` | 서버가 게임 소스를 이미 보유하므로 `bin` fetch 불필요 |
| `render` 배치 | S→C | `render` (seq 번호) | 기존 `batch-channel`의 순서/ack 유지 |
| `rendered {id}` (ack) | C→S | `render.ack` | 미승인 큐 상한 시 VM yield (기존 백프레셔 그대로) |
| `waiting {id,deadline,event,stack}` | S→C | `waiting` | 기존 `waiting-relay` 재전송 로직 유지 |
| `waiting-ack {id}` | C→S | `waiting.ack` | |
| `input {id,value}` | C→S | `input` | `input-gate`의 requestId 일치 검사 유지 |
| `running {id}` | S→C | `running` | 입력 수락 순간 UI 버튼 disable |
| `saved {key}` | S→C | `saved` | |
| `ended` / `error` | S→C | `ended` / `error` | |
| `resume` | C→S | `resume` | 포그라운드 복귀·재연결 시 pending waiting 재동기화 |

**재연결이 새로 필요한 유일한 부분:** 네트워크가 끊겼다 붙으면 서버는 (a) 마지막 미승인 render 배치와 (b) 현재 pending `waiting`을 다시 보낸다. 이미 워커에 있는 재전송 로직(`createWaitingRelay`, `batch-channel`의 재전송)이 이 의미를 갖고 있어 **재사용**한다. (근거: `engine-worker.mjs`의 `waitingRelay`/`channel` 주석 L11–58)

## 4. 서버형이 실제로 없애는 문제 vs 새로 만드는 문제

### 없애는 것
- iOS Web Worker 백그라운드 스로틀 → VM이 서버에 있으므로 무관.
- iOS Jetsam 메모리 종료(4일차 종료의 후보 원인) → 서버 RAM에서 실행.
- 폰 브라우저에서 61MiB 게임 번들 다운로드·디코드·컴파일 피크 → 서버에서 1회.
- postMessage 유실로 인한 "죽은 버튼" 계열 → TCP/WebSocket 순서 보장 + 서버측 ack 재전송.

### 새로 생기는 것 (정직하게)
- **오프라인 불가.** 네트워크 없으면 플레이 불가. 기존 PWA의 최대 장점을 포기.
- **배포 경로가 완전히 달라진다.** 현재 배포는 GitHub Pages(**정적 호스팅**)다 — Node 프로세스를 못 돌린다. 즉 서버형은 **기존 Pages 파이프라인으로 배포 불가**, 별도 상시 실행 호스트가 필요하다(→ §9·§10). 이건 코드 문제가 아니라 배포 인프라 자체가 바뀐다는 뜻.
- **상시 서버 운영.** VM은 게임당 수백 MiB RAM(측정치: 16일 forced-GC ~274MiB, 전환 피크 RSS ~879MiB — `scalable-runtime-plan.md` §1). **단일 사용자면 VM 1개뿐이라 RAM 요구는 상수(≈1GiB 여유 PC면 충분)**, 동접 큐잉 불필요. 대신 서버 PC가 항상 켜져 있어야 함(전원·네트워크 가용성).
- **입력 지연(latency).** 한 번 누를 때마다 왕복. 텍스트 게임이라 체감은 작지만 0은 아님.
- **세이브가 서버에 저장됨.** 단일 사용자라 계정 간 격리는 불필요하지만, **공개 엔드포인트면 남이 내 세이브에 접근하지 못하게 최소 보호(단일 토큰/사설망/VPN)**는 필요.
- **세션 수명·유휴 정리·재연결.** 폰이 잠기거나 앱 전환하면 서버 VM을 얼마나 살려둘지 정책 필요.
- **접근 노출.** 단일 사용자라 DoS 큐잉은 불필요하나, 공개 포트를 열면 최소한 미인증 세션 생성 차단은 둔다(§8-5·§9의 사설 접속/터널을 기본 권장).

## 5. 저장(세이브) 이전 전략

가장 민감한 부분. 기존 세이브는 폰 IndexedDB에 있다.

1. **서버 저장으로 이전:** `getSavedata/setSavedata` 콜백을 서버 파일시스템/DB로 구현(`browser-store.mjs` 대체). 기존 저장 계약(원자적 commit, expectedRevision, 단일 writer)을 서버 트랜잭션으로 재현. (근거: `contracts.md §5`)
2. **기존 폰 세이브 마이그레이션:** 폰 IndexedDB → 백업 ZIP export(기존 기능) → 서버 import. **자동 공유를 약속하지 않음**(기존 origin 변경 정책과 동일, `architecture.md §5`).
3. **하이브리드 옵션(권장 검토):** 서버가 권위지만, 세이브 스냅샷을 **폰에도 내려주어** 사용자가 자기 세이브를 소유·백업하게 함. 서버 데이터 상실 대비.

> **주의(기존 문서와 정합):** origin(프로토콜·호스트·포트)이 바뀌면 폰의 기존 IndexedDB 세이브는 새 주소에서 보이지 않는다. 서버형은 폰이 접속하는 주소가 바뀌므로 **기존 세이브는 반드시 백업 ZIP으로 먼저 빼두고** 서버로 import해야 한다. (근거: `github-pages-deploy.md §4`)

## 6. 단계 로드맵과 중단 기준

작업량은 전담 개발자 1명 기준 초기 추정. 확정 납기 아님. 각 단계는 **다음 단계 진입 전 중단 기준**을 통과해야 함.

| 단계 | 내용 | 산출물 | 완료/중단 기준 |
| --- | --- | --- | --- |
| **S0 결정·전제 확정** ✅ | 오프라인 포기·단일 사용자·PC 이전 모두 확정. 남은 건 서버 PC/네트워크 개략만 | 결정 메모(이 문서), 서버 PC/네트워크 개략 | **충족됨.** 오프라인 포기 승인 완료 → S1 착수 가능 |
| **S1 서버 런타임 PoC** | `engine-worker.mjs` 로직을 Node 서버 세션으로 이식(전송=WS, 저장=파일). **VM 1개** | 헤드리스로 WS 클라이언트가 타이틀→상점→저장→전환까지 구동 | 같은 입력 replay가 Node 프로브와 **동일 출력/저장 해시**. 불일치면 이식 결함 수정 전 진행 금지 |
| **S2 세션 수명·재연결** ✅(헤드리스) | 세션 1개의 유휴 타임아웃, 끊김→재연결 시 render/waiting 재동기화 | 재연결 테스트(끊고 붙여도 화면·pending 입력 보존) | 인위적 연결 끊김 주입에도 죽은 버튼/유실 0. 미달 시 S3 금지 — **커밋 `be26eb7`, 13/13 통과. 실기기 단절은 S3에서 검증** |
| **S3 얇은 클라이언트** | 현재 `browser.mjs` UI에서 postMessage를 WS로 교체(렌더 로직 재사용) | 아이폰 Safari에서 실제 플레이 | **실기기에서 상점/메인 메뉴 먹통 없이 진행**. 이 통과가 이 문서 전체의 핵심 관문 |
| **S4 접근 보호·세이브 이전** | 단일 토큰 접근 보호, 폰 IndexedDB↔서버 세이브 마이그레이션(백업 ZIP 왕복) | 미인증 접속 거절 테스트, 마이그레이션 왕복 | 토큰 없는 접속 0, 마이그레이션 후 진행 재개 성공 |
| **S5 이식성·운영** | **§8 서버 PC 이전 리허설**, 메모리 watchdog, 자동 백업 | 서버를 다른 PC로 옮겨 세이브·진행 보존 확인, watchdog 종료가 세이브 보존 | **다른 PC에서 동일 세이브로 재개 성공**, watchdog 종료해도 마지막 저장 보존 |

의존 순서: **S0 → S1 → S2 → S3 → S4 → S5.** S3(실기기 통과)가 목표 달성의 증거이고, 그 전 단계 성공은 완료로 계산하지 않는다. 단일 사용자 전제로 S4·S5는 크게 가벼워졌고(다중 계정·동접 큐 삭제), 대신 S5에 **PC 이전 리허설**을 명시적 완료 기준으로 넣었다.

## 7. 결정 상태 (S0 — 충족)

S0 입력이 모두 확정됐다:

- ✅ **단일 사용자** — 확정.
- ✅ **PC 이전 고려** — 확정(§8 제약으로 반영).
- ✅ **오프라인 포기** — 승인. 서버형의 유일한 실질 대가를 사용자가 수용.

남은 선택은 하나뿐이며 서버형 착수를 막지 않는다: **기존 PWA(엔진 경량화, `scalable-runtime-plan.md`) 경로를 폐기할지 백업으로 병행 유지할지.** 서버형 S3가 실기기에서 통과하기 전까지는 기존 PWA를 지우지 말고 **백업으로 남겨두는 것을 권장**한다(서버형이 원인 가설을 반증할 경우 대비).

> **확정된 기본 경로:** **S1(로컬 Node 서버 + WS, VM 1개) → S2(세션·재연결) → S3(폰 접속)**. 인증·다중 사용자는 단일 토큰 수준으로 최소화. 이 경로가 "정말 iOS 환경이 원인인가"를 가장 빠르게 확정한다. PC 이전은 §8 제약을 지키면 S5에서 리허설만 하면 된다. **다음 실행 단위 = S1 PoC.**

## 8. 서버 PC 이전(portability)을 위한 설계 제약

"나중에 다른 PC/VPS로 옮긴다"를 처음부터 제약으로 두면, 이전은 **파일 복사 + 실행**으로 끝난다. 옮길 때 깨지지 않도록 다음을 S1부터 지킨다.

1. **상태를 한 폴더에 몰아둔다.** 세이브·설정·게임 소스를 예: `server-data/`(saves), `server-config/`(env), `games/`(bin) 하위로 고정. 이전 = 이 폴더들 + 코드 복사. **하드코딩된 절대 경로 금지**, 모두 설정값 기준.
2. **설정은 환경변수/`.env` 한 곳에서.** 포트·바인드 주소·접근 토큰·데이터 경로를 코드가 아니라 config에서 읽는다. 새 PC에선 이 값만 바꾼다.
3. **런타임 의존을 고정·재현 가능하게.** Node 버전을 `.nvmrc`/`engines`에 박고 `package-lock.json` 커밋. 가능하면 **Dockerfile 하나**로 감싸면 "PC 이전 = 이미지+볼륨 이동"이 되어 가장 안전(선택).
4. **세이브 포맷은 이식 가능(플랫폼 중립).** 서버 저장을 JSON/파일 기반으로 두어 OS(Windows↔Linux) 바뀌어도 그대로 읽히게. 기존 백업 ZIP export/import를 이전 도구로 재사용.
5. **주소 이전을 흡수하는 접속 계층.** 폰 클라이언트가 서버 주소를 하드코딩하지 않게 설정값/QR로 주입. 집→VPS 이전 시 **고정 도메인(DDNS)이나 터널(Cloudflare Tunnel/Tailscale)**을 쓰면 IP가 바뀌어도 폰 설정을 안 바꿔도 된다. Tailscale 같은 사설망이면 §4의 "접근 노출"도 동시에 해결.
6. **이전 리허설을 완료 기준으로.** S5에서 실제로 다른 머신(또는 새 컨테이너)에 옮겨 **같은 세이브로 진행이 재개되는지** 확인해야 "이식 가능"으로 인정. 문서 주장만으로는 미검증.

## 9. 배포 호스트 토폴로지 선택 (미결 — S0 잔여 결정)

정적 Pages로는 못 돌리므로(§4·§10), 상시 실행 호스트를 골라야 한다. 단일 사용자 전제에서 현실적인 후보와 트레이드오프:

| 옵션 | 접근 방식 | 장점 | 단점/주의 |
| --- | --- | --- | --- |
| **집 PC + Tailscale/Cloudflare Tunnel** (권장 시작점) | 사설망(WireGuard)/터널로 폰만 접속 | 추가 비용 0, 포트 개방 불필요(공개 노출 최소·CC BY-NC-ND 위험 최소), IP 바뀌어도 폰 설정 불변 | PC가 항상 켜져 있어야, 집 인터넷 의존, 초기 터널 설정 필요 |
| **집 PC + DDNS + 포트포워딩** | 공개 포트 + 단일 토큰 | 터널 앱 불필요 | 공개 노출 → 토큰·TLS 필수, 라우터 설정, 보안 부담 큼 (비권장) |
| **소형 VPS(1~2GiB RAM)** | 공개 도메인 + TLS + 토큰 | 24/7 가용성, 집 네트워크 무관, PC 이전 리허설 대상 그 자체 | 월 비용, 게임 bin을 VPS에 올림(CC BY-NC-ND 공개 아님이라 사설 접속 유지 필요), 관리 부담 |
| **Docker 컨테이너(집/VPS 공통)** | 위 중 하나 + 컨테이너 | §8-3 이식성 최상(이미지+볼륨 이동), 환경 재현성 | 컨테이너 학습 곡선 |

**권장 경로:** S1~S3은 **집 PC + Tailscale**로 시작(비용 0·노출 최소·설정 단순). S5 이전 리허설 때 Docker 이미지로 감싸 **VPS로 옮겨보는 것**을 이식성 검증으로 삼는다. 이 선택은 코드에 하드코딩되지 않아야 하며(§8-2,5), 결정은 S1 착수와 병행 가능(전송/저장 계층은 호스트 무관).

## 10. 현재 Git·배포 환경과의 정합 (반드시 고려)

서버형은 코드뿐 아니라 **배포·저장소 운영 방식**을 바꾼다. 현재 환경(확인된 사실):

- 저장소는 Git, 브랜치 **`main` 단일**, 원격 `origin`(GitHub). 배포 = **`main`에 `pwa-dist/**` push → GitHub Actions 워크플로가 정적 게시**. CI는 재빌드하지 않고 사전 빌드 산출물을 그대로 올린다. (근거: `github-pages-deploy.md §1·§3·§5`, `.gitignore`)
- 즉 **`main` push가 곧 공개 업로드**다. 서버형 코드를 `main`에 무심코 커밋하면 의도치 않은 공개·혼선이 생긴다.

이로부터 나오는 제약:

1. **정적 Pages로는 서버를 못 돌린다.** GitHub Pages는 Node 서버를 실행할 수 없다. 서버형은 **별도 상시 호스트**(§9)가 필요하고, 배포는 Pages 워크플로가 아니라 그 호스트에서 프로세스를 띄우는 방식이 된다. Pages는 (남긴다면) 기존 오프라인 PWA 백업 전용으로만 계속 쓴다.
2. **서버 코드는 브랜치를 분리한다.** `main`은 공개 정적 배포 라인이므로, 서버 런타임은 예: `server` 브랜치나 별도 디렉터리(`server/`)로 두고, **공개 게시 대상(`pwa-dist/`)과 물리적으로 분리**한다. 서버형 얇은 클라이언트(WS 버전 UI)는 별도 산출물로 빌드해 필요 시에만 Pages에 올린다.
3. **비밀·상태를 커밋하지 않는다.** 접근 토큰(`.env`)·`server-data/`(세이브)·로그는 반드시 `.gitignore`에 추가(§11). 현재 `.gitignore`는 `node_modules/`·`dist/`만 무시하고 `pwa-dist/`는 추적하므로, 서버용 무시 규칙을 새로 넣어야 한다. **(v4에서 실행: 루트 `.gitignore`에 `.env`/`server-config/`/`server-data/`/서버 로그 규칙 추가 완료.)** (근거: `tools/web-engine-probe/.gitignore`)
4. **게임 소스(bin)의 취급.** 서버는 게임 bin을 로컬에서 읽으면 되고 **폰에 61MiB를 내려보내지 않는다**(서버형의 장점). 저장소에는 이미 bin이 추적되고 있으나, 서버는 그것을 `games/`에서 읽도록 경로만 설정으로 뺀다(§8-1).
5. **라이선스 관점의 반전 이점.** 이 게임은 CC BY-NC-ND라 GitHub Pages 공개는 게임 텍스트 전체를 영구 공개하는 것이었다. **단일 사용자 사설 서버(Tailscale 등)는 오히려 공개 노출을 줄인다** — 남에게 공개하지 않고 본인만 접속하므로 라이선스상 노출 위험이 정적 공개보다 작다. (근거: `github-pages-deploy.md` 라이선스 주의)

## 11. 저장소 위생 — 착수 전 정리 (v4에서 실행함)

착수 전 정리를 **실제로 수행**했다(HEAD `d65f241`, 브랜치 `main`).

- **미커밋 스크롤 변경 분리(완료):** `browser.mjs`·`pwa-dist/`(browser.js·sw.js·build.json·pwa-build.json)·여러 `results/*.json`의 **지난 턴 미검증 스크롤 수정**을 `git stash`로 분리했다(stash 메시지: "unverified scroll change (anchorLatest bottom-follow) …"). 이 변경은 "또 위로 가잖아" 증상을 아직 못 고친 미검증본이라 서버 브랜치에 섞지 않는다. **폐기가 아니라 보류**이며 필요 시 복구 가능. 추측 배포 금지 원칙상 자동 커밋하지 않았다.
- **untracked 스크래치 처리(완료):** 실험 프로브(`menu-scroll-measure.mjs`, `shop-freeze-repro.mjs`, `menu-click-repro.mjs`, `tools/jp-scan/`, `results/*repro*.json`, `shop-buy.json` 등)는 같은 stash의 untracked 트리에 함께 보류됐고, 워킹트리에서 필요한 문서(이 계획서)만 다시 꺼내 두었다. 결과적으로 워킹트리에서 스크래치가 치워져 서버 브랜치를 깨끗하게 시작할 수 있다.
- **원칙 준수:** `git reset --hard`·`git clean`·무분별한 `git add .`를 쓰지 않았다(대량 untracked 원본 보존). 스크래치는 삭제가 아니라 stash로 회수 가능한 상태다.

> **주의(stash 취급):** 이 stash에는 (a) 미검증 스크롤 변경(추적 트리)과 (b) 스크래치(untracked 트리)가 함께 들어 있다. 나중에 스크롤 변경을 되살릴지/버릴지 결정할 때, stash pop은 둘을 모두 되돌리므로 **선택 복원**(특정 파일만 꺼내기)이 필요하다.

남은 순서: (c) 깨끗한 상태에서 `server` 브랜치 생성 **(완료 — `server` 브랜치 분기)** → (d) S1 착수 **(Layer A 진행 중, 아래 §13 참조)**. (a)·(b)는 v4에서 완료.

## 12. 추가로 고려할 설계 항목 (초기 검토 목록)

- **iOS 보안 컨텍스트·wss 필수.** 홈 화면 PWA(서비스워커)와 WebSocket은 **보안 컨텍스트(HTTPS/wss)**에서만 안정 동작한다. 평문 `ws://`는 HTTPS 페이지에서 차단되고, iOS는 자가서명 인증서에 특히 까다롭다. → 집 PC 시작이라도 **Tailscale(사설·신뢰 경로)나 Cloudflare Tunnel(자동 TLS)**을 기본값으로 두어 인증서 문제를 우회한다(§9와 연결). 이건 "폰에서 접속" 성공의 전제 조건이라 S3 이전에 확정해야 한다.
- **동시 연결 = 단일 writer 보장.** 폰이 탭 2개/기기 2대로 같은 세션에 붙으면 세이브 경합이 생긴다. 단일 사용자라도 **세션 1개·writer 1개**를 강제(뒤 연결이 앞을 인계 takeover)해야 기존 저장 계약(단일 writer, expectedRevision)을 지킨다. (근거: `contracts.md §5`)
- **시간·폰트 콜백.** `vm.start`는 `getTime`·`getFont`도 받는다. 서버에서 `getTime`은 서버 시계를 쓰되, 게임 로직이 로컬 타임존을 가정하면 폰 타임존을 세션에 전달할지 결정해야 한다. `getFont`는 렌더가 클라이언트이므로 실질 영향 확인 필요. (근거: `engine-worker.mjs` vm.start 콜백)
- **유휴/재접속 정책 수치화.** 폰 잠금·앱 전환 시 VM을 몇 분 살릴지, 유휴 종료 전 자동 저장할지. iOS는 백그라운드로 가면 WS도 끊기므로 **재접속 버퍼(마지막 render seq + pending waiting)**가 핵심(§3 재사용 로직).
- **서버 프로세스 격리.** VM을 메인 프로세스에서 돌리면 크래시가 서버 전체를 내린다. Node `worker_threads`로 게임 VM을 격리하면 기존 워커 모델과 가장 가깝고 크래시 복구도 쉽다(선택).
- **관측성.** 단일 사용자라도 먹통 재발 시 원인 규명을 위해 서버측 이벤트 로그(입력→render seq→ack)를 남긴다. 이게 있었으면 이번 iOS 먹통도 훨씬 빨리 좁혔을 것.

## 13. 미해결·미검증 (정직한 한계)

- 이 문서는 **엔진 서버 이식·측정을 하지 않았다.** "seam이 깨끗하다"는 `engine-worker.mjs`/프로브 구조 읽기에 근거한 판단이며, 실제 서버 이식이 무회귀임을 증명한 것은 아니다.
- 서버 RAM 산정은 기존 Node 측정치(~274MiB 상주, 전환 RSS ~879MiB) 추정일 뿐, 서버 프로세스 실측이 아니다. 단일 사용자라 동접 산정은 불필요.
- **PC 이전 이식성은 §8의 설계 제약을 지킨다는 전제의 계획일 뿐, 실제 이전 리허설(S5) 전에는 "옮길 수 있다"를 검증된 사실로 부르지 않는다.**
- 배포 호스트(§9)는 아직 **선택하지 않았다**. 권장(집 PC+Tailscale)은 제안일 뿐 미결.
- iOS 먹통의 근본 원인이 100% iOS 환경이라고 아직 **확정하지 못했다**(헤드리스 미재현). 서버형이 증상을 없앤다면 그것이 원인이 iOS 환경이었다는 강한 증거가 되지만, S3 실기기 통과 전에는 "해결"로 부르지 않는다.
- 서버형은 기존 오프라인 PWA 비목표와 충돌하는 방향 전환이다. 채택은 사용자 승인 사항이다.
- **v4에서 §11 저장소 위생(스크롤 변경 stash 분리·스크래치 보류·`.gitignore` 서버 규칙 추가)은 실제로 수행함.**
- **S1 Layer A(전송 무관 세션 코어) 실제 구현·헤드리스 검증 완료(`server` 브랜치).** `engine-worker.mjs`의 제너레이터 루프를 `server/engine-session.mjs`로 이식하고 `input-gate`/`batch-channel`/`waiting-relay`를 **그대로 재사용**했으며, IndexedDB 대신 `server/save-store.mjs`(원자적 파일 저장, JSON), env 설정 `server/config.mjs`(§8-1,2 하드코딩 절대경로 없음)를 추가했다. `node --test server/engine-session-test.mjs`가 중립 fixture로 (1) 타이틀 렌더+입력 대기, (2) SAVEDATA→파일 세이브 기록→**새 세션이 같은 파일 스토어에서 `RESTORED:42:hangul test:77` 복원**, (3) resume가 pending `waiting`을 같은 id로 재발행(§3 죽은 버튼 복구)을 통과했다. 엔진은 `setSavedata`에 **평문 문자열**을 넘기므로(실측: 키 `global.sav`/`save00.sav`) JSON 파일 저장이 무손실임을 확인했다.
- **S1 Layer B(WS 전송 계층) 실제 구현·헤드리스 검증 완료(`server` 브랜치, 커밋됨).** 의존성 없이 RFC6455를 직접 구현했다: `server/ws-frame.mjs`(순수 프레임 코덱·핸드셰이크 키), `server/ws-server.mjs`(업그레이드+단일 토큰 게이트, 연결당 세션 1개, `post`↔WS 텍스트 프레임 **1:1**, close 시 dispose). `node --test`가 프레임 코덱 4건(길이 경계·청크 분할 재조립·서버 무마스킹·RFC6455 §1.3 acceptKey)과 실제 WebSocket 왕복 3건(타이틀 대기, SAVEDATA→파일→새 연결 복원, resume 재발행)을 통과했다. 엔진 의미는 손대지 않았다.
- **실게임 소스 서버 로드 + replay 등가성(출력+저장 해시) 검증 완료(`server/game-source.mjs`·`server/game-replay-test.mjs`).** 에라마왕 개조판 1.28의 ERB/CSV/ERH **330파일(실측 9.71MiB 무압축, utf-8-bom)**을 프로브와 동일한 키 스킴으로 Map에 로드해 세션 코어에 주입했다. 고정 seed·고정 시계로 구동하되, blind 고정 배열 대신 save-probe와 **동일한 내용 기반 적응형 decide 휴리스틱**(타이틀→NEW GAME→캐릭터 생성→SHOP)으로 (A) 직접 vm 루프를 몰며 **각 프롬프트에서 먹인 입력을 기록**하고, (B) 세션 코어(in-process 전송)에 그 기록된 시퀀스를 **1:1 replay**했다. SHOP 진입 시 게임이 실행하는 내장 자동저장(`SAVEDATA 99`)이 실제 `save99.sav`(실측 8961자)를 기록하므로, 전달된 비입력 이벤트 **173개가 SHA-256 동일**(`be26704c…`)이고 **A·B 저장 스토어가 바이트 단위로 동일**(`d0ec056d…`)함을 검증했다. 즉 배치·input-gate·waiting-relay·파일 스토어 이식이 실게임 콘텐츠에서 엔진 의미를 바꾸지 않으며, 저장 해시 대조가 **빈 스토어가 아닌 실제 자동저장 페이로드**로 비리범(non-trivial)하게 성립한다. → **S1의 "Node 프로브와 동일 출력/저장 해시" 완료 기준 충족.**
- **S2(세션 수명·재연결) 실제 구현·헤드리스 검증 완료(`server` 브랜치, 커밋 `be26eb7`).** 세션을 소켓에서 분리해 `server/ws-server.mjs`에 **세션 레지스트리(sessionId 키)**를 두었다: 소켓 끊김은 `dispose`가 아니라 **detach**만 하고 in-memory VM을 살려둔다. 클라가 `?session=<id>`로 재접속하면 살아있는 세션에 **rebind**(`holder.conn` 간접 참조로 `post` 재바인딩 — 엔진 의미 불변)하고, 없으면 새로 만든다. 연결 시 `session` hello(`{id, resumed}`)로 클라가 resume/start를 판단한다. `sessionTtlMs`(기본 30s, `unref` 타이머) 경과 시 dispose하고 `server close`가 전체 정리한다. `node --test`가 (1) 소켓 드롭 후 같은 id 재접속 → `resumed:true` → resume가 **mid-game 동일 waiting id** 재발행 → 이어서 완주(타이틀 재시작 아님), (2) grace 만료 후 같은 id → `resumed:false`(fresh)를 통과했다(전체 스위트 13/13, 회귀 0). 단, 실제 네트워크 단절·모바일 백그라운드 복귀가 아닌 **헤드리스 in-process**(테스트 클라가 소켓을 닫고 새 WS로 재접속)로만 검증했고 TTL 30s는 미튜닝 고정값이다.
- **상점 먹통 원인 격리 — 엔진 빌드는 원인이 아님(측정 확정).** "서버로 열면 상점 상품을 눌러도 반응이 없다"는 보고에 대해, 서버가 실제 돌리는 `dist/engine.mjs`(deferred-local, printform 오버레이 없음)와 정상 동작하는 PWA가 쓰는 `dist/…printform-static-assign.mjs`(printform 오버레이)를 **동일 시드·동일 결정 시퀀스로 나란히 구동**해 상점까지 몰고 단계별 출력을 대조했다(`tools/web-engine-probe/shop-engine-diff.mjs`, 결과 `results/shop-engine-diff.json`). 시드를 고정하기 전에는 캐릭터 랜덤 생성(머리색·이름·무기) 때문에 텍스트가 갈렸으나(=RNG 노이즈), **`vm.random.state`를 양쪽 동일 시드로 고정하니 두 엔진이 1084 이벤트/30 입력에서 바이트 단위로 완전히 동일**(`identical:true`)했고 둘 다 상점 진입·상품 선택·수량 입력·구매 후 8라운드 진행에 성공했다. → **엔진 개조는 상점 무반응의 원인이 아니다.** (이전 세션의 "PWA=순정, 서버=iOS 최적화 오버레이" 서술은 오판이었고 정정한다: 둘 다 개조 빌드이며, 오히려 정상 동작하는 PWA 쪽이 printform 오버레이가 얹힌 무거운 빌드다. 업스트림 커밋은 양쪽 `fb487bce`로 동일.)
- **따라서 남은 유력 용의자는 전송 계층(WS)뿐이다(미확정).** PWA(워커 postMessage: 순서보장·재전송 없음)는 정상이고 서버판(WS: waiting/events 재전송+ack relay)만 먹통이므로, 차이는 전송 경로에 있다. 정적 읽기로 특정한 한 가지 구조적 간극: `server/engine-session.mjs`의 `handle`에서 **`input`이 `busy`인 동안 도착하면 아무 재동기화 없이 조용히 버려진다**(`if (busy) return;`). 클라이언트 `send()`는 전송 즉시 `endChoice()`로 컨트롤을 낙관적으로 비활성화하므로, 이렇게 버려진 입력은 **waiting-relay가 이미 ack로 취소된 뒤라 재발행되지 않아** 컨트롤이 영구히 죽을 수 있다(dropped `waiting`은 relay가 복구하지만 dropped `input`은 복구 경로가 없다). **단 이는 코드 읽기 기반 가설이며, 헤드리스(`thin-client-shop-test`)에서는 재현되지 않았다** — 실브라우저/실기기 재현 없이는 이것이 실제 원인이라고 확정하지 않는다.
- **그러나 남은 것은 미착수·미검증이다:** ① 저장 해시 대조는 SHOP 진입 자동저장(`save99.sav`)까지만 달성했다 — 수동 세이브 메뉴(옵션 200 → BEGIN SAVEGAME 씨)는 eraJS가 아직 구현하지 않은 경로라 fixture(Layer A/B)로만 증명했고, 여러 날짜 전환·장기 플레이 누적 세이브의 해시 안정성은 다루지 않았다. ② 실기기·얇은 클라이언트(S3)·실제 네트워크 단절 복구·별도 호스트 배포(§9)는 미착수. 모두 **in-process/헤드리스**로만 검증했고 네트워크·실기기 통과는 증명하지 않았다.
