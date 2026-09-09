# M1 현재 게임 재생·메모리 기준선

상태: **첫 M1 기준선 통과 — 중형/대형 코퍼스·대체 엔진·실제 iPhone 검증 전**

[대형 런타임 계획](scalable-runtime-plan.md) · [검증 도구](../../tools/web-engine-probe/README.md) · [재생 기준선 JSON](../../tools/web-engine-probe/results/scalable-runtime-baseline.json) · [소유권 분해 JSON](../../tools/web-engine-probe/results/m1-ownership-profile.json) · [compact IR 첫 비교 JSON](../../tools/web-engine-probe/results/compact-function-ir-profile.json)

## 이번에 구현한 것

- 이벤트와 소비 입력을 순서대로 canonical SHA-256에 넣는 재생 recorder/runner
- BigInt, Map, 배열, 저장 문자열을 손실 없이 비교하는 결정성 해시
- Node의 자연 상태와 강제 GC 상태를 분리하는 수명별 메모리 sampler
- 현재 게임을 고정 seed `42`, 동일 입력으로 두 격리 프로세스에서 16일까지 실행하는 기준선
- 1/4/16일의 선택 상태, LOCAL 할당, 전체 저장 엔트리 바이트/해시 비교

원본 ERB/CSV/설정은 쓰지 않았다. 실행 전후 원본 1,151개 digest는 `017cbaf8e24440301e71e395bfc8f49189fccab6948c72b517b330898815a37d`로 같았다.

## 첫 측정 결과

환경은 Windows x64, Node `v24.15.0`이다. 대상 엔진 파일 SHA-256은 `7227aa53349ed891e95db1284891e2fd15c6365128047a71f78b6d360682b374`다. 컴파일 입력은 1,115개, 디코딩 텍스트 62,160,626 bytes, 등록 함수 16,453개였다.

대표 첫 실행의 강제 GC 직후 관측값:

| 수명 지점 | heapUsed | RSS | 해석 제한 |
| --- | ---: | ---: | --- |
| 프로세스 시작 | 4.873 MiB | 54.246 MiB | 엔진/게임 미로딩 |
| 소스 디코딩 뒤 | 81.957 MiB | 252.113 MiB | 텍스트·인벤토리 포함 |
| 컴파일 뒤 | 440.779 MiB | 653.824 MiB | 소스 참조도 아직 살아 있음 |
| 소스 참조 해제·VM 시작 | 438.512 MiB | 653.074 MiB | 게임 진행 전 |
| 1일 상점 | 557.127 MiB | 881.891 MiB | 캐릭터 2명 |
| 4일 상점 | 558.722 MiB | 882.797 MiB | LOCAL 66/32,924 cells 할당 |
| 16일 상점 | 559.652 MiB | 884.148 MiB | LOCAL 할당 수는 4일과 동일 |
| VM reset·참조 해제 뒤 | 10.163 MiB | 813.004 MiB | V8 heap 생존량은 회수됐지만 RSS 고수위는 즉시 OS에 반환되지 않음 |

두 번째 격리 실행의 1/4/16일 heap은 각각 557.127/558.722/559.654 MiB였다. 두 실행에서 1,088개 이벤트, 181개 입력, 3개 체크포인트의 최종 재생 해시 `828b62b77c1c7ff0f63f3a2b8159da40789a014de0eb5144b5eb0a0c5e60c652`와 체크포인트 상태/저장 해시가 모두 일치했다.

## 현재 판단

이번 결과는 기존 약 559MiB 수치를 독립 재현하면서, **진행 중 LOCAL 추가 할당보다 컴파일 완료 시점의 약 439MiB 기반 비용이 먼저 큰 항목**임을 보여 준다. 1일 진입 시 강제-GC heap이 약 119MiB 더 늘고 4→16일 증가는 약 0.9MiB이므로, 다음 분해는 코드/IR·전역 변수·캐릭터 상태를 별도 계측해야 한다. RSS가 종료 뒤에도 높게 남는 현상은 이번 한 번의 표본만으로 누수라고 판정하지 않으며, 100회 세션 교체 시험에서 별도 확인한다.

아직 220MiB 목표를 달성하지 않았고 엔진 코어 자료구조도 바꾸지 않았다. 이 결과는 Node 이산 표본이라 실제 피크나 브라우저 전체 메모리, iPhone 종료 한계가 아니다. 사용자 세이브, 저장 후 로드/백업, 중형·대형 실게임, 합성 밀도 fixture, 대체 엔진은 아직 비교하지 않았다.

## 후속 소유권 분해

같은 현재 게임을 각각 독립 프로세스에서 컴파일하고 `vm.reset()`한 뒤, VM의 한 소유권 그룹만 참조 해제하고 강제 GC한 결과를 기준 프로세스와 비교했다. 기준 post-reset heap은 **554.714MiB**였다.

| 독립적으로 참조 해제한 그룹 | 기준 대비 감소 | 포함 범위 |
| --- | ---: | --- |
| 함수 코드 | **424.042MiB** | `fnMap`, 이벤트 함수, `code.fnList`의 파싱/실행 객체 그래프 |
| 런타임 값 | **116.248MiB** | 전역 값 배열, static scope, 캐릭터, printer |
| static scope만 | **25.572MiB** | 함수별 scope Map과 LOCAL/LOCALS cell 메타데이터 |
| CSV/template | 0.865MiB | CSV 모델과 캐릭터 template 참조 |
| header/macro | 0.228MiB | ERH property와 macro 참조 |
| 위 VM 소유 그룹 전체 | **546.564MiB** | 도구·모듈 자체를 제외한 분리 가능 VM 그래프 |

각 행은 별도 프로세스의 **중첩 가능한 reachability 차이**이므로 합산하지 않는다. V8 allocator의 정확한 retained-size도 아니다. 하지만 함수 코드만 해제했을 때 약 424MiB가 회수되어, 현재 게임에서는 CSV 원문보다 **컴파일된 statement/expression 객체 표현이 첫 번째 구조 개선 대상**임을 강하게 지지한다.

getter를 호출하지 않는 구조 census에서는 VM 그래프 3,860,738개 객체 중 Array 793,988개, `_Slice` 734,057개, `Lazy` 615,854개, Map 349,648개, Set 339,763개, Thunk 330,665개가 관측됐다. 전역 값은 117개 cell의 94,857개 중첩 Array에 총 11,426,198 logical slot을 보유했지만 non-default slot은 2,313개뿐이었다. 함수별 LOCAL/LOCALS 32,924개는 모두 미할당 accessor 상태였다. 따라서 M3 실험 순서는 다음처럼 좁혀진다.

1. statement마다 중첩되는 `Thunk`/`Lazy`/`Slice`/Map/Set을 조밀 IR 또는 bytecode prototype으로 치환해 동일 replay hash를 비교한다.
2. 전역 다차원 기본값 배열을 page 기반 희소/조밀 저장소 prototype으로 옮겨 11.4M logical slot의 0 초기 할당을 제거한다.
3. 함수별 static scope는 LOCAL 배열 지연 할당을 유지하되, 빈 Map/cell 메타데이터 25.6MiB를 함수 최초 접근까지 늦추는 방안을 시험한다.

이 순위는 현재 게임에 대한 M1 근거이며 중형/대형 코퍼스에서 다시 측정한다. 아직 실제 엔진 자료구조를 교체하거나 게임 의미를 변경하지 않았다.

## compact function IR 및 paged storage 1~5차 구현

첫 조각은 statement 전체 bytecode가 아니라, 컴파일 결과에 장기 보유되던 PRINT 계열의 불변 `Set` 플래그를 A~Z numeric bitmask로 바꾼 제한된 prototype이다. 두 번째 조각은 모든 `Thunk`가 소유하던 native `Map`을 빈 상태와 단일 label은 필드로 보관하고 두 번째 서로 다른 label부터 native `Map`으로 spill하는 `CompactLabelMap`으로 바꾼다. 세 번째 조각은 `Lazy`의 `raw/parser/isCompiled/cache` 네 필드를 `raw`와 parser-or-cache 두 필드로 줄이고, 파싱 성공 뒤 `raw = null`을 완료 표식으로 사용한다. 네 번째 조각은 `Slice`의 `from/to` 두 필드를 일반 범위에서는 하나의 안전 정수로 묶고, 특이 범위에서는 2원소 배열로 fallback한다. 다섯 번째 조각은 LOCAL/LOCALS를 제외한 1D와 모든 2D/3D 기본 배열을 256-slot page 기반 Array-compatible Proxy로 바꾼다. 0 또는 빈 문자열만 있는 page와 아직 접근하지 않은 중첩 행은 할당하지 않고, 마지막 non-default 값이 0으로 돌아가면 page를 회수한다. 파서 실패 시 Lazy는 미컴파일 상태를 유지하며 Slice의 파일·행·범위·중첩 slicing, 배열의 논리 길이·중첩 인덱싱·map/JSON/reset/range 계약도 유지한다.

상류 checkout과 기본 `dist/engine.mjs`는 유지한다. 단계별 산출물은 `dist/engine-compact-ir.mjs`, `dist/engine-compact-ir-labels.mjs`, `dist/engine-compact-ir-labels-lazy.mjs`, `dist/engine-compact-ir-labels-lazy-slice.mjs`, `dist/engine-compact-ir-labels-lazy-slice-paged.mjs`다. overlay 대상은 정규화 SHA-256과 치환 횟수가 맞지 않으면 빌드를 중단한다.

동일 Node 환경에서 기본 엔진과 prototype을 각각 격리 실행한 강제-GC heap 비교:

| 지점 | 기본 엔진 | compact prototype | 절감 |
| --- | ---: | ---: | ---: |
| 컴파일 직후 | 440.789 MiB | 365.640 MiB | **75.149 MiB (17.05%)** |
| VM 시작 | 438.522 MiB | 363.373 MiB | **75.149 MiB (17.14%)** |
| 1일 | 557.136 MiB | 481.977 MiB | **75.159 MiB (13.49%)** |
| 4일 | 558.733 MiB | 483.565 MiB | **75.168 MiB (13.45%)** |
| 16일 | 559.662 MiB | 484.506 MiB | **75.156 MiB (13.43%)** |

label Map 조각은 PRINT prototype 대비 약 **42.75MiB**, Lazy는 label 결합형 대비 약 **9.39MiB**, Slice는 Lazy 결합형 대비 약 **5.57MiB**를 추가 절감했다. paged storage는 배열이 생성되기 전인 컴파일/VM 시작 지점에서는 약 **0.02MiB 증가**했지만, reset과 게임 상태 생성 뒤에는 Slice 결합형 대비 **약 89.48MiB**를 추가 절감했다. 다섯 조각의 기본 엔진 대비 누적 결과는 다음과 같다.

| 지점 | 기본 엔진 | PRINT + label + Lazy + Slice + paged storage | 누적 절감 |
| --- | ---: | ---: | ---: |
| 컴파일 직후 | 440.782 MiB | 307.947 MiB | **132.835 MiB (30.14%)** |
| VM 시작 | 438.515 MiB | 305.680 MiB | **132.835 MiB (30.29%)** |
| 1일 | 557.129 MiB | 334.801 MiB | **222.327 MiB (39.91%)** |
| 4일 | 558.723 MiB | 336.376 MiB | **222.347 MiB (39.80%)** |
| 16일 | 559.655 MiB | 337.327 MiB | **222.327 MiB (39.73%)** |

여섯 엔진의 1/4/16일 1,088개 이벤트, 181개 입력, 선택 상태와 전체 저장 엔트리 hash가 일치했고 최종 replay hash도 기존 기준 `828b62b77c1c7ff0f63f3a2b8159da40789a014de0eb5144b5eb0a0c5e60c652`와 같았다. 중립 fixture에서는 각 단계의 출력 이벤트와 저장 문자열을 직접 비교했다. 별도 저장 호환 시험에서는 legacy/현재 compact/paged writer가 만든 1D/2D/3D·조밀 값·확장 길이·문자열·캐릭터 저장을 세 loader가 모두 복원하고, dirty VM에서 재로드할 때 생략된 tail을 0으로 되돌리는 것도 확인했다. 단위시험은 Lazy의 1회 파싱·`undefined` 캐시·실패 후 재시도, Slice의 위치·범위·중첩 slicing·쓰기 가능한 bounds, paged storage의 1D/2D/3D 기본 읽기·page 생성/회수·map·fill·JSON을 포함한다. 원본 digest도 전후 동일했다.

paged storage는 현재 경로에서 큰 절감이 확인되어 격리 prototype에는 유지한다. 제품 bundle에는 승격하지 않았고 현재 약 337.3MiB도 220MiB 탐색 목표보다 높다. 승격 전 판정으로 Proxy 인덱싱·page overhead·밀도 전환 비용을 격리 Node에서 측정했다(아래 절). 브라우저 엔진별 객체 layout과 실기기 RSS는 여전히 미측정이다. 다음 구조 실험은 statement/expression의 더 조밀한 IR, 함수별 static scope 지연이다.

## paged storage 승격 전 성능 판정

`profile:paged`는 상용 엔진과 무관하게 순수 `paged-default-array.mjs`를 대상으로, 평범한 zero-fill `Array`와 paged Proxy를 동일 좌표·값으로 비교한다. Node v24 강제-GC heap을 3회 측정해 중앙값을 취하고 쓰기/읽기/직렬화 시간을 hrtime으로 잰다. 값은 **균등 분산(page당 가장 불리한 배치)**이라 실제 게임의 군집 데이터는 이보다 유리하다. 브라우저/WebKit/iPhone 계측이 아니다.

메모리(기본 page 256, paged/base 보유 heap 비율, 1 미만이면 절감):

| 형태 | sparse 0.1% | medium 2% | dense 30% |
| --- | ---: | ---: | ---: |
| 1D `[120000]` | 1.27 (0.25MiB 손해) | 2.06 | 2.09 |
| 2D `[1200,500]` | **0.30 (3.25MiB 절감)** | 1.13 | 1.13 |
| 3D `[120,120,40]` | **0.26 (3.82MiB 절감)** | 5.07 | 6.32 |

- 큰 중첩 기본 배열이 sparse할수록 절감이 크다(엔진의 89MiB 절감 근거). 전부 기본값이면 2D는 4.87MB→11KB(비율 0.002)다.
- **1D 선형 배열은 이득이 없다.** paged도 전체 길이 target Array를 유지하므로 항상 손해다 → 1D는 unpaged 경로를 유지해야 한다.
- **최내차원(40) < page(256)이면 3D는 5~11배로 폭증**한다. 값이 하나라도 있는 leaf 행이 256-slot page를 통째로 할당하기 때문이다. page 크기는 최소한 최내차원 이하로 잡아야 한다.

page 크기 sweep(2D sparse 비율): 64=0.11, 128=0.17, 256=0.30, 512=0.55 — 저밀도에서는 작은 page가 유리하다.

밀도 전환(2D `[1200,500]`, page 256): 비율이 0%→0.002, 0.5%→1.12에서 손익분기를 넘고 2% 이상에서 1.127로 포화한다. 즉 **균등 분산 기준 약 0.5% 밀도에서 절감이 사라진다**(군집 데이터는 더 높은 밀도까지 버틴다).

CPU 회귀(2D `[1200,500]`, page 256, paged/base 시간 비율):

| 밀도 | 쓰기 | 읽기 | 직렬화 |
| --- | ---: | ---: | ---: |
| sparse | 1.45× | 67.8× | 2.57× |
| medium | 17.1× | 25.2× | 2.70× |
| dense | **66.4×** | 22.2× | 2.81× |

읽기·쓰기 회귀가 크다(직렬화는 BigInt→문자열 변환 비용이 지배해 상대 격차가 작다). dense 쓰기 66×는 이번 판정의 참고 상한(쓰기 40×)을 넘는다.

**1차 판정(순수 paged):** 격리 의미 동일성(base vs paged) 26개 시험은 통과했지만 (1) 1D unpaged, (2) page ≤ 최내차원, (3) 포화 leaf의 dense 전환, (4) 쓰기 CPU 회귀 완화가 필요하다고 판정했다.

### shape-aware hybrid 후속 구현

위 네 조건을 격리 storage에 구현했다.

- 1D는 page Map 없이 dense backing을 사용하되, 기존 계약대로 길이 확장 구간은 기본값으로 채운다.
- 실제 page 크기는 요청값과 최내차원 중 작은 값으로 제한한다.
- 중첩 leaf의 sparse 할당 slot이 logical length의 75%에 도달하면 해당 leaf만 dense backing으로 승격한다.
- 승격된 leaf Proxy를 재사용해 반복 접근 때 Proxy/target 재생성을 없앴다. 외부에서 보유한 leaf 참조도 계속 같은 backing을 보므로 별칭 의미를 바꾸지 않는다.

후속 Node 프로파일(동일 shape/workload, hybrid/base 비율):

| 형태 | sparse 0.1% | medium 2% | dense 30% |
| --- | ---: | ---: | ---: |
| 1D `[120000]` | 1.002 | 1.006 | 1.009 |
| 2D `[1200,500]` | **0.301 (3.246MiB 절감)** | 1.161 | 1.163 |
| 3D `[120,120,40]` | **0.115** | 2.151 | 2.645 |

2D dense CPU 비율은 쓰기 **43.47×**, 인덱스 읽기 **18.87×**, 직렬화 **1.97×**였다(호스트 JIT 변동 때문에 쓰기는 40× 참고 band를 소폭 초과). leaf `Symbol.iterator`가 page를 한 번씩 직접 읽는 fast path를 추가한 뒤, 순회 읽기는 dense **1.86×**, sparse **8.02×**가 됐다. 이전 sparse 인덱스 전체 읽기 **77.1×**와 비교하면 크게 낮지만, `a[i]` 직접 순회는 여전히 느리므로 엔진 hot loop가 `for...of`/`Array.from` 순회를 사용할 때만 이득을 받는다. dense 중첩 배열의 retained heap도 base보다 크다. 따라서 hybrid는 **희소한 대형 중첩 배열용**이며 모든 배열에 유리한 일반 대체재가 아니다.

fast iterator는 순회 중 길이 변경과 같은 page 안의 미래 값 변경도 native Array iterator처럼 관측하도록 mutation version을 확인한다. 의미 시험에는 sparse/dense 값, 동적 축소, 미래 값 변경, 대체된 child 배열 순회를 추가했다.

### Cell 직접 접근 fast path

실제 엔진 경로를 조사한 결과 일반 2D/3D 변수 읽기·쓰기는 `Int2DValue.get/set`과 `Int3DValue.get/set`에서 정규화된 index 배열을 만든 뒤 `this.value[a][b]`/`this.value[a][b][c]`를 호출해 중첩 Proxy trap을 반복했다. 격리 paged bundle의 이 네 메서드만 fingerprint overlay로 `pagedArrayGet`/`pagedArraySet`에 연결했다. 일반 배열 fallback, BigInt index, 53비트 초과 정수, leaf 확장, 대체 child, 범위 밖 동작은 기존 의미를 유지한다. reset/rangeSet과 공개 Array 인덱싱은 바꾸지 않았다.

Node 직접 접근 프로파일에서 backing/Proxy 시간 비율은 다음과 같았다(낮을수록 개선):

| 형태·밀도 | 읽기 | 쓰기 |
| --- | ---: | ---: |
| 2D sparse 0.1% | **0.15** | **0.10** |
| 2D dense 30% | **0.43** | **0.42** |
| 3D sparse 0.1% | **0.24** | **0.32** |
| 3D dense 30% | **0.22** | **0.27** |

즉 Cell hot path의 기존 Proxy 시간 대비 약 **57~90%**를 줄였다. 다만 plain nested Array 대비 절대 비용은 workload별 읽기 2.35~33.63×, 쓰기 5.76~16.5×로 여전히 크다. 원자료는 `results/paged-direct-access-profile.json`이며 Node 단일 프로세스 합성 판정이다.

브라우저 격리 프로파일(`profile:paged-browser`, 2D `[400,256]`, sparse 0.1%)에서는 설치된 WebKit이 실행됐다. WebKit의 paged/base 비율은 직접 인덱스 읽기 **116.41×**, iterator 읽기 **3.08×**, 구조 생성 **2.19×**였다. Chromium은 Playwright 실행 파일 부재로 실행하지 못했다. WebKit context도 정밀 JS heap API를 노출하지 않아 브라우저 메모리는 미측정이며, 이는 iPhone RSS 판정이 아니다. 원자료는 `paged-default-array-browser-profile.json`이다.

Paged 의미 시험 **32/32**, M1/구조 시험 **11/11**, 저장·교차 loader 시험 **6/6**, 문법 검사를 통과했다. 변경 후 전체 1/4/16일 paged prototype 재생도 완료되어 replay hash `828b62b77c1c7ff0f63f3a2b8159da40789a014de0eb5144b5eb0a0c5e60c652`, 각 상태 및 전체 저장 hash, 원본 digest가 기존 기준선과 일치했다. forced-GC heap은 compile **307.961MiB**, VM 시작 **305.694MiB**, 1일 **336.457MiB**, 4일 **338.027MiB**, 16일 **338.983MiB**였다. 이는 동일 실행의 새 단독 표본이며 이전 단계 간 증분 메모리 표를 대체하지 않는다. release/PWA 엔진에는 적용하지 않았다.

**현재 판정:** 실제 Cell 직접 읽기·쓰기의 Proxy 병목은 크게 완화됐지만 plain Array보다 여전히 느리다. Chromium, 브라우저 heap, 실제 iPhone RSS·백그라운드 복귀 전에는 release/PWA 엔진에 승격하지 않는다. Node 결과는 `tools/web-engine-probe/results/paged-default-array-profile.json`과 `paged-direct-access-profile.json`, 브라우저 결과는 `tools/web-engine-probe/results/paged-default-array-browser-profile.json`이다.

## Compact statement vector 1차 구현

함수 코드 그래프의 다음 최소 조각으로 `Thunk.statement` 컨테이너만 cardinality-aware 표현으로 바꿨다. statement가 0개면 `null`, 1개면 statement 객체를 직접 저장하고, 2개 이상에서만 기존 `Array`를 유지한다. statement/표현식 객체, 지연 parsing, 오류 위치, label map, 동적 GOTO 및 실행 순서는 바꾸지 않았다. fingerprint overlay와 별도 `engine-compact-ir-labels-lazy-slice-paged-statements.mjs` bundle에만 적용했다.

현재 게임의 Thunk **330,665개** 중 빈 **71,241개**, 단일 statement **122,104개**, 다중 **137,320개**였다. 따라서 193,345개의 별도 statement Array를 제거했다. 컴파일 전용 독립 표본은 기존 paged prototype 대비 **22.704MiB**를 절감했다. 전체 고정 경로의 추가 절감은 다음과 같다.

| 지점 | 기존 paged prototype | compact statement vector | 추가 절감 |
| --- | ---: | ---: | ---: |
| 컴파일 | 307.962 MiB | 284.354 MiB | **23.608 MiB** |
| VM 시작 | 305.763 MiB | 282.086 MiB | **23.608 MiB** |
| 1일 | 338.716 MiB | 312.854 MiB | **25.862 MiB** |
| 4일 | 340.298 MiB | 314.423 MiB | **25.875 MiB** |
| 16일 | 341.244 MiB | **315.373 MiB** | **25.871 MiB** |

두 bundle은 이벤트 1,088개, 입력 181개, 1/4/16일 상태와 전체 저장 엔트리 hash가 모두 일치했고 replay hash는 `828b62b77c1c7ff0f63f3a2b8159da40789a014de0eb5144b5eb0a0c5e60c652`였다. 수치는 같은 수용 시험의 forced-GC 단독 표본이며 과거 프로세스의 절대값과 직접 차감하지 않는다. 이 조각은 bytecode가 아니며 statement 객체와 expression tree를 그대로 보유한다. 다음 후보는 빈번한 PrintForm/Assign/If/Return의 payload 조밀화 또는 함수별 static scope 지연 생성이었다. 다른 ERA corpus와 브라우저/실기기 검증 전 제품 엔진에는 승격하지 않는다.

## PrintForm payload 1차 조밀화

컴파일 직후 VM 그래프를 순회하는 `statement-payload-profile.mjs`를 추가했다. 현재 게임의 statement **639,954개** 중 `PrintForm` **306,841개(47.9%)**, `Assign` 109,513개, `If` 109,098개, `Return` 30,252개였다. 모든 `PrintForm`은 `raw`, numeric `flags`, 직접 `Lazy arg`를 보유했다. 반면 `Assign`은 최초 실행 때 변수 타입에 따라 inner statement를 만들고, `If`는 조건별 raw/Lazy/Thunk 배열을 가지므로 첫 단일 조각에서 제외했다.

`PrintForm` parser는 null 결과를 빈 `Form`으로 바꾸므로 `arg=null`을 미파싱 sentinel로 사용할 수 있다. 별도 `engine-compact-ir-labels-lazy-slice-paged-statements-printform.mjs`에서만 306,841개의 직접 `Lazy` wrapper를 제거하고, 최초 실행 성공 뒤 parsed `Form`을 같은 필드에 저장한다. parse 실패 때는 null이 유지되어 기존처럼 재시도하며, statement의 `raw`는 오류 위치 보고를 위해 그대로 둔다. expression/Form 객체와 출력·skipDisp 흐름은 바꾸지 않았다.

| 지점 | statement-vector prototype | compact PrintForm payload | 추가 절감 |
| --- | ---: | ---: | ---: |
| 컴파일 | 284.364 MiB | **272.641 MiB** | **11.723 MiB** |
| VM 시작 | 282.097 MiB | **270.374 MiB** | **11.723 MiB** |
| 1일 | 312.864 MiB | **301.140 MiB** | **11.724 MiB** |
| 4일 | 314.433 MiB | **302.709 MiB** | **11.724 MiB** |
| 16일 | 315.383 MiB | **303.661 MiB** | **11.723 MiB** |

M1/구조/paged 시험 **44/44**, 저장·교차 loader 시험 **6/6**을 통과했다. 전체 1/4/16일 재생도 이벤트 1,088개, 입력 181개, 상태·전체 save hash와 replay hash가 기존 statement-vector bundle과 일치했고 원본 digest도 유지됐다. Node forced-GC 단독 표본일 뿐 브라우저 heap이나 iPhone RSS가 아니며, 다른 ERA corpus 검증 전 제품 엔진에는 적용하지 않는다. 현재 게임 16일 표본은 약 303.7MiB로 초기 220MiB 탐색 목표까지 약 83.7MiB가 남는다.

## 함수 static scope 지연 생성

기존 `VM.reset()`은 실행 여부와 관계없이 함수 이름별 `Map`, `LOCAL`/`LOCALS` cell, 비동적 `#DIM(S)` cell을 모두 만들었다. 별도 `engine-compact-ir-labels-lazy-slice-paged-statements-printform-static.mjs`는 함수 최초 진입 시 이를 생성한다. 동기 `getValue` 의미를 유지하기 위해 `VAR@FUNCTION` 명시 참조 대상은 reset 때 미리 준비하며, 실행 중 `RESETDATA`가 호출되면 활성 context의 scope도 다시 만든다. reset은 이전에 실행된 scope를 버리고, 재귀·동적 CALL은 기존 `pushContext` 경로에서 동일 scope를 재사용한다.

현재 게임 reset 직후 scope는 기존 **16,463개**에서 명시 참조 대상 **69개**로 줄었다. `LOCAL`/`LOCALS` cell은 32,936개에서 136개로 줄었고, reset 전용 격리 forced-GC 표본은 **28.784MiB**를 절감했다. 고정 경로에서 생성된 scope는 1일 235개, 4일 297개, 16일 297개였다.

| 지점 | compact PrintForm 기준 | lazy static scope | 추가 절감 |
| --- | ---: | ---: | ---: |
| 컴파일 | 272.641 MiB | **267.345 MiB** | 5.296 MiB |
| VM 시작 | 270.374 MiB | **265.090 MiB** | 5.284 MiB |
| 1일 | 301.142 MiB | **271.711 MiB** | **29.430 MiB** |
| 4일 | 302.708 MiB | **273.391 MiB** | **29.317 MiB** |
| 16일 | 303.660 MiB | **274.301 MiB** | **29.359 MiB** |

M1/구조/paged/신규 static 시험 **46/46**, 저장·교차 loader **6/6**을 통과했다. 1/4/16일 이벤트 1,088개, 입력 181개, 의미 상태와 전체 저장 엔트리 hash도 기준과 일치했다. 기존 replay hash는 scope cell 개수를 상태 진단에 포함하므로 표현이 다른 두 엔진의 의미 비교에는 사용할 수 없다. 이 수용 시험은 그 구조 진단만 상태 hash에서 제외했으며 replay hash는 `01e88827cbef1f11eea58d50a2e3a5078e1e2c32b6bc37259dd6cd837a6d0259`였다. 16일 표본은 약 274.3MiB로 220MiB 탐색 목표까지 약 54.3MiB가 남는다. 브라우저·iPhone 및 다른 ERA corpus 검증 전 제품 엔진에는 승격하지 않는다.

## Assign 빈 payload slot 실험

`Assign` 109,513개는 컴파일 직후 `raw` 외에 값이 `undefined`인 `inner` own-property를 모두 보유하고, 최초 실행 때만 같은 필드에 타입별 inner statement를 만든다. 별도 `engine-compact-ir-labels-lazy-slice-paged-statements-printform-static-assign.mjs`에서 class field 선언만 생략해 실행 전에는 slot을 만들지 않고 최초 실행 동작·typed inner·raw 오류 위치는 그대로 유지했다.

| 지점 | lazy static 기준 | Assign 실험 | 추가 절감 |
| --- | ---: | ---: | ---: |
| 컴파일 | 267.344 MiB | **266.508 MiB** | 0.837 MiB |
| VM 시작 | 265.090 MiB | **264.254 MiB** | 0.836 MiB |
| 1일 | 271.709 MiB | **270.908 MiB** | 0.801 MiB |
| 4일 | 273.388 MiB | **272.595 MiB** | 0.793 MiB |
| 16일 | 274.290 MiB | **273.495 MiB** | 0.794 MiB |

M1/구조/paged/static/fixture **46/46**, 저장·교차 loader **6/6**과 1/4/16일 의미·전체 저장 hash 비교를 통과했고 replay hash는 `01e88827cbef1f11eea58d50a2e3a5078e1e2c32b6bc37259dd6cd837a6d0259`로 일치했다. 다만 절감이 1MiB 미만이므로 Assign inner statement나 expression tree를 더 복잡하게 재표현하지 않고 이 실험에서 중단한다. 220MiB 탐색 목표까지는 약 53.5MiB가 남으며 다음 후보는 수량이 비슷하지만 컨테이너가 더 큰 `If` payload의 shape/retained 비용 측정이다.

## 재현

```powershell
npm --prefix tools/web-engine-probe run test:m1-harness
npm --prefix tools/web-engine-probe run profile:m1
npm --prefix tools/web-engine-probe run profile:m1-ownership
npm --prefix tools/web-engine-probe run profile:compact-ir
npm --prefix tools/web-engine-probe run test:paged
npm --prefix tools/web-engine-probe run profile:paged
npm --prefix tools/web-engine-probe run profile:paged-direct
npm --prefix tools/web-engine-probe run profile:paged-browser
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

두 번째 명령은 두 개의 격리된 Node 프로세스를 순차 실행하고 `tools/web-engine-probe/results/scalable-runtime-baseline.json`을 새로 쓴다. 세 번째 명령은 소유권 그룹별 격리 프로세스를 실행하고 `tools/web-engine-probe/results/m1-ownership-profile.json`을 새로 쓴다. 네 번째 명령은 기본/PRINT/PRINT+label/PRINT+label+Lazy/PRINT+label+Lazy+Slice/최종+paged-storage bundle을 각각 격리 실행해 `compact-function-ir-profile.json`을 쓴다. `test:paged`는 base `Array`와 paged Proxy의 의미 동일성(1/2/3D·문자열/BigInt·길이 증감·page 회수·iterator mutation·backing 직접 접근)을 검증한다. `profile:paged`는 Node 승격 전 전체 저장소 판정을 `paged-default-array-profile.json`에, `profile:paged-direct`는 Cell get/set 합성 판정을 `paged-direct-access-profile.json`에, `profile:paged-browser`는 설치된 Chromium/WebKit 격리 판정을 `paged-default-array-browser-profile.json`에 쓴다. `profile:compact-statements`와 `verify:compact-statements`는 statement vector의 컴파일 heap과 16일 의미 동일성을 기록한다. `profile:statement-payloads`는 statement 종류·shape·직접 payload를 `statement-payload-profile.json`에 기록하고, `profile:compact-printform`과 `verify:compact-printform`은 PrintForm wrapper 절감과 1/4/16일 의미 동일성을 각각 `compact-printform-payload-profile.json`, `compact-printform-payload-acceptance.json`에 기록한다. `profile:lazy-static`과 `verify:lazy-static`은 reset scope 수·heap 및 1/4/16일 scope 성장·의미 동일성을 `lazy-static-scope-profile.json`, `lazy-static-scope-acceptance.json`에 기록한다. `profile:compact-assign`과 `verify:compact-assign`은 실행 전 빈 slot 절감과 동일한 의미 비교를 각각 `compact-assign-payload-profile.json`, `compact-assign-payload-acceptance.json`에 기록한다. 성공은 이 고정 경로의 결정성과 계측 생성 성공을 뜻하며 대형 게임 지원이나 iPhone 4일차 종료 해결을 뜻하지 않는다.