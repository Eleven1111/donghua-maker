#!/usr/bin/env python3
"""Audio Director: VIDEO PLAN → SFX branch + BGM branch → one SAMPLES block → mix bus (engine) → loudness (export).

    python3 audio_director.py <film>.html --mood warm-business --key F            # plan only: writes <film>-audio/plan.json, brief.json, needs.json
    python3 audio_director.py <film>.html --mood warm-business --key F --run --check   # plan + both branches + import + headless acceptance
    python3 audio_director.py <film>.html --check                                     # acceptance only
        [--local ~/Sounds] [--per 6] [--replace groove|music|none] [--keep mb]

Reads the film in headless Chrome (DUR, BEAT, shots, the full score, and window.AUDIO_PLAN if the story defines one):
    const AUDIO_PLAN = { mood, key, sections: [{t0, t1, kind: intro|detail|reveal|outro}], hits: [s],
                         map: {'rustle': 'paper', 'thump': 'stamp', 'mb': null}, queries: {click: 'soft ui click'} };
Without AUDIO_PLAN, sections come from the shots (first shot intro, last shot reveal + a final-bar outro, the rest
detail) and every synthesised sfx kind in the score maps to a sound category (KIND2CAT; null keeps it synthesised).

Branches (each a separate script, runnable alone):
  BGM  music_render.py  brief.json → MIDI (planner, instruments, performance) → SoundFont WAV
  SFX  sfx_search.py    needs.json → local / Mixkit / Freesound candidates → ranking → sounds.json winners
Then sfx_import.py embeds bgm + winners, with SMP.map (synth cue kind → recorded id) and SMP.bgm, so the film's
own score code stays unchanged; categories with no licensed winner keep their synthesised sound.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
KIND2CAT = {"ui:click": "click", "ui:clickAlt": "clickAlt", "ui:pop": "pop", "ui:toggle": "toggle", "ui:typing": "typing", "ui:ding": "ding",
            "ui:success": "success", "ui:error": "error", "ui:resolve": "resolve", "ui:sweep": "sweep", "whoosh": "whoosh", "tick": "click",
            "clink": "click", "thump": "stamp", "bloom": "pop", "chip": "pop", "rustle": "paper"}
QUERY = {"click": "soft ui click", "clickAlt": "soft ui tap", "pop": "soft pop bubble", "toggle": "ui switch toggle", "typing": "keyboard typing short",
         "ding": "notification ding dong", "success": "success chime", "error": "error buzz", "whoosh": "short soft whoosh", "sweep": "transition riser",
         "resolve": "logo chime", "paper": "paper slide", "cut": "scissors snip", "trash": "trash can lid", "stamp": "stamp thud"}


def read_film(film: Path) -> dict:
    from playwright.sync_api import sync_playwright
    sys.path.insert(0, str(HERE))
    from export import launch
    with sync_playwright() as p:
        b = launch(p)
        pg = b.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(film.resolve().as_uri() + "?ui=0")
        pg.wait_for_function("window.__READY === true", timeout=120_000)
        info = pg.evaluate("""() => ({ dur: DUR, beat: typeof BEAT === 'number' ? BEAT : .5,
            shots: SHOTS.map(s => ({ name: s.name, t0: s.t0, t1: s.t1 })),
            score: window.__film.score().map(e => ({ t: e.t, k: e.k, kind: e.kind, role: e.role || (typeof roleOf === 'function' ? roleOf(e) : ''), src: e.src })),
            plan: typeof AUDIO_PLAN === 'object' ? AUDIO_PLAN : null, engineHasSMP: typeof SMP === 'object' })""")
        b.close()
    if errs:
        sys.exit(f"film threw on load: {errs[0]}")
    if not info["engineHasSMP"]:
        sys.exit("this film's engine predates recorded sounds (no SMP); re-scaffold and move the story over first")
    return info


def derive(info: dict, a) -> tuple:
    P = info["plan"] or {}
    dur, beat, shots = info["dur"], info["beat"], info["shots"]
    bar = 4 * beat
    if P.get("sections"):
        sections = P["sections"]
    else:
        last_bar = max(0, dur - bar)
        sections = []
        for i, s in enumerate(shots):
            kind = "intro" if i == 0 and len(shots) > 1 else "reveal" if i == len(shots) - 1 else "detail"
            sections.append({"t0": s["t0"], "t1": min(s["t1"], last_bar) if i == len(shots) - 1 else s["t1"], "kind": kind})
        sections.append({"t0": last_bar, "t1": dur, "kind": "outro"})
    brief = {"dur": dur, "bpm": round(60 / beat, 3), "mood": a.mood or P.get("mood", "warm-business"), "key": a.key or P.get("key", "C"),
             "seed": P.get("seed", 7), "sections": sections, "hits": P.get("hits", [])}
    kmap = {**KIND2CAT, **(P.get("map") or {})}
    uses = {}
    for e in info["score"]:
        if e["role"] == "music" or e["k"] in ("vo", "smp"):
            continue
        key = f"ui:{e['kind']}" if e["k"] == "ui" else e["k"]
        cat = kmap.get(key)
        if cat:
            uses.setdefault(cat, {"cat": cat, "query": (P.get("queries") or {}).get(cat, QUERY.get(cat, cat)), "times": [], "kinds": set()})
            uses[cat]["times"].append(round(e["t"], 3))
            uses[cat]["kinds"].add(key)
    needs = [{**u, "kinds": sorted(u["kinds"])} for u in uses.values()]
    return brief, needs


CHECK_JS = """async () => {
  await smpReady(); const exp = 44 + Math.round(DUR * 48000) * 4, rep = window.__film.audio();
  const dec = b => { const s = atob(b), n = (s.length - 44) / 4, L = new Float32Array(n); for (let i = 0; i < n; i++) { let v = s.charCodeAt(44 + i * 4) | (s.charCodeAt(45 + i * 4) << 8); if (v > 32767) v -= 65536; L[i] = v / 32768; } return { L, bytes: s.length }; };
  const rms = (L, a, b) => { let q = 0; const i0 = Math.round(a * 48000), i1 = Math.max(i0 + 1, Math.round(b * 48000)); for (let i = i0; i < i1; i++) q += L[i] * L[i]; return 10 * Math.log10(q / (i1 - i0) + 1e-12); };
  const full = dec(await window.__film.wav()), mus = dec(await window.__film.wav({ stem: 'music' })), raw = dec(await window.__film.wav({ stem: 'music', duck: false }));
  const w = rep.duck.slice().sort((a, b) => b.db - a.db)[0];
  const duck = w ? +(rms(mus.L, w.at, w.at + .1) - rms(raw.L, w.at, w.at + .1)).toFixed(2) : null;
  let pk = 0; for (let i = 0; i < full.L.length; i += 3) pk = Math.max(pk, Math.abs(full.L[i]));
  return { bytes: [full.bytes, mus.bytes], exp, roles: rep.roles, warnings: rep.warnings, deepestDuck: w ? { at: w.at, k: w.k, planned: w.db, measured: duck } : null,
           peakDb: +(20 * Math.log10(pk + 1e-9)).toFixed(1), recorded: Object.keys(SMP.lib), mapped: SMP.map || {}, offGrid: rep.cues.filter(c => Math.abs(c.offGrid16thFrames) > 2).map(c => c.k + '@' + c.landmark) };
}"""


def check(film: Path) -> bool:
    """Headless audio acceptance: wav lengths, report warnings, the deepest duck measured on the stems, peak."""
    from playwright.sync_api import sync_playwright
    sys.path.insert(0, str(HERE))
    from export import launch
    with sync_playwright() as p:
        b = launch(p)
        pg = b.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(film.resolve().as_uri() + "?ui=0")
        pg.wait_for_function("window.__READY === true", timeout=120_000)
        r = pg.evaluate(CHECK_JS)
        b.close()
    needs_duck = r["roles"].get("sfx", 0) > 0 and r["roles"].get("music", 0) > 0
    if needs_duck and r["deepestDuck"] is None:
        r["warnings"].append("sfx and music both present but no ducking windows (DUCK.on = false?)")
    ok = (not errs and r["bytes"][0] == r["exp"] and r["bytes"][1] == r["exp"] and not r["warnings"]
          and (r["deepestDuck"] is None or r["deepestDuck"]["measured"] < -1))
    print(json.dumps({"pass": ok, "errors": errs, **r}, ensure_ascii=False, indent=1))
    print("CHECK", "PASS" if ok else "FAIL", "(measured only — not auditioned)")
    return ok


def run(cmd: list) -> None:
    print("$", " ".join(str(c) for c in cmd), flush=True)
    subprocess.run([sys.executable, *map(str, cmd)], check=True)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("--mood")
    ap.add_argument("--key")
    ap.add_argument("--run", action="store_true")
    ap.add_argument("--local", action="append", default=[])
    ap.add_argument("--per", type=int, default=6)
    ap.add_argument("--replace", default="music", choices=["groove", "music", "none"], help="which synth music the rendered bed replaces")
    ap.add_argument("--keep", action="append", default=["mb"], help="music kinds kept on top of the bed (action notes)")
    ap.add_argument("--no-bgm", action="store_true")
    ap.add_argument("--check", action="store_true", help="after --run (or alone): headless audio acceptance of the film")
    a = ap.parse_args()
    film = a.film.resolve()
    if a.check and not a.run:
        return 0 if check(film) else 1
    work = film.with_name(film.stem + "-audio")
    work.mkdir(exist_ok=True)
    info = read_film(film)
    brief, needs = derive(info, a)
    (work / "brief.json").write_text(json.dumps(brief, ensure_ascii=False, indent=2))
    (work / "needs.json").write_text(json.dumps({"needs": needs}, ensure_ascii=False, indent=2))
    (work / "plan.json").write_text(json.dumps({"film": film.name, "dur": info["dur"], "bpm": brief["bpm"], "shots": info["shots"], "brief": brief, "needs": needs}, ensure_ascii=False, indent=2))
    print(f"plan: {len(needs)} sfx categories ({', '.join(n['cat'] + '×' + str(len(n['times'])) for n in needs)}); bgm {brief['mood']} in {brief['key']}, "
          f"sections {' → '.join(s['kind'] for s in brief['sections'])}")
    if not a.run:
        return 0
    sounds = work / "sounds.json"
    if not a.no_bgm:
        run([HERE / "music_render.py", work / "brief.json", "-o", work / "bgm"])
    cands = work / "cands"
    run([HERE / "sfx_search.py", "search", work / "needs.json", "-o", cands, "--per", a.per, *sum((["--local", d] for d in a.local), [])])
    sounds.write_text(json.dumps({"sounds": []}))
    run([HERE / "sfx_search.py", "rank", "-o", cands, "--sounds", sounds])
    spec = json.loads(sounds.read_text())
    winners = {s["cat"] for s in spec["sounds"]}
    spec["map"] = {k: n["cat"] for n in needs if n["cat"] in winners for k in n["kinds"]}
    if not a.no_bgm:
        spec["sounds"].append({"id": "bgm", "file": "bgm.wav", "role": "music", "cat": "music", "max": info["dur"], "trim": False,
                               "source": "bgm.mid rendered by music_render.py (own composition)", "author": "donghua-maker",
                               "license": "own composition; rendered with GeneralUser GS v2.0.3 (free for music creation, commercial OK)", "method": "midi-render"})
        spec["bgm"] = {"id": "bgm", "replace": a.replace, "keep": sorted(set(a.keep))}
    sounds.write_text(json.dumps(spec, ensure_ascii=False, indent=2))
    run([HERE / "sfx_import.py", sounds, "--film", film])
    missing = sorted({n["cat"] for n in needs} - winners)
    print(f"done: recorded {', '.join(sorted(winners)) or 'none'}; synth fallback {', '.join(missing) or 'none'}.")
    if a.check:
        return 0 if check(film) else 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
