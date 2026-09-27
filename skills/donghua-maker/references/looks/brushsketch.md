# Look: brushsketch / 简笔漫画

Tapered ink brush lines on rice paper, with lots of empty space. People are simple, and **their faces are left blank**: posture carries the feeling. Pale colour washes sit slightly off the line. A short vertical inscription in brush kai closes the image, with a small red seal. The look keeps the 12-poses-per-second boil. The construction was studied from Republican-era Chinese brush manhua (丰子恺's work is the best-known example). Every drawing and every inscription is our own: never copy a known picture or its title poem.

Verified in 放风筝 (`assets/example-brushsketch.html`, 16:9, 12 s, 3 shots). Reference note: no public-domain scans could be fetched while this was built (Commons rate limit). The rules come from prior knowledge of the genre, so they are UNVERIFIED against specific prints.

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look brushsketch --bpm 90 --shots "…" --durs "4,4,4"
python3 scripts/font_embed.py film.html --fonts wenkai     # inscriptions in LXGW WenKai
```

## Toolkit (`toolkit-brushsketch.js`)
| call | what it does |
|---|---|
| `bsPaper(seed)` | rice paper with fibres |
| `bsStroke(g, pts, w, id, e, {head, tail, press, dry, boil})` | one brush stroke through the points: swells in the middle, tapers at both ends, dry-brush break near the tail; `id` plus the exposure `e` makes it boil |
| `bsWash(g, path, col, {a, dx, dy, blur})` | multiply wash, printed off register |
| `bsChild(g, x, y, s, pose, id, e)` | child figure, feet at (x, y). Pose: `walk` phase, `armL`/`armR`, `look`, `coat`, `bun`. Returns the hand positions. |
| `bsWillow`, `bsMoon`, `bsGround` | drooping willow that sways; crescent moon; broken ground line |
| `bsInscribe(g, lines, x, y, px, {seal, a})` | vertical columns, right to left, with a seal under the last column |

## Rules
- Leave at least half the frame empty paper. Draw one scene per shot with a few elements.
- Lines are never closed shapes of even width. The ground is suggested, never ruled.
- Washes are pale (alpha .35–.75), flat, and off register. Use ochre, pale blue, pale green, pale red.
- Inscriptions are short and plain-spoken (4–6 characters per column); the last shot carries the seal.
- Draw with `sq` (quantised time) and `e`, so the frame looks re-drawn 12 times a second.

## Pitfalls met
- A willow with vertical strands read as a broom. Branches must arch out from the crown, then hang.
- One tapered stroke read as a bracket, not a moon. Use `bsMoon` (a crescent wash plus an edge stroke).
- A flat-coloured rect with blur left a hard edge. Grade dusk skies with a linear gradient.
