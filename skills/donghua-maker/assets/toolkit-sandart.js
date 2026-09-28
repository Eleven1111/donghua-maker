// ═══ SANDART toolkit (沙画): a light table glowing amber under a layer of dark sand; the picture is made by wiping sand away
// with a fingertip (thin bright lines), the side of a finger (soft bright strokes) and the palm (broad clearings); scenes change
// by a palm sweep that erases the old picture and a sprinkle that lays sand back. Edges are grainy, never crisp. Studied from
// published sand-animation performances; images are our own. Pure functions of t (strokes draw on by length). references/looks/sandart.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .08, VIGN_TONE = ['20,8,0', 0, .45];
const SA = { light0: '#ffe2a6', light1: '#d98a3a', sand: [46, 28, 16] };
let SA_SAND = null, SA_GRAIN = null, SA_LAYER = null;
// baked once: the sand texture (uneven density + grains) and a grain mask used to rough up wiped edges
function saBake() { if (SA_SAND) return; const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  SA_SAND = mk(); SA_GRAIN = mk(); SA_LAYER = mk(); const g = SA_SAND.getContext('2d'), R = rng(21), [r, gg, b] = SA.sand;
  g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { const x = R() * W, y = R() * H, rr = 200 + R() * 500, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(${r + 25},${gg + 15},${b + 8},${.25 * R()})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  for (let i = 0; i < 90000; i++) { const v = R(); g.fillStyle = v < .5 ? `rgba(10,5,2,${.5 * R()})` : `rgba(120,80,45,${.35 * R()})`; g.fillRect(R() * W, R() * H, 1 + R() * 2.5, 1 + R() * 2.5); }
  const q = SA_GRAIN.getContext('2d'); for (let i = 0; i < 160000; i++) { q.fillStyle = `rgba(0,0,0,${R() * .9})`; q.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
}
// a stroke: polyline pts (world px), width w, drawn on from t0 over dur; soft = feathered side-of-finger stroke
const saStroke = (pts, w, t0, dur, soft = false) => ({ pts, w, t0, dur, soft });
// resample a list of control points into a smooth polyline
function saCurve(C, n = 60) { const P = [], m = C.length - 1; for (let i = 0; i < n; i++) { const u = i / (n - 1) * m, k = Math.min(m - 1, Math.floor(u)), f = u - k;
  const a = C[Math.max(0, k - 1)], b = C[k], c = C[k + 1], d = C[Math.min(m, k + 2)], cr = (p0, p1, p2, p3) => .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
  P.push([cr(a[0], b[0], c[0], d[0]), cr(a[1], b[1], c[1], d[1])]); } return P; }
const saCircle = (x, y, r, n = 48, a0 = -PI / 2) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(a0 + i / n * TAU) * r, y + Math.sin(a0 + i / n * TAU) * r]);
// render: light table, then sand with every stroke (visible by t) wiped out; sweep = {x, t0, dur} palm wipe from left clearing
// everything left of its edge; resand = 0..1 new sand falling back over the cleared table
function saDraw(g, strokes, t, o = {}) {
  saBake(); const L = SA_LAYER.getContext('2d');
  L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, W, H); L.drawImage(SA_SAND, 0, 0);
  L.globalCompositeOperation = 'destination-out'; L.lineCap = 'round'; L.lineJoin = 'round';
  strokes.forEach(s => { const k = clamp((t - s.t0) / s.dur, 0, 1); if (k <= 0) return; const n = Math.max(2, Math.ceil(s.pts.length * k));
    // several jittered thin passes instead of one clean line: the wiped edge frays like real sand
    const pass = s.soft ? [[1.9, .07], [1.5, .1], [1.2, .14], [.9, .2], [.6, .3]] : [[1.3, .25], [1, .45], [.7, .7]], seed = s.pts.length * 7 + s.t0 * 100;
    pass.forEach(([wm, a], pi) => { for (let c = 0; c < 3; c++) { L.strokeStyle = `rgba(0,0,0,${a})`; L.lineWidth = s.w * wm * (.8 + .4 * hash(pi, c, seed)); L.beginPath();
      for (let i = 0; i < n; i++) { const j = s.w * .28; L.lineTo(s.pts[i][0] + (hash(i, c, seed + pi) - .5) * j, s.pts[i][1] + (hash(c, i, seed + pi + 9) - .5) * j); } L.stroke(); } }); });
  if (o.clear) o.clear.forEach(([x, y, r, a]) => { const gr = L.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a ?? .9})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = gr; L.fillRect(x - r, y - r, r * 2, r * 2); });
  if (o.sweep) { const e = o.sweep; L.fillStyle = '#000'; L.fillRect(-10, 0, e + 10, H); const gr = L.createLinearGradient(e, 0, e + 160, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = gr; L.fillRect(e, 0, 160, H); }
  L.globalCompositeOperation = 'source-over'; L.globalAlpha = .55; L.drawImage(SA_GRAIN, 0, 0); L.globalAlpha = 1;   // stray grains everywhere, also in wiped areas
  const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .7); gr.addColorStop(0, SA.light0); gr.addColorStop(1, SA.light1); g.fillStyle = gr; g.fillRect(-300, -300, W + 600, H + 600);
  g.drawImage(SA_LAYER, 0, 0);
  if (o.resand) { g.save(); g.globalAlpha = clamp(o.resand, 0, 1); g.drawImage(SA_SAND, 0, 0); g.restore(); }
  if (o.hand) saHand(g, o.hand[0], o.hand[1], o.hand[2] ?? 0);
}
// the performer's hand as a soft dark silhouette entering from the bottom edge (index finger extended)
function saHand(g, x, y, r) { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = 'rgba(20,10,5,.8)'; g.beginPath();
  g.moveTo(-20, 10); g.quadraticCurveTo(-24, 160, -30, 260);
  g.quadraticCurveTo(-110, 250, -150, 300); g.quadraticCurveTo(-190, 350, -170, 420);
  g.quadraticCurveTo(-200, 520, -190, 620); g.lineTo(-200, 1000); g.lineTo(220, 1000); g.lineTo(230, 560);
  g.quadraticCurveTo(250, 470, 210, 400); g.quadraticCurveTo(230, 330, 170, 300); g.quadraticCurveTo(110, 270, 60, 280);
  g.quadraticCurveTo(30, 200, 22, 10); g.quadraticCurveTo(0, -24, -20, 10); g.fill();
  g.fillStyle = 'rgba(0,0,0,.25)'; [[-110, 300], [-40, 285], [30, 290], [110, 300]].forEach(([kx, ky]) => { g.beginPath(); g.ellipse(kx, ky, 34, 16, 0, 0, TAU); g.fill(); }); g.restore(); }
// poured sand: dark grainy lines laid onto a cleared table (a thin stream from the fist), drawn on like strokes
function saPour(g, strokes, t) { saBake(); const pat = g.createPattern(SA_SAND, 'no-repeat'); g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  strokes.forEach(s => { const k = clamp((t - s.t0) / s.dur, 0, 1); if (k <= 0) return; const n = Math.max(2, Math.ceil(s.pts.length * k));
    [[1.5, .35], [1, .9]].forEach(([wm, a]) => { g.globalAlpha = a; g.strokeStyle = pat; g.lineWidth = s.w * wm; g.beginPath(); for (let i = 0; i < n; i++) g.lineTo(s.pts[i][0], s.pts[i][1]); g.stroke(); }); });
  g.restore(); }
// where the fingertip is now: the head of the stroke currently being drawn (null when none is)
function saTip(strokes, t) { for (const s of strokes) { const k = (t - s.t0) / s.dur; if (k > 0 && k < 1) { const i = Math.min(s.pts.length - 1, Math.floor(s.pts.length * k)); return s.pts[i]; } } return null; }
