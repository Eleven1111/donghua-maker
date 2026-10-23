# Look: hud / 科幻界面

Deep navy glass with a faint dot grid and hairline cyan instruments that glow a little: corner brackets framing the screen, concentric tick rings rotating at different speeds, arc gauges with a big thin readout, a radar sweep that lights a blip, symmetric waveform bars, tiny letter-spaced labels and numbers that roll. Amber is the one warm accent, for alerts and the final lock.

Verified in 对接 (`assets/example-hud.html`, 16:9, 12 s, 3 shots, 120 bpm): the radar finds a station, the alignment gauge fills while the distance rolls to 0, and the reticle locks for 对接完成.

## Toolkit (`toolkit-hud.js`)
| call | what it does |
|---|---|
| `hdBg(g)`, `hdCorners(g, x, y, w, h, len, k)` | glass + dot grid; corner brackets |
| `hdRing(g, x, y, {r, w, ticks, tickLen, a0, a1, rot, dash, col, k})` | ring / arc / tick ring, drawn on |
| `hdGauge(g, x, y, r, val, {label, size, alert, text})` | arc gauge + readout (turns amber above `alert`) |
| `hdRadar(g, x, y, r, ang, blips, k)` | radar rings, sweep with trail, blips lit once the sweep has passed `a0` |
| `hdLabel`, `hdNum(t, a, b, t0, d, dec)`, `hdWave`, `hdReticle` | labels, rolling numbers, waveform, lock-on reticle |

## Rules
- Use hairlines (1.5–3 px), not filled shapes. The only fills are gauge arcs and waveform bars.
- Rings counter-rotate at different slow speeds, which carries most of the life.
- Numbers roll to their values and never jump; labels type on.
- Time the blip to the sweep: compute when the sweep angle first reaches the blip and put the ding there.
