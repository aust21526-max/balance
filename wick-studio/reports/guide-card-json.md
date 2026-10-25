# 추가 지침 — 이미지 카드 card.json

2026-10-25 추가. 그록봇은 카드가 필요한 날 `wick/queue/<YYYY-MM-DD>/card.json`을 씁니다. 명재 또는 클로드코드가 `./render.sh <날짜> --card`를 실행하면 같은 폴더에 `card.png`(1080×1350)가 생깁니다. 가로가 필요하면 `--card --wide`(1600×900).

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
| `template` | 예 | `verdict`(토·일) / `results`(월) / `race`(화~금) |
| `title` | 예 | **6단어 이내** |
| `subtitle` | 아니오 | **12단어 이내** |
| `mood` | 아니오 | Wick 표정. 생략 시 verdict=excited, results=calm(손실이 더 많으면 apology), race=tense |
| `items` | verdict·results | 종목 코드만. verdict에서 `"about": true`면 패킷의 `company_blurb`를 함께 표시 |
| `chart` | 아니오 | verdict 전용. `items` 중 하나이고 `charts/<TICKER>.png`(TradingView 스냅샷)가 있어야 함 |

**도장은 card.json에 쓰지 않습니다.** 렌더러가 패킷에서 직접 정합니다.
- verdict: `free_picks` → QUALIFIED, `publish: "free post: vanished log"` → VANISHED, `earnings_caution: true` → EARNINGS WEEK. 통과 종목 수도 패킷에서 셉니다.
- results: `monday.new_closes`의 `exit_kind` → TAKE-PROFIT / STOPPED OUT / TRAILING EXIT, `vs_spy_pct` 부호 → BEAT SPY / TRAILED SPY (%는 표시하지 않음). `items`를 생략하면 그 주 청산 전체. `monthly_scorecard`가 있으면 "MONTH SO FAR" 박스.
- race: 후보 수(`summary.candidates`)와 태그 상위 3개를 패킷에서 계산. **`items` 금지, 종목명 금지.**

## 렌더가 멈추는 경우 (`error.md`에 이유 기록)

- 제목 6단어·설명 12단어 초과
- 점수·순위·권유 표현 ("top pick", "best", "buy", "#1" 등)
- 가격·% 표기 (성과 % 공개는 명재 지시 전까지 차단)
- 패킷에 없는 숫자
- verdict 종목이 `free_picks`·vanished log가 아님, `publish_eligible`이 true가 아님
- results 종목이 `monday.new_closes`에 없음
- race에 `items`가 있거나 제목·설명에 티커가 있음
- chart 스냅샷 파일 없음
