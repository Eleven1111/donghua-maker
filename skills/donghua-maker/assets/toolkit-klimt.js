// ═══ KLIMT toolkit (金色装饰): a pale gold-leaf ground; a tree whose branches end in, and are lined with, gold spirals edged in
// dark lines; small dark fan/eye motifs on the branches; a robe of coloured triangle mosaic; a ground strip of jewel-coloured
// circle mosaic; a black bird. Studied from the public-domain Stoclet Frieze (1910–11); compositions are generated, never copied,
// and no faces are drawn. Pure functions of t (growth by progress). references/looks/klimt.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .06, VIGN_TONE = ['60,40,0', 0, .22];
const KL = { gold0: '#f3e2a6', gold1: '#d9b75a', gold: '#c99a2e', deep: '#8a6417', ink: '#2a1d0e', cols: ['#b8322b', '#2f4f8f', '#e6d9b6', '#1f1a14', '#c9a02c', '#7a8a3a', '#d27a7a', '#f0eee4'] };
let KL_LEAF = null;
// gold-leaf ground: warm gradient + faintly visible leaf squares (baked once)
function klGround(g) { if (!KL_LEAF) { KL_LEAF = document.createElement('canvas'); KL_LEAF.width = W; KL_LEAF.height = H; const q = KL_LEAF.getContext('2d'), R = rng(8);
    const gr = q.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, KL.gold0); gr.addColorStop(1, KL.gold1); q.fillStyle = gr; q.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 90) for (let x = 0; x < W; x += 90) { q.fillStyle = `rgba(${R() < .5 ? '255,245,200' : '170,120,30'},${.02 + R() * .04})`; q.fillRect(x + (R() - .5) * 6, y + (R() - .5) * 6, 90, 90); }
    for (let i = 0; i < 9000; i++) { q.fillStyle = `rgba(120,80,10,${R() * .12})`; q.fillRect(R() * W, R() * H, 2, 2); } }
  g.drawImage(KL_LEAF, -400, -400, W + 800, H + 800); }   // stretched past the frame so a moving camera never finds an edge
// a spiral from its centre outwards: radius r, turns, direction d (±1), progress k (0..1 draws from the outer end inwards, like a tendril curling)
function klSpiral(g, x, y, r, turns, d, k, a0 = 0, lw = 9) { if (k <= 0) return; const n = Math.ceil(40 * turns), m = Math.max(2, Math.ceil(n * k));
  const P = i => { const u = 1 - i / n, a = a0 + d * u * turns * TAU, rr = r * u; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; };
  [[lw + 5, KL.ink], [lw, KL.gold], [lw * .35, '#f7e7a8']].forEach(([w, c]) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i < m; i++) { const p = P(i); g.lineTo(p[0], p[1]); } g.stroke(); });
}
// tree of life: a trunk and forking branches (seeded), each branch ends in a spiral and carries side spirals; built once
function klTree(seed, x, y, h, o = {}) { const R = rng(seed), B = [];
  const grow = (x0, y0, ang, len, depth, t0) => { const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len, cx = (x0 + x1) / 2 + Math.cos(ang + PI / 2) * len * .25 * (R() - .5), cy = (y0 + y1) / 2 + Math.sin(ang + PI / 2) * len * .25 * (R() - .5);
    const d = Math.cos(ang) > 0 ? 1 : -1; B.push({ x0, y0, cx, cy, x1, y1, w: Math.max(7, 26 - depth * 5), t0, depth, spiral: { r: len * (.28 + R() * .12), d, turns: 2.2 + R() }, sides: Array.from({ length: 3 + Math.floor(R() * 3) }, () => ({ u: .2 + R() * .7, s: R() < .5 ? 1 : -1, r: 34 + R() * 40 })) });
    if (depth >= (o.depth ?? 4)) return; const n = depth === 0 ? 2 : 2;
    for (let i = 0; i < n; i++) { const a2 = ang + (i ? 1 : -1) * (.55 + R() * .35) + (R() - .5) * .3, side = Math.cos(a2) >= 0 ? -.18 : -PI + .18;
      grow(x1, y1, depth >= 1 ? lerp(a2, side, .45) : a2, len * (depth >= 1 ? .85 + R() * .1 : .72 + R() * .1), depth + 1, t0 + 1); } };
  grow(x, y, -PI / 2, h * .38, 0, 0); return B; }
// draw the tree at level progress L (0..depth+1, fractional = branches of that level growing)
function klTreeDraw(g, B, L) {
  B.forEach(b => { const k = clamp(L - b.t0, 0, 1); if (k <= 0) return; const P = u => [(1 - u) ** 2 * b.x0 + 2 * (1 - u) * u * b.cx + u * u * b.x1, (1 - u) ** 2 * b.y0 + 2 * (1 - u) * u * b.cy + u * u * b.y1];
    [[b.w + 6, KL.ink], [b.w, KL.deep], [b.w * .4, KL.gold]].forEach(([w, c]) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= 20 * k; i++) { const p = P(i / 20); g.lineTo(p[0], p[1]); } g.stroke(); });
    const tip = P(k); if (k >= 1) klSpiral(g, tip[0] + b.spiral.d * b.spiral.r * .6, tip[1], b.spiral.r, b.spiral.turns, b.spiral.d, clamp(L - b.t0 - 1, 0, 1) * 1.5, 0, Math.max(10, b.w * .7));
    b.sides.forEach((s2, i) => { if (k < s2.u) return; const p = P(s2.u); klSpiral(g, p[0] + s2.s * s2.r, p[1] - s2.r * .4 * (i % 2 ? -1 : 1), s2.r, 2, s2.s, clamp((k - s2.u) * 3, 0, 1), 0, 9); });
    if (b.depth === 1 && k >= 1) klFan(g, ...P(.5), 26); });
}
// small dark fan (half-disc with rays) and the eye motif
function klFan(g, x, y, r) { g.fillStyle = KL.ink; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, PI, TAU); g.fill(); g.strokeStyle = KL.gold; g.lineWidth = 2; g.beginPath(); for (let i = 1; i < 6; i++) { const a = PI + i / 6 * PI; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.stroke(); }
function klEye(g, x, y, s) { g.fillStyle = KL.cols[7]; g.strokeStyle = KL.ink; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 30 * s, 18 * s, 0, 0, TAU); g.fill(); g.stroke();
  [[13, KL.cols[1]], [8, KL.ink], [3, KL.gold0]].forEach(([r, c]) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r * s, 0, TAU); g.fill(); }); }
// triangle-mosaic robe: a tall tapered silhouette filled with coloured triangles that appear in order (k 0..1), clipped to the shape
function klRobe(g, x, y, w, h, k, seed, o = {}) { if (k <= 0) return; const R = rng(seed); g.save(); g.globalAlpha = clamp(k * 4, 0, 1); g.beginPath(); g.moveTo(x - w * .22, y - h); g.quadraticCurveTo(x + w * .3, y - h * 1.02, x + w * .28, y - h * .7);
  g.quadraticCurveTo(x + w * .55, y - h * .2, x + w * .5, y); g.lineTo(x - w * .5, y); g.quadraticCurveTo(x - w * .4, y - h * .5, x - w * .22, y - h); g.closePath();
  g.fillStyle = KL.ink; g.fill(); g.clip(); const s = o.cell ?? 70, cols = o.cols ?? [KL.gold, KL.cols[0], KL.cols[1], KL.cols[2], KL.cols[4], KL.cols[5], KL.cols[3]];
  const tris = []; for (let yy = y - h; yy < y; yy += s * .87) for (let xx = x - w * .6, r = 0; xx < x + w * .6; xx += s / 2, r++) tris.push([xx, yy, r % 2, R()]);
  tris.forEach(([tx, ty, up, rr], i) => { if (rr > k * 1.05) return; g.fillStyle = cols[Math.floor(rr * 97) % cols.length]; g.beginPath();
    if (up) { g.moveTo(tx, ty + s * .87); g.lineTo(tx + s / 2, ty); g.lineTo(tx + s, ty + s * .87); } else { g.moveTo(tx, ty); g.lineTo(tx + s, ty); g.lineTo(tx + s / 2, ty + s * .87); } g.closePath(); g.fill(); g.strokeStyle = KL.ink; g.lineWidth = 3; g.stroke();
    if (rr > .8) { g.fillStyle = KL.gold0; g.beginPath(); g.arc(tx + s / 2, ty + s * .5, 6, 0, TAU); g.fill(); } });
  g.restore(); }
// ground strip: jewel-coloured circle mosaic and small flowers, blooming in from left to right (k 0..1)
function klMeadow(g, y0, y1, k, seed, t = 0) { const R = rng(seed); g.save(); g.fillStyle = KL.deep; g.globalAlpha = .35; g.fillRect(-100, y0, W + 200, y1 - y0); g.globalAlpha = 1;
  for (let i = 0; i < 420; i++) { const x = R() * W, y = y0 + R() * (y1 - y0), r = 8 + R() * 22, c = KL.cols[Math.floor(R() * KL.cols.length)], e = clamp(k * 2.1 - x / W, 0, 1); if (e <= 0) continue;
    g.fillStyle = c; g.beginPath(); g.arc(x, y, r * eio(e), 0, TAU); g.fill(); g.strokeStyle = KL.ink; g.lineWidth = 2; g.stroke();
    if (r > 22) { g.fillStyle = KL.gold0; g.beginPath(); g.arc(x, y, r * .35 * eio(e) * (1 + .1 * Math.sin(t * 3 + i)), 0, TAU); g.fill(); } }
  g.restore(); }
function klBird(g, x, y, s, flap) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = KL.ink; g.beginPath(); g.ellipse(0, 0, 40, 16, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(-10, -4); g.quadraticCurveTo(10, -60 * flap, 40, -50 * flap); g.quadraticCurveTo(20, -10, 20, 0); g.fill(); g.beginPath(); g.moveTo(-40, 0); g.lineTo(-62, -6); g.lineTo(-44, 6); g.fill(); g.restore(); }
