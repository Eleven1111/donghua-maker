// ═══ MONDRIAN toolkit (格子构成): white planes cut by thick black lines, a few red/yellow/blue planes, asymmetric balance;
// lines draw in on beats, planes fill on notes; a "boogie" mode sends small colour blocks along yellow lanes.
// Construction studied from public-domain Neo-Plastic paintings; compositions are generated, never copied. references/looks/mondrian.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .12, VIGN_TONE = ['0,0,0', 0, .08];
const MD = { white: '#f2f0ea', grey: '#dcdad2', black: '#141414', red: '#d7261e', yellow: '#f2cf1f', blue: '#1f4fa0', lw: 26 };
// recursive split: returns { rects:[{x,y,w,h}], lines:[{x0,y0,x1,y1,t}] } with lines ordered by depth (drawn in that order)
function mdCompose(x, y, w, h, seed, o = {}) {
  const R = rng(seed), rects = [], lines = [];
  const split = (x, y, w, h, d) => { if (d > (o.depth ?? 4) || (d > 1 && R() < .28) || w < 260 || h < 220) { rects.push({ x, y, w, h, d }); return; }
    const vert = w / h > 1.2 ? true : w / h < .8 ? false : R() < .5, f = .28 + R() * .44;
    if (vert) { const cx = x + w * f; lines.push({ x0: cx, y0: y, x1: cx, y1: y + h, d }); split(x, y, cx - x, h, d + 1); split(cx, y, x + w - cx, h, d + 1); }
    else { const cy = y + h * f; lines.push({ x0: x, y0: cy, x1: x + w, y1: cy, d }); split(x, y, w, cy - y, d + 1); split(x, cy, w, y + h - cy, d + 1); } };
  split(x, y, w, h, 0);
  // colour: few planes only — one big red, one blue, one yellow, maybe a grey; never two colours touching the same line twice
  const byArea = rects.slice().sort((a, b) => b.w * b.h - a.w * a.h), cols = [MD.red, MD.blue, MD.yellow];
  byArea.forEach(r => r.col = MD.white); [byArea[0], byArea[Math.min(3, byArea.length - 1)], byArea[byArea.length - 2]].forEach((r, i) => { if (r) r.col = cols[(i + (seed % 3)) % 3]; });
  if (byArea[5] && R() < .6) byArea[5].col = MD.grey;
  return { rects, lines, x, y, w, h };
}
// draw a composition: u = 0..1 line draw-in progress (by order), fill(r) → 0..1 fill amount per rect
function mdDraw(g, C, u, fill = () => 1) {
  g.fillStyle = MD.white; g.fillRect(C.x, C.y, C.w, C.h);
  C.rects.forEach(r => { const k = fill(r); if (r.col === MD.white || k <= 0) return; g.fillStyle = r.col; const hh = r.h * eio(k); g.fillRect(r.x, r.y + r.h - hh, r.w, hh); });
  g.fillStyle = MD.black; const n = C.lines.length;
  C.lines.forEach((l, i) => { const k = clamp(u * n - i, 0, 1); if (k <= 0) return; const e = eio(k); if (l.x0 === l.x1) g.fillRect(l.x0 - MD.lw / 2, l.y0, MD.lw, (l.y1 - l.y0) * e); else g.fillRect(l.x0, l.y0 - MD.lw / 2, (l.x1 - l.x0) * e, MD.lw); });
  g.strokeStyle = MD.black; g.lineWidth = MD.lw; g.strokeRect(C.x, C.y, C.w, C.h);
}
// boogie: a grid of yellow lanes with small red/blue/grey blocks travelling along them, pure function of t
function mdBoogie(g, x, y, w, h, t, seed, o = {}) {
  const R = rng(seed), lanesV = [], lanesH = [], lw = o.lane ?? 30; g.fillStyle = MD.white; g.fillRect(x, y, w, h);
  for (let lx = x + 80; lx < x + w - 40; lx += 160 + R() * 220) lanesV.push(lx); for (let ly = y + 60; ly < y + h - 40; ly += 140 + R() * 180) lanesH.push(ly);
  g.fillStyle = MD.yellow; lanesV.forEach(lx => g.fillRect(lx, y, lw, h)); lanesH.forEach(ly => g.fillRect(x, ly, w, lw));
  const cols = [MD.red, MD.blue, MD.grey, MD.red];
  lanesH.forEach((ly, i) => { for (let k = 0; k < 9; k++) { const sp = (70 + hash(i, k, seed) * 120) * (i % 2 ? 1 : -1), px = x + (((hash(k, i, seed + 1) * w + t * sp) % w) + w) % w; g.fillStyle = cols[(i + k) % 4]; g.fillRect(px, ly, lw, lw); } });
  lanesV.forEach((lx, i) => { for (let k = 0; k < 6; k++) { const sp = (60 + hash(i, k, seed + 2) * 100) * (i % 2 ? -1 : 1), py = y + (((hash(k, i, seed + 3) * h + t * sp) % h) + h) % h; g.fillStyle = cols[(i + k + 1) % 4]; g.fillRect(lx, py, lw, lw); } });
  const big = [[.18, .3, 180, 120, MD.red], [.62, .55, 140, 160, MD.blue], [.8, .2, 120, 90, MD.yellow]]; big.forEach(([fx, fy, bw, bh, c], i) => { g.fillStyle = c; g.fillRect(x + w * fx, y + h * fy, bw, bh); g.fillStyle = MD.white; g.fillRect(x + w * fx + bw * .3, y + h * fy + bh * .3, bw * .4, bh * .4); g.fillStyle = MD.grey; g.fillRect(x + w * fx + bw * .42, y + h * fy + bh * .42, bw * .16, bh * .16); });
}
