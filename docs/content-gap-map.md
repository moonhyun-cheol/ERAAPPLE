# 에라마왕 개조판 1.28 — 콘텐츠 빈자리 지도 (진행 체크리스트)

> 목적: "배선(CALL/JUMP)은 깨끗하고, 미완성 = 틀은 있으나 대사·서술 미작성" 이라는 실측 결론을 바탕으로,
> 어디를 누가 채워야 하는지 추적하는 살아있는 문서. 수치는 **검증 기준**을 명시한다.
> - `실측(이번)` = 이 문서 작성 세션에서 직접 재측정한 값
> - `직전스캔` = 이전 세션의 content-gap 도구 산출값 (아직 이번 세션 재검증 전)

## 0. 담당 분담 규칙
- **AI(나) 담당**: 이벤트/아이템/특성 설명, 비성적 서술·연출(석화·처형연출·감정반응·전투기능 설명 등), CSV 기반 번역.
- **사용자 담당**: 노골적 성묘사 본문(삽입·사정·능욕·스캇·고어 등).
- 원작(eraTHYMKR) 무결성은 유지. 1.28은 편집 가능한 콘텐츠 fork로 취급(ERB/CSV 직접 수정 허용).

## 1. 오탐으로 판명된 것 (채울 필요 없음)
- **ENDING.ERB "빈 슬롯"**: 대부분 여백 라인 오탐. 정의부/호출부 1:1 대조 결과 `ENDING_6~9`는 설계상 빈 번호(dead numbering)이며 호출 경로 0건 → 자리 생성 불필요.
- **MAOUDIC.ERB 아이템/함정/반지/시설 사전**: 이미 완성. (공백은 전부 특성 섹션 — 3장 참조)

## 2. 캐릭터 조교 이벤트 (진짜 대량 공백, 대부분 사용자 담당)
`직전스캔` 기준 파일별 빈 PRINTFORM 자리:

| 파일 | 캐릭터 | 빈자리 | 비고 |
|---|---|---:|---|
| EVENT_K14_貴公子 | 貴公子 | 942→886(실측,이번) | 비성적(MUSEUM/처형/각인/감정) 채움 진행. 나머지는 성묘사 본문 |
| EVENT_K13_庇護者 | 庇護者 | 547→(비성적 19자리 채움) | MUSEUM 8·EXUCUTION 3·BANISHMENT 4·PUBLIC_EXUCUTION 魂粉砕 1·OSIOKI 3 완료. COLOSSEUM/MARKCNG 라벨 없음, PALAMCNG 기존 작성됨. 나머지 성묘사 본문·GROTESQUE는 사용자 |
| EVENT_K12_知的 | 知的 | 310 | 비성적 11자리 완료(EXUCUTION1·MUSEUM5·BANISHMENT4·PUBLIC_EXUCUTION1); PALAMCNG 기충족·GROTESQUE 보류 |
| EVENT_K11_リリィ | 리리(마오의 언니, 헌신적 마을 처녀) | 297→273(실측,이번) | 비성적 24자리 완료(MUSEUM 9·EXUCUTION 3[肉便器 제외]·BANISHMENT 5·PUBLIC 2[絞首·魂粉砕]·OSIOKI 5). 나머지 성묘사 본문·GROTESQUE는 사용자 |
| EVENT_K2_気弱 | 気弱(소심·겁많음) | 204 | 비성적 12자리 완료(EXUCUTION 記憶消去1·MUSEUM 6[밀랍/금속/얼음/보석/가구/회화]·BANISHMENT 4·PUBLIC 魂粉砕1). MARKCNG·COLOSSEUM·PALAMCNG 기작성됨. 남은 최상위 빈 PRINTFORMW 7=GROTESQUE(사용자). 나머지 성묘사 본문 사용자 |
| EVENT_K10_クラブ | 클럽(후타나리 마법사, 조용·和姦, 마술 자부심) | 196 | 비성적 14 완료(EXUCUTION1·MUSEUM8·BANISHMENT4·PUBLIC 魂粉砕1). 잔여=GROTESQUE7(사용자) |
| EVENT_K7_ハート | 하트(정중한 무대 배우형, "제가/…습니다") | 196 | 비성적 14 완료. 잔여=DUNGEON_RYOUZYOKU4·GROTESQUE7(사용자) |
| EVENT_K8_スペード | 스페이드(자존심·복수심) | 187 | 비성적 14 완료. 잔여=GROTESQUE7 |
| EVENT_K9_ダイヤ | 다이아(전사형) | 185 | 비성적 14 완료. 잔여=GROTESQUE7 |
| EVENT_K1_自信家 | 自信家(오만·부정, SELF_CALL 3인칭) | 165 | 비성적 12 완료(MUSEUM 6슬롯). 잔여=SELF1·GROTESQUE7 |
| EVENT_K4_冷徹 | 冷徹(냉철·태연) | 154 | 비성적 12 완료. 잔여=SELF1·GROTESQUE7 |
| EVENT_K6_悪女 | 悪女(악녀·저주, SELF_CALL 3인칭) | 131 | 비성적 12 완료. 잔여=GROTESQUE7 |
| EVENT_K3_高貴 | 高貴(고귀한 숙녀, "…예요/…어요") | 97 | 비성적 12 완료. 잔여=SELF1·GROTESQUE7 |
| EVENT_K5_マオ | 마오(유아적, 언니 찾음) | 64 | 비성적 14 완료. 잔여=DUNGEON_VICTORY2·GROTESQUE7 |
| EVENT_K0_慈愛 | 慈愛(자비·희망) | 44 | 비성적 12 완료. 잔여=SELF1·GROTESQUE7 |

### 각 K파일 내부 라벨 성격(공통 패턴)
- `KOJO_MESSAGE_COM_n` — 조교 커맨드별 대사. **성묘사 본문(사용자)**. 최대 덩어리.
- `DOG_KOJO_n` — 견화(牝犬) 조교 대사. 캐릭터당 약 160개 균일. **사용자**.
- `BENKI / SELF / RYOUZYOKU / GROTESQUE / NTR _KOUJO_Kn` — 성/고어 계열. **사용자**.
- `MUSEUM / COLOSSEUM / OSIOKI / MARKCNG / EXUCUTION / BANISHMENT / PUBLIC_EXUCUTION` — 연출·처형·각인. **AI(비성적)**.
- `KOJO_MESSAGE_PALAMCNG_n` — 파라미터 변동 반응. 감정(공포·수치)=AI, 생리(윤활·절정·처녀상실)=사용자.

### K14에서 이번까지 채운 비성적 섹션 (참고 템플릿)
MUSEUM(석화·박제 등) 10 · EXUCUTION 4 · BANISHMENT 4 · PUBLIC_EXUCUTION 2 · MARKCNG 8 · COLOSSEUM 6 · OSIOKI 5 · PALAMCNG 감정 2. → 다른 K파일도 동일 라벨을 같은 캐릭터 보이스 규칙으로 이식하면 됨.

## 3. MAOUDIC.ERB 특성 사전 (AI 담당, JP→KO 번역 작업) — `실측(이번)`
- 특성 블록 총 258개: **작성 71 / 공백 187** (작업 전 40/218 → 전투·속성 특성 31개 채움).
- 공백 187개의 출처 상태(TALENT.CSV 주석 기준):
  - **JP_DESC 다수**: CSV에 일본어 효과설명 존재 → 한국어 번역해 채우면 됨(근거 있음, 날조 아님).
  - **EMPTY_DESC 49**: CSV 주석도 공란(예: 몬스터 스킬 470~485 점액포획·재생·가속·브레스 등, 성격 160~174, 외형 300~324) → 출처 없음, 보류.
  - 기타 소수(이름/괄호 표기 불일치 등).
- **이번에 채운 31개(비성적 전투·속성)**: 전술·마술·법술·기습·파란피부·악마날개·악마꼬리·악마안·근육질·철벽·저주술·인술·선제·갈색피부·악마의각인·하얀피부·허약·마법내성·걸음빠름·애꾸눈·이마에눈·슬라임·촉수·소인체형·뿔·혼박·화염/얼음/번개/빛/어둠의능력자 (TALENT 240~264, 274~279).
- **남은 JP 번역 후보(비성적, 다음 배치)**: 직업(전사~커맨더, 200~220 · 육변기 제외), 지식(마계지식·마충지식), 칭호(조형왕/변기왕/처형왕/평화왕), 경우(보증인·초보자·마왕의그림자) 등.
- **사용자 판단 필요**: 감도/성벽 특성(음핵·음유·음호·음항·항시발정·성호·처녀봉인·이상임신체질·가슴임신·정소임신·육아의저주 등).

## 4. 시스템/기타 소량 공백 (`직전스캔`, 미검증)
MUSEUM 17 · DUNGEON 17 · LOVERS 13 · SYSTEM 10 · PASSOUT 6 · _DRAW_MAINMENU 6 · NTR 5 · 나머지 1~4개.
→ 상당수 여백 오탐 가능성. 채우기 전 파일별 재검증 필요(ENDING·MAOUDIC 전례).

## 5. 다음 액션 우선순위
- **[완료] 전 K파일 비성적 라벨 이식**: K0~K14 15개 전부 MUSEUM/EXUCUTION/BANISHMENT/PUBLIC(+K1x OSIOKI/MARKCNG/COLOSSEUM/PALAMCNG) 비성적 자리 이식 완료. 실측 재검증 결과 각 파일 잔여 최상위 빈 PRINTFORMW는 GROTESQUE·DUNGEON_RYOUZYOKU·SELF·DUNGEON_VICTORY(전부 성/고어=사용자)만 남음.
- **남은 AI 작업**: MAOUDIC 남은 비성적 JP 특성 번역 배치(직업·지식·칭호·경우) — 3장 참조.
- **재검증 대기**: 시스템 소량 공백 파일별 여백 오탐 제거(4장).
- **사용자 담당(대다수)**: KOJO_MESSAGE_COM·DOG_KOJO·BENKI·SELF·RYOUZYOKU·NTR·GROTESQUE 성묘사 본문.
