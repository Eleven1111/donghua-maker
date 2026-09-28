// ═══ MEMPHIS toolkit (孟菲斯): candy pastels (pink, mint, butter yellow, lilac) plus black; confetti of simple shapes — squiggles,
// zigzags, dot grids, outlined circles, triangles, half-discs, pills — scattered and gently bobbing; every object has a thick
// black outline and a hard offset shadow; halftone dot fields and stripe fills; bold rounded type with an outline and a drop.
// Motion is bouncy: pop-in with overshoot, wiggles on the beat. Studied from 1980s Memphis-group design; compositions generated.
// references/looks/memphis.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .025, VIGN_TONE = ['60,20,60', 0, .12];
const MM = { pink: '#f7b6d2', mint: '#a6e3d0', yellow: '#ffd35c', lilac: '#b9a7f0', blue: '#3d5afe', red: '#ff4f6d', teal: '#1fb5a6', ink: '#1b1b1f', white: '#fffaf2' };
// pop-in: 0 before t0, overshoots past 1 and settles
const mmPop = (t, t0, d = .45) => { const k = clamp((t - t0) / d, 0, 1); if (k <= 0) return 0; const c = 2.4, u = k - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
// outlined shape with a hard offset shadow; kind: circle | ring | tri | half | pill | rect | star; fill may be a pattern
function mmShape(g, kind, x, y, s, r, fill, o = {}) { const lw = o.lw ?? Math.max(4, s * .06), sh = o.shadow ?? Math.max(6, s * .07);
  const path = () => { g.beginPath(); if (kind === 'circle' || kind === 'ring') g.arc(0, 0, s / 2, 0, TAU); else if (kind === 'tri') { g.moveTo(0, -s * .55); g.lineTo(s * .5, s * .35); g.lineTo(-s * .5, s * .35); g.closePath(); }
    else if (kind === 'half') { g.arc(0, 0, s / 2, PI, TAU); g.closePath(); } else if (kind === 'pill') g.roundRect(-s / 2, -s * .18, s, s * .36, s * .18); else if (kind === 'rect') g.rect(-s / 2, -s / 2, s, s);
    else if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr = i % 2 ? s * .22 : s * .5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); } };
  g.save(); g.translate(x, y); g.rotate(r); g.lineJoin = 'round';
  if (kind !== 'ring' && sh) { g.save(); g.translate(sh, sh); path(); g.fillStyle = MM.ink; g.fill(); g.restore(); }
  path(); if (kind !== 'ring') { g.fillStyle = fill; g.fill(); } g.lineWidth = kind === 'ring' ? s * .12 : lw; g.strokeStyle = kind === 'ring' ? fill : MM.ink; g.stroke(); g.restore(); }
// squiggle / zigzag line (thick, round caps), centred at x,y, length len, angle r
function mmSquiggle(g, x, y, len, r, col, o = {}) { const amp = o.amp ?? len * .12, n = o.n ?? 3.5, w = o.w ?? Math.max(8, len * .06), zig = o.zig; g.save(); g.translate(x, y); g.rotate(r); g.lineCap = 'round'; g.lineJoin = 'round';
  const pts = []; const N = zig ? Math.round(n * 2) : 48; for (let i = 0; i <= N; i++) { const u = i / N; pts.push([(u - .5) * len, zig ? (i % 2 ? amp : -amp) : Math.sin(u * n * TAU + (o.ph ?? 0)) * amp]); }
  const line = () => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); };
  if (o.shadow !== false) { g.save(); g.translate(w * .5, w * .5); line(); g.strokeStyle = MM.ink; g.lineWidth = w; g.stroke(); g.restore(); } line(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); g.restore(); }
// dot grid patch
function mmDots(g, x, y, cols, rows, gap, r, col = MM.ink) { g.save(); g.fillStyle = col; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { g.beginPath(); g.arc(x + i * gap, y + j * gap, r, 0, TAU); g.fill(); } g.restore(); }
// halftone field: dots whose radius follows f(u, v) 0..1 over a rect
function mmHalftone(g, x, y, w, h, gap, col, f) { g.save(); g.fillStyle = col; for (let i = 0; i * gap < w; i++) for (let j = 0; j * gap < h; j++) { const u = i * gap / w, v = j * gap / h, r = f(u, v) * gap * .48; if (r < .6) continue; g.beginPath(); g.arc(x + i * gap + (j % 2) * gap / 2, y + j * gap, r, 0, TAU); g.fill(); } g.restore(); }
// patterns (cached): stripes / dots / checks in two colours
const MM_PAT = {}; function mmPattern(g, kind, a, b, s = 24) { const key = kind + a + b + s; if (!MM_PAT[key]) { const c = mk(s * 2, s * 2), q = c.getContext('2d'); q.fillStyle = a; q.fillRect(0, 0, s * 2, s * 2); q.fillStyle = b;
  if (kind === 'stripes') { q.beginPath(); q.moveTo(0, 0); q.lineTo(s, 0); q.lineTo(0, s); q.closePath(); q.fill(); q.beginPath(); q.moveTo(s * 2, 0); q.lineTo(s * 2, s); q.lineTo(s, s * 2); q.lineTo(0, s * 2); q.closePath(); q.fill(); }
  else if (kind === 'dots') { [[s / 2, s / 2], [s * 1.5, s * 1.5]].forEach(([x, y]) => { q.beginPath(); q.arc(x, y, s * .22, 0, TAU); q.fill(); }); } else { q.fillRect(0, 0, s, s); q.fillRect(s, s, s, s); }
  MM_PAT[key] = c; } return g.createPattern(MM_PAT[key], 'repeat'); }
// confetti field: n items (seeded) scattered over a rect, avoiding a hole {x,y,r}; each bobs and turns slowly; k = pop-in progress
function mmConfetti(n, seed, rect, hole) { const R = rng(seed), K = ['squiggle', 'zig', 'ring', 'tri', 'half', 'pill', 'dots', 'circle', 'star'], C = [MM.blue, MM.red, MM.yellow, MM.teal, MM.lilac, MM.pink, MM.ink], out = [];
  while (out.length < n) { const x = rect[0] + R() * rect[2], y = rect[1] + R() * rect[3]; if (hole && Math.hypot((x - hole.x) / (hole.rx ?? hole.r), (y - hole.y) / (hole.ry ?? hole.r)) < 1) continue;
    out.push({ x, y, k: K[Math.floor(R() * K.length)], c: C[Math.floor(R() * C.length)], s: 60 + R() * 70, r: R() * TAU, ph: R() * TAU, d: R() }); } return out; }
function mmConfettiDraw(g, list, t, t0 = 0) { list.forEach(o => { const p = mmPop(t, t0 + o.d * .6, .4); if (p <= 0) return; const bob = Math.sin(t * 2 + o.ph) * 8, rr = o.r + Math.sin(t * 1.3 + o.ph) * .12; g.save(); g.translate(o.x, o.y + bob); g.scale(p, p);
  if (o.k === 'squiggle') mmSquiggle(g, 0, 0, o.s * 1.3, rr, o.c, { w: 10, amp: o.s * .14, n: 2 }); else if (o.k === 'zig') mmSquiggle(g, 0, 0, o.s * 1.3, rr, o.c, { w: 10, amp: o.s * .14, n: 3, zig: true });
  else if (o.k === 'dots') mmDots(g, -o.s * .4, -o.s * .4, 4, 4, o.s * .26, 5, MM.ink); else mmShape(g, o.k, 0, 0, o.s, rr, o.c, { lw: 6, shadow: o.k === 'ring' ? 0 : 7 }); g.restore(); }); }
// bold title: outline + hard drop + per-letter pop and wiggle; o.fill, o.stroke, o.drop
function mmTitle(g, str, x, y, size, t, t0, o = {}) { const fam = (window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''; const ch = [...str]; g.save(); g.font = `900 ${size}px ${fam}"Arial Rounded MT Bold", sans-serif`; g.textBaseline = 'alphabetic';
  const ws = ch.map(c => g.measureText(c).width + (o.track ?? 0)), tot = ws.reduce((a, b) => a + b, 0); let cx = x - (o.align === 'left' ? 0 : tot / 2);
  ch.forEach((c, i) => { const p = mmPop(t, t0 + i * (o.stagger ?? .06), .4); if (p > 0) { g.save(); g.translate(cx + ws[i] / 2, y); g.rotate(Math.sin(t * 3 + i) * .04 + (o.tilt ?? 0)); g.scale(p, p); g.textAlign = 'center'; g.lineJoin = 'round';
    g.fillStyle = MM.ink; g.fillText(c, size * .06, size * .06); g.lineWidth = size * .09; g.strokeStyle = o.stroke ?? MM.ink; g.strokeText(c, 0, 0); g.fillStyle = typeof o.fill === 'function' ? o.fill(i) : (o.fill ?? MM.white); g.fillText(c, 0, 0); g.restore(); } cx += ws[i]; });
  g.restore(); return tot; }
// speech bubble with tail, black outline + hard shadow
function mmBubble(g, x, y, w, h, fill, p = 1, tail = [-.3, 1]) { if (p <= 0) return; g.save(); g.translate(x, y); g.scale(p, p); const path = () => { g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h * .28); g.moveTo(w * tail[0] - 30, h / 2 - 2); g.lineTo(w * tail[0] - 70, h / 2 + 80); g.lineTo(w * tail[0] + 30, h / 2 - 2); };
  g.save(); g.translate(14, 14); path(); g.fillStyle = MM.ink; g.fill(); g.restore(); path(); g.fillStyle = fill; g.fill(); g.lineWidth = 8; g.strokeStyle = MM.ink; g.lineJoin = 'round'; g.stroke(); g.restore(); }
