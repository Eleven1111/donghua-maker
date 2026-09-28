# Look: voxel / 体素 3D (three.js)

The cosy pixel-farm look rebuilt as a 3D voxel diorama: a floating island of cubes (grass top, dirt and stone tapering underneath), voxel trees, a house whose windows glow at night, crops that grow layer by layer, a blocky farmer who walks and waters, chickens, water and clouds. A long lens with soft shadows and a tilt-shift blur on the top and bottom bands makes it read as a miniature, and one `daylight()` curve runs dawn → noon → dusk → night. Every cube carries a small colour jitter, so no face is flat. The 2D pixel look (`pixel.md`) stays for retro-game and pixel-diagram films; use this one when the scene wants depth, light and a day cycle.

Verified in 农场的一天 (`assets/example-voxel.html`, 16:9, 12 s, 3 shots): dawn with chimney smoke and hens; the farmer waters the field and the crops grow as he passes; dusk to night with lit windows, fireflies, stars and the title.

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look voxel --shots "…" --durs "…" --bpm 100
```
`--look voxel` inlines three.js by itself. The toolkit sets `SMOOTH_DEFAULT = true` (voxels move smoothly; the charm is the miniature, not stop-motion), light grain and a cool vignette.

## Toolkit (`V3`)
| call | what it does |
|---|---|
| `V3.stage({ fov })` | scene, sun + hemisphere + soft shadows, long-lens camera; `.sky([top, bottom])` |
| `V3.daylight(st, u)` | sets sun colour/angle, fill, sky and fog for `u` in 0 (dawn) → 1 (night) |
| `V3.island(r, { seed, grass, dirt, stone, depth, flat })` | the floating island; returns the mesh and `heightAt(x, z)` to stand things on it |
| `V3.mesh(vox, { jitter, seed, emissive })`, `V3.model(layers, pal)` | one InstancedMesh from voxel lists or ASCII layers + palette |
| `V3.tree(seed, o)`, `V3.cloud(seed, s)`, `V3.chicken()` | props |
| `V3.house(o)` | house with `.glow(k)` (windows) and `.chimney` (smoke origin) |
| `V3.crop(kind)` | `'cabbage'` / `'corn'`; `.grow(u)` builds it up layer by layer |
| `V3.farmer(o)` | blocky rig; `.pose({ walk, wave, water, t })`, `.can` (watering can) |
| `V3.aim(cam, { at, az, el, dist })` | orbit camera |
| `V3.frame(ctx, scene, cam, { tilt })` | render, copy onto the film canvas, tilt-shift blur bands; draw 2D titles after it |
| `V3.project(p, cam)` | world point → canvas px (labels, particles in 2D) |

## Rules
- Pose is a pure function of time (`WORLD.pose(t)`); the first frame of every shot already shows the island.
- Keep hero props clear of the camera line: in 浇水 a tree hid the field until the camera was re-aimed. Check every shot's first and last frame.
- Crops at scale 1 were too small to read at 16:9; 0.7 of a house height is the working size.
- Faces are 2–3 voxels: skin forehead, one dark voxel per eye, hat raised one voxel. A hair row under the hat brim plus its shadow read as sunglasses.
- Night: windows and fireflies are emissive; stars are 2D dots drawn after `frame()`.

## Cost
One render per frame at 2560×1440 plus two blur bands. Headless seeks were fast; live playback on a real GPU is UNVERIFIED until watched.
