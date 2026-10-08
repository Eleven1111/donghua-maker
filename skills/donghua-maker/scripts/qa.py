#!/usr/bin/env python3
"""Picture QA for a donghua film: the numbers behind the step-5 visual check. Run it before showing the film.

    python3 qa.py <film>.html                       # every check, every shot
    python3 qa.py <film>.html --safe 0.12,0.2       # also flag text in the top 12 % / bottom 20 % (portrait platform UI)
    python3 qa.py <film>.html -o out/ --step 5 --width 320

Works on any engine version: it hooks the canvas itself (qa_init.js), so films made before `__film.textBoxes()` existed
are covered too. Text boxes follow drawImage, so labels baked into sprites at boot or drawn on an offscreen layer are
seen where they land. Writes <film>-qa/qa.json, qa.md and shot_NN.jpg (4 frames + motion heat map) per shot.

FAIL (exit 1) — a defect, fix it:
  page errors      anything thrown while booting, seeking or drawing, and every console.error.
  nondeterministic a frame hashes differently when reached in order, after a reset (seek away and back), or on a cold
                   page load (?frame=). Math.random / Date in step·draw·reset, or state leaking between shots.
                   Compared on a 640-px grey thumbnail: fails when > 0.02 % of it moves > 24 grey levels. Smaller
                   drift (a thin rope end landing 1 px off after a different history) is listed as a clue, not a failure.
  backdrop leak    the canvas clear colour shows through: each sampled frame is drawn twice with the engine's clear
                   colour swapped (magenta, then green); pixels that differ were never painted by the shot. ≥ 0.2 % of
                   the frame on a shot's first frame or for ≥ 0.3 s fails (low/high camera starts — SKILL step 5).
CLUES (exit 0) — go look at that frame; style can make them right:
  motion           smooth mode (no grain, flicker or boil), one sample per exposure: mean moving area (pixels whose
                   grey changes > 12), static pairs (< 0.05 % changed), jumps (a step > 6× the shot's median and > 3 %).
                   A mood piece may be still on purpose; a chain-reaction shot with 60 % static pairs reads as stuck.
  text             persisting ≥ 0.3 s: clipped by the frame edge, two different strings overlapping (> 15 % of the
                   smaller box, compared in the labels' own frame when both are tilted alike; subtitles included),
                   inside the --safe bands. Text drawn inside a clip is checked for edges and bands only.
  under subtitles  films with burned-in subtitles: the picture under the subtitle plate (rendered with subtitles hidden)
                   moves > 2 % per exposure and > 2× the whole frame's share, for ≥ 0.3 s — action the subtitle
                   will cover. A camera pan moves everything alike and is not flagged.
  slow frames      render() + a forced read, on CPU raster (see RASTER): a shot far slower than its siblings is the clue.
  camera back      the shot's camera x moves backwards between exposures (a pan reversing reads as a rewind); in a
                   long-scroll film counted across seams too, where the camera must only ever move forward.
Blind spots: text hidden behind a non-text object still counts as visible; text passed through getImageData/putImageData
or a WebGL texture is not followed; motion counts camera moves as motion; leak cannot see a shot that paints the clear
colour itself.
"""
import argparse
import asyncio
import base64
import json
import math
import sys
import urllib.parse
from pathlib import Path

from stills import serve

FPS = 60
LEAK_FAIL, PERSIST_S = 0.002, 0.3
DRIFT_LEVEL, DRIFT_AREA = 24, 0.0002   # visible difference between two renders of one frame (640-px grey thumbnail)
TEXT_OVERLAP, SAFE_DEFAULT = 0.15, None
BACK_PX = 0.5   # a camera step backwards larger than this (px per exposure) counts
UNDER_SUB, UNDER_RATIO = 0.02, 2.0   # plate share moving (subtitles hidden), and how much more than the whole frame

HERE = Path(__file__).resolve().parent
INIT_JS = (HERE / "qa_init.js").read_text(encoding="utf-8")   # canvas hooks: text boxes that follow drawImage, leak swap
PAGE_JS = (HERE / "qa_page.js").read_text(encoding="utf-8")   # per-shot measurement helpers


def quad_box(xs, ys, ang=0.0):
    """Axis-aligned box of a text quad, measured in a frame rotated by ang (radians)."""
    c, n = math.cos(-ang), math.sin(-ang)
    us = [x * c - y * n for x, y in zip(xs, ys)]
    vs = [x * n + y * c for x, y in zip(xs, ys)]
    return min(us), min(vs), max(us), max(vs)


def inter(a, b):
    return max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))


def area(b):
    return max(1.0, (b[2] - b[0]) * (b[3] - b[1]))


def text_issues(boxes, w, h, safe):
    """Issue keys for one frame: ('clipped', text) / ('overlap', a, b) / ('safe', text).
    A box is [text, xs, ys, drawn_in_clip, is_subtitle]. Clipped-region text (scrolling counters, stroke reveals) is
    bigger than what shows, so it is checked for frame edges and safe bands but not for overlap."""
    out, items = set(), []
    for t, xs, ys, clip, sub in boxes:
        x0, y0, x1, y1 = quad_box(xs, ys)
        inside = x0 >= -2 and y0 >= -2 and x1 <= w + 2 and y1 <= h + 2
        touches = x1 > 0 and y1 > 0 and x0 < w and y0 < h
        if touches and not inside and not clip:
            out.add(("clipped", t))
        if safe and not sub and touches and (y0 < safe[0] * h or y1 > (1 - safe[1]) * h):
            out.add(("safe", t))
        if touches and not clip:
            items.append((t, xs, ys, sub, math.atan2(ys[1] - ys[0], xs[1] - xs[0])))
    for i, (ta, xa, ya, sa, ga) in enumerate(items):
        for tb, xb, yb, sb, gb in items[i + 1:]:
            if ta == tb or (sa and sb):
                continue
            ang = ga if abs(ga - gb) < .02 else 0.0   # two labels tilted the same way: compare in their own frame
            A, B = quad_box(xa, ya, ang), quad_box(xb, yb, ang)
            if inter(A, B) / min(area(A), area(B)) > TEXT_OVERLAP:
                out.add(("overlap",) + tuple(sorted((ta, tb))))
    return out


def runs(frames_by_key, step, min_s):
    """Merge each key's sample frames into contiguous runs; keep the runs lasting ≥ min_s."""
    out = []
    for key, frames in frames_by_key.items():
        frames = sorted(frames)
        start = last = frames[0]
        for f in frames[1:] + [None]:
            if f is not None and f - last <= step:
                last = f
                continue
            if (last - start + step) / FPS >= min_s:
                out.append({"key": list(key), "t0": round(start / FPS, 2), "t1": round((last + step) / FPS, 2)})
            if f is not None:
                start = last = f
    return sorted(out, key=lambda r: r["t0"])


def summarize_still(rows, info, step, safe):
    keys, leaks, ms = {}, [], [r["ms"] for r in rows]
    for r in rows:
        for k in text_issues(r["text"], info["w"], info["h"], safe):
            keys.setdefault(k, []).append(r["f"])
    lk = [r for r in rows if r["leak"] is not None]
    first = lk[0]["leak"] if lk else 0
    leak_keys = {("leak",): [r["f"] for r in lk if r["leak"] >= LEAK_FAIL]}
    leak_runs = runs({k: v for k, v in leak_keys.items() if v}, max(step, 15), PERSIST_S)
    ms.sort()
    return {"text": runs(keys, step, PERSIST_S),
            "leak_max": round(max((r["leak"] for r in lk), default=0), 4), "leak_first": round(first, 4),
            "leak_fail": first >= LEAK_FAIL or bool(leak_runs), "leak_runs": leak_runs,
            "ms_p50": round(ms[len(ms) // 2], 1), "ms_p90": round(ms[int(len(ms) * .9)], 1), "ms_max": round(ms[-1], 1)}


def summarize_motion(m, step):
    area, mag = m["area"], m["mag"]
    # a pan moves the plate as much as the rest of the frame; an object passing under the subtitle moves it more
    under = {("action under subtitles",): [f for f, u, fr in m.get("under", []) if u > UNDER_SUB and u > UNDER_RATIO * fr]}
    sub_runs = runs({k: v for k, v in under.items() if v}, step, PERSIST_S)
    if not area:
        return {"pairs": 0, "area_mean": 0, "static": 0, "jumps": 0, "blank": 0, "under_sub": []}
    med = sorted(mag)[len(mag) // 2]
    jumps = sum(1 for a, g in zip(area, mag) if a > .03 and g > 6 * max(med, .05))
    return {"pairs": len(area), "area_mean": round(sum(area) / len(area) * 100, 2),
            "static": round(sum(1 for a in area if a < .0005) / len(area) * 100),
            "jumps": jumps, "blank": round(sum(m["blank"]) / len(m["blank"]) * 100), "under_sub": sub_runs}


async def ev(pg, js, errs):
    """Evaluate one measurement; an exception thrown by the film is a page error, not a crash of this script."""
    try:
        return await pg.evaluate(js)
    except Exception as e:
        errs.append(str(e).splitlines()[0].replace("Page.evaluate: ", ""))
        return None


NO_STILL = {"text": [], "leak_max": 0, "leak_first": 0, "leak_fail": False, "leak_runs": [], "ms_p50": 0, "ms_p90": 0, "ms_max": 0}


def console_error(m, errs):
    """console.error is a page error, except the browser's own favicon probe; resource errors carry their URL."""
    url = (m.location or {}).get("url", "")
    if m.type != "error" or url.endswith("/favicon.ico"):
        return
    errs.append("console.error: " + m.text + (f" ({url.split('/', 3)[-1]})" if "Failed to load resource" in m.text else ""))


async def boot(browser, url, errs, timeout=60000):
    pg = await browser.new_page(viewport={"width": 1400, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: console_error(m, errs))
    await pg.add_init_script(INIT_JS)
    await pg.goto(url)
    await pg.wait_for_function("window.__READY === true", timeout=timeout)
    info = await pg.evaluate(PAGE_JS)
    return pg, info


def drift(snaps):
    """Largest grey difference, and share of pixels moving > DRIFT_LEVEL, between any snapshot and the first."""
    import numpy as np
    arr = [np.frombuffer(base64.b64decode(x["thumb"]), np.uint8).astype(np.int16) for x in snaps]
    d = np.max([np.abs(a - arr[0]) for a in arr[1:]], axis=0)
    return int(d.max()), float((d > DRIFT_LEVEL).mean())


async def determinism(browser, base, pg, info, ordered, errs):
    """Each shot's first/mid/last frame reached in order, after a reset, and on a cold page load (?frame=)."""
    bad, drifted = [], []
    for s in info["shots"]:
        f0, f1 = round(s["t0"] * FPS), round(s["t1"] * FPS) - 1
        for f in (f0, (f0 + f1) // 2, f1):
            await ev(pg, f"window.__qaHash({0 if f > 0 else FPS})", errs)
            reset = await ev(pg, f"window.__qaSnap({f})", errs)
            try:
                cold_pg, _ = await boot(browser, f"{base}&frame={f}", errs, 20000)   # the film already booted once
            except Exception as e:
                errs.append(f"cold load at frame {f}: {str(e).splitlines()[0]}")
                continue
            cold = await ev(cold_pg, f"window.__qaSnap({f})", errs)
            await cold_pg.close()
            snaps = [ordered.get(f, reset), reset, cold]
            if None in snaps:
                continue
            if len({x["hash"] for x in snaps}) == 1:
                continue
            mx, area = drift(snaps)
            row = {"shot": s["name"], "t": round(f / FPS, 3), "max_diff": mx, "area_pct": round(area * 100, 4),
                   "hashes (ordered/reset/cold)": [x["hash"] for x in snaps]}
            (bad if area > DRIFT_AREA else drifted).append(row)
    return bad, drifted


async def measure(url, out, a):
    from playwright.async_api import async_playwright
    errs, report = [], {"shots": []}
    async with async_playwright() as p:
        # RASTER: Chrome moves a 2D canvas from GPU to CPU raster after repeated getImageData reads, which changes
        # anti-aliased pixels mid-run and reads as nondeterminism. CPU raster from the start keeps every path comparable;
        # the ms column is therefore CPU-raster cost: compare shots with each other, not with the 16.7 ms budget.
        args = ["--disable-accelerated-2d-canvas"]
        try:
            browser = await p.chromium.launch(channel="chrome", args=args)
        except Exception:
            browser = await p.chromium.launch(args=args)
        try:
            pg, info = await boot(browser, url, errs)
        except Exception as e:
            await browser.close()
            return {"errors": errs or [f"film never became ready: {e}"], "shots": [], "nondeterministic": [], "drift": []}
        step = a.step or info["expo"]
        report.update(w=info["w"], h=info["h"], pix=info["pix"], leakable=info["leakable"], subs=info["subs"], step=step)
        snaps = {}
        for s in info["shots"]:
            rows = await ev(pg, f"window.__qaStill({s['i']}, {step}, 15)", errs)
            f0, f1 = round(s["t0"] * FPS), round(s["t1"] * FPS) - 1
            for f in (f0, (f0 + f1) // 2, f1):
                snaps[f] = await ev(pg, f"window.__qaSnap({f})", errs)
            still = summarize_still(rows, info, step, a.safe) if rows else {**NO_STILL, "unmeasured": True}
            report["shots"].append({"name": s["name"], "t0": s["t0"], "t1": s["t1"], **still})
        report["nondeterministic"], report["drift"] = await determinism(browser, url, pg, info, snaps, errs)
        await ev(pg, "film.smooth = true; window.__qaHash(0)", errs)
        for s, row in zip(info["shots"], report["shots"]):
            m = await ev(pg, f"window.__qaMotion({s['i']}, {step}, {a.width})", errs)
            row.update(summarize_motion(m or {"area": [], "mag": [], "blank": []}, step))
            row["_camx"] = (m or {}).get("camx", [])
            if m:
                (out / f"shot_{s['i'] + 1:02d}.jpg").write_bytes(base64.b64decode(m["img"].split(",")[1]))
        await browser.close()
    camera_back(report, info.get("scroll", False))
    report["errors"] = sorted(set(errs))
    return report


def camera_back(report, scroll):
    """Count camera steps backwards within each shot; in a scroll film also across seams (one continuous camera)."""
    prev = None
    for s in report["shots"]:
        xs = [x for x in s.pop("_camx", []) if x is not None]
        seq = ([prev] if scroll and prev is not None else []) + xs
        s["cam_back"] = sum(1 for a, b in zip(seq, seq[1:]) if b < a - BACK_PX)
        prev = xs[-1] if xs else prev
    report["scroll"] = scroll


def write_md(r, path):
    L = [f"# QA — {r['film']}", "", f"**{r['verdict']}** · {r['w']}×{r['h']} · sample every {r['step']} frames", "",
         "| # | shot | span s | move % | static % | jumps | blank % | leak first/max % | ms p50/p90 | text / subtitle clues |",
         "|---|---|---|---|---|---|---|---|---|---|"]
    for i, s in enumerate(r["shots"], 1):
        tx = "; ".join([f"{t['key'][0]} {'/'.join(t['key'][1:])[:30]} @{t['t0']}–{t['t1']}" for t in s["text"] + s.get("under_sub", [])]
                       + ([f"camera steps back {s['cam_back']}×"] if s.get("cam_back") else [])) or "–"
        L.append(f"| {i} | {s['name']}{' (not measured: threw)' if s.get('unmeasured') else ''} | {s['t0']}–{s['t1']} | {s['area_mean']} | {s['static']} | {s['jumps']} | {s['blank']} | "
                 f"{s['leak_first'] * 100:.2f}/{s['leak_max'] * 100:.2f}{' **FAIL**' if s['leak_fail'] else ''} | {s['ms_p50']}/{s['ms_p90']} | {tx} |")
    L += ["", "Page errors: " + ("; ".join(r["errors"]) or "none"),
          "Nondeterministic frames: " + (json.dumps(r["nondeterministic"], ensure_ascii=False) if r["nondeterministic"] else "none"),
          "Bit-level drift (clue): " + ("; ".join(f"{d['shot']} @{d['t']}s max {d['max_diff']} levels, {d['area_pct']} %"
                                                  for d in r["drift"]) or "none")]
    if not r["leakable"]:
        L.append("Backdrop leak: not checked (clear colour not found in render()).")
    path.write_text("\n".join(L) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("-o", "--out", type=Path, help="default <film>-qa/")
    ap.add_argument("--step", type=int, default=0, help="frames between samples (default: the film's EXPO)")
    ap.add_argument("--width", type=int, default=320, help="thumbnail width for the motion pass")
    ap.add_argument("--safe", help="top,bottom fractions of the frame kept free of text, e.g. 0.12,0.2")
    a = ap.parse_args()
    a.safe = tuple(float(x) for x in a.safe.split(",")) if a.safe else SAFE_DEFAULT
    film = a.film.resolve()
    if not film.exists():
        ap.error(f"no such film: {film}")
    out = (a.out or film.with_name(film.stem + "-qa")).resolve()
    out.mkdir(parents=True, exist_ok=True)
    srv, port = serve(film.parent)
    try:
        r = asyncio.run(measure(f"http://127.0.0.1:{port}/{urllib.parse.quote(film.name)}?ui=0", out, a))
    finally:
        srv.shutdown()
    fail = bool(r["errors"] or r["nondeterministic"] or any(s.get("leak_fail") for s in r["shots"]))
    r.update(film=film.name, verdict="FAIL" if fail else "PASS")
    if not r["shots"]:
        print("QA FAIL — film did not boot:", r["errors"])
        return 1
    (out / "qa.json").write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
    write_md(r, out / "qa.md")
    print((out / "qa.md").read_text(encoding="utf-8"))
    print(f"QA {r['verdict']} → {out}")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
