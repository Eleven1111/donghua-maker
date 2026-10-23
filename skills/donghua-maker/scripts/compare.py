#!/usr/bin/env python3
"""Put a reference (video or photo) and your film side by side: reference | film | 50 % overlay.
The overlay is the check: where the two compositions disagree you see ghosts (a subject too small, too high, a
horizon in the wrong place). Use it after breakdown.py when the user asked for "one like this", and once per build
pass when rebuilding a real object from a photo (references/rebuild.md).

    python3 compare.py ref.mp4 film.html --at 1.5,3.0,4.6              # same times in both
    python3 compare.py ref.mp4 film.html --at 1.5,3.0 --film-at 2,4    # your shots are longer: map times
    python3 compare.py ref.mp4 film.html --at 1.5 -o cmp/ --width 960
    python3 compare.py gear.jpg film.html --at 2.4 --crop .3,.2,.4,.6  # a photo: --at is the film time;
                                                                       # --crop / --ref-crop frame the object (x,y,w,h as fractions)

Writes cmp_<t>.jpg per moment and compare.jpg (all rows), in <film>-compare/ by default. The reference is scaled to
the film's frame for the overlay; if their aspect ratios differ, the overlay is stretched and the script says so:
crop both to the object so the aspects match.
Compare composition and rhythm, not pixels: the film is your version of the mechanism, not a trace of the reference.
"""
import argparse
import asyncio
import json
import subprocess
import sys
import urllib.parse
from pathlib import Path

from stills import grab, serve


def ref_size(video: Path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", str(video)],
                       capture_output=True, text=True, check=True)
    s = json.loads(r.stdout)["streams"][0]
    return s["width"], s["height"]


IMAGE = {".png", ".jpg", ".jpeg", ".webp"}


def crop_filter(spec: str) -> list:
    """'x,y,w,h' as fractions of the frame → ffmpeg -vf args, or [] when no crop is asked for."""
    if not spec:
        return []
    try:
        x, y, w, h = (float(v) for v in spec.split(","))
    except ValueError:
        raise SystemExit(f"crop {spec!r}: give four fractions x,y,w,h")
    if not (0 <= x < 1 and 0 <= y < 1 and 0 < w <= 1 - x + 1e-9 and 0 < h <= 1 - y + 1e-9):
        raise SystemExit(f"crop {spec!r}: x,y,w,h must be fractions inside the frame")
    return ["-vf", f"crop=iw*{w}:ih*{h}:iw*{x}:ih*{y}"]


def ff(args, what):
    r = subprocess.run(["ffmpeg", "-v", "error", "-y"] + args, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"{what} failed: {(r.stderr.strip().splitlines() or ['?'])[-1]}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ref", type=Path, help="reference video, or a photo (.png/.jpg/.webp)")
    ap.add_argument("film", type=Path, help="your film (.html)")
    ap.add_argument("--at", required=True, help="comma-separated times in the reference (s); for a photo, times in the film")
    ap.add_argument("--film-at", help="matching times in the film (default: the same)")
    ap.add_argument("--crop", default="", help="crop the film still to x,y,w,h (fractions), e.g. .3,.2,.4,.6")
    ap.add_argument("--ref-crop", default="", help="crop the reference to x,y,w,h (fractions)")
    ap.add_argument("-o", "--out", type=Path, help="default <film>-compare/")
    ap.add_argument("--width", type=int, default=960, help="width of each panel")
    a = ap.parse_args()
    for p in (a.ref, a.film):
        if not p.exists():
            ap.error(f"no such file: {p}")
    photo = a.ref.suffix.lower() in IMAGE
    if photo and a.film_at:
        ap.error("a photo has no times: give the film times in --at")
    ref_t = [float(x) for x in a.at.split(",")]
    film_t = [float(x) for x in a.film_at.split(",")] if a.film_at else ref_t
    if len(film_t) != len(ref_t):
        ap.error("--film-at needs as many times as --at")
    film = a.film.resolve()
    out = (a.out or film.with_name(film.stem + "-compare")).resolve()
    tmp = out / "_film"
    tmp.mkdir(parents=True, exist_ok=True)
    srv, port = serve(film.parent)
    try:
        errs = asyncio.run(grab(f"http://127.0.0.1:{port}/{urllib.parse.quote(film.name)}?ui=0", film_t, False, tmp, a.width))
    finally:
        srv.shutdown()
    if errs:
        print("film page errors:", errs, file=sys.stderr)
    stills = {t: tmp / f"s_{t:06.2f}.jpg" for t in film_t}
    missing = [t for t, p in stills.items() if not p.exists()]
    if missing:
        raise SystemExit(f"film stills missing for {missing}: did the film boot?")
    if a.crop:
        for t, p in list(stills.items()):
            stills[t] = tmp / f"c_{t:06.2f}.png"
            ff(["-i", str(p)] + crop_filter(a.crop) + [str(stills[t])], f"film crop at {t}s")
    rows = []
    for rt, ftime in zip(ref_t, film_t):
        fs = stills[ftime]
        ref_png = tmp / f"ref_{rt:06.2f}.png"
        seek = [] if photo else ["-ss", f"{rt}"]
        ff(seek + ["-i", str(a.ref), "-frames:v", "1"] + crop_filter(a.ref_crop) + [str(ref_png)], f"reference frame at {rt}s")
        row = out / f"cmp_{rt:06.2f}.jpg"
        # reference scaled to the film panel; overlay = 50/50 blend of the two panels
        ff(["-i", str(ref_png), "-i", str(fs), "-filter_complex",
            f"[1]scale={a.width}:-2,split=2[f1][f2];[0][f1]scale2ref[r][fb];[r]split=2[r1][r2];"
            f"[r2][fb]blend=all_mode=normal:all_opacity=.5[ov];[r1][f2][ov]hstack=3",
            "-q:v", "3", str(row)], f"row at {rt}s")
        rows.append(row)
    if len(rows) > 1:
        ff([x for r in rows for x in ("-i", str(r))] + ["-filter_complex", f"vstack={len(rows)}", "-q:v", "3", str(out / "compare.jpg")], "compare.jpg")
    else:
        ff(["-i", str(rows[0]), str(out / "compare.jpg")], "compare.jpg")
    rw, rh = ref_size(tmp / f"ref_{ref_t[0]:06.2f}.png")
    if abs(rw / rh - _film_aspect(stills[film_t[0]])) > .02:
        print(f"note: reference is {rw}×{rh}, the film's aspect differs; the overlay is stretched to the film frame", file=sys.stderr)
    print(f"{len(rows)} moment(s) → {out / 'compare.jpg'} (reference | film | overlay)")
    return 0


def _film_aspect(img: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(img)], capture_output=True, text=True, check=True)
    w, h = r.stdout.strip().split(",")[:2]
    return int(w) / int(h)


if __name__ == "__main__":
    sys.exit(main())
