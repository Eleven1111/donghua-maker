---
name: donghua-maker
description: "动画制作器：用纯 JS（Canvas 2D / three.js + Web Audio）生成单文件 HTML 动画短片的完整流程——分镜、镜头代码、54 种画风、授权音效与配乐、免费或 MiniMax 解说、可商用字体、事实核对、全分辨率静帧自检，确认后导出 MP4。画幅横屏/竖屏/方形。画风包括纸艺定格（默认）、撕纸绘本、皮影、水彩、水墨、青绿长卷、浮世绘、年画、敦煌、像素/像素图解、美漫、手绘科普、黑板、蓝图、铅笔、版画、沙画、字符画、终端、科幻界面、控制台大屏、动态字体、报刊数据图、商务图解、软件演示、历史讲解、图层卡通讲解，以及 3D 黏土、3D 积木、3D 等距、3D 扁平科普等（完整目录见 references/catalog.md）。用户说\"用代码做动画/短片\"、\"定格动画\"、\"某某风格的动画\"、\"讲解/科普动画\"、\"canvas 或 three.js 动画带音乐\"、\"给短片配解说\"、\"把这个短片改竖屏/换风格\"时使用，即使没提 skill。不适用于：AI 文生视频提示词（Seedance/可灵）、剪辑已有素材、HyperFrames/Remotion 项目。"
license: MIT
compatibility: "Python 3.10+; a browser to view films; ffmpeg + Playwright for stills/export; Node 18+ for tools/validate.py. Works in any Agent Skills terminal (Claude Code, Codex, Cursor, Antigravity, WorkBuddy, OpenClaw…)."
metadata:
  repo: "https://github.com/Eleven1111/donghua-maker"
---

# Donghua maker — code-made animated shorts (JS)

Each film is **one self-contained HTML file**. A shared engine handles the clock, stop-motion stepping, camera, post-processing (grain, exposure flicker, vignette), the sound scheduler, scrubbing and interaction. The story is a list of **shot objects**, each with a fixed interface. Your job is the story layer: shots, puppets, palette, melody. The engine is already verified, so leave it alone unless the user asks for an engine feature.

`<skill-dir>` below means the folder that holds this `SKILL.md` (wherever your agent installed it); every path in this skill is relative to it.

Bundled files:
- `scripts/scaffold.py`: writes a new film file (format, duration, shot names, bpm) with a stub for every shot.
- `assets/engine.html`: the template the script fills. Don't edit it for a single film; edit the scaffolded copy.
- `references/setup.md` + `scripts/doctor.py` + `scripts/donghua_env.py`: what each feature needs, one key lookup order for every script (env → `./.env` → `~/.config/donghua/.env`), fonts without GitHub, MiniMax region.
- `references/onboarding.md` + `scripts/profile.py`: the local creator profile (`~/.config/donghua/profile.md`, shared by every terminal): read it, learn it from the terminal's memory, or ask three questions; it sets the brief's defaults.
- `references/catalog.md`: **every verified example film** (`assets/example-*.html`) with what to copy from each, plus the trigger phrases for each look. Read it when you choose a look, then open only that example.
- `references/shot-contract.md`: the shot interface and the core helper library. **Read it before writing shot code.**
- `references/audio.md`: sound roles and buses, automatic music ducking under sfx/voice, **recorded sounds first** (search order, licences, `scripts/sfx_import.py`, synthesised fallback per category), the `ui` sound set, `groove()` layered music, cue alignment, stems and loudness mastering. **Read it before writing the score.**
- `scripts/sfx_import.py`: turns found recordings (sfx or a music bed) into an embedded `SAMPLES` block. It trims, levels, encodes, measures the landing point, and records source and licence in `sources.json`. Downloading a sound needs the user's OK first.
- `references/looks/<look>.md`: look-specific toolkits and rules (`pixel`, `explainer`, `comic`, `torn-paper`, `shadow-puppet`, `watercolor`, `clay3d`, `brick3d`, `gold-scroll`). Read only the file for the look you're building, after the shot contract.
- `references/fact-check.md` + `scripts/fact_check.py`: the fact gate for any film that states facts (history, science, geography, business, product claims): every on-screen string is sourced, disputed-with-note or marked non-factual, plus the picture's factual claims (map positions, costumes…). **Read it before briefing a factual topic.**
- `scripts/narrate.py`: free narration (edge-tts, no key), word timing, subtitles and `.srt`; usage in `references/narration.md`.
- `scripts/font_embed.py`: embeds SIL OFL fonts (霞鹜文楷 and Noto Sans SC), subset to the film's characters, and writes a licence ledger. Use it whenever the film may be published or used commercially. `--check` catches a stale subset.
- `__film.textBoxes(frame)` (engine hook): every text drawn in that frame with its string and canvas box, subtitles tagged. Scene packs use it for safe-area and overlap checks. It can't see text baked into sprites.
- `scripts/stills.py`: full-resolution stills (`--shots` = first/mid/last frame of every shot) plus a contact sheet, on its own local server; exits 1 on page errors. The input for the step-5 visual check.
- `scripts/frames_import.py` + `references/frames.md`: opt-in drawn character frames.
- `scripts/qa.py`: step-5 numbers: page errors, determinism, backdrop leak; motion, text and subtitle clues per shot.
- `references/lessons.md`: what worked on earlier films, with evidence. Read it while briefing.
- `references/styles.md`: formats and vertical composition, texture recipes, palettes, rhythm, music. Read it when you turn a theme into parameters.

## One-sentence mode (directors)
When the user wants a whole film from one line with no questions (「做一个…的动画」「一句话出片」, a lesson → `classroom-director`, a social short → `creator-director`), hand it to the matching director agent if your terminal has subagents. If it doesn't (Codex, Antigravity, WorkBuddy, OpenClaw…), open `directors/<name>.md` next to this file (`install.sh` puts it there) and follow it yourself, step by step, as the main agent.

## Workflow

### 0. Machine and user (first use, then once per session)
On a machine's first use run `python3 scripts/doctor.py`: it checks ffmpeg, the browser, edge-tts, fonts, the SoundFont and which keys are set (never their values), and prints the install command for anything missing. Fix the core before making films and ask before installing anything; keys and fonts are covered in `references/setup.md`. Then run `python3 scripts/profile.py find`. With a profile, let it set the defaults of the brief (pack, format, look shortlist, language) and say which ones came from it. Without one, learn it from what your terminal already knows about the user (your loaded memory or persona, then your own terminal's memory files, profile fields only) and confirm it in one line; if nothing is known, ask up to three short questions (背景、做哪类片子、给谁看/发哪里) and save the answers with `profile.py save`. Without a profile, your first reply must open with that one-line confirmation or those three questions, before any topic or style question (the script prints the exact wording). A specific request never waits on this: make the film and offer to save a profile at the end. Details and the profile → defaults table: `references/onboarding.md`.

### 1. Brief (story before code)
Turn the user's theme into a shot table. If the user leaves story, format or style open, choose them yourself and say they are your choices. Ask only if the theme itself is unclear.

```
Title / format (landscape|portrait|square|feed) / duration / shot count
Look (styles.md §2) + palette (§3) + rhythm (§4) + key/bpm/voice (§5)
Arcs: colour (how the palette moves across the film) · growth (what gets bigger, worse or nearer each time)
Per shot: name · time span · one-sentence cause→effect · out: how it hands over to the next shot
          props (static sprites) · moving things (rope/particles/puppets) · camera start→end
          melody notes in this bar and what each one triggers visually · foley + ambience bed
```

Why a handoff per shot matters: these films read as one continuous chain reaction (steam → note → birds → petals → girl). That causal thread is what makes 10 seconds feel like a story and not a slideshow. The `out` column forces it: write how the eye crosses each cut (shot-contract §7).

**Given a reference video** ("make one like this"), run `python3 scripts/breakdown.py <video>` first and brief from its cuts, tempo, shot lengths and motion; copy the mechanism, not the pixels.

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
python3 <skill-dir>/scripts/scaffold.py <out>.html --title "Name" --format portrait --shots "Cup,Wire,Tree,Girl" --durs "2,2.5,3.5,2" --bpm 96 --bed room --aria "one-sentence description"
```
- `--durs` sets each shot's length; the total is their sum. Without it, `--dur` is split evenly.
- Write `<out>.html` into the user's working folder, not into the skill folder.
- Put cuts on the music grid: every boundary should be a whole number of eighth notes (30/bpm s). The script warns about any cut that isn't and suggests the nearest grid time. At 96 bpm the eighth is 0.3125 s, so 2.5 s = 8 eighths, 1.875 s = 6.
- The timeline bar's segments are sized by shot length automatically.
- **Pixel-art films**: add `--pixel 8` (a 320×180 buffer; paper-look helpers don't apply). Read `references/looks/pixel.md` first: 1× sprites read too small and were rejected.
- Keep `DUR × 60` a whole number (at 96 bpm use an even count of eighths). An odd count such as 19.375 s gives 1162.5 frames, and the exported MP4 ends up one frame short.
- Judge detail on `scripts/stills.py` stills; pane screenshots downscale.

### 3. Sample one shot first
Fill in the palette (`Object.assign(C, {...})`), `MELODY`, `baseScore()` beds and **shot 1 only**. Verify it (step 5) and show the user before writing the rest. Style problems are cheap to fix at one shot and expensive at four.
**Three directions on one frame**: when the look is new to this user or a character is newly designed, render shot 1's key frame three ways (e.g. three looks, or three takes on the character) and let the user pick before going on, even if they named a style.

For a look that imitates a real tradition (皮影, 年画, 剪纸 folk art, ukiyo-e…), first look at a few real examples (museum photos on Wikimedia Commons) and list the construction rules they share. Then bake the characters as a static cast sheet and get it approved before shot 1. In 射日, a cartoon drawn from memory was rejected outright, while the reference-checked cast sheet passed after two face rounds.
The same goes for animals and people in any look: check real anatomy in a photo first (小猫钓鱼's first cat head was rejected). When checking any character, also confirm three things: jointed pieces overlap with no background showing at the seam; the character's hue and value differ from what it stands on; and its whole motion path stays clear of other focal props.

### 4. Write the remaining shots
Follow `references/shot-contract.md`. Rules that keep the look:
- Cuts are hard and on the beat by default; a shot may open with a transition in its look's language: `enter: { kind: 'ink'|'tear'|'pixel', dur, at }` (shot-contract §7c).
- `draw()` reads only the snapshot state (`rx/ry/ra`, `rope.at()`), and every puppet gets `boil(id, e)` jitter. This produces the 12-poses-per-second stop-motion feel while the camera glides smoothly.
- No `Math.random()` in `step` or `draw`. Use `rng(seed)` from `reset()`, or `hash()`. That keeps seeking and the offline audio mix deterministic.
- Pre-run the physics inside `reset()` so every shot opens with things already moving.
- If a prop crosses shots, build it as a shared rig with `xxxRig/Step/Snap/Draw` helpers (see the kite in the example).
- Every melody note needs a visible cause or effect.
- In portrait: action runs vertically, the camera moves mostly on y, and key action stays inside the middle 60% of the frame (platform UI covers the top and bottom).

### 4b. Narration (only when the user asks for a voice track)
Only when the user asks for a voice. Follow `references/narration.md`: one line per shot sized at ~5.3 字/s, free `scripts/narrate.py` or paid MiniMax via `scripts/voice.py` (key from `.env` only), the audio is the source of truth, embed via `VO.src`, mix with no ambience bed under the voice, report pronunciation as UNVERIFIED.

### 4c. Sound pass (films whose sound matters: products, explainers, anything for publishing)
Run the audio pipeline once the picture is approved in the browser: `python3 scripts/audio_director.py <film>.html --mood <mood> --key <key> --run --check`. That is about 15 s on a cold cache and about 7 s warm. `--check` is the audio acceptance: 0 page errors, full-length wav and stems, no report warnings, and the deepest duck measured on the stems. A PASS replaces the manual in-browser audio steps; it still means measured, not auditioned. It plans the audio, renders a MIDI/SoundFont bed, finds, ranks and imports recorded SFX (local → Mixkit → Freesound), and writes one SAMPLES block.  The film needs the current engine (a `SMP` object); a film scaffolded before that must be re-scaffolded with its story moved across.

### 4d. Fact check (any film that states facts)
Follow `references/fact-check.md`: search the claims while briefing, then `python3 scripts/fact_check.py <film>.html --init`, fill `<film>-facts/facts.json` from sources read in this run (text and `visual` claims), and require `FACT CHECK PASS`. Re-run after every text edit. Report `disputed` items to the user. On 日本历史速览 this caught two wrong on-screen statements after the visual check had passed.

### 5. Verify (real renders, not assumptions)
Serve the folder (`python3 -m http.server <port>`, since file:// may be blocked). Then:
1. Run `python3 scripts/stills.py <film>.html --shots` (or `--at` key moments) and look at every still. Also check every place, date and object for being factually right, not just readable (Edo was once drawn on the wrong coast). Look at each one: does the hero read, is anything cropped or floating where it should be attached or landed, does the palette hold?
   Also check each shot's **first frame**, not only its key moments. If the camera starts low or high (low z, big y offset), the edges can show past the backdrop, and the canvas clear colour (near-black) appears as a band. Screenshots taken mid-shot miss this. Fix it by filling the frame with the paper colour before drawing the backdrop, or by giving the backdrop more margin.
   Then run `python3 scripts/qa.py <film>.html` (platform portrait: add `--safe 0.12,0.2`) and require `QA PASS` (no page errors, no backdrop leak, deterministic frames). Its clue columns point at frames to look at, not failures.
2. Check that the console has zero errors. After every edit, first run `node --check` on the extracted `<script>`: a `// comment` appended to a one-line object literal silently swallows every property after it on that line. Reload with a cache-busting `&v=N`, because `http.server` pages get cached and console errors from earlier loads persist across navigations.
3. Run `await window.__film.wav()`. The byte length must equal `44 + DUR*48000*4`, and `__film.score()` must hold the expected events.
   Then run `__film.audio()`. Its warnings must be empty, or each one explained. Every key action needs an sfx cue within 1–2 frames of its picture moment. Check ducking by measuring the music stem with and without `duck` after the loudest cue (`references/audio.md` §5).
4. Play across at least one cut and confirm `__film.info().shot` advances and the timeline segment highlights.
   If `document.visibilityState` is `hidden`, rAF doesn't run: verify cuts with `seek()` and report live playback as UNVERIFIED.
5. Stop the server.

Report honestly what you did not check, e.g. that you didn't listen to the audio or didn't click-test `poke`.

### 5b. Independent review (films anyone else will see)
A reviewer who took no part in the film sees only it, its stills and the `qa.py` strips (`references/review.md`). Directors report it as pending.

### 6. Deliver the web version, then stop
Deliver **only the HTML**. Give the file path, the controls (Space play, S toggles stop-motion/smooth, 1–N jump to shot, ←/→ step one exposure, M mute, click/drag to poke or blow on the scene), a list of what was verified and what wasn't, and ask the user to review it in the browser. End with a clear question: approve it for rendering, or name what to change.

Do not render a video at this step, even if the film is headed to a platform or the user mentioned a video earlier. Rendering is slow, and each render makes a file that goes stale as soon as the user asks for a change. The user reviews in the browser, where changes are cheap.

### 7. Revision loop (web only)
Every round of change requests happens in the HTML: edit it, re-verify with the step-5 browser checks, and deliver the HTML again. Never render or re-render a video as part of a revision round, and don't use a video export as your verification tool; screenshots and `__film.seek()` in the browser are the verification path. Repeat until the user explicitly approves the web version.

### 8. Render the video (only after explicit approval)
Only after the user explicitly approves the web version (e.g. "没问题了，渲染吧", "OK, export it"), run the export described in "Export to video" and verify the MP4. An approval of an earlier version doesn't carry over: if the user asks for more changes after approving, go back to step 7 and wait for a fresh approval. If a request is ambiguous ("看起来不错" with no word about rendering), ask whether to render instead of assuming.

## Extending
- **After every film**: what worked (approved or measurably fixed) → `references/lessons.md` with its evidence; a new pitfall → that look's file.
- **New look / palette / music mood**: only from verified films. A look (built by you or a dispatched agent) follows `references/new-look.md`; a palette or mood is a row in `references/styles.md`.
- **New sound voice**: add a method on the film's `Sound` class plus a `case` in `play()`.
- **New format**: add it to `FORMATS` in `scaffold.py`. For tall formats the page reserves 290 px for the control bar (`{{UIH}}`).
## Export to video (MP4)
Step 8 only. `python3 scripts/export.py film.html` (master) or `--scale .75 --crf 23` (upload copy). Options, timings and the three export checks (ffprobe frame count, volumedetect, contact sheet) are in `references/export.md`.
