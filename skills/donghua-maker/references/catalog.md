# Look catalogue

Every verified example film in `assets/`, and what to copy from each. Pick the look first (`styles.md` §2), open only its `looks/<look>.md` and its example — never the whole list.

## Example films

- `assets/example-torn-paper-night.html`: a verified 7-shot, 28 s square (1440²) torn-paper collage film (晚安纸条). Copy from it: the torn-paper toolkit (`tornPath`, `tornPiece`, `crayon`), cute puppets built from baked parts with live eyes and mouth (`bakePuppets`, `eyes`, `smile`), handwriting that writes itself (`handText` + a pencil that follows the tip), one town reused at night and in the morning (`S1.day`, `S1.skyHook`), and the stepped fade to paper.
- `assets/example-shadow-archer.html`: a verified 5-shot, 20 s portrait shadow-puppet film (射日). Copy from it: the jointed-puppet rig (`rigPose`, `rigDraw`, `walkPose`) that any look can use for moving limbs, translucent carved hide (`hide`, the carved-pattern library, `carvedFace`), the lamp-lit screen (`screenBg`, `lampPass`), a bow draw with live string and arrows, and suns that blacken and fall.
- `assets/example-spring-rain.html`: a verified 4-shot, 16 s portrait watercolour film (春雨). Copy from it: one-pass `wash` with pigment pools, granulation, backruns and tide lines, wet-in-wet `soft` clouds, `ridge` mountains, `multiply` glazing that spreads in with `paint(…, {u})`, rain and ripples, and a paper halo around the frog.
- `assets/example-comic-night-watch.html`: a verified 4-shot, 12 s American-comic film (夜巡); its two narration voices are empty in this copy (fill `VO.src` with `scripts/voice.py`). Copy from it: the comic ink toolkit (`inkStroke`, `halftone`, `hatchLines`, `focusLines`, `burst`, `sfxText`, `caption`, `balloon`, `panelFrame`), pose-based silhouette figures (`heroDraw` + `HERO`/`DIVE`/`STAND`), a coloured sidekick puppet (`thugDraw`), a scarf rope that follows any pose (`scarfRig`/`scarfStep`), an inset close-up panel, the flash-invert lightning, and an iris-out ending.
- `assets/example-earth-explainer.html`: a verified 6-shot, 24.5 s hand-drawn science explainer (地球的诞生); its narration slots are empty in this copy (fill `VO_SRC` with `scripts/voice.py`). Copy from it: the sketch toolkit (`sketchPath`, `ringPts`, `markerFill`, `label`, `arrow`, `rock`), the notebook page, the chapter header and timeline ruler (`hud`), labels popping in on beats, the stepped fade to paper.
- `assets/example-brick-robot.html`: a verified 6-shot, 22 s square **3D** brick-build film (积木机器人, three.js inlined via `scaffold.py --three`). Copy from it: ASCII-layer models merged into standard bricks (`B3.parts`), bottom-up rain-in assembly with motion blur, sub-assemblies dropping together, one pure `WORLD.pose(t)` for the whole world, an instruction booklet whose pages are live renders and flip about the spine. Toolkit in `assets/toolkit-brick3d.js`, library in `assets/lib/` (MIT, sources.json).
- `assets/example-clay3d.html`: a verified 3-shot, 12 s landscape **3D clay** film (小猫钓鱼, WebGL). Copy from it: `K3` lumpy clay solids (`blob`, `rbox`, `snake`, `cone`) sharing one clay normal map with thumb dents and fingerprint ridges, a photo-checked cat with lidded eyes and ^ ^ happy arcs, a rod that bends under load, a fish arcing into a bucket, water displaced per exposure, stop-motion boil (`scaffold.py --look clay3d`)
- `assets/example-voxel.html`: a verified 3-shot, 12 s landscape **3D voxel** film (农场的一天, WebGL). Copy from it: `V3.island` with `heightAt`, instanced voxel props with colour jitter, the farmer rig (walk/wave/water), crops that `.grow` as he passes, `daylight()` dawn → night, glowing windows, fireflies, tilt-shift `frame`. (`scaffold.py --look voxel`)
- `assets/example-paper3d.html`: a verified 3-shot, 12 s landscape **3D paper theatre** film (放风筝, WebGL). Copy from it: `P3.card` with cut-edge core and fibre bump, layered hills at depth with cast shadows, parallax dolly, the pinned girl puppet running at 12 poses/s, the kite with a live tail, the dropped title card. (`scaffold.py --look paper3d`)
- `assets/example-datamin.html`: a 3-shot, 12 s **data-minimal** film (光速). Copy from it: digits that resolve, a pulse crossing a ruler in real time, a grid lit cell by cell as a clock, flicker locked to clicks. (`scaffold.py --look datamin`)
- `assets/example-harmonic.html`: a 3-shot, 12 s **harmonic-motion** film (圆与波). Copy from it: circle-to-sine projection, a Lissajous figure with matching musical fifth, the θ sweep that folds dots into arms. (`scaffold.py --look harmonic`)
- `assets/example-brushsketch.html`: a 3-shot, 12 s **brush-sketch manhua** film (放风筝). Copy from it: tapered boiling brush strokes, the blank-faced child rig, willow and crescent moon, vertical inscription with seal. (`scaffold.py --look brushsketch`)
- `assets/example-ukiyoe.html`: a 3-shot, 12 s **ukiyo-e** film (浪里行舟). Copy from it: bokashi skies, snow peak, the rising clawed wave, rocking boat with rowers, straight rain, the title cartouche. (`scaffold.py --look ukiyoe`)
- `assets/example-naturalplate.html`: a 3-shot, 12 s **natural-history plate** film (海里的几何). Copy from it: the plate layout, draw-in engraving, radiolarian/diatom/star/medusa generators, the pulsing medusa. (`scaffold.py --look naturalplate`)
- `assets/example-vangogh.html`: a 3-shot, 12 s **Van Gogh impasto** film (麦浪与星夜). Copy from it: stroke fields per region (vortex sky, halos, flame cypress, wheat, reflections), the after-pass contours and window lights. (`scaffold.py --look vangogh`)
- `assets/example-seurat.html`: a 3-shot, 12 s **pointillist** film (河岸的午后). Copy from it: srPaint backgrounds, live re-dotted sprites (lady with parasol, dog, sail), the sunset palette shift. (`scaffold.py --look seurat`)
- `assets/example-qinglu.html`: a 3-shot, 12 s **blue-green handscroll** film (江山市井图). Copy from it: the baked scroll world, live crowds and boats, the unroll with a roller, brocade mounting, the title inscription and seal. (`scaffold.py --look qinglu`)
- `assets/example-inkwash.html`: a 3-shot, 12 s **ink-wash** film (清水游虾). Copy from it: iwShrimp with dart-and-glide swimming, the signature and seal. (`scaffold.py --look inkwash`)
- `assets/example-dunhuang.html`: a 3-shot, 12 s **Dunhuang mural** film (飞天). Copy from it: the apsara rig, spiral clouds, friezes, flakes drawn over figures. (`scaffold.py --look dunhuang`)
- `assets/example-mondrian.html`: a 3-shot, 12 s **Mondrian grid** film (格子里的节奏). Copy from it: mdCompose/mdDraw on the beat grid, the boogie lanes. (`scaffold.py --look mondrian`)
- `assets/example-kandinsky.html`: a 3-shot, 12 s **Kandinsky composition** film (点线面). Copy from it: one element per note, cumulative build across shots. (`scaffold.py --look kandinsky`)
- `assets/example-cutout.html`: a 3-shot, 12 s **gouache cut-out** film (海藻与星). Copy from it: cuAlgae with grow-in, contrasting shapes per panel, the pinned star. (`scaffold.py --look cutout`)
- `assets/example-process.html`: a 3-shot, 12 s **process particles** film (规则的痕迹). Copy from it: prTrace accumulation from analytic positions, notes giving birth to elements. (`scaffold.py --look process`)
- `assets/example-elastic.html`: a 3-shot, 12 s **elastic lines** film (弹一弹). Copy from it: elStroke with kicks, elBlob with faces, near-parallel strings. (`scaffold.py --look elastic`)
- `assets/example-growth.html`: a 3-shot, 12 s **differential growth** film (生长). Copy from it: grGrow at load, progress mapping, fading note rings. (`scaffold.py --look growth`)
- `assets/example-isometric.html`: a 3-shot, 12 s **3D isometric** film (积木城, WebGL, orthographic camera at the true isometric angle). Copy from it: a room assembling on the beats (`I3.room`, `I3.win`, open `I3.shelf`, props dropping in), pin labels projected from world points, a city of set-back tiers rising and repainting, and a camera that orbits the diorama (`scaffold.py --look isometric`)
- `assets/example-datafluid.html`: a 3-shot, 12 s **data fluid** film (数据之海). Copy from it: dfDraw buckets, form morph with stagger, note surges. (`scaffold.py --look datafluid`)
- `assets/example-bloom.html`: a 3-shot, 12 s **luminous flowers** film (花开无界). Copy from it: blFlower lifecycle, wind-driven fall times, note births. (`scaffold.py --look bloom`)
- `assets/example-opart.html`: a 3-shot, 12 s **Op Art** film (起伏). Copy from it: opWaves, opBulge, opRings with difference. (`scaffold.py --look opart`)
- `assets/example-nianhua.html`: a 3-shot, 12 s **New Year print** film (年年有余). Copy from it: nhPrint painter-order press with per-block print-in, child and carp puppets, pressed title and seal. (`scaffold.py --look nianhua`)
- `assets/example-tessellation.html`: a 3-shot, 12 s **tessellation metamorphosis** film (方与鱼). Copy from it: tsField with shared-edge bend, change front, radial ring. (`scaffold.py --look tessellation`)
- `assets/example-sandart.html`: a 3-shot, 12 s **sand animation** film (沙上月). Copy from it: saDraw frayed wipes, saPour silhouettes, saTip + saHand, partial sweep. (`scaffold.py --look sandart`)
- `assets/example-ascii.html`: a 3-shot, 12 s **ASCII art** film (字符宇宙). Copy from it: asRender binning, asTorus/asTerrain/asPlanet, title mask. (`scaffold.py --look ascii`)
- `assets/example-bauhaus.html`: a 3-shot, 12 s **Bauhaus** film (形与色). Copy from it: bhSnap arrivals, diagonal poster build, machine shot. (`scaffold.py --look bauhaus`)
- `assets/example-chalkboard.html`: a 3-shot, 12 s **Chalkboard** film (黑板课). Copy from it: cbBegin/cbEnd grain layer, cbStroke + cbText write-on with the chalk stick, cbArrow, cbErase with the felt eraser, a maths proof built across shots. (`scaffold.py --look chalkboard`)
- `assets/example-blueprint.html`: a 3-shot, 12 s **Blueprint** film (台灯设计图). Copy from it: bpSheet + frame, bpDraw line styles (solid/thin/hidden/centre/faint), bpDim dimensions, bpHatch section, bpTitleBlock, bpPen tip marker. (`scaffold.py --look blueprint`)
- `assets/example-oneline.html`: a 3-shot, 12 s **One-line drawing** film (一笔一天). Copy from it: olBuild motif chain on a baseline, olDraw brush-pen weight + red tip, camera trailing the pen, final pull-back reveal. (`scaffold.py --look oneline`)
- `assets/example-pencil.html`: a 3-shot, 12 s **Pencil sketch** film (苹果写生). Copy from it: pcBegin/pcEnd graphite layer with paper tooth, pcLine taper + corrected double contour, pcHatch with shade(x,y) light model and seg for soft tone, pcSmudge cast shadow, eraser highlight, pcPencil. (`scaffold.py --look pencil`)
- `assets/example-memphis.html`: a 3-shot, 12 s **Memphis** film (周末去哪儿). Copy from it: mmConfetti field with a title hole, mmShape outlined shapes with hard shadows, mmTitle per-letter pop, mmPattern stripes/dots/checks, a spinning prize wheel that lands on a chosen sector, mmBubble. (`scaffold.py --look memphis`)
- `assets/example-linocut.html`: a 3-shot, 12 s **Linocut** film (早安版画). Copy from it: lnBegin/lnEnd ink layer with burnish speckle and roller reveal, lnPoly jagged edges, lnGouge tapered V-cuts (carve or fill), lnText nicked lettering, lnRoller, lnTool, misregistration offset. (`scaffold.py --look linocut`)
- `assets/example-retro70.html`: a 3-shot, 12 s **70s retro** film (慢慢来). Copy from it: r7Round + r7Stripes flowing bands, r7Sun slit sunset (offscreen), r7Burst tone-on-tone rays, r7Title stacked stripe shadow, r7Caps, r7Frame rounded TV frame. (`scaffold.py --look retro70`)
- `assets/example-film16.html`: a 3-shot, 12 s **16 mm documentary** film (守灯人). Copy from it: fmLeader countdown with sweep, fmCard ornamental intertitle, fmWeave gate weave, fmPost flicker/scratches/dust/hair/burn keyed to 24 fps, fmType typewriter caption, fmSpot. (`scaffold.py --look film16`)
- `assets/example-terminal.html`: a 3-shot, 12 s **Terminal** film (咖啡机). Copy from it: tmLines script typed on a fixed cell grid (CJK = 2 cells), [ OK ] tags, tmCursor, tmBar, tmBig 5×7 digits, tmScope, tmBox, tmTube scanlines + rolling band. (`scaffold.py --look terminal`)
- `assets/example-hud.html`: a 3-shot, 12 s **Sci-fi HUD** film (对接). Copy from it: hdRadar sweep + blip revealed on first pass, hdRing counter-rotating tick rings, hdGauge with readout, hdNum rolling numbers, hdReticle lock-on, hdWave, hdCorners frame. (`scaffold.py --look hud`)
- `assets/example-kinetic.html`: a 3-shot, 12 s **Kinetic typography** film (开口). Copy from it: ktWord slam/slide/type/fade with exit, ktWall alternating scrolling rows with a clearing, ktDot red full stop, ktScatter letters flying off; two embedded fonts (sans + serif). (`scaffold.py --look kinetic`)
- `assets/example-flatsci.html`: a 3-shot, 12 s **3D flat science explainer** film (月亮为什么会变, WebGL toon shading). Copy from it: `F3.planet` with flat continents, cloud shell and atmosphere rim, a real terminator from the sun's light, a dashed orbit drawn on, callouts projected from world points, and moon phases rendered by lighting one moon from five directions in `F3.views` (`scaffold.py --look flatsci`)
- `assets/example-editorial.html`: a 3-shot, 12 s **Editorial data graphics** film (练习数据). Copy from it: edHead kicker + serif headline with red keyword, edAxes, edLine red story line vs grey, edGap shaded difference, edNote bracket + big red delta, edBars with highlighted bar, edSource note. (`scaffold.py --look editorial`)
- `assets/example-layered.html`: a 3-shot, 12 s **Layered cartoon explainer** film (十万粉). Copy from it: named layers (`LY.bake` placeholders or `LY.image` for your own generated art), an inked placeholder hero rig with eye/mouth swaps and blink, blurred backgrounds + sharp desk props, `LY.hud` running counter, `LY.gauge`, `LY.pile`, `LY.pill`, `LY.stamp`, `LY.caption`, rays, sparkles, glitch cuts (`scaffold.py --look layered`)
- `assets/example-flow-ribbon.html`: a verified 4-shot, 20 s landscape **flow-ribbon** film (风的形状, `scaffold.py --flowribbon`). Copy from it: non-overlapping ribbons that stream along a flow field, calm holes for titles and objects, the obstacle and vortex fields, the night palette, heroes entering on melody notes, `pre` so no shot opens empty.
- `assets/example-gold-scroll-chibi.html`: a verified 11-shot, 60 s landscape **history series** episode (金屏说史 · 第一回 赤壁之战, `scaffold.py --goldscroll`). Copy from it: gold-screen open/end, metallic gold titles, odometer year and timeline, Natural Earth river map with faction cards and routes, night-river fleet and fire climax, vertical source quotes, parchment myth-buster, versus split; its `-facts/facts.json` shows how every subtitle is sourced.
- `assets/example-pixel-farm.html`: a verified 5-shot, 19.4 s landscape pixel film (`--pixel 8`, 农场的一天). Copy from it: 2× characters, the raised horizon, wide baked parallax layers, stepped dawn palette, a 2× foreground via transform (shot 1), splash/drip particles, the stepped fade.
- `assets/example-pixel-neural.html`: a verified 4-shot, 12 s landscape pixel diagram (`--pixel 4`, 像素神经网络), pure black with blue data flow and red/magenta errors. Copy from it: the 3×5 pixel font (`pxText`), Bresenham lines that grow (`pxLine`), the baked network stage, forward and backprop waves (`flow`), an MNIST digit that writes itself and glitches, confidence bars with a prediction box, and analytic particles.
- `assets/example-ui-demo-editor.html` and `assets/example-ui-demo-dashboard.html`: the verified cute software-demo look (kawaii flat, meta UI) on two different products: a video editor (8 s: play, blurry preview, stop, cut at the playhead, bin it, ripple, clean) and a sales dashboard (4 s: type, press, bars, KPI and ranking update). Copy from them: the `UI-DEMO KIT` block, which is identical in both (`mascotDraw`/`MASCOT`, `stateAt` event model, `keys`, UI widgets, `deviceFrame`, `bubble`/`sfxTxt`, `clickRing`, knife and trash props). Then write only a new APP block for the new product. Rules are in `looks/ui-demo.md`.
- `assets/example-biz-margin.html` and `assets/example-biz-equity.html`: the verified business/finance whiteboard explainer on two topics: gross margin (9 s, one grid transforming) and equity dilution (8 s, before → after). Copy from them: the `BIZ-EXPLAINER KIT` block, which is identical in both (meaning `block`s + `gridCell`, `card`/`arrow`/`legend`, chapter `tabs`, numbered `caption`, the red `stamp`, the hard-hat `guide` + `say`, `bakePaper`/`iris`, `stateAt`). Then write only a new TOPIC block. Rules are in `looks/biz-explainer.md`.
- `assets/example-red-kite.html`: a verified 4-shot, 10 s landscape film. Copy techniques from it: a hero prop shared across shots, rope physics, birds taking off, a tree shedding petals, a person turning their head, the final fade.

## Looks by description

手工剪切边缘、纸纹、胶片颗粒、每秒 12 次摆位），音乐和音效优先使用找到的授权录音素材（嵌入单文件），找不到的类别由代码合成。画幅可选横屏 16:9、竖屏 9:16（抖音/视频号/Reels）、方形 1:1 或 4:5；配色、节奏、道具、音乐和质感（剪纸、版画、Riso 印刷、水彩、水墨、毛毡、粉笔、夜景、像素风/农场模拟游戏风、像素风技术图解（神经网络可视化）、商务财经图解风（方格比喻+章节标签+讲解员+红章，讲毛利/股权/成本结构等）、可爱软件产品演示风（扁平萌系小方块角色操作软件界面：剪辑软件/仪表盘/App/SaaS 功能介绍）、手绘科普讲解风、美漫/漫画分镜风、撕纸拼贴绘本风、皮影戏、3D 体素风（浮空方块小岛、昼夜变化、移轴微缩）、3D 立体纸艺风（有厚度的纸片分层、互相投影、视差）、3D 黏土定格风（three.js 真立体泥塑、指纹按痕、柔光阴影、每秒 12 个姿势）、3D 积木拼装风（three.js 内嵌，积木落下拼装+说明书翻页）、金屏说史历史讲解系列（金箔屏风片头、金属金字、年份滚轮、河流地图行军、火攻高潮、辨误卡，60 秒一回）、流场色带生成艺术风（粗色带顺着流场流动、互不重叠、绕开留白写标题）、数据极简风（黑底白字、数字条码扫描线）、谐波运动风（圆周投影正弦、李萨如、谐波点阵）、简笔漫画风（毛笔线条、无五官人物、淡彩、竖排题字）、浮世绘风（普鲁士蓝木版、浪花爪、云带、直线雨、题签）、博物版画风（图版编号、棕褐细线、放射虫水母逐笔刻画）、梵高厚涂风（旋涡天空、光晕、火焰丝柏、短笔触）、修拉点彩风（纯色小点空间混色）、青绿长卷风（千里江山青绿山水×清明上河市井长卷、开卷横移）、写意水墨风（齐白石式虾、湿墨留白、落款钤印）、敦煌壁画风（飞天飘带、卷云、矿物色、斑驳墙面）、格子构成风（蒙德里安黑线红黄蓝、布吉车道）、康定斯基构成风（点线面随音乐出现）、剪纸拼贴风（马蒂斯式水粉剪纸、海藻星星）、规则粒子风（圆的重叠连线累积成画）、弹性线条风（粗彩线写出后像弹簧颤动、果冻团）、差分生长风（墨线分裂卷曲成珊瑚、年轮）、等距几何风（three.js 真 3D 正交等距镜头、房间逐件搭起、方块城市、三面明暗、镜头可环绕）、粒子流体风（两万发光粒子流场、形态变换）、发光花风（暗室里花开花散）、欧普艺术风（黑白波纹、棋盘鼓起、摩尔纹）、年画风（杨柳青胖娃娃抱鲤鱼、套色印刷）、镶嵌变形风（方格渐变成互锁的鱼群）、沙画风（灯箱上指尖抹沙、手掌清屏）、字符画风（ASCII 字符组成画面、终端荧光）、包豪斯构成风（红黄蓝黑、圆方三角、斜线大字）、黑板粉笔风（粉笔板书、板擦擦除、彩色粉笔强调）、工程蓝图风（蓝底白线、尺寸标注、剖面线、图框）、一笔画风（一根不断的线画出物件、红色笔尖）、铅笔素描风（起形、排线调子、擦出高光）、孟菲斯风（粉薄荷黄底、几何碎片、黑描边硬投影、弹跳入场）、麻胶版画风（刻刀刻痕、红黑套印、油墨斑驳、滚筒印出）、七十年代复古风（暖色彩条圆角流动、条纹夕阳、叠影粗衬线字、圆角电视框）、16mm 老纪录片风（黑白颗粒、片头倒数、花框字幕卡、划痕灰尘、画面抖动）、绿屏终端风（荧光绿等宽字符、开机日志、进度条、方块大数字、扫描线）、科幻界面风（深蓝玻璃、青色细线仪表、旋转刻度环、雷达扫描、准星锁定）、动态字体风（只有文字、粗细大小强对比、砸入与滑入、重复文字墙、红色句点）、扁平科普风（three.js 真 3D 卡通分色、靛紫太空、真实明暗交界的星球、月相由光照得出、圆润粗体字幕）、报刊数据图风（白底衬线大标题、红色主线灰色对照、差距标注、横向条形图）、图层卡通讲解风（粗墨线卡通角色分层动画、常驻计数器、仪表指针、堆叠增长、绿色数值标签、盖章大字、故障转场，占位图可换成自己生成的素材）

## Phrases that mean "use this skill"

- 用代码/JS 做一个短视频/动画短片
- 定格动画
- 剪纸风动画
- canvas 动画带音乐
- 程序生成的视频
- 像 Steam Song / Red Kite 那样的片子
- 像素风/星露谷那种风格的动画
- 像素风神经网络/AI 原理可视化动画
- 手绘科普动画/讲解动画
- 美漫/漫威/DC 风格动画、漫画风短片
- 撕纸拼贴/手作纸艺/儿童绘本风动画
- 皮影戏/皮影风/传统民间故事动画
- 体素/我的世界那种方块/3D 像素农场
- 立体纸艺/纸雕/分层纸片剧场/3D 剪纸
- 黏土动画/黏土定格/橡皮泥风/3D 黏土
- 3D 积木/乐高式拼装动画/three.js 动画
- 历史讲解/60 秒历史/金色绘卷风/战役地图动画
- 生成艺术/流场/flow field/色带流动/抽象彩色线条动画/创意编程风动画
- 数据可视化极简/黑白数据流/科技感数字动画
- 三角函数/正弦波/李萨如/谐波动画
- 简笔漫画/丰子恺那种风格/毛笔小人
- 浮世绘/日式木版画/神奈川浪风格
- 博物画/海克尔/自然图鉴/生物图版动画
- 梵高风格/星空/油画笔触动画
- 点彩/修拉/新印象派动画
- 青绿山水/千里江山图/清明上河图/国画长卷动画
- 写意/水墨/齐白石/国画虾
- 敦煌/飞天/壁画风
- 蒙德里安/格子/红黄蓝
- 康定斯基/抽象构成/点线面
- 马蒂斯/剪纸拼贴/水粉剪纸
- 规则粒子/Casey Reas/Process 生成艺术
- 弹性线条/Zach Lieberman/手势线条动画
- 差分生长/differential growth/珊瑚生长/inconvergent
- 等距/isometric/等轴方块城市
- 粒子流体/数据雕塑/Refik Anadol 那种
- teamLab/发光花/沉浸式花海
- 欧普艺术/Op Art/视错觉黑白条纹
- 年画/杨柳青/桃花坞/胖娃娃鲤鱼/过年动画
- 埃舍尔/镶嵌/密铺/图形渐变
- 沙画/沙画表演/灯箱沙画
- ASCII/字符画/终端风/黑客帝国字符
- 包豪斯/Bauhaus/构成主义/几何海报
- 黑板/粉笔/板书/课堂讲解
- 蓝图/工程图/设计图纸/三视图
- 一笔画/单线条/连续线条/极简线描
- 素描/铅笔画/写生/石墨速写
- 孟菲斯/Memphis/80年代几何/波普彩色碎片
- 版画/麻胶版画/木刻/套色印刷/linocut
- 70年代/七十年代复古/复古彩条/disco唱片风/vintage
- 老电影/16mm/黑白纪录片/胶片划痕/片头倒数
- 终端界面/命令行/绿屏CRT/黑客终端/开机日志
- 科幻界面/HUD/全息仪表/雷达扫描/钢铁侠界面
- 动态字体/文字动画/kinetic typography/字体海报动效/金句视频
- 扁平科普/太空科普动画/Kurzgesagt 那种扁平风/星球科普
- 报刊数据图/新闻数据可视化/经济学人那种图表/折线图条形图动画
- 图层动画/2.5D 卡通讲解/自媒体讲故事动画/金融科普卡通/AI 插画动起来
- 水彩动画/水彩晕染风
- 给短片配解说
