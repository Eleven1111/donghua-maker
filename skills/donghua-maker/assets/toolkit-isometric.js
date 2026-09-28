// ═══ ISOMETRIC toolkit (等距几何): flat-shaded blocks on an isometric grid, three tones per colour (top light, left mid, right
// dark), a small pastel palette on a pale ground, no outlines or a thin dark one; towers stack in set-back tiers. Studied from
// published generative isometric works; cities are generated, never copied. Pure functions of t. references/looks/isometric.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['0,0,0', 0, .06];
const ISO = { ground: '#efe6d8', line: 'rgba(60,40,40,.08)',
  pals: [['#f4a39a', '#f7d08a', '#9fd3c7', '#6c8ebf', '#f2efe6'], ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653'], ['#ffcdb2', '#ffb4a2', '#e5989b', '#b5838d', '#6d6875']] };
// returns hex so shades can be shaded again (an rgb() result fed back in parsed as NaN → black faces)
const isoShade = (hex, f) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(clamp(v * f, 0, 255))); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
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
// ── rooms and props (isometric diorama): a floor slab and two back walls, windows on the walls, furniture as boxes, all popping in
// on beats. Axes: +x runs down-right, +y down-left; the back walls stand on y = 0 (right wall) and x = 0 (left wall).
// drop-in with overshoot: 0 before t0, z-offset factor for falling from above
const isoDrop = (t, t0, d = .4) => { const k = clamp((t - t0) / d, 0, 1); if (k <= 0) return null; const c = 2.2, u = k - 1; return { k, dz: (1 - k) * (1 - k) * 3, s: 1 + (c + 1) * u * u * u + c * u * u }; };
// room shell: floor w×d (thickness .2), walls height h (rise 0..1), colours {floor, wallL, wallR, trim}
function isoRoom(g, w, d, h, o, col, rise = 1) { isoBox(g, 0, 0, -.2, w, d, .2, col.floor, o);
  if (rise > 0) { isoBox(g, -.15, 0, 0, .15, d, h * rise, col.wallL, o); isoBox(g, -.15, -.15, 0, w + .15, .15, h * rise, col.wallR, o); } }
// a flat quad on a back wall: wall 'R' (plane y = 0, a = x) or 'L' (plane x = 0, a = y); from a to a+len along, z0 to z1
function isoWallQuad(g, wall, a, len, z0, z1, fill, o) { const P = wall === 'R' ? (u, z) => isoP(u, 0, z, o) : (u, z) => isoP(0, u, z, o); isoPoly(g, [P(a, z0), P(a + len, z0), P(a + len, z1), P(a, z1)], fill); }
// window with frame, sky pane and cross bars; k grows it from the centre
function isoWindow(g, wall, a, len, z0, z1, o, k = 1, sky = '#bfe3f2') { if (k <= 0) return; const e = clamp(k, 0, 1), cz = (z0 + z1) / 2, ca = a + len / 2, hl = len / 2 * e, hz = (z1 - z0) / 2 * e;
  isoWallQuad(g, wall, ca - hl - .08, 2 * hl + .16, cz - hz - .08, cz + hz + .08, '#ffffff', o); isoWallQuad(g, wall, ca - hl, 2 * hl, cz - hz, cz + hz, sky, o);
  isoWallQuad(g, wall, ca - .03, .06, cz - hz, cz + hz, '#ffffff', o); isoWallQuad(g, wall, ca - hl, 2 * hl, cz - .03, cz + .03, '#ffffff', o); }
// furniture (x, y = back corner on the floor): each returns nothing, draws boxes back-to-front
function isoDesk(g, x, y, o, col = '#e9e2d6', leg = '#9a8f82') { [[.05, .05], [1.35, .05], [.05, .65], [1.35, .65]].forEach(([a, b]) => isoBox(g, x + a, y + b, 0, .1, .1, .75, leg, o)); isoBox(g, x, y, .75, 1.5, .8, .1, col, o); }
function isoShelf(g, x, y, o, col = '#c8875c', books = [], kb = 1) { isoBox(g, x, y, 0, .5, 1.4, 2, col, o);
  [.55, 1.05, 1.55].forEach((z, r) => { isoBox(g, x + .05, y + .05, z - .05, .45, 1.3, .05, isoShade(col, .8), o); (books[r] || []).forEach((b, i) => { if (i / (books[r].length) > kb * 1.2 - r * .2) return; isoBox(g, x + .1, y + .12 + i * .2, z, .35, .16, b[1], b[0], o); }); }); }
function isoPlant(g, x, y, o, s = 1, pot = '#e07a5f', leaf = '#5aa469') { isoBox(g, x, y, 0, .4 * s, .4 * s, .45 * s, pot, o); const [cx, cy] = isoP(x + .2 * s, y + .2 * s, .45 * s, o), r = o.s * .28 * s;
  [[0, -1.3, 1], [-.7, -.8, .8], [.7, -.9, .85], [0, -.5, .9]].forEach(([dx, dy, m], i) => { g.fillStyle = i % 2 ? leaf : isoShade(leaf, .8); g.beginPath(); g.ellipse(cx + dx * r, cy + dy * r, r * .55 * m, r * .9 * m, dx * .6, 0, TAU); g.fill(); }); }
function isoLamp(g, x, y, z, o, shade = '#f2c14e') { isoBox(g, x, y, z, .3, .3, .05, '#5b5b5b', o); isoBox(g, x + .13, y + .13, z + .05, .04, .04, .6, '#5b5b5b', o); isoBox(g, x - .02, y - .02, z + .6, .34, .34, .28, shade, o); }
function isoRug(g, x, y, w, d, o, col = '#e76f51', k = 1) { if (k <= 0) return; const e = clamp(k, 0, 1); isoBox(g, x + w / 2 * (1 - e), y + d / 2 * (1 - e), 0, w * e, d * e, .03, col, o); if (e > .9) isoBox(g, x + .2, y + .2, .03, w - .4, d - .4, .005, isoShade(col, 1.25), o); }
// a pin label: white rounded tag with text, stalk down to a floor/prop point (x, y, z); k pops it
function isoLabel(g, str, x, y, z, o, k = 1, size = 48) { if (k <= 0) return; const [px, py] = isoP(x, y, z, o), e = clamp(k, 0, 1); g.save(); g.font = `700 ${size}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}sans-serif`;
  const tw = g.measureText(str).width + size, th = size * 1.5, lift = size * 2.2; g.strokeStyle = 'rgba(60,40,40,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - lift * e); g.stroke();
  g.translate(px, py - lift * e - th / 2); g.scale(e, e); g.fillStyle = 'rgba(60,40,40,.18)'; g.beginPath(); g.roundRect(-tw / 2 + 6, -th / 2 + 8, tw, th, th / 2); g.fill(); g.fillStyle = '#fffdf8'; g.beginPath(); g.roundRect(-tw / 2, -th / 2, tw, th, th / 2); g.fill();
  g.fillStyle = '#3b2f2f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, 0, 2); g.restore(); }
