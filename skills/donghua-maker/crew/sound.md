# Sound crew (音效组)

Purpose: run the sound pass (score, sound effects, mix) and, when asked, the narration track.

## Read

| file | sections (by heading) | load | trigger |
|---|---|---|---|
| `references/audio.md` | 0. The pipeline (run this for any film...); 1. Roles and buses; 2. Ducking; 4. Music: `groove()` plus a lead line; 6. Verify | always | any film with sound that matters |
| `references/audio.md` | 5. Recorded sounds first, synthesis as the fallback | on-demand | `audio_director.py` does it; read only for hand-picked sounds |
| `references/audio.md` | 0. The pipeline: verified-run evidence and lessons; usage and provenance | on-demand | debugging the pipeline; provenance question |
| `references/audio.md` | 3. The UI sound set | on-demand | UI films (launch, ui-demo, opsboard) |
| `references/audio.md` | 7. Stems: arrange per part... (optional) | on-demand | per-part stem music path |
| `references/shot-contract.md` | 6. Library: sound (all synthesised, no samples) | always | writing sound events |
| `references/shot-contract.md` | 9. Narration (`k: 'vo'`) | on-demand | narrated film |
| `references/styles.md` | 5. Music | always | choosing the mood |
| `references/narration.md` | all steps (line budget; MiniMax path; mix; verify) | on-demand | narrated film; MiniMax steps only for the paid voice |
| `references/setup.md` | SoundFont | on-demand | first run, music |
| `references/looks/biz-explainer.md` | Sound | on-demand | with that look |

### 4c. Sound pass (films whose sound matters)
Once the picture is approved: `python3 scripts/audio_director.py <film>.html --mood <mood> --key <key> --run --check`. PASS means measured, not auditioned. Downloads are pre-authorised and logged in `sources.json` (`references/audio.md` › Rules). A film without an `SMP` object must be re-scaffolded first.
When `audio_director.py` is not run (no downloads allowed, or a synthesised-only score), the audio gate is the browser check: `await __film.wav()` returns base64, so its length must be ceil((44 + DUR×192000)/3)×4; `__film.score()` holds the expected events; `__film.audio()` warnings are empty or explained (`references/audio.md` §6).

## On demand

Entries with Evidence / Why / Use are lessons proven on donghua films; add yours there (SKILL.md, Extending).

### Narrated film

#### 4b. Narration (only when the user asks for a voice)
`references/narration.md`: one line per shot (MiniMax at speed 1.15 reads ~5.3 字/s; edge-tts rates come from the film type's table), free `scripts/narrate.py` or MiniMax `scripts/voice.py` (key from `.env` only), embedded via `VO.src`, no ambience bed under the voice. Then `scripts/voice_check.py <film>.html`: each line transcribes back, or gets listened to. Pronunciation stays UNVERIFIED.

#### Voice transcribes back
`voice_check.py <film>.html` transcribes every embedded narration line with whisper.cpp and compares it with the
script (digits read as Chinese numerals). A line over 0.25 character error is listed to listen to: the text-to-speech
misread it, or the speech-to-text misheard it, and only a person can tell which. After listening to a line that is
right, record what the model hears in `<film>-vo/heard.json`; it then passes until the audio changes. Never fill
heard.json without listening. Passing means transcribed, not auditioned: tone and pace stay UNVERIFIED.
Calibration (2026-10-22, ggml-small): correct lines 0–0.21, a line compared with another line's script ≥ 0.86;
swapping two clips failed both.

### Music motif

- **One short motif through the whole film, re-voiced per section** (each section's own instrument), over a single
  four-chord loop. Hard attacks on the cuts; no crossfades or whooshes in a montage.

- **The reveal frame is the accent**: put the downbeat on the frame where the new thing *shows*, not where its move
  starts. A transition's first visible change and a punch belong on the same beat.
