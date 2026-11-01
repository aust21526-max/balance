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

Time: 09:40 to 09:42 UTC (clock) | total elapsed 0.3h
Focus: composition density (both critics' single weakest area) and the remaining transition faults.

Changes:
- Hook starts at the Wednesday peak: frame 0 is a tall glossy green candle, Wick 0.9 and excited, 수 chip lit; the drop, the wick and the flame follow; chips stay on screen.
- Rule: each case in its own framed chart panel at 1.85x, stamps on clean paper inside the panel, footnote promoted to a 60 px two-line statement.
- Week: one focus state (the active row), 토 neutral until it lands, wordmark added, mascot below the bar.
- Graded: stamps land 0.2 and 0.85 s after the cut; key line promoted to 76 px.
- Transitions: graded now slides in horizontally (cover only used once); CTA entry is a horizontal page push with both pages opaque.
- CTA: Wick bounces the whole time (excited), stamps by the feet, button pulses and mouth opens on two beats.
- Timing: hook 4.6, brand 3.8, rule 5.6, week 5.0, graded 5.4, CTA 5.6 s.

Stills: `cook/stills/r03/` | Side by side: `cook/compare/r03/`

Scores, eyeballed: 2 fresh critics, median.

| Shot | Comp | Color | Type | Detail |
|---|---|---|---|---|
| S01 hook frame 0 | 80 | 88 | 87 | 78 |
| S02 hook wick | 78 | 86 | 83 | 77 |
| S03 brand | 83 | 89 | 89 | 81 |
| S04 rule | 77 | 86 | 84 | 74 |
| S05 week | 81 | 86 | 87 | 77 |
| S06 graded | 70 | 85 | 84 | 69 |
| S07 CTA | 84 | 90 | 88 | 81 |

Video: 6.6 and 6.7 -> median 6.65/10 (first frame 7.0, composition 6.75, color 7.75, motion 6.0, pacing 6.25). Sound not reviewed.

Top gaps from critics (both name motion and transitions as the weakest area):
1. Four transition styles with a visible seam on the horizontal slide; the week rows entered on a diagonal staircase.
2. End card read as frozen for 4.6 s in the contact sheet (the pulses were too small to show at 1.27 s sampling).
3. Graded card: empty stamp slots after the cut; the sorry pose read as drowsy.
4. Hook: nearly static first 1.3 s; minor candles clipped at the right edge; Friday label collides with candles.
5. Rule: the unplayed second candle read as broken; low panel contrast.

Stop check: bar no | cap not reached | stills approved no | final no -> round 04

## Round 04

Time: 09:43 to 09:48 UTC (clock) | total elapsed 0.4h
Focus: motion and transitions (single weakest area for both critics), then the graded-card void.

Changes:
- One motivated transition system: paper always enters from below and leaves upward (brand to rule, week to graded, rule to week), navy to navy is the flame cross, paper to paper is a page push.
- Hook: slow camera push on the chart and Wick only (HUD stays fixed), minor candles inside the margin, Friday label under the line, chips lower, 목 amber and 금 red.
- Week rows rise into a fixed column; tighter row pitch so Wick clears the Saturday bar; brighter day letters.
- Rule: panels with a drop shadow and darker fill; a candle that has not played yet is not drawn.
- Graded: stamps land as the paper arrives (0.0 and 0.6 s); tense pose instead of the drowsy tilt; Wick 0.85.
- CTA: English tagline dropped (it lives in the brand scene), Wick 1.5x, three pose beats (hop with arms up, button press, stamps re-ink at 4.1 s).
- Paper gets a soft warm vignette.
- Retimed: hook 5.0, brand 3.2, rule 5.8, week 4.6, graded 6.0, CTA 5.4 s.

Stills: `cook/stills/r04/` | Side by side: `cook/compare/r04/`

Scores, eyeballed: 2 fresh critics, median.

| Shot | Comp | Color | Type | Detail |
|---|---|---|---|---|
| S01 hook frame 0 | 82 | 90 | 87 | 81 |
| S02 hook wick | 81 | 89 | 84 | 79 |
| S03 brand | 82 | 82 | 87 | 81 |
| S04 rule | 80 | 85 | 81 | 78 |
| S05 week | 75 | 85 | 84 | 76 |
| S06 graded | 79 | 89 | 86 | 81 |
| S07 CTA | 85 | 91 | 86 | 85 |

Video: 6.6 and 6.8 -> median 6.7/10 (first frame 6.75, composition 6.75, color 7.75, motion 6.25, pacing 6.25). Sound not reviewed.

Top gaps from critics: the hook-to-brand cross dissolve reads as a dead dip; vertical cover/uncover leaves old content visible behind the moving paper ("overlap"); end card and hook first second look static in 1.27 s samples; week list is text-only with an empty lower third.

Stop check: bar no | cap not reached | stills approved no | final no -> round 05

## Round 05

Time: 09:47 to 09:51 UTC (clock) | total elapsed 0.5h
Focus: motion grammar and pacing (weakest area for both critics).

Changes:
- Timing locked to the 120 bpm soundtrack: every cut, stamp hit, day tick and hop lands on a beat or half beat.
- Transitions: hook to brand is a hard match cut on the beat (lit wick to lit Wick, wordmark already slamming); every navy/paper change is a true push (old scene leaves upward while the new one arrives, no overlap); paper to paper stays a horizontal page push.
- Hook: the first beat visibly shoots the candle higher; Wick fully inside the frame; candle body has gloss and a shaded side; two hops on the beat at the end.
- Week: eighth-note day cursor, larger rows, smaller Wick clear of the bar.
- Rule: hop beat in the quiet stretch. CTA: Wick bounces and sways continuously, flame breathes, four beats.
- Retimed: hook 5.5, brand 3.0, rule 5.5, week 4.0, graded 6.0, CTA 6.0 s.

Stills: `cook/stills/r05/` | Side by side: `cook/compare/r05/`

Video: 6.8 (A) and 6.5 (B) -> median 6.65/10 (first frame 7.0, composition 6.5, color 7.25, motion 6.0, pacing 5.75). Sound not reviewed. Flat against round 04.

Top gaps from critics: the back half (8 to 30 s) is a slow slideshow: scenes get longer, sit static after their builds, and the same vertical push repeats three times; S05 is a text-only list; S06 holds 4.5 s fully built; end card about 6 s.

Stop check: bar no | cap not reached | stills approved no | final no -> round 06

## Round 06

Time: 09:52 to 09:58 UTC (clock) | total elapsed 0.6h
Focus: back-half pacing and structure (the single weakest area for both critics), since small fixes had stopped moving the score.

Changes:
- Rule, week and graded cut to 4.0 s each with every event on a beat and no post-build hold.
- New scene, the Saturday verdict card (20.5 to 25.0 s): the full-bleed judges' sheet shrinks into the real brand card style B on navy; rows are ink-redacted on purpose (no invented tickers or numbers), QUALIFIED / QUALIFIED / VANISHED slam on consecutive beats, Wick pops in and hops.
- Transitions: hook to brand match cut, two vertical pushes, one horizontal push (week to graded), shrink (sheet to card), grow (card to CTA sheet). Each is motivated by what the paper does.
- CTA down to 5.0 s with three beats and a stamp re-ink.
- Pill widths measured per character class so uppercase labels never clip.
- Shot list gains S07 (verdict card vs R01); the CTA becomes S08.

Stills: `cook/stills/r06/` | Side by side: `cook/compare/r06/`

Video: 6.7 (A) and 6.5 (B) -> median 6.6/10 (first frame 7.0, composition 6.75, color 7.75, motion 6.0, pacing 5.75). Sound not reviewed.

Top gaps from critics (both): blank paper frames inside the shrink and grow morphs (20.2 and 24.7 s); verdict card too small with tiny stamps and a mascot on its corner; end card hold; small layout collisions on the CTA (flame into WICK on the hop, stamps through arms, button near the footer); hook middle band.

Stop check: bar no | cap not reached | stills approved no | final no -> round 07

## Round 07

Time: 09:58 to 10:04 UTC (clock) | total elapsed 0.7h
Focus: the morph transitions (worst moment for both critics), then the verdict card and CTA layout.

Changes:
- Shrink and grow are real zooms: the graded page scales down into the card with its copy on it, and the card scales back up to full-bleed with its copy on it; content swaps on the beat when the zoom lands, so no frame is empty.
- Verdict card 940 x 1175 with 56 px stamps; Wick seated inside the card's empty lower band with @weeklywick, as on the real card.
- CTA: hop height 40, stamps clear of the body, handle, subline and button lifted off the footer.
- Hook: chart group moved up 80 px into the middle band, chips raised off the footer.
- Critic prompt now states that particles and specks are banned and the redaction is deliberate (both critics kept asking for them).

Stills: `cook/stills/r07/` | Side by side: `cook/compare/r07/`

Video: 7.2 (A) and 6.5 (B) -> median 6.85/10 (A: first frame 7.5, composition 7.0, color 7.5, motion 6.5, pacing 7.0). Sound not reviewed. Best so far.

Top gaps from critics: cream scenes low contrast (panels beige on cream, stamps washed out); stamp landing reads as a soft blur; card copy swaps in one frame at the end of the shrink; Wick turns happy during the "only the tail is left" beat; week list empty on the right; graded scene thin below the stamps; no finish layer (Wick floats with no ground).
Unverified claim rejected: critic A said finished rule copy shows mid-push at 8.37 s; the r08 cut strip shows it does not.

Stop check: bar no | cap not reached | stills approved no | final no -> round 08

## Round 08

Time: 10:03 to 10:08 UTC (clock) | total elapsed 0.75h
Focus: the cream scenes (B's weakest area) and stamp feel (A's motion notes).

Changes:
- Stamps at full ink opacity and a hard slam (1.3x to 1x on a stiff spring, about 0.1 s).
- Rule panels: near-white fill with a clear ink border (contrast against the paper).
- Graded: labels 66 px black, stamps 84 px, lines respaced to fill the page.
- Week: every row sits on a full-width card, so the right side is not empty.
- Wick gets a soft ground shadow in every scene.
- Hook: Wick stays defeated through the tail beat and only lights up on the final hop before the cut.
- Shrink morph: the card copy crossfades in over the last 20% of the zoom.

Stills: `cook/stills/r08/` | Side by side: `cook/compare/r08/`

Video: 7.3 (A) and 7.3 (B) -> median 7.3/10 (first frame 7.5, composition 7.25, color 8.0, motion 7.0, pacing 7.0). Sound not reviewed. Best so far (+0.45).

Top gaps from critics: back-half holds (verdict card static after stamps, end card about 3 s of identical samples); the grow zoom fills the frame with giant redaction bars before the end card; stamps clipping frame edges in the brand and CTA scenes; "이게" orphaned on its own line; tiny red close body reads as a T; middle-scene elements too small.

Stop check: bar no | cap not reached | stills approved no | final no -> round 09

## Round 09

Time: 10:08 to 10:12 UTC (clock) | total elapsed 0.8h
Focus: brand fidelity on paper and back-half pacing.

Changes:
- Found in lib/cards.mjs: on cream the brand uses darker stamp inks (QUALIFIED #1f8a54, VANISHED #6b6457, TRAILED SPY #c0392b). All paper-scene stamps now use them (the source of the recurring "washed out stamps" note).
- Card to CTA is a 0.3 s card flip instead of zooming the redaction bars.
- Verdict scene 5.5 s with stamps on beats 1, 3, 5 and Wick popping in after; CTA 4.0 s with three beats and a stamp re-ink.
- Middle scenes scaled up: verdict card 980 x 1225, larger headlines, Wick larger in rule, week, graded and card.
- Stamps pulled inside the safe area in the brand and CTA scenes; "이게 윅" on one line with a small "(Wick)" under it; Friday close body 150 px so it reads as a candle body.

Stills: `cook/stills/r09/` | Side by side: `cook/compare/r09/`

Video: 6.8 (A) and 7.2 (B) -> median 7.0/10. Regression from round 08 (7.3). Sound not reviewed.
Why (A): the longer verdict hold (5.5 s), the flip squashing the text, a 4 s end card of near-identical samples, and the CTA repeating the brand-scene stamp layout. Critic B's report had several factual misreads (mascot sizes, frames from the wrong scene) and is weighted lower this round.

Stop check: bar no | cap not reached | stills approved no | final no -> round 10 (fix the regression, keep round 09's real gains)

## Round 10

Time: 10:12 to 10:15 UTC (clock) | total elapsed 0.9h
Focus: undo what lost points in round 09, keep the brand inks and scale gains.

Changes:
- Verdict scene back to 4.5 s: stamps on consecutive beats, Wick pops on beat 4, two hops after.
- Card to CTA: plain vertical push (the flip is gone).
- CTA 4.0 s without the duplicated stamp pair; three beats.
- New loop tail (28.5 to 30 s): a push back into the hook's first frame, so the film loops seamlessly on X. Measured: last frame vs frame 0 mean abs diff 0.34/255 (flame flicker only).
- Week 3.5 s: cursor on eighth notes from the first beat.
- Retimed: hook 5.5, brand 3.0, rule 4.0, week 3.5, graded 4.0, verdict 4.5, CTA 4.0, loop 1.5 s.

Stills: `cook/stills/r10/` | Side by side: `cook/compare/r10/`

Video: 7.3 (A) and 7.0 (B) -> median 7.15/10. Recovered from round 09 (7.0), still below round 08 (7.3). Sound not reviewed.
A's weakest area: the week list (dark UI menu, low contrast, half-empty until the last half-second, flame edge artifact at 13.97 s). B's: the first frame. Both: stamps should land on the cut, not a beat later.
Decision: the smoke puffs on a gloomy Wick come from the real character rig (characters/rig.mjs), not decorative particles, so they stay.

Stop check: bar no | cap not reached | stills approved no | final no -> round 11

## Round 11

Time: 10:16 to 10:19 UTC (clock) | total elapsed 1.0h
Focus: the week scene (A's weakest), stamps on the cut.

Changes:
- Week rebuilt as three large cards with the brand's real status pills from lib/cards.mjs statusPill: 월 GRADED · Exit report (#7fb2ff), 목 LIVE · Confirms at Friday close (amber), 토 CONFIRMED · Weekly close (green, full card). Each lights on its own beat (0, 0.5, 1.0 s); Wick rises in at 1.2 s and hops at 2.0 s. 3.0 s.
- Rule and verdict: first stamp on the cut, second half a beat later, closing line at 1.0 s.
- Hook to brand is now a push like the other navy/paper cuts.
- CTA 4.5 s with four beats; more air between Wick, the handle and the button.
