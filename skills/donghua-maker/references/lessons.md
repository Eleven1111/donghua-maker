# What worked (positive lessons)

Pitfalls live in each look file and in the SKILL steps. This file keeps the other half: things done **right**, so the
next film repeats them on purpose. Each entry: the practice, the evidence (what was measured or approved, on which
film), why it works, and when to use it. When you reuse an entry and it works, add the film to its evidence; when it
fails, write down where it stopped working. Read this before briefing a film; add to it in the Extending step.

## Proven on donghua films

**1. Bake and approve the characters before animating any shot.**
- Evidence: 射日 (shadow puppet) — a cartoon drawn from memory was rejected outright; a cast sheet built from museum
  photos of real puppets passed after a few face rounds, and the film was built on it (`looks/shadow-puppet.md`).
  小猫钓鱼: the first cat head, drawn without a photo, was rejected (`looks/clay3d.md` keeps the anatomy that passed).
- Why: a character is reused in every shot; a face problem found after four shots costs four shots.
- Use: any look that imitates a real tradition, and any animal or person. Static cast sheet first, then shot 1.

**2. Make the hero bigger than feels right.**
- Evidence: paper3d — the girl at scale 1 was too small at 16:9, 1.35 passed. Pixel films — 1×
  sprites on a 320×180 buffer were rejected as unreadable (`looks/pixel.md`).
- Why: the maker looks at full-resolution stills; viewers watch a phone screen, in motion, once.
- Use: judge hero size on a phone-size still (≈ 400 px wide), not the 2560 px master.

**3. Run the fact gate even when the picture check passed.**
- Evidence: 日本历史速览 (2026-09-25) — the visual check caught Edo drawn on the wrong coast; the fact pass then caught
  two text errors no screenshot could show (`fact-check.md`).
- Why: a still shows that text is readable, not that it is true.
- Use: every film that states anything about history, science, geography, business or a product.

**4. Simulate how the real material is made.**
- Evidence: sand art — clean strokes read as neon tubes; three jittered passes per stroke width made them read as
  sand.
- Why: viewers recognise a medium by the traces of its process, not by its palette.
- Use: before writing a new look's renderer, ask how the physical thing is made and code that process.

**5. Fill dead areas of the composition with the look's own furniture.**
- Evidence: 青绿 — the lower right half was empty silk; near-bank mounds, huts and a road fixed it (`looks/qinglu.md`).
- Use: look at the contact sheet as thumbnails; any quarter that is empty in every shot needs something.

**6. Prove each verification step can fail before trusting its green.**
- Evidence: `scripts/qa.py` (2026-10-08) — run on 9 earlier films, its backdrop-leak swap found leak bands in red-kite,
  shadow-archer and spring-rain that the still check had passed, and a canvas state leak in paper-night. Its first
  version reported 12 nondeterministic frames that were the browser switching raster mode, not the film; a deliberately
  broken copy of a film for every check (plus an unchanged copy that must stay green) caught that and two mutations
  that had silently changed nothing.
- Why: a check that never fails tells you as much as no check.
- Use: when you add a gate, break a film on purpose for it once, and keep one untouched control.

**7. Reset shared drawing state between shots.**
- Evidence: paper-night — 写字 left `lineCap = 'round'` on the canvas, so later shots looked different when reached in
  order than when opened directly. Wrapping each shot's `draw` in `save()`/`restore()` in the engine removed it in
  paper-night, clay-fishing and chanjuan, with every other film's numbers unchanged.
- Use: never rely on canvas state set in another shot; the engine now resets it, and `qa.py` catches regressions.

**8. A fix in `engine.html` does not reach the example films: each embeds its own engine copy.**
- Evidence: 2026-10-19, `qa.py` on `example-torn-paper-night.html` (catalogued as verified) returned QA FAIL: 5 nondeterministic
  frames in 夜城 and 纸飞机, identical on a rerun. Cause: its render path called `s.draw(...)` without the `save()`/`restore()`
  wrap that #7 added to the engine, so a stroke state set in one shot leaked into the next (the dashed trail behind the paper
  plane drew differently when a frame was reached in order vs cold). The one-line wrap on that call gives QA PASS with 0
  nondeterministic frames; the unpatched copy is the control that still fails. 21 stills compared before/after: 18 identical,
  3 differ by about 0.1% of pixels (the trail), nothing else.
- Why: lessons are written against `engine.html`, while films are copies. A check that passes on a fresh scaffold says nothing
  about an old example.
- Use: when a film or example fails `qa.py` determinism, first diff its render path against `engine.html`'s.
  Sweep 2026-10-20, `qa.py` on all 33 examples: 27 PASS; 6 FAIL. `example-film16` had the same nondeterminism (灯塔, 2 frames)
  and went PASS with the same one-line wrap. The other 5 are backdrop leaks (layered ×3 shots, qinglu, red-kite,
  shadow-archer, spring-rain), a different class that needs the film's own camera start moved, not the engine wrap, and
  are still open. A static grep for the missing wrap (31 files) over-predicted: only 2 of them were nondeterministic.

**9. A launch film needs a fresh-eyes read of its words, not only its picture.**
- Evidence: 拾事 (`looks/launch.md`, 2026-10-20). `qa.py` PASS, audio report clean, full-resolution stills approved by me; a blind
  reviewer (stills only, the six `review.md` questions) still found three things all of those had passed: the counter caption
  "上周，被忘在会议室里的待办" sat over a 7 → 0 count-down and said the opposite of what the count did (now "会后没人认领的待办");
  the two disclaimers were about 12 px on a 1280 frame (raised to 44 px world, 0.9 alpha); the end card spent 0.5 s on the
  mark alone before the name came in (mark draw 0.8 → 0.5 s, name 0.5 → 0.3 s). QA PASS again, 0 nondeterministic frames.
- Not acted on, on purpose: the near-empty frame at 3.9 s and the half-cropped caption at 14.0 s are the exit masks of the
  lift-away, wrong only as stills; a badge showing 3 beside three ticked rows (open count vs done count) and "strobe" risk from five
  alternating dark/light cuts are unverified without playback.
- Why: a still shows that text is there and readable, not that it agrees with the number beside it.
- Use: after the picture passes, read every caption against the figure it sits on, at phone size.

## Imported, not yet proven here

From another code-animation skill (art-style speed-run films, 36 looks). Treat each as a hypothesis: when a donghua film
confirms or refutes one, move it up with the evidence, or delete it.

- **Film rhythm checklist (`styles.md` §4b: route, energy curve, hook within 3 s, burst, stop)**. Imported from huashu-motion's
  measurements of launch films. First trial, 2026-10-19, on 晚安纸条 (7 shots, 28 s), which was not built with it: shot lengths
  4 / 4.5 / 4 / 4 / 3.5 / 3.5 / 4.5 s, one 6–9-note music-box phrase per shot at 120 bpm, no burst, no stop, only a window
  lighting at ~2 s in the first 3 s. A blind reviewer (stills only) given the new attention question also said nothing hooked
  it in the first 3 s, matching the code reading. Limits: one film, no negative control (no film known to be well paced was
  run), and the same reviewer mislabelled which shot a dead stretch belonged to, so stills cannot place pacing problems in
  time. The reviewer without the new question found the same logic and text defects but gave no pacing verdict. Promote
  only after a film built with the checklist is judged better, or a well-paced film passes it.
- **Transitions speak the next look's language** (the new style grows from an object in frame, not a generic wipe).
  The engine now has the layer (`enter`, kinds ink / tear / pixel, shot-contract §7c), verified for determinism and
  sound on test films only; no real film has used it yet.
- **Region palettes beat colour jitter**: give each region (sky, water, wall) its own 7–8 swatches and draw each stroke
  from them, mixing in 30–45 % of the base tone to keep light and shade.
- **Characters go through the look's renderer too** (stroke, grain, paper multiply, halftone); flat-filled characters
  were the weakest part of most looks there.
- **Animate a texture by moving its field continuously**, not by reseeding it every few frames; whole-frame reseeds
  read as flicker.
- **Wrap a scrolling pattern at its true period** (two rows of a hex grid, not one dot spacing), or the wrap frame jumps.
- **Stillness is a choice of grammar**: story and type-led films sit still on the punchline; a style showcase must stay
  alive. Read `qa.py`'s static column against the film's grammar.
- **Parameterised scenes need hostile inputs**: negative numbers, long titles, portrait, missing images — a demo that
  passed review broke on real data in 5 of 8 grammars.

- **Tighten a montage by shortening shots, not by raising the tempo**: keep one BPM and cut each section a few eighths
  shorter (6 → 4 → 3 → 2 → 1), then hold the last shot long for the payoff. The ear hears it speed up; the beat grid
  stays clean.
- **One short motif through the whole film, re-voiced per section** (each section's own instrument), over a single
  four-chord loop. Hard attacks on the cuts; no crossfades or whooshes in a montage.
- **The reveal frame is the accent**: put the downbeat on the frame where the new thing *shows*, not where its move
  starts. A transition's first visible change and a punch belong on the same beat.
- **When the first shot has no cut to borrow, let it paint itself**: strokes write on, colour plates land one by one,
  pixels light row by row. Frame 0 is otherwise a blank sheet.
- **One focus per screen**: structure first (axes, the empty map), then the data, then mark exactly one thing.
- **Charts tell the truth about their axes**: no silently truncated axis (say "axis starts at 120" on screen), units,
  a source, and an "illustrative data" tag when the numbers are made up. A reviewer reads numbers for sense too
  ("rose 9×" vs "rose to 9×"; see `review.md`).
- **In a scroll film the camera only moves forward**: track a monotonic target (the running maximum, then smooth it). A
  camera that steps back while a character pauses was the most visible fault in one 24-segment film, and no metric
  caught it; a reviewer did. Now built in (`toolkit-scroll.js`, `looks/scroll.md`) and counted by `qa.py`; proven on the
  example film only.
- **Wear stays off characters**: peeling, stains and scratches on a figure read as damage to the figure; keep them on
  the backdrop.
- **Same glyph text at two sizes can break determinism**: on 电梯坠落 (2026-10-21) `qa.py` flagged nondeterministic frames
  where bar digits (96 px) shared a cached-glyph key with a speed plate's 96 px digits; moving the bars to 100 px gave QA
  PASS (the 96 px build is the failing control). Suspect shared text caches when only text edges differ between a cold
  and an in-order frame.
- **Layered `heroDraw` is a stock character**: dropping it into a film with its own rig read as "a different person" to
  the blind reviewer (电梯坠落 shot 8). Use the film's own rig for every appearance of the protagonist.
- **Check every expression at full size after a character redesign**: on 电梯坠落 (2026-10-21) the new chibi's
  'scared' face read as angry on the cover. The cause was not the brows (hidden under the fringe) but the arched upper-lid
  line, clipped by the fringe into a frown. Dropping the lid line for 'scared' fixed it. Also: shading a union of
  overlapping capsules with `ink()`'s evenodd shade punches dark discs at every joint; shade such unions with a clip and
  an offset refill instead.
