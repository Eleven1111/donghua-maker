#!/usr/bin/env python3
"""Embed commercially usable (SIL OFL) fonts into a film, subset to the characters it uses.

    python3 font_embed.py <film>.html                       # default: wenkai (hand/kai look) for FONT + notosans for subtitles
    python3 font_embed.py <film>.html --fonts wenkai        # any of: wenkai, notosans, notoserif
    python3 font_embed.py <film>.html --check               # only verify: every drawn CJK char is covered, licence files present

Why: system fonts such as Xingkai SC / STKaiti ship with macOS under Apple's licence — not cleared for commercial video, and
missing on Windows/Android, so the film silently falls back. Embedded OFL fonts look the same everywhere and may be used commercially.

- Downloads once into ~/.cache/donghua-fonts/ and logs source + licence in <film>-fonts/sources.json (with the OFL text).
- Subsets to every character in the film's story (on-screen strings + narration lines) + ASCII + CJK punctuation, as WOFF.
- Writes <style id="embedfonts" data-families="…"> into the film; the engine waits for those faces before the first frame,
  and subtitles use them. The first family is also prepended to the story's `const FONT = '…'` if the film has one.
- Re-run after any text change (the subset only holds characters that existed when it was made); --check catches a stale subset.
"""
import argparse
import base64
import json
import re
import sys
import urllib.request
from io import BytesIO
from pathlib import Path

CATALOG = {
    "wenkai": {"family": "LXGW WenKai", "file": "LXGWWenKai-Regular.ttf",
               "url": "https://github.com/lxgw/LxgwWenKai/releases/download/v1.522/LXGWWenKai-Regular.ttf",
               "home": "https://github.com/lxgw/LxgwWenKai", "license": "SIL Open Font License 1.1",
               "license_url": "https://raw.githubusercontent.com/lxgw/LxgwWenKai/main/OFL.txt"},
    "notosans": {"family": "Noto Sans SC", "file": "NotoSansSC-wght.ttf",
                 "url": "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf",
                 "home": "https://github.com/google/fonts/tree/main/ofl/notosanssc", "license": "SIL Open Font License 1.1",
                 "license_url": "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt"},
    "notoserif": {"family": "Noto Serif SC", "file": "NotoSerifSC-wght.ttf", "weights": "200 900",
                  "url": "https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
                  "home": "https://github.com/google/fonts/tree/main/ofl/notoserifsc", "license": "SIL Open Font License 1.1",
                  "license_url": "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt"},
}
CACHE = Path.home() / ".cache" / "donghua-fonts"
STYLE = re.compile(r'<style id="embedfonts"[^>]*>.*?</style>\n?', re.S)
EXTRA = "".join(chr(c) for c in range(0x20, 0x7F)) + "，。！？；：、“”‘’（）《》【】…—·～％°×÷±≈≠≤≥√²³½αβπθΔ→←↑↓"


def fetch(url: str, dest: Path) -> Path:
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"  downloading {url}")
        with urllib.request.urlopen(url, timeout=120) as r:
            dest.write_bytes(r.read())
    return dest


def drawn_chars(html: str) -> set:
    a, b = html.find("// ═══ STORY"), html.find("// ═══ ENGINE", html.find("// ═══ STORY"))
    story = html[a:b] if a >= 0 and b >= 0 else html
    story = re.sub(r"VO\.src = \[.*?\];", "", story, flags=re.S)
    return {c for c in story if ord(c) > 0x2E7F} | set(EXTRA)


def subset(src: Path, chars: set) -> bytes:
    from fontTools import subset as fs
    from fontTools.ttLib import TTFont
    font = TTFont(str(src))
    opt = fs.Options()
    opt.flavor, opt.layout_features, opt.name_IDs, opt.notdef_outline = "woff", ["*"], ["*"], True
    sub = fs.Subsetter(opt)
    sub.populate(text="".join(sorted(chars)))
    sub.subset(font)
    buf = BytesIO()
    font.flavor = "woff"
    font.save(buf)
    return buf.getvalue()


def covered(woff_b64: str, chars: set) -> set:
    from fontTools.ttLib import TTFont
    cmap = TTFont(BytesIO(base64.b64decode(woff_b64))).getBestCmap()
    return {c for c in chars if ord(c) in cmap}


def check(film: Path) -> int:
    html = film.read_text()
    m = STYLE.search(html)
    if not m:
        print("FONT CHECK FAIL: no embedded fonts (run font_embed.py)"); return 1
    chars = {c for c in drawn_chars(html) if not c.isspace()}
    errs = []
    faces = re.findall(r'font-family:"([^"]+)";src:url\(data:font/woff;base64,([A-Za-z0-9+/=]+)\)', m.group(0))
    for fam, b64 in faces:
        miss = sorted(chars - covered(b64, chars))
        if miss:
            errs.append(f"{fam} lacks {len(miss)} chars used by the film: {''.join(miss[:30])} — re-run font_embed.py")
    src = film.with_name(film.stem + "-fonts") / "sources.json"
    led = json.loads(src.read_text()) if src.exists() else []
    for fam, _ in faces:
        e = next((x for x in led if x.get("family") == fam), None)
        if not e or not (film.with_name(film.stem + "-fonts") / e.get("license_file", "-")).exists():
            errs.append(f"{fam}: no licence entry/file in {src.parent.name}/")
    for e in errs:
        print("  " + e)
    print(f"{len(faces)} embedded faces · {len(chars)} drawn chars · FONT CHECK " + ("FAIL" if errs else "PASS"))
    return 1 if errs else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("--fonts", default="wenkai,notosans", help="comma list from: " + ", ".join(CATALOG))
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    film = a.film.resolve()
    if a.check:
        return check(film)
    keys = [k.strip() for k in a.fonts.split(",") if k.strip()]
    bad = [k for k in keys if k not in CATALOG]
    if bad:
        ap.error(f"unknown font {bad}; choose from {list(CATALOG)}")
    html = film.read_text()
    chars = drawn_chars(html)
    out = film.with_name(film.stem + "-fonts")
    out.mkdir(exist_ok=True)
    faces, ledger = [], []
    for k in keys:
        c = CATALOG[k]
        ttf = fetch(c["url"], CACHE / c["file"])
        lic = fetch(c["license_url"], CACHE / f"{k}-OFL.txt")
        (out / f"LICENSE-{k}.txt").write_text(lic.read_text())
        data = subset(ttf, chars)
        faces.append((c["family"], base64.b64encode(data).decode(), c.get("weights")))
        ledger.append({"family": c["family"], "file": c["file"], "source": c["url"], "home": c["home"], "license": c["license"],
                       "license_file": f"LICENSE-{k}.txt", "commercial_use": True, "subset_chars": len(chars), "bytes": len(data)})
        print(f"  {c['family']}: {len(chars)} chars → {len(data) // 1024} KB")
    # variable fonts declare their weight range, or canvas `bold` falls back to a synthetic bold
    style = (f'<style id="embedfonts" data-families="{",".join(f for f, _, _ in faces)}">'
             + "".join(f'@font-face{{font-family:"{f}";src:url(data:font/woff;base64,{b})' + (f';font-weight:{w}' if w else '') + '}' for f, b, w in faces) + "</style>\n")
    html = STYLE.sub("", html)
    html = html.replace("</head>", style + "</head>", 1) if "</head>" in html else html.replace("<script>", style + "<script>", 1)
    first = faces[0][0]
    m = re.search(r"const FONT = '([^']*)'", html)
    if m and first not in m.group(1):
        html = html[:m.start(1)] + f'"{first}", ' + html[m.start(1):]
        print(f"  FONT now starts with \"{first}\"")
    elif not m:
        print("  note: no `const FONT = '…'` in the story — put the family name first in your own font stacks")
    film.write_text(html)
    (out / "sources.json").write_text(json.dumps(ledger, ensure_ascii=False, indent=1))
    return check(film)


if __name__ == "__main__":
    sys.exit(main())
