# Look: Pixel art / cosy farm-sim

Pixel mode (`--pixel N`). Read this together with `../shot-contract.md` (the engine API) and `../styles.md` (the one-row recipe).

When `PIX > 0`, `draw(ctx, …)` receives the low-res buffer (`LW×LH`, e.g. 320×180), and world units are low-res pixels. The engine scales it up nearest-neighbour and skips grain, flicker and vignette. `toWorld` and `poke` coordinates are low-res too.

| fn | use |
|---|---|
| `setCamP(ctx, cam, parallax)` | pan-only camera snapped to whole pixels. The cam is `{x, y, z: 1}`; zoom isn't supported |
| `pxArt(rows, pal)` | sprite from ASCII rows; `pal` maps char → colour; `.`/space = clear |
| `pxPut(ctx, spr, x, y, {flip, ax, ay})` | place by anchor (default bottom-centre), optional mirror |
| `pxRect`, `pxDisc(ctx, cx, cy, r, col)` | whole-pixel rectangles and filled circles |
| `pxDither(ctx, x, y, w, h, a, b, t)` | 4×4 Bayer dither from a to b; `t` is a number or `(x, y) => 0..1` |

Rules:
- Use integers only. Everything is rounded, but compute positions in pixels.
- Bake static layers (skies, hills, ground, buildings) in `build()`; per-pixel loops every frame are slow.
- Don't call `boil()` on pixel sprites (jitter reads as a bug at this scale); animate with pose frames chosen by `e` instead.
- Sound: `{k: 'chip', n: 'D5' | f, wave: 'triangle' | 'square', dur, f2 (slide), vib}`.

Scale and layout, learned on 农场的一天 (the user rejected the first cut, so these are the defaults now):
- **Show characters at 2×.** Write the ASCII art at 1× (a hen 12 px, a person 12×16) and bake it with `px2(pxArt(...))`. At 1× on 320×180, characters are only 12–16 px tall and get lost. Double every offset tied to a sprite too: hand and spout positions, drops, splashes, "!" marks, and water patches hiding the lower body.
- **Put the horizon at about y 88** (roughly half the frame), not y 118. Ground gets the lower half. Shift the baked ridges and tree lines up, e.g. `drawImage(far, -40, -30)`. Move the sun and clouds up by the same amount.
- **Buildings and a whole set at 2×:** bake them at 1×, then draw the foreground through `ctx.setTransform(2, 0, 0, 2, round(LW/2 - 2*cam.x), -148)`, which maps world y 118 to screen 88. Re-lay out the set for a view only 160 world units wide; cropping a house at the frame edge is fine. Draw the ground at 1× outside this transform, so grass texture matches the other shots. `poke` must undo the transform: `x = (x - cam.x)/2 + cam.x; y = (y + 148)/2`. A light drawn after the multiply darkening layer needs the transform set again.
- **Wide baked layers:** a far layer at parallax p must cover `LW + (camRange × p)`. Bake shared layers about 800 px wide once (in the first shot that needs them, stored on a shared object like `DAY`), not per shot.
- **Stop-motion without `boil`:** compute kinematic positions (walks, jumps, lifts) from `sq` inside `draw` so they step on each exposure. Keep only particles (drops, splashes, smoke) in `step`/`snap`. Animate walks by swapping frames on `e & 1`.
- **Fades are stepped:** overlay alpha `Math.ceil(f * 4) / 4`, not a smooth ramp.
- Export `--scale .75` makes 6 screen px per art pixel, clean at 1080p. The file is small (19 s ≈ 2.5 MB), because there's no grain.

## Pixel diagram (retro neural-net explainer)

A second pixel-mode look, verified in 像素神经网络 (`assets/example-pixel-neural.html`, 4 shots, 12 s, 120 bpm). It is a technical diagram on pure black: the subject is data moving through a structure (a network, a pipeline, a circuit), not characters in a world. The engine API is above. The farm rules above (2× characters, raised horizon, parallax) don't apply here.

## Setup
- Use `--pixel 4`, which gives a 640×360 buffer. Lines must be 1 px thin and nodes about 10 px, and `--pixel 8` is too coarse for that.
- Keep the camera fixed (`{x: LW/2, y: LH/2, z: 1}`). A diagram reads best when it holds still, so the motion comes from the data.
- Bake the whole stage once with `bakeStage()` into `STAGE`: dot grid, every dim edge, frames, labels and header. Each shot then does `drawStage` and adds only the lit parts on top.

## Layout (landscape, left → right)
- **Input box, left:** 116 px square with notched corners (`pxFrame`). It holds a 28×28 MNIST-style digit at 4 px per cell.
- **Network, middle:** 4 columns at x 196/280/364/452 with 8/12/12/10 nodes, spanning y 58–306, with every node connected to every node in the next layer.
- **Output, right:** the last column holds the 0–9 nodes. Each has a scale-2 label and a 44 px confidence bar, plus a red `pxDiamond` on the predicted row.
- **Prediction box, far right:** 76×96. The predicted digit is drawn in the 3×5 font at scale 10.
- **Header and footer:** a blue title at scale 2, dim rules, the status line at bottom left, and LOSS at bottom right.

## Palette (`C` in the example)

| role | colour |
|---|---|
| background | bg `#030408` |
| dot grid | `#0a0f1e` |
| dim edges | `#0b1636`, strong weights `#122458` |
| idle nodes | fill `#081230` with ring `#1d3a8a` |
| lit nodes | `#3fa9ff` with core `#bfe6ff` and halo `#0f3a7a` |
| error, backprop, glitch | red `#ff2a4a` / magenta `#ff3fa4` |
| digit | white `#f4f6ff`, with greys for the antialiased edge cells |

Blue is the only colour for correct data flow. Red and magenta always mean error.

## Toolkit (all in the example's story section)

| fn | use |
|---|---|
| `FONT` + `pxText(g, s, x, y, k, col)`, `textW` | 3×5 font covering A–Y (partial), 0–9 and `.:/-?<>`, scaled by `k`. Add new glyphs as 15-character `#`/`.` strings; the file asserts the length |
| `pxLine(g, x0, y0, x1, y1, col, from, to)` | Bresenham line. Pass `from`/`to` to draw only part of the segment, which makes lines grow |
| `pxRing`, `pxFrame`, `pxDiamond` | node rings, notched boxes, pointer marks |
| `NET` | layout: `L[l][i]` gives node positions, `W[l]` gives edges with a hash weight |
| `digitCells(path, u)`, `drawDigit(g, cells, glitch, e)` | writes the digit along its pen path up to progress `u`. `glitch` makes some cells flicker red or magenta, re-chosen on every exposure |
| `flow(g, sq, T, gap, back, e)` | a wave moving layer by layer. Forward is blue with a bright packet; back is magenta with red sparks |
| `nodes(…)`, `drawNode(g, n, a, col, r)` | lights nodes when the wave arrives. `a` sets the state: idle, dim, then lit with halo and core |
| `drawOutputs`, `drawPred`, `hud` | confidence bars and the predicted row, the big predicted digit, the status and loss line |

## Rules
- **Particles are analytic.** Compute each shard or packet from `sq` and `hash(k, …)` inside `draw`, and leave `step` empty. Seeking stays exact and there's no state to reset.
- **Tie every event to a sound.** Each layer the wave reaches plays a `chip` note: rising square notes for a forward pass, falling notes with `f2` for backprop, a low square buzz on an error, and a triangle bass note once a second.
- Pass `vib` to `chip` as a fraction, about .01–.02, because the engine multiplies it by the frequency. The value 6 produced a siren.
- **Tell the story through state text** as well as colour: FORWARD >, ERROR TARGET 7, < BACKPROP GRAD, PREDICT 7 CONF 0.94, with LOSS counting down.
- Use a wrong-then-right arc: the first forward pass predicts the wrong digit, and the payoff shot gets it right. That arc is what makes the diagram a story.
- Shown at ×4, the smallest text (scale 1, 3×5 px) is legible at 1080p. Anything the viewer must read gets scale 2.
