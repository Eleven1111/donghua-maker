# Look: Torn-paper collage / 撕纸拼贴

Torn-paper collage toolkit (copy from `assets/example-torn-paper-night.html`). Read this together with `../shot-contract.md` (the engine API) and `../styles.md` (the one-row recipe).

These are story-level helpers. Copy from `// ── torn-paper toolkit` and `// ── shared puppets and props`.

| fn | use |
|---|---|
| `tornPath(pts, {amp, step, seed})` | a `Path2D` whose edges are subdivided every ~6 px and pushed along the normal by noise, plus an occasional sharp nick (~10% of steps) |
| `tornPiece(g, pts, col, {seed, amp, fringe, grain})` | **the signature look.** First a white fibre layer (`C.fibre`) with a raggier edge (`amp × fringe`, 1.8), then the coloured sheet on top, then `crayon` grain clipped inside. The white shows only where the fibre path pokes out, the way a real torn edge looks |
| `crayon(g, x, y, w, h, col, {n, a, len, lw})` | short waxy strokes a shade lighter and darker than the paper, alpha .12–.16 |
| `sprite(…, g => tornPiece(…), {shadow})` | bake every piece with the engine's `sprite()`, so each gets paper texture and its own drop shadow. The shadows are what make the layers read as stacked paper |
| `eyes(ctx, x, y, gap, r, open)` / `smile(ctx, x, y, w, big)` | draw faces live on top of baked heads: dot eyes with a highlight, closed arcs for sleep, blink or joy, and a small arc or open grin |
| `handText(ctx, txt, x, y, size, col, n)` | handwriting with slight per-character tilt; `n` reveals characters one at a time and it returns the pen x, so a hand-plus-pencil sprite can follow the tip |

Rules learned on 晚安纸条:
- **Cute means round and big enough.** Heads are ellipses with a torn hair piece, a fringe and two blush ovals; eyes and mouth are drawn live. The first cut of the girl was too small and half hidden by the desk. Scale the hero puppet so the face is about a fifth of the frame, and keep props (the lamp) off her silhouette.
- Build a set of about six layers (sky, moon and stars, clouds, hills, houses, foreground hedge) at parallax .6–1.15. The foreground layer must reach the bottom edge, and each layer must overlap the next, or a strip of sky shows between paper pieces. Check the first frame's bottom row.
- **Reuse the set, flip the time of day.** Add a `day` field and a `skyHook` to the first shot's `draw` so later shots can call `S1.draw(ctx, st, 4, e, cam)` for the same town, at night or in the morning, with a new sky object (the sun) slipped in behind the houses.
- Keep the crayon on large light areas faint (a ≈ .06). At .14 the morning sky looked smudged.
- No ambience bed and no scratch sounds here either. Use music box plus soft foley: `tick` for a bonk, `bloom` for joy, a triangle `chip` slide for a yawn, and a soft square `chip` pair for a bark.
