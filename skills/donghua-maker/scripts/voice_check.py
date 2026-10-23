#!/usr/bin/env python3
"""Transcribe every narration line embedded in a film and compare it with the script: a misread word fails the film.

    python3 voice_check.py <film>.html                    # VOICE CHECK PASS / FAIL
    python3 voice_check.py <film>.html --json             # machine-readable report
    python3 voice_check.py <film>.html --model ggml-small.bin --max-cer 0.25

Reads the film's own NARRATION block (written by narrate.py or by a MiniMax build): `NARR.lines` holds the script
text, `VO.src` the embedded audio, so what is checked is exactly what the viewer hears. Each line is transcribed with
whisper.cpp (`whisper-cli`), normalised (punctuation dropped, digits read as Chinese numerals, 两 → 二) and compared
character by character. CER = edit distance / script length.

A line fails when its CER is above --max-cer. Speech-to-text mishears too, so a failed line means "a person must
listen to this line", not "the voice is wrong". After listening, record what the model hears for a line that is
pronounced correctly in <film>-vo/heard.json, {"<script text of the line>": "<transcript>"}; that line then passes
while the transcript stays the same, and fails again when the audio changes. Never fill heard.json without listening.

Model: --model, then DONGHUA_WHISPER_MODEL (env or .env, see donghua_env.py), then the first multilingual
ggml-*.bin found in the usual cache folders. English-only models (*.en.bin) are skipped for Chinese films.
Needs ffmpeg and whisper.cpp's whisper-cli (brew install whisper-cpp). Measuring is not listening: report tone,
pace and emotion as UNVERIFIED.
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import donghua_env  # noqa: E402

BEGIN, END = "// ═══ NARRATION", "// ═══ /NARRATION"
PUNCT = re.compile(r"[\s，。！？；：、,.!?;:\"'“”‘’（）()《》〈〉【】\[\]—…·~～\-]+")
CJK = re.compile(r"[一-鿿]")
DIGITS = "零一二三四五六七八九"
MODEL_DIRS = ["~/.cache/whisper", "~/.cache/whisper.cpp", "~/.cache/hyperframes/whisper/models",
              "~/whisper.cpp/models", "/opt/homebrew/share/whisper-cpp", "/usr/local/share/whisper-cpp"]
PREF = ["large-v3-turbo", "large-v3", "large", "medium", "small", "base"]


def narration(html: str) -> tuple[list[str], list[str]]:
    a, b = html.find(BEGIN), html.find(END)
    if a < 0 or b < 0:
        raise SystemExit("no NARRATION block in the film (narrate.py or a MiniMax build writes it)")
    blk = html[a:b]
    m = re.search(r"lines:\s*(\[.*?\])\s*,\s*ev:", blk, re.S)
    s = re.search(r"VO\.src\s*=\s*(\[.*?\])\s*;", blk, re.S)
    if not m or not s:
        raise SystemExit("NARRATION block has no `lines:` or `VO.src`")
    lines, src = json.loads(m.group(1)), json.loads(s.group(1))
    if len(lines) != len(src):
        raise SystemExit(f"{len(lines)} script lines but {len(src)} embedded clips")
    return lines, src


def find_model(arg: str | None, chinese: bool) -> Path:
    cands = [arg] if arg else []
    env = donghua_env.get("DONGHUA_WHISPER_MODEL")
    if env:
        cands.append(env)
    for c in cands:
        p = Path(c).expanduser()
        if p.is_file():
            return p
        raise SystemExit(f"whisper model not found: {c}")
    found = []
    for d in MODEL_DIRS:
        found += [p for p in Path(d).expanduser().glob("ggml-*.bin") if not (chinese and p.name.endswith(".en.bin"))]
    if not found:
        raise SystemExit("no whisper.cpp model found; download one (e.g. ggml-small.bin) and pass --model or set DONGHUA_WHISPER_MODEL")
    rank = lambda p: next((i for i, k in enumerate(PREF) if f"-{k}" in p.name), len(PREF))
    return sorted(found, key=lambda p: (rank(p), p.name))[0]


def cn_int(n: int) -> str:
    """integer → how it is read in Mandarin (to 9999 9999): 115 → 一百一十五, 10 → 十, 2026 → 二千零二十六"""
    if n == 0:
        return "零"
    if n >= 10 ** 8:
        return "".join(DIGITS[int(c)] for c in str(n))
    def four(x: int, lead: bool) -> str:
        out, zero = "", False
        for unit, v in (("千", 1000), ("百", 100), ("十", 10), ("", 1)):
            d = x // v % 10
            if d:
                if zero:
                    out += "零"
                out += ("" if (unit == "十" and d == 1 and not out and lead) else DIGITS[d]) + unit
                zero = False
            elif out:
                zero = True
        return out
    hi, lo = divmod(n, 10000)
    if not hi:
        return four(lo, True)
    return four(hi, True) + "万" + (("零" if lo < 1000 else "") + four(lo, False) if lo else "")


def norm(text: str) -> str:
    text = re.sub(r"\d+\.\d+", lambda m: cn_int(int(m.group().split(".")[0])) + "点" + "".join(DIGITS[int(c)] for c in m.group().split(".")[1]), text)
    text = re.sub(r"\d+", lambda m: cn_int(int(m.group())), text)
    text = text.replace("两", "二").replace("%", "百分之")
    return PUNCT.sub("", text).lower()


def cer(ref: str, hyp: str) -> float:
    if not ref:
        return 0.0 if not hyp else 1.0
    prev = list(range(len(hyp) + 1))
    for i, a in enumerate(ref, 1):
        cur = [i]
        for j, b in enumerate(hyp, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a != b)))
        prev = cur
    return prev[-1] / len(ref)


def transcribe(cli: str, model: Path, mp3: bytes, lang: str, tmp: Path, i: int) -> str:
    src, wav = tmp / f"l{i}.mp3", tmp / f"l{i}.wav"
    src.write_bytes(mp3)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ar", "16000", "-ac", "1", str(wav)], check=True)
    cmd = [cli, "-m", str(model), "-l", lang, "-nt", "-np", "-bs", "5", "-f", str(wav)]
    if lang == "zh":
        cmd += ["--prompt", "以下是普通话的句子。"]
    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode:
        raise SystemExit(f"whisper-cli failed on line {i + 1}: {out.stderr.strip()[-300:]}")
    return " ".join(out.stdout.split())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("film")
    ap.add_argument("--model", help="whisper.cpp ggml model file")
    ap.add_argument("--max-cer", type=float, default=0.25, help="fail a line above this character error rate (default 0.25)")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    film = Path(a.film).resolve()
    lines, src = narration(film.read_text(encoding="utf-8"))
    chinese = any(CJK.search(t) for t in lines)
    cli = shutil.which("whisper-cli") or shutil.which("whisper-cpp")
    if not cli or not shutil.which("ffmpeg"):
        raise SystemExit("needs ffmpeg and whisper.cpp's whisper-cli (brew install whisper-cpp ffmpeg)")
    model = find_model(a.model, chinese)
    heard_p = film.with_name(film.stem + "-vo") / "heard.json"
    heard = json.loads(heard_p.read_text(encoding="utf-8")) if heard_p.exists() else {}
    rows, bad = [], 0
    with tempfile.TemporaryDirectory() as td:
        for i, (text, b64) in enumerate(zip(lines, src)):
            hyp = transcribe(cli, model, base64.b64decode(b64), "zh" if chinese else "auto", Path(td), i)
            score = cer(norm(text), norm(hyp))
            status = "ok" if score <= a.max_cer else "LISTEN"
            if status == "LISTEN" and text in heard:
                status = "ok (heard.json)" if cer(norm(heard[text]), norm(hyp)) <= .05 else "LISTEN (changed since heard.json)"
            bad += status.startswith("LISTEN")
            rows.append({"line": i + 1, "script": text, "heard": hyp, "cer": round(score, 3), "status": status})
    if a.json:
        print(json.dumps({"model": model.name, "max_cer": a.max_cer, "pass": not bad, "lines": rows}, ensure_ascii=False, indent=1))
        return 1 if bad else 0
    print(f"{len(rows)} lines · model {model.name} · max CER {a.max_cer}")
    for r in rows:
        print(f"  L{r['line']:>2} {r['cer']:.2f} {r['status']:<16} {r['script']}")
        if r["status"] != "ok":
            print(f"{'':25}heard: {r['heard']}")
    if bad:
        print(f"VOICE CHECK FAIL: {bad} line(s) to listen to — fix the voice, or after listening record the transcript in {heard_p.name}")
        return 1
    print("VOICE CHECK PASS (transcribed, not auditioned: tone and pace UNVERIFIED)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
