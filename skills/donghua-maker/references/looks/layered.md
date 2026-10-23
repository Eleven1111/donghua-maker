# Look: layered / 图层卡通讲解

A 2.5D story-explainer look for creators. It uses bold-ink cartoon illustrations cut into named layers (character parts, props, backgrounds), animated like a motion-graphics rig:
- the character breathes, blinks, and swaps mouths and eyes;
- props pop in with an overshoot;
- captions type on, and big words stamp down with a shake;
- gauges swing their needles, piles of tokens grow, and green value pills pop;
- a HUD counter runs through the whole film;
- sunburst rays, sparkles and confetti, glitch cuts between shots, and slow camera pushes.

It was studied from the general grammar of illustrated finance and story explainers. Characters and scenes are our own; never copy a specific channel's character or artwork.

Verified in 十万粉 (`assets/example-layered.html`, 16:9, 12 s, 3 shots, 120 bpm):
- she uploads her first video and the counter starts;
- the traffic gauge swings, likes pile up with 1万/5万/10万 tags, and 爆了！ stamps down;
- a wall of screens, comment bubbles, a fist pump, and 十万粉达成！.

## Signature features
Checked against stills and strips (`review.md` item 8); numbers are the toolkit's defaults.
- Ink with two weights: the silhouette is stroked at `lw × 2` under the fill, so `lw` shows; inner lines are
  `max(2, lw × .35)`, about a third of it. Lashes, brows and strands are tapered strokes (`LY.taper`).
- Cel shading: a second tone where the shape is shifted by its own `dx, dy` (the hero's fist: 18, 10), plus a
  top-left light gradient. Never a flat fill alone.
- Depth in four planes: blurred, darkened ground → sharp character → sharp props → 2D UI on top.
- Pop-ins (`LY.pop`, back-ease c = 2.2) overshoot to 1.15× about halfway and land on a beat; each pile
  item pops in over 0.25 s.
- Stamps slam from 1.8×, dip to about 0.88× and settle, tilted −0.06 rad, shaking sideways up to
  ±10 px as they land, with a `thump`.
- The rig lives in every shot: breathing (body ±1.2 % every 2.4 s), head sway ±0.03 rad, a 0.15 s blink every 3.7 s,
  mouth swaps 8 per second while talking.
- Glitch only at cuts, about 0.15 s each side: 14 slices shifted up to ±130 px plus a 14 px colour offset.

## What it is not
- Not flat motion graphics: a shape without an ink silhouette and a cel shadow is the look's known failure (Pitfalls).
- Not the whiteboard explainers (`explainer`, `biz-*`): no line drawing itself onto paper; the picture is full colour
  and staged in depth from the first frame.
- Not comic pages (`comic`): no panel borders, halftone dots or speech balloons; one stage seen through a moving camera.
- Not a copy of a channel: the grammar is shared, the characters and scenes are ours.

## What may change
| tier | elements | evidence |
|---|---|---|
| safe to change | palette (keep dark ink and two tones), the hero (own `LY.image` layers or a new `LY.bake` rig), props, scenes, format, the HUD counter, gauge and pile (story-dependent) | the elevator film: 9:16, its own passenger rig, no HUD, gauge or pile, approved for render |
| changes the character, try one frame first | blurred backdrops (the elevator film used plain filled grounds instead), glitch cuts, stamp shake, rays and sparkles | they carry the look's energy; dropping several at once leaves a plain cartoon |
| can't change | the depth order (ground → sharp character → sharp props → 2D UI); variable-weight ink with two tones, never flat fill alone; the named-layer rig (breathe, blink, mouth and eye swaps); pop-ins with overshoot landing on the beat | the first placeholder broke the ink rule and was called too rough |

## Two ways to make the pictures
1. **Code-drawn placeholders (default).** Every layer is painted by code (`LY.bake`), so the film works as one HTML file with no assets. The toolkit's placeholder hero, 小林, is fully drawn this way. This is about 70% of the detail of an illustrated original.
2. **Your own images.** Generate the layers yourself (for example with an image model you are licensed to use) and register each one with `LY.image(name, dataURI, { ax, ay })` before the shots run. The animation code does not change, because it only asks for layers by name.

### Asset list for the hero (transparent PNG, one character, same lighting)
| layer | size (px) | anchor (ax, ay) | notes |
|---|---|---|---|
| `hero.body` | 820×600 | 410, 600 (bottom-centre) | shoulders and chest, cropped at the bottom |
| `hero.head` | 640×700 | 320, 660 (chin/neck) | head and hair with **no eyes and no mouth** (they are separate layers) |
| `hero.eyes.open`, `.wide`, `.closed`, `.happy` | 440×190 | 220, 95 | both eyes on one layer; centres 190 px apart; put at head y 345 |
| `hero.mouth.smile`, `.talk`, `.open`, `.o` | 260×180 | 130, 60 | mouth only |
| `hero.arm` | 320×480 | 70, 460 (shoulder) | raised arm with a fist, pivots at the shoulder |

Backgrounds are full-frame (2560×1440, anchor 0, 0). Bake them sharp and blurred (`bgBake` in the example) so they never compete with the hero. Props are anchored at their bottom-centre.

## Toolkit (`toolkit-layered.js`, namespace `LY`, colours `LYC`)
| call | what it does |
|---|---|
| `LY.bake(name, w, h, ax, ay, draw)`, `LY.image(name, uri, { ax, ay })`, `LY.put(g, name, x, y, { s, rot, a })` | layer registry: code placeholder / image / draw at an anchor |
| `LY.ink(g, path, fill, { lw, shade, dx, dy, light, hatch })`, `LY.P(fn)`, `LY.C(points)` | inked shape: thick silhouette, fill, cel shadow, light gradient, hatching, thin inner line |
| `LY.taper(g, pts, w, { prof, col })` | tapered brush stroke (lashes, brows, hair strands, folds) |
| `LY.hero()`, `LY.heroDraw(g, x, y, { t, s, eyes, mouth, talk, look, tilt, arm, bob })` | placeholder hero layers; the rig (breathing, blink every ~3.7 s, talk mouth cycling) |
| `LY.caption(g, str, x, y, k)`, `LY.stamp(g, str, x, y, k, { size, col, bg, rot })` | type-on caption; slam stamp |
| `LY.pill(g, str, x, y, k)`, `LY.gauge(g, x, y, r, v, label, k)`, `LY.pile(g, layer, x, y, n, t)` | value pill; dial 0–10 with a needle; growing pyramid of tokens |
| `LY.hud(g, label, value, { flash })` | running counter plate, top right, in screen space |
| `LY.rays`, `LY.sparkles`, `LY.glitch(g, k, seed)` | sunburst, twinkles, glitch slices (call last, at cuts) |

## Rules
- Every frame has a clear depth order: a blurred and darkened background, then the sharp character, then sharp foreground props (the desk), then 2D UI (pills, stamps, HUD).
- A scene needs at least five detailed props. An empty desk read as rough.
- Ink with variable weight: a thick silhouette, thin inner lines, and tapered strokes for lashes, brows, strands and folds. Use two tones plus a light gradient and highlights, never flat fill alone.
- Faces follow cartoon proportions, and are checked zoomed in before delivery:
  - the eyes sit just under the bangs, about one eye-width apart, and clear of the side hair;
  - the nose is a small tick between the eyes and the mouth;
  - the mouth is no wider than the distance between the inner eye corners;
  - bangs are pointed locks, not a wavy edge.
- The HUD counter carries the story's number and should move in every shot, with a flash on the payoff.
- Glitch only at cuts (about 0.15 s each side); stamps land on a beat with a `thump`.
- The camera never shows past the background: start zoomed pushes at z ≥ 1.01.

## Pitfalls met while building it
- The first placeholder used one line weight and flat fills, and the user called it too rough. The fix was the inking model above, blurred backgrounds, and foreground props.
- In the second face, the eyes were large, low and touching the hair, with a hooked nose between them and a wide smirk. It was rejected, then rebuilt to the proportions above.
- The story-level name `C` clashes with the engine palette; destructure `LY.C` under another name (`CP`).
- Props that stand on the desk need the desk layer to extend above the desk top, or they are cut off.
