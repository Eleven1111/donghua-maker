# Look: halftone / 半调档案

A printed case file. Manila paper is multiplied over everything at the end, and there is one dark ink plus up to four
spot inks. Tone comes only from dot size and overprint, never from a gradient.

The film's grammar is a dossier: headlines pop glyph by glyph over a misregistered second ink, exhibits drop onto the
page, and a verdict stamp slams. Shots change by dot wipes. Props and characters boil at 12 poses per second; text and
dots never do. It suits rumour-busting, myth-vs-fact, case studies, "what really happened" shorts, and any film whose
payoff is a verdict.

The grammar comes from lemo-opuscar's halftone STYLE.md (MIT): only the rules were taken, none of the code.

Verified in 跳一下能保命吗 (`assets/example-halftone.html`, 9:16, 12.5 s, 3 shots, 120 bpm):
- **立案**: the rumour headline pops in, the falling car drops onto the page over a giant 50, and the exhibit tag
  reads 15 楼 ≈ 50 米. The car's floor indicator counts down 15 → 1 with a tick per floor.
- **取证**: the passenger floats in front of a height board, clear of the floor line, with a mugshot flash. Then
  证物 B · 失重, the caption 失重：脚下踩不实, a handwritten note 起跳要卡准到毫秒, and a small stamp 做不到 under
  its words.
- **结案**: the rumour is asked again at floor 1, with the exhibit tag under the car, and the page pushes in. The music
  stops for half a second, 不成立 slams on clear paper and the fall stops. The film closes on 跳一下，照样扛不住 and the
  good-news chip 电梯几乎不可能掉到底.

Fact gate: 14 strings sourced (Baird / WTAMU, Science ABC, The Naked Scientists, 科普中国). The snapped cable is marked
disputed as the rumour's premise (`example-halftone-facts/facts.json`).

## Signature features
These are checked against stills and strips (`review.md` item 8); the numbers are the toolkit's defaults at 1440 px
wide.

1. **Paper on top of everything.**
   - `HT_PAPER` is multiplied over the finished frame by `htFinish`. It is manila `#ecdcb4` with mottling (a 36 × 64
     tile, upscaled), ±7 per-pixel noise, a vignette to `rgba(150,118,78,.32)` and one horizontal fold at 54 % of the
     height.
   - Check: the fold line crosses every ink, including the stamp and the wipe.
2. **Tone only from dots.**
   - Rotated dot grids with a step of 20–24 px (64 for wipes). Screen angles are 15° (overprint teal), 45° (dark ink)
     and 75° (props).
   - Dot radius = density × step × 0.68, so dots merge near full density.
   - No gradient fill anywhere but the paper's own vignette.
3. **Five inks at most, plus paper.**
   - Ink `#2b211b`, overprint teal `#2f8c8a`, highlight mustard `#e2a92b`, and verdict vermilion `#d8432a` (stamps,
     the REC dot, the floor arrow and the gap marker only).
   - Inks meet by `multiply`, so where two overlap they darken, never cover.
4. **The misregistered headline.**
   - Black serif at weight 900 and 180 px over a teal copy offset +8/+8.
   - Glyphs pop 0.06 s apart. Each drops 30–100 px over 0.4 s with a back ease (s = 1.7) and lands with a squash of up
     to 16 %.
5. **The stamp slam.**
   - The stamp goes from 2.6× to 1× in 0.09 s, then rings out at 5 %. It is tilted −0.16 rad and multiplied at 0.93
     opacity, with ink-grain knock-outs (about 2,600 specks and 12 streaks) on a double rounded frame.
   - A 0.14 s paper-white flash (≤ 0.45), a 24 px shake that decays over 0.45 s, and a thump plus a click.
6. **Boil only on props and characters.**
   - Outlines are nudged ±3 px by noise that is reseeded every exposure (12 per second, EXPO 5).
   - Text, dots, captions, chips and the HUD never boil.
7. **Dot wipes between shots.**
   - One ink's dots (step 64, at 15°) grow from a corner until they merge (radius 0.76 × step, more than step/√2) over
     0.45 s.
   - The next shot drains them toward the opposite corner in 0.35 s, so the cut sits under full ink.
8. **Everything else pops.**
   - Chips, captions and notes scale up from 0 with a back ease over 0.4 s.
   - A caption is a dark ink pill with a teal overprint shadow (+10/+10), paper text and its keyword in mustard.

## What it is not
- **Not the American comic** (`comic`). Comic uses panel borders, balloons, spot blacks and focus lines. Here there is
  one printed page, and dots are the only shading.
- **Not the Riso row** (`styles.md` §2, a recipe with no toolkit). Riso misregisters every colour layer by boil. Here
  only the headline is off register, by a fixed +8/+8; everything else prints in register.
- **Not editorial data graphics** (`editorial`). Editorial is a white page with axes and a red story line. Here it is
  manila paper, spot inks, exhibits and a stamp: a case file, not a chart.
- **Not the layered cartoon** (`layered`). Both have stamps and pop-ins, but layered has cel shading, depth blur and
  gradients. Halftone has none of them.

## What may change
| tier | elements | evidence |
|---|---|---|
| safe to change | topic and exhibits (any prop drawn with `htInk` + clipped `htDots`), the character (`htFigure` colour, or your own puppet keylined in ink), the spot-ink hues as long as the roles stay (one dark, one overprint, one highlight, one verdict), format, the HUD text, shot count | the example reuses the sample's car and figure but adds a mugshot board, a note and a mini stamp with no toolkit change |
| changes the character, try one frame first | white paper (the print disappears), no stamp (the verdict beat goes), smooth 60 fps (the boil goes), a sixth ink | untested |
| can't change | paper multiplied last; tone only from dots; the misregistered headline; boil on props and characters only; the slam with its flash and shake | the approved sample (2026-10-23) and the example both rest on these five |

## Pipeline (per frame)
1. **Page** (screen space): fill with paper, then the teal border dots (`htEdge(amt)`, multiplied). Raise `amt` toward
   a verdict and lower it after.
2. **Camera**: `setCam`. Use a beat pulse (+0.6 %) and slow pushes; `htShake(T, t0)` after a slam.
3. **Exhibits**: `htInk` outlines (spot-ink fill with a dark keyline, boiling), and inside them `htDots` clipped to the
   shape and multiplied. Big numbers come from `htNumeral` (a flat ink with a darker dot ramp inside the glyphs; bake
   it in `build()`).
4. **Words**:
   - `htHead` for the headline;
   - `htChip` / `htCaption` / `htNote` for everything else, each popping in at its time;
   - `htSlam` for stamps (`htStampSprite`, baked in `build()`).
5. **Screen space**: `htHud`, then `htWipe` (closing k 0 → 1 from a corner; the next shot opens with k 1 → 0 from the
   opposite corner), then `htFinish(ctx, T, flash)`, which adds dust, multiplies the paper and applies the flash.
6. **Timing**:
   - Music stops ~0.5 s before the verdict; the stamp lands on a beat with thump + click.
   - Every pop gets a `pop`, and every wipe gets a `whoosh`.
   - The last 2–3 s hold the verdict and the good news.

## Toolkit (`toolkit-halftone.js`, colours `HTC`, faces `HTF`)
| call | what it does |
|---|---|
| `HT_PAPER`, `htFinish(g, T, flash)` | baked manila paper; dust + paper multiply + capped flash, last call of every frame |
| `htDots(g, { step, ang, k, col, dens, box })`, `htEdge`, `htRadial`, `htRamp` | halftone of one ink; density fields: border, radial, vertical ramp |
| `htWipe(g, k, { col, step, ang, from })` | dot wipe: grow to solid ink and drain away |
| `htWob`, `htRR`, `htEll`, `htInk(g, pts, id, e, fill, lw)`, `htLimb` | boiling outlines, rounded-rect / ellipse points, keylined spot-ink shape, outlined capsule |
| `htFigure(g, x, y, T, e, { rot, s, col, arm })` | placeholder character (local colour, paper face, glossy eyes; arm 0 down … 1 up) |
| `htHead(g, lines, x, y0, lh, size, T, t0)` | misregistered serif headline, per-glyph pop and squash |
| `htPop`, `htPill`, `htChip`, `htCaption`, `htNote` | overshoot entrance, pill with overprint shadow, data chip, caption bar, handwritten note |
| `htStampSprite(text, { w, h, size, col })`, `htSlam(g, sprite, x, y, ks, { rot, s0, sc })`, `htShake(T, t0)` | rough stamp, slam curve, camera shake |
| `htNumeral(text, { size, col, tone })`, `htHud(g, T, caseNo, subject, rec)` | giant toned numeral; case HUD with blinking REC |

Scaffold with `scaffold.py --look halftone`. Embed fonts with `font_embed.py <film>.html --fonts
notoserif,notosans,wenkai,jetbrainsmono`: serif for headlines, sans for captions and stamps, 霞鹜文楷 for notes, and
mono with a CJK fallback for chips and the HUD.

**Cost**: qa.py p50 is 60–98 ms per frame at 1440 × 2560. Every dot field is redrawn every frame, and the border field
moves, so only sprites and the paper are baked.

## Pitfalls met while building it
- **Engine name clash.** The engine already defines `PAPER` (and `PAT`). The sample's `const PAPER` threw an error,
  and a `sed` rename also renamed the engine's own copy. Everything in the toolkit is prefixed `ht`/`HT_`. Check
  story names with `grep -cE "(function|const) name\b"` = 1.
- **Stamp on a busy exhibit.** The verdict stamp over the car and the toned 50 could not be read at phone size. A stamp
  goes on clear paper next to the exhibit.
- **Paper that covers.** The car's paper-coloured shell was drawn opaque and hid the 50 behind it (review: the number
  was readable for 0.1 s). Unprinted paper is printed with `multiply`, so what is under it shows through.
- **Small words under a stamp.** The note was the smallest text on screen, and the 做不到 stamp landed on it 0.6 s
  after it appeared (review). Make the note at least 68 px and give it a second before a stamp lands beside the words,
  not on them.
- **A held frame with nothing new.** A car that hangs at one floor for 2.6 s read as dead time (review). A floor
  counter ticking down carries the fall with no new text.
- **System font in a baked sprite.** The sample's big numeral used Arial Rounded MT Bold, an Apple-licensed system
  font that cannot be embedded. It is now Noto Sans SC 900.
- **Expected qa.py clues.** "clipped 50" (the numeral bleeds off the page) and "overlap 15/50" or "1/50" (the car's
  floor indicator and the exhibit tag sit in front of the numeral) are by design. "camera steps back" is the settle after the slam.
- **pace.py cannot see a texture-only opening.** Its OPEN probe counts dots as content, so look at frame 0 yourself.

## Could be better
- The wipe is drawn inside the shots. Once a second film uses it, it could become an engine transition kind
  (`enter: { kind: 'dots' }`, shot-contract §7c).
- `htFigure` is one placeholder body. A second pose set (sitting, pointing) would make more stories possible without
  new code.
