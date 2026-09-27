#!/usr/bin/env python3
"""Scaffold a single-file stop-motion canvas film from the engine template."""
import argparse
import html
import sys
from pathlib import Path

FORMATS = {
    "landscape": (2560, 1440),  # 16:9
    "portrait": (1440, 2560),   # 9:16  (Douyin / Reels / Shorts)
    "square": (1440, 1440),     # 1:1
    "feed": (1440, 1800),       # 4:5   (Xiaohongshu / Instagram feed)
}

SHOT_STUB = """// ═══ SHOT {n} · {name_up} ({t0:g}–{t1:g} s) — TODO one-line beat ═══════════════════
const S{n} = {{
  name: '{name}', t0: {t0:g}, t1: {t1:g},
  cam(st) {{ const u = eio(st / {dur:g}); return {{ x: lerp(W / 2, W / 2, u), y: lerp(H / 2, H / 2, u), z: lerp(1, 1.08, u) }}; }},
  build() {{
    this.bg = backdrop(W + 256, H + 144, {{ grad: [[0, C.skyL], [1, C.sky]], mottle: .5, seed: {seed} }});
  }},
  reset() {{
    this.R = rng({seed}01);
    for (let i = 0; i < 30; i++) this.step(1 / 60, -30 / 60 + i / 60, -30 + i);
    this.snap();
  }},
  step(dt, st, sf) {{ const T = this.t0 + st; }},
  snap() {{ }},
  draw(ctx, st, sq, e, cam) {{
    setCam(ctx, cam, .8); ctx.drawImage(this.bg, -128, -72);
    setCam(ctx, cam, 1);
  }},
  score() {{ return []; }},
  poke(x, y) {{ return false; }},
}};
SHOTS.push(S{n});
"""

PIXEL_STUB = """// ═══ SHOT {n} · {name_up} ({t0:g}–{t1:g} s) — TODO one-line beat ═══════════════════
// pixel mode: world units are low-res pixels (LW×LH); draw with pxArt/pxPut/pxRect/pxDisc/pxDither, whole numbers only
const S{n} = {{
  name: '{name}', t0: {t0:g}, t1: {t1:g},
  cam(st) {{ const u = eio(st / {dur:g}); return {{ x: lerp(LW / 2, LW / 2, u), y: LH / 2, z: 1 }}; }},
  build() {{
    this.sky = mk(LW, LH); pxDither(g2(this.sky), 0, 0, LW, LH, '#4a6fa5', '#f2b279', (x, y) => y / LH);
  }},
  reset() {{
    this.R = rng({seed}01);
    for (let i = 0; i < 30; i++) this.step(1 / 60, -30 / 60 + i / 60, -30 + i);
    this.snap();
  }},
  step(dt, st, sf) {{ const T = this.t0 + st; }},
  snap() {{ }},
  draw(ctx, st, sq, e, cam) {{
    setCamP(ctx, cam, .5); ctx.drawImage(this.sky, 0, 0);
    setCamP(ctx, cam, 1);
  }},
  score() {{ return []; }},
  poke(x, y) {{ return false; }},
}};
SHOTS.push(S{n});
"""

STORY_HEAD = """// ═══ STORY: {title} ═══════════════════════════════════════════════════════════
// palette override — keep names used by the shared puppets (ink, cream, red, sky…), add your own
Object.assign(C, {{}});
const BEAT = 60 / {bpm};
// groove() chords: root first, one per bar (references/audio.md has progressions by mood). Pick for the film.
const CHORDS = [['C3', 'E4', 'G4', 'B4', 'D5'], ['A2', 'C4', 'E4', 'G4', 'B4'], ['F2', 'A3', 'C4', 'E4', 'G4'], ['G2', 'B3', 'D4', 'F4', 'A4']];
// [time s, note] — the lead line; each note should also be a visual event in its shot
const MELODY = [];
// optional brief for scripts/audio_director.py (references/audio.md §0): sections, payoff hits, synth-kind → sound-category overrides
// const AUDIO_PLAN = {{ mood: 'warm-business', key: 'C', sections: [{{ t0: 0, t1: 2, kind: 'intro' }}], hits: [], map: {{}} }};
function baseScore() {{
  // ambience beds hiss under narration — drop them when the film has a voice track (SKILL.md §4b)
  const ev = [{beds}].concat(groove({{ chords: CHORDS }}));
  MELODY.forEach(([t, n], i) => ev.push({{ t, k: 'mb', n, v: .9, pan: Math.sin(i * 1.7) * .25 }}));
  return ev;
}}
const SHOTS = [];
"""


def tc(sec: float) -> str:
    return f"00:{int(sec):02d}.{int(round((sec % 1) * 100)):02d}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("out", type=Path)
    ap.add_argument("--title", required=True)
    ap.add_argument("--format", choices=FORMATS, default="landscape")
    ap.add_argument("--dur", type=float, default=10.0, help="total seconds when shots are split evenly (ignored with --durs)")
    ap.add_argument("--shots", default="One,Two,Three,Four", help="comma-separated shot names")
    ap.add_argument("--durs", default="", help="per-shot seconds, e.g. '2,3.5,2.5,2' (overrides --dur; total = sum)")
    ap.add_argument("--bpm", type=float, default=96)
    ap.add_argument("--bed", default="room", help="default ambience bed: room|street|field|stage")
    ap.add_argument("--goldscroll", action="store_true", help="金屏说史 look: paste the gold-scroll toolkit (references/looks/gold-scroll.md)")
    ap.add_argument("--three", action="store_true", help="3D look: inline three.js (assets/lib) and the brick3d toolkit (references/looks/brick3d.md)")
    ap.add_argument("--narrated", action="store_true", help="the film will have a voice track: no ambience beds (they hiss under speech)")
    ap.add_argument("--aria", default="", help="one-sentence description for screen readers")
    ap.add_argument("--pixel", type=int, default=0, help="pixel-art mode: draw at (W/N)x(H/N) and scale up xN nearest-neighbour, e.g. 8 -> 320x180")
    a = ap.parse_args()

    names = [s.strip() for s in a.shots.split(",") if s.strip()]
    if not 1 <= len(names) <= 16:
        sys.exit("need 1–16 shots (number keys 1–9 jump to the first nine)")
    if a.durs:
        try:
            lens = [float(x) for x in a.durs.split(",") if x.strip()]
        except ValueError:
            sys.exit(f"--durs must be comma-separated numbers, got {a.durs!r}")
        if len(lens) != len(names):
            sys.exit(f"--durs has {len(lens)} values but --shots names {len(names)} shots")
        if any(x < 0.5 for x in lens):
            sys.exit("every shot needs at least 0.5 s (anything shorter can't show a pose change and a settle)")
    else:
        if a.dur <= 0:
            sys.exit("--dur must be positive")
        lens = [a.dur / len(names)] * len(names)
    if a.bpm <= 0:
        sys.exit("--bpm must be positive")
    a.dur = round(sum(lens), 4)
    w, h = FORMATS[a.format]
    if a.pixel < 0 or (a.pixel and (w % a.pixel or h % a.pixel)):
        sys.exit(f"--pixel must divide {w}x{h} evenly (e.g. 4, 8, 10, 16 for landscape/portrait)")
    tpl = Path(__file__).resolve().parent.parent / "assets" / "engine.html"
    src = tpl.read_text(encoding="utf-8")

    bounds, t = [], 0.0
    for x in lens:
        bounds.append((round(t, 4), round(t + x, 4)))
        t += x
    # cuts should land on the music's eighth-note grid, or the picture and the score drift apart at every cut
    eighth = 30 / a.bpm
    off = [(t1, round(t1 / eighth) * eighth) for _, t1 in bounds[:-1] if abs(t1 / eighth - round(t1 / eighth)) > 1e-3]
    if off:
        print("warning: cuts off the eighth-note grid at %g bpm: %s" % (a.bpm, ", ".join(f"{c:g}s (nearest {n:.4g}s)" for c, n in off)), file=sys.stderr)
    beds = "" if a.narrated else ", ".join(f"{{ t: {t0:g}, k: 'bed', kind: '{a.bed}', dur: {t1 - t0 + (.12 if i == len(names) - 1 else 0):g} }}"
                     for i, (t0, t1) in enumerate(bounds))
    story = STORY_HEAD.format(title=a.title, bpm=a.bpm, beds=beds)
    assets = Path(__file__).resolve().parent.parent / "assets"
    if a.goldscroll:
        story += (assets / "toolkit-goldscroll.js").read_text(encoding="utf-8") + "\n"
    if a.three:
        story += (assets / "toolkit-brick3d.js").read_text(encoding="utf-8") + "\n"
    for i, (name, (t0, t1)) in enumerate(zip(names, bounds), 1):
        story += (PIXEL_STUB if a.pixel else SHOT_STUB).format(n=i, name=name, name_up=name.upper(), t0=t0, t1=t1, dur=t1 - t0, seed=i * 10 + 1)

    esc = html.escape
    rep = {
        "{{W}}": str(w), "{{H}}": str(h), "{{DUR}}": f"{a.dur:g}", "{{DURTC}}": tc(a.dur),
        "{{TITLE}}": esc(a.title), "{{ARIA}}": esc(a.aria or f"{a.title}, a stop-motion paper film."),
        "{{NSHOTS}}": str(min(9, len(names))), "{{PIX}}": str(a.pixel), "{{UIH}}": "128" if w > h else "290", "{{SEGS}}": "".join(f'<span class="seg">{esc(n)}</span>' for n in names),
        "/*__STORY__*/": story,
    }
    for k, v in rep.items():
        src = src.replace(k, v)
    leftover = [k for k in ("{{", "__STORY__") if k in src]
    if leftover:
        sys.exit(f"template placeholders left unfilled: {leftover}")
    if a.three:   # after the placeholder pass: the minified library must not be scanned for {{…}}
        lib = (assets / "lib" / "three-r158.min.js").read_text(encoding="utf-8")
        i = src.index("<script>")
        src = src[:i] + "<script>/* three.js r158 · MIT · see assets/lib/three-LICENSE.txt */\n" + lib + "\n</script>\n" + src[i:]
    a.out.write_text(src, encoding="utf-8")
    print(f"wrote {a.out}  {w}x{h}  {a.dur:g}s  shots: " + ", ".join(f"{n} {t0:g}-{t1:g}s" for n, (t0, t1) in zip(names, bounds)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
