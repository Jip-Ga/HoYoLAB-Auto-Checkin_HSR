# HoYoLAB 자동 출석 + 붕스(실시간 메모, 엔컨 일정)

**기능 업데이트 :** `2026-08-30` 수정 예정

**PC 화면에서 작업하시는 걸 추천드립니다.**

**검색 기능 : `Ctrl`+`F`**

- 원신은 스토리만 보고 있고...붕스만 하고 있어서 개척력이랑 엔컨 일정 편하게 확인 할려고 만들었습니다.
- 원신, 붕3, 젠제로 추가 기능은 아마 안 만들거 같습니다.
- 작동에 문제가 생기면 메일로 연락 부탁드립니다.


---
<details>

<summary> ← 이 모양 있는 문장 누르면 추가 설명이 나오고 </summary>
┗ 다시 (▶, ▼)모양 있는 문장 누르면 닫힙니다.

</details>


---
## #실행 결과

자동 출석은 기존의 [HoYoLab 자동 출석](https://github.com/Jip-Ga/HoYoLAB-Auto-Checkin)과 동일하게 웹후크를 사용하지 않아도 작동합니다.

| <img src="./Picture/p01.png?raw=true" width="521" height="585"> | <img src="./Picture/p02.png?raw=true" width="606" height="585"> | <img src="./Picture/p03.png?raw=true" width="556" height="585"> |
|:---------------------------------------------------------------:|:---------------------------------------------------------------:|:---------------------------------------------------------------:|
| 자동 출석 (출석 마다 전송)                                        | 실시간 메모 (임베드 내용 수정)                                    | 엔드 콘텐츠 일정 (임베드 내용 수정)                            |


---
## #0. 준비물

1. 깃허브 계정
[[GitHub](https://github.com/)]
, [[로그인 페이지](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fwhy-github%3Flocale%3Dko-kr)]
, [[계정 생성 페이지](https://github.com/signup?return_to=https%3A%2F%2Fgithub.com%2Fwhy-github%3Flocale%3Dko-kr&source=login)]

2. 해당 페이지 우측 위 **`⑂ Fork`** 로 저장소 및 파일 복사

<img src="./Picture/p04.png?raw=true" width="465" height="62">

3. 디스코드 개인 서버의 웹훅 또는 타 서버의 웹훅『선택사항』
4. 메모장 어플『선택사항』
5. 자주 사용하지 않는 브라우저『선택사항』


---
## #1. 디스코드 웹훅 만들기 (메모장 작성 추천)

채널, 웹후크는 각각 최소 2개 이상 생성 할 것을 권장합니다.

- **출석** 채널,웹후크 1개씩
- **실시간 메모, 빛 따라 금 찾아 일정** 채널, 웹후크 1개 이상

> 저는 계정 여러개 사용 중이라 채널 3개로 분활했습니다.

<img src="./Picture/p05.png?raw=true" width="261" height="146">


<details>

<summary> 『선택사항』 </summary>

PC 화면에서만 웹후크 생성이 가능합니다.

[[Discord-웹브라우저](https://discord.com/channels/@me)]

1. **개인 서버 만드는 방법은 생략**
2. 채널 생성『선택사항』
3. 해당 채널 우클릭 → `채널 편집(⚙️)` → `연동` 탭 → `웹후크` → `웹후크 만들기` → `웹후크 URL 복사`

</details>


---
## #2. 쿠키 값 얻기 (메모장 작성 추천)

- **자주 사용하지 않는 브라우저로 실행하는 것 추천.**
- 동일 브라우저에서 HoYoLab에 재로그인 할 경우 쿠키값(**`ltoken_v2`**)이 갱신됨.

<details>

<summary> 『필수사항』 </summary>

1. HoYoLAB 로그인 [[HoYoLAB](https://www.hoyolab.com/home)]
2. `F12` (개발자 도구) 열기
3. 상단 **`Application`** 탭 클릭
4. 왼쪽 **`Cookies`** → `https://www.hoyolab.com` 클릭
5. `F5` (새로고침)
6. Name 목록에서 **`ltoken_v2`**, **`ltuid_v2`** 값을 각각 복사

<img src="./Picture/p06.png?raw=true" width="597" height="176">

각각에 해당하는 Value(값) 누르면 **개발자 도구창 맨아래에 자세히** 나옵니다.

- **`ltoken_v2`** = v2_CAISDGM5... (매우 긺)
- **`ltuid_v2`** = 숫자 여러개값
- **목록에서 안보일 시 `F5` (새로고침)**

</details>


---
## #3. GitHub Secret 등록

<details>

<summary> 『필수사항』 </summary>

1. **`⑂ Fork`** 로 복사된 본인 저장소에서 → **상단 탭 `⚙️Settings`** → 왼쪽 아래 쯤에 `*️⃣Secrets and variables` → `Actions` 
2. **`New repository secret`** (초록색) 클릭

- **Name**: `ACCOUNTS_JSON`
- **Secret**:

【 HoYo 계정 1개 사용 시 아래 코드 사용 】
```json
{
  "SHOW_ALIAS_AS_IS": "x",
  "ENDGAME_WEBHOOK": "빛 따라 금 찾아(전체 1개)를 보낼 디스코드 웹훅 URL",
  "ENDGAME_AVATAR": "",
  "ACCOUNTS": [
    {
      "NAME": "본계정",
      "LTUID": "ltuid_v2 값",
      "LTOKEN": "ltoken_v2 값",
      "GAMES": ["원신", "붕스타", "젠존제"],
      "SERVER": "prod_official_asia",
      "CHECKIN_WEBHOOK": "출석 결과를 보낼 웹훅 URL",
      "CHECKIN_AVATAR": "",
      "NOTE_WEBHOOK": "실시간 메모를 보낼 웹훅 URL",
      "NOTE_AVATAR": ""
    }
  ]
}
```

<details>
<summary> 【 HoYo 계정 2개 이상 사용 시 코드 】 </summary>

```json
{
  "SHOW_ALIAS_AS_IS": "x",
  "ENDGAME_WEBHOOK": "빛 따라 금 찾아(전체 1개)를 보낼 디스코드 웹훅 URL",
  "ENDGAME_AVATAR": "",
  "ACCOUNTS": [
    {
      "NAME": "본계정",
      "LTUID": "ltuid_v2 값",
      "LTOKEN": "ltoken_v2 값",
      "GAMES": ["붕3", "원신", "붕스타", "젠존제"],
      "SERVER": "prod_official_asia",
      "CHECKIN_WEBHOOK": "출석 결과를 보낼 웹훅 URL",
      "CHECKIN_AVATAR": "",
      "NOTE_WEBHOOK": "실시간 메모를 보낼 웹훅 URL",
      "NOTE_AVATAR": ""
    }
    ,{
      "NAME": "부계1",
      "LTUID": "ltuid_v2 값",
      "LTOKEN": "ltoken_v2 값",
      "GAMES": ["붕스타", "젠존제"],
      "SERVER": "prod_official_asia",
      "CHECKIN_WEBHOOK": "출석 결과를 보낼 웹훅 URL",
      "CHECKIN_AVATAR": "",
      "NOTE_WEBHOOK": "실시간 메모를 보낼 웹훅 URL",
      "NOTE_AVATAR": ""
    }
  ]
}
```

</details>

<details>
<summary> 【 계정 더 추가 시 해당 코드 이어 붙이기. 】 </summary>

위 코드와 같은 방식으로 계정 추가

```json
{
    ,{
      "NAME": "계정",
      "LTUID": "ltuid_v2 값",
      "LTOKEN": "ltoken_v2 값",
      "GAMES": ["원신", "붕스타", "젠존제"],
      "SERVER": "prod_official_asia",
      "CHECKIN_WEBHOOK": "출석 결과를 보낼 웹훅 URL",
      "CHECKIN_AVATAR": "",
      "NOTE_WEBHOOK": "실시간 메모를 보낼 웹훅 URL",
      "NOTE_AVATAR": ""
    }
}
```

</details>



| 코드               | 설명                                                                                             | 기타          |
|--------------------|--------------------------------------------------------------------------------------------------|---------------|
| `SHOW_ALIAS_AS_IS` | `GAMES`의 입력대로 디코에 출력 여부 [`"o"`/`"x"`]                                                  | **필수 입력** |
| `ENDGAME_WEBHOOK`  | **"빛 따라 금 찾아 일정" 웹후크** 링크                                                            | 선택 사항      |
| `ENDGAME_AVATAR`   | **"빛 따라 금 찾아 일정" 웹후크** 프로필 이미지 링크                                               | 선택 사항      |
| `NAME`             | 단순 계정 분류용 이름                                                                              | **필수 입력** |
| `LTUID`            | ltuid_v2 값 [[#2. 쿠키 값 얻기](https://github.com/Jip-Ga/HoYoLAB-Auto-Checkin_HSR#2-%EC%BF%A0%ED%82%A4-%EA%B0%92-%EC%96%BB%EA%B8%B0-%EB%A9%94%EB%AA%A8%EC%9E%A5-%EC%9E%91%EC%84%B1-%EC%B6%94%EC%B2%9C)] 참고                                                                                                | **필수 입력** |
| `LTOKEN`           | ltoken_v2 값 [[#2. 쿠키 값 얻기](https://github.com/Jip-Ga/HoYoLAB-Auto-Checkin_HSR#2-%EC%BF%A0%ED%82%A4-%EA%B0%92-%EC%96%BB%EA%B8%B0-%EB%A9%94%EB%AA%A8%EC%9E%A5-%EC%9E%91%EC%84%B1-%EC%B6%94%EC%B2%9C)] 참고                                                                                                | **필수 입력** |
| `GAMES`            | 자동 출석 하고 싶은 게임 이름 [[#3-2. GAMES에 쓸 수 있는 이름/별칭](https://github.com/Jip-Ga/HoYoLAB-Auto-Checkin_HSR#3-2-games%EC%97%90-%EC%93%B8-%EC%88%98-%EC%9E%88%EB%8A%94-%EC%9D%B4%EB%A6%84%EB%B3%84%EC%B9%AD)] 참고                                                                              | **필수 입력** |
| `SERVER`           | [[#3-3. SERVER 값](https://github.com/Jip-Ga/HoYoLAB-Auto-Checkin_HSR#3-3-server-%EA%B0%92)] 참고 | **필수 입력** |
| `CHECKIN_WEBHOOK`  | **"자동 출석" 웹후크** 링크                                                                       | 선택 사항      |
| `CHECKIN_AVATAR`   | **"자동 출석" 웹후크** 프로필 이미지 링크                                                          | 선택 사항      |
| `NOTE_WEBHOOK`     | **"실시간 메모" 웹후크** 링크                                                                     | 선택 사항      |
| `NOTE_AVATAR`      | **"실시간 메모" 웹후크** 프로필 이미지 링크                                                        | 선택 사항      |

>  `AVATAR` 값을 `""`(빈 칸)으로 설정하시면 웹후크에 직접 설정해둔 프로필로 사용됩니다.

### #3-1. 웹후크 추가 설명

| 분류                                             | 웹후크 링크가 코드에 없을 때                                        |
|--------------------------------------------------|---------------------------------------------------------------------|
| 빛 따라 금 찾아 일정 (`ENDGAME_WEBHOOK`, 전체 1개) | 미입력 시 이 기능 자체를 건너뜀.                                      |
| 출석 (`CHECKIN_WEBHOOK`, 계정마다)                | 계정들 중 채워진 마지막 웹훅으로 대체. 아무것도 없으면 디코 전송 건너뜀. |
| 실시간 메모 (`NOTE_WEBHOOK`, 계정마다)             | 미입력 계정만 건너뜀. 아무것도 없으면 이 기능 자체를 건너뜀.            |

"빛 따라 금 찾아"는 **첫 번째(맨 위) HoYo 계정**으로 조회합니다.


### #3-2. GAMES에 쓸 수 있는 이름/별칭

- **별칭 수정 : `lib`/`games.js` 파일의 `GAME_ALIASES` 코드 참고.**
    - 별칭 중복 작성 주의
```
const GAME_ALIASES = {
  "붕괴 3rd": ["hi3", "hi3rd", "Honkai Impact 3rd", "붕3", "붕3rd", "붕괴3rd", "3rd"],
  "원신": ["gl", "Genshin Impact", "겐신", "1신", "원공노", "공월", "공월의노래"],
  "붕괴: 스타레일": ["hsr", "Honkai: Star Rail", "붕스", "붕스타", "별", "별붕", "스타레일", "붕괴스타레일", "붕괴 : 스타레일"],
  "젠레스 존 제로": ["z", "zzz", "Zenless Zone Zero", "젠존제", "찢", "ㅈㅈㅈ", "젠레스존제로", "젠제로", "젠레스", "존", "제로"]
};
```
> 원제목인 `붕괴 3rd, 원신, 붕괴: 스타레일, 젠레스 존 제로`도 입력 가능


### #3-3. SERVER 값

계정마다 사용하고 있는 붕괴: 스타레일 서버값 입력
> 서버 시간 수정 : `lib`/`hoyoapi.js` 파일의 `SERVER_TZ_OFFSET_HOURS` 코드 참고.

| 서버            | 값                   |
|-----------------|----------------------|
| 아시아          | `prod_official_asia` |
| 미주            | `prod_official_usa`  |
| 유럽            | `prod_official_eur`  |
| 대만/홍콩/마카오 | `prod_official_cht`  |

</details>


---
## #4. 실행 확인

<details>

<summary> 『필수사항』 </summary>

- **수동 테스트 : **`⑂ Fork`** 로 복사된 본인 저장소의 `▶️Actions` 상단 탭 → `실행파일 (아무거나)` → `Run workflow ▼` → `Run workflow`**
    - **`▶️Actions`** 탭에서 실행 로그 확인 가능.
    - <img src="./Picture/p07.png?raw=true" width="256" height="150">
      <img src="./Picture/p08.png?raw=true" width="228" height="150">

</details>


---
## #5. 시간 설정

HoYoLab 출석 가능 시간 : `한국시간(KST) 01:00` = `중국시간(CST) 00:00` = `UTC 16:00`

<details>
<summary> 『기본 설정』 </summary>

- **`15분 마다 실행`**
    - 자동 출석 :
      -  수동 실행 : 출석 성공/실패, 이미 출석 완료
      -  자동 실행 : 출석 성공/실패
    - 실시간 메모 : 최근에 실행된 날짜 및 시간 입력
    - 빛 따라 금 찾아 일정 : 최근에 실행된 날짜 및 시간 입력

</details>

<details>
<summary> 『설정 수정 방법』 </summary>

- **`.github/workflows` 폴더 내부의 `checkin` 파일의 `cron` 값을 수정**
    - `KST 09:10` = `UTC 00:10` = **`cron: "10 0 * * *"`**
    - 시간 변환 추천 사이트 : [[Datetime360](https://datetime360.com/ko/utc-seoul-time/)]
- **하루에 파일 내용을 자주 바꿀 시 스케줄러가 작동 안할 수도 있습니다.**
    - 스케줄러 작동 안하는 **하루만 수동 작동**하고, UTC 기준 **다음날부터 스케줄러가 작동하는지 지켜보면 됩니다.**
    - GitHub 서버에 사람이 많아 생긴 문제라 외부 서비스에서 GitHub API를 호출해서 workflow_dispatch를 트리거 해야합니다.
        - 외부 호출 관련은 AI한테 물어보면 답변 잘해줄겁니다 :)


</details>

---
## #실행 순서

1. UID 캐시 파일 읽기 (없으면 API로 조회 후 저장)
2. 출석용 날짜 캐시 확인 → 오늘 성공 내역이 있으면 출석 건너뜀
3. 실시간 메모 조회 → 계정별 메시지 수정(확인 시 메시지 없으면 새로 생성)
4. 빛 따라 금 찾아 일정 조회 → 메시지 수정(확인 시 메시지 없으면 새로 생성)
5. UID/출석 캐시 파일들 저장 + 커밋


---
끝 :)

> 원본 [[HoYoLAB-Auto-Checkin_HSR](https://github.com/Jip-Ga/HoYoLAB-Auto-Checkin_HSR)]
