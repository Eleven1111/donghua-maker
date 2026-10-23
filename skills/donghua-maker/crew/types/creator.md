# Film type: creator (自媒体短视频)
A social short: a topic made into a 9:16 vertical animated short for 抖音 / 视频号 / 小红书, with a publishing kit.
This sheet overrides the director's (`SKILL.md`) defaults wherever they differ: format, length, shot count, voice rate, gates, deliverables.
Its own scripts are `../donghua-creator/scripts/platform_check.py` and `publish_kit.py`.

## Brief

### Donghua creator: self-media shorts

This is a scene pack on top of `donghua-maker`. The base handles drawing, facts, sound, voice and fonts. This pack decides **what makes someone stop scrolling, what the platform UI will cover, and what goes out with the video**.

Before you start, read `SKILL.md` (§1–5, 4b and 4d), then `references/fact-check.md`, then the file for the look you pick.

Before step 1, run the base skill's step 0 (`scripts/profile.py find`, `references/onboarding.md`): a saved profile fills in the niche, audience and platforms, so you ask less.

### Step 1 · Brief: angle before shots
Write the brief in the film's `checkpoint.md` section, not in a new file. It needs:
- **Audience and promise.** Who is watching, and what they get in one sentence. Example: "养猫的人 · 30 秒知道猫为什么爱钻纸箱".
- **Hook line.** A question, a surprising number or a counter-intuitive claim. It has to be on screen **and** spoken within the first second. Never use clickbait the film doesn't pay off; the fact gate still applies to the hook.
- **Payoff and ending.** The last shot pays off the hook and ends on an action: a question for the comments, or "关注看下一期…". Keep the ending to one line, not a sales pitch.
- **Series.** If the user makes more than one, keep a series name and an episode number in the title card for consistency.

### Step 1 · Shape of a creator film
- **Format.** Scaffold with `--format portrait --narrated` (1440×2560, 9:16). The 小红书 version is the centre 3:4 crop of the same film, so everything important stays inside the crop band (y 12.5 %–87.5 %).
- **Length and shots.** 20–45 s with 6–10 shots, cut every 2–4 s. The first cut comes by 3.5 s. Give the payoff shot room.
- **Look.** Choose it by topic: explainer or biz-explainer for knowledge, layered for story explainers with a recurring character, clay3d, torn-paper or watercolor for stories and pets, ui-demo for software, pixel for games and tech. Palettes should be high-contrast, and phone screens are small: write each label with at least 72 px of text height at 1440 wide. The hook and cover title needs at least **140 px** type, because `publish_kit` wants its box to be at least 5 % of the height. At that size, 8 Chinese characters per line fit inside the safe width, so write the hook in 8 characters or fewer, or split it into two lines. A pop-in overshoot counts toward the safe area: keep scale overshoot ≤ 1.05 on titles.
- **Voice.** Use the base `narrate.py` at `rate` `+5%` to `+10%`. Creator pace is faster than classroom pace, but keep it under about 6 chars/s. Start speaking by 0.6 s with no lead-in (`"lead": 0.05` on line 1). Bookmark every label onto its word.
- **Text layout.** Keep each shot to one idea and at most two text blocks besides subtitles. Subtitles sit at 78 % of the height, so key drawings stay above about 74 %.
- **Sound.** Use a brighter mood (`bright-tech`, `cute`, `warm-business`). Follow the base narration mix rules: no ambience bed under the voice. `audio_director --check` lists `offGrid` cues. That list is informational: word-timed labels and picture-tied sfx sit off the music grid on purpose; only cuts must be on it.

## Picture

No picture rules of its own; format and look are set in Shape of a creator film (Brief). Otherwise `crew/picture.md`.

## Sound

No sound rules of its own beyond Shape of a creator film (Brief). Otherwise `crew/sound.md`.

## Review and delivery

### Step 5 · Gates (all must pass on the final file)
1. **Base gates.** `stills.py` (0 page errors), `fact_check.py` PASS, `narrate.py --check` PASS, `font_embed.py --check` PASS, `audio_director.py --check` PASS, `voice_check.py` PASS (or each line it lists listened to) and `pace.py` PASS (`crew/review.md` › Reading hold, `crew/sound.md` › Voice transcribes back, `crew/picture.md` › Pace).
2. **`python3 ../donghua-creator/scripts/platform_check.py <film>.html`** must print PLATFORM CHECK PASS. It reads every piece of text the film draws, frame by frame (`__film.textBoxes`), and checks:
   - **SAFE**: text stays inside 抖音's safe area (top, bottom, sides, and the right-hand button column);
   - **CROP**: text also fits inside the 小红书 3:4 crop;
   - **OVERLAP**: no two texts collide, subtitles included;
   - **HOOK**: text by 1.0 s, voice by 0.6 s, and the first cut by 3.5 s;
   - **READ**: once fully drawn, each text stays up for 汉字 ÷ 4.5 + letters and digits ÷ 15 + 1.5 s. A sentence of 6+ characters held under half that fails; shorter holds are notes. Watch the end card, which the film's end cuts short.

   Text baked into a sprite with `drawImage` is invisible to it, so draw labels live.
3. **`python3 ../donghua-creator/scripts/publish_kit.py <film>.html`** reads `<film>-publish/pack.json` and must print PUBLISH KIT PASS. It checks:
   - **COVER**: the frame at `cover_t` (subtitles off) carries a title-sized hook, inside both 抖音's visible cover band and the 3:4 crop;
   - **COPY**: title, description and tags are within the limits;
   - **LICENCE**: every embedded sound, music track and font has a commercial-OK licence. NC, ND or unknown licences fail. CC-BY credits are added to the description.

Platform numbers are third-party rules of thumb, and the right-column width is an assumption. Report them as UNVERIFIED until checked in a real upload preview.

### Step 6 · Copy rules (pack.json)
- One entry per platform, in its own voice:
  - **抖音/视频号**: title ≤ 30, a short description (≤ 300), ≤ 5 topics.
  - **小红书**: title ≤ 20 and keyword-first, body ≤ 1000 with the keywords early, ≤ 10 topics.
- Copy only claims the film makes. Every number in the copy must be one that `facts.json` verified. No health, finance or legal promises. No 最/第一/100% absolute claims (广告法).
- Put the hook frame as `cover_t`: pick a moment where the hook title is fully drawn and nothing is mid-animation.

### Step 6 · Deliver
- `<film>.html` (9:16, voice and subtitles) for review in the browser. Export only after the user approves (base §8). The kit then lists the exact commands for `-9x16.mp4` and the `--aspect 3:4` 小红书 version.
- `<film>-publish/` holds `cover-9x16.jpg`, `cover-3x4.jpg`, `发布包.md` (copy-paste text per platform, attributions, licence table) and the `.srt`.
- **Never post to any platform.** The creator uploads the files themselves.
- Always list as UNVERIFIED:
  - nobody has listened to the voice (`voice_check.py` only transcribed it);
  - the safe areas haven't been previewed on a real account;
  - edge-tts commercial terms. For monetised accounts, recommend recording their own voice over the same script, or a licensed TTS.
