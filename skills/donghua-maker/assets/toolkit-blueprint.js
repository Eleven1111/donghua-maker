// ═══ BLUEPRINT toolkit (蓝图): cyanotype-blue sheet with a fine and a coarse grid, a border frame and a title block; every
// line is thin white, drawn on by length (construction lines first, faint and dashed, then the solid outline); dimension lines
// with arrowheads and centred labels; centre lines dash-dot; section hatching at 45°. Pure functions of t. references/looks/blueprint.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .05, VIGN_TONE = ['0,10,40', 0, .5];
const BP = { sheet: '#1c4f9a', sheet2: '#153f80', line: '#eef4ff', faint: 'rgba(230,240,255,.35)', grid: 'rgba(210,228,255,.10)', grid2: 'rgba(210,228,255,.2)' };
let BP_SHEET = null;
function bpBake() { if (BP_SHEET) return; BP_SHEET = mk(W, H); const g = BP_SHEET.getContext('2d'), R = rng(41);
  const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .7); gr.addColorStop(0, BP.sheet); gr.addColorStop(1, BP.sheet2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) { const x = R() * W, y = R() * H, r = 200 + R() * 500, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(${R() < .5 ? '255,255,255' : '0,10,40'},${.02 + R() * .03})`); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.lineWidth = 1.5; g.strokeStyle = BP.grid; g.beginPath(); for (let x = 0; x <= W; x += 32) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = 0; y <= H; y += 32) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
  g.lineWidth = 2; g.strokeStyle = BP.grid2; g.beginPath(); for (let x = 0; x <= W; x += 160) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = 0; y <= H; y += 160) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
  for (let i = 0; i < 50000; i++) { g.fillStyle = `rgba(255,255,255,${R() * .05})`; g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); } }
// sheet + border frame (drawn on with k)
function bpSheet(g, k = 1) { bpBake(); g.fillStyle = BP.sheet2; g.fillRect(-300, -300, W + 600, H + 600); g.drawImage(BP_SHEET, 0, 0);
  if (k > 0) { const m = 60; g.save(); g.strokeStyle = BP.line; g.lineWidth = 4; bpPoly(g, [[m, m], [W - m, m], [W - m, H - m], [m, H - m], [m, m]], k); g.lineWidth = 1.5; bpPoly(g, [[m + 14, m + 14], [W - m - 14, m + 14], [W - m - 14, H - m - 14], [m + 14, H - m - 14], [m + 14, m + 14]], k); g.restore(); } }
// polyline prefix by arc length (k 0..1), stroked with the current style
function bpPoly(g, P, k = 1, closed = false) { if (k <= 0 || P.length < 2) return; const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const s = L[L.length - 1] * clamp(k, 0, 1); g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) { if (L[i] <= s) g.lineTo(P[i][0], P[i][1]); else { const f = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); g.lineTo(lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)); break; } }
  if (closed && k >= 1) g.closePath(); g.stroke(); }
// the tip position of a partially drawn polyline
function bpTip(P, k) { const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); const s = L[L.length - 1] * clamp(k, 0, 1);
  for (let i = 1; i < P.length; i++) if (L[i] >= s) { const f = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); return [lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]; } return P[P.length - 1]; }
const bpRectP = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
const bpArcP = (x, y, r, a0 = 0, a1 = TAU, n = 64) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(lerp(a0, a1, i / n)) * r, y + Math.sin(lerp(a0, a1, i / n)) * r]);
// line styles: 'solid' (outline, 3px), 'thin' (1.5px), 'hidden' (dashed), 'centre' (dash-dot), 'faint' (construction)
function bpStyle(g, s = 'solid') { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = s === 'faint' ? BP.faint : BP.line; g.lineWidth = s === 'solid' ? 3.5 : s === 'faint' ? 1.5 : 2;
  g.setLineDash(s === 'hidden' ? [16, 10] : s === 'centre' ? [40, 10, 6, 10] : s === 'faint' ? [6, 8] : []); }
function bpDraw(g, P, k, s = 'solid') { g.save(); bpStyle(g, s); bpPoly(g, P, k); g.restore(); }
// a dimension: from a to b, offset `off` px perpendicular (extension lines + arrowed line + label centred); k draws it on
function bpDim(g, a, b, off, label, k, o = {}) { if (k <= 0) return; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, A = [a[0] + nx * off, a[1] + ny * off], B = [b[0] + nx * off, b[1] + ny * off];
  g.save(); bpStyle(g, 'thin'); const e = clamp(k * 2, 0, 1); [[a, A], [b, B]].forEach(([p, q]) => bpPoly(g, [[p[0] + nx * 10 * Math.sign(off), p[1] + ny * 10 * Math.sign(off)], [q[0] + nx * 16 * Math.sign(off), q[1] + ny * 16 * Math.sign(off)]], e));
  const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], f = clamp(k * 2 - .6, 0, 1); bpPoly(g, [m, A], f); bpPoly(g, [m, B], f);
  if (f >= 1) { const ah = (p, ux, uy) => { g.fillStyle = BP.line; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + ux * 22 + uy * 7, p[1] + uy * 22 - ux * 7); g.lineTo(p[0] + ux * 22 - uy * 7, p[1] + uy * 22 + ux * 7); g.closePath(); g.fill(); };
    ah(A, dx / L, dy / L); ah(B, -dx / L, -dy / L); }
  const tk = clamp(k * 2 - 1, 0, 1); if (tk > 0) { g.save(); g.translate(m[0] + nx * (o.gap ?? 26) * Math.sign(off || 1), m[1] + ny * (o.gap ?? 26) * Math.sign(off || 1)); let r = Math.atan2(dy, dx); if (r > PI / 2 || r < -PI / 2) r += PI; g.rotate(r); bpText(g, label, 0, 10, o.size ?? 30, tk, { align: 'center' }); g.restore(); }
  g.restore(); }
// technical lettering (condensed caps / sans), typed on character by character
function bpText(g, str, x, y, size, k = 1, o = {}) { if (k <= 0) return; const fam = (window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''; const s = [...str].slice(0, Math.ceil([...str].length * clamp(k, 0, 1))).join('');
  g.save(); g.font = `${o.weight ?? 500} ${size}px ${fam}"DIN Condensed", "Arial Narrow", sans-serif`; g.fillStyle = o.col ?? BP.line; g.textAlign = o.align ?? 'left'; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); g.restore(); }
// 45° section hatching clipped to a closed polygon
function bpHatch(g, P, k = 1, gap = 18) { if (k <= 0) return; g.save(); g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip(); bpStyle(g, 'thin'); g.globalAlpha = .7;
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), n = Math.ceil((x1 - x0 + y1 - y0) / gap);
  g.beginPath(); for (let i = 0; i < n * clamp(k, 0, 1); i++) { const c = x0 - (y1 - y0) + i * gap; g.moveTo(c, y1); g.lineTo(c + (y1 - y0), y0); } g.stroke(); g.restore(); }
// title block in the lower right: rows of [label, value], k reveals
function bpTitleBlock(g, rows, k, x = W - 60 - 14 - 720, y = H - 60 - 14 - 220) { if (k <= 0) return; g.save(); bpStyle(g, 'thin'); g.lineWidth = 2.5; const w = 720, h = 220, rh = h / rows.length;
  bpPoly(g, bpRectP(x, y, w, h), k); rows.forEach((_, i) => i && bpPoly(g, [[x, y + i * rh], [x + w, y + i * rh]], k)); bpPoly(g, [[x + 220, y], [x + 220, y + h]], k);
  rows.forEach(([a, b], i) => { bpText(g, a, x + 18, y + i * rh + rh * .68, rh * .38, (k - .5) * 2, { col: BP.faint.replace('.35', '.8') }); bpText(g, b, x + 240, y + i * rh + rh * .7, rh * .46, (k - .6) * 2.5, { weight: 700 }); }); g.restore(); }
// a small drafting pen marker at the drawing tip
function bpPen(g, p) { if (!p) return; g.save(); g.translate(p[0], p[1]); g.strokeStyle = BP.line; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.moveTo(-22, 0); g.lineTo(22, 0); g.moveTo(0, -22); g.lineTo(0, 22); g.stroke(); g.restore(); }
