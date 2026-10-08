# Look: opsboard / 控制台大屏

An AI pipeline watched live, in one take. The screen is near-black glass split into hairline panels. On the left, a feed
scrolls past a reading row; tokens get coloured tags as a small cyan reader passes them. Every item read becomes a route
that flies pink across the gap and lands on a fan of ticks (one tick per item), then settles into the colour of the worker
that took it. One card per worker counts what it did. Under them, a decision stream, a big counter, meters, a sparkline,
a dot matrix, a ring and a legend, all driven by the same number. Nothing cuts: the picture lives by many small things
ticking at once, and the end is told by a config window and a centre result card. Terminal (`terminal`) is a single
green screen that types; HUD (`hud`) is sci-fi instruments; this look is the engineering dashboard of a real workflow.

Verified in NIGHT DESK (`assets/example-opsboard.html`, 4:5 `--format feed`, 22 s, one shot): 1,200 trending posts →
rules drop 1,178, a reading model reads 19, a writing model drafts 3, you pick 1. Then the monthly bill at tonight's
rate (¥7.07 × 30 = ¥212), one route changed in `router.yaml`, the bill drops to ¥131, the approval, the result card.

## Toolkit (`toolkit-opsboard.js`)
| call | what it does |
|---|---|
| `obBg(g)`, `obPanel(g, x, y, w, h, title, note)` | glass ground; a hairline panel with a `▪ title` and a right-hand note |
| `obText`, `obRun(g, [[text, colour]…], x, y, size)` | text in the embedded fonts; a coloured run on one baseline |
| `obTag(g, s, x, y, kind, size, k)` | a tagged token: `pink`/`white` filled, `green`/`orange`/`cyan` outlined on a tint; returns `[x after, box]` |
| `obDoc(g, x, y, w, h, {title, note, lines, scroll, tagK})` | the feed: line numbers, `##` heads in pink, pieces `'text'` or `['token', kind]`; `tagK(line)` reveals tags; returns tag boxes |
| `obFan(g, f, ticks, head)`, `obFanPt(f, i, d)` | the arc of ticks (`null` = unread, else a colour) with a white head on the latest; a point on it |
| `obRoute(g, a, b, col, k, alpha, lw)` | a thin S-curve from a to b, grown to `k` with a dot at its tip |
| `obCard(g, x, y, w, h, {col, head, icon, value, who, sub, glow})`, `OB_ICON.knot/ghost/critter` | a worker card; generic icons (no brand marks) |
| `obMeter`, `obSpark`, `obDots`, `obRing`, `obLegend`, `obReader`, `obChip` | meter row, sparkline with dashed mean, dot matrix, tool ring, legend bars, the cyan reader tree, a chip on the fan |

Palette `OB`: ground `#0a0b0d`, panel `#0e1013`, hairline `#24272d`, text `#c8ccd2`, dim `#6c717a`; pink `#ff4f8f` (questions,
in flight), green `#35d39a` (dropped by code), white `#eef0f3` (read by a model), orange `#ff8a5b` (written), yellow
`#f6c94c` (you), cyan `#3fb8ff` (the reader). Keep that meaning fixed through the film: the colours are the legend.

## Build a film in this look
1. **One state function.** `opsState(T)` returns everything the screen shows (pages, decisions, dropped, read, drafts,
   approvals) from one progress value. Never let two panels count on their own: the moment they disagree, the board reads fake.
2. **Items land in crawl order.** Give each tick a rank (`RANK`, a hash sort) and a landing time (`tickTime(k)`); a route
   starts growing 0.4 s before its tick lights. Routes are pink in flight, then the worker's colour, fading to a 0.18 trace.
3. **Things that update often update at a fixed rate**: the decision stream at 12 rows/s, the sparkline at 8 points/s.
   Tied to the raw counter (90 items/s) they change every frame and read as noise.
4. **Tags follow the reader.** The reader walks down the feed at a constant pace and the page starts scrolling softly
   as it nears a fixed row (`scroll = (x + √(x² + 16)) / 2`); `tagK` reveals tags only above it. The feed is a sample
   (one post per 100 read, ids `#0001 … #1101`), so the ids next to the reader match the counter.
5. **End with a sentence, not a stop**: raise the problem before the fix. Here the monthly bill appears first, then a
   `router.yaml` window (modal: the feed dims behind it) strikes one line and retypes it, then the bill rolls ¥212 → ¥131,
   the yellow card fills on approval, and a centre card states the result. Windows and centre cards never overlap, and
   their grounds are opaque (a 94 % ground let the feed's text show through).
6. **Every number agrees with every other**: per-night cost × 30 = the monthly bill, dropped + read + drafted = pages,
   stream timestamps stay inside the run time the panel reports, each answer fits its question (a 1-10 question gets a
   number, a yes/no question 是/否, "which field" a topic from the feed).
7. **Fonts**: `python3 scripts/font_embed.py film.html --fonts jetbrainsmono,notosans`. `obFont` puts every embedded face
   first in order, so Latin and digits come from the mono (counters don't jitter in width) and CJK from Noto Sans SC.
   The mono is Latin-only: font_embed checks it against ASCII and fails if no CJK face follows it.

Sound: a soft `tick` per item, a high `chip` when a model reads, a square `chip` per draft, `click` + `typing` on the
config edit, `success` on approval, one chord on the result.

## Checked on the example
- `qa.py` PASS: deterministic on all three paths, no page errors, no text clues, 0 jumps; move 2.5 %, static 37 % (the
  9 s after the crawl are deliberately calm, like the reference), 15 ms p50 per frame. With route anchors drawn from
  `Math.random()` instead of `hash`, `qa.py` fails with nondeterministic frames at 11.0 s and 22.0 s.
- Independent review (`references/review.md`) of the first full version raised: a monthly cost that contradicted the
  night's cost, a literal "¥212 → ?", decision answers that didn't fit their questions ("紧急度 1-10?" → 否), stream
  topics that weren't the feed's, a stream clock past the run time, post ids that didn't match the counter, the rule card
  showing decisions next to cards counting posts, "你只读了 1 条" against 3 drafts, and the config window overlapping the
  cost card. All fixed. Left as they are: the English panel labels (they are the look), the dense reader tree, a calm
  last 8 s (the board idles; the footer blinks "跑完了，等下一夜").
- `compare.py` against the reference video at 5 s: in the 50 % overlay, panels, fan, cards and bottom strip line up by eye.
- `font_embed.py --check` PASS with both faces; with `--fonts jetbrainsmono` alone it fails ("only Latin faces embedded").

## Pitfalls met
- Ticks filled top to bottom left the lower half of the fan empty for most of the crawl: land them in hashed crawl order.
- Tag boxes are 8 px wider than their text; advance the cursor by that much or neighbouring text runs into the box.
- The reader tree spilled out of the feed on short lines: clip it to the feed panel.
- The feed's `post n / 1200` note first added an offset and overran 1,200.
- Starting the scroll only when the reader hit its row made `qa.py` count 13 jumps (still page, then 5 lines a second at
  once, and a different speed per post): a constant pace with a soft start brought it to 0.

## Still to improve
- Only one shot; a two-act film (crawl, then a second night after the fix) would show the change paying off.
- The reader tree is denser than the reference and covers a line of text for a moment.
- Panel labels are English and small; on a phone they read as texture, not information.
- Chinese lines are wider than English ones, so the feed holds fewer words per line than the reference.
