# 에라마왕 개조판 1.28 — 콘텐츠 갭 실측 결론

원본: `eramaou128-content-gap.json` (read-only 정적 분석, 원본 ERB/CSV 무변경)

## 실측 수치
- ERB 파일: 274개, 정의된 함수: 2019개
- **undefinedCallJump = 0** — 존재하지 않는 함수를 CALL/JUMP하는 끊긴 배선 없음
- **deadLabel = 0** — 대상 없는 GOTO/TRYGOTO 없음
- orphanFunction = 740 (해석 필요, 아래 참조)
- dynamicDispatch: CALLFORM 3건 (`TRYCCALLFORM MAOUDIC_ITEM_{RESULT}`, `MAOUDIC_TRAP_/RING_/ROOM_/TALENT_`)
- numberedFamilyGaps: `ABLUP unwired=[5,6,7,8,9]`, `EQUIP_COM unwired=[200]`

## 오탐 판정 (primary source 교차검증)
1. **orphan 740개 중 361개 = MAOUDIC_* 계열**: 정적으로는 CALL 참조가 없지만
   `TRYCCALLFORM MAOUDIC_ITEM_{RESULT}` 등 동적 디스패치로 실제 호출됨. 갭 아님.
2. **ABLUP 5~9**: `CSV/ABL.CSV`에 능력 5~9 자체가 미정의(0~4 다음 10으로 점프),
   `@SHOW_ABLUP_SELECT`가 `SIF COUNT>=4 && COUNT<=9 -> CONTINUE`로 의도적으로 스킵.
   -> 만들다 만 게 아니라 설계상 빈 슬롯. 갭 아님.
3. EQUIP_COM 200: 특수 인덱스, 동일하게 의도적으로 판단.

## 결론
- 이 게임은 코드 배선이 끊긴(유형 A/B) 미완성이 거의 없다. 엔진 관점에서 깨끗함.
- 사용자가 느끼는 "비어있음"은 대부분 유형 D — 서사/이벤트 본문 텍스트의 얇음/자리표시자일 가능성이 높다.
- 다음 단계는 "배선 수리"가 아니라 어떤 이벤트/스토리 본문을 채울지 콘텐츠 우선순위 결정이다.
