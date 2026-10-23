# Step 5 in the browser

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
3. **Audio.** `await window.__film.wav()` must be `44 + DUR*48000*4` bytes long, and `__film.score()` must hold the
   expected events. `__film.audio()` must return no warnings, or each one explained. Every key action needs an sfx cue
   within 1–2 frames of its picture moment. Check ducking by measuring the music stem with and without `duck` after
   the loudest cue (`references/audio.md` §5). After `audio_director.py --check` passes, its measurements replace
   these manual steps.
4. **Playback.** Play across at least one cut: `__film.info().shot` advances and the timeline segment highlights. If
   `document.visibilityState` is `hidden`, rAF doesn't run: verify cuts with `seek()` and report live playback as
   UNVERIFIED.
