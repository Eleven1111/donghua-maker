# Review crew (审片组)

Purpose: browser checks, fonts, reading hold and independent review before delivery.

## Read

| file | sections (by heading) | load | trigger |
|---|---|---|---|
| `references/shot-contract.md` | 8. Test hooks | always | step 5 checks |
| `references/review.md` | Independent review (step 5b); When; Who; The packet: the film only; Prompt; After | always | films anyone else will see |
| `references/review.md` | Prompt: why items 6 and 8 exist; Faces at final size | on-demand | rationale; characters |
| `references/export.md` | Export to video (MP4) | on-demand | render, only after explicit approval |
| `references/long-film.md` | Export | on-demand | long film export |
| `references/setup.md` | Fonts when GitHub is slow or blocked | on-demand | font download fails |
| `references/looks/launch.md` | Review | on-demand | launch look |

3. The browser checks (Step 5 in the browser, below): console, `__film.wav()` and `audio()`, playback across a cut.
4. A film that may be published or used commercially embeds its fonts: `scripts/font_embed.py` (`--check` catches a stale subset).

Report what you did not check (audio not listened to, `poke` not click-tested).

## Step 5 in the browser

`stills.py`, `qa.py` and `pace.py` cover pixels and numbers. These checks need the film running in a browser. Serve the
folder (`python3 -m http.server <port>`, since file:// may be blocked) and stop the server when done.

1. **Stills, not pane screenshots.** Judge detail on `scripts/stills.py` output; pane screenshots are downscaled.
   Look at each shot's **first frame** too: a camera that starts low or high (low z, big y offset) shows past the
   backdrop, and the near-black canvas clear colour appears as a band that mid-shot stills miss. Fill the frame with
   the paper colour before drawing the backdrop, or give the backdrop more margin.
2. **Console: zero errors.** After every edit, run `node --check` on the extracted `<script>` first: a `// comment`
   appended to a one-line object literal silently swallows every property after it on that line. Reload with a
   cache-busting `&v=N`: `http.server` pages are cached, and console errors from earlier loads persist across
   navigations.
3. **Audio.** `await window.__film.wav()` must decode to `44 + DUR*48000*4` bytes (it returns base64: compare its length with `ceil((44 + DUR*192000)/3)*4`), and `__film.score()` must hold the
   expected events. `__film.audio()` must return no warnings, or each one explained. Every key action needs an sfx cue
   within 1–2 frames of its picture moment. Check ducking by measuring the music stem with and without `duck` after
   the loudest cue (`references/audio.md` §6, Verify). After `audio_director.py --check` passes, its measurements replace
   these manual steps.
4. **Playback.** Play across at least one cut: `__film.info().shot` advances and the timeline segment highlights. If
   `document.visibilityState` is `hidden`, rAF doesn't run: verify cuts with `seek()` and report live playback as
   UNVERIFIED.

## Craft checks: what the maker's own eye misses

Each check here exists because the maker, who knows what every frame is meant to say, read intent into a frame that
did not carry it. They are borrowed from three other code-animation projects (lemo-opuscar's DIRECTOR.md,
huashu-art-motion's film_gate.py, opus-video-skills' kinetic-reel) and adapted to this engine; the evidence line says
what each one caught here. Where a script exists it is the check; the rest are steps with a written result.

| # | check | when | how | verdict |
|---|---|---|---|---|
| 1 | action test sheet | step 3, before a rig enters a shot | one big sheet, stills | look |
| 2 | faces at final size | step 3 and 5b | phone-width crops, blind naming | defect if misnamed |
| 3 | not the demo again | step 1 brief, again at step 6 | six-row table | ≥ 4 of 6 differ |
| 4 | schematic label | 4d | `fact_check.py` (`schematic` + `label`) | FAIL |
| 5 | reading hold | step 5 | `platform_check.py` (creator), `--read-only` (any format) | FAIL / note |
| 6 | voice transcribes back | 4b | `voice_check.py` | FAIL → listen |
| 7 | pace | step 5 | `pace.py` | BLANK FAIL, rest notes |

## Reading hold
Once a text is fully drawn it stays up for 汉字 ÷ 4.5 + letters and digits ÷ 15 + 1.5 s. Fast is fine; make it fast
with fewer words per screen, not by cutting before people finish reading. `platform_check.py` measures every text at
least 2.5 % of the short side tall, following counters and typewriter reveals as one text: a shorter hold is a note;
a sentence of 6+ units held under half its time fails. Every film runs `platform_check.py --read-only`; the script lives in the creator pack (`../donghua-creator/scripts/`, so `donghua-creator` must be installed too), and the creator type also runs the full check.
Watch the end card: the film's end cuts it short.
Calibration (2026-10-22): the elevator film had 13 notes and no failure (its end card 「你信过“跳一下”吗？」 is up
1.8 s of 3.1 s); a verified example (flatsci) holds its 13-character closing line 1.0 s. Launch-style films flash
labels for 0.3 s on purpose; there the hold rule is a note to weigh, not a fix to make.

### 5b. Independent review (films anyone else will see)
The reviewer is a fresh-context agent that took no part in making the film: a subagent if your terminal has them, otherwise a new session; an agent that made the film reports it as pending with the packet path. It sees only the film, its stills and the `qa.py` strips (`references/review.md`).

## On demand

Entries with Evidence / Why / Use are lessons proven on donghua films; add yours there (SKILL.md, Extending).

### Verification tooling

**Prove each verification step can fail before trusting its green.**
- Evidence: `scripts/qa.py` (2026-10-08) — run on 9 earlier films, its backdrop-leak swap found leak bands in red-kite,
  shadow-archer and spring-rain that the still check had passed, and a canvas state leak in paper-night. Its first
  version reported 12 nondeterministic frames that were the browser switching raster mode, not the film; a deliberately
  broken copy of a film for every check (plus an unchanged copy that must stay green) caught that and two mutations
  that had silently changed nothing.
- Why: a check that never fails tells you as much as no check.
- Use: when you add a gate, break a film on purpose for it once, and keep one untouched control.

### Launch film: fresh-eyes read of the words

**A launch film needs a fresh-eyes read of its words, not only its picture.**
- Evidence: 拾事 (`looks/launch.md`, 2026-10-20). `qa.py` PASS, audio report clean, full-resolution stills approved by me; a blind
  reviewer (stills only, the six `review.md` questions) still found three things all of those had passed: the counter caption
  "上周，被忘在会议室里的待办" sat over a 7 → 0 count-down and said the opposite of what the count did (now "会后没人认领的待办");
  the two disclaimers were about 12 px on a 1280 frame (raised to 44 px world, 0.9 alpha); the end card spent 0.5 s on the
  mark alone before the name came in (mark draw 0.8 → 0.5 s, name 0.5 → 0.3 s). QA PASS again, 0 nondeterministic frames.
- Not acted on, on purpose: the near-empty frame at 3.9 s and the half-cropped caption at 14.0 s are the exit masks of the
  lift-away, wrong only as stills; a badge showing 3 beside three ticked rows (open count vs done count) and "strobe" risk from five
  alternating dark/light cuts are unverified without playback.
- Why: a still shows that text is there and readable, not that it agrees with the number beside it.
- Use: after the picture passes, read every caption against the figure it sits on, at phone size.

