// ═══ VAN GOGH toolkit (梵高): short thick directional strokes over a flat colour map — swirling skies, haloed stars, flame cypresses,
// impasto ridges, complementary pairs. Studied from public-domain paintings (Starry Night, Wheat Field with Cypresses); scenes are our own.
// A shot bakes K full-frame paintings from the same colour map with shifted field phase and stroke seeds, then cycles them (the painting "breathes").
// references/looks/vangogh.md
const POST_GRAIN = .12, VIGN_TONE = ['20,20,40', .06, .3];
const VG = { ultra: '#1f3b8c', cobalt: '#2f5fb5', cerul: '#6fa3d8', pale: '#cfe3f0', chrome: '#f2c230', lemon: '#f7e27a', orange: '#e08a2c', viridian: '#2f6b4a', olive: '#7a9a3a', night: '#15204a', white: '#f4f0e0', red: '#c8452e', ochre: '#c9953a', violet: '#5a4a8a' };
// vortex field helper: base flow + tangential vortices [{x, y, r, s}] (s > 0 counter-clockwise); returns angle
function vgSwirl(x, y, base, vortices, ph = 0) {
  let vx = Math.cos(base), vy = Math.sin(base);
  for (const v of vortices) { const dx = x - v.x, dy = y - v.y, d2 = dx * dx + dy * dy, f = Math.exp(-d2 / (v.r * v.r)) * (v.s ?? 1) * 3; vx += -dy / Math.sqrt(d2 + 1) * f; vy += dx / Math.sqrt(d2 + 1) * f; }
  return Math.atan2(vy, vx) + Math.sin(x / 170 + y / 230 + ph) * .12;
}
// halo field around a light: strokes run in rings
const vgHalo = (x, y, cx, cy) => Math.atan2(y - cy, x - cx) + Math.PI / 2;
// shift a hex colour's lightness by k (−1..1) and add a little hue noise
function vgVary(r, g, b, k, hj) { const f = k > 0 ? c => c + (255 - c) * k : c => c * (1 + k); return `rgb(${clamp(f(r) + hj * 18, 0, 255) | 0},${clamp(f(g) + hj * 10, 0, 255) | 0},${clamp(f(b) - hj * 14, 0, 255) | 0})`; }
// paint: sceneFn(g) draws the flat colour map; field(x, y, ph) → angle; o = { K, spacing, len, width, seed, after(g, k, R) }
// returns an array of K canvases (W×H)
function vgPaint(sceneFn, field, o = {}) {
  const cm = mk(W, H), cg = g2(cm); sceneFn(cg); const D = cg.getImageData(0, 0, W, H).data, K = o.K ?? 3, sp = o.spacing ?? 15, out = [];
  for (let k = 0; k < K; k++) {
    const c = mk(W, H), g = g2(c), R = rng((o.seed ?? 1) * 101 + k * 7); g.drawImage(cm, 0, 0); g.lineCap = 'round';
    const ph = k / K * TAU, pts = [];
    for (let y = -sp; y < H + sp; y += sp) for (let x = -sp; x < W + sp; x += sp) pts.push([x + (R() - .5) * sp * 1.2, y + (R() - .5) * sp * 1.2, R()]);
    pts.sort((a, b) => a[2] - b[2]);
    for (const [x, y] of pts) {
      const ix = clamp(x | 0, 0, W - 1), iy = clamp(y | 0, 0, H - 1), i = (iy * W + ix) * 4, r = D[i], gg = D[i + 1], b = D[i + 2];
      const a = field(x, y, ph) + (R() - .5) * .35, L = (o.len ?? 34) * (.7 + R() * .6), w = (o.width ?? 11) * (.8 + R() * .4), dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, nx = -Math.sin(a), ny = Math.cos(a), lk = (R() - .5) * .34, hj = R() - .5;
      g.strokeStyle = vgVary(r, gg, b, lk, hj); g.lineWidth = w; g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); g.stroke();
      g.lineWidth = w * .22; g.strokeStyle = vgVary(r, gg, b, lk + .28, hj); g.beginPath(); g.moveTo(x - dx - nx * w * .25, y - dy - ny * w * .25); g.lineTo(x + dx * .8 - nx * w * .25, y + dy * .8 - ny * w * .25); g.stroke();   // ridge catching light
      g.strokeStyle = vgVary(r, gg, b, lk - .3, hj); g.beginPath(); g.moveTo(x - dx * .8 + nx * w * .3, y - dy * .8 + ny * w * .3); g.lineTo(x + dx + nx * w * .3, y + dy + ny * w * .3); g.stroke();   // shadow side
    }
    if (o.after) { g.save(); o.after(g, k, rng((o.seed ?? 1) * 997 + k)); g.restore(); }   /* contours, window lights: drawn over the brushwork, re-jittered per variant */
    out.push(c);
  }
  return out;
}
// cycle the baked paintings: step every `hold` s, ping-pong so there is no jump
function vgFrame(frames, st, hold = .25) { const n = frames.length, i = Math.floor(st / hold), p = n < 2 ? 0 : i % (2 * n - 2); return frames[p < n ? p : 2 * n - 2 - p]; }
// colour-map helpers (flat shapes, the strokes do the texture)
function vgSky(g, top, bottom, h) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, W, h); }
function vgHaloDisc(g, x, y, r, rings) { for (let i = rings.length - 1; i >= 0; i--) { g.fillStyle = rings[i]; g.beginPath(); g.arc(x, y, r * (1 + i * .45), 0, TAU); g.fill(); } }
function vgHills(g, y, amp, len, col, ph = 0) { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, y + Math.sin(x / len + ph) * amp + Math.sin(x / len * 2.7 + ph * 2) * amp * .35); g.lineTo(W, H); g.closePath(); g.fill(); }
// cypress: stacked flame tongues, dark core with lighter edges (the strokes then run upward through it)
function vgCypress(g, x, y, w, h, col, edge) {
  for (let i = 0; i < 14; i++) { const t = i / 13, cy = y - h * t, ww = (w * .55 * (1 - t) ** .7 + 12) * (1 + .28 * Math.sin(i * 2.3)), sway = Math.sin(t * 8) * w * .06;
    g.fillStyle = edge ?? col; g.beginPath(); g.ellipse(x + sway, cy - h * .04, ww * 1.05, h * .085, Math.sin(i) * .2, 0, TAU); g.fill();
    g.fillStyle = col; g.beginPath(); g.ellipse(x + sway + ww * .1, cy - h * .04, ww * .7, h * .075, Math.sin(i) * .2, 0, TAU); g.fill(); }
  g.fillStyle = edge ?? col; g.beginPath(); g.moveTo(x - w * .08, y - h * .95); g.quadraticCurveTo(x, y - h * 1.08, x + w * .06, y - h * .95); g.fill();
}
// cloud: a cluster of lobes (never a single ellipse)
function vgCloud(g, x, y, w, h, col, seed) { g.fillStyle = col; for (let i = 0; i < 7; i++) { const u = i / 6; g.beginPath(); g.ellipse(x - w / 2 + u * w, y + Math.sin(u * 3 + seed) * h * .25, w * .16 + hash(i, seed, 1) * w * .08, h * (.5 + hash(i, seed, 2) * .4), 0, 0, TAU); g.fill(); } }
// village: houses with pitched roofs, a spire, lit windows; returns window centres for reflections
function vgVillage(g, y, x0, x1, seed, o = {}) {
  const win = []; let x = x0, i = 0;
  while (x < x1) { const w = 90 + hash(i, 1, seed) * 90, h = 60 + hash(i, 2, seed) * 90, yy = y - hash(i, 5, seed) * 30;
    g.fillStyle = o.wall ?? '#3a3f6a'; g.fillRect(x, yy - h, w, h + 40); g.fillStyle = o.roof ?? '#1c2146'; g.beginPath(); g.moveTo(x - 12, yy - h); g.lineTo(x + w * .5, yy - h - 50 - hash(i, 3, seed) * 30); g.lineTo(x + w + 12, yy - h); g.fill();
    if (hash(i, 4, seed) > .3) { g.fillStyle = VG.chrome; const wx = x + w * (.25 + hash(i, 6, seed) * .4); g.fillRect(wx, yy - h * .6, 24, 30); win.push(wx + 12); }
    x += w + 10 + hash(i, 7, seed) * 60; i++; }
  if (o.spire) { const sx = o.spire; g.fillStyle = '#2a2f5a'; g.fillRect(sx - 30, y - 220, 60, 240); g.beginPath(); g.moveTo(sx - 36, y - 220); g.lineTo(sx, y - 420); g.lineTo(sx + 36, y - 220); g.fill(); }
  return win;
}
// broken dark contour along a polyline: short overlapping strokes, the way the painter redraws an edge
function vgContour(g, pts, R, o = {}) { g.strokeStyle = o.col ?? 'rgba(18,22,48,.8)'; g.lineCap = 'round'; for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 26)); for (let k = 0; k < n; k++) { const a = k / n, b = (k + 1.25) / n, j = () => (R() - .5) * 6; g.lineWidth = (o.w ?? 7) * (.7 + R() * .6); g.beginPath(); g.moveTo(lerp(x0, x1, a) + j(), lerp(y0, y1, a) + j()); g.lineTo(lerp(x0, x1, b) + j(), lerp(y0, y1, b) + j()); g.stroke(); } } }
// cypress contour + inner flame strokes (dark), for the after hook
function vgCypressInk(g, x, y, w, h, R) {
  const L = [], Rr = []; for (let i = 0; i <= 14; i++) { const t = i / 14, ww = (w * .55 * (1 - t) ** .7 + 12) * (1 + .28 * Math.sin(i * 13 / 14 * 2.3)), sway = Math.sin(t * 8) * w * .06; L.push([x + sway - ww * 1.12, y - h * t]); Rr.push([x + sway + ww * 1.12, y - h * t]); }
  vgContour(g, L, R); vgContour(g, Rr, R);
  g.strokeStyle = 'rgba(8,26,18,.85)'; for (let i = 0; i < 110; i++) { const t = R(), cy = y - h * t, ww = (w * .55 * (1 - t) ** .7) * .8, cx = x + Math.sin(t * 8) * w * .06 + (R() - .5) * ww * 1.4; g.lineWidth = 8 + R() * 7; g.beginPath(); g.moveTo(cx, cy + 30); g.quadraticCurveTo(cx + (R() - .5) * 30, cy, cx + (R() - .5) * 20, cy - 50); g.stroke(); }
}
