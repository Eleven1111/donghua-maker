#!/usr/bin/env python3
"""SFX branch: semantic search → candidates → ranking → sounds.json for sfx_import.py.

    python3 sfx_search.py search needs.json -o <film>-audio/cands [--local DIR ...] [--per 8]
    python3 sfx_search.py add <cat> <file> -o <film>-audio/cands --source URL --license L [--author A --title T]
    python3 sfx_search.py rank -o <film>-audio/cands [--sounds <film>-audio/sounds.json]

needs.json (audio_director.py writes it): {"needs": [{"cat": "click", "query": "soft ui click", "times": [1.0, 2.5]}, …]}

Sources, in order: the user's local library (--local dirs; filename/path tokens are matched), Mixkit tag pages
(no key; full WAVs, Mixkit Sound Effects Free License), Freesound API v2
(only when FREESOUND_API_KEY is set: env or ~/.config/secrets/.env; CC0 and CC-BY only, HQ mp3 previews),
and anything added by hand with `add` (e.g. a Pixabay file downloaded in the browser, with its page URL
and licence). Every candidate gets a sidecar <file>.json with its metadata.

Ranking = 0.45 × metadata (query-term overlap after synonym expansion, negative terms, licence, popularity,
rating) + 0.55 × audio fit measured on the file (duration, onset latency, tail length, peak position,
brightness, clipping) against the category's target. Unknown-licence candidates are ranked but never chosen.
`rank --sounds` writes the winner of each category into sounds.json (entries marked "method": "recorded").
"""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np

AUDIO_EXT = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aif", ".aiff", ".opus"}
# category → (expanded terms, negative terms, target: dur range s, max onset ms, max tail s, centroid Hz range, peak position range)
CATS = {
    "click":    ("click tap button ui interface select mouse soft", "loop music song beat chime bell notification", (.02, .4), 15, .25, (1200, 7000), (0, .4)),
    "clickAlt": ("click tap button ui interface select soft", "loop music song beat", (.02, .4), 15, .25, (1000, 7000), (0, .4)),
    "pop":      ("pop bubble blip appear ui plop", "loop music song beat corn", (.03, .6), 20, .4, (500, 5000), (0, .5)),
    "toggle":   ("toggle switch on off ui click", "loop music song light", (.05, .7), 20, .5, (800, 6000), (0, .6)),
    "typing":   ("typing keyboard keys type computer laptop", "loop music typewriter bell", (.3, 2.5), 30, .4, (1500, 8000), (0, 1)),
    "ding":     ("ding dong notification chime bell alert message", "loop music song church", (.4, 2.5), 25, 1.8, (700, 5000), (0, .6)),
    "success":  ("success complete achievement positive chime win correct", "loop music song fail", (.4, 2.5), 30, 1.8, (600, 5000), (0, .7)),
    "error":    ("error fail wrong negative buzz denied", "loop music song", (.2, 1.5), 30, 1, (200, 4000), (0, .7)),
    "whoosh":   ("whoosh swoosh swish transition swipe air fast", "loop music song wind ambience chime bell", (.2, 1.5), 400, .8, (400, 6000), (.2, .85)),
    "sweep":    ("sweep riser rise transition swell", "loop music song", (.4, 3), 800, 1, (400, 8000), (.3, .95)),
    "resolve":  ("logo chime outro resolve sting ending bell", "loop song", (.6, 3.5), 40, 2.5, (400, 5000), (0, .6)),
    "paper":    ("paper slide rustle sheet page flip", "loop music chime bell ding notification", (.1, 1.5), 60, .6, (1500, 9000), (0, 1)),
    "cut":      ("scissors snip cut knife chop", "loop music", (.05, .8), 25, .4, (1500, 9000), (0, .5)),
    "trash":    ("trash can bin metal lid clang drop", "loop music", (.1, 1.5), 30, 1, (300, 6000), (0, .5)),
    "stamp":    ("stamp rubber thud press seal", "loop music chime bell glass", (.05, .8), 20, .4, (200, 4000), (0, .4)),
}
# Mixkit tag pages per category (server-rendered, no key; full WAVs on assets.mixkit.co)
MIXKIT_TAGS = {"click": ["click", "interface"], "clickAlt": ["click", "interface"], "pop": ["pop", "bubbles", "cartoon"], "toggle": ["interface", "click"],
               "typing": ["typing", "keyboard"], "ding": ["notification", "ding", "bell"], "success": ["success", "notification"], "error": ["interface", "notification"],
               "whoosh": ["whoosh", "woosh", "transition"], "sweep": ["transition", "whoosh"], "resolve": ["bell", "notification"], "paper": ["paper"],
               "cut": ["scissors", "cut"], "trash": ["trash", "metal"], "stamp": ["impact", "hit", "punch"]}
MIXKIT_LICENSE = "Mixkit Sound Effects Free License (https://mixkit.co/license/#sfxFree)"
LICENSE_W = {"cc0": 1.0, "pixabay": 1.0, "mixkit": .95, "attribution": .8, "cc-by": .8, "user": 1.0}


def tokens(s: str) -> set:
    return set(re.findall(r"[a-z]+", s.lower()))


def secret(name):
    if os.environ.get(name):
        return os.environ[name]
    f = Path(os.environ.get("SECRETS_ENV", Path.home() / ".config/secrets/.env"))
    if f.exists():
        for line in f.read_text().splitlines():
            k, sep, v = line.partition("=")
            if sep and k.strip() == name and v.strip():
                return v.strip().strip('"').strip("'")
    return None


def save_meta(path: Path, meta: dict):
    Path(str(path) + ".json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))


def load_meta(path: Path) -> dict:
    p = Path(str(path) + ".json")
    return json.loads(p.read_text()) if p.exists() else {}


# ── sources ────────────────────────────────────────────────────────────────
def search_local(need, dirs, dest: Path, per: int) -> int:
    terms = tokens(CATS[need["cat"]][0] + " " + need.get("query", ""))
    hits = []
    for d in dirs:
        for p in Path(d).expanduser().rglob("*"):
            if p.suffix.lower() in AUDIO_EXT:
                score = len(tokens(str(p.relative_to(Path(d).expanduser()))) & terms)
                if score:
                    hits.append((score, p))
    n = 0
    for _, p in sorted(hits, key=lambda h: -h[0])[:per]:
        out = dest / f"local-{n}-{p.name}"
        shutil.copy2(p, out)
        save_meta(out, {"source": str(p), "title": p.stem, "tags": [], "license": "user", "author": "user library", "origin": "local"})
        n += 1
    return n


def search_freesound(need, key: str, dest: Path, per: int) -> int:
    lo, hi = CATS[need["cat"]][2]
    q = need.get("query") or CATS[need["cat"]][0].split()[0]
    params = {"query": q, "filter": f'duration:[{lo} TO {hi * 1.5}] license:("Creative Commons 0" OR "Attribution")',
              "fields": "id,name,tags,description,license,duration,avg_rating,num_downloads,previews,username,url", "page_size": per, "token": key}
    url = "https://freesound.org/apiv2/search/text/?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as r:
        res = json.loads(r.read())["results"]
    n = 0
    for s in res:
        prev = s["previews"].get("preview-hq-mp3")
        if not prev:
            continue
        out = dest / f"fs-{s['id']}.mp3"
        with urllib.request.urlopen(prev, timeout=60) as r:
            out.write_bytes(r.read())
        save_meta(out, {"source": s["url"], "title": s["name"], "tags": s["tags"], "description": s["description"][:400], "license": s["license"],
                        "author": s["username"], "downloads": s["num_downloads"], "rating": s["avg_rating"], "origin": "freesound"})
        n += 1
    return n


CACHE = Path(os.environ.get("DONGHUA_CACHE", Path.home() / ".cache/donghua-maker"))
UA = {"User-Agent": "Mozilla/5.0"}


def fetch(url: str, cache: Path, max_age_days: float = 1e9) -> bytes:
    """GET with an on-disk cache (tag pages refresh after max_age_days; audio files never change)."""
    import time
    if cache.exists() and (time.time() - cache.stat().st_mtime) / 86400 < max_age_days:
        return cache.read_bytes()
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        data = r.read()
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_bytes(data)
    return data


def search_mixkit(need, dest: Path, per: int) -> int:
    """Mixkit tag pages (cached 7 days, fetched in parallel) → pre-rank cards by title/tags → download the top `per`
    full-length preview mp3s in parallel (cached forever; the importer re-encodes to mp3 anyway, so no WAV needed)."""
    from concurrent.futures import ThreadPoolExecutor
    tags = MIXKIT_TAGS.get(need["cat"], [])
    def page(tag):
        try:
            return tag, fetch(f"https://mixkit.co/free-sound-effects/{tag}/", CACHE / "mixkit/pages" / f"{tag}.html", 7).decode("utf-8", "replace")
        except Exception as e:  # a missing tag page is normal; keep the others
            print(f"mixkit {tag}: {e}", file=sys.stderr)
            return tag, ""
    with ThreadPoolExecutor(8) as ex:
        pages = list(ex.map(page, tags))
    cards, seen = [], set()
    for tag, h in pages:
        for block in h.split('class="item-grid__item"')[1:]:
            m = re.search(r'sfx/(\d+)/\1-preview\.mp3', block)
            t = re.search(r'item-grid-card__title">\s*([^<]+?)\s*<', block)
            if not m or m.group(1) in seen:
                continue
            seen.add(m.group(1))
            cards.append({"id": m.group(1), "title": (t.group(1) if t else "").strip(), "tags": re.findall(r'href="/free-sound-effects/([a-z0-9-]+)/"', block),
                          "page": f"https://mixkit.co/free-sound-effects/{tag}/"})
    for c in cards:
        c["pre"] = meta_score(need["cat"], need.get("query", ""), {"title": c["title"], "tags": c["tags"], "license": MIXKIT_LICENSE})
    top = sorted(cards, key=lambda c: -c["pre"])[:per]
    def get(c):
        url = f"https://assets.mixkit.co/active_storage/sfx/{c['id']}/{c['id']}-preview.mp3"
        try:
            data = fetch(url, CACHE / "mixkit/sfx" / f"{c['id']}.mp3")
        except Exception as e:
            print(f"mixkit {c['id']}: {e}", file=sys.stderr)
            return 0
        out = dest / f"mixkit-{c['id']}.mp3"
        out.write_bytes(data)
        save_meta(out, {"source": f"{c['page']}#{c['id']}", "asset": url, "title": c["title"], "tags": c["tags"], "license": MIXKIT_LICENSE, "author": "Mixkit", "origin": "mixkit"})
        return 1
    with ThreadPoolExecutor(8) as ex:
        return sum(ex.map(get, top))


# ── analysis + ranking ─────────────────────────────────────────────────────
def analyse(path: Path) -> dict:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    if x.size < 480:
        return {"dur": x.size / 48000, "bad": "too short"}
    a = np.abs(x)
    pk = float(a.max()) or 1e-9
    env = np.convolve(a, np.ones(240) / 240, mode="same")
    idx_on = int(np.argmax(env > pk * .1 * .5))
    ipk = int(np.argmax(env))
    above = np.nonzero(env > pk * .01)[0]
    tail = (above[-1] - ipk) / 48000 if above.size else 0
    seg = x[max(0, ipk - 2048):ipk + 2048]
    spec = np.abs(np.fft.rfft(seg * np.hanning(seg.size)))
    freqs = np.fft.rfftfreq(seg.size, 1 / 48000)
    centroid = float((spec * freqs).sum() / (spec.sum() + 1e-9))
    return {"dur": round(x.size / 48000, 3), "onset_ms": round(idx_on / 48, 1), "peak_s": round(ipk / 48000, 3), "peak_frac": round(ipk / x.size, 3),
            "tail_s": round(tail, 3), "centroid": round(centroid), "clip": round(float((a > .999).mean()), 5), "peak_db": round(20 * math.log10(pk), 1)}


def within(v, lo, hi, soft):
    return 1.0 if lo <= v <= hi else max(0.0, 1 - (lo - v if v < lo else v - hi) / soft)


def audio_score(cat: str, A: dict) -> float:
    if A.get("bad"):
        return 0.0
    _, _, (dlo, dhi), onset_max, tail_max, (clo, chi), (plo, phi) = CATS[cat]
    parts = [within(A["dur"], dlo, dhi, max(.2, dhi)), within(A["onset_ms"], 0, onset_max, onset_max * 2 + 10), within(A["tail_s"], 0, tail_max, tail_max + .3),
             within(A["centroid"], clo, chi, clo), within(A["peak_frac"], plo, phi, .3), 1.0 if A["clip"] < .001 else .3]
    return round(sum(parts) / len(parts), 3)


def meta_score(cat: str, need_query: str, M: dict) -> float:
    pos, neg = tokens(CATS[cat][0] + " " + need_query), tokens(CATS[cat][1])
    text = tokens(" ".join([M.get("title", ""), " ".join(M.get("tags", [])), M.get("description", "")]))
    overlap = len(text & pos) / max(3, min(len(pos), 6))
    lic = M.get("license", "").lower()
    lw = next((w for k, w in LICENSE_W.items() if k in lic), 0.0)
    pop = min(1.0, math.log10(M.get("downloads", 0) + 1) / 4)
    rating = (M.get("rating") or 3.5) / 5
    return round(max(0.0, min(1.0, overlap) * .5 + lw * .25 + pop * .15 + rating * .1 - .25 * len(text & neg)), 3)


def rank(cands: Path, sounds: Path | None) -> int:
    queries = {}
    nf = cands / "needs.json"
    if nf.exists():
        queries = {n["cat"]: n.get("query", "") for n in json.loads(nf.read_text())["needs"]}
    table, winners = {}, {}
    for cat_dir in sorted(p for p in cands.iterdir() if p.is_dir()):
        cat = cat_dir.name
        if cat not in CATS:
            continue
        rows = []
        for f in sorted(p for p in cat_dir.iterdir() if p.suffix.lower() in AUDIO_EXT):
            M, A = load_meta(f), analyse(f)
            ms, as_ = meta_score(cat, queries.get(cat, ""), M), audio_score(cat, A)
            known = bool(M.get("license")) and M.get("license", "").upper() != "UNKNOWN"
            rows.append({"file": str(f.relative_to(cands.parent)), "score": round(.45 * ms + .55 * as_, 3), "meta": ms, "audio": as_, "licensed": known, **A,
                         "source": M.get("source", "UNKNOWN"), "license": M.get("license", "UNKNOWN"), "author": M.get("author", "UNKNOWN"), "title": M.get("title", f.stem)})
        rows.sort(key=lambda r: -r["score"])
        table[cat] = rows
        best = next((r for r in rows if r["licensed"]), None)
        if best:
            winners[cat] = best
        print(f"{cat:9s}", " | ".join(f"{Path(r['file']).name[:28]} {r['score']:.2f}{'' if r['licensed'] else ' (no licence)'}" for r in rows[:4]) or "no candidates")
    (cands / "ranking.json").write_text(json.dumps(table, ensure_ascii=False, indent=2))
    if sounds:
        spec = json.loads(sounds.read_text()) if sounds.exists() else {"sounds": []}
        keep = [s for s in spec["sounds"] if s.get("cat") not in winners or s.get("method") == "pinned"]
        for cat, r in winners.items():
            keep.append({"id": cat, "cat": cat, "role": "sfx", "file": os.path.relpath(cands.parent / r["file"], sounds.parent), "source": r["source"],
                         "author": r["author"], "license": r["license"], "method": "recorded", "rank": {"score": r["score"], "meta": r["meta"], "audio": r["audio"]}})
        sounds.write_text(json.dumps({"sounds": keep}, ensure_ascii=False, indent=2))
        missing = sorted(set(queries) - set(winners))
        print(f"sounds.json: {len(winners)} recorded winners; synth fallback needed for: {', '.join(missing) or 'none'}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search")
    s.add_argument("needs", type=Path)
    s.add_argument("-o", "--out", type=Path, required=True)
    s.add_argument("--local", action="append", default=[])
    s.add_argument("--per", type=int, default=8)
    s.add_argument("--no-mixkit", action="store_true")
    d = sub.add_parser("add")
    d.add_argument("cat")
    d.add_argument("file", type=Path)
    d.add_argument("-o", "--out", type=Path, required=True)
    d.add_argument("--source", required=True)
    d.add_argument("--license", required=True)
    d.add_argument("--author", default="UNKNOWN")
    d.add_argument("--title", default="")
    d.add_argument("--tags", default="")
    r = sub.add_parser("rank")
    r.add_argument("-o", "--out", type=Path, required=True)
    r.add_argument("--sounds", type=Path)
    a = ap.parse_args()
    if a.cmd == "search":
        needs = json.loads(a.needs.read_text())["needs"]
        a.out.mkdir(parents=True, exist_ok=True)
        shutil.copy2(a.needs, a.out / "needs.json")
        key = secret("FREESOUND_API_KEY")
        from concurrent.futures import ThreadPoolExecutor
        def one(n):
            dest = a.out / n["cat"]
            dest.mkdir(exist_ok=True)
            got = search_local(n, a.local, dest, a.per) if a.local else 0
            if not a.no_mixkit:
                got += search_mixkit(n, dest, a.per)
            if key:
                try:
                    got += search_freesound(n, key, dest, a.per)
                except Exception as e:  # network/API: report, keep going with other sources
                    print(f"freesound {n['cat']}: {e}", file=sys.stderr)
            return f"{n['cat']:9s} {got} candidates" + ("" if key else "  (no FREESOUND_API_KEY: Freesound skipped)")
        for n in needs:
            if n["cat"] not in CATS:
                sys.exit(f"unknown category {n['cat']!r}; one of {', '.join(CATS)}")
        with ThreadPoolExecutor(4) as ex:  # categories in parallel
            for line in ex.map(one, needs):
                print(line)
        return 0
    if a.cmd == "add":
        if a.cat not in CATS:
            sys.exit(f"unknown category {a.cat!r}")
        dest = a.out / a.cat
        dest.mkdir(parents=True, exist_ok=True)
        out = dest / a.file.name
        shutil.copy2(a.file, out)
        save_meta(out, {"source": a.source, "license": a.license, "author": a.author, "title": a.title or a.file.stem, "tags": a.tags.split(","), "origin": "manual"})
        print(f"added {out}")
        return 0
    return rank(a.out, a.sounds)


if __name__ == "__main__":
    sys.exit(main())
