# 클로드코드 첫 세션 보고 — 2026-10-25

핸드오프 8장 "첫 세션 할 일" 진행 결과입니다. 백테스트(6번)는 명재 결정으로 이번 세션에서 제외했습니다.

| # | 할 일 | 상태 |
| --- | --- | --- |
| 1 | 공유 폴더 구조 | 완료 — Drive `wick/`에 `assets`, `backtest`, `reports`, `history` 추가 (기존 `packets`, `queue`, `metrics`, `strategy`, `guides` 유지) |
| 2 | 캐릭터 시안 | 진행 중 — 코드 시안 3안은 반려. ChatGPT 이미지용 프롬프트 4안 전달(`wick/assets/gpt-prompts.md`), 명재 생성 대기 |
| 3 | TTS 후보 비교 | 완료 — 아래 표. 무료 Kokoro 음성 샘플 4종 전달, 선택 대기 |
| 4 | 상표 검색 | 부분 완료 — 아래. USPTO·KIPRIS 직접 조회는 이 환경에서 막혀 있어 명재 확인 필요 |
| 5 | `./render.sh` 30초 테스트 | 완료 — 임시 캐릭터·임시 음성·샘플 데이터로 렌더 성공, 같은 입력이면 같은 파일(MD5 동일) 확인 |
| 6 | 백테스트 | 이번 세션 제외 |

## TTS 후보 비교

| 후보 | 비용 | 상업 이용 | 장점 | 주의 |
| --- | --- | --- | --- | --- |
| **Kokoro 82M** (로컬, 현재 사용) | 무료 | Apache-2.0 모델 — 상업 이용 가능 | PC에서 오프라인 실행, 같은 문장은 항상 같은 음성(재현성), 비용 0 | 감정 표현이 약함. 음성팩별 조건은 공식 모델 카드(VOICES.md)에서 한 번 더 확인 |
| **ElevenLabs Starter** | 월 약 $5~6 | Starter 이상만 상업 라이선스. 무료 플랜은 비상업·출처 표기 필요 | 캐릭터 연기·감정 표현 최고, 목소리 라이브러리 큼 | 월 크레딧 한도, API 키 필요, 매 생성마다 미세하게 달라짐(캐시로 해결) |
| **OpenAI gpt-4o-mini-tts** | 사용량 과금 (텍스트 $0.60/1M 토큰, 오디오 $12/1M 토큰, 분당 약 $0.015 추정) | OpenAI 약관 내 상업 이용. 듣는 사람에게 AI 음성임을 밝혀야 함 | 저렴, 말투 지시("strict referee, slightly clumsy") 가능 | 이미 "Automated account" 표기가 있어 고지 조건은 충족하기 쉬움 |

**추천**: 계정 시작은 **Kokoro**로 무료 운영 → 30일 반응을 보고 캐릭터 연기가 중요하다고 판단되면 **ElevenLabs Starter**로 교체. 렌더러는 `config.json`의 `tts.engine` 한 줄로 바꿀 수 있게 만들어 두었습니다(다른 엔진 연결은 선택 후 작업).

샘플 문장: "Weekly close or it didn't happen. Three stocks qualified this week. Let's see who survived."
- `am_puck` — 미국 남성, 경쾌 (현재 기본값)
- `am_michael` — 미국 남성, 차분
- `bm_fable` — 영국 남성
- `af_heart` — 미국 여성

출처: [ElevenLabs 요금·상업 라이선스 정리(BIGVU)](https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/), [ElevenLabs 무료 플랜 제한(Dupple)](https://dupple.com/learn/is-elevenlabs-free), [OpenAI gpt-4o-mini-tts 모델 문서](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts), [Kokoro-82M (Together AI)](https://together.ai/models/kokoro-82m). ElevenLabs 가격은 제3자 정리 기준이므로 결제 전 공식 요금 페이지에서 확인하세요.

## "Weekly Wick" 상표 검색

**결론: 웹에 색인된 미국 상표 기록에서 "WEEKLY WICK"과 정확히 같은 상표는 찾지 못했습니다.** 다만 이 환경에서는 USPTO 검색 시스템과 KIPRIS에 직접 접속이 차단되어, 최종 확인은 명재가 직접 해야 합니다.

비슷한 기존 상표 (모두 우리 업종과 다름):

| 상표 | 상태 | 분야 |
| --- | --- | --- |
| WICKWEEK (일련번호 99751296) | 2026-04-08 출원, 심사 중 | 18류 가죽제품·가방 |
| WISE WICKS | 2021 등록 | 양초 |
| WORD WICKS (등록 5962600) | 등록 | 양초 심지 |
| WEEKEND WICKS CANDLE COMPANY | 2023 출원 | 양초 |

우리 사용 분야는 **9류(다운로드 가능한 콘텐츠·앱), 36류(금융 정보 제공), 41류(온라인 영상·엔터테인먼트)**라서 양초(4류)·가방(18류) 상표와는 겹치지 않을 가능성이 큽니다. 단, "wick"이 차트 용어(캔들 꼬리)이기도 해 식별력이 약하다는 판단을 받을 수 있습니다.

**명재가 직접 확인할 것 (각 5분)**
1. USPTO: https://tmsearch.uspto.gov 에서 `weekly wick`, `weeklywick`, `wick` + 36·41류 검색 (Live/Dead 모두)
2. KIPRIS: https://www.kipris.or.kr → 상표 → 상세검색에서 `Weekly Wick`, `위클리 윅`, `위클리윅` (띄어쓰기 변형 포함), 상품분류 09·36·41
3. X 핸들: @WeeklyWick, @TheWeeklyWick 사용 가능 여부

출처: [WICKWEEK](https://trademarks.justia.com/997/51/wickweek-99751296.html), [WISE WICKS](https://trademarks.justia.com/900/44/wise-90044546.html), [WORD WICKS](https://trademark.justia.com/881/39/word-88139799.html), [WEEKEND WICKS CANDLE COMPANY](https://trademark.justia.com/981/32/weekend-wicks-candle-98132776.html). 법률 자문이 아니며, 출원을 결정하면 변리사 확인을 권합니다.

## 렌더 파이프라인 (`wick-studio/`)

- 실행: `./render.sh <YYYY-MM-DD>` (영상) / `./render.sh <YYYY-MM-DD> --image` (평일 1080×1080 이미지)
- 입력: Drive `wick/queue/<날짜>/script.md`, 그 날짜 이전 최신 `wick/packets/<날짜>.json`, 차트 스냅샷 `wick/queue/<날짜>/charts/<TICKER>.png`
- 출력: 같은 폴더에 `render.mp4`(1080×1920, H.264, 30fps), `thumb.png`, `captions.srt` / 실패 시 `error.md`
- 렌더 전 자동 점검: 점수·순위·권유 표현, 패킷에 없는 숫자, free_picks가 아닌 종목명, publish_eligible, 배지와 status 불일치, 실적 주간 설명 구간 누락, 차트 스냅샷 누락
- 고정 요소: 상단 "LIVE · Confirms at Friday close"(weekly_confirm만 "CONFIRMED"), 하단 "Automated account · Not financial advice", 차트 위 "Charts by TradingView"
- 30초 영상 렌더 시간: 약 1분 (이 환경 기준)

## 명재에게 확인할 것

1. **캐릭터**: ChatGPT로 만든 그림을 이 대화에 올리거나 Drive `wick/assets/concepts/`에 넣어주세요. 고른 안을 SVG 리그로 다시 그립니다.
2. **음성**: 샘플 4종 중 선택 (또는 ElevenLabs/OpenAI로 업그레이드할지).
3. **패킷 필드**: 실제 GROK PACKET 샘플 1개를 `wick/packets/`에 넣어주세요. 렌더러가 아래 필드를 가정하고 있습니다.
   - 상승/하락 주 색: `summary.market_week`("up"/"down") 또는 `summary.spy_week_change_pct` — 지금 패킷에 없다면 「오늘의 주식」 출력에 추가 필요 (없으면 초록으로 렌더하고 경고)
   - 통과 수(불꽃 크기): `signals[].status == "QUALIFIED"` 개수, 없으면 `summary.qualified`
   - `free_picks`: 종목 코드 배열 또는 `{symbol: ...}` 객체 배열 모두 지원
4. **배지 규칙**: 핸드오프대로 `weekly_confirm`만 "CONFIRMED"이고 일요일 `deep_dive`·월요일 `results`도 "LIVE"가 붙습니다. 일요일·월요일은 이미 확정된 내용이라 "CONFIRMED"가 맞을 수도 있는데, 어떻게 할까요?
5. **실행 PC**: Windows라면 Git Bash에서 `./setup.sh` 한 번 → `.env`의 `WICK_DIR`를 Drive 경로(예: `G:/내 드라이브/wick` 또는 `G:/My Drive/wick`)로 수정. Node 18+, Python 3.10+, ffmpeg 필요.
