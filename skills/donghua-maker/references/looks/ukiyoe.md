# Look: ukiyoe / 浮世绘

A woodblock-print look. Prussian-blue shades sit flat on cream paper with woodgrain, framed by indigo keylines (never black). Bokashi gradients run in horizontal bands. There are cloud bands, clawed wave foam with white spray, straight-line rain, and a framed vertical title cartouche with a red seal. The construction was studied from public-domain Edo prints (Hokusai's *Great Wave* and *Fine Wind, Clear Morning*; Hiroshige's *Sudden Shower over Shin-Ōhashi*). Our compositions are different: the wave breaks from the right, and the titles are ours.

Verified in 浪里行舟 (`assets/example-ukiyoe.html`, 16:9, 12 s, 3 shots).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look ukiyoe --bpm 90 --shots "远山,大浪,骤雨" --durs "4,4,4"
python3 scripts/font_embed.py film.html --fonts notoserif
```

## Toolkit (`toolkit-ukiyoe.js`)
| call | what it does |
|---|---|
| `ukPaper`, `ukBokashi(g, x, y, w, h, col, {hold, a})` | woodgrain paper; a colour wiped into the paper over a band |
| `ukShape(g, path, fill, {mx, my, key, lw})` | flat fill printed off register, then the keyline |
| `ukCloud`, `ukMountain` | lobed cloud band; a peak with bokashi and a ragged snow cap |
| `ukWave(g, {B, Q, T, C, sweep, F, st})` | base → crest → curl spine. Draws the body with inner stripes, a foam band, fat claw fingers on the outer edge, and falling spray. Animate `sweep`, and lift the wave from its base. |
| `ukSwell(g, y, amp, len, phase, col, {foam})` | rolling sea band with foam dots |
| `ukBoat`, `ukRain(g, st, {n, ang, len})`, `ukCartouche(g, x, y, title, {seal})` | long boat with rowers; straight rain; vertical title box |

## Rules
- Palette: 4–5 blues, cream, one red for the seal, ochre or hull pink for boats and skin. Nothing else.
- Every shape has a keyline in indigo (`UK.key`), with the fill offset by 2–3 px.
- Skies are flat paper with one bokashi band at the top. Rain darkens that band and never covers the whole sky.
- Sound: a koto-like pluck on a miyako-bushi scale (E F A B C), a wave thump when the crest lands, and rustle for rain.

## Pitfalls met
- The normal pointed into the curl, so the claws grew inward and the stripes were clipped away. The outward normal is `[-sin, cos]` of the travel direction.
- Thin claws read as grass. Use a wide root, a sharp tip and asymmetric control points (a hooked finger).
- A bokashi that starts at full colour mid-sky shows a hard line.
- **Inline `//` comments inside a one-line statement swallowed the rest of the line twice** (a claw path, a `return c`). Put comments at the end of a line, after the last statement.
