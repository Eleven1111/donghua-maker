# Look: qinglu / 青绿长卷（清明上河图 × 千里江山图）

A long silk handscroll that mixes two Song traditions:
- **Blue-green landscape (千里江山图):** massifs graded from azurite peaks to malachite and an ochre foot, with ink contours, texture strokes, tree dots on the ridges, and mist bands between ranges.
- **Riverside genre scene (清明上河图):** ruled architecture, a timber rainbow bridge, boats, and crowds of tiny figures going about their day.

The scroll opens from the **left** end, where the title inscription and seals sit, and the camera pans **rightward**. The traditional handscroll reads right to left, but the user chose left to right (2026-09-27, rejected the right-to-left version). Everything was studied from public-domain scans, and every element is our own drawing.

Verified in 江山市井图 (`assets/example-qinglu.html`, 16:9, 12 s, 3 shots: 开卷 unroll from the left, 游卷 rightward pan, 桥上 close-up).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look qinglu --bpm 80 --shots "开卷,游卷,桥上" --durs "3,6,3"
python3 scripts/font_embed.py film.html --fonts wenkai    # inscription in brush kai
```

## How it works
- **World:** one wide canvas (the example is 7680 × 1440), baked once in the first shot's `build()`, with mountains, mist, river, canal, houses, trees and the bridge.
- **Life:** a pure function of t drawn on top: street walkers, bridge crossers following the deck curve, boats, travellers on the road.
- **Shots:** each shot only moves the camera over the world. Brocade mounting bands are drawn in screen space on every frame.

| call | what it does |
|---|---|
| `qlSilk(w, h)` | aged silk: warm ground, thread streaks, foxing |
| `qlMountain(g, x, base, w, h, seed, {a, top, mid})`, `qlMound` | blue-green massif / low near-bank mound |
| `qlMist`, `qlWater`, `qlTree`, `qlHut` | mist band; ripple-arc water; willow; thatched hut |
| `qlHouse(g, x, y, w, h, d, {roof, shop})` | oblique ruled house with a tiled hip roof and optional awning |
| `qlBridge(g, x0, x1, deckY, rise)` | rainbow bridge of stacked timber arches; returns `deck(u) → [x, y]` for walkers |
| `qlPerson(g, x, y, s, ph, {robe, load, hat, dir})`, `qlBoat(g, x, y, s, t, {dir, mast})` | tiny walking figure (with a carrying pole); boat with cabin, mast and boatman |
| `qlMount(g)`, `qlInscribe(g, x, y, text, px, {seal})` | brocade bands; vertical title with a two-character seal |

## Rules
- Blue-green only on the land. Buildings and boats are ink over wood and ochre; roofs may take a muted green-grey.
- Never leave a screen-width of bare silk. The eye travels along the scroll, so every stretch needs mounds, huts, a road or boats.
- People are tiny (about 50 px tall at 2560) and numerous. Density carries the 市井 feeling, not detail.
- The roller travels left → right and the pan runs rightward, eased. The last shot pushes in (z about 1.5) on the busiest place.
- Music: a pluck on a pentatonic scale over a low drone, with a street bed.

## Pitfalls met
- The lower right half was empty silk. Near-bank mounds, huts and a road fixed it.
- Radial struts made the bridge look like a rake. Use stacked arches with short ties.
- A moored boat drawn after the bridge sat in front of the arch. Put life that belongs behind the bridge before it, or move it downstream.
