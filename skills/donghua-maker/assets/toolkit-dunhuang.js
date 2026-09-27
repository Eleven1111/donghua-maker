// ═══ DUNHUANG toolkit (敦煌壁画): mineral-pigment mural — malachite, azurite, ochre ground, red-brown line, darkened lead-red,
// flying figures with long streaming ribbons, scrolling clouds, falling flowers, a cracked flaking wall.
// Construction studied from public-domain photographs of Mogao cave murals; every figure here is our own drawing. references/looks/dunhuang.md
const POST_GRAIN = .3, VIGN_TONE = ['50,25,10', .08, .32];
const DH = { ground: '#c99a62', ground2: '#b07f4a', mala: '#3f9f86', malaL: '#7cc4a8', azur: '#2f5f9f', azurL: '#6f9ccf', ochre: '#d8a860', red: '#a8442a', brown: '#5a2e1e', line: '#7a2e1a', white: '#efe3cc', gold: '#d8b060', skin: '#f1dcc0' };
// the wall: warm plaster, small grime patches, hairline cracks
function dhWall(seed = 3) { const c = backdrop(W + 256, H + 144, { grad: [[0, DH.ground], [1, DH.ground2]], mottle: .5, seed }), g = g2(c), R = rng(seed);
  for (let i = 0; i < 90; i++) { const x = R() * c.width, y = R() * c.height, r = 10 + R() * 50, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(70,40,20,.18)'); rg.addColorStop(1, 'rgba(70,40,20,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.strokeStyle = 'rgba(60,30,15,.35)'; g.lineWidth = 1.3; for (let i = 0; i < 26; i++) { let x = R() * c.width, y = R() * c.height; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 14; k++) { x += (R() - .5) * 60; y += (R() - .3) * 40; g.lineTo(x, y); } g.stroke(); }
  return c; }
// flakes: drawn on top of the figures so paint loss crosses them (fixed per shot)
function dhFlakes(g, seed, n = 40) { const R = rng(seed); for (let i = 0; i < n; i++) { const x = R() * W, y = R() * H, r = 6 + R() * 26; g.fillStyle = `rgba(${R() < .5 ? '200,160,110' : '170,125,80'},.85)`; g.beginPath(); blobPath(g, x, y, r, r * (.5 + R() * .5), { amp: .3, seed: i }); g.fill(); } }
// scrolling cloud (卷云): a tapering tail that ends in three spiral curls; banded fill + red-brown outline
function dhCloud(g, x, y, s, col = DH.mala, col2 = DH.white, dir = 1) { g.save(); g.translate(x, y); g.scale(s * dir, s); g.lineJoin = 'round';
  const curls = [[0, 0, 44], [70, -30, 34], [120, 16, 28]];
  g.fillStyle = col; g.strokeStyle = DH.line; g.lineWidth = 3; g.beginPath(); g.moveTo(-320, 40); g.bezierCurveTo(-200, 60, -100, 50, -20, 40); g.lineTo(-20, -30); g.bezierCurveTo(-110, -10, -200, 20, -320, 40); g.fill(); g.stroke();
  for (const [cx, cy, r] of curls) { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = col2; g.lineWidth = r * .22; g.beginPath(); for (let k = 0; k <= 30; k++) { const u = k / 30, a = u * TAU * 1.4, rr = r * .78 * (1 - u * .8); g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.stroke(); g.strokeStyle = DH.line; g.lineWidth = 3; }
  g.restore(); }
// decorative frieze bands (top / bottom of the wall): hanging-triangle drapery and a gold wave, in mineral colours
function dhFrieze(g, y, h, flip = false) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = DH.brown; g.fillRect(0, y, W, h); const cols = [DH.mala, DH.azur, DH.red, DH.white];
  for (let i = 0, x = 0; x < W; i++, x += 80) { g.fillStyle = cols[i % 4]; g.beginPath(); if (!flip) { g.moveTo(x, y + h * .45); g.lineTo(x + 80, y + h * .45); g.lineTo(x + 40, y + h); } else { g.moveTo(x, y + h * .55); g.lineTo(x + 80, y + h * .55); g.lineTo(x + 40, y); } g.closePath(); g.fill(); g.strokeStyle = DH.line; g.lineWidth = 2; g.stroke(); }
  g.strokeStyle = DH.gold; g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= W; x += 10) g.lineTo(x, y + (flip ? h * .78 : h * .22) + Math.sin(x / 40) * h * .12); g.stroke(); g.restore(); }
// falling flower (天花): four petals; dhFlowers is a pure function of t
function dhFlower(g, x, y, r, rot, col = DH.red) { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.strokeStyle = DH.line; g.lineWidth = 1.5; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.ellipse(0, -r * .6, r * .35, r * .6, 0, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = DH.gold; g.beginPath(); g.arc(0, 0, r * .25, 0, TAU); g.fill(); g.restore(); }
function dhFlowers(g, st, n, seed) { for (let i = 0; i < n; i++) { const sp = 40 + hash(i, 1, seed) * 60, y = ((hash(i, 2, seed) * (H + 200) + st * sp) % (H + 200)) - 100, x = hash(i, 3, seed) * W + Math.sin(st * .8 + i) * 40; dhFlower(g, x, y, 12 + hash(i, 4, seed) * 10, st * (hash(i, 5, seed) - .5) * 2 + i, [DH.red, DH.white, DH.azurL][i % 3]); } }
// ribbon: a long tapered streamer looping behind an anchor (a travelling wave plus a big arch), banded, outlined
function dhRibbon(g, x, y, len, dir, t, ph, w, cols) { const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([x - dir * u * len, y + Math.sin(t * 2.2 - u * 6 + ph) * 110 * u + Math.sin(u * Math.PI) * (ph > 1 ? 120 : -140)]); }
  const side = k => pts.map((p, i) => { const a = pts[Math.min(30, i + 1)], b = pts[Math.max(0, i - 1)], an = Math.atan2(a[1] - b[1], a[0] - b[0]), hw = w * (1 - i / 32) * k; return [p[0] - Math.sin(an) * hw, p[1] + Math.cos(an) * hw]; });
  const L = side(1), R = side(-1); g.save(); g.fillStyle = cols[0]; g.strokeStyle = DH.line; g.lineWidth = 2.5; g.beginPath(); L.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath(); g.fill(); g.stroke();
  if (cols[1]) { g.strokeStyle = cols[1]; g.lineWidth = w * .35; g.beginPath(); pts.slice(0, 24).forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.stroke(); } g.restore(); }
// flying figure (飞天), our own drawing: body arched horizontally, skirt sweeping back and up in an S, two long ribbons looping
// above and below, one arm reaching forward with a flower. Head leads in direction dir; about 900 px long at s = 1.
function dhApsara(g, x, y, s, t, dir = 1, o = {}) {
  g.save(); g.translate(x, y + Math.sin(t * 1.3) * 14); g.scale(s * dir, s); g.lineJoin = 'round'; g.lineCap = 'round';
  const wav = Math.sin(t * 1.8) * 16;
  // ribbons: long loops behind the body
  dhRibbon(g, 40, -60, 900, 1, t, 0, 26, [o.rib1 ?? DH.mala, DH.malaL]); dhRibbon(g, 0, 40, 780, 1, t, 2.2, 22, [o.rib2 ?? DH.azur, DH.azurL]);
  // skirt: S-sweep from the waist back and up to the feet
  g.strokeStyle = DH.line; g.lineWidth = 3.5; g.fillStyle = o.skirt ?? DH.red;
  g.beginPath(); g.moveTo(-20, -40); g.bezierCurveTo(-160, -60, -260, -40, -380, -120 + wav); g.bezierCurveTo(-420, -150 + wav, -440, -160 + wav, -470, -150 + wav); g.bezierCurveTo(-400, -90 + wav, -300, 10, -150, 30); g.bezierCurveTo(-90, 36, -40, 30, -10, 20); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = DH.brown; g.lineWidth = 7; g.beginPath(); g.moveTo(-60, -10); g.bezierCurveTo(-200, -20, -300, -50, -430, -140 + wav); g.stroke();
  g.strokeStyle = DH.gold; g.lineWidth = 4; g.beginPath(); g.moveTo(-40, -44); g.bezierCurveTo(-60, -10, -50, 20, -30, 28); g.stroke();   /* waist sash */
  g.fillStyle = DH.skin; g.strokeStyle = DH.line; g.lineWidth = 3; g.beginPath(); g.ellipse(-468, -152 + wav, 22, 9, -.3, 0, TAU); g.fill(); g.stroke();   /* a foot */
  // torso
  g.fillStyle = DH.skin; g.beginPath(); g.moveTo(-20, -44); g.bezierCurveTo(20, -80, 90, -84, 120, -60); g.bezierCurveTo(120, -20, 60, 10, -10, 22); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = DH.gold; g.lineWidth = 5; g.beginPath(); g.arc(96, -58, 30, 1.2, 2.6); g.stroke();   /* necklace */
  // arms: forward arm with a flower, back arm trailing a ribbon end
  const arm = (pts, w) => { g.strokeStyle = DH.line; g.lineWidth = w + 6; g.beginPath(); pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.stroke(); g.strokeStyle = DH.skin; g.lineWidth = w; g.stroke(); };
  arm([[100, -70], [170, -120], [250, -120]], 16); arm([[60, -30], [110, 20], [170, 30]], 15);
  dhFlower(g, 262, -120, 22, t * .5, DH.white); dhFlower(g, 184, 30, 16, t * .7, DH.red);
  // head: three-quarter face, topknot, crown jewel, ear ornament
  g.fillStyle = DH.skin; g.strokeStyle = DH.line; g.lineWidth = 3; g.beginPath(); g.ellipse(150, -118, 34, 40, .35, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = DH.brown; g.beginPath(); g.moveTo(118, -128); g.bezierCurveTo(116, -170, 170, -178, 186, -140); g.bezierCurveTo(160, -150, 140, -140, 118, -128); g.fill(); g.beginPath(); g.ellipse(138, -176, 16, 22, -.4, 0, TAU); g.fill();
  g.fillStyle = DH.gold; g.beginPath(); g.arc(164, -152, 7, 0, TAU); g.fill(); g.beginPath(); g.arc(128, -104, 6, 0, TAU); g.fill();
  g.strokeStyle = DH.line; g.lineWidth = 2.5; g.beginPath(); g.moveTo(166, -122); g.lineTo(178, -124); g.moveTo(170, -102); g.quadraticCurveTo(176, -98, 182, -102); g.stroke();
  g.restore();
}
// vertical cartouche in red-brown line on white (a mural inscription panel)
function dhPanel(g, x, y, text, px, a = 1) { const w = px * 1.5, h = text.length * px * 1.1 + px * .6; g.save(); g.globalAlpha = a; g.fillStyle = DH.white; g.fillRect(x, y, w, h); g.strokeStyle = DH.line; g.lineWidth = 4; g.strokeRect(x, y, w, h); g.fillStyle = DH.line; g.font = `${px}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}serif`; g.textAlign = 'center'; g.textBaseline = 'top'; [...text].forEach((c, i) => g.fillText(c, x + w / 2, y + px * .3 + i * px * 1.1)); g.restore(); }
