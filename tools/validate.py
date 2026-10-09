#!/usr/bin/env python3
"""Repo gate: every skill follows the Agent Skills spec (agentskills.io), every path a skill points at exists,
every script compiles and answers --help, every look scaffolds into a film whose JavaScript parses, and no secret
or machine-specific path is committed. Exit 0 = PASS. Run locally and in CI: python3 tools/validate.py"""
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = sorted(p for p in (ROOT / "skills").iterdir() if (p / "SKILL.md").exists())
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
SECRET_RE = re.compile(r"(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{30,}\.|-----BEGIN [A-Z ]*PRIVATE KEY)")
MAX_DESC, MAX_LINES, MAX_BODY_BYTES = 1024, 500, 20000
errors: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def frontmatter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        fail(f"{path.relative_to(ROOT)}: no YAML frontmatter")
        return {}
    fields = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        if v and not line.startswith(" "):
            fields[k.strip()] = v.strip().strip('"')
    return fields


def check_spec(skill: Path) -> None:
    md = skill / "SKILL.md"
    fm = frontmatter(md)
    name, desc = fm.get("name", ""), fm.get("description", "")
    rel = md.relative_to(ROOT)
    if not NAME_RE.match(name) or len(name) > 64:
        fail(f"{rel}: name {name!r} breaks the spec (a-z0-9 and single hyphens, ≤64)")
    if name != skill.name:
        fail(f"{rel}: name {name!r} must match its folder {skill.name!r}")
    if not 0 < len(desc) <= MAX_DESC:
        fail(f"{rel}: description is {len(desc)} chars (spec: 1–{MAX_DESC})")
    if len(fm.get("compatibility", "")) > 500:
        fail(f"{rel}: compatibility is over 500 chars")
    text = md.read_text(encoding="utf-8")
    if text.count("\n") > MAX_LINES:
        fail(f"{rel}: {text.count(chr(10))} lines (keep SKILL.md ≤ {MAX_LINES}; move detail to references/)")
    if len(text.encode()) > MAX_BODY_BYTES:
        fail(f"{rel}: {len(text.encode())} bytes (≈ >5k tokens; move detail to references/)")


def check_links(skill: Path) -> None:
    """Backticked skill-relative paths (references/…, scripts/…, assets/…) must exist in this skill or a sibling."""
    for doc in [skill / "SKILL.md", *sorted((skill / "references").rglob("*.md"))]:
        for ref in set(re.findall(r"`(?:<skill-dir>/)?((?:references|scripts|assets)/[A-Za-z0-9_./-]+?)`", doc.read_text(encoding="utf-8"))):
            if "<" in ref or "*" in ref or ref.endswith("/"):
                continue
            if not any((base / ref).exists() for base in (skill, ROOT / "skills" / "donghua-maker")):
                fail(f"{doc.relative_to(ROOT)}: points at missing `{ref}`")


def check_scripts() -> None:
    for py in sorted(ROOT.glob("skills/*/scripts/*.py")):
        rel = py.relative_to(ROOT)
        r = subprocess.run([sys.executable, "-m", "py_compile", str(py)], capture_output=True, text=True)
        if r.returncode:
            fail(f"{rel}: does not compile\n{r.stderr}")
            continue
        r = subprocess.run([sys.executable, str(py), "--help"], capture_output=True, text=True, timeout=60)
        if r.returncode:
            fail(f"{rel}: --help exits {r.returncode}: {(r.stderr or r.stdout).strip()[-300:]}")


def js_parses(html: Path) -> str:
    """Return '' when every inline <script> in the film parses under node --check, else the error."""
    scripts = re.findall(r"<script>(.*?)</script>", html.read_text(encoding="utf-8"), re.S)
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write("\n;\n".join(scripts))
    r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
    Path(f.name).unlink()
    return r.stderr.strip()[-400:] if r.returncode else ""


def check_scaffold() -> None:
    """Smoke test: the plain engine and every look toolkit scaffold into a film with no leftover {{…}} and valid JS."""
    if not shutil.which("node"):
        fail("node not found: needed to parse scaffolded films (install Node ≥ 18)")
        return
    maker = ROOT / "skills" / "donghua-maker"
    # toolkit-scroll is a film format, scaffolded with --scroll (below), not a --look
    looks = [None, *sorted(p.stem.removeprefix("toolkit-") for p in (maker / "assets").glob("toolkit-*.js") if p.stem != "toolkit-scroll"), "scroll-format"]
    with tempfile.TemporaryDirectory() as tmp:
        for look in looks:
            out = Path(tmp) / f"{look or 'plain'}.html"
            cmd = [sys.executable, str(maker / "scripts" / "scaffold.py"), str(out), "--title", "T",
                   "--shots", "A,B", "--durs", "2.5,2.5", "--bpm", "96", *(["--look", look] if look else [])]
            if look == "scroll-format":
                cmd = cmd[:-2] + ["--shots", "A,B,C", "--durs", "2.5,2.5,2.5", "--scroll", "paper,inkwash,ukiyoe"]
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if r.returncode or not out.exists():
                fail(f"scaffold --look {look}: exit {r.returncode}: {(r.stderr or r.stdout).strip()[-300:]}")
                continue
            left = set(re.findall(r"\{\{[A-Z_]+\}\}", out.read_text(encoding="utf-8")))
            if left:
                fail(f"scaffold --look {look}: unfilled placeholders {sorted(left)}")
            err = js_parses(out)
            if err:
                fail(f"scaffold --look {look}: JavaScript does not parse: {err}")
    print(f"  scaffolded {len(looks)} films (plain + {len(looks) - 2} looks + the long-scroll format)")
    check_chapters(maker)


def check_chapters(maker: Path) -> None:
    """chapters.py: init → fill one chapter → build parses; an empty chapter builds as a placeholder."""
    with tempfile.TemporaryDirectory() as tmp:
        d, py = Path(tmp) / "film", maker / "scripts" / "chapters.py"
        r = subprocess.run([sys.executable, str(py), "init", str(d), "--title", "T", "--bpm", "96", "--chapters", "A:2.5,B:2.5"],
                           capture_output=True, text=True, timeout=60)
        if r.returncode:
            return fail(f"chapters.py init: {(r.stderr or r.stdout).strip()[-300:]}")
        (d / "ch" / "01-A.js").write_text("const k = 1;\nshot({ name: 'a', t0: 0, t1: 2.5, cam() { return { x: W / 2, y: H / 2, z: k }; }, build() {}, reset() {}, step() {}, snap() {}, draw() {}, score() { return []; } });\n")
        r = subprocess.run([sys.executable, str(py), "build", str(d)], capture_output=True, text=True, timeout=60)
        out = d / "film.html"
        if r.returncode or not out.exists():
            return fail(f"chapters.py build: exit {r.returncode}: {(r.stderr or r.stdout).strip()[-300:]}")
        err = js_parses(out)
        if err:
            fail(f"chapters.py build: JavaScript does not parse: {err}")
        if out.read_text(encoding="utf-8").count("chapterClose(CH); })();") != 2:   # parsing alone misses a chapter that never runs
            fail("chapters.py build: not every chapter is wrapped in an invoked function")
    print("  built a two-chapter film (chapters.py)")


def check_hygiene() -> None:
    tracked = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True).stdout.split()
    for f in tracked:
        p = ROOT / f
        if p.suffix not in {".md", ".py", ".js", ".sh", ".json", ".yml", ".toml"} or not p.exists():
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        if SECRET_RE.search(text):
            fail(f"{f}: looks like a committed secret")
        if f.startswith(("skills/", "agents/")) and "~/.claude/skills/" in text:
            fail(f"{f}: hardcoded ~/.claude/skills path (use <skill-dir>/ or <skills-root>/ so other agents work)")


def main() -> int:
    for skill in SKILLS:
        check_spec(skill)
        check_links(skill)
    print(f"  {len(SKILLS)} skills checked against the Agent Skills spec")
    check_scripts()
    check_scaffold()
    check_hygiene()
    for e in errors:
        print("FAIL", e)
    print("VALIDATE PASS" if not errors else f"VALIDATE FAIL ({len(errors)})")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
