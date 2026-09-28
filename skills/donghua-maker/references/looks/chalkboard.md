# Look: chalkboard / 黑板粉笔

A dark green slate with faint old eraser swipes and a wooden chalk ledge. Everything is chalk: lines and handwriting write themselves on by length, a little wobbly, broken up by the slate's tooth (a grain mask punches holes in the chalk layer). White chalk carries the drawing, and yellow, pink and blue chalk carry emphasis. A felt eraser wipes a band and leaves a grey smear. The teacher's hand is implied by a chalk stick at the writing tip.

Verified in 黑板课 (`assets/example-chalkboard.html`, 16:9, 12 s, 3 shots, 120 bpm): a triangle, its three angles slid onto a straight line, and ∠1+∠2+∠3 = 180° circled.

## Toolkit (`toolkit-chalkboard.js`)
| call | what it does |
|---|---|
| `cbBoard(g)` | slate + old smears + ledge with chalk sticks (screen fill, then world) |
| `cbBegin()` → `L`, `cbEnd(g, bite)` | chalk layer; all chalk goes into `L`, `cbEnd` bites grain out of it and lays it on the board |
| `cbStroke(L, P, k, col, w, seed)` | a chalk line along polyline `P`, drawn on to `k` (two offset passes + dust) |
| `cbText(L, str, x, y, size, k, col, {align, bold})` | handwriting revealed character by character with baseline wobble; returns its width |
| `cbArrow`, `cbLineP`, `cbCircleP`, `cbPart`, `cbTip` | arrows, point lists, prefix by length, tip position |
| `cbErase(L, g, x0, y, x1, h, k)` + `cbEraser(g, x, y)` | wipe a band left→right leaving a smear; draw the felt eraser at the head |
| `cbStick(g, x, y)` | the chalk stick at the writing tip (draw after `cbEnd`, outside the chalk layer) |

## Rules
- Chalk is never crisp: always draw through `cbBegin`/`cbEnd` so the tooth breaks it up.
- Keep 2–3 chalk colours: white for structure, and yellow/pink/blue each mean one thing throughout.
- Build the argument across shots and redraw the finished parts at `k = 1` in later shots; every new mark lands on a beat and gets a chalk scratch (`rustle`, dense) or a `tick`.
- Measure text with the value `cbText` returns before placing circles or underlines around it.

## Pitfalls met while building it
- The interior angle at a vertex whose edge directions straddle ±π wraps: add 2π to one end instead of sorting.
- The final answer overflowed the right edge under a camera push, and a circle drawn at a guessed position missed "180°". The fix: place from the measured widths and make the push small.
