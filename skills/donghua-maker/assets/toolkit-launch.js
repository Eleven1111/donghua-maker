// ═══ LAUNCH toolkit (产品发布片): a product launch spot built the way studio spots are: a stage that is deep ink or warm paper with slow
// colour glow, glass UI panels whose type is drawn live, headlines that spring in on the beat, a cursor that clicks, panels that turn in
// perspective, counters that tick, and one isolated button to end on. Pure functions of t; nothing is reseeded.
// Fonts: embed "notosans" → EMBED_FONTS[0] (variable weight 300–900). references/looks/launch.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['2,4,10', .02, .12];
const LC = { ink: '#090b11', ink2: '#161a27', paper: '#f2f0ea', tx: '#f5f6fa', txd: '#12141c', mute: '#8c93a6', muteD: '#6b7184', acc: '#6c63ff', acc2: '#ff8a5b', ok: '#2fd08a' };
const lcSans = (size, w = 600) => `${w} ${size}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}"PingFang SC", "Noto Sans SC", sans-serif`;
const lcRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lcMix = (a, b, k) => { const x = lcRGB(a), y = lcRGB(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(k, 0, 1)))).join(',')})`; };
const lcA = (h, a) => { const [r, g, b] = lcRGB(h); return `rgba(${r},${g},${b},${a})`; };
const lcBack = (k, c = 1.8) => { k = clamp(k, 0, 1) - 1; return 1 + (c + 1) * k * k * k + c * k * k; };   // 0 → 1 with an overshoot: the spring every landing uses
const lcHit = (st, t0, d = .45) => st < t0 ? 0 : Math.exp(-(st - t0) / (d * .35));                       // 1 on the beat, then decays: flashes, glows, press states
const lcRR = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
// stage: mix 0 = deep ink, 1 = warm paper. Three colour blobs drift on fixed Lissajous paths, so the glow moves continuously and never flickers
function lcStage(g, t, mix = 0, o = {}) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = lcMix(LC.ink, LC.paper, mix); g.fillRect(0, 0, W, H);
  [[LC.acc, 2.1, 1.7, .0], [LC.acc2, 3.3, 2.6, 1.0], ['#2fb7d8', 4.4, 3.4, 2.0]].forEach(([c, a, b, ph], i) => { const x = W * (.5 + .36 * Math.sin(t * .19 + a + (o.ph ?? 0))), y = H * (.5 + .34 * Math.cos(t * .15 + b + ph)), r = W * (.42 + .06 * i), al = lerp(.30, .20, mix) * (o.glow ?? 1);
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, lcA(c, al)); gr.addColorStop(1, lcA(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); }); }
// glass panel (light = on the paper stage): soft drop shadow, a hairline lit from the top edge, no flat border
function lcPanel(g, x, y, w, h, o = {}) { const L = o.light, r = o.r ?? 40; g.save(); g.globalAlpha *= o.a ?? 1; g.shadowColor = L ? 'rgba(40,36,90,.20)' : 'rgba(0,0,0,.55)'; g.shadowBlur = o.blur ?? 90; g.shadowOffsetY = o.dy ?? 40;
  lcRR(g, x, y, w, h, r); g.fillStyle = L ? 'rgba(255,255,255,.94)' : lcA(LC.ink2, .82); g.fill(); g.shadowColor = 'transparent';
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, L ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,.30)'); gr.addColorStop(.4, L ? 'rgba(20,20,60,.07)' : 'rgba(255,255,255,.08)'); gr.addColorStop(1, L ? 'rgba(20,20,60,.05)' : 'rgba(255,255,255,.05)');
  g.strokeStyle = gr; g.lineWidth = 2.5; lcRR(g, x, y, w, h, r); g.stroke(); g.restore(); }
function lcText(g, str, x, y, size, o = {}) { g.save(); g.font = lcSans(size, o.w ?? 600); g.textBaseline = 'alphabetic'; g.textAlign = o.align ?? 'left'; if ('letterSpacing' in g) g.letterSpacing = `${o.track ?? 0}px`;
  g.globalAlpha *= o.a ?? 1; g.fillStyle = o.col ?? LC.tx; g.fillText(str, x, y); const w = g.measureText(str).width; g.restore(); return w; }
// a headline word. k 0..1 arrives, out 0..1 leaves. motion: 'rise' (through a mask, springs past its mark) | 'slam' (from large, overshoots) | 'pop' | 'fade'. grad: brand gradient fill. Returns the width
function lcWord(g, str, x, y, size, k, o = {}) { const out = clamp(o.out ?? 0, 0, 1); if (k <= 0 || out >= 1) return 0; g.save(); g.font = lcSans(size, o.w ?? 800); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  if ('letterSpacing' in g) g.letterSpacing = `${o.track ?? -size * .025}px`; const w = g.measureText(str).width, x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2, m = o.motion ?? 'rise', b = lcBack(k, o.over ?? 1.7), q = eio(out);
  if (o.grad) { const gr = g.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, LC.acc); gr.addColorStop(1, LC.acc2); g.fillStyle = gr; } else g.fillStyle = o.col ?? LC.tx;
  if (m === 'rise') { g.beginPath(); g.rect(x0 - size * .3, y - size * 1.08, w + size * .6, size * 1.5); g.clip(); g.translate(0, (1 - b) * size * 1.15 - q * size * 1.15); g.fillText(str, x0, y); }
  else if (m === 'slam') { const s = (1 + (1 - b) * 1.25) * (1 + q * .22); g.globalAlpha = clamp(k * 4, 0, 1) * (1 - q); g.translate(x0 + w / 2, y - size * .35); g.scale(s, s); g.fillText(str, -w / 2, size * .35); }
  else if (m === 'pop') { const s = (.55 + .45 * b) * (1 - q * .25); g.globalAlpha = clamp(k * 5, 0, 1) * (1 - q); g.translate(x0 + w / 2, y - size * .35); g.scale(s, s); g.fillText(str, -w / 2, size * .35); }
  else { g.globalAlpha = eo(clamp(k, 0, 1)) * (1 - q); g.fillText(str, x0, y); }
  g.restore(); return w; }
// a line of words that land one after another (`gap` s apart) and leave together; `hot` word indexes take the brand gradient
function lcLine(g, words, cx, y, size, st, t0, gap, o = {}) { g.save(); g.font = lcSans(size, o.w ?? 800); if ('letterSpacing' in g) g.letterSpacing = `${o.track ?? -size * .025}px`; const sp = size * (o.space ?? .22), ws = words.map(w => g.measureText(w).width); g.restore();
  let x = cx - (ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1)) / 2; words.forEach((wd, i) => { lcWord(g, wd, x, y, size, (st - t0 - i * gap) / (o.dur ?? .36), { ...o, align: 'left', grad: (o.hot || []).includes(i) }); x += ws[i] + sp; }); }
// ── perspective: an offscreen panel turned `ry` radians about its vertical axis; columns are scaled by depth so the far edge is smaller and darker
const LCOFF = {};
function lcOff(key, w, h) { const c = LCOFF[key] || (LCOFF[key] = mk(w, h)), g = g2(c); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.shadowColor = 'transparent'; g.clearRect(0, 0, c.width, c.height); return [c, g]; }
function lcTilt(g, c, cx, cy, ry, o = {}) { const w = c.width, h = c.height, sc = o.scale ?? 1;
  if (Math.abs(ry) < 1e-3) { g.save(); g.translate(cx, cy); if (o.roll) g.rotate(o.roll); g.scale(sc, sc); g.drawImage(c, -w / 2, -h / 2); g.restore(); return; }
  const f = o.f ?? 2600, sn = Math.sin(ry), cs = Math.cos(ry), X = u => u * cs * f / (f + u * sn), [oc, og] = lcOff('tilt', Math.ceil(w * 1.3), Math.ceil(h * 1.3)), ox = oc.width / 2, oy = oc.height / 2;
  const st = Math.abs(ry) < .15 ? 4 : 2; for (let sx = 0; sx < w; sx += st) { const u0 = (sx - w / 2) * sc, u1 = (sx + st - w / 2) * sc, s = f / (f + (u0 + u1) / 2 * sn), xl = X(u0), xr = X(u1), dh = h * sc * s; const a = Math.round(ox + xl), b = Math.round(ox + xr); if (b > a) og.drawImage(c, sx, 0, st, h, a, oy - dh / 2, b - a, dh); }
  og.globalCompositeOperation = 'source-atop'; const far = ry > 0 ? 1 : 0, sh = og.createLinearGradient(ox - w / 2, 0, ox + w / 2, 0); sh.addColorStop(far, `rgba(0,0,0,${Math.min(.5, Math.abs(ry) * .9)})`); sh.addColorStop(1 - far, 'rgba(0,0,0,0)'); og.fillStyle = sh; og.fillRect(0, 0, oc.width, oc.height);
  g.save(); g.translate(cx, cy); if (o.roll) g.rotate(o.roll); g.drawImage(oc, -ox, -oy); g.restore(); }
// where a point of the panel lands on screen: (ux, uy) is its offset from the panel's centre in the panel's own pixels → [x, y, scale]. Use it to aim a cursor or a flying row at a tilted panel
function lcTiltPt(ry, cx, cy, ux, uy, o = {}) { const f = o.f ?? 2600, sc = o.scale ?? 1, sn = Math.sin(ry), cs = Math.cos(ry), u = ux * sc, s = f / (f + u * sn); return [cx + u * cs * s, cy + uy * sc * s, s]; }
// ── cursor: pts [[x, y, t], …] in shot seconds; Catmull-Rom between them with an ease on every leg, so it travels like a hand, not a line
function lcPath(pts, st) { const n = pts.length; if (st <= pts[0][2]) return [pts[0][0], pts[0][1]]; if (st >= pts[n - 1][2]) return [pts[n - 1][0], pts[n - 1][1]];
  let i = 0; while (st > pts[i + 1][2]) i++; const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)], u = eio(inv(p1[2], p2[2], st)), cr = (a, b, c, d) => .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]; }
function lcCursor(g, x, y, press = 0, a = 1) { g.save(); g.globalAlpha *= a; g.translate(x, y); const s = 1.8 * (1 - press * .1); g.scale(s, s); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 30); g.lineTo(8, 23); g.lineTo(14, 36); g.lineTo(20, 33); g.lineTo(14, 21); g.lineTo(24, 21); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.shadowColor = 'transparent'; g.lineWidth = 2.5; g.strokeStyle = LC.ink; g.stroke(); g.restore(); }
function lcRipple(g, x, y, k) { if (k <= 0 || k >= 1) return; g.save(); g.strokeStyle = lcA(LC.acc, .75 * (1 - k)); g.lineWidth = 7 * (1 - k) + 1; g.beginPath(); g.arc(x, y, 16 + 110 * eo(k), 0, TAU); g.stroke(); g.restore(); }
// ── UI parts (draw on the main canvas or on an lcOff canvas)
function lcAvatar(g, x, y, r, str, col) { g.save(); g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); lcText(g, str, x, y + r * .36, r * 1.0, { w: 700, col: '#fff', align: 'center' }); g.restore(); }
function lcChip(g, x, y, str, o = {}) { const s = o.size ?? 30, pad = s * .6; g.save(); g.font = lcSans(s, 600); const w = g.measureText(str).width + pad * 2, h = s * 1.7; g.globalAlpha *= o.a ?? 1; lcRR(g, x, y - h * .72, w, h, h / 2); g.fillStyle = o.bg ?? lcA(LC.acc, .18); g.fill(); g.restore();
  lcText(g, str, x + pad, y, s, { w: 600, col: o.col ?? LC.acc, a: o.a ?? 1 }); return w; }
// a task row: checkbox that draws its tick (done 0..1), title, due chip, avatar. hl 0..1 tints the row (a landing flash); light = on a light panel
function lcRow(g, x, y, w, o) { const h = 112, L = o.light, d = o.done ?? 0; g.save(); g.globalAlpha *= o.a ?? 1; lcRR(g, x, y, w, h, 30); g.fillStyle = L ? 'rgba(20,20,60,.045)' : 'rgba(255,255,255,.055)'; g.fill(); if (o.hl > 0) { lcRR(g, x, y, w, h, 30); g.fillStyle = lcA(LC.acc, o.hl * (L ? .16 : .28)); g.fill(); }
  const bx = x + 38, by = y + h / 2; lcRR(g, bx, by - 22, 44, 44, 13); g.lineWidth = 3.5; g.strokeStyle = L ? 'rgba(20,20,60,.30)' : 'rgba(255,255,255,.32)'; g.stroke();
  if (d > 0) { lcRR(g, bx, by - 22, 44, 44, 13); g.fillStyle = lcA(LC.ok, clamp(d * 4, 0, 1)); g.fill(); g.beginPath(); g.moveTo(bx + 11, by + 1); g.lineTo(bx + 19, by + 10); g.lineTo(bx + 34, by - 9); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = 6; g.setLineDash([46]); g.lineDashOffset = 46 * (1 - clamp((d - .15) / .7, 0, 1)); g.stroke(); }
  g.restore(); lcText(g, o.title, x + 112, y + h / 2 + 13, 38, { w: 600, col: L ? LC.txd : LC.tx, a: (o.a ?? 1) * (1 - d * .45) });
  if (o.due) lcChip(g, x + w - 360, y + h / 2 + 10, o.due, { size: 28, a: o.a ?? 1, col: L ? LC.muteD : LC.mute, bg: L ? 'rgba(20,20,60,.07)' : 'rgba(255,255,255,.09)' }); if (o.who) lcAvatar(g, x + w - 70, y + h / 2, 32, o.who[0], o.who[1]); }
// transcript lines [[initial, text, colour], …]; hl = { lineIndex: 0..1 } sweeps a marker behind the line, left to right
function lcTranscript(g, x, y, w, lines, o = {}) { const lh = o.lh ?? 150, L = o.light; lines.forEach(([who, txt, col], i) => { const yy = y + i * lh; lcAvatar(g, x + 40, yy + 30, 34, who, col); const k = (o.hl || {})[i] ?? 0;
    if (k > 0) { g.save(); g.font = lcSans(40, 500); const tw = g.measureText(txt).width + 44; g.restore(); g.save(); lcRR(g, x + 100, yy - 24, tw * eio(k), 100, 22); g.fillStyle = lcA(LC.acc2, L ? .30 : .34); g.fill(); g.restore(); }
    lcText(g, txt, x + 122, yy + 42, 40, { w: 500, col: L ? LC.txd : LC.tx, a: .94 }); }); }
// a counter with fixed-width digits, so the number doesn't shimmy as it ticks
function lcNum(g, v, cx, y, size, o = {}) { const s = String(Math.round(v)), cw = size * (o.cw ?? .62), tot = cw * s.length; [...s].forEach((ch, i) => lcText(g, ch, cx - tot / 2 + cw * (i + .5), y, size, { w: o.w ?? 800, col: o.col ?? LC.tx, align: 'center', a: o.a ?? 1 })); return tot; }
// a button: k arrives (springs), press 0..1 dips it. One button alone on an empty stage is the whole call to action
function lcButton(g, cx, cy, w, h, str, o = {}) { const k = o.k ?? 1, p = o.press ?? 0; if (k <= 0) return; g.save(); g.translate(cx, cy); const s = (.6 + .4 * lcBack(k)) * (1 - p * .05); g.scale(s, s); g.globalAlpha *= clamp(k * 4, 0, 1);
  g.shadowColor = lcA(LC.acc, .55); g.shadowBlur = 70 + 40 * (o.glow ?? 0); g.shadowOffsetY = 24; const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, LC.acc); gr.addColorStop(1, lcMix(LC.acc, LC.acc2, .6)); lcRR(g, -w / 2, -h / 2, w, h, h / 2); g.fillStyle = gr; g.fill(); g.shadowColor = 'transparent';
  lcText(g, str, 0, h * .18, h * .4, { w: 700, col: '#fff', align: 'center', track: 2 }); g.restore(); }
// the product mark: a ring that draws itself, then a tick. A stand-in: draw the real product's mark in its place
function lcLogo(g, cx, cy, s, k) { g.save(); g.translate(cx, cy); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round'; const ring = clamp(k / .6, 0, 1), tick = clamp((k - .45) / .5, 0, 1);
  g.beginPath(); g.arc(0, 0, 60, 0, TAU); g.fillStyle = lcA(LC.acc, .16 * eo(ring)); g.fill(); g.beginPath(); g.arc(0, 0, 60, -PI / 2, -PI / 2 + TAU * eo(ring) + .001); g.strokeStyle = LC.acc; g.lineWidth = 12; g.stroke();
  if (tick > 0) { g.beginPath(); g.moveTo(-24, 2); g.lineTo(-6, 20); g.lineTo(28, -20); g.setLineDash([82]); g.lineDashOffset = 82 * (1 - eo(tick)); g.strokeStyle = LC.acc2; g.lineWidth = 13; g.stroke(); } g.restore(); }
// the messy meeting: half-sentences [text, x, y0, speed px/s, size] drifting up at different speeds. Alive on frame 0, so the hook never opens on a still
function lcGhost(g, t, frags, o = {}) { const P = H + 400; g.save(); frags.forEach(([txt, x, y0, sp, size], i) => { const y = (((y0 - t * sp) % P) + P) % P - 200; g.globalAlpha = (o.a ?? .3) * (1 - Math.abs(y - H / 2) / (H * .62)) * (o.k ?? 1); if (g.globalAlpha <= 0) return;
    g.fillStyle = o.col ?? LC.tx; g.font = lcSans(size, 500); g.fillText(txt, x, y); }); g.restore(); }
