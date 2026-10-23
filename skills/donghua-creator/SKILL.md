---
name: donghua-creator
description: "自媒体场景包：把一个选题做成能直接发抖音/视频号/小红书的竖屏动画短片——前 3 秒钩子、平台安全区、文字不重叠、免费解说+字幕、可商用字体与素材授权清单、封面和各平台标题/简介/话题一起打包。建立在 donghua-maker 底座之上。Use when a creator / 自媒体 / 博主 / 抖音 / 小红书 / 视频号 / 短视频 / 涨粉 / 发布 is mentioned, or the user wants a vertical short to post. 不处理：讲课微课（用 donghua-classroom）、代发平台（只出发布包，人工上传）、视频渲染（按底座 §8 需用户批准）。"
license: MIT
compatibility: "Needs donghua-maker installed in the same skills folder; Python 3.10+, Playwright, edge-tts (network) for narration."
metadata:
  repo: "https://github.com/Eleven1111/donghua-maker"
---

# Donghua creator: self-media shorts

This is the creator film type of `donghua-maker`: a topic as a 9:16 vertical short with a publishing kit.
Read `../donghua-maker/SKILL.md` (the director), then `../donghua-maker/crew/types/creator.md` (this film type; it overrides the director's defaults).
Scripts stay here in `scripts/`: `platform_check.py`, `publish_kit.py`, `filmprobe.py` (shared helper).
