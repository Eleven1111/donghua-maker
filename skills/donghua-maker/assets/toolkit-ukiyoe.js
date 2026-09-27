// ═══ UKIYO-E toolkit (浮世绘): Prussian-blue woodblock look — flat fills with indigo keylines, bokashi bands, clawed wave foam,
// cloud bands, straight-line rain, a vertical title cartouche. Rules studied from public-domain Edo prints; compositions are our own.
// references/looks/ukiyoe.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .3, VIGN_TONE = ['60,45,20', .04, .16];
const UK = { paper: '#efe3c8', paper2: '#e5d5b3', key: '#1b2a44', b0: '#16305a', b1: '#24497c', b2: '#4a78a6', b3: '#8fb2cc', b4: '#c9dae0', foam: '#f7f1e2', red: '#c8432b', ochre: '#c99a52', hull: '#e3c39a', skin: '#e9d2b0', grey: '#8d8a80' };
const ukFont = (px, w = 600) => `${w} ${px}px ${((window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : '')}"Songti SC", serif`;
// paper with woodgrain: long faint horizontal streaks, plus fibre specks
function ukPaper(seed = 3) { const c = backdrop(W + 256, H + 144, { grad: [[0, UK.paper], [1, UK.paper2]], mottle: .35, hstreak: .25, seed }); const g = g2(c), R = rng(seed); for (let i = 0; i < 260; i++) { const y = R() * c.height; g.strokeStyle = `rgba(110,85,50,${.02 + R() * .04})`; g.lineWidth = 1 + R() * 3; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= c.width; x += 80) g.lineTo(x, y + Math.sin(x / 300 + i) * 6); g.stroke(); } return c; }
// bokashi: a flat colour graded into the paper over a band (the printer wiped the block) — hard at one end, gone at the other
function ukBokashi(g, x, y, w, h, col, o = {}) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, col); gr.addColorStop(o.hold ?? .15, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.globalAlpha = o.a ?? 1; g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore(); }
// fill + keyline, the fill printed a few px off register
function ukShape(g, path, fill, o = {}) { g.save(); g.translate(o.mx ?? 3, o.my ?? 2); g.fillStyle = fill; g.beginPath(); path(g); g.fill(); g.restore(); if (o.line !== false) { g.save(); g.strokeStyle = o.key ?? UK.key; g.lineWidth = o.lw ?? 4; g.lineJoin = 'round'; g.beginPath(); path(g); g.stroke(); g.restore(); } }
// cloud band: a row of rounded lobes with a flat bottom, drifting in x
function ukCloud(g, x, y, w, h, seed, o = {}) { const n = Math.max(3, Math.round(w / (h * 1.1))), R = rng(seed); const lobes = []; for (let i = 0; i < n; i++) lobes.push([x + (i + .5) * w / n, y - R() * h * .35, h * (.45 + R() * .25)]);
  ukShape(g, gg => { gg.moveTo(x, y + h * .3); lobes.forEach(([cx, cy, r]) => gg.arc(cx, cy + h * .3 - r * .2, r, Math.PI, 0)); gg.lineTo(x + w, y + h * .3); gg.closePath(); }, o.col ?? UK.foam, { lw: 2.5, key: o.key ?? UK.b2 }); }
// snow-capped mountain with bokashi from the peak; ragged snow edge
function ukMountain(g, x, y, w, h, o = {}) {
  const tri = gg => { gg.moveTo(x - w / 2, y); gg.lineTo(x - w * .06, y - h); gg.lineTo(x + w * .06, y - h * .98); gg.lineTo(x + w / 2, y); gg.closePath(); };
  g.save(); g.beginPath(); tri(g); g.clip(); g.fillStyle = o.col ?? UK.b2; g.fillRect(x - w, y - h, w * 2, h); ukBokashi(g, x - w, y - h * .45, w * 2, h * .45, 'rgba(0,0,0,0)'); const gr = g.createLinearGradient(0, y - h, 0, y); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, UK.paper); g.fillStyle = gr; g.fillRect(x - w, y - h, w * 2, h);
  g.fillStyle = UK.foam; g.beginPath(); g.moveTo(x - w, y - h * 1.1); g.lineTo(x + w, y - h * 1.1); for (let i = 12; i >= 0; i--) { const sx = x - w * .28 + i / 12 * w * .56; g.lineTo(sx, y - h * (.72 + (i % 2 ? .1 : -.04) * (1 - Math.abs(i - 6) / 7))); } g.closePath(); g.fill(); g.restore();
  g.save(); g.strokeStyle = UK.key; g.lineWidth = 3; g.beginPath(); tri(g); g.stroke(); g.restore();
}
// ── the wave: spine = outer edge from base up to the crest, then a curl; body fills under it; foam + claws on the crest ──
function ukWaveSpine(B, T, Q, C, sweep, n = 60) {   // B base, T crest, Q control, C curl centre, sweep rad (curl length)
  const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([(1 - t) ** 2 * B[0] + 2 * (1 - t) * t * Q[0] + t * t * T[0], (1 - t) ** 2 * B[1] + 2 * (1 - t) * t * Q[1] + t * t * T[1]]); }
  const a0 = Math.atan2(T[1] - C[1], T[0] - C[0]), r0 = Math.hypot(T[0] - C[0], T[1] - C[1]); for (let i = 1; i <= 30; i++) { const u = i / 30, a = a0 - sweep * u, r = r0 * (1 - .6 * u); pts.push([C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)]); }
  return pts;
}
const ukNorm = (P, i) => { const a = P[Math.min(P.length - 1, i + 1)], b = P[Math.max(0, i - 1)], an = Math.atan2(a[1] - b[1], a[0] - b[0]); return [-Math.sin(an), Math.cos(an)]; };   // outward: away from the body, toward the open side of the curl
// wave: o = { B, T, Q, C, sweep, F (front-face foot), st } — draws body, inner stripes, foam band, claws, spray
function ukWave(g, o) {
  const P = ukWaveSpine(o.B, o.T, o.Q, o.C, o.sweep), E = P[P.length - 1], F = o.F;
  const body = gg => { gg.moveTo(o.B[0], H + 200); gg.lineTo(o.B[0], o.B[1]); P.forEach(p => gg.lineTo(p[0], p[1])); gg.quadraticCurveTo(E[0] + (F[0] - E[0]) * .2 + 140, (E[1] + F[1]) / 2, F[0], F[1]); gg.lineTo(F[0], H + 200); gg.closePath(); };
  g.save(); g.beginPath(); body(g); g.clip(); const gr = g.createLinearGradient(0, o.T[1], 0, H); gr.addColorStop(0, UK.b1); gr.addColorStop(.5, UK.b0); gr.addColorStop(1, UK.b0); g.fillStyle = gr; g.fillRect(-W, -H, W * 3, H * 3);
  g.strokeStyle = UK.b2; g.lineWidth = 7; g.lineCap = 'round'; for (let k = 1; k <= 6; k++) { g.beginPath(); P.slice(0, 61).forEach((p, i) => { const [nx, ny] = ukNorm(P, i), d = -k * 46; g[i ? 'lineTo' : 'moveTo'](p[0] + nx * d, p[1] + ny * d); }); g.stroke(); } g.restore();
  g.save(); g.strokeStyle = UK.key; g.lineWidth = 5; g.beginPath(); body(g); g.stroke(); g.restore();
  // foam band along the last part of the spine, then claws on its outer edge
  const f0 = Math.floor(P.length * .45); g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = UK.key; g.lineWidth = 50; g.beginPath(); P.slice(f0).forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.stroke(); g.strokeStyle = UK.foam; g.lineWidth = 42; g.stroke(); g.restore();
  for (let i = f0; i < P.length - 2; i += 4) { const [nx, ny] = ukNorm(P, i), p = P[i], len = 60 + hash(i, 3, 1) * 40, wig = Math.sin(o.st * 6 + i) * .15;
    for (let f = -1; f <= 1; f++) { const a = Math.atan2(ny, nx) + f * .5 + wig, bx = p[0] + nx * 20, by = p[1] + ny * 20, tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len, cx = bx + Math.cos(a - .5) * len * .6, cy = by + Math.sin(a - .5) * len * .6;
      g.save(); g.fillStyle = UK.foam; g.strokeStyle = UK.key; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx - ny * 16, by + nx * 16); g.quadraticCurveTo(cx - ny * 30, cy + nx * 30, tx, ty); g.quadraticCurveTo(cx + ny * 2, cy - nx * 2, bx + ny * 16, by - nx * 16); g.closePath(); g.fill(); g.stroke(); g.restore(); } }
  // spray: white dots flung ahead of the curl, falling
  for (let i = 0; i < 70; i++) { const ph = (o.st * .5 + hash(i, 1, 9)) % 1, sx = E[0] - 60 - hash(i, 2, 9) * 520 * ph, sy = E[1] - 80 + (ph * ph) * 700 - hash(i, 3, 9) * 180, r = 5 + hash(i, 4, 9) * 9; g.fillStyle = UK.foam; g.globalAlpha = 1 - ph; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill(); g.globalAlpha = 1; }
}
// rolling swell band with keyline and foam dots on the crests
function ukSwell(g, y, amp, len, phase, col, o = {}) {
  const top = x => y + Math.sin(x / len * TAU + phase) * amp; ukShape(g, gg => { gg.moveTo(-200, H + 200); for (let x = -200; x <= W + 200; x += 20) gg.lineTo(x, top(x)); gg.lineTo(W + 200, H + 200); gg.closePath(); }, col, { lw: 3.5 });
  if (o.foam) for (let x = -200; x <= W + 200; x += 16) { const s = Math.sin(x / len * TAU + phase); if (s < -.85) { g.fillStyle = UK.foam; g.beginPath(); g.arc(x, top(x) - 6, 5, 0, TAU); g.fill(); } }
}
// long boat with a row of rowers (bowed backs), rocked by the sea
function ukBoat(g, x, y, s, rot, st) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  ukShape(g, gg => { gg.moveTo(-340, -30); gg.quadraticCurveTo(0, 50, 360, -60); gg.lineTo(330, -10); gg.quadraticCurveTo(0, 90, -320, 10); gg.closePath(); }, UK.hull, { lw: 4 });
  for (let i = 0; i < 7; i++) { const bx = -230 + i * 72, by = 8 - Math.sin(i / 6 * Math.PI) * 6, bow = Math.sin(st * 3 + i * .3) * 4;
    ukShape(g, gg => { gg.ellipse(bx, by - 26 - bow, 26, 20, -.3, Math.PI, TAU); gg.closePath(); }, UK.b0, { lw: 2.5 }); }
  g.restore();
}
// vertical cartouche: pale panel, double frame, title top-down, a small red seal beside it
function ukCartouche(g, x, y, title, o = {}) { const px = o.px ?? 64, w = px * 1.5, h = title.length * px * 1.1 + px * .6; g.save(); g.globalAlpha = o.a ?? 1;
  g.fillStyle = o.bg ?? UK.b4; g.fillRect(x, y, w, h); g.strokeStyle = UK.key; g.lineWidth = 4; g.strokeRect(x, y, w, h); g.lineWidth = 1.5; g.strokeRect(x + 8, y + 8, w - 16, h - 16);
  g.fillStyle = UK.key; g.font = ukFont(px); g.textAlign = 'center'; g.textBaseline = 'top'; [...title].forEach((c, i) => g.fillText(c, x + w / 2, y + px * .35 + i * px * 1.1));
  if (o.seal) { const s = px * .8; g.fillStyle = UK.red; g.fillRect(x - s - 14, y + h - s, s, s); g.fillStyle = UK.paper; g.font = ukFont(Math.round(s * .62)); g.textBaseline = 'middle'; g.fillText(o.seal, x - s / 2 - 14, y + h - s / 2 + 2); }
  g.restore(); }
// straight-line rain: fine parallel strokes at one angle, dense, moving fast
function ukRain(g, st, o = {}) { const n = o.n ?? 900, ang = o.ang ?? .12, L = o.len ?? 140; g.save(); g.strokeStyle = o.col ?? 'rgba(27,42,68,.55)'; g.lineWidth = o.lw ?? 2; g.beginPath();
  for (let i = 0; i < n; i++) { const x0 = hash(i, 1, 4) * (W + 400) - 200, sp = 1400 + hash(i, 2, 4) * 600, y = ((hash(i, 3, 4) * (H + L) + st * sp) % (H + L)) - L; g.moveTo(x0 + y * ang, y); g.lineTo(x0 + (y + L) * ang, y + L); }
  g.stroke(); g.restore(); }
