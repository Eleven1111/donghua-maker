# Sound design, music and mix

## 0. The pipeline (run this for any film with sound that matters)
```
VIDEO PLAN (film score + AUDIO_PLAN)          scripts/audio_director.py <film>.html --mood … --key … --run
        │  Audio Director → plan.json, brief.json (BGM), needs.json (SFX)
   ┌────┴──────────────────────────┐
  SFX                              BGM                         scripts/music_render.py brief.json -o …/bgm
  sfx_search.py search             planner: sections → chords/density (intro·detail·reveal·outro)
   local lib → Mixkit → Freesound  MIDI (own SMF writer) → instrument selector (GM programs per mood)
  sfx_search.py rank               performance: velocity (metric + phrase), articulation, round-robin, humanize
   meta 45% + audio fit 55%        SoundFont render (fluidsynth + GeneralUser GS) → 48 kHz WAV
  sfx_import.py (trim/level/encode/sync, licence record) ◄── bgm.wav joins as role music
   └────┬──────────────────────────┘
  SAMPLES block in the film: SMP.lib + SMP.map (synth cue kind → recorded id, round-robin) + SMP.bgm
        │
  engine MIX BUS: per-role EQ + compressor → glue compressor · reverb (generated room or MIXBUS.ir) · ducking
        │
  export.py: two-pass loudness → 48 kHz master → MP4 (re-measured), --stems for listening
```
- **The film's own score code stays unchanged.** The director maps each synthesised sfx kind to a sound category (`KIND2CAT`, overridable in `AUDIO_PLAN.map`; `null` keeps it synthesised). The engine plays the recorded winner in its place, with the recorded landmark on the synth cue's landmark, and falls back to synthesis per category when no winner exists.
- `AUDIO_PLAN` (optional, in the story) is `{ mood, key, sections: [{t0, t1, kind}], hits: [s], map, queries }`. Without it, sections come from the shots.
- **Moods (music_render):** `bright-tech`, `warm-business` (strings, piano, fingered bass, brush kit), `cute` (nylon strum with swing, marimba lead), `thoughtful` (no drums), `chinese` (koto, flute), `calm-tech`.
- **Setup (once):**
  - `brew install fluid-synth`.
  - Put the SoundFont at `~/.local/share/soundfonts/GeneralUser-GS.sf2`, or point `SOUNDFONT` elsewhere. GeneralUser GS v2.0.3 is free for music creation, commercial use included.
  - `FREESOUND_API_KEY` (in `~/.config/donghua/.env` or any source in `setup.md`) is optional; without it the SFX branch uses the local library and Mixkit.
- **Speed.**
  - The SFX search runs categories and downloads in parallel and fetches only Mixkit's full-length preview mp3s; the importer re-encodes anyway, so WAVs added nothing.
  - Everything is cached in `~/.cache/donghua-maker`: tag pages for 7 days, audio forever. `DONGHUA_CACHE` moves it.
  - Measured on 毛利: the old serial WAV search took 80.6 s. The whole `--run --check` now takes 14.8 s cold and 6.6 s warm.
  - Use `--check` rather than manual browser steps. A negative control (a copy with `DUCK.on = false`) must FAIL.
- **Verified end to end** on 毛利是怎么来的 (the new-engine copy; 40 s pipeline run):
  - Four categories came from Mixkit: click, paper, stamp, whoosh.
  - The rendered bed keeps its section dynamics (bed alone: intro −21, detail −15, reveal −13.7, outro −20.5 dB RMS).
  - A recorded whoosh landed 12 ms from the synth landmark.
  - The MP4 measured −16.03 LUFS / −4.4 dBTP.
- **Lessons from that run:**
  - Negative terms matter: `paper` first picked "Page back chime".
  - A landmark deep in a file needs a start before 0, so the engine skips into the file instead.
  - Music must be levelled with one linear gain; dynamic loudnorm flattened the arrangement.
  - Some Mixkit WAVs return 403, so the search falls back to the full-length preview mp3.

Read this when writing `baseScore()` / `score()` and before exporting. Recorded sounds come first whenever a fitting, licensed recording can be found; synthesised voices fill the categories that have none. Both kinds end up inside the single HTML file. The approach is adapted from the audio module of op7418/guizang-product-video-skill (AGPL-3.0). Only the ideas are reused here: role-separated music and SFX, cue-driven ducking with per-role presets, a UI sound vocabulary, layered code-composed music, beat-grid alignment reports and two-pass loudness. The code is a new Web Audio implementation in `assets/engine.html` and `scripts/export.py`.

## 1. Roles and buses
Every score event has a role, set by `roleOf(e)` or given explicitly as `e.role`:
- **music**: `mb chord pluck pad keys bass kick brush shaker bed`. This is the bed that makes way.
- **sfx**: every other kind (`ui`, `whoosh`, `tick`, `clink`, `thump`, `chip`, …). These are the actions.
- **voice**: `vo`, the narration.

Each role has its own bus into the master. A melodic note that *is* an action (a block popping in on a note) can stay `mb`; give it `role: 'sfx'` if it must not be ducked.

## 2. Ducking (music makes way)
The music bus dips under every sfx and voice cue. It starts 40 ms before the cue's **audible landmark** (`t + sync`), holds, then recovers. When cues overlap, the deepest dip wins; dips never multiply into silence. The curve is computed once from the score (`duckCurve`, 200 Hz). The same curve drives live play (from any seek point) and the offline mix, so what you hear in the browser is what gets exported.

| cue | dip dB | hold / release s |
|---|---|---|
| `ui:click` `clickAlt` `toggle`, `clink` | 3 | .10–.12 / .20–.24 |
| `ui:pop`, `thump` | 3.5 | .12 / .24 |
| `ui:typing` | 2.5 | .35 / .25 |
| `whoosh`, `ui:sweep` (transitions) | 4 | .16–.20 / .30–.35 |
| `ui:success` `error`, `ui:resolve` | 5 | .35–.55 / .35–.45 |
| `ui:ding` (notification or done) | 6 | .45 / .40 |
| `vo` | 6 | the clip's `dur` / .40 |

These are starting points to adjust by ear, not a standard. Override per event with `duck: {db, hold, release, attack}` or `duck: false`, or globally with `DUCK.on = false` or `DUCK.depth = .7`. If the music audibly pumps, remove unneeded cues or reduce the depth before raising the master.

`sync` is where the sound *lands* inside its file. `whoosh` defaults to `.55 × dur` and `ui:sweep` to .36 s; clicks land at 0. **Start a whoosh early so its peak hits the cut**: `t = cut − .55 × dur`.

## 3. The UI sound set (`{ t, k: 'ui', kind }`)
`click` `clickAlt` (alternate them on repeated clicks), `pop` (small appearance), `toggle` (a two-note state switch), `typing` (a rhythmic cluster of about 0.5 s), `ding` (a two-note ding-dong for a notification or done), `success` (a rising triad), `error` (a falling minor pair), `resolve` (a long closing triad for the final lockup), `sweep` (a filtered rise for a big structural change).

Rules:
- **One sound role per kind of state change.** Use 4–6 roles for a 30–60 s film and fewer for a short one: select or confirm, pop or switch, typing, spatial transition, done or notification, closing.
- **Every key action gets a sound.** Pick the most feedback-worthy state change in each feature group (selected, opened, finished, notified). Don't ding every label; keep `ding` for things worth noticing, and don't use a whoosh for anything that isn't a structural change.
- **Land within 1 frame of the picture** (2 frames at most). Put the event time where the hand, cut or pop happens, not at the shot start.

## 4. Music: `groove()` plus a lead line
Layered accompaniment keeps the TASTE rule (≥3 layers: bass, harmony bed, rhythm):
```js
const CHORDS = [['D3','A3','C#4','E4','A4'], ['B2','F#3','A3','C#4','E4'], ['G2','D3','F#3','A3','D4'], ['A2','E3','A3','B3','E4']];
function baseScore() { return groove({ chords: CHORDS, thin: [[4, 8]] }).concat(MELODY.map(([t, n]) => ({ t, k: 'mb', n, v: .6 }))); }
```
- Each chord gives its root first; one chord lasts `bpc` bars. The layers are a `pad` chord, a `keys` 8th-note arpeggio in two alternating rhythms, `bass` on beats 1, 2.5 and 4 (octave), `kick` on every beat, a `brush` backbeat, and a stereo `shaker` on 8ths.
- Drums wait `intro` bars (default 1). The **last bar resolves**: an arpeggio up the chord with no drums. Place the film's final hold there, and don't let music run past the picture.
- `thin: [[t0, t1]]` drops off-beats in explanation stretches (music thins under detail and returns at the reveal). `layers: 'pad keys bass'` gives a calmer bed.
- Mood progressions (all at 120 bpm unless the film says otherwise):
  - bright tech: `Dmaj9 Bm9 Gmaj9 Aadd9`
  - warm business: `Fmaj7 Dm7 Bbmaj7 C`
  - cute: `C Am F G`
  - thoughtful: `Am F C G`
  - Chinese: pentatonic pads `C D E G A` with `pluck`.
- The lead (`mb` or `keys`) carries the story beats; each note is a visual event (styles.md §5).

## 5. Recorded sounds first, synthesis as the fallback
Real recordings usually sound richer than synthesis: a soft UI click, keyboard clusters, paper, a whoosh with air in it, a produced music bed. Look for them **per sound category**, and fill only the categories you can't find with the synthesised `ui` set or `groove()`.

**Search order**
1. The user's own library first (`python3 scripts/sfx_import.py --scan <dir>` lists audio files with durations).
2. Free libraries whose terms allow use in videos: Pixabay Sound Effects / Music (Pixabay Content License), Mixkit (Mixkit licence), Freesound (only CC0, or CC-BY with credit in the film description; skip NC).
3. The synthesised fallback.

Compare a few candidates per category and **judge the actual audio, not the title**: short, clear, no long tail that masks the next line.

| category (`cat`) | search terms | pick for |
|---|---|---|
| `click` `clickAlt` | soft UI click, button click | short, not harsh |
| `pop` `toggle` | UI pop, soft toggle, switch | light, a clear state change |
| `typing` | keyboard typing short | matches the on-screen typing rhythm |
| `ding` `success` | notification ding dong, success chime | recognisable, a short tail |
| `whoosh` `sweep` | short soft whoosh, transition swoosh | its peak can land on the cut |
| `resolve` | gentle logo chime | fits the music's key and ending |
| foley (`paper`, `cut`, `trash`, …) | paper slide, scissors snip, trash can lid | the physical action on screen |
| `music` | corporate upbeat / cute ukulele / lofi / cinematic, plus the bpm | the mood; a clean ending or a loopable bar |

**Rules**
- **Downloads.** This user has pre-authorised downloading the assets a project needs, so no per-file confirmation is needed; every download must still be logged in `sources.json`. Downloads come from the real asset page, never a guessed CDN URL. If a site needs an account, payment or a bot check (Pixabay shows a Cloudflare challenge to automated browsers), move to another source; never bypass a check and never pretend a download worked.
- **Record the licence.** Keep each sound in `<film>-audio/sounds.json` with `source` (the detail page), `author` and `license`. The importer refuses a sound without a licence (`--allow-unknown` marks it UNKNOWN, for private drafts only).
- **Fall back per category, then stop searching.** If no candidate fits, the quality is poor, the licence can't be confirmed, or the site is unreachable, use the synthesised sound for that category only and note the reason in `sounds.json` (`"method": "synth", "reason": "…"`). A good recorded click stays even if the ding has to be synthesised. Don't ask the user to keep searching, and don't repeat fruitless searches.
- **Redistribution is a different use.** Using a sound in the rendered MP4 is what these licences allow; handing out the raw file is not (the Pixabay terms forbid standalone redistribution). The film HTML embeds the audio, so treat an HTML with third-party sounds as a working file, and publish the MP4. Never copy downloaded sounds into the skill folder.
- **A recorded music bed replaces `groove()`, not the grid.** Measure its bpm and first beat (listen, or look at the transients) and set `BEAT` to match. Cuts and melody cues then follow the track, and the report's grid offsets stay meaningful. Cap it to the film length with `max` and check that the ending lands; the importer fades the last 1.5 s, which is a safety net, not a composed ending.

**Import**
```bash
python3 <skill-dir>/scripts/sfx_import.py <film>-audio/sounds.json --film <film>.html
```
The importer does the following for each sound:
- sfx: trims leading and trailing silence and levels the peak to −3 dBFS. Music: runs loudnorm to −20 LUFS.
- Caps the length (`max`, default 3 s for sfx and 60 s for music) and fades the end.
- Encodes to mp3 (sfx mono 96k, music stereo 128k).
- Measures `sync` (the loudest 10 ms, which is where the sound lands).
- Writes a `SAMPLES` block into the film; re-running replaces it.
- Writes `sources.json` with sha256 hashes.

Budget: 10 sfx come to about 150 KB; a 30 s bed is about 500 KB.

**Use** `{ t, k: 'smp', id, v, pan, rate, dur, wet }`:
- The role, the duck preset (by `cat`) and `sync` come from the library.
- **Place `t = action time − sync`** so the landmark hits the frame. `__film.audio()` shows the offset. In the test, a ding-dong landed 2.7 frames late until it was placed 0.205 s early.
- A long bed takes `dur` and resumes mid-file after a seek.
- For variety on repeated clicks, alternate two recordings or use `rate: .94/1.06`.

## 6. Verify
1. `__film.audio()` gives role counts, the duck windows, each sfx cue's landmark and its offset from the nearest 16th (`offGrid16thFrames`), and warnings: no sfx (a BGM-only mix is not a finished design), music stopping early, a cue cut by the end. The report never moves a cue; fix the event time yourself.
2. Stems: `await __film.wav({stem: 'music'|'sfx'|'voice'})`, plus `{stem: 'music', duck: false}` for the undipped bed. To check that ducking works, compare the RMS of the music stem with and without `duck` in a window just after a `ding`: it should be about −6 dB, and 0 dB in a window with no cue (the negative control).
3. Export (`scripts/export.py`) masters by default with two-pass `loudnorm` to −16 LUFS and a −1.5 dBTP ceiling (`--lufs`, `--tp`, `--no-norm`). It then re-measures the **encoded MP4**, because AAC can add peaks. `--stems` writes `<out>-music/-sfx/-voice.wav` for listening.
4. Listening is separate from measuring. Listen to the SFX stem, then the full mix, then the MP4, and check that each key action is audible, that a cue's first transient isn't masked and that its tail isn't cut. If you only measured, report it as "not auditioned".
