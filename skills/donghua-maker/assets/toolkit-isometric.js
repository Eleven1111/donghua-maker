// ═══ ISOMETRIC toolkit (等距几何): flat-shaded blocks on an isometric grid, three tones per colour (top light, left mid, right
// dark), a small pastel palette on a pale ground, no outlines or a thin dark one; towers stack in set-back tiers. Studied from
// published generative isometric works; cities are generated, never copied. Pure functions of t. references/looks/isometric.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['0,0,0', 0, .06];
const ISO = { ground: '#efe6d8', line: 'rgba(60,40,40,.08)',
  pals: [['#f4a39a', '#f7d08a', '#9fd3c7', '#6c8ebf', '#f2efe6'], ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653'], ['#ffcdb2', '#ffb4a2', '#e5989b', '#b5838d', '#6d6875']] };
const isoShade = (hex, f) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(clamp(v * f, 0, 255))); return `rgb(${c.join(',')})`; };
// world (x, y on the grid, z up) → screen, s = one grid unit in px
function isoP(x, y, z, o) { return [o.x + (x - y) * o.s * .866, o.y + (x + y) * o.s * .5 - z * o.s]; }
function isoPoly(g, pts, fill) { g.fillStyle = fill; g.beginPath(); pts.forEach(p => g.lineTo(p[0], p[1])); g.closePath(); g.fill(); }
// box from (x,y,z) of size w×d×h; faces: top (1.08×), left (0.86×), right (0.66×)
function isoBox(g, x, y, z, w, d, h, col, o) {
  if (h <= 0) return; const P = (a, b, c) => isoP(a, b, c, o);
  isoPoly(g, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], isoShade(col, .86));
  isoPoly(g, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], isoShade(col, .66));
  isoPoly(g, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], isoShade(col, 1.08));
  if (o.edge) { g.strokeStyle = o.edge; g.lineWidth = 2; g.beginPath(); [[P(x, y + d, z + h), P(x + w, y + d, z + h)], [P(x + w, y + d, z + h), P(x + w, y + d, z)], [P(x + w, y + d, z + h), P(x + w, y, z + h)]].forEach(([a, b]) => { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }); g.stroke(); }
}
// city: n×n lots; each lot a tower of 1–3 set-back tiers (o.bias(i, j) scales height, e.g. taller towards the middle);
// returns lots sorted back-to-front with their tiers and a random rank t
function isoCity(seed, n, pal, o = {}) {
  const R = rng(seed), lots = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (R() < (o.empty ?? .12)) continue; const tiers = [], H = 1 + Math.floor(R() * R() * (o.maxH ?? 7) * (o.bias ? o.bias(i, j) : 1));
    let z = 0, inset = 0, col = pal[Math.floor(R() * pal.length)];
    for (let k = 0, hh = H; k < 3 && hh > 0; k++) { const th = k === 2 ? hh : Math.max(1, Math.round(hh * (.5 + R() * .4))); tiers.push({ z, h: th, inset, col }); z += th; hh -= th; inset += .12 + R() * .08; if (R() < .4) col = pal[Math.floor(R() * pal.length)]; }
    lots.push({ i, j, tiers, t: R() }); }
  return lots.sort((a, b) => (a.i + a.j) - (b.i + b.j) || a.i - b.i);
}
// draw the city: tile(l) → 0..1 ground tile pop, rise(l) → 0..1 height factor (overshoot allowed)
function isoCityDraw(g, lots, o, tile = () => 1, rise = () => 1) {
  lots.forEach(l => { const k = tile(l); if (k <= 0) return; const s = .92 * eio(clamp(k, 0, 1)), c = (1 - s) / 2;
    isoBox(g, l.i + c, l.j + c, 0, s, s, .06, '#d9cdbb', o);
    const r = rise(l); if (r <= 0) return;
    l.tiers.forEach(tr => { const zz = tr.z * r, hh = tr.h * r, m = .08 + tr.inset; isoBox(g, l.i + m, l.j + m, zz, 1 - 2 * m, 1 - 2 * m, hh, tr.col, o); }); });
}
