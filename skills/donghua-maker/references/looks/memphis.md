# Look: memphis / 孟菲斯

Candy pastel grounds (pink, mint, butter yellow, lilac) plus black. The ground is scattered with simple shapes: squiggles, zigzags, dot grids, rings, triangles, half-discs, pills and stars. They bob gently and pop in with an overshoot. Every object has a thick black outline and a hard offset shadow. Fills are flat or patterned (stripes, dots, checks), with halftone dot fields. Type is heavy and rounded, with an outline and a drop. Studied from 1980s Memphis-group design; the compositions are generated.

Verified in 周末去哪儿 (`assets/example-memphis.html`, 16:9, 12 s, 3 shots, 120 bpm): the question pops in, a patterned wheel spins and lands on 野餐, and the plan appears in a speech bubble.

## Toolkit (`toolkit-memphis.js`)
| call | what it does |
|---|---|
| `mmPop(t, t0, d)` | 0 → overshoot → 1 (ease-out-back) for pop-ins |
| `mmShape(g, kind, x, y, s, r, fill, {lw, shadow})` | circle / ring / tri / half / pill / rect / star with outline + hard shadow |
| `mmSquiggle(g, x, y, len, r, col, {amp, n, w, zig, ph})` | wavy or zigzag line with shadow |
| `mmConfetti(n, seed, rect, hole)` + `mmConfettiDraw(g, list, t, t0)` | seeded scatter that avoids a hole around the title; bob + staggered pop |
| `mmTitle(g, str, x, y, size, t, t0, {fill(i), stroke, tilt})` | per-letter pop, outline, drop; returns its width |
| `mmDots`, `mmHalftone`, `mmPattern(g, 'stripes'\|'dots'\|'checks', a, b, s)`, `mmBubble` | textures and the speech bubble |

## Rules
- Use one pastel ground per shot and change it on the cut. Accents are saturated (blue, red, teal) and always outlined.
- Keep a hole in the confetti for the title, since `mmConfetti` rejects points inside the ellipse.
- Every arrival is a pop on a beat; nothing fades.
- To land a wheel on a sector, solve the final angle: sector `i` sits under a top pointer when θ + (i + ½)·60° = −90° (mod 360°). Add whole turns and ease out.

## Pitfalls met while building it
- A sticker at the bottom collided with the closing line; the fix was one fewer sticker.
