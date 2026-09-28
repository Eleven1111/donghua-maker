# Look: nianhua / 年画

Yangliuqing-style New Year print. A fine black key-block outline sits over soft hand-coloured washes on cream paper. The cast is a chubby child, a big carp, lotus flower, leaf and pod, and a blue water band, with four title characters and a red seal. It was studied from public-domain Qing prints (莲年余利, 连生贵子); the composition is our own.

Verified in 年年有余 (`assets/example-nianhua.html`, 16:9, 12 s, 3 shots, 120 bpm, fonts `wenkai`).

## Rules taken from the prints
- **Child**:
  - a huge head about as big as the torso;
  - a shaved blue-grey scalp with two or three black heart-shaped tufts;
  - almond eyes, small red lips and pink cheeks;
  - a red dudou with a dark top band and a blue patterned collar;
  - gold bangles at the wrists and ankles.
- **Carp**: rows of scale arcs, big flowing orange fins with striations, and a bulging eye with concentric rings.
- **Lotus**: petals shade from white at the base to pink at the tip. The leaf has radial veins, and the stem is dotted with prickles.
- **Water**: a pale blue wash band with short line ripples.
- **Title**: four large brush characters split left and right of the head.

## Toolkit (`toolkit-nianhua.js`)
| call | what it does |
|---|---|
| `nhPrint(g, scene, P)` | runs `scene(api)`. Each shape is washed and then outlined, in painter's order. `P = {line, skin, yellow, red, green, blue}` gives the print-in amount (0..1) of each block; an arriving block is faint and misregistered, then snaps into place. |
| `api.fill/line/both/tf/raw` | wash (colour key → block group via `NH_GROUP`), key line, both, local transform, custom drawing |
| `nhChild(a, x, y, s, t, {blink, nod, reach})`, `nhFish(a, x, y, s, r, t, {wag, flex})` | the two characters |
| `nhLotus`, `nhLeaf`, `nhPod(…, stem)`, `nhWater` | the props |
| `nhTitle(g, chars, pos, size, k(i))`, `nhSeal`, `nhPaper` | title characters pressed in one per note, the seal, the paper with fibres |

## Rules for the film
- 套色 is the signature move: key block first, then one colour block per beat, with a small press shake.
- Wash each shape and outline it immediately. Two global passes (all washes, then all lines) show the lines of hidden parts through later shapes.

## Pitfalls met while building it
- The global two-pass press drew hidden outlines through the apron and head; fixed by painter-order per shape.
- The first head was too small for the look (it read as a doll); it is now scaled 1.18. A pod without a stem floated in the air.
- The kai title was too thin next to the prints, so it gets a stroke of 4.5 % of the size.
