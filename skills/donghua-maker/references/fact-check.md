# Fact check (films that state facts: history, science, geography, business, product claims)

A film that looks right can still teach something false. On 日本历史速览 (2026-09-25) the visual self-check caught
Edo placed on the wrong coast of Honshu, and the first fact pass then caught two text errors that no screenshot
could show: Jōmon "约1万年前" (sources: 12.5k–16.5k years) and "锁国 · 太平 260 年" (Edo peace ≈265 y, sakoku ≈215 y —
two facts fused into one). So facts get their own gate, run after the shots are written and again after every edit.

## Steps
1. **Before writing shots**: list the claims the film will make (dates, names, causes, numbers, places) and search each
   one (WebSearch; prefer Wikipedia, Britannica, museum/government pages; two sources when they disagree).
   Write what you find into the brief, and pick wording that survives the disagreement: a range, "约", or no number.
2. **After the shots**: `python3 scripts/fact_check.py <film>.html --init` lists every on-screen string
   (CJK text and bare years) into `<film>-facts/facts.json` as `todo`.
3. Fill each entry: `claim` (what the text asserts, in English), `status`, `sources` (URLs actually read), `note`.
   - `verified`: at least one source URL supports it as written.
   - `disputed`: sources disagree or the text simplifies; the note names the other view. Allowed, and reported to the user.
   - `na`: no factual content (shot names, era titles, rhetorical hints); the note says why.
   Fix the film, not the entry, when a source contradicts the text.
4. Add `visual` entries for every factual claim the picture makes: map positions and outlines, which coast/side,
   directions, flags, uniforms, architecture, vehicles tied to a year. Each needs a source and the still it was
   checked on (`scripts/stills.py <film>.html --shots`). `[]` only when the picture asserts nothing factual.
5. `python3 scripts/fact_check.py <film>.html` must print `FACT CHECK PASS`. It fails on any unchecked string,
   any `todo`, a verified/disputed entry without a URL, a missing `visual` list, or an entry whose text is no longer
   in the film (so a changed date re-opens the check).

The gate proves coverage and bookkeeping, not truth: the sources must be real pages you read in this run.
Never fill `sources` from memory. If search is unavailable, leave the entry `unverified` and the gate fails — report it.

Verified against controls: a date changed in the film, a deleted claim, and a claim stripped of its URL each FAIL;
editing only a code comment stays PASS.
