// ═══ HALFTONE toolkit (半调档案): a printed case file. Manila paper multiplied over everything at the end, one dark
// ink and up to four spot inks; tone comes only from dot size and overprint (multiply), never from a gradient. Headlines
// pop glyph by glyph with a misregistered second ink (+8/+8), stamps slam from 2.6× in 0.09 s, shots change by dot
// wipes. Outlines boil at 12 poses/s on props and characters only, never on text, dots or captions. Grammar after
// lemo-opuscar's halftone STYLE.md (MIT; rules only, no code). references/looks/halftone.md
const VIGN_TONE = ['70,45,20', .03, .14], POST_GRAIN = .08;
// paper + ink + three spot inks: overprint (teal), highlight (mustard), verdict (vermilion). Keep ≤ 5 inks + paper.
const HTC = { paper: '#ecdcb4', ink: '#2b211b', teal: '#2f8c8a', mustard: '#e2a92b', verm: '#d8432a' };
const HTF = { serif: '"Noto Serif SC","Songti SC","STSong",serif', sans: '"Noto Sans SC","PingFang SC","Hiragino Sans GB",sans-serif',
  mono: '"JetBrains Mono","Noto Sans SC",Menlo,monospace', hand: '"LXGW WenKai","Kaiti SC","STKaiti",serif' };
const htBack = (t, s = 1.7) => { t = clamp(t, 0, 1) - 1; return t * t * ((s + 1) * t + s) + 1; };   // back ease: overshoot, settle

// the paper: mottling (an upscaled random tile), warm per-pixel noise, a vignette and one fold; baked once and multiplied
// over the whole frame last (htFinish), so every ink is printed on it rather than pasted over it
const HT_PAPER = (() => {
  const c = mk(W, H), g = g2(c), r = rng(907), t = mk(36, 64), tg = g2(t), im = tg.createImageData(36, 64);
  for (let i = 0; i < im.data.length; i += 4) { const v = 238 + r() * 17; im.data[i] = v; im.data[i + 1] = v - 2; im.data[i + 2] = v - 6; im.data[i + 3] = 255; }
  tg.putImageData(im, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(t, 0, 0, W, H);
  const id = g.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 14; d[i] += n + 2; d[i + 1] += n; d[i + 2] += n - 2; }
  g.putImageData(id, 0, 0);
  const vg = g.createRadialGradient(W / 2, H * .48, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .64);
  vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(150,118,78,.32)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  const fy = Math.round(H * .54); g.fillStyle = 'rgba(120,92,58,.12)'; g.fillRect(0, fy - 40, W, 40); g.fillStyle = 'rgba(110,84,52,.22)'; g.fillRect(0, fy - 2, W, 3);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, fy + 1, W, 3); return c;
})();

// halftone: a rotated grid of dots drawn as one path; radius = density × step × k (near k .7 neighbours merge into solid
// ink). dens(x, y) → 0..1 in the current transform; box limits the grid. One ink per call; screen angles 15/45/75.
function htDots(g, { step = 22, ang = 15, k = .68, col, dens, box = [0, 0, W, H] }) {
  const a = ang * PI / 180, ca = Math.cos(a), sa = Math.sin(a), [x0, y0, x1, y1] = box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2 / step);
  g.beginPath();
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
    const x = cx + (i * ca - j * sa) * step, y = cy + (i * sa + j * ca) * step;
    if (x < x0 - step || x > x1 + step || y < y0 - step || y > y1 + step) continue;
    const r = dens(x, y) * step * k; if (r < .6) continue;
    g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
  }
  g.fillStyle = col; g.fill();
}
const htEdge = amt => (x, y) => amt * clamp(1 - Math.min(x, W - x, y, H - y) / 300, 0, 1) ** 1.5;   // dots crowd the border
const htRadial = (cx, cy, R, amt) => (x, y) => amt * clamp(1 - Math.hypot(x - cx, y - cy) / R, 0, 1) ** .8;
const htRamp = (y0, y1, a0, a1) => (x, y) => lerp(a0, a1, inv(y0, y1, y));

// dot wipe between shots: dots of one ink grow from a corner until they merge into solid ink (k 0 → 1); the next shot
// opens with the same call and k 1 → 0 from the opposite corner, so the cut hides under full ink. Screen space.
function htWipe(g, k, { col = HTC.teal, step = 64, ang = 15, from = [0, H] } = {}) {
  if (k <= 0) return; const D = Math.hypot(W, H);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  htDots(g, { step, ang, k: .76, col, dens: (x, y) => clamp(k * 2 - Math.hypot(x - from[0], y - from[1]) / D, 0, 1) }); g.restore();
}

// line boil: outlines pass through points nudged by noise reseeded per exposure (e, 12/s); props and characters only
function htWob(g, pts, id, e, amp = 3) {
  g.beginPath();
  pts.forEach(([x, y], i) => { const dx = noise(i * .37 + id, e * 1.31) * amp, dy = noise(i * .41 - id, e * 1.73 + 9) * amp; i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy); });
  g.closePath();
}
function htRR(x, y, w, h, r, seg = 26) {   // rounded-rectangle outline as points (so it can boil)
  const out = [], arc = (cx, cy, a0) => { for (let i = 0; i <= 4; i++) { const a = a0 + i / 4 * PI / 2; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  const edge = (xa, ya, xb, yb) => { const n = Math.max(1, Math.round(Math.hypot(xb - xa, yb - ya) / seg)); for (let i = 1; i < n; i++) out.push([lerp(xa, xb, i / n), lerp(ya, yb, i / n)]); };
  arc(x + w - r, y + r, -PI / 2); edge(x + w, y + r, x + w, y + h - r); arc(x + w - r, y + h - r, 0); edge(x + w - r, y + h, x + r, y + h);
  arc(x + r, y + h - r, PI / 2); edge(x, y + h - r, x, y + r); arc(x + r, y + r, PI); edge(x + r, y, x + w - r, y); return out;
}
const htEll = (cx, cy, rx, ry, n = 28) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * rx, cy + Math.sin(i / n * TAU) * ry]);
function htInk(g, pts, id, e, fill, lw = 7) {   // a boiling shape: flat spot-ink fill, dark keyline
  htWob(g, pts, id, e); g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.lineJoin = 'round'; g.strokeStyle = HTC.ink; g.stroke();
}
function htLimb(g, ax, ay, bx, by, w, fill = HTC.teal) {   // a thick outlined capsule: ink stroke, then the fill inside it
  g.lineCap = 'round'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.strokeStyle = HTC.ink; g.lineWidth = w + 14; g.stroke(); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
}
// the placeholder character: one local colour, paper face, glossy eyes. arm: how far the arms are raised (0 down, 1 up)
function htFigure(g, x, y, st, e, { rot = 0, s = 1, col = HTC.teal, arm = 1 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  [-1, 1].forEach(sd => { const [bx, by] = boil(20 + sd, e, 2), a = lerp(2.9, .45, arm) + .1 * Math.sin(st * 5 + sd); htLimb(g, sd * 50, -50, sd * (50 + Math.sin(a) * 120) + bx, -50 - Math.cos(a) * 120 + by, 40, col); });
  [-1, 1].forEach(sd => { const [bx, by] = boil(30 + sd, e, 2); htLimb(g, sd * 34, 90, sd * 64 + bx, 156 + by, 42, col); });
  htInk(g, htRR(-82, -116, 164, 236, 80, 22), 5, e, col, 7);
  htInk(g, htEll(0, -40, 60, 50), 6, e, HTC.paper, 5);
  [-1, 1].forEach(sd => { g.fillStyle = HTC.ink; g.beginPath(); g.ellipse(sd * 23, -50, 13, 19, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(sd * 23 - 4, -58, 5.5, 0, TAU); g.fill(); g.beginPath(); g.arc(sd * 23 + 5, -42, 2.6, 0, TAU); g.fill(); });
  g.fillStyle = HTC.ink; g.beginPath(); g.ellipse(0, -10, 10, 13, 0, 0, TAU); g.fill();
  g.restore();
}

// headline: black serif 900, glyphs pop one by one (drop 30–100 px, land with a volume-keeping squash) over a
// misregistered copy in the overprint ink (+8/+8); both multiplied
function htHead(g, lines, x, y0, lh, size, st, t0, stag = .06) {
  g.font = `900 ${size}px ${HTF.serif}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; let i = 0;
  lines.forEach((ln, li) => { let cx = x; [...ln].forEach(ch => {
    const w = g.measureText(ch).width, k = clamp((st - t0 - i * stag) / .4, 0, 1), drop = 30 + hash(i, 8) * 70; i++;
    if (k > 0) {
      const yy = y0 + li * lh - drop * (1 - htBack(k)), sq = 1 - .16 * Math.sin(PI * inv(.55, 1, k)) * (k > .55 ? 1 : 0);
      g.save(); g.translate(cx + w / 2, yy); g.scale(1 / sq, sq); g.globalCompositeOperation = 'multiply';
      g.fillStyle = HTC.teal; g.fillText(ch, -w / 2 + 8, 8); g.fillStyle = HTC.ink; g.fillText(ch, -w / 2, 0); g.restore();
    }
    cx += w; }); });
}
function htPop(g, cx, cy, st, t0, draw) {   // everything else enters with overshoot: scale from 0, back ease, 0.4 s
  const k = clamp((st - t0) / .4, 0, 1); if (k <= 0) return; const s = htBack(k);
  g.save(); g.translate(cx, cy); g.scale(s, s); draw(g); g.restore();
}
function htPill(g, x, y, w, h, fill, shadow) {   // a pill with its overprint shadow (+10/+10, multiplied)
  if (shadow) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = shadow; g.beginPath(); g.roundRect(x + 10, y + 10, w, h, h / 2); g.fill(); g.restore(); }
  g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fill();
}
// a data chip: dark pill, a label in the highlight ink, a value in paper, the data face. (x, y): left middle.
function htChip(g, x, y, st, t0, label, value, size = 42) {
  g.font = `800 ${size}px ${HTF.mono}`; const wa = g.measureText(label).width, wb = g.measureText(value).width, w = wa + wb + 96;
  htPop(g, x + w / 2, y, st, t0, g => {
    g.font = `800 ${size}px ${HTF.mono}`; htPill(g, -w / 2, -size, w, size * 2, HTC.ink, HTC.teal); g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = HTC.mustard; g.fillText(label, -w / 2 + 34, 2); g.fillStyle = HTC.paper; g.fillText(value, -w / 2 + 34 + wa + 28, 2);
  });
}
// the caption bar: dark pill, overprint shadow, black sans 900, the keyword in the highlight ink. (cx, cy): centre
function htCaption(g, st, pre, key, cx, cy, t0, size = 80) {
  htPop(g, cx, cy, st, t0, g => {
    g.font = `900 ${size}px ${HTF.sans}`; const w1 = g.measureText(pre).width, w2 = g.measureText(key).width, w = w1 + w2 + 120, h = size * 1.7;
    htPill(g, -w / 2, -h / 2, w, h, HTC.ink, HTC.teal); g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = HTC.paper; g.fillText(pre, -w / 2 + 60, 4); g.fillStyle = HTC.mustard; g.fillText(key, -w / 2 + 60 + w1, 4);
  });
}
// a handwritten note: a spot-ink square with a darker fold corner, the text in the hand face; it boils like a prop
function htNote(g, x, y, w, h, rot, lines, st, t0, e, id = 40) {
  htPop(g, x + w / 2, y + h / 2, st, t0, g => {
    g.rotate(rot); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = HTC.teal; g.fillRect(-w / 2 + 12, -h / 2 + 14, w, h); g.restore();
    htInk(g, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2 - 50], [w / 2 - 50, h / 2], [-w / 2, h / 2]], id, e, HTC.mustard, 5);
    g.fillStyle = HTC.ink; g.font = `${Math.round(h * .17)}px ${HTF.hand}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((ln, i) => g.fillText(ln, 0, (i - (lines.length - 1) / 2) * h * .24 - h * .1));
  });
}
// the stamp sprite: double rounded frame and black sans in the verdict ink, then an ink-grain knock-out so the edges are
// rough and the ink mottled. Baked once (build()): its text is invisible to textBoxes(), so keep it to a short verdict.
function htStampSprite(text, { w = 720, h = 280, size = 170, col = HTC.verm, seed = 4242 } = {}) {
  const c = mk(w + 40, h + 40), g = g2(c), r = rng(seed), q = h / 280;
  g.translate(20, 20); g.strokeStyle = g.fillStyle = col; g.lineWidth = 18 * q; g.beginPath(); g.roundRect(9 * q, 9 * q, w - 18 * q, h - 18 * q, 38 * q); g.stroke();
  g.lineWidth = 7 * q; g.beginPath(); g.roundRect(38 * q, 38 * q, w - 76 * q, h - 76 * q, 22 * q); g.stroke();
  g.font = `900 ${size}px ${HTF.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 10 * q);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 2600 * w * h / 201600; i++) { g.globalAlpha = .3 + r() * .7; g.beginPath(); g.arc(r() * w, r() * h, (r() ** 3 * 5 + .6) * q, 0, TAU); g.fill(); }
  for (let i = 0; i < 12; i++) { g.globalAlpha = .25 + r() * .3; g.beginPath(); g.ellipse(r() * w, r() * h, (40 + r() * 120) * q, (2 + r() * 4) * q, (r() - .5) * .5, 0, TAU); g.fill(); }
  return c;
}
// the slam: from 2.6× to 1× in 0.09 s (ease-in), a damped 5 % ring, tilted, multiplied at .93. ks = seconds since impact
function htSlam(g, sprite, x, y, ks, { rot = -.16, s0 = 2.6, sc = 1 } = {}) {
  if (ks < 0) return; const s = ks < .09 ? lerp(s0, 1, (ks / .09) ** 2) : 1 - .05 * Math.exp(-(ks - .09) * 12) * Math.cos((ks - .09) * 38);
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * sc, s * sc); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .93;
  g.drawImage(sprite, -sprite.width / 2, -sprite.height / 2); g.restore();
}
const htShake = (st, t0, amp = 24, dur = .45) => {   // camera offset after an impact: quadratic decay, new jitter every 2 frames
  const u = st - t0, a = u > 0 ? amp * Math.max(0, 1 - u / dur) ** 2 : 0, fr = Math.floor(st * 30);
  return [(hash(fr, 1) - .5) * 2 * a, (hash(fr, 2) - .5) * 2 * a];
};
// the giant exhibit numeral: a flat spot-ink fill overprinted with a darker halftone clipped to the glyphs; bleeds off
function htNumeral(text, { size = 980, col = HTC.mustard, tone = HTC.teal } = {}) {
  const w = size * 1.33, h = size * .88, c = mk(w, h), g = g2(c);
  g.font = `900 ${size}px ${HTF.sans}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillStyle = col; g.fillText(text, 20, h * .93);
  g.globalCompositeOperation = 'source-atop'; htDots(g, { step: 24, ang: 15, col: tone, dens: htRamp(h * .07, h * .93, .12, .62), box: [0, 0, w, h] });
  return c;
}
// case HUD in screen space (the shake leaves it alone): case chip top-left, subject pill, REC and a blinking dot top-right
function htHud(g, st, caseNo, subject, rec) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = `800 40px ${HTF.mono}`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const wa = g.measureText(caseNo).width; htPill(g, 96, 150, wa + 64, 76, HTC.ink); g.fillStyle = HTC.paper; g.fillText(caseNo, 128, 190);
  g.font = `700 38px ${HTF.sans}`; const wb = g.measureText(subject).width, bx = 96 + wa + 84;
  g.lineWidth = 5; g.strokeStyle = HTC.teal; g.beginPath(); g.roundRect(bx, 152, wb + 60, 72, 36); g.stroke(); g.fillStyle = HTC.teal; g.fillText(subject, bx + 30, 190);
  g.textAlign = 'right'; g.font = `800 40px ${HTF.mono}`; g.fillStyle = HTC.ink; g.fillText(rec, W - 96, 190);
  if (st % 1 < .5) { g.fillStyle = HTC.verm; g.beginPath(); g.arc(W - 96 - g.measureText(rec).width - 30, 190, 14, 0, TAU); g.fill(); }
  g.restore();
}
// last call of every frame: dust on the print (paper specks and fewer ink specks, reseeded every 2 frames), then the
// paper multiplied over everything, then an optional flash (capped at .45)
function htFinish(g, st, flash = 0) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const r = rng(hash(Math.floor(st * 15), 31) * 4294967296 >>> 0);
  g.fillStyle = HTC.paper; for (let i = 0; i < 320; i++) { g.beginPath(); g.arc(r() * W, r() * H, .8 + r() * 1.8, 0, TAU); g.fill(); }
  g.fillStyle = HTC.ink; for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(r() * W, r() * H, .6 + r() * 1.3, 0, TAU); g.fill(); }
  g.globalCompositeOperation = 'multiply'; g.drawImage(HT_PAPER, 0, 0); g.globalCompositeOperation = 'source-over';
  if (flash > 0) { g.fillStyle = `rgba(255,250,238,${.45 * clamp(flash, 0, 1)})`; g.fillRect(0, 0, W, H); }
  g.restore();
}
