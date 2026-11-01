# Cook ledger: Weekly Wick promo

Started: 2026-11-01 09:22 UTC
Time: floor none | cap 4h (ends 13:22 UTC)
Bar: brand match 99 per shot (composition, color, typography, detail) | motion 9/10
Calibration offset: none yet
Usage: 5h window, about 20% per hour, never 100%
Gate: stills approved no | final render not started
Best so far: round 0 (pre-cook contact sheet), commit 6th of branch

## Decisions

- 09:22 Defaults accepted by the user ("기본값으로 진행해줘"): cap 4h, Korean captions kept, code-made sound, cream paper kept as brand.
- 09:23 References are four renders of the real wick-studio brand code (no third-party clips exist for this run).
- 09:23 Critics: fresh general-purpose subagents with only images + rubric, 2 per round, median.
- 09:40 Round times before 09:40 were written from estimates and are corrected; from round 03 on the clock is read at every boundary with `date -u`.

## User feedback inbox

- (none yet)

---

## Round 00 (baseline, pre-cook scene)

Time: 09:22 to about 09:28 UTC (not read at the time; corrected from the clock at 09:40) | total elapsed about 0.1h
Usage: not readable
Focus: baseline score of the scene made before /cook.

Stills: `cook/stills/r00/` | Side by side: `cook/compare/r00/`

Scores, eyeballed: 2 fresh critics (general-purpose same model, and sonnet), median, no calibration yet.

| Shot | Comp | Color | Type | Detail |
|---|---|---|---|---|
| S01 | 45 | 74 | 43 | 44 |
| S02 | 73 | 81 | 70 | 69 |
| S03 | 73 | 79 | 77 | 72 |
| S04 | 66 | 81 | 70 | 66 |
| S05 | 65 | 77 | 71 | 65 |
| S06 | 66 | 83 | 73 | 69 |
| S07 | 73 | 79 | 79 | 71 |

Video: 6.0 and 6.0 -> median 6.0/10 (first frame 3.5, composition 6.25, color 7.25, motion 5.0, pacing 5.75). Sound not reviewed.

Measured (cook/color_check.py, render minus ref):
- S01 vs R03: saturation +0.018, brightness -0.051
- S05 vs R03: saturation -0.005, brightness -0.008
- S04 vs R01: saturation +0.118, brightness -0.217 (navy margin around the card, layout not tint)
- S06 vs R01: saturation +0.141, brightness -0.256 (same)

Top gaps from critics (both agree):
1. Frame 0 empty: no headline, no brand, no character.
2. Blank navy dips of 0.2 to 0.4 s at every cut, empty paper cards sliding in.
3. Cards and lists leave the bottom 25 to 30% empty; mascot is a corner sticker; small secondary type.
4. Static holds (week list 19 to 22 s, brand 7.6 to 9.4 s).
5. CTA entry: mascot crosses the footer, flame collides with title.

Stop check: bar no | cap 4h not reached | stills approved no | final no -> round 01
Next focus: first frame, transitions, frame fill and character scale.

## Round 01

Time: about 09:28 to 09:33 UTC (corrected, see note) | total elapsed about 0.2h
Usage: not readable
Focus: first frame + all transitions + frame fill (largest shared gaps from round 00).

Changes:
- Frame 0 is now a full thumbnail: headline and subline set, LIVE brand pill, Monday chip lit, candle mid-rise, Wick watching (mood follows the candle).
- Five distinct transitions with no empty frames: cross with a flame match cut (hook wick catches fire, brand Wick's flame lands in the same place), card cover, uncover, card cover, card-to-full-bleed expand into the CTA.
- Cards fill 150..1800 px; charts 1.5x; stamps 64 to 80 px with a displacement filter for rough ink; mascot about 1.6 to 2x on every scene.
- Week: day cursor checks off past days, Saturday row fills solid green with a heavy-spring hit; rows build in 0.8 s instead of 2 s.
- CTA is a full-bleed judges' sheet (vertical take on the X header) with both stamps and a green follow button.
- Background: vignette and diagonal gradient; the faint drifting lines are gone (ban list: long thin decorative lines).
- Timing: brand 3.8 s, rule 5.8 s, week 4.8 s, graded 5.2 s, CTA 5.4 s.
- Harness: render.mjs `shots NN`, `test a b`; frames cached on disk keyed by a hash of the scene source; cue list exported by the scene (window.CUES) feeds scripts/soundtrack.mjs.

Stills: `cook/stills/r01/` | Side by side: `cook/compare/r01/`

Scores, eyeballed: 2 fresh critics, median. Note: S04 to S07 shot times fell into the wrong scenes after the retiming (S04 showed the week list, S05 graded, S06 and S07 both CTA), so per-shot rows are not comparable with round 00. Fixed in round 02 (cook/SHOTS.md).

| Shot (as rendered) | Comp | Color | Type | Detail |
|---|---|---|---|---|
| S01 hook frame 0 | 60 | 80 | 76 | 61 |
| S02 hook wick | 69 | 82 | 74 | 68 |
| S03 brand | 74 | 77 | 82 | 71 |
| S04 week list | 63 | 78 | 77 | 63 |
| S05 graded | 63 | 83 | 75 | 63 |
| S06 CTA | 65 | 81 | 80 | 61 |
| S07 CTA end | 72 | 85 | 79 | 68 |

Video: 6.0 and 6.0 -> median 6.0/10 (first frame 5.75 up from 3.5, composition 5.75, color 7.25, motion 5.5, pacing 5.25). Sound not reviewed.

Measured:
- render speed: 0.473 s per frame at 1080x1920 (90 frames, `render.mjs test 0 3`)
- soundtrack: peak normalised to -1.0 dBFS, mean -20.6 dB (ffmpeg volumedetect)

Top gaps from critics:
1. Dead bands of 15 to 35% in most shots; mascot a corner sticker in four of seven.
2. Static holds: rule card 11.4 to 14 s, week list after 16.5 s, end card 25.4 to 30 s.
3. Stamp entrance at 2.1x and translucent reads as a render bug; stamps clipped by frame edges and arms.
4. The navy strip around cream cards reads as a letterbox.
5. Wordmark crops at the top during the slam; "이게 윅(Wick)" against the right edge.

Stop check: bar no | cap not reached | stills approved no | final no -> round 02
Next focus: frame fill and mascot role, static holds, stamp entrance.

## Round 02

Time: about 09:33 to 09:40 UTC (clock read 09:40) | total elapsed 0.3h
Focus: composition (frame fill, mascot scale and role) and static holds, the single weakest area named by both critics.

Changes:
- Paper scenes (rule, graded, CTA) are full-bleed paper with a 170 px ink band; graded to CTA is now paper to paper (band lifts away).
- Hook: big Wick (0.78) beside the candle reacting to it, wordmark top right, day chips moved to the bottom with readable inactive state, candle starts tall at frame 0, bracket label pulled inside the safe margin.
- Week: a day cursor walks the rows on the beat (0.36 s per day), past days dim, Saturday lands with a heavy spring; mascot 0.74.
- Stamps land from 1.5x at full opacity in 0.03 s; all stamps moved clear of arms and edges.
- CTA: stamps by the feet, green button with shadow, two pulse-and-hop beats at 26.9 and 28.5 s so the end card keeps moving.
- Timing: hook 5.4, brand 3.6, rule 5.1, week 5.0, graded 5.2, CTA 5.7 s; shot table moved to the new scene times.
- Decision: no star or dust texture on navy, because decorative particles are on the ban list.

Stills: `cook/stills/r02/` | Side by side: `cook/compare/r02/`

Scores, eyeballed: 2 fresh critics, median (shot table now matches the scenes).

| Shot | Comp | Color | Type | Detail |
|---|---|---|---|---|
| S01 hook frame 0 | 70 | 81 | 82 | 71 |
| S02 hook wick | 67 | 81 | 76 | 66 |
| S03 brand | 83 | 77 | 83 | 78 |
| S04 rule | 67 | 83 | 76 | 67 |
| S05 week | 66 | 80 | 76 | 65 |
| S06 graded | 68 | 78 | 78 | 69 |
| S07 CTA | 81 | 86 | 83 | 78 |

Video: 6.6 and 6.3 -> median 6.45/10 (first frame 5.5, composition 6.25, color 7.25, motion 6.0, pacing 6.0). Sound not reviewed.

Top gaps from critics:
1. Empty frame space: middle band of the hook thumbnail, rule charts tiny in thin strips, graded slots empty for 0.5 s.
2. Same vertical push used for three cuts; 24.0 s double exposure into the CTA.
3. End card reads static for about 4.5 s.
4. Hero candle flat (no gloss) next to a glossy mascot; week list has two competing focus states and the mascot hits the 토 bar.

Stop check: bar no | cap not reached | stills approved no | final no -> round 03

## Round 03

Time: 09:40 to 09:52 UTC | total elapsed 0.5h
Focus: composition density (both critics' single weakest area) and the remaining transition faults.

Changes:
- Hook starts at the Wednesday peak: frame 0 is a tall glossy green candle, Wick 0.9 and excited, 수 chip lit; the drop, the wick and the flame follow; chips stay on screen.
- Rule: each case in its own framed chart panel at 1.85x, stamps on clean paper inside the panel, footnote promoted to a 60 px two-line statement.
- Week: one focus state (the active row), 토 neutral until it lands, wordmark added, mascot below the bar.
- Graded: stamps land 0.2 and 0.85 s after the cut; key line promoted to 76 px.
- Transitions: graded now slides in horizontally (cover only used once); CTA entry is a horizontal page push with both pages opaque.
- CTA: Wick bounces the whole time (excited), stamps by the feet, button pulses and mouth opens on two beats.
- Timing: hook 4.6, brand 3.8, rule 5.6, week 5.0, graded 5.4, CTA 5.6 s.
