# Look: Pixel art / cosy farm-sim

Pixel mode (`--pixel N`). Read this together with `../shot-contract.md` (the engine API) and `../styles.md` (the one-row recipe).

When `PIX > 0`, `draw(ctx, …)` receives the low-res buffer (`LW×LH`, e.g. 320×180), and world units are low-res pixels. The engine scales it up nearest-neighbour and skips grain, flicker and vignette. `toWorld` and `poke` coordinates are low-res too.

| fn | use |
|---|---|
| `setCamP(ctx, cam, parallax)` | pan-only camera snapped to whole pixels. The cam is `{x, y, z: 1}`; zoom isn't supported |
| `pxArt(rows, pal)` | sprite from ASCII rows; `pal` maps char → colour; `.`/space = clear |
| `pxPut(ctx, spr, x, y, {flip, ax, ay})` | place by anchor (default bottom-centre), optional mirror |
| `pxRect`, `pxDisc(ctx, cx, cy, r, col)` | whole-pixel rectangles and filled circles |
| `pxDither(ctx, x, y, w, h, a, b, t)` | 4×4 Bayer dither from a to b; `t` is a number or `(x, y) => 0..1` |

Rules:
- Use integers only. Everything is rounded, but compute positions in pixels.
- Bake static layers (skies, hills, ground, buildings) in `build()`; per-pixel loops every frame are slow.
- Don't call `boil()` on pixel sprites (jitter reads as a bug at this scale); animate with pose frames chosen by `e` instead.
- Sound: `{k: 'chip', n: 'D5' | f, wave: 'triangle' | 'square', dur, f2 (slide), vib}`.

Scale and layout, learned on 农场的一天 (the user rejected the first cut, so these are the defaults now):
- **Show characters at 2×.** Write the ASCII art at 1× (a hen 12 px, a person 12×16) and bake it with `px2(pxArt(...))`. At 1× on 320×180, characters are only 12–16 px tall and get lost. Double every offset tied to a sprite too: hand and spout positions, drops, splashes, "!" marks, and water patches hiding the lower body.
- **Put the horizon at about y 88** (roughly half the frame), not y 118. Ground gets the lower half. Shift the baked ridges and tree lines up, e.g. `drawImage(far, -40, -30)`. Move the sun and clouds up by the same amount.
- **Buildings and a whole set at 2×:** bake them at 1×, then draw the foreground through `ctx.setTransform(2, 0, 0, 2, round(LW/2 - 2*cam.x), -148)`, which maps world y 118 to screen 88. Re-lay out the set for a view only 160 world units wide; cropping a house at the frame edge is fine. Draw the ground at 1× outside this transform, so grass texture matches the other shots. `poke` must undo the transform: `x = (x - cam.x)/2 + cam.x; y = (y + 148)/2`. A light drawn after the multiply darkening layer needs the transform set again.
- **Wide baked layers:** a far layer at parallax p must cover `LW + (camRange × p)`. Bake shared layers about 800 px wide once (in the first shot that needs them, stored on a shared object like `DAY`), not per shot.
- **Stop-motion without `boil`:** compute kinematic positions (walks, jumps, lifts) from `sq` inside `draw` so they step on each exposure. Keep only particles (drops, splashes, smoke) in `step`/`snap`. Animate walks by swapping frames on `e & 1`.
- **Fades are stepped:** overlay alpha `Math.ceil(f * 4) / 4`, not a smooth ramp.
- Export `--scale .75` makes 6 screen px per art pixel, clean at 1080p. The file is small (19 s ≈ 2.5 MB), because there's no grain.
