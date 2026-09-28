# Look: klimt / 金色装饰

A pale gold-leaf ground with a tree whose branches spread sideways and end in, and are lined with, gold spirals edged in dark lines. Small dark fans and eye motifs sit on the branches. Around it are robes of coloured triangle mosaic, a ground strip of jewel-coloured circle mosaic, and a black bird. Studied from the public-domain Stoclet Frieze (1910–11); compositions are generated, never copied, and no faces are drawn.

Verified in 生命之树 (`assets/example-klimt.html`, 16:9, 12 s, 3 shots, 90 bpm, fonts `notoserif`).

## Toolkit (`toolkit-klimt.js`)
| call | what it does |
|---|---|
| `klGround(g)` | baked gold leaf, stretched past the frame |
| `klTree(seed, x, y, h, {depth})` + `klTreeDraw(g, B, L)` | branching tree; L = level progress, one level per note; tips curl into spirals, side spirals along each branch |
| `klSpiral(g, x, y, r, turns, dir, k, a0, lw)` | spiral drawn as dark edge + gold + highlight |
| `klRobe(g, x, y, w, h, k, seed, {cols})` | tapered silhouette of triangle mosaic assembling in random order |
| `klMeadow(g, y0, y1, k, seed, t)`, `klFan`, `klEye`, `klBird` | ground mosaic, motifs, bird |

## Rules
- Density is the look: the spirals must crowd the canopy. Branches past level 1 bend towards horizontal, as in the frieze.
- Use gold, dark brown ink and a few jewel colours (red, blue, cream, black, olive). No other hues.
- Put the title on a dark cartouche; gold text on gold is unreadable.

## Pitfalls met while building it
- A robe at k = 0 drew as a solid black slab; robes now fade in with k.
- The first tree was thin and ran off the top; it is shorter and wider now, with thicker, denser spirals.
- A pushed-in camera showed an edge past the baked ground; the ground is now drawn to the frame plus 400 px of margin.
