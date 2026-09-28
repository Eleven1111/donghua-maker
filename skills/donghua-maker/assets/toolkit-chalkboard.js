// ═══ CHALKBOARD toolkit (黑板粉笔): a dark green slate with old erased smudges, a wooden ledge with chalk sticks; everything is
// drawn in chalk — lines and handwriting that write themselves on, broken up by the slate's tooth (grain mask), slightly
// wobbly; a felt eraser wipes a patch leaving a grey smear. Pure functions of t (strokes draw on by length).
// references/looks/chalkboard.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .05, VIGN_TONE = ['0,0,0', 0, .45];
const CB = { slate: '#23332c', slate2: '#1b2923', chalk: '#f2efe4', yellow: '#f3d774', pink: '#f2a7a0', blue: '#9fd0ea', wood: '#7a4e2a' };
let CB_BOARD = null, CB_GRAIN = null, CB_L = null;
function cbBake() { if (CB_BOARD) return; CB_BOARD = mk(W, H); CB_GRAIN = mk(W, H); CB_L = mk(W, H); const g = CB_BOARD.getContext('2d'), R = rng(31);
  g.fillStyle = CB.slate; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H * .9, r = 150 + R() * 450, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${R() < .6 ? '220,230,220' : '10,20,15'},${.03 + R() * .05})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  // old eraser arcs: wide faint swipes
  g.lineCap = 'round'; for (let i = 0; i < 14; i++) { const x = R() * W, y = R() * H * .85, w = 300 + R() * 600; g.strokeStyle = `rgba(230,240,230,${.025 + R() * .03})`; g.lineWidth = 90 + R() * 80; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 60 + R() * 120, x + w, y + R() * 60 - 30); g.stroke(); }
  for (let i = 0; i < 60000; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${R() * .06})`; g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
  const q = CB_GRAIN.getContext('2d'); for (let i = 0; i < 170000; i++) { q.fillStyle = `rgba(0,0,0,${.3 + R() * .7})`; q.fillRect(R() * W, R() * H, 1 + R() * 2.2, 1 + R() * 2.2); }
}
// the slate plus the ledge along the bottom with a few chalk sticks
function cbBoard(g) { cbBake(); g.fillStyle = CB.slate2; g.fillRect(-300, -300, W + 600, H + 600); g.drawImage(CB_BOARD, 0, 0);
  const y = H - 70; g.fillStyle = CB.wood; g.fillRect(-300, y, W + 600, 400); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-300, y, W + 600, 10); g.fillStyle = 'rgba(255,220,170,.18)'; g.fillRect(-300, y + 14, W + 600, 6);
  [[1500, CB.chalk], [1580, CB.yellow], [2200, CB.chalk], [2270, CB.pink]].forEach(([x, c]) => { g.fillStyle = c; g.fillRect(x, y - 16, 70, 16); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x, y - 5, 70, 5); }); }
// prefix of a polyline by arc length, k 0..1
function cbPart(P, k) { if (k >= 1) return P; if (k <= 0) return []; const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const s = L[L.length - 1] * k, out = [P[0]]; for (let i = 1; i < P.length; i++) { if (L[i] <= s) out.push(P[i]); else { const f = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); out.push([lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]); break; } } return out; }
const cbLineP = (x0, y0, x1, y1, n = 24) => Array.from({ length: n + 1 }, (_, i) => [lerp(x0, x1, i / n), lerp(y0, y1, i / n)]);
const cbCircleP = (x, y, rx, ry = rx, n = 64, a0 = -PI / 2, turns = 1.06) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + i / n * TAU * turns, w = 1 + .03 * Math.sin(i * .7); return [x + Math.cos(a) * rx * w, y + Math.sin(a) * ry * w]; });
// chalk layer: begin → draw strokes/text into it (world px) → end composites it through the grain onto g
function cbBegin() { cbBake(); const L = CB_L.getContext('2d'); L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.clearRect(0, 0, W, H); L.lineCap = 'round'; L.lineJoin = 'round'; return L; }
function cbEnd(g, bite = .55) { const L = CB_L.getContext('2d'); L.globalCompositeOperation = 'destination-out'; L.globalAlpha = bite; L.drawImage(CB_GRAIN, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; g.drawImage(CB_L, 0, 0); }
// a chalk stroke: two slightly offset passes (the stick's edge) + dust along it
function cbStroke(L, P, k, col = CB.chalk, w = 9, seed = 1) { const Q = cbPart(P, k); if (Q.length < 2) return; L.strokeStyle = col;
  [[1, .9, 0], [.55, .6, 1]].forEach(([wm, a, o]) => { L.globalAlpha = a; L.lineWidth = w * wm; L.beginPath(); Q.forEach(([x, y], i) => { const j = (hash(i, seed, o) - .5) * w * .35; i ? L.lineTo(x + j, y + j * .6 + o * w * .25) : L.moveTo(x + j, y + j); }); L.stroke(); });
  L.globalAlpha = .35; L.fillStyle = col; for (let i = 0; i < Q.length; i += 2) { const h = hash(i, seed, 7); if (h > .6) L.fillRect(Q[i][0] + (h - .8) * w * 4, Q[i][1] + (hash(seed, i) - .5) * w * 3, 2, 2); } L.globalAlpha = 1; }
// chalk handwriting: revealed left→right (k), slight baseline wobble per character; o.align, o.font
function cbText(L, str, x, y, size, k, col = CB.chalk, o = {}) { if (k <= 0) return; const fam = (window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''; L.save(); L.font = `${o.weight ?? 600} ${size}px ${fam}"Kaiti SC", cursive`; L.fillStyle = col; L.textBaseline = 'alphabetic';
  const chars = [...str], ws = chars.map(c => L.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0); let cx = o.align === 'center' ? x - tot / 2 : o.align === 'right' ? x - tot : x; const shown = k * chars.length;
  chars.forEach((c, i) => { const f = clamp(shown - i, 0, 1); if (f <= 0) return; L.save(); L.translate(cx, y + (hash(i, size) - .5) * size * .06); L.rotate((hash(size, i) - .5) * .05); L.globalAlpha = f; L.fillText(c, 0, 0);
    if (o.bold) { L.globalAlpha = f * .5; L.fillText(c, 1.5, 1); } L.restore(); cx += ws[i]; }); L.restore(); return tot; }
// an arrow along P with a two-stroke head at the end
function cbArrow(L, P, k, col = CB.chalk, w = 8, seed = 3) { cbStroke(L, P, k, col, w, seed); if (k < .97) return; const n = P.length, [x, y] = P[n - 1], [px, py] = P[n - 3], a = Math.atan2(y - py, x - px), h = w * 5;
  cbStroke(L, cbLineP(x, y, x - Math.cos(a - .5) * h, y - Math.sin(a - .5) * h, 6), 1, col, w, seed + 1); cbStroke(L, cbLineP(x, y, x - Math.cos(a + .5) * h, y - Math.sin(a + .5) * h, 6), 1, col, w, seed + 2); }
// eraser: wipes chalk inside a rounded band that grows along x (k), leaving a grey smear; draws the felt eraser at the head
function cbErase(L, g, x0, y0, x1, h, k, show = true) { if (k <= 0) return; const x = lerp(x0, x1, eio(k)); L.save(); L.globalCompositeOperation = 'destination-out'; L.fillStyle = '#000'; L.beginPath(); L.roundRect(x0 - 20, y0 - h / 2, x - x0 + 40, h, 30); L.fill(); L.restore();
  L.save(); L.globalAlpha = .1; L.fillStyle = CB.chalk; for (let i = 0; i < 6; i++) { L.beginPath(); L.ellipse(lerp(x0, x, (i + .5) / 6), y0 + (hash(i, 9) - .5) * h * .3, (x - x0) / 7 + 20, h * .35, 0, 0, TAU); L.fill(); } L.restore();
  return show && k < 1 ? [x, y0] : null; }
function cbEraser(g, x, y) { g.save(); g.translate(x, y); g.rotate(-.08); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-95, -40, 200, 90); g.fillStyle = '#b88a57'; g.fillRect(-100, -50, 200, 64); g.fillStyle = '#6d6a66'; g.fillRect(-100, 14, 200, 32); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-100, -50, 200, 8); g.restore(); }
// the chalk stick drawing: a small white stick at the tip of the stroke/text being written
function cbStick(g, x, y) { g.save(); g.translate(x, y); g.rotate(-.7); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(4, 8, 22, 120); g.fillStyle = CB.chalk; g.fillRect(-11, 0, 22, 120); g.fillStyle = '#d9d4c6'; g.fillRect(-11, 0, 22, 10); g.restore(); }
function cbTip(P, k) { const Q = cbPart(P, clamp(k, 0, 1)); return Q.length ? Q[Q.length - 1] : null; }
