# Look: tessellation / 镶嵌变形

A square lattice whose edges bend into interlocking fish. The bend grows from 0 (a plain checkerboard) to full, so squares turn into animals across the frame or over time. It uses two tones, a fine outline, and an eye, gill and fin marks once the shape is strong. It was studied from the regular-division technique of mid-20th-century graphic art. Tiles are generated, never copied, and no artist is named in films (their work is still in copyright).

Verified in 方与鱼 (`assets/example-tessellation.html`, 16:9, 12 s, 3 shots, 120 bpm).

## Toolkit (`toolkit-tessellation.js`)
| call | what it does |
|---|---|
| `TS_H(s)`, `TS_V(s)` | edge profiles for horizontal and vertical edges |
| `tsTile(g, i, j, c, ox, oy, amp)` | one tile. Each edge takes its bend from `amp` at the edge midpoint, which it shares with its neighbour. |
| `tsField(g, x0, y0, x1, y1, c, ox, oy, amp(x, y), {cols, marks})` | the field. Move `ox` to make the shoal swim. |

## Rules
- Translation symmetry keeps it gap-free: every edge is one shared curve. Vary the bend per edge, never per tile.
- A front of change (a line, or a ring from the centre) is the story: squares → fish → squares.
- Put the marks near the tile centre; at the edge they read as belonging to the neighbour.

## Pitfalls met while building it
- The first profiles read as birds or blobs. `H = .16 sin + .1 sin 2`, `V = .3 sin`, with bigger eye and gill marks, reads as fish.
- `C` is an engine constant; name story constants something else (`CELL`).
