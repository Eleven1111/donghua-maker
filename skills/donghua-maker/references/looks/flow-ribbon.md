# Look: flow-ribbon / 流场色带

Thick, flat-coloured ribbons stream along an invisible flow field on warm paper. They never overlap, and they part around calm "eyes" that hold a title or an object. The whole frame keeps moving like weather. The technique was studied from long-form generative flow-field art (published essays on flow fields and non-overlapping curves). The palettes, fields, motion and layout are ours: never name the artist or claim a series in the film or its copy.

Verified in 风的形状 (`assets/example-flow-ribbon.html`, 16:9, 20 s, 4 shots, synth-only audio).

## Start
```bash
python3 scripts/scaffold.py film.html --title "…" --format landscape --flowribbon --bpm 96 --bed field \
  --shots "起风,绕石,旋涡,标题" --durs "5,5,5,5"
python3 scripts/font_embed.py film.html --fonts notoserif   # titles and tags use one serif
```
`--flowribbon` pastes `assets/toolkit-flowribbon.js` into the story. It turns on smooth 60 fps motion (`SMOOTH_DEFAULT`), because stepped poses make the stream stutter, and it sets low grain and a faint warm vignette.

## Recipe per shot
```js
build() {
  this.bg = backdrop(W + 256, H + 144, { grad: [[0, pal.paper[0]], [1, pal.paper[1]]], mottle: .35, seed });
  const f = frField({ seed, base: -.1, amp: 1.5, holes: [hole], vortex });        // the wind
  this.rbs = frFlow(frGrow({ seed, field: f, holes: [hole], pal, tries: 5200, gap: 8 }), { cues, pre: 1.4 });
},
draw(ctx, st) { …backdrop…; frDrawAll(ctx, this.rbs, st); frTitle(…) / frTag(…) }
```
Everything is precomputed in `build()`. A ribbon's position is a pure function of `st`, so seeking and export are exact, and `step`, `reset` and `snap` stay empty.

## Toolkit (`toolkit-flowribbon.js`)
| call | what it does |
|---|---|
| `FR.pal.warm` / `FR.pal.night` | `paper` gradient, `ink` (text), `accent` (tag bar, subtitle), `inks` ([colour, weight] picked by probability) |
| `FR.widths` | six width scales with weights. Ribbons of 70 px and up are the "heroes" that enter on melody notes. |
| `frField({seed, base, amp, scale, holes, vortex})` | an angle field. `base` is the wind direction; `amp` and `scale` set how much the noise turns it. `holes` are ellipses the flow bends round. `vortex {x, y, pull, r}` swirls it round a point. |
| `frGrow({seed, field, holes, pal, tries, gap, minLen, soft, widths})` | places the lanes. Wide lanes go first; a lane stops on collision, on entering a hole, or at a turn tighter than its half-width. Ends may split into a second colour, and `soft` is the share drawn as parallel lines. |
| `frFlow(rbs, {cues, enter, speed, pre})` | motion: body length, speed (wide is slow), re-entry gap, entry time. `cues` puts the heroes on the notes; `pre` is the seconds already flowed when the shot opens. |
| `frDrawAll(ctx, rbs, st)` | draws the frame |
| `frTitle(ctx, hole, st, t, main, sub, pal)` | a title rising into a calm eye |
| `frTag(ctx, x, y, text, pal, st, t)` | a small caption on a paper tag over the ribbons |

## Rules
- **Density**: about half the frame covered (`gap` 8, `tries` about 5200 at 2560 wide). The user found the first dense version (gap 5, about three-quarters coverage) too busy. Twice the gap reads as confetti.
- **`minLen` of about 280 px**: short lanes turn into flying specks once the ribbons move.
- **Motion**: ribbons slide along their own lanes and loop. Never move a lane or morph the field over time, because that breaks the no-overlap guarantee.
- **Cuts**: give every shot after the first a `pre` of about 1.4 s. Otherwise the frame is nearly empty at each cut and reads like a restart.
- **Holes carry the meaning**: put the title, an object (the stone) or a vortex eye in them. Keep text inside a hole or on a `frTag`. Never lay text straight over ribbons.
- **Palette**: at most 9 inks, one paper, one accent. Night shots swap to `FR.pal.night`, and the paper-white ribbon becomes the brightest ink.
- **Sound**: hero ribbons enter on melody notes (`cues`), with a `whoosh` at each shot start and a chord plus `bloom` when the title lands.

## Pitfalls met while building it
- Ribbons folded into zigzags where the field turned sharply near a hole. The fix is to stop a lane when `|Δangle| × w/2 > step × .8`.
- Splicing a story by replacing from `const BEAT` deleted the toolkit, which the scaffold pastes above it. Replace from the first shot instead.
- `frTag` at 46 px was too small at 2560 wide; 60 px reads.
