# 추가 지침 — 이미지 카드 card.json

2026-10-25 추가 (같은 날 track·anatomy 템플릿 추가), 2026-10-27 개정(무료 종목 결과 %·월간 평균 표시, `추가지침_성과공개.md`). 그록봇은 카드가 필요한 날 `wick/queue/<YYYY-MM-DD>/card.json`을 씁니다. 명재 또는 클로드코드가 `./render.sh <날짜> --card`를 실행하면 같은 폴더에 `card.png`(1080×1350)가 생깁니다. 가로가 필요하면 `--card --wide`(1600×900).

## 형식

```json
{
  "template": "verdict",
  "title": "This week's verdict is in",
  "subtitle": "Free sample below. Full list for members.",
  "mood": "excited",
  "items": [ { "symbol": "NVDA", "about": true }, { "symbol": "XYZ" } ],
  "chart": "NVDA"
}
```

| 필드 | 필수 | 내용 |
| --- | --- | --- |
| `template` | 예 | `verdict`(토·일) / `results`(월) / `track`(화, 지난 무료 종목 추적) / `anatomy`(수, 신호 해부도) / `race`(목·금) |
| `title` | 예 | **6단어 이내** |
| `subtitle` | 아니오 | **12단어 이내** |
| `mood` | 아니오 | Wick 표정. 생략 시 verdict=excited, results·track=calm(손실이 더 많으면 apology), race=tense |
| `items` | verdict·results·track | 종목 코드만(`symbol`, `ticker`도 인식). verdict에서 `"about": true`면 패킷의 `company_blurb`를 함께 표시. track은 생략하면 최근 8주 무료 종목 전체 |
| `chart` | 아니오 | verdict 전용. `items` 중 하나. 무료 종목이 있으면 항상 넣기. `charts/<TICKER>.png`(TradingView 스냅샷)가 아직 없으면 차트 없이 먼저 만들어지고, 명재가 스냅샷을 넣으면 자동으로 다시 렌더 |
| `variant` | anatomy 전용 | `both`(기본, 두 경우 모두) / `qualified` / `vanished` |

상단 배지는 템플릿으로 정해집니다: verdict = CONFIRMED, results = **GRADED · Exit report** (2026-10-25 명재 결정), track = **TRACKED · Every free pick**, anatomy = **HOW IT WORKS · Illustration**, race = LIVE.

**도장은 card.json에 쓰지 않습니다.** 렌더러가 패킷에서 직접 정합니다.
- verdict: `free_picks` → QUALIFIED, `publish: "free post: vanished log"` → VANISHED, `earnings_caution: true` → EARNINGS WEEK. 통과 종목 수도 패킷에서 셉니다.
- results: `monday.new_closes`의 `exit_kind` → FIRST TARGET(중앙밴드 25% 익절, 나머지 보유 중) / SECOND TARGET(상단밴드 50% 익절, 마지막 25% 추적 중) / STOPPED OUT / TRAILING EXIT, `vs_spy_pct` 부호 → BEAT SPY / TRAILED SPY. **무료 공개 종목(최근 8주 `free_picks`, 같은 신호 주)이 완전히 청산된 경우에만** 결과 %와 SPY 대비 %p를 렌더가 패킷 값으로 찍습니다(이익·손실 동일). 무료 종목이 아닌 청산과 FIRST/SECOND TARGET(일부만 청산, 아직 최종 결과 아님)은 %·SPY 비교 없이 도장만. `items`를 생략하면 그 주 청산 전체. `monthly_scorecard`가 있으면 "MONTH SO FAR" 박스(승·패·SPY 상회 수와 평균 결과 %·SPY 대비 %p, 좋든 나쁘든 매달).
- track: 최근 8주 토요일 패킷의 `free_picks`를 모으고, 그 뒤 월요일 패킷의 `monday.new_closes`·`monday.vanished`로 최신 상태를 찍습니다 → STILL OPEN / FIRST TARGET(중앙밴드) / SECOND TARGET(상단밴드) / STOPPED OUT / TRAILING EXIT / VANISHED, 완전히 청산된 종목만 BEAT SPY / TRAILED SPY와 결과 %·SPY 대비 %p(이익·손실 동일). 이미 무료로 공개한 종목이라 이름을 씁니다.
- race: 후보 수(`summary.candidates`)와 태그 상위 3개를 패킷에서 계산. **`items` 금지, 종목명 금지.**
- anatomy: 실제 데이터 없이 그린 도식(주봉 캔들과 하단 밴드). 패킷이 필요 없고, **종목명·숫자·`items`·`chart` 금지.** 예: `{"template": "anatomy", "title": "How a signal survives", "subtitle": "Weekly close or it didn't happen."}`

## 렌더가 멈추는 경우 (`error.md`에 이유 기록)

- 제목 6단어·설명 12단어 초과
- 점수·순위·권유 표현 ("top pick", "best", "buy", "#1" 등)
- 제목·부제에 가격·% 직접 표기 (무료 종목 결과 %와 월간 평균은 렌더가 패킷에서 찍습니다 — `추가지침_성과공개.md`)
- 패킷에 없는 숫자
- verdict 종목이 `free_picks`·vanished log가 아님, `publish_eligible`이 true가 아님
- results 종목이 `monday.new_closes`에 없음, 또는 그 주 청산이 하나도 없음 (→ 결과 카드는 건너뛰고 글만)
- track 종목이 최근 8주 무료 종목이 아님, 또는 추적할 무료 종목이 없음
- race에 `items`가 있거나 제목·설명에 티커가 있음
- anatomy 제목·설명에 숫자나 $티커가 있거나 `items`·`chart`가 있음
