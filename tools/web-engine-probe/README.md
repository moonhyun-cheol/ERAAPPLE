# 웹 엔진 검증 도구 (제품 실행기 아님)

[판정 및 후보 비교](../../docs/web-runtime/engine-evaluation.md) · [제한시간 입력·날짜 전환 안정성 수정](../../docs/web-runtime/runtime-stability.md) · [최신 자동저장 메모리·진단 보고서](../../docs/web-runtime/save-memory-optimization.md)

## 최종 저장 최적화 회귀

현재 로컬 검증 릴리스는 `5356ae826c56bb47a372`다. `test:release`가 빌드부터 저장/진단·날짜·Chromium/WebKit·백업·PWA 회귀와 프로파일을 순차 실행하고 전후 원본/상류/자산 해시를 대조한다. 공개 업로드는 하지 않는다. 최근 19단계/42개 시험 결과는 `results/save-memory-release-verification.json`에 기록했다. 실행기 제한시간은 수 분 이상 확보한다.

```powershell
$env:PROBE_BROWSER_CHANNEL='msedge' # Playwright Chromium 설치 환경이면 생략
npm --prefix tools/web-engine-probe run test:release
npm --prefix tools/web-engine-probe run verify:release
Remove-Item Env:PROBE_BROWSER_CHANNEL
```

WebKit PWA는 서버 종료 방식(`pwa-webkit-server-stop.json`)으로 검증한다. 기존 자동화 오프라인 토글 내부 오류와 iPhone 홈 화면 종료 문제를 해결 인증한 것은 아니다. `verify:release`는 무결성 검사만 수행하며 전체 회귀를 대신하지 않는다.

## iPhone 시험용 정적 PWA

`npm --prefix tools/web-engine-probe run build:pwa`로 `pwa-dist/`를 생성한다. 실제 게임을 gzip NDJSON으로 압축한 약 11.2MiB의 **시험 산출물**이며 압축 해제 후 텍스트는 약 61MiB다. 이번 안정성 수정본은 로컬 재빌드·검증 범위이며 기존 임시 주소의 최신 배포/가동 여부는 보장하지 않는다. [HTTPS 배포 조건·iPhone 설치 순서·검증 결과](../../docs/web-runtime/iphone-testing.md)를 먼저 읽는다.

```powershell
npm --prefix tools/web-engine-probe run build:pwa
$env:PROBE_BROWSER_CHANNEL='msedge'
npm --prefix tools/web-engine-probe run test:pwa
npm --prefix tools/web-engine-probe run test:pwa-game
npm --prefix tools/web-engine-probe run test:runtime
npm --prefix tools/web-engine-probe run test:days
Remove-Item Env:PROBE_BROWSER_CHANNEL
```

`serve:pwa`는 하위 경로 loopback 미리보기일 뿐 iPhone에서 접근 가능한 호스팅이 아니다. Node/npm은 제작·시험 때 필요하며, HTTPS 배포 후 게임 실행 연산은 브라우저에서 한다.

원본 게임 파일을 수정하지 않는 Node 조사 도구와 격리된 브라우저 시험 도구다. 독립 ERB fixture와 실제 게임 Worker 경로를 분리한다. 실제 게임은 IndexedDB에 저장하며 웹판 전용 압축 파일 백업·복원을 지원한다. [백업 사용법·검증·제한](../../docs/web-runtime/save-backup.md)을 참고한다. 자동 시험은 loopback을 사용하고 외부 공개는 별도 승인을 받는다.

## M1 재생·수명별 메모리 기준선

`m1-harness-test.mjs`는 이벤트와 소비 입력을 순서대로 canonical SHA-256에 넣고, BigInt·Map·세이브 바이트를 손실 없이 비교한다. `m1-baseline.mjs`는 서로 격리된 Node 프로세스 두 개에서 현재 게임을 같은 seed/입력으로 16일까지 실행해 재생·선택 상태·전체 저장 엔트리 해시가 같은지 확인한다. 소스 로드, 컴파일, VM 시작, 1/4/16일, 종료 뒤에 자연 상태와 강제 GC 상태를 별도 기록한다. `m1-ownership-profile.mjs`는 같은 post-reset 상태에서 함수 코드, static scope, 런타임 값, CSV/template, header를 각각 독립 프로세스에서 참조 해제해 강제-GC 차이를 기록한다. `vm-structure.mjs`는 LOCAL getter를 실행하지 않고 객체 종류와 실제 할당 배열 slot을 센다.

```powershell
npm --prefix tools/web-engine-probe run test:m1-harness
npm --prefix tools/web-engine-probe run profile:m1
npm --prefix tools/web-engine-probe run profile:m1-ownership
```

결과는 `results/scalable-runtime-baseline.json`과 `results/m1-ownership-profile.json`에 기록된다. 소유권별 차이는 교차 참조 때문에 중첩될 수 있어 합산하지 않는다. 이 수치는 Node `process.memoryUsage()`의 이산 표본이며 정확한 retained-size, 실제 피크, 브라우저 전체 메모리, iPhone 한계가 아니다. 현재 고정 경로의 결정성·구조 개선 우선순위 기준선일 뿐 중형/대형 게임 호환이나 4일차 실기기 종료 해결을 인증하지 않는다.

### Compact function metadata 및 paged storage prototypes

`compact-function-ir.mjs`와 fingerprint-checked build plugin은 단계별 격리 bundle을 만든다. 첫 조각은 PRINT statement의 불변 `Set` 플래그를 numeric bitmask로 바꾸고, `compact-label-map.mjs`는 `Thunk`의 빈/단일 label을 필드로 유지하다 다중 label에서 native `Map`으로 spill한다. `compact-lazy-slice.mjs`의 세 번째 조각은 `Lazy` 네 필드를 raw와 parser-or-cache 두 필드로 줄이며, 네 번째 조각은 `Slice`의 from/to를 일반 범위에서 한 숫자로 pack하고 특이 범위는 배열로 fallback한다. `paged-default-array.mjs`의 다섯 번째 조각은 LOCAL/LOCALS 외 기본 배열을 Array-compatible Proxy와 256-slot page로 표현해 0/빈 문자열 page를 만들지 않는다. 여섯 번째 조각은 `Thunk` statement 컨테이너를 0개=`null`, 1개=직접 statement, 다수=`Array`로 저장한다. 일곱 번째 조각은 `PrintForm`의 직접 `Lazy` wrapper를 없애고 최초 실행 전 `null`, 실행 뒤 parsed `Form`을 같은 `arg` 필드에 저장한다. 여덟 번째 조각은 함수 static scope를 최초 진입 때 생성하되 명시 `VAR@FUNCTION` 대상과 reset 중 활성 context는 미리 준비한다. 아홉 번째 Assign 실험은 실행 전 `undefined inner` own-property만 생략한다. 기본 `engine.mjs`와 브라우저 릴리스에는 적용하지 않는다. 최신 실험 산출물은 `dist/engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs`다.

```powershell
npm --prefix tools/web-engine-probe run build
npm --prefix tools/web-engine-probe run test:m1-harness
npm --prefix tools/web-engine-probe run profile:compact-ir
npm --prefix tools/web-engine-probe run profile:compact-statements
npm --prefix tools/web-engine-probe run verify:compact-statements
npm --prefix tools/web-engine-probe run profile:statement-payloads
npm --prefix tools/web-engine-probe run profile:compact-printform
npm --prefix tools/web-engine-probe run verify:compact-printform
npm --prefix tools/web-engine-probe run profile:lazy-static
npm --prefix tools/web-engine-probe run verify:lazy-static
npm --prefix tools/web-engine-probe run profile:compact-assign
npm --prefix tools/web-engine-probe run verify:compact-assign
```

현재 게임의 Thunk 330,665개 중 빈 71,241개와 단일 statement 122,104개는 별도 statement Array를 제거할 수 있었다. 컴파일 전용 격리 표본은 paged prototype 대비 **22.704MiB**, 전체 1/4/16일 재생의 16일 표본은 **25.871MiB**를 추가 절감해 statement-vector prototype이 **315.373MiB**였다. 이어진 payload census에서 전체 statement 639,954개 중 `PrintForm`이 306,841개(47.9%)이고 모두 직접 `Lazy`를 하나씩 보유함을 확인했다. 이 wrapper 제거 뒤 함수 static scope까지 지연 생성한 기준 prototype은 reset scope를 16,463개에서 69개로 줄였고 16일에는 297개만 생성했다. PrintForm 기준 대비 16일 **29.359MiB**를 추가 절감해 **274.301MiB**였다. Assign 109,513개의 실행 전 빈 `inner` slot을 생략한 후속 실험은 컴파일 **0.837MiB**, 16일 **0.794MiB**만 절감해 최신 표본이 **273.495MiB**였다. 의미 상태와 전체 save hash는 일치했지만 효과가 작아 제품 승격 후보로 확대하지 않는다. 원자료는 `results/statement-payload-profile.json`, `results/compact-printform-payload-profile.json`, `results/lazy-static-scope-profile.json`, `results/lazy-static-scope-acceptance.json`, `results/compact-assign-payload-profile.json`, `results/compact-assign-payload-acceptance.json`이다. 이는 다른 statement 객체나 expression tree를 bytecode로 바꾼 결과가 아니며, 다른 ERA corpus·브라우저·iPhone 검증 전 제품 엔진에는 승격하지 않는다.

## 재현

프로젝트 루트 기준. Node 22 이상(`--test-timeout` 지원 버전), npm, git이 필요하다. 고정 커밋의 release JavaScript를 재번들하며 upstream TypeScript 전체 빌드는 하지 않는다.

클론이 없는 새 작업 환경에서만:

```powershell
git clone https://github.com/undercrow/eraJS.git .my_agent_remote/undercrow__eraJS
git -C .my_agent_remote/undercrow__eraJS checkout --detach fb487bceacd899a033db017ff0dff5bb3878d4a5
```

```powershell
npm --prefix tools/web-engine-probe ci
npm --prefix tools/web-engine-probe run build
npm --prefix tools/web-engine-probe test
npm --prefix tools/web-engine-probe run probe
```

브라우저 자동 시험 (이번 검증은 설치된 Edge 사용):

```powershell
$env:PROBE_BROWSER_CHANNEL='msedge'
npm --prefix tools/web-engine-probe run test:browser
npm --prefix tools/web-engine-probe run test:game-browser
Remove-Item Env:PROBE_BROWSER_CHANNEL
```

Edge 없는 환경은 Playwright Chromium 설치 후 기본 채널을 사용한다:

```powershell
Push-Location tools/web-engine-probe
npx playwright install chromium
npm run test:browser
Pop-Location
```

브라우저 시험은 임시 포트의 loopback 서버와 새 브라우저 컨텍스트를 생성하고 종료한다. 결과는 `results/browser.json`에 기록된다. 수동 fixture 확인은 `npm --prefix tools/web-engine-probe run serve` 후 출력된 로컬 주소에서 한다. 종료는 Ctrl+C. 이 서버는 iPhone용 HTTPS 호스팅이 아니며 휴대폰에서 접근할 수 없다.

## 결과를 읽는 법

- `results/probe.json`: 고정 엔진 커밋, Node 환경, 파일 인코딩, 실제 게임 입력 중단 위치, fixture 저장·큰 정수 결함, `p0Passed: false`.
- `results/browser.json`: 브라우저 버전과 독립 fixture의 페이지 재로드 복원, 외부 요청/오류 검사.
- `results/game-browser.json`: 실제 게임의 초기 설정 → 대표 입력 → 슬롯 저장 → 페이지 재로드 → 불러오기 결과. `actualGameSaveReloadPassed`가 최소 경로 판정이며 iPhone 검증은 아니다.
- `results/original-inventory.json`: 원본 경로·크기·SHA-256. `probe` 실행 전후 기준 1,151개와 집계가 일치해야 한다.
- `dist/build.json`: upstream 커밋과 브라우저 번들 SHA-256. `dist/` 및 `node_modules/`는 생성물이다.
- `pwa-dist/pwa-build.json`: 정적 릴리스 ID, 캐시 자산 해시, 원본 집계와 바이트 크기. `pwa-dist/`도 생성물이며 별도 배포 검토 대상이다.
- `results/pwa-chromium.json`: Edge의 하위 경로·캐시 설치 실패·업데이트 대기/실패·누락 복구·오프라인 fixture 시험.
- `results/pwa-game-chromium-browser-offline.json`, `results/pwa-game-webkit-server-stop.json`: 실제 게임 오프라인 재로드·이름/시간 복원·추가 진행·슬롯 1 저장. WebKit은 Windows 데스크톱이며 iPhone 인증이 아니다.
- `results/runtime-chromium.json`, `results/runtime-webkit.json`: 2,400줄 출력, DOM 상한, 배치 ACK, 시간제한 선택/기본값/늦은 입력 및 WAIT 회귀. 물리 iPhone 성능 측정은 아니다.
- `results/day-chromium.json`, `results/day-webkit.json`: 원본 실제 게임의 식사 거부 직접 선택/시간 만료, 1→13일, 자동저장 90~99 순환 및 재로드 후 14일 진입. 전체 날짜 이벤트의 호환성 보장은 아니다.
- **테스트 성공은 진단 재현 성공이다.** `KNOWN DEFECT` 테스트는 일부러 현재의 잘못된 큰 정수 동작을 확인한다. `probe` exit 0도 게임 호환 성공이 아닌 보고서 생성 성공이다.
- 실제 게임 Node probe는 저장 요청을 거절하는 빠른 진단 경로다. 실제 저장·로드 검증은 별도 `test:game-browser`가 Worker와 시험용 IndexedDB에서 수행한다.
- 원본 해시 불일치는 덮어쓰기·기준 갱신으로 숨기지 않는다. 현재 작업 폴더의 데이터셋이 바뀌었는지 조사한다.

## 범위 제한

정적 PWA와 실제 게임용 Worker 호스트, 웹판 세이브 파일 백업·복원을 시험 수준으로 구현했다. ZIP importer, 공통 다중 엔진 adapter, 게임 라이브러리, 제품 SaveService, 고정 HTTPS 호스팅은 없다. 백업 복원 전체는 원자적이지만 일반 게임 저장의 IndexedDB 파일별 commit은 슬롯+GLOBAL의 원자 저장을 보장하지 않는다. 임시 공개 접속은 사용자 승인을 받았으며, 상시/일반 배포 전에는 엔진·게임·세이브 권리 및 런타임 의존성 고지 검토가 필요하다.
