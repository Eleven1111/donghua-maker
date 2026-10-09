# Shot contract & engine API

Read this before writing any shot code. Everything here exists in `assets/engine.html`; the verified full example is `assets/example-red-kite.html` (4 shots, 10 s, landscape) — open it and copy patterns from it rather than inventing new ones.

## Contents
1. Clock model
2. The shot object
3. Library: drawing
4. Library: physics
5. Library: puppets
6. Library: sound
7. Cross-shot continuity
7b. Look toolkits → `references/looks/`
7c. Transitions (optional)
8. Test hooks
9. Narration

## 1. Clock model

- Film runs at 60 fps. Simulation `step()` runs on every frame at fixed dt = 1/60.
- Stop-motion look: `snap()` is called only every `EXPO` frames (default 5 → 12 poses/s; to change it, edit `EXPO` near the top of the file and the `Stop-motion · 12 poses/s` label in `ui()`). `draw()` must read the **snapshot** fields (`rx, ry, ra`, `rope.rx/ry`, `rope.at(u)`), never the live ones — that is what makes puppets move in steps while the camera (`cam(st)`) glides on every frame.
- `e` = exposure index, feed it to `boil(id, e, amt)` to get the hand-placed jitter `[dx, dy, drot]`. Give every puppet a distinct `id`.
- `sq` = time quantised to the exposure; use it for event-driven appearances (a bloom that pops at note time).
- Each shot resets to its own frame 0 when entered, so shots are independent; seeking is deterministic. Never use `Math.random()` in step/draw — use `rng(seed)` created in `reset()` or `hash()`.

## 2. The shot object

```js
const S2 = {
  name: 'Wire', t0: 2.5, t1: 5,            // film seconds
  cam(st) { return { x, y, z }; },         // world point at screen centre + zoom, st = seconds into shot
  build() { ... },                          // once at boot: bake sprites/backdrops into this.*
  reset() { ... },                          // on entry: create ropes/particles; pre-run ~30-90 steps so motion is already alive; end with this.snap()
  step(dt, st, sf) { ... },                 // physics; sf = frame index in shot (can be negative during pre-run)
  snap() { ... },                           // copy live state → r* fields
  draw(ctx, st, sq, e, cam) { ... },        // setCam(ctx, cam, parallax) per layer, then put()/strokes
  score() { return [{ t, k, ...}]; },       // absolute film times; merged with baseScore()
  poke(x, y) { return hit; },               // optional click interaction in world coords
};
SHOTS.push(S2);
```

Layering in `draw`: `setCam(ctx, cam, .78)` sky → `.9` far scenery → `1` puppet plane. Lower parallax = further away.

One-shot events inside `step`: guard with a flag (`if (!this.caught && st >= CATCH) { this.caught = true; ... }`) or exact frame `sf === Math.round(t * 60)`. Note `-0 === 0` during pre-run.

Physics-born sounds: `emit({k:'rustle', ...})` inside step (baked into the offline mix). User-triggered: `sfx({...})` inside poke.

## 3. Library: drawing

| fn | use |
|---|---|
| `backdrop(w, h, {grad, mottle, vstreak, hstreak, scratches, scratchAng, dust, light:[x,y], glow, dark, seed})` | printed sky/wall. Size `W+256, H+144`, draw at `-128,-72` |
| `sprite(w, h, ax, ay, g => {...}, {ss, pad, shadow:{dx,dy,blur,a}, paper})` | bake a cut-out with paper texture + contact shadow. `ax, ay` = anchor (feet / base) |
| `frameSprite(name, h, {shadow, paper})` | bake an imported character frame (`scripts/frames_import.py`, `references/frames.md`) as a cut-out `h` px tall, anchored at the feet; place it with `put()` |
| `frameAt(name, t, fps = 9)` | name of the pose of sequence `name_0…name_n` showing at time `t` (limited animation, no in-betweens) |
| `put(ctx, sp, x, y, rot, scale, {alpha, flip, shadow, sy})` | place sprite by its anchor |
| `cutPath(g, pts, {amp, step, seed})` | polygon with scissor-wobble edges |
| `blobPath(g, cx, cy, rx, ry, {amp, seed, rot})` | organic blob (canopies, clouds, bushes) |
| `curvePath(g, pts, closed)` | smooth spline through points (ropes, strings, hills) |
| `hatch(g, x, y, w, h, {gap, ang, col, a, wob, seed})` | print-line texture; call inside `withClip` |
| `stipple(g, x, y, w, h, {n, col, r0, r1, a, seed})` | specks, flowers in grass, pigment |
| `withClip(g, pathFn, fn)` | clip texture to a shape |
| `tone(hex, k, alpha)` | shade within palette: k<0 toward ink, k>0 toward paper |
| `C` | palette object; override with `Object.assign(C, {...})` |

## 4. Library: physics

- `new Rope(pts, {grav, damp, iters, slack})` — verlet chain for strings, wires, tails, hair, steam, vines. `pin[i]=1` fixes a node (set `x[i], y[i]` yourself each step). Add forces through `ax[i], ay[i]` before `step(dt)`. `at(u)` returns `[x, y, angle]` on the snapshot.
- `curl(x, y, t, scale)` — smooth divergence-free wind; `gustAt(x, y)` — the viewer's click/drag wind, add it to every force so the world responds.
- `newPetal(R, x, y, {vx, vy, col, size, An})` + `petalStep(p, dt, windX, windY)` + `drawPetals(ctx, list, e)` — flutter-falling flat things: petals, leaves, snow flakes, paper scraps, confetti. Land them with `if (p.y < ground) petalStep(...) else { p.y = ground; p.vx *= .8; }`.
- Spring pattern for bodies/rotation: `v += ((target - x) * stiff - v * damp) * dt; x += v * dt`.

## 5. Library: puppets

- `birdPerched(g, s, {body, wing, belly, pose})`, `birdFlying(g, s, phase, ...)`; or call `bakeBirds()` once in build() and use `BIRDS['bsit'|'bup'|'bpeck'|'bcrouch'|'bf0..2']` (`w` prefix = white hero bird), `wingK(phase)` picks the wingbeat drawing.
- `makePerson({h, coat, legs, shoes, hair, hat, bob, bun, scarf, skin, short, seed})` → `{body, head, neckY}`; place head at `y + neckY` with rotation to make them look.
- `noteGlyph(g, s, col)`, `daisy(g, r, {petals, col, mid, open})`.
- New puppet = a function that draws into `g` at origin + a `sprite()` bake in build(). Keep feet/base at the anchor so `put()` lands it on the ground.
- Puppets whose limbs must move (walk, raise a hand, draw a bow): use the jointed rig `rigPose` / `rigDraw` / `rigPt` from `looks/shadow-puppet.md`. It is look-agnostic; bake each part with its pivot at the joint.

## 6. Library: sound (all synthesised, no samples)

`score()` / `baseScore()` event kinds:

| k | params | character |
|---|---|---|
| `mb` | `n:'D6'`, v, pan | music box (the melody voice) |
| `chord` | `ns:[...]`, strum | strummed music-box chord |
| `pluck` | `f` Hz, dur | Karplus-Strong string (wires, guitar, koto-ish) |
| `flap`, `chirp` | pan, n / f | birds |
| `whoosh` | dur, p0→p1 pan, f0→f1 | wind pass, camera move |
| `rustle` | dur, dens | leaves, paper |
| `tick`, `thump`, `creak`, `clink`, `cloth`, `bloom` | v, pan | foley |
| `bed` | kind: room/street/field/stage, dur | ambience under each shot (one per shot, cut with the picture) |
| `keys` `pad` `bass` | `n:'D4'` or `m` (MIDI) or `f`, dur, v, pan | arrangement voices, normally generated by `groove()` |
| `kick` `brush` `shaker` | v, pan | rhythm section, normally generated by `groove()` |
| `ui` | `kind`: click/clickAlt/pop/toggle/typing/ding/success/error/resolve/sweep, v, pan | UI feedback set (references/audio.md §3) |
| `smp` | `id` (from `SMP.lib`), v, pan, rate, dur, wet | a recorded sound imported by `scripts/sfx_import.py`; its role, duck preset and `sync` come from the library (references/audio.md §5) |

The SAMPLES block (written by the importer or the director) may also set `SMP.map` (synth kind → recorded id or [ids], round-robin), `SMP.bgm` (`{id, replace: 'groove'|'music'|'none', keep: [kinds]}`) and `MIXBUS.ir`. `MIXBUS` (per-role `hp`/`low`/`pres`/`comp`, `glue`) is editable in the story. The story may declare `AUDIO_PLAN` for the director (references/audio.md §0).

Every event also takes `role` (music/sfx/voice; default from its kind), `duck` (false or `{db, hold, release, attack}`) and `sync` (the audible landmark inside the sound, s). The music bus dips under sfx and voice cues automatically. **Read `references/audio.md` before writing the score**: it covers roles, ducking presets, the UI set, `groove()` music and audio verification. `__film.audio()` reports cue alignment, and `__film.wav({stem})` renders one role.

To add a new voice (marimba, bell, pad, kalimba…): add a method on `Sound` built from oscillators + envelopes like `musicBox`, and a `case` in `Sound.play`. Keep it inside the file.

## 7. Cross-shot continuity

**Plan the cut, not only the shot.** The brief's `out` column says how the eye crosses each cut: a motion carried
across it (a ball thrown out of frame lands in the next shot), a match (a round moon → a round lamp), a camera move
that keeps going, an object filling the lens, a seam or a transition in the look's language (§7c). "Hard cut" is a
valid answer, but write it down: a film whose every `out` is "cut" plays as a slideshow. Two arcs run across the cuts:
**colour** (warm lamp-lit → cold night → warm again) and **growth** (what gets bigger, worse or nearer each time: a
character's size, a counter, the same set returning more broken). Repeat one set or prop on purpose and escalate it,
rather than inventing a new place for every beat.


A hero prop that travels between shots (the kite) should be a shared rig: `xxxRig()`, `xxxStep()`, `xxxSnap()`, `xxxDraw()` defined once, reused by each shot, with sprites baked in the first shot's build() (boot builds shots in order). End each shot where the next begins: same prop, same direction of travel, same colour accent.

## 7b. Look toolkits (one file per look)

Look-specific helpers and rules each have a file in `references/looks/`. Read the file for the look you are building, and only that one:

| look | file | verified example |
|---|---|---|
| pixel art / farm-sim (`--pixel N`) | `looks/pixel.md` | `assets/example-pixel-farm.html` |
| pixel diagram / neural-net explainer (`--pixel 4`) | `looks/pixel.md` (§ Pixel diagram) | `assets/example-pixel-neural.html` |
| cute software demo / 可爱软件演示 (kawaii flat UI) | `looks/ui-demo.md` | `assets/example-ui-demo-editor.html`, `assets/example-ui-demo-dashboard.html` |
| business / finance explainer / 商务财经图解 | `looks/biz-explainer.md` | `assets/example-biz-margin.html`, `assets/example-biz-equity.html` |
| hand-drawn explainer | `looks/explainer.md` | `assets/example-earth-explainer.html` |
| American comic | `looks/comic.md` | `assets/example-comic-night-watch.html` |
| torn-paper collage | `looks/torn-paper.md` | `assets/example-torn-paper-night.html` |
| shadow puppet / 皮影 | `looks/shadow-puppet.md` | `assets/example-shadow-archer.html` |
| watercolour / 水彩 | `looks/watercolor.md` | `assets/example-spring-rain.html` |
| 3D clay / 3D 黏土定格 (three.js, `--look clay3d`) | `looks/clay3d.md` | `assets/example-clay3d.html` |
| 3D voxel / 3D 体素 (three.js, `--look voxel`) | `looks/voxel.md` | `assets/example-voxel.html` |
| 金屏说史 gold-scroll history series (`--goldscroll`) | `looks/gold-scroll.md` | `assets/example-gold-scroll-chibi.html` |
| 谐波运动 / harmonic motion (`--look harmonic`) | `looks/harmonic.md` | `assets/example-harmonic.html` |
| 浮世绘 / ukiyo-e woodblock (`--look ukiyoe`) | `looks/ukiyoe.md` | `assets/example-ukiyoe.html` |
| 博物版画 / natural-history plate (`--look naturalplate`) | `looks/naturalplate.md` | `assets/example-naturalplate.html` |
| 青绿长卷 / blue-green handscroll (`--look qinglu`) | `looks/qinglu.md` | `assets/example-qinglu.html` |
| 长卷穿越 / long scroll (`--scroll paper,inkwash,…`) | `looks/scroll.md` | `assets/example-scroll.html` |
| 写意水墨 / ink wash (Qi Baishi study) (`--look inkwash`) | `looks/inkwash.md` | `assets/example-inkwash.html` |
| 等距几何 / isometric blocks (three.js, `--look isometric`) | `looks/isometric.md` | `assets/example-isometric.html` |
| 黑板粉笔 / Chalkboard (`--look chalkboard`) | `looks/chalkboard.md` | `assets/example-chalkboard.html` |
| 工程蓝图 / Blueprint (`--look blueprint`) | `looks/blueprint.md` | `assets/example-blueprint.html` |
| 一笔画 / One-line drawing (`--look oneline`) | `looks/oneline.md` | `assets/example-oneline.html` |
| 铅笔素描 / Pencil sketch (`--look pencil`) | `looks/pencil.md` | `assets/example-pencil.html` |
| 16mm 老纪录片 / 16 mm documentary (`--look film16`) | `looks/film16.md` | `assets/example-film16.html` |
| 科幻界面 / Sci-fi HUD (`--look hud`) | `looks/hud.md` | `assets/example-hud.html` |
| 控制台大屏 / Ops board (`--look opsboard`) | `looks/opsboard.md` | `assets/example-opsboard.html` |
| 动态字体 / Kinetic typography (`--look kinetic`) | `looks/kinetic.md` | `assets/example-kinetic.html` |
| 扁平科普 / Flat science explainer (three.js, `--look flatsci`) | `looks/flatsci.md` | `assets/example-flatsci.html` |
| 报刊数据图 / Editorial data graphics (`--look editorial`) | `looks/editorial.md` | `assets/example-editorial.html` |
| 图层卡通讲解 / Layered cartoon explainer (`--look layered`) | `looks/layered.md` | `assets/example-layered.html` |

Paper cut-out (the default look) uses only the core library above; see `assets/example-red-kite.html`. When a new look is verified in a real film, add a file here rather than growing this one.

## 7c. Transitions (optional)

A hard cut on the beat is the default and is usually right. When a cut should *say* something, a shot opens with a
transition in its look's own language: the new picture grows out of the material of the look, not out of a generic wipe.

```js
const S2 = { name: 'Pond', t0: 4, t1: 8, enter: { kind: 'ink', dur: .6, at: [.5, .55], punch: true }, ... };
```

| kind | for looks | what happens | options |
|---|---|---|---|
| `ink` | ink wash, watercolour, sumi | the new shot blooms out from `at` like ink on wet paper; the front pools dark, then fades | `ink: 'r,g,b'` front colour |
| `tear` | paper cut-out (default), torn paper, collage | the old sheet is torn away from one side; the ragged edge shows the white paper core | `from: 'left'|'right'|'top'|'bottom'`, `core` colour |
| `pixel` | pixel, pixel-diagram | blocks switch in a hashed order, nearer `at` first, hard-edged | `cell` px (default 32, or 4 in pixel mode) |

- `dur` (default .5 s) is taken from the **start of the new shot**: the cut time stays on the beat and the reveal runs
  over the first `dur` seconds. Keep that shot's opening action after `dur`, or it happens under the old picture.
  `at` is a fraction of the frame, so the same values work in pixel mode. `punch: true` eases the whole frame from
  1.03 to 1 over 20 frames on the cut (not in pixel mode).
- The old picture is the previous shot's **last frame**, re-simulated from its own `reset()` when the new shot is
  entered (before the new shot resets), never a screenshot. Seeking, cold loads and the export stay frame-exact, and
  `qa.py` checks it like any other frame. Its `step()` sounds are not replayed.
- A shot that *reads* state another shot left behind is fine; a shot whose `reset()` *depends on running after* the
  previous shot's last step is not (the previous shot is re-run before it). Shared rigs that each shot resets
  (the kite pattern in §7) are fine.
- Rendering doubles during the reveal (two shots plus a mask). Keep `dur` short; past ~0.8 s a reveal reads as a fade.
- New kind: add it to `XFADE` in the film (`mask(g, p, en, w, h, seed)` fills where the new shot shows; optional
  `edge(...)` draws the signature on top), deterministic (`hash`, no `Math.random`). Prove it in a real film first,
  then move it into `assets/engine.html` and list it here.

## 8. Test hooks

`?t=3.2` opens at 3.2 s, `?ui=0` bare frame, `window.__film.seek(frame)`, `.info()`, `.score()`, `await .wav()` (base64 WAV of the full mix; byte length should be `44 + DUR*48000*4`).
## 9. Narration (`k: 'vo'`)

- `VO.src = ['<base64 mp3>', …]`: set this in the story before `SHOTS`. The engine calls `voReady()` at boot and `await`s it in `renderWav()`.
- The event is `{ t, k: 'vo', id, dur, v }`. `id` indexes `VO.src`, and `dur` is the clip's measured length, which the engine uses to resume mid-line after a seek. `v` defaults to .85.
- Put narration events in `baseScore()`, not in shots. They are film-level and should survive editing a shot.
- The workflow and level targets are in SKILL.md §4b.

