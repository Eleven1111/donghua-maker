#!/usr/bin/env python3
"""Lesson gate for classroom films: objectives are taught, terms are shown and said, pacing fits the grade, the quiz is
answerable from the film alone — and a blind reader who never saw the script can answer it.

    python3 lesson_check.py <film>.html            # gate + writes <film>-lesson/讲义.md and blind/packet.md
    python3 lesson_check.py <film>.html --blind    # also require blind/answers.json (fresh reader) to score ≥ 80 %

<film>-lesson/lesson.json:
    {"topic": "勾股定理", "subject": "数学", "grade": "初二",
     "objectives": [{"id": "O1", "text": "能说出直角三角形三边的名称", "shots": [1, 2]}],
     "terms": [{"term": "斜边", "shot": 2, "plain": "直角对面那条最长的边"}],
     "misconception": {"text": "以为任何三角形都满足 a²+b²=c²", "shot": 4},
     "quiz": [{"q": "…", "options": ["…", "…", "…", "…"], "answer": 1, "objective": "O1",
               "evidence": {"shot": 2, "quote": "最长的边叫斜边"}, "why": "…"}],
     "recap_shot": 5}

The blind reader gets only blind/packet.md (per shot: subtitles, on-screen text, still paths; questions without answers)
and writes blind/answers.json: {"packet_sha": "<sha from packet.md>", "answers": [1, 0, 2, …]}.
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "donghua-maker" / "scripts"))   # sibling skill, installed or in the repo
from fact_check import on_screen  # noqa: E402  (same extraction the fact gate uses)

LEVELS = {  # chars/s ceiling, silence after the last word before the cut (s), new terms per shot, min quiz items
    "primary": {"cps": 4.2, "pause": .7, "terms": 1, "quiz": 3, "rate": "-15%", "name": "小学"},
    "junior": {"cps": 4.8, "pause": .5, "terms": 2, "quiz": 3, "rate": "-8%", "name": "初中"},
    "senior": {"cps": 5.4, "pause": .4, "terms": 2, "quiz": 4, "rate": "+0%", "name": "高中"},
}
PASS_BLIND = .8


def level(grade: str) -> str:
    if re.search(r"小学|[一二三四五六]年级|小[一二三四五六]", grade):
        return "primary"
    if re.search(r"初|[七八九]年级", grade):
        return "junior"
    if re.search(r"高|大学", grade):
        return "senior"
    sys.exit(f"grade {grade!r}: say 小学/初中/高中 or a year like 初二")


def film_parts(html: str) -> dict:
    shots = [(n, float(a), float(b)) for n, a, b in re.findall(r"name: '([^']*)', t0: ([\d.]+), t1: ([\d.]+)", html)]
    story = html[html.find("// ═══ STORY"):]
    heads = [m.start() for m in re.finditer(r"// ═══ SHOT \d+", story)]
    blocks = [story[a:b] for a, b in zip(heads, heads[1:] + [story.find("// ═══ NARRATION") if "// ═══ NARRATION" in story else story.find("// ═══ ENGINE")])]
    wrap = lambda b: "// ═══ STORY\n" + b + "\n// ═══ ENGINE"
    screen = [on_screen(wrap(b)) for b in blocks]
    m = re.search(r"Object\.assign\(NARR, \{ lines: (.*?),\n  ev: (.*?),\n  subs: (.*?),\n  marks: (.*?) \}\);", html, re.S)
    narr = {"lines": json.loads(m.group(1)), "ev": json.loads(m.group(2)), "subs": json.loads(m.group(3)), "marks": json.loads(m.group(4))} if m else None
    wh = re.search(r"const W = (\d+), H = (\d+)", html)
    return {"shots": shots, "screen": screen, "narr": narr, "size": (int(wh.group(1)), int(wh.group(2))) if wh else (0, 0)}


def shot_of(t: float, shots: list) -> int:
    return next((i + 1 for i, (_, a, b) in enumerate(shots) if a <= t < b), 0)


def said_in(narr: dict, shots: list) -> dict:
    out = {}
    for e in narr["ev"] if narr else []:
        out.setdefault(shot_of(e["t"], shots), []).append((narr["lines"][e["id"]], e))
    return out


def gate(L: dict, F: dict, lv: dict) -> list:
    errs, shots, n = [], F["shots"], len(F["shots"])
    said = said_in(F["narr"], shots)
    text_in = lambda s: " ".join(F["screen"][s - 1] if 0 < s <= len(F["screen"]) else []) + " " + " ".join(l for l, _ in said.get(s, []))
    if not F["narr"]:
        return ["NO VOICE    film has no NARRATION block — run narrate.py (classroom films are narrated)"]
    if F["size"][0] <= F["size"][1]:
        errs.append(f"FORMAT      {F['size'][0]}×{F['size'][1]} — classroom films are landscape 16:9 (projector / PPT)")
    silent = [i for i in range(1, n + 1) if i not in said]
    if len(silent) > max(1, n // 5):
        errs.append(f"SILENT      shots {silent} have no narration")
    for l, e in (x for v in said.values() for x in v):
        a, b = e.get("said", [e["t"], e["t"] + e["dur"]])
        chars = len(re.sub(r"[\W_]", "", l))
        cps = chars / max(b - a, .1)
        if cps > lv["cps"]:
            errs.append(f"TOO FAST    {cps:.1f} chars/s > {lv['cps']} for {lv['name']}: {l!r} — cut words or slow the rate ({lv['rate']})")
        s = shot_of(e["t"], shots)
        if s and shots[s - 1][2] - b < lv["pause"] - 1e-6:
            errs.append(f"NO PAUSE    shot {s}: voice ends {shots[s - 1][2] - b:.2f}s before the cut (< {lv['pause']}s for {lv['name']}): {l!r}")
    obj = {o["id"]: o for o in L.get("objectives", [])}
    if not obj:
        errs.append("NO GOAL     lesson.json has no objectives")
    for o in obj.values():
        if not o.get("shots") or any(not 1 <= s <= n for s in o["shots"]):
            errs.append(f"GOAL SHOTS  {o['id']} must name existing shots (1–{n}): {o.get('shots')}")
        if not any(q.get("objective") == o["id"] for q in L.get("quiz", [])):
            errs.append(f"UNTESTED    objective {o['id']} has no quiz item")
    per = {}
    for t in L.get("terms", []):
        s = t.get("shot", 0)
        per[s] = per.get(s, 0) + 1
        if t["term"] not in " ".join(F["screen"][s - 1] if 0 < s <= n else []):
            errs.append(f"TERM UNSEEN '{t['term']}' is not written on screen in shot {s}")
        if t["term"] not in " ".join(l for l, _ in said.get(s, [])):
            errs.append(f"TERM UNSAID '{t['term']}' is not said in shot {s}'s narration")
        if not t.get("plain"):
            errs.append(f"TERM PLAIN  '{t['term']}' needs a plain-words gloss for the handout")
    for s, k in per.items():
        if k > lv["terms"]:
            errs.append(f"TERM LOAD   shot {s} introduces {k} new terms (> {lv['terms']} for {lv['name']})")
    mc = L.get("misconception")
    if not mc or not 1 <= mc.get("shot", 0) <= n:
        errs.append("NO MISCONCEPTION  name one common wrong idea and the shot that corrects it")
    rs = L.get("recap_shot", 0)
    if not 1 <= rs <= n:
        errs.append("NO RECAP    recap_shot must name the shot that sums the lesson up")
    quiz = L.get("quiz", [])
    if len(quiz) < lv["quiz"]:
        errs.append(f"QUIZ SIZE   {len(quiz)} items < {lv['quiz']} for {lv['name']}")
    for k, q in enumerate(quiz, 1):
        ops = q.get("options", [])
        if len(ops) != 4 or len(set(ops)) != 4:
            errs.append(f"QUIZ {k}      needs 4 distinct options")
        if not isinstance(q.get("answer"), int) or not 0 <= q["answer"] < len(ops):
            errs.append(f"QUIZ {k}      answer index out of range")
        if q.get("objective") not in obj:
            errs.append(f"QUIZ {k}      objective {q.get('objective')!r} is not in objectives")
        ev = q.get("evidence", {})
        if not ev.get("quote") or ev["quote"] not in text_in(ev.get("shot", 0)):
            errs.append(f"QUIZ {k}      evidence quote {ev.get('quote')!r} is not said or shown in shot {ev.get('shot')} — the film must teach the answer")
        if not q.get("why"):
            errs.append(f"QUIZ {k}      needs `why` (the explanation printed in the handout)")
    return errs


def packet(L: dict, F: dict, film: Path, out: Path) -> str:
    said = said_in(F["narr"], F["shots"])
    stills = sorted(p.name for p in film.with_name(film.stem + "-stills").glob("s_*.jpg"))
    parts = [f"# 盲测材料：{L.get('topic', film.stem)}\n\n你只能根据下面的影片内容作答，不要用自己的知识补全。影片里没讲到的，就选你认为影片最支持的选项。\n"]
    for i, (name, a, b) in enumerate(F["shots"], 1):
        mine = [s for s in stills if a <= float(s[2:-4]) < b]
        parts.append(f"\n## 镜头 {i}（{a:g}–{b:g} s）\n- 解说：{' '.join(l for l, _ in said.get(i, [])) or '（无）'}\n"
                     f"- 屏幕文字：{' / '.join(F['screen'][i - 1]) or '（无）'}\n- 静帧：{', '.join(str(film.with_name(film.stem + '-stills') / s) for s in mine) or '（无）'}\n")
    parts.append("\n# 题目（每题只选一个，写 0–3 的序号）\n")
    for k, q in enumerate(L.get("quiz", []), 1):
        parts.append(f"\n{k}. {q['q']}\n" + "".join(f"   {j}) {o}\n" for j, o in enumerate(q['options'])))
    body = "".join(parts)
    sha = hashlib.sha1(body.encode()).hexdigest()[:12]
    body += f"\n---\n作答写入 `{out / 'answers.json'}`：{{\"packet_sha\": \"{sha}\", \"answers\": [..]}}\n"
    out.mkdir(parents=True, exist_ok=True)
    (out / "packet.md").write_text(body)
    return sha


def blind(L: dict, out: Path, sha: str) -> tuple:
    f = out / "answers.json"
    if not f.exists():
        return None, ["BLIND       no blind/answers.json yet — a fresh-context reader must answer blind/packet.md"]
    a = json.loads(f.read_text())
    if a.get("packet_sha") != sha:
        return None, [f"BLIND STALE answers were for packet {a.get('packet_sha')}, current packet is {sha} — re-run the blind reader"]
    quiz = L["quiz"]
    got = a.get("answers", [])
    miss = [k + 1 for k, q in enumerate(quiz) if k >= len(got) or got[k] != q["answer"]]
    score = 1 - len(miss) / len(quiz)
    errs = [] if score >= PASS_BLIND else [f"BLIND       {score:.0%} < {PASS_BLIND:.0%}; missed items {miss} — strengthen those shots (evidence shots: "
                                            f"{[quiz[k - 1]['evidence']['shot'] for k in miss]})"]
    return (score, miss), errs


def handout(L: dict, F: dict, film: Path, lv: dict, blind_res) -> str:
    said = said_in(F["narr"], F["shots"])
    o = [f"# {L.get('topic', film.stem)} · 讲义\n\n{L.get('subject', '')} · {L.get('grade', '')}（{lv['name']}）· 片长 {F['shots'][-1][2]:g} 秒 · 影片 `{film.name}` · 字幕 `{film.stem}-vo/{film.stem}.srt`\n"]
    o.append("\n## 学习目标\n" + "".join(f"- **{x['id']}** {x['text']}（镜头 {'、'.join(map(str, x['shots']))}）\n" for x in L["objectives"]))
    o.append("\n## 关键词\n" + "".join(f"- **{t['term']}**：{t['plain']}（镜头 {t['shot']}）\n" for t in L.get("terms", [])))
    mc = L.get("misconception")
    if mc:
        o.append(f"\n## 常见误区\n- {mc['text']}（镜头 {mc['shot']} 纠正）\n")
    o.append("\n## 分镜与解说\n| 镜头 | 时间 | 解说 |\n|---|---|---|\n" + "".join(
        f"| {i} {n} | {a:g}–{b:g} s | {' '.join(l for l, _ in said.get(i, [])) or '—'} |\n" for i, (n, a, b) in enumerate(F["shots"], 1)))
    o.append("\n## 课后小测（可直接发给学生）\n")
    for k, q in enumerate(L["quiz"], 1):
        o.append(f"\n{k}. {q['q']}\n" + "".join(f"   {'ABCD'[j]}. {x}\n" for j, x in enumerate(q["options"])))
    o.append("\n## 答案与解析（教师用）\n" + "".join(f"{k}. **{'ABCD'[q['answer']]}** — {q['why']}（对应镜头 {q['evidence']['shot']}，目标 {q['objective']}）\n"
                                               for k, q in enumerate(L["quiz"], 1)))
    if blind_res:
        o.append(f"\n> 盲测：未看过脚本的读者只看影片内容作答，正确率 {blind_res[0]:.0%}" + (f"，答错第 {blind_res[1]} 题" if blind_res[1] else "") + "。\n")
    facts = film.with_name(film.stem + "-facts") / "facts.json"
    fonts = film.with_name(film.stem + "-fonts") / "sources.json"
    src = sorted({u for c in (json.loads(facts.read_text()).get("claims", []) if facts.exists() else []) for u in c.get("sources", [])})
    o.append("\n## 事实来源\n" + ("".join(f"- {u}\n" for u in src) or "- （无 facts.json）\n"))
    if fonts.exists():
        o.append("\n## 素材授权\n" + "".join(f"- 字体 {f['family']}：{f['license']}，可商用（{f['home']}）\n" for f in json.loads(fonts.read_text())))
    o.append("- 解说：Microsoft Edge 在线语音合成（edge-tts）。\n")
    return "".join(o)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("--blind", action="store_true", help="require a passing blind/answers.json")
    a = ap.parse_args()
    film = a.film.resolve()
    ld = film.with_name(film.stem + "-lesson")
    L = json.loads((ld / "lesson.json").read_text())
    lv = LEVELS[level(L.get("grade", ""))]
    F = film_parts(film.read_text())
    errs = gate(L, F, lv)
    sha = packet(L, F, film, ld / "blind")
    res, berrs = blind(L, ld / "blind", sha)
    if a.blind:
        errs += berrs
    (ld / "讲义.md").write_text(handout(L, F, film, lv, res))
    print(f"{lv['name']} · {len(F['shots'])} shots · {len(L.get('objectives', []))} objectives · {len(L.get('terms', []))} terms · {len(L.get('quiz', []))} quiz"
          f" · blind: {f'{res[0]:.0%}' if res else 'pending'} · handout → {ld.name}/讲义.md")
    for e in errs:
        print("  " + e)
    print("LESSON CHECK " + ("FAIL" if errs else "PASS" + ("" if a.blind else " (structure; run --blind after the blind reader)")))
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
