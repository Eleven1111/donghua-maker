# Look: datafluid / 粒子流体

Tens of thousands of glowing particles on a dark ground, carried by a divergence-free swirl so the mass moves like liquid, morphing between forms (a data grid, a flowing sheet, a sphere). Colour is an 8-hue cycle over each particle's layer, position and speed, drifting slowly with time. Studied from published data-driven fluid installations; fields and forms are generated, never copied.

Verified in 数据之海 (`assets/example-datafluid.html`, 16:9, 12 s, 3 shots, 90 bpm, 20,000 particles).

## Toolkit (`toolkit-datafluid.js`)
| call | what it does |
|---|---|
| `dfParticles(n, seed)` | per-particle seeds (u, v, w) used by every form |
| `DF_FORMS.grid / wave / sphere` | forms as functions of (u, v, w, t); add your own |
| `dfSwirl(x, y, t, amp)` | curl of a sum of sines: swirling, no sinks or sources |
| `dfPos(S, i, t, A, B, k, amp)` | blend form A → B (per-particle stagger by w) plus swirl |
| `dfDraw(g, S, t, A, B, k, amp, {vmax, mix, alpha, lw})` | streak from t−dt to t, binned into 8 colour buckets (hue cycle wraps, `drift` per second), additive; one path per bucket |

## Rules
- Positions are analytic, so seeking is exact; don't integrate particle paths.
- Use absolute film time for the swirl across shots, or the fluid jumps at cuts.
- Notes send a surge (`amp` kicks up and decays).
- Give every particle a minimum dot, or still particles vanish.

## Pitfalls met while building it
- Colour by speed alone (vmax 40) left everything in the first blue bucket; mixing in the particle's layer (`mix .55`) and vmax 14 brought out cyan, violet, pink and gold.
- Bed kind must be one the engine knows (`room`, `street`, `field`, `stage`); `wind` made the WAV export throw.
- A 5-colour blue-to-gold ramp read as mostly blue/violet; the user asked for richer colour. Now 8 hues (blue, cyan, teal, green, gold, orange, pink, violet) cycled by v + 0.35·u + speed + 0.04·t. Aim for at least 5 distinct hues on screen.
