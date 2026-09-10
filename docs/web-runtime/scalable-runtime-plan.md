# 대형 ERA 게임용 iPhone 웹 런타임 프로젝트 계획

상태: **계획 v1 + M1 기준선·소유권 분해·compact metadata·shape-aware hybrid paged storage·compact statement/payload·lazy static scope·Assign slot 격리 판정 + 결합 overlay를 런타임 워커로 승격(Chromium/WebKit 실게임 날짜 전환·저장·복원 동작 검증) — 구 워커 벽시계 대조·엔진 선정·iPhone 실기기 인증 전**

[문서 지도](README.md) · [기존 아키텍처](architecture.md) · [계약](contracts.md) · [현재 안정화 결과](save-memory-optimization.md) · [M1 첫 기준선](m1-baseline.md)

## 1. 목표와 이번 범위

단일 게임에서 발생한 4일차 종료를 임시로 피하는 수준을 넘어, 더 큰 ERA 게임을 iPhone 홈 화면 PWA에서 실행할 수 있는 메모리 효율적 런타임을 만든다. 사용자가 현재 게임을 ERA 게임 중 가벼운 편이라고 알려 주었다. 이를 **대형 게임을 초기 시험군에 포함해야 한다는 요구**로 채택하되, 게임 간 무게 순위나 메모리 배율을 검증된 사실로 취급하지 않는다.

- 최우선: 실행 의미와 기존 세이브 보존, 상주/피크 메모리 축소, 종료 후 마지막 정상 저장 복구.
- 지원 단위: 모든 ERA가 아니라 **게임 revision × 호환 프로필 × 엔진 빌드 × 기기/OS** 조합.
- 플랫폼: iPhone 홈 화면 PWA 우선, Safari 탭과 PC Chromium/WebKit 보조. 서버 상시 실행 없이 오프라인 플레이.
- 확장: 여러 게임 ZIP 가져오기와 게임별 저장 격리. 동시에 실행하는 VM은 하나.
- M1 구현으로 동일 입력 재생 해시, 수명별 Node 메모리 기준선, 독립 프로세스 소유권 ablation과 getter-safe 구조 census를 추가했다. 현재 게임 post-reset 기준 함수 코드 그래프 424.042MiB, 런타임 값 그룹 116.248MiB가 우선 대상으로 측정됐다. 두 값은 중첩 가능하므로 합산하지 않는다. 게임 콘텐츠 수정, 엔진 교체, commit/push/공개 배포는 수행하지 않았다.
- compact code representation 실험은 PRINT `Set` bitmask, 빈/단일 label map, 두 필드 `Lazy`, packed-range `Slice`의 네 단계별 bundle로 확장됐다. 다섯 번째 결합형 prototype의 paged storage는 1D dense backing, 최내차원 이하 page, leaf별 75% sparse-allocation dense 승격과 page 직접 iterator를 구현했다. 여섯 번째 격리 조각은 `Thunk`의 statement 컨테이너를 0개=`null`, 1개=직접 객체, 다수=`Array`로 저장한다. 현재 게임 330,665개 Thunk 중 빈 71,241개와 단일 122,104개의 Array를 제거했고, paged prototype 대비 컴파일 heap 22.704MiB, 16일 heap 25.871MiB를 추가 절감했다. 새 prototype의 16일 forced-GC 단독 표본은 315.373MiB이며 replay/state/save hash가 일치했다. statement 객체와 expression tree 자체는 아직 그대로다. Chromium 실행 파일, 브라우저 heap, iPhone RSS는 미측정이므로 제품 bundle에는 승격하지 않는다.
- 후속 격리 조각은 `PrintForm`의 직접 Lazy wrapper를 제거하고 함수 static scope를 최초 진입까지 지연했다. 명시 `VAR@FUNCTION` 대상과 reset 중 활성 context는 미리 준비해 동기 변수 접근과 `RESETDATA` 의미를 유지한다. reset scope는 16,463개에서 69개, 16일에는 297개였고 최신 16일 forced-GC 표본은 **274.301MiB**였다. 의미 상태·전체 save hash는 기준과 일치했지만 다른 ERA corpus와 Chromium/WebKit/iPhone은 아직 검증하지 않았다.
- `Assign` 109,513개의 실행 전 `undefined inner` slot 생략은 16일 **0.794MiB**만 추가 절감해 실험 표본 **273.495MiB**였다. 의미·저장 hash는 일치했지만 1MiB 미만이라 inner statement/expression을 더 복잡하게 조밀화하지 않는다. 다음 측정 후보는 `If` payload다.
- 위 결합 overlay(paged storage + compact IR/label/lazy/slice/statement/printform/assign + lazy static scope)를 **런타임 워커 번들에만 승격**했다. `build.mjs`의 워커 엔트리(`engine-worker.js`)만 해당 스택을 쓰고, `browser.js` 저장 스토어는 기존 save-only 스택을 유지한다. 새 PWA 릴리스 `5bc104f8a08caa1cc0f3`, `engine-worker.js` sha256 `3dab3233…`. Chromium/WebKit 헤드리스에서 실게임을 시작→1~13일 전환→회전 자동저장 48회→리로드(복원 후 14일째)→식사 거부 두 분기까지 구동해 두 엔진 모두 `passed`, 동일 day 배열, `pageErrors: []`, 저장/복원 의미 일치를 확인했다(`results/day-chromium.json`, `results/day-webkit.json`). 시작+첫 입력 지연은 Chromium 약 4.5초, 리로드 약 4.4초(`results/startup-*.json`)로 승격 전 대비 시작 회귀 징후는 없었다. **한계:** `day-browser-test.mjs`의 240초 per-test 한도는 이 CPU 경합 샌드박스(총 271~319초, Chromium이 WebKit보다 느린 비정상 순서)에서 초과됐으나 이는 기능 실패가 아니라 벽시계 초과다. 구 워커 벽시계 대조와 iPhone 실기기 RSS는 미측정으로 남는다.
- 16일 라이브 힙 소유권 분해(`results/day16-ownership-profile.json`, forced-GC 287.496MiB)로 지배 소유자를 데이터로 확정했다: **IR 트리(`code`/`fnMap`)가 유일한 지배자**(reachable objects 2.88M, `_CompactSlice` 690k, `Thunk`/`Lazy`/`PrintForm` 30만대). global 값 스토어의 11.4M 논리 슬롯은 대부분 기본값이며 실제 물리 상주에서 지배적이지 않다. globalMap 생성자 census에서 `_Int1DValue`는 63개뿐이고 나머지 슬롯은 2D/3D(`_Int2DValue` 12, `_Int3DValue` 9)와 이미 paged인 중첩 배열에서 온다.
- 위 분해에 기반해 **전역 1D 정수 배열 희소화(`paged-default-array.mjs`의 opt-in `sparse1d`)를 시험했으나 라이브 힙 효과가 없음을 측정으로 확인했다**. sparse1d 변형(`engine-…-static-assign-sparse1d.mjs`, `saveOptimizationPlugin(engine,{pagedStorage:true,sparse1d:true})`)의 16일 forced-GC는 **287.599MiB**로 기준선 287.496MiB와 노이즈 범위 내 동일하고 storage.global(arrays 94,857·slots 11,426,198·nonDefaultSlots 2,586)도 불변이었다(`results/day16-ownership-profile-sparse1d.json`, `originalUnchanged:true`). 원인은 대상 질량 부재(global 1D 셀 63개)와 지배자가 IR 트리라는 점이다. sparse1d는 `test:paged` 34/34 통과·opt-in으로 무해하므로 코드는 보존하되 **profiling-only로 두고 워커에 승격하지 않는다**. 다음 실효 최적화는 전역 배열이 아니라 IR 트리(`code`/`fnMap`) 자체의 노드/`_CompactSlice`/`Thunk` 상주 축소로 재조준한다.
- **날짜 전환 피크(transient) 최초 정량화(`results/transition-peak-profile.json`, `transition-peak-profile.mjs`).** 상주 힙은 이미 절반이지만 iPhone Jetsam은 상주가 아니라 전환 순간의 순간 할당 스파이크로 앱을 종료한다. 기존 샘플러(m1/ownership)는 시점 스냅샷만 찍어 이 스파이크를 한 번도 측정하지 못했다. 입력 프롬프트 사이 구간마다 모든 yield 이벤트에서 natural 힙 고수위를 추적하고 새 날짜마다 forced-GC 상주 플로어를 찍어 `transient = segmentPeak − residentFloor`를 산출했다. 결과: 상주 플로어는 day2 이후 ~279MiB로 안정적이나 **정상 날짜 전환마다 transient ~127–137MiB가 얹혀 heapUsed 피크 ~408–416MiB, RSS 피크 ~879MiB**에 달했고, **첫 전환(day1→2)은 일회성으로 transient 435MiB·heapUsed 703MiB·RSS 884MiB**까지 치솟았다(`originalUnchanged:true`). 원인 귀속: 각 전환 구간의 이벤트는 13개(`line` 5·`content` 7·`input` 1)로 출력량은 미미하고, **자동저장 쓰기 2회·최종 저장 67KiB**뿐이다. 자동저장이 없는 전환(day0→1, saveWrites 0)은 transient가 15MiB에 불과한 반면 자동저장 2회가 있는 전환은 130MiB+로 급증한다 → **지배 원인은 출력·이벤트 임시할당이 아니라 자동저장 직렬화 경로(`savedata.js`/`saveglobal.js`의 `saveData` 객체 전체 구성)가 만드는 대형 중간 구조**로 특정됐다. 최종 저장 바이트는 99.89% 줄었지만 직렬화 *과정*은 여전히 전체 VM 변수 스냅샷을 중간 배열/문자열로 물질화한다. 다음 실효 최적화는 IR 트리 상주 축소가 아니라 **저장 직렬화의 transient 축소(중간 saveData 객체를 만들지 않고 스트리밍/증분 직렬화, 또는 전환당 2회 쓰기 축소)**로 재조준한다. Node heapUsed는 실제 transient 압력의 하한이며 iPhone/WebKit RSS·GC-순간 피크가 아니다.
- **전환 transient의 진짜 원인을 격리 측정으로 정정하고 수정했다(`compact-save.mjs`+`paged-default-array.mjs`, `save-scan-microbench.mjs`, `results/save-scan-microbench.json`).** 위 bullet은 원인을 `saveData` 객체 전체 물질화로 추정했으나, 저장 출력이 68KiB뿐인데 transient가 130MiB인 격차는 *물질화*가 아니라 *스캔*을 가리켰다. `compactIntegers`는 각 정수 셀의 후행0 트림(`value[end-1]`)과 원소 접근(`value[i]`)을 paged **Proxy get 트랩**으로 수행하는데, dense-1d 전역 행(`GLOBAL`/A~Z/`FLAG`, 최대 11.4M 슬롯·99.98% 기본값)에서는 트랩마다 property-key 문자열을 할당해 대량 transient garbage를 만든다. 수정: dense-1d paged 루트일 때 Proxy 대신 원시 dense 백킹(`pagedDenseBacking`)을 직접 스캔한다(값·순서·트림 규칙 불변). 격리 측정(강제 GC, `--expose-gc`)에서 11.4M 슬롯 1회 직렬화의 gross transient 할당이 **262.65MiB → 0.78MiB(−261.9MiB), 149× 빠름**, 출력은 바이트 동일(100001 원소)이었다. `compact-save-test`는 새 paged↔plain 바이트 parity 테스트 포함 7/7 통과, `originalUnchanged:true`. **측정 도구 한계 정정:** full-game `transition-peak-profile`의 natural heapUsed 고수위 지표는 이 garbage를 포착하지 못한다(강제 GC 없음 + 비-Proxy 코드가 더 빨라 샘플 사이 GC가 덜 돌아 미수거 garbage가 되레 커짐). 따라서 이 최적화의 정당한 계측은 natural-heap transient가 아니라 gross 할당량이다. 남은 게이트: Chromium/WebKit 실게임 회귀(pageErrors 0·저장/복원 parity)와 iPhone 실기기 RSS는 미측정이므로 `engine-worker.js`의 제품 승격은 브라우저 회귀 통과 후에만 확정한다.
- **대형 게임 `에라마왕 개조판 1.28` 컴파일/로드 discovery(옵션 1, `eramaou128-compile-probe.mjs`, `results/eramaou128-compile.json`).** inventory가 의도적으로 제외하는 1.28 폴더(ERB 273·ERH 1·CSV 56, 원본 소스 9.72MB)를 별도 프로브로 현재 `dist/engine.mjs`에 태웠다. **인코딩은 329/330 파일이 UTF-8(-BOM)로 unresolved 0.** 컴파일을 막는 호환성 이슈는 **정확히 2건**으로 특정됐고, 둘 다 emuera는 허용하지만 eraJS가 거부하는 입력이었다: (1) `GAMEBASE.CSV`의 빈 `コード`/`バージョン` 값 → `parseInt('')`=NaN이 `csv/gamebase.js`의 `assert.number`에서 throw(emuera는 빈 값=0 허용). (2) 함수(`@`) 없이 파일 스코프 `#DIM`만 있는 ERB(예 `ARREST.ERB` 전역변수 선언) → `parser/erb.js`의 `parseFn`이 모든 파일을 `@`함수로 시작한다고 가정해 `Expected one of ('@')` parser error. eraJS는 전역 사용자 변수를 `.ERH`(header→globalMap)에서만 등록하는데 1.28은 emuera 방식대로 ERB 최상위 `#DIM`을 씀. bisect로 유일 offender가 `ARREST.ERB` 1개임을 확인했다. **두 이슈를 디스크 무변경 인메모리 discovery 심(빈 코드/버전→0, ERB 선두 `#` 속성줄→합성 ERH로 이관)으로 우회하자 게임이 컴파일(함수 2149개)되고 타이틀→NEW GAME→캐릭터 설정(FIRST_SETTING)→인트로 스토리(EVENTFIRST)까지 정상 재생됐다.** Node 측정: 컴파일 322–350ms, 컴파일 heap delta ~117MiB, 컴파일후 RSS ~283MiB, 인트로 진행 중 피크 RSS ~294MiB(`originalUnchanged` 유지, 프로브는 읽기 전용). **미완/게이트:** 두 심은 discovery 전용이며 아직 정식 fingerprint 오버레이(gamebase 파서 + parseERB/compile 헤더 이관)로 승격하지 않았다. Node 컴파일 성립이 곧 전체 플레이 호환·브라우저/iPhone 메모리 성립을 뜻하지는 않는다. 다음 단계: 두 심을 `compat-fix-plugin.mjs` 계열 오버레이로 구현(치환 개수·sha 검증) → 심 없는 순정 컴파일 재현 → Chromium/WebKit 실게임 회귀 → PWA 패키징(옵션 2).
- **1.28 호환 심을 정식 fingerprint 오버레이로 승격(옵션 A) + 심층 자동 진행 discovery(옵션 B).** discovery 심 2건을 `compat-fix-plugin.mjs`의 sha256+치환개수 검증 오버레이로 구현했다: (3) `csv/gamebase.js`의 빈 `コード`/`バージョン`→0(`transformGamebaseSource`), (4) `parser/erb.js`의 `parseERB`가 첫 `@` 이전 파일 스코프 `#` 속성줄을 전역으로 수집하고 `index.js`의 `compile`이 이를 header에 병합(`transformErbSource`+`transformIndexSource`, 검증된 ERH 등록 경로 재사용). **심 없이(`PROBE_SHIM` 미설정) 순정 오버레이만으로** 1.28이 컴파일(함수 2149)되고 타이틀→NEW GAME→캐릭터 설정까지 재생됨을 재현했다(`results/eramaou128-compile.json`, peakRss 291MiB). 옵션 B로 프로브에 자동 진행 모드(`PROBE_AUTO`)를 추가해 NEW GAME→캐릭터 확정 후 기본 입력을 반복 투입하자 **새 런타임 이슈 1건**이 드러났다: 캐릭터 랜덤 생성(`EVENTFIRST→RAND_CHARA_MAKE→SET_RANDOM_HAIRCOLOR`, `FUNC_CHARA_AND_HAIR.ERB:144`)의 `RAND(VARSIZE("ARR_HAIRCOLOR")-1)`가 **Division by zero**. 근본 원인은 `property/dim.js`가 `#DIM(S)` 초기값 리스트를 길이 0/1만 처리하고 **2개 이상이면 size 기반 분기로 떨어져 0D 스칼라**가 되어 `VARSIZE`가 1을 반환한 것(`VARIABLES.ERH`의 `#DIMS ARR_HAIRCOLOR="",...`(8원소)). emuera는 초기값 개수(또는 명시 크기와의 max)로 배열을 만든다. (5) `transformDimSource`로 초기값 2개 이상일 때 1D 배열을 초기값 개수/명시 크기 max로 생성하는 분기를 추가했다. 재빌드 후 자동 진행 **2000 입력·13007 이벤트를 오류 0(`ok:true`)으로 통과**, peakRss 321MiB. `compact-save-test` 7/7 parity 유지(dim 변경이 저장 코덱 무영향), `originalUnchanged:true`. **미완/게이트:** blind '0' 입력이 초기 설정 루프에 머물러 **실제 자동저장/날짜 전환은 미도달**(`savedataKeys` 비어 있음) — 1.28의 저장/전환 경로는 아직 미검증. dim.js 변경은 이미 승격된 메인 게임 워커의 동작에도 영향을 줄 수 있으므로 **메인 게임 Chromium/WebKit 실게임 회귀 재실행이 필수**(`t5`). 옵션 2(PWA 패키징, `local-game.bin` 교체)는 그 후.
- **1.28 저장 경로 실밟기(옵션 B 계속, `eramaou128-save-probe.mjs`, `results/eramaou128-save.json`).** 승격 워커 스택(compat + paged save-memory + compact IR + lazy-static + assign)으로 1.28을 태워 타이틀→NEW GAME→캐릭터 확정→인트로/튜토리얼→**상점 도달**까지 자동 주행하며 저장 경로를 실행했다. 이 과정에서 **엔진 레벨 결함 1건을 추가로 특정·수정**했다: (6) `scene.js`의 내장 자동저장 합성 문장 `new Slice(FILE, 0, "SAVEDATA 99 SAVEDATA_TEXT")`가 **두 가지 결함**을 동시에 가졌다 — (a) 인자 offset 누락(다른 모든 합성 씬 문장은 키워드 길이를 offset으로 넘김)으로 `SaveData` PARSER(`arg2R2`=`WS1` then args)가 키워드 `SAVEDATA`부터 파싱해 `Expected one of (' ', ...)` throw, (b) 실제 ERB는 쉼표 구분(`SAVEDATA 999, "..."`)인데 합성문은 공백 구분이라 쉼표 위치에서 재차 parser error. `transformSceneSource`(sha256+치환개수 검증)로 쉼표 삽입 + `"SAVEDATA".length` offset을 주입했다. 이 else-분기는 **`@SYSTEM_AUTOSAVE` 미정의 게임에서만** 실행되므로 메인 게임(정의함)은 이 죽은 분기를 밟지 않아 무영향, 1.28(미정의)은 첫 상점 자동저장에서 크래시했다. 수정 후 **상점 진입 시 내장 자동저장(`SAVEDATA 99`)이 1.28 전체 데이터셋에서 정상 실행**됨을 확인: `save99.sav` 8912 bytes 기록(`saved:true`, `ok:true`), peakRss 325MiB(자동저장 transient 포함, 295→325), 오류 0. 이 자동저장이 날짜 전환 자동저장과 동일한 전체 saveData 물질화 경로다. `compact-save-test` 7/7 parity 유지(핀 오버레이 fail-closed 포함), `originalUnchanged:true`, 빌드 핑거프린트 6개 전부 통과. **새 갭(미구현):** 상점의 수동 저장 메뉴(옵션 200)는 `BEGIN SAVEGAME`을 호출하는데 eraJS는 SAVEGAME/LOADGAME 내장 씬을 구현하지 않았다(구현 씬: TITLE/FIRST/SHOP/TRAIN/AFTERTRAIN/ABLUP/TURNEND/DATALOADED). 수동 저장·로드 UI가 필요하면 별도 씬 오버레이 구현이 필요하다. **게이트 유지:** scene.js 변경은 메인 게임 죽은 분기만 건드리지만 dim.js와 함께 워커를 재빌드했으므로 메인 게임 Chromium/WebKit 실게임 회귀 재실행(`t5`)은 여전히 필수. 1.28의 실제 날짜 전환(SHOP→TRAIN→TURNEND 루프) transient 실측과 iPhone RSS는 미측정.
- **메인 게임 회귀 재실행 완료(`t5` 해소, `results/game-browser-chromium.json`·`results/game-browser-webkit.json`).** dim.js(오버레이 5)+scene.js(오버레이 6)로 재빌드한 워커가 메인 게임(eratohoYM)에 무해함을 브라우저 회귀로 재확인했다. 서빙된 `dist/engine-worker.js`(mtime 04:56Z > compat-fix-plugin.mjs 04:39Z)에 scene 오버레이 리터럴 `"SAVEDATA 99, SAVEDATA_TEXT"`가 실재(깨진 원본 `"SAVEDATA 99 SAVEDATA_TEXT"`는 부재)하고 dim 오버레이 assert 문자열도 실재함을 빌드 산출물 직접 검사로 확인한 뒤, `game-browser-test.mjs`를 `PROBE_BROWSER_ENGINE`별로 각각 실행했다(`PROBE_ACTION_TIMEOUT=70000`으로 CPU 경합 샌드박스 벽시계 여유). **두 엔진 모두 pass 1/fail 0**: 타이틀→모드/난이도/추가기능→캐릭터 확정→턴엔드 자동저장(global.sav)→상점 수동저장(save00.sav)→리로드→로드 슬롯0 복원까지 22스텝, `pageErrors: []`, `externalRequests: []`, `actualGameSaveReloadPassed: true`, 백업 DB 삭제 후 복원·크로스탭 락·무효/취소 보존 통과, `originalUnchanged: true`(digest `9f8de2c774b4…`). 두 결과 JSON 모두 이번 런에서 신선 갱신. **한계:** 이는 메인 게임 무회귀 확인이며, 1.28 실제 날짜 전환(SHOP→TRAIN→TURNEND) transient 실측과 iPhone 실기기 RSS는 여전히 미측정.
- 제외: 게임 콘텐츠 완성, 전체 ERA 방언 무조건 호환, 네이티브 앱 배포, 클라우드 서버 전환, 임의 플러그인 실행. 필요하면 별도 프로젝트로 재승인한다.

## 2. 출발점과 미해결 문제

이번 계획 작성 시 현재 소스와 문서를 읽었다. 아래 수치는 기존 측정 보고서의 값이며 이번에 성능 시험을 재실행한 것은 아니다.

| 항목 | 기준과 한계 |
| --- | --- |
| 기존 공개 배포 기록 | `5356ae826c56bb47a372`, commit `1aaa282`, Actions `34299527211`. 사용자 기기에 실제 적용된 빌드는 아직 확인하지 못함 |
| 최신 로컬 후보 | `788a65fe4ef13e28da14`. 저장 prefix 최적화 + LOCAL/LOCALS 지연 할당, 아직 공개 배포 전 |
| 사용자 재발 | iPhone 17 / iOS 26.6.1 홈 화면 PWA에서 약 4일차 종료. 원인 및 해결 미확정 |
| 4일차 Node 힙 | 저장만 최적화 약 679.23MiB → LOCAL도 최적화 약 558.61MiB. 동일 seed/입력, 강제 GC 후 측정 |
| 현재 개선의 경계 | LOCAL/LOCALS 최초 접근 시 기존 Array를 만들며 이후 유지. 사용 함수가 늘면 추가 할당됨. 저장 최적화는 뒤쪽 0에 효과적이며 조밀한 값에는 효과 제한 |
| 기존 회귀 기록 | 최신 보고서 21단계/45개 시험. 13일 진행→복원→14일 경로 등. 대형 게임/사용자 세이브/실제 iPhone 인증 아님 |
| 숫자 호환성 | 저장의 큰 정수 보존과 숫자 INPUT의 기존 정밀도 결함은 별개. BigInt를 사용한다는 이유로 전체 정수 의미를 인증하지 않음 |

근거: [저장/상주 메모리 보고서](save-memory-optimization.md), [LOCAL 구현](../../tools/web-engine-probe/deferred-local.mjs), [빌드 overlay](../../tools/web-engine-probe/save-build-plugin.mjs), [과거 엔진 조사](engine-evaluation.md).

기존 4일차 실기기 작업은 해결 완료가 아니라 **M0 재현 및 M6 출시 관문으로 이관**한다. 사용자 세이브·릴리스·직전 진단 확보가 막혀도 합성 부하/엔진 비교는 진행할 수 있지만, 실제 증상 해결 판정은 막힌 상태로 유지한다.

## 3. 성공을 정의하는 방법

### 3.1 규모를 파일 크기 하나로 재지 않는다

시험군마다 다음을 별도 기록한다.

- 압축/해제 바이트, 파일·함수·명령 수, 파싱 후 IR/AST 크기.
- 정수/문자열 선언 용량, 실제 할당 용량, 비영 원소율과 접근 분포.
- 캐릭터 수, 캐릭터당 변수, 재귀 깊이, 함수 최초 접근 빈도.
- 저장 원문/압축 크기, 슬롯 수, 날짜당 이벤트·출력량.
- 시작·안정 실행·날짜 전환·저장/로드·백업/복원·게임 전환의 비용.

시험 코퍼스는 (A) 현재 게임, (B) 사용자가 합법적으로 보유한 중형 게임 1개, (C) 대형 게임 1개 이상, (D) 합성 스트레스 fixture로 구성한다. `에라마왕 개조판 1.28`은 편입 후보일 뿐 대형 대표로 확정하지 않는다. 실제 후보 선정 전에는 대형 게임 지원 완료를 선언할 수 없다. 개인 게임/세이브는 동의 없이 업로드하거나 공개 저장소에 넣지 않는다.

합성 fixture는 기준의 1×/3×/10× 함수·선언 규모와 비영 원소율 0/1/10/100%를 **축별로** 시험한다. 캐릭터 수와 고유 문자열도 독립 증가시킨다. 사용하지 않는 선언 확대, 모든 함수 최초 실행, 멀리 떨어진 인덱스 쓰기, 조밀한 전범위 연산을 포함한다. 10×는 스트레스 조건이지 실제 대형 게임의 성능 인증이나 무조건 실행 약속이 아니다.

### 3.2 초기 정량 목표 — 가설이며 iOS 보장값 아님

M1 측정 후 ADR로 확정/수정한다. 숫자를 충족시키려 의미를 바꾸거나 실패 케이스를 빼지 않는다.

| 지표 | 최초 목표안 | 판정 방법 |
| --- | --- | --- |
| 현재 게임 상주 메모리 | 동일 Node 측정에서 약 559MiB 대비 60% 이상 감소, 약 220MiB 이하 탐색 | 같은 seed/입력/시점/GC 조건으로 비교. iPhone 프로세스 메모리로 환산하지 않음 |
| 저장 순간 추가 부담 | 동일 환경의 관측 최대치가 저장 직전 대비 20% 또는 32MiB 중 큰 값 이내 | 직렬화→IDB commit→해제까지 샘플링. 샘플 사이의 진짜 최고값 누락 가능성을 기록 |
| 불필요한 사전 할당 | 거의 미사용인 선언 용량 10× 확대 시 실행 상태 메모리 2× 미만 | 컴파일 메타데이터 증가분을 별도 보고. 조밀한 실제 데이터는 이 비율 적용 제외 |
| 누적 보유 | 동일 상태로 돌아오는 저장/로드·세션 교체 100회 후 생존 메모리 증가 5% 이내 | 워밍업 제외, 별도 프로세스 3회 비교. 정상 게임 데이터 증가와 누수 구분 |
| 성능 회귀 | 대표 입력·날짜·저장 지연 p95가 기준 대비 20% 이상 악화하면 재검토 | 측정 환경 고정, 표본 수 기록. 무거운 게임에 절대 응답시간 하나를 강제하지 않음 |
| 의미/데이터 무결성 | 필수 호환 fixture 불일치 0, 저장 실패 주입 시 정상 저장 손실 0 | 알려진 결함은 별도 실패 목록으로 유지하며 초록색 특성화 시험과 구분 |
| 실기기 최소 출시 표본 | 지원 게임/기기 조합마다 독립 3세션, 세션당 2시간, 날짜 지원 게임 100회 날짜 전환 | 저장 복원·백그라운드 왕복·오프라인 포함. 관측 종료 0 요구, 무한 안정 보장 아님 |

브라우저에서 전체 메모리 API가 없으면 0 또는 추정 iPhone 힙으로 채우지 않는다. Node heap/RSS, Chromium 관측값, WASM 선형 메모리 페이지, 실제 iPhone에서 관측 가능한 진단을 서로 다른 열로 남긴다. 기기별 안전 용량은 메모리 경고가 항상 온다는 가정 없이 실측 지원 등급으로 관리한다.

## 4. 설계 방향

### 4.1 엔진은 비교 후 선택한다

| 경로 | 시험할 장점 | 주요 위험/채택 조건 |
| --- | --- | --- |
| A. eraJS 자료구조 개편 | 현재 실행/저장 자산 재사용, 단계적 비교 가능 | Array/객체/문자열 비용과 파싱 보유가 실제 지배 비용인지 M1로 확인. release JS 문자열 치환을 영구 개발 방식으로 확대하지 않음 |
| B. 기존 Rust/C 계열 엔진의 WASM 호스트 이식 | 조밀한 데이터 표현과 명시적 메모리 관리 가능성 | 명령/KR 확장, 비동기 입력/I/O, 저장 변환, 라이선스. WASM 빌드 성공만으로 게임 호환 아님 |
| C. WebEmuera 계열 보수·WASM | 원래 Emuera 의미에 가까운지 비교할 후보 | .NET 런타임/GC/빌드 크기·피크 부담, 현재 빌드 가능성 재확인 필요 |
| D. 신규 VM/바이트코드 엔진 | 메모리/실행 구조를 직접 통제 | 최대 비용과 호환성 위험. A~C의 구체적 실패 근거 없이는 착수하지 않음 |

과거 조사에서 erars는 클론/소스 조사까지만 했고 브라우저 실행은 시험하지 않았다. WebEmuera는 당시 빌드 실패를 기록했다. 이를 최신 성공/불가능으로 확대하지 않으며 M2에서 버전을 고정해 재평가한다. WASM은 JS 경계 복제, 문자열, 선형 메모리의 고수위 유지까지 포함해 측정한다. 엔진 변경만으로 iOS 메모리 종료가 사라진다고 약속하지 않는다.

필수 탈락 관문은 원본 변경 요구, 핵심 저장 손상, 목표 프로필 필수 명령 불일치, 오프라인 불가, 배포 권리 미확보다. 통과 후보에만 메모리 35%·호환 범위 30%·보수/재현성 20%·속도/시작 비용 15%의 제안 가중치를 적용한다. 점수가 데이터 무결성 실패를 상쇄하지 못한다. M2 종료 때 제품 경로 하나를 선택하고 다른 후보는 비교 기준으로 동결한다.

### 4.2 메모리 구조 자체를 바꾼다

1. **변수 저장소 추상화:** 선언 크기·논리 길이와 실제 할당을 분리. 기본 0/빈 문자열은 페이지 미할당 상태로 표현한다.
2. **희소/조밀 혼합:** 작은 페이지부터 할당하고 실제 밀도에 따라 조밀 표현을 선택한다. 모든 값을 Map에 넣는 단순 희소화는 조밀 데이터에서 오히려 비싸므로 피한다. page size·전환 임계값은 실험으로 결정한다.
3. **정수 의미 우선:** BigInt64Array/WASM i64 후보는 8byte 저장 장점뿐 아니라 overflow/나눗셈/음수/문자열 변환/INPUT 경계까지 대조한다. 기존 VM의 무제한 BigInt 값을 64비트로 조용히 자르지 않는다. 프로필별 의미와 기존 웹 세이브 이행 정책이 먼저다.
4. **캐릭터·LOCAL 수명:** 기본값 공유는 불변일 때만 허용하며 쓰기 시 분리한다. LOCAL을 함수 종료 시 임의 해제하지 않는다. 함수별 값 지속·재귀·참조·배열 확장·reset 의미를 보존한다.
5. **코드 표현:** 원문/토큰/AST/IR/클로저의 실제 보유량을 조사한 뒤 중복 문자열 제거, 조밀 IR, 필요한 함수 컴파일/캐시 예산을 검토한다. 동적 CALL/이벤트 등록/오류 파일·행 정보는 유지한다.
6. **패키지 수명:** ZIP·해제 바이트·디코딩 문자열·컴파일 결과의 동시 보유를 제한한다. 임시 버퍼와 Worker 메시지는 chunk/transferable로 전달하되 transfer 후 소유권을 명시한다.
7. **명시적 종료:** VM·리스너·입력 요청·출력 큐·버퍼를 세션 단위로 정리한다. Worker terminate는 자원 회수/비정상 정지 수단이지 저장되지 않은 게임을 살리는 수단이 아니다.

지원 용량을 넘을 것으로 확인된 게임은 설치/실행 전에 명시적으로 거절하거나 실험 등급으로 표시한다. 브라우저 메모리 경고에만 의존하는 동적 안전장치는 사용하지 않는다.

### 4.3 저장은 호환성을 유지하며 피크를 제한한다

- 우선 기존 웹 세이브 JSON/gzip import/export를 유지한다. 새 내부 저장 형식이 필요하면 `saveFormat/saveVersion`을 분리하고 변환을 새 브랜치에서 실행한다.
- 게임 상태→대형 객체→대형 JSON→압축 버퍼→메시지 복제를 한꺼번에 만들지 않도록 제한 크기 chunk 직렬화/압축을 실험한다. 내보내기와 가져오기도 같은 피크 예산에 포함한다.
- 다수 chunk는 임시 generation으로 기록하고 최종 manifest/revision 전환만 짧은 IDB 트랜잭션으로 커밋한다. 중단된 generation은 보이지 않게 하고, 마지막 정상 generation을 보존한다. 메모리 적게 쓰려 한 트랜잭션 안에서 외부 비동기 작업을 기다리지 않는다.
- SAVEDATA와 SAVEGLOBAL의 개별 명령 순서·실패 관측을 유지한다. 두 명령을 근거 없이 합쳐 원자적이라고 표시하지 않는다. 일관된 전체 백업은 VM 안전 지점과 in-flight I/O 종료 후 취한다.
- dirty-page/증분 저장은 전량 저장의 의미와 실패 복구가 먼저 통과한 뒤 도입한다. 특정 쓰기 경로를 누락하면 조용한 손상이므로 초기 필수 구현으로 넣지 않는다.
- 구 엔진→새 엔진, 새 엔진→구 엔진은 웹 저장 호환 표로 관리한다. 직접 읽기가 불가능하면 검증된 레거시 export를 제공하고 미지원 값은 오류로 거절한다. PC Emuera 세이브 왕복은 별도 형식별 관문이다.

### 4.4 공통 런처는 엔진과 분리한다

[기존 아키텍처](architecture.md)의 Shell → RuntimeHost → Worker adapter와 PackageService/SaveService/Renderer 경계를 유지한다. [계약](contracts.md)은 설계 초안이며 현재 모두 구현됐다는 뜻이 아니다.

라이브러리·ZIP import·프로필 선택·진단·백업을 공통화하되 Shell에 게임별 ERB 분기를 넣지 않는다. 저장 권한은 호스트가 만든 libraryEntryId/saveBranchId에 고정한다. 패키지의 JS/WASM/EXE는 실행하지 않는다. ZIP 폭탄·경로 traversal·인코딩/대소문자 충돌·용량 부족·중단 설치를 검사한다. 기존 100/300MiB 등의 제안 ZIP 한도는 M1 대형 게임 코퍼스 측정 후 재결정하며 무조건 높이지 않는다.

## 5. 단계별 로드맵과 완료 관문

작업량은 **전담 숙련 개발자 1명 기준 초기 추정 인주**다. 기기 확보/권리 확인 대기 제외, 확정 납기 아님. 전체 약 17~31인주(대략 4~8개월 규모), 신규 VM 선택 시 재산정한다. M1/M2 뒤 범위와 추정을 갱신한다. AI 작업량을 곧바로 일정 단축 보장으로 환산하지 않는다.

| 단계 | 선행조건 / 예상 | 산출물 | 완료/중단 기준 |
| --- | --- | --- | --- |
| M0 기준 고정·재현 보존 | 즉시 / 1~2주 | 현재 릴리스·원본·시험 기준, 사용자 재발 기록, 안전 백업/업데이트 체크리스트 | 실제 적용 릴리스/진단 확보 여부를 명시. 기기 미확인 시 종료 해결 판정 보류, 다른 연구는 가능 |
| M1 측정·호환 시험 기반 | M0 로컬 기준 / 2~3주 | 단계별 메모리 보고서, 3규모 코퍼스, 자동 입력 replay, 명령/설정 지원표, 실패 주입 fixture | 상위 메모리 보유 항목과 초기화/날짜/저장 피크 분리. 실게임 미확보면 대형 지원 판정 보류 |
| M2 엔진 기술 검증·선정 | M1 공통 harness / 2~4주 | A/B/C 최소 호스트 비교, 라이선스/빌드 재현 보고서, 선택 ADR | 같은 코퍼스로 실행→날짜→저장→복원 비교. 기간 내 핵심 경로 미도달 후보는 보류/탈락, 무기한 이식 금지 |
| M3 코어 메모리 재설계 | M2 선택 / 4~8주 | 변수 저장소, 코드/버퍼 수명 관리, 정수 입력 수리, 차등 시험 | M1 확정 예산과 필수 의미 시험 통과. 미달하면 원인/범위 재설정, 런처로 문제를 가리지 않음 |
| M4 저장·복구 강화 | M3 저장 API 안정 / 3~5주 | chunk/generation 저장, 기존 웹 백업 호환, 새 브랜치 마이그레이션, 종료/용량 실패 시험 | 모든 쓰기 단계 강제 중단에도 마지막 정상 저장 보존. 양방향 호환 표 및 복원 재실행 통과 |
| M5 확장형 런처 | M2 API 고정, 제품 통합은 M4 뒤 / 3~5주 | ZIP 설치/라이브러리/게임별 격리/엔진 고정/안전 업데이트 | 두 게임 교대·같은 gameId 충돌·다중 탭·중단 설치·오프라인·백업 왕복 통과 |
| M6 대형 게임·실기기 출시 검증 | M3~M5 통합 / 2~4주 | 게임×기기 지원표, 장시간 결과, 배포/롤백 보고서 | §3 목표와 사용자 기존 4일차 재현 경로 통과. 실제 iPhone 미시험이면 출시 인증 보류 |

의존 순서: **M0 → M1 → M2 → M3 → M4 → M5 → M6**. M1의 의미 fixture와 메모리 측정은 병행 가능하며, M5 UI mock은 M2 후 병행 가능하다. 단, mock 런처 성공은 엔진/게임 실행 완료로 계산하지 않는다.

### 최초 실행 단위: M0~M1

1. 기존 로컬 후보·공개 기록·원본 1,151개·상류 고정 커밋을 각각 고정한다. 배포 승인 없이 새 후보를 게시하지 않는다.
2. 시작/컴파일/첫 상점/4일/16일/저장/로드/백업/종료의 수명별 계측을 설계한다. 강제 GC 측정과 자연 GC 실행을 별도 표로 남긴다.
3. 변수·LOCAL·캐릭터·원문/AST·출력/메시지·저장 복제의 보유량을 나눠 보고, 보유 경로를 확인하기 전 메모리 원인을 단정하지 않는다.
4. 기준 엔진에 동일 seed/입력을 재생한다. 시각 등 비결정 필드를 명시적으로 제외한 저장 상태와 출력/이벤트 순서 해시를 비교한다.
5. 현재/중형/대형 코퍼스와 합성 밀도 fixture를 등록하고 필요한 명령·설정 차이를 추출한다. 정적 검색만으로 전체 지원을 인증하지 않는다.
6. 실기기 재발 시 게임 시작 전 직전 진단, 적용 릴리스, 게임 날짜, 마지막 저장 시각, 백그라운드 여부를 받는다. 가능하면 사용자가 동의한 백업의 복사본으로 재현하고 원본을 덮어쓰지 않는다.
7. 결과로 메모리 예산·제품 지원 등급·M2 후보별 조사 한도를 확정한다. 첫 성과물은 새 UI가 아니라 **측정 보고서 + 차등 검증 harness + 엔진 선정 기준**이다.

## 6. 호환성과 출시 검사

- 정수: INPUT의 53비트 초과, 64비트 경계, 음수/overflow/나눗셈/RAND. 기존 숫자 입력 결함은 정답 fixture가 통과해야 해결이다.
- 배열: 1/2/3차원, 선언/확장 길이, 멀리 떨어진 인덱스, 부분 reset, 전범위 연산, 참조/별칭, 재귀와 함수 LOCAL 지속.
- 언어: 동적 호출/이벤트 등록/전처리/파일 순서/설정/Rename/Replace/KR 조사·인코딩. 기준 구현과 허용된 실행 환경을 프로필별로 명시한다.
- 상태: seed/input replay에 따른 변수·캐릭터·출력·이벤트 순서·슬롯/GLOBAL 비교. 기존 엔진의 알려진 오동작은 정답 oracle로 쓰지 않는다.
- 저장: 구→구/구→새/새→구/새→새, 재로드 후 추가 진행, 한글/이모지/조밀 대형 저장, 용량 부족/트랜잭션 abort/Worker 강제 종료/손상 백업.
- 실기기: 실제 iPhone 홈 화면과 Safari 탭 별도, 회전·키보드·화면 잠금·다른 앱 왕복·온라인/비행기 모드·파일 앱 백업 왕복. 중단 후 정확한 명령 위치가 아니라 마지막 commit 저장 복귀를 기본 보장 대상으로 한다.
- WebKit: Playwright offline toggle 내부 오류와 server-stop 시험을 분리한다. 데스크톱 WebKit 성공을 실제 iOS 성공으로 표시하지 않는다.
- 배포: 같은 origin/scope 유지, 앱/사이트 데이터 삭제 금지, 사용자 백업 후 후보 적용. 실행 중 강제 새로고침 금지. 엔진별 저장 branch/이전 자산을 유지하고 되돌리기 불가 DB 변경이면 내보내기 가능한 복구 화면을 제공한다.

## 7. 운영·보호 규칙과 리스크

- 원본 ERB/CSV/설정과 원본 해시 baseline은 변경하지 않는다. 고정 상류 checkout도 수정하지 않는다. 코어 개발이 필요하면 별도 관리 소스/빌드 경계를 만들고 고정 원본과 차등 비교한다.
- 현재 dirty/untracked 작업공간을 통째로 commit하거나 reset/clean하지 않는다. 단계별 대상 경로 체크포인트, 선택적 변경, 명시적 Acceptance를 남긴다.
- 초기 산출물은 `tools/web-engine-probe/`에 격리한다. 제품 구현 경로 `web/`는 기존 설계의 제안이며 M2 선정 후 생성한다. 이번에는 생성하지 않는다.
- 각 마일스톤의 완료 보고는 소스/엔진/패키지/세이브 fixture 해시, 실행 명령, 환경, 통과와 실패/미시험을 함께 남긴다. 단위시험만으로 출시 완료 처리하지 않는다.
- 개발 담당은 구현/계측/회귀/문서, 사용자는 보유 게임 후보·기기 관측·배포 승인, 별도 검토자는 저장 의미·라이선스 검토를 맡는 구성을 권장한다. 기기나 권리 승인을 개발 도구로 대신했다고 보고하지 않는다.
- 대형 게임이 iPhone 예산을 초과하면 해당 조합을 지원 불가/PC 전용으로 제한할 수 있다. 네이티브 앱/서버 실행 전환은 오프라인 PWA 목표를 바꾸는 별도 결정이다.
- 출시 압박으로 자동저장 비활성화, 값 정밀도 축소, 게임 스크립트 삭제를 성능 개선으로 사용하지 않는다.

## 8. 현재 결정 요약

**결정:** 대형 게임을 먼저 시험군에 넣고, 측정과 의미 검증을 기반으로 코어 구조를 개선한다. UI 확장보다 엔진 확장성을 먼저 검증한다.

**보류:** eraJS 최종 채택, WASM 언어/엔진 선택, 내부 저장 포맷 교체, 전체 ERA/PC 세이브 호환, 기기별 최종 용량 한도.

**미해결 유지:** 기존 iPhone 4일차 종료의 원인/해결, 로컬 후보의 실기기 적용 확인. 계획 문서 완료가 이 문제의 해결이나 전체 프로젝트 착수를 뜻하지 않는다.

**저장 직렬화 transient 축소(dense-1d 백킹 직접 스캔):** 전환 transient 피크의 지배 요소는 `compactIntegers`가 dense-1D paged 전역 행(`GLOBAL`/A~Z/`FLAG`, 최대 11.4M 슬롯·대부분 기본값)을 **Proxy get 트랩**으로 후행 0 트림·순회하며 슬롯마다 property-key 문자열을 할당한 것이었다. `pagedDenseBacking()`으로 원시 dense 백킹을 직접 스캔하도록 오버레이(`compact-save.mjs`)를 바꿔 값·순서·트림을 불변으로 유지(트림 규칙 동일, Proxy와 백킹은 동일 Array). 격리 gross-할당 측정(`save-scan-microbench.mjs`, forced-GC)에서 11.4M 슬롯 1회 직렬화의 gross transient가 **262.65MiB→0.78MiB(-261.9MiB), 약 149× 빠름**, 출력 바이트 동일. `compact-save-test` 7/7(신규 paged↔plain parity 포함) 통과, `originalUnchanged:true`. **주의:** full-game `transition-peak-profile`의 natural-heap 고수위 지표는 강제 GC가 없어 코드가 빨라질수록 미수거 garbage가 샘플 사이에 더 쌓여 transient를 과대 표시하므로, 이 최적화의 정당한 계측은 natural-heap이 아니라 위 gross-할당 격리 측정이다.

**브라우저 실게임 회귀(승격 전 게이트) 통과:** 위 저장 오버레이를 워커에 반영해 재빌드(`dist/engine-worker.js`) 후 Chromium·WebKit 헤드리스에서 `game-browser-test.mjs`(셋업→저장 save00→백업 export/무효·취소 보존·크로스탭 락→DB 삭제 후 파일 복원→리로드→슬롯0 로드 복원→추가 진행) 모두 `pass`, `pageErrors: []`, `externalRequests: []`, 복원 플레이어 `웹시험`, `originalUnchanged:true`를 확인했다(`results/game-browser-chromium.json`, `results/game-browser-webkit.json`). 판별을 위해 **변경 전 베이스라인 워커도 동일 테스트로 실행**해 로드 단계 정지가 재현됨을 확인했다 → 이는 회귀가 아니라 CPU 경합 샌드박스에서 거대 전역 save 로드가 하드코딩 20s 액션 타임아웃을 넘긴 벽시계 초과였다. 이를 위해 `game-browser-test.mjs`의 액션 타임아웃을 `PROBE_ACTION_TIMEOUT` env로 조정 가능하게 했고(기본 20000 유지) 70s로 재실행해 두 엔진 그린을 얻었다. iPhone 실기기 RSS는 여전히 사용자 몫으로 미측정이다.

**첫 구현 기록:** [M1 기준선](m1-baseline.md)에서 현재 게임의 고정 입력 2회 결정성 비교, 소스 로드→컴파일→1/4/16일→종료 수명별 Node 메모리 관측, post-reset 소유권 그룹별 독립 ablation을 통과했다. 함수 코드 그래프가 가장 큰 현재 게임 우선순위로 측정됐고, 전역 값의 11,426,198 logical slot 중 non-default는 2,313개였다. 이후 격리 prototype에서 paged storage, compact metadata/statement vector, `PrintForm` payload 조밀화와 함수 static scope 지연 생성을 결합해 현재 게임 16일 forced-GC 표본을 약 **274.3MiB**까지 낮췄다. 작은 Assign slot 실험은 **273.5MiB**까지 낮췄지만 1MiB 미만이라 확대하지 않는다. 이 결합 overlay는 이후 **런타임 워커 번들로 승격**돼(릴리스 `5bc104f8a08caa1cc0f3`) Chromium/WebKit 실게임 날짜 전환·회전 자동저장·리로드·거부 분기 동작과 `pageErrors: []`가 검증됐고 시작 지연 회귀는 없었다. 다만 구 워커 벽시계 대조와 iPhone 실기기 RSS는 여전히 미측정이다. 이는 측정 기반 구축의 진전이며 220MiB 목표 달성, 대형 게임 호환, 엔진 선정 또는 iPhone 해결 판정이 아니다.
