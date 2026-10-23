# AGENTS.md — working on this repo

Read by Codex, Cursor, Antigravity, Claude Code (via `CLAUDE.md`) and any agent that follows the AGENTS.md convention.
This file is for **changing the repo**. To **make a film**, use the skills in `skills/` — install them with `./install.sh`.

## Layout
- `skills/donghua-maker/` — the base skill: `SKILL.md` (workflow, kept under 500 lines), `references/` (loaded on demand, one level deep), `scripts/` (Python CLIs), `assets/` (engine, toolkits, verified example films).
- `skills/donghua-classroom/`, `skills/donghua-creator/` — scene packs; they call the base by sibling path (`../donghua-maker/scripts`), so all three must sit in the same skills folder.
- `agents/` — the one-sentence director (`donghua-director`; it picks the film type from the request) (Claude Code / Cursor subagent format). `install.sh` also copies them into `donghua-maker/directors/` so terminals without subagents follow them inline.
- `tools/validate.py` — the repo gate. `install.sh` — installs into any terminal.

## Rules
1. **Run `python3 tools/validate.py` before every commit** and `npx -y skills-ref validate skills/<name>` after touching a `SKILL.md` frontmatter. CI runs both.
2. **Agent Skills spec**: `name` = folder name, lowercase-hyphen; `description` ≤ 1024 chars and says what + when + when not; `SKILL.md` ≤ 500 lines / ~5k tokens. New detail goes to `references/`, never into the description or the main file.
3. **No machine paths.** Inside skills write `<skill-dir>/…` or a relative path; in agents write `<skills-root>/…`. Scripts locate siblings with `Path(__file__)`. Never `~/.claude/skills/…`.
4. **Secrets only from the environment / `.env`.** Scripts read keys, never print them; the validator greps for key shapes.
5. **Library grows from verified films only** (how to build a look: `skills/donghua-maker/references/new-look.md`). A new look = `assets/toolkit-<look>.js` + `assets/example-<look>.html` (+ `-fonts/` if fonts are embedded) + `references/looks/<look>.md` + a row in `references/catalog.md` and `references/styles.md` + the README table. The example must pass `scripts/stills.py` with zero page errors.
6. **No names of living artists or studios inside films or look toolkits** — copy the technique only. Trigger phrases in `references/catalog.md` may quote how users ask ("像某某那种"), because that is what users type.
7. Films are deterministic: no `Math.random()` in `step`/`draw`; use `rng(seed)` / `hash()`.

## Verify a change
```bash
python3 tools/validate.py                                  # spec, links, scripts --help, scaffold smoke test of every look, secrets
python3 skills/donghua-maker/scripts/stills.py <film>.html --shots   # full-res stills + page-error gate (needs Playwright)
python3 skills/donghua-maker/scripts/qa.py <film>.html               # QA PASS: page errors, determinism, backdrop leak
```
After touching `assets/engine.html` or a toolkit, run `qa.py` on a scaffolded film and on at least one example that uses
what you changed. `validate.py` only parses the JavaScript; it never runs a film. A canvas-state leak between shots and
three backdrop leaks all parsed fine and were caught only by `qa.py`.

## Maintainer notes (moved from references/lessons.md)

**7. Reset shared drawing state between shots.**
- Evidence: paper-night — 写字 left `lineCap = 'round'` on the canvas, so later shots looked different when reached in
  order than when opened directly. Wrapping each shot's `draw` in `save()`/`restore()` in the engine removed it in
  paper-night, clay-fishing and chanjuan, with every other film's numbers unchanged.
- Use: never rely on canvas state set in another shot; the engine now resets it, and `qa.py` catches regressions.

**8. A fix in `engine.html` does not reach the example films: each embeds its own engine copy.**
- Evidence: 2026-10-19, `qa.py` on `example-torn-paper-night.html` (catalogued as verified) returned QA FAIL: 5 nondeterministic
  frames in 夜城 and 纸飞机, identical on a rerun. Cause: its render path called `s.draw(...)` without the `save()`/`restore()`
  wrap that #7 added to the engine, so a stroke state set in one shot leaked into the next (the dashed trail behind the paper
  plane drew differently when a frame was reached in order vs cold). The one-line wrap on that call gives QA PASS with 0
  nondeterministic frames; the unpatched copy is the control that still fails. 21 stills compared before/after: 18 identical,
  3 differ by about 0.1% of pixels (the trail), nothing else.
- Why: lessons are written against `engine.html`, while films are copies. A check that passes on a fresh scaffold says nothing
  about an old example.
- Use: when a film or example fails `qa.py` determinism, first diff its render path against `engine.html`'s.
  Sweep 2026-10-20, `qa.py` on all 33 examples: 27 PASS; 6 FAIL. `example-film16` had the same nondeterminism (灯塔, 2 frames)
  and went PASS with the same one-line wrap. The other 5 are backdrop leaks (layered ×3 shots, qinglu, red-kite,
  shadow-archer, spring-rain), a different class that needs the film's own camera start moved, not the engine wrap, and
  are still open. A static grep for the missing wrap (31 files) over-predicted: only 2 of them were nondeterministic.

