# 웹 출력부 성능 최적화

> 이 문서는 출력 최적화 당시의 기록이다. 현재 릴리스·저장 메모리·종료 직전 진단은 [자동저장 최적화 보고서](save-memory-optimization.md)를 따른다. 아래 성능 비교는 당시 측정이며 이후 회귀가 생성한 개별 결과 JSON의 수치와 다를 수 있다.

## 적용 범위와 상태

- 당시 로컬 PWA 릴리스: **`5305e463323ab05d18c1`**. 현재 산출물의 릴리스는 위 후속 보고서를 따른다.
- 원본 ERB/CSV, 벤더 엔진, 게임 규칙, 세이브 형식/DB는 변경하지 않았다. 이번 변경은 웹 UI의 출력 생성·삭제·스크롤 비용에 집중했다.
- 기존 128개 출력 배치/단일 ACK 대기, gzip NDJSON 스트림 로딩, 입력 요청 ID와 제한시간 처리는 유지했다. 기록 상한도 **2,000줄 그대로**다.
- 공개 서버 배포, commit/push, 실제 iPhone 측정은 수행하지 않았다. 로컬 빌드만으로 기존 휴대폰 설치본이 바뀌지는 않는다.

## 변경 사항

`tools/web-engine-probe/browser.mjs`:

1. **일반 문장의 중복 span 제거**: 엔진이 이미 합친 단일 문자열 줄은 div 안의 텍스트로 직접 표시하고 색상·굵기·기울임·밑줄·취소선은 줄에 적용한다. 혼합 스타일과 버튼은 기존 개별 요소를 유지한다. HTML로 해석하지 않고 `textContent`를 사용한다.
2. **임시 출력 사전 정리**: 같은 배치 안에서 CLEARLINE으로 지워질 출력은 DOM을 만들기 전에 제거한다. 이전 배치까지 지우는 경우와 배치 끝에서의 2,000줄 제한은 기존 의미를 유지한다.
3. **삭제 시 버튼 검색 제거**: 버튼이 있는 줄만 WeakMap으로 추적한다. 매번 줄 아래의 모든 버튼을 검색하지 않고 현재 선택지 집합에서 제거한다. 지워진 줄을 이 인덱스가 계속 붙잡지 않는다.
4. **자동 스크롤 계산 축소**: 출력 배치마다 화면 위치를 읽는 대신 스크롤/viewport 변경에서 추적 상태를 갱신한다. 한 프레임에 최신 출력 이동을 하나만 예약한다. 입력창 높이는 ResizeObserver에서 관리하고 값이 같으면 CSS를 다시 쓰지 않는다.
5. **기존 조작 유지**: 이전 출력을 읽는 동안 배경 출력이 강제로 아래로 끌어내리지 않는다. 최신 출력 버튼과 명시적 입력은 다시 최신 위치를 따른다. 세션 재시작은 새 출력을 따른다.

## 측정 조건

`render-performance-test.mjs`가 실제 번들 `dist/browser.js`를 로컬 서버로 제공한다. Worker만 모의 객체로 대체하여 엔진 컴파일/실행·네트워크·저장 비용을 제외하고 **UI 출력 처리만** 측정한다.

- Windows, Chromium/Edge `152.0.4191.66`, Playwright WebKit `26.0`.
- 390×844 모바일 viewport; 물리 iPhone이나 구형 iOS 성능을 대신하지 않는다.
- 입력 대기 상태 한 번을 거친 뒤, 128줄 × 80배치 = **10,240줄**. 배치마다 별도 MessageChannel 작업을 사용한다.
- 엔진의 기본 흰색 문자열, 8줄마다 혼합 강조, 32줄마다 선택 버튼. 문자열 내용을 전후 동일하게 유지했다.
- 1회 예열 후 3회 기록의 중앙값. 마지막 두 animation frame까지 기다려 최종 레이아웃/스크롤을 포함한 경과 시간도 별도 기록한다.
- 함수 처리 시간은 이벤트 핸들러의 동기 실행 시간 합이다. FPS, 전체 CPU 사용률, 게임의 하루 전환 시간, 브라우저 전체 메모리를 뜻하지 않는다.

| 지표 | Chromium 이전 → 이후 | WebKit 이전 → 이후 |
| --- | ---: | ---: |
| 출력 핸들러 누적 시간 | 237.8 → 101.6 ms (약 57.3% 감소) | 156 → 122 ms (약 21.8% 감소) |
| 배치 핸들러 p95 | 4.5 → 1.9 ms | 3 → 3 ms |
| UI 시험 전체 경과 시간 | 432.2 → 315.7 ms | 2,305 → 2,373 ms |
| MAIN 위치 읽기 | 80 → 18회 | 80 → 14회 |
| 입력창 위치/높이 읽기 | 104 → 18회 | 157 → 14회 |
| 출력 중 생성한 요소 | 23,360 → 14,400개 | 동일 |
| 2,000줄에 남은 요소 | 4,562 → 2,812개 | 동일 |
| 오래된 줄 삭제 시 버튼 검색 | 8,240 → 0회 | 동일 |

**생성·유지 요소 약 38.4% 감소는 DOM 구조 지표이며 전체 메모리 절감률이 아니다.** 위치 읽기 횟수 역시 모든 레이아웃 계산 횟수가 아니다.

**WebKit의 전체 시간 개선은 확인되지 않았다.** 이전 기록 범위 2,272~2,501 ms, 이후 2,328~2,380 ms이며 중앙값은 약 3% 증가했다. 핸들러 비용과 요소 수 감소를 근거로 아이폰 체감 속도나 전체 렌더링이 그 비율만큼 빨라졌다고 주장하지 않는다. 이전 Chromium 전체 범위는 415.7~449 ms, 이후 315.5~348.4 ms다.

추가 임시 출력 시험에서는 64개의 버튼 줄이 각각 즉시 지워지는 128개 이벤트를 처리할 때 **생성 요소 0개**를 확인했다. 이것은 위 시간 벤치마크와 별도 기능/구조 검사다.

### 보존된 측정 결과

`tools/web-engine-probe/results/`:

- `render-baseline-chromium.json`, `render-baseline-webkit.json`
- `render-optimized-chromium.json`, `render-optimized-webkit.json`

기준선 번들 SHA-256: `3a6aa75afc4e40298c418b3991f3404e7098c2ef6eed86b63f3def41a8c25dae`.
최적화 번들 SHA-256: `c92095ec4cb3810005706d2bdde0ef2009206e177bd485ea3b056e8720c621e4`.
후자는 PWA의 `browser.js` 해시와 같다. 기준선은 수정 전 번들로 측정한 보존 결과다. 현재 코드를 `baseline`이라는 라벨로 실행한다고 이전 구현이 되는 것은 아니므로 기준선 파일을 덮어쓰지 않는다.

## 회귀 검증

모든 게임·저장 시험은 격리 브라우저 저장소에서 수행했다. 사용자 저장을 읽거나 지우지 않았다.

- **출력 시험 2건**: Chromium/WebKit 모두 통과. 색상·굵기·기울임·밑줄/취소선·정렬·문자 그대로 표시, 활성 버튼/이전 선택지 비활성화, CLEARLINE 배치 안/배치 간/초과 삭제, 60×128개 시드 고정 이벤트의 참조 모델 대조, 2,000줄 상한 및 스크롤 동작.
- **실제 Worker 입력 시험 6건**: 입력 게이트 4건과 두 브라우저 통합 2건. 제한시간 선택/만료, 한글, 잘못된 숫자, 중복/지연 입력, WAIT 통과. 전송 중 배치 최고 1개, 종료 시 0개.
- **실제 게임 날짜 시험 2건**: 두 브라우저에서 1→13일째, 자동저장 90~99 순환, 재로드 후 복원하고 14일째 진입. 실제 식사 거부 분기의 직접 선택 및 시간 만료 후 게임 복귀도 통과.
- **Chromium 회귀 묶음 10건**: 브라우저 저장/재로드, 실제 게임 백업/취소/손상 보호/탭 잠금, 모바일 계속 버튼·회전·축소 viewport, PWA 해시/설치/실패 업데이트 보호/대기 업데이트/캐시 복구/오프라인, 미리보기 서버 경계 통과.
- **WebKit 회귀 묶음 4건**: 백업 코덱/IndexedDB, 모바일 화면, 서버를 실제 종료한 뒤 오프라인 실제 게임 복원·추가 입력·저장 통과.
- 기본 시험의 원본 무결성 검사 대상으로 1,151개 파일을 유지한다. 집계: `017cbaf8e24440301e71e395bfc8f49189fccab6948c72b517b330898815a37d`.

별도 [안정성 수정 보고서](runtime-stability.md)의 **WebKit `setOffline(true)` 재로드 내부 오류와 엔진 큰 정수 결함은 이번 최적화로 해결했다고 하지 않는다.** WebKit의 이번 오프라인 검사는 서버 종료 방식이며, 실패했던 토글 검사를 대체 통과 처리하지 않는다. iPhone OS 강제 종료, 모든 장기 저장/날짜 이벤트, 실제 키보드·백그라운드 조합도 인증하지 않는다.

## 재현

프로젝트 루트에서 실행한다. Edge 대신 설치된 Playwright Chromium을 쓸 때는 `PROBE_BROWSER_CHANNEL`을 설정하지 않는다. 벤치마크 도중 다른 브라우저 시험을 병렬 실행하지 않는다.

```powershell
npm --prefix tools/web-engine-probe run build:pwa
$env:PROBE_BROWSER_CHANNEL='msedge'
$env:PROBE_PERF_LABEL='optimized'
npm --prefix tools/web-engine-probe run test:render
npm --prefix tools/web-engine-probe test
npm --prefix tools/web-engine-probe run test:runtime
npm --prefix tools/web-engine-probe run test:days
$env:PROBE_BROWSER_ENGINE='chromium'
npm --prefix tools/web-engine-probe run test:pwa
npm --prefix tools/web-engine-probe run test:pwa-game
npm --prefix tools/web-engine-probe run test:backup
npm --prefix tools/web-engine-probe run test:mobile-wait
$env:PROBE_BROWSER_ENGINE='webkit'
$env:PROBE_OFFLINE_MODE='server-stop'
npm --prefix tools/web-engine-probe run test:pwa-game
npm --prefix tools/web-engine-probe run test:backup
npm --prefix tools/web-engine-probe run test:mobile-wait
Remove-Item Env:PROBE_PERF_LABEL, Env:PROBE_BROWSER_CHANNEL, Env:PROBE_BROWSER_ENGINE, Env:PROBE_OFFLINE_MODE
```

`test:render`는 불안정한 시간 임계값 대신 결정적인 생성 요소 수·유지 요소 수·버튼 검색 횟수를 검사하고 원시 시간 표본을 기록한다. 실제 엔진 검증은 별도 `test:runtime`/`test:days`가 맡는다.

## 기존 설치본 적용

승인된 기존 HTTPS 주소에 수정된 `pwa-dist/` 전체를 배포한 뒤, 게임 저장·백업 → 오프라인 준비/업데이트 확인 → 모든 실행기 탭/홈 화면 창 닫기 → 다시 열기 순으로 적용한다. 현재 릴리스 ID는 위 `5305e463323ab05d18c1`이다. 저장 보존을 위해 사이트 데이터를 삭제하지 않는다. 이번 작업에는 공개 배포가 포함되지 않는다.
