# Look: linocut / 麻胶版画

A relief print on cream rag paper. The ink is flat black and vermilion, with the speckle and bald patches of hand burnishing. Edges are jagged from the knife. White tapered V-gouge marks carve ripples, hatching and rings out of the black. Colours are laid one pass at a time with a hair of misregistration, and the film shows the process: the inked block being cut, then a roller pass that lays each colour.

Verified in 早安版画 (`assets/example-linocut.html`, 16:9, 12 s, 3 shots, 90 bpm): the wave cuts are carved into the block, a red pass lays the sun and cloud bands, and a black pass lays the mountains, the carved sea and 早安.

## Toolkit (`toolkit-linocut.js`)
| call | what it does |
|---|---|
| `lnPaper(g)` | rag paper |
| `lnBegin()` → `L`, `lnEnd(g, {bite, reveal, dx, dy, sx, sy, mode})` | ink layer: speckle bites into it, `reveal` 0..1 for a roller pass left→right, `dx, dy` for misregistration, multiply onto paper |
| `lnPoly(L, pts, col, jag, seed)` + `lnDense(pts)` | jagged hand-cut fill (densify first) |
| `lnGouge(L, a, b, w, k, {carve, col, bulge})` | tapered V-cut; `carve` removes ink, `carve:false` fills (use it for flame rays, cloud streaks, or lighter lino in a carving shot) |
| `lnRays`, `lnCircle`, `lnText`, `lnRoller(g, x, col, t)`, `lnTool(g, p, a)` | ray wedges, circle points, nicked lettering, the brayer, the V-gouge |

## Rules
- Use two colours at most, one layer per colour, and draw the red pass under the black pass.
- Clip the lower colour to where it belongs (`evenodd` against the black shapes). Speckle lets the colour underneath show through black, which reads as a mistake.
- Carve texture into every large black area: parallel cuts on slopes, lens-shaped ripples on water.
- **Never draw a red disc with long rays on a light ground.** It reads as the Rising Sun flag. Use short flame rays, carved rings and horizontal cloud bands.

## Pitfalls met while building it
- The first red pass was a full-frame sunburst: a flag association, and the rays showed through the mountains. It was replaced by a ringed sun, short rays and cloud streaks, clipped to the sky.
- A black boat on the black sea was invisible and was removed.
