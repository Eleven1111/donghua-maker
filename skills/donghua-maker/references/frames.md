# Character frames (opt-in)

Code-drawn puppets stay the default: free, deterministic, and they take any look. Faces and human figures are where
they fail most. 射日's first cartoon and 小猫钓鱼's first cat head were both rejected (`lessons.md` #1), and in another
code-animation skill's 36 looks the character was the weakest part of most of them. When a person, an
anthropomorphic animal or a recurring hero must read as *right*, draw the character as image frames, by an image
model or by a person, and let the code do what it is good at: position, size, facing, timing, material, props.

Keep code puppets for geometric characters (blocks, robots, birds, a cat in a flat look), silhouettes (皮影 cut from
a reference-checked cast sheet), stick figures and anything that must deform continuously (ropes, cloth, squash).

## Two sources
- **An approved frame set.** The user's own character (8 transparent poses per action, say). Most consistent; make
  sure its drawing style fits the look, or add the look's material on top (below).
- **Generated per look.** An image model that takes a reference image (a character sheet, or a frame from an approved
  set) draws the poses in this film's look. The user picks the model and pays for it; this skill only imports.

## Writing the prompt (generated frames)
- **The look's construction rules in words**, not "in the style of X": "flat colour shapes, no outlines, shadow one
  shade darker of the same hue"; "torn-paper pieces with a white cut edge"; "black marker line art with orange hatching".
- **The pose the shot needs**, in screen terms: "side-on, facing right, pointing to the right".
- **A sheet, not single images**: "8 frames of the same character in a 4×2 grid; each frame stands at the bottom centre
  of its cell, same size in every cell; only the key poses, the in-betweens follow". State the count first.
- **Background**: flat `#00B140` green, no shadow, no ground line, no text. White clothes are fine on green; a white
  background would eat them.
- **Identity locks written literally**: "pure white hat (not light grey)", "round black glasses", "watch on the left
  wrist". Models drift on exactly the details nobody wrote down.
- A character under 18: long, modest clothing, written explicitly. Some moderation rejects the whole sheet otherwise.
- Run a batch one prompt at a time, and check that each image really came from the model: the output folder gained a
  file, and the PNG carries no editor metadata that would mean it was pasted together.

## Import
```bash
python3 scripts/frames_import.py film.html walk.png --name walk --grid 4x2 --source "<model>, prompt walk.txt" --licence "<terms>"
python3 scripts/frames_import.py film.html wave.png --name wave --gaps        # poses side by side
python3 scripts/frames_import.py film.html boy.png --name boy --white          # line art on paper
python3 scripts/frames_import.py film.html --list
```
The script keys off the green (and pulls green spill off the edges), crops every frame of a sequence to one shared
window anchored at the feet so the character doesn't jitter between poses, caps height at 600 px, and writes a FRAMES
block plus `<film>-frames/frames.json` (file, sha256, source, licence). Keep the whole block under about 4 MB: the film
is one HTML file. Before publishing, `--source` and `--licence` must be filled: whether a model's terms allow the use is
the user's decision, and the ledger is what they decide from.

## Use in a shot
```js
build() { this.walk = [...Array(8)].map((_, i) => frameSprite('walk_' + i, 420)); },   // bake once: 420 px tall
draw(ctx, st, sq, e, cam) {
  setCam(ctx, cam, 1);
  put(ctx, this.walk[Math.floor(sq * 9) % 8], x, GROUND, 0, 1, { flip: dir < 0 });  // 9 poses a second, feet on GROUND
}
```
- `frameSprite()` bakes a frame like any cut-out: the look's paper texture and contact shadow. Pass `{ shadow: null }`
  for a drawing that lies on the paper. Use `sq` (the stop-motion clock) for the pose so poses change on exposures.
- Limited animation: switch poses, never tween between them. Code moves the whole frame (walk path, bob, squash on
  landing); the drawing carries the pose.
- **Give the frame the look's material**, or it reads as pasted on: brush strokes, halftone, grain or an ink edge
  drawn over it with `source-atop`, the same treatment the backdrop gets. Characters that skipped this step were the
  weakest part of most looks in the skill this route comes from.
- Props the character touches (a stone, a cup, ripples) stay code-drawn and are placed at the hand or foot position
  of the current pose.
- Run `qa.py` as usual: frames are decoded at boot, so seeking stays deterministic.
