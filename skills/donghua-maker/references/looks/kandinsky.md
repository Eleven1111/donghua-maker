# Look: kandinsky / 康定斯基 · 构成

Geometric "visual music" on a pale ground with soft colour clouds: haloed circles (a dark ring with a purple core and a red halo), sharp translucent triangles, crossing black lines, checkerboards and thin arcs. Every element enters on its own note and later pulses on the beat. The construction was studied from public-domain abstract compositions (*Composition VIII*). The arrangement is our own.

Verified in 点线面 (`assets/example-kandinsky.html`, 16:9, 12 s, 3 shots).

## Toolkit (`toolkit-kandinsky.js`)
| call | what it does |
|---|---|
| `kdGround(seed, clouds)` | pale ground with radial colour clouds |
| `kdCircle(g, x, y, r, core, rim, halo, k, p)` | grows in with k and swells with pulse p |
| `kdTri`, `kdLine`, `kdChecker`, `kdArc` | each takes k (0..1) as its entry progress: grow, slash in, fill cell by cell, sweep |
| `kdK(st, t)`, `kdPulse(st, beats)` | entry progress from a cue; pulse from later cues |

## Rules
- One element per note (`HITS` in the example). Big elements take low notes (pluck); small ones take high notes (music box).
- Build the composition cumulatively across shots: shot 1 has points, shot 2 adds lines, shot 3 is everything pulsing.
- Diagonals dominate. Keep one big dark circle as the anchor, top-left.
