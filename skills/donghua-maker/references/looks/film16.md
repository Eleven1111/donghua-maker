# Look: film16 / 16mm 老纪录片

A black-and-white 16 mm documentary. It opens with the projector countdown leader (numbers in circles with a sweeping wedge, the beep on 2), then an ornamental intertitle card in a serif face, then spot-lit subjects on a dark ground with typewriter captions. The print is worn: heavy grain, gate weave (the frame wobbles a few px per film frame), exposure flicker, vertical scratches that last several frames, dust and a stray hair, and burned edges. All damage runs at a 24 fps cadence, so it reads as film, not video.

Verified in 守灯人 (`assets/example-film16.html`, 16:9, 12 s, 3 shots, 120 bpm).

## Toolkit (`toolkit-film16.js`)
| call | what it does |
|---|---|
| `fmG(v, a)` | grey of value v; use only greys |
| `fmWeave(t, amt)` → `[dx, dy]` | per-film-frame offset; `ctx.translate` it before drawing the picture |
| `fmPost(g, t, {flicker, scratches, dust, burn})` | the worn-print pass in screen space; call last |
| `fmLeader(g, n, u)` | countdown leader, number `n`, sweep `u` 0..1 |
| `fmCard(g, lines, k, {y, m, track})` | intertitle: lines `[text, size, italic, gap]`, `'—'` = ornament rule |
| `fmType(g, str, x, y, size, k)`, `fmSpot(g, x, y, w, a)` | typewriter caption with cursor, spotlight cone |

## Rules
- No colour at all. Light comes from a single source: spot, beam or moon.
- Put the countdown beep on 2, give it a 1–2 frame white flash, and end the leader on black before the card.
- Score it with projector crackle (low-density `rustle`) and shutter clatter (quiet `tick` at 4 per second) under the music.
- Keep captions inside the camera's visible area; a camera push crops the lower left first.

## Pitfalls met while building it
- The caption started outside the pushed-in frame, and the beam's sweep reached into the sea. The sweep is now limited to the sky, π + .3 ± .34.
