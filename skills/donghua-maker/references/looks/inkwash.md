# Look: inkwash / 写意水墨（齐白石研究）

Wet ink on xuan paper with most of the sheet left blank. A subject is built from a few sure marks: translucent graded washes with a pooled wet edge, one dark accent, and long single lines. It closes with a kai signature column and a red seal. The construction was studied from reproductions of Qi Baishi's shrimp: pale overlapping body segments, a dark ink "brain" in a translucent head, long whiskers in one stroke, thin arms with heavy pincers. Every drawing and every inscription is our own.

Verified in 清水游虾 (`assets/example-inkwash.html`, 16:9, 12 s, 3 shots).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --look inkwash --bpm 72 --shots "…" --durs "4,4,4"
python3 scripts/font_embed.py film.html --fonts wenkai
```

## Toolkit (`toolkit-inkwash.js`)
| call | what it does |
|---|---|
| `iwPaper(seed)` | xuan paper with faint fibres |
| `iwBlob(g, x, y, rx, ry, rot, tone, seed)` | wet wash: soft inside, darker pooled edge |
| `iwLine(g, pts, w, tone, {taper})`, `iwBand(g, pts, w, tone)` | a single tapered line; a thick wet band |
| `iwShrimp(g, x, y, s, ang, t, id, flick)` | segmented shrimp. It is mirrored when facing left so the belly stays down; `flick` curls the tail for a dart. |
| `iwSign(g, x, y, text, px, seal, a)` | vertical signature with a seal |

## Rules
- Keep blank paper at 60% or more. Three subjects at most.
- Tone hierarchy: pale body washes (.3–.45), one near-black accent per subject (the head), full-black pincers and eyes.
- Motion is dart and glide: a quick tail flick, then drift (`swim()` in the example). Whiskers wave slowly.
- The signature and seal come last, once the subjects settle.

## Pitfalls met
- Round blobs in a chain looked like beads, and thin vertical crescents looked like a comb. Segments must be wide wet blocks laid across the spine, overlapping, each with a dark back-edge stroke.
- Rotating a left-facing shrimp by π put the belly on top. Mirror y when `cos(ang) < 0`.
- Swimming legs drawn inside the body read as scratches. Start them below the belly.
- **Editing a toolkit by splicing between two comment markers deleted code twice**, because the marker text also appeared in the file header. Splice on `function name(`, never on comment text, and syntax-check (`node -e "new Function(src)"`) after every splice.
