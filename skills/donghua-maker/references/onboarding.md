# Onboarding: know the user before the first brief

A film for a primary-school teacher, a finance blogger and a SaaS founder differs in format, look, pace, words on screen and where it ends up. Learn who the user is **once**, keep it in one local file every terminal shares, and let it set the defaults of every brief after that.

## 1. Read the profile (every session, before step 1 Brief)
```bash
python3 <skill-dir>/scripts/profile.py find
```
- `PROFILE …` → use it (§4). Don't ask again. If today's request clearly contradicts it (a teacher asking for a product promo), follow the request and, at the end, offer one line to update the profile.
- `NO PROFILE` → §2, then §3 if still unknown.

## 2. Learn from what the terminal already knows
1. **Your own context first.** If your system prompt or loaded memory already says who the user is (Claude Code `CLAUDE.md` and auto memory, Codex `AGENTS.md`, WorkBuddy `USER.md`/`IDENTITY.md`, OpenClaw `USER.md`, Gemini `GEMINI.md`…), use it; that needs no file access.
2. **Then your own terminal's files** from the `find` list. Read only the files that belong to the terminal you are running in, and take only the profile fields: background/role, the kind of videos, audience, platforms, style likes and dislikes, language. Ignore everything else there (projects, people, keys, finances). Never read another terminal's files unless the user says so.
3. Draft the profile from that and **show it to the user in two or three lines before saving**: 「我从你的记忆里了解到：你是…，主要做…。按这个来做，对吗？」 Save only after they confirm or correct it.

## 3. Ask, when nothing is known (one message, then get to work)
Ask at most these, together, in the user's language, and say they can skip:
1. 你是做什么的？（如 老师 / 自媒体博主 / 产品或市场 / 学生 / 独立开发者 / 其他）
2. 主要想用它做哪类片子？（讲课微课 / 抖音·小红书短视频 / 产品介绍 / 儿童故事 / 知识科普 / 艺术短片 / 其他）
3. 给谁看、发在哪里？
4. （可选）喜欢或不想要的风格？

If the user skips or the request is already specific ("做一个 12 秒的小猫钓鱼黏土动画"), don't block: make the film, choose the defaults yourself and say so, and ask once at the end whether to save a profile.

Save with:
```bash
python3 <skill-dir>/scripts/profile.py save --role "初中数学老师" --tasks "讲课微课" --audience "初二学生" --platforms "课堂投屏" --likes "黑板、手绘" --avoid "太花哨的转场"
```
The file is `~/.config/donghua/profile.md` (or `$DONGHUA_PROFILE`), plain Markdown, local only. Tell the user where it is and that they can edit or delete it.

## 4. How the profile changes the brief
| profile says | default |
|---|---|
| teacher, 讲课, 课堂 | `donghua-classroom` pack: 16:9, narration + subtitles, pace by grade, quiz and handout; looks `chalkboard`, `explainer`, `flatsci`, `blueprint` |
| 自媒体, 抖音/视频号/小红书 | `donghua-creator` pack: 9:16, 3-second hook, safe areas, publish kit; looks `layered`, `kinetic`, `biz-explainer`, `comic` |
| product, SaaS, 市场 | `ui-demo`, `isometric`, `kinetic`; 16:9 for sites, 9:16 for social; claims go through the fact gate |
| children's stories, 绘本 | `torn-paper`, `paper3d`, `clay3d`, `watercolor`, `voxel`; slower bpm, no on-screen jargon |
| art, 实验, 生成艺术 | the generative looks (`flow-ribbon`, `growth`, `bloom`, `vangogh`…), music-led, few words |
| likes / avoid | shortlist or strike looks; an explicit request in the session always wins |
| language | on-screen text and narration language |

State in the brief which defaults came from the profile ("按你的档案：初二课堂，16:9 黑板风"), so the user can correct them in one word.

## Rules
- Local only: never send the profile anywhere, never put it in a film, a repo or a publish kit.
- Never copy secrets, contacts, money or health details into the profile, even if a memory file contains them.
- One profile per machine; a user who wants a different default for one film just says so.
