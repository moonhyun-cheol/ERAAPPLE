# eraTHYMKR

> This description is written by korean

## 서버 PC 업데이트 (`server` 브랜치)

서버 PC에서 새 변경을 받은 뒤에는 실행 중인 Node 프로세스를 재시작해야 새 엔진이 적용됩니다.
저장소 루트의 PowerShell에서 아래 두 줄을 실행하세요.

```powershell
git pull --ff-only origin server
.\server\scripts\apply-server-update.ps1
```

두 번째 명령은 서버가 실제 사용하는 엔진의 집중 테스트를 먼저 실행하고, 통과할 때만
`era-server` 예약 작업을 재시작합니다. 다른 작업 이름이나 수동 실행 방법은
[`docs/web-runtime/home-deploy-runbook.md`](docs/web-runtime/home-deploy-runbook.md)의
**서버 코드 업데이트** 절을 참고하세요.

## 저작권

NOTICE.md를 봐주세요

## 실행하는 방법

1. 먼저 releases에 들어갑니다
2. 최신 릴리즈에서 Downloads에있는 Source code (zip) 을 선택해서 다운로드합니다
3. 적당한 장소에다가 압축을 해제한뒤 Emuera1818_kr3.exe 파일을 실행합니다

------

## 비활성화된 기능 활성화하기

ERB 폴더의 FEATURES 폴더 안에있는 ERH 파일들을 열어보시면 ;#DEFINE 으로 시작하는 줄이 있습니다  
여기서 #DEFINE앞의 ;를 지우시면 해당하는 기능이 활성화됩니다

### 현재 비활성화된 기능들

>### MESSAGE_ENABLE.ERH  
>* ENABLE_KOJO_EQUIP_MESSAGE  
>캐릭터별 아이템 장착 구문 출력(현재 구현되어있는 캐릭터는 없음)
>### TRANSLATOR_ENABLE.ERH
>* ENABLE_DESCRIPTION_TRANS_13  
>첸 번역기 구상 출력


------

## 기여하는 방법

1. GitHub 아이디를 만듭니다
2. 이 저장소를 포크합니다
3. 자기 저장소에서 작업을 합니다
4. Pull requests에 들어간뒤 New pull request를 선택하고 반영하고싶은 브렌치를 올립니다 이때 base 브렌치는 **'develop'** 브렌치로 해주세요


------

## 버그제보

Issuses에 들어가셔서 New issuse 버튼을 누른뒤 제보하시면 됩니다  
여기서 도움을 요청하거나 개선점을 제안하는것도 가능합니다

------

## 개발버전

위의 릴리즈 버전이 아닌 현재 개발중인 버전을 실행해볼수도 있습니다

https://github.com/Riey/eraTHYMKR/tree/develop  
여기에 들어가셔서 Clone or download를 통해 받으시면 개발버전을 받으실수 있습니다  
최신 패치를 바로 시험해볼수가 있지만 여러 버그가 존재할 가능성이 존재합니다
