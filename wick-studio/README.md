# wick-studio — Weekly Wick 렌더 파이프라인

X 계정 Weekly Wick의 캐릭터 리그와 영상·이미지 렌더러입니다. 데이터(패킷·대본·결과물)는 Google Drive `wick/` 폴더에 두고, 이 폴더에는 코드만 둡니다. 이 앱(balance)과는 독립적이며 나중에 별도 저장소로 옮겨도 그대로 동작합니다.

## 처음 한 번

```bash
cd wick-studio
./setup.sh          # npm 패키지, Python venv + Kokoro TTS, 음성 모델 다운로드, .env 생성
```

`.env`의 `WICK_DIR`를 Google Drive 데스크톱 앱이 동기화하는 `wick` 폴더 경로로 바꿉니다 (예: `G:/내 드라이브/wick`). Windows는 Git Bash에서 실행합니다. 필요: Node 18+, Python 3.10+, ffmpeg.

## 매번

```bash
./render.sh 2026-10-31 --card          # 이미지 카드(1순위): queue/2026-10-31/card.png (1080x1350)
./render.sh 2026-10-31 --card --wide   # 카드 1600x900
./render.sh 2026-10-31                 # 토요일 영상 9:16: render.mp4, thumb.png, captions.srt
./render.sh 2026-10-31 --wide          # 영상 16:9
```

카드 입력은 `$WICK_DIR/queue/<날짜>/card.json`(형식: `reports/guide-card-json.md`), 영상 입력은 `script.md`입니다. 둘 다 그 날짜 이전 최신 `$WICK_DIR/packets/<날짜>.json`과 차트 스냅샷 `$WICK_DIR/queue/<날짜>/charts/<TICKER>.png`(TradingView에서 저장)를 씁니다. 점검에 실패하면 렌더하지 않고 `queue/<날짜>/error.md`에 이유를 씁니다. `WICK_DIR` 없이 실행하면 `samples/wick`의 샘플 데이터로 렌더합니다. 카드 스타일은 `config.json`의 `cards.style` — 기본 **B 판정표**(2026-10-25 명재 선택), A 스코어보드는 `--style A`. 하단 핸들은 `config.json`의 `handle`(@weeklywick). 카드·영상 하단 고지는 "Not financial advice"만 표시합니다. 수동 게시 중이라 "Automated account" 표기는 뺐습니다(2026-10-25 명재 결정, `reports/guide-labels.md`).

## 구조

| 파일 | 역할 |
| --- | --- |
| `render.sh`, `render.mjs` | 진입점: 대본 파싱 → 점검 → TTS → 타임라인 → 프레임 → ffmpeg |
| `lib/script.mjs` | `script.md` 파서 (그록봇 운영지침 6장 형식) |
| `lib/packet.mjs` | GROK PACKET 읽기, 공개 가능 종목, 통과 수 → 불꽃 크기 |
| `lib/validate.mjs` | 렌더 전 자동 점검 |
| `lib/audio.mjs`, `tts/kokoro_tts.py` | 음성 합성(문장별 캐시), 입 모양용 음량 |
| `lib/fast.mjs` | 숏폼 스타일 장면: 단어 단위 팝업 자막, 줌 펀치 컷, 티커 슬램, 배지 도장, 카운트업, 엔딩 CTA |
| `lib/sfx.mjs` | 효과음(휙·쾅·톡)과 배경 비트를 코드로 합성, 말할 때 음악 자동 줄임 |
| `lib/motion.mjs` | 스프링·이징·흔들림, 고정 시드 난수 |
| `lib/pool.mjs`, `lib/raster-worker.mjs` | CPU 코어 수만큼 병렬 렌더 (순서 유지) |
| `lib/card-data.mjs` | `card.json` 검증, 도장·통과 수·태그를 패킷에서 계산 |
| `lib/cards.mjs` | 카드 템플릿 3종(verdict / results / race) × 스타일 2종, 세로·가로 |
| `lib/scene.mjs` | 공용 색·배지 헬퍼 |
| `assets/wick/` | 표정 5종 × 상승/하락 정지 이미지 (`node scripts/wick-stills.mjs`로 재생성) |
| `characters/rig.mjs` | 캐릭터 리그 — A안 Candle Buddy (표정 5종, 입 모양 4종, 깜빡임, 불꽃 일렁임). 캐릭터를 바꾸려면 이 파일만 교체 |
| `characters/drafts.mjs` | 첫 코드 시안 3안 (A안 채택) |
| `characters/gpt-prompts.md` | ChatGPT 이미지 시안 프롬프트 |
| `config.json` | fps, 해상도, TTS 엔진·목소리 |
| `assets/fonts/` | Inter 폰트(OFL) — 어느 PC에서나 같은 결과를 내기 위해 포함 |

같은 입력이면 같은 `render.mp4`가 나옵니다 (TTS 결과는 `.cache/tts/clips`에 문장별로 캐시).

## 영상 스타일

대본의 `[0-3s]` 같은 시간은 **순서**로만 쓰고, 속도는 음성이 정합니다. 대사 사이 공백은 0.06초라 30초 대본이 보통 15~20초 영상이 됩니다. 장면은 대본 내용을 보고 자동으로 고릅니다.

| 장면 | 언제 | 연출 |
| --- | --- | --- |
| hero | 첫 대사 | 토요일 확정 영상이면 첫 1초 안에 "N QUALIFIED" 결론 배너, 캐릭터가 튀어나오고 큰 자막 |
| count | 통과 수 숫자와 "qualified"가 들어간 대사 | 숫자 카운트업, QUALIFIED 도장, 불꽃 아이콘 |
| chart | ON-SCREEN에 티커가 있는 대사 | 차트가 밀려 들어오고 티커 슬램, 배지 도장, 화면 흔들림 |
| earnings | 실적 주간 종목 + "earnings" 대사 (차트 없음) | 주황 사선 배경, EARNINGS WEEK 도장, 발표일 |
| about | ON-SCREEN에 `티커, ABOUT` | 회사명 + WHAT THEY DO + 패킷의 `company_blurb`를 음성에 맞춰 한 단어씩 표시 (숫자 금지, `reports/guide-company-blurb.md`) |
| line | 그 밖의 대사 | 화면 가운데 큰 단어 자막 |
| end | `[end]` | FULL LIST FOR MEMBERS 슬램, 캐릭터 신남 |
