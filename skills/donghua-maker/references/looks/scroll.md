# Long scroll (长卷穿越): one walk through several looks

A hero walks left to right along one long horizontal scroll; the scroll is several worlds laid end to end, each in its
own look. Crossing a seam changes the world **and the hero's drawing** in the same instant: the hero is clipped at the
seam, half in one medium and half in the next. Example: `assets/example-scroll.html` (穿过三幅画, 12 s, paper village →
ink mountains → woodblock sea).

```bash
python3 scripts/scaffold.py film.html --title "…" --shots "纸村,墨山,浮世浪" --durs "4,4,4" --bpm 120 --scroll paper,inkwash,ukiyoe
```
`--scroll` gives one look per shot (`paper` = the core look) and pastes `assets/toolkit-scroll.js` plus each look's
toolkit. Film-level settings a toolkit declares (`POST_GRAIN`, `SMOOTH_DEFAULT`, `VIGN_TONE`) can't differ per world: they
are dropped and listed, set them once in the story if you want them. Two toolkits that declare the same name can't share a
film yet; scaffold says which.

## One world = one shot
Each stub is `SCROLL.add(S1, { name, w, back, hero, front?, seam?, ground?, acts?, end? })` (interface at the top of
`toolkit-scroll.js`). The shot's `t0`/`t1` are the moments the hero crosses into and out of the world, so the seams land
on the scaffold's beat grid by construction. The walking speed in a world is derived from its width minus its acts; size
the widths so the speed is the same everywhere (the example uses `SPEED * walking time`), or the stride visibly changes
at a seam. `SCROLL.speeds` lists them.

- **Coordinates**: `back`, `front` and `hero` draw in *world-local* x (0 … w) and screen y. For a layer that covers the
  screen (sky, a swell band) or moves with parallax, `setTransform` to screen space or translate by `S.camX * (1 - k)`:
  the seam clip is in device space, so it still holds.
- **Ground**: every world's ground is `SCROLL.GROUND` at both ends (`ground: lx => y` may rise in between for a bridge or
  steps). A mismatch throws at load: the hero's feet must not jump at a seam.
- **The hero** is one gait rig drawn by each world's own pen: `hero(g, x, y, h, phase, S)` gets the feet position and the
  gait phase, which is continuous across seams (it comes from distance walked). Draw him in the world's material, not
  the same puppet pasted into every world; `frameSprite()` frames work too (`references/frames.md`).
- **Acts**: `{ at, dur, lead, pose }` stops him at local x `at` for `dur` s. Time an act's events from `S.act.u` (seconds
  into the act), never from "seconds since the world began": change the speed and every act still lines up.
- **The end**: the last world brings him to rest at his usual screen position where the camera stops (`end: 'exit'` lets
  him walk out instead). Its width includes that last frame: `SPEED * walking time + (W - SCROLL.HERO_X)`.
- **Seams** belong to the world they open: draw the new world's own edge (`seam(g, y, S)`: wet ink, a keyline with foam,
  a torn paper edge). Don't add `enter` transitions; the seam is the transition.

## The camera only moves forward
Target = hero x − `HERO_X` + an act's `lead`; the skeleton keeps the running maximum, then smooths it (a Gaussian over a
monotonic signal stays monotonic). Without the maximum, the camera eases back when an act's lead releases and the film
reads as a rewind; `qa.py` counts these steps (*camera steps back*), across seams too in a scroll film.

## Checked on the example
- `qa.py` PASS: deterministic on all three paths, no page errors, camera steps back 0 times. With the running maximum
  removed, `qa.py` reports 4 back-steps, all in the ink world where the act's lead releases.
- A world whose ground ends 5 % lower than the next one fails at load (`ground at x=3174.4 is 1137.6, must be GROUND (1065.6)`).
- Stills at every seam: hero half in each medium at 4.1 s and 8.15 s, label fades in after each crossing, fully in
  frame at rest on the last frame.

## Pitfalls met
- A world's `build()` must run: the skeleton forwards the shot's `build()` to the world (the first version replaced it
  with a no-op and the baked sprites were undefined).
- The hero walked off the right edge on the last frame while the camera had stopped: hence the default `end: 'stop'`.
- Ink mountains drawn with `iwBlob` read as grey bubbles, and curved domes as arches: ink ranges need ridged peaks (a
  `1 − |sin|` profile) with the wash fading into mist at the base.

## Still to improve
- The near ink range is still fairly regular; the ink hero is a plain silhouette.
- Pixel and WebGL looks can't be scroll worlds (pixel mode is film-wide; WebGL looks render on their own canvas).
- Music: seams land on the beat grid, but the score doesn't yet change instrument per world; re-voicing one motif per
  world is the next step (see `lessons.md`).
