// ═══ LINOCUT toolkit (麻胶版画): a relief print — cream rag paper, flat ink in one or two colours (black + vermilion) with the
// speckle and bald patches of hand-burnished ink, rough jagged edges, white gouge marks (tapered V-cuts) that carve rays,
// ripples and texture out of the black; slight misregistration between colour passes. Scenes are revealed the printmaker's
// way: the block being cut, then a roller/press pass that lays each colour. Pure functions of t. references/looks/linocut.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .06, VIGN_TONE = ['60,40,20', 0, .25];
const LN = { paper: '#f1e8d6', black: '#1d1a17', red: '#cf3a26', block: '#2a2622', lino: '#8a6d4f' };
let LN_PAPER = null, LN_SPECK = null, LN_L = null;
function lnBake() { if (LN_PAPER) return; LN_PAPER = mk(W, H); LN_SPECK = mk(W, H); LN_L = mk(W, H); const g = LN_PAPER.getContext('2d'), R = rng(71);
  g.fillStyle = LN.paper; g.fillRect(0, 0, W, H); for (let i = 0; i < 2600; i++) { g.strokeStyle = `rgba(120,95,60,${R() * .08})`; g.lineWidth = 1; g.beginPath(); const x = R() * W, y = R() * H, a = R() * TAU, l = 6 + R() * 30; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 60; i++) { const x = R() * W, y = R() * H, r = 200 + R() * 400, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(150,110,60,${R() * .05})`); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  // speckle mask: where ink didn't take — fine dots + a few larger bald patches from uneven burnishing
  const q = LN_SPECK.getContext('2d'); for (let i = 0; i < 90000; i++) { q.fillStyle = `rgba(0,0,0,${.4 + R() * .6})`; const s = R() < .97 ? 1 + R() * 2 : 3 + R() * 4; q.fillRect(R() * W, R() * H, s, s); }
  for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) { const v = fbm(x * .004, y * .004, 3); if (v > .62) { q.fillStyle = `rgba(0,0,0,${clamp((v - .62) * 3, 0, .7)})`; q.fillRect(x, y, 4, 4); } } }
function lnPaper(g) { lnBake(); g.fillStyle = LN.paper; g.fillRect(-400, -400, W + 800, H + 800); g.drawImage(LN_PAPER, 0, 0); }
// ink layer: begin → fill shapes (any colour) and carve (lnGouge with carve=true) → end: speckle bites, laid on with multiply
function lnBegin() { lnBake(); const L = LN_L.getContext('2d'); L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.clearRect(0, 0, W, H); return L; }
function lnEnd(g, o = {}) { const L = LN_L.getContext('2d'); L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'destination-out'; L.globalAlpha = o.bite ?? .55; L.drawImage(LN_SPECK, o.sx ?? 0, o.sy ?? 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over';
  if (o.reveal !== undefined) { L.globalCompositeOperation = 'destination-in'; L.fillStyle = '#000'; L.fillRect(0, 0, clamp(o.reveal, 0, 1) * (W + 200) - 100, H); L.globalCompositeOperation = 'source-over'; }
  g.save(); g.globalCompositeOperation = o.mode ?? 'multiply'; g.translate(o.dx ?? 0, o.dy ?? 0); g.drawImage(LN_L, 0, 0); g.restore(); }
// jagged polygon fill (hand-cut edge): pts perturbed along their normals by hash noise
function lnPoly(L, pts, col, jag = 5, seed = 1) { L.fillStyle = col; L.beginPath(); const n = pts.length;
  for (let i = 0; i < n; i++) { const [x, y] = pts[i], [px, py] = pts[(i - 1 + n) % n], [nx, ny] = pts[(i + 1) % n], tx = nx - px, ty = ny - py, tl = Math.hypot(tx, ty) || 1, j = (hash(i, seed) - .5) * 2 * jag;
    const X = x - ty / tl * j, Y = y + tx / tl * j; i ? L.lineTo(X, Y) : L.moveTo(X, Y); } L.closePath(); L.fill(); }
// densify a polygon so the jag has vertices to work on
function lnDense(pts, step = 14) { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); } return out; }
const lnCircle = (x, y, r, n = 90) => Array.from({ length: n }, (_, i) => [x + Math.cos(i / n * TAU) * r, y + Math.sin(i / n * TAU) * r]);
// a gouge cut: tapered lens from a to b, max width w; carve = remove from the layer (white of the paper shows), else fill col
function lnGouge(L, a, b, w, k = 1, o = {}) { if (k <= 0) return; const e = [lerp(a[0], b[0], clamp(k, 0, 1)), lerp(a[1], b[1], clamp(k, 0, 1))], dx = e[0] - a[0], dy = e[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, ww = w * Math.min(1, clamp(k, 0, 1) * 3);
  L.save(); if (o.carve !== false) L.globalCompositeOperation = 'destination-out'; L.fillStyle = o.col ?? '#000'; L.beginPath(); L.moveTo(a[0], a[1]);
  const bulge = o.bulge ?? .35; L.quadraticCurveTo(a[0] + dx * bulge + nx * ww, a[1] + dy * bulge + ny * ww, e[0], e[1]); L.quadraticCurveTo(a[0] + dx * bulge - nx * ww, a[1] + dy * bulge - ny * ww, a[0], a[1]); L.fill(); L.restore(); }
// sunburst: n tapered rays between radius r0 and r1 (drawn as fills, wide end outside); k grows them
function lnRays(L, x, y, n, r0, r1, w, col, k = 1, ph = 0) { for (let i = 0; i < n; i++) { const a = ph + i / n * TAU, kk = clamp(k * (n / 2 + 1) - i / 2, 0, 1); if (kk <= 0) continue; const rr = lerp(r0, r1, kk), wa = w / r1;
  L.fillStyle = col; L.beginPath(); L.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); L.lineTo(x + Math.cos(a - wa) * rr, y + Math.sin(a - wa) * rr); L.lineTo(x + Math.cos(a + wa) * rr, y + Math.sin(a + wa) * rr); L.closePath(); L.fill(); } }
// bold carved lettering: heavy sans, filled, then nicked at the edges
function lnText(L, str, x, y, size, col, o = {}) { const fam = (window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''; L.save(); L.font = `900 ${size}px ${fam}"Impact", sans-serif`; L.textAlign = o.align ?? 'center'; L.textBaseline = 'alphabetic'; L.fillStyle = col;
  L.translate(x, y); L.rotate(o.rot ?? 0); L.fillText(str, 0, 0); L.globalCompositeOperation = 'destination-out'; const w = L.measureText(str).width, x0 = o.align === 'left' ? 0 : -w / 2;
  for (let i = 0; i < w / 9; i++) { const px = x0 + hash(i, 3) * w, py = -size * hash(i, 5) * .8; L.fillRect(px, py, 2 + hash(i, 7) * 5, 2 + hash(i, 8) * 3); } L.restore(); }
// the brayer (ink roller) at x, spanning the frame height, rolling
function lnRoller(g, x, col, t) { g.save(); g.translate(x, 0); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(20, -20, 70, H + 40); g.fillStyle = col; g.fillRect(-45, -20, 90, H + 40);
  g.fillStyle = 'rgba(255,255,255,.18)'; for (let y = -20; y < H + 20; y += 60) g.fillRect(-40, y + (t * 400 % 60), 80, 8); g.fillStyle = '#6b6b6b'; g.fillRect(-55, -20, 10, H + 40); g.fillRect(45, -20, 10, H + 40); g.restore(); }
// the carving tool (a V-gouge) at point p pointing along angle a
function lnTool(g, p, a) { if (!p) return; g.save(); g.translate(p[0], p[1]); g.rotate(a + PI); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(4, 10, 260, 22);
  g.fillStyle = '#cfcfcf'; g.fillRect(0, -5, 110, 10); g.fillStyle = '#8f8f8f'; g.fillRect(100, -9, 24, 18); g.fillStyle = '#a8733f'; g.beginPath(); g.roundRect(120, -16, 150, 32, 16); g.fill(); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(130, -12, 130, 6); g.restore(); }
