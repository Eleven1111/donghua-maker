# donghua-maker

**一句话生成动画短片**：一个 [Claude Code](https://claude.com/claude-code) 技能加一个 Agent。输入一句主题（"做一个日本历史快速讲解的动画"），自动产出一部**单文件 HTML** 动画短片：Canvas 2D 画面加 Web Audio 声音，全部由代码生成，浏览器里直接播放，也能逐帧导出 MP4。

A Claude Code skill + agent that turns a one-line idea into a self-contained HTML animated short (Canvas 2D + Web Audio), with visual self-checks, a sourced fact gate and an automatic sound pass.

## 功能

- **12 种画面风格**，每种都有验证过的示例片：纸艺定格（默认）、撕纸拼贴绘本、皮影戏、黏土、水彩、美漫分镜、手绘科普笔记、像素农场、像素技术图解、商务财经图解、可爱软件产品演示等。
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
- **中文解说**（可选）：`voice.py` 调用 MiniMax 生成，按时间轴对齐。付费服务，默认不启用。

## 安装

```bash
git clone https://github.com/Eleven1111/donghua-maker.git
cp -R donghua-maker/skills/donghua-maker ~/.claude/skills/
cp donghua-maker/agents/donghua-director.md ~/.claude/agents/
```

依赖：
- **必需**：Python 3.10+、`ffmpeg`、`playwright`（Python 版），再加 Google Chrome，或运行 `python3 -m playwright install chromium`。
- **可选**：
  - `fluidsynth` 加 GeneralUser GS SoundFont，用于渲染背景音乐。默认路径 `~/.local/share/soundfonts/GeneralUser-GS.sf2`，可用环境变量 `SOUNDFONT` 另指。
  - `FREESOUND_API_KEY`：多一个音效来源。
  - `MINIMAX_API_KEY`：生成中文解说。

密钥只从环境变量或 `~/.config/secrets/.env` 读取，脚本不会打印它们。

## 使用

在 Claude Code 里：

```
用 donghua-director 做一个讲光合作用原理的科普动画
```

或者手动走技能流程（详见 `skills/donghua-maker/SKILL.md`）：

```bash
S=~/.claude/skills/donghua-maker/scripts
python3 $S/scaffold.py film.html --title "片名" --format landscape --shots "A,B,C" --durs "4,4,4" --bpm 120
python3 $S/stills.py film.html --shots                         # 画面自检
python3 $S/fact_check.py film.html --init                      # 生成事实清单，填好后：
python3 $S/fact_check.py film.html                             # → FACT CHECK PASS
python3 $S/audio_director.py film.html --mood cute --key C --run --check
python3 $S/export.py film.html -o film-1080.mp4 --scale .75 --crf 23   # 网页版确认后再导出
```

## 输出结构

```
film.html                 单文件成片（引擎 + 镜头 + 嵌入的音频）
film-facts/facts.json     每条屏幕文字的核对记录：状态、来源、备注
film-audio/               音频方案、bgm.mid/.wav、编码后的音效、sources.json（来源与授权）
film-stills/              静帧与 sheet.jpg（已被 .gitignore 忽略）
film-1080.mp4             导出成片（只在确认后生成）
```

成片测试接口：`?t=3.2` 从 3.2 秒开始，`?ui=0` 只显示画面，另有 `window.__film.seek(frame)`、`.info()`、`.score()`、`await .wav()`、`.audio()`。

## 目录

```
agents/
  donghua-director.md        一句话出片 Agent
skills/donghua-maker/
  SKILL.md                   完整工作流：分镜 → 骨架 → 镜头 → 音频 → 事实核对 → 验证 → 交付 → 导出
  assets/engine.html         引擎模板
  assets/example-*.html      每种风格验证过的示例片
  references/                镜头接口、各风格工具箱（looks/）、配色与节奏、音频、事实核对规范
  scripts/                   scaffold / stills / fact_check / audio_director / music_render /
                             sfx_search / sfx_import / export / voice
```

## 设计理念

- **单文件**：一部片子就是一个 HTML 文件，没有构建步骤，改完刷新就能看。
- **先网页后视频**：所有修改都在浏览器里完成，确认之后才导出 MP4。
- **确定性**：不用 `Math.random()`，随机都由种子控制。任意一帧都能复现，离线混音和实时播放的结果一致。
- **靠关卡，不靠自评**：画面、事实、音频各有一道能判失败的检查，每道都用负控测试过（故意改坏必须判失败）。核对关卡只能证明"每条都查过、有来源"，不能代替人的判断。
- **经验沉淀成规则**：每次被否决的输出都写成一条可检验的规则，放进风格文档。

## 授权与致谢

- 代码和文档采用 MIT 许可，见 `LICENSE`。
- 示例片不含任何解说音频。需要解说时，用 `voice.py` 和你自己的 MiniMax key 生成。
- 找到的录音素材由用户在自己的项目里下载，来源和授权逐条记在各自的 `sources.json`，不随本仓库分发。
- 音频模块的角色母线、自动让位和"录音优先"这几个思路受 [op7418/guizang-product-video-skill](https://github.com/op7418/guizang-product-video-skill) 启发，代码全部是独立实现。
