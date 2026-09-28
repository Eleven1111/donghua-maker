#!/usr/bin/env python3
"""Publishing kit for creator films: covers, per-platform copy, subtitles and a licence ledger that must be clean.

    python3 publish_kit.py <film>.html        # reads <film>-publish/pack.json, writes the kit into <film>-publish/

pack.json:
    {"cover_t": 1.5,
     "platforms": {
       "douyin": {"title": "…", "desc": "…", "tags": ["科普", "…"]},
       "xhs":    {"title": "≤20字", "desc": "…", "tags": ["…"]}}}

Writes:
  cover-9x16.jpg (1080×1920) and cover-3x4.jpg (1080×1440, centre crop) from the film at cover_t, subtitles off
  发布包.md — copy-paste text per platform, attributions appended, the licence ledger, how to export each version
  <film>.srt — copied from <film>-vo/ when the film is narrated
Fails (exit 1) when:
  COVER    no big text on the cover frame (largest text < 5 % of the height), or it sits outside douyin's visible cover
           band (the middle 1464/1920) or the 3:4 crop
  COPY     a title/desc/tag list is over the platform limit, or a tag repeats
  LICENCE  an embedded sound/music/font has no licence entry, an unknown licence, or a non-commercial / no-derivatives one;
           CC-BY items need their author named in every platform's desc (added automatically to 发布包.md)
Limits: xhs title 20 / body 1000 chars (third-party guides, UNVERIFIED); tag counts and douyin lengths are house rules.
"""
import argparse
import base64
import json
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from filmprobe import probe  # noqa: E402

LIMITS = {  # title, desc, tags (max count); sources in the docstring; house rules marked
    "douyin": {"name": "抖音 / 视频号", "title": 30, "desc": 300, "tags": 5, "aspect": "9:16"},      # house rule
    "xhs": {"name": "小红书", "title": 20, "desc": 1000, "tags": 10, "aspect": "3:4"},              # 20 / 1000: guides; tags: house rule
}
OK_LIC = re.compile(r"CC0|Creative Commons 0|Public Domain|Pixabay Content License|Mixkit (Sound Effects )?Free License|Mixkit License|"
                    r"SIL Open Font License|OFL|synthes|generated|GeneralUser GS|self-recorded", re.I)
BY_LIC = re.compile(r"\bCC[- ]?BY\b(?![- ]?(NC|ND))|Attribution 4\.0|Attribution 3\.0", re.I)
BAD_LIC = re.compile(r"\bNC\b|NonCommercial|\bND\b|NoDerivatives|UNKNOWN|editorial", re.I)
SOUNDFONT = {"what": "背景音乐音色：GeneralUser GS SoundFont（S. Christian Collins）", "license": "GeneralUser GS License v2.0",
             "source": "https://schristiancollins.com/generaluser.php"}


def ledger(film: Path, base: dict) -> tuple:
    rows, errs, credits = [], [], []
    audio = film.with_name(film.stem + "-audio") / "sources.json"
    snd = json.loads(audio.read_text()).get("sounds", []) if audio.exists() else []
    by_id = {s.get("id"): s for s in snd}
    for sid in base["samples"]:
        s = by_id.get(sid)
        if not s:
            errs.append(f"LICENCE  embedded sound {sid!r} has no entry in {audio.parent.name}/sources.json"); continue
        lic = s.get("license", "")
        rows.append((f"音效/音乐 {sid}", lic, s.get("source", "")))
        if BAD_LIC.search(lic) or not (OK_LIC.search(lic) or BY_LIC.search(lic)):
            errs.append(f"LICENCE  {sid}: {lic or 'no licence'} — not cleared for commercial use; replace it")
        elif BY_LIC.search(lic):
            credits.append(f"{sid}: {s.get('author', '?')} ({lic})")
    if (film.with_name(film.stem + "-audio") / "bgm.mid").exists():
        rows.append((SOUNDFONT["what"], SOUNDFONT["license"], SOUNDFONT["source"]))
    fonts = film.with_name(film.stem + "-fonts") / "sources.json"
    html = film.read_text()
    if 'id="embedfonts"' not in html:
        errs.append("LICENCE  no embedded fonts — system fonts (Kaiti/Xingkai…) are not cleared for commercial video; run font_embed.py")
    for f in json.loads(fonts.read_text()) if fonts.exists() else []:
        rows.append((f"字体 {f['family']}", f["license"], f["home"]))
    if "Object.assign(NARR" in html:
        rows.append(("解说语音", "Microsoft Edge 在线语音合成（edge-tts）— 商用条款未核实，见 UNVERIFIED", "https://github.com/rany2/edge-tts"))
    return rows, errs, credits


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    a = ap.parse_args()
    film = a.film.resolve()
    out = film.with_name(film.stem + "-publish")
    pack = json.loads((out / "pack.json").read_text())
    ct = float(pack.get("cover_t", 0))

    async def job(pg, base):
        f = round(ct * base["fps"])
        boxes = await pg.evaluate(f"__film.textBoxes({f})")
        img = await pg.evaluate("""() => { const c = document.getElementById('film'); const o = document.createElement('canvas');
            o.width = 1080; o.height = Math.round(1080 * c.height / c.width); o.getContext('2d').drawImage(c, 0, 0, o.width, o.height);
            return o.toDataURL('image/jpeg', .92); }""")
        return boxes, img

    base, (boxes, img) = probe(film, job, "&subs=0")
    W, H = base["W"], base["H"]
    errs = [f"PAGE     {e}" for e in base["errors"]]
    big = max((b for b in boxes if not b["sub"]), key=lambda b: b["box"][3] - b["box"][1], default=None)
    if not big or (big["box"][3] - big["box"][1]) < .05 * H:
        errs.append(f"COVER    no title-sized text at cover_t={ct}s (largest: {big and big['text']!r}) — put the hook title on that frame")
    else:
        band = [(H - H * 1464 / 1920) / 2, (H + H * 1464 / 1920) / 2]
        crop = [(H - W * 4 / 3) / 2, (H + W * 4 / 3) / 2]
        top, bot = big["box"][1], big["box"][3]
        if top < max(band[0], crop[0]) or bot > min(band[1], crop[1]):
            errs.append(f"COVER    title {big['text']!r} (y {top}–{bot}) leaves the visible cover band y {round(max(band[0], crop[0]))}–{round(min(band[1], crop[1]))}")
    jpg = base64.b64decode(img.split(",")[1])
    (out / "cover-9x16.jpg").write_bytes(jpg)
    import subprocess
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(out / "cover-9x16.jpg"), "-vf", "crop=iw:iw*4/3:0:(ih-iw*4/3)/2",
                    "-q:v", "2", str(out / "cover-3x4.jpg")], check=True)
    rows, lerr, credits = ledger(film, base)
    errs += lerr
    plats = pack.get("platforms", {})
    for p, c in plats.items():
        L = LIMITS.get(p)
        if not L:
            errs.append(f"COPY     unknown platform {p!r}; choose from {list(LIMITS)}"); continue
        for k in ("title", "desc"):
            if not c.get(k):
                errs.append(f"COPY     {L['name']} {k} is empty")
            elif len(c[k]) > L[k]:
                errs.append(f"COPY     {L['name']} {k} is {len(c[k])} chars > {L[k]}")
        tags = c.get("tags", [])
        if len(tags) > L["tags"] or len(set(tags)) != len(tags):
            errs.append(f"COPY     {L['name']} tags: {len(tags)} (max {L['tags']}), repeats: {len(tags) - len(set(tags))}")
    if not plats:
        errs.append("COPY     pack.json has no platforms")
    srt = film.with_name(film.stem + "-vo") / f"{film.stem}.srt"
    if srt.exists():
        shutil.copy(srt, out / srt.name)
    credit = ("\n素材署名：" + "；".join(credits)) if credits else ""
    md = [f"# {film.stem} · 发布包\n\n封面：`cover-9x16.jpg`（抖音/视频号）、`cover-3x4.jpg`（小红书），取自 {ct:g}s，无字幕。"
          + (f" 字幕文件：`{srt.name}`。" if srt.exists() else "") + "\n"]
    for p, c in plats.items():
        L = LIMITS.get(p, {"name": p, "aspect": "9:16"})
        md.append(f"\n## {L['name']}（{L['aspect']}）\n\n**标题**\n\n{c.get('title', '')}\n\n**简介**\n\n{c.get('desc', '')}{credit}\n\n"
                  f"**话题**\n\n{' '.join('#' + t for t in c.get('tags', []))}\n")
    md.append("\n## 导出（网页版确认后）\n\n```bash\nS=" + str(Path(__file__).resolve().parents[2] / "donghua-maker" / "scripts") + "\n"
              f"python3 $S/export.py {film.name} -o {film.stem}-9x16.mp4 --scale .75 --crf 23\n"
              f"python3 $S/export.py {film.name} -o {film.stem}-3x4.mp4 --aspect 3:4 --scale .75 --crf 23\n```\n")
    md.append("\n## 素材授权\n\n| 素材 | 许可 | 来源 |\n|---|---|---|\n" + "".join(f"| {w} | {l} | {s} |\n" for w, l, s in rows))
    md.append("\n平台字数和安全区依据第三方经验值，发布前请用真实账号预览一次（UNVERIFIED）。\n")
    (out / "发布包.md").write_text("".join(md))
    print(f"cover at {ct:g}s: {big and big['text']!r} · {len(plats)} platforms · {len(rows)} licence rows · kit → {out.name}/")
    for e in errs:
        print("  " + e)
    if "Object.assign(NARR" in film.read_text():
        print("  WARN     edge-tts voice: Microsoft's terms for commercial use are not verified — for monetised posts, record your own voice or use a licensed TTS")
    print("PUBLISH KIT " + ("FAIL" if errs else "PASS"))
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
