# Look: bauhaus / 包豪斯构成

Primary colours plus black on off-white. The vocabulary is circle, square, triangle, half-disc and bars, with a faint construction grid, strong diagonals, and bold sans type set large, rotated to the diagonal and cut by shapes. Elements move like machine parts: they slide along one axis, snap on the beat with a small overshoot, and turn by quarter turns. Studied from public-domain Bauhaus-era posters and the triangle–square–circle colour exercise; compositions are generated.

Verified in 形与色 (`assets/example-bauhaus.html`, 16:9, 12 s, 3 shots, 120 bpm).

## Toolkit (`toolkit-bauhaus.js`)
| call | what it does |
|---|---|
| `bhShape(g, kind, x, y, s, r, col, {h, stroke})` | circle / square / triangle / half / bar |
| `bhSnap(t, t0, d)` | 0 → 1 with a mechanical overshoot, for beat arrivals |
| `bhType(g, text, x, y, size, r, col, k, {align, weight})` | large type revealed along its baseline |
| `bhGrid(g, step, a)`, `bhSlide(...)` | construction grid, L-shaped axis move |

## Rules
- Pair yellow with the triangle, red with the square and blue with the circle (the exercise), then break the pairing in the poster.
- Use one dominant diagonal of about −30°, and let type ride it.
- Everything arrives on a beat; nothing drifts.

## Pitfalls met while building it
- The end title ran off the right edge, and the white 色 sat under the black bar; both moved.
