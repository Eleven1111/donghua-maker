#!/usr/bin/env python3
"""Export a donghua-maker HTML film to MP4 (H.264 + AAC) frame-exactly.

Drives the film's own deterministic hooks in headless Chrome: window.__film.wav() for the
offline audio mix, window.__film.seek(f) + canvas capture for every frame, piped to ffmpeg.

Long films: --workers N renders with N browsers in parallel (each takes one contiguous run of frames, so its seeks
stay short), and --frames DIR keeps the frames on disk so an interrupted export resumes where it stopped.
"""
import hashlib
import multiprocessing as mp
import argparse
import base64
import json
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path


CAPTURE_JS = """([f, mime, q]) => { window.__film.seek(f); return document.getElementById('film').toDataURL(mime, q).split(',')[1]; }"""


def launch(p):
    try:
        return p.chromium.launch(channel="chrome", headless=True)
    except Exception:
        try:
            return p.chromium.launch(headless=True)
        except Exception as e:
            sys.exit(f"no Chrome for Playwright: install Google Chrome or run `python3 -m playwright install chromium` ({e})")


def render_range(job) -> int:
    """One worker: its own browser, one contiguous run of [output index, film frame]; writes each frame atomically."""
    url, todo, folder, ext, mime, q, wid = job
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = launch(p)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url)
        page.wait_for_function("window.__READY === true", timeout=120_000)
        t0 = time.time()
        for n, (i, f) in enumerate(todo):
            dst = Path(folder) / f"f{i:06d}.{ext}"
            tmp = dst.with_suffix(".tmp")
            tmp.write_bytes(base64.b64decode(page.evaluate(CAPTURE_JS, [f, mime, q])))
            tmp.replace(dst)
            if n % 120 == 0 or n == len(todo) - 1:
                print(f"[worker {wid}] {n + 1}/{len(todo)}  {time.time() - t0:.0f}s", flush=True)
        browser.close()
    if errors:
        raise RuntimeError(f"worker {wid}: film threw during capture: {errors[0]}")
    return len(todo)


def frames_on_disk(film: Path, url: str, folder: Path, frames: list, a, mime: str, q: float) -> str:
    """Render the frames into folder (resumable, guarded by a manifest), in parallel when a.workers > 1. Returns the
    ffmpeg input pattern."""
    ext = "png" if a.png else "jpg"
    folder.mkdir(parents=True, exist_ok=True)
    key = {"film_sha256": hashlib.sha256(film.read_bytes()).hexdigest(), "fps": a.fps, "smooth": a.smooth, "format": ext, "frames": len(frames)}
    man = folder / "export.json"
    if man.exists():
        old = json.loads(man.read_text())
        if old != key:
            changed = ", ".join(k for k in key if old.get(k) != key[k])
            sys.exit(f"{folder} holds frames of a different export ({changed} changed). Use a new --frames folder, or delete this one yourself.")
    man.write_text(json.dumps(key, indent=1))
    todo = [(i, f) for i, f in enumerate(frames) if not ((folder / f"f{i:06d}.{ext}").exists() and (folder / f"f{i:06d}.{ext}").stat().st_size > 1000)]
    print(f"{len(frames) - len(todo)} of {len(frames)} frames already in {folder}; rendering {len(todo)} with {a.workers} worker(s)", flush=True)
    if todo:
        n = max(1, min(a.workers, len(todo)))
        size = -(-len(todo) // n)
        jobs = [(url, todo[k:k + size], str(folder), ext, mime, q, w + 1) for w, k in enumerate(range(0, len(todo), size))]
        t0 = time.time()
        with mp.get_context("spawn").Pool(len(jobs)) as pool:   # a fresh process even for one job: this one is inside Playwright already
            pool.map(render_range, jobs)
        print(f"rendered {len(todo)} frames in {time.time() - t0:.0f}s", flush=True)
    missing = [i for i in range(len(frames)) if not (folder / f"f{i:06d}.{ext}").exists()]
    if missing:
        sys.exit(f"{len(missing)} frames missing after rendering (first: {missing[0]}); run the same command again to resume")
    return str(folder / f"f%06d.{ext}")


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
    ap.add_argument("--aspect", default="", help="centre-crop to w:h before scaling, e.g. 3:4 (Xiaohongshu version of a 9:16 film)")
    ap.add_argument("--lufs", type=float, default=-16.0, help="integrated loudness target for the master (default -16)")
    ap.add_argument("--tp", type=float, default=-1.5, help="true-peak ceiling in dBTP (default -1.5)")
    ap.add_argument("--no-norm", action="store_true", help="keep the raw in-browser mix level")
    ap.add_argument("--stems", action="store_true", help="also write <out>-music/-sfx/-voice.wav for listening checks")
    ap.add_argument("--workers", type=int, default=1, help="render with N browsers in parallel (frames go through a folder)")
    ap.add_argument("--frames", type=Path, help="keep the frames in this folder; running again resumes an interrupted export")
    a = ap.parse_args()

    film = a.film.resolve()
    if not film.is_file():
        sys.exit(f"not found: {film}")
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found on PATH (brew install ffmpeg)")
    if not 0.1 <= a.scale <= 1:
        sys.exit("--scale must be between 0.1 and 1")
    out = (a.out or film.with_suffix(".mp4")).resolve()
    if not 1 <= a.workers <= 16:
        sys.exit("--workers must be between 1 and 16")
    mime, q = ("image/png", 1) if a.png else ("image/jpeg", 0.95)

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("export needs Playwright: pip install playwright && python3 -m playwright install chromium")
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
        crop = ""
        if a.aspect:   # centre crop, e.g. 9:16 → 3:4 keeps the full width and drops equal bands top and bottom
            n, d = (float(x) for x in a.aspect.split(":"))
            cw, ch = (w, int(w * d / n) // 2 * 2) if w * d / n <= h else (int(h * n / d) // 2 * 2, h)
            crop, w, h = f"crop={cw}:{ch}:{(w - cw) // 2}:{(h - ch) // 2},", cw, ch
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

        step = 60 // a.fps
        frames = list(range(0, nf, step))
        on_disk = a.workers > 1 or a.frames is not None
        if on_disk:   # free this browser before the workers start theirs
            browser.close()
            pattern = frames_on_disk(film, url, (a.frames or Path(tmp) / "frames").resolve(), frames, a, mime, q)
            cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(a.fps), "-start_number", "0", "-i", pattern]
        else:
            cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(a.fps), "-i", "-"]
        if not a.no_audio:
            cmd += ["-i", str(wav)]
        cmd += ["-vf", crop + f"scale={ow}:{oh}:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", str(a.crf),
                "-r", str(a.fps), "-movflags", "+faststart"]
        if not a.no_audio:
            cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest"]
        cmd.append(str(out))
        if on_disk:
            code = subprocess.run(cmd).returncode
        else:
            ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
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
