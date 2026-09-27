# Look: seurat / 修拉 · 点彩

The frame is built from small dots of pure pigment that the eye mixes. Each area is split into its nearest palette pigments at the matching ratio. Complementary accents appear: violet or blue in shade, yellow or orange in light. The frame has a dotted border of complementary dots. Figures are stiff geometric profiles. The construction was studied from public-domain pointillist paintings (*A Sunday on La Grande Jatte*). Our scenes and figures are our own.

Verified in 河岸的午后 (`assets/example-seurat.html`, 16:9, 12 s, 3 shots).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look seurat --bpm 90 --shots "…" --durs "4,4,4"
python3 scripts/font_embed.py film.html --fonts notoserif
```

## How it works
- **Background:** `srPaint(sceneFn, {K, seed, spacing, r, mix, border})`. It draws a flat colour map, lays it underneath as the painter's base layer, then covers it with dots, one per jittered grid cell. `srPick` jitters the sampled colour by `mix` and draws one of its two nearest pigments at the ratio that matches best; 8% are complementary accents.
- **Movers:** `srSprite(w, h, drawFn)` bakes the mover's colour map once, and `srDotSprite(g, sp, x, y, e)` re-dots it each exposure. Movers shimmer the way the background does between its K frames.

| call | what it does |
|---|---|
| `SR.pal` | 13 pure pigments (whites, yellows, orange, vermilion, pink, violet, blues, greens, dark) |
| `srFrame(frames, st)` | alternates the baked backgrounds |
| `srLady`, `srGent`, `srDog`, `srSail` | stiff profile colour-map shapes for sprites |

## Rules
- Keep the stop-motion step (12 poses/s). Dots boil per exposure.
- Dot spacing is about 7 px and the radius about 4 px at 2560 wide. Smaller dots vanish at 1080p; larger ones read as mosaic.
- Build light from colour: shadows are violet or blue areas, never black. Late light shifts the whole map to orange and violet (see shot 3).
- Figures are stiff silhouettes in profile, with no outlines.

## Pitfalls met
- Dots on bare paper read as TV noise. Put the colour map underneath first.
- Picking only the nearest pigment gave single-colour fields with no optical mixing. Jitter the colour before picking (`mix` ≈ 70).
