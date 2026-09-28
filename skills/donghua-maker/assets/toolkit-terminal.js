// ═══ TERMINAL toolkit (终端 / 绿屏): a green-phosphor CRT — near-black glass, monospace text on a character grid that types itself
// with a block cursor, boot logs with [ OK ] tags, a shell prompt, progress bars made of block characters, big digits drawn from a
// 5×7 bitmap, oscilloscope bars; the tube adds bloom, scanlines, a slow rolling bar and a curved vignette.
// Pure functions of t. references/looks/terminal.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .05, VIGN_TONE = ['0,10,0', 0, .7];
const TM = { glass: '#050b06', fg: '#6dff8e', dim: 'rgba(109,255,142,.45)', faint: 'rgba(109,255,142,.16)', warn: '#ffcf5c', err: '#ff6b5c', cell: 40, row: 74, x0: 170, y0: 200 };
const tmFont = (size = TM.cell * 1.62, w = 500) => `${w} ${size}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}monospace`;
function tmScreen(g) { g.fillStyle = TM.glass; g.fillRect(-300, -300, W + 600, H + 600); const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .6); gr.addColorStop(0, 'rgba(40,90,50,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
// every glyph sits on a fixed cell grid (CJK and full-width take two cells), so columns line up whatever the font
const tmCells = ch => (ch.codePointAt(0) >= 0x2E80 ? 2 : 1);
function tmText(g, str, x, y, col, cw = TM.cell) { g.fillStyle = col; let c = 0; for (const ch of str) { const w = tmCells(ch); g.textAlign = 'center'; g.fillText(ch, x + (c + w / 2) * cw, y); c += w; } g.textAlign = 'left'; return x + c * cw; }
// a script of lines: {t, s, col, cps (chars/s, 0 = instant), prompt, tag, tagCol} → draws those started by time t, one grid row each.
// Returns the cursor [x, y, typing] after the last visible line.
function tmLines(g, lines, t, o = {}) { const x0 = o.x0 ?? TM.x0, y0 = o.y0 ?? TM.y0, row = o.row ?? TM.row, cw = o.cw ?? TM.cell; g.save(); g.font = tmFont(o.size); g.textBaseline = 'alphabetic'; g.shadowColor = TM.fg; g.shadowBlur = 12; let cur = null, r = 0;
  lines.forEach(L => { if (t < L.t) return; const cps = L.cps ?? 0, chars = [...L.s], n = cps ? Math.min(chars.length, Math.floor((t - L.t) * cps)) : chars.length, y = y0 + r * row; let x = x0;
    if (L.tag) { x = tmText(g, '[ ', x, y, TM.dim, cw); x = tmText(g, L.tag.padEnd(4, ' '), x, y, L.tagCol ?? TM.fg, cw); x = tmText(g, ' ] ', x, y, TM.dim, cw); }
    if (L.prompt) x = tmText(g, o.prompt ?? 'user@crt:~$ ', x, y, TM.dim, cw); x = tmText(g, chars.slice(0, n).join(''), x, y, L.col ?? TM.fg, cw); cur = [x, y, n < chars.length]; r++; });
  g.restore(); return cur; }
// block cursor, blinking at ~2 Hz unless typing
function tmCursor(g, p, t) { if (!p) return; if (!p[2] && Math.floor(t * 2.2) % 2) return; g.save(); g.fillStyle = TM.fg; g.shadowColor = TM.fg; g.shadowBlur = 16; g.fillRect(p[0] + 6, p[1] - TM.cell * 1.3, TM.cell * .9, TM.cell * 1.55); g.restore(); }
// progress bar: [■■■□□□]  42% — cells drawn as boxes on the grid (no font dependence); k 0..1
function tmBar(g, x, y, cells, k, o = {}) { const cw = o.cw ?? TM.cell, n = Math.round(cells * clamp(k, 0, 1)); g.save(); g.font = tmFont(o.size); g.shadowColor = TM.fg; g.shadowBlur = 10; tmText(g, '[', x, y, TM.dim, cw);
  for (let i = 0; i < cells; i++) { g.fillStyle = i < n ? TM.fg : TM.faint; g.fillRect(x + (i + 1) * cw + 3, y - cw * 1.2, cw - 6, cw * 1.3); } tmText(g, `] ${String(Math.round(k * 100)).padStart(3, ' ')}%`, x + (cells + 1) * cw, y, TM.dim, cw); g.restore(); }
// 5×7 bitmap digits for big block numerals
const TM_DIG = { 0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111', 3: '11110000010000101110000010000111110', 4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110', 6: '00110010001000011110100011000101110', 7: '11111000010001000100010000100001000', 8: '01110100011000101110100011000101110', 9: '01110100011000101111000010001001100' };
function tmBig(g, ch, x, y, cell, k = 1) { const b = TM_DIG[ch]; if (!b) return; g.save(); g.fillStyle = TM.fg; g.shadowColor = TM.fg; g.shadowBlur = cell * .6; for (let i = 0; i < 35; i++) if (b[i] === '1' && hash(i, ch.charCodeAt(0)) < k * 1.2) g.fillRect(x + (i % 5) * cell, y + Math.floor(i / 5) * cell, cell - 3, cell - 3); g.restore(); }
// oscilloscope bars: n bars across w, heights from fn(u) (0..1)
function tmScope(g, x, y, w, h, n, fn) { g.save(); g.fillStyle = TM.fg; g.shadowColor = TM.fg; g.shadowBlur = 10; const bw = w / n; for (let i = 0; i < n; i++) { const a = clamp(fn(i / (n - 1)), 0, 1) * h; g.globalAlpha = .45 + .55 * a / h; g.fillRect(x + i * bw + 1, y - a / 2, bw - 3, Math.max(2, a)); } g.restore(); }
// framed box (single-line box drawing) with a title, k draws it on
function tmBox(g, x, y, w, h, title, k = 1) { if (k <= 0) return; g.save(); g.strokeStyle = TM.fg; g.shadowColor = TM.fg; g.shadowBlur = 10; g.lineWidth = 3; const P = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], L = (w + h) * 2 * clamp(k, 0, 1); let s = 0; g.beginPath(); g.moveTo(x, y);
  for (let i = 1; i < 5; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (s + d <= L) { g.lineTo(...P[i]); s += d; } else { const f = (L - s) / d; g.lineTo(lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)); break; } } g.stroke();
  if (title && k > .3) { g.font = tmFont(TM.cell * 1.3); const tw = [...` ${title} `].reduce((a, c) => a + tmCells(c), 0) * TM.cell * .8; g.fillStyle = TM.glass; g.fillRect(x + 40, y - 22, tw, 44); tmText(g, ` ${title} `, x + 40, y + 12, TM.fg, TM.cell * .8); } g.restore(); }
// tube pass (screen space, call last): scanlines, a slow rolling bright band, faint horizontal jitter lines
function tmTube(g, t) { const s = g.canvas.width / W; g.save(); g.setTransform(s, 0, 0, s, 0, 0); g.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2.5);
  const ry = ((t * .18) % 1.3 - .15) * H, gr = g.createLinearGradient(0, ry - 140, 0, ry + 140); gr.addColorStop(0, 'rgba(120,255,150,0)'); gr.addColorStop(.5, 'rgba(120,255,150,.05)'); gr.addColorStop(1, 'rgba(120,255,150,0)'); g.fillStyle = gr; g.fillRect(0, ry - 140, W, 280);
  const e = g.createRadialGradient(W / 2, H / 2, H * .55, W / 2, H / 2, W * .62); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = e; g.fillRect(0, 0, W, H); g.restore(); }
