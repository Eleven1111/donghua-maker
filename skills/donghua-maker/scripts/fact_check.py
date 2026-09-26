#!/usr/bin/env python3
"""Fact gate for donghua films: every piece of on-screen text must be checked, sourced, or marked as non-factual.

    python3 fact_check.py <film>.html --init      # write <film>-facts/facts.json listing every on-screen string (status "todo")
    python3 fact_check.py <film>.html             # gate: exit 1 unless every string is covered and every entry is settled

facts.json:
    {"topic": "…",
     "claims": [
       {"text": "1185 镰仓幕府", "claim": "Kamakura shogunate founded 1185 (shugo/jitō)", "status": "disputed",
        "sources": ["https://en.wikipedia.org/wiki/Kamakura_shogunate"], "note": "older textbooks: 1192"},
       {"text": "绳文时代", "status": "na", "note": "era name only"}],
     "visual": [
       {"what": "Edo dot sits on the Pacific (SE) coast of Honshu", "shot": 5, "t": 19.9, "status": "verified",
        "sources": ["…"], "still": "s_19.90.jpg"}]}

status: verified (≥1 source URL) · disputed (≥1 source + note naming the other view) · na (no factual content; note says why)
        · todo / unverified → FAIL. `visual` must exist (use [] only when nothing in the picture makes a factual claim:
        maps, positions, flags, uniforms, dates on objects all count).
The gate also fails when a claim's text no longer appears in the film (text changed after it was checked).
"""
import argparse
import json
import re
import sys
from pathlib import Path

CJK = re.compile(r"[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]")
LIT = re.compile(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`([^`]*)`")
DATE = re.compile(r"[~约c.]*\d{2,4}(?:\s*[–-]\s*\d{2,4})?\s*(?:BCE?|CE|AD|s)?")   # bare years / ranges on rulers
OK = {"verified", "disputed", "na"}


def story(html: str) -> str:
    a = html.find("// ═══ STORY")
    b = html.find("// ═══ ENGINE", a)
    if a < 0 or b < 0:
        sys.exit("film has no `// ═══ STORY` … `// ═══ ENGINE` section")
    body = html[a:b]
    body = re.sub(r"(?m)^\s*//.*$", "", body)                  # whole-line comments
    body = re.sub(r"(?<![:'\"\\])//[^'\"\n]*$", "", body, flags=re.M)   # trailing comments without quotes in them
    return body


def on_screen(html: str) -> list:
    """String literals in the story that a viewer can read: anything with CJK, plus bare years/ranges. Template parts split on ${…}."""
    seen, out = set(), []
    for m in LIT.finditer(story(html)):
        s = next(g for g in m.groups() if g is not None)
        for part in re.split(r"\$\{[^}]*\}", s):
            part = part.strip()
            if part and (CJK.search(part) or DATE.fullmatch(part)) and part not in seen:
                seen.add(part)
                out.append(part)
    return out


def check(texts: list, facts: dict) -> list:
    errs, claims = [], facts.get("claims", [])
    by = {c.get("text"): c for c in claims}
    for t in texts:
        if t not in by:
            errs.append(f"UNCHECKED  on-screen text has no claim entry: {t!r}")
    for c in claims:
        t, st = c.get("text"), c.get("status")
        if t not in texts:
            errs.append(f"STALE      claim text not in the film any more: {t!r}")
        if st not in OK:
            errs.append(f"UNSETTLED  {t!r} status={st!r}")
        if st in ("verified", "disputed") and not [s for s in c.get("sources", []) if str(s).startswith("http")]:
            errs.append(f"NO SOURCE  {t!r} is {st} but lists no source URL")
        if st in ("disputed", "na") and not c.get("note"):
            errs.append(f"NO NOTE    {t!r} is {st} but has no note")
    if "visual" not in facts:
        errs.append("NO VISUAL  facts.json has no `visual` list (maps, positions, costumes, objects) — add entries or [] explicitly")
    for v in facts.get("visual", []):
        if v.get("status") not in ("verified", "disputed"):
            errs.append(f"UNSETTLED  visual {v.get('what')!r} status={v.get('status')!r}")
        elif not v.get("sources") and not v.get("still"):
            errs.append(f"NO EVIDENCE visual {v.get('what')!r} needs a source URL or the still it was checked on")
    return errs


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("film", type=Path)
    ap.add_argument("--facts", type=Path, help="default <film>-facts/facts.json")
    ap.add_argument("--init", action="store_true", help="write/extend facts.json with every on-screen string as todo")
    a = ap.parse_args()
    texts = on_screen(a.film.read_text())
    path = a.facts or a.film.with_name(a.film.stem + "-facts") / "facts.json"
    if a.init:
        facts = json.loads(path.read_text()) if path.exists() else {"topic": a.film.stem, "claims": []}
        have = {c["text"] for c in facts["claims"]}
        facts["claims"] += [{"text": t, "claim": "", "status": "todo", "sources": [], "note": ""} for t in texts if t not in have]
        facts.setdefault("visual", None)
        if facts["visual"] is None:
            del facts["visual"]
        path.parent.mkdir(exist_ok=True)
        path.write_text(json.dumps(facts, ensure_ascii=False, indent=1))
        print(f"{len(texts)} on-screen strings → {path} (fill claim/status/sources, add `visual`)")
        return 0
    if not path.exists():
        print(f"FACT CHECK FAIL: {path} missing — run with --init first")
        return 1
    facts = json.loads(path.read_text())
    errs = check(texts, facts)
    disputed = [c for c in facts.get("claims", []) + facts.get("visual", []) if c.get("status") == "disputed"]
    n = {s: sum(c.get("status") == s for c in facts.get("claims", [])) for s in OK}
    print(f"{len(texts)} on-screen strings · verified {n['verified']} · disputed {n['disputed']} · na {n['na']} · visual {len(facts.get('visual', []))}")
    for c in disputed:
        print(f"  disputed: {c.get('text') or c.get('what')} — {c.get('note', '')}")
    for e in errs:
        print("  " + e)
    print("FACT CHECK " + ("FAIL" if errs else "PASS"))
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
