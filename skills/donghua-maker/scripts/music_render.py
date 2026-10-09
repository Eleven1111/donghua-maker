#!/usr/bin/env python3
"""BGM branch: music brief → plan → MIDI → instruments → performance → SoundFont render (48 kHz WAV).

    python3 music_render.py brief.json -o <film>-audio/bgm        # writes bgm.mid, bgm.wav, bgm.plan.json

brief.json (audio_director.py writes one from the film):
    {"dur": 9, "bpm": 120, "mood": "warm-business", "key": "F", "seed": 7,
     "sections": [{"t0": 0, "t1": 3, "kind": "intro"}, {"t0": 3, "t1": 6, "kind": "detail"},
                  {"t0": 6, "t1": 8, "kind": "reveal"}, {"t0": 8, "t1": 9, "kind": "outro"}],
     "hits": [6.0]}                      # optional accents (reveal moments) that get a crash + lead note

Planner: the mood gives a progression, instruments and patterns; section kinds set density:
  intro = pad + sparse comp, no drums · detail = pad, half comp, bass, soft hats · reveal = everything + lead
  outro = the final bar resolves to the tonic, drums stop, the lead lands on the root.
Performance: metric + phrase velocity, articulation per part, round-robin (alternating velocity layers and
hat/snare variants on repeated hits), humanised timing/velocity (seeded, deterministic).
Render: fluidsynth + SoundFont (env SOUNDFONT, default ~/.local/share/soundfonts/GeneralUser-GS.sf2),
trimmed to `dur` with a short fade. Import the WAV with sfx_import.py as role music.
"""
import argparse
import json
import math
import os
import random
import shutil
import struct
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

PPQ = 480
SF_DEFAULT = Path.home() / ".local/share/soundfonts/GeneralUser-GS.sf2"
KEYS = {"C": 60, "C#": 61, "Db": 61, "D": 62, "Eb": 63, "E": 64, "F": 65, "F#": 66, "G": 67, "Ab": 68, "A": 69, "Bb": 70, "B": 71}
MAJOR = [0, 2, 4, 5, 7, 9, 11]
# degree chords in a major key (scale-degree roots, 0-based) with 7ths/9ths via extra scale steps
PROG = {"bright-tech": [0, 5, 3, 4], "warm-business": [0, 5, 3, 4], "cute": [0, 5, 3, 4], "thoughtful": [5, 3, 0, 4], "chinese": [0, 5, 1, 4], "calm-tech": [3, 4, 5, 0]}
# GM programs per part (bank 0; drums on channel 10, kit program in `kit`: 0 standard, 40 brush, 8 room)
MOODS = {
    "bright-tech":   {"pad": 89, "comp": 4, "bass": 38, "lead": 11, "kit": 0, "comp_style": "arp", "swing": 0},
    "warm-business": {"pad": 48, "comp": 0, "bass": 33, "lead": 11, "kit": 40, "comp_style": "arp", "swing": 0},
    "cute":          {"pad": 52, "comp": 24, "bass": 32, "lead": 12, "kit": 0, "comp_style": "strum", "swing": .12},
    "thoughtful":    {"pad": 49, "comp": 0, "bass": 32, "lead": 71, "kit": None, "comp_style": "arp", "swing": 0},
    "chinese":       {"pad": 49, "comp": 107, "bass": 32, "lead": 73, "kit": None, "comp_style": "arp", "swing": 0},
    "calm-tech":     {"pad": 91, "comp": 5, "bass": 38, "lead": 98, "kit": 0, "comp_style": "arp", "swing": 0},
}
DENSITY = {"intro": {"pad": 1, "comp": .5, "bass": 0, "drums": 0, "lead": 0},
           "detail": {"pad": 1, "comp": .6, "bass": 1, "drums": .4, "lead": 0},
           "reveal": {"pad": 1, "comp": 1, "bass": 1, "drums": 1, "lead": 1},
           "outro": {"pad": 1, "comp": 0, "bass": 1, "drums": 0, "lead": 1}}
CH = {"pad": 0, "comp": 1, "bass": 2, "lead": 3, "drums": 9}
MIX = {"pad": (58, 64, 50), "comp": (92, 44, 30), "bass": (100, 64, 10), "lead": (88, 80, 40), "drums": (96, 64, 20)}  # CC7 vol, CC10 pan, CC91 reverb


# ── planner ────────────────────────────────────────────────────────────────
def chord_tones(key_root: int, degree: int) -> list:
    """Root-position 7th chord (+9th) from scale degree, as MIDI notes around the key."""
    steps = [degree, degree + 2, degree + 4, degree + 6, degree + 8]
    return [key_root + MAJOR[s % 7] + 12 * (s // 7) for s in steps]


def section_at(sections, t):
    for s in sections:
        if s["t0"] <= t < s["t1"]:
            return s["kind"]
    return sections[-1]["kind"] if t >= sections[-1]["t0"] else sections[0]["kind"]


def plan(brief: dict) -> dict:
    mood = brief.get("mood", "warm-business")
    if mood not in MOODS:
        sys.exit(f"unknown mood {mood!r}; one of {', '.join(MOODS)}")
    bpm, dur = float(brief["bpm"]), float(brief["dur"])
    beat = 60 / bpm
    bars = max(1, math.ceil(dur / (4 * beat) - 1e-6))
    key = KEYS[brief.get("key", "C")]
    prog = PROG[mood]
    secs = brief.get("sections") or [{"t0": 0, "t1": dur, "kind": "reveal"}]
    per_bar = []
    for b in range(bars):
        t = b * 4 * beat
        deg = 0 if b == bars - 1 else prog[b % len(prog)]
        per_bar.append({"bar": b, "t": round(t, 4), "degree": deg, "kind": "outro" if b == bars - 1 else section_at(secs, t + 1e-3)})
    return {"mood": mood, "bpm": bpm, "beat": beat, "dur": dur, "key": key, "bars": per_bar, "inst": MOODS[mood], "hits": brief.get("hits", []), "seed": brief.get("seed", 7)}


# ── MIDI generation (notes in beats) ───────────────────────────────────────
def compose(P: dict) -> list:
    R = random.Random(P["seed"])
    notes = []  # (part, start_beat, len_beats, pitch, base_velocity, articulation)
    inst, key = P["inst"], P["key"]
    motif = [0, 2, 4, 2, 5, 4, 2, 1]  # chord-tone/scale steps for the lead, varied per phrase
    for bar in P["bars"]:
        b0, dens, deg = bar["bar"] * 4, DENSITY[bar["kind"]], bar["degree"]
        ch = chord_tones(key - 12, deg)
        last = bar["kind"] == "outro"
        if dens["pad"]:
            for p in ch[1:4]:
                notes.append(("pad", b0, 4, p, 58 if not last else 50, "legato"))
        if dens["comp"] and inst["comp"] is not None:
            if inst["comp_style"] == "arp":
                hits = [0, 1, 3, 4, 6, 7] if bar["bar"] % 2 else [0, 2, 3, 5, 6]
                order = [0, 2, 1, 3, 2, 0, 3, 1]
                for s in hits:
                    if dens["comp"] < 1 and s % 2:
                        continue
                    notes.append(("comp", b0 + s * .5, .5, ch[1 + order[s] % 4] + 12, 70, "staccato" if s % 2 else "normal"))
            else:  # strum: beat 1, 2&, 4 with a down-up feel
                for s, v in [(0, 76), (3, 64), (6, 70)]:
                    for i, p in enumerate(ch[1:4]):
                        notes.append(("comp", b0 + s * .5 + i * .02, 1.2, p + 12, v - i * 4, "normal"))
        if dens["bass"]:
            root = ch[0] - 12
            for off, p, ln in [(0, root, 1.4), (1.5, root, .9), (3, root + 12, .8)]:
                notes.append(("bass", b0 + off, ln, p, 88, "normal"))
            if not last and bar["bar"] + 1 < len(P["bars"]):  # approach tone into the next chord
                nxt = chord_tones(key - 12, P["bars"][bar["bar"] + 1]["degree"])[0] - 12
                notes.append(("bass", b0 + 3.5, .45, nxt - 1 if nxt > root else nxt + 2, 70, "staccato"))
        if last:
            notes.append(("bass", b0, 4, ch[0] - 12, 80, "legato"))
            for i, p in enumerate(ch[1:4]):
                notes.append(("pad", b0 + i * .25, 3.8, p + 12, 52, "legato"))
        if dens["drums"] and inst["kit"] is not None:
            full = dens["drums"] >= 1
            for beat in range(4):
                t = b0 + beat
                if beat in (0, 2) or (full and beat == 3 and bar["bar"] % 2):
                    notes.append(("drums", t + (.5 if beat == 3 else 0), .25, 36, 96, "hit"))
                if beat in (1, 3):
                    notes.append(("drums", t, .25, 38 if full else 37, 80 if full else 62, "hit"))
                for h in (0, .5):
                    notes.append(("drums", t + h, .2, 42, 70 if h == 0 else 52, "hit"))
        if dens["lead"]:
            phrase = bar["bar"] % 2
            steps = motif if phrase == 0 else [motif[i] + (1 if i % 3 == 0 else 0) for i in range(8)]
            rhythm = [(0, 1), (1, .5), (1.5, .5), (2, 1.5)] if phrase == 0 else [(0, .5), (.5, .5), (1, 1), (2, 2)]
            if last:
                rhythm, steps = [(0, 4)], [0]
            for i, (o, ln) in enumerate(rhythm):
                s = steps[i % len(steps)] + deg
                p = key + MAJOR[s % 7] + 12 * (s // 7)
                notes.append(("lead", b0 + o, ln, p, 84 if o == 0 else 74, "legato" if ln >= 1 else "normal"))
    for h in P["hits"]:
        hb = h / P["beat"]
        if P["inst"]["kit"] is not None:
            notes.append(("drums", hb, 1, 49, 100, "hit"))
    return notes


# ── performance engine ─────────────────────────────────────────────────────
ART = {"legato": .98, "normal": .82, "staccato": .45, "hit": 1}


def perform(notes: list, P: dict) -> list:
    """velocity (metric accent + phrase arch), articulation, round-robin, humanize → (part, t_s, len_s, pitch, vel)."""
    R = random.Random(P["seed"] * 7919)
    beat, swing = P["beat"], P["inst"]["swing"]
    last_hit = {}
    out = []
    total_beats = len(P["bars"]) * 4
    for part, sb, lb, pitch, v, art in sorted(notes, key=lambda n: (n[1], n[0], n[3])):
        pos = sb % 4
        v += 10 if abs(pos) < 1e-6 else 5 if abs(pos - 2) < 1e-6 else -6 if (pos * 2) % 2 else 0          # metric accent
        v += int(8 * math.sin(math.pi * ((sb % 16) / 16)))                                                    # 4-bar phrase arch
        if part == "drums":  # round-robin: repeated hits alternate velocity layers; every 4th closed hat → pedal hat
            n = last_hit.get(pitch, 0)
            last_hit[pitch] = n + 1
            v += (-7, 3, -3, 5)[n % 4]
            if pitch == 42 and n % 4 == 3:
                pitch = 44
        if swing and (sb * 2) % 2 and part != "bass":
            sb += swing
        jitter = {"drums": .004, "bass": .006}.get(part, .009)
        t = max(0, sb * beat + (R.gauss(0, jitter) if sb > 0 else 0))
        vel = max(20, min(127, int(v + R.gauss(0, 5))))
        ln = max(.05, lb * beat * ART[art] + R.gauss(0, .01))
        if sb < total_beats + 1:
            out.append((part, t, ln, pitch, vel))
    return out


# ── SMF writer (format 1) ──────────────────────────────────────────────────
def vlq(n: int) -> bytes:
    b = [n & 0x7F]
    while n > 127:
        n >>= 7
        b.insert(0, (n & 0x7F) | 0x80)
    return bytes(b)


def track(events: list) -> bytes:
    data, last = b"", 0
    for tick, msg in sorted(events, key=lambda e: (e[0], e[1][0] & 0xF0 == 0x90)):
        data += vlq(tick - last) + msg
        last = tick
    data += b"\x00\xff\x2f\x00"
    return b"MTrk" + struct.pack(">I", len(data)) + data


def write_midi(perf: list, P: dict, path: Path) -> None:
    sec2tick = lambda s: int(round(s / P["beat"] * PPQ))
    tempo = int(60_000_000 / P["bpm"])
    tracks = [track([(0, b"\xff\x51\x03" + tempo.to_bytes(3, "big")), (0, b"\xff\x58\x04\x04\x02\x18\x08")])]
    for part, ch in CH.items():
        prog = P["inst"]["kit" if part == "drums" else part]
        if prog is None:
            continue
        vol, pan, rev = MIX[part]
        ev = [(0, bytes([0xC0 | ch, prog])), (0, bytes([0xB0 | ch, 7, vol])), (0, bytes([0xB0 | ch, 10, pan])), (0, bytes([0xB0 | ch, 91, rev])), (0, bytes([0xB0 | ch, 93, 0]))]
        for p_, t, ln, pitch, vel in perf:
            if p_ != part:
                continue
            ev.append((sec2tick(t), bytes([0x90 | ch, pitch, vel])))
            ev.append((sec2tick(t + ln), bytes([0x80 | ch, pitch, 0])))
        tracks.append(track(ev))
    path.write_bytes(b"MThd" + struct.pack(">IHHH", 6, 1, len(tracks), PPQ) + b"".join(tracks))


def render(mid: Path, wav: Path, dur: float, sf2: Path) -> None:
    if not shutil.which("fluidsynth"):
        sys.exit("fluidsynth not found (brew install fluid-synth)")
    raw = wav.with_suffix(".raw.wav")
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-r", "48000", "-R", "1", "-C", "0", "-F", str(raw), str(sf2), str(mid)], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", f"atrim=0:{dur},afade=t=out:st={max(0, dur - .8):.3f}:d=0.8",
                    "-ar", "48000", "-ac", "2", str(wav)], check=True)
    raw.unlink()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("brief", type=Path)
    ap.add_argument("-o", "--out", type=Path, required=True, help="output stem, e.g. film-audio/bgm")
    ap.add_argument("--stems", action="store_true", help="stem pipeline (mido MIDI per part, per-part engine, levels + effect chains) even without a `voices` map in the brief")
    a = ap.parse_args()
    sf2 = Path(os.environ.get("SOUNDFONT", SF_DEFAULT)).expanduser()
    brief = json.loads(a.brief.read_text())
    stems = a.stems or bool(brief.get("voices"))
    if not sf2.is_file() and not stems:
        sys.exit(f"SoundFont not found: {sf2} (see references/audio.md §7)")
    P = plan(brief)
    perf = perform(compose(P), P)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    if stems:
        import music_stems
        progs = {k: P["inst"][k] for k in ("pad", "comp", "bass", "lead")}
        progs["drums"] = P["inst"]["kit"]
        rep = music_stems.render_stems(perf, P, brief.get("voices", {}), a.out, sf2, progs)
        parts = sorted({p for p, *_ in perf})
        a.out.with_suffix(".plan.json").write_text(json.dumps({"brief": brief, "bars": P["bars"], "instruments": P["inst"], "notes": len(perf), "parts": parts, "voices": brief.get("voices", {}), "mix": rep}, indent=2))
        print(f"ok  {len(perf)} notes · stems {', '.join(parts)} · {len(P['bars'])} bars @ {P['bpm']:g} bpm · master peak {rep['_master']['peak']} → {a.out.with_suffix('.wav')}")
        return 0
    mid, wav = a.out.with_suffix(".mid"), a.out.with_suffix(".wav")
    write_midi(perf, P, mid)
    render(mid, wav, P["dur"], sf2)
    parts = sorted({p for p, *_ in perf})
    a.out.with_suffix(".plan.json").write_text(json.dumps({"brief": brief, "bars": P["bars"], "instruments": P["inst"], "notes": len(perf), "parts": parts, "soundfont": str(sf2)}, indent=2))
    print(f"ok  {len(perf)} notes · parts {', '.join(parts)} · {len(P['bars'])} bars @ {P['bpm']:g} bpm · {mid.name} → {wav}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
