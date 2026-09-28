# Look: pencil / 铅笔素描

Off-white drawing paper with tooth. The drawing is built the way an artist works. Faint straight construction lines and an ellipse come first, in HB. Then the contour goes down darker, doubled where it was corrected. Directional hatching turns the shape into a form, darker away from the light, with cross-hatching in the core shadow. A finger-smudged cast shadow follows, a highlight is lifted out with a kneaded eraser, and the piece is signed. Graphite is multiplied onto the paper and broken by the tooth.

Verified in 苹果写生 (`assets/example-pencil.html`, 16:9, 12 s, 3 shots, 90 bpm).

## Toolkit (`toolkit-pencil.js`)
| call | what it does |
|---|---|
| `pcPaper(g)` | paper with tooth (screen fill) |
| `pcBegin()` → `L`, `pcEnd(g, bite)` | graphite layer; the tooth bites into it and it is laid on with multiply |
| `pcLine(L, P, k, {soft, double, w, a, seed})` | pressure-tapered line; `soft` = construction, `double` = corrected contour |
| `pcHatch(L, clipFn, box, k, {ang, gap, a, shade, cross, seg})` | hatching clipped to a path; `shade(x, y)` models light; `seg` breaks strokes so tone fades softly |
| `pcSmudge(L, x, y, rx, ry, a)` | soft stump tone for cast shadows |
| `pcLineP`, `pcEllP`, `pcPart`, `pcTip`, `pcPencil(g, p)` | point lists, the pencil at the tip |

## Rules
- Keep the drafting order visible: construction, contour, tone, shadow, highlight, signature. Each stage is a beat.
- Light comes from one side. `shade(x, y)` should rise toward the far side, and cross-hatch only where it is highest.
- Hatch hard: `a` .75–.85, `gap` 7–9 on the subject. The first pass at .55 / gap 10 read as a faint tracing.
- Background tone uses `seg` (about 100 px) with a radial fade. Full-length strokes switched on and off by their midpoint made a hard slanted edge.

## Pitfalls met while building it
- `-(x) ** 2` is a syntax error in JS, so write `-(x ** 2)`. Run `node --check` on the story before building.
- The pencil's drop shadow read as a second pencil and was removed.
