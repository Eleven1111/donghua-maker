// ═══ OPSBOARD toolkit (控制台大屏): an AI pipeline watched live — near-black glass split into hairline panels, monospace
// text, tokens marked with coloured tags, routes flying from a document across a fan of ticks into one card per worker,
// and every counter on screen driven by one number. One long take; the picture lives by many small things ticking.
// Pure functions of their arguments. references/looks/opsboard.md
const SMOOTH_DEFAULT = true, POST_GRAIN = 0, VIGN_TONE = ['0,0,0', .05, .35];
const OB = {
  bg: '#0a0b0d', panel: '#0e1013', line: '#24272d', text: '#c8ccd2', dim: '#6c717a', faint: '#3a3e45', white: '#eef0f3',
  pink: '#ff4f8f', green: '#35d39a', orange: '#ff8a5b', yellow: '#f6c94c', cyan: '#3fb8ff', red: '#ff5f57',
  mono: '"SF Mono", Menlo, Consolas, "PingFang SC", "Noto Sans CJK SC", monospace',
};
// embedded faces first, in their order: font_embed.py --fonts jetbrainsmono,notosans → Latin from the mono, CJK from the sans
const obFont = (size, w = 500) => `${w} ${size}px ${(window.EMBED_FONTS || []).map(f => `"${f}", `).join('')}${OB.mono}`;
const obFmt = n => Math.round(n).toLocaleString('en-US');
function obBg(g) { g.fillStyle = OB.bg; g.fillRect(-300, -300, W + 600, H + 600); }
// text; returns the x after it
function obText(g, s, x, y, col = OB.text, size = 18, w = 500, align = 'left') {
  g.font = obFont(size, w); g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); g.textAlign = 'left';
  return align === 'left' ? x + g.measureText(s).width : x;
}
// a run of [text, colour] pieces on one baseline
function obRun(g, parts, x, y, size = 18, w = 500) { for (const [s, c] of parts) x = obText(g, s, x, y, c, size, w); return x; }
// hairline panel with a "▪ title" header and an optional right-hand note
function obPanel(g, x, y, w, h, title, note) {
  g.fillStyle = OB.panel; g.fillRect(x, y, w, h); g.strokeStyle = OB.line; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  if (title) { g.fillStyle = OB.dim; g.fillRect(x + 16, y + 20, 7, 7); obText(g, title, x + 32, y + 29, OB.dim, 15); }
  if (note) obText(g, note, x + w - 16, y + 29, OB.dim, 15, 500, 'right');
}
// a tagged token: kind 'pink' | 'white' (filled, dark text) · 'green' | 'orange' | 'cyan' (outlined, tinted fill); returns [x1, box]
const OB_TAG = { pink: [OB.pink, '#14060b', 1], white: [OB.white, '#0b0c0e', 1], green: [OB.green, '#d8fff0', 0], orange: [OB.orange, '#ffe6da', 0], cyan: [OB.cyan, '#e0f4ff', 0] };
function obTag(g, s, x, y, kind, size = 18, k = 1) {
  g.font = obFont(size); const w = g.measureText(s).width, [c, fg, fill] = OB_TAG[kind], bx = x - 4, by = y - size * .92, bw = w + 8, bh = size * 1.22;
  g.save(); g.globalAlpha *= clamp(k, 0, 1);
  if (fill) { g.fillStyle = c; g.fillRect(bx, by, bw, bh); } else { g.fillStyle = c + '30'; g.fillRect(bx, by, bw, bh); g.strokeStyle = c; g.lineWidth = 2; g.strokeRect(bx, by, bw, bh); }
  g.restore(); obText(g, s, x, y, fg, size); return [x + w + 8, { x: bx, y: by, w: bw, h: bh }];
}
// a document pane: lines = [[piece…]], piece = 'text' | ['token', kind]; tags appear once `tagK(lineIdx, pieceIdx)` > 0.
// Returns the tag boxes (for routes), each with {line, i, kind, box}.
function obDoc(g, x, y, w, h, o) {
  const { title, note, lines, size = 19, row = 36, scroll = 0, tagK = () => 1 } = o, boxes = [];
  obPanel(g, x, y, w, h); [OB.red, OB.yellow, OB.green].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + 24 + i * 22, y + 24, 6.5, 0, TAU); g.fill(); });
  obText(g, title, x + 100, y + 31, OB.white, 17, 600); if (note) obText(g, note, x + w - 16, y + 31, OB.dim, 14, 500, 'right');
  g.save(); g.beginPath(); g.rect(x + 2, y + 50, w - 4, h - 52); g.clip();
  const first = Math.floor(scroll), off = (scroll - first) * row;
  for (let r = 0; r < Math.ceil((h - 60) / row) + 1; r++) {
    const li = first + r, L = lines[li], ly = y + 50 + 30 + r * row - off; if (!L) continue;
    obText(g, String(li % 99 + 1).padStart(2, ' '), x + 14, ly, OB.faint, size * .85);
    let cx = x + 56; const head = typeof L[0] === 'string' && L[0].startsWith('##');
    L.forEach((p, pi) => {
      if (typeof p === 'string') { cx = obText(g, p, cx, ly, head ? OB.pink : OB.text, size, head ? 600 : 500); return; }
      const k = tagK(li, pi); if (k <= 0) { cx = obText(g, p[0], cx, ly, head ? OB.pink : OB.text, size, head ? 600 : 500); return; }
      const [x1, box] = obTag(g, p[0], cx + 4, ly, p[1], size, k); boxes.push({ line: li, i: pi, kind: p[1], box }); cx = x1;
    });
  }
  g.restore(); return boxes;
}
// the fan: an arc of n ticks, one per page; ticks[i] = null (unread) | colour; centre (cx, cy), radius r, ±span rad
function obFanPt(f, i, d = 0) { const a = -f.span + 2 * f.span * (i + .5) / f.n; return [f.cx + (f.r + d) * Math.cos(a), f.cy + (f.r + d) * Math.sin(a)]; }
function obFan(g, f, ticks, head = -1) {
  g.save(); g.lineCap = 'butt';
  g.strokeStyle = OB.faint; g.lineWidth = 1.5; g.beginPath(); g.arc(f.cx, f.cy, f.r - 14, -f.span - .01, f.span + .01); g.stroke();
  g.strokeStyle = OB.line; g.beginPath(); g.arc(f.cx, f.cy, f.r + 74, -f.span - .01, f.span + .01); g.stroke();
  for (let i = 0; i < f.n; i++) {
    const c = ticks[i], len = c ? 14 + 52 * hash(i, 7) ** 1.6 : 8, [x0, y0] = obFanPt(f, i, -6), [x1, y1] = obFanPt(f, i, -6 + len);
    g.strokeStyle = c || OB.faint; g.globalAlpha = c ? .95 : .5; g.lineWidth = c ? 3.2 : 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  if (head >= 0) { const [x0, y0] = obFanPt(f, head, -10), [x1, y1] = obFanPt(f, head, 80); g.globalAlpha = 1; g.strokeStyle = OB.white; g.lineWidth = 3; g.shadowColor = OB.white; g.shadowBlur = 12; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.restore();
}
// a route: a thin curve from a to b bowing through the gap; k 0..1 grows it from a; alpha a
function obRoute(g, a, b, col, k = 1, alpha = .55, lw = 1.6) {
  if (k <= 0) return; const mx = lerp(a[0], b[0], .5), c1 = [mx, a[1]], c2 = [mx, b[1]], P = u => { const v = 1 - u; return [v * v * v * a[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * b[0], v * v * v * a[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * b[1]]; };
  g.save(); g.strokeStyle = col; g.globalAlpha = alpha; g.lineWidth = lw; g.beginPath(); g.moveTo(...a); const m = Math.max(2, Math.ceil(24 * k));
  for (let j = 1; j <= m; j++) g.lineTo(...P(k * j / m)); g.stroke();
  if (k < 1) { const p = P(k); g.globalAlpha = 1; g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 3.5, 0, TAU); g.fill(); }
  g.restore();
}
// a small label chip (pink fill or outlined) placed on a route or the fan
function obChip(g, s, x, y, kind = 'pink', size = 13) { obTag(g, s, x, y, kind, size); }
// a worker card: coloured frame, a header strip, an icon, the running count, "→ who" and a dim footnote
function obCard(g, x, y, w, h, o) {
  const { col, head, icon, value, who, sub, fillHead = true, glow = 0 } = o;
  g.save(); g.fillStyle = OB.panel; g.fillRect(x, y, w, h); g.strokeStyle = col; g.lineWidth = 3; if (glow) { g.shadowColor = col; g.shadowBlur = 24 * glow; } g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); g.restore();
  if (fillHead) { g.fillStyle = col; g.fillRect(x, y, w, 30); obText(g, head, x + 12, y + 21, '#0b0c0e', 15, 600); } else obText(g, head, x + 14, y + 24, OB.text, 15, 600);
  const iy = y + 44; if (icon) icon(g, x + 16, iy, 96, col);
  if (value != null) obText(g, obFmt(value), x + w - 16, h < 160 ? y + h / 2 + 14 : iy + 64, col === OB.white ? OB.white : col, 40, 600, 'right');
  if (who) obText(g, '→ ' + who, x + 16, iy + 128, OB.white, 17, 600);
  if (sub) obText(g, sub, x + 16, iy + 158, OB.dim, 13);
}
// generic worker icons (no brand marks): a knot, a ghost, a pixel critter
const OB_ICON = {
  knot(g, x, y, s, c) { g.fillStyle = c; g.beginPath(); g.arc(x + s / 2, y + s / 2, s / 2, 0, TAU); g.fill(); g.strokeStyle = '#14060b'; g.lineWidth = s * .07; g.lineJoin = 'round';
    for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * TAU + k * TAU / 3; g.lineTo(x + s / 2 + Math.cos(a) * s * (.18 + .08 * k), y + s / 2 + Math.sin(a) * s * (.18 + .08 * k)); } g.stroke(); } },
  ghost(g, x, y, s, c) { g.fillStyle = OB.white; g.beginPath(); g.roundRect(x, y, s, s, s * .22); g.fill(); g.fillStyle = '#0b0c0e'; g.beginPath(); g.ellipse(x + s * .5, y + s * .52, s * .36, s * .3, 0, 0, TAU); g.fill();
    g.fillStyle = OB.white; g.beginPath(); g.ellipse(x + s * .4, y + s * .48, s * .05, s * .09, 0, 0, TAU); g.ellipse(x + s * .6, y + s * .48, s * .05, s * .09, 0, 0, TAU); g.fill(); },
  critter(g, x, y, s, c) { const m = ['0011111100', '0111111110', '1101111011', '1111111111', '0111111110', '0101001010', '1000000001'], q = s / 10; g.fillStyle = c;
    m.forEach((r, j) => [...r].forEach((b, i) => { if (b === '1') g.fillRect(x + i * q, y + s * .15 + j * q, q + .5, q + .5); })); },
};
// a horizontal meter row: label · bar · value
function obMeter(g, x, y, w, label, k, value, col) {
  obText(g, label, x, y, OB.text, 16); const bx = x + w * .42, bw = w * .46; g.fillStyle = OB.faint; g.fillRect(bx, y - 9, bw, 7); g.fillStyle = col; g.fillRect(bx, y - 9, bw * clamp(k, 0, 1), 7);
  obText(g, obFmt(value), x + w, y, OB.text, 16, 500, 'right');
}
// sparkline of values 0..1 over n points, with a dashed average line
function obSpark(g, x, y, w, h, vals, col) {
  g.save(); g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); vals.forEach((v, i) => g.lineTo(x + w * i / (vals.length - 1), y + h - v * h)); g.stroke();
  const avg = vals.reduce((a, v) => a + v, 0) / vals.length; g.setLineDash([5, 6]); g.strokeStyle = OB.dim; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + h - avg * h); g.lineTo(x + w, y + h - avg * h); g.stroke(); g.restore();
  return avg;
}
// dot matrix: n dots in cols columns; colour(i) → colour or null (unlit)
function obDots(g, x, y, cols, n, step, colour) { for (let i = 0; i < n; i++) { const c = colour(i); g.fillStyle = c || OB.faint; g.globalAlpha = c ? 1 : .55; g.beginPath(); g.arc(x + (i % cols) * step, y + Math.floor(i / cols) * step, step * .26, 0, TAU); g.fill(); } g.globalAlpha = 1; }
// ring of n tool dots, lit(i) → colour or null; slow drift by t
function obRing(g, cx, cy, r, n, lit, t = 0) { for (let i = 0; i < n; i++) { const a = i / n * TAU + t * .05, rr = r * (.82 + .3 * hash(i, 3)), c = lit(i); g.fillStyle = c || OB.faint; g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, c ? 4 : 3, 0, TAU); g.fill(); } }
// legend block: rows of [colour, head, line]
function obLegend(g, x, y, rows, row = 46) { rows.forEach(([c, a, b], i) => { const yy = y + i * row; g.fillStyle = c; g.fillRect(x, yy - 16, 4, 38); obText(g, a, x + 16, yy, c, 16, 600); obText(g, b, x + 16, yy + 20, OB.text, 15); }); }
// the reader: a small cyan node tree around the token being read, with a "reading" chip
function obReader(g, x, y, seed, k = 1, t = 0) {
  const R = rng(seed); g.save(); g.globalAlpha = clamp(k, 0, 1); g.strokeStyle = OB.cyan; g.fillStyle = OB.cyan; g.lineWidth = 1.6; g.shadowColor = OB.cyan; g.shadowBlur = 8;
  const branch = (px, py, a, len, d) => { if (d > 3) return; for (let j = 0; j < 3 - (d > 1); j++) { const aa = a + (R() - .5) * 2.2, l = len * (.6 + R() * .5), qx = px + Math.cos(aa) * l, qy = py + Math.sin(aa) * l * .7;
    g.beginPath(); g.moveTo(px, py); g.lineTo(qx, qy); g.stroke(); g.beginPath(); g.arc(qx, qy, 3, 0, TAU); g.fill(); branch(qx, qy, aa, len * .7, d + 1); } };
  branch(x, y, R() * TAU, 78, 0); g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.restore();
  obTag(g, 'reading', x - 30, y - 24, 'cyan', 13, k);
}
