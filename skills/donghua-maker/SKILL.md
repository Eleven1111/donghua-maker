---
name: donghua-maker
description: 动画制作器（donghua-maker）：用纯 JS（Canvas 2D + Web Audio）生成单文件 HTML 动画短片的完整流程，默认是纸艺定格质感（手工剪切边缘、纸纹、胶片颗粒、每秒 12 次摆位），音乐和音效优先使用找到的授权录音素材（嵌入单文件），找不到的类别由代码合成。画幅可选横屏 16:9、竖屏 9:16（抖音/视频号/Reels）、方形 1:1 或 4:5；配色、节奏、道具、音乐和质感（剪纸、版画、Riso 印刷、水彩、水墨、毛毡、黏土、粉笔、夜景、像素风/农场模拟游戏风、像素风技术图解（神经网络可视化）、商务财经图解风（方格比喻+章节标签+讲解员+红章，讲毛利/股权/成本结构等）、可爱软件产品演示风（扁平萌系小方块角色操作软件界面：剪辑软件/仪表盘/App/SaaS 功能介绍）、手绘科普讲解风、美漫/漫画分镜风、撕纸拼贴绘本风、皮影戏、3D 积木拼装风（three.js 内嵌，积木落下拼装+说明书翻页））都可以按主题扩展，也可以用 MiniMax 配中文解说并对齐时间轴。用户想"用代码/JS 做一个短视频/动画短片"、"定格动画"、"剪纸风动画"、"canvas 动画带音乐"、"程序生成的视频"、"像 Steam Song / Red Kite 那样的片子"、"像素风/星露谷那种风格的动画"、"像素风神经网络/AI 原理可视化动画"、"手绘科普动画/讲解动画"、"美漫/漫威/DC 风格动画、漫画风短片"、"撕纸拼贴/手作纸艺/儿童绘本风动画"、"皮影戏/皮影风/传统民间故事动画"、"黏土动画/黏土定格/橡皮泥风"、"3D 积木/乐高式拼装动画/three.js 动画"、"水彩动画/水彩晕染风"、"给短片配解说"、给一个故事或主题要做成几秒到几十秒的动画、或要把这种 HTML 短片改成竖屏或换风格时，都应使用本 skill，即使用户没提到"skill"或"定格"。不适用于：Seedance/可灵这类 AI 文生视频提示词、剪辑已有的素材、HyperFrames/Remotion 项目。
---

# Donghua maker — code-made animated shorts (JS)

Each film is **one self-contained HTML file**. A shared engine handles the clock, stop-motion stepping, camera, post-processing (grain, exposure flicker, vignette), the sound scheduler, scrubbing and interaction. The story is a list of **shot objects**, each with a fixed interface. Your job is the story layer: shots, puppets, palette, melody. The engine is already verified, so leave it alone unless the user asks for an engine feature.

Bundled files:
- `scripts/scaffold.py`: writes a new film file (format, duration, shot names, bpm) with a stub for every shot.
- `assets/engine.html`: the template the script fills. Don't edit it for a single film; edit the scaffolded copy.
- `assets/example-torn-paper-night.html`: a verified 7-shot, 28 s square (1440²) torn-paper collage film (晚安纸条). Copy from it: the torn-paper toolkit (`tornPath`, `tornPiece`, `crayon`), cute puppets built from baked parts with live eyes and mouth (`bakePuppets`, `eyes`, `smile`), handwriting that writes itself (`handText` + a pencil that follows the tip), one town reused at night and in the morning (`S1.day`, `S1.skyHook`), and the stepped fade to paper.
- `assets/example-shadow-archer.html`: a verified 5-shot, 20 s portrait shadow-puppet film (射日). Copy from it: the jointed-puppet rig (`rigPose`, `rigDraw`, `walkPose`) that any look can use for moving limbs, translucent carved hide (`hide`, the carved-pattern library, `carvedFace`), the lamp-lit screen (`screenBg`, `lampPass`), a bow draw with live string and arrows, and suns that blacken and fall.
- `assets/example-clay-fishing.html`: a verified 4-shot, 16 s landscape clay film (小猫钓鱼). Copy from it: `clay()` volumes with thumb dents, volume-preserving `squash` and spring `wob`, rolled `clayLine` tails and rods, a cat with photo-checked anatomy and live eyes, and water in two layers so a fish shows underneath.
- `assets/example-spring-rain.html`: a verified 4-shot, 16 s portrait watercolour film (春雨). Copy from it: one-pass `wash` with pigment pools, granulation, backruns and tide lines, wet-in-wet `soft` clouds, `ridge` mountains, `multiply` glazing that spreads in with `paint(…, {u})`, rain and ripples, and a paper halo around the frog.
- `assets/example-comic-night-watch.html`: a verified 4-shot, 12 s American-comic film (夜巡); its two narration voices are empty in this copy (fill `VO.src` with `scripts/voice.py`). Copy from it: the comic ink toolkit (`inkStroke`, `halftone`, `hatchLines`, `focusLines`, `burst`, `sfxText`, `caption`, `balloon`, `panelFrame`), pose-based silhouette figures (`heroDraw` + `HERO`/`DIVE`/`STAND`), a coloured sidekick puppet (`thugDraw`), a scarf rope that follows any pose (`scarfRig`/`scarfStep`), an inset close-up panel, the flash-invert lightning, and an iris-out ending.
- `assets/example-earth-explainer.html`: a verified 6-shot, 24.5 s hand-drawn science explainer (地球的诞生); its narration slots are empty in this copy (fill `VO_SRC` with `scripts/voice.py`). Copy from it: the sketch toolkit (`sketchPath`, `ringPts`, `markerFill`, `label`, `arrow`, `rock`), the notebook page, the chapter header and timeline ruler (`hud`), labels popping in on beats, the stepped fade to paper.
- `assets/example-brick-robot.html`: a verified 6-shot, 22 s square **3D** brick-build film (积木机器人, three.js inlined via `scaffold.py --three`). Copy from it: ASCII-layer models merged into standard bricks (`B3.parts`), bottom-up rain-in assembly with motion blur, sub-assemblies dropping together, one pure `WORLD.pose(t)` for the whole world, an instruction booklet whose pages are live renders and flip about the spine. Toolkit in `assets/toolkit-brick3d.js`, library in `assets/lib/` (MIT, sources.json).
- `assets/example-pixel-farm.html`: a verified 5-shot, 19.4 s landscape pixel film (`--pixel 8`, 农场的一天). Copy from it: 2× characters, the raised horizon, wide baked parallax layers, stepped dawn palette, a 2× foreground via transform (shot 1), splash/drip particles, the stepped fade.
- `assets/example-pixel-neural.html`: a verified 4-shot, 12 s landscape pixel diagram (`--pixel 4`, 像素神经网络), pure black with blue data flow and red/magenta errors. Copy from it: the 3×5 pixel font (`pxText`), Bresenham lines that grow (`pxLine`), the baked network stage, forward and backprop waves (`flow`), an MNIST digit that writes itself and glitches, confidence bars with a prediction box, and analytic particles.
- `assets/example-ui-demo-editor.html` and `assets/example-ui-demo-dashboard.html`: the verified cute software-demo look (kawaii flat, meta UI) on two different products: a video editor (8 s: play, blurry preview, stop, cut at the playhead, bin it, ripple, clean) and a sales dashboard (4 s: type, press, bars, KPI and ranking update). Copy from them: the `UI-DEMO KIT` block, which is identical in both (`mascotDraw`/`MASCOT`, `stateAt` event model, `keys`, UI widgets, `deviceFrame`, `bubble`/`sfxTxt`, `clickRing`, knife and trash props). Then write only a new APP block for the new product. Rules are in `looks/ui-demo.md`.
- `assets/example-biz-margin.html` and `assets/example-biz-equity.html`: the verified business/finance whiteboard explainer on two topics: gross margin (9 s, one grid transforming) and equity dilution (8 s, before → after). Copy from them: the `BIZ-EXPLAINER KIT` block, which is identical in both (meaning `block`s + `gridCell`, `card`/`arrow`/`legend`, chapter `tabs`, numbered `caption`, the red `stamp`, the hard-hat `guide` + `say`, `bakePaper`/`iris`, `stateAt`). Then write only a new TOPIC block. Rules are in `looks/biz-explainer.md`.
- `assets/example-red-kite.html`: a verified 4-shot, 10 s landscape film. Copy techniques from it: a hero prop shared across shots, rope physics, birds taking off, a tree shedding petals, a person turning their head, the final fade.
- `references/shot-contract.md`: the shot interface and the core helper library. **Read it before writing shot code.**
- `references/audio.md`: sound roles and buses, automatic music ducking under sfx/voice, **recorded sounds first** (search order, licences, `scripts/sfx_import.py`, synthesised fallback per category), the `ui` sound set, `groove()` layered music, cue alignment, stems and loudness mastering. **Read it before writing the score.**
- `scripts/sfx_import.py`: turns found recordings (sfx or a music bed) into an embedded `SAMPLES` block. It trims, levels, encodes, measures the landing point, and records source and licence in `sources.json`. Downloading a sound needs the user's OK first.
- `references/looks/<look>.md`: look-specific toolkits and rules (`pixel`, `explainer`, `comic`, `torn-paper`, `shadow-puppet`, `clay`, `watercolor`, `brick3d`). Read only the file for the look you're building, after the shot contract.
- `references/fact-check.md` + `scripts/fact_check.py`: the fact gate for any film that states facts (history, science, geography, business, product claims): every on-screen string is sourced, disputed-with-note or marked non-factual, plus the picture's factual claims (map positions, costumes…). **Read it before briefing a factual topic.**
- `scripts/narrate.py`: free narration (edge-tts, no key) with word-level timing. `<film>-vo/script.json` holds one line per shot; a `{FIELD}` bookmark moves that shot's cue field onto the next spoken word. It writes the NARRATION block, burned-in subtitles (C toggles them; `?subs=0`) and an `.srt`. It fails when a line overruns its shot. `--check` re-verifies.
- `scripts/font_embed.py`: embeds SIL OFL fonts (霞鹜文楷 and Noto Sans SC), subset to the film's characters, and writes a licence ledger. Use it whenever the film may be published or used commercially. `--check` catches a stale subset.
- `__film.textBoxes(frame)` (engine hook): every text drawn in that frame with its string and canvas box, subtitles tagged. Scene packs use it for safe-area and overlap checks. It can't see text baked into sprites.
- `scripts/stills.py`: full-resolution stills (`--shots` = first/mid/last frame of every shot) plus a contact sheet, on its own local server; exits 1 on page errors. The input for the step-5 visual check.
- `references/styles.md`: formats and vertical composition, texture recipes, palettes, rhythm, music. Read it when you turn a theme into parameters.

## Workflow

### 1. Brief (story before code)
Turn the user's theme into a shot table. If the user leaves story, format or style open, choose them yourself and say they are your choices. Ask only if the theme itself is unclear.

```
Title / format (landscape|portrait|square|feed) / duration / shot count
Look (styles.md §2) + palette (§3) + rhythm (§4) + key/bpm/voice (§5)
Per shot: name · time span · one-sentence cause→effect · the thing handed to the next shot
          props (static sprites) · moving things (rope/particles/puppets) · camera start→end
          melody notes in this bar and what each one triggers visually · foley + ambience bed
```

Why a handoff per shot matters: these films read as one continuous chain reaction (steam → note → birds → petals → girl). That causal thread is what makes 10 seconds feel like a story and not a slideshow.

**Length and shot count come from the theme.** "Four shots, 10 s" is not a default to fall back on. Decide both in the brief and state the reason in one line.

| theme shape | total | shots | rhythm |
|---|---|---|---|
| mood piece, one image breathing (a moon rising, rain on a window) | 5–10 s | 1–2 long shots | slow bpm 60–80, EXPO 6–8, long holds |
| cause→effect chain (Steam Song, Red Kite, 婵娟) | 8–15 s | 3–5 | 90–110 bpm, 2–3 s per shot |
| story with a turn (setup → trouble → resolution) | 15–30 s | 5–8 | vary shot length: short for action, long for the payoff |
| greeting card / festive / loop for social | 6–12 s | 5–8 short shots | 120–132 bpm, 1–1.5 s cuts on the beat, final hold ≥ 1.5 s |
| poem or quote, one line per shot | ~2.5 s per line + 1.5 s end hold | one per line | tempo from the reading pace |

Shot lengths don't have to be equal: give the payoff shot room (often 1.3–1.6× the others) and keep setup shots short. Budget note: every shot costs roughly the same to build and verify, so 8 shots is about twice the work of 4. Past about 9 shots or 30 s, split the piece into two films.

### 2. Scaffold
```bash
python3 ~/.claude/skills/donghua-maker/scripts/scaffold.py <out>.html --title "Name" --format portrait --shots "Cup,Wire,Tree,Girl" --durs "2,2.5,3.5,2" --bpm 96 --bed room --aria "one-sentence description"
```
- `--durs` sets each shot's length; the total is their sum. Without it, `--dur` is split evenly.
- Write `<out>.html` into the user's working folder, not into the skill folder.
- Put cuts on the music grid: every boundary should be a whole number of eighth notes (30/bpm s). The script warns about any cut that isn't and suggests the nearest grid time. At 96 bpm the eighth is 0.3125 s, so 2.5 s = 8 eighths, 1.875 s = 6.
- The timeline bar's segments are sized by shot length automatically.
- **Pixel-art films** (cosy farm-sim, retro game looks): add `--pixel 8`. Shots then draw on a 320×180 buffer (portrait 180×320) with the pixel toolkit in `references/shot-contract.md` `looks/pixel.md`, and the stubs are generated accordingly. The paper-look rules (`boil`, `sprite`, `backdrop`) don't apply in this mode. Before writing pixel shots, read the scale and layout rules in `looks/pixel.md`: 1× sprites on a 320×180 buffer read too small, and the user rejected that.
- Keep `DUR × 60` a whole number (at 96 bpm use an even count of eighths). An odd count such as 19.375 s gives 1162.5 frames, and the exported MP4 ends up one frame short.
- Browser screenshots at pane size downscale the frame. To judge detail, grab full-resolution stills with `canvas.toDataURL()` after `__film.seek(f)` (a still, not a video render).

### 3. Sample one shot first
Fill in the palette (`Object.assign(C, {...})`), `MELODY`, `baseScore()` beds and **shot 1 only**. Verify it (step 5) and show the user before writing the rest. Style problems are cheap to fix at one shot and expensive at four.

For a look that imitates a real tradition (皮影, 年画, 剪纸 folk art, ukiyo-e…), first look at a few real examples (museum photos on Wikimedia Commons) and list the construction rules they share. Then bake the characters as a static cast sheet and get it approved before shot 1. In 射日, a cartoon drawn from memory was rejected outright, while the reference-checked cast sheet passed after two face rounds.
The same goes for animals and people in any look: check real anatomy in a photo first (小猫钓鱼's first cat head was rejected). When checking any character, also confirm three things: jointed pieces overlap with no background showing at the seam; the character's hue and value differ from what it stands on; and its whole motion path stays clear of other focal props.

### 4. Write the remaining shots
Follow `references/shot-contract.md`. Rules that keep the look:
- `draw()` reads only the snapshot state (`rx/ry/ra`, `rope.at()`), and every puppet gets `boil(id, e)` jitter. This produces the 12-poses-per-second stop-motion feel while the camera glides smoothly.
- No `Math.random()` in `step` or `draw`. Use `rng(seed)` from `reset()`, or `hash()`. That keeps seeking and the offline audio mix deterministic.
- Pre-run the physics inside `reset()` so every shot opens with things already moving.
- If a prop crosses shots, build it as a shared rig with `xxxRig/Step/Snap/Draw` helpers (see the kite in the example).
- Every melody note needs a visible cause or effect.
- In portrait: action runs vertically, the camera moves mostly on y, and key action stays inside the middle 60% of the frame (platform UI covers the top and bottom).
- To change the pose rate, edit `EXPO` near the top of the file and the `Stop-motion · 12 poses/s` label in `ui()`.

### 4b. Narration (only when the user asks for a voice track)

**Default: `scripts/narrate.py`.** It is free, needs no key, times each word, and makes subtitles; the scene packs, such as `donghua-classroom`, use it. The MiniMax path below is the paid, opt-in voice for when the user asks for it. Its mixing and verification rules (steps 5–6) apply to both.
Work in the web version, like any other revision; this is not part of rendering.
1. **Write one line per shot, sized to fit.** MiniMax `speech-2.8-hd` at speed 1.15 reads about **5.3 Chinese characters per second** (measured: 17 chars → 3.31 s, 21 chars → 3.77 s). Budget for `(shot length − 0.2 s) × 5.3` characters. Say the thing the picture shows, in plain words.
2. **Generate with `scripts/voice.py`.** MiniMax is paid and opt-in: only use it when the user asks. Write `<film>-vo/lines.json` (`{"clips":[{"id","text","voice","speed"}]}`) next to the film, then run `python3 ~/.claude/skills/donghua-maker/scripts/voice.py <film>-vo/lines.json`. Use `--only <id>` to regenerate one line and `--force` to regenerate all. The key comes from `MINIMAX_API_KEY` in the environment, otherwise from the user's global secrets file `~/.config/secrets/.env` (chmod 600). If it is missing the script stops and says so; tell the user to add it there. Never read, print, copy or `source` the key yourself, and never pass it on a command line. The script retries each line 3×, and the async API sometimes misses its 120 s window.
3. **Treat the audio as the source of truth.** `voice.py` already trims silence at both ends, normalises to −16 LUFS (TP −2), encodes 48 kHz mono 80 kbps, and writes each clip's measured `dur` back into `lines.json`. Place each clip at `shot.t0 + 0.1`; it must end before `shot.t1`. If a line overruns, shorten the text or raise `speed` slightly and regenerate. Never cut or time-stretch the audio.
4. **Embed it.** The clips are already encoded (six lines ≈ 200 KB). Set `VO.src = [base64…]` in the story, and add `{ t, k: 'vo', id, dur }` to `baseScore()`. The engine decodes the clips once, plays them live (resuming mid-line on seek), and bakes them into `__film.wav()` for export.
   Voices used so far: `Chinese (Mandarin)_Reliable_Executive` (explainer narrator), `male-qn-badao` (gruff comic narrator), `male-qn-qingse` (young, nervous side character). From 小蝌蚪找妈妈 (dialogue): `cute_boy` (little child, speed 1.15), `female-chengshu` (motherly, 1.1), `female-shaonv` (young girl, 1.1), `Chinese (Mandarin)_Kind-hearted_Elder` (old, slow: needs 1.35 to fit a shot). `male-qn-badao` reads slowly, so generate at speed 1.2.
5. **Mix for the voice.** New films duck the music bus 6 dB under every `vo` line automatically (`references/audio.md` §2). Leave the voice gain at the default .85 (1.5 clipped). Drop `mb` melody notes to about v .5. Under narration, use **no ambience `bed` and no pencil or paper scratch sounds**: their hiss reads as noise, and the user rejected both. Keep only short, picture-tied noise effects (an impact, rain), quietly.
6. **Verify.** Render `__film.wav()` and measure the mean level in each voice window against the quiet gaps: the voice should sit about 4–7 dB above them, with peaks at or below −1.5 dB. Local `whisper-cli` only has `ggml-small.en`, which can't transcribe Chinese, so report word accuracy (and polyphonic characters like 忒) as UNVERIFIED and ask the user to listen.

### 4c. Sound pass (films whose sound matters: products, explainers, anything for publishing)
Run the audio pipeline once the picture is approved in the browser: `python3 scripts/audio_director.py <film>.html --mood <mood> --key <key> --run --check`. That is about 15 s on a cold cache and about 7 s warm. `--check` is the audio acceptance: 0 page errors, full-length wav and stems, no report warnings, and the deepest duck measured on the stems. A PASS replaces the manual in-browser audio steps; it still means measured, not auditioned. It plans the audio, renders a MIDI/SoundFont bed, finds, ranks and imports recorded SFX (local → Mixkit → Freesound), and writes one SAMPLES block.  The film needs the current engine (a `SMP` object); a film scaffolded before that must be re-scaffolded with its story moved across.

### 4d. Fact check (any film that states facts)
Follow `references/fact-check.md`: search the claims while briefing, then `python3 scripts/fact_check.py <film>.html --init`, fill `<film>-facts/facts.json` from sources read in this run (text and `visual` claims), and require `FACT CHECK PASS`. Re-run after every text edit. Report `disputed` items to the user. On 日本历史速览 this caught two wrong on-screen statements after the visual check had passed.

### 5. Verify (real renders, not assumptions)
Serve the folder (`python3 -m http.server <port>`, since file:// may be blocked). Then:
1. Run `python3 scripts/stills.py <film>.html --shots` (or `--at` key moments) and look at every still. Also check every place, date and object for being factually right, not just readable (Edo was once drawn on the wrong coast). Look at each one: does the hero read, is anything cropped or floating where it should be attached or landed, does the palette hold?
   Also check each shot's **first frame**, not only its key moments. If the camera starts low or high (low z, big y offset), the edges can show past the backdrop, and the canvas clear colour (near-black) appears as a band. Screenshots taken mid-shot miss this. Fix it by filling the frame with the paper colour before drawing the backdrop, or by giving the backdrop more margin.
2. Check that the console has zero errors. After every edit, first run `node --check` on the extracted `<script>`: a `// comment` appended to a one-line object literal silently swallows every property after it on that line. Reload with a cache-busting `&v=N`, because `http.server` pages get cached and console errors from earlier loads persist across navigations.
3. Run `await window.__film.wav()`. The byte length must equal `44 + DUR*48000*4`, and `__film.score()` must hold the expected events.
   Then run `__film.audio()`. Its warnings must be empty, or each one explained. Every key action needs an sfx cue within 1–2 frames of its picture moment. Check ducking by measuring the music stem with and without `duck` after the loudest cue (`references/audio.md` §5).
4. Play across at least one cut and confirm `__film.info().shot` advances and the timeline segment highlights.
   If `document.visibilityState` is `hidden` (the browser pane is in the background), requestAnimationFrame runs 0×/s and live playback can't be tested: verify cuts with `seek()` and report live playback as UNVERIFIED.
5. Stop the server.

Report honestly what you did not check, e.g. that you didn't listen to the audio or didn't click-test `poke`.

### 6. Deliver the web version, then stop
Deliver **only the HTML**. Give the file path, the controls (Space play, S toggles stop-motion/smooth, 1–N jump to shot, ←/→ step one exposure, M mute, click/drag to poke or blow on the scene), a list of what was verified and what wasn't, and ask the user to review it in the browser. End with a clear question: approve it for rendering, or name what to change.

Do not render a video at this step, even if the film is headed to a platform or the user mentioned a video earlier. Rendering is slow, and each render makes a file that goes stale as soon as the user asks for a change. The user reviews in the browser, where changes are cheap.

### 7. Revision loop (web only)
Every round of change requests happens in the HTML: edit it, re-verify with the step-5 browser checks, and deliver the HTML again. Never render or re-render a video as part of a revision round, and don't use a video export as your verification tool; screenshots and `__film.seek()` in the browser are the verification path. Repeat until the user explicitly approves the web version.

### 8. Render the video (only after explicit approval)
Only after the user explicitly approves the web version (e.g. "没问题了，渲染吧", "OK, export it"), run the export described in "Export to video" and verify the MP4. An approval of an earlier version doesn't carry over: if the user asks for more changes after approving, go back to step 7 and wait for a fresh approval. If a request is ambiguous ("看起来不错" with no word about rendering), ask whether to render instead of assuming.

## Extending
- **New look / palette / music mood**: once it has worked in a real film, add a row to `references/styles.md`. If the look needs its own helpers or rules, also add `references/looks/<name>.md`, list it in shot-contract §7b, and save the film as `assets/example-<name>.html`. The library grows from verified results.
- **New sound voice**: add a method on the film's `Sound` class plus a `case` in `play()`.
- **New format**: add it to `FORMATS` in `scaffold.py`. For tall formats the page reserves 290 px for the control bar (`{{UIH}}`).
## Export to video (MP4)

Run this only in step 8, after the user has explicitly approved the web version.

`scripts/export.py` renders the film frame by frame. It runs headless Chrome through Python Playwright, uses the film's own deterministic hooks (`__film.wav()` for the offline audio mix, `__film.seek(f)` plus a canvas capture per frame), and pipes everything into ffmpeg. The output is H.264 + AAC. The export is frame-exact and doesn't depend on playback speed, so a slow machine produces the same file as a fast one.

```bash
python3 ~/.claude/skills/donghua-maker/scripts/export.py film.html                                   # master: full res, 60fps, crf 18
python3 ~/.claude/skills/donghua-maker/scripts/export.py film.html -o film-1080.mp4 --scale .75 --crf 23   # upload copy
```
Options:
- `--fps 30`: keeps every other frame.
- `--scale 0.5`: downscales the output.
- `--smooth`: exports the 60-poses/s version.
- `--png`: lossless frames instead of JPEG q.95.
- `--crf N`: sets the x264 quality.
- `--no-audio`: exports picture only.
- `--aspect 3:4`: centre-crops before scaling, e.g. the 小红书 version of a 9:16 film.

Requires `ffmpeg` and `playwright` (Python), plus Google Chrome or `python3 -m playwright install chromium`.

Measured on Red Kite (10 s, 2560×1440): about 70 s to export. The master at crf 18 was about 100 MB, because film grain is expensive to encode. `--scale .75 --crf 23` gave 1920×1080 at about 5 MB. For platform uploads, recommend the 1080p copy: 1080×1920 for portrait, which is `--scale .75` on 1440×2560.

Verify every export yourself:
1. Run `ffprobe` and check that `nb_frames == DUR*fps`, the duration equals DUR, and an audio stream exists.
2. Read the loudness lines `export.py` prints: the master is normalised to −16 LUFS / −1.5 dBTP by default, and the encoded MP4 is re-measured. A true peak above the ceiling is flagged. Use `--stems` to write per-role WAVs for listening. Measuring is not listening: say so if you didn't audition.
3. Make a contact sheet of one frame per shot (`select=eq(n\,N)+…,tile=2x2`) and look at it to confirm it matches the browser.
