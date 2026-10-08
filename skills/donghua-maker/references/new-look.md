# Building a new look (for a person or a dispatched agent)

Hand this page to whoever builds the look, plus one paragraph on the film it is for. A look is finished only when
all of its parts exist and pass (AGENTS.md rule 5): `assets/toolkit-<look>.js`, a verified `assets/example-<look>.html`,
`references/looks/<look>.md` (listed in shot-contract §7b), and a row in `references/catalog.md`, `references/styles.md` and the
README table.

## Read first, in order
1. `references/shot-contract.md` (the shot interface, the core helpers, §7c transitions) and `references/lessons.md`.
2. `references/catalog.md`: find the nearest existing look, read its `looks/<look>.md`, open its example. **Reuse its
   toolkit functions before writing new ones.**

## Two starting points
**With a reference video**: run `scripts/breakdown.py` first. Its reference frames set the composition, palette and
motifs; its motion map says what actually moves; its cut list and tempo set the rhythm. Copy the mechanism, not the
pixels.

**Without one** (the usual case):
1. Write down the 3–5 form elements that make the look recognisable (material, mark-making, palette, motifs, traces of
   the medium). Take them from primary sources (museum photos, period prints), not from memory.
2. Give each element a way to move that belongs to its world: water trembles, paper lifts, gold glints, a print
   plate slips out of register, film gate weaves.
3. Ask how the real thing is made (brushed, cut, printed, pasted, inlaid, sprayed) and write that process as the
   renderer. A palette alone doesn't make a look.
4. Make one frame first and put it beside the sources. When the look is new to the user, show three directions on
   that frame (SKILL step 3) before animating.

## Hard requirements
1. **Deterministic**: `rng(seed)` from `reset()` or `hash()`; never `Math.random()` in `step`/`draw`. `qa.py` checks it.
2. **Alive**: each shot has one main action plus 2–4 small loops taken from the look's own motifs, readable within the
   shot's length.
3. **No flicker**: don't reseed a whole-frame texture every few frames; move its field continuously. Keep `boil()` for
   puppets and line work. A scrolling pattern wraps at its true period.
4. **Characters go through the look's material** (stroke, grain, paper, halftone, ink edge, plate offset), or they read
   as pasted on. Use `frameSprite()` frames (`references/frames.md`) when a face or figure must read right.
5. **Text**: draw titles and signs in the look's material where you can; when a font is used, embed it with
   `scripts/font_embed.py` (a missing glyph silently falls back to a system font on another machine).
6. **Wear stays off characters**: peeling, stains and scratches go on the ground and the backdrop; on a figure they read
   as damage to the figure.
7. **Cost**: bake static layers once (`backdrop`, `sprite`, offscreen canvases); a look whose shots are far slower than
   the others in `qa.py`'s ms column needs caching.
8. **A transition kind, if the look has a natural one** (shot-contract §7c): the new picture should grow out of the
   look's material. Prove it in the example film before adding it to the engine.

## Self-check (at least three rounds)
- `python3 scripts/stills.py <example>.html --shots`, beside the sources (and `scripts/compare.py` when there is a
  reference video).
- `python3 scripts/qa.py <example>.html` must print `QA PASS`. Read its motion, static and jump columns against the
  look's intent.
- Four questions: does it read as the look at a glance? Does the character belong in it? Is the picture alive without
  flicker or stutter? Is anything broken (occlusion, gaps, misregistration, empty areas, overlapping text)?

## Hand back
The files above, plus in `looks/<look>.md`: the pipeline in order, key parameters and colour values, how each motif
moves, the transition kind if any, the cost per frame, pitfalls met, and what could still be better. Be concrete and
give numbers. Then an independent review of the example film (`references/review.md`).

**Nobody to ask** (a batch or overnight run): build the direction the brief names, and list in the hand-back the two
other directions you would have offered, one line each, so the user can pick one later.
