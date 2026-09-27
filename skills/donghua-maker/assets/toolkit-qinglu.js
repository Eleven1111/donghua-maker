// ═══ QINGLU handscroll toolkit (青绿长卷): a long silk handscroll mixing blue-green mountains (azurite → malachite → ochre foot,
// ink contours, texture strokes, tree dots, mist bands) with a busy riverside town (ruled architecture, a rainbow bridge, boats,
// crowds of tiny figures). Studied from public-domain Song scrolls (千里江山图, 清明上河图); every element here is our own drawing.
// The world is one wide canvas baked at build(); people and boats are drawn live on top. Read right → left: pan the camera leftward.
// references/looks/qinglu.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .18, VIGN_TONE = ['60,40,10', .05, .2];
const QL = { silk: '#c9a86a', silk2: '#b8955a', ink: '#3a2a18', inkL: 'rgba(58,42,24,.55)', azur: '#2a6fa8', mala: '#3f9a7a', malaL: '#7fb89a', ochre: '#b88a4a', wood: '#8a6238', woodL: '#b58a58', roof: '#5a6a6a', roofG: '#3f7a7a', white: '#efe6d0', red: '#b8412e', brocade: '#2f4a4a' };
// aged silk: warm ground, vertical thread streaks, darker foxing
function qlSilk(w, h, seed = 3) { const c = mk(w, h), g = g2(c), R = rng(seed); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, QL.silk2); gr.addColorStop(.5, QL.silk); gr.addColorStop(1, QL.silk2); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w / 3; i++) { g.fillStyle = `rgba(${R() < .5 ? '90,65,30' : '230,210,160'},${.03 + R() * .05})`; g.fillRect(R() * w, 0, 1 + R() * 2, h); }
  for (let i = 0; i < w / 60; i++) { const x = R() * w, y = R() * h, r = 20 + R() * 120, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(100,70,30,.12)'); rg.addColorStop(1, 'rgba(100,70,30,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
  return c; }
// a mountain massif: jagged profile, vertical gradient azurite → malachite → ochre foot, ink contour, texture strokes, tree dots on ridges
function qlMountain(g, x, base, w, h, seed, o = {}) {
  const R = rng(seed), n = 40, pts = [];
  const peaks = Array.from({ length: 3 + Math.floor(R() * 3) }, () => [R(), .45 + R() * .55, .08 + R() * .12]);
  for (let i = 0; i <= n; i++) { const u = i / n; let f = 0; peaks.forEach(([c, a, s]) => f = Math.max(f, a * Math.exp(-((u - c) ** 2) / (2 * s * s)))); f *= Math.sin(u * Math.PI) ** .35; pts.push([x - w / 2 + u * w, base - h * f * (1 + (R() - .5) * .06)]); }
  const path = () => { g.beginPath(); g.moveTo(x - w / 2, base); pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(x + w / 2, base); g.closePath(); };
  g.save(); path(); g.clip(); const gr = g.createLinearGradient(0, base - h, 0, base); gr.addColorStop(0, o.top ?? QL.azur); gr.addColorStop(.45, o.mid ?? QL.mala); gr.addColorStop(.8, QL.malaL); gr.addColorStop(1, QL.ochre); g.fillStyle = gr; g.globalAlpha = o.a ?? 1; g.fillRect(x - w / 2, base - h, w, h);
  g.globalAlpha = (o.a ?? 1) * .5; g.strokeStyle = QL.ink; g.lineWidth = 1.4; for (let i = 0; i < w * h / 2600; i++) { const px = x - w / 2 + R() * w, py = base - R() * h, a = -Math.PI / 2 + (px < x ? -.6 : .6) + (R() - .5) * .3; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * 26, py + Math.sin(a) * 26); g.stroke(); }
  g.restore();
  g.save(); g.globalAlpha = o.a ?? 1; g.strokeStyle = QL.ink; g.lineWidth = 2.2; g.beginPath(); pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.stroke();
  g.fillStyle = '#23402f'; for (let i = 2; i < n - 2; i++) if (R() < .6) { const [px, py] = pts[i]; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(px + (R() - .5) * 30, py + 4 + R() * 16, 3 + R() * 3, 0, TAU); g.fill(); } }
  g.restore();
}
// mist band: silk-coloured soft horizontal band that separates ranges
function qlMist(g, x, y, w, h, a = .75) { const gr = g.createLinearGradient(0, y - h / 2, 0, y + h / 2); gr.addColorStop(0, 'rgba(201,168,106,0)'); gr.addColorStop(.5, `rgba(214,188,130,${a})`); gr.addColorStop(1, 'rgba(201,168,106,0)'); g.fillStyle = gr; g.fillRect(x, y - h / 2, w, h); }
// water: pale wash plus rows of small ink ripple arcs
function qlWater(g, x, y, w, h, seed) { const R = rng(seed); g.fillStyle = 'rgba(160,190,170,.35)'; g.fillRect(x, y, w, h); g.strokeStyle = QL.inkL; g.lineWidth = 1.3;
  for (let yy = y + 14; yy < y + h; yy += 22) for (let xx = x + (yy % 44 ? 0 : 20); xx < x + w; xx += 40) { if (R() < .25) continue; g.beginPath(); g.arc(xx, yy + 10, 14, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); } }
// ruled house (oblique view): front face, side, hip roof with tile lines; o.shop adds an awning and counter
function qlHouse(g, x, y, w, h, d, o = {}) {
  const dx = d * .7, dy = -d * .45; g.save(); g.lineWidth = 2; g.strokeStyle = QL.ink;
  g.fillStyle = QL.woodL; g.fillRect(x, y - h, w, h); g.strokeRect(x, y - h, w, h);
  g.fillStyle = QL.wood; g.beginPath(); g.moveTo(x + w, y); g.lineTo(x + w + dx, y + dy); g.lineTo(x + w + dx, y - h + dy); g.lineTo(x + w, y - h); g.closePath(); g.fill(); g.stroke();
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + w * i / 4, y - h); g.lineTo(x + w * i / 4, y); g.stroke(); }
  g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + 6, y - h * .55 - k * 7); g.lineTo(x + w - 6, y - h * .55 - k * 7); g.stroke(); }
  const ry = y - h, over = 18; g.lineWidth = 2; g.fillStyle = o.roof ?? QL.roof; g.beginPath(); g.moveTo(x - over, ry); g.lineTo(x + w + dx + over, ry + dy); g.lineTo(x + w + dx - w * .15, ry + dy - h * .55); g.lineTo(x + w * .15, ry - h * .55); g.closePath(); g.fill(); g.stroke();
  g.lineWidth = 1; for (let k = 1; k < 10; k++) { const u = k / 10; g.beginPath(); g.moveTo(lerp(x - over, x + w * .15, 0) + u * (w + dx + 2 * over), ry + dy * u); g.lineTo(x + w * .15 + u * (w + dx - w * .3), ry - h * .55 + dy * u); g.stroke(); }
  if (o.shop) { g.fillStyle = QL.white; g.beginPath(); g.moveTo(x - 10, y - h * .6); g.lineTo(x + w + 10, y - h * .6); g.lineTo(x + w + 30, y - h * .3); g.lineTo(x - 30, y - h * .3); g.closePath(); g.fill(); g.lineWidth = 1.5; g.stroke(); }
  g.restore();
}
// rainbow bridge: timber arch over the river; returns deck(u) → [x, y] for walkers
function qlBridge(g, x0, x1, deckY, rise) {
  const deck = u => [lerp(x0, x1, u), deckY - rise * Math.sin(u * Math.PI)]; g.save(); g.strokeStyle = QL.ink; g.lineCap = 'round';
  // stacked timber arches (the woven-beam rainbow bridge), tied by short verticals
  g.lineWidth = 3; for (let k = 1; k <= 5; k++) { const off = k * 14; g.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, [px, py] = deck(u); g[i ? 'lineTo' : 'moveTo'](lerp(x0 + off * 1.6, x1 - off * 1.6, u), py + 26 + off); } g.stroke(); }
  g.lineWidth = 1.6; for (let i = 1; i < 16; i++) { const u = i / 16, [px, py] = deck(u); g.beginPath(); g.moveTo(px, py + 26); g.lineTo(lerp(x0 + 112, x1 - 112, u), py + 96); g.stroke(); }
  g.fillStyle = QL.wood; g.beginPath(); for (let i = 0; i <= 40; i++) { const [px, py] = deck(i / 40); g[i ? 'lineTo' : 'moveTo'](px, py); } for (let i = 40; i >= 0; i--) { const [px, py] = deck(i / 40); g.lineTo(px, py + 26); } g.closePath(); g.fill(); g.lineWidth = 2.2; g.stroke();
  g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= 40; i++) { const [px, py] = deck(i / 40); g[i ? 'lineTo' : 'moveTo'](px, py - 22); } g.stroke(); for (let i = 0; i <= 20; i++) { const [px, py] = deck(i / 20); g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 22); g.stroke(); }
  g.restore(); return deck;
}
function qlTree(g, x, y, h, seed) { const R = rng(seed); g.save(); g.strokeStyle = QL.ink; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 10, y - h * .5, x + 8, y - h); g.stroke(); g.lineWidth = 1.2; g.strokeStyle = '#3b5a3a'; for (let i = 0; i < 26; i++) { const a = -Math.PI / 2 + (R() - .5) * 2.4, bx = x + 8 + Math.cos(a) * h * .2, by = y - h + Math.sin(a) * h * .2; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + (R() - .5) * 30, by + 40, bx + (R() - .5) * 40, by + 70 + R() * 50); g.stroke(); } g.restore(); }
// tiny figure, feet at (x, y), about 42 px tall × s. ph = walk phase; o = { robe, load (carrying pole), hat }
function qlPerson(g, x, y, s, ph, o = {}) {
  g.save(); g.translate(x, y); g.scale(s * (o.dir ?? 1), s); g.strokeStyle = QL.ink; g.lineWidth = 2; const sw = Math.sin(ph) * 6;
  g.beginPath(); g.moveTo(-2, -16); g.lineTo(-2 - sw, 0); g.moveTo(2, -16); g.lineTo(2 + sw, 0); g.stroke();
  g.fillStyle = o.robe ?? QL.white; g.beginPath(); g.moveTo(-7, -34); g.lineTo(7, -34); g.lineTo(10, -14); g.lineTo(-10, -14); g.closePath(); g.fill(); g.lineWidth = 1.3; g.stroke();
  g.fillStyle = '#e2c9a0'; g.beginPath(); g.arc(0, -39, 5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = QL.ink; g.beginPath(); g.arc(0, -42, 5, Math.PI, TAU); g.fill();
  if (o.hat) { g.beginPath(); g.ellipse(0, -44, 11, 3, 0, 0, TAU); g.fill(); }
  if (o.load) { g.lineWidth = 1.8; g.beginPath(); g.moveTo(-20, -34); g.lineTo(20, -34); g.moveTo(-18, -34); g.lineTo(-18, -22); g.moveTo(18, -34); g.lineTo(18, -22); g.stroke(); g.fillStyle = QL.woodL; g.fillRect(-24, -22, 12, 9); g.fillRect(12, -22, 12, 9); g.strokeRect(-24, -22, 12, 9); g.strokeRect(12, -22, 12, 9); }
  g.restore();
}
// boat: hull, cabin with a mat roof, a mast; rocks with t
function qlBoat(g, x, y, s, t, o = {}) { g.save(); g.translate(x, y + Math.sin(t * 1.8 + x) * 3); g.rotate(Math.sin(t * 1.3 + x) * .015); g.scale(s * (o.dir ?? 1), s); g.strokeStyle = QL.ink; g.lineWidth = 2;
  g.fillStyle = QL.wood; g.beginPath(); g.moveTo(-160, -30); g.quadraticCurveTo(0, 20, 170, -40); g.lineTo(150, -10); g.quadraticCurveTo(0, 30, -140, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = QL.woodL; g.fillRect(-80, -80, 140, 50); g.strokeRect(-80, -80, 140, 50); g.fillStyle = '#6a5a3a'; g.beginPath(); g.moveTo(-95, -80); g.quadraticCurveTo(-10, -115, 75, -80); g.closePath(); g.fill(); g.stroke();
  if (o.mast !== false) { g.lineWidth = 3; g.beginPath(); g.moveTo(90, -40); g.lineTo(100, -230); g.stroke(); g.lineWidth = 1; g.beginPath(); g.moveTo(100, -230); g.lineTo(165, -40); g.moveTo(100, -230); g.lineTo(30, -40); g.stroke(); }
  qlPerson(g, 130, -36, 1, t * 3, { hat: true, robe: QL.white }); g.restore(); }
// scroll mounting: brocade bands top and bottom in screen space
function qlMount(g) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); [[0, 70], [H - 70, 70]].forEach(([y, h]) => { g.fillStyle = QL.brocade; g.fillRect(0, y, W, h); g.strokeStyle = 'rgba(200,170,100,.35)'; g.lineWidth = 2; for (let x = 0; x < W; x += 60) { g.beginPath(); g.arc(x + 30, y + h / 2, 14, 0, TAU); g.stroke(); } g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y === 0 ? h - 4 : y, W, 4); }); g.restore(); }
// vertical inscription + red seals on the silk
function qlInscribe(g, x, y, text, px, o = {}) { g.save(); g.globalAlpha = o.a ?? 1; g.fillStyle = QL.ink; g.font = `${px}px ${(window.EMBED_FONTS || []).includes('LXGW WenKai') ? '"LXGW WenKai", ' : ''}"Kaiti SC", serif`; g.textAlign = 'center'; g.textBaseline = 'top'; [...text].forEach((c, i) => g.fillText(c, x, y + i * px * 1.1));
  const s = px * .95; g.fillStyle = QL.red; g.globalAlpha = (o.a ?? 1) * .85; g.fillRect(x - s / 2, y + text.length * px * 1.1 + 20, s, s); g.fillStyle = QL.silk; g.font = `${Math.round(s * .42)}px ${(window.EMBED_FONTS || []).includes('LXGW WenKai') ? '"LXGW WenKai", ' : ''}serif`; g.textBaseline = 'middle'; const sl = o.seal ?? '长卷'; g.fillText(sl.slice(0, 1), x - s * .22, y + text.length * px * 1.1 + 20 + s * .5); g.fillText(sl.slice(1, 2), x + s * .22, y + text.length * px * 1.1 + 20 + s * .5); g.restore(); }
// low blue-green mound for the near bank (small hills, islands); returns its top point
function qlMound(g, x, base, w, h, seed) { qlMountain(g, x, base, w, h, seed, { top: QL.mala, mid: QL.malaL }); }
// thatched farmhouse (simpler than qlHouse) and a winding road line
function qlHut(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = QL.ink; g.lineWidth = 2; g.fillStyle = QL.woodL; g.fillRect(-40, -40, 80, 40); g.strokeRect(-40, -40, 80, 40); g.fillStyle = '#8a7a4a'; g.beginPath(); g.moveTo(-55, -40); g.lineTo(0, -80); g.lineTo(55, -40); g.closePath(); g.fill(); g.stroke(); g.restore(); }
