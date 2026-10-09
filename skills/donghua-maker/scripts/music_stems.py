#!/usr/bin/env python3
"""Stem pipeline for music_render.py: one MIDI track per part → one engine per part → level-matched stems → effect chains → mix.

Used by `music_render.py` when the brief has a `voices` map (or `--stems`). Needs `mido`, `numpy` and `pedalboard`
(`pip install mido numpy pedalboard`); the engines are optional and chosen per part:

    "voices": {"pad":  {"engine": "surge", "patch": "Pads/Assymetry"},       # Surge XT VST3 loaded in pedalboard (3000+ patches)
               "bass": {"engine": "sfizz", "sfz": "bass-saw"},               # sfizz_render + a plain-text SFZ file
               "comp": {"engine": "sfizz", "sfz": "pluck"},
               "lead": {"engine": "surge", "patch": "Keys/Artificial 1"},
               "drums": {"engine": "gm"}}                                    # fluidsynth + SoundFont (General MIDI)

Engines: gm (fluidsynth + SOUNDFONT), surge (SURGE_VST3, SURGE_DATA), sfizz (SFIZZ_RENDER; `sfz` is a path or a name in assets/sfz/).
Surge parts are not reproducible byte for byte (the plugin starts oscillators and LFOs at random phases): keep the rendered
bgm.wav as the artifact. sfizz and gm parts are identical run to run.
Mix: every stem is brought to its target level measured on the sounding parts only (a gated RMS, so a part that plays in
four bars of twenty is not turned up by its silence), runs through its own pedalboard chain, and the sum goes through a
master compressor and a peak guard (-1.5 dBFS). The numbers are written to <stem>.mix.json.
"""
import json
import os
import re
import shutil
import struct
import subprocess
import sys
from pathlib import Path

SR = 48000
ASSETS = Path(__file__).resolve().parent.parent / "assets"
GM_CH = {"pad": 0, "comp": 1, "bass": 2, "lead": 3, "drums": 9}
# target level of the sounding part of each stem (dBFS RMS) and its effect chain: list of (effect, kwargs)
TARGET_DB = {"pad": -27, "comp": -24, "bass": -22, "lead": -21, "drums": -23}
CHAINS = {
    "pad": [("HighpassFilter", {"cutoff_frequency_hz": 160}), ("Chorus", {"rate_hz": .25, "depth": .25, "mix": .3}),
            ("Reverb", {"room_size": .75, "wet_level": .3, "dry_level": .8})],
    "comp": [("HighpassFilter", {"cutoff_frequency_hz": 200}), ("Compressor", {"threshold_db": -22, "ratio": 2.5}),
             ("Delay", {"delay_seconds": .3, "feedback": .22, "mix": .14}), ("Reverb", {"room_size": .45, "wet_level": .18, "dry_level": .85})],
    "bass": [("HighpassFilter", {"cutoff_frequency_hz": 38}), ("LowpassFilter", {"cutoff_frequency_hz": 2600}), ("Compressor", {"threshold_db": -20, "ratio": 4})],
    "lead": [("HighpassFilter", {"cutoff_frequency_hz": 250}), ("Compressor", {"threshold_db": -20, "ratio": 2}), ("Reverb", {"room_size": .55, "wet_level": .22, "dry_level": .85})],
    "drums": [("HighpassFilter", {"cutoff_frequency_hz": 45}), ("Compressor", {"threshold_db": -18, "ratio": 3}), ("Reverb", {"room_size": .2, "wet_level": .08, "dry_level": .95})],
}
MASTER_DB = -24.0   # sounding-part RMS (mono) of the whole mix, about -17 LUFS; sfx_import.py loudnorms the bed to -20 LUFS anyway
PEAK_MAX = 10 ** (-1.5 / 20)
PAN = {"pad": 0, "comp": -.25, "bass": 0, "lead": .15, "drums": 0}


# used for any part the brief's `voices` does not name; a Surge part falls back to its sfizz twin when Surge XT is not installed
DEFAULT_VOICES = {
    "pad": ({"engine": "surge", "patch": "Pads/Assymetry"}, {"engine": "sfizz", "sfz": "pad-soft"}),
    "comp": ({"engine": "sfizz", "sfz": "pluck"}, None),
    "bass": ({"engine": "sfizz", "sfz": "bass-saw"}, None),
    "lead": ({"engine": "surge", "patch": "Leads/Banter"}, {"engine": "sfizz", "sfz": "pluck"}),
    "drums": ({"engine": "gm"}, None),
}


def default_voice(part: str) -> dict:
    main, fallback = DEFAULT_VOICES[part]
    if main["engine"] == "surge" and fallback:
        try:
            surge_vst3()
            need("pedalboard", "pip install pedalboard")
        except SystemExit:
            return fallback
    return main


def need(mod: str, hint: str):
    try:
        return __import__(mod)
    except ImportError:
        sys.exit(f"{mod} is not installed: {hint}")


# ── MIDI (mido): a type-1 file with a conductor track and one track per part ──
def build_midi(perf: list, P: dict, programs: dict, ppq: int = 480):
    """perf = (part, t_s, len_s, pitch, vel). Returns {part: MidiFile (single part)} plus the combined MidiFile under key None."""
    mido = need("mido", "pip install mido")
    to_tick = lambda s: int(round(s / P["beat"] * ppq))

    def mk(parts):
        mf = mido.MidiFile(type=1, ticks_per_beat=ppq)
        cond = mido.MidiTrack()
        cond.append(mido.MetaMessage("set_tempo", tempo=int(60_000_000 / P["bpm"]), time=0))
        cond.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
        mf.tracks.append(cond)
        for part in parts:
            ch = GM_CH[part]
            ev = []
            for p_, t, ln, pitch, vel in perf:
                if p_ == part:
                    ev.append((to_tick(t), 1, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
                    ev.append((to_tick(t + ln), 0, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))
            tr = mido.MidiTrack()
            tr.append(mido.MetaMessage("track_name", name=part, time=0))
            if programs.get(part) is not None:
                tr.append(mido.Message("program_change", channel=ch, program=programs[part], time=0))
            last = 0
            for tick, _, m in sorted(ev, key=lambda e: (e[0], e[1])):   # note_off before note_on at the same tick
                tr.append(m.copy(time=tick - last))
                last = tick
            mf.tracks.append(tr)
        return mf

    parts = [p for p in GM_CH if any(n[0] == p for n in perf)]
    out = {p: mk([p]) for p in parts}
    out[None] = mk(parts)
    return out


# ── engines: each returns a float32 array (2, n) at SR ──
def _read_wav(path: Path):
    np, sf = need("numpy", "pip install numpy"), need("soundfile", "pip install soundfile")
    a, sr = sf.read(str(path), dtype="float32", always_2d=True)
    if sr != SR:
        sys.exit(f"{path} is {sr} Hz, expected {SR}")
    return a.T.copy()


def render_gm(mid: Path, tmp: Path, sf2: Path):
    if not shutil.which("fluidsynth"):
        sys.exit("fluidsynth not found (brew install fluid-synth)")
    raw = tmp / (mid.stem + ".gm.wav")
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-r", str(SR), "-R", "0", "-C", "0", "-F", str(raw), str(sf2), str(mid)], check=True)
    return _read_wav(raw)


def sfizz_bin() -> str:
    b = os.environ.get("SFIZZ_RENDER") or shutil.which("sfizz_render") or shutil.which("sfizz-render") or str(Path.home() / ".local/bin/sfizz_render")
    if not Path(b).is_file():
        sys.exit("sfizz_render not found: build it from github.com/sfztools/sfizz (-DSFIZZ_RENDER=ON) and put it on PATH or set SFIZZ_RENDER=<path>")
    return b


def resolve_sfz(name: str) -> Path:
    for c in (Path(name).expanduser(), ASSETS / "sfz" / name, ASSETS / "sfz" / (name + ".sfz")):
        if c.is_file():
            return c
    sys.exit(f"SFZ not found: {name} (a path, or a file in assets/sfz/: {', '.join(sorted(p.stem for p in (ASSETS / 'sfz').glob('*.sfz')))})")


def render_sfizz(mid: Path, tmp: Path, sfz: str):
    out = tmp / (mid.stem + ".sfizz.wav")
    subprocess.run([sfizz_bin(), "--sfz", str(resolve_sfz(sfz)), "--midi", str(mid), "--wav", str(out), "-s", str(SR), "--use-eot"],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return _read_wav(out)


# Surge XT: patches are .fxp files; pedalboard can't load them directly, so the patch chunk is written into the plugin's state
_B64 = ".ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+"   # JUCE's MemoryBlock base64: LSB first, size prefix


def _juce_b64(b: bytes) -> str:
    out, val, pos = [], 0, 0
    for by in b:
        val |= by << pos
        pos += 8
        while pos >= 6:
            out.append(_B64[val & 63])
            val >>= 6
            pos -= 6
    if pos:
        out.append(_B64[val & 63])
    return f"{len(b)}." + "".join(out)


def surge_vst3() -> Path:
    cands = [os.environ.get("SURGE_VST3", ""), "~/Library/Audio/Plug-Ins/VST3/Surge XT.vst3", "/Library/Audio/Plug-Ins/VST3/Surge XT.vst3",
             "~/.vst3/Surge XT.vst3", "/usr/lib/vst3/Surge XT.vst3", "C:/Program Files/Common Files/VST3/Surge XT.vst3"]
    for c in cands:
        if c and Path(c).expanduser().exists():
            return Path(c).expanduser()
    sys.exit("Surge XT VST3 not found: install Surge XT (surge-synthesizer.github.io) or set SURGE_VST3=<path to Surge XT.vst3>")


def surge_patch(name: str) -> Path:
    """name = 'Pads/Assymetry' (relative to a patches folder, .fxp optional), a path, or a unique substring of a patch name."""
    roots = [Path(os.environ["SURGE_DATA"]).expanduser()] if os.environ.get("SURGE_DATA") else []
    roots += [Path(p).expanduser() for p in ("~/Library/Application Support/Surge XT", "/Library/Application Support/Surge XT", "~/.local/share/surge-xt", "/usr/share/surge-xt")]
    p = Path(name).expanduser()
    if p.is_file():
        return p
    allp = []
    for r in roots:
        for sub in ("patches_factory", "patches_3rdparty"):
            allp += sorted((r / sub).rglob("*.fxp"))
    if not allp:
        sys.exit("no Surge XT patches found: set SURGE_DATA=<folder holding patches_factory/>")
    want = name[:-4] if name.lower().endswith(".fxp") else name
    rel = lambda f: "/".join(f.with_suffix("").parts[-2:])
    exact = [f for f in allp if rel(f).lower() == want.lower()] or [f for f in allp if f.stem.lower() == want.lower()]
    sub = exact or [f for f in allp if want.lower() in rel(f).lower()]
    if not sub:
        sys.exit(f"no Surge patch matches {name!r} ({len(allp)} patches; e.g. {rel(allp[0])})")
    return sub[0]


def surge_plugin(patch: str):
    pb = need("pedalboard", "pip install pedalboard")
    plug = pb.load_plugin(str(surge_vst3()))
    b = surge_patch(patch).read_bytes()
    if b[:4] != b"CcnK" or b[8:12] != b"FPCh":
        sys.exit(f"{patch}: not a Surge .fxp chunk file")
    chunk = b[60:60 + struct.unpack(">I", b[56:60])[0]]
    rs = bytes(plug.raw_state)
    x = rs[rs.index(b"<?xml"):].decode("latin1")
    new = re.sub(r"(<IComponent>).*?(</IComponent>)", lambda m: m.group(1) + _juce_b64(chunk) + m.group(2), x, flags=re.S).encode("latin1")
    plug.raw_state = rs[:4] + struct.pack("<I", len(new)) + new
    return plug


def render_surge(mid: Path, dur: float, patch: str):
    mido, np = need("mido", "pip install mido"), need("numpy", "pip install numpy")
    plug = surge_plugin(patch)
    msgs, t = [], 0.0
    for m in mido.MidiFile(str(mid)):   # iterating a MidiFile yields delta seconds
        t += m.time
        if m.type in ("note_on", "note_off"):
            msgs.append(mido.Message(m.type, note=m.note, velocity=m.velocity, time=t))
    plug([mido.Message("note_on", note=60, velocity=1, time=0), mido.Message("note_off", note=60, velocity=0, time=.01)], duration=.1, sample_rate=SR)   # Surge applies a new state on the first block: it is silent
    plug.reset()
    # a patch's release tail can outlive the last note: render dur + 3 s and let the mix trim it
    return np.asarray(plug(msgs, duration=dur + 3, sample_rate=SR, num_channels=2, reset=False), dtype="float32")


# ── level + effects + sum ──
def active_rms_db(a, gate_db: float = -50.0, win: int = 2400) -> float:
    """RMS (dBFS) over the windows that sound: windows more than |gate_db| below the stem's loudest window are ignored."""
    np = need("numpy", "pip install numpy")
    mono = a.mean(axis=0)
    n = len(mono) // win
    if n == 0:
        return -120.0
    e = (mono[:n * win].reshape(n, win) ** 2).mean(axis=1)
    if e.max() <= 1e-12:
        return -120.0
    keep = e > e.max() * 10 ** (gate_db / 10)
    return float(10 * np.log10(e[keep].mean()))


def apply_chain(a, part: str):
    pb = need("pedalboard", "pip install pedalboard")
    return pb.Pedalboard([getattr(pb, n)(**kw) for n, kw in CHAINS[part]])(a, SR)


def mix(stems: dict, dur: float, out_wav: Path) -> dict:
    np, sf, pb = need("numpy", "pip install numpy"), need("soundfile", "pip install soundfile"), need("pedalboard", "pip install pedalboard")
    n = int(dur * SR)
    total, report = np.zeros((2, n), dtype="float32"), {}
    for part, a in stems.items():
        a = a[:, :n] if a.shape[1] >= n else np.pad(a, ((0, 0), (0, n - a.shape[1])))
        before = active_rms_db(a)
        gain = TARGET_DB[part] - before if before > -100 else 0.0
        a = a * 10 ** (gain / 20)
        leveled = active_rms_db(a)
        a = apply_chain(a, part)
        pan = PAN[part]
        a = a * np.array([[np.sqrt(.5 * (1 - pan))], [np.sqrt(.5 * (1 + pan))]], dtype="float32")   # equal-power pan
        report[part] = {"before_db": round(before, 2), "gain_db": round(gain, 2), "leveled_db": round(leveled, 2), "after_chain_db": round(active_rms_db(a), 2)}
        total += a
    fade = int(.8 * SR)
    total[:, n - fade:] *= np.linspace(1, 0, fade, dtype="float32")
    mg = MASTER_DB - active_rms_db(total)
    total = pb.Pedalboard([pb.Gain(mg), pb.Compressor(threshold_db=-16, ratio=6, attack_ms=2, release_ms=90)])(total, SR)
    peak = float(np.abs(total).max())
    if peak > PEAK_MAX:   # pedalboard.Limiter turned out to raise a quiet mix (its output sat 5 dB above the input), so the master uses a compressor and this plain peak guard
        total = total * (PEAK_MAX / peak)
    sf.write(str(out_wav), total.T, SR, subtype="PCM_16")
    report["_master"] = {"gain_db": round(mg, 2), "peak": round(float(np.abs(total).max()), 4), "active_rms_db": round(active_rms_db(total), 2)}
    return report


def render_stems(perf: list, P: dict, voices: dict, out: Path, sf2: Path | None, gm_programs: dict) -> dict:
    """Write <out>.mid (all parts) + <out>.<part>.mid, render each part with its engine, mix to <out>.wav. Returns the mix report."""
    midis = build_midi(perf, P, gm_programs)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.parent / (out.name + ".stems")
    tmp.mkdir(exist_ok=True)
    midis[None].save(str(out.with_suffix(".mid")))
    stems, used = {}, {}
    for part, mf in midis.items():
        if part is None:
            continue
        mid = tmp / f"{part}.mid"
        mf.save(str(mid))
        v = voices.get(part) or default_voice(part)
        eng = v.get("engine", "gm")
        used[part] = v
        if eng == "gm":
            if sf2 is None or not sf2.is_file():
                sys.exit(f"{part}: engine gm needs a SoundFont (SOUNDFONT=<.sf2>)")
            a = render_gm(mid, tmp, sf2)
        elif eng == "sfizz":
            a = render_sfizz(mid, tmp, v["sfz"])
        elif eng == "surge":
            a = render_surge(mid, P["dur"], v["patch"])
        else:
            sys.exit(f"{part}: unknown engine {eng!r} (gm, sfizz, surge)")
        shutil.copyfile(mid, out.parent / f"{out.name}.{part}.mid")
        stems[part] = a
    report = mix(stems, P["dur"], out.with_suffix(".wav"))
    report["_voices"] = used   # what was really used (defaults and fallbacks resolved); the licence record reads it
    shutil.rmtree(tmp, ignore_errors=True)
    out.with_suffix(".mix.json").write_text(json.dumps(report, indent=2))
    return report
