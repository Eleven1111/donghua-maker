#!/usr/bin/env python3
"""Embed character frames (drawn by an image model or by a person) into a film: key off the green, cut a pose sheet
into frames, keep a sequence aligned, and write a FRAMES block the engine decodes at boot. Opt-in: the default is
still code-drawn puppets. Read references/frames.md first (when to use it, prompting, licences).

    python3 frames_import.py film.html walk.png --name walk --grid 4x2      # 8 poses → walk_0 … walk_7
    python3 frames_import.py film.html sheet.png --name wave --gaps         # poses side by side, split at empty columns
    python3 frames_import.py film.html hero.png --name hero                 # one frame
    python3 frames_import.py film.html ink.png --name boy --white            # line art on white: crop, keep the paper
    python3 frames_import.py film.html --list                                # what the film carries
    python3 frames_import.py film.html --remove walk                         # drop a frame or a whole sequence

In the shot, bake once in build() (frameSprite is a bake, not a per-frame draw), then pick a pose per exposure:
    build() { this.walk = [...Array(8)].map((_, i) => frameSprite('walk_' + i, 420)); }
    draw(ctx, st, sq, e, cam) { put(ctx, this.walk[Math.floor(sq * 9) % 8], x, GROUND, 0, 1, { flip: dir < 0 }); }
frameSprite() gives each frame the same paper texture and contact shadow as code-drawn cut-outs, anchored at the feet.

Green key: alpha from how much green beats max(red, blue) (--soft..--hard), then green spill on edges pulled back to
max(red, blue). Generate on #00B140 or #00FF00; white clothes are fine on green, not on white.
Alignment: every frame of a sequence is cropped to the same window (the union of all poses, measured in cell
coordinates) and anchored at the bottom-centre of that window, so feet stay put between poses.
Each import is logged in <film>-frames/frames.json (source, generator, licence, sha256) — fill --source/--licence;
publishing a film with frames of unknown origin is the user's call, not the tool's.
"""
import argparse
import base64
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

BEGIN, END = "// ═══ FRAMES BEGIN (scripts/frames_import.py — do not edit by hand) ═══", "// ═══ FRAMES END ═══"
MAX_TOTAL = 4_000_000   # base64 bytes across all frames: past this the single-file film gets slow to open


def size_of(img: Path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(img)],
                       capture_output=True, text=True, check=True)
    w, h = r.stdout.strip().split(",")[:2]
    return int(w), int(h)


def read_rgb(img: Path):
    import numpy as np
    w, h = size_of(img)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(img), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(np.float32)


def png_bytes(rgba) -> bytes:
    h, w = rgba.shape[:2]
    return subprocess.run(["ffmpeg", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-i", "-",
                           "-f", "image2pipe", "-vcodec", "png", "-"], input=rgba.tobytes(), capture_output=True, check=True).stdout


def key(im, white, soft, hard):
    """RGBA float image and a boolean content mask."""
    import numpy as np
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    if white:   # line art on paper: the paper tone comes from the border (scans are never pure white); ink fades in
        lum = im @ np.array([.299, .587, .114], np.float32)  # as it gets darker than the paper, colour counts as ink too
        edge = np.concatenate([lum[:4].ravel(), lum[-4:].ravel(), lum[:, :4].ravel(), lum[:, -4:].ravel()])
        paper = float(np.median(edge))
        alpha = np.clip((paper - 10 - lum) / 60, 0, 1)
        alpha = np.maximum(alpha, np.clip((im.max(2) - im.min(2) - 30) / 30, 0, 1))
        return np.dstack([r, g, b, alpha * 255]), alpha > .1
    spill = g - np.maximum(r, b)
    alpha = 1 - np.clip((spill - soft) / (hard - soft), 0, 1)
    g2 = np.where(spill > 0, np.minimum(g, np.maximum(r, b) + .25 * np.clip(spill, 0, 30)), g)
    return np.dstack([r, g2, b, alpha * 255]), alpha > .05


def cells(mask, grid, gaps):
    """Pose cells as (x0, y0, x1, y1) in sheet pixels."""
    import numpy as np
    H, W = mask.shape
    if grid:
        c, r = grid
        return [(i * W // c, j * H // r, (i + 1) * W // c, (j + 1) * H // r) for j in range(r) for i in range(c)]
    if gaps:
        cols, out, x = mask.any(0), [], 0
        while x < W:
            if cols[x]:
                x0 = x
                while x < W and cols[x:x + 12].any():
                    x += 1
                if x - x0 > 20:
                    out.append((x0, 0, x, H))
            x += 1
        return out
    return [(0, 0, W, H)]


def cut(rgba, mask, boxes, pad, max_h):
    """Crop every pose to one shared window (union of content, cell coordinates); anchor = bottom-centre."""
    import numpy as np
    spans = []
    for x0, y0, x1, y1 in boxes:
        m = mask[y0:y1, x0:x1]
        ys, xs = np.nonzero(m)
        if len(xs):
            spans.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    if not spans:
        raise SystemExit("no content found: is the background green (or white with --white)?")
    ux0, uy0 = min(s[0] for s in spans) - pad, min(s[1] for s in spans) - pad
    ux1, uy1 = max(s[2] for s in spans) + pad, max(s[3] for s in spans) + pad
    frames = []
    for x0, y0, x1, y1 in boxes:
        if not mask[y0:y1, x0:x1].any():
            continue   # an empty grid cell (sheet with fewer poses than cells)
        win = np.zeros((uy1 - uy0, ux1 - ux0, 4), np.float32)
        # clamp to this cell: padding must not reach into the neighbouring pose
        sx0, sy0 = max(x0, x0 + ux0), max(y0, y0 + uy0)
        sx1, sy1 = min(x1, x0 + ux1), min(y1, y0 + uy1)
        win[sy0 - (y0 + uy0):sy1 - (y0 + uy0), sx0 - (x0 + ux0):sx1 - (x0 + ux0)] = rgba[sy0:sy1, sx0:sx1]
        frames.append(win)
    h, w = frames[0].shape[:2]
    k = min(1.0, max_h / h)
    if k < 1:
        frames = [shrink(f, k) for f in frames]
        h, w = frames[0].shape[:2]
    return [f.clip(0, 255).astype(np.uint8) for f in frames], w, h, w / 2, h - pad * k


def shrink(f, k):
    """Area-average downscale with premultiplied alpha (no dark fringe)."""
    import numpy as np
    h, w = f.shape[:2]
    nh, nw = max(1, round(h * k)), max(1, round(w * k))
    a = f[..., 3:4] / 255
    pm = np.concatenate([f[..., :3] * a, a], -1)
    ys, xs = (np.arange(nh + 1) * h / nh).astype(int), (np.arange(nw + 1) * w / nw).astype(int)
    out = np.add.reduceat(np.add.reduceat(pm, ys[:-1], 0), xs[:-1], 1)
    out /= ((ys[1:] - ys[:-1])[:, None, None] * (xs[1:] - xs[:-1])[None, :, None])
    rgb = np.where(out[..., 3:4] > 1e-4, out[..., :3] / np.maximum(out[..., 3:4], 1e-4), 0)
    return np.concatenate([rgb, out[..., 3:4] * 255], -1)


def read_block(html: str) -> dict:
    if BEGIN not in html:
        return {}
    body = html[html.index(BEGIN) + len(BEGIN):html.index(END)]
    m = re.search(r"Object\.assign\(FRM\.lib, (\{.*\})\);", body, re.S)
    return json.loads(m.group(1)) if m else {}


def write_block(film: Path, lib: dict) -> None:
    html = film.read_text(encoding="utf-8")
    block = f"{BEGIN}\nObject.assign(FRM.lib, {json.dumps(lib, ensure_ascii=False, separators=(',', ':'))});\n{END}"
    if BEGIN in html:
        html = html[:html.index(BEGIN)] + block + html[html.index(END) + len(END):]
    elif "const SHOTS = [];" in html:
        html = html.replace("const SHOTS = [];", block + "\nconst SHOTS = [];", 1)
    else:
        raise SystemExit("film has neither a FRAMES block nor `const SHOTS = [];` to insert before")
    if "function frmReady" not in html:
        raise SystemExit("this film's engine predates character frames: re-scaffold it and move the story across")
    film.write_text(html, encoding="utf-8")


def log(film: Path, rows: list) -> Path:
    d = film.with_name(film.stem + "-frames")
    d.mkdir(exist_ok=True)
    p = d / "frames.json"
    led = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    led.update({r["name"]: r for r in rows})
    p.write_text(json.dumps(led, ensure_ascii=False, indent=1), encoding="utf-8")
    return p


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("image", type=Path, nargs="?")
    ap.add_argument("--name", help="frame name, or sequence name (frames become name_0 … name_n)")
    ap.add_argument("--grid", help="poses in a C×R grid, e.g. 4x2 (row by row)")
    ap.add_argument("--gaps", action="store_true", help="poses side by side, split at empty columns")
    ap.add_argument("--white", action="store_true", help="line art on white paper instead of a green screen")
    ap.add_argument("--soft", type=float, default=30, help="green lead where transparency starts (default 30)")
    ap.add_argument("--hard", type=float, default=100, help="green lead that is fully transparent (default 100)")
    ap.add_argument("--max-h", type=int, default=600, help="frame height cap in px (default 600: 2× a 300 px character)")
    ap.add_argument("--source", default="", help="where the image came from: model + prompt file, artist, URL")
    ap.add_argument("--licence", default="", help="terms that let you publish it")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--remove", metavar="NAME")
    a = ap.parse_args()
    lib = read_block(a.film.read_text(encoding="utf-8"))
    if a.list or a.remove:
        if a.remove:
            lib = {k: v for k, v in lib.items() if k != a.remove and not re.fullmatch(re.escape(a.remove) + r"_\d+", k)}
            write_block(a.film, lib)
        for k, v in sorted(lib.items()):
            print(f"{k:24s} {v['w']}×{v['h']}  anchor ({v['ax']:g}, {v['ay']:g})  {len(v['src']) // 1024} KB")
        return 0
    if not (a.image and a.name):
        ap.error("give an image and --name (or --list / --remove)")
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9]*", a.name):
        ap.error("--name: letters and digits, starting with a letter (frames get _0 … _n appended)")
    grid = tuple(int(v) for v in a.grid.lower().split("x")) if a.grid else None
    rgba, mask = key(read_rgb(a.image), a.white, a.soft, a.hard)
    boxes = cells(mask, grid, a.gaps)
    frames, w, h, ax, ay = cut(rgba, mask, boxes, 6, a.max_h)
    names = [a.name] if len(frames) == 1 and not (grid or a.gaps) else [f"{a.name}_{i}" for i in range(len(frames))]
    lib = {k: v for k, v in lib.items() if k != a.name and not re.fullmatch(re.escape(a.name) + r"_\d+", k)}
    sha = hashlib.sha256(a.image.read_bytes()).hexdigest()
    rows = []
    for n, f in zip(names, frames):
        lib[n] = {"w": w, "h": h, "ax": round(ax, 1), "ay": round(ay, 1), "src": base64.b64encode(png_bytes(f)).decode()}
        rows.append({"name": n, "file": a.image.name, "sha256": sha, "source": a.source, "licence": a.licence})
    total = sum(len(v["src"]) for v in lib.values())
    write_block(a.film, lib)
    ledger = log(a.film, rows)
    print(f"{len(frames)} frame(s) {names[0]}…{names[-1]}  {w}×{h}  anchor ({ax:g}, {ay:g})  film carries {total // 1024} KB of frames")
    if total > MAX_TOTAL:
        print(f"warning: {total // 1_000_000} MB of frames — lower --max-h or use fewer poses; the film is one HTML file", file=sys.stderr)
    if not (a.source and a.licence):
        print(f"note: --source/--licence empty in {ledger}; fill them before publishing", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
