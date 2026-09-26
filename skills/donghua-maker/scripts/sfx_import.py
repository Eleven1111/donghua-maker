#!/usr/bin/env python3
"""Import recorded sounds (SFX or a music bed) into a donghua film, with their licences on record.

    python3 sfx_import.py --scan ~/Sounds                       # list candidate audio files (duration, channels)
    python3 sfx_import.py <film>-audio/sounds.json --film <film>.html

sounds.json (paths relative to it):
    {"sounds": [
      {"id": "click", "file": "raw/soft-click.wav", "role": "sfx", "cat": "click",
       "source": "https://pixabay.com/sound-effects/…", "author": "…", "license": "Pixabay Content License"},
      {"id": "bgm", "file": "raw/track.mp3", "role": "music", "cat": "music", "max": 30,
       "source": "…", "license": "…", "bpm": 120, "firstBeat": 0.12}
    ],
     "map": {"ui:click": ["click", "click2"], "whoosh": "swoosh"},   # optional: synth cue kind → sample id(s), round-robin
     "bgm": {"id": "bgm", "replace": "groove", "keep": ["mb"]},       # optional: a bed that replaces groove()/synth music
     "ir": "room"}                                                    # optional: sample id (cat ir) used as the reverb

Each sound is trimmed (leading/trailing silence for sfx), capped to `max` seconds, faded out, level-matched
(sfx: peak -3 dBFS; music: one linear gain to -20 LUFS, true peak ≤ -1.5 dBTP, dynamics kept), encoded to mp3 (sfx mono 96k, music stereo 128k) into
<json dir>/enc/, its audible landmark (loudest 10 ms window) measured as `sync`, and a SAMPLES block
(Object.assign(SMP.lib, {...})) is written into the film between markers, replacing any earlier block.
<json dir>/sources.json keeps id, source, author, licence, sha256 of original and encoded file.
A sound without `license` is refused unless --allow-unknown (then recorded as UNKNOWN and warned).
"""
import argparse
import base64
import hashlib
import json
import re
import struct
import subprocess
import sys
from pathlib import Path

BEGIN, END = "// ═══ SAMPLES BEGIN (scripts/sfx_import.py — do not edit by hand) ═══", "// ═══ SAMPLES END ═══"
AUDIO_EXT = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aac", ".aif", ".aiff", ".opus"}


def ff(*args, capture=False):
    r = subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], capture_output=True, text=not capture, check=False)
    if r.returncode:
        raise RuntimeError((r.stderr if isinstance(r.stderr, str) else r.stderr.decode(errors="replace")).strip()[-400:])
    return r


def probe(path: Path) -> dict:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=channels,sample_rate", "-of", "json", str(path)],
                       capture_output=True, text=True, check=True)
    j = json.loads(r.stdout)
    st = (j.get("streams") or [{}])[0]
    return {"dur": round(float(j["format"]["duration"]), 3), "ch": st.get("channels"), "sr": st.get("sample_rate")}


def peak_db(path: Path) -> float:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True, check=True)
    m = re.search(r"max_volume: (-?[\d.]+) dB", r.stderr)
    return float(m.group(1)) if m else 0.0


def landmark(path: Path) -> float:
    """Time (s) of the loudest 10 ms window: where the sound audibly lands."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
    n = len(raw) // 2
    if n == 0:
        return 0.0
    x = struct.unpack(f"<{n}h", raw[:n * 2])
    win, best, at = 80, -1.0, 0
    for i in range(0, max(1, n - win), win // 2):
        e = sum(v * v for v in x[i:i + win])
        if e > best:
            best, at = e, i
    return round(at / 8000, 3)


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def process(item: dict, base: Path, enc_dir: Path) -> dict:
    src = (base / item["file"]).resolve()
    if not src.is_file():
        raise FileNotFoundError(f"{item['id']}: missing {src}")
    role, cat = item.get("role", "sfx"), item.get("cat", "")
    music = role == "music"
    cap = float(item.get("max", 60 if music else 3))
    info = probe(src)
    tmp = enc_dir / f"{item['id']}.tmp.wav"
    trim = [] if music or item.get("trim") is False else ["silenceremove=start_periods=1:start_threshold=-50dB", "areverse", "silenceremove=start_periods=1:start_threshold=-50dB", "areverse"]
    length = min(cap, info["dur"])
    chain = trim + [f"atrim=0:{cap}", f"afade=t=out:st={max(0, length - (1.5 if music else .03)):.3f}:d={1.5 if music else .03}"]
    ff("-i", str(src), "-af", ",".join(chain), "-ar", "48000", "-ac", "2" if music else "1", str(tmp))
    out = enc_dir / f"{item['id']}.mp3"
    if music:  # measure, then one linear gain: keeps the section dynamics the arrangement was written with
        m = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(tmp), "-af", "loudnorm=print_format=json", "-f", "null", "-"], capture_output=True, text=True, check=True).stderr
        st = json.loads(m[m.rfind("{"):m.rfind("}") + 1])
        gain = float(item.get("lufs", -20)) - float(st["input_i"])
        gain = min(gain, -1.5 - float(st["input_tp"]))  # never push the true peak above -1.5 dBTP
        level = ["-af", f"volume={gain:.2f}dB"]
    else:
        gain = float(item.get("peak", -3)) - peak_db(tmp)
        level = ["-af", f"volume={gain:.2f}dB"]
    ff("-i", str(tmp), *level, "-ar", "48000", "-ac", "2" if music else "1", "-b:a", "128k" if music else "96k", str(out))
    tmp.unlink()
    meta = probe(out)
    sync = 0.0 if music else landmark(out)
    return {"id": item["id"], "role": role, "cat": cat or ("music" if music else ""), "dur": meta["dur"], "sync": sync if sync > .03 else 0,
            "gain": item.get("gain", 1), "file": out, "orig": src, **({"bpm": item["bpm"], "firstBeat": item.get("firstBeat", 0)} if "bpm" in item else {})}


def inject(film: Path, rows: list, spec_extra: dict | None = None) -> int:
    spec_extra = spec_extra or {}
    lib = {r["id"]: {k: r[k] for k in ("role", "cat", "sync", "gain", "dur", *(("bpm", "firstBeat") if "bpm" in r else ())) } | {"src": base64.b64encode(r["file"].read_bytes()).decode()} for r in rows}
    extra = ""
    if spec_extra.get("map"):
        extra += f"\nSMP.map = {json.dumps(spec_extra['map'], ensure_ascii=False)};"
    if spec_extra.get("bgm"):
        extra += f"\nSMP.bgm = {json.dumps(spec_extra['bgm'], ensure_ascii=False)};"
    if spec_extra.get("ir"):
        extra += f"\nMIXBUS.ir = {json.dumps(spec_extra['ir'])};"
    block = f"{BEGIN}\nObject.assign(SMP.lib, {json.dumps(lib, ensure_ascii=False)});{extra}\n{END}"
    html = film.read_text()
    if BEGIN in html:
        html = html[:html.index(BEGIN)] + block + html[html.index(END) + len(END):]
    elif "const SHOTS = [];" in html:
        html = html.replace("const SHOTS = [];", block + "\nconst SHOTS = [];", 1)
    else:
        raise RuntimeError("film has neither a SAMPLES block nor `const SHOTS = [];` to insert before")
    film.write_text(html)
    return sum(len(v["src"]) for v in lib.values())


def scan(root: Path) -> None:
    files = sorted(p for p in root.rglob("*") if p.suffix.lower() in AUDIO_EXT)
    if not files:
        print(f"no audio files under {root}")
    for p in files:
        try:
            i = probe(p)
            print(f"{i['dur']:7.2f}s  ch{i['ch']}  {p}")
        except subprocess.CalledProcessError:
            print(f"  (unreadable)  {p}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("sounds", nargs="?", type=Path)
    ap.add_argument("--film", type=Path)
    ap.add_argument("--scan", type=Path, help="list audio files under a folder (the user's own library first)")
    ap.add_argument("--allow-unknown", action="store_true", help="import sounds without a licence, recorded as UNKNOWN")
    a = ap.parse_args()
    if a.scan:
        scan(a.scan.expanduser())
        return 0
    if not a.sounds or not a.film:
        ap.error("need sounds.json and --film (or --scan DIR)")
    spec = json.loads(a.sounds.read_text())
    base = a.sounds.resolve().parent
    enc = base / "enc"
    enc.mkdir(exist_ok=True)
    rows, record, ids = [], [], set()
    for item in spec["sounds"]:
        if not re.fullmatch(r"[A-Za-z][\w-]*", item.get("id", "")) or item["id"] in ids:
            sys.exit(f"bad or duplicate id: {item.get('id')!r}")
        ids.add(item["id"])
        lic = item.get("license")
        if not lic and not a.allow_unknown:
            sys.exit(f"{item['id']}: no license recorded — add source/author/license, or pass --allow-unknown for a private draft")
        r = process(item, base, enc)
        rows.append(r)
        record.append({"id": r["id"], "role": r["role"], "cat": r["cat"], "file": item["file"], "encoded": str(r["file"].relative_to(base)),
                       "source": item.get("source", "UNKNOWN"), "author": item.get("author", "UNKNOWN"), "license": lic or "UNKNOWN",
                       "method": item.get("method", "recorded"), "dur": r["dur"], "sync": r["sync"], "sha256_original": sha(r["orig"]), "sha256_encoded": sha(r["file"])})
        if not lic:
            print(f"WARNING {item['id']}: licence UNKNOWN — not for publication", file=sys.stderr)
        print(f"ok  {r['id']:<12} {r['role']:<6} {r['dur']:6.2f}s  sync {r['sync']:.3f}s  {item['file']}")
    (base / "sources.json").write_text(json.dumps({"sounds": record}, ensure_ascii=False, indent=2))
    size = inject(a.film.resolve(), rows, {k: spec.get(k) for k in ('map', 'bgm', 'ir')})
    print(f"embedded {len(rows)} sounds ({size / 1024:.0f} KB base64) into {a.film}; sources: {base / 'sources.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
