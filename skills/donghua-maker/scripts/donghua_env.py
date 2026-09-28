"""Where donghua scripts look for keys and settings — one place, same order for every script and every user:
  1. the process environment (export MINIMAX_API_KEY=…)
  2. ./.env in the folder you run from (your film project)
  3. ~/.config/donghua/.env (per-user; $DONGHUA_ENV overrides the path)
  4. $SECRETS_ENV or ~/.config/secrets/.env (older setups)
Values are returned, never printed. Template: <repo>/.env.example; guide: references/setup.md."""
import os
from pathlib import Path

USER_ENV = Path(os.environ.get("DONGHUA_ENV", Path.home() / ".config" / "donghua" / ".env")).expanduser()


def env_files() -> list[Path]:
    legacy = Path(os.environ.get("SECRETS_ENV", Path.home() / ".config" / "secrets" / ".env")).expanduser()
    return [Path.cwd() / ".env", USER_ENV, legacy]


def _read(path: Path, name: str) -> str | None:
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            k, sep, v = line.partition("=")
            if sep and k.strip().removeprefix("export ").strip() == name and v.strip():
                return v.strip().strip('"').strip("'")
    except OSError:
        return None
    return None


def get(name: str, default: str | None = None) -> str | None:
    """The first non-empty value for `name`, or `default`."""
    if os.environ.get(name):
        return os.environ[name]
    for f in env_files():
        if f.is_file():
            v = _read(f, name)
            if v:
                return v
    return default


def where(name: str) -> str | None:
    """Which source holds `name` (for doctor.py) — the source, never the value."""
    if os.environ.get(name):
        return "environment"
    for f in env_files():
        if f.is_file() and _read(f, name):
            return str(f)
    return None


def require(name: str, why: str) -> str:
    v = get(name)
    if not v:
        raise SystemExit(f"missing {name} ({why}). Put `{name}=…` in {USER_ENV} (chmod 600), "
                         f"or in ./.env of your film folder, or export it. See references/setup.md.")
    return v
