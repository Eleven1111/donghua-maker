#!/usr/bin/env python3
"""Pace gate: does the picture move inside its shots, or does it flip like slides?

    python3 pace.py <film>.html            # PACE PASS / FAIL
    python3 pace.py <film>.html --json
    python3 pace.py <film>.html --allow-blank "11.5-12.1:the stop before the reveal (launch look)"

Renders the film as it exports (stop-motion, grain and boil on) with subtitles off, at 12 frames a second, on a
320-px-wide grey thumbnail inside the page, and reads three numbers. Method and thresholds follow huashu-art-motion's
film_gate.py, which calibrated them on films its author approved or rejected; here the cuts and `enter` transitions
come from SHOTS instead of being guessed from pixels.

  FAST   share of frame pairs inside a shot whose mean grey change is >= 9 (pairs touching a cut or an `enter`
         transition are left out; a camera move counts as motion). Reported only: film_gate fails under 0.035, but
         this engine's stop-motion moves in small steps and 12 of 34 verified examples read 0.000 (calibrated 2026-10-22 on
         48 local films). Each shot's mean change is listed; a shot of 3 s or more under 1.0 (grain and boil alone
         read about 0.5) is a STILL note: a hold that lands, or dead time? Go and look.
  BLANK  a stretch >= 0.3 s in mid-film (first and last 0.5 s, and the frames on either side of a cut, left out)
         where under 0.2 % of the pixels have a Sobel gradient > 24: an empty, near-flat screen. Fails. Edges, not
         colour, so thin lines on a dark board or strokes on a white page still count as picture. A designed blank
         (the launch look's black "stop") passes with --allow-blank START-END:reason; the reason is printed, so put
         it in the delivery report.
  OPEN   how long the film opens on that same near-empty screen, from frame 0. Over 0.3 s is a note (mg-styles-15:
         never open on more than 0.3 s of empty screen). Calibrated 2026-10-23 on 48 local films: 47 open within
         0.17 s; the kinetic example holds bare paper 0.42 s before its first word.
  BLUE   share of frames (2 a second) where >= 30 % of the pixels are blue-violet (hue 225-300°, saturation >= .30,
         value .06-.90), the stock gradient look. Navy (hue ~210°) does not count. 0.12 and up is a note, 0.30 and up a
         warning; say why when the topic needs it (a night sky, a neon city).
Exit 1 on BLANK or page errors. FAST, STILL, OPEN and BLUE point at shots to look at; they are not a verdict on
the pacing.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
import urllib.parse
from pathlib import Path

from stills import serve

FPS, RATE, BLUE_EVERY = 60, 12, 6                    # engine frames/s, analysis frames/s, blue sampled every 6th (2/s)
FAST_DIFF, STILL_DIFF, STILL_MIN_S = 9, 1.0, 3.0
BLANK_GRAD, BLANK_FRAC, BLANK_EDGE_S, BLANK_MIN_S = 24, .002, .5, .3
OPEN_MAX_S = .3                                      # mg-styles-15: never open on more than 0.3 s of empty screen
BLUE_NOTE, BLUE_WARN = .12, .30

PAGE_JS = r"""(() => {
  const cv = document.getElementById('film'), sm = document.createElement('canvas'), sg = sm.getContext('2d', { willReadFrequently: true });
  let prev = null;
  const grab = w => { sm.width = w; sm.height = Math.round(w * cv.height / cv.width); sg.drawImage(cv, 0, 0, sm.width, sm.height);
    return sg.getImageData(0, 0, sm.width, sm.height); };
  const edges = (g, w, h) => { let n = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x;
      const gx = g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1] - g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1];
      const gy = g[i + w - 1] + 2 * g[i + w] + g[i + w + 1] - g[i - w - 1] - 2 * g[i - w] - g[i - w + 1];
      if (gx * gx + gy * gy > %(grad2)d) n++; }
    return n / ((w - 2) * (h - 2)); };
  const blue = () => { const d = grab(160).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) { const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, gg, b), dd = mx - Math.min(r, gg, b) + 1e-6;
      const hue = (mx === r ? ((gg - b) / dd + 6) %% 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4) * 60;
      if (hue >= 225 && hue <= 300 && dd / (mx + 1e-6) >= .3 && mx >= .06 && mx <= .9) n++; }
    return n / (d.length / 4); };
  window.__pace = (fs, withBlue) => fs.map((f, k) => {
    __film.seek(f); const im = grab(320), w = im.width, h = im.height, g = new Uint8Array(w * h);
    for (let i = 0; i < g.length; i++) g[i] = (im.data[4 * i] * 77 + im.data[4 * i + 1] * 150 + im.data[4 * i + 2] * 29) >> 8;
    let diff = null; if (prev && prev.length === g.length) { let s = 0; for (let i = 0; i < g.length; i++) s += Math.abs(g[i] - prev[i]); diff = s / g.length; }
    prev = g; return { f, diff, edge: edges(g, w, h), blue: withBlue[k] ? blue() : null };
  });
  window.__paceReset = () => { prev = null; };
})()""" % {"grad2": BLANK_GRAD * BLANK_GRAD}


async def render(film: Path) -> tuple:
    from playwright.async_api import async_playwright
    srv, port = serve(film.parent)
    try:
        async with async_playwright() as p:
            try:
                b = await p.chromium.launch(channel="chrome")
            except Exception:
                b = await p.chromium.launch()
            pg = await b.new_page(viewport={"width": 1400, "height": 900})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(f"http://127.0.0.1:{port}/{urllib.parse.quote(film.name)}?ui=0&subs=0")
            await pg.wait_for_function("window.__READY === true", timeout=30000)
            base = await pg.evaluate("({ dur: DUR, shots: SHOTS.map(s => ({ name: s.name, t0: s.t0, t1: s.t1, enter: s.enter ? (s.enter.dur || .5) : 0 })) })")
            await pg.evaluate(PAGE_JS)
            fs = list(range(0, round(base["dur"] * FPS), FPS // RATE))
            rows = []
            for k in range(0, len(fs), 48):
                chunk = fs[k:k + 48]
                rows += await pg.evaluate("([fs, bl]) => __pace(fs, bl)", [chunk, [(k + j) % BLUE_EVERY == 0 for j in range(len(chunk))]])
            await b.close()
    finally:
        srv.shutdown()
    return base, rows, errs


def masks(base: dict, rows: list) -> tuple:
    """(pair_ok[i] for pair i→i+1 inside one shot and outside its enter transition, near_cut[i] for frame i)."""
    shot_of = lambda t: next((k for k, s in enumerate(base["shots"]) if s["t0"] <= t < s["t1"]), len(base["shots"]) - 1)
    ts = [r["f"] / FPS for r in rows]
    sid = [shot_of(t) for t in ts]
    in_enter = [t < base["shots"][s]["t0"] + base["shots"][s]["enter"] for t, s in zip(ts, sid)]
    pair_ok = [sid[i] == sid[i + 1] and not in_enter[i] and not in_enter[i + 1] for i in range(len(rows) - 1)]
    near_cut = [False] * len(rows)
    for i in range(len(rows) - 1):
        if sid[i] != sid[i + 1]:
            near_cut[i] = near_cut[i + 1] = True
    for i, e in enumerate(in_enter):
        near_cut[i] = near_cut[i] or e
    return pair_ok, near_cut


def measure(base: dict, rows: list) -> dict:
    pair_ok, near_cut = masks(base, rows)
    diffs = [rows[i + 1]["diff"] for i in range(len(rows) - 1) if pair_ok[i]]
    fast = sum(d >= FAST_DIFF for d in diffs) / len(diffs) if diffs else 0.0
    per_shot = []
    for k, s in enumerate(base["shots"]):
        ds = [rows[i + 1]["diff"] for i in range(len(rows) - 1) if pair_ok[i] and s["t0"] <= rows[i]["f"] / FPS < s["t1"]]
        per_shot.append({"shot": k + 1, "name": s["name"], "t0": s["t0"], "t1": s["t1"], "fast": round(sum(d >= FAST_DIFF for d in ds) / len(ds), 3) if ds else None,
                         "mean_diff": round(sum(ds) / len(ds), 2) if ds else None})
    edge = BLANK_EDGE_S * RATE
    blank = [r["edge"] < BLANK_FRAC and edge <= i < len(rows) - edge and not near_cut[i] for i, r in enumerate(rows)]
    runs, s0 = [], None
    for i, v in enumerate(blank + [False]):
        if v and s0 is None:
            s0 = i
        elif not v and s0 is not None:
            if (i - s0) / RATE >= BLANK_MIN_S - 1e-9:
                runs.append((round(rows[s0]["f"] / FPS, 2), round(rows[i - 1]["f"] / FPS + 1 / RATE, 2)))
            s0 = None
    lead = next((i for i, r in enumerate(rows) if r["edge"] >= BLANK_FRAC), len(rows))
    bl = [r["blue"] >= .3 for r in rows if r["blue"] is not None]
    return {"dur": base["dur"], "frames": len(rows), "fast": round(fast, 3), "shots": per_shot, "blank_runs": runs,
            "open_blank": round(lead / RATE, 2),
            "blue": round(sum(bl) / len(bl), 3) if bl else 0.0}


def allowed(spec: list) -> list:
    """--allow-blank values "START-END:reason" -> [(start, end, reason)]."""
    out = []
    for v in spec:
        span, _, why = v.partition(":")
        try:
            a, z = (float(x) for x in span.split("-"))
        except ValueError:
            raise SystemExit(f"--allow-blank wants START-END:reason, got {v!r}")
        if not why.strip():
            raise SystemExit(f"--allow-blank {v!r} has no reason")
        out.append((a, z, why.strip()))
    return out


def verdict(res: dict, allow: list) -> tuple:
    """(failures, notes) as text lines."""
    fails, notes = [], []
    for a, z in res["blank_runs"]:
        ok = next((w for lo, hi, w in allow if lo <= a and z <= hi), None)
        line = f"BLANK  {a:.2f}–{z:.2f}s: an almost empty screen ({z - a:.2f}s)"
        if ok:
            notes.append(f"{line}, allowed: {ok}")
        else:
            fails.append(f"{line}: keep the subject in frame or cut; a designed blank needs --allow-blank and a reason")
    if res["open_blank"] > OPEN_MAX_S + 1e-9:
        notes.append(f"OPEN   the film opens on {res['open_blank']:.2f}s of almost empty screen (> {OPEN_MAX_S}s): show the subject at frame 0")
    for s in res["shots"]:
        if s["mean_diff"] is not None and s["mean_diff"] < STILL_DIFF and s["t1"] - s["t0"] >= STILL_MIN_S:
            notes.append(f"STILL  S{s['shot']} {s['name']} {s['t0']:g}–{s['t1']:g}s: mean change {s['mean_diff']} for {s['t1'] - s['t0']:g}s, a hold that lands or dead time?")
    if res["blue"] >= BLUE_WARN:
        notes.append(f"BLUE   {res['blue']:.2f} of frames are mostly blue-violet (>= {BLUE_WARN}): say why the topic needs it, or change the ground")
    elif res["blue"] >= BLUE_NOTE:
        notes.append(f"BLUE   {res['blue']:.2f} of frames are mostly blue-violet (>= {BLUE_NOTE})")
    return fails, notes


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("film", type=Path)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--allow-blank", action="append", default=[], metavar="START-END:REASON", help="a designed blank, with its reason")
    a = ap.parse_args()
    allow = allowed(a.allow_blank)
    try:
        base, rows, errs = asyncio.run(render(a.film.resolve()))
    except Exception as e:
        print(f"PACE FAIL: film never became ready or could not be rendered ({type(e).__name__}: {str(e)[:200]})")
        return 1
    res = measure(base, rows)
    fails, notes = verdict(res, allow)
    fails += [f"PAGE   {e}" for e in errs]
    if a.json:
        print(json.dumps({**res, "fail": fails, "note": notes, "pass": not fails}, ensure_ascii=False, indent=1))
        return 1 if fails else 0
    print(f"{a.film.name} · {res['dur']:g}s · {res['frames']} frames at {RATE}/s · fast {res['fast']:.3f} · blue {res['blue']:.2f} · blank runs {len(res['blank_runs'])}")
    for s in res["shots"]:
        print(f"  S{s['shot']:<2} {str(s['name'])[:12]:<12} {s['t0']:>6g}–{s['t1']:<6g} fast {s['fast'] if s['fast'] is not None else '–':<6} mean Δ {s['mean_diff'] if s['mean_diff'] is not None else '–'}")
    for line in fails + [f"note {n}" for n in notes]:
        print("  " + line)
    print("PACE " + ("FAIL" if fails else "PASS") + ("" if fails else " (measured, not watched)"))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
