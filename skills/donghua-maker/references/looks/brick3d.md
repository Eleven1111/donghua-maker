# Look: 3D brick build / 3D 积木拼装 (three.js)

Studded plastic bricks rain onto a flat-colour floor and snap into sub-assemblies, which then drop onto each other. An instruction booklet, whose pages are real renders of each step, flies in and flips. This is the only look drawn in WebGL. three.js r158 (UMD, MIT) is inlined into the film, so it stays one offline HTML file. The engine still runs clock, sound, subtitles and post; each shot draws its WebGL frame onto the 2D canvas.

Verified in 积木机器人 (`assets/example-brick-robot.html`: 1:1, 22 s, 6 shots) from a reference study of a brick-assembly short (sky-blue ground, one soft sun, long lens, motion-blurred bricks, booklet ending).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --format square --shots "…" --durs "…" --bpm 120 --three --narrated
```
`--three` inlines `assets/lib/three-r158.min.js` above the film script and pastes `assets/toolkit-brick3d.js` at the top of the story. Its first line sets `SMOOTH_DEFAULT = true` (60 fps motion, not stop-motion), `POST_GRAIN = .12`, and a faint `VIGN_TONE`. Use `--narrated` only to drop the ambience beds; a clean studio has no room tone.

## Toolkit (`B3`)
| call | what |
|---|---|
| `B3.stage({ bg, sun, shadow, fov, soft })` | Scene, sky/ground fill, one soft VSM-shadowed sun, a shadow-only ground plane and a long-lens camera. Defaults: bg `#a9d8ee`, fov 26. |
| `B3.aim(cam, { at, az, el, dist })` | Orbit camera: azimuth and elevation in radians, looking at `at`. |
| `B3.parts(layers)` | ASCII layers, bottom first: `{ h: B3.BH or B3.PH, rows: ['.oo.', …] }`. Palette keys are `o` orange, `a` amber, `w` white, `l`/`d` light/dark grey, `k` black, `y` yellow, `r` red, `b` blue, `g` green. Same-colour cells merge greedily into standard bricks (2×4 … 1×1), and bricks covered from above lose their studs. Row index is +z, which faces a camera at `az` 0–1. |
| `B3.build(parts)` | A group of brick meshes; `g.parts[i].userData` keeps each brick's home position. |
| `B3.assemble(g, t, { t0, gap, dur, fall, drift, spin })` | Bricks fall in bottom-up, one every `gap` s, spinning and drifting until they land with a small overshoot. Returns 1 when the last brick lands. |
| `B3.drop(g, t, { t0, lift, home })` | A finished sub-assembly falls from `lift` above onto `home` y and bounces once. |
| `B3.disc(r, depth, col)` | A round part facing +z, for eyes, wheels and dials. |
| `B3.landings(g, opts, every)` | Landing times for click sounds (every n-th brick). |
| `B3.snapshot(scene, cam, w, h, { bg })` | Renders the scene into a 2D canvas, for printed pages. |
| `B3.page(w, h, front, back)` | A printed page: a plane with a canvas texture on each side, hinged at x = 0 so it flips about the spine. |
| `B3.frame(ctx, t, pose, { blur, shutter })` | Draws the film frame. `pose(t)` sets the world for time `t` and returns `[scene, cam]`. `blur` sub-frames across `shutter` give motion blur (10 for stills and export; live playback is capped at 3). |

## Rules that keep it right
- **Pose is a pure function of film time.** One `WORLD.pose(t)` sets every brick, group, camera and page from `t`; no `step` state. Seeking, stills, blur sub-frames and export then all agree.
- **Motion blur must not cross a cut.** Clamp sub-frame times to the shot start (`tt = Math.max(tt, t0)`), or the last shot's world ghosts into the first frame.
- **Name clashes.** Don't declare `DUR`, `W`, `H`, `FPS`, `C`, `T0`… at story top level; they belong to the engine. The example uses `BGAP`/`BDUR` for brick cadence.
- **Every first frame shows something.** Start assemblies slightly before the cut (a negative or early `t0`) so the shot opens mid-fall, not on an empty floor.
- **Framing.** The long lens flattens space. Check that the widest moment (the whole model, or the open booklet at 22 units wide) fits the frame, and reshoot stills after any camera change.
- **Printed pages.** Render step pictures once in `build` with the model posed complete (`B3.done`). Snapshot them on the page colour, not white, and draw text with the embedded font (`font_embed.py`). Sort part lists by count so no colour disappears when truncated.
- **Sound.** A `click` for every second landing brick, `whoosh` then `thump` when a sub-assembly drops, `pop` for an eye or a light, `flap` per page. Keep the groove light.
- **Originality.** The look evokes brick toys; don't use any brand's name or logo, minifigure likeness, or a set's actual design. Design your own models.

## Cost
With 10-sample blur each frame renders the scene 10 times. Headless capture measured about 40–160 ms per frame, so a 22 s export takes a few minutes. Live playback uses 3 samples; its smoothness on a real GPU is UNVERIFIED until watched.
