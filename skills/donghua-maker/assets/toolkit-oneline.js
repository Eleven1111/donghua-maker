// ═══ ONELINE toolkit (一笔画): warm off-white paper, ONE continuous ink line that never lifts — it runs along a baseline and
// loops up into drawings (a cup with steam, a sun, a house, mountains, a heart…) and back down, like a pen that forgot to stop. The pen
// tip is a small red dot; the camera follows it. Line weight swells slightly on curves (brush-pen feel). Motifs are procedural
// polylines in a unit box so they can be placed/scaled anywhere. Pure functions of t. references/looks/oneline.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .04, VIGN_TONE = ['60,40,20', 0, .2];
const OL = { paper: '#f2ede3', ink: '#1a1a1a', tip: '#d9432f', faint: 'rgba(26,26,26,.45)' };
// motifs: polylines in a box x 0..1 (left→right), y 0 = baseline, negative = up (height ~ −1). Each starts at (0,0) and ends at (1,0).
const OL_MOTIF = {
  cup: [[0, 0], [.14, 0], [.18, -.03], [.2, -.1], [.2, -.3], [.2, -.5], [.3, -.52], [.38, -.52], [.36, -.64], [.42, -.78], [.37, -.92], [.41, -1.02], [.47, -.94], [.52, -.8], [.46, -.66], [.48, -.52],
    [.6, -.52], [.7, -.5], [.7, -.44], [.8, -.44], [.87, -.36], [.85, -.26], [.76, -.22], [.7, -.22], [.7, -.1], [.68, -.03], [.62, 0], [.8, 0], [1, 0]],
  sun: (() => { const P = [[0, 0], [.14, -.16], [.28, -.38], [.4, -.5]]; for (let i = 0; i <= 36; i++) { const a = PI * .75 + i / 36 * TAU, r = .19; P.push([.52 + Math.cos(a) * r, -.66 + Math.sin(a) * r]); }
    P.push([.66, -.48], [.78, -.3], [.9, -.12], [1, 0]); return P; })(),
  bird: [[0, 0], [.1, -.2], [.2, -.5], [.3, -.72], [.36, -.8], [.44, -.84], [.5, -.74], [.56, -.84], [.64, -.8], [.7, -.72], [.66, -.6], [.56, -.52], [.5, -.4], [.56, -.26], [.7, -.14], [.84, -.04], [1, 0]],
  house: [[0, 0], [.1, 0], [.1, -.5], [.02, -.5], [.5, -.95], [.7, -.77], [.7, -.93], [.8, -.93], [.8, -.68], [.98, -.5], [.9, -.5], [.9, 0], [1, 0]],
  heart: (() => { const P = [[0, 0], [.4, 0]]; for (let i = 0; i <= 44; i++) { const a = PI + i / 44 * TAU, x = 16 * Math.sin(a) ** 3, y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); P.push([.5 + x / 40, -.47 + y / 36]); } P.push([.6, 0], [1, 0]); return P; })(),
  wave: Array.from({ length: 41 }, (_, i) => [i / 40, -Math.abs(Math.sin(i / 40 * PI * 3)) * .3 * Math.sin(i / 40 * PI)]),
  mountain: [[0, 0], [.2, -.4], [.3, -.3], [.5, -.8], [.58, -.66], [.62, -.72], [.8, -.3], [.86, -.36], [1, 0]],
  loop: Array.from({ length: 49 }, (_, i) => { const a = i / 48 * TAU; return [i / 48 + Math.sin(a) * .25, -(1 - Math.cos(a)) * .3]; }),
};
// build one continuous path: list of [motif | 'gap', width px, height px] placed along a baseline y from x0; smooth with Catmull-Rom
function olBuild(list, x0, y, n = 6) { const P = [[x0 - 2000, y]]; let x = x0; P.push([x, y]);
  list.forEach(([m, w, h = w]) => { if (m === 'gap') { x += w; P.push([x, y]); return; } OL_MOTIF[m].forEach(([u, v]) => P.push([x + u * w, y + v * h])); x += w; });
  P.push([x + 2400, y]); return olSmooth(P, n); }
function olSmooth(C, n = 6) { const P = []; for (let k = 0; k < C.length - 1; k++) { const a = C[Math.max(0, k - 1)], b = C[k], c = C[k + 1], d = C[Math.min(C.length - 1, k + 2)];
  const seg = Math.hypot(c[0] - b[0], c[1] - b[1]) > 300 ? 2 : n; for (let i = 0; i < seg; i++) { const f = i / seg, cr = (p0, p1, p2, p3) => .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
    P.push([cr(a[0], b[0], c[0], d[0]), cr(a[1], b[1], c[1], d[1])]); } } P.push(C[C.length - 1]); return P; }
// cumulative lengths (cache on the array)
function olLens(P) { if (P._L) return P._L; const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); P._L = L; return L; }
// position at arc length s
function olAt(P, s) { const L = olLens(P); s = clamp(s, 0, L[L.length - 1]); let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m; else hi = m; }
  const f = (s - L[lo]) / (L[hi] - L[lo] || 1); return [lerp(P[lo][0], P[hi][0], f), lerp(P[lo][1], P[hi][1], f)]; }
// arc length where the path first reaches x (for timing the pen to places)
function olSx(P, x) { const L = olLens(P); for (let i = 0; i < P.length; i++) if (P[i][0] >= x) return L[i]; return L[L.length - 1]; }
// draw the path from arc length s0 to s1 with a brush-pen weight (thicker where it turns), + optional red tip
function olDraw(g, P, s1, o = {}) { const L = olLens(P), s0 = o.s0 ?? 0, w = o.w ?? 5; g.save(); g.strokeStyle = o.col ?? OL.ink; g.lineCap = 'round'; g.lineJoin = 'round';
  let prev = null; for (let i = 1; i < P.length; i++) { if (L[i] < s0) continue; if (L[i - 1] > s1) break; const a = L[i - 1] < s0 ? olAt(P, s0) : P[i - 1], b = L[i] > s1 ? olAt(P, s1) : P[i];
    const turn = prev ? Math.abs(Math.atan2(b[1] - a[1], b[0] - a[0]) - prev) : 0; prev = Math.atan2(b[1] - a[1], b[0] - a[0]);
    g.lineWidth = w * (1 + Math.min(.5, (turn > PI ? TAU - turn : turn) * 2)); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.restore(); if (o.tip !== false) { const p = olAt(P, s1); g.save(); g.fillStyle = OL.tip; g.beginPath(); g.arc(p[0], p[1], w * 1.6, 0, TAU); g.fill(); g.restore(); return p; } return olAt(P, s1); }
// paper: warm off-white with a soft glow and faint fibres, laid over the visible area of camera `cam` (call after setCam)
let OL_PAPER = null;
function olPaper(g, cam) { if (!OL_PAPER) { OL_PAPER = mk(W, H); const q = OL_PAPER.getContext('2d'), R = rng(51); const gr = q.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .7); gr.addColorStop(0, '#f7f3ea'); gr.addColorStop(1, '#e9e2d4'); q.fillStyle = gr; q.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) { q.strokeStyle = `rgba(120,100,70,${R() * .06})`; q.lineWidth = 1; q.beginPath(); const x = R() * W, y = R() * H, a = R() * TAU, l = 10 + R() * 40; q.moveTo(x, y); q.quadraticCurveTo(x + Math.cos(a) * l / 2 + 6, y + Math.sin(a) * l / 2, x + Math.cos(a) * l, y + Math.sin(a) * l); q.stroke(); } }
  const z = cam.z ?? 1, w = W / z * 1.1, h = H / z * 1.1; g.fillStyle = OL.paper; g.fillRect(cam.x - w, cam.y - h, w * 2, h * 2); g.drawImage(OL_PAPER, cam.x - w / 2, cam.y - h / 2, w, h); }
// a quiet serif caption (small, italic), fades in
function olCaption(g, str, x, y, size, k, o = {}) { if (k <= 0) return; const fam = (window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''; g.save(); g.globalAlpha = clamp(k, 0, 1) * (o.a ?? .7); g.fillStyle = OL.ink; g.font = `${o.weight ?? 400} ${size}px ${fam}serif`; g.textAlign = o.align ?? 'center'; g.fillText(str, x, y); g.restore(); }
