# Look: terminal / 绿屏终端

A green-phosphor CRT: near-black glass and monospace text on a fixed character grid. Lines type themselves with a block cursor. There are boot logs with `[ OK ]` and amber `[ WARN ]` tags, a shell prompt, progress bars made of cells, big digits from a 5×7 bitmap, oscilloscope bars and single-line boxes. The tube adds bloom, scanlines, a slow rolling bright band and a curved vignette. The ASCII look (`ascii`) turns pictures into characters; this look is the terminal *interface* itself.

Verified in 咖啡机 (`assets/example-terminal.html`, 16:9, 12 s, 3 shots, 120 bpm): a boot log with a no-cup warning, a brew progress bar with a 3·2·1 countdown, and a cup in characters with steam.

## Toolkit (`toolkit-terminal.js`)
| call | what it does |
|---|---|
| `tmScreen(g)`, `tmTube(g, t)` | glass background; the tube pass (call last) |
| `tmLines(g, lines, t, {x0, y0, row, size, cw, prompt})` | script lines `{t, s, cps, prompt, tag, tagCol, col}`; returns the cursor |
| `tmText(g, str, x, y, col, cw)` | per-glyph grid placement (CJK = 2 cells) |
| `tmCursor(g, p, t)` | block cursor (solid while typing, blinking when idle) |
| `tmBar(g, x, y, cells, k)`, `tmBig(g, digit, x, y, cell, k)`, `tmScope`, `tmBox` | progress bar, bitmap digits, scope bars, box with a title |

## Rules
- Every glyph goes on the grid through `tmText`. The embedded CJK font is proportional, so plain `fillText` breaks the columns. The embedded font must still come first in the stack; do not rely on system monospace fonts (licence).
- Use one hue (phosphor green) plus amber for warnings. Everything else is a dimmer green.
- Typing is the motion. Pace lines on the beat and give the prompt a `typing` sound.

## Pitfalls met while building it
- The first grid (30 px cells) filled only the top-left corner. Use 40 px cells / 74 px rows for 2560-wide frames.
