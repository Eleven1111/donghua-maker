# Look: process / 规则粒子

Simple elements (circles) follow simple behaviours: they travel straight and reflect at the edge. Whenever two overlap, a faint line joins their centres, and those lines accumulate into the picture. The drawing is the record of the rules, not a picture of the elements. Studied from published process-based generative works; systems are generated, never copied.

Verified in 规则的痕迹 (`assets/example-process.html`, 16:9, 12 s, 3 shots, 120 bpm).

## Toolkit (`toolkit-process.js`)
| call | what it does |
|---|---|
| `prElements(n, seed, {r, speed, born})` | elements with start, heading, speed (box fractions per second), radius; `born(i)` sets appearance times (e.g. melody notes) |
| `prPos(e, t, box)` | analytic position (triangle-wave reflection), so any frame can be sought exactly |
| `prTrace(g, E, t0, t, box, {dt, rgb, alpha})` | the record: for every sample time from t0 to t, a line between each overlapping pair. Alpha builds where the rules repeat. |
| `prElementsDraw(g, E, t, box)` | the elements themselves (outline, centre dot) plus the live joining line in the accent red |
| `prLabel(g, lines, x, y)` | the rule as a gallery-style caption |

## Rules
- Show the rule first (elements + caption), then only the record. Viewers need one shot to see the cause.
- Keep alpha low (0.04–0.06); the image should come from repetition, not from any single line.
- Greyscale ink on paper, or light on near-black. One accent colour at most, only for the live rule.
- Cost is samples × pairs: `dt = 1/10` with about 70 elements over 20 s of history is fine; raise `dt` before cutting elements.

## Pitfalls met while building it
- Cuts must sit on the eighth-note grid; 96 bpm put 4 s off the grid, so the film uses 120 bpm.
