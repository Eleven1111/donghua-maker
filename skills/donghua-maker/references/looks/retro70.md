# Look: retro70 / 七十年代复古

A warm earth palette of cream, mustard, orange, rust and brown. The motifs are parallel stripe bands flowing round rounded corners, a sunset disc cut by horizontal slits that thicken toward the bottom, and a slow tone-on-tone sunburst behind. Type is chunky soft serif stacked with offset stripe shadows. The print looks faded: warm grain, a soft vignette and a rounded TV-style frame. Motion is easy: stripes draw on, things drift and swing. Studied from 1970s record sleeves, posters and TV idents; compositions are generated.

Verified in 慢慢来 (`assets/example-retro70.html`, 16:9, 12 s, 3 shots, 90 bpm).

## Toolkit (`toolkit-retro70.js`)
| call | what it does |
|---|---|
| `r7Round(C, r)` | round a corner polyline with arcs (and resample) so stripes stay parallel |
| `r7Stripes(g, P, k, {cols, w, shadow})` | concentric stripe band along `P`, drawn on to `k` |
| `r7Sun(g, x, y, r, {drift})` | slit sunset, cut on an offscreen canvas |
| `r7Burst(g, x, y, R, n, rot, c1, c2)` | tone-on-tone rays |
| `r7Title(g, str, x, y, size, k, {layers, fill, rot})` | stacked stripe drop + cream face + ink outline, pop-in |
| `r7Caps`, `r7Frame(g, m, r)` | letter-spaced caps line, rounded screen frame (draw last) |

## Rules
- Stay in the five warm colours plus cream. No pure black and no cool colours.
- Stripes always travel as a band of 4–5 colours, outermost dark.
- Keep the sunburst tone-on-tone (cream on cream or sky on sky), so it adds texture without competing.

## Pitfalls met while building it
- Slits cut with `destination-out` straight on the frame punched through to the empty canvas and showed black. They are now cut on the sun's own offscreen canvas.
