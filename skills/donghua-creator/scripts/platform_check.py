#!/usr/bin/env python3
"""Platform gate for creator films: every piece of text stays clear of the app's UI, no text collides, and the hook lands.

    python3 platform_check.py <film>.html                          # default --platforms douyin,xhs
    python3 platform_check.py <film>.html --platforms douyin --step 0.25
    python3 platform_check.py <film>.html --read-only                # READ alone, any format (lessons, landscape films)

Reads the text the film actually draws (engine hook __film.textBoxes: every fillText/strokeText, transformed, per frame),
sampled every --step seconds plus the first frame of each shot. Checks, per platform:
  SAFE     text box inside the platform's safe area (subtitles included)
  CROP     for xhs (3:4) — the 9:16 film is centre-cropped to 3:4, so text must also sit inside the crop, with margin
  OVERLAP  two different texts overlapping by > 20 % of the smaller box (subtitle vs. label included)
  HOOK     readable text on screen by 1.0 s; voice (if any) starts by 0.6 s; first cut by 3.5 s
  READ     once a text is fully drawn it stays up for (汉字 ÷ 4.5 + letters and digits ÷ 15 + 1.5) s (lemo-opuscar's
           reading rule). Only text at least 2.5 % of the short side tall counts. A shorter hold is listed as a note;
           a sentence of 6+ units held under half its time fails. Frames follow the text by position, so counters and
           typewriter reveals count as one text.
Exit 1 on any failure.

Safe areas are third-party rules of thumb, not official platform specs (UNVERIFIED — check with a real upload):
  douyin 9:16 — top 150/1920, bottom 300/1920, sides 50/1080 (secaiyun.com 2026 guide); right side widened to 12 % for the
  like/comment/share column, whose width no source gives (assumption).
"""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from filmprobe import probe  # noqa: E402

PLATFORMS = {
    "douyin": {"name": "抖音/视频号", "crop": None, "safe": {"top": 150 / 1920, "bottom": 300 / 1920, "left": 50 / 1080, "right": .12}},
    "xhs": {"name": "小红书 3:4", "crop": 3 / 4, "safe": {"top": .04, "bottom": .06, "left": 50 / 1080, "right": 50 / 1080}},
}
SOURCES = ["https://www.secaiyun.com/docs/douyin-kuaishou-video-size-specification-guide-2026-06-02.html",
           "https://zhuanlan.zhihu.com/p/584374300"]
HOOK_TEXT, HOOK_VOICE, HOOK_CUT = 1.0, .6, 3.5
READ_CJK, READ_LATIN, READ_BASE, READ_MIN_H, READ_FAIL_UNITS = 4.5, 15, 1.5, .025, 6


def area(b):
    return max(0, b[2] - b[0]) * max(0, b[3] - b[1])


def inter(a, b):
    return area([max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])])


def read_need(text):
    """(reading units, seconds to hold once fully drawn): a 汉字 is one unit, a Latin word or number one unit."""
    cjk = len(re.findall(r"[一-鿿]", text))
    latin = re.findall(r"[A-Za-z0-9]+", text)
    return cjk + len(latin), cjk / READ_CJK + sum(map(len, latin)) / READ_LATIN + READ_BASE


def _follow(live, b):
    """The live text that b continues: same string first, else a box that mostly coincides or is centre-aligned with it."""
    it = next((i for i in live if i["last"] == b["text"]), None)
    if it:
        return it
    best, score = None, 0
    for i in live:
        a, c = i["box"], b["box"]
        ov = inter(a, c)
        iou = ov / max(1e-9, area(a) + area(c) - ov)
        h = min(a[3] - a[1], c[3] - c[1])
        centred = ov >= .8 * min(area(a), area(c)) and abs(a[0] + a[2] - c[0] - c[2]) < h and abs(a[1] + a[3] - c[1] - c[3]) < h
        sc = iou if iou > .3 else (.3 if centred else 0)
        if sc > score:
            best, score = i, sc
    return best


def read_holds(frames, dur, short_side):
    """Every non-subtitle text item: (seconds held after fully drawn, seconds needed, units, text, first seen)."""
    items, live = [], []
    for k, (t, boxes) in enumerate(frames):
        t_next = frames[k + 1][0] if k + 1 < len(frames) else dur
        taken = []
        for b in boxes:
            if b["sub"] or not read_need(b["text"])[0] or any(x["last"] == b["text"] for x in taken):
                continue
            it = _follow([i for i in live if i not in taken], b)
            if it is None:
                it = {"t0": t, "full": t, "text": b["text"], "h": 0}
                items.append(it)
            if read_need(b["text"])[0] > read_need(it["text"])[0]:
                it.update(text=b["text"], full=t)
            it.update(t1=t_next, box=b["box"], last=b["text"], h=max(it["h"], b["box"][3] - b["box"][1]))
            taken.append(it)
        live = taken
    return [(i["t1"] - i["full"], read_need(i["text"])[1], read_need(i["text"])[0], i["text"], i["t0"])
            for i in items if i["h"] >= READ_MIN_H * short_side]


def read_report(frames, dur, short_side):
    """READ lines: (failures, notes)."""
    errs, notes = [], []
    for held, need, units, text, t0 in sorted(read_holds(frames, dur, short_side), key=lambda r: r[4]):
        if held >= need:
            continue
        msg = f"READ     {text[:24]!r} at {t0:.2f}s is up {held:.1f}s once drawn; {units} units need {need:.1f}s"
        (errs if units >= READ_FAIL_UNITS and held < need / 2 else notes).append(msg)
    return errs, notes


def frame_rect(W, H, crop):
    """The visible rectangle of the 9:16 film on this platform (centre crop to `crop` = w/h)."""
    if not crop:
        return [0, 0, W, H]
    h = W / crop
    return [0, (H - h) / 2, W, (H + h) / 2] if h < H else [0, 0, W, H]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("--platforms", default="douyin,xhs")
    ap.add_argument("--step", type=float, default=.25)
    ap.add_argument("--read-only", action="store_true", help="only the READ check, for any format")
    a = ap.parse_args()
    plats = [p.strip() for p in a.platforms.split(",") if p.strip()]
    bad = [p for p in plats if p not in PLATFORMS]
    if bad:
        ap.error(f"unknown platform {bad}; choose from {list(PLATFORMS)}")

    async def job(pg, base):
        ts = sorted({round(k * a.step, 3) for k in range(int(base["dur"] / a.step) + 1)} | {round(s["t0"] + 1 / 60, 3) for s in base["shots"]})
        ts = [t for t in ts if t < base["dur"]]
        return [(t, await pg.evaluate(f"__film.textBoxes({round(t * base['fps'])})")) for t in ts]

    base, frames = probe(a.film, job)
    W, H = base["W"], base["H"]
    read_errs, notes = read_report(frames, base["dur"], min(W, H))
    if a.read_only:
        errs = read_errs + [f"PAGE     {e}" for e in base["errors"]]
        print(f"{W}×{H} · {base['dur']:g}s · {len(frames)} frames sampled · READ only")
        for e in errs + ["note " + n for n in notes]:
            print("  " + e)
        print("READ CHECK " + ("FAIL" if errs else "PASS"))
        return 1 if errs else 0
    errs, seen = list(read_errs), set()

    def once(key, msg):
        if key not in seen:
            seen.add(key)
            errs.append(msg)

    if W >= H:
        errs.append(f"FORMAT   {W}×{H} is not vertical — creator films are 9:16 (xhs uses its 3:4 centre crop)")
    for p in plats:
        P = PLATFORMS[p]
        fx0, fy0, fx1, fy1 = frame_rect(W, H, P["crop"])
        fw, fh = fx1 - fx0, fy1 - fy0
        s = P["safe"]
        safe = [fx0 + s["left"] * fw, fy0 + s["top"] * fh, fx1 - s["right"] * fw, fy1 - s["bottom"] * fh]
        for t, boxes in frames:
            for b in boxes:
                x0, y0, x1, y1 = b["box"]
                if x0 < safe[0] or y0 < safe[1] or x1 > safe[2] or y1 > safe[3]:
                    side = [n for n, c in (("left", x0 < safe[0]), ("top", y0 < safe[1]), ("right", x1 > safe[2]), ("bottom", y1 > safe[3])) if c]
                    kind = "CROP " if P["crop"] and (y0 < fy0 or y1 > fy1) else "SAFE "
                    once((p, b["text"], kind), f"{kind}   [{P['name']}] {'subtitle' if b['sub'] else 'text'} {b['text'][:24]!r} crosses the {'/'.join(side)} edge "
                                               f"at {t:.2f}s (box {b['box']}, safe {[round(v) for v in safe]})")
    for t, boxes in frames:
        for i, b in enumerate(boxes):
            for c in boxes[i + 1:]:
                if b["text"] == c["text"] or b["text"] in c["text"] or c["text"] in b["text"]:
                    continue
                ov = inter(b["box"], c["box"])
                if ov > .2 * min(area(b["box"]), area(c["box"])):
                    once(("ov", b["text"], c["text"]), f"OVERLAP  {b['text'][:20]!r} and {c['text'][:20]!r} collide at {t:.2f}s ({ov * 100 // max(1, min(area(b['box']), area(c['box'])))}% of the smaller)")
    first = next((t for t, bx in frames if any(not b["sub"] for b in bx)), None)
    if first is None or first > HOOK_TEXT:
        errs.append(f"HOOK     first on-screen text at {first}s — the hook line must be readable by {HOOK_TEXT}s")
    if base["voice"] and min(base["voice"]) > HOOK_VOICE:
        errs.append(f"HOOK     voice starts at {min(base['voice']):.2f}s — start speaking by {HOOK_VOICE}s")
    if base["shots"] and base["shots"][0]["t1"] > HOOK_CUT:
        errs.append(f"HOOK     first cut at {base['shots'][0]['t1']:g}s — cut by {HOOK_CUT}s to hold attention")
    errs += [f"PAGE     {e}" for e in base["errors"]]
    n = sum(len(b) for _, b in frames)
    print(f"{W}×{H} · {base['dur']:g}s · {len(frames)} frames sampled · {n} text draws · platforms: {', '.join(PLATFORMS[p]['name'] for p in plats)}")
    for e in errs:
        print("  " + e)
    for e in notes:
        print("  note " + e)
    print("safe areas: third-party rules of thumb (UNVERIFIED): " + " ".join(SOURCES))
    print("PLATFORM CHECK " + ("FAIL" if errs else "PASS"))
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
