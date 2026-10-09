# Style library — formats, looks, palettes, rhythm, music

Pick one row from each section (or blend two) to turn a theme into concrete parameters. These are starting points: when the user names a mood, a reference, or colours, derive new values in the same spirit rather than forcing a preset.

## Contents
1. Formats & composition
2. Visual looks (texture recipes)
3. Palettes
4. Rhythm (pose rate, pacing)
5. Music (scale, tempo, voices)
6. Prop & puppet ideas by theme

## 1. Formats & composition

| format | px | use | composition notes |
|---|---|---|---|
| landscape 16:9 | 2560×1440 | Bilibili, YouTube, desktop | action travels left→right; wide parallax skies |
| portrait 9:16 | 1440×2560 | Douyin, Reels, Shorts, WeChat Channels | action travels **vertically** (rise/fall, climb, drop); stack foreground/midground/sky; keep faces and key action inside the middle 60% — top ~12% and bottom ~20% get covered by platform UI; camera moves mostly on y |
| square 1:1 | 1440×1440 | feeds, WeChat moments | centred, symmetric staging; circular motion reads well |
| feed 4:5 | 1440×1800 | Xiaohongshu, Instagram feed | like portrait but less extreme; one hero per shot |

For portrait, flip coordinate thinking: a hill is a strip at the bottom, the sky is two thirds of the frame, a rope hangs vertically, a falling object is a whole shot. Backdrops still use `W + 256, H + 144`.

## 2. Visual looks

All looks are layers over the same engine; change the texture recipe, not the architecture.

| look | recipe |
|---|---|
| **Paper cut-out** (default) | `cutPath` edges amp 1–1.5, `paperize` .45, soft drop shadows, hatch .1–.15, grain .6 |
| **Linocut / woodblock print** | hard shadows (blur 2–4), heavy `hatch` gap 3–4 a .3–.4 in ink, 2–3 colour palette, `cutPath` amp 2.5, strong `scratches` |
| **Risograph** | 2–3 spot colours drawn with `globalCompositeOperation='multiply'`, misregister each colour layer by `boil(id,e,2)`, big `stipple` halftone dots, no shadows |
| **Watercolour / 水彩** | One `wash` per shape: a single fill with uneven pigment inside, granulation, small backruns and a dried tide line; wet-in-wet `soft` washes for clouds and sky; everything laid with `multiply` and revealed by `paint(…, {u})` spreading from the centre. Cream paper, cool teal/indigo rain palette warming to peach. Leave a paper halo around characters and keep them off same-hue backgrounds. Verified in 春雨 (`assets/example-spring-rain.html`, `looks/watercolor.md`). |
| **Ink wash / 水墨** | palette of 4 greys + 1 cinnabar red seal colour; `curvePath` strokes with varying lineWidth, fbm-driven mist bands as wide low-alpha strokes; lots of empty paper |
| **Chalk / blackboard** | ground #1f2b27, strokes in cream at alpha .8 with `hatch` wob 3 inside shapes instead of fills, dust stipple heavy |
| **Pixel art / cosy farm-sim** (engine pixel mode, `--pixel 8`) | Draw on a 320×180 buffer (portrait 180×320) in whole pixels; it's scaled ×8 nearest-neighbour, with no grain, flicker or vignette. Build sprites as ASCII art with `pxArt` and outline them in a dark warm brown. Give sprites 2–3 pose frames (stand / run / peck) switched by `e`. Time of day works as **stepped** palette swaps (4 baked skies switching on the beat) plus a stepped `multiply` darkening layer; draw lights (windows, lamps) after the dark layer so they glow. Pan the camera only, snapped to whole pixels. Use the `chip` triangle voice for melody and the square voice for calls. Verified in a full film: 农场的一天 (`assets/example-pixel-farm.html`). Show characters at 2× (`px2`) with the horizon at about y 88; see shot-contract `looks/pixel.md`. Keep characters, maps and music original; the look evokes the farm-sim genre without copying any game's assets. |
| **Pixel diagram / retro neural-net** (`--pixel 4`) | Draw a technical diagram on pure black on a 640×360 buffer with a fixed camera. Correct data flow is cold blue and errors and backprop are red/magenta; lines are 1 px, nodes are round, and all text uses the 3×5 pixel font. Motion is waves of lit edges and analytic particles; the story is a wrong prediction, then backprop, then the right one, told with status and LOSS text. Sound is `chip` notes on every layer the wave reaches. Verified in a full film: 像素神经网络 (`assets/example-pixel-neural.html`); see `looks/pixel.md` (§ Pixel diagram). |
| **Hand-drawn science explainer / 手绘科普** | Notebook page: paper #f6f1e5, a light grid every 72 px, a red margin line, faint stipple. Ink lines are redrawn each exposure with jitter (`sketchPath` amp 2–3, 2 passes). Loose `markerFill` strokes, about 70% alpha, never solid. Handwritten Chinese labels plus curved arrows pop in on beats. A chapter header top-left and a timeline or progress ruler along the bottom. Light vignette. Diagrams over scenery: cross-sections, stages drawn left→right, before/after. Verified in 地球的诞生 (`assets/example-earth-explainer.html`, `looks/explainer.md`). |
| **Torn-paper collage / 撕纸拼贴 (children's picture book)** | Every shape is a `tornPiece`: coloured paper on a raggier white fibre layer, crayon grain inside, its own soft drop shadow, and a little boil (amt .5–.8) so pieces sit hand-placed. Round, simple characters: dot eyes, blush ovals, arc smiles, a flower-shaped sun with a face. Night palette of deep-blue paper, a cream moon, star stickers and yellow window squares; morning is a pastel blue-to-peach sky. Handwritten text that writes itself, and paper planes on dashed paths. Six or more parallax layers stacked like cut paper. Square 1440² suits it. Verified in 晚安纸条 (`assets/example-torn-paper-night.html`, `looks/torn-paper.md`). |
| **Shadow puppet / 皮影戏** | Amber translucent hide lit from behind: painted red/green/blue/black regions, carved lace (冰裂纹, 鱼鳞, 连珠, 海水纹) cut through so the lamp shows, a soft blurred double on the screen, a cloth screen with a flickering oil lamp. Traditional construction: small hollow face (空脸, 通天鼻) under a big headdress, broad chest, flared robe, one-piece legs; jointed with `rigPose`, no rods in frame. Portrait suits the vertical confrontations of myths. Verified in 射日 (`assets/example-shadow-archer.html`, `looks/shadow-puppet.md`). |
| **American comic / 美漫** (classic ink or modern indie) | Solid spot blacks for figures and cities. Tapered brush strokes (`inkStroke`), never uniform lines. Ben-Day halftone for gradients. Hatching on lit surfaces. One accent colour plus a yellow for captions and sound effects. A panel frame with a paper gutter. Flat colour plus an ink outline for secondary characters. Beats: flash-invert lightning, focus lines on shock, burst plus a lettered sound effect on impacts, inset close-up panels, a title slam, iris-out. Camera shake 10–16 px for 0.2–0.3 s on hits. Verified in 夜巡 (`assets/example-comic-night-watch.html`, `looks/comic.md`). Keep heroes original, with no Marvel or DC characters, logos or costumes. |
| **Cute software demo / 可爱软件演示** (kawaii flat, meta UI) | Warm paper #f5f1e8, one warm-dark hairline for every outline, pastel UI accents and no grain (`FLAT`, `EXPO 2`). A small flat brick-red block mascot with tall oval eyes and hose arms operates the product's real UI. One state model (`stateAt` + EVENTS) drives every view, so each cut, press or typed key changes the product on the frame the hand lands. Comic bubbles and SFX lettering, camera push-ins on the action, and BGM that pauses when the product's playback pauses. Verified on a video editor and a dashboard (`assets/example-ui-demo-editor.html`, `assets/example-ui-demo-dashboard.html`, `looks/ui-demo.md`). |
| **Business / finance explainer / 商务财经图解** | Warm beige paper with a lit centre, static two-pass hand lines, handwriting font. A concept is shown as **meaning blocks**: a 2×5 grid whose squares change colour (blue = baseline, grey hatched = taken away, yellow with sparkle = gain or other party, green hatched = estimated). Chapter tabs top right, a numbered thesis caption at the bottom, a small hard-hat guide at the left with short reactions, label cards with drawn arrows, a red dashed boundary on the payoff subset, a red circled stamp for the number, and an iris open and close. A state model drives tabs, caption and blocks together. Verified on two topics (`assets/example-biz-margin.html`, `assets/example-biz-equity.html`, `looks/biz-explainer.md`). |
| **3D clay / 3D 黏土定格** (three.js, `--look clay3d`) | WebGL tabletop set: lumpy hand-pressed solids sharing one clay normal map (thumb dents, fingerprint ridges, tool drags), sheen, warm soft key with PCF soft shadows, cool rim, ACES; puppets at 12 poses/s with per-exposure boil, camera smooth; bright pastel pond palette (orange cat, blue water, green hills, cream clouds). Verified in 小猫钓鱼 (`assets/example-clay3d.html`, `looks/clay3d.md`). |
| **3D voxel / 3D 体素** (three.js, `--look voxel`) | Floating voxel island diorama: instanced cubes with colour jitter, soft sun shadows, a long lens and tilt-shift blur bands so it reads as a miniature, one `daylight()` curve from dawn to night with emissive windows and fireflies; smooth motion. Verified in 农场的一天 (`assets/example-voxel.html`, `looks/voxel.md`). |
| **金屏说史 / gold-scroll history series** (`--goldscroll`) | Gold-leaf folding screen open and end card; night boards in between. Metallic gold serif titles (glow, extrusion, banded gradient), vermilion only for the key thing, one serif (Noto Serif SC). Modules: odometer year + evenly spaced timeline, vector river map (Natural Earth) with seal cards and glowing routes, moonlit night-river silhouettes, fire climax, vertical source quotes, parchment myth-buster with red strike, cool/warm versus split. 60 s, 11 shots, subtitles on every shot, disputed facts hedged on screen. Verified in 赤壁之战 (`assets/example-gold-scroll-chibi.html`, `looks/gold-scroll.md`). |
| **谐波运动 / harmonic motion** (`--look harmonic`) | Glowing points on circles at integer ratios on a dark field: circle→sine projection, Lissajous 3:2, dot fields that fold into m-armed figures as θ sweeps 2π/m; trails sampled from pure functions; the score plays the same ratios. Maths and music intervals. Verified in 圆与波 (`assets/example-harmonic.html`, `looks/harmonic.md`). |
| **浮世绘 / ukiyo-e woodblock** (`--look ukiyoe`) | Prussian-blue flat fills with indigo keylines printed off register on woodgrain paper, bokashi bands, lobed cloud bands, a curling wave with claw foam and spray, straight-line rain, a vertical title cartouche. History, travel, weather, sea. Verified in 浪里行舟 (`assets/example-ukiyoe.html`, `looks/ukiyoe.md`). |
| **博物版画 / natural-history plate** (`--look naturalplate`) | A numbered plate in a ruled frame: sepia fine lines, pale radial tints, symmetric specimens (radiolarian, diatom, star, medusa) that engrave themselves in, numerals and one sourced caption. Biology and the geometry of nature. Verified in 海里的几何 (`assets/example-naturalplate.html`, `looks/naturalplate.md`). |
| **青绿长卷 / blue-green handscroll** (`--look qinglu`) | A long silk handscroll mixing 千里江山图 blue-green massifs (azurite→malachite→ochre, mist bands) with a 清明上河图 riverside town (ruled houses, rainbow bridge, boats, crowds of tiny figures); unroll from the left, pan rightward, push in on the bridge. Verified in 江山市井图 (`assets/example-qinglu.html`, `looks/qinglu.md`). |
| **长卷穿越 / long scroll** (`--scroll paper,inkwash,…`) | a format, not a palette: several looks laid end to end along one horizontal scroll, a hero walking through them, clipped at each seam and redrawn in each world's material; forward-only camera, seams on the beat grid (`looks/scroll.md`) |
| **写意水墨 / ink wash (Qi Baishi study)** (`--look inkwash`) | Wet translucent ink on xuan paper, most of the sheet blank: pooled-edge washes, one dark accent, single long lines; a shrimp generator (overlapping segment blocks, dark head ink, whiskers, heavy pincers); kai signature and red seal. Verified in 清水游虾 (`assets/example-inkwash.html`, `looks/inkwash.md`). |
| **等距几何 / isometric blocks** (`--look isometric`, three.js) | Real 3D diorama through an orthographic camera at the true isometric angle: soft-edged pastel blocks on a pale ground, one key light for the three tones, soft contact shadows; rooms assemble prop by prop with pin labels, cities rise in set-back tiers and repaint in diagonal waves; the camera may orbit about ±40°. Verified in 积木城 (`assets/example-isometric.html`, `looks/isometric.md`). |
| **黑板粉笔 / Chalkboard** (`--look chalkboard`) | Dark green slate with old eraser smears and a wooden ledge; chalk lines and handwriting write themselves on, broken by the slate tooth; coloured chalk for emphasis; a felt eraser wipes and the answer is chalked in and circled. Verified in 黑板课 (`assets/example-chalkboard.html`, `looks/chalkboard.md`). |
| **工程蓝图 / Blueprint** (`--look blueprint`) | Cyanotype-blue sheet with fine and coarse grids, border frame and title block; thin white lines drawn on (construction → outline → hidden/centre lines); dimension lines with arrowheads; 45° section hatching; the object can come alive at the end. Verified in 台灯设计图 (`assets/example-blueprint.html`, `looks/blueprint.md`). |
| **一笔画 / One-line drawing** (`--look oneline`) | Warm off-white paper; ONE continuous ink line that runs along a baseline and loops up into drawings (cup, sun, house, mountains, heart) and back down; red pen tip; camera trails the pen; a pull-back reveals the whole line. Verified in 一笔一天 (`assets/example-oneline.html`, `looks/oneline.md`). |
| **铅笔素描 / Pencil sketch** (`--look pencil`) | Toothed off-white paper; construction lines and ellipse first, then a corrected double contour, directional hatching that models light (darker away from it), cross-hatching in the core shadow, smudged cast shadow, eraser highlight; graphite breaks on the tooth. Verified in 苹果写生 (`assets/example-pencil.html`, `looks/pencil.md`). |
| **16mm 老纪录片 / 16 mm documentary** (`--look film16`) | Black-and-white 16 mm: countdown leader with sweep, ornamental serif intertitle cards, spot-lit subject on dark ground; worn print — heavy grain, gate weave, flicker, scratches, dust and hairs at 24 fps, burned vignette; typewriter captions. Verified in 守灯人 (`assets/example-film16.html`, `looks/film16.md`). |
| **科幻界面 / Sci-fi HUD** (`--look hud`) | Deep navy glass with a dot grid; hairline cyan instruments — corner brackets, counter-rotating tick rings, arc gauges with big readouts, radar sweep with blips, symmetric waveform bars, tiny letter-spaced labels, rolling numbers; amber for alerts and locks. Verified in 对接 (`assets/example-hud.html`, `looks/hud.md`). |
| **控制台大屏 / Ops board** (`--look opsboard`) | An AI pipeline watched live in one take: near-black glass split into hairline panels, JetBrains Mono + Noto Sans SC; a feed whose tokens get pink/green/white/orange tags as a cyan reader passes; routes flying pink across a fan of ticks (one per item) and settling into the colour of the worker that took it; one card per worker with a running count; a decision stream, a big counter, meters, sparkline, dot matrix and legend all driven by one number; a config window and a result card to close. Verified in NIGHT DESK (`assets/example-opsboard.html`, `looks/opsboard.md`). |
| **动态字体 / Kinetic typography** (`--look kinetic`) | Type is the only actor: warm grey paper under a soft spotlight; small italic serif lead-ins against huge heavy sans words that slam in on the beat; walls of a repeated phrase scrolling in alternating rows; one red full stop as the only colour. Verified in 开口 (`assets/example-kinetic.html`, `looks/kinetic.md`). |
| **扁平科普 / Flat science explainer** (`--look flatsci`, three.js) | Flat science explainer in real 3D: indigo-violet space, twinkling star layers, nebula glows; two-tone toon planets with a real terminator, violet shadow side, flat continents, cloud pills, cyan atmosphere rim; glowing sun; dashed orbits; bold rounded white captions over the frame; moon phases lit, not painted. Verified in 月亮为什么会变 (`assets/example-flatsci.html`, `looks/flatsci.md`). |
| **报刊数据图 / Editorial data graphics** (`--look editorial`) | Newspaper data graphics: warm white page, small red kicker, serif headline with one red keyword, grey deck; hairline axes; one red series against grey ones with end labels; shaded gap and a big red delta; horizontal bars with the key bar in red; source note. Verified in 练习数据 (`assets/example-editorial.html`, `looks/editorial.md`). |
| **图层卡通讲解 / Layered cartoon explainer** (`--look layered`) | 2.5D story explainer: bold-ink cartoon layers (thick silhouette, thin tapered inner lines, cel shadow + light gradient + hatching), blurred dark backgrounds with sharp foreground props, a hero rig (breath, blink, mouth swaps), a running HUD counter, gauges, growing piles, green value pills, stamped captions, sunburst rays, glitch cuts; every layer swappable for your own images by name. Verified in 十万粉 (`assets/example-layered.html`, `looks/layered.md`). |
| **Night / lantern** | dark backdrop dark .5, radial glow sprites with `globalCompositeOperation='lighter'`, warm accent only on light sources |

## 3. Palettes

Name every colour in `Object.assign(C, {...})` so shared puppets inherit them. Rule of thumb: one warm accent for the hero, a cool family for the world, one paper-cream for highlights, one near-black ink.

| palette | ground / world | hero accent | highlight | ink |
|---|---|---|---|---|
| Teal & vermilion (Steam Song / Red Kite) | #467f85 #2f6369 #17404c | #cf4b40 | #e4dbc4 | #15191b |
| Spring pastel | #a9c9b5 #88b09a #5d8a72 | #e98f8a | #f5eedd | #2d3a33 |
| Autumn harvest | #8a5a3c #b7793f #5a3b28 | #d9a23c | #f1e4c8 | #231a15 |
| Winter blue | #9fb6c7 #6f8ea6 #3d5a73 | #c8453b | #f4f1ea | #182430 |
| Chinese New Year | #7a1f1f #a8322b #3b1414 | #e6b646 | #f3e3c0 | #1a0f0c |
| Midnight lantern | #0f1c2b #1b2d42 #2a4460 | #f0a64a | #f7e3b8 | #070b10 |
| Ink wash | #e9e4d6 #bdb6a6 #7d776c | #b83a2e | #f5f1e7 | #1c1b19 |
| Farm morning (pixel) | grass #5c9e48 #79b85a #467f3a, sky steps #2b2552→#5b8fd6 | roof #b04640, window #ffd764 | #f7f3ea | outline #3b2a22 |
| Neural diagram (pixel) | bg #030408, grid #0a0f1e, edges #0b1636 #122458, node #081230/#1d3a8a | blue #3fa9ff core #bfe6ff halo #0f3a7a | digit #f4f6ff | error #ff2a4a / #ff3fa4 |
| Cute software demo | paper #f5f1e8, panel #fbf8f2, lane #efe9dd, line #4a4340 / #9a918a | mascot #d9593f edge #8f3a2a | tab #f4cf63, lavender #dcd6f5, mint #6cc7b7 | playhead #e0504a, SFX #ffd23f on #3a2f2c |
| Business explainer | paper #efe8da lit #f7f2e8 edge #d9cfbc, pen #3a3a3a / #8a857c | blocks blue #8fb4ea, gain #f2c14e | tab #f2c14e, green #bcd9a8, grey #cfc8bb | boundary + stamp red #d9463b, guide coat #3d6fb6 |
| Explainer notebook | paper #f6f1e5, grid #dbe4ea, ink #2b2a33, pencil #8d8b96 | marker orange #f08a3c / blue #4a8fd6 / red #d9463b | sun #f6c945 | margin #e9a5a0 |
| Paper night / picture book | night #1c2656 → #2d3d7c, hills #24336b, hedge #1f4a3c; houses #b85c4a #2f6f73 #c9922e #6d5a9e #3f6fa0 #a8474f #4f8a5a | window #ffd65c, sun petals #f59a3c / #f7b54a, face #ffd23f | fibre edge #fbf5e6, moon #f7e7a6 | text #3a3a6a |
| Comic noir | red #c8142b, deep red #7d0b1b, near-black red #3a0710 | red scarf / chest mark | caption yellow #f7d23e, moon #f6e6ae | ink #0d0b0c, paper gutter #f3ead6 |
| Candy riso | #f7d9d0 #6dc5c1 #f3b33d | #e5486b | #fff8ef | #2b2238 |

Check contrast of the hero accent against the world: it should be the single most saturated thing in every frame.

## 4. Rhythm

| feel | EXPO (frames per pose) | poses/s | notes |
|---|---|---|---|
| handmade, twitchy | 5 | 12 | default; "on twos" |
| lazy, dreamy | 6–8 | 10–7.5 | lengthen shots, lower boil amt |
| snappy, comic | 3–4 | 20–15 | bigger boil, squash on landings |
| smooth hybrid | 1 | 60 | only the camera + boil give texture |

Pacing: one clear cause→effect beat per shot. Choose shot count and total length from the theme (see the table in SKILL.md §1). Shots can have different lengths: short for setup and action, longer for the payoff. Every shot hands a prop, a motion or a sound to the next one (a note, a gust, a falling thing). Put the payoff (catch, landing, bloom) around 55–65% of the shot so there is settle time before the cut. Last shot ends with a hold + fade (`smooth(dur-.45, dur, st)` dark overlay).

## 5. Music

Tempo ties picture to sound. Pick the bpm from the mood first, then set shot lengths in whole beats or eighths of that tempo: at 96 bpm a beat is 0.625 s, so shots of 4, 6 or 8 beats last 2.5, 3.75 or 5 s. With equal one-bar shots, `bpm = 240 / shotSeconds` still holds (2.5 s shots → 96 bpm). Every melody note should also be a visual event (a bloom, a bird taking off, a bow tied).

| mood | scale / key | voice | beds |
|---|---|---|---|
| cosy, domestic | G or D major pentatonic | music box `mb` | room |
| outdoors, breezy | D major, lydian touches (G#) | music box + `pluck` accents | field / street |
| melancholy | A natural minor / D dorian | slow `mb` with low `chord` | room, low levels |
| Chinese / 中国风 | pentatonic gong/zhi mode (C D E G A) | `pluck` as guzheng (f 200–800 Hz, dur 2.5, bend already built in) | field |
| festive | C major, fast 120–132 bpm | `mb` + `chord` every bar + `tick` on offbeats | street |
| explainer with narration | D major, 120 bpm (shots in whole seconds keep `DUR×60` integral) | `mb` at v ≈ .5 on label beats, a `chord` on each reveal, MiniMax voice on top (SKILL §4b) | **none**: no `bed`, no pencil scratches |
| picture-book lullaby | G / C major, 120 bpm felt as slow quarters | `mb` melody at v ≈ .55–.7; a very soft high `mb` for each window lighting up or each handwritten character; `chord` on scene changes | **none** (no bed, no scratches) |
| comic action | D minor, 120 bpm | square `chip` stabs (triads) on hits, a descending square run for falls, a rising arpeggio for the title; `thump`×2 + low `rustle` for thunder and impacts | rain `rustle` only while rain is on screen |
| night, magical | E major with high octave sparkles (7th octave) | `mb` + `bloom` | stage |

End on the tonic chord with `chord` at the start of the final bar, and one high sparkle note ~0.6 s later.

For anything past a lullaby, build the bed with `groove({chords})` (pad, keys arpeggio, bass, kick, brush, shaker, and a resolving last bar) and put the `mb` lead on top. The mood progressions and ducking rules are in `references/audio.md`.

## 6. Prop & puppet ideas by theme

- Kitchen / breakfast: cup + steam ropes, toaster, jam jar, cat tail rope, spoon clink.
- City: telephone wires + birds, windows lighting up, umbrella, tram cable pluck, pigeons.
- Nature: tree + petals, grass stipple, dandelion seeds (petal physics, white), kite, stream as horizontal curvePath strips.
- Seasons: snow (white petals, An .06, slow), autumn leaves (terra/ochre), rain (short vertical strokes, splash ticks).
- Festival: lanterns on strings (Rope with lantern sprite at nodes), firecracker paper confetti, red couplets.
- Sea: boat on sine swell, gull `birdFlying`, rope rigging, wave strips with parallax.

Reuse library puppets where possible; new puppets are small draw functions baked once into sprites.
