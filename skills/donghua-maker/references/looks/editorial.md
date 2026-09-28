# Look: editorial / 报刊数据图

Newspaper-style data graphics. A warm white page carries a small red kicker, a serif headline with one keyword in red (underlined) and a grey deck line. The chart has hairline axes and light gridlines. One red series carries the story and the comparison series stay grey, with value labels at the line ends. The gap between them fills pale red, with a bracket and a big red delta. Horizontal bars show the key bar in red. A small source note sits at the bottom. Everything draws on in reading order: headline, axes, grey line, red line, annotation.

Verified in 练习数据 (`assets/example-editorial.html`, 16:9, 12 s, 3 shots, 90 bpm). Embed `--fonts notoserif,notosans` (serif headline, sans labels).

## Toolkit (`toolkit-editorial.js`)
| call | what it does |
|---|---|
| `edPage(g)` | the page |
| `edHead(g, x, y, kicker, [[text, isRed]…], deck, k, {size})` | kicker, headline (typed, red keyword underlined), deck |
| `edMap(box, xr, yr)` | data → px mapper for `box = [x, y, w, h]` |
| `edAxes(g, box, xr, yr, xticks, yticks, k, {xfmt, yfmt, ylab})` | gridlines, baseline, tick labels |
| `edLine(g, box, xr, yr, data, k, {col, w, label, dot})` | series drawn left→right; `label(v)` at the end |
| `edGap`, `edNote(g, x, y0, y1, big, note, k, {size})`, `edBars(g, box, rows, max, k, {unit})`, `edSource` | shaded gap, bracket + delta, bars with a highlighted row, source line |

## Rules
- One colour carries the story (red). Everything else is ink, grey or light grey.
- Numbers on screen must be true or clearly labelled. The example uses illustrative data and says so ("示意数据，非真实统计"). Real figures go through the fact-check gate with a source line.
- Check derived numbers: the delta in the note must match the plotted endpoints (here (14.2 − 3.1) / 14.2 ≈ 78%).
- Leave room right of the plot for end labels and the note: plot width is about 55% of the frame.

## Pitfalls met while building it
- With a full-width plot the note ran off the right edge under a camera push. The plot was narrowed to 1400 px and the push reduced to 1.03.
