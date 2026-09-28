# Look: clay3d / 3D 黏土定格 (three.js)

Real clay volumes on a tabletop set, rendered in WebGL. Every shape is a lumpy, hand-pressed solid, and one shared normal map carries the clay surface onto all of them: thumb dents with fingerprint ridges, a slight raised lip around each dent, tool drags and fine grain. Lighting is a warm soft key with soft shadows, a cool rim and a hemisphere fill, with ACES tone mapping. Puppets pose at 12 poses/s with a small per-exposure "boil", while the camera glides at 60 fps. This replaces the old 2D canvas clay look, which could not give real volume or light.

Verified in 小猫钓鱼 (`assets/example-clay3d.html`, 16:9, 12 s, 3 shots, 120 bpm): the bobber dips and the cat's ears perk; the rod bends, and the fish leaps over the dock into the bucket; the cat smiles with ^ ^ eyes and the title lands.

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look clay3d --shots "…" --durs "…" --bpm 120
```
`--look clay3d` inlines three.js by itself (the toolkit uses `THREE`). The toolkit sets `SMOOTH_DEFAULT = false` (stop-motion), light grain and a warm vignette.

## Toolkit (`K3`)
| call | what it does |
|---|---|
| `K3.stage({ sky, key, fov })` | scene with a gradient sky backdrop, warm key (PCF soft shadows), cool rim, hemisphere fill, perspective camera |
| `K3.aim(cam, { at, az, el, dist })` | orbit camera |
| `K3.blob(rx, ry, rz, col, o)` | lumpy ellipsoid: bodies, heads, paws, clouds, hills |
| `K3.rbox(w, h, d, r, col, o)` | lumpy rounded box: planks, posts, slabs |
| `K3.snake(pts, r, col, { taper })` | rolled clay tube with round ends: tails, rods, whiskers, reeds, fishing line |
| `K3.cone(r, h, col)` | ears, fins |
| `K3.eye(r, iris, lidCol, { slit })` | glossy eyeball with iris, pupil, catchlight and two lids; `.lid(k)`, `.pupil(s)`, `.look(x, y)` |
| `K3.mat(col, { rough, bump, rep, sheen, gloss, map, side })` | cached clay material (the shared normal map, sheen); `gloss` for wet things |
| `K3.stripes(base, dark, n, o)` | colour map with soft bands (tabby stripes on a sphere, rings on a tube) |
| `K3.lump(geo, o)`, `K3.weld(geo)` | noise displacement along normals; seam-welded normals |
| `K3.boil(obj, e, id, a)` | per-exposure jitter (pass the engine's exposure index `e`) |
| `K3.wob(t, a, f, d)`, `K3.eBack(u)` | damped spring; back-ease for pops |
| `K3.frame(ctx, scene, cam)` | render and copy onto the film canvas; draw 2D titles after it |

## Rules
- Pose is a pure function of time. A `WORLD.pose(t, e)` sets every transform from `t`. Shots pass `t0 + sq` (the stepped time) in stop-motion and `t0 + st` in smooth mode, and aim the camera from the smooth `st`.
- Rebuild bent things (tails, rods, lines) only when the exposure index `e` changes; that is what a hand re-bending clay looks like, and it keeps the cost down.
- Characters: check anatomy in photos first. The cat that passed has ears on the top corners with pink insides, eyes at mid-height about one eye-width apart, a pale blaze to a white muzzle with two whisker pads, a pink nose above them, a tabby M, and a head wider than tall, sunk a third into the chest.
- Happy eyes: hide the eyeballs and show two dark rolled arcs (^ ^). Closing the lids reads as sleepy, not happy.
- Water is a displaced plane updated per exposure; keep it matte (roughness about .7, weak bump). A glossy water plane with a fine normal map shimmered with moiré under the rim light.
- Clouds high on the backdrop are seen from below and go brown under the hemisphere's ground colour; give them an emissive tint and keep them low in the sky.
- Every first frame shows the set; props dropping in start before the cut.
- Sound: music box and physical foley (`pluck` for bobber dips, `creak` for the bending rod, `whoosh` + `rustle` for the leap, `thump` for landings); no ambience bed.

## Cost
One render per frame at 2560×1440 with one 2048 shadow map. Stills and seeks took about 8 ms each headless; live playback smoothness on a real GPU is UNVERIFIED until watched.
