# Look: American comic / 美漫

American-comic toolkit (copy from `assets/example-comic-night-watch.html`). Read this together with `../shot-contract.md` (the engine API) and `../styles.md` (the one-row recipe).

These are story-level helpers. Copy from `// ── comic ink toolkit` through `neckOf`.

| fn | use |
|---|---|
| `inkStroke(g, pts, e, {w0, w, w1, col})` | a loaded-brush line: a filled ribbon tapering w0 → w → w1, with slight per-exposure wobble. Limbs, bolts, rim light and the scarf are all built from it |
| `halftone(g, x, y, w, h, cell, size(x, y), col)` | Ben-Day dots on a 45° grid. Use it for sky gradients, moon shading and cover sunbursts. Bake it in `build()` |
| `hatchLines(g, …)` | parallel hatching inside the current clip (lit ledges, clothing) |
| `focusLines(g, cx, cy, r0, r1, n, e, col)` | radial speed/focus lines (集中线), re-scattered each exposure |
| `burst(g, cx, cy, rx, ry, spikes, e, fill)` + `sfxText(g, txt, x, y, e, u)` | a jagged balloon, then fat italic lettering with a two-tone fill, a thick outline and a stepped 3D extrusion; it pops in on `u` |
| `caption(g, txt, x, y, e, u)` / `balloon(g, txt, x, y, tailX, tailY, e, u)` | a yellow narration box that types on, and a speech balloon with a tail |
| `panelFrame(ctx)` | paper gutter plus a heavy panel border. Draw it last, in screen space |
| `heroDraw(ctx, x, y, e, rim, scarf, POSE, k, flip)` | a solid-black silhouette built from a pose object `{torso, hood, limbs:[[pts, w0, w, w1]], eyes, rims, extra, neck}`. `rim` adds white backlight strokes. Add a pose by writing a new object, not new drawing code |

Rules learned on 夜巡:
- **A black silhouette needs a light background behind it.** The first cut put the hero in front of black buildings and he vanished. Lower the skyline so he stands against the sky, scale him up (×1.45 in a wide shot), or move the light source (lamp cone, moon, sunburst) behind where he lands. Check every shot for black on black, including after a landing.
- **Keep sound-effect lettering and balloons off the hero's head.** Place them after the camera move is known, and check the frame at their pop time.
- Use one accent colour (the red scarf, the chest mark). Colour a secondary character with a flat colour and an ink outline (`thugDraw`) so he separates from the black hero.
- Lightning flash: swap to a pre-baked white-sky backdrop for 2–3 exposures rather than inverting pixels. Inversion turns the red sky cyan.
- Inset close-up: a paper-bordered panel slides in, clipped, over the scene. Iris-out: fill `rect + arc` with `'evenodd'` on a shrinking radius.
- A scarf rope must follow any pose: pin node 0 to `neckOf(pose, …)` in every `step`, and set the wind per shot (upward while falling).
- Neutral vignette `rgba(8,4,6,.12 / .35)`, not the default teal.
