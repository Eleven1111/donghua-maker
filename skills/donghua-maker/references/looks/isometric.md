# Look: isometric / 等距几何

Flat-shaded blocks on an isometric grid: three tones per colour (top light, left mid, right dark), a small palette on a pale ground, towers in set-back tiers — and, at room scale, a diorama: a floor slab with two back walls, windows, furniture and plants dropping in on the beats, with white pin labels. Studied from published generative isometric works; cities are generated, never copied.

Verified in 积木城 (`assets/example-isometric.html`, 16:9, 12 s, 3 shots, 120 bpm): a room assembles piece by piece, then the city rises and changes palette.

## Toolkit (`toolkit-isometric.js`)
| call | what it does |
|---|---|
| `isoP(x, y, z, o)` | grid → screen (`o = {x, y, s}`, s = one unit in px) |
| `isoBox(g, x, y, z, w, d, h, col, o)` | box with top ×1.08, left ×0.86, right ×0.66 shading |
| `isoCity(seed, n, pal, {maxH, empty, bias})` | n×n lots, 1–3 set-back tiers each, sorted back-to-front; `bias(i, j)` scales height |
| `isoCityDraw(g, lots, o, tile(l), rise(l))` | ground tiles pop in, towers rise (overshoot allowed) |
| `ISO.pals` | three palettes with the same length, so the same seed gives the same city in each |
| `isoDrop(t, t0, d)` → `{k, dz, s}` | drop-in from above with overshoot: shift `o.y` by `dz·o.s` |
| `isoRoom(g, w, d, h, o, {floor, wallL, wallR}, rise)` | floor slab + two back walls (right wall on y = 0, left wall on x = 0) |
| `isoWindow(g, 'R'\|'L', a, len, z0, z1, o, k, sky)`, `isoWallQuad` | framed window / any flat quad on a back wall |
| `isoDesk`, `isoShelf(g, x, y, o, col, books, kb)`, `isoLamp`, `isoPlant`, `isoRug` | furniture as box stacks; books fill shelf rows with `kb` |
| `isoLabel(g, str, x, y, z, o, k)` | white rounded pin label on a stalk above a point |

## Rules
- Draw order is by `i + j` (back to front); keep blocks within their lot or the order breaks.
- Bias height towards the middle; a random city tends to leave a hollow centre.
- In a room, draw walls → wall decals (windows) → rug → props sorted by `x + y`, and labels last. One prop lands per beat.
- Beats pop tiles along the diagonal; notes raise towers; a diagonal wave on a beat can repaint the city in another palette.

## Pitfalls met while building it
- `isoShade` used to return `rgb()`; shading a shade (shelf boards, rug inlay) parsed NaN and drew black faces. It now returns hex.
- The unbiased city formed a "U" with tall edges; fixed with `bias`.
- A three-step palette cycle returned to the first palette at the end; order the waves so the film ends on the strongest palette.
