# Look: sandart / 沙画

A light table glowing amber under a layer of dark sand. The picture is made by wiping sand away: a fingertip for thin lines, the side of a finger for soft strokes, a palm for clearings. Sand can also be poured back as dark lines on a cleared table, and a palm sweep changes the scene. Edges fray; nothing is crisp. It was studied from published sand-animation performances; the images are our own.

Verified in 沙上月 (`assets/example-sandart.html`, 16:9, 12 s, 3 shots, 90 bpm, fonts `wenkai`).

## Toolkit (`toolkit-sandart.js`)
| call | what it does |
|---|---|
| `saStroke(pts, w, t0, dur, soft)`, `saCurve`, `saCircle` | a wipe stroke that draws on over [t0, t0+dur] |
| `saDraw(g, strokes, t, {clear, sweep, resand})` | light table + sand with the strokes wiped out (several jittered passes, so edges fray), radial palm clearings, a palm sweep from the left |
| `saPour(g, strokes, t)` | dark sand poured onto bright areas (silhouettes on a lit band, birds on a cleared table) |
| `saTip(strokes, t)` + `saHand(g, x, y, r)` | the fingertip position, and a soft hand silhouette following it |

## Rules
- Bright on dark is a wipe; dark on bright is a pour. A boat drawn by wiping onto an already-wiped water band vanishes, so pour it.
- Strokes live in film time, so later shots keep what earlier shots drew.
- End a sweep partway (it stops at x ≈ 1300) so old and new pictures share the frame.

## Pitfalls met while building it
- Clean strokes looked like neon tubes; three jittered passes per width fixed it.
- The first hand read as a bottle; it now has knuckles, a thumb and an extended index finger.
