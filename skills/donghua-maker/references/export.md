# Export to video (MP4)

Run this only in step 8, after the user has explicitly approved the web version.

`scripts/export.py` renders the film frame by frame. It runs headless Chrome through Python Playwright, uses the film's own deterministic hooks (`__film.wav()` for the offline audio mix, `__film.seek(f)` plus a canvas capture per frame), and pipes everything into ffmpeg. The output is H.264 + AAC. The export is frame-exact and doesn't depend on playback speed, so a slow machine produces the same file as a fast one.

```bash
python3 <skill-dir>/scripts/export.py film.html                                   # master: full res, 60fps, crf 18
python3 <skill-dir>/scripts/export.py film.html -o film-1080.mp4 --scale .75 --crf 23   # upload copy
```
Options:
- `--fps 30`: keeps every other frame.
- `--scale 0.5`: downscales the output.
- `--smooth`: exports the 60-poses/s version.
- `--png`: lossless frames instead of JPEG q.95.
- `--crf N`: sets the x264 quality.
- `--no-audio`: exports picture only.
- `--aspect 3:4`: centre-crops before scaling, e.g. the 小红书 version of a 9:16 film.

Requires `ffmpeg` and `playwright` (Python), plus Google Chrome or `python3 -m playwright install chromium`.

Measured on Red Kite (10 s, 2560×1440): about 70 s to export. The master at crf 18 was about 100 MB, because film grain is expensive to encode. `--scale .75 --crf 23` gave 1920×1080 at about 5 MB. For platform uploads, recommend the 1080p copy: 1080×1920 for portrait, which is `--scale .75` on 1440×2560.

Verify every export yourself:
1. Run `ffprobe` and check that `nb_frames == DUR*fps`, the duration equals DUR, and an audio stream exists.
2. Read the loudness lines `export.py` prints: the master is normalised to −16 LUFS / −1.5 dBTP by default, and the encoded MP4 is re-measured. A true peak above the ceiling is flagged. Use `--stems` to write per-role WAVs for listening. Measuring is not listening: say so if you didn't audition.
3. Make a contact sheet of one frame per shot (`select=eq(n\,N)+…,tile=2x2`) and look at it to confirm it matches the browser.
