# Picture crew (美术组)

Purpose: scaffold the film, write the shot code, check stills and pace; look, character and transition craft.

## Read

| file | sections (by heading) | load | trigger |
|---|---|---|---|
| `references/shot-contract.md` | Shot contract & engine API (intro); 1. Clock model; 2. The shot object; 3. Library: drawing; 4. Library: physics; 5. Library: puppets; 7. Cross-shot continuity: shared rig | always | before writing shot code |
| `references/shot-contract.md` | 7c. Transitions (optional) | on-demand | transitions between shots (enter kinds ink/tear/pixel) |
| `references/styles.md` | Style library (intro); 1. Formats & composition; 4. Rhythm: pose rate | always | before scaffolding and writing shots |
| `references/styles.md` | 2. Visual looks | on-demand | read the recipe row of the chosen look only |
| `references/styles.md` | 3. Palettes; 6. Prop & puppet ideas by theme | on-demand | choosing palette or props; building a look |
| `references/catalog.md` | Look catalogue (intro); Example films | on-demand | read the entry of the chosen look only |
| `references/looks/<look>.md` | whole file of the chosen look | on-demand | the look has a file; read only that one |
| `references/frames.md` | Character frames; Two sources; Writing the prompt; Import; Use in a shot | on-demand | image frames instead of code puppets |
| `references/new-look.md` | all sections | on-demand | building a new look |
| `references/rebuild.md` | all sections | on-demand | a real object, machine or animal the film depends on |

### 2. Scaffold
```bash
python3 <skill-dir>/scripts/scaffold.py <out>.html --title "Name" --format portrait --shots "Cup,Wire,Tree,Girl" --durs "2,2.5,3.5,2" --bpm 96 --bed room --aria "one-sentence description"
```
Write `<out>.html` in the user's folder, never the skill folder. `--durs` sets each shot (else `--dur` is split evenly). Every cut sits on the eighth-note grid (30/bpm s; the script warns), and `DUR × 60` must be whole or the MP4 ends a frame short. Pixel art: `--pixel 8`, characters at 2× (1× was rejected), `references/looks/pixel.md` first.

### 4. Write the remaining shots
Follow `references/shot-contract.md`: hard cuts on the beat unless a shot opens with an `enter` transition (§7c); `draw()` reads only snapshot state, puppets get `boil()`; no `Math.random()` in `step`/`draw` (`rng(seed)` from `reset()`, or `hash()`); pre-run physics in `reset()`; props crossing shots are shared rigs; every melody note has a visible cause or effect. Portrait: action runs vertically, inside the middle 60 %.

**Bake and approve the characters before animating any shot.**
- Evidence: 射日 (shadow puppet) — a cartoon drawn from memory was rejected outright; a cast sheet built from museum
  photos of real puppets passed after a few face rounds, and the film was built on it (`looks/shadow-puppet.md`).
  小猫钓鱼: the first cat head, drawn without a photo, was rejected (`looks/clay3d.md` keeps the anatomy that passed).
- Why: a character is reused in every shot; a face problem found after four shots costs four shots.
- Use: any look that imitates a real tradition, and any animal or person. Static cast sheet first, then shot 1.

**Make the hero bigger than feels right.**
- Evidence: paper3d — the girl at scale 1 was too small at 16:9, 1.35 passed. Pixel films — 1×
  sprites on a 320×180 buffer were rejected as unreadable (`looks/pixel.md`).
- Why: the maker looks at full-resolution stills; viewers watch a phone screen, in motion, once.
- Use: judge hero size on a phone-size still (≈ 400 px wide), not the 2560 px master.

**Fill dead areas of the composition with the look's own furniture.**
- Evidence: 青绿 — the lower right half was empty silk; near-bank mounds, huts and a road fixed it (`looks/qinglu.md`).
- Use: look at the contact sheet as thumbnails; any quarter that is empty in every shot needs something.

### 5. Verify (real renders, not assumptions)
1. `python3 scripts/stills.py <film>.html --shots` (or `--at`) and look at every still, first frames included (`crew/review.md` › Step 5 in the browser, item 1): does the hero read, is anything cropped, floating or factually wrong (`references/fact-check.md`)?
2. `scripts/qa.py <film>.html` (platform portrait: `--safe 0.12,0.2`) → `QA PASS`, then `scripts/pace.py <film>.html` → `PACE PASS`. Their clues and STILL notes are frames to look at, not failures.

## Pace
`pace.py <film>.html` renders the film as exported, subtitles off, 12 frames a second, and reports per shot how much
the picture changes. It fails on a near-empty screen for ≥ 0.3 s in mid-film (BLANK), unless the blank is designed
and declared with `--allow-blank START-END:reason` (the launch look's black "stop"); the reason goes in the delivery
report. STILL notes (a shot of 3 s or more that barely changes), OPEN notes (more than 0.3 s of empty screen before the
first image) and BLUE notes (mostly blue-violet frames) point at shots to look at: a hold that lands, or dead time?
Calibration (2026-10-22, 48 local films): film_gate's fast-motion red line (0.035) does not transfer: 12 of the 34
verified examples read 0.000, since this engine moves in small stop-motion steps. On the elevator film the STILL note on
22.25–27 s matched a reviewer's "flat" remark; the reviewer's 31–42 s did not show up.

## On demand

Entries with Evidence / Why / Use are lessons proven on donghua films; add yours there (SKILL.md, Extending).

### New look or new material

**Simulate how the real material is made.**
- Evidence: sand art — clean strokes read as neon tubes; three jittered passes per stroke width made them read as
  sand.
- Why: viewers recognise a medium by the traces of its process, not by its palette.
- Use: before writing a new look's renderer, ask how the physical thing is made and code that process.

### Characters: rigs and faces

#### Action test sheet
A code rig that looks right standing still breaks when it reaches, raises an arm, runs or kneels: shoulders tear open,
a forearm detaches, shading leaks through a joint. Before the rig goes into any shot, draw it on one large sheet in
those four poses plus every key action of this film, at twice the size it will appear, and look at the stills
(`stills.py`). Check: jointed pieces overlap with no background at the seam; held props sit between the palms; the
silhouette reads. Then step through each key action at 0.2 s intervals, enlarged.
Also confirm: the character's hue and value differ from what it stands on, and its whole motion path stays clear of
other focal props. Animals and people get real anatomy from a photo before the sheet (Bake and approve the characters, above).
Evidence: on the elevator film (2026-10-21) shading the passenger's overlapping capsules with `ink()`'s evenodd shade
punched dark discs at every joint (fixed by shading the union with a clip and an offset refill).

#### Faces at final size
The maker checks faces zoomed in; the viewer sees them once, phone-sized. Scale the whole still to the phone width
(390 px for 9:16, 640 px for 16:9), then crop the face without enlarging it. At that size:
- **Brow direction carries the emotion.** Inner ends raised = worried, scared, sad. Inner ends pulled down toward the
  nose = angry. "Worried" and "angry" are one flip apart.
- **Watch what covers the eyes.** Brows under a fringe carry nothing, and a fringe, hat brim or glasses frame that
  clips an arched lid line can turn it into a frown.
- Then have a fresh reviewer name each face blind (`review.md`, Faces at final size). A face named differently from
  what it was meant to show is a defect, not taste.
Evidence: on the elevator film (2026-10-21) the new passenger's scared face read as angry on the cover. The brows were
hidden under the fringe, which clipped the arched upper-lid line into a frown; dropping that line for 'scared' fixed it.

- **Check every expression at full size after a character redesign**: see Faces at final size, above.

### Transitions

- **Transitions speak the next look's language** (the new style grows from an object in frame, not a generic wipe).
  The mechanism is shot-contract §7c; verified for determinism and
  sound on test films only, no real film has used it yet.

### Charts

- **One focus per screen**: structure first (axes, the empty map), then the data, then mark exactly one thing.
- **Charts tell the truth about their axes**: no silently truncated axis (say "axis starts at 120" on screen), units,
  a source, and an "illustrative data" tag when the numbers are made up. A reviewer reads numbers for sense too
  ("rose 9×" vs "rose to 9×"; see `review.md`).

### Scroll film

- **In a scroll film the camera only moves forward**: the most visible fault in one 24-segment film, and no metric
  caught it; a reviewer did. The rule and its mechanism: `references/looks/scroll.md` › The camera only moves forward.

### Layered look

- **Layered `heroDraw` is a stock character**: dropping it into a film with its own rig read as "a different person" to
  the blind reviewer (电梯坠落 shot 8). Use the film's own rig for every appearance of the protagonist.

### Imported hypotheses (not yet proven)

- **Region palettes beat colour jitter**: give each region (sky, water, wall) its own 7–8 swatches and draw each stroke
  from them, mixing in 30–45 % of the base tone to keep light and shade.

- **Characters go through the look's renderer too** (stroke, grain, paper multiply, halftone); flat-filled characters
  were the weakest part of most looks there.

- **Animate a texture by moving its field continuously**, not by reseeding it every few frames; whole-frame reseeds
  read as flicker (`references/new-look.md` › Hard requirements, item 3).
- **Wrap a scrolling pattern at its true period** (two rows of a hex grid, not one dot spacing): `references/new-look.md` › Hard requirements, item 3.

- **Parameterised scenes need hostile inputs**: negative numbers, long titles, portrait, missing images — a demo that
  passed review broke on real data in 5 of 8 grammars.

- **Wear stays off characters**: `references/new-look.md` › Hard requirements, item 6.

- **Same glyph text at two sizes can break determinism**: on 电梯坠落 (2026-10-21) `qa.py` flagged nondeterministic frames
  where bar digits (96 px) shared a cached-glyph key with a speed plate's 96 px digits; moving the bars to 100 px gave QA
  PASS (the 96 px build is the failing control). Suspect shared text caches when only text edges differ between a cold
  and an in-order frame.
