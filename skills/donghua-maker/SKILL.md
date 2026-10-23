---
name: donghua-maker
description: "动画制作器：用纯 JS（Canvas 2D / three.js + Web Audio）生成单文件 HTML 动画短片的完整流程——分镜、镜头代码、25 种画风、授权音效与配乐、免费或 MiniMax 解说、可商用字体、事实核对、全分辨率静帧自检，确认后导出 MP4。画幅横屏/竖屏/方形。画风包括纸艺定格（默认）、撕纸绘本、皮影、水彩、水墨、青绿长卷、浮世绘、半调档案、像素/像素图解、美漫、手绘科普、黑板、蓝图、版画、控制台大屏、动态字体、报刊数据图、商务图解、软件演示、历史讲解、图层卡通讲解，以及 3D 黏土、3D 体素、3D 扁平科普、3D 爆炸拆解等（完整目录见 references/catalog.md）。用户说\"用代码做动画/短片\"、\"定格动画\"、\"某某风格的动画\"、\"讲解/科普动画\"、\"canvas 或 three.js 动画带音乐\"、\"给短片配解说\"、\"把这个短片改竖屏/换风格\"时使用，即使没提 skill。不适用于：AI 文生视频提示词（Seedance/可灵）、剪辑已有素材、HyperFrames/Remotion 项目。"
license: MIT
compatibility: "Python 3.10+; a browser to view films; ffmpeg + Playwright for stills/export; Node 18+ for tools/validate.py. Works in any Agent Skills terminal (Claude Code, Codex, Cursor, Antigravity, WorkBuddy, OpenClaw…)."
metadata:
  repo: "https://github.com/Eleven1111/donghua-maker"
---

# Donghua maker — code-made animated shorts (JS)

Each film is **one self-contained HTML file**: a verified engine (clock, stop-motion stepping, camera, grain/flicker/vignette, sound scheduler, scrubbing, interaction) plus a story layer of **shot objects** with a fixed interface. You write the story layer (shots, puppets, palette, melody); leave the engine alone unless the user asks for an engine feature. `<skill-dir>` is the folder holding this file; every path below is relative to it.

## What to read, when
| read | when |
|---|---|
| `references/onboarding.md`, `references/setup.md` | step 0: the creator profile; what each feature needs, keys (env → `./.env` → `~/.config/donghua/.env`), fonts, MiniMax region |
| `references/lessons.md`, `references/styles.md` | briefing: what worked, with evidence; formats, palettes, rhythm, music |
| `references/catalog.md` | choosing a look: every verified example (`assets/example-*.html`) with its triggers. Then open only that example and `references/looks/<look>.md` |
| `references/shot-contract.md` | before writing shot code: shot interface, helpers, transitions, test hooks |
| `references/audio.md` | before the score: buses, ducking, recorded sounds first (`scripts/sfx_import.py`), `groove()`, mastering |
| `references/narration.md`, `references/fact-check.md` | a voice track; any film that states facts (read before briefing it) |
| `references/craft-checks.md` | from step 3: what the maker's own eye misses |
| `references/rebuild.md` | a real object, machine or animal the film depends on: before its code (`scripts/compare.py`) |
| `references/verify.md`, `references/review.md` | step 5 browser checks; step 5b independent review |
| `references/frames.md`, `references/long-film.md`, `references/new-look.md`, `references/export.md` | drawn character frames; films past ~30 s; building a look; step 8 |

Every script in `scripts/` answers `--help`. `assets/engine.html` is the template `scaffold.py` fills: edit the scaffolded copy, never the template.

## One-sentence mode (directors)
A whole film from one line with no questions (「一句话出片」; a lesson → `classroom-director`, a social short → `creator-director`): hand it to that director agent. A terminal without subagents opens `directors/<name>.md` (put there by `install.sh`) and follows it itself.

## Workflow

### 0. Machine and user
First use on a machine: `python3 scripts/doctor.py` (dependencies, and which keys are set, never their values); ask before installing anything. Then `python3 scripts/profile.py find`: a profile sets the brief's defaults; say which came from it. Without one, open your first reply with a one-line confirmation of what your terminal already knows about the user, or the three questions the script prints, and save with `profile.py save`. A specific request never waits: make the film and offer to save a profile at the end.

### 1. Brief (story before code)
Turn the theme into a shot table. Choose open story, format or style yourself and say so; ask only if the theme is unclear.

```
Title / format (landscape|portrait|square|feed) / duration / shot count
Look (styles.md §2) + palette (§3) + rhythm (§4) + key/bpm/voice (§5)
Arcs: colour (how the palette moves across the film) · growth (what gets bigger, worse or nearer each time)
Energy + hook: route (continuous|montage|hybrid), 0–10 per shot, what moves in the first 3 s (styles.md §4b)
Per shot: name · time span · one-sentence cause→effect · out: how it hands over to the next shot
          props (static sprites) · moving things (rope/particles/puppets) · camera start→end
          melody notes in this bar and what each one triggers visually · foley + ambience bed
```

The `out` column carries the film: it reads as one chain reaction (steam → note → birds → petals → girl), which makes 10 s a story and not a slideshow (shot-contract §7). Then hold the brief against the look's example: ≥ 4 of 6 rows differ (craft-checks §3). Given a reference video, run `scripts/breakdown.py <video>` first and copy its mechanism, not its pixels.

**Length and shot count come from the theme**, not a default; state the reason in one line.

| theme shape | total | shots | rhythm |
|---|---|---|---|
| mood piece, one image breathing (a moon rising, rain on a window) | 5–10 s | 1–2 long shots | slow bpm 60–80, EXPO 6–8, long holds |
| cause→effect chain (Steam Song, Red Kite, 婵娟) | 8–15 s | 3–5 | 90–110 bpm, 2–3 s per shot |
| story with a turn (setup → trouble → resolution) | 15–30 s | 5–8 | vary shot length: short for action, long for the payoff |
| greeting card / festive / loop for social | 6–12 s | 5–8 short shots | 120–132 bpm, 1–1.5 s cuts on the beat, final hold ≥ 1.5 s |
| poem or quote, one line per shot | ~2.5 s per line + 1.5 s end hold | one per line | tempo from the reading pace |

Give the payoff shot 1.3–1.6× the others. Every shot costs about the same to build and verify; past ~9 shots or 30 s, build in chapters (`references/long-film.md`) or split the film.

### 2. Scaffold
```bash
python3 <skill-dir>/scripts/scaffold.py <out>.html --title "Name" --format portrait --shots "Cup,Wire,Tree,Girl" --durs "2,2.5,3.5,2" --bpm 96 --bed room --aria "one-sentence description"
```
Write `<out>.html` in the user's folder, never the skill folder. `--durs` sets each shot (else `--dur` is split evenly). Every cut sits on the eighth-note grid (30/bpm s; the script warns), and `DUR × 60` must be whole or the MP4 ends a frame short. Pixel art: `--pixel 8`, characters at 2× (1× was rejected), `references/looks/pixel.md` first.

### 3. Sample one shot first
Fill the palette (`Object.assign(C, {...})`), `MELODY`, `baseScore()` beds and **shot 1 only**; verify it (step 5) and show the user. Style problems are cheap at one shot. When the look or a character is new to this user, render shot 1's key frame three ways and let them pick, even if they named a style. A look imitating a real tradition (皮影, 年画, 剪纸, ukiyo-e…): list the construction rules real examples share (museum photos) and get a static cast sheet approved first (射日: drawn from memory, rejected; reference-checked, passed). Animals and people: real anatomy from a photo, then the action sheet and faces at final size (craft-checks §1–2).

### 4. Write the remaining shots
Follow `references/shot-contract.md`: hard cuts on the beat unless a shot opens with an `enter` transition (§7c); `draw()` reads only snapshot state, puppets get `boil()`; no `Math.random()` in `step`/`draw` (`rng(seed)` from `reset()`, or `hash()`); pre-run physics in `reset()`; props crossing shots are shared rigs; every melody note has a visible cause or effect. Portrait: action runs vertically, inside the middle 60 %.

### 4b. Narration (only when the user asks for a voice)
`references/narration.md`: one line per shot at ~5.3 字/s, free `scripts/narrate.py` or MiniMax `scripts/voice.py` (key from `.env` only), embedded via `VO.src`, no ambience bed under the voice. Then `scripts/voice_check.py <film>.html`: each line transcribes back, or gets listened to. Pronunciation stays UNVERIFIED.

### 4c. Sound pass (films whose sound matters)
Once the picture is approved: `python3 scripts/audio_director.py <film>.html --mood <mood> --key <key> --run --check`. PASS means measured, not auditioned. Downloads need no per-file OK; log every one in `sources.json`. A film without an `SMP` object must be re-scaffolded first.

### 4d. Fact check (films that state facts)
`references/fact-check.md`: search the claims while briefing, then `scripts/fact_check.py <film>.html --init`, fill `facts.json` (text and `visual` claims) from sources read in this run, require `FACT CHECK PASS`, re-run after every text edit, report `disputed` items. A simplified picture says 示意 on screen (`schematic` + `label`).

### 5. Verify (real renders, not assumptions)
1. `python3 scripts/stills.py <film>.html --shots` (or `--at`) and look at every still, first frames included: does the hero read, is anything cropped, floating or factually wrong (Edo was once drawn on the wrong coast)?
2. `scripts/qa.py <film>.html` (platform portrait: `--safe 0.12,0.2`) → `QA PASS`, then `scripts/pace.py <film>.html` → `PACE PASS`. Their clues and STILL notes are frames to look at, not failures.
3. The browser checks in `references/verify.md`: console, `__film.wav()` and `audio()`, playback across a cut.
4. A film that may be published or used commercially embeds its fonts: `scripts/font_embed.py` (`--check` catches a stale subset).

Report what you did not check (audio not listened to, `poke` not click-tested).

### 5b. Independent review (films anyone else will see)
A reviewer who took no part in the film sees only it, its stills and the `qa.py` strips (`references/review.md`). Directors report it as pending.

### 6. Deliver the web version, then stop
Deliver **only the HTML**: its path, the controls (Space play, S stop-motion/smooth, 1–N jump to shot, ←/→ one exposure, M mute, click/drag to poke), what was and wasn't verified, and a clear question: approve it for rendering, or name what to change. No video at this step, even for a platform: every render goes stale at the next change.

### 7. Revision loop (web only)
Each round: edit the HTML, re-verify (step 5), deliver the HTML. Never render to verify. Repeat until the user explicitly approves the web version.

### 8. Render the video (only after explicit approval)
On an explicit go ("没问题了，渲染吧", "OK, export it"): `python3 scripts/export.py film.html` (master) or `--scale .75 --crf 23` (upload copy), then the three checks in `references/export.md`. An approval doesn't survive later changes. "看起来不错" with no word about rendering: ask.

## Extending
- After every film: what worked, with evidence → `references/lessons.md`; a new pitfall → that look's file.
- A new look, palette or music mood only from verified films: looks follow `references/new-look.md`; palettes and moods are rows in `references/styles.md`.
- New sound voice: a method on the film's `Sound` class plus a `case` in `play()`. New format: `FORMATS` in `scaffold.py` (tall formats reserve 290 px for the control bar, `{{UIH}}`).
