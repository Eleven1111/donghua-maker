# donghua-maker

**一句话生成动画短片**：一个 [Claude Code](https://claude.com/claude-code) 技能加一个 Agent。输入一句主题（"做一个日本历史快速讲解的动画"），自动产出一部**单文件 HTML** 动画短片：Canvas 2D 画面加 Web Audio 声音，全部由代码生成，浏览器里直接播放，也能逐帧导出 MP4。

A Claude Code skill + agent that turns a one-line idea into a self-contained HTML animated short (Canvas 2D + Web Audio), with visual self-checks, a sourced fact gate and an automatic sound pass.

## 功能

- **14 种画面风格**，每种都有验证过的示例片：纸艺定格（默认）、撕纸拼贴绘本、皮影戏、黏土、水彩、美漫分镜、手绘科普笔记、像素农场、像素技术图解、商务财经图解、可爱软件产品演示等。
- **金屏说史 · 历史讲解系列**（`scaffold.py --goldscroll`）：固定的节目格式，每回 60 秒、11 个镜头。
  - 结构：金箔屏风片头 → 年份滚轮和时间轴 → 河流地图行军 → 夜江剪影 → 火攻高潮 → 辨误卡 → 对峙分屏 → 片尾悬念；
  - 每条字幕都要经过事实核对，有争议的说法在画面上注明；
  - 示例：第一回 赤壁之战。
- **流场色带风**（`scaffold.py --flowribbon`）：生成艺术风格。
  - 画面：粗色带顺着看不见的风流动，互不重叠，会绕开画面中留白的"风眼"，标题或物体就放在风眼里。
  - 场型有三种：普通风、绕障碍、旋涡；配色有暖纸和夜色两套。
  - 粗色带踩着旋律音符入场。
  - 示例：风的形状。
- **十三种新风格**（`scaffold.py --look <名字>`），每种都有 12 秒示例和一份风格说明书：
  - 数据极简 `datamin`（光速）；
  - 谐波运动 `harmonic`（圆与波）；
  - 简笔漫画 `brushsketch`（放风筝）；
  - 浮世绘 `ukiyoe`（浪里行舟）；
  - 博物版画 `naturalplate`（海里的几何）；
  - 梵高厚涂 `vangogh`（麦浪与星夜）；
  - 修拉点彩 `seurat`（河岸的午后）；
  - 青绿长卷 `qinglu`（江山市井图，清明上河图 × 千里江山图）；
  - 写意水墨 `inkwash`（清水游虾）；
  - 敦煌壁画 `dunhuang`（飞天）；
  - 格子构成 `mondrian`（格子里的节奏）；
  - 康定斯基构成 `kandinsky`（点线面）；
  - 剪纸拼贴 `cutout`（海藻与星）；
  - 规则粒子 `process`（规则的痕迹）；
  - 弹性线条 `elastic`（弹一弹）；
  - 差分生长 `growth`（生长）；
  - 等距几何 `isometric`（积木城）；
  - 粒子流体 `datafluid`（数据之海）；
  - 发光花 `bloom`（花开无界）；
  - 欧普艺术 `opart`（起伏）；
  - 年画 `nianhua`（年年有余）；
  - 镶嵌变形 `tessellation`（方与鱼）；
  - 沙画 `sandart`（沙上月）；
  - 字符画 `ascii`（字符宇宙）。
- **3D 积木拼装风**（`scaffold.py --three`）：three.js r158 直接内嵌进片子，仍是离线可播的单文件。用 ASCII 分层图写模型，自动拆成标准积木；积木旋转落下拼装，带运动模糊；最后是说明书翻页，页面上的步骤图由实时渲染生成。
- **定格质感引擎**：每秒 12 次摆位、镜头平滑运动、纸纹、胶片颗粒、曝光闪烁；跳转任意帧结果都一样，可复现。
- **一句话出片 Agent（`donghua-director`）**：自己选风格、画幅、时长和分镜，然后写镜头，过三道关卡后交付网页版，中间不问人。
- **事实核对关卡**（`fact_check.py`）：片中每一句屏幕文字都必须登记为三种状态之一：已核实（附来源网址）、有争议（写明另一种说法）、非事实（注明原因）。地图方位这类画面事实也要登记。片子改过字，旧的核对记录自动失效。
- **画面自检**（`stills.py`）：截出每个镜头开头、中间、结尾的原尺寸静帧，拼成一张总览图，页面报错时判失败。
- **音频流程**（`audio_director.py`）：
  - 背景音乐：自动规划段落 → 生成 MIDI → 用 SoundFont 渲染；
  - 音效：先找授权录音（本地库 → Mixkit → Freesound），找不到的类别由代码合成；
  - 混音：分角色母线，音乐自动给音效和人声让位；
  - 自带无头浏览器验收，冷启动约 15 秒。
- **导出**（`export.py`）：H.264 + AAC，两遍响度标准化到 −16 LUFS，可导出分轨。
- **免费解说 + 字幕**（`narrate.py`）：
  - 用 edge-tts 生成中文语音，免费，不需要 key。
  - 解说稿里的 `{书签}` 能让画面标签卡在对应的词上出现。
  - 自动烧入字幕（按 C 开关），同时导出 `.srt` 文件。
  - 解说超出镜头时长就判失败。
- **可商用字体**（`font_embed.py`）：嵌入霞鹜文楷和 Noto Sans SC（均为 SIL OFL 许可），只保留片中用到的字，并记录授权。
- **MiniMax 中文解说**（可选，付费）：`voice.py`，默认不启用。
- **老师场景包**（`donghua-classroom` 加 `classroom-director` Agent）：一句话（如"初二勾股定理"）或一段教案，就能生成讲课用的 16:9 微课：
  - 按学段控制语速、停顿和新词数量；
  - 包含学习目标、易错点、回顾和课后小测；
  - 自动生成讲义；
  - **盲测关卡**：没看过脚本的新读者只看影片内容答题，正确率要达到 80% 才能通过。
- **自媒体场景包**（`donghua-creator` 加 `creator-director` Agent）：一句选题，就能生成可发抖音、视频号、小红书的 9:16 竖屏短片和发布包：
  - **平台关卡**：逐帧读取片中实际画出的文字，检查它是否在平台安全区内、会不会被小红书的 3:4 裁切切掉、文字之间有没有重叠，以及前 3 秒的钩子是否到位；
  - **发布包**：包括两种比例的封面、各平台的标题/简介/话题（有字数检查）和授权清单。素材授权不可商用或来源不明就判失败，CC-BY 素材自动署名；
  - 只导出文件，不代发任何平台。

## 安装

```bash
git clone https://github.com/Eleven1111/donghua-maker.git
cp -R donghua-maker/skills/donghua-maker ~/.claude/skills/
cp donghua-maker/agents/donghua-director.md ~/.claude/agents/
# 老师场景包（依赖上面的底座，两个技能要放在同一个 skills 目录下）
cp -R donghua-maker/skills/donghua-classroom ~/.claude/skills/
cp donghua-maker/agents/classroom-director.md ~/.claude/agents/
# 自媒体场景包
cp -R donghua-maker/skills/donghua-creator ~/.claude/skills/
cp donghua-maker/agents/creator-director.md ~/.claude/agents/
```

依赖：
- **必需**：Python 3.10+、`ffmpeg`、`playwright`（Python 版），再加 Google Chrome，或运行 `python3 -m playwright install chromium`。
- **解说和字体**：`pip install edge-tts fonttools`。edge-tts 需要联网；字体第一次使用时下载到 `~/.cache/donghua-fonts/`。
- **可选**：
  - `fluidsynth` 加 GeneralUser GS SoundFont，用于渲染背景音乐。默认路径 `~/.local/share/soundfonts/GeneralUser-GS.sf2`，可用环境变量 `SOUNDFONT` 另指。
  - `FREESOUND_API_KEY`：多一个音效来源。
  - `MINIMAX_API_KEY`：生成中文解说。

密钥只从环境变量或 `~/.config/secrets/.env` 读取，脚本不会打印它们。

## 使用

在 Claude Code 里：

```
用 donghua-director 做一个讲光合作用原理的科普动画
用 classroom-director 做一节初二勾股定理的微课
用 creator-director 做一条抖音和小红书的短视频：为什么猫咪爱钻纸箱
```

老师场景包做完后，由主会话另派一个新上下文的 Agent 只看 `film-lesson/blind/packet.md` 答题，然后运行 `lesson_check.py film.html --blind`。

或者手动走技能流程（详见 `skills/donghua-maker/SKILL.md`）：

```bash
S=~/.claude/skills/donghua-maker/scripts
python3 $S/scaffold.py film.html --title "片名" --format landscape --shots "A,B,C" --durs "4,4,4" --bpm 120
python3 $S/stills.py film.html --shots                         # 画面自检
python3 $S/fact_check.py film.html --init                      # 生成事实清单，填好后：
python3 $S/fact_check.py film.html                             # → FACT CHECK PASS
python3 $S/narrate.py film.html                               # 读 film-vo/script.json → 解说、书签、字幕、.srt
python3 $S/font_embed.py film.html                             # 嵌入可商用字体（改完文字后重跑）
python3 $S/audio_director.py film.html --mood cute --key C --run --check
python3 $S/export.py film.html -o film-1080.mp4 --scale .75 --crf 23   # 网页版确认后再导出
python3 $S/export.py film.html -o film-3x4.mp4 --aspect 3:4 --scale .75 --crf 23   # 竖屏片的小红书 3:4 版
```

## 输出结构

```
film.html                 单文件成片（引擎 + 镜头 + 嵌入的音频）
film-facts/facts.json     每条屏幕文字的核对记录：状态、来源、备注
film-audio/               音频方案、bgm.mid/.wav、编码后的音效、sources.json（来源与授权）
film-vo/                  script.json（解说稿与书签）、语音片段缓存、film.srt
film-fonts/               sources.json 与 OFL 许可原文
film-lesson/              老师场景包：lesson.json、讲义.md、blind/（盲测材料与答卷）
film-publish/             自媒体场景包：pack.json、cover-9x16.jpg、cover-3x4.jpg、发布包.md、.srt
film-stills/              静帧与 sheet.jpg（已被 .gitignore 忽略）
film-1080.mp4             导出成片（只在确认后生成）
```

成片测试接口：`?t=3.2` 从 3.2 秒开始，`?ui=0` 只显示画面，`?subs=0` 关闭字幕，另有 `window.__film.seek(frame)`、`.info()`、`.score()`、`await .wav()`、`.audio()`。

## 目录

```
agents/
  donghua-director.md        一句话出片 Agent
  classroom-director.md      老师一句话出微课 Agent
skills/donghua-classroom/    老师场景包（建立在底座之上，不改引擎）
  SKILL.md                   学段节奏表、课程结构、解说/字幕/字体/盲测流程
  scripts/lesson_check.py    课程关卡：目标、关键词、语速、停顿、小测证据、盲测 → 讲义.md
skills/donghua-creator/      自媒体场景包（建立在底座之上，不改引擎）
  SKILL.md                   钩子、竖屏构图、文案规则、平台关卡、发布包
  scripts/platform_check.py  安全区 / 3:4 裁切 / 文字重叠 / 钩子
  scripts/publish_kit.py     封面、各平台文案、授权清单 → 发布包.md
skills/donghua-maker/        底座
  SKILL.md                   完整工作流：分镜 → 骨架 → 镜头 → 音频 → 事实核对 → 验证 → 交付 → 导出
  assets/engine.html         引擎模板
  assets/example-*.html      每种风格验证过的示例片
  assets/toolkit-brick3d.js  3D 积木工具（--three 时注入）
  assets/toolkit-goldscroll.js 金屏说史模块库（--goldscroll 时注入）
  assets/toolkit-flowribbon.js 流场色带模块库（--flowribbon 时注入）
  assets/toolkit-<look>.js    其他风格的模块库（--look <look> 时注入：datamin / harmonic / brushsketch / ukiyoe / naturalplate / vangogh / seurat / qinglu / inkwash / dunhuang / mondrian / kandinsky / cutout / process / elastic / growth / isometric / datafluid / bloom / opart / nianhua / tessellation / sandart / ascii）
  assets/lib/                three.js r158（MIT，附 LICENSE 与 sources.json）
  references/                镜头接口、各风格工具箱（looks/）、配色与节奏、音频、事实核对规范
  scripts/                   scaffold / stills / fact_check / audio_director / music_render /
                             sfx_search / sfx_import / export / voice / narrate / font_embed
```

## 设计理念

- **单文件**：一部片子就是一个 HTML 文件，没有构建步骤，改完刷新就能看。
- **先网页后视频**：所有修改都在浏览器里完成，确认之后才导出 MP4。
- **确定性**：不用 `Math.random()`，随机都由种子控制。任意一帧都能复现，离线混音和实时播放的结果一致。
- **靠关卡，不靠自评**：画面、事实、音频各有一道能判失败的检查，每道都用负控测试过（故意改坏必须判失败）。核对关卡只能证明"每条都查过、有来源"，不能代替人的判断。
- **一个底座，多个场景包**：引擎、画风和关卡属于底座；场景包只调整输入、关卡和产出，不改引擎。
- **经验沉淀成规则**：每次被否决的输出都写成一条可检验的规则，放进风格文档。

## 授权与致谢

- 代码和文档采用 MIT 许可，见 `LICENSE`。
- 示例片不含任何解说音频。需要解说时，用 `voice.py` 和你自己的 MiniMax key 生成。
- 金屏说史的地图数据来自 [Natural Earth](https://www.naturalearthdata.com/)（公有领域），经裁剪、简化后内嵌在片子里。
- `assets/lib/three-r158.min.js` 是 three.js（MIT 许可，© three.js authors），原样分发，只删掉了首行的弃用提示。
- 找到的录音素材由用户在自己的项目里下载，来源和授权逐条记在各自的 `sources.json`，不随本仓库分发。
- 音频模块的角色母线、自动让位和"录音优先"这几个思路受 [op7418/guizang-product-video-skill](https://github.com/op7418/guizang-product-video-skill) 启发，代码全部是独立实现。
