# 1단계 PC PWA 재검증 결과

- 결과: 통과 (HTTPS 배포 및 iPhone 실기기 시험은 포함하지 않음)
- 릴리스: `f771a86b4ce95bb71926`
- 빌드 자산 크기: 64,129,816 bytes (약 61.2 MiB)
- Edge: 152.0.4191.66
- `build:pwa`: 성공
- `test:pwa`: 1/1 통과
- `test:pwa-game`: 1/1 통과
- 실제 게임: 한국어 이름/밤 상태 오프라인 복원, 추가 입력 및 슬롯 1 저장 통과
- 두 브라우저 보고서: 페이지 오류 및 외부 요청 없음
- 자산 10개 SHA-256 및 Service Worker/릴리스 일치 확인

## 원본 보존

기존 기준 1,151개 파일은 변경/삭제 없이 보존됨. 기준 집계:
`017cbaf8e24440301e71e395bfc8f49189fccab6948c72b517b330898815a37d`

별도 게임 ZIP/폴더의 21개 파일이 추가되어 현재 집계 대상은 1,172개임. 현재 집계:
`6601543dff502af9ac3a69217e26c36dc9012ab268f3d55906ee7ce50e05a345`

기존 `original-inventory.json` 기준은 덮어쓰지 않았음.

## 상세 증거

- `pc-stage1-verification.json`
- `pwa-chromium.json`
- `pwa-game-chromium-browser-offline.json`
- `../pwa-dist/pwa-build.json`

현재 결과는 데스크톱 Edge 자동 시험이며 실제 iPhone, 전체 게임 호환성, 백업·복원 기능의 완료를 뜻하지 않음.
