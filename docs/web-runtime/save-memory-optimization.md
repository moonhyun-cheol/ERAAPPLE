# 자동저장 메모리 최적화 · 종료 직전 로컬 진단

## 상태와 판정

- 최종 로컬 PWA 릴리스: **`788a65fe4ef13e28da14`**, 저장 overlay: `era-save-memory-v1`, 상주 메모리 overlay: `era-deferred-local-v1`.
- 산출물: `tools/web-engine-probe/pwa-dist/`. 게임·엔진·셸·SW 합계 11,701,650 bytes(빌드 보고서 자체 제외).
- 이전 릴리스 `5356ae826c56bb47a372`는 사용자 승인으로 commit `1aaa282` / [Actions 34299527211](https://github.com/moonhyun-cheol/ERAAPPLE/actions/runs/34299527211)에서 공개 배포했다. [배포 검증 기록](../../tools/web-engine-probe/results/save-memory-public-deployment.json)을 보존한다. **이번 LOCAL 지연 할당 수정본은 로컬 검증만 완료했고 아직 commit/push/공개 배포하지 않았다.**
- 사용자 보고 환경: iPhone 17 / iOS 26.6.1 / Safari 탭이 아닌 홈 화면 PWA. 이전 배포 안내 후 사용자가 **“한 4일차 가면 팅기네”**라고 재발을 보고했다. 해결 실패 관측으로 보존하며, 해당 기기에 실제 적용된 릴리스 ID와 직전 실행 진단은 아직 받지 못했다.
- 자동저장 직렬화 부담을 줄였지만 **iOS 메모리 종료/Jetsam 또는 WebKit 충돌로 원인을 확정하거나 해결을 인증한 것은 아니다.** `iPhoneTested: false`를 유지한다.

[기존 입력·날짜 안정화](runtime-stability.md) · [출력 최적화](render-optimization.md) · [세이브 백업](save-backup.md) · [HTTPS 배포](github-pages-deploy.md)

## 구현과 호환성 경계

| 파일 | 역할 |
| --- | --- |
| `compact-save.mjs` | 1·2·3차원 정수 배열의 뒤쪽 0만 생략한 prefix 생성. 중간 0/음수/큰 정수는 십진 문자열로 보존. 문자열 배열은 대상 아님 |
| `deferred-local.mjs` | 함수 LOCAL/LOCALS의 미사용 배열을 최초 접근까지 할당하지 않음. 실제 배열·cell 클래스·값·크기는 기존과 같음 |
| `save-build-plugin.mjs` | 고정 상류의 정수 cell에 선언 크기 `saveShape` 보관, SAVEDATA/SAVEGLOBAL의 정수 직렬화 대체, LOADDATA/LOADGLOBAL의 중간 BigInt 배열 복제 제거 |
| `build.mjs` | 상류 HEAD/작업 트리 검사, 기존 엔진과 최적화 엔진 동시 빌드. 상류 소스에 쓰지 않는 로컬 overlay |
| `runtime-trace.mjs` | 작은 localStorage 진단 journal과 UI ACK/1.5초 fail-open bridge |
| `engine-worker.mjs`, `browser.mjs` | 직렬화 전 기록 요청, IndexedDB 기록 전/commit 후 기록, 재실행 시 직전 단계 표시 |
| `verify-release.mjs` | 1,151개 원본 기준 대조, 배포 파일 전체/자산 해시, SW 재생성 비교, dist/PWA 일치, 상류 commit/청결 검사 |
| `release-regression.mjs` | 최종 빌드→순차 회귀→측정→무결성 재검사. 단계 exit code/로그·결과 SHA/소스·산출물 SHA를 하나의 보고서에 기록 |

위 경로는 `tools/web-engine-probe/` 기준이다.

저장 형식은 기존 **중첩 배열 + 십진 문자열 JSON**이다. `saveShape`는 런타임 cell의 정보이며 새 저장 JSON 필드를 추가한 것이 아니다. 동일 게임 선언으로 cell을 만든 뒤 기존 reset이 먼저 0으로 초기화하고 prefix를 덮어쓰므로, 생략한 꼬리는 0이 된다. 런타임에서 선언 크기를 넘어 확장된 차원은 마지막 0도 길이 정보일 수 있어 자르지 않는다. 저장 중 원래 배열을 변경하지 않는다.

상류는 eraJS `fb487bceacd899a033db017ff0dff5bb3878d4a5`로 고정했다. overlay 대상 8개 소스의 SHA-256과 치환 개수를 검사하며 불일치 시 빌드 실패한다. 줄바꿈 CRLF/LF만 정규화한다. 다른 엔진 버전에 무조건 적용하면 안 된다. 비교 빌드는 원본 엔진(`engine-legacy.mjs`), 저장만 최적화(`engine-save-only.mjs`), 저장+LOCAL 최적화(`engine.mjs`)로 분리한다.

호환 시험은 다음을 확인했다.

- 기존 작성→기존/최적화 읽기, 최적화 작성→기존/최적화 읽기 네 조합.
- 안전 정수 밖 값, 64비트 경계, 정수 배열 1·2·3차원, 내부 0, 확장된 leaf 길이, 문자열·한글·이모지, 캐릭터 변수.
- 같은 VM을 더러운 값으로 채운 후 다시 LOADGLOBAL/LOADDATA해도 생략한 꼬리가 0으로 초기화됨.
- gzip 백업 코덱 유지, 저장 중 게임 상태 무변경, 저장 실패/비동기 거절이 성공으로 표시되지 않음.
- 이번 fixture 저장 크기: 기존 8,573,761 bytes → 최적화 2,914 bytes. 실행 시각/난수 필드 때문에 재실행 값이 수 bytes 달라질 수 있으므로 이전 인수인계 숫자를 고정 합격 기준으로 쓰지 않는다.

**호환 범위는 고정 eraJS의 웹판 세이브다.** PC Emuera 저장 호환, 게임의 선언 크기 변경/다른 버전 마이그레이션, 엔진 INPUT의 기존 큰 정수 반올림 결함 해결을 뜻하지 않는다. 슬롯과 GLOBAL은 여전히 파일별 트랜잭션이며 두 파일 전체를 원자적으로 저장하지 않는다.

## 메모리 측정

`save-memory-profile.mjs`: Windows Node v24.15.0, 실제 게임 첫 상점/캐릭터 1명, 기존/최적화 각각 별도 Node 프로세스. 워밍업 1회 제외 후 같은 SAVEDATA 명령 3회 측정. 원본에 파일을 추가하지 않고 메모리상의 조사 명령만 사용한다.

| 항목 | 기존 | 최적화 |
| --- | ---: | ---: |
| 저장 JSON | 41,175,595 bytes | 43,852 bytes |
| 직렬화 경과 시간 | 437.5~444.2 ms | 16.2~21.8 ms |
| 명령 전→저장 함수 진입의 힙 증가 | 162.28~162.31 MiB | 약 3.43 MiB |
| 명령 직전 힙 | 약 675.9 MiB | 약 558.3 MiB |

JSON 크기는 약 99.89%, 측정 지점 힙 증가분은 약 97.88% 줄었다. **전체 게임 메모리가 그 비율로 줄었다는 뜻이 아니다.** 이번 측정의 최적화 엔진에는 LOCAL 지연 할당도 포함한다. 첫 저장 전에도 약 558MiB의 힙이 남으며 iOS가 메모리 부족으로 앱을 종료할 가능성이 있다.

정확한 순간 최고 RSS, 브라우저/IndexedDB 복제·GC 비용, iPhone 실측, 장기 진행/다수 캐릭터·조밀한 대형 배열 저장을 측정한 것이 아니다. 배열이 대부분 비영(0이 아닌 값)이면 절감 효과가 작다. 원본 수치: [save-memory-profile.json](../../tools/web-engine-probe/results/save-memory-profile.json).

## 4일차 재발 후 상주 메모리 완화

상류 `VM.reset()`은 모든 함수에 LOCAL/LOCALS cell과 기본 배열을 생성한다. 실제 게임은 32,924개 cell의 배열에 18,054,810개 원소를 미리 보관했다. `deferred-local.mjs`는 LOCAL/LOCALS에 한해서 배열의 최초 접근까지 할당을 지연한다. Proxy·희소 배열·정수 형변환은 쓰지 않는다. 최초 접근 이후는 기존 실제 Array이며 setter로 배열을 교체하는 동작도 보존한다. `#LOCALSIZE`, `#LOCALSSIZE`, 함수별 값 지속, 재귀, scoped access, get/set/rangeSet/reset, 런타임 확장 길이를 시험했다. 사용한 배열을 강제로 해제하거나 자동저장을 끄지 않는다.

`deferred-local-profile.mjs`는 저장 최적화만 적용한 엔진과 LOCAL까지 최적화한 엔진을 별도 Node 프로세스에서 같은 seed·입력으로 비교한다. 새 게임/캐릭터 2명/휴식 경로, 각 지점 강제 GC 후 측정이다.

| 지점 | 저장만 최적화 | LOCAL도 최적화 |
| --- | ---: | ---: |
| 1일차 힙 | 677.95 MiB | 557.11 MiB |
| 4일차 힙 | 679.23 MiB | 558.61 MiB |
| 16일차 힙 | 680.17 MiB | 559.54 MiB |

4일차 힙 약 120.6MiB(17.8%)를 줄였다. 해당 경로에서 실제 할당된 LOCAL/LOCALS 배열은 66개다. 1/4/16일차에 보관된 모든 세이브의 SHA-256이 비교 엔진과 같았다. 원본 결과: [deferred-local-profile.json](../../tools/web-engine-probe/results/deferred-local-profile.json). **사용자 세이브 재현, 브라우저 순간 최고 메모리, iPhone 실측 또는 종료 해결 인증이 아니다.** 다양한 함수를 계속 쓰면 지연했던 배열이 할당되므로 절감량이 달라진다.

## 진단 기록을 읽는 법

실행 정보에 `직전 실행` / `현재 실행`을 표시한다. journal 키는 `era-runtime-trace-v1:game`이며 독립 fixture는 별도 키를 쓴다. 게임 세이브 내용은 넣지 않고 단계·시각·최근 저장 파일명만 로컬에 기록한다. 외부 전송하지 않는다.

| 직전 기록 | 해석 |
| --- | --- |
| 로딩 / 컴파일, 게임 처리 중, 입력 대기 | 마지막으로 UI에서 관측한 실행 단계 |
| 저장 데이터 생성 중 | 직렬화 직전에 기록을 시도했음. 직렬화 중 종료의 후보 증거지만 원인 확정 아님 |
| 저장소 기록 중 | IndexedDB 기록 시작 전 단계. 마지막 슬롯 저장 성공 보장 아님 |
| 저장 완료 | 해당 파일의 transaction 완료 후 UI가 관측한 기록. 슬롯+GLOBAL 일괄 성공이나 영구 보존 보장 아님 |
| 사용자/실행기 중지, 게임 종료, 실행 오류 | 관측된 명시적 종료 경로. OS 종료가 이 값을 남긴다고 가정하지 않음 |

Worker는 UI가 기록을 **시도**하고 ACK를 보낸 뒤 직렬화한다. localStorage 실패는 게임 저장을 막지 않으며, ACK가 없어도 1.5초 뒤 진행한다. 따라서 journal 누락/지연·진단 불가 상태가 있을 수 있고 충돌 탐지기/크래시 덤프는 아니다. 새 실행을 시작하면 기록이 갱신되므로 재발 시 **게임 시작을 다시 누르기 전에 직전 실행을 캡처**하는 것이 좋다.

## 최종 회귀 결과

2026-09-09 02:18~02:22 UTC, 동일 릴리스에서 **21개 실행 단계 완료, 테스트 45개 통과**. 빌드 2단계와 프로파일 2단계는 테스트 개수에 넣지 않는다. Chromium은 설치된 Edge 채널, WebKit은 Windows Playwright 26.0이며 물리 iPhone이 아니다.

| 묶음 | 시험 수 | 범위 |
| --- | ---: | --- |
| 기본·입력 게이트·서버 | 14 | 원본/링크, 한국어 저장, 실패 전파, 입력 경합, 서버 경계. KNOWN DEFECT 재현도 포함 |
| LOCAL 지연 할당 | 3 | 최초 할당·배열 교체·크기 오류·fingerprint·실제 cell 메서드·재귀·reset 의미 보존 |
| 저장 호환·진단 | 9 | 네 엔진 조합, ACK 순서, 직렬화 시 강제 Worker 중단, 이전 저장 복원, journal 실패 시 실제 IndexedDB 저장 |
| 런타임 / 출력 | 2 / 2 | Chromium/WebKit 입력·출력 ACK·DOM 상한 및 렌더 의미 |
| 실제 날짜 | 2 | 양쪽 모두 휴식 24회로 1→13일, 자동저장 90~99 순환, 재로드 후 같은 날짜/캐릭터 복원→추가 휴식 후 14일 |
| 독립 브라우저 fixture | 1 | 실제 Worker 한국어 입력·저장·복원 |
| 백업 | 4 | 양쪽 손상/취소/원자 복원 등 |
| 실제 게임 온라인 | 2 | 양쪽 초기 설정·저장·재로드, 백업 파일 내려받기/복원 및 탭 잠금 |
| 모바일 계속 버튼 | 2 | 양쪽 터치 모사·WAIT 진행 |
| PWA 수명주기 | 2 | 손상 첫 설치/업데이트 보호, 대기/활성화, 캐시 누락 복구, 업데이트 후 저장 유지 |
| 실제 게임 오프라인 PWA | 2 | 재로드·복원·추가 입력·추가 슬롯 저장 |

- Chromium PWA는 `browser-offline`, WebKit PWA는 **`server-stop`**으로 명시했다. WebKit 수명주기 시험에서는 같은 포트의 HTTP 서버를 닫고 요청 실패를 검증한 뒤 필요 시 다시 연다. 실제 게임 PWA는 별도 서버 프로세스를 종료한다.
- 기존 WebKit `context.setOffline(true)` 후 reload 내부 오류는 해결로 간주하지 않는다. 이번 전체 회귀에 그 실패 경로를 통과로 포함하지 않았다. `pwa-webkit-server-stop.json`과 과거 `pwa-webkit.json`을 구분한다.
- 이 날짜 경로는 장기 회귀의 대표 경로이지 모든 이벤트/수백 일/대형 세이브/OS 프로세스 재시작 검증이 아니다. 새 브라우저 컨텍스트만 사용했고 사용자의 세이브는 읽거나 수정하지 않았다.
- 이전 저장 최적화 시험에서 기본 Playwright Chromium 부재를 겪었으므로 이번 실행은 처음부터 설치된 `msedge` 채널을 지정했다.
- 전체 실행은 약 214초였다. 호출 도구는 180초 timeout을 표시했지만 모든 자식 단계 exit 0과 최종 보고서를 남겼다. 별도 Acceptance에서 **21개 exit code·45 tests·모든 로그/결과 SHA·현재 릴리스/소스 일치**를 검사한다. timeout 표시만 성공 근거로 삼지 않는다. 최신 재검증 기록은 [deferred-local-final-acceptance.json](../../tools/web-engine-probe/results/deferred-local-final-acceptance.json)이며 이전 `save-memory-final-acceptance.json`은 구 릴리스 기록이다.

최종 보고서: [save-memory-release-verification.json](../../tools/web-engine-probe/results/save-memory-release-verification.json). 단계별 로그 위치/해시, 결과 파일 해시, 시험 시작·완료 시각, 소스/산출물 해시를 포함한다. 이전 개별 결과 파일의 존재만으로 최신 성공을 판단하지 않는다.

## 원본·산출물 무결성

- 기존 원본 기준 1,151개 경로·크기·SHA-256이 모두 일치했다. 별도 게임 `에라마왕 개조판 1.28`은 기존 inventory 제외 범위이며 이번 작업에서 건드리지 않았다.
- 배포 시 새로 추가된 `.gitattributes` 때문에 스캔이 1,152개로 늘어난 것을 확인했다. 기존 1,151개 변경/삭제는 없었으며 배포 도구 파일만 제외했다. 원본 기준 JSON을 다시 생성해 실패를 숨기지 않았다.
- 원본 집계: `017cbaf8e24440301e71e395bfc8f49189fccab6948c72b517b330898815a37d`.
- 고정 상류 tracked 파일 변경 없음. PWA 캐시 자산 10개 + SW/보고서의 파일 구성과 해시, SW 템플릿 재생성 결과, dist와 PWA 셸/Worker 일치를 확인했다.
- 보고서의 sources/artifacts를 회귀 전후 비교했다. 문서만 갱신한 뒤에는 기본 링크·원본 시험과 릴리스 무결성을 다시 검사한다. PWA 바이트는 바꾸지 않는다.

## 재현

Node 22 이상, 고정 상류 클론, npm 의존성, Playwright 브라우저 준비는 [도구 README](../../tools/web-engine-probe/README.md)를 따른다. 루트에서:

```powershell
# 설치된 Edge 사용. Playwright Chromium이 있으면 이 줄을 생략한다.
$env:PROBE_BROWSER_CHANNEL='msedge'
npm --prefix tools/web-engine-probe run test:release
npm --prefix tools/web-engine-probe run verify:release
Remove-Item Env:PROBE_BROWSER_CHANNEL
```

`test:release`는 자체적으로 최종 PWA를 재빌드한다. 대략 수 분이 필요하므로 외부 실행기의 제한시간은 충분히 확보한다. 순차로 실행하여 여러 실제 게임 VM의 메모리 경쟁을 피한다. 시작할 때 성공 요약을 false로 초기화하고, 어느 단계든 실패하면 최종 통과를 기록하지 않는다. `verify:release`는 현재 무결성 검사이지 전체 브라우저 시험의 대체물이 아니다. 원본 기준 파일을 재생성해 실패를 숨기지 않는다.

## 남은 배포·실기기 관문

1. 구 릴리스는 사용자 승인으로 [기존 Pages 주소](https://moonhyun-cheol.github.io/ERAAPPLE/)에 게시했다. 이번 `788a65fe4ef13e28da14` 수정본은 아직 공개하지 않았다. 배포는 검증된 산출물만 선별하며 원본/상류/대량 untracked 파일을 통째로 commit하거나 reset/clean하지 않는다.
2. 승인 후 가능하면 기존과 같은 HTTPS origin/scope에 배포한다. 먼저 기존 홈 화면 앱에서 세이브를 파일로 백업한다. 새 주소로 바꾸면 기존 IndexedDB가 보이지 않을 수 있다.
3. 새 수정본이 실제 배포된 후 홈 화면 앱에서 온라인 업데이트 확인→같은 앱의 모든 창/탭 닫기→재실행→`오프라인 준비됨 · 788a65fe4ef13e28da14` 확인. 사이트 데이터 삭제를 복구 수단으로 쓰지 않는다.
4. iPhone 17 / iOS 26.6.1 홈 화면 앱에서 기존 저장으로 낮→밤→다음 날을 반복하고 자동저장 후 닫기/복원, 비행기 모드 추가 진행을 확인한다. Safari 탭 성공을 홈 화면 성공으로 대체하지 않는다.
5. 재발하면 시작 전 `직전 실행`, 최근 저장 파일/단계/시각, 게임 날짜, 배포 릴리스, 백그라운드 여부를 남긴다. 실기기 결과가 확인되기 전에는 iPhone 종료 해결 완료로 처리하지 않는다.
