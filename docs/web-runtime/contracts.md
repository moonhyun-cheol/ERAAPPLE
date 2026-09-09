# 패키지·엔진·저장 계약 v1 초안

[개요](README.md) · [구조](architecture.md) · [검증 계획](validation-plan.md)

아래 계약은 구현 기준이며 구현된 API가 아니다. JSON Schema/TypeScript 타입/프로토콜 검사기는 구현 단계에서 이 문서를 기준으로 추가한다.

## 1. 독립적으로 버전 관리할 것

| 이름 | 의미 | v1 처리 |
| --- | --- | --- |
| manifestVersion | 게임 메타데이터 구조 | 정수 1만 수락, 다른 버전은 마이그레이션 전 실행 거절 |
| runtimeApi | Host ↔ adapter 메시지 의미 | 양쪽 지원 버전의 교집합 필요. 초기에는 1만 지원 |
| engineVersion / buildDigest | 실제 등록 엔진 릴리스 / 바이트 해시 | 설치 시 정확한 빌드로 고정, 자동 대체 금지 |
| compatibilityProfile | 게임 언어/설정의 호환 프로필 | 이름만 맞아도 통과하지 않음. probe 결과가 필요 |
| packageDigest | 게임 파일 집합의 내용 주소 | 동일한 표시 버전이어도 내용이 다르면 다른 revision |
| saveFormat / saveVersion | 엔진 저장 데이터 형식 | 엔진 버전과 별개. adapter의 읽기 지원표 검사 |
| storageSchemaVersion | 실행기 IndexedDB 구조 | 게임 VM 저장 포맷과 별도 마이그레이션 |

## 2. 게임 매니페스트

[package.example.json](package.example.json)은 형식 설명용이다. `engine.id=emuera`와 `compatibilityProfile=emuera-1818-kr3-candidate`는 **아직 등록/검증되지 않은 설계상 ID**다. 이 예시만으로 실행할 수 없다.

v1 필수 필드:

| 필드 | 형식/검증 |
| --- | --- |
| manifestVersion | 정수 1 |
| gameId | `[a-z0-9][a-z0-9._-]{0,127}`. 논리적 이름, 저장 권한 아님 |
| title | 비어 있지 않은 일반 텍스트, 최대 200자 |
| gameVersion | 비어 있지 않은 문자열, 최대 64자. SemVer를 강제하지 않음 |
| engine | id(동일 ID 규칙), runtimeApi(1), compatibilityProfile(동일 ID 규칙) |
| requiredCapabilities | 중복 없는 문자열 배열. 등록 descriptor와 비교. 모르는 필수 기능은 실패 |
| content.roots | ZIP 래퍼 제거 후 상대 디렉터리 경로의 비어 있지 않은 배열 |
| content.configFiles | 상대 파일 경로 배열 |
| content.encoding | default(null 또는 허용 인코딩 label), overrides(경로→label), requireConfirmation(boolean) |
| permissions | v1은 정확히 network=false, nativeExecution=false |

v1은 알 수 없는 필드를 기본 거절한다. 경로는 `/`로 구분된 NFC 정규화 상대 경로이고 빈 세그먼트, `.`, `..`, 선두 `/`, `\\`, 드라이브 표기를 금지한다. 원래 경로는 별도 인덱스에 보존한다. Emuera 프로필은 case-folded 조회 충돌도 거절한다. 이 정책은 원래 게임의 파일 정렬 의미를 대신하지 않으며 실제 로딩 정렬은 프로필 시험으로 확정한다.

`content.encoding.default=null`이면 모든 대상 텍스트 파일에 대해 BOM/검사/사용자 선택으로 유효한 해석이 확정되어야 실행 가능하다. `requireConfirmation=true`일 때 가져오기 승인 기록을 로컬에 남긴다. 해석되지 않은 파일이 있으면 `encoding-unresolved` 상태다. 원본 바이트에 디코딩 결과를 덮어쓰지 않는다.

### 원본 ZIP 지원과 설치 레코드

- 매니페스트가 없으면 importer가 루트/CSV 게임 정보를 읽어 동일 구조를 제안한다. 원본 게임에 매니페스트 추가를 요구하지 않는다.
- 패키지 안의 매니페스트도 신뢰하지 않는다. 호스트가 검증한 뒤 데이터 허용 목록과 실제 파일을 대조한다.
- `libraryEntryId`는 호스트가 생성하는 무작위 UUID. 동일 gameId 재가져오기를 기존 저장에 연결할지는 사용자에게 확인한다. 새 설치가 다른 게임의 namespace를 자동 획득하지 않는다.
- 정규화 경로별 `{path, size, sha256}` 인덱스를 생성한다. size는 실제 바이트 수, sha256은 원본 파일 바이트의 소문자 hex다.
- packageDigest는 path의 UTF-8 바이트 사전순으로 정렬한 `[path,size,sha256]` 배열들의 compact JSON(UTF-8, BOM 없음)의 SHA-256이다. 입력 메타데이터가 아니라 **실제로 채택한 파일 전체**로 계산한다. 격리된 실행 파일과 매니페스트 자체는 제외한다.
- 인코딩·정렬·프로필 등 확정된 해석 설정은 별도 `configRevision`으로 고정한다. 내용 해시가 같아도 해석 설정이 바뀌면 세이브 호환을 재검사한다.
- 로컬 설치 레코드는 libraryEntryId, manifest, packageDigest, configRevision, fileIndex, resolvedEncodings, engineLock(id/version/buildDigest/profile), readyState, 진단 보고서를 가진다.

## 3. 등록 엔진 descriptor

필수: id, engineVersion, buildDigest, runtimeApiVersions, compatibilityProfiles, capabilities, saveFormats(read/write 버전), 라이선스 및 출처 메타데이터. Worker 자산 경로와 asset digest 목록은 실행기 빌드 시 고정한다. 사용자 패키지가 제공한 URL로 동적 import하지 않는다.

초기 capability 이름:

- `render.text.v1`: append/replace-last/clear, 색·정렬·고정 폭 블록
- `input.choice.v1`, `input.integer.v1`, `input.text.v1`, `input.continue.v1`
- `storage.slots.v1`, `storage.global.v1`
- `session.checkpoint.v1`는 선택 기능. 이 기능이 없으면 자동 재개 위치를 보장하지 않음

프로필별 `probe`는 unsupported/partial/compatible 중 하나와 파일·행·명령별 진단을 반환한다. partial은 실험 모드일 뿐 일반 실행 가능 표시가 아니다. 정적 검사 통과만으로 전체 게임 호환을 인증하지 않는다. 호환 등급과 실제 시험 범위를 함께 기록한다.

## 4. Host ↔ Worker 프로토콜

모든 메시지는 `{protocol:1, sessionId, messageId, type, payload}`를 갖는다. 요청 응답은 `replyTo`를 추가한다. 세션 ID는 호스트 생성값. 알 수 없는 세션/타입/프로토콜, 중복 응답, 허용 상태 밖 메시지는 거절하고 진단한다. 함수/DOM 객체/임의 HTML은 payload에 허용하지 않는다. 메시지별 바이트/목록 수 상한을 설정한다.

| 방향/이름 | 의미 |
| --- | --- |
| Host → init | 고정 engineLock, 읽기 전용 파일 인덱스, 확정 설정 전달 |
| Worker → initialized | 협상된 API/capability와 초기화 결과 |
| Host → probe / Worker → probe-result | 파싱 및 기능/저장 형식 검사, 아직 게임 실행 안 함 |
| Host → start | 신규 게임 또는 검증된 저장 revision으로 시작 |
| Worker → render | 순서 번호가 있는 텍스트/선택지 변경 batch |
| Host → render-ack | 반영한 마지막 순서 번호. 미승인 큐가 상한을 넘으면 VM yield |
| Worker → input-request | requestId, kind(choice/integer/text/continue), 제약/선택지 token |
| Host → input-response | 동일 requestId와 kind에 맞는 값. 한 요청당 한 번만 소비 |
| Worker → file-read / Host → file-result | 허용된 패키지 상대 경로와 offset/length로 바이트 요청. namespace 변경 불가 |
| Worker → storage-request / Host → storage-result | 아래 저장 연산. 커밋/오류 결과가 올 때까지 해당 VM 연산 대기 |
| Host → pause / Worker → paused | 안전 지점 정지. 체크포인트 지원/불가를 명시 |
| Host → resume | 중지 상태에서만 재개 |
| Host → stop / Worker → stopped | 안전 종료, 제한 시간 초과 시 terminate |
| Worker → heartbeat / error | liveness 및 구조화 오류(code/file/line/recoverable) |

정수 입력은 정밀도 손실 방지를 위해 10진 문자열로 전달하고 엔진이 범위를 검사한다. JS Number의 53비트 한계를 Emuera 정수 의미에 적용하지 않는다. 64비트/overflow/division/RAND의 정확한 의미는 엔진 fixture에서 확정한다. BigInt/WASM i64를 쓰더라도 JSON에는 문자열로 직렬화한다.

세션 상태: `created → initializing → probing → ready → running ↔ awaiting-input`, `running/awaiting-input → pausing → paused → 이전 상태`, 실행 상태에서 `stopping → stopped`. 복구 불가능 오류는 `failed`. loading/saving은 별도 in-flight 작업 상태로 입력/VM 실행을 차단한다. requestId가 다른 오래된 버튼이나 중복 탭은 VM에 전달하지 않는다.

## 5. 저장 계약

### 범위와 키

호스트가 저장 컨텍스트 `(libraryEntryId, saveBranchId)`를 세션에 바인딩한다. saveBranchId는 호스트 생성 UUID이며 엔진/포맷/패키지 호환 메타데이터를 가진다. gameVersion을 키에 바로 넣어 매 업데이트마다 저장이 사라지게 하지 않는다.

레코드 키는 `(libraryEntryId, saveBranchId, scope, recordId)`:

- `slot`: 수동/자동 저장 슬롯. 슬롯 번호/상한은 adapter가 결정한다.
- `global`: LOADGLOBAL/SAVEGLOBAL 대상. 새 게임/슬롯 로드 시 임의 초기화 금지.
- `settings`: 게임별 사용자 설정. 실행기 공통 UI 설정과 분리한다.
- `checkpoint`: 선택적 VM 재개 상태. 일반 세이브와 구분한다.

### 연산과 원자성

`storage-request`는 op(list/read/commit), requestId, op별 scope/recordId 또는 changes를 가진다. commit은 `{expectedRevision, changes:[put/delete...]}`와 각 put의 opaque bytes, saveFormat, saveVersion을 받는다. scope/recordId 형식·용량은 호스트가 검사한다. 클라이언트가 다른 libraryEntryId를 전달할 수 없다.

- 한 commit의 변경/해시/메타데이터/revision 증가는 **같은 IndexedDB 트랜잭션**이다. 바이트 검증과 해시 계산은 트랜잭션을 열기 전에 끝내고, 트랜잭션 안에서는 외부 비동기 작업을 기다리지 않는다. 트랜잭션 완료 후에만 성공을 응답한다. 권한/용량/취소 오류는 VM에 실패로 돌아가며 저장됨 표시 금지.
- 각 게임 저장 명령의 순서를 유지한다. 별개의 SAVEGLOBAL/SAVEDATA 호출을 근거 없이 한 동작으로 합치지 않는다. 논리적으로 일관된 체크포인트/전체 백업은 VM 안전 지점에서 모든 in-flight I/O가 끝난 후 취한다.
- 같은 세이브 브랜치는 단일 writer다. Web Locks는 지원 시 사용하고, 미지원 시 IDB lease + fencing token + expectedRevision을 같은 쓰기 트랜잭션에서 검사한다. 두 탭 경합 시 후발 탭은 읽기 전용/인계 안내. 만료된 writer의 늦은 쓰기는 거절한다.
- 각 레코드 메타데이터: saveFormat/version, engineId/version/buildDigest/profile, packageDigest/configRevision, revision, 저장 시각, payload SHA-256. checksum은 손상 검출용이지 인증 수단이 아니다.
- 강제 종료/저장 실패 후에는 마지막 성공 revision만 읽는다. 저장 중 종료해도 기존 정상 데이터를 보존해야 한다.

### 업데이트/가져오기/백업

백업은 독립 ZIP이며 `backup.json`(backupVersion=1, 게임/엔진/브랜치 메타데이터, scope별 파일 목록·크기·해시)과 opaque payload 파일로 구성한다. 슬롯만이 아니라 GLOBAL/설정도 포함한다. 체크포인트는 빌드 고정 의존성과 함께 별도 표시한다. 기본 백업에 게임 본문은 포함하지 않는다.

- 내보내기: VM 안전 지점 → 저장 flush → 일관된 revision snapshot → ZIP → 사용자 동작에서 파일 저장/지원 시 공유. iPhone 파일 앱에서 실제 다시 선택할 수 있는지 시험한다.
- 가져오기: 임시 검증 → 버전/엔진/게임 후보 확인 → 새 브랜치 생성 → commit. 기존 저장 자동 덮어쓰기 금지. 알려지지 않은 형식은 원본 보관/진단만 하고 실행하지 않는다.
- 게임/엔진 업데이트: 기존 branch를 보존하고 호환성 표로 직접 로드 가능 여부 확인. 변환은 새 branch에 쓰고 재로드 검증 후 전환한다. 실패하면 기존 branch로 돌아간다.
- PC `.sav`와 GLOBAL 형식은 아직 검증하지 않았다. adapter별 import/export 변환기가 왕복 시험을 통과한 형식만 지원으로 표시한다. 웹 백업 ZIP을 기존 PC 세이브와 같다고 부르지 않는다.
