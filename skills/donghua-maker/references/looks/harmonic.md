# Look: harmonic / 谐波运动

Glowing points turn on circles at integer frequency ratios on a dark field. The picture shows a circle projecting a sine wave, Lissajous figures, and fields of dots that fold into m-armed figures. The soundtrack plays the same ratios. It suits maths (trigonometry, periods, ratios) and music intervals. The technique was studied from early computer-animation "visual music". The implementation is our own.

Verified in 圆与波 (`assets/example-harmonic.html`, 16:9, 12 s, 3 shots).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look harmonic --bpm 90 --shots "圆与波,三比二,谐波" --durs "4,4,4"
python3 scripts/font_embed.py film.html --fonts notosans
```

## Toolkit (`toolkit-harmonic.js`)
| call | what it does |
|---|---|
| `hmBg`, `hmGrid(g, cx, cy, step, n)` | dark ground and a faint graph grid |
| `hmDot(g, x, y, r, col)` | additive glowing dot |
| `hmTrail(g, p, t, span, col, {n, lw, t0})` | trail of a pure function p(t) → [x, y], drawn by sampling backwards, with no stored state |
| `hmLiss(cx, cy, R, a, b, ω, φ)` | Lissajous point function |
| `hmField(g, cx, cy, t, {n, R, theta, trail, ph})` | dot i sits at angle i·θ(t). Whenever θ = 2π/m, the dots line up in m arms. |
| `hmLabel`, `hmTurns(t0, t1, f, hz)` | text; pluck events at each whole turn, so you hear the ratio |

## Rules
- Curves are pure functions of time. Never integrate state, so seek and export stay exact.
- To show the figures, sweep θ slowly through a range of 2π/m values (the example goes from 1/50 to 1/3 of a turn, eased) and let it land on a small m. A constant, slow ω only gives a spiral.
- Sound matches the picture: 3 : 2 in the picture is a fifth in the score.
- The palette is warm-to-cool hues by index, one hue per curve in the explanatory shots.

## Pitfalls met
- The engine already defines `TAU`, so don't redeclare it in a toolkit.
- Shot 3 was only a spiral with a constant ω. Sweeping θ fixed it.
