# 고정 HTTPS 배포 — GitHub Pages

이 문서는 임시 Cloudflare 터널을 대체하는 **고정 HTTPS 주소**로 웹 실행판을 올리는 절차입니다.
배포 파이프라인은 `.github/workflows/deploy-pages.yml` 에 이미 준비돼 있고,
사전 빌드된 `tools/web-engine-probe/pwa-dist/` 를 그대로 게시합니다(CI 재빌드 없음).

> **공개 배포 완료:** 릴리스 `5356ae826c56bb47a372`, 커밋 `1aaa282af3641b41d6f71af6a31cabbbfa0bbe1c`. [새 Actions 실행](https://github.com/moonhyun-cheol/ERAAPPLE/actions/runs/34299527211) 성공 및 [기존 HTTPS 주소](https://moonhyun-cheol.github.io/ERAAPPLE/)의 12개 파일 SHA-256/MIME·루트 index 일치를 확인했습니다. 공개 Chromium(Edge)에서 10개 자산 캐시 준비와 오프라인 재로딩도 통과했습니다. [배포 검증 기록](../../tools/web-engine-probe/results/save-memory-public-deployment.json), [저장 메모리·진단·회귀 보고서](save-memory-optimization.md). **사용자 iPhone 설치본 업데이트 적용과 날짜 전환 실기기 검증은 아직 확인되지 않았습니다.**
>
> 게시에는 PWA 산출물 7개 변경과 `.gitattributes`만 선별 커밋했습니다. Git 줄바꿈 변환으로 라이선스 파일의 해시가 달라지는 문제를 방지하도록 PWA 산출물에 `-text`를 적용했고, 12개 파일의 커밋/로컬/공개 바이트 일치를 검증했습니다. 원본 ERB/CSV와 다른 작업 파일은 이 배포 커밋에 포함하지 않았습니다. 이전 로컬 Acceptance의 `publicDeploymentPerformed: false`는 배포 전 시점의 기록으로 보존합니다.

> ⚠️ 라이선스 주의: 이 게임은 `NOTICE.md` 기준 **CC BY-NC-ND**(비상업 · 무단 2차 가공 금지,
> 참치넷/GitHub 출처 표기 조건)입니다. GitHub Pages 공개(Option A)는 게임 텍스트 전체를
> 인터넷에 영구 공개한다는 뜻이므로, **권리자(참치넷 / 파라디클로로벤젠) 허락 여부와
> 비상업·출처표기 준수는 배포하는 사람의 책임**입니다. 실행판 화면 하단에 출처·라이선스
> 문구를 이미 넣어 두었습니다(`실행 정보 · 저장 주의사항` 펼침 안).

## 1. 현재 저장소와 공개 승인

이 작업 폴더는 이미 Git 저장소입니다. 확인 당시 브랜치는 `main`, upstream은 `origin/main`, ahead/behind는 0/0(로컬 추적 ref 기준)이었습니다. 원격은 `https://github.com/moonhyun-cheol/ERAAPPLE.git`입니다. **다시 init하거나 원격을 덮어쓰지 마세요.** 원격 연결 설정이 있다는 사실은 Pages 활성화·실제 배포 주소·게시 성공을 보증하지 않습니다.

작업공간에는 대량 untracked 원본/도구와 수정 산출물이 있습니다. `git reset --hard`, `git clean`, 무심코 `git add .`를 실행하지 마세요. 공개배포와 push는 사용자 명시 승인을 받은 뒤 수행합니다. 이 워크플로는 해당 경로의 `main` push가 곧 공개 업로드로 이어질 수 있습니다.

배포에는 `pwa-dist/` 전체와 워크플로가 필요합니다. 원본/상류 클론/개인 세이브/개발 서버 폴더를 함께 게시하지 않습니다. 검증 도구·문서의 버전 관리는 별도 검토해 선별합니다.

## 2. Pages를 GitHub Actions 소스로 전환 (최초 1회)

저장소 → **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 설정.
(Jekyll을 쓰지 않고 업로드된 산출물을 그대로 서빙하므로 `.nojekyll` 은 필요 없습니다.)

## 3. 배포

`main` 브랜치의 `pwa-dist/**` 가 바뀌어 push 되면 워크플로가 자동 실행됩니다.
수동 실행은 저장소 → **Actions → Deploy PWA to GitHub Pages → Run workflow**.

배포 주소는 Actions의 `github-pages` environment / `deploy-pages` 출력에서 확인합니다. 원격 저장소 이름만 보고 새 주소를 만들어 안내하지 않습니다. 실제 HTTPS 주소에서 산출물 릴리스·자산 SHA와 MIME, 홈 화면 업데이트가 확인된 뒤 배포 성공으로 기록합니다.

앱은 전부 상대경로(`manifest scope "./"`, SW는 `registration.scope` 기준)라 하위 경로에서 동작하도록 설계됐고 로컬 시험을 통과했습니다. 실제 호스트의 리다이렉트·캐시·응답 변형은 별도 확인해야 합니다.

## 4. iPhone에서 전환

1. **origin(프로토콜·호스트·포트)이 바뀌면 기존 IndexedDB는 새 주소에서 보이지 않습니다.** 같은 origin이라도 Safari/홈 화면 저장소 공유를 가정하지 않습니다. → **전환 전에 기존 홈 화면 앱에서 세이브를 `.json.gz` 백업**해 두세요.
2. 확인된 새 HTTPS 주소를 Safari로 열고 → 공유 → 홈 화면에 추가. 기존 주소 업데이트라면 기존 설치본을 유지합니다.
3. 홈 화면 앱 실행 → `오프라인 준비 / 업데이트 확인`. 업데이트 준비가 뜨면 먼저 게임 저장을 끝내고 해당 앱의 모든 Safari 탭/홈 화면 창을 닫은 뒤 다시 엽니다.
4. `오프라인 준비됨 · 5356ae826c56bb47a372 · 10개 자산` 표시를 확인합니다. 이 표시는 캐시 완비이며 게임 저장·iPhone 종료 해결 보증이 아닙니다.
5. 새 origin으로 옮긴 경우 백업했던 파일을 `세이브 백업 · 복원`에서 복원합니다. 기존 주소의 업데이트라면 먼저 게임 불러오기로 기존 저장을 확인합니다.
6. [날짜 전환·직전 실행 진단 체크](save-memory-optimization.md#남은-배포실기기-관문)를 홈 화면 앱에서 진행합니다.

이후에는 PC/터널이 없어도 이 고정 주소로 언제든 설치·재다운로드·업데이트가 됩니다.

## 5. 게임/엔진을 바꿀 때

CI는 재빌드하지 않습니다. 로컬에서 최종 산출물을 만든 뒤 **같은 릴리스에서 전체 회귀**를 마칩니다:
```powershell
# 프로젝트 루트. Edge가 없으면 Playwright Chromium 설치 후 채널 줄 생략.
$env:PROBE_BROWSER_CHANNEL='msedge'
npm --prefix tools/web-engine-probe run test:release   # 빌드 + 전체 회귀 + 측정
npm --prefix tools/web-engine-probe run verify:release
Remove-Item Env:PROBE_BROWSER_CHANNEL
```

검증 보고서의 성공과 릴리스 일치를 확인한 뒤, **공개/push 승인 후에만** 변경 파일을 검토·선별 커밋하고 push합니다. 이후 Actions 완료와 실제 HTTPS 응답을 확인합니다. 릴리스 ID가 바뀌면 iPhone에서 `오프라인 준비 / 업데이트 확인`으로 받되 모든 창 종료 후 새 릴리스를 확인합니다. 사이트 데이터 삭제는 금지합니다(세이브 보존).
