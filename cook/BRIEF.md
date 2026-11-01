# Brief: Weekly Wick promo

Target: 30 s vertical (1080x1920, 30 fps) Korean promo for the X account @weeklywick. Stack: one HTML/SVG scene (`video/weekly-wick-promo/index.html`, pure function of t, `window.seek`), Playwright frames, ffmpeg.
References: cook/refs/R01 to R04, all rendered from the real brand code in wick-studio (branch claude/new-session-pbeq7n). Recreate the brand closely (logo, colors, character, stamps); motion is own style.
- R01 verdict card, style B judges' sheet (wick-studio render.mjs --card, sample data)
- R02 X header (scripts/brand-assets.mjs)
- R03 existing 9:16 video thumbnail (dark navy video world)
- R04 X avatar, excited
Bar: brand match (layout, typography, color, character, stamps) 99 per shot. Video 9/10 or more by critic median (strong short-form promos count as 8.5). Dimensions: composition, color, typography/materials, detail, motion.
Calibration offset: none yet.
Rules: real brand assets only (rig, Inter, Pretendard for Korean, stamp construction). Code-made sound (whoosh, stamp thump, pop, beat) only if it holds up, else free licensed audio with credits. No narration. Default slop ban list. Exception kept on purpose: the cream judges' sheet paper is the real brand card style B. Korean on-screen captions stay (they carry the message), so the X "no text" rule does not apply. A new scene every 6 to 7 s, impressive first frame. "Not financial advice" on screen. No performance numbers, no return promises, no buy/sell advice.
Time: hard cap 4h. Started: 2026-11-01 09:22 UTC.
Usage: 5h window, about 20% per hour, never 100%.
Hardware: cloud container CPU, headless Chromium. Final quality offline.
Deliverable: approved stills, then 1080x1920 30 fps 30 s MP4 with audio. No final render before approval in chat.
Permissions: download free licensed audio only if needed; commit and push to branch ccr-30cc68d8-2ksr7q only; no publishing, no PR.
User's words: "WEEKLY WICK 홍보 영상, 9:16 30초, 한국어로 해줘" / "/cook 으로 Weekly Wick 영상 다시 진행해줘" / "기본값으로 진행해줘"
