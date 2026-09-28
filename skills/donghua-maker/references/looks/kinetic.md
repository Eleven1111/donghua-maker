# Look: kinetic / 动态字体

Type is the only actor. Black words sit on warm grey paper under a soft spotlight and arrive on the beat with strong contrasts of scale and weight: a small italic serif lead-in, then a huge heavy sans word that slams in with an overshoot. A repeated phrase multiplies into a wall of rows scrolling in alternating directions, with a clearing around the headline. Letters can fly apart on exit. One red full stop is the only colour.

Verified in 开口 (`assets/example-kinetic.html`, 16:9, 12 s, 3 shots, 120 bpm). Embed two fonts: `--fonts notosans,notoserif`.

## Toolkit (`toolkit-kinetic.js`)
| call | what it does |
|---|---|
| `ktBg(g)` | paper + spotlight |
| `ktWord(g, str, x, y, size, k, {style, motion, out, align, col, weight, track})` | `style` sans/serif; `motion` slam / up / down / left / right (masked slide) / type / fade; `out` exits; returns the width |
| `ktWall(g, words, y0, rows, size, t, k, {hot, lh, speed, a})` | scrolling rows of a repeated phrase; `hot` indices darker |
| `ktDot(g, x, y, size, k)` | the red full stop after a word ending at `x` |
| `ktScatter(g, str, x, y, size, u)` | letters fly off one by one |

## Rules
- Every word lands on a beat, with a `thump` under each slam.
- Pair scales: lead-in about 100–130 px serif italic, key word 300–560 px heavy sans. Never two heavy words at the same size.
- Walls stay light (`KT.light`) with at most one darker "hot" item, and get a soft elliptical clearing behind the headline.
- Only the full stop is red.

## Pitfalls met while building it
- The clearing drawn as a gradient inside a rectangle showed hard edges. Fill the whole frame with an elliptical radial gradient instead.
- The lead-in 先 overlapped the slammed 开口 after it settled; the lead-in was moved up and left.
