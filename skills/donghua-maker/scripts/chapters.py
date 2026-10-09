#!/usr/bin/env python3
"""Long films in chapters: one file per chapter, built into one single-file HTML film.

    python3 chapters.py init letter/ --title "一封信的旅程" --format portrait --bpm 120 --narrated \\
        --chapters "开场:4,纸艺小镇:12,水墨山路:12,浮世绘海:12,水彩窗边:10"
    python3 chapters.py build letter/                 # → letter/letter.html
    python3 chapters.py build letter/ -o out.html

`init` writes film.json (the settings and the chapter list), story.js (shared code: palette, melody, rigs, state that
spans chapters) and one ch/NN-<name>.js per chapter. `build` scaffolds the film from film.json, pastes story.js, then
each chapter inside its own function scope, so a chapter's helpers can't collide with another's. In a chapter file:

    const lamp = (g, x, y) => { … };                  // private to this chapter
    shot({ name: '邮筒', t0: 0, t1: 3.5, … });        // a normal shot object; t0/t1 relative to the chapter start
    CH                                                // { name, i, t0, t1, dur } of this chapter

A chapter's shots must tile the chapter exactly; the film throws at load naming the gap or overlap. A chapter with no
shots yet plays as a placeholder card (its name and time span), so the whole film is watchable at every stage.

Blocks other tools write into the built film (fonts, SAMPLES, FRAMES, NARRATION) are carried over from the previous
build, so rebuild freely; re-run font_embed.py after changing text. references/long-film.md has the workflow.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAME_OK = re.compile(r"^[^,:/\\]+$")

STORY_STUB = """// story.js — shared by every chapter: palette, melody, rigs that cross chapters, state that spans the film.
// The film head already declares C, BEAT, CHORDS, MELODY (an array: push into it) and baseScore().
Object.assign(C, {});
// MELODY.push([0, 'E5'], [0.5, 'G5']);
// A number the whole film shows (a counter, a meter) is one function of time, defined here and read by every chapter:
// const progressAt = T => clamp(T / DUR, 0, 1);
"""

CHAPTER_STUB = """// ═══ chapter {i} · {name} ({t0:g}–{t1:g} s, {dur:g} s) ═══
// Helpers declared here are private to this chapter. Shot times are relative to the chapter: 0 … {dur:g}.
// Until a shot is pushed, this chapter plays as a placeholder card.
//
// shot({{
//   name: '{name}', t0: 0, t1: {dur:g},
//   cam(st) {{ return {{ x: W / 2, y: H / 2, z: 1 }}; }},
//   build() {{}}, reset() {{}}, step(dt, st, sf) {{}}, snap() {{}},
//   draw(ctx, st, sq, e, cam) {{ setCam(ctx, cam, 1); }},
//   score() {{ return []; }},
// }});
"""

# runs before the chapters: the shot() helper, the per-chapter tiling check and the placeholder card
PRELUDE = """// ═══ CHAPTERS (built by scripts/chapters.py from {src} — edit the chapter files, not this section) ═══
const CHAPTERS = [];
function chapterOpen(name, i, t0, t1) {{ const CH = {{ name, i, t0, t1, dur: t1 - t0, n0: SHOTS.length }}; CHAPTERS.push(CH);
  return [CH, o => {{ o.t0 = +(CH.t0 + o.t0).toFixed(6); o.t1 = +(CH.t0 + o.t1).toFixed(6); SHOTS.push(o); return o; }}]; }}
function chapterClose(CH) {{
  const mine = SHOTS.slice(CH.n0);
  if (!mine.length) {{ SHOTS.push(chapterTodo(CH)); return; }}
  let t = CH.t0;
  for (const s of mine) {{
    if (Math.abs(s.t0 - t) > 1e-4) throw new Error(`chapter ${{CH.name}}: shot ${{s.name}} starts at ${{(s.t0 - CH.t0).toFixed(3)}} s, expected ${{(t - CH.t0).toFixed(3)}} s (gap or overlap; times are relative to the chapter)`);
    if (!(s.t1 > s.t0)) throw new Error(`chapter ${{CH.name}}: shot ${{s.name}} has t1 <= t0`);
    const q = (s.t1 / (BEAT / 2)) % 1; if (s.t1 < CH.t1 - 1e-4 && Math.min(q, 1 - q) > 1e-3) console.warn(`chapter ${{CH.name}}: cut after ${{s.name}} at ${{s.t1}} s is off the eighth-note grid`);
    t = s.t1;
  }}
  if (Math.abs(t - CH.t1) > 1e-4) throw new Error(`chapter ${{CH.name}}: shots end at ${{(t - CH.t0).toFixed(3)}} s, the chapter is ${{CH.dur}} s`);
}}
function chapterTodo(CH) {{
  return {{ name: CH.name, t0: CH.t0, t1: CH.t1, todo: true, cam() {{ return {{ x: W / 2, y: H / 2, z: 1 }}; }}, build() {{}}, reset() {{}}, step() {{}}, snap() {{}},
    draw(g, st) {{ g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#e9e2d0'; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
      const u = Math.min(g.canvas.width, g.canvas.height) / 20; g.fillStyle = '#5b5446'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `600 ${{u * 1.6}}px sans-serif`; g.fillText(`${{CH.i}} · ${{CH.name}}`, g.canvas.width / 2, g.canvas.height / 2 - u);
      g.font = `${{u * .7}}px sans-serif`; g.fillText(`${{CH.t0}}–${{CH.t1}} s · not drawn yet`, g.canvas.width / 2, g.canvas.height / 2 + u * .6);
      g.fillStyle = '#c9bfa6'; g.fillRect(g.canvas.width * .2, g.canvas.height / 2 + u * 1.6, g.canvas.width * .6 * st / CH.dur, u * .2); }},
    score() {{ return []; }} }};
}}
"""

# blocks other tools write into the film: [begin marker, end marker or None (one element), where to insert when absent]
CARRY = [
    ("// ═══ SAMPLES BEGIN", "// ═══ SAMPLES END ═══", "const SHOTS = [];"),
    ("// ═══ FRAMES BEGIN", "// ═══ FRAMES END ═══", "const SHOTS = [];"),
    ("// ═══ NARRATION", "// ═══ /NARRATION\n", "// ═══ ENGINE"),
]
FONTS = re.compile(r'<style id="embedfonts"[^>]*>.*?</style>\n?', re.S)


def parse_chapters(spec: str) -> list:
    out = []
    for part in [p.strip() for p in spec.split(",") if p.strip()]:
        name, _, dur = part.rpartition(":")
        try:
            d = float(dur)
        except ValueError:
            sys.exit(f"--chapters: '{part}' should be name:seconds")
        if not name or not NAME_OK.match(name) or d < .5:
            sys.exit(f"--chapters: bad chapter '{part}' (name without , : / and at least 0.5 s)")
        out.append({"name": name.strip(), "dur": d})
    if not out:
        sys.exit("--chapters needs at least one name:seconds")
    if len({c["name"] for c in out}) != len(out):
        sys.exit("--chapters: chapter names must be unique")
    return out


def init(a) -> int:
    d = a.dir.resolve()
    if (d / "film.json").exists():
        sys.exit(f"{d / 'film.json'} exists; edit it, or init into a new folder")
    chs = parse_chapters(a.chapters)
    (d / "ch").mkdir(parents=True, exist_ok=True)
    t = 0.0
    for i, c in enumerate(chs, 1):
        c["file"] = f"ch/{i:02d}-{c['name']}.js"
        (d / c["file"]).write_text(CHAPTER_STUB.format(i=i, name=c["name"], t0=t, t1=t + c["dur"], dur=c["dur"]), encoding="utf-8")
        t += c["dur"]
    cfg = {"title": a.title, "format": a.format, "bpm": a.bpm, "look": a.look, "narrated": a.narrated, "bed": a.bed,
           "aria": a.aria, "chapters": chs}
    (d / "film.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (d / "story.js").write_text(STORY_STUB, encoding="utf-8")
    print(f"wrote {d}/film.json, story.js and {len(chs)} chapter files ({t:g} s). Build with: chapters.py build {a.dir}")
    return 0


def carry(old: str, new: str) -> tuple:
    kept = []
    for begin, end, anchor in CARRY:
        if begin not in old:
            continue
        i = old.index(begin)
        j = old.index(end, i) + len(end)
        block = old[i:j]
        new = new.replace(anchor, block + ("\n" if not block.endswith("\n") else "") + anchor, 1)
        kept.append(begin.split("═══ ")[1].split()[0])
    m = FONTS.search(old)
    if m:
        new = new.replace("</head>", m.group(0) + "</head>", 1)
        kept.append("fonts")
    return new, kept


def build(a) -> int:
    d = a.dir.resolve()
    cfg_path = d / "film.json"
    if not cfg_path.exists():
        sys.exit(f"no film.json in {d} (run chapters.py init first)")
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    chs = cfg["chapters"]
    out = (a.out or d / f"{d.name}.html").resolve()
    for c in chs:
        if not (d / c["file"]).exists():
            sys.exit(f"missing chapter file {c['file']} (listed in film.json)")
    with tempfile.TemporaryDirectory() as tmp:
        stub = Path(tmp) / "film.html"
        cmd = [sys.executable, str(HERE / "scaffold.py"), str(stub), "--title", cfg["title"], "--format", cfg["format"],
               "--bpm", str(cfg["bpm"]), "--bed", cfg.get("bed") or "room", "--shots", ",".join(c["name"] for c in chs),
               "--durs", ",".join(f"{c['dur']:g}" for c in chs)]
        cmd += ["--look", cfg["look"]] if cfg.get("look") else []
        cmd += ["--narrated"] if cfg.get("narrated") else []
        cmd += ["--aria", cfg["aria"]] if cfg.get("aria") else []
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode:
            sys.exit("scaffold failed: " + (r.stderr or r.stdout).strip())
        if r.stderr.strip():
            print(r.stderr.strip(), file=sys.stderr)
        html = stub.read_text(encoding="utf-8")
    a0, z = html.index("// ═══ SHOT 1 "), html.rindex(f"SHOTS.push(S{len(chs)});\n") + len(f"SHOTS.push(S{len(chs)});\n")
    parts = [PRELUDE.format(src=cfg_path.parent.name + "/"), "// ═══ story.js ═══\n", (d / "story.js").read_text(encoding="utf-8").rstrip() + "\n"]
    t = 0.0
    for i, c in enumerate(chs, 1):
        body = (d / c["file"]).read_text(encoding="utf-8").rstrip()
        name = json.dumps(c["name"], ensure_ascii=False)
        parts.append(f"// ═══ CHAPTER {i} · {c['name']} ({t:g}–{t + c['dur']:g} s) · {c['file']} ═══\n"
                     f"(() => {{ const [CH, shot] = chapterOpen({name}, {i}, {t:g}, {t + c['dur']:g});\n{body}\nchapterClose(CH); }})();\n")
        t += c["dur"]
    html = html[:a0] + "".join(parts) + html[z:]
    # the timeline bar shows one segment per shot; the build doesn't know the shots, so the engine makes them at boot
    html = html.replace(re.search(r'<div id="track"[^>]*>(.*?)<span id="head">', html, re.S).group(1), "", 1)
    kept = []
    if out.exists():
        html, kept = carry(out.read_text(encoding="utf-8"), html)
    out.write_text(html, encoding="utf-8")
    chk = check_syntax(d, chs)
    print(f"wrote {out}  {t:g} s  {len(chs)} chapters" + (f"  · kept from the last build: {', '.join(kept)}" if kept else ""))
    if chk:
        print(chk, file=sys.stderr)
        return 1
    return 0


def node_check(code: str, offset: int = 0) -> str:
    """node --check on one piece of JS; '' when fine (or node is missing), else the first error line and its source."""
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(code)
    try:
        r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
    except FileNotFoundError:
        return ""
    finally:
        Path(f.name).unlink(missing_ok=True)
    if r.returncode == 0:
        return ""
    m = re.search(r":(\d+)\n(.*?)\n", r.stderr)
    err = next((ln for ln in r.stderr.splitlines() if "Error" in ln), r.stderr.strip())
    return f"{err}" + (f" (line {int(m.group(1)) - offset}: {m.group(2).strip()})" if m else "")


def check_syntax(d: Path, chs: list) -> str:
    """Each source checked on its own, so an unclosed bracket is blamed on its own file, not the next one."""
    for name, code, off in [("story.js", (d / "story.js").read_text(encoding="utf-8"), 0)] + \
            [(c["file"], "(() => {\n" + (d / c["file"]).read_text(encoding="utf-8") + "\n})();", 1) for c in chs]:
        err = node_check(code, off)
        if err:
            return f"syntax error in {name}: {err}\n(the film was written anyway; fix the file and build again)"
    return ""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("init", help="create film.json, story.js and one file per chapter")
    i.add_argument("dir", type=Path)
    i.add_argument("--title", required=True)
    i.add_argument("--chapters", required=True, help="'name:seconds,name:seconds,…' in order")
    i.add_argument("--format", choices=("landscape", "portrait", "square", "feed"), default="landscape")
    i.add_argument("--bpm", type=float, default=96)
    i.add_argument("--look", default="", help="a --look toolkit for the whole film")
    i.add_argument("--narrated", action="store_true")
    i.add_argument("--bed", default="room")
    i.add_argument("--aria", default="")
    b = sub.add_parser("build", help="assemble the chapters into one HTML film")
    b.add_argument("dir", type=Path)
    b.add_argument("-o", "--out", type=Path)
    a = ap.parse_args()
    return init(a) if a.cmd == "init" else build(a)


if __name__ == "__main__":
    raise SystemExit(main())
