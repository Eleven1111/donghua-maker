#!/usr/bin/env python3
"""MiniMax voice track for a donghua film: lines.json -> trimmed, loudness-matched mp3 clips + measured durations.

    python3 voice.py <film>-vo/lines.json                 # synthesise every clip that has no mp3 yet
    python3 voice.py <film>-vo/lines.json --only duck     # regenerate one clip (by id)
    python3 voice.py <film>-vo/lines.json --force         # regenerate all

lines.json:
    {"clips": [{"id": "n1", "text": "春天，池塘里孵出了一群小蝌蚪。",
                "voice": "Chinese (Mandarin)_Reliable_Executive", "speed": 1.15}, ...]}
Writes <id>.mp3 next to lines.json (48 kHz mono 80 kbps, silence trimmed, loudnorm I=-16 TP=-2)
and writes each clip's measured "dur" back into lines.json.

Key lookup (donghua_env.py): env, ./.env, ~/.config/donghua/.env, then ~/.config/secrets/.env. MINIMAX_API_BASE picks the region. The key is never
printed or passed on a command line. Model: MINIMAX_TTS_MODEL (env or .env) (default speech-2.8-hd).
"""
import argparse, io, json, os, subprocess, sys, tarfile, tempfile, time, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import donghua_env  # noqa: E402

# mainland accounts: https://api.minimax.chat (default); international accounts: MINIMAX_API_BASE=https://api.minimax.io
BASE = donghua_env.get("MINIMAX_API_BASE", "https://api.minimax.chat").rstrip("/")


def secret(name):
    return donghua_env.require(name, "MiniMax narration is paid and opt-in")


def call(path, key, body=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def synth(text, voice, speed, key, model):
    sub = json.loads(call("/v1/t2a_async_v2", key, {
        "model": model, "text": text, "voice_setting": {"voice_id": voice, "speed": speed, "vol": 1.0, "pitch": 0},
        "audio_setting": {"sample_rate": 32000, "format": "mp3", "channel": 1}, "subtitle_enable": False}))
    if sub.get("base_resp", {}).get("status_code") != 0:
        raise RuntimeError(f"submit failed: {sub.get('base_resp')}")
    deadline = time.time() + 120
    while time.time() < deadline:
        poll = json.loads(call(f"/v1/query/t2a_async_query_v2?task_id={sub['task_id']}", key))
        if poll.get("status") == "Success":
            tar = tarfile.open(fileobj=io.BytesIO(call(f"/v1/files/retrieve_content?file_id={poll['file_id']}", key)))
            m = next((m for m in tar.getmembers() if m.name.endswith(".mp3")), None)
            if not m:
                raise RuntimeError("response tar has no mp3")
            return tar.extractfile(m).read()
        if poll.get("status") == "Failed":
            raise RuntimeError(f"task failed: {poll.get('base_resp')}")
        time.sleep(3)
    raise RuntimeError("task did not finish within 120 s")


def finish(raw, out):
    """Trim silence at both ends, match loudness, encode 48k mono 80k; return measured seconds."""
    with tempfile.NamedTemporaryFile(suffix=".mp3") as t:
        t.write(raw); t.flush()
        trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", t.name, "-af", f"{trim},loudnorm=I=-16:TP=-2",
                        "-ar", "48000", "-ac", "1", "-b:a", "80k", str(out)], check=True)
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)],
                       capture_output=True, text=True, check=True)
    return round(float(p.stdout), 3)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("lines"); ap.add_argument("--only", action="append", default=[]); ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    path = Path(a.lines); data = json.loads(path.read_text()); key = secret("MINIMAX_API_KEY")
    model = donghua_env.get("MINIMAX_TTS_MODEL", "speech-2.8-hd"); failed = []
    for c in data["clips"]:
        out = path.parent / f"{c['id']}.mp3"
        if a.only and c["id"] not in a.only: continue
        if out.exists() and not (a.force or a.only): print(f"skip {c['id']} (exists)"); continue
        for attempt in range(3):
            try:
                c["dur"] = finish(synth(c["text"], c["voice"], c.get("speed", 1.0), key, model), out)
                print(f"ok   {c['id']:<10} {c['dur']:>6.3f}s  {c['text']}"); break
            except Exception as e:  # network / API / ffmpeg: retry, then report
                print(f"fail {c['id']} attempt {attempt + 1}: {e}", file=sys.stderr)
        else:
            failed.append(c["id"])
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    if failed: sys.exit(f"failed after 3 attempts: {', '.join(failed)}")


if __name__ == "__main__":
    main()
