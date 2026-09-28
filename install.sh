#!/usr/bin/env bash
# Install the donghua skills (and, where the terminal supports them, the director agents) into one or more AI terminals.
# Every terminal below reads the same Agent Skills format (agentskills.io), so the files are copied unchanged.
#   ./install.sh claude codex cursor           # named terminals, user-level
#   ./install.sh --all                         # every terminal whose config folder already exists
#   ./install.sh --project ~/work/myrepo       # workspace-level: <dir>/.agents/skills (Antigravity, Codex, many others)
#   ./install.sh --dest ~/some/skills          # any other agent: give its skills folder
#   ./install.sh --uninstall claude            # remove what this script installed
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS=(donghua-maker donghua-classroom donghua-creator)

# terminal → "skills-dir|agents-dir" (agents-dir empty = no markdown subagents; directors run inline from the skill)
target() {
  case "$1" in
    claude)      echo "$HOME/.claude/skills|$HOME/.claude/agents" ;;
    cursor)      echo "$HOME/.cursor/skills|$HOME/.cursor/agents" ;;
    codex)       echo "$HOME/.codex/skills|" ;;
    antigravity) echo "$HOME/.gemini/antigravity/skills|" ;;
    gemini)      echo "$HOME/.gemini/skills|" ;;
    workbuddy)   echo "$HOME/.workbuddy/skills|" ;;
    codebuddy)   echo "$HOME/.codebuddy/skills|" ;;
    openclaw)    echo "$HOME/.openclaw/skills|" ;;
    *) return 1 ;;
  esac
}
ALL=(claude cursor codex antigravity gemini workbuddy codebuddy openclaw)

usage() { sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; echo "terminals: ${ALL[*]}"; exit "${1:-0}"; }

install_to() {  # $1 skills dir, $2 agents dir (may be empty), $3 label
  local sd="$1" ad="$2" label="$3"
  mkdir -p "$sd"
  for s in "${SKILLS[@]}"; do
    rm -rf "${sd:?}/$s"
    cp -R "$REPO/skills/$s" "$sd/$s"
  done
  # the director playbooks travel inside the base skill so terminals without subagents can follow them inline
  mkdir -p "$sd/donghua-maker/directors"
  cp "$REPO"/agents/*.md "$sd/donghua-maker/directors/"
  if [ -n "$ad" ]; then
    mkdir -p "$ad"
    cp "$REPO"/agents/*.md "$ad/"
  fi
  echo "✓ $label → $sd${ad:+  (+ agents → $ad)}"
}

uninstall_from() {
  local sd="$1" ad="$2" label="$3"
  for s in "${SKILLS[@]}"; do rm -rf "${sd:?}/$s"; done
  if [ -n "$ad" ]; then for a in "$REPO"/agents/*.md; do rm -f "$ad/$(basename "$a")"; done; fi
  echo "✓ removed from $label"
}

[ $# -eq 0 ] && usage 1
mode=install; names=()
while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage ;;
    --uninstall) mode=uninstall ;;
    --all) for t in "${ALL[@]}"; do d="$(target "$t")"; [ -d "$(dirname "${d%%|*}")" ] && names+=("$t"); done ;;
    --project) shift; [ -d "${1:-}" ] || { echo "no such folder: ${1:-}" >&2; exit 1; }
               install_to "$(cd "$1" && pwd)/.agents/skills" "" "project $1"; [ $# -eq 1 ] && exit 0 ;;
    --dest) shift; [ -n "${1:-}" ] || usage 1; install_to "$1" "" "custom"; [ $# -eq 1 ] && exit 0 ;;
    *) target "$1" >/dev/null || { echo "unknown terminal: $1" >&2; usage 1; }; names+=("$1") ;;
  esac
  shift
done

for t in "${names[@]+"${names[@]}"}"; do
  d="$(target "$t")"
  if [ "$mode" = install ]; then install_to "${d%%|*}" "${d#*|}" "$t"; else uninstall_from "${d%%|*}" "${d#*|}" "$t"; fi
done
[ "$mode" = install ] && echo "Restart the terminal's session so it picks up the skills. Check deps: python3 tools/validate.py"
exit 0
