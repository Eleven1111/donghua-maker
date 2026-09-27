# Look: datamin / 数据极简

Black field, white only. Numbers sit on a fixed grid, with barcode bands, hairline rulers and scan lines. Every flicker is a hard cut that lands on a click in the soundtrack. Use it for science, tech, scale and "how fast / how far" topics. The technique was studied from data-driven audiovisual installation art. Nothing here names or copies an artist.

Verified in 光速 (`assets/example-datamin.html`, 16:9, 12 s, 3 shots).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look datamin --bpm 120 --shots "数字,条码,网格" --durs "4,4,4"
python3 scripts/font_embed.py film.html --fonts notosans
```

## Toolkit (`toolkit-datamin.js`)
| call | what it does |
|---|---|
| `dmText(g, s, x, y, px, {align, cell, col, w})` | text on a fixed cell grid, so changing digits never jitter; CJK gets a full-width cell |
| `dmResolve(target, u, f)` | a number whose places lock in left to right while the rest spin |
| `dmColumns(g, x, y, w, h, st, {px, speed, sparse})` | scrolling columns of digits |
| `dmBarcode(g, x, y, w, h, f, {hold, fill, maxW})` | stripes re-dealt every `hold` frames |
| `dmRuler`, `dmScan`, `dmCaption` | hairline ruler with ticks and end labels; a scan line; a dim label with a white value |
| `dmInvert(g, st, t, n)` | full-frame inversion for n frames: at most one per shot (photosensitivity) |
| `dmClicks(t0, t1, every)` | tick events that match the flicker rate |

## Rules
- Colour: white only, as three alphas (`fg`, `mid`, `dim`). No hues, and no gradients except the scan glow.
- Motion: cuts, not fades. Re-deal stripes on a frame count, and put the same count in the score (`dmClicks`).
- Numbers are the hero. Every figure on screen needs a source, so run it through `fact_check.py` (the example's figures: c = 299 792 458 m/s by SI definition; the mean Earth–Moon distance is 384 400 km, about 1.28 s; 1 au takes about 499 s, which is 8 min 19 s).
- Captions are 40–60 px at 2560 wide. At 30 px they are unreadable.

## Pitfalls met
- With a digit-width cell, CJK characters overlapped. `dmText` now gives them a full-width cell.
