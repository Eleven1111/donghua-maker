# Look: paper3d / 立体纸艺 (three.js)

The paper cut-out look as a real paper theatre. Every piece is a card with thickness, a hand-cut slightly irregular edge and a white core showing on the cut, and a fibre texture that catches the light. Layers stand at different depths and cast soft shadows on the layers behind them; the camera dollies so the layers slide past each other (parallax). Puppets are jointed cards on pins that pose at 12 poses/s with a small per-exposure boil. The 2D engine default (canvas paper cut-out) stays for fast, flat films; use this one when the scene wants real depth and light between layers.

Verified in 放风筝 (`assets/example-paper3d.html`, 16:9, 12 s, 3 shots): a paper sun rises behind layered hills; the girl runs downhill and the kite lifts; the camera tilts up to the kite among clouds and birds and the title card drops in.

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look paper3d --shots "…" --durs "…" --bpm 96
```
`--look paper3d` inlines three.js by itself. The toolkit sets `SMOOTH_DEFAULT = false` (stop-motion), grain .1 and a warm vignette.

## Toolkit (`P3`)
| call | what it does |
|---|---|
| `P3.stage({ bg, key, fov })` | backdrop colour, warm key from front-left-top with soft shadows, cool hemisphere fill, perspective camera |
| `P3.card(pts, col, { d, jag, seed, holes })` | extruded card from a 2D outline (x right, y up): coloured faces, white core on the cut edge, fibre map + bump |
| `P3.part(pts, col, pin, o)` | a card hung from a pin (group origin = pin) for jointed puppets |
| `P3.cutPts`, `P3.circle`, `P3.ridge(x0, x1, base, fn)`, `P3.blobUnion(circles)` | outline helpers: hand-cut jitter, discs, hill silhouettes, cloud shapes |
| `P3.cloud(col, s, seed)` | a ready cloud card |
| `P3.face(col)` | the cached paper material for a colour |
| `P3.aim(cam, { at, x, y, z })` | dolly camera |
| `P3.boil(obj, e, id, a)` | per-exposure jitter |
| `P3.frame(ctx, scene, cam)`, `P3.project(p, cam)` | render onto the film canvas; world point → canvas px |

## Rules
- Layers at least 1.5 units apart in z, or their shadows vanish and the parallax is lost.
- The sun and sky cards must not receive shadows: cloud shadows turned the sun into a grey blob.
- Clouds and other white cards far back get a slight emissive, or they go beige.
- Puppet faces: two cheeks, one small mouth below them, eyes above; a single centred blush reads as a mouth. Hair bows sit on the side of the head, small.
- The hero must read at 16:9: the girl at scale 1 was too small; 1.35 passed.
- Zoom in on every face before delivery.

## Cost
One render per frame at 2560×1440 with one 2048 shadow map. Live playback on a real GPU is UNVERIFIED until watched.
