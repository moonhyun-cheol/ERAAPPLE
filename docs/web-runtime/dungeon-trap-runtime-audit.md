# 던전 함정 진입 런타임 전수 점검

점검일: 2026-09-17  
대상: `server` 브랜치의 eraJS 서버 엔진과 PWA worker, 게임 `에라마왕 개조판 1.28`

## 결론

던전 함정 화면의 오류는 한 항목이 아니었다.

1. `DUNGEON_INFO2.ERB:261`의 `WAITANYKEY`가 eraJS의 미구현 stub이라 주의문 경로에서 즉시 예외가 났다.
2. `DUNGEON_INFO2.ERB:309`가 선택 여부를 `SELECT_FLAG:0`, `:2`, `:2`로 검사해 B열(`:1`)만 선택하면 “대상 미선택”으로 잘못 판정했다. 실제 A/B/C 재현에서 수정 전 wait가 1회가 아니라 2회 발생해 확인했으며, 두 번째 `:2`를 `:1`로 고쳤다.
3. 캐릭터 정보의 `BARSTR`과 같은 `String.repeat` 범위 결함이 `BAR/BARL`, statement형 `BARSTR`, `PRINT_PALAM`에도 있었다.
4. eraJS의 미구현 명령 25개와 게임의 273 ERB/1 ERH를 교차 검사한 결과, 이 게임이 직접 명령 위치에서 참조하는 stub은 `WAITANYKEY` 1곳, `FORCEWAIT` 5곳, `ADDVOIDCHARA` 1곳뿐이었다. 나머지 22개는 추측 구현하지 않았다.

## 실제 진입·재현 경로

- `ERB/SHOP.ERB:102-103`: `RESULT == 102` → `CALL DUNGEON_INFO2`
- `ERB/DUNGEON_INFO2.ERB:12`: `REDRAW 0`
- 같은 파일 `:17-487`: `WHILE RESULT != 999` 입력 루프
- `:255-264`: `DIALOGUE:1 < 0`이면 `WAITANYKEY` → 대화 상태 초기화 → `CLEARLINE` → `CONTINUE`
- `:270-307`: 111/112/113 등으로 층·A/B/C 비트 선택
- `:308-323`: 60..88 함정 번호를 선택된 `FLAG:300..329`에 기록
- `:489`: `REDRAW 1` 후 호출자 복귀

실제 게임 소스를 전부 컴파일한 하네스가 다음 순서를 실행한다.

`60(미선택 경고) → 111 → 60(A/1층) → 111 → 112 → 61(B/1층) → 112 → 113 → 62(C/1층) → 999`

검증 결과는 의도한 경고 wait 1회, `FLAG:300=60`, `FLAG:310=61`, `FLAG:320=62`, 호출자 복귀였다.

## 점검 결과와 수정

| 계열 | 실제 근거 | 판정·수정 | 회귀 |
|---|---|---|---|
| `WAITANYKEY` | `DUNGEON_INFO2.ERB:261` | `vm.printer.wait(true)`에 연결 | 실제 던전 주의문 wait 후 계속 진행 |
| 함정 선택 비트 | `DUNGEON_INFO2.ERB:309` | B열 누락(`:2` 중복)을 `:1`로 수정 | A/B/C 각각 설치, 불필요한 경고 없음 |
| `FORCEWAIT` | `CAMPAIGN_EVENT:173`, `DUNGEON:60`, `DUNGEON_BATLLE2:1037`, `EVENT_AUTOTRAIN:38`, `SYSTEM:519` | 기존 forced wait 경로로 연결 | wait 발생 후 실행 재개 |
| `ADDVOIDCHARA` | `CHAR_MAKE.ERB:2123`에서 빈 캐릭터 생성 후 필드 작성 | 모든 캐릭터 변수를 0/빈 문자열로 가진 template-less 캐릭터 추가 | `CHARANUM` 증가 및 `NO` 쓰기 확인 |
| method `BARSTR` | `CHARA_INFO.ERB:127`; 초과 HP가 음수 repeat 생성 | 길이와 채움 칸을 안전 범위로 제한, `max<=0`은 빈 바 | 초과/음수/0 max/정상 비율 |
| `BAR/BARL` | 게임 43/7곳; 동일한 미클램프 구현 | 동일 범위 제한 | 초과/음수/0 max |
| statement `BARSTR` | 현재 게임의 명령형 호출은 0곳이나 동일 구현 결함이 확인됨 | 동일 범위 제한 | `RESULTS`의 8칸 바 확인 |
| `PRINT_PALAM` | `TRAIN_MAIN.ERB:103`; `SYSTEM_SOURCE.ERB:2180,2215`가 `DOWN`을 차감해 음수가 될 수 있음 | 각 10칸 분기의 채움 수를 0..10으로 제한 | 음수 PALAM 출력 확인 |
| 문자열 `*` | eraJS `expr/binary.js`도 `repeat` 사용 | 게임의 10개 호출은 모두 양의 상수 18이므로 **수정 안 함** | 정적 교차 검사 |
| 나머지 notImpl 22개 | 게임 명령 위치 참조 없음 | **수정 안 함** | 정적 교차 검사 |
| 점프/분기/입력 | 함수의 `WHILE`, `CONTINUE`, `FOR/REPEAT`, 비트 연산, `INPUT`, `CLEARLINE`, `CALL`을 실제 흐름으로 통과 | 추가 결함 없음. 기존 `JUMP`/`REDRAW 0` 오버레이 유지 | 실제 함수 종료·호출자 복귀 확인 |

런타임 수정은 `tools/web-engine-probe/compat-fix-plugin.mjs`, 집중 회귀는 `tools/web-engine-probe/waitanykey-barstr-test.mjs`에 있다. upstream eraJS checkout은 수정하지 않으며 모든 overlay는 소스 SHA-256과 정확한 치환 개수를 검사한다.

## 빌드·검증

- 서버 엔진: `node tools/web-engine-probe/build.mjs` 성공
- 집중 회귀: `waitanykey-barstr-test.mjs` + `compat-fix-test.mjs` **14/14 통과**
- 서버 세션/replay: `engine-session-test.mjs` + `game-replay-test.mjs` **4/4 통과**
  - 실게임 330파일, 입력 25회, 이벤트 173개
  - 출력 SHA-256 `be26704c679c35e7b967c1878a1f1dbe144430e8359409af7765a1652d51c191`
  - 저장 SHA-256 `d0ec056d040d200ed0808420052752a01483a2bae8fd1df56e5623e8e3a8b06e`
- PWA: `build-pwa.mjs`로 worker와 두 게임 자산 재패키징
  - 최종 검증 릴리스: `51c555978574f3c124ca`
- PWA 서비스워커/오프라인 Chromium 회귀 통과
- 에라마왕 1.28 PWA 타이틀·입력 대기 smoke: Chromium/WebKit 모두 통과, 페이지 오류와 외부 요청 0
- **실제 PWA 던전 흐름: Chromium/WebKit 각각 1/1 통과** (`pwa-dungeon-trap-test.mjs`)
  - 모바일 크기(390×844)의 새 브라우저 컨텍스트에서 패키징된 게임/worker를 그대로 실행. 게임 함수 교체·재고 주입 없이 새 게임을 시작한다.
  - `107(상점) → 998(함정 상점) → 60/61/62 각 1개 구매 → 999 → 102(던전)`을 실제 UI로 진행한다.
  - 소유한 함정 60을 미선택 상태에서 입력해 `WAITANYKEY`를 재현하고 계속 버튼으로 재개한다.
  - 111/112/113 선택 후 각각 60/61/62를 설치한다. 각 열의 실제 표시를 검사하므로 구매 목록의 함정 이름만으로 통과하지 않는다. B열의 잘못된 추가 경고가 없고 999로 메인 메뉴에 복귀함을 확인한다.
  - 페이지 오류 0. 실제 iPhone 기기 검증은 아님.

### 브라우저 재현 하네스의 실패와 보정

- 최초 하네스는 `CHAR_MAKE.ERB:2292-2300`의 확인 화면에서 `[1] 달랐던 생각이 든다`를 반복 선택해 캐릭터 재생성 루프에 머물렀다. 입력 추적으로 확인한 뒤 `[2] 확실히 그렇다`를 선택하도록 고쳤다. 게임/엔진 변경은 하지 않았다.
- 새 게임은 함정 재고가 없어 60 입력이 무시됐다. `DUNGEON_INFO2.ERB:308`의 `ITEM:RESULT` 조건에 맞춰 실제 상점 구매를 선행하도록 고쳤다.
- 열 표시의 폭 맞춤 공백을 정규화하되 열 번호와 함정 이름을 함께 검사한다.
- 마지막 보정은 테스트에만 적용했으며, 앞서 재빌드·검증한 서버/PWA 런타임 소스와 산출물은 그대로 유지했다.

재실행 (저장 데이터는 임시 브라우저 컨텍스트에만 존재):

```powershell
node --test tools/web-engine-probe/pwa-dungeon-trap-test.mjs
$env:PROBE_BROWSER_ENGINE='webkit'
node --test tools/web-engine-probe/pwa-dungeon-trap-test.mjs
Remove-Item Env:PROBE_BROWSER_ENGINE
```

## 별도 미해결 테스트

이번 호환성 변경과 직접 관계없는 얇은 클라이언트 DOM 하네스 두 개는 전체 회귀 게이트로 사용할 수 없었다.

| 테스트 | 현재 결과 | 이번 던전 수정에 미치는 영향 | 후속 조치 |
|---|---|---|---|
| `server/thin-client-shop-test.mjs` | 170초 timeout | 실제 엔진·브라우저 던전 경로의 성공을 뒤집지는 않지만, 서버 얇은 클라이언트 전체 회귀 통과를 주장할 수 없음 | 별도 작업에서 대기 지점과 열린 handle을 추적해 하네스 자체 또는 전송 종료 조건을 수정 |
| `server/transport-race-test.mjs` | 하네스 `El`에 브라우저 API `contains()`가 없어 `TypeError`; 임시 shim 적용 뒤에도 170초 timeout | 적대적 전송·재전송 경로는 미검증으로 남으며, 던전 명령 호환성의 합격 근거로 사용하지 않음 | DOM shim을 실제 클라이언트 요구 API와 동기화한 뒤 timeout을 단계별 assertion으로 분해 |

해당 임시 shim 변경은 되돌렸고, 위 실패를 던전/엔진 수정의 통과 근거로 사용하지 않았다. 서버 엔진 의미는 실제 던전 하네스와 S1 replay로, PWA 산출물은 오프라인 회귀와 Chromium/WebKit의 실제 구매·던전 설치 흐름으로 검증했다. 따라서 이번 판정은 **던전 함정 호환성 및 패키징 회귀 통과**이며, **서버 WS/DOM 전체 회귀 통과는 아님**을 명시한다.

## 워킹트리 범위

이 변경 세트는 던전 함정 호환성 수정, 집중·브라우저 회귀, 재빌드된 PWA 산출물과 검증 결과를 포함한다. 기존 untracked `server/dom-load-test.mjs`는 이번 수정 대상에서 제외하고 그대로 보존했으며, 운영 배포는 별도 절차로 수행한다.
