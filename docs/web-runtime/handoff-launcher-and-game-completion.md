# 세션 인수인계 — #4 확장형 런처 & 미완성 게임 완성

> 다음 작업자(사람/AI)가 처음부터 재조사 없이 이어받기 위한 문서.
> 코드 수정 전 관련 파일을 read_file로 다시 확인할 것. 서술은 이전 세션 기록 기반이며
> 이번 작성 시 모든 파일을 재검사하지는 않았다.

---

## 0. 지금까지 (완료·검증됨)

- iPhone Safari 실행 + 홈 화면 추가 + 오프라인 실행 (사용자 확인)
- 게임 저장·불러오기 (사용자 확인)
- 세이브 백업·복원 구현 (실기기 파일앱 왕복은 미확인)
- 번들 gzip 압축: 61 MiB → 11 MiB
- `.gz` 전송압축 오해로 인한 무결성 실패 → `local-game.bin`(octet-stream)으로 수정
- 고정 HTTPS 호스팅: https://moonhyun-cheol.github.io/ERAAPPLE/ — 실행 확인됨
- 게임 시작 파싱 피크 메모리 절감: NDJSON 스트리밍 파싱 (커밋 9e46ac8, release cd782249b311da757479)

배포: main push → .github/workflows/deploy-pages.yml → GitHub Pages 자동 배포.
산출물: tools/web-engine-probe/pwa-dist/

---

## 1. #4의 목표 — 두 층위

### (A) 확장형 게임 런처 (인프라)
현재 게임 1개(eraTHYMKR)를 단일 번들로 고정 탑재. 목표는 여러 게임 지원:
- 게임 라이브러리 화면(목록·선택·삭제)
- 게임 ZIP 가져오기(파일 앱에서 .zip 선택 → 설치)
- 패키지 manifest 검증(id, 이름, 엔진, 자산목록, 무결성)
- 게임별 저장 격리 — 설계상 (libraryEntryId, saveBranchId) 키 존재 (contracts.md)
- 엔진 어댑터 선택(eraJS 외 엔진 추가 가능)
- 첫 편입 대상: "에라마왕 개조판 1.28" (현재 inventory.mjs excludes로 스캔 제외)

먼저 읽을 설계 문서:
  docs/web-runtime/architecture.md
  docs/web-runtime/contracts.md
  docs/web-runtime/package.example.json
  docs/web-runtime/validation-plan.md
관련 구현:
  tools/web-engine-probe/build-pwa.mjs   (번들 생성 — 다중 게임화 대상)
  tools/web-engine-probe/inventory.mjs   (스캔·무결성)
  tools/web-engine-probe/engine-worker.mjs (엔진 실행·번들 로드)
  tools/web-engine-probe/browser-store.mjs (IndexedDB 저장)
  tools/web-engine-probe/browser.mjs / index.html (UI)

### (B) 미완성 게임 콘텐츠 완성 (창작)
게임 자체가 미완성. 사용자는 창작 방향 잡기를 어려워함 → AI가 구체안 제시.
코드가 아니라 ERB 스크립트 + CSV 데이터 콘텐츠 작업:
  ERB/*.ERB   게임 로직/텍스트(Emuera 스크립트)
  CSV/*.CSV   캐릭터/능력치/아이템 데이터
  docs/autoetd-event-map.md, docs/autoetd-event-links.json  이벤트 연결 참고

주의: CC BY-NC-ND (NOTICE.md). 2차 창작·배포는 권리자 허락 전제(사용자가 허락받음).
출처 표기는 실행판 index.html에 삽입됨.

---

## 2. 다음 세션 착수 순서

1. 범위 확정: (A) 런처 인프라 vs (B) 게임 콘텐츠 중 무엇부터인지 사용자에게 확인.
2. (A)면: architecture.md + contracts.md 정독 → build-pwa.mjs를 단일→다중 게임
   manifest 기반으로 리팩터 → ZIP import UI → 저장 격리 검증.
3. (B)면: §3 프롬프트를 출발점으로, 먼저 미완성 지점 인벤토리(미구현 이벤트·TODO·
   끊긴 분기)를 search_files로 조사 후 사용자와 방향 합의.

---

## 3. 게임 완성 프롬프트 (사용자 요청)

> "창의력이 부족하니 네가 완성시키는 프롬프트를 써달라"는 요청.
> 다음 세션 첫 메시지로 아래를 그대로 붙여 쓴다. [대괄호]만 채운다.

### 3-1. 붙여쓰는 지시 프롬프트

너는 eraTHYMKR(에라 계열 텍스트 시뮬레이션 게임)의 공동 개발자다.
이 게임은 미완성이고, 나는 창작 방향을 잡는 걸 어려워한다.
너는 창의적 게임 디자이너이자 ERB/CSV 구현자 역할을 동시에 맡는다.

[게임 성격]
- Emuera 스크립트(ERB) + CSV 데이터로 동작하는 텍스트 육성/조교 시뮬레이션.
- iPhone 웹(PWA)로 이식돼 https://moonhyun-cheol.github.io/ERAAPPLE/ 에서 돈다.
- 라이선스 CC BY-NC-ND, 2차 창작 허락 받음. 비상업.

[내가 원하는 것]
1. 먼저 이 게임에서 "미완성/빈 곳"을 조사해 목록으로 보여줘.
   - ERB 안의 미구현 이벤트, 끊긴 분기, TODO/仮(임시) 표시, 호출되지만 비어있는
     함수, CSV에 정의됐지만 이벤트가 없는 캐릭터/아이템/능력치 등.
   - 실제 파일을 read/search로 확인하고 경로·줄을 근거로 제시할 것. 추측 금지.
2. 그 목록으로 "완성 로드맵"을 우선순위와 함께 제안해줘.
   - 각 항목: 무엇을/왜/어느 파일에/난이도(작음·중간·큼)·기존 시스템과의 정합성.
3. 내가 항목을 고르면, 네가 창의적으로 구체안(이벤트 흐름·텍스트·분기·수치)을
   먼저 제시하고, 내 확인 후 실제 ERB/CSV에 구현한다.
4. 구현 후 반드시:
   - 기존 캐릭터/능력치/플래그와 충돌하지 않는지 확인,
   - 무결성 baseline·PWA 빌드 영향 있으면 재빌드·재검증,
   - 게임 내 도달 가능 경로인지(어떤 조건에서 뜨는지) 설명.

[창작 톤·제약]
- 기존 세계관·문체·캐릭터 성격을 먼저 파악하고 맞춰라. 이질적 설정 금지.
- [원하는 분위기: 밝은/다크/코미디/진지 — 채우기]
- [수위·표현 범위: 채우기]
- [절대 넣지 말 것: 채우기]
- 한 번에 큰 변경 대신, 작고 완결된 단위로 하나씩 완성·검증.

먼저 1번(미완성 지점 조사)부터 시작해줘.

### 3-2. 이 프롬프트를 쓰는 이유
- "완성"하려면 먼저 무엇이 비었는지 근거 기반 조사가 선행돼야 한다. 아이디어만
  쏟으면 기존 시스템과 어긋나 버그·모순이 생긴다.
- 사용자의 약점(창작 방향)은 AI가 "구체안 제시 → 승인 → 구현" 루프로 보완.
  사용자는 취향 판정(고르기)만 하면 된다.
- ERB/CSV는 플래그·캐릭터 번호·능력치 인덱스로 강하게 얽혀 있어 기존 정의를
  읽고 정합성을 지켜야 한다.

---

## 4. #3에서 남은 항목 (미완, 참고)

- 큰 정수 9007199254740993 → …992: eraJS가 수치를 JS number로 다루는 상위 엔진
  한계. BigInt 전환은 벤더 엔진 대공사 — KNOWN DEFECT로 유지.
- 회전/백그라운드/OS 종료 복구, 다양한 이벤트·특수 저장: 실기기 신호 있어야 대응.
- PC .sav ↔ 웹 백업 호환: 조사 과제.
- 게임 시작 직후 크래시: NDJSON 스트리밍으로 완화, 실기기 재확인 필요.

---

## 5. 절대 하지 말 것 (누적 안전 규칙)

- "사이트 데이터 삭제"를 해결책으로 안내 금지 (세이브 소멸).
- 무결성 baseline(원본 1,151개) 오염 금지. 새 게임·CI 파일은 inventory.mjs
  excludes로 스캔 제외하고 baseline 재생성은 하지 말 것.
- 없는 URL·터널 상태 지어내기 금지. 실기기·계정 작업은 사용자 몫임을 명시.
- 백신 비활성화·광범위 예외 전제 금지.
