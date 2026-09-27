# Look: opart / 欧普艺术

Black and white only, hard edges, repeated units whose geometry shifts gradually, so the eye sees motion, bulge and vibration that isn't there: wavy stripe fields, a checkerboard swelling into a sphere, moiré from two ring sets. Studied from public-domain and published Op Art works; fields are generated, never copied.

Verified in 起伏 (`assets/example-opart.html`, 16:9, 12 s, 3 shots, 120 bpm).

## Toolkit (`toolkit-opart.js`)
| call | what it does |
|---|---|
| `opWaves(g, x, y, w, h, n, t, {amp(u), freq, twist, speed})` | n bands whose edges are sines drifting in phase and amplitude across the field |
| `opBulge(g, x, y, w, h, cells, cx, cy, R, s)` | checkerboard warped by a gaussian swell; edges bend (quadratic through the warped midpoint) |
| `opRings(g, c1, c2, gap, rmax, lw)` | two ring sets; the second is drawn in white with `difference`, so overlaps flip |

## Rules
- Two values only (paper `#f3f1ea`, ink `#111`). A title sits on a paper-coloured plate.
- Motion comes from slow parameter drift; notes push amplitude or bulge and let it relax.
- Judge moiré at full resolution: the downscaled contact sheet adds its own aliasing.

## Pitfalls met while building it
- `-(d / R) ** 2` is a syntax error in JS (unary minus before `**`); write `-((d / R) ** 2)`.
