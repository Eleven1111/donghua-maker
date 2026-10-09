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

## Imported, not yet proven here

From another code-animation skill (art-style speed-run films, 36 looks). Treat each as a hypothesis: when a donghua film
confirms or refutes one, move it up with the evidence, or delete it.

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