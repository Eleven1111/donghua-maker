#!/usr/bin/env python3
"""Export a donghua-maker HTML film to MP4 (H.264 + AAC) frame-exactly.

Drives the film's own deterministic hooks in headless Chrome: window.__film.wav() for the
offline audio mix, window.__film.seek(f) + canvas capture for every frame, piped to ffmpeg.
"""
import argparse
import base64
import json
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

CAPTURE_JS = """([f, mime, q]) => { window.__film.seek(f); return document.getElementById('film').toDataURL(mime, q).split(',')[1]; }"""


def launch(p):
    try:
        return p.chromium.launch(channel="chrome", headless=True)
    except Exception:
        try:
            return p.chromium.launch(headless=True)
        except Exception as e:
            sys.exit(f"no Chrome for Playwright: install Google Chrome or run `python3 -m playwright install chromium` ({e})")


def loudnorm_json(stderr: str) -> dict:
    return json.loads(stderr[stderr.rfind("{"):stderr.rfind("}") + 1])


def master_loudness(src: Path, dst: Path, lufs: float, tp: float) -> dict:
    """Two-pass loudnorm: measure, then apply linearly with the measured values (not peak normalisation)."""
    target = f"loudnorm=I={lufs}:TP={tp}:LRA=8"
    m = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-af", target + ":print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, check=True)
    st = loudnorm_json(m.stderr)
    if not all(x not in ("-inf", "inf") for x in (st["input_i"], st["input_tp"])):
        sys.exit("audio mix is silent; nothing to normalise")
    second = (f"{target}:linear=true:measured_I={st['input_i']}:measured_TP={st['input_tp']}:measured_LRA={st['input_lra']}"
              f":measured_thresh={st['input_thresh']}:offset={st['target_offset']}:print_format=json")
    r = subprocess.run(["ffmpeg", "-y", "-hide_banner", "-nostats", "-i", str(src), "-af", second, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(dst)],
                       capture_output=True, text=True, check=True)
    out = loudnorm_json(r.stderr)
    return {"input_I": st["input_i"], "input_TP": st["input_tp"], "output_I": out["output_i"], "output_TP": out["output_tp"], "type": out.get("normalization_type")}


def measure_file(path: Path) -> dict:
    """Integrated loudness + true peak of a finished file (after AAC encoding, which can add peaks)."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, check=True)
    st = loudnorm_json(r.stderr)
    return {"I": st["input_i"], "TP": st["input_tp"]}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("film", type=Path, help="the film .html")
    ap.add_argument("-o", "--out", type=Path, help="output .mp4 (default: next to the film)")
    ap.add_argument("--fps", type=int, choices=(60, 30), default=60, help="30 keeps every other frame (smaller file)")
    ap.add_argument("--scale", type=float, default=1.0, help="e.g. 0.5 → 1280x720 from 2560x1440")
    ap.add_argument("--smooth", action="store_true", help="export the smooth 60-poses/s version instead of stop-motion")
    ap.add_argument("--png", action="store_true", help="lossless PNG frames (slower) instead of JPEG q=0.95")
    ap.add_argument("--crf", type=int, default=18, help="x264 quality, lower = better (default 18)")
    ap.add_argument("--no-audio", action="store_true")
    ap.add_argument("--lufs", type=float, default=-16.0, help="integrated loudness target for the master (default -16)")
    ap.add_argument("--tp", type=float, default=-1.5, help="true-peak ceiling in dBTP (default -1.5)")
    ap.add_argument("--no-norm", action="store_true", help="keep the raw in-browser mix level")
    ap.add_argument("--stems", action="store_true", help="also write <out>-music/-sfx/-voice.wav for listening checks")
    a = ap.parse_args()

    film = a.film.resolve()
    if not film.is_file():
        sys.exit(f"not found: {film}")
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found on PATH (brew install ffmpeg)")
    if not 0.1 <= a.scale <= 1:
        sys.exit("--scale must be between 0.1 and 1")
    out = (a.out or film.with_suffix(".mp4")).resolve()
    mime, q = ("image/png", 1) if a.png else ("image/jpeg", 0.95)

    with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
        browser = launch(p)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        url = film.as_uri() + "?ui=0&frame=0" + ("&smooth=1" if a.smooth else "")
        page.goto(url)
        page.wait_for_function("window.__READY === true", timeout=120_000)
        if errors:
            sys.exit(f"film threw on load: {errors[0]}")
        info = page.evaluate("({w: document.getElementById('film').width, h: document.getElementById('film').height, nf: NF, fps: FPS, dur: DUR})")
        w, h, nf = info["w"], info["h"], int(info["nf"])
        ow, oh = int(w * a.scale) // 2 * 2, int(h * a.scale) // 2 * 2

        wav = Path(tmp) / "mix.wav"
        if not a.no_audio:
            print("mixing audio…", flush=True)
            wav.write_bytes(base64.b64decode(page.evaluate("window.__film.wav()")))
            has_roles = page.evaluate("typeof window.__film.audio === 'function'")
            if a.stems:
                if not has_roles:
                    print("this film's engine predates role stems; --stems skipped", file=sys.stderr)
                for role in (("music", "sfx", "voice") if has_roles else ()):
                    stem = out.with_name(f"{out.stem}-{role}.wav")
                    stem.write_bytes(base64.b64decode(page.evaluate("(r) => window.__film.wav({stem: r})", role)))
                    print(f"stem: {stem}")
            if not a.no_norm:
                normed = Path(tmp) / "master.wav"
                rep_ = master_loudness(wav, normed, a.lufs, a.tp)
                print(f"loudness: mix {rep_['input_I']} LUFS / {rep_['input_TP']} dBTP -> {rep_['output_I']} LUFS / {rep_['output_TP']} dBTP ({rep_['type']})")
                wav = normed
            page.evaluate("window.__film.seek(0)")

        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(a.fps), "-i", "-"]
        if not a.no_audio:
            cmd += ["-i", str(wav)]
        cmd += ["-vf", f"scale={ow}:{oh}:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", str(a.crf),
                "-r", str(a.fps), "-movflags", "+faststart"]
        if not a.no_audio:
            cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest"]
        cmd.append(str(out))
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)

        step = 60 // a.fps
        frames = range(0, nf, step)
        t0 = time.time()
        try:
            for i, f in enumerate(frames):
                ff.stdin.write(base64.b64decode(page.evaluate(CAPTURE_JS, [f, mime, q])))
                if i % 60 == 0 or i == len(frames) - 1:
                    print(f"\rframe {i + 1}/{len(frames)}  {time.time() - t0:.0f}s", end="", flush=True)
        finally:
            ff.stdin.close()
            code = ff.wait()
            browser.close()
        print()
        if errors:
            sys.exit(f"film threw during capture: {errors[0]}")
        if code != 0:
            sys.exit(f"ffmpeg failed (exit {code})")
        if not a.no_audio:
            fin = measure_file(out)
            print(f"final mp4 audio: {fin['I']} LUFS, true peak {fin['TP']} dBTP" + ("  <- above ceiling, lower --tp" if float(fin["TP"]) > a.tp + .3 else ""))

    print(f"wrote {out}  {ow}x{oh} @ {a.fps}fps  {len(frames)} frames  {'no audio' if a.no_audio else 'with audio'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
