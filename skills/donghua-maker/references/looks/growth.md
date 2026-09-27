# Look: growth / 差分生长

A closed line keeps splitting its edges; neighbours pull together while everything nearby pushes apart, so the loop buckles into coral or brain folds. Fine ink on paper, with older outlines kept as faint growth rings. Studied from published generative-ink works on differential growth; forms are simulated, never copied.

Verified in 生长 (`assets/example-growth.html`, 16:9, 12 s, 3 shots, 90 bpm).

## Toolkit (`toolkit-growth.js`)
| call | what it does |
|---|---|
| `grGrow(seed, {steps, maxN, rest, rad, split, every})` | runs the simulation once at load (seeded, typed arrays + cell grid) and returns `snaps`, one outline every `every` steps |
| `grDraw(g, G, u, x, y, sc, {ring, marks, markFade})` | the outline at progress u, earlier outlines every `ring` snapshots as faint rings, `marks` flash red and fade |
| `grPath(g, a, x, y, sc)` | smooth closed path (quadratic through edge midpoints) |

## Rules
- Map time to progress with a power under 1 (`(t/T)^0.8`): growth is exponential, so a linear map spends half the film on a tiny loop.
- Start close (z 3) and pull back as it grows; keep one ink colour and at most one accent.
- Each note flashes that moment's outline in red; the flash fades within about 12 snapshots, so the finished coral stays ink.

## Pitfalls met while building it
- Load cost: a Map-based grid took 12 s for 3.2k nodes. Typed arrays with a linked-list grid and `split = .008`, `maxN = 2400`, 600 steps take about 1.8 s in node.
- Permanent red rings turned the whole coral red; they now fade.
- The raw polygon looked jagged at scale 3.6; the path is smoothed.
