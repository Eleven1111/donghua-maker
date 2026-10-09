# donghua-maker

**一句话生成动画短片**：三个遵循 [Agent Skills 开放标准](https://agentskills.io/specification) 的技能加三个一句话出片 Agent，Claude Code、Codex、Cursor、Antigravity、WorkBuddy、OpenClaw 等终端都能用。输入一句主题（"做一个日本历史快速讲解的动画"），自动产出一部**单文件 HTML** 动画短片：画面用 Canvas 2D 或 WebGL（three.js 内嵌）绘制，声音用 Web Audio，全部由代码生成，浏览器里直接播放，也能逐帧导出 MP4。

Agent Skills (Claude Code, Codex, Cursor, Antigravity, WorkBuddy, OpenClaw…) that turn a one-line idea into a self-contained HTML animated short (Canvas 2D or inlined three.js WebGL + Web Audio) in 28 verified looks, with visual self-checks, a sourced fact gate, an automatic sound pass and a first-use creator profile.

## 功能

- **28 种画面风格**：默认的纸艺定格之外，每种风格都有说明书（`references/looks/`）和验证过的示例片，用 `scaffold.py --look <名字>` 起片。按用途分：

  | 用途 | 风格（`--look` 名字，括号里是示例片） |
  |---|---|
  | **讲故事、有角色** | 撕纸拼贴绘本 `torn-paper`（晚安纸条）、皮影戏 `shadow-puppet`（射日）、水彩 `watercolor`（春雨）、美漫分镜 `comic`（夜巡）、**3D 黏土** `clay3d`（小猫钓鱼）、**3D 体素** `voxel`（农场的一天）、**图层卡通讲解** `layered`（十万粉）、像素农场 / 像素技术图解 `pixel`（农场的一天、像素神经网络） |
  | **讲解知识、数据、产品** | 手绘科普 `explainer`（地球的诞生）、商务财经图解 `biz-explainer`（毛利、股权稀释）、可爱软件演示 `ui-demo`（小克剪辑、小克数据台）、**3D 扁平科普** `flatsci`（月亮为什么会变）、报刊数据图 `editorial`（练习数据）、黑板粉笔 `chalkboard`（黑板课）、工程蓝图 `blueprint`（台灯设计图）、**3D 等距几何** `isometric`（积木城）、金屏说史系列 `gold-scroll`（赤壁之战，60 秒一回）、谐波运动 `harmonic`（圆与波）、科幻界面 `hud`（对接）、控制台大屏 `opsboard`（NIGHT DESK） |
  | **中国传统** | 青绿长卷 `qinglu`（江山市井图）、写意水墨 `inkwash`（清水游虾） |
  | **版画、素描、胶片** | 浮世绘 `ukiyoe`、博物版画 `naturalplate`、铅笔素描 `pencil`、一笔画 `oneline`、16mm 老纪录片 `film16` |
  | **文字** | 动态字体 `kinetic`（开口） |

  金屏说史用自己的开关起片：`--goldscroll`。长卷穿越片（一个人从左走到右，穿过几种画风，跨边界时人和世界一起换画法）用 `--scroll paper,inkwash,ukiyoe`，示例片「穿过三幅画」，说明书 `references/looks/scroll.md`。
- **真 3D 风格**：`clay3d`、`voxel`、`isometric`、`flatsci` 用 WebGL 渲染。three.js r158 直接内嵌进片子，所以仍是离线可播的单文件；这几种风格会自动开启 three.js。
  - 3D 黏土：立体泥塑表面有指纹、拇指按痕和刀痕，打暖色主光和柔和阴影；角色每秒 12 个姿势，镜头平滑运动。
  - 3D 体素：浮在空中的方块小岛，每块颜色略有差别；一条光照曲线从清晨走到夜晚，窗户亮灯、萤火虫；上下边缘移轴虚化，看起来像微缩模型。
  - 3D 立体纸艺：每张纸片有厚度、手剪毛边和白色纸芯，前后分层互相投影，镜头推进时有视差；纸偶每秒 12 个姿势。
  - 3D 积木：积木旋转落下、拼装，带运动模糊；最后是说明书翻页，页面上的步骤图由实时渲染生成。
  - 等距几何：用正交等距镜头，镜头可以绕场景转；房间一件件搭起来，城市拔地而起、整体换色。
  - 扁平科普：卡通分色着色，星球的晨昏线来自真实光照，月相也由光照得出。
- **图层卡通讲解，素材可以换**（`layered`）：画面按有名字的图层组织，比如 `hero.head`、`hero.eyes.happy`、`bg.office`。
  - 默认每层由代码画出占位图：粗细变化的墨线、两级明暗、背景虚化、角色会呼吸眨眼、换眼换嘴；
  - 动画件包括常驻计数器、仪表、堆叠、数值标签、盖章大字、故障转场；
  - 可以用自己生成的图片逐层替换（`LY.image(名字, 图片)`），动画代码不用改，图层清单写在 `looks/layered.md`。
- **定格质感引擎**：每秒 12 次摆位、镜头平滑运动、纸纹、胶片颗粒、曝光闪烁；跳转任意帧结果都一样，可复现。
- **首次使用先了解你**（`profile.py`）：先读本机档案；没有就从终端已有的记忆里取你的背景并跟你确认，读不到就问三个小问题。之后按档案自动选场景包、画幅和画风。
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

三个技能遵循 [Agent Skills 开放标准](https://agentskills.io/specification)，同一份文件在下列 AI 终端都能直接用，一条命令装好：

```bash
git clone https://github.com/Eleven1111/donghua-maker.git && cd donghua-maker
./install.sh claude              # 也可以一次装多个：./install.sh claude codex cursor workbuddy
./install.sh --all               # 装进本机已有的所有终端
./install.sh --project ~/myrepo  # 只装进某个项目：~/myrepo/.agents/skills
```

| 终端 | 技能目录 | 一句话出片 Agent |
|---|---|---|
| Claude Code | `~/.claude/skills` | 原生子 Agent（`~/.claude/agents`） |
| Cursor | `~/.cursor/skills` | 原生子 Agent（`~/.cursor/agents`） |
| Codex | `~/.codex/skills`，或项目内 `.agents/skills` | 主 Agent 按 `directors/*.md` 直接执行 |
| Antigravity | `~/.gemini/antigravity/skills`，或项目内 `.agents/skills` | 同上 |
| Gemini CLI | `~/.gemini/skills` | 同上 |
| WorkBuddy / CodeBuddy | `~/.workbuddy/skills` / `~/.codebuddy/skills` | 同上 |
| OpenClaw | `~/.openclaw/skills` | 同上 |
| 其他支持 SKILL.md 的终端 | `./install.sh --dest <它的技能目录>` | 同上 |

实测情况：Codex（从项目 `.agents/skills` 发现三个技能）、OpenClaw（`openclaw skills list` 显示三个均为 ready）、Claude Code 已实测。其余终端按各自官方文档的目录安装，未在本机实测。卸载：`./install.sh --uninstall <终端>`。

**装好之后先体检**，检查这台电脑缺什么，并给出适合当前系统的安装命令：

```bash
pip install -r requirements.txt                                   # Python 依赖：playwright、edge-tts、fonttools、numpy
python3 ~/.claude/skills/donghua-maker/scripts/doctor.py --online # 其他终端换成它的技能目录
```

| 功能 | 需要 | 缺了会怎样 |
|---|---|---|
| 做片和自检（核心） | Python 3.10+、`ffmpeg`、playwright，再加 Chrome 或 `python3 -m playwright install chromium` | 必须装 |
| 免费解说和字幕 | `edge-tts`，需要能连上微软语音服务，不需要 key | 片子没有解说，或者改用 MiniMax |
| MiniMax 解说（付费，可选） | `MINIMAX_API_KEY`；海外账号再加 `MINIMAX_API_BASE=https://api.minimax.io` | 用免费的 edge-tts |
| 可商用字体 | `fonttools`；首次使用时自动下载字体文件 | 只能用系统字体，发布有版权风险 |
| 自动生成背景音乐 | `fluidsynth` 和一个 SoundFont 音色库 | 用录音配乐，或者代码合成 |
| 找授权音效 | `numpy`；`FREESOUND_API_KEY` 可选 | 用代码合成的音效 |

**Key 放在哪里**：复制仓库里的 `.env.example` 到 `~/.config/donghua/.env`，只填你要用的，再 `chmod 600`。也可以放在片子所在文件夹的 `.env` 里，或者直接设成环境变量。所有脚本按"环境变量 → 当前文件夹 `.env` → `~/.config/donghua/.env`"的顺序读取，只读不打印。

**下载不了字体**（GitHub 慢或打不开）：Noto Sans 会自动换 jsDelivr 下载。也可以设置 `DONGHUA_FONT_MIRROR` 用镜像，或者手动下载 `.ttf` 文件，放进 `DONGHUA_FONT_DIR` 指定的文件夹。详见 `skills/donghua-maker/references/setup.md`。

## 使用

**第一次使用**：技能会先了解你是谁。它先看你的 AI 终端里已有的记忆或人设（比如 Claude Code 的 `CLAUDE.md`、Codex 的 `AGENTS.md`、WorkBuddy 的 `USER.md`），只取背景、做哪类片子、给谁看、风格偏好这几项，并先跟你确认；如果读不到，会问你三个小问题。结果存在本机的 `~/.config/donghua/profile.md`，所有终端共用，以后按它自动选场景包、画幅和画风。这个文件可以随时修改或删除，不会上传，也不会写进片子里。查看：`python3 <技能目录>/donghua-maker/scripts/profile.py find`。

在任意已安装的终端里：

```
用 donghua-director 做一个讲光合作用原理的科普动画
用 classroom-director 做一节初二勾股定理的微课
用 creator-director 做一条抖音和小红书的短视频：为什么猫咪爱钻纸箱
```

没有子 Agent 的终端（Codex、Antigravity、WorkBuddy、OpenClaw 等）会读 `donghua-maker/directors/` 里对应的说明，由主 Agent 自己按步骤做完。

老师场景包做完后，由主会话另派一个新上下文的 Agent 只看 `film-lesson/blind/packet.md` 答题，然后运行 `lesson_check.py film.html --blind`。

或者手动走技能流程（详见 `skills/donghua-maker/SKILL.md`）：

```bash
S=~/.claude/skills/donghua-maker/scripts   # 其他终端换成它的技能目录，如 ~/.codex/skills/…
python3 $S/scaffold.py film.html --title "片名" --format landscape --shots "A,B,C" --durs "4,4,4" --bpm 120
python3 $S/scaffold.py film.html --title "片名" --look clay3d --shots "A,B,C" --durs "4,4,4"   # 指定风格（3D 风格自动内嵌 three.js）
python3 $S/chapters.py init 长片/ --title "片名" --chapters "开场:6,第一章:20,第二章:20"   # 长片：一章一个文件
python3 $S/chapters.py build 长片/                             # → 长片/长片.html（没写的章节先显示占位卡）
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
requirements.txt             Python 依赖；.env.example  key 与设置模板（全部可选）
install.sh                   一键安装到 Claude Code / Codex / Cursor / Antigravity / Gemini / WorkBuddy / OpenClaw
AGENTS.md                    给改仓库的 Agent 看的规则（CLAUDE.md 引用它）
tools/validate.py            仓库关卡：技能规范、失效链接、脚本自检、每种风格各起一部空片的冒烟测试、密钥扫描
.github/workflows/           CI：官方 skills-ref 校验 + validate.py + 安装器演练
agents/
  donghua-director.md        一句话出片 Agent
  classroom-director.md      老师一句话出微课 Agent
  creator-director.md        自媒体一句话出片 Agent
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
  assets/toolkit-goldscroll.js 金屏说史模块库（--goldscroll 时注入）
  assets/sfz/                 三个不用采样文件的 SFZ 乐器（贝斯、拨弦、铺底），配乐分轨流程用
  assets/toolkit-<look>.js    各风格的模块库（--look <look> 时注入；用到 THREE 的会自动内嵌 three.js：clay3d / voxel / isometric / flatsci）
  assets/lib/                three.js r158（MIT，附 LICENSE 与 sources.json）
  references/catalog.md      全部示例片目录（选定风格后再读，不占主文件篇幅）
  references/setup.md        新机器安装：体检、每项依赖对应的功能、key 的读取顺序、字体下载不了怎么办
  references/onboarding.md   首次使用：读档案、从终端记忆了解用户、三个问题、档案 → 默认值
  references/narration.md    解说流程；references/export.md 导出 MP4
  references/                镜头接口、各风格工具箱（looks/）、配色与节奏、音频、事实核对规范
  scripts/                   scaffold / stills / fact_check / audio_director / music_render / music_stems（配乐分轨：mido 写谱、Surge XT / sfizz / fluidsynth 发声、分轨混音，可选）/
                             sfx_search / sfx_import / export / voice / narrate / font_embed / profile / doctor / chapters
```

## 设计理念

- **单文件**：一部片子就是一个 HTML 文件，3D 风格也一样（three.js 内嵌），没有构建步骤，改完刷新就能看。超过约 30 秒的长片可以一章一个文件来写，`chapters.py build` 再拼回同样的单文件（`references/long-film.md`）。
- **画面可以换，动画不用改**：图层按名字取用，代码画的占位图和自己生成的图片可以互相替换。
- **先网页后视频**：所有修改都在浏览器里完成，确认之后才导出 MP4。
- **确定性**：不用 `Math.random()`，随机都由种子控制。任意一帧都能复现，离线混音和实时播放的结果一致。
- **靠关卡，不靠自评**：画面、事实、音频各有一道能判失败的检查，每道都用负控测试过（故意改坏必须判失败）。核对关卡只能证明"每条都查过、有来源"，不能代替人的判断。
- **一个底座，多个场景包**：引擎、画风和关卡属于底座；场景包只调整输入、关卡和产出，不改引擎。
- **按需加载**：`SKILL.md` 控制在 500 行、约 5k token 以内，描述不超过 1024 字符；示例目录、解说、导出等细节放在 `references/`，用到才读。
- **一处编写，处处可用**：技能内不写死任何终端的路径，脚本靠相对位置互相找到；`tools/validate.py` 和 CI 每次提交都检查这些约定，并用故意改坏的样例验证过它会报错。
- **先了解人，再做片**：用户档案只存在本机、所有终端共用，只记背景、片子类型、受众和风格偏好，不上传，不写进片子。
- **经验沉淀成规则**：每次被否决的输出都写成一条可检验的规则，放进风格文档。

## 授权与致谢

- 代码和文档采用 MIT 许可，见 `LICENSE`。
- 示例片不含任何解说音频。需要解说时，用 `voice.py` 和你自己的 MiniMax key 生成。
- 金屏说史的地图数据来自 [Natural Earth](https://www.naturalearthdata.com/)（公有领域），经裁剪、简化后内嵌在片子里。
- `assets/lib/three-r158.min.js` 是 three.js（MIT 许可，© three.js authors），原样分发，只删掉了首行的弃用提示。
- 找到的录音素材由用户在自己的项目里下载，来源和授权逐条记在各自的 `sources.json`，不随本仓库分发。
- 音频模块的角色母线、自动让位和"录音优先"这几个思路受 [op7418/guizang-product-video-skill](https://github.com/op7418/guizang-product-video-skill) 启发，代码全部是独立实现。
