# 집 PC 상주 배포 런북 (S3 핸드오프)

이 문서는 **집 PC로 가서** era 서버형 런타임을 상주시키고 폰에서 접속하기까지의 실행 절차다.
개발 PC에서는 여기까지 준비만 했고, 아래 단계는 **집 PC에서 처음 실행**한다. 결정은 이미
내려졌다: **집 PC를 안 끄고 상주**(plan §9), 무료 외부 호스트는 유휴 슬립·휘발성 디스크로 이
설계(살아있는 in-memory 세션 + 파일 세이브)와 맞지 않아 제외.

관련 문서: [server-runtime-plan.md](./server-runtime-plan.md) (§8 이식성, §9 호스트, §4/§7 토큰).

---

## 0. 전제 / 준비물

- **Node.js 22 이상** (권장 24). 내장 `WebSocket`(클라이언트/테스트)과 ESM에 필요.
  - 확인: `node -v`
- 이 저장소 클론 + `server` 브랜치 체크아웃.
- 게임 폴더 `에라마왕 개조판 1.28`이 저장소 루트 옆에 있을 것(트래킹됨). 없으면 호스트는
  중립 fixture로 부팅되어 클라이언트 동작만 확인 가능.
- 폰과 집 PC가 **터널/오버레이로 연결**되거나 같은 LAN. (아래 §4)

> 상태·시크릿은 절대 커밋 금지. `.gitignore`가 `.env`, `server-data/`, `server-config/`,
> `server/**/*.log`를 이미 제외한다(plan §10–§11). `main`은 공개 Pages 배포선이므로 서버는
> `server` 브랜치에서만 다룬다.

---

## 1. 첫 기동 (로컬 확인)

```powershell
git checkout server
cp .env.example .env      # 필요 시 편집(§3). 로컬 확인은 편집 없이도 됨.
node server/host.mjs      # 단발 실행(감시자 없이)
```

정상 로그 예:
```
[host] loaded real game: <N> files, <M> MiB from ...에라마왕 개조판 1.28
[host] thin client + WS on http://127.0.0.1:8787/
[host] saves: ...\server-data
```
게임 폴더가 없으면 대신 `real game unavailable (...); falling back to the neutral fixture.`

브라우저에서 `http://127.0.0.1:8787/` 접속 → 타이틀이 렌더되고 입력창이 활성화되면 성공.
`Ctrl+C`로 종료.

> 참고 실측(개발 PC): 실게임 로드+compile 후 타이틀 대기 idle RSS ≈ **76.5 MiB**. 집 PC RAM은
> 문제되지 않는다. 장시간 플레이 누적치는 §6에서 관찰.

---

## 2. 상주 기동 (감시자)

```powershell
node server/run.mjs
```
`run.mjs`는 `host.mjs`를 자식으로 띄우고 크래시 시 지수 백오프로 재시작한다. 빠른 연속 실패가
`ERA_SUPERVISOR_MAX_FAST_FAILS`(기본 8)를 넘으면 코드 1로 **크게 실패**(깨진 빌드가 CPU를 물지
않게). `Ctrl+C`/`SIGTERM`은 재시작 없이 클린 종료.

---

## 3. 오프박스 노출 설정 (.env)

폰에서 접속하려면 서버가 박스 밖에서 닿아야 한다. 두 가지 방식:

**A. 터널이 localhost로 닿는 경우 (권장, §4-A)** — 바인딩은 `127.0.0.1` 그대로 두고 토큰만 설정.
**B. LAN에 직접 노출** — `ERA_SERVER_HOST=0.0.0.0`. 이때 토큰은 **필수**.

`.env` 편집:
```
ERA_SERVER_TOKEN=<붙여넣기>     # 아래로 생성
# 방식 B만:
# ERA_SERVER_HOST=0.0.0.0
```
토큰 생성:
```powershell
node -e "console.log(require('crypto').randomUUID())"
```

> **중요:** 이 저장소에는 dotenv 로더가 없다. `host.mjs`/`run.mjs`는 `process.env`만 읽는다.
> 따라서 `.env`에 적은 값은 **셸에서 export 하거나 사용자 환경변수로 등록**해야 실제로 적용된다:
> ```powershell
> [Environment]::SetEnvironmentVariable('ERA_SERVER_TOKEN','<value>','User')
> ```
> 또는 그 세션에서:
> ```powershell
> $env:ERA_SERVER_TOKEN="<value>"; node server/run.mjs
> ```
> (`.env`는 사람이 값을 보관/전달하는 용도. 자동 로딩은 향후 개선 항목.)

바인딩이 localhost를 벗어났는데 토큰이 없으면 호스트가 기동 시 경고를 출력한다.

---

## 4. 폰 접속 경로 (터널/wss)

폰(브라우저)이 https로 페이지를 열면 클라이언트는 **자동으로 `wss://`** 로 소켓을 맺는다
(`client.mjs`가 `location.protocol==='https:'`를 보고 선택). 즉 페이지와 소켓이 **같은 오리진**을
쓰므로 CORS·mixed-content 문제가 없다. 따라서 필요한 건 "8787로 가는 https 경로" 하나다.

**A. Tailscale (권장 — 사설 오버레이, 공개 노출 없음)**
1. 집 PC와 폰에 Tailscale 설치·로그인(같은 tailnet).
2. 집 PC에서 `tailscale serve https / http://127.0.0.1:8787` 로 https를 붙이거나,
   MagicDNS 이름으로 접근. (Tailscale Serve가 TLS 종단을 제공 → 폰은 https → 클라 wss.)
3. 폰에서 `https://<magicdns-name>/?token=<토큰>` 접속.
   - 서버 바인딩은 `127.0.0.1`이면 충분(터널이 localhost로 프록시).

**B. Cloudflare Tunnel (도메인 있을 때)**
1. `cloudflared tunnel` 로 `http://127.0.0.1:8787` 을 공개 호스트명에 매핑.
2. Cloudflare가 https 종단 → 폰은 `https://<hostname>/?token=<토큰>` → 클라 wss.
3. 공개 경로이므로 **토큰 필수**. 추가로 Cloudflare Access로 한 겹 더 막으면 좋다.

**C. 같은 LAN 직결(임시 확인용)**
- `ERA_SERVER_HOST=0.0.0.0`, 폰에서 `http://<PC-LAN-IP>:8787/?token=<토큰>`.
- 단 http라 클라는 `ws://`(비암호). 홈 LAN 임시 확인용으로만. 상시 사용은 A/B 권장.

> 토큰은 URL 쿼리(`?token=`)로 전달된다. 폰 홈스크린에 토큰 포함 URL을 북마크/추가하면 매번
> 입력할 필요가 없다. 세션 id는 폰 `localStorage`에 저장되어 잠금/백그라운드 후 재접속 시 같은
> 서버 세션으로 `resume` 한다(S2).

---

## 5. 부팅 자동 시작 (재부팅 자가복구)

`run.mjs`는 크래시를 복구하지만 재부팅은 못 살린다. Windows 작업 스케줄러에 등록:

```powershell
# 저장소 루트에서 (비관리자 PowerShell)
.\server\scripts\register-autostart.ps1
# 이름/노드 경로 지정도 가능:
# .\server\scripts\register-autostart.ps1 -TaskName "era-home" -Node "C:\Program Files\nodejs\node.exe"
```
- 스크립트는 **자기 위치에서 저장소 루트를 유도**하고(하드코딩 절대경로 없음, §8), PATH의 node를
  찾아, 로그온 시 `node server\run.mjs`를 작업 폴더=저장소 루트로 실행하는 작업을 만든다.
- 실패 시 1분 간격 재시작, 배터리에서도 시작 허용.

지금 바로 시작 / 확인 / 제거:
```powershell
Start-ScheduledTask -TaskName "era-server"
Get-ScheduledTask -TaskName "era-server" | Get-ScheduledTaskInfo
.\server\scripts\unregister-autostart.ps1
```

> 비-기본 `ERA_SERVER_*` 값(토큰 등)은 스케줄러가 `.env`를 못 읽으므로 **사용자 환경변수**로
> 등록해야 작업에도 적용된다(§3 참고). 등록 스크립트가 `.env` 발견 시 이 안내를 출력한다.

---

## 6. 검증 체크리스트 (집 PC에서 처음 실행 시)

개발 PC에서 **헤드리스로 검증 완료**된 것(서버 스위트 전체 통과): 세션 코어 이식(S1),
WS 전송 1:1 프레이밍·프레임 코덱, 실게임 replay 출력·저장 해시 등가, S2 소켓 드롭→재접속 resume /
grace 만료 fresh, S3 정적 서빙+traversal 차단+WS 공존. 회귀 회로:

```powershell
node --test server/*-test.mjs      # 전체 통과 확인(집 PC 최초 셋업 시 1회 권장)
```

개발 PC에서 **미검증(집에서 실제로 확인해야 할 것)**:
- [ ] **실브라우저 렌더** — PC 브라우저 `http://127.0.0.1:8787/` 에서 타이틀 렌더 + 입력 반응.
      (개발 환경에 브라우저가 없어 이 스모크만 보류됨 = plan t5.)
- [ ] **폰 접속** — 터널 https URL(+토큰)로 폰에서 타이틀 렌더 + 선택지 탭 동작.
- [ ] **새로고침 resume** — 폰에서 입력 대기 상태로 두고 새로고침/앱 전환 후 복귀 →
      타이틀 재시작이 아니라 **같은 프롬프트로 이어짐**(S2 grace, 기본 30s).
- [ ] **세이브 지속** — SHOP 자동세이브 발생 후 `server-data\`에 `save*.sav` 생성 확인,
      호스트 재시작 후에도 새 세션이 그 세이브를 로드.
- [ ] **재부팅 자가복구** — 작업 등록 후 재부팅 → 로그온하면 자동 상주.
- [ ] **장시간 RSS** — 오래 플레이하며 프로세스 RSS 추이 관찰(누수 여부).

---

## 서버 코드 업데이트

서버 기본 엔진 `tools/web-engine-probe/dist/engine-legacy.mjs`는 Git에 포함된다. 업데이트할 때는
소스만 pull하고 기존 프로세스를 계속 쓰면 안 된다. 실행 중 VM과 이미 import된 엔진은 자동으로
교체되지 않는다. 서버 PC의 저장소 루트에서 다음 두 줄을 실행한다.

```powershell
git pull --ff-only origin server
.\server\scripts\apply-server-update.ps1
```

`apply-server-update.ps1`는 서버가 실제 읽는 추적 엔진으로 `npm test`를 실행하고, 통과할 때만
기본 예약 작업 `era-server`를 정지·재시작한다. 다른 작업 이름을 등록했다면 다음처럼 지정한다.

```powershell
.\server\scripts\apply-server-update.ps1 -TaskName "era-home"
```

수동으로 `node server/run.mjs`를 실행 중이면 스크립트가 임의로 Node 프로세스를 종료하지 않는다.
테스트 성공 안내 후 기존 서버 콘솔에서 `Ctrl+C`로 완전히 종료하고 `node server/run.mjs`를 다시
실행한다. 마지막으로 기존 PC/폰 브라우저를 새로고침하여 새 WS 세션을 만든다.

`npm test`는 서버가 실제로 읽는 추적 엔진 산출물로 TRAIN 상태 초기화 회귀까지 검사한다.

---

## 7. 미결 / 다음

- **wss 세부**: Tailscale Serve vs Cloudflare Tunnel 최종 택1(둘 다 문서화됨). 도메인 유무로 결정.
- **`.env` 자동 로딩** 미구현: 현재는 환경변수 수동 등록 필요(§3). 무의존 로더 추가 검토.
- **세션 TTL 30s** 고정값 — 폰 백그라운드 복귀 패턴 보고 튜닝.
- 실브라우저/폰 검증 항목(§6)은 집 PC 도착 후 채운다.
