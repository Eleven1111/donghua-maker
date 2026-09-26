# Look: Business / finance whiteboard explainer / 商务财经图解

A calm slide-style explainer that turns a money concept into **meaning blocks**. A quantity is a grid of squares, each colour means something (yours, cost, profit, investor…), and the story is squares changing meaning. It is verified on two topics that share one byte-identical `BIZ-EXPLAINER KIT` block:
- `assets/example-biz-margin.html`: 毛利是怎么来的, 9 s. One grid: 10 revenue blocks, costs grey out 6, and the 4 left turn into gross profit, stamped 毛利率 40%.
- `assets/example-biz-equity.html`: 股权稀释, 8 s. Before → after: 10 blocks all yours; financing adds investor blocks; a red boundary marks your share, stamped 80% × ¥1000万.

The reference was a Japanese LLM explainer, and the grammar is kept. Read `../shot-contract.md` first.

## Screen grammar (keep every piece)
| element | kit fn | rule |
|---|---|---|
| chapter tabs, top right | `tabs(g, labels, active, x, y)` | 3–4 short labels; the active one is filled yellow. It is the viewer's progress bar |
| thesis caption, bottom centre | `caption(g, s, k)` | one sentence per chapter with a circled number (① ② ③). It pops when the text changes |
| guide 案内役, left | `guide(g, x, y, t, {talk, name})` + `say(g, s, x, y, u)` | a small figure in a hard hat and blue coat with a name tag. Its speech box holds one short, human reaction (先看收进来多少 / 原来只剩四成！) and never repeats the caption. It waves while talking |
| meaning blocks | `block(g, x, y, s, kind, k)` + `gridCell(G, i)` | `a` blue = the baseline / yours, `b` grey hatched = taken away (cost, tax), `c` yellow with sparkle = the gain or the other party, `d` green hatched = imagined or estimated, `empty` = dashed. Re-map meanings per topic via `legend()`, but keep the colours consistent within a film |
| sources and labels | `card(g, s, x, y, k)` + `arrow(g, a, b, u)` | a hand-drawn label card that pops, then an arrow drawn on into the blocks it affects |
| boundary | `handPoly(…, {col: C.red, dash, closed, u})` + red label | the red dashed box names the subset the conclusion is about (毛利 / 你的股份 / 制御の範囲) |
| verdict | `stamp(g, s, x, y, u)` | a red hand-drawn ring draws on, then the number lands. It sizes itself to the text. One per film, on the payoff |
| paper and iris | `bakePaper()`, `iris(g, k)` | warm beige with a lit centre; a circular iris opens over 0.6 s and closes over the last 0.5 s |

All lines go through `handPoly` (two passes with fixed per-element jitter), so the slide looks hand-drawn but **holds still**: no line boil. Use the font stack `HF` (Hannotate SC → HanziPen SC → Kaiti SC). These are macOS system fonts; other machines fall back to 楷体 or 苹方.

## Structure
```
BIZ-EXPLAINER KIT   copy verbatim (palette C, pop/seg01/stateAt, hand lines, blocks, cards, arrows,
                    legend, tabs, caption, stamp, guide, say, paper, iris, gridCell)
TOPIC               TABS, grid geometry (G objects), T timing constants, S0 + EVENTS, baseScore, the shot
```
The state model (`stateAt(t, S0, EVENTS)`) holds the chapter, caption and each block's `[kind, changedAt]`. Views read only that state, and `pop(t, changedAt)` animates each change. Tabs, caption and blocks therefore switch together, and a new topic is mostly data.

## Timing (120 bpm)
- One chapter is about 3 s (6 beats): the tab and caption switch on the downbeat, a label card lands 0.25 s later, the arrow draws, then blocks change one per 1/8–1/16 note (0.1–0.125 s) with a note each. The guide reacts on the last beat of the chapter.
- The payoff chapter adds the red boundary (0.3 s draw-on), then the stamp (0.6 s: ring, then text, with a thump and a chord).
- Budget about 2.5–3 s per chapter plus 1 s for the iris; a 3-chapter sample is 8–9 s.

## Sound
Calm and steady: pad chord per bar, bass pluck on beats, soft kick and hats (≥3 layers, per TASTE). Blocks that grow go **up** the scale (music box), blocks taken away go **down** (triangle `chip`), gains get bright high notes. Add a whoosh plus tick on each chapter change, and a rustle, thump and chord on the stamp. With narration, drop the hats and follow SKILL.md §4b.

## New topic checklist
1. Choose one quantity and a unit ("1 格 = 10 元"). Ten blocks (2×5) reads instantly; use 3×3 only for abstract shares.
2. Map 2–4 meanings to block kinds and write the `legend`.
3. Write the chapters as `EVENTS` (caption plus block changes). Each chapter must change blocks visibly; a chapter that only changes text is cut.
4. Decide the payoff subset (the red boundary) and one stamp number.
5. Choose the layout: a single grid (it transforms in place) or before → after (`gridCell` with two G objects and an arrow).
6. Verify stills at every chapter start plus 1 s, at the stamp and on the first frame (iris), check 0 console errors and the `wav()` length, and check that no label overlaps a block or the speech box.
