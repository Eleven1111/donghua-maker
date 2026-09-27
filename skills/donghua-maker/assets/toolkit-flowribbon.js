// ═══ FLOW-RIBBON toolkit: thick non-overlapping ribbons that stream along a noise flow field (references/looks/flow-ribbon.md) ═══
// Technique studied from long-form generative flow-field art; palettes, fields and layout here are our own.
const SMOOTH_DEFAULT = true, POST_GRAIN = .22, VIGN_TONE = ['70,50,20', .015, .06];
const FR = {
  pal: {   // [colour, weight] — picked by probability; a ribbon's split end draws a second pick
    warm: { paper: ['#f3ebdb', '#e9dfca'], ink: '#1f2a3c', accent: '#d4472a', inks: [['#1f2a3c', 16], ['#d4472a', 12], ['#e8a93a', 12], ['#2e7c78', 10], ['#f7f1e3', 10], ['#e7a39b', 7], ['#7fa9c9', 7], ['#3d5a80', 5], ['#9c3d2e', 4]] },
    night: { paper: ['#1a2233', '#10151f'], ink: '#f3ebdb', accent: '#e8a93a', inks: [['#f3ebdb', 14], ['#e8a93a', 12], ['#7fa9c9', 12], ['#e7a39b', 9], ['#d4472a', 8], ['#2e7c78', 8], ['#3d5a80', 8], ['#c9d8e6', 5]] },
  },
  widths: [[10, 30], [18, 26], [30, 18], [46, 12], [70, 7], [104, 3]],   // px at 2560 wide, weight; ≥70 are the "hero" ribbons
};
const frPick = (R, list) => { let s = 0; list.forEach(x => s += x[1]); let u = R() * s; for (const x of list) if ((u -= x[1]) <= 0) return x[0]; return list[0][0]; };
function frNoise(seed) {       // smooth 2-octave value noise → about [-1, 1]
  const v = (ix, iy) => hash(ix, iy, seed) * 2 - 1, sm = t => t * t * (3 - 2 * t);
  const one = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = sm(x - ix), fy = sm(y - iy); return lerp(lerp(v(ix, iy), v(ix + 1, iy), fx), lerp(v(ix, iy + 1), v(ix + 1, iy + 1), fx), fy); };
  return (x, y) => one(x, y) * .7 + one(x * 2.1 + 17, y * 2.1 + 5) * .3;
}
// field(x, y) → angle. o: { seed, base (rad, wind direction), amp (noise turn), scale (px per noise cell),
//   holes: [{x, y, rx, ry}] — calm eyes the flow bends around (title, a stone), vortex: {x, y, pull} — swirl round a point }
function frField(o) {
  const n = frNoise(o.seed), base = o.base ?? -.12, amp = o.amp ?? 1.9, sc = o.scale ?? 900, holes = o.holes || [];
  return (x, y) => {
    let a = base + n(x / sc, y / sc) * amp;
    if (o.vortex) { const v = o.vortex, dx = x - v.x, dy = y - v.y, d = Math.hypot(dx, dy); const sw = Math.atan2(dy, dx) + Math.PI / 2 + (v.pull ?? .35); const k = clamp(1.4 - d / (v.r ?? 1400), 0, 1); let da = sw - a; da = Math.atan2(Math.sin(da), Math.cos(da)); a += da * k; }
    for (const h of holes) {
      const dx = (x - h.x) / h.rx, dy = (y - h.y) / h.ry, d = Math.hypot(dx, dy);
      if (d < 2.2) { const tang = Math.atan2(dy * h.rx, dx * h.ry) + (dy < 0 ? -Math.PI / 2 : Math.PI / 2); let da = tang + Math.PI - a; da = Math.atan2(Math.sin(da), Math.cos(da)); a += da * clamp(eio(1 - (d - 1) / 1.2), 0, 1) * .9; }
    }
    return a;
  };
}
// Place ribbons with collision so none overlap. o: { seed, field, holes, pal, tries, gap, minLen }
// → [{ pts, len, w, segs:[{u0,u1,col}], soft, x0, r }]; lanes are long — frFlow shows a sliding window of each.
function frGrow(o) {
  const R = rng(o.seed), fa = o.field, holes = o.holes || [], cs = 8, pad = 160, gx = Math.ceil((W + pad * 2) / cs), gy = Math.ceil((H + pad * 2) / cs);
  const occ = new Uint8Array(gx * gy), cell = (x, y) => { const i = Math.floor((x + pad) / cs), j = Math.floor((y + pad) / cs); return i < 0 || j < 0 || i >= gx || j >= gy ? -1 : j * gx + i; };
  const inHole = (x, y, m) => holes.some(h => ((x - h.x) / (h.rx + m)) ** 2 + ((y - h.y) / (h.ry + m)) ** 2 < 1);
  const free = (x, y, a, w) => { const nx = -Math.sin(a), ny = Math.cos(a), h = w / 2 + o.gap; for (let s = -h; s <= h; s += cs * .8) { const c = cell(x + nx * s, y + ny * s); if (c < 0 || occ[c]) return false; } return !inHole(x, y, w / 2 + 30); };
  const out = [], step = 7, tries = [];
  for (let i = 0; i < o.tries; i++) tries.push({ w: frPick(R, o.widths || FR.widths), x: -pad * .5 + R() * (W + pad), y: -pad * .5 + R() * (H + pad) });
  tries.sort((a, b) => b.w - a.w);   // big ribbons first, small ones fill the gaps
  for (const t of tries) {
    const maxN = Math.round((900 + t.w * 14) / step);
    if (!free(t.x, t.y, fa(t.x, t.y), t.w)) continue;
    // stop before a turn tighter than the ribbon's half-width: the inner edge would fold into a zigzag
    const walk = dir => { const p = []; let x = t.x, y = t.y, pa = fa(x, y); for (let k = 0; k < maxN; k++) { const a = fa(x, y), da = Math.atan2(Math.sin(a - pa), Math.cos(a - pa)); if (Math.abs(da) * t.w / 2 > step * .8) break; pa = a; x += Math.cos(a) * step * dir; y += Math.sin(a) * step * dir; if (!free(x, y, a, t.w)) break; p.push([x, y]); } return p; };
    const pts = walk(-1).reverse().concat([[t.x, t.y]], walk(1));
    if (pts.length * step < Math.max(o.minLen ?? 280, t.w * 3.2)) continue;   // short lanes read as confetti once ribbons move
    for (const [x, y] of pts) { const a = fa(x, y), nx = -Math.sin(a), ny = Math.cos(a); for (let s = -t.w / 2; s <= t.w / 2; s += cs * .5) { const c = cell(x + nx * s, y + ny * s); if (c >= 0) occ[c] = 1; } }
    const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const inks = o.pal.inks, segs = [{ u0: 0, u1: 1, col: frPick(R, inks) }];
    if (R() < .3) { const cut = .72 + R() * .2; segs[0].u1 = cut; segs.push({ u0: cut, u1: 1, col: frPick(R, inks) }); }   // split end, an extra colour
    if (t.w > 40 && R() < .25) { const cut = .08 + R() * .1; segs[0].u0 = cut; segs.unshift({ u0: 0, u1: cut, col: frPick(R, inks) }); }
    out.push({ pts, len, w: t.w, segs, soft: t.w < 50 && t.w > 14 && R() < (o.soft ?? .12), x0: Math.min(...pts.map(p => p[0])), r: R() });
  }
  return out;
}
// Give every ribbon its motion: body length lv, speed v (wide = slow), rest gap before re-entry, entry cue t.
// o: { enter (s the stream takes to cross the frame), speed (px/s scale), pre (s already flowed when the shot opens — use after a cut so the frame isn't empty),
//      cues: [s] — hero ribbons enter on these (melody notes) }
function frFlow(rbs, o = {}) {
  const sp = o.speed ?? 1, en = o.enter ?? 1.6;
  rbs.forEach(r => { const L = r.len[r.len.length - 1]; r.lv = L * (.92 + r.r * .08); r.v = (380 - r.w * 1.6 + r.r * 90) * sp; r.rest = 30 + r.r * 150; r.t = clamp((r.x0 + 100) / (W + 200), 0, 1) * en + r.r * .8 - r.lv / r.v * .5 - (o.pre ?? 0); });
  (o.cues || []).forEach((c, i, all) => { const hero = rbs.filter(r => r.w >= 70).sort((a, b) => a.x0 - b.x0)[i]; if (hero) hero.t = c; });
  rbs.sort((a, b) => b.w - a.w);   // wide ones underneath in paint order
  return rbs;
}
function frHead(rb, st) {             // arc length of the ribbon's front end; loops after it leaves its lane
  const L = rb.len[rb.len.length - 1], cyc = L + rb.lv + rb.rest, d = (st - rb.t) * rb.v;
  return d < 0 ? -1 : d % cyc;
}
function frRibbon(g, rb, u0, u1) {   // one span of a ribbon as a filled band with flat ends (or parallel lines when soft)
  const L = rb.len[rb.len.length - 1], a = u0 * L, b = u1 * L, P = rb.pts, h = rb.w / 2, left = [], right = [];
  for (let i = 0; i < P.length; i++) {
    if (rb.len[i] < a - 7 || rb.len[i] > b + 7) continue;
    const j0 = Math.max(0, i - 1), j1 = Math.min(P.length - 1, i + 1), an = Math.atan2(P[j1][1] - P[j0][1], P[j1][0] - P[j0][0]), nx = -Math.sin(an), ny = Math.cos(an);
    left.push([P[i][0] + nx * h, P[i][1] + ny * h]); right.push([P[i][0] - nx * h, P[i][1] - ny * h]);
  }
  if (left.length < 2) return;
  if (rb.soft) { const n = Math.max(3, Math.round(rb.w / 5)); g.lineWidth = 1.6; for (let k = 0; k <= n; k++) { const f = k / n; g.beginPath(); left.forEach((p, i) => { const q = right[i]; g[i ? 'lineTo' : 'moveTo'](lerp(p[0], q[0], f), lerp(p[1], q[1], f)); }); g.stroke(); } return; }
  g.beginPath(); left.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]); g.closePath(); g.fill();
}
function frDraw(g, rb, head) {        // the ribbon body [head - lv, head] clipped to its lane; colour splits travel with the body
  const L = rb.len[rb.len.length - 1], tail = head - rb.lv;
  for (const s of rb.segs) { const a = Math.max(0, tail + s.u0 * rb.lv), b = Math.min(L, tail + s.u1 * rb.lv); if (b - a < 2) continue; g.fillStyle = g.strokeStyle = s.col; frRibbon(g, rb, a / L, b / L); }
}
const frDrawAll = (g, rbs, st) => { for (const r of rbs) { const hd = frHead(r, st); if (hd > 0) frDraw(g, r, hd); } };
const FR_SERIF = () => ((window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : '') + '"Songti SC", serif';
// title in a calm eye: fades and rises in at t, optional second line in the accent colour
function frTitle(g, hole, st, t, main, sub, pal, size = 150) {
  const k = clamp((st - t) / .9, 0, 1); if (k <= 0) return;
  g.save(); g.textAlign = 'center'; g.globalAlpha = eio(k); g.fillStyle = pal.ink; g.font = `700 ${size}px ${FR_SERIF()}`;
  g.fillText(main, hole.x, hole.y + size * .27 - (1 - eio(k)) * 24);
  if (sub) { g.globalAlpha = eio(clamp((st - t - .5) / .8, 0, 1)); g.fillStyle = pal.accent; g.font = `500 ${Math.round(size * .27)}px ${FR_SERIF()}`; g.fillText(sub, hole.x, hole.y + size * .8); }
  g.restore();
}
// small caption on a paper tag, drawn over the ribbons (fades in at t); anchor is the tag's left-centre
function frTag(g, x, y, text, pal, st, t, size = 60) {
  const k = clamp((st - t) / .6, 0, 1); if (k <= 0) return;
  g.save(); g.globalAlpha = eio(k); g.font = `600 ${size}px ${FR_SERIF()}`; const w = g.measureText(text).width, px = size * .6, h = size * 1.7;
  g.fillStyle = pal.paper[0]; g.beginPath(); g.roundRect(x, y - h / 2, w + px * 2, h, h * .18); g.fill();
  g.fillStyle = pal.accent; g.fillRect(x, y - h / 2, size * .16, h);
  g.fillStyle = pal.ink; g.textBaseline = 'middle'; g.fillText(text, x + px, y + 2); g.restore();
}
