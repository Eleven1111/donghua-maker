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
