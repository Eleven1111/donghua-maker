# Look: blueprint / 工程蓝图

A cyanotype-blue sheet with a fine 32 px grid and a coarse 160 px grid, a double border frame and a title block in the lower right. Every line is thin white, drawn on by length, in drafting order: centre lines and faint construction lines, then the solid outline, hidden lines dashed, joints, then dimensions with arrowheads and a section view with 45° hatching. Lettering is condensed sans, typed on.

Verified in 台灯设计图 (`assets/example-blueprint.html`, 16:9, 12 s, 3 shots, 120 bpm): a desk lamp in front view, dimensioned, a section A–A, the title block filled in; the lamp switches on and an "已审核" stamp lands.

## Toolkit (`toolkit-blueprint.js`)
| call | what it does |
|---|---|
| `bpSheet(g, k)` | sheet + grids; the border frame draws on with `k` |
| `bpDraw(g, P, k, style)` | polyline drawn on to `k`; style `solid` / `thin` / `hidden` (dashed) / `centre` (dash-dot) / `faint` (construction) |
| `bpDim(g, a, b, off, label, k, {size, gap})` | dimension: extension lines, arrowed line, label on the line's axis |
| `bpHatch(g, P, k, gap)` | 45° section hatching clipped to polygon `P` |
| `bpTitleBlock(g, rows, k)` | lower-right title block, rows `[label, value]` |
| `bpText`, `bpPen`, `bpTip`, `bpRectP`, `bpArcP`, `bpPoly` | lettering, the drafting cross at the tip, point lists |

## Rules
- Draw in drafting order: centre and construction lines, then outline, then hidden lines, then dimensions, then section and hatching, and the title block last.
- Only white on blue. One warm accent is allowed at the payoff (light, stamp).
- Keep the drawing big: scale the geometry with a `translate + scale` wrapper and apply the same wrapper to its dimensions.

## Pitfalls met while building it
- In the first pass the drawing sat small in the lower left and the shade's local "down" was rotated the wrong way (canvas rotation is clockwise). The fix: a 1.3× view wrapper and `SA = −.35`.
- A vertical dimension crossing the arm read as clutter and was dropped. Three dimensions is plenty.
