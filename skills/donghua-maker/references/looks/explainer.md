# Look: Hand-drawn science explainer / 手绘科普

Hand-drawn explainer toolkit (copy from `assets/example-earth-explainer.html`). Read this together with `../shot-contract.md` (the engine API) and `../styles.md` (the one-row recipe).

These are story-level helpers, not engine functions. Copy the block that starts at `// ── sketch toolkit`.

| fn | use |
|---|---|
| `sketchPath(g, pts, e, {col, w, amp, closed, seed, passes})` | a polyline redrawn with new jitter every exposure (line boil), plus a thinner second pass for a pencil look |
| `ringPts(cx, cy, r, {over, lump, sy, seed})` | a hand-drawn circle whose ends overshoot instead of closing. `upTo(pts, u)` reveals a path as if being drawn |
| `markerFill(g, clipFn, bbox, col, e, {gap, ang, lw, a})` | loose parallel marker strokes clipped to a shape |
| `label(g, txt, x, y, e, u, {size, col, align})` | handwritten text that pops in with a small overshoot as `u` goes 0→1. Font stack: 行楷 → 楷体 |
| `arrow(g, a, b, e, u, {bend})` | a curved arrow drawn on, whose head appears last |
| `rock(g, x, y, r, e, {col, craters})` | a lumpy filled planet or rock |
| `pageBake()` / `pageDraw()` / `hud(ctx, idx, title, sq, e)` | notebook page, chapter header and timeline ruler |

Rules learned on 地球的诞生:
- `pageDraw` fills the whole frame with paper before drawing the page. Otherwise, when the camera pans or zooms in, the page's edge shows as a black band on the first frame.
- Drive every appearance from `sq`, with `pop(sq, t)` for labels at beat times. Nothing needs `step`.
- Explainer layout: the header sits top-left, about y 150–215. Keep labels below y ≈ 260 and at least 150 px from the right edge. Long lines at 64 px run about 64 px per character, so check the right margin.
- Soften the engine vignette for a paper look: stops `rgba(60,50,30,.05)` and `.16`, not the default dark teal. The default greys the paper.
- The shot-to-shot handoff is an idea, not a prop. End each shot on a hint of the next one (red cracks → magma, a purple planet appearing → impact).
