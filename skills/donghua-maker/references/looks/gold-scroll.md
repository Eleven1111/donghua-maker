# Look: 金屏说史 / gold-scroll history explainer

A fixed **series format** for 60-second history episodes: a gold-leaf folding screen opens and closes each episode, and the story plays on night boards in between. Maps have gold river banks, and the metallic gold serif titles carry the weight; vermilion is kept for the one thing that matters. It was distilled from a reference study of a 60 s Japanese-history short and rebuilt from scratch. The series name, seal and layout are ours.

Verified in 金屏说史 · 第一回 赤壁之战 (`assets/example-gold-scroll-chibi.html`, 16:9, 60 s, 11 shots; facts in `example-gold-scroll-chibi-facts/`).

## Start
```bash
python3 scripts/scaffold.py ep.html --title "金屏说史 · 第N回 …" --format landscape --goldscroll --narrated --bpm 90 \
  --shots "金屏,年份,背景,兵力,对峙,经过,高潮,结局,辨误,影响,片尾" --durs "4,4,6,5,5,5,6,5,7,6,7"
python3 scripts/font_embed.py ep.html --fonts notoserif        # the whole look is one serif: Noto Serif SC, OFL
```
`--goldscroll` pastes `assets/toolkit-goldscroll.js` into the story: `SMOOTH_DEFAULT`, low grain, and every module below. Each episode declares `const SERIES = '金屏说史 · 中国史', EP = '第N回　…';`, which `header()` reads. Keys 1–9 jump only to the first nine shots.

## Series rules (every episode)
- **Grounds**: the gold screen appears only at the open and the end. Every story shot is a night board (charcoal, lit centre) or a night river. Cream parchment is used only for the myth-busting card.
- **Colour**: gold is the hero. Vermilion `GS.red` marks one key thing per shot (the battle on the timeline, the strike-through, a seal). Factions: cool blue `#9fbde0` for one side, warm red `#f08a70` for the other.
- **Type**: Noto Serif SC only.
  - Titles use `goldText` (glow, extrusion, banded gold, top sheen).
  - Subtitles are white 58 px serif with a shadow, on every shot. `SUB_DARK = true` switches them to dark ink on parchment.
  - The header (series and episode) sits top-left on every story shot.
  - Maps carry `schematic()` top-right: 位置·路线为示意.
- **Order of an episode**: title → year and timeline → map context → the numbers → the clash on the map → the scene (silhouettes) → the climax (fire or effects) → the outcome on the map → **辨误** (a popular myth vs the record) → the impact (split versus) → an open question on the end card.
- **Facts**: every subtitle, label and card goes through `fact_check.py`. Show disputed items on screen with a hedge (号称, 约, 或为, 可能, 仍有争议), and quote the source when the wording is a historical quote (`vquote`, or quotation marks in the subtitle).

## Modules (`toolkit-goldscroll.js`)
| module | calls | notes |
|---|---|---|
| gold screen | `goldScreen`, `pineBake`, `riverBake`, `dust` | leaf squares, six panel folds, cloud bands, centre bloom. Share one baked screen between the open and end shots (`SCREEN` in the example). |
| title | `goldText`, `brushBake`/`brushDraw`, `sealBake`, `put` | order: series line → brush swipe → title rises → seal stamps (with a thump) |
| year | `yearRoll`, `timeline` | odometer digits with no glow inside the clip and one soft glow behind. Timeline events are spaced **evenly by order**, not by year, or close years pile up. |
| map | `MAPDATA`, `proj`, `mapLerp`, `mapDraw`, `place`, `card`, `route`, `burst` | Natural Earth rivers and lakes (public domain), clipped per episode and drawn live as vectors: a water body with gold banks. Cards have a round seal character; `route` has `dash` (march) and `glow` (decisive move). |
| night river | `nightRiverBake`, `junk`, `chain`, `reflect` | moonlit horizon haze so silhouettes read; lanterns and their reflections |
| climax | `fire`, `embers`, `smoke`, `wind`, flash + camera shake | fire spreads along a chain (`burn(i)` delayed by distance) |
| quote | `vquote` | vertical quote on the right edge with its source under it |
| 辨误 | `parchmentBake`, `inkText`, `strike`, `sealBake('小说')` | the myth in brush ink → a red strike → a stamp → what the record says, with its source line |
| versus | `generalBake('L'/'R')`, `crack` | two armoured busts, cool and warm side light, a glowing jagged split, the impact title in gold |

## Map data per episode
Clip Natural Earth (`ne_10m_rivers_lake_centerlines`, `ne_10m_lakes`) to the region, simplify with RDP (about 0.01°), and inline it as `MAPDATA` (about 6 KB). Use the modern coordinates of historical sites, and keep 位置·路线为示意 on screen: historical lakes and river courses (云梦泽) differed. Log the download in the episode's sources.

## Pitfalls met while building it
- The glow baked into digit sprites was cut by the odometer clip, which drew a visible box. Put the glow behind the number instead.
- On a dark map, lakes and rivers disappear unless the water is filled blue with gold banks.
- Ships at 0.55 scale read as specks: use about 0.95 and chain them tightly. The night needs moonlit haze behind the silhouettes.
- White subtitles on parchment are invisible; use `SUB_DARK`.
- Wording must follow the source. "曹操再难南下" overclaims (he attacked Ruxu in 213 and 217), so the film says 三国鼎立之势初现, quoting Wikipedia.
- Keep recorded samples (Mixkit and others) out of repo examples. They belong to the user's own project and are listed in its `sources.json`.
