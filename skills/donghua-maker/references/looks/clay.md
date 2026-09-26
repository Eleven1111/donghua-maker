# Look: Clay stop-motion / 黏土定格

Clay toolkit (copy from `assets/example-clay-fishing.html`). Read this together with `../shot-contract.md` (the engine API) and `../styles.md` (the one-row recipe).

These are story-level helpers. Copy from `// ── clay toolkit` and `// ── puppets`.

| fn | use |
|---|---|
| `clay(g, path, col, bb, {seed, dents, detail, shine})` | **the signature look.** Fill a silhouette, lay inlaid colour (`detail`: stripes, belly, markings), then a radial volume gradient (light top-left, dark bottom-right), a blurred dark rim, thumb dents (dark and light crescents with faint fingerprint ridges) and a soft blurred highlight |
| `claySprite(w, h, ax, ay, fn)` | `sprite()` with no paper texture, a fat soft contact shadow (blur 22, a .35) and extra padding |
| `squash(ctx, sp, x, y, rot, base, s)` | volume-preserving squash & stretch: `s > 1` tall and thin, `s < 1` short and wide |
| `wob(t, a, f, d)` | damped spring for the settle after an impact (bobber landing, bucket catch, title drop) |
| `clayLine(ctx, pts, w, col)` | rolled clay snake for tails and rods: shadow, dark body, main colour, thin highlight |
| `catDraw` / `rodDraw` / `lineDraw` | reference puppet: baked body + head, live eyes (iris sprite + pupil sprite that look at a target), live mouth and whiskers, expressions `open`, `happy`, `blink`, `wow` |

Rules learned on 小猫钓鱼:
- **Check real anatomy before baking an animal.** The first cat head, made from memory, was an oval with stuck-on ears, eyes high and a muzzle at the edge, and the user rejected it. Photos fixed it:
  - ears on the top corners with pink insides;
  - eyes at mid-height, about one eye-width apart, almond-shaped with an amber iris and a slit pupil;
  - a pale blaze down to a white muzzle with two whisker pads;
  - a small pink nose at about 70% of the head height;
  - a tabby M on the forehead and cheek stripes;
  - a head wider than it is tall.

  A front-facing head on a side-sitting body is normal for clay characters.
- **Head and body are one lump.** A head resting on the top of a round body looked detached (rejected). Broaden the shoulders, then sink the chin about a third of the head height into the body so the head's shadow falls on the chest. A contrasting collar or ruff over the seam reads as a clown collar; don't use one.
- Keep the water in two layers: the opaque slab behind, and a translucent front copy (`put(…, {alpha: .5})`, not `ctx.globalAlpha`, which `put` overwrites). That way a fish under the surface shows through.
- Keep camera views inside the backdrop: at z ≈ 1.4 the view is ±915 px wide, so check the frame edges for black.
- Sound: music box plus physical foley. Use `thump` for landings, `creak` for the bending rod, `rustle` for splashes, `pluck` for the line, and `whoosh` for the cast and the leap. No ambience bed.
