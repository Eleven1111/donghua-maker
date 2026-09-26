#!/usr/bin/env python3
"""Platform gate for creator films: every piece of text stays clear of the app's UI, no text collides, and the hook lands.

    python3 platform_check.py <film>.html                          # default --platforms douyin,xhs
    python3 platform_check.py <film>.html --platforms douyin --step 0.25

Reads the text the film actually draws (engine hook __film.textBoxes: every fillText/strokeText, transformed, per frame),
sampled every --step seconds plus the first frame of each shot. Checks, per platform:
  SAFE     text box inside the platform's safe area (subtitles included)
  CROP     for xhs (3:4) — the 9:16 film is centre-cropped to 3:4, so text must also sit inside the crop, with margin
  OVERLAP  two different texts overlapping by > 20 % of the smaller box (subtitle vs. label included)
  HOOK     readable text on screen by 1.0 s; voice (if any) starts by 0.6 s; first cut by 3.5 s
Exit 1 on any failure.

Safe areas are third-party rules of thumb, not official platform specs (UNVERIFIED — check with a real upload):
  douyin 9:16 — top 150/1920, bottom 300/1920, sides 50/1080 (secaiyun.com 2026 guide); right side widened to 12 % for the
  like/comment/share column, whose width no source gives (assumption).
"""
import argparse
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


def area(b):
    return max(0, b[2] - b[0]) * max(0, b[3] - b[1])


def inter(a, b):
    return area([max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])])


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
    errs, seen = [], set()

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
    print("safe areas: third-party rules of thumb (UNVERIFIED): " + " ".join(SOURCES))
    print("PLATFORM CHECK " + ("FAIL" if errs else "PASS"))
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
