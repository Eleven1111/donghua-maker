# Look: ascii / 字符画

The whole picture is a grid of characters on black. Brightness picks each glyph from a density ramp, colour is one phosphor tint (green, or amber), and the brightest cells glow. Scenes are brightness functions sampled per cell: a ray-marched torus, layered ridge skylines, a ringed planet. It was studied from terminal and demoscene text art; scenes are generated.

Verified in 字符宇宙 (`assets/example-ascii.html`, 16:9, 12 s, 3 shots, 120 bpm).

## Toolkit (`toolkit-ascii.js`)
| call | what it does |
|---|---|
| `asRender(g, fn(u, v), cw, ch, {tint, glow, over(i, j)})` | samples `fn` per cell (u, v aspect-correct in −1..1), batches glyphs into 6 brightness bins, glows the top bin; `over` forces characters (titles) |
| `asTorus(a, b, R1, R2, zoom)` | lit spinning torus (SDF ray march, 28 steps) |
| `asTerrain(t)` | five ridge layers, far dim to near bright, with bright crests and a round sun |
| `asPlanet(rad, spin, tilt)` | banded planet, ring, hashed stars |

## Rules
- Use a 16×28 px cell at 2560 wide (about 160×52 characters). Smaller is noise, larger loses the shapes.
- Each note brightens the whole field briefly (`fn × (1 + .5·flash)`), with a typing click.
- For a title, rasterise the text once into a cols×rows mask and force '#' in those cells; the text must be at least 30 % of the rows tall.

## Pitfalls met while building it
- A continuous heightfield terrain read as dim horizontal noise; layered skylines read.
- A modulo hash on (u, v) put the stars in vertical columns; use fract(sin(dot)).
