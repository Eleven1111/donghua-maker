# Look: bloom / 发光花

Luminous flowers in a dark room. Each is born, opens, glows, then its petals scatter and fade, so the field keeps changing; flowers overlap freely. Studied from published immersive digital-flower installations; flowers and fields are generated, never copied.

Verified in 花开无界 (`assets/example-bloom.html`, 16:9, 12 s, 3 shots, 90 bpm).

## Toolkit (`toolkit-bloom.js`)
| call | what it does |
|---|---|
| `blFlower(g, f, t)` | one flower `{x, y, r, n, col, born, fall, seed, notch}`: opens over 1.2 s, holds, petals scatter from `fall` and fade about 2 s later |
| `blField(seed, count, t0, t1, box, {r, hold, cols})` | a field of flowers with births spread over [t0, t1] |
| `blHalo(col)` | baked radial halo per colour (no shadowBlur per frame) |
| `blPetal(g, L, w, notch)` | pointed-round petal, optional cherry notch |

## Rules
- Halos add light (`lighter`); petals draw normally. Additive petals burn a crowded field to white.
- About 30 flowers on screen at most at 2560 wide.
- Tie births to notes, and make scattering a physical event (a wind sweeping across: `fall = f(x)`).

## Pitfalls met while building it
- 46 flowers with additive petals turned shot 2 into a white blowout; fixed with the rule above and 30 flowers.
- `whoosh` needs `dur`, `p0`, `p1`, `f0`, `f1`, or the WAV export throws.
