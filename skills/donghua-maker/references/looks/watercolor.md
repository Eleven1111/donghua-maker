# Look: Watercolour wash / 水彩晕染

Watercolour toolkit (copy from `assets/example-spring-rain.html`). Read this together with `../shot-contract.md` (the engine API) and `../styles.md` (the one-row recipe).

These are story-level helpers. Copy from `// ── watercolour toolkit`.

| fn | use |
|---|---|
| `wash(g, cx, cy, rx, ry, col, {seed, a, edge, gran, blooms, amp, rect, soft, ridge})` | **the signature look.** It works in five steps:<br>1. One fill (a ≈ .35–.5).<br>2. Uneven pigment inside: blurred darker pools and paper-coloured pale patches.<br>3. Granulation stipple.<br>4. Small backruns: pale cauliflowers with a dark rim.<br>5. A thin blurred tide line where the wet edge dried.<br>Options: `soft` px = wet-in-wet, with a blurred silhouette and no tide line (clouds, warm sky); `rect` = a torn-edged rectangle (sky, pond); `ridge` = a polyline top edge (mountains). |
| `wcSprite(w, h, fn)` | `sprite()` with no paper texture and no shadow, anchored at its centre |
| `paint(ctx, sp, x, y, {u, alpha, rot, sc, seed})` | lays a baked wash with `multiply`, so colours glaze. `u < 1` = still spreading from its centre inside a noisy growing blob, with a faint wet front |
| `rain(ctx, t, k, e)` / `wcRipple(ctx, x, y, u, s)` | multiply rain streaks and fading ring ripples in wet brush strokes |

Rules learned on 春雨:
- **Don't build a wash from many stacked blobs.** The first version layered 8 slightly smaller blobs, and they read as concentric rings, like tree rings. Use one fill and put the variation inside it.
- Keep backruns small (≈10–20% of the wash). Large ones read as holes. Large fields (pond, sky) get `rect` with no backruns, or the edge of the ellipse shows when the camera moves.
- **A character must not share a hue and value with what it sits on.** A green frog on a green leaf looked like a double image (rejected). Make the leaves a cool dark teal and the frog a warm yellow-green, and leave a sliver of unpainted paper around the character: a white `brightness(0) invert(1)` copy under it, solid inside and blurred at the edge. Check that the silhouette survives a greyscale screenshot.
- **Keep a moving character's whole path clear of focal props.** The frog's hop crossed the lotus stem and flower (rejected). Put props away from the start, the arc and the landing.
- Lock the camera so the view never passes the page bottom: `y + H / (2z) ≤ H`.
- Baking many large washes takes a few seconds at boot. Screenshot scripts must wait for `window.__film`, not a fixed timeout.
- Sound: a soft music box, rain as many quiet random `tick`s, `bloom` for washes blooming, and a square `chip` slide for the frog's croak. The mix sits quieter (mean ≈ -25 dB); that is fine for this mood.
