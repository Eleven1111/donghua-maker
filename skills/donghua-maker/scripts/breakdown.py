#!/usr/bin/env python3
"""Break a reference video into a map you can brief from: cuts, the beat grid behind them, how long each shot holds,
how much of each shot moves, and one reference frame per shot. Use it when the user says "make one like this video".

    python3 breakdown.py ref.mp4                      # writes ref-breakdown/
    python3 breakdown.py ref.mp4 -o out/ --area .25   # raise --area if big in-shot action is read as cuts

Output (in <video>-breakdown/):
  breakdown.json   cuts (s), the fitted grid (step, BPM if a step is an eighth or a quarter), and per shot: span,
                   length in grid steps, moving area and share of still frame pairs
  breakdown.md     the same as a table, plus a ready `scaffold.py --durs … --bpm …` line for a film with this rhythm
  sheet.jpg        4 frames per second, 6 per row (time-stamped when ffmpeg has drawtext)
  cut_NN.jpg       the 15 frames around cut NN (every 2nd frame): what the transition actually does
  motion.jpg       per shot, where pixels move (red) over a grey still of the shot
  ref/shot_NN.png  the last clean frame of each shot at full size: the composition reference for that shot

Measure before you name a style: a grammar remembered from memory is often someone else's (one look's "torn-paper
wipe" never appeared in five real samples; another look turned out to sit still 70 % of the time). Copy the mechanism —
shot lengths, rhythm, what moves — not the pixels.

Cut detection (192×108 grey): a frame is a candidate when its mean difference from the previous one exceeds --thresh;
it is a cut when more than --area of the brightness-normalised frame changes, at least --debounce frames after the last
cut. On three donghua films with known cuts: every cut found to the frame; real cuts changed 25–80 % of the frame,
in-shot action 1–7 %, end fades 0–1 %. Slow cross-dissolves have no single cut frame and are not detected. Grid: the LARGEST step that puts
≥ 80 % of cuts within 1.5 frames of t0 + k·step (the smallest residual would pick a tiny step that fits anything);
the rest are listed as outliers (usually big in-shot action, or a cut off the beat).

Adapted from breakdown.py in huashu-art-motion (MIT License, Copyright (c) 2026 alchaincyf); see the repo NOTICE.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path


def probe(video):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
                        "-of", "json", str(video)], capture_output=True, text=True, check=True)
    s = json.loads(r.stdout)["streams"][0]
    n, d = s["r_frame_rate"].split("/")
    return s["width"], s["height"], float(n) / float(d)


def frames(video, w, h, gray=True):
    import numpy as np
    fmt, c = ("gray", 1) if gray else ("rgb24", 3)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", fmt, "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8)
    return a.reshape(-1, h, w) if gray else a.reshape(-1, h, w, c)


def detect_cuts(g, thresh, area, debounce):
    """A cut changes the composition, not just something in it. Candidates are frames whose mean grey difference
    exceeds thresh; a candidate is a cut when, after normalising both frames for brightness and contrast, more than
    `area` of the frame changes. In-shot action changes a small area; a fade changes everything by the same amount
    and normalises away. (Stop-motion makes every pose change a one-frame spike, so spike shape can't tell them apart.)"""
    import numpy as np
    f = g.astype(np.float32)
    d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    z = (f - f.mean(axis=(1, 2), keepdims=True)) / (f.std(axis=(1, 2), keepdims=True) + 1)
    cuts = []
    for i in np.nonzero(d > thresh)[0]:
        if (np.abs(z[i + 1] - z[i]) > .5).mean() > area and (not cuts or i + 1 - cuts[-1] > debounce):
            cuts.append(int(i) + 1)   # d[i] compares frames i and i+1: the new shot starts at i+1
    return cuts, d


def fit_grid(cuts, fps):
    """Largest step (frames) that puts >= 80 % of cut frames within 1.5 frames of t0 + k*step."""
    import numpy as np
    if len(cuts) < 2:
        return None
    S = np.array(cuts, float)
    best = None
    for step in np.arange(4.0, np.diff(np.r_[0, S]).max() + 0.01, 0.01):
        for t0 in [0.0] + list(S[:3]):
            k = np.round((S - t0) / step)
            res = S - (t0 + k * step)
            inl = np.abs(res) <= 1.5
            if inl.mean() < .8:
                continue
            score = (round(step, 2), int(inl.sum()))
            if best is None or score > best[0]:
                best = (score, step, t0, k.astype(int).tolist(), float(np.abs(res[inl]).max()), (~inl).nonzero()[0].tolist())
    if not best:
        return None
    _, step, t0, k, err, out = best
    step_s = float(step) / fps
    # the cut step is n beats for some n: list every tempo in 60–180 BPM that puts each cut on a whole beat,
    # n = 1, 2, 4, 8 (square phrasing) first
    cands = sorted({(n not in (1, 2, 4, 8), round(60 * n / step_s, 2), n) for n in range(1, 17) if 60 <= 60 * n / step_s <= 180})
    return {"t0_frame": round(float(t0), 2), "step_frames": round(float(step), 3), "step_s": round(step_s, 4),
            "units_per_cut": k, "max_residual_frames": round(err, 2), "outlier_cuts": out,
            "bpm_candidates": [{"bpm": b, "beats_per_step": n} for _, b, n in cands]}


def shot_stats(g, bounds, fps):
    """Per shot: moving area (pixels whose grey changes > 12, mean over frame pairs) and share of still pairs.
    The first 0.35 s after a cut is skipped (transition settle)."""
    import numpy as np
    out = []
    for i in range(len(bounds) - 1):
        a0 = bounds[i] + (round(.35 * fps) if i else 0)
        b0 = bounds[i + 1] - 2
        row = {"shot": i + 1, "t0": round(bounds[i] / fps, 3), "t1": round(bounds[i + 1] / fps, 3),
               "len_s": round((bounds[i + 1] - bounds[i]) / fps, 3)}
        if b0 - a0 >= 4:
            seq = g[a0:b0].astype(np.int16)
            dif = np.abs(np.diff(seq, axis=0))
            area = (dif > 12).mean(axis=(1, 2))
            row.update(move_pct=round(float(area.mean()) * 100, 2), still_pct=round(float((area < .0005).mean()) * 100))
            row["_heat"] = dif.max(axis=0)
        out.append(row)
    return out


def write_jpg(rgb, path):
    h, w = rgb.shape[:2]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-i", "-",
                    "-q:v", "3", str(path)], input=rgb.tobytes(), check=True)


def motion_sheet(g, stats, bounds, path):
    import numpy as np
    tiles = []
    for s, a in zip(stats, bounds):
        base = g[min(a + 2, len(g) - 1)].astype(np.float32) * .55
        rgb = np.stack([base, base, base], -1)
        if "_heat" in s:
            h = s.pop("_heat").astype(np.float32)
            k = np.clip(h / 60, 0, 1) * (h > 12)
            rgb[..., 0] = rgb[..., 0] + (255 - rgb[..., 0]) * k
            rgb[..., 1] *= 1 - k
            rgb[..., 2] *= 1 - k
        tiles.append(rgb.astype(np.uint8))
    cols = min(4, len(tiles))
    rows = -(-len(tiles) // cols)
    th, tw = tiles[0].shape[:2]
    sheet = np.full((rows * th, cols * tw, 3), 255, np.uint8)
    for i, t in enumerate(tiles):
        sheet[(i // cols) * th:(i // cols + 1) * th, (i % cols) * tw:(i % cols + 1) * tw] = t
    write_jpg(sheet, path)


def ff(args, what):
    """Run ffmpeg; a failed image is reported, not fatal (the numbers in breakdown.json don't depend on it)."""
    r = subprocess.run(["ffmpeg", "-v", "error", "-y"] + args, capture_output=True, text=True)
    if r.returncode:
        print(f"warning: {what} not written: {(r.stderr.strip().splitlines() or ['?'])[-1]}", file=sys.stderr)
    return r.returncode == 0


def ffmpeg_sheets(video, out, cuts, bounds, fps, W, H):
    tw = 480 if W >= H else 270
    rows = max(1, -(-int(bounds[-1] / fps * 4) // 6))
    stamp = "drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.5,"
    sheet = ["-i", str(video), "-frames:v", "1", str(out / "sheet.jpg"), "-vf"]
    # ffmpeg builds without freetype have no drawtext: fall back to an unstamped sheet (6 per row, 4 per second)
    if not subprocess.run(["ffmpeg", "-v", "error", "-y"] + sheet + [f"fps=4,scale={tw}:-2,{stamp}tile=6x{rows}"], capture_output=True).returncode == 0:
        ff(sheet + [f"fps=4,scale={tw}:-2,tile=6x{rows}"], "sheet.jpg")
    for n, c in enumerate(cuts, 1):
        sel = "+".join(f"eq(n\\,{f})" for f in range(max(0, c - 2), c + 28, 2))
        ff(["-i", str(video), "-vf", f"select='{sel}',scale={tw}:-2,tile=5x3", "-frames:v", "1", "-vsync", "0", str(out / f"cut_{n:02d}.jpg")], f"cut_{n:02d}.jpg")
    (out / "ref").mkdir(exist_ok=True)
    for i in range(len(bounds) - 1):
        f = max(bounds[i], bounds[i + 1] - 3)
        ff(["-i", str(video), "-vf", f"select=eq(n\\,{f})", "-frames:v", "1", str(out / "ref" / f"shot_{i + 1:02d}.png")], f"ref/shot_{i + 1:02d}.png")


def write_md(r, path):
    g = r["grid"]
    L = [f"# Breakdown — {r['video']}", "", f"{r['size'][0]}×{r['size'][1]} · {r['fps']:g} fps · {r['duration_s']} s · {len(r['shots'])} shots", ""]
    if g:
        bp = ", ".join(f"{c['bpm']:g} ({c['beats_per_step']} beats)" for c in g["bpm_candidates"][:6]) or "none in 60–180"
        L.append(f"Cut grid: every cut lands on a multiple of {g['step_s']} s (max residual {g['max_residual_frames']} frames)."
                 + (f" Off-grid cuts: {[n + 1 for n in g['outlier_cuts']]}." if g["outlier_cuts"] else "")
                 + f" Tempos that put every cut on a beat: {bp}. The cuts alone can't tell these apart; listen to the reference.")
    else:
        L.append("Grid: no regular beat found (fewer than 3 cuts, or cuts not on a common step).")
    if r.get("ending_change_s"):
        L.append(f"Ending: the picture changes at {r['ending_change_s']} s (wash-out or end card), not counted as a shot.")
    L += ["", "| shot | span s | length s | grid steps | moving % | still pairs % |", "|---|---|---|---|---|---|"]
    for s in r["shots"]:
        L.append(f"| {s['shot']} | {s['t0']}–{s['t1']} | {s['len_s']} | {s.get('steps', '–')} | {s.get('move_pct', '–')} | {s.get('still_pct', '–')} |")
    L += ["", "Start a film with this rhythm (rename the shots):", "```bash", r["scaffold"], "```"]
    path.write_text("\n".join(L) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("-o", "--out", type=Path, help="default <video>-breakdown/")
    ap.add_argument("--thresh", type=float, default=5, help="mean grey difference that makes a frame a cut candidate (default 5)")
    ap.add_argument("--area", type=float, default=.15, help="share of the brightness-normalised frame that must change (default .15)")
    ap.add_argument("--debounce", type=int, default=12, help="min frames between cuts (default 12)")
    a = ap.parse_args()
    if not a.video.exists():
        ap.error(f"no such video: {a.video}")
    out = (a.out or a.video.with_name(a.video.stem + "-breakdown")).resolve()
    out.mkdir(parents=True, exist_ok=True)
    W, H, fps = probe(a.video)
    gw, gh = (192, 108) if W >= H else (108, 192)
    g = frames(a.video, gw, gh)
    cuts, _ = detect_cuts(g, a.thresh, a.area, a.debounce)
    tail = [c for c in cuts if len(g) - c < round(.35 * fps)]   # a wash-out or end card in the last 0.35 s is not a shot
    cuts = [c for c in cuts if c not in tail]
    grid = fit_grid(cuts, fps)
    bounds = [0] + cuts + [len(g)]
    stats = shot_stats(g, bounds, fps)
    if grid:
        for s, (a0, b0) in zip(stats, zip(bounds, bounds[1:])):
            s["steps"] = round((b0 - a0) / grid["step_frames"], 2)
    motion_sheet(g, stats, bounds, out / "motion.jpg")
    ffmpeg_sheets(a.video, out, cuts, bounds, fps, W, H)
    bpm = round(grid["bpm_candidates"][0]["bpm"]) if grid and grid["bpm_candidates"] else 96
    durs = ",".join(f"{s['len_s']:g}" for s in stats)
    shape = "portrait" if H > W else "square" if H == W else "landscape"
    names = ",".join("S%d" % s["shot"] for s in stats)
    r = {"video": a.video.name, "size": [W, H], "fps": fps, "duration_s": round(len(g) / fps, 3),
         "cuts_s": [round(c / fps, 3) for c in cuts], "ending_change_s": [round(c / fps, 3) for c in tail], "grid": grid, "shots": stats,
         "scaffold": f'python3 scripts/scaffold.py film.html --title "…" --format {shape} --shots "{names}" --durs "{durs}" --bpm {bpm}'}
    (out / "breakdown.json").write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
    write_md(r, out / "breakdown.md")
    print((out / "breakdown.md").read_text(encoding="utf-8"))
    print(f"→ {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
