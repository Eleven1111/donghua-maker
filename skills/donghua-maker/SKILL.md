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

## The crew

The director (this file) runs the film; each phase reads only its own handbook.

| handbook | phase it covers | when to read |
|---|---|---|
| `crew/story.md` | step 1 brief, shot table, cut plan; fact check; long films | before the brief; the factual / long-film parts on demand |
| `crew/picture.md` | steps 2-5 scaffold, shot code, looks, characters, stills, pace | before scaffolding; on-demand parts by trigger |
| `crew/sound.md` | step 4c sound pass; step 4b narration | before the score; narration only when the user asks for a voice |
| `crew/review.md` | step 5 browser checks, fonts, 5b independent review, export | before delivering |
| `crew/types/<type>.md` (general / classroom / creator) | the film type: format, length, voice, gates and deliverables | step 1, once the type is picked; it overrides the defaults in this file and the handbooks |

## One-sentence mode (director)
A whole film from one line with no questions (「一句话出片」): hand it to the `donghua-director` agent, which takes the film type (a lesson → classroom, a social short → creator, otherwise general).
A terminal without subagents opens `directors/<name>.md` with `<name>` = `donghua-director` (put there by `install.sh`) and follows it itself.

## Workflow

### 0. Machine and user
First use on a machine: `python3 scripts/doctor.py` (dependencies, and which keys are set, never their values); ask before installing anything. Then `python3 scripts/profile.py find`: a profile sets the brief's defaults (`references/onboarding.md` §1, §4). Without one, open your first reply with a one-line confirmation of what your terminal already knows about the user, or the three (plus one optional) questions the script prints, and save with `profile.py save`. A specific request never waits: make the film and offer to save a profile at the end.

### 1. Brief (story before code)
Pick the film type first (a lesson → classroom, a social short → creator, otherwise general) and read its sheet, `crew/types/<type>.md`.
Produces the shot table: look, palette, rhythm, key/bpm, and per shot its cause→effect and `out`; length and shot count come from the theme, with the reason in one line. Read `crew/story.md` › Brief and Not the demo again. For a factual film, search the claims while briefing (`references/fact-check.md`) and label every drawing not to scale 示意 / 示意图 in the shot it appears in (`crew/story.md` › Schematic label). Gate: at least 4 of the 6 rows differ from the look's example film. Past about 9 shots or 30 s the build-and-verify cost grows; film-type ranges come from the film type (creator 6–10 shots, classroom up to 90 s); split into chapters (`references/long-film.md`) past ~60 s or ~11 shots, the longest verified single file (the catalog's 60 s, 11-shot example).

### 2. Scaffold
Produces the skeleton HTML (engine, empty shots, timeline) from `scripts/scaffold.py`. Read `crew/picture.md` › Scaffold. Gate: it runs with no off-the-grid warning, and `DUR × 60` is whole.

### 3. Sample one shot first
Fill the palette (`Object.assign(C, {...})`), `MELODY`, `baseScore()` beds and **shot 1 only**; verify it (step 5) and show the user. Style problems are cheap at one shot. When the look or a character is new to this user, render shot 1's key frame three ways and let them pick, even if they named a style. A look imitating a real tradition (皮影, 年画, 剪纸, ukiyo-e…): list the construction rules real examples share (museum photos) and get a static cast sheet approved first (射日: drawn from memory, rejected; reference-checked, passed). Animals and people: real anatomy from a photo, then the action sheet and faces at final size (`crew/picture.md` › Characters: rigs and faces).

Gate: the user has seen shot 1 (and approved the static cast sheet, where one applies) before shots 2–N are written.

### 4. Write the remaining shots
Produces the rest of the story layer against `references/shot-contract.md`. Read `crew/picture.md` › Write the remaining shots (and Characters: rigs and faces, Transitions, when they apply). Gate: every shot hands over to the next (`out`) and every melody note has a visible cause or effect; then step 5.

### 4b. Narration (only when the user asks for a voice)
Produces `<film>-vo/` clips embedded via `VO.src`, burned-in subtitles and an `.srt`. Read `crew/sound.md` › Narrated film. Gate: `scripts/voice_check.py <film>.html`: each line transcribes back or gets listened to; pronunciation stays UNVERIFIED.

### 4c. Sound pass (films whose sound matters)
Produces the recorded sfx, the music bed and the mix, once the picture is approved. Read `crew/sound.md` › Sound pass. Gate: `scripts/audio_director.py … --check` prints PASS (measured, not auditioned); when it is not run (no downloads, or a synthesised-only score), the browser check is the gate (`crew/sound.md` › Sound pass).

### 4d. Fact check (films that state facts)
Produces `<film>-facts/facts.json`, every on-screen claim sourced. Read `crew/story.md` › Factual film (it points to `references/fact-check.md`). Gate: `FACT CHECK PASS`, re-run after every text edit.

### 5. Verify (real renders, not assumptions)
Stills, `qa.py`, `pace.py`, then the browser checks. Read `crew/picture.md` › Verify and Pace, then `crew/review.md` › Step 5 in the browser and Reading hold. Gate: every still looked at, `QA PASS`, `PACE PASS`, zero console errors, fonts embedded if the film may be published; report what you did not check.

### 5b. Independent review (films anyone else will see)
Produces a blind reviewer's findings on the film, its stills and the `qa.py` strips. Read `crew/review.md` › Independent review (`references/review.md`). Gate: the findings are reported (fixed or left to the user), or reported as pending.

### 6. Deliver the web version, then stop
Deliver **only the HTML**: its path, the controls (Space play, S stop-motion/smooth, 1–N jump to shot, ←/→ one exposure, M mute, click/drag to poke), what was and wasn't verified, and a clear question: approve it for rendering, or name what to change. No video at this step, even for a platform: every render goes stale at the next change.

### 7. Revision loop (web only)
Each round: edit the HTML, re-verify (step 5), deliver the HTML. Never render to verify. Repeat until the user explicitly approves the web version.

### 8. Render the video (only after explicit approval)
On an explicit go ("没问题了，渲染吧", "OK, export it"): `python3 scripts/export.py film.html` (master) or `--scale .75 --crf 23` (upload copy), then the three checks in `references/export.md`. An approval doesn't survive later changes. "看起来不错" with no word about rendering: ask.

## Extending
- After every film: what worked goes into the handbook of its phase as an entry with **Evidence** (what was measured or approved, on which film), **Why** and **Use**; reusing an entry and it works, add the film to its evidence, and when it fails, write down where it stopped working. A new pitfall → that look's file.
- A new look, palette or music mood only from verified films: looks follow `references/new-look.md`; palettes and moods are rows in `references/styles.md`.
- New sound voice: a method on the film's `Sound` class plus a `case` in `play()`. New format: `FORMATS` in `scaffold.py` (tall formats reserve 290 px for the control bar, `{{UIH}}`).
