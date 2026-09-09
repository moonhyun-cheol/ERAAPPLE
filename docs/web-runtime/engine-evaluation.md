# P0 웹 엔진 조사·검증 결과

[개요](README.md) · [합격 기준](validation-plan.md) · [검증 도구](../../tools/web-engine-probe/README.md)

## 결론

**실제 게임의 데스크톱 브라우저 최소 경로는 통과했다. 전체 P0 엔진 타당성 관문은 아직 미통과다.**

- `eraJS v0.7.0`을 **시험용 후보**로 사용한다. 제품 엔진으로 최종 선정한 것은 아니다.
- 실제 게임을 Worker에서 실행해 타이틀 → 새 게임 → 초기 설정 → 상점 메뉴 → 휴식 → 슬롯 0 저장 → 페이지 재로드 → 불러오기를 Edge에서 자동 검증했다. 저장 전후의 한국어 이름 `웹시험`과 낮→밤 상태가 복원됐다.
- 독립 ERB fixture도 데스크톱 Edge에서 한국어 입력 → 슬롯/GLOBAL 저장 → 페이지 재로드 → 값 복원에 성공했다.
- 큰 정수 숫자 입력은 정밀도 손실이 재현된다. 전체 명령·KR 확장 및 iPhone Safari는 인증하지 않았다.
- 게임 원본 1,151개는 변경하지 않았다. Windows 런처를 실행·개조·웹 배포하지 않았다.
- 후속으로 [정적 PWA 시험본](iphone-testing.md)을 추가했다. Edge 오프라인 모드, Windows WebKit 26 서버 종료 후 실제 게임 재로드·저장 복원·추가 슬롯 저장을 통과했다. WebKit 자동화 `setOffline(true)`의 재로드 내부 오류는 별도 미해결 항목이며 iPhone 실기기는 미검증이다.

## 후보 비교와 출처

공개 저장소를 실제 클론해 소스를 조사했다. 아래 커밋은 조사 대상의 고정 식별자다. 이름에 Web이 들어간다는 이유만으로 클라이언트 실행을 가정하지 않았다.

| 후보 | 실행 방식 / 권리 근거 | 이번 확인과 판단 |
| --- | --- | --- |
| [undercrow/eraJS](https://github.com/undercrow/eraJS) | JS VM. `LICENSE.md`: Undercrow MIT 조건 | 고정 커밋에 포함된 release JS를 esbuild로 Node/브라우저 번들 생성하고 실행했다. TypeScript 소스 전체 재빌드는 아님. 가장 작은 클라이언트 실험 대상으로 채택; KR 완전 호환 아님 |
| [undercrow/webera](https://github.com/undercrow/webera) | `package.json`: Preact UI, eraJS v0.7.0 의존, MIT 표기 | 독립된 두 번째 엔진이 아니라 eraJS를 사용하는 웹 UI 후보. 앱 전체 빌드는 미실행. 기존 UI 복사 대신 VM만 분리해 시험 |
| [wozpren/WebEmuera](https://github.com/wozpren/WebEmuera) | `WebEmuera.csproj`: Blazor WebAssembly, net7.0. 루트 MIT 파일은 저작권자/연도 자리표시자가 남음. README는 Emuera.EM+EE 기반이라고 명시 | 실제 `dotnet build` 시 .NET 8.0.422 SDK에서 `MSB3822` (`System.Resources.Extensions` 참조 누락), net7.0 지원 종료 경고. WASM 실행 검증 전. 리소스/프레임워크 보수 및 포함된 원본 엔진의 권리 조건 추가 확인 필요 |
| [ToDayL/CloudEmuera](https://github.com/ToDayL/CloudEmuera) | README: 자체 호스팅 서버/Docker, 게임 업로드·서버 세션. 자체 코드 Apache-2.0, 포함 엔진은 별도 조건 | 공개 클론/구조 조사 완료. 서버 없는 iPhone 오프라인 목표에는 그대로 사용할 수 없어 이번 실행 시험에서 제외. 빌드·게임 구동은 미실행 |
| [Riey/erars](https://github.com/Riey/erars) | Rust VM. `Cargo.toml`: GPL-3.0-or-later; LICENSE: GPLv3. README는 실험적 구현 및 네이티브 렌더러 설명 | 원본과 workspace 구성 조사 완료. README의 eraTHYMKR 성능 수치는 upstream 주장이지 이번 실측이 아님. 네이티브/WASM 빌드는 이번에 미실행. 브라우저 호스트 이식 비용과 GPL 배포 의무를 검토할 예비 후보 |

```text
undercrow/eraJS       fb487bceacd899a033db017ff0dff5bb3878d4a5
undercrow/webera      89dc6333fe8a1cbf787d9b88167a61ac21ec010b
wozpren/WebEmuera     ef30e9e188ee848c503ad38364feeec2b155e9f0
ToDayL/CloudEmuera    643c10d87ff8f53fe6a1326a1adb148c0ea316cc
Riey/erars            35435b92883990719fc26bf7f5f1941470bbd590
```

라이선스 표는 각 후보의 명시 내용과 추가 확인 필요성을 기록한 것으로, 이 게임이나 KR 런처 재배포 허가가 아니다. 의존 라이브러리 전체 고지·포함 엔진의 파일별 권리 검토는 공개 제품 배포 전 별도 관문이다. 시험 번들은 eraJS 라이선스를 함께 복사한다.

## 시험 결과와 범위

원시 결과: [Node/실제 게임](../../tools/web-engine-probe/results/probe.json), [독립 fixture 브라우저](../../tools/web-engine-probe/results/browser.json), [실제 게임 브라우저](../../tools/web-engine-probe/results/game-browser.json), [원본 해시 목록](../../tools/web-engine-probe/results/original-inventory.json).

| 시험 | 결과 | 의미 / 한계 |
| --- | --- | --- |
| 고정 release JS 번들 생성 | 성공 | Node ESM 및 브라우저 ESM. 커밋 불일치·엔진 추적 파일 변경이면 빌드 거절 |
| 독립 fixture 한국어 INPUTS, 정수 42 | 성공 | Node의 새 VM에서 슬롯과 GLOBAL, 문자열 값 복원 |
| 독립 fixture 브라우저 저장 후 페이지 재로드 | 성공 | Edge 152.0.4191.66, headless, IndexedDB에 `global.sav`, `save00.sav`. `RESTORED:42:브라우저 한글:77` 확인. 실제 IME/터치 시험 아님 |
| 큰 정수 INPUT | **결함 재현** | 입력 `9007199254740993` → 복원 `9007199254740992`. VM의 BigInt 사용만으로 입력 경계 정확성이 보장되지 않음 |
| 호스트 저장소 동기 실패·비동기 reject | 실패 전파 시험 | 저장 성공으로 처리하지 않도록 fixture host에서 Promise 완료를 기다림. 다중 파일 원자성·이전 저장 보존 시험 아님 |
| 알 수 없는 명령 | 실행 중 거절 | 지연 파싱이므로 `compile()` 반환 자체가 모든 ERB 명령 호환성 증거는 아님 |
| 실제 게임 타이틀 | Node에서 진입 | `SYSTEM_TITLE` 등록, 실제 타이틀 선택지 출력, 입력 대기 관측. 색·정렬/시각적 일치 인증 아님 |
| 실제 게임 새 게임 | Node에서 모드 선택까지 | 입력 `0` 후 `EVENTFIRST → SELECT_GAMEMODE`. 초기 설정 완료·대표 플레이·수동 저장은 미검증 |
| 실제 게임 불러오기 | Node에서 빈 슬롯 메뉴까지 | 입력 `1` 후 `SYSTEM_TITLE → LOADGAME_EX`. 저장된 게임 상태 복원 성공을 뜻하지 않음 |
| 실제 게임 브라우저 최소 경로 | **성공** | Edge 152 headless에서 초기 설정, 한국어 이름, 상점 메뉴, 휴식, 슬롯 0 저장, 페이지 재로드, 타이틀 불러오기 후 이름·밤 상태 복원 |
| 실제 게임 iPhone, PC 세이브 왕복 | 미실행 | 데스크톱 자동 시험을 실제 iPhone/PC 세이브 호환 인증으로 확대하지 않음 |

Node 테스트의 큰 정수 항목은 **알려진 잘못된 동작을 고정한 특성화 테스트**다. 테스트가 초록색이어도 해당 기능이 호환된다는 뜻이 아니다. 향후 엔진 수정 시 정답 기대값으로 바꾸고 경계값/오버플로 시험을 추가해야 한다.

### 브라우저에서 발견하고 보완한 문제

초기 시험용 localStorage는 독립 fixture의 `save00.sav`조차 용량 한도에 걸렸다. fixture를 작게 바꿔 숨기지 않고 IndexedDB로 교체했다. 호스트의 `setSavedata`는 비동기 저장 트랜잭션 완료를 기다리며 abort/reject를 엔진에 전달한다.

이 저장소는 **하나의 시험용 DB에 엔진 파일별 트랜잭션**만 제공한다. 제품 설계의 게임별 namespace, revision/lease, 슬롯+GLOBAL 원자 저장, 백업·복원, 중복 탭 방지는 아직 구현하지 않았다. 재로드 시험은 동일 브라우저 컨텍스트의 페이지 재로드이며 OS 강제 종료나 저장소 삭제 복구를 대체하지 않는다.

성공한 브라우저 시험 중 외부 요청과 page error가 없었고, 로컬 시험 서버는 원본 경로·설정·클론 경로 요청을 404로 거절했다. 서버는 `127.0.0.1`에만 바인딩하고 fixture와 실제 게임 JSON 경로를 제공한다. 후속 정적 PWA는 별도 `pwa-dist/`로 묶으며 manifest/캐시·업데이트 시험을 추가했다. 공개 배포 URL은 만들지 않았다. 상세 검증 구분과 WebKit 실패 항목은 [iPhone 시험 안내](iphone-testing.md)에 기록한다.

## 파일·설정 호환성

- 인벤토리: CSV 251, ERB 857, ERH 7, 설정 파일 3개. 게임 데이터는 메모리에서 디코딩하고 원본 바이트를 덮어쓰지 않는다.
- BOM UTF-16/UTF-8과 엄격한 UTF-8 검사를 사용한다. 레거시 후보 디코딩 성공은 인코딩 확정이 아니므로 자동 변환하지 않는다. 파일별 판정은 `probe.json.encodings`에 있다.
- eraJS `compile(Map)` API에 CSV는 basename 대문자, ERB/ERH는 원래 상대 경로로 넣는다. CSV 키 충돌은 거절한다. 파일명 로딩 순서가 원래 Emuera와 완전히 같은지는 별도 검증 대상이다.
- `emuera.config`, `CSV/*.config`는 조사만 하고 VM에 적용하지 않는다. Rename/Replace, 한국어 조사, 설정 우선순위, 전처리와 동적 호출의 전체 의미 보존은 미인증이다.
- `lexicalTokens`는 행 시작 토큰의 대략적인 빈도다. 변수나 블록 내 주석이 섞일 수 있으며 **지원 명령 목록이나 전수 분석으로 사용하면 안 된다.**
- 기준 해시: `017cbaf8e24440301e71e395bfc8f49189fccab6948c72b517b330898815a37d`, 원본 1,151개. 매 probe마다 시작·종료 집계를 비교하며 `docs`, `tools`, `.my_agent_remote`, `.git`, `.playwright`는 새 작업/도구 경로로 제외한다.

## P0 미통과 사유와 구현 결정

1. 실제 게임의 **새 게임 설정 완료 → 대표 입력 → 저장 → 페이지 재로드 → 로드** 최소 경로는 통과했다. 다만 전체 필수 명령 지원표, 장시간/분기별 플레이와 기준 Emuera 대조는 완료하지 않았다.
2. 53비트 경계를 넘는 숫자 입력 결함이 확인됐다. engine fork의 입력 파서 수리 및 부호·overflow·저장 직렬화 경계 시험이 필요하다. 공통 Shell에서 값을 임의 반올림하거나 게임 데이터를 수정하는 방식으로 우회하지 않는다.
3. 설정과 KR 확장 차이를 동작별 fixture와 허용된 기준 환경으로 비교해야 한다. 실제 게임에 쓰인 모든 필수 명령 지원표는 아직 완성되지 않았다.
4. iPhone Safari/PWA, ZIP 가져오기, 제품 수준 저장 안전성과 PC 세이브 왕복은 아직 검증하지 않았다.

따라서 전체 이식 완료나 제품 엔진 확정을 선언하지 않는다. 우선 eraJS 호환성 보완의 범위를 평가하고, 어려울 경우 WebEmuera 보수 또는 erars 웹 호스트 이식을 비교한다. 공통 실행기는 기존 adapter 계약을 유지한다. mock 엔진 두 개로 확장성을 시험하는 P1은 분리 가능하지만, mock 성공을 Emuera 성공으로 간주하지 않는다.
