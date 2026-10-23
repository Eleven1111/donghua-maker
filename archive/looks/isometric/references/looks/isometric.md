# Look: isometric / 等距几何 (three.js)

A real 3D diorama seen through an orthographic camera at the true isometric angle (elevation 35.26°, azimuth 45°). Soft-edged pastel blocks sit on a pale ground, and one key light gives the classic three tones: top light, left mid, right dark. Soft contact shadows fall on the floor. At room scale it is a diorama: a floor slab and two back walls, windows, furniture and plants dropping in on the beats, and white pin labels drawn over the frame. At city scale, towers of set-back tiers rise and repaint. Because the world is real, the camera can orbit it, which the old 2D version could not. Studied from published generative isometric works; cities are generated, never copied.

Verified in 积木城 (`assets/example-isometric.html`, 16:9, 12 s, 3 shots, 120 bpm): the room assembles piece by piece while the camera turns, the city rises tower by tower, and a diagonal wave repaints it while the camera swings a quarter of the way round.

## Start
`--look isometric` inlines three.js by itself. The toolkit sets `SMOOTH_DEFAULT = true`.

## Toolkit (`I3`, palettes in `ISO`)
| call | what it does |
|---|---|
| `I3.stage({ bg, view, shadow, span })` | flat ground colour, shadow-catching floor, hemisphere fill, key light placed for top > left > right, orthographic camera (`view` = half-height in units) |
| `I3.aim(cam, { at, az, el, zoom })` | orthographic orbit; `az` π/4 and the default `el` are true isometric |
| `I3.box(x, y, z, w, h, d, col, { r, own })` | soft-edged box, origin at its min corner (y up); `own` gives it its own material to recolour |
| `I3.room(w, d, h, cols)` | floor + back walls on x = 0 and z = 0; `.rise(k)` grows the walls |
| `I3.win('x'\|'z', a, len, y0, y1, sky)` | framed window on a back wall; `.grow(k)` |
| `I3.desk`, `I3.chair`, `I3.shelf(books)` (open shelf, `.fill(k)`), `I3.lamp`, `I3.plant(s)`, `I3.rug(w, d)` | props as groups |
| `I3.drop(t, t0, d)` → `{ k, dy, s }`, `I3.spring(k)` | drop-in with a squash; 0→1 with a wobble |
| `I3.city(seed, n, pal, { maxH, empty, bias })`, `I3.cityBuild(lots, pal)`, `I3.cityPose(g, rise(l), col(l, k))` | n×n lots of 1–3 tiers; each tier owns its material |
| `I3.label(ctx, str, p, cam, k)`, `I3.project(p, cam)` | 2D pin label at a world point |
| `I3.frame(ctx, scene, cam)` | render onto the film canvas |

## Rules
- Pose everything from time in `draw`; one world per scale (room, city), built once.
- Bias tower height towards the middle, or a random city leaves a hollow centre.
- Frame for the widest moment: the room fills about 75% of the height at zoom ≈ 3 with `view` 9; a 6×6 city at zoom ≈ 2.
- Keep the orbit within about ±40° of the isometric azimuth: a side-on view loses the three-tone read.
- A prop's inside must be modelled if something sits in it: a solid shelf box hid its books; the shelf is now open to +x.
- Every first frame shows something: start the floor's drop just before the cut.
- Ends on the strongest palette: order the recolour waves so the last one is the one you want held.
