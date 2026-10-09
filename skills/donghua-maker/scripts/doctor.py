#!/usr/bin/env python3
"""Is this machine ready to make donghua films? Checks every dependency, says what each one unlocks, and prints the
exact install command for this OS. Keys are reported as present/absent and where from — never their values.

  python3 doctor.py            # local checks (fast, offline)
  python3 doctor.py --online   # also synthesise one real edge-tts word and reach the font source
Exit 0 = the core (make and check films) works; optional features are listed as ready or not.
Guide for each item: references/setup.md."""
import argparse
import asyncio
import importlib.util
import platform
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import donghua_env  # noqa: E402

OS = {"Darwin": "mac", "Linux": "linux", "Windows": "win"}.get(platform.system(), "linux")
PIP = f"{Path(sys.executable).name} -m pip install"
FIX = {  # item → {os: command}
    "ffmpeg": {"mac": "brew install ffmpeg", "linux": "sudo apt install -y ffmpeg", "win": "winget install Gyan.FFmpeg"},
    "playwright": {"*": f"{PIP} playwright && {Path(sys.executable).name} -m playwright install chromium"},
    "chromium": {"*": f"{Path(sys.executable).name} -m playwright install chromium   (or install Google Chrome)"},
    "edge-tts": {"*": f"{PIP} edge-tts"},
    "fonttools": {"*": f"{PIP} fonttools"},
    "numpy": {"*": f"{PIP} numpy"},
    "fluidsynth": {"mac": "brew install fluid-synth", "linux": "sudo apt install -y fluidsynth", "win": "winget install FluidSynth.FluidSynth"},
    "soundfont": {"*": "download GeneralUser GS (free) from https://schristiancollins.com/generaluser.php, "
                       "save the .sf2 as ~/.local/share/soundfonts/GeneralUser-GS.sf2 or set SOUNDFONT=<path> in ~/.config/donghua/.env"},
    "mido": {"*": f"{PIP} mido soundfile"},
    "pedalboard": {"*": f"{PIP} pedalboard   (GPL-3.0)"},
    "sfizz_render": {"*": "build github.com/sfztools/sfizz with -DSFIZZ_RENDER=ON, put sfizz_render on PATH or set SFIZZ_RENDER=<path> (references/audio.md, Stems)"},
    "surge": {"*": "install Surge XT (surge-synthesizer.github.io) or set SURGE_VST3=<path to Surge XT.vst3>"},
    "node": {"mac": "brew install node", "linux": "sudo apt install -y nodejs", "win": "winget install OpenJS.NodeJS"},
}
rows: list[tuple[str, str, bool, str]] = []   # (group, item, ok, detail)


def fix(item: str) -> str:
    f = FIX.get(item, {})
    return f.get(OS) or f.get("*", "")


def add(group: str, item: str, ok: bool, detail: str = "") -> None:
    rows.append((group, item, ok, detail if ok else (detail + ("  → " if detail else "→ ") + fix(item)).strip()))


def has_mod(name: str) -> bool:
    return importlib.util.find_spec(name) is not None


def chromium_ok() -> tuple[bool, str]:
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            for kw in ({"channel": "chrome"}, {}):
                try:
                    p.chromium.launch(headless=True, **kw).close()
                    return True, "Chrome" if kw else "Playwright Chromium"
                except Exception:
                    continue
    except Exception as e:
        return False, str(e)[:80]
    return False, "no browser Playwright can launch"


def core() -> None:
    add("核心 core", "python", sys.version_info >= (3, 10), platform.python_version() + ("" if sys.version_info >= (3, 10) else " (need 3.10+)"))
    add("核心 core", "ffmpeg", bool(shutil.which("ffmpeg")), "stills sheets, audio, MP4 export")
    add("核心 core", "playwright", has_mod("playwright"), "stills, audio check, export")
    if has_mod("playwright"):
        ok, how = chromium_ok()
        add("核心 core", "chromium", ok, how)


def narration(online: bool) -> None:
    add("解说 narration", "edge-tts", has_mod("edge_tts"), "free Chinese narration + word timing (narrate.py), needs network")
    if online and has_mod("edge_tts"):
        import edge_tts

        async def one() -> int:
            out = bytearray()
            async for ch in edge_tts.Communicate("你好", "zh-CN-XiaoxiaoNeural").stream():
                if ch["type"] == "audio":
                    out += ch["data"]
            return len(out)
        try:
            n = asyncio.run(asyncio.wait_for(one(), 30))
            add("解说 narration", "edge-tts online", n > 1000, f"synthesised {n} bytes")
        except Exception as e:
            rows.append(("解说 narration", "edge-tts online", False, f"{type(e).__name__}: {str(e)[:80]} → check network/proxy"))
    src = donghua_env.where("MINIMAX_API_KEY")
    rows.append(("解说 narration", "MINIMAX_API_KEY (optional, paid)", bool(src),
                 f"from {src}" if src else f"not set — only needed for MiniMax voices; put it in {donghua_env.USER_ENV}"))


def fonts(online: bool) -> None:
    add("字体 fonts", "fonttools", has_mod("fontTools"), "subset + embed OFL fonts (font_embed.py)")
    cache = Path.home() / ".cache" / "donghua-fonts"
    local = donghua_env.get("DONGHUA_FONT_DIR")
    have = sorted(p.name for d in [cache] + ([Path(local).expanduser()] if local else []) if d.is_dir() for p in d.glob("*.ttf"))
    rows.append(("字体 fonts", "font files", True, f"cached: {', '.join(have)}" if have else "none yet — downloaded on first use"))
    if online and not have:
        url = donghua_env.get("DONGHUA_FONT_MIRROR", "") + "https://github.com/lxgw/LxgwWenKai"
        try:
            urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=15)
            rows.append(("字体 fonts", "font source reachable", True, url))
        except Exception as e:
            rows.append(("字体 fonts", "font source reachable", False,
                         f"{str(e)[:60]} → set DONGHUA_FONT_MIRROR, or put the .ttf files in DONGHUA_FONT_DIR (references/setup.md)"))


def music() -> None:
    add("音乐与音效 music/sfx", "fluidsynth", bool(shutil.which("fluidsynth")), "renders the generated background music")
    sf = Path(donghua_env.get("SOUNDFONT", str(Path.home() / ".local/share/soundfonts/GeneralUser-GS.sf2"))).expanduser()
    add("音乐与音效 music/sfx", "soundfont", sf.is_file(), str(sf))
    add("音乐与音效 music/sfx", "numpy", has_mod("numpy"), "ranks found sound effects (sfx_search.py)")
    g = "音乐与音效 music/sfx"
    add(g, "mido", has_mod("mido") and has_mod("soundfile"), "optional · stem music: one MIDI track per part (music_stems.py)")
    add(g, "pedalboard", has_mod("pedalboard"), "optional · stem music: effect chains + Surge XT host")
    add(g, "sfizz_render", bool(donghua_env.get("SFIZZ_RENDER") or shutil.which("sfizz_render")), "optional · stem music: SFZ instruments")
    try:
        import music_stems
        music_stems.surge_vst3()
        surge = True
    except (SystemExit, ImportError):
        surge = False
    add(g, "surge", surge, "optional · stem music: Surge XT VST3, 3000+ synth patches")
    src = donghua_env.where("FREESOUND_API_KEY")
    rows.append(("音乐与音效 music/sfx", "FREESOUND_API_KEY (optional)", bool(src),
                 f"from {src}" if src else "not set — Mixkit and local libraries still work"))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--online", action="store_true", help="also test edge-tts and the font source over the network")
    a = ap.parse_args()
    core()
    narration(a.online)
    fonts(a.online)
    music()
    add("开发 dev (optional)", "node", bool(shutil.which("node")), "only for tools/validate.py")
    group = None
    for g, item, ok, detail in rows:
        if g != group:
            print(f"\n{g}")
            group = g
        print(f"  {'✓' if ok else '✗'} {item:34} {detail}")
    core_ok = all(ok for g, _, ok, _ in rows if g.startswith("核心"))
    print(f"\nkeys & settings are read from: environment → ./.env → {donghua_env.USER_ENV} → ~/.config/secrets/.env")
    print("DOCTOR PASS (core ready; ✗ above are optional features)" if core_ok else "DOCTOR FAIL (core missing — run the → commands above)")
    return 0 if core_ok else 1


if __name__ == "__main__":
    sys.exit(main())
