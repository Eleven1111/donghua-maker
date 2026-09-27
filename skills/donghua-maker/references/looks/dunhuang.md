# Look: dunhuang / 敦煌壁画

A mineral-pigment mural on a warm plaster wall with grime, hairline cracks and flakes that cross the figures. Colour is malachite, azurite, ochre, red-brown line and darkened lead-red. Flying figures (飞天) stream long banded ribbons among scrolling clouds and falling flowers, with decorative frieze bands at top and bottom and a white inscription panel. The construction was studied from public-domain photographs of Mogao murals. Every figure here is our own drawing.

Verified in 飞天 (`assets/example-dunhuang.html`, 16:9, 12 s, 3 shots).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look dunhuang --bpm 80 --shots "…" --durs "4,4,4"
python3 scripts/font_embed.py film.html --fonts notoserif
```

## Toolkit (`toolkit-dunhuang.js`)
| call | what it does |
|---|---|
| `dhWall(seed)`, `dhFlakes(g, seed, n)` | plaster wall; paint-loss flakes drawn **over** the figures |
| `dhCloud(g, x, y, s, col, col2, dir)` | scrolling cloud: a tapering tail and three spiral curls |
| `dhFrieze(g, y, h, flip)` | hanging-triangle drapery band with a gold wave (screen space) |
| `dhFlower`, `dhFlowers(g, st, n, seed)` | falling four-petal flowers, as a pure function of t |
| `dhRibbon`, `dhApsara(g, x, y, s, t, dir, {rib1, rib2, skirt})` | about 900 px flying figure: arched body, S-sweep skirt, two looping ribbons, one arm with a flower |
| `dhPanel(g, x, y, text, px)` | vertical inscription panel |

## Rules
- Figures are large: an apsara spans at least a third of the frame. Small figures read as clip-art.
- Line colour is red-brown (`DH.line`), never black.
- Every shot carries the friezes, clouds, flowers and flakes, so the wall reads as a wall.
- Two figures fly on separate tracks (for example, one high and one low, passing each other), never crossing at the same point.
- Music: pentatonic pluck over a drone.

## Pitfalls met
- Clouds as a blob plus a tail read as tadpoles. They need spiral curls.
- The first apsara was small and stick-like. The redraw works at about 1.35× scale with the skirt and ribbons longer than the body.
