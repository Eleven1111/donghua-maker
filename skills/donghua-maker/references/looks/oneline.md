# Look: oneline / 一笔画

Warm off-white paper and one continuous ink line that never lifts. It runs along a baseline and climbs into small drawings (a steaming cup, a sun, a house with a chimney, a mountain range, a heart), then comes back down. A small red dot marks the pen tip. The line swells slightly where it turns, like a brush pen. The camera trails the pen so each drawing stays in view while it forms, and the ending pulls back to show the whole day as one line.

Verified in 一笔一天 (`assets/example-oneline.html`, 16:9, 12 s, 3 shots, 90 bpm).

## Toolkit (`toolkit-oneline.js`)
| call | what it does |
|---|---|
| `OL_MOTIF` | motifs as polylines in a unit box: x 0→1, y 0 = baseline, up is negative; each starts at (0,0) and ends at (1,0) |
| `olBuild(list, x0, y)` | chain `[motif \| 'gap', w, h]` along a baseline, with Catmull-Rom smoothing |
| `olDraw(g, P, s, {w, tip, s0})` | draw the path up to arc length `s`, brush weight on turns, red tip; returns the tip |
| `olAt`, `olSx`, `olLens` | point at arc length, arc length where x is first reached, cumulative lengths |
| `olPaper(g, cam)` | paper laid over the camera's visible area (call after `setCam`) |
| `olCaption` | a quiet serif caption |

## Rules
- The pen moves at constant speed along the path, so the time a motif takes is its length. Pace with gaps, not easing: easing rushed the middle motifs past in a blur.
- The camera trails the pen, averaging a few samples back, with the pen right of centre. Never centre on the tip, or half of every drawing is out of frame while it forms.
- Motifs must survive smoothing. Avoid retracing a segment or doubling back within about 0.05, because Catmull-Rom turns those into beads and loops. Make parallel up and down strokes (steam) at least 0.1 apart.

## Pitfalls met while building it
- The first bird and house motifs retraced themselves and turned into scribbles. They were replaced by a sun loop and a house with a chimney that enters at the left wall and leaves at the right.
