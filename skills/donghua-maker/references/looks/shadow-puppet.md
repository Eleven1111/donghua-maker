# Look: Shadow puppet / 皮影戏

Shadow-puppet toolkit (copy from `assets/example-shadow-archer.html`). Read this together with `../shot-contract.md` (the engine API) and `../styles.md` (the one-row recipe).

These are story-level helpers. Copy from `// ── shadow-puppet toolkit`, `// ── carved-pattern library` and `// ── carved faces`.

| fn | use |
|---|---|
| `piece(bbox, fn)` → `{c, sh, ox, oy}` | bake one leather part at its pivot, plus a blurred black copy (`sh`) used as the soft double the lamp throws on the screen |
| `hide(pts, {paint, holes, after})` | **the signature look.** Amber translucent hide (`HIDE`), painted colour regions (`paint`), carved holes cut with `destination-out` so the lamp shows through (`holes`), a dark knife-line outline, then line work that sits on top of holes (`after`) |
| `iceCrack` 冰裂纹 · `scales` 鱼鳞 · `dotRow` 连珠 · `waves` 海水纹 · `cloud` 云头 · `coin` 钱纹 | carved-pattern fills. Call them inside `holes()`; every fill or stroke cuts light through. Keep cells small (≈18–20 px) so a garment reads as lace, not a grid |
| `carvedFace(g, 'hero' \| 'old')` | 空脸 hollow face: the whole face is cut out and only a knife line remains. Straight brow-to-nose line (通天鼻), nostril curl, lips, a sideburn with carved strands, and an ear swirl. `hero` has a tapered phoenix eye, sword brow, red lips and a forehead mark; `old` has a crinkled smiling eye, a hollow drooping white brow, wrinkles and a smile |
| `taper` / `taperMid(g, pts, w, col)` | brush-like ribbons: brows and eye lines taper one way; beards and plumes grow from a fine root, swell, and end in a point |
| `rigPose(parts, x, y, pose, {e, k, flip, seed})` + `rigDraw(ctx, parts, M)` + `rigPt(M, id, x, y)` | jointed puppet by forward kinematics. Parts are listed parent-first as `{id, p, parent, at, z, s}`. The pose maps id → radians (0 = hanging down; negative swings to the puppet's front). Each joint gets its own per-exposure wobble. `rigPt` returns a world point on a part (a hand, a grip). **Reusable in any look** that needs limbs to move |
| `walkPose(ph)` + `walkBob(ph)` | shadow-puppet walk: one-piece legs swing from the hip ±.3, the body bobs on each step, sleeves swing. No knees |
| `drawPose(aim, p)` + `archerWithBow` | two-arm prop action: the bow arm points along `aim`, the draw arm folds by `p`; string and arrow are drawn live along the aim line |
| `screenBg(seed, {hot, warm})` + `lampPass(ctx, e)` + `lampK(e)` | the cloth screen (weave hatch, oil stains, dark edges) and the oil lamp behind it: a brightness wobble per exposure and a drifting warm hotspot |

Rules learned on 射日:
- **Look at real puppets before drawing one.** The first farmer was a cartoon paper doll made translucent, and the user rejected it ("差了十万八千里"). Museum photos (Wikimedia Commons, 19th-century Shaanxi, Jilin and Sichuan puppets) settled the construction:
  - a small head (about 1/7 of the height) under a large, busy headdress with pompoms or plumes;
  - a hollow face with a straight 通天鼻 line;
  - broad chest, narrow waist, and a robe that flares toward the feet;
  - every garment covered in carved lace;
  - flat red, green, blue and black on amber hide;
  - straight one-piece legs and upturned boots.
- **Show a static cast sheet before animating.** Bake the characters as a still (`shadow-cast.html` in the source project) and get the design approved. Faces took three rounds there: hollow white brows instead of solid ones, and beards that grow from a fine root instead of three sticks.
- **No rods (签子) in frame.** Real puppets have three, but the user found them cluttered. Let the puppets move on their own.
- Scale heads up about 1.3× with the part's `s`. The traditional proportion is right, but a 1080-wide phone screen needs the face to read.
- Keep the story in the silhouette: suns are carved leather discs that blacken (`sh` drawn over them) and tumble out when hit; the dawn swaps the cracked earth for a healed green piece and opens blossoms on the tree's recorded branch tips (`TREE_TIPS`).
- Sound: a bowed `huqin` (sawtooth, slide-in, vibrato) carries the tune; `bangzi` clacks mark steps and hits; `gong` marks turning points. No ambience bed.
