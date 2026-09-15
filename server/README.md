# 서버형 런타임 (server-authoritative) — S1

이 폴더는 [서버형 런타임 전환 계획](../docs/web-runtime/server-runtime-plan.md)의 **S1** 착수 코드다.
공개 정적 배포선인 `main`과 물리적으로 분리하기 위해 `server` 브랜치에만 둔다(계획 §10-2).

## 현재 상태: S1 Layer A + Layer B (WS 전송) — 헤드리스 검증 완료

브라우저 Worker(`tools/web-engine-probe/engine-worker.mjs`)의 제너레이터 루프를 plain Node로
이식한 것이다. **재작성이 아니라 포트**다(계획 §1): 신뢰성 모듈을 그대로 재사용한다.

| 파일 | 역할 |
| --- | --- |
| `engine-session.mjs` | 세션 코어. `engine-worker`의 `advance` 루프 + `input-gate`/`batch-channel`/`waiting-relay` 재사용. `postMessage`/`onmessage` → 주입된 `post(message)` 콜백 + `handle(message)` 메서드 (전송 무관) |
| `save-store.mjs` | IndexedDB `browser-store` 대체. 동일한 `{ get, set, entries, replaceAll, close }` 인터페이스, 원자적 파일 저장(temp→rename), 플랫폼 중립 JSON (계획 §5·§8-4) |
| `config.mjs` | env 설정. 포트·바인드·토큰·데이터 경로를 코드가 아닌 환경변수에서 읽음. 하드코딩 절대경로 없음 (계획 §8-1,2) |
| `ws-frame.mjs` | 의존성 없는 RFC 6455 프레임 코덱(핸드셰이크 키·인코딩·디코딩). `ws` 패키지·package.json 불필요 (계획 §8 이식성·§11 위생) |
| `ws-server.mjs` | WS 전송 셸(Layer B). 업그레이드 핸드셰이크 + 단일 사용자 토큰 게이트(§4/§7), 연결당 세션 1개. `post(message)`→WS 텍스트 프레임, 수신 프레임→`session.handle(message)` **1:1**(계획 §3). 엔진 의미는 손대지 않음 |
| `engine-session-test.mjs` | Layer A 헤드리스 검증(중립 fixture, 원본 게임 텍스트 없음) |
| `ws-server-test.mjs` | Layer B 헤드리스 검증. Node 내장 `WebSocket` 클라이언트를 얇은 단말로 사용, 실제 WS 프레임으로 구동 |

### 검증

```
node --test server/engine-session-test.mjs   # Layer A (in-process 전송)
node --test server/ws-server-test.mjs         # Layer B (실제 WebSocket 프레임)
```

Layer A 통과 항목:
1. 타이틀 렌더 + 입력 대기 도달
2. 플레이 → `SAVEDATA` → 파일 세이브 기록 → **새 세션이 같은 파일 스토어에서 `RESTORED` 복원**
3. `resume`가 미응답 `waiting`을 같은 id로 재발행 (끊긴 입력/재연결 복구, 계획 §3)

Layer B 통과 항목 (동일 시나리오를 실제 WebSocket 위에서, + 프레임 코덱 단위 테스트):
1. 프레임 코덱 — 마스킹된 클라이언트 프레임 디코드(길이 경계 <126/126), 청크 분할 재조립, 서버 프레임 무마스킹, RFC 6455 §1.3 `acceptKey` 정답 대조
2. 타이틀 렌더 + 입력 대기 도달 (WS)
3. 플레이 → `SAVEDATA` → 파일 기록 → **새 WS 연결이 같은 폴더에서 `RESTORED:42:hangul test:77` 복원**
4. `resume`가 같은 id로 `waiting` 재발행 (WS)

## 아직 안 한 것 (정직한 한계)

- **실게임 소스 로드** — `games/`에서 61MiB gzip NDJSON 디코드 (현재는 중립 fixture). Layer B는 fixture로만 검증했다.
- **세션 수명·재연결(S2)**, **얇은 클라이언트(S3)**, **접근 보호·세이브 이전(S4)**, **이식성 리허설(S5)**.
- S1의 "Node 프로브와 동일 출력/저장 해시" 완료 기준은 replay 대조까지 가야 충족.

`server-data/`(세이브)·`server-config/`·`.env`·로그는 `.gitignore`로 추적 제외 (계획 §10-3·§11).
