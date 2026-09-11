# 에라마왕 개조판 1.28 — "틀만 잡힌"(미작성 대사) 실측 결론

원본: `eramaou128-thin-body.json` (read-only 정적 분석, 원본 ERB 무변경)
프로브: `eramaou128-thin-body.mjs`

## 신뢰 신호 = "빈 출력문"(empty placeholder print)
`PRINTFORM/PRINTFORMW/PRINTS/...` 등 텍스트 출력 명령인데 **뒤 내용이 완전히 빈 줄**.
= "장면 뼈대·분기는 만들었지만 대사 텍스트는 안 씀". 원본 대조로 오탐 아님을 확인.

- 총 빈 출력문: **4101개**, 해당 함수 **409개** (전체 2210 함수 중)

## 오탐 구분(중요)
- 1차 히스토틱(printedChars 기반, skeletonFunctions)은 `KR_NAME`(이름처리 유틸),
  `NAMING`, `ESTIMATE_CHARA`(수치계산) 같은 **로직/룩업 함수**를 대량 오탐 → 참고용으로만 유지.
- `DOG_KOJO_10` 등은 printLines=160인데 printedChars=0 → **빈 PRINTFORMW 160개**가 진짜 갭.
  이 "빈 출력문" 지표가 실제 미작성을 정확히 잡음(원본 EVENT_K10/K14에서 육안 확인).

## 미작성 대사 집중 위치 (empty prints by file, 상위)
| 파일 | 빈 출력 | 성격 |
|---|---|---|
| EVENT_K14_貴公子 | 942 | 캐릭터14 조교 대사 대부분 미작성 |
| EVENT_K13_庇護者 | 547 | 〃 캐릭터13 |
| EVENT_K12_知的 | 310 | 〃 |
| EVENT_K11_リリィ | 289 | 〃 |
| MAOUDIC | 218 | 마왕 사전(던전 아이템/함정 등) 해설 |
| EVENT_K2/K10/K7/K8/K9/K1/K4/K6/K3/K5/K0 | 44~204 | 캐릭터별 조교 대사 |
| ENDING | 65 | 엔딩 텍스트 |

## 대표 미작성 함수 (top)
- `KOJO_MESSAGE_COM_14` (EVENT_K14:600) empty=530 — 커맨드별 조교 대사 디스패처, 분기·주석 완비/대사 공백
- `KOJO_MESSAGE_COM_13` (EVENT_K13:526) empty=298
- `DOG_KOJO_10..14, 1..9` — 각 캐릭터 수간 애무 이벤트, 분기당 대사 공백 (대부분 empty≈160)
- `BENKI_KOUJO_K*` — 변기 조교 대사
- `SELF_KOJO_K14` 등

## 결론
- **미완성의 정체 = 유형 C/D(서사 본문 미작성).** 배선/획득조건 버그가 아니라,
  **캐릭터별 조교/이벤트 대사가 뼈대만 있고 텍스트가 비어 있음**.
- 작업 단위: "캐릭터 1명(EVENT_Kn)" 또는 "대사 함수 1개(KOJO_MESSAGE_COM_n)"가 자연스러운 채움 단위.
- 우선순위 제안: 노출 빈도 높은 `KOJO_MESSAGE_COM_*`(평상시 조교 대사) → `DOG_KOJO_*`(수간) → 엔딩/MAOUDIC 순.
- 분기·조건·플래그 뼈대는 이미 완성돼 있으므로, 각 빈 `PRINTFORMW`에 **대사 텍스트만 채우면** 됨(구조 수정 불필요).
