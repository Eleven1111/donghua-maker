---
name: donghua-classroom
description: "老师场景包：把一个知识点、一段教案或课本内容做成讲课用的动画微课——16:9、有解说和字幕、按学段控制语速和新词量、带课后小测和讲义、字体可商用。建立在 donghua-maker 底座之上（引擎、画风、画面自检、事实核对、音频）。Use when a teacher / 老师 / 备课 / 微课 / 课件动画 / 讲课素材 / 某年级某课 is mentioned, or the input is a lesson plan or textbook section. 不处理：自媒体短视频（竖屏、钩子、平台打包）、视频渲染（按底座 §8 需用户批准）。"
license: MIT
compatibility: "Needs donghua-maker and donghua-creator installed in the same skills folder (gate 1 runs donghua-creator's platform_check.py); Python 3.10+, Playwright, edge-tts (network) for narration."
metadata:
  repo: "https://github.com/Eleven1111/donghua-maker"
---

# Donghua classroom — 讲课微课

This is the classroom film type of `donghua-maker`: a lesson as a 16:9 narrated micro-lesson with quiz and handout.
Read `../donghua-maker/SKILL.md` (the director), then `../donghua-maker/crew/types/classroom.md` (this film type; it overrides the director's defaults).
Scripts stay here in `scripts/`: `lesson_check.py`.
Needs `donghua-creator` installed too: the reading gate runs its `platform_check.py`.
