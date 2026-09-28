---
name: donghua-classroom
description: "老师场景包：把一个知识点、一段教案或课本内容做成讲课用的动画微课——16:9、有解说和字幕、按学段控制语速和新词量、带课后小测和讲义、字体可商用。建立在 donghua-maker 底座之上（引擎、画风、画面自检、事实核对、音频）。Use when a teacher / 老师 / 备课 / 微课 / 课件动画 / 讲课素材 / 某年级某课 is mentioned, or the input is a lesson plan or textbook section. 不处理：自媒体短视频（竖屏、钩子、平台打包）、视频渲染（按底座 §8 需用户批准）。"
license: MIT
compatibility: "Needs donghua-maker installed in the same skills folder; Python 3.10+, Playwright, edge-tts (network) for narration."
metadata:
  repo: "https://github.com/Eleven1111/donghua-maker"
---

# Donghua classroom — 讲课微课

Scene pack on top of `donghua-maker`. The base does the drawing, the gates and the sound. This pack decides **what to teach, in what order, at what pace**, and adds three things a teacher needs: a voice with subtitles, a quiz, and a handout.

Read first: `../donghua-maker/SKILL.md` (§1–5 and 4d), `../donghua-maker/references/fact-check.md`, then the look file you pick.

Before step 1, run the base skill's step 0 (`../donghua-maker/scripts/profile.py find`, `../donghua-maker/references/onboarding.md`): a saved profile fills in the grade, subject and classroom setup, so you ask less.

## 1. Intake: turn the request into lesson.json
Input can be one sentence ("初二勾股定理"), a pasted 教案 or a textbook section. Fill `<film>-lesson/lesson.json` (schema in `scripts/lesson_check.py`):

- **grade**: a year (初二) or a stage (小学/初中/高中). If the user gives none, pick the stage where the topic is taught in the 人教版 curriculum and say so.
- **objectives**: 1–3, written as what a student can do afterwards ("能说出…", "会用…算…"), each with the shots that teach it.
- **terms**: every new term, with the shot where it first appears and a plain-words gloss.
- **misconception**: one common wrong idea for this topic, and the shot that corrects it. Search for it (教研文章, 易错题) rather than guessing.
- **recap_shot**: the last shot restates the objectives in one picture.
- **quiz**: at least 3 items (高中 4), each tied to an objective with an `evidence` quote that the film actually says or shows.

If the teacher supplied material, their wording, order and examples win. Don't add content they didn't ask for, and flag anything in it that fails the fact check. Don't silently fix it.

## 2. Shape of a classroom film
- **Format**: scaffold with `--format landscape --narrated` (16:9, for projectors and PPT; `--narrated` leaves out the ambience beds, which hiss under a voice). **Look**: `explainer` by default; `pixel` in its diagram variant (`--pixel 4`) for CS topics, `biz-explainer` for economics and data. Use a story look (clay3d, torn-paper, watercolor…) only for 小学 language and story lessons.
- **Length**: 45–90 s, 5–9 shots. One objective takes 1–2 shots. Over 90 s, split into two films (one per objective group).
- **Order**: question or phenomenon → name the parts (terms) → the idea → worked example → misconception → recap.
- Each shot has one idea, said once in the voice and written once on screen. Labels and formulas land on the word that names them (bookmarks, §3).

| stage | voice rate | max chars/s | pause before cut | new terms per shot | quiz |
|---|---|---|---|---|---|
| 小学 primary | `-15%` | 4.2 | 0.7 s | 1 | 3 |
| 初中 junior | `-8%` | 4.8 | 0.5 s | 2 | 3 |
| 高中 senior | `+0%` | 5.4 | 0.4 s | 2 | 4 |

Budget each shot's line as `(shot length − lead − pause) × max chars/s` characters. Write for the ear: short clauses, the subject first, no "如图所示".

## 3. Voice, bookmarks, subtitles (base: `narrate.py`)
1. Give every labelled moment a cue field in its shot (`LAB: 1.2,` = fallback seconds), and use that field in `step`/`draw` for the pop-in.
2. Write `<film>-vo/script.json` with one line per shot and `{FIELD}` right before the word that should trigger it:
   `{"shot": 2, "text": "直角对面这条最长的边，叫{HYP}斜边。"}`. Default voice `zh-CN-XiaoxiaoNeural`; `zh-CN-YunxiNeural` for a male voice. Use the rate from the table.
3. `python3 ../donghua-maker/scripts/narrate.py <film>.html` → NARRATE PASS. It writes the NARRATION block, the burned-in subtitles (press C to toggle, or `?subs=0`) and `<film>-vo/<film>.srt`. If a line overruns, shorten the text; never speed it up past the stage's rate.
4. Sound under a voice: the base's audio rules for narration apply (no ambience bed, quiet `mb`, keep only picture-tied sfx). Run `audio_director.py` with a calm mood (`calm-tech`, `thoughtful`) after narration so ducking sees the voice. Its `offGrid` list will name the bookmark-timed cues. That list is informational: word-timed labels are meant to sit off the music grid.

## 4. Fonts (base: `font_embed.py`)
Run `python3 ../donghua-maker/scripts/font_embed.py <film>.html` after the last text change. It embeds 霞鹜文楷 (labels) and Noto Sans SC (subtitles), both SIL OFL, so the film looks the same on the classroom PC and may be used commercially. `--check` must PASS.

## 5. Gates (all must pass on the final file)
1. `stills.py --shots` and key moments: 0 page errors. Formulas and labels are readable at projector distance, meaning at least 1/25 of the frame height.
2. `fact_check.py` PASS. The narration lines are on-screen strings for the gate too, so every spoken fact is sourced.
3. `narrate.py --check` PASS; `font_embed.py --check` PASS; `audio_director.py --check` PASS.
4. `python3 scripts/lesson_check.py <film>.html` → LESSON CHECK PASS (structure).
5. **Blind reader.** The one who wrote the quiz can't grade it. A fresh-context reader (the main conversation dispatches a new agent; the classroom-director can't do this itself) reads only `<film>-lesson/blind/packet.md` and the stills it lists, then writes `answers.json`. Then run `lesson_check.py <film>.html --blind`: it needs ≥ 80 %. A missed item means the film didn't teach it. Fix the evidence shot, not the question. The packet lists every still in `<film>-stills/` and the on-screen text, so any change to the film, the quiz or the set of stills changes its sha and makes the answers stale. Re-shoot the stills before you build the packet, not after.

## 6. Deliver
- `<film>.html`: 16:9, voice and subtitles. Teachers can open it in a browser or embed it in a PPT as a web object; the MP4 comes only after approval (base §8).
- `<film>-vo/<film>.srt`
- `<film>-lesson/讲义.md`: objectives, terms, misconception, shot-by-shot script, student quiz, answers with explanations, sources, licences. It is generated by `lesson_check.py`, so don't hand-edit it; edit `lesson.json`.
- The report states the grade and stage you assumed, the blind score, and what is UNVERIFIED (always: nobody has listened to the voice; a teacher hasn't used it in class).
