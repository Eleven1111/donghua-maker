# Look: naturalplate / 博物版画

A numbered natural-history plate: cream paper inside a double ruled frame, with the header above the frame. Specimens are laid out symmetrically around a large central one, in fine sepia lines with pale ochre, sea and rose tints. Each specimen **engraves itself in**: every line is revealed along its length, and the tints fade up under it. Use it for biology, geology and "the geometry of nature". The construction was studied from public-domain 19th-century lithographic plates (Haeckel's *Kunstformen der Natur*, e.g. Phaeodaria). Every drawing is our own.

Verified in 海里的几何 (`assets/example-naturalplate.html`, 16:9, 12 s, 3 shots).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look naturalplate --bpm 90 --shots "图版,…,…" --durs "4,4,4"
python3 scripts/font_embed.py film.html --fonts notoserif
```

## Toolkit (`toolkit-naturalplate.js`)
| call | what it does |
|---|---|
| `npPlate(title)` | paper with a double ruled frame; the header sits above the frame |
| `npLine(g, pts, u, lw, col)` | polyline revealed to fraction u (dash trick) |
| `npRadiolarian(g, x, y, r, u, {spines, rot, len, tint})` | lattice sphere with shaded pores, barbed main spines, a fringe of fine spines |
| `npDiatom(g, x, y, r, u, {n, tint})`, `npStar(g, x, y, r, u, {n, tint})` | n-fold rosette with dotted areolae; n-armed star |
| `npMedusa(g, x, y, r, u, t)` | bell that pulses, ribs, scalloped rim, oral arms, swaying tentacles |
| `npNum`, `npCaption` | plate numerals; the caption at the foot |

## Rules
- Mirror-symmetric layout; the big specimen in the centre; numerals in reading order; every specimen stays inside the frame, spines included.
- Lines are 1–3 px at 2560 wide, in sepia `NP.ink`. Tints are pale and radial, never saturated.
- Engraving order inside a specimen: outline → tint → inner structure → spines. Offsets are set by `s(k)`.
- Captions are one sourced fact each (the example: radiolarians are unicellular, and their skeletons are mostly silica; jellyfish have no centralised brain but a nerve net, hedged because some species have ganglion-like structures). Run them through `fact_check.py`.
- Shots that engrave from nothing open on a nearly blank plate. This is intended: the drawing is the event.

## Pitfalls met
- A header drawn at the frame's y sat on the rule. Keep it above the frame.
- Edge specimens with long spines crossed the frame. Check spine reach: r × (1 + len).
- An inline `//` comment swallowed a `return`. See `looks/ukiyoe.md`.
