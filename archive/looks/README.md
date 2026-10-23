# Archived looks

Moved out of the skill on 2026-10-23 (user: 「全按建议」, round-two absorption): each folder holds the look's card, toolkit, example film and fonts exactly as they were. `install.sh` copies only `skills/` and `agents/`, so nothing here is installed.

| look | why |
|---|---|
| pencil 铅笔素描, oneline 一笔画 | thin, low-saturation lines: the kind TASTE.md 2026-10-09 rules unappealing; never used in a delivered film; slot goes to halftone-dossier |
| harmonic 圆与波, naturalplate 博物图版 | narrow subjects, never used in a delivered film |
| isometric 3D 等距 | overlaps voxel; the 3D how-it-works slot goes to the exploded teardown |
| hud 科幻界面 | overlaps opsboard |

**Restore one:** move its four items back (`references/looks/<look>.md`, `assets/toolkit-<look>.js`, `assets/example-<look>.html`, `assets/example-<look>-fonts/`) and paste its rows below back into the files named.

## pencil

references/catalog.md:
```
- `assets/example-pencil.html`: a 3-shot, 12 s **Pencil sketch** film (苹果写生). Copy from it: pcBegin/pcEnd graphite layer with paper tooth, pcLine taper + corrected double contour, pcHatch with shade(x,y) light model and seg for soft tone, pcSmudge cast shadow, eraser highlight, pcPencil. (`scaffold.py --look pencil`)
```
references/styles.md §2:
```
| **铅笔素描 / Pencil sketch** (`--look pencil`) | Toothed off-white paper; construction lines and ellipse first, then a corrected double contour, directional hatching that models light (darker away from it), cross-hatching in the core shadow, smudged cast shadow, eraser highlight; graphite breaks on the tooth. Verified in 苹果写生 (`assets/example-pencil.html`, `looks/pencil.md`). |
```
references/shot-contract.md (look table):
```
| 铅笔素描 / Pencil sketch (`--look pencil`) | `looks/pencil.md` | `assets/example-pencil.html` |
```

## oneline

references/catalog.md:
```
- `assets/example-oneline.html`: a 3-shot, 12 s **One-line drawing** film (一笔一天). Copy from it: olBuild motif chain on a baseline, olDraw brush-pen weight + red tip, camera trailing the pen, final pull-back reveal. (`scaffold.py --look oneline`)
```
references/styles.md §2:
```
| **一笔画 / One-line drawing** (`--look oneline`) | Warm off-white paper; ONE continuous ink line that runs along a baseline and loops up into drawings (cup, sun, house, mountains, heart) and back down; red pen tip; camera trails the pen; a pull-back reveals the whole line. Verified in 一笔一天 (`assets/example-oneline.html`, `looks/oneline.md`). |
```
references/shot-contract.md (look table):
```
| 一笔画 / One-line drawing (`--look oneline`) | `looks/oneline.md` | `assets/example-oneline.html` |
```

## harmonic

references/catalog.md:
```
- `assets/example-harmonic.html`: a 3-shot, 12 s **harmonic-motion** film (圆与波). Copy from it: circle-to-sine projection, a Lissajous figure with matching musical fifth, the θ sweep that folds dots into arms. (`scaffold.py --look harmonic`)
```
references/styles.md §2:
```
| **谐波运动 / harmonic motion** (`--look harmonic`) | Glowing points on circles at integer ratios on a dark field: circle→sine projection, Lissajous 3:2, dot fields that fold into m-armed figures as θ sweeps 2π/m; trails sampled from pure functions; the score plays the same ratios. Maths and music intervals. Verified in 圆与波 (`assets/example-harmonic.html`, `looks/harmonic.md`). |
```
references/shot-contract.md (look table):
```
| 谐波运动 / harmonic motion (`--look harmonic`) | `looks/harmonic.md` | `assets/example-harmonic.html` |
```

## naturalplate

references/catalog.md:
```
- `assets/example-naturalplate.html`: a 3-shot, 12 s **natural-history plate** film (海里的几何). Copy from it: the plate layout, draw-in engraving, radiolarian/diatom/star/medusa generators, the pulsing medusa. (`scaffold.py --look naturalplate`)
```
references/styles.md §2:
```
| **博物版画 / natural-history plate** (`--look naturalplate`) | A numbered plate in a ruled frame: sepia fine lines, pale radial tints, symmetric specimens (radiolarian, diatom, star, medusa) that engrave themselves in, numerals and one sourced caption. Biology and the geometry of nature. Verified in 海里的几何 (`assets/example-naturalplate.html`, `looks/naturalplate.md`). |
```
references/shot-contract.md (look table):
```
| 博物版画 / natural-history plate (`--look naturalplate`) | `looks/naturalplate.md` | `assets/example-naturalplate.html` |
```

## isometric

references/catalog.md:
```
- `assets/example-isometric.html`: a 3-shot, 12 s **3D isometric** film (积木城, WebGL, orthographic camera at the true isometric angle). Copy from it: a room assembling on the beats (`I3.room`, `I3.win`, open `I3.shelf`, props dropping in), pin labels projected from world points, a city of set-back tiers rising and repainting, and a camera that orbits the diorama (`scaffold.py --look isometric`)
```
references/styles.md §2:
```
| **等距几何 / isometric blocks** (`--look isometric`, three.js) | Real 3D diorama through an orthographic camera at the true isometric angle: soft-edged pastel blocks on a pale ground, one key light for the three tones, soft contact shadows; rooms assemble prop by prop with pin labels, cities rise in set-back tiers and repaint in diagonal waves; the camera may orbit about ±40°. Verified in 积木城 (`assets/example-isometric.html`, `looks/isometric.md`). |
```
references/shot-contract.md (look table):
```
| 等距几何 / isometric blocks (three.js, `--look isometric`) | `looks/isometric.md` | `assets/example-isometric.html` |
```

## hud

references/catalog.md:
```
- `assets/example-hud.html`: a 3-shot, 12 s **Sci-fi HUD** film (对接). Copy from it: hdRadar sweep + blip revealed on first pass, hdRing counter-rotating tick rings, hdGauge with readout, hdNum rolling numbers, hdReticle lock-on, hdWave, hdCorners frame. (`scaffold.py --look hud`)
```
references/styles.md §2:
```
| **科幻界面 / Sci-fi HUD** (`--look hud`) | Deep navy glass with a dot grid; hairline cyan instruments — corner brackets, counter-rotating tick rings, arc gauges with big readouts, radar sweep with blips, symmetric waveform bars, tiny letter-spaced labels, rolling numbers; amber for alerts and locks. Verified in 对接 (`assets/example-hud.html`, `looks/hud.md`). |
```
references/shot-contract.md (look table):
```
| 科幻界面 / Sci-fi HUD (`--look hud`) | `looks/hud.md` | `assets/example-hud.html` |
```

## Other places the six were mentioned (removed the same day)

- `references/catalog.md` trigger phrases: 三角函数/正弦波/李萨如/谐波动画 · 博物画/海克尔/自然图鉴/生物图版动画 · 等距/isometric/等轴方块城市 · 一笔画/单线条/连续线条/极简线描 · 素描/铅笔画/写生/石墨速写 · 科幻界面/HUD/全息仪表/雷达扫描/钢铁侠界面
- `references/catalog.md` "Looks by description": 谐波运动风（圆周投影正弦、李萨如、谐波点阵）、博物版画风（图版编号、棕褐细线、放射虫水母逐笔刻画）、等距几何风（three.js 真 3D 正交等距镜头、房间逐件搭起、方块城市、三面明暗、镜头可环绕）、一笔画风（一根不断的线画出物件、红色笔尖）、铅笔素描风（起形、排线调子、擦出高光）、科幻界面风（深蓝玻璃、青色细线仪表、旋转刻度环、雷达扫描、准星锁定）
- `references/onboarding.md`: product row listed `isometric`; art row listed `oneline`, `harmonic`
- `scripts/scaffold.py`: `isometric` in the WebGL look list of two help strings
- `README.md`: the look table, the 3D look list and the 等距几何 bullet
