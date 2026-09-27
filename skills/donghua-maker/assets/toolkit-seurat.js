// ═══ SEURAT toolkit (修拉 · 点彩): the frame is built from small dots of pure pigment that the eye mixes — each area is split into its two
// nearest palette colours at the right ratio, with complementary accents in shadow and light, and a dotted border.
// Studied from public-domain pointillist paintings (A Sunday on La Grande Jatte); scenes and figures are our own. references/looks/seurat.md
// The colour map is laid underneath first (the painter's base layer), so gaps between dots never read as white noise.
// Background: K baked dot paintings of a flat colour map. Movers: sprites re-dotted every exposure (they shimmer like the rest).
const POST_GRAIN = .08, VIGN_TONE = ['40,40,60', .02, .1];
const SR = { pal: ['#f6f3ea', '#f4e7b0', '#f2c94c', '#e8893a', '#c8452e', '#d98ab0', '#8a5aa8', '#3a4fa0', '#5f8fd0', '#8fc3dc', '#3f8a4a', '#9cc45a', '#2a2a50'].map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]), border: 44 };
const srHex = c => `rgb(${c[0]},${c[1]},${c[2]})`;
// pick a pure pigment for base colour (r, g, b): two nearest palette colours mixed stochastically at the ratio that best matches, plus accents
function srPick(r, g, b, u, v) {
  const P = SR.pal, d = P.map((p, i) => [(p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2, i]).sort((a, c) => a[0] - c[0]), A = P[d[0][1]], B = P[d[1][1]];
  const ab = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], t = clamp(((r - A[0]) * ab[0] + (g - A[1]) * ab[1] + (b - A[2]) * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 + 1), 0, 1);
  const L = (r * .3 + g * .59 + b * .11) / 255;
  if (v < .08) return L < .45 ? P[v < .05 ? 6 : 7] : L > .62 ? P[v < .05 ? 2 : 3] : P[d[2][1]];   // complementary accents: violet/blue in shade, yellow/orange in light
  return u < t ? B : A;
}
function srDotLayer(g, D, w, h, o, R) {
  const sp = o.spacing ?? 7, r0 = o.r ?? 4.2;
  for (let y = 0; y < h; y += sp) for (let x = 0; x < w; x += sp) {
    const px = x + (R() - .5) * sp, py = y + (R() - .5) * sp, ix = clamp(px | 0, 0, w - 1), iy = clamp(py | 0, 0, h - 1), i = (iy * w + ix) * 4; if (o.alpha && D[i + 3] < 128) continue;
    const j = o.mix ?? 70; g.fillStyle = srHex(srPick(D[i] + (R() - .5) * j, D[i + 1] + (R() - .5) * j, D[i + 2] + (R() - .5) * j, R(), R()));   /* jitter before picking: neighbouring pigments mix in (optical mixing) */ g.beginPath(); g.arc((o.ox ?? 0) + px, (o.oy ?? 0) + py, r0 * (.8 + R() * .5), 0, TAU); g.fill();
  }
}
// bake K dot paintings of sceneFn's flat colour map (with a dotted complementary border)
function srPaint(sceneFn, o = {}) {
  const cm = mk(W, H), cg = g2(cm); sceneFn(cg); const D = cg.getImageData(0, 0, W, H).data, out = [];
  for (let k = 0; k < (o.K ?? 2); k++) { const c = mk(W, H), g = g2(c), R = rng((o.seed ?? 1) * 131 + k); g.globalAlpha = .85; g.drawImage(cm, 0, 0); g.globalAlpha = 1; srDotLayer(g, D, W, H, o, R);
    if (o.border !== false) { const b = SR.border; for (let y = 0; y < H; y += 7) for (let x = 0; x < W; x += 7) { if (x > b && x < W - b && y > b && y < H - b) continue; g.fillStyle = srHex(SR.pal[R() < .6 ? 7 : R() < .5 ? 3 : 12]); g.beginPath(); g.arc(x + (R() - .5) * 5, y + (R() - .5) * 5, 3.4, 0, TAU); g.fill(); } }
    out.push(c); }
  return out;
}
// a mover: flat-colour sprite, re-dotted live each exposure with seed e
function srSprite(w, h, drawFn) { const c = mk(w, h), g = g2(c); drawFn(g); return { w, h, D: g.getImageData(0, 0, w, h).data }; }
function srDotSprite(g, sp, x, y, e, o = {}) { srDotLayer(g, sp.D, sp.w, sp.h, { ...o, alpha: true, ox: x, oy: y }, rng(e * 7919 + (o.seed ?? 1))); }
const srFrame = (frames, st, hold = .25) => frames[Math.floor(st / hold) % frames.length];
// stiff profile figures (the painting's geometry): lady with bustle and parasol, gentleman in top hat, a small dog
function srLady(g, x, y, s, col = '#3a2f5a', para = '#c8452e') {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col;
  g.beginPath(); g.moveTo(-40, 0); g.lineTo(-28, -230); g.quadraticCurveTo(-20, -300, 10, -300); g.lineTo(28, -250); g.quadraticCurveTo(95, -210, 70, -120); g.quadraticCurveTo(60, -60, 55, 0); g.closePath(); g.fill();
  g.fillStyle = '#e9c9a8'; g.beginPath(); g.ellipse(4, -330, 24, 30, 0, 0, TAU); g.fill(); g.fillStyle = '#2a2a50'; g.beginPath(); g.ellipse(0, -360, 40, 14, 0, 0, TAU); g.fill(); g.fillRect(-18, -392, 36, 32);
  g.strokeStyle = '#2a2a50'; g.lineWidth = 6; g.beginPath(); g.moveTo(-10, -250); g.lineTo(-30, -470); g.stroke(); g.fillStyle = para; g.beginPath(); g.moveTo(-190, -440); g.quadraticCurveTo(-30, -560, 130, -440); g.closePath(); g.fill();
  g.restore();
}
function srDog(g, x, y, s, col = '#2a2a50') { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.beginPath(); g.ellipse(0, -50, 70, 26, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(72, -72, 24, 18, -.3, 0, TAU); g.fill(); [-45, -25, 30, 48].forEach(lx => g.fillRect(lx, -40, 9, 40)); g.beginPath(); g.moveTo(-66, -60); g.quadraticCurveTo(-110, -100, -95, -120); g.lineWidth = 8; g.strokeStyle = col; g.stroke(); g.restore(); }
function srGent(g, x, y, s, col = '#2a2a50') { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.fillRect(-30, -260, 60, 260); g.fillStyle = '#e9c9a8'; g.beginPath(); g.ellipse(0, -290, 24, 30, 0, 0, TAU); g.fill(); g.fillStyle = col; g.fillRect(-26, -370, 52, 64); g.fillRect(-40, -312, 80, 10); g.restore(); }
function srSail(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#f6f3ea'; g.beginPath(); g.moveTo(0, -10); g.lineTo(0, -200); g.lineTo(110, -10); g.closePath(); g.fill(); g.fillStyle = '#c8452e'; g.fillRect(-40, -10, 170, 22); g.restore(); }
