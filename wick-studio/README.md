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
./render.sh 2026-10-31            # 영상: queue/2026-10-31/render.mp4, thumb.png, captions.srt
./render.sh 2026-10-30 --image    # 평일 이미지: queue/2026-10-30/image.png (1080x1080)
```

입력은 `$WICK_DIR/queue/<날짜>/script.md`(그록봇 대본), 그 날짜 이전 최신 `$WICK_DIR/packets/<날짜>.json`, 차트 스냅샷 `$WICK_DIR/queue/<날짜>/charts/<TICKER>.png`(TradingView에서 저장)입니다. 점검에 실패하면 렌더하지 않고 `queue/<날짜>/error.md`에 이유를 씁니다. `WICK_DIR` 없이 실행하면 `samples/wick`의 샘플 데이터로 렌더합니다.

## 구조

| 파일 | 역할 |
| --- | --- |
| `render.sh`, `render.mjs` | 진입점: 대본 파싱 → 점검 → TTS → 타임라인 → 프레임 → ffmpeg |
| `lib/script.mjs` | `script.md` 파서 (그록봇 운영지침 6장 형식) |
| `lib/packet.mjs` | GROK PACKET 읽기, 공개 가능 종목, 통과 수 → 불꽃 크기 |
| `lib/validate.mjs` | 렌더 전 자동 점검 |
| `lib/audio.mjs`, `tts/kokoro_tts.py` | 음성 합성(문장별 캐시), 입 모양용 음량 |
| `lib/scene.mjs` | 화면 구성(배지, 차트, 말풍선 자막, 고지 문구), 썸네일, 이미지 모드 |
| `characters/rig.mjs` | 캐릭터 리그 — **임시 캐릭터**. 최종 디자인이 정해지면 이 파일만 교체 |
| `characters/drafts.mjs` | 첫 코드 시안 3안 (반려됨, 참고용) |
| `characters/gpt-prompts.md` | ChatGPT 이미지 시안 프롬프트 |
| `config.json` | fps, 해상도, TTS 엔진·목소리 |
| `assets/fonts/` | Inter 폰트(OFL) — 어느 PC에서나 같은 결과를 내기 위해 포함 |

같은 입력이면 같은 `render.mp4`가 나옵니다 (TTS 결과는 `.cache/tts/clips`에 문장별로 캐시).
