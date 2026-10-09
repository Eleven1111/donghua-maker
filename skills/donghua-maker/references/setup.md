# Setup: a new machine, a new user

Nothing here is tied to one person's machine. Run the doctor first; it checks everything below and prints the exact install command for this OS.
```bash
python3 <skill-dir>/scripts/doctor.py            # offline checks
python3 <skill-dir>/scripts/doctor.py --online   # + one real edge-tts word and the font source
```
`DOCTOR PASS` = films can be made and checked. Each ✗ names the feature it blocks; install only what the user needs, and ask before installing anything (it changes their machine).

## What needs what
| feature | needs | without it |
|---|---|---|
| make + check films (core) | Python 3.10+, `ffmpeg`, `pip install playwright` + Chrome or `python3 -m playwright install chromium` | nothing works — install first |
| free narration + subtitles (`narrate.py`) | `pip install edge-tts`, network to Microsoft's TTS | silent film, or MiniMax |
| MiniMax narration (`voice.py`, paid, opt-in) | `MINIMAX_API_KEY` | use edge-tts |
| commercial-safe fonts (`font_embed.py`) | `pip install fonttools`; font files downloaded once to `~/.cache/donghua-fonts/` | system fonts; not safe to publish |
| generated background music (`music_render.py`) | `fluidsynth` + a SoundFont (`SOUNDFONT`) | recorded music beds / synth fallback |
| stem music (`music_render.py --stems`, optional) | `pip install mido soundfile pedalboard`; `sfizz_render`; Surge XT (`SURGE_VST3`) | the one-pass fluidsynth path above (`references/audio.md` §7) |
| found sound effects (`sfx_search.py`) | `pip install numpy`; `FREESOUND_API_KEY` optional | code-synthesised sounds |

All Python packages at once: `pip install -r requirements.txt` (repo root).

## Keys and settings
Every script reads them the same way (`scripts/donghua_env.py`): **environment → `./.env` in the film folder → `~/.config/donghua/.env` → `~/.config/secrets/.env`**. Template: `.env.example` at the repo root.
- Put keys in `~/.config/donghua/.env`, then `chmod 600` it. Never in a film, a skill file or a commit.
- An agent never reads, prints or echoes a key. To help a user add one, tell them the file and the line (`MINIMAX_API_KEY=…`) and let them paste it; if they paste a key into the chat, write it to that file for them, replace it with a placeholder everywhere else, and remind them to rotate it.
- MiniMax region: mainland accounts use the default endpoint; international accounts add `MINIMAX_API_BASE=https://api.minimax.io`. The model defaults to the one named in `narration.md`; override with `MINIMAX_TTS_MODEL`.

## Fonts when GitHub is slow or blocked
`font_embed.py` tries, in order: the cache → `DONGHUA_FONT_DIR` (a folder holding the `.ttf` files) → `DONGHUA_FONT_MIRROR` + the GitHub URL → GitHub → jsDelivr (works for Noto Sans SC and all licence files; WenKai is a release asset and Noto Serif SC is over jsDelivr's size limit). If all fail it prints the file name and URL to download by hand:
- LXGW WenKai: `LXGWWenKai-Regular.ttf` from the LxgwWenKai GitHub releases page (also on Gitee mirrors of the project).
- Noto Sans SC / Noto Serif SC: from Google Fonts (`NotoSansSC-wght.ttf`, `NotoSerifSC-wght.ttf`).
Save them into `DONGHUA_FONT_DIR` or `~/.cache/donghua-fonts/` with those names.

## SoundFont
GeneralUser GS (free licence) from its author's site; save as `~/.local/share/soundfonts/GeneralUser-GS.sf2` or point `SOUNDFONT` at any `.sf2`.

## First use, in order
1. `doctor.py` → fix the core if it fails (ask before installing).
2. `profile.py find` → who the user is (`onboarding.md`).
3. If the user's profile implies narration (teacher, creator), make sure edge-tts passes `doctor.py --online`; mention MiniMax only if they want a premium voice.
