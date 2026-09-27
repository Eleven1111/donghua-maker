# Look: cutout / 剪纸拼贴（马蒂斯式）

Gouache-painted paper cut with scissors: clean organic edges, flat saturated colour with faint brush streaks, and shapes pinned on coloured backing panels with a slight lift shadow. It is the opposite of `torn-paper` (ragged edges, collage textures). The technique was studied from late cut-out practice. These works may still be in copyright in some countries, so every shape here is our own (branching algae, scissor stars, leaves, a bird) and nothing is reproduced.

Verified in 海藻与星 (`assets/example-cutout.html`, 16:9, 12 s, 3 shots).

## Toolkit (`toolkit-cutout.js`)
| call | what it does |
|---|---|
| `cuPat(col)` | gouache paper pattern (cached) |
| `cuCut(g, path, col, {lift})`, `cuPanels(g, panels)` | a filled shape as cut paper with a lift shadow; backing sheets |
| `cuAlgae(g, x, y, h, col, sway, seed, grow)` | branching silhouette (stem → arms → rounded lobes); `grow` 0..1 to cut it in |
| `cuStar`, `cuLeaf`, `cuBird` | irregular scissor star, lobed leaf, swallow silhouette |

## Rules
- Three to five saturated colours plus white and black. Every shape must contrast with the panel under it: never white on white or cobalt on cobalt.
- One main shape per panel, centred on it, with space around it.
- Motion is gentle: sway, drift, and one shape pinned on a beat with a thump.

## Pitfalls met
- A per-stroke blurred shadow on a branching shape cost about 1 s a frame at 2560, and stills hung. Draw one hard offset shadow pass, then the paper.
- Stacked lobes read as pagodas, not algae. Use branching.
- Brush streaks at 3–7% alpha read as scan lines. Keep them at 1–3% and wide.
