# Look: teardown / 爆炸拆解

A real object lit like a studio packshot on a dark graphite sweep, taken apart along its own axes one layer at a
time. Every part is named by a leader that starts on a 3D point of that part, and the camera keeps travelling.
It suits "how does this thing work inside" films: a mechanism, a product, a tool, a lock, a gearbox.

The grammar comes from lemo-opuscar's teardown STYLE.md (MIT): only the rules were taken, none of the code. The object
itself comes from `references/rebuild.md`, which covers the reference photos, the detail inventory and the part tree.
**Without engineering files the frame says 示意 and shows no number it cannot source.**

Verified in 安全钳，拆开看 (`assets/example-teardown.html`, 9:16, 14 s, 3 shots, 120 bpm, three.js r158 inlined):
- **整体**: the closed gear on its T-rail; the camera swings round it and the title lands.
- **拆开**: five layers leave in order, and five leaders name 导轨 / 钳体 / 楔块 / 碟形弹簧组 / 提拉机构.
- **楔紧**: the parts close back quicker, seen wide, then the camera dives in. The rod pulls the two wedges up their
  slopes until they bite the rail, with a 7 px shake, a clink and a thump. The second subtitle lands with the bite, and
  the camera pulls back to the gripped gear.

Fact gate: 12 strings sourced (Wittur CSGB page, patent CN105329739A, GB/T 22562). One visual claim is marked disputed:
the two-sided build differs from the patent's one-slider design (`example-teardown-facts/facts.json`).

## Signature features
These are checked against stills and strips (`review.md` item 8). The numbers are the toolkit's defaults at a
1440 px short side; `S = min(W, H) / 1440` scales every pixel size.

1. **Graphite sweep.** A radial gradient `#3b3e43` → `#1d1f23` → `#0b0c0e`, centred at 46 % of the height. It is
   never a flat colour and never white.
2. **Studio light.**
   - A warm key from the upper left front, `(−30, 60, 40)`, casts one soft shadow onto an invisible floor (opacity
     .42; PCF with radius 6 on a 4096² map).
   - A cool rim `#bfd6ff` comes from behind on the right.
   - Metals reflect five soft boxes (a PMREM room); ACES tone mapping at exposure 1.05.
   - A still shows one shadow falling back and to the right, and a cool edge on the parts' far side.
3. **Layered explode.**
   - Each part leaves along its own axis. Layers go out 0.15 s apart, each over 1.3 s with ease-in-out cubic.
   - They come back in reverse order and quicker: by default 0.12 s apart over 0.8 s. The example uses 0.15 s / 1.0 s
     so that the close reads at a wide angle.
   - While apart, each part floats ±0.07 units out of phase with its neighbours.
4. **Leaders start on the part.**
   - A 9 px accent dot with a 3 px dark ring sits on a 3D point of the part, re-projected every frame.
   - A 3 px leader with one elbow runs to a text column at a fixed x, 96 px from the frame edge, with rows at least
     210 px apart.
   - The leader draws first; the text slides in 10 px after it.
5. **Label typography.**
   - The index is accent mono (700, 44 px); the name is 600, 64 px, ink `#f1efe9`; one spec line is 400, 40 px, at
     62 % ink.
   - **One accent only**, `#ff6b3d`, used for indices, anchor dots and the title bar. Nothing else on screen is orange.
6. **The camera never parks.**
   - It follows a monotone cubic path (Fritsch–Carlson) through keys, so it never overshoots. In the example: azimuth
     1.25 → 0.31 → 0.46 rad, distance 138 → 206 → 88 → 124.
   - Even while labels are being read it keeps drifting (0.18 rad over 3.6 s).
   - The view slides (`setViewOffset`, up to 230 px) to free the label column, so the object itself never moves for
     the layout.
7. **The title says what kind of picture this is.**
   - An accent bar (72 × 8 px), the title at weight 800 and 112 px, both at 14.8 % of the height.
   - A 46 px dim line under it carries 示意 / 非实物尺寸 whenever the geometry is not from engineering data.
8. **Packshot-clean motion.** Smooth 60 fps (`SMOOTH_DEFAULT = true`, no 12 fps stepping) and grain .03. The
   subtitle (600, 64 px at 88 % of the height) sits on a dark scrim that rises from 78 % of the height.

## What it is not
- **Not 3D flat science** (`flatsci`). Toon shading, flat colour areas and a cartoon planet are flatsci. Teardown
  uses physical materials with reflections and real shadows, and its colours come from the material, not a palette.
- **Not a blueprint** (`blueprint`). A 2D line drawing on blue with dimension chains is blueprint. Teardown shows
  solid lit parts, with dimensions only when they are sourced.
- **Not clay** (`clay3d`). Lumpy forms, fingerprints and 12 fps boil are clay. Teardown parts are machined (bevel
  0.1) and move smoothly.
- **Not a product launch** (`launch`). UI panels, springing headlines and a counter ring are launch. Teardown has one
  object, its parts and their names.

## What may change
| tier | elements | evidence |
|---|---|---|
| safe to change | the object and its material colours (taken from the reference), the number of layers and parts, format (landscape gives the label column more room), shot count, font (embed it) | the toolkit holds nothing gear-specific (a wedge appears only in a comment); the object, materials, layers, labels and camera keys all live in the story block. Only one object has been built in the look so far |
| changes the character, try one frame first | a light sweep (white catalogue packshot: ink and dim flip to dark), labels on both sides at once, a cutaway section instead of an explode, stop-motion stepping | untested; each one removes a cue the look is known by |
| can't change | real geometry from a reference and a part tree (or the 示意 line); layered explode along the parts' own axes with stagger and a reversed, quicker close; leaders that start on a 3D point of the part, ending in a fixed-x column; studio light with a real shadow; one accent | the round-4 build drew a closed box that the real gear doesn't have, and the reference check caught it (rebuild.md §2) |

## Pipeline
1. **Rebuild the object** (`rebuild.md`): reference photos, a detail inventory, then a part tree. Each part gets a
   layer and an explode offset along the way it really comes out. Build left/right pairs mirrored, never rotated.
2. **Build the parts** with `TD.part(name, layer, off, g => …)` from `TD.prism` (outline + bevel), `TD.box` and
   `TD.cyl`, using `TD.phys(color, metalness, roughness)`. `layer: -1` keeps a part fixed; the rail is one.
3. **Pose every frame**:
   - set the part's own real motion first in `p.extra` (a wedge pulled up a slope, a key pressed);
   - then `tdApart(T, open, close)`, then `tdCam(path(T), shake)`;
   - then `tdFrame(ctx, sweep)` (bake `tdSweep()` once).
4. **2D on top**:
   - `tdTitle` once at the start;
   - `tdLabels(ctx, [{ anchor: tdAt(name, i, [x, y, z]), idx, name, spec, k, fade }])` while apart;
   - `tdSub` for the line that carries the story.
5. **Timing**:
   - Per-label hold ≥ CJK characters ÷ 4.5 + 1.5 s.
   - Labels arrive 0.18 s apart, each on a melody note and a tick.
   - The close is quicker than the open; the payoff motion (the bite) lands on a clink plus a thump and a ≤ 0.3 s
     shake.

## Toolkit (`toolkit-teardown.js`, namespace `TD`, colours `TDC`)
| call | what it does |
|---|---|
| `TD.R`, `TD.scene`, `TD.cam`, `TD.key`, `TD.rim`, `TD.floorAt(y)` | renderer with alpha, PMREM studio room, key/rim/hemi lights, shadow-only floor |
| `TD.phys`, `TD.mesh`, `TD.prism(pts, z0, z1, mat, bev)`, `TD.box`, `TD.cyl` | physical material, shadowed mesh, extruded outline with a machined bevel, box, cylinder |
| `TD.part(name, layer, off, build)`, `TD.list`, `TD.named` | part registry: home pose, explode offset, layer, `extra` |
| `tdApart(T, open, close)` | layered explode and reversed close, plus float, plus `extra` |
| `tdPos(name, i)`, `tdAt(name, i, [x, y, z])` | posed position / a posed local point (label anchors) |
| `tdPath(keys)`, `tdCam(pose, shake)`, `tdProj(p)` | monotone camera path; apply with view offset and shake; world → screen |
| `tdSweep()`, `tdFrame(ctx, sweep)` | baked graphite sweep; sweep + WebGL render into the film canvas |
| `tdLabels(g, list, { top, gap, bot })`, `tdTitle(g, title, sub, k)`, `tdSub(g, text, k)` | leader column, title card, subtitle with scrim |

Scaffold with `scaffold.py --look teardown`. It pastes the toolkit and inlines three.js. Embed fonts with
`font_embed.py <film>.html --fonts notosans,jetbrainsmono`.

**Cost**: qa.py p50 is 46–53 ms per frame at 1440 × 2560 with a 4096² PCF shadow map (p90 ≤ 80 ms).

## Pitfalls met while building it
- **Invented parts.** Round 4 built the gear body as a closed yellow box. The reference shows an open, symmetric
  zinc-yellow frame with disc-spring stacks, a bright steel plate and brass wedges. Only the part-by-part reference
  check found this; the photo is shot lying on its side, so an overlay could not line up.
- **Black steel.** The steel plate rendered black: metalness 1 in a dark room reflects only the dark room. Sample
  colours in the still; the example's bright plate uses metalness 0.55 and roughness 0.36.
- **Rail over the title.** A tall object in portrait ran up through the title card at 1.5 s. Slide the view down
  (`sy` 130–170) for the opening keys rather than shrinking the object.
- **Text over bright metal.** A subtitle over the bright rail could not be read until `tdSub` got its scrim. Never
  put text on a bright part without a dark backing.
- **`tdPath` past its last key.** `findIndex` returned −1 there; the index now clamps to the last segment.
- **Hard, stepped shadow.** `shadow.radius` does nothing under `PCFSoftShadowMap`, and the review called the floor
  shadow blocky. The toolkit now uses `PCFShadowMap` with radius 6 and a 4096² map.
- **A parked camera.** Two keys 3.6 s apart that differ by 0.06 rad read as frozen while labels were up (review: dead
  time). Drift at least ~0.15 rad across a label hold.
- **Closing under a push-in.** Parts that snap home while the camera dives 2.3× can't be mapped back to the explode
  (review). Close at the wide angle, then dive.
- **Text after the action.** A subtitle that arrived 0.7 s after the bite read as late. Key it to the action's own
  time (`PULL[1]`).
- **Fake bold.** `font_embed.py` declared Noto Sans SC without a weight range, so 600/800 came out as synthetic bold.
  It now declares `100 900`, and the subset keeps the `wght` axis.

## Could be better
- No transition kind yet: cuts are hard. A natural one would be the camera travelling through the object.
- The disc springs are drawn as coil stacks of discs, which reads as coils at a distance. A true disc profile (a cone
  pair) would read closer to the photo.
