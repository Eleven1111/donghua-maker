# Film type: general

A film that is neither a lesson (`classroom.md`) nor a social short (`creator.md`): a story, a mood piece, a card, an explainer for no named audience.
This is the director's default. Where `SKILL.md` or a handbook says otherwise, they win; this sheet adds no rules of its own.

## Brief
- **Format**: chosen by the theme: landscape, portrait, square or feed (`crew/story.md` › 1. Brief; the formats are in `scripts/scaffold.py`).
- **Length and shot count**: from the theme-shape table in `crew/story.md` › 1. Brief; state the reason in one line. Past about 9 shots or 30 s, `SKILL.md` step 1 applies (chapters, `references/long-film.md`).
- **Look**: `references/styles.md` and `references/catalog.md`; a saved profile (`references/onboarding.md` §4) sets the defaults.

## Picture
`crew/picture.md`: steps 2-5 as in `SKILL.md`, including the sample of shot 1 (step 3).

## Sound
`crew/sound.md`: the sound pass (4c) for films whose sound matters; narration (4b) only when the user asks for a voice.

## Review and delivery
- **Gates**: the director's steps 5 and 5b only (`crew/review.md`), including `python3 ../donghua-creator/scripts/platform_check.py <film>.html --read-only` (needs `donghua-creator` installed); plus 4d (`crew/story.md` › Factual film) when the film states facts.
- **Deliverable**: the HTML only (`SKILL.md` step 6); no video before an explicit go (step 8).
