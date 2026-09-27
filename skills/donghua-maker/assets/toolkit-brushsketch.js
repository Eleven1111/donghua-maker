// ═══ BRUSH-SKETCH toolkit (简笔漫画): tapered ink brush lines, blank faces, pale misregistered washes, wide empty paper, a written inscription ═══
// Construction studied from Republican-era Chinese brush cartoons (manhua); all drawings here are our own. references/looks/brushsketch.md
// Keep the stop-motion step (12 poses/s): pass the exposure index e into every stroke so lines "boil" like re-drawn frames.
const POST_GRAIN = .25, VIGN_TONE = ['90,70,40', .03, .12];
const BS = { paper: '#f4efe3', paper2: '#ece4d2', ink: '#2b2622', ochre: '#d9a860', green: '#a9c48f', red: '#e0775f', blue: '#9dbcd4', pink: '#eab3a4', seal: '#c8412e' };
const bsFont = px => `${px}px ${(window.EMBED_FONTS || []).includes('LXGW WenKai') ? '"LXGW WenKai", ' : ''}"Kaiti SC", "STKaiti", serif`;
function bsPaper(seed = 3) { const c = backdrop(W + 256, H + 144, { grad: [[0, BS.paper], [1, BS.paper2]], mottle: .3, seed }); const g = g2(c), R = rng(seed); g.strokeStyle = 'rgba(120,100,70,.06)'; g.lineWidth = 1.2; for (let i = 0; i < 900; i++) { const x = R() * c.width, y = R() * c.height, a = R() * TAU, l = 6 + R() * 22; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + 3, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } return c; }
// dense samples along a Catmull-Rom curve through pts
function bsSample(pts, step = 5) {
  const out = []; const P = i => pts[clamp(i, 0, pts.length - 1)];
  for (let i = 0; i < pts.length - 1; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } }
  out.push(pts[pts.length - 1]); return out;
}
// one brush stroke: pressure swells in the middle and tapers at both ends, a dry-brush break near the tail.
// id + e make the boil: the same stroke re-drawn each exposure with a slightly different hand.
function bsStroke(g, pts, w, id, e = 0, o = {}) {
  const j = o.boil ?? 1.6, P = pts.map((p, i) => [p[0] + (hash(id, i, e) - .5) * 2 * j, p[1] + (hash(id, i + 50, e) - .5) * 2 * j]), S = bsSample(P, 4), n = S.length; if (n < 2) return;
  const L = [], Rr = [], head = o.head ?? .25, tail = o.tail ?? .15;
  for (let i = 0; i < n; i++) { const u = i / (n - 1), a = S[Math.min(n - 1, i + 1)], b = S[Math.max(0, i - 1)], an = Math.atan2(a[1] - b[1], a[0] - b[0]), nx = -Math.sin(an), ny = Math.cos(an);
    const prof = Math.min(1, u / head, (1 - u) / tail) ** .6 * (1 + (o.press ?? .25) * Math.sin(u * Math.PI)) * (1 + (hash(id, i >> 3, e) - .5) * .18), hw = Math.max(.6, w / 2 * prof);
    L.push([S[i][0] + nx * hw, S[i][1] + ny * hw]); Rr.push([S[i][0] - nx * hw, S[i][1] - ny * hw]); }
  g.save(); g.fillStyle = o.col ?? BS.ink; g.globalAlpha = o.a ?? .93; g.beginPath(); L.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); for (let i = n - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]); g.closePath(); g.fill();
  if (w > 5 && o.dry !== false) { g.globalAlpha = .55; g.strokeStyle = BS.paper; g.lineWidth = Math.max(1, w * .12); for (let k = 0; k < 2; k++) { const off = (hash(id, k, 7) - .5) * w * .5, i0 = Math.floor(n * (.62 + hash(id, k, 3) * .2)); g.beginPath(); for (let i = i0; i < n; i++) { const a = S[Math.min(n - 1, i + 1)], b = S[Math.max(0, i - 1)], an = Math.atan2(a[1] - b[1], a[0] - b[0]); g[i === i0 ? 'moveTo' : 'lineTo'](S[i][0] - Math.sin(an) * off, S[i][1] + Math.cos(an) * off); } g.stroke(); } }
  g.restore();
}
// pale colour wash: multiply, soft edge, deliberately offset from the ink line (the colour never fits the drawing exactly)
function bsWash(g, pathFn, col, o = {}) { g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = o.a ?? .6; g.fillStyle = col; g.filter = `blur(${o.blur ?? 2}px)`; g.translate(o.dx ?? 7, o.dy ?? 5); g.beginPath(); pathFn(g); g.fill(); g.restore(); }
// a child, feet at (0,0), height about 430*s. pose: { walk (phase, rad) or null, armL/armR (rad from hanging, + = forward/up), look (−1..1 head turn), coat, pants, bun }
// Faces stay blank on purpose: the posture carries the feeling.
function bsChild(g, x, y, s, pose, id, e) {
  g.save(); g.translate(x, y); g.scale(s * (pose.flip ? -1 : 1), s);
  const sw = pose.walk == null ? 0 : Math.sin(pose.walk), bob = pose.walk == null ? 0 : Math.abs(Math.cos(pose.walk)) * -8, hy = -360 + bob, sh = -300 + bob, hem = -170 + bob;
  // legs
  const leg = (dx, ph, k) => bsStroke(g, [[dx, hem], [dx + ph * 26, -80], [dx + ph * 44, 0]], 13, id + k, e, { head: .1, tail: .1, dry: false });
  leg(-18, -sw, 1); leg(18, sw, 2); [[-18 - sw * 44, 3], [18 + sw * 44, 4]].forEach(([fx, k]) => bsStroke(g, [[fx - 6, -2], [fx + 26, 0]], 14, id + k + 10, e, { dry: false }));
  // coat: wash then outline
  const coat = gg => { gg.moveTo(-40, sh); gg.lineTo(40, sh); gg.lineTo(62, hem); gg.lineTo(-62, hem); gg.closePath(); };
  bsWash(g, coat, pose.coat ?? BS.blue);
  bsStroke(g, [[-38, sh], [-50, -240 + bob], [-62, hem]], 9, id + 5, e); bsStroke(g, [[38, sh], [52, -240 + bob], [62, hem]], 9, id + 6, e); bsStroke(g, [[-62, hem], [0, hem + 6], [62, hem]], 7, id + 7, e);
  // arms from the shoulders
  const arm = (dx, ang, k) => { const ax = dx + Math.sin(ang) * 130 * Math.sign(dx || 1) * (pose.flip ? 1 : 1), ay = sh + 10 + Math.cos(ang) * 130; bsStroke(g, [[dx, sh + 8], [lerp(dx, ax, .5) + dx * .2, lerp(sh, ay, .5)], [ax, ay]], 10, id + k, e); return [ax, ay]; };
  const hl = arm(-40, -(pose.armL ?? .15) - sw * .3, 8), hr = arm(40, (pose.armR ?? .15) + sw * .3, 9);
  // head: blank oval + ink hair cap
  g.save(); g.translate((pose.look ?? 0) * 6, 0);
  bsWash(g, gg => gg.ellipse(0, hy, 46, 52, 0, 0, TAU), BS.pink, { a: .35, dx: 3, dy: 3 });
  bsStroke(g, [[-8, hy - 52], [-44, hy - 20], [-40, hy + 26], [0, hy + 52], [38, hy + 28], [46, hy - 12]], 7, id + 11, e, { head: .05, tail: .3 });
  g.fillStyle = BS.ink; g.globalAlpha = .9; g.beginPath(); g.moveTo(-48, hy - 4); g.quadraticCurveTo(-46, hy - 64, 4, hy - 60); g.quadraticCurveTo(52, hy - 56, 48, hy - 6); g.quadraticCurveTo(20, hy - 26, -8, hy - 20); g.quadraticCurveTo(-30, hy - 18, -48, hy - 4); g.fill();
  if (pose.bun) { g.beginPath(); g.arc(-30 * (pose.look ?? 0) + 28, hy - 62, 17, 0, TAU); g.fill(); }
  g.restore(); g.restore();
  const m = (p) => [x + p[0] * s * (pose.flip ? -1 : 1), y + p[1] * s]; return { handL: m(hl), handR: m(hr) };
}
// willow: leaning trunk, an arching crown, long branches that spill outward then hang, leaf dabs along them; sways with the wind
function bsWillow(g, x, y, h, st, id, e) {
  const top = [x + 60, y - h];
  bsStroke(g, [[x, y], [x - 20, y - h * .4], [x + 10, y - h * .75], top], 24, id, e, { head: .05, tail: .45 });
  bsStroke(g, [[x + 4, y - h * .7], [x - 90, y - h * .92], [x - 170, y - h * .95]], 9, id + 1, e, { tail: .5 });
  bsStroke(g, [[x + 30, y - h * .85], [x + 150, y - h * 1.02], [x + 230, y - h * .98]], 9, id + 2, e, { tail: .5 });
  for (let i = 0; i < 13; i++) {
    const u = i / 12, ox = lerp(-190, 250, u), oy = -h * (.93 + Math.sin(u * Math.PI) * .12), sx = x + ox, sy = y + oy, out = (u - .45) * 160, len = 300 + hash(id, i, 5) * 260, sw = Math.sin(st * 1.4 + i * .7) * 22;
    const pts = [[sx, sy], [sx + out * .6, sy + 40], [sx + out + sw * .4, sy + len * .45], [sx + out * 1.1 + sw, sy + len]];
    bsStroke(g, pts, 3.5, id + 20 + i, e, { head: .05, tail: .6, dry: false });
    for (let k = 1; k < 7; k++) { const t = k / 7, px = lerp(sx + out * .6, sx + out * 1.1 + sw, t), py = lerp(sy + 40, sy + len, t), d = k % 2 ? 1 : -1; bsStroke(g, [[px, py], [px + d * 13, py + 16]], 5, id + 60 + i * 7 + k, e, { dry: false, boil: .8 }); }
  }
}
// a thin crescent moon: pale wash + one tapered ink stroke along the outer edge
function bsMoon(g, x, y, r, id, e) {
  const c = gg => { gg.arc(x, y, r, -Math.PI * .5, Math.PI * .5, true); gg.arc(x + r * .45, y, r * .88, Math.PI * .5, -Math.PI * .5, false); };
  bsWash(g, c, '#f3d98a', { a: .8, dx: 3, dy: 2, blur: 1 });
  const pts = []; for (let k = 0; k <= 8; k++) { const a = -Math.PI * .5 - k / 8 * Math.PI; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); } bsStroke(g, pts, 5, id, e, { head: .3, tail: .3, dry: false });
}
// broken ground line: the ground is suggested, never closed
function bsGround(g, y, x0, x1, id, e) { let x = x0, k = 0; while (x < x1) { const l = 180 + hash(id, k, 1) * 320; bsStroke(g, [[x, y + (hash(id, k, 2) - .5) * 8], [x + l * .5, y + (hash(id, k, 3) - .5) * 10], [x + l, y]], 5, id + k, e, { dry: false }); x += l + 40 + hash(id, k, 4) * 120; k++; } }
// vertical inscription in brush kai, top-down, right-to-left columns, with a small red seal under the last column
function bsInscribe(g, lines, x, y, px, o = {}) {
  g.save(); g.font = bsFont(px); g.fillStyle = BS.ink; g.textAlign = 'center'; g.textBaseline = 'top'; g.globalAlpha = o.a ?? 1; let cx = x, lastY = y;
  lines.forEach(l => { [...l].forEach((ch, i) => g.fillText(ch, cx, y + i * px * 1.12)); lastY = y + l.length * px * 1.12; cx -= px * 1.35; });
  if (o.seal) { const sx = cx + px * 1.35, sy = lastY + px * .3, sz = px * .9; g.fillStyle = BS.seal; g.globalAlpha = (o.a ?? 1) * .9; g.fillRect(sx - sz / 2, sy, sz, sz); g.fillStyle = BS.paper; g.font = bsFont(Math.round(sz * .7)); g.textBaseline = 'middle'; g.fillText(o.seal, sx, sy + sz / 2 + 2); }
  g.restore();
}
