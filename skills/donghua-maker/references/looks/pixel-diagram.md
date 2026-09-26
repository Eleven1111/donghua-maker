# Look: Pixel diagram / retro neural-net explainer

A second pixel-mode look, verified in 像素神经网络 (`assets/example-pixel-neural.html`, 4 shots, 12 s, 120 bpm). It is a technical diagram on pure black: the subject is data moving through a structure (a network, a pipeline, a circuit), not characters in a world. Read `pixel.md` for the engine API. That file's farm rules (2× characters, raised horizon, parallax) don't apply here.

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
