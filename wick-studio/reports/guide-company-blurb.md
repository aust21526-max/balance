# 추가 지침 — 기업 한 줄 소개 (company_blurb)

2026-10-25 추가. 그록봇 운영지침과 「오늘의 주식」 패킷에 아래 내용을 반영합니다. 영상에서 무료 공개 종목(`free_picks`)을 소개할 때 "무슨 회사인지"를 한 줄로 보여주기 위한 것입니다.

## 1. 「오늘의 주식」 패킷 — 새 필드

`signals[]` 중 `publish: "free sample candidate"`인 종목에 `company_blurb`를 넣습니다 (토요일 `weekly_verdict` 패킷).

```json
{ "symbol": "NVDA", "company": "NVIDIA", "company_blurb": "Designs the AI chips that power most data centers.", ... }
```

규칙:
- **영어 한 문장, 16단어 이내.** 무슨 사업을 하는지 + (있으면) 최근 1주 공개 뉴스의 핵심 한 가지.
- **숫자 금지.** 매출·이익·성장률·주가·목표가·점유율 등 어떤 숫자도 쓰지 않습니다. FMP 재무 데이터는 공개 표시 권리가 없어 인용 금지입니다.
- **점수·순위·권유 표현 금지.** "best", "top pick", "highest", "buy" 등.
- 근거는 TradingView 뉴스·기업 개요 등 공개 정보만. AI 리포트 원문이나 점수에서 가져오지 않습니다.
- 확실하지 않으면 비워 둡니다. 비어 있으면 영상에 소개 장면을 넣지 않습니다.

## 2. 그록봇 — 대본 작성법

무료 공개 종목에 `company_blurb`가 있으면, 그 종목 장면 바로 뒤에 소개 구간을 하나 넣습니다.

```
[8-14s] (calm) Free sample this week: NVIDIA. It passed the weekly close. | ON-SCREEN: NVDA, QUALIFIED, chart snapshot
[14-18s] (calm) Designs the AI chips that power most data centers. | ON-SCREEN: NVDA, ABOUT
```

- 대사는 **`company_blurb`를 그대로 읽습니다** (말투만 살짝 다듬는 정도). 새 사실을 덧붙이지 않습니다.
- ON-SCREEN에는 티커와 `ABOUT`만 씁니다. 화면에는 회사명, "WHAT THEY DO" 표시, 패킷의 소개 문구가 나옵니다.
- 실적 주간 종목이면 소개 구간 뒤에 실적 구간(발표일 + 변동성 주의)을 이어서 넣습니다.
- 게시글(`post.md`)에도 같은 한 줄을 써도 됩니다. 숫자 금지 규칙은 동일합니다.

## 3. 렌더 전 자동 점검 (클로드코드 렌더러)

아래에 걸리면 렌더하지 않고 `error.md`에 이유를 남깁니다.
- `ABOUT`인데 티커가 없거나, 패킷에 `company_blurb`가 없음
- `company_blurb`에 숫자가 있음
- `company_blurb`에 점수·순위·권유 표현이 있음

경고만 남기는 것: 소개 문구가 16단어를 넘음, 대사가 소개 문구와 많이 다름.
