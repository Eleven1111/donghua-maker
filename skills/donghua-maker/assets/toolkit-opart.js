// ═══ OPART toolkit (欧普艺术): black and white only, hard edges, repeated units whose geometry shifts gradually so the eye
// sees motion, bulge and vibration that isn't there — wavy stripe fields, a checkerboard swelling into a sphere, moiré from two
// ring sets. Studied from public-domain and published Op Art works; fields are generated, never copied. Pure functions of t.
// references/looks/opart.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .02, VIGN_TONE = ['0,0,0', 0, .04];
const OP = { white: '#f3f1ea', black: '#111111' };
// wavy stripes: n bands across (x, y, w, h); band edges are sine curves whose amplitude and phase drift along the band,
// so neighbouring edges bunch and open (the vibration). amp(u) / ph(u) take u = 0..1 across the field.
function opWaves(g, x, y, w, h, n, t, o = {}) {
  const amp = o.amp ?? (u => 40 + 30 * Math.sin(u * PI)), freq = o.freq ?? 3.2, step = w / 160;
  const edge = (k, px) => { const u = k / n, v = (px - x) / w; return y + u * h + amp(u) * Math.sin(v * freq * TAU + u * (o.twist ?? 5) + t * (o.speed ?? 1.2)); };
  g.fillStyle = OP.black;
  for (let k = 0; k < n; k += 2) { g.beginPath(); for (let px = x; px <= x + w + .1; px += step) g.lineTo(px, edge(k, px)); for (let px = x + w; px >= x - .1; px -= step) g.lineTo(px, edge(k + 1, px)); g.closePath(); g.fill(); }
}
// checkerboard with a bulge: grid points pushed out from (cx, cy) by a gaussian swell of strength s (the sphere illusion)
function opBulge(g, x, y, w, h, cells, cx, cy, R, s) {
  const cw = w / cells, rows = Math.round(h / cw), warp = (px, py) => { const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy), f = 1 + s * Math.exp(-((d / R) ** 2)); return [cx + dx * f, cy + dy * f]; };
  g.fillStyle = OP.black;
  for (let i = 0; i < cells; i++) for (let j = 0; j < rows; j++) { if ((i + j) % 2) continue;
    const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => warp(x + a * cw, y + b * cw)); g.beginPath();
    q.forEach((p, k) => { const nx = q[(k + 1) % 4], m = warp((x + [i, i + 1, i + 1, i][k] * cw + x + [i + 1, i + 1, i, i][k] * cw) / 2, (y + [j, j, j + 1, j + 1][k] * cw + y + [j, j + 1, j + 1, j][k] * cw) / 2);
      if (!k) g.moveTo(p[0], p[1]); g.quadraticCurveTo(2 * m[0] - (p[0] + nx[0]) / 2, 2 * m[1] - (p[1] + nx[1]) / 2, nx[0], nx[1]); });
    g.fill(); }
}
// moiré: black rings round c1, then rings round c2 drawn with 'difference' in white (overlaps flip), gap = ring spacing
function opRings(g, c1, c2, gap, rmax, lw) {
  g.save(); g.lineWidth = lw ?? gap / 2; g.strokeStyle = OP.black;
  for (let r = gap; r < rmax; r += gap) { g.beginPath(); g.arc(c1[0], c1[1], r, 0, TAU); g.stroke(); }
  g.globalCompositeOperation = 'difference'; g.strokeStyle = '#ffffff';
  for (let r = gap; r < rmax; r += gap) { g.beginPath(); g.arc(c2[0], c2[1], r, 0, TAU); g.stroke(); }
  g.restore();
}
