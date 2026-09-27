# Look: vangogh / 梵高

Short, thick, directional strokes cover the whole frame. Skies turn in vortices, and lights (sun, stars, moon) sit in rings of strokes. Cypresses are flames. Every stroke carries a light ridge and a shadow edge (impasto), with dark broken contours redrawn over the brushwork. Colours come in complementary pairs: blue against chrome yellow, green against orange. The construction was studied from public-domain paintings (*The Starry Night*, *Wheat Field with Cypresses*). Our scenes are our own: don't recreate a known painting's composition.

Verified in 麦浪与星夜 (`assets/example-vangogh.html`, 16:9, 12 s, 3 shots).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look vangogh --bpm 90 --shots "…" --durs "4,4,4"
python3 scripts/font_embed.py film.html --fonts notoserif
```

## How it works
`vgPaint(sceneFn, field, {K, seed, spacing, len, width, after})` works in four steps:
1. It draws a **flat colour map** of the scene.
2. It lays roughly 12 000 strokes on a jittered grid. Each stroke takes its colour from the map, varied in lightness and hue, and its angle from `field(x, y, ph)`.
3. It runs `after(g, k, R)` on top, for contours and window lights.
4. It repeats all of this K times with the field phase shifted.

`vgFrame(frames, st)` then ping-pongs through the K paintings, so the painting breathes. Nothing is painted per frame.

| call | what it does |
|---|---|
| `vgSwirl(x, y, base, vortices, ph)` | base flow plus tangential vortices `{x, y, r, s}`: skies |
| `vgHalo(x, y, cx, cy)` | ring direction around a light |
| `vgSky`, `vgHaloDisc`, `vgHills`, `vgCloud`, `vgCypress`, `vgVillage` | flat colour-map shapes (the strokes add all the texture) |
| `vgContour(g, pts, R)`, `vgCypressInk(g, …)` | broken dark contours and inner flame strokes for `after` |

## Rules
- The field defines the painting. Give every region its own direction: vortices for sky, rings for lights, upward flames for cypresses, diagonal waves for wheat, vertical broken strokes for reflections.
- Colour maps are flat and simple. Detail comes from strokes and contours, never from the map.
- Colour: pair complementaries in every shot, and keep one hot light (sun, moon, windows).
- Memory: K = 3 full frames per shot. Don't raise K on long films.

## Pitfalls met
- Ellipse clouds and a cone cypress looked like clip-art under the strokes. Clouds need clustered lobes; cypresses need lobed flame edges plus dark inner strokes.
- Houses and windows dissolved into the strokes. Redraw roofs and windows in `after`.
