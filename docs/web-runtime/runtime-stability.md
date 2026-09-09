# 제한시간 입력 · 날짜 전환 안정성 수정

> 후속 작업: [웹 출력부 성능 최적화](render-optimization.md) → [자동저장 메모리·로컬 진단](save-memory-optimization.md). 현재 로컬 PWA 릴리스는 `5356ae826c56bb47a372`이며, 아래 `ef1d2afbc40328818435` 결과는 초기 안정성 수정본의 기록이다.

## 판정

- 첨부의 `Timed input is not supported by this probe host`는 게임 파일 손상이 아니라 **웹 Worker 호스트가 TINPUT에서 의도적으로 예외를 던지던 미지원 처리**였다. 이를 제거하고 제한시간 입력을 지원했다.
- 해당 경로는 `ERB/TORIKO_MODE/TORIKOMODE.erb`의 `FEED_IN_TRAIN_TORIKOMODE`, `TINPUT 3000, 100, 1`이다. 3초 안에 선택하면 그 값을 전달하고, 만료되면 `null`을 전달하여 엔진이 원본 기본값 `100`을 사용한다. 원본의 시간제한이나 게임 규칙을 바꾸지 않았다.
- **날짜 전환만의 예외나 iPhone OS 강제 종료 원인은 확정하지 못했다.** 실제 게임에서 여러 날짜와 자동저장·복구를 검사하고 출력 처리 부담을 줄였다. 이를 모든 날짜 이벤트/장기 세이브의 오류 해결 또는 iPhone 메모리 문제 완치로 해석하면 안 된다.
- 로컬 검증본 릴리스: `ef1d2afbc40328818435`. `tools/web-engine-probe/pwa-dist/`에 재빌드했다. 이번 작업에서 공개 호스팅 업로드/커밋/push/실기기 검증은 하지 않았다. 과거 배포 및 사용자 실기기 보고와 이번 수정본의 검증 범위를 구분한다.

## 구현

| 파일 | 변경 |
| --- | --- |
| `tools/web-engine-probe/input-gate.mjs` | 입력 요청 ID, 제한시간 타이머, 지연 클릭/중복/이전 요청 거부, 전면 복귀 시 만료 확인. 타이머와 클릭 경합도 한 번만 진행 |
| `tools/web-engine-probe/engine-worker.mjs` | INPUT/WAIT/TINPUT 공통 대기 프로토콜. 출력 최대 128개씩 전송하고 UI의 해당 배치 완료 ACK를 기다린 뒤 진행. 한 번에 한 배치만 전송 중이므로 출력 메시지가 무제한 쌓이지 않음 |
| `tools/web-engine-probe/browser.mjs` | 제한시간 안내와 카운트다운, 현재 선택지 집합만 활성화/해제, 이벤트 위임. DocumentFragment 배치 삽입과 배치당 한 번의 추적용 레이아웃 읽기. 기존 2,000줄 상한 유지 |
| `tools/web-engine-probe/serve.mjs` | 개발 서버 게임 번들도 PWA와 동일한 gzip NDJSON으로 제공. Worker가 기대하는 스트림 포맷과 일치시킴 |
| `tools/web-engine-probe/package.json` | 기본 테스트에 입력 게이트 회귀 등록. `test:runtime`, `test:days` 추가 |

기존 gzip NDJSON 스트림 로딩은 유지한다. 날짜 출력 중에도 전체 소스를 다시 적재하지 않는다. 출력 처리 진행 시 실행 감시 시간을 갱신하되, 아무 출력/진행 신호 없이 오래 멈춘 실행을 막는 60초 감시는 유지한다. 화면 출력 기록은 세이브가 아니므로 2,000줄 이전 기록은 제거된다.

세이브 DB 이름/스키마와 엔진 저장 형식은 바꾸지 않았다. 일반 게임의 슬롯+GLOBAL 다중 파일 저장을 하나의 원자적 트랜잭션으로 변경한 것은 아니다. 원본 ERB/CSV와 엔진 클론을 고치지 않았다.

## 검증

실제 브라우저 시험은 **새로운 격리 컨텍스트**에서 수행했다. 사용자 저장을 읽거나 지우지 않는다.

| 시험 | 결과/한계 |
| --- | --- |
| 입력 게이트 단위 시험 | 유효한 숫자/문자, 잘못된 입력, 중복·이전 요청, 클릭/타이머 경합, 0초·긴 시간, 취소, 전면 복귀 시 만료 및 원본 기본값 확인 |
| Chromium/Windows WebKit 출력·입력 | 2,400줄 fixture, CLEARLINE, DOM 2,000줄 상한, 한글 TINPUTS, 선택·시간 만료·이전 메시지·WAIT 통과. 출력 전송 중 배치 최고 1개, 종료 시 0개. 최초 측정 23배치, 추적용 MAIN 레이아웃 읽기 약 20~22회. 총 레이아웃 비용/FPS/실기기 메모리 측정이 아님 |
| 실제 식사 거부 경로 | Chromium/WebKit 모두 원본 게임의 해당 TINPUT에 도달, `[2]` 직접 입력 및 무입력 만료 후 플레이 가능한 메뉴로 복귀. 거부 판정은 원본 난수에 따르므로 동일 시험용 저장으로 재시도 가능 |
| 실제 날짜 전환 | Chromium/WebKit 모두 1일째부터 휴식 24회로 13일째 진입. 낮→밤, 밤→다음 날 증가 확인. 자동저장 90~99 순환 후 마지막 슬롯을 페이지 재로드로 불러와 같은 날짜·캐릭터 복원, 추가 휴식 후 14일째 진입 |
| Node 별도 날짜 조사 | 16일째까지 진행. 브라우저/물리 기기 시험을 대체하지 않음 |
| 기존 회귀 | 한국어 저장·재로드, 저장 실패를 성공으로 알리지 않음, 백업 취소/손상/롤백/탭 잠금, 미리보기 서버 경계, 모바일 계속 버튼·레이아웃 통과 |
| Chromium PWA | 자산 해시, 손상 설치/업데이트 보호, 업데이트 대기/활성화, 누락 복구, 오프라인 실제 게임 저장·복원·추가 진행 통과 |
| WebKit PWA 서버 종료 방식 | 서버를 실제 종료하고 요청 실패 확인 후 오프라인 실제 게임 저장·복원·추가 진행 통과 |
| WebKit PWA 오프라인 토글 방식 | `context.setOffline(true)` 이후 `page.reload: WebKit encountered an internal error` 재현. **이 경로는 실패로 남는다.** 서버 종료 방식 성공으로 전체 WebKit PWA 통과를 주장하지 않음 |
| 원본 무결성 | 기록된 1,151개 파일의 바이트별 기준 대조 통과. 집계 `017cbaf8e24440301e71e395bfc8f49189fccab6948c72b517b330898815a37d` 유지 |

초기 안정성 수정 산출물(`ef1d2afbc40328818435`) 재검사 결과:

- 기본/입력 게이트 11건, Chromium·WebKit 런타임 6건, 실제 날짜·식사 거부 2건 통과.
- Chromium 브라우저·실제 게임·PWA·백업·미리보기 서버·모바일 UI 묶음 10건 통과.
- WebKit 서버 종료 방식 실제 게임 PWA·백업·모바일 UI 묶음 4건 통과.
- 위 실행 건수에는 공통 단위 시험의 중복 실행이 포함된다. 별도 WebKit 오프라인 토글 실패는 해결된 것으로 집계하지 않는다.

기존 `KNOWN DEFECT: INPUT rounds ...` 테스트의 성공은 엔진 큰 정수 결함을 재현했다는 뜻이며 수정한 것이 아니다. UI/입력 게이트는 안전 정수 범위 밖 직접 입력을 거부한다. 실기기 OS 종료, 장기 플레이의 모든 분기, 많은 캐릭터/대형 저장, 실제 가상 키보드·백그라운드 조합은 인증하지 않는다.

기계 판독 결과: `tools/web-engine-probe/results/runtime-{chromium,webkit}.json`, `day-{chromium,webkit}.json`, `day-reproduction.json`, `pwa-chromium.json`, `pwa-game-chromium-browser-offline.json`, `pwa-game-webkit-server-stop.json`, `backup-unit-*.json`. 날짜 조사 중 실패가 발생하면 `day-*-failure.json`에 별도 기록하며 과거 진단 파일의 존재만으로 최신 실패를 판단하지 않는다.

## 재현 명령

프로젝트 루트, Node 및 Playwright 브라우저 설치 후 실행한다. 아래 두 `test:runtime`/`test:days` 명령은 각각 Chromium과 WebKit을 모두 검사한다. Edge 미설치 환경은 `PROBE_BROWSER_CHANNEL`을 지정하지 않고 Playwright Chromium을 설치한다.

```powershell
npm --prefix tools/web-engine-probe run build:pwa
$env:PROBE_BROWSER_CHANNEL='msedge'
npm --prefix tools/web-engine-probe test
npm --prefix tools/web-engine-probe run test:runtime
npm --prefix tools/web-engine-probe run test:days
npm --prefix tools/web-engine-probe run test:browser
npm --prefix tools/web-engine-probe run test:game-browser
npm --prefix tools/web-engine-probe run test:backup
npm --prefix tools/web-engine-probe run test:server
npm --prefix tools/web-engine-probe run test:pwa
npm --prefix tools/web-engine-probe run test:pwa-game
npm --prefix tools/web-engine-probe run test:mobile-wait
$env:PROBE_BROWSER_ENGINE='webkit'
$env:PROBE_OFFLINE_MODE='server-stop'
npm --prefix tools/web-engine-probe run test:pwa-game
npm --prefix tools/web-engine-probe run test:backup
Remove-Item Env:PROBE_BROWSER_ENGINE, Env:PROBE_OFFLINE_MODE, Env:PROBE_BROWSER_CHANNEL
```

`test:pwa`의 WebKit 오프라인 토글 실패를 별도로 재현하려면 `PROBE_BROWSER_ENGINE='webkit'`, `PROBE_OFFLINE_MODE='browser-offline'`으로 실행한다. 후속 저장 최적화 검증부터 `test:pwa`도 `PROBE_OFFLINE_MODE='server-stop'`을 지원한다. 이는 토글 실패를 고친 것이 아니라 별도 서버 종료 경로이며 결과는 `pwa-webkit-server-stop.json`에 기록한다.

## 기존 설치본에 적용

수정된 `pwa-dist/` 전체가 **기존과 같은 승인된 HTTPS 주소**에 배포된 뒤에만 아래로 업데이트할 수 있다. 로컬 재빌드만으로 휴대폰 설치본이 바뀌지는 않는다.

1. 게임 저장을 완료하고 가능하면 [세이브 파일 백업](save-backup.md)을 만든다.
2. 온라인에서 `iPhone 설치 · 오프라인 안내` → `오프라인 준비 / 업데이트 확인`을 누른다.
3. 업데이트 준비 후 같은 앱의 Safari 탭과 홈 화면 창을 모두 닫고 다시 연다.
4. `오프라인 준비됨` 옆 릴리스가 [최신 저장 최적화 보고서](save-memory-optimization.md)의 수정본 ID인지 확인한다.
5. 사이트 데이터를 지우거나 새 주소로 옮겨서 해결하려 하지 않는다. 기존 저장은 게임의 불러오기에서 연다. 마지막 저장 이후의 미저장 진행은 복구하지 않는다.
