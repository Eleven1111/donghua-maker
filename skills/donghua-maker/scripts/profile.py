#!/usr/bin/env python3
"""Who is the user? The creator profile every donghua skill reads before briefing a film.

  profile.py find                     # prints the profile if one exists; otherwise lists the memory / persona files
                                      # this machine's AI terminals keep (names only — nothing is opened or printed)
  profile.py save --role "…" --tasks "…" [--audience "…"] [--platforms "…"] [--likes "…"] [--avoid "…"] [--lang zh]
  profile.py path                     # where the profile lives

One plain-Markdown file shared by every terminal (Claude Code, Codex, Cursor, WorkBuddy, OpenClaw…):
$DONGHUA_PROFILE, default ~/.config/donghua/profile.md. It stays on this machine; the user can edit or delete it.
references/onboarding.md says when to read it, when to ask, and how it changes the brief."""
import argparse
import os
import sys
from datetime import date
from pathlib import Path

PROFILE = Path(os.environ.get("DONGHUA_PROFILE", Path.home() / ".config" / "donghua" / "profile.md")).expanduser()

# terminal → files that hold what that terminal already knows about its user (checked for existence only)
MEMORY = {
    # Claude Code keeps auto memory per project; only the current folder's is about this user's work here
    "Claude Code": ["~/.claude/CLAUDE.md", "~/.claude/projects/" + str(Path.cwd()).replace("/", "-").replace(".", "-") + "/memory/MEMORY.md"],
    "Codex": ["~/.codex/AGENTS.md", "~/.codex/memories/MEMORY.md"],
    "Cursor": ["~/.cursor/rules/*.md", "~/.cursor/rules/*.mdc"],
    "Gemini CLI / Antigravity": ["~/.gemini/GEMINI.md"],
    "WorkBuddy": ["~/.workbuddy/USER.md", "~/.workbuddy/IDENTITY.md", "~/.workbuddy/MEMORY.md"],
    "CodeBuddy": ["~/.codebuddy/CODEBUDDY.md", "~/.codebuddy/memory/*.md"],
    "OpenClaw": ["~/.openclaw/workspace/USER.md", "~/.openclaw/workspace/MEMORY.md", "~/.openclaw/workspace/IDENTITY.md"],
}
NEXT = """
NEXT (do this before any brief, storyboard or style question):
  1. From your own context or your own terminal's memory file above, take only: background/role, kind of videos,
     audience/platform, style likes/dislikes.
  2. Your next reply MUST open with ONE of these, in the user's language:
     a) found something →「我先了解了一下你：<背景>，平时做<哪类内容>。之后就按这个方向给你做，对吗？」
     b) found nothing  →「第一次用，先简单了解你一下（可跳过）：
                          1. 你是做什么的？（老师 / 自媒体 / 产品或市场 / 学生 / 其他）
                          2. 主要想做哪类动画？（讲课微课 / 短视频 / 产品介绍 / 儿童故事 / 科普 / 艺术短片）
                          3. 给谁看、发在哪里？」
     Topic, format and style questions come after, in the same reply at most.
  3. After the user answers or confirms: profile.py save --role … --tasks … [--audience … --platforms … --likes … --avoid …]
     If the request was already specific, make the film first and do 2–3 at the end instead."""
FIELDS = [("role", "背景 / 身份"), ("tasks", "常做的片子"), ("audience", "给谁看"), ("platforms", "发在哪里"),
          ("likes", "喜欢的风格"), ("avoid", "不要的东西"), ("lang", "语言")]


def candidates() -> dict[str, list[Path]]:
    found = {}
    for term, pats in MEMORY.items():
        hits = []
        for p in pats:
            base = Path(p).expanduser()
            hits += sorted(Path(base.anchor).glob(str(base.relative_to(base.anchor)))) if "*" in p else ([base] if base.is_file() else [])
        if hits:
            found[term] = hits[:5]
    return found


def cmd_find() -> int:
    if PROFILE.is_file():
        print(f"PROFILE {PROFILE}\n")
        print(PROFILE.read_text(encoding="utf-8"))
        return 0
    print(f"NO PROFILE ({PROFILE})")
    found = candidates()
    if found:
        print("memory / persona files on this machine (read only your own terminal's, only for the profile fields):")
        for term, paths in found.items():
            for p in paths:
                print(f"  {term:26} {p}")
    print(NEXT)
    return 2


def cmd_save(a: argparse.Namespace) -> int:
    vals = {k: (getattr(a, k) or "").strip() for k, _ in FIELDS}
    if not vals["role"] or not vals["tasks"]:
        sys.exit("--role and --tasks are required (the two things that change a brief)")
    lines = ["# 动画创作档案（donghua profile）", "",
             f"<!-- written {date.today().isoformat()} by donghua-maker/scripts/profile.py; edit freely or delete to reset -->", ""]
    lines += [f"- **{label}**：{vals[k]}" for k, label in FIELDS if vals[k]]
    PROFILE.parent.mkdir(parents=True, exist_ok=True)
    PROFILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"saved {PROFILE}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("find", help="show the profile, or list memory files to learn from")
    sub.add_parser("path", help="print the profile path")
    sv = sub.add_parser("save", help="write the profile")
    for k, label in FIELDS:
        sv.add_argument(f"--{k}", help=label)
    a = ap.parse_args()
    if a.cmd == "path":
        print(PROFILE)
        return 0
    return cmd_find() if a.cmd == "find" else cmd_save(a)


if __name__ == "__main__":
    sys.exit(main())
