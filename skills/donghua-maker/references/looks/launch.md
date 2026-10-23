# Look: Product launch film / 产品发布片 (`--look launch`)

A launch spot for a software product, built the way studio spots are made: a stage that is deep ink or warm paper with slow colour glow, glass UI panels rebuilt with live type, headlines that spring in on the beat, a cursor that clicks, panels that turn in perspective, a counter that ticks, and one isolated button to end on. No mascot, no narration: the picture and the music carry it, and it reads with the sound off.

Verified in 拾事 (`assets/example-launch.html`, 16:9, 18 s, 5 shots, 120 bpm), a **fictional** meeting-notes product; every number on screen is demo data and the end card says so. Embed one font: `--fonts notosans`.

How it differs from its neighbours: `ui-demo` is a cute mascot operating one app; `opsboard` is one long take of a pipeline; `kinetic` is type alone. This look is a **short film with a rhythm plan**: a hook, a demo spine, a burst of cuts, a stop, a payoff and an end card (`styles.md` §4b).

## Where the form comes from
Primary sources were launch-film breakdowns and roundups read on 2026-10-20 (hound-studio, trydemotion, advids): treat them as hypotheses, not law. What they agreed on, and what this look does with it:
- Show the real interface within about 10 s, not abstract bubbles → shot 2 rebuilds the product's own UI (transcript → task list), shown at 4 s.
- A hook inside 3–7 s that states the pain or the outcome → shot 1: the mess, then one slammed question.
- Contrast every few seconds (light/dark, type/UI, close/wide) → the stage flips dark/light on every cut of the burst.
- Kinetic type as the message when there is no voice-over → `lcWord` / `lcLine`.
- Panels turned in 3D over a soft gradient glow → `lcTilt` over `lcStage`.
- Cuts landing on percussion; one isolated button as the call to action → the burst is cut on the 8th-note grid; shot 5 shows one button alone.
Not copied from anywhere: the product, the copy, the layout, the code. The sources are marketing blogs that also sell launch video; their numbers are the publishers' own.

## Pipeline, in order
1. `lcStage(g, t, mix)`: ink → paper (`mix` 0..1) plus three colour blobs on fixed Lissajous paths. Continuous in `t`, never reseeded, so it can't flicker.
2. Content in world px with `setCam` (a slow push-in of 3–7% per shot is the only camera move).
3. Panels: draw into `lcOff(key, w, h)` (a cached offscreen; keep a 100 px margin for the shadow), then `lcTilt(g, canvas, cx, cy, ry)` onto the stage.
4. Things that fly between panels (a task row, a number) are drawn flat on the main canvas; aim them with `lcTiltPt` so they land on the tilted slot without a jump.
5. Headlines: `lcWord` / `lcLine`. Counters: `lcNum`. End card: `lcLogo`, `lcWord`, `lcButton`.
6. Sound per `references/audio.md` §3 (the `ui` set), one event per landing, within one frame of the picture.

## Toolkit (`toolkit-launch.js`)
| call | what it does |
|---|---|
| `lcStage(g, t, mix, {glow, ph})` | the stage; `glow` scales the blobs (0 = black stage, used for the stop) |
| `lcPanel(g, x, y, w, h, {light, r, a})` | glass panel: soft shadow, hairline lit from the top edge |
| `lcOff(key, w, h)` → `[canvas, ctx]` | cached, cleared offscreen |
| `lcTilt(g, canvas, cx, cy, ry, {roll, scale, f})` | perspective turn about the vertical axis; columns snapped to whole pixels, far edge smaller and darker |
| `lcTiltPt(ry, cx, cy, ux, uy)` → `[x, y, scale]` | where a panel point lands (offsets from the panel centre) |
| `lcWord(g, str, x, y, size, k, {motion, out, grad})` | `rise` (through a mask, springs past its mark) / `slam` / `pop` / `fade`; `grad` = brand gradient |
| `lcLine(g, words, cx, y, size, st, t0, gap, {hot})` | words land one after another; `hot` indexes take the gradient |
| `lcPath(pts, st)`, `lcCursor`, `lcRipple` | cursor along `[[x, y, t], …]` (Catmull-Rom, eased legs), click ripple |
| `lcRow`, `lcTranscript`, `lcAvatar`, `lcChip` | task row with a self-drawing tick; transcript with a marker sweep; avatar; pill |
| `lcNum(g, v, cx, y, size)` | fixed-width digits, so a ticking counter doesn't shimmy |
| `lcButton`, `lcLogo`, `lcGhost` | one springing button; a ring + tick mark that draws itself (stand-in for the real mark); drifting half-sentences for the hook |
| `lcBack(k)`, `lcHit(st, t0)`, `lcMix`, `lcA` | the spring, a decaying hit for flashes and presses, colour helpers (`#rrggbb` only) |

## Colour and type
- Ink `#090b11`, panel `#161a27`, paper `#f2f0ea`, text `#f5f6fa` / `#12141c`, mute `#8c93a6` / `#6b7184`.
- Brand violet `#6c63ff` + coral `#ff8a5b` (`LC.acc`, `LC.acc2`) are the only saturated colours; green `#2fd08a` is reserved for "done / zero left". Override `LC.acc` and `LC.acc2` per product with `Object.assign(LC, …)` **after** the toolkit (the toolkit is pasted after `BEAT`/`baseScore`, so touching `LC` earlier hits the temporal dead zone).
- One typeface, weights doing the work: 800–900 headlines, 500 transcript, 600–700 UI. Never two heavy words at the same size.

## Rules
- **Rhythm plan first** (`styles.md` §4b): write route, energy per shot and the hook before building. 拾事: energy 5 → 7 → 9 → 3 (a stop) → 8 → 4; cuts of the burst are 3, 3, 2, 2, 2 eighths (0.75, 0.75, 0.5, 0.5, 0.5 s); every cut is on the 8th grid.
- **Real UI**: rebuild the product's own screens with live type. Anything on screen must be something you could point to in the product; demo data is labelled as such.
- **Light/dark alternate on the burst**, and the first shot and the end card also contrast with their neighbours.
- **A landing is a sound.** Pop for a thing that appears, click for a press, toggle for a tick, success for the last of a group, ding for the end mark. Keep 5–6 roles.
- **The stop**: black picture and a gap in the groove; the next hit lands on the first frame back. Measured in the example: the mix falls from about −13 dBFS to −30 dBFS by the end of the gap (reverb tails keep it from true silence); the re-entry is −13 dBFS.
- Fake brands only. A launch look is easy to point at a real company; don't use real names, logos or marks.

## Cost
`qa.py` ms column (CPU raster, 2560×1440): about 100 ms/frame for a stage plus type (three full-frame gradients are the base cost), about 185 ms with two tilted panels. Each tilted panel is one offscreen draw plus ~320–640 column blits; strips are 4 px for small angles (|ry| < 0.15) and 2 px otherwise. If a film needs three or more tilted panels, bake the static ones once.

## Pitfalls met while building it
- Column strips overlapped by 0.8 px to hide seams drew the translucent shadow twice and left a comb of dark lines under the panels. Snap every strip edge to a whole pixel and don't overlap.
- A dark-stage vignette dirtied the corners of the paper stage. The look uses a very light one (`VIGN_TONE ['2,4,10', .02, .12]`).
- A progress ring that shared a radius with the headline above it crossed the label. Keep rings inside a box of their own and units outside the ring.
- The first plan to kill the music for half a second left reverb tails at −22 dBFS; the gap had to start a beat earlier (the last burst hit at 11.0 s) to reach −30 dBFS.
- `Object.assign(LC, …)` placed in the story head (before the toolkit) threw a ReferenceError: put brand overrides after the toolkit.

## What could still be better
- No motion blur on fast moves (the engine has none); a 3-sample accumulation on the cursor and the flying rows would help.
- Panels are flat glass: no real backdrop blur (a pre-blurred copy of the stage behind each panel would add it at the cost of one more offscreen).
- Only one transition: the hard cut on the beat. A dark↔light match cut that grows from a shared shape (a ring becoming the logo) would suit this look; prove it in a film before adding a transition kind to the engine.
- Two directions the brief did not take, one line each: (B) a hardware-style hero object turning on a plinth with spec callouts; (C) editorial type poster, no UI, one data point per cut.

## Review
Independent review of the example (`references/review.md`, six questions) is recorded in `lessons.md` (entry 9). Pacing in motion is UNVERIFIED: the reviewer saw stills only, and the rhythm plan is the imported hypothesis of `styles.md` §4b.
