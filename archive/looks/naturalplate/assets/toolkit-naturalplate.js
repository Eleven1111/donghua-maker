// ═══ NATURAL-PLATE toolkit (博物版画): a numbered natural-history plate — sepia fine lines, pale ochre tints, radial symmetry,
// specimens that engrave themselves in. Construction studied from public-domain 19th-century lithographic plates; drawings are our own.
// references/looks/naturalplate.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .2, VIGN_TONE = ['80,60,30', .03, .12];
const NP = { paper: '#efe7d2', paper2: '#e6dcc2', ink: '#3a2e22', inkL: 'rgba(58,46,34,.55)', ochre: '#c9a25a', bronze: '#a67c3d', sea: '#b7c8bf', rose: '#d9a89a', cream: '#f6f0de' };
const npFont = (px, w = 500) => `${w} ${px}px ${((window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : '')}"Songti SC", serif`;
// plate: paper, double rule border, header line; returns the canvas
function npPlate(title, seed = 3) {
  const c = backdrop(W + 256, H + 144, { grad: [[0, NP.paper], [1, NP.paper2]], mottle: .3, seed }), g = g2(c); g.translate(128, 72);
  g.strokeStyle = NP.ink; g.lineWidth = 3; g.strokeRect(90, 120, W - 180, H - 190); g.lineWidth = 1.2; g.strokeRect(104, 134, W - 208, H - 218);
  g.fillStyle = NP.ink; g.font = npFont(44, 600); g.textAlign = 'center'; g.fillText(title, W / 2, 96); return c;   // header above the ruled frame, never on it
}
// draw-in: every stroke of a specimen is revealed along its length by u (0→1) — the plate is engraved as you watch
function npLine(g, pts, u, lw = 2, col = NP.ink) { if (u <= 0 || pts.length < 2) return; let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([L * clamp(u, 0, 1), L + 1]); g.beginPath(); pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.stroke(); g.restore(); }
const npCircle = (x, y, r, n = 48, a0 = 0) => Array.from({ length: n + 1 }, (_, i) => [x + r * Math.cos(a0 + i / n * TAU), y + r * Math.sin(a0 + i / n * TAU)]);
function npTint(g, x, y, r, col, a) { if (a <= 0) return; g.save(); g.globalAlpha = a; const rg = g.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r); rg.addColorStop(0, NP.cream); rg.addColorStop(.7, col); rg.addColorStop(1, NP.bronze); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore(); }
// radiolarian: lattice sphere with pores, n main spines with barbs, a ring of fine secondary spines. u = draw-in progress
function npRadiolarian(g, x, y, r, u, o = {}) {
  const n = o.spines ?? 12, rot = o.rot ?? 0, s = k => clamp(u * 1.6 - k, 0, 1);
  npTint(g, x, y, r, o.tint ?? NP.ochre, s(.2) * .85);
  npLine(g, npCircle(x, y, r, 64, rot), s(0), 2.6);
  for (let ring = 1; ring <= 3; ring++) { const rr = r * ring / 3.4, m = 6 * ring; for (let k = 0; k < m; k++) { const a = rot + k / m * TAU + ring * .3, px = x + rr * Math.cos(a), py = y + rr * Math.sin(a), pr = r * (.13 - ring * .018), sp = s(.25 + ring * .08); if (sp > 0) { g.save(); g.globalAlpha = sp * .35; g.fillStyle = NP.bronze; g.beginPath(); g.arc(px + pr * .15, py + pr * .15, pr, 0, TAU); g.fill(); g.restore(); } npLine(g, npCircle(px, py, pr, 16, a), sp, 1.6); } }
  for (let k = 0; k < n; k++) { const a = rot + k / n * TAU, L = r * (o.len ?? 1.7), tip = [x + Math.cos(a) * (r + L), y + Math.sin(a) * (r + L)], base = [x + Math.cos(a) * r, y + Math.sin(a) * r];
    npLine(g, [base, tip], s(.45), 3); for (const f of [.45, .7]) { const bx = lerp(base[0], tip[0], f), by = lerp(base[1], tip[1], f), bl = r * .22 * (1 - f * .5); for (const sg of [-1, 1]) npLine(g, [[bx, by], [bx + Math.cos(a + sg * .7) * bl, by + Math.sin(a + sg * .7) * bl]], s(.7), 1.6); } }
  for (let k = 0; k < n * 3; k++) { const a = rot + (k + .5) / (n * 3) * TAU; npLine(g, [[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35]], s(.6), 1); }
}
// disc diatom: n-fold rosette of rays with rows of dotted areolae
function npDiatom(g, x, y, r, u, o = {}) {
  const n = o.n ?? 8, rot = o.rot ?? 0, s = k => clamp(u * 1.6 - k, 0, 1); npTint(g, x, y, r, o.tint ?? NP.sea, s(.2) * .8);
  npLine(g, npCircle(x, y, r, 64, rot), s(0), 2.4); npLine(g, npCircle(x, y, r * .28, 32, rot), s(.1), 1.8);
  for (let k = 0; k < n; k++) { const a = rot + k / n * TAU; npLine(g, [[x + Math.cos(a) * r * .28, y + Math.sin(a) * r * .28], [x + Math.cos(a) * r, y + Math.sin(a) * r]], s(.3), 1.6);
    if (s(.55) > 0) { g.save(); g.fillStyle = NP.ink; g.globalAlpha = s(.55); for (let j = 1; j <= 5; j++) for (let q = -2; q <= 2; q++) { const aa = a + (q + .5) / 5 * (TAU / n) * .8, rr = r * (.32 + j * .12); g.beginPath(); g.arc(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr, 2.2, 0, TAU); g.fill(); } g.restore(); } }
}
// medusa (jellyfish) seen from the side: bell with ribs and scalloped rim, ruffled oral arms, hanging tentacles. pulse 0..1 squashes the bell
function npMedusa(g, x, y, r, u, t, o = {}) {
  const s = k => clamp(u * 1.6 - k, 0, 1), p = Math.sin(t * (o.rate ?? 2.4)), bw = r * (1 + p * .07), bh = r * .8 * (1 - p * .08), rimY = y;
  g.save(); g.globalAlpha = s(.2) * .75; const gr = g.createLinearGradient(0, y - bh, 0, y); gr.addColorStop(0, NP.cream); gr.addColorStop(1, o.tint ?? NP.rose); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, bw, bh, 0, Math.PI, TAU); g.fill(); g.restore();
  const bell = []; for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; bell.push([x + bw * Math.cos(a), y + bh * Math.sin(a)]); } npLine(g, bell, s(0), 2.8);
  const rim = []; for (let i = 0; i <= 64; i++) { const xx = x - bw + i / 64 * bw * 2; rim.push([xx, rimY + Math.abs(Math.sin(i / 64 * Math.PI * 8)) * 16]); } npLine(g, rim, s(.15), 2.2);
  for (let k = 1; k < 10; k++) { const f = k / 10, xx = x - bw + f * bw * 2, top = y - bh * Math.sqrt(1 - (2 * f - 1) ** 2); npLine(g, [[x, y - bh], [lerp(x, xx, .6), lerp(y - bh, top, .5) + 8], [xx, rimY]], s(.3), 1.3, NP.inkL); }
  for (let k = 0; k < 18; k++) { const tx = x - bw * .95 + k / 17 * bw * 1.9, pts = []; for (let j = 0; j <= 14; j++) { const f = j / 14; pts.push([tx + Math.sin(t * 1.6 + k * .6 + f * 4) * 26 * f, rimY + 16 + f * r * (1.3 + hash(k, 1, 2) * .6)]); } npLine(g, pts, s(.5), 1.4); }
  for (let k = -1; k <= 1; k += 2) for (let m = 0; m < 2; m++) { const ax = x + k * r * (.12 + m * .1), pts = []; for (let j = 0; j <= 20; j++) { const f = j / 20; pts.push([ax + Math.sin(t * 1.3 + f * 7 + m) * 20 * (0.3 + f), rimY + 10 + f * r * 1.1]); } npLine(g, pts, s(.4), 4, NP.bronze); npLine(g, pts, s(.4), 1.4); }
}
// star: n arms with rounded tips and a dotted central disc (a brittle-star-like form)
function npStar(g, x, y, r, u, o = {}) {
  const n = o.n ?? 5, rot = o.rot ?? -Math.PI / 2, s = k => clamp(u * 1.6 - k, 0, 1), pts = [];
  for (let i = 0; i <= n * 2; i++) { const a = rot + i / (n * 2) * TAU, rr = i % 2 ? r * .32 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  g.save(); g.globalAlpha = s(.2) * .8; g.fillStyle = o.tint ?? NP.ochre; g.beginPath(); pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.fill(); g.restore();
  npLine(g, pts, s(0), 2.4); for (let k = 0; k < n; k++) { const a = rot + k / n * TAU; npLine(g, [[x, y], [x + Math.cos(a) * r * .92, y + Math.sin(a) * r * .92]], s(.3), 1.4, NP.inkL); }
  npLine(g, npCircle(x, y, r * .2, 24), s(.4), 1.8);
}
// plate numeral beside a specimen
function npNum(g, n, x, y, a = 1) { g.save(); g.globalAlpha = a; g.fillStyle = NP.ink; g.font = npFont(34, 500); g.textAlign = 'center'; g.fillText(String(n), x, y); g.restore(); }
// caption under a specimen / at the foot of the plate
function npCaption(g, s, x, y, px = 52, a = 1) { g.save(); g.globalAlpha = a; g.fillStyle = NP.ink; g.font = npFont(px, 500); g.textAlign = 'center'; g.fillText(s, x, y); g.restore(); }
