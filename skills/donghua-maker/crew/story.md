# Story crew (编剧组)

Purpose: turn the theme into a brief, a shot table and a cut plan before any code; fact-check and long-film rules.

## Read

| file | sections (by heading) | load | trigger |
|---|---|---|---|
| `references/shot-contract.md` | 7. Cross-shot continuity: plan the cut | always | briefing: plan the cut, out column |
| `references/styles.md` | 4. Rhythm: pacing; 4b. Film rhythm: energy over time | always | briefing: pacing, energy curve, hook |
| `references/fact-check.md` | Fact check (films that state facts...); Steps | on-demand | factual film: history, science, geography, business, product claims |
| `references/long-film.md` | Long films: chapters; Writing a chapter; What the build does | on-demand | long film: past ~60 s or ~11 shots (SKILL.md step 1) |

### 1. Brief (story before code)
Turn the theme into a shot table. Choose open story, format or style yourself and say so; ask only if the theme is unclear.

```
Title / format (landscape|portrait|square|feed) / duration / shot count
Look (styles.md §2) + palette (§3) + rhythm (§4) + key/bpm/voice (§5)
Arcs: colour (how the palette moves across the film) · growth (what gets bigger, worse or nearer each time)
Energy + hook: route (continuous|montage|hybrid), 0–10 per shot, what moves in the first 3 s (styles.md §4b)
Per shot: name · time span · one-sentence cause→effect · out: how it hands over to the next shot
          props (static sprites) · moving things (rope/particles/puppets) · camera start→end
          melody notes in this bar and what each one triggers visually · foley + ambience bed
```

The `out` column carries the film: it reads as one chain reaction (steam → note → birds → petals → girl), which makes 10 s a story and not a slideshow (shot-contract §7). Then hold the brief against the look's example: ≥ 4 of 6 rows differ (Not the demo again, below). Given a reference video, run `scripts/breakdown.py <video>` first and copy its mechanism, not its pixels.

**Length and shot count come from the theme**, not a default; state the reason in one line.

Factual film: search the claims now, while briefing (`references/fact-check.md`), and give every drawing not to scale its 示意 / 示意图 label in the shot it appears in (Schematic label, below).

| theme shape | total | shots | rhythm |
|---|---|---|---|
| mood piece, one image breathing (a moon rising, rain on a window) | 5–10 s | 1–2 long shots | slow bpm 60–80, EXPO 6–8, long holds |
| cause→effect chain (Steam Song, Red Kite, 婵娟) | 8–15 s | 3–5 | 90–110 bpm, 2–3 s per shot |
| story with a turn (setup → trouble → resolution) | 15–30 s | 5–8 | vary shot length: short for action, long for the payoff |
| greeting card / festive / loop for social | 6–12 s | 5–8 short shots | 120–132 bpm, 1–1.5 s cuts on the beat, final hold ≥ 1.5 s |
| poem or quote, one line per shot | ~2.5 s per line + 1.5 s end hold | one per line | tempo from the reading pace |

## Not the demo again
Every look has an example film (`catalog.md`). Copying its structure is the easy failure: the new film becomes the
demo with a different topic. After the brief exists, open the example and write a six-row table in the film's
checkpoint section: **structure, opening, signature shot, camera path, score shape, ending**, each as "this film /
the example". At least four rows must differ; rethink the ones that match before writing shots. At step 6, put
the contact sheet next to the example's stills as a last look. A user who asked for "like the example" overrides
this; say so in the report.

## On demand

Entries with Evidence / Why / Use are lessons proven on donghua films; add yours there (SKILL.md, Extending).

### Long film

Give the payoff shot 1.3–1.6× the others. Every shot costs about the same to build and verify; how long a film may run, and when to split it into chapters: SKILL.md step 1, `references/long-film.md`.

### Factual film

#### 4d. Fact check (films that state facts)
Run `references/fact-check.md` (Steps): require `FACT CHECK PASS`, re-run it after every text edit, report `disputed` items. A simplified picture says 示意 on screen (Schematic label, below).

**Run the fact gate even when the picture check passed.**
- Evidence: 日本历史速览 (2026-09-25), told in `references/fact-check.md`.
- Why: a still shows that text is readable, not that it is true.
- Use: every film that states anything about history, science, geography, business or a product.

#### Schematic label
A picture that simplifies (a cutaway, a curve drawn without data, a map with places moved for clarity) must tell the
viewer so on screen, or it reads as measured fact. In `facts.json`, give that `visual` entry `"schematic": true` and
`"label"`: the on-screen string that says 示意 (for example 「议题突然消失（示意）」). `fact_check.py` fails when the
label is missing, is not in the film or does not say 示意 (English films: "schematic", "not to scale", "illustrative").

### Montage

- **Tighten a montage by shortening shots, not by raising the tempo**: keep one BPM and cut each section a few eighths
  shorter (6 → 4 → 3 → 2 → 1), then hold the last shot long for the payoff. The ear hears it speed up; the beat grid
  stays clean.

### Imported hypotheses (not yet proven)

#### Imported, not yet proven here

From another code-animation skill (art-style speed-run films, 36 looks). Treat each as a hypothesis: when a donghua film
confirms or refutes one, move it up with the evidence, or delete it.

- **Film rhythm checklist (`styles.md` §4b: route, energy curve, hook within 3 s, burst, stop)**. Imported from huashu-motion's
  measurements of launch films. First trial, 2026-10-19, on 晚安纸条 (7 shots, 28 s), which was not built with it: shot lengths
  4 / 4.5 / 4 / 4 / 3.5 / 3.5 / 4.5 s, one 6–9-note music-box phrase per shot at 120 bpm, no burst, no stop, only a window
  lighting at ~2 s in the first 3 s. A blind reviewer (stills only) given the new attention question also said nothing hooked
  it in the first 3 s, matching the code reading. Limits: one film, no negative control (no film known to be well paced was
  run), and the same reviewer mislabelled which shot a dead stretch belonged to, so stills cannot place pacing problems in
  time. The reviewer without the new question found the same logic and text defects but gave no pacing verdict. Promote
  only after a film built with the checklist is judged better, or a well-paced film passes it.

- **Stillness is a choice of grammar**: story and type-led films sit still on the punchline; a style showcase must stay
  alive. Read `qa.py`'s static column against the film's grammar.

- **When the first shot has no cut to borrow, let it paint itself**: strokes write on, colour plates land one by one,
  pixels light row by row. Frame 0 is otherwise a blank sheet.
