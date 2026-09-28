// ═══ NIANHUA toolkit (年画): Yangliuqing-style New Year print — fine black key-block outline over soft hand-coloured washes on
// cream paper: a chubby child (shaved blue-grey scalp, heart-shaped hair tufts, red dudou with a dark band and blue collar, gold
// bangles), a big carp with rows of scales and flowing fins, lotus flower, leaf and pod, a blue water band, four title characters.
// Studied from public-domain Qing prints (莲年余利, 连生贵子); compositions are our own. Each shape is washed then outlined in
// painter's order (later shapes hide earlier lines), and each colour group can be printed in separately (套色). references/looks/nianhua.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .1, VIGN_TONE = ['90,60,30', 0, .12];
const NH = { paper: '#f3ead3', ink: '#1d1714', red: '#d23a2e', rose: '#e46a7a', pink: '#f4b3b8', orange: '#ef8a45', green: '#4f9160', leaf: '#86b77a',
  yellow: '#f0c13a', gold: '#d8a03c', blue: '#4d72b8', water: '#a9bfe3', scalp: '#aebfe0', skin: '#fbe8da', dark: '#23302f', white: '#fbf7ee' };
// colour → print group (one wooden block per group)
const NH_GROUP = { skin: 'skin', white: 'skin', yellow: 'yellow', gold: 'yellow', red: 'red', rose: 'red', orange: 'red', pink: 'red', green: 'green', leaf: 'green', blue: 'blue', water: 'blue', scalp: 'blue', dark: 'line', ink: 'line' };
// press a scene: scene(api) draws every shape in order, wash then key line. P = { line, skin, yellow, red, green, blue } 0..1 per block;
// a block arriving (k < 1) is misregistered by up to 16 px and faint, then snaps into place.
function nhPrint(g, scene, P = {}) {
  for (const mode of ['all']) {
    const api = { mode,
      fill(path, key, o = {}) { const k = P[NH_GROUP[key] ?? key] ?? 1; if (k <= 0) return; const e = eio(k);
        g.save(); g.globalAlpha = e * (o.alpha ?? 1); g.translate((1 - e) * 16, (1 - e) * -10); g.beginPath(); path(g);
        if (o.stroke) { g.lineWidth = o.stroke; g.lineCap = 'round'; g.strokeStyle = o.grad ? o.grad(g) : NH[key]; g.stroke(); } else { g.fillStyle = o.grad ? o.grad(g) : NH[key]; g.fill(); }
        g.restore(); },
      line(path, w = 3.5, o = {}) { const k = P.line ?? 1; if (k <= 0) return; g.save(); g.globalAlpha = eio(k) * (o.alpha ?? 1); g.translate((1 - eio(k)) * 16, 0);
        g.beginPath(); path(g); g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = o.col ?? NH.ink; g.stroke(); g.restore(); },
      both(path, key, w, o) { this.fill(path, key, o); this.line(path, w); },
      tf(x, y, s, r, fn) { g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s); fn(); g.restore(); },
      raw(m, fn) { { const k = P[m === 'line' ? 'line' : 'red'] ?? 1; if (k > 0) { g.save(); g.globalAlpha = eio(k); fn(g); g.restore(); } } } };
    scene(api);
  }
}
const nhLin = (y0, y1, c0, c1) => g => { const r = g.createLinearGradient(0, y0, 0, y1); r.addColorStop(0, c0); r.addColorStop(1, c1); return r; };
const nhRad = (x, y, r0, c0, c1) => g => { const r = g.createRadialGradient(x, y, 0, x, y, r0); r.addColorStop(0, c0); r.addColorStop(1, c1); return r; };
// capsule between two points with end radii (limbs)
const nhCap = (x1, y1, x2, y2, r1, r2) => g => { const a = Math.atan2(y2 - y1, x2 - x1); g.arc(x1, y1, r1, a + PI / 2, a - PI / 2); g.arc(x2, y2, r2, a - PI / 2, a + PI / 2); g.closePath(); };
const nhEll = (x, y, rx, ry, r = 0) => g => g.ellipse(x, y, rx, ry, r, 0, TAU);
const nhHeart = (x, y, s, r = 0) => g => { const c = Math.cos(r), sn = Math.sin(r), P = (a, b) => [x + (a * c - b * sn) * s, y + (a * sn + b * c) * s];
  let p = P(0, 1); g.moveTo(p[0], p[1]); const q = [[-1.2, .2, -1, -1.1, 0, -.5], [1, -1.1, 1.2, .2, 0, 1]];
  q.forEach(([a, b, c2, d, e, f]) => { const A = P(a, b), B = P(c2, d), C = P(e, f); g.bezierCurveTo(A[0], A[1], B[0], B[1], C[0], C[1]); }); g.closePath(); };
// ── the child, origin at the torso centre (head r 150 at s = 1). o.blink 0..1, o.nod radians, o.reach 0..1 (right arm towards the fish)
function nhChild(a, x, y, s, t, o = {}) { a.tf(x, y, s, 0, () => {
  a.both(nhCap(70, 140, 205, 230, 70, 56), 'skin', 3.5, { grad: nhRad(140, 170, 140, '#fdf1e8', '#f6d6c4') });
  a.both(nhCap(-70, 130, -235, 175, 72, 60), 'skin', 3.5, { grad: nhRad(-150, 150, 140, '#fdf1e8', '#f6d6c4') });
  a.both(nhCap(-235, 175, -175, 290, 58, 46), 'skin', 3.5, { grad: nhRad(-200, 230, 110, '#fdf1e8', '#f4d0bd') });
  a.both(nhEll(-172, 282, 54, 20, -.5), 'gold', 3, { stroke: 14 });
  a.both(nhEll(0, -10, 158, 175), 'skin', 3.5, { grad: nhRad(-30, -40, 220, '#fff4ec', '#f5d3c0') });
  const apron = g => { g.moveTo(-112, -118); g.lineTo(112, -118); g.quadraticCurveTo(150, 60, 120, 150); g.quadraticCurveTo(0, 215, -120, 150); g.quadraticCurveTo(-150, 60, -112, -118); };
  a.both(apron, 'red', 3.5, { grad: nhLin(-110, 200, '#e0473a', '#b92a24') });
  a.both(g => g.rect(-112, -118, 224, 56), 'dark', 3); a.both(g => g.rect(-16, -118, 32, 56), 'yellow', 2.5); a.fill(g => g.rect(-16, -86, 32, 10), 'blue');
  a.line(g => { for (let i = 0; i < 5; i++) { const px = -70 + i * 35, py = 40 + (i % 2) * 30; g.moveTo(px + 10, py); g.arc(px, py, 10, 0, TAU); } }, 2, { col: '#f6c7a0' });
  const reach = o.reach ?? 0, hx = lerp(150, 285, reach), hy = lerp(110, 30, reach);
  a.both(nhCap(-128, -85, -60, 95, 46, 36), 'skin', 3.5, { grad: nhRad(-100, 0, 120, '#fff3ea', '#f3cfbb') });
  a.both(nhEll(-58, 100, 38, 32), 'skin', 3); a.line(g => { [-72, -58, -44].forEach(fx => { g.moveTo(fx, 88); g.lineTo(fx + 2, 112); }); }, 2.2);
  a.both(nhEll(-68, 70, 44, 16, .2), 'gold', 3, { stroke: 12 });
  a.both(nhCap(128, -85, hx, hy, 46, 36), 'skin', 3.5, { grad: nhRad(180, -20, 140, '#fff3ea', '#f3cfbb') });
  a.both(nhEll(hx + 8, hy + 6, 40, 33), 'skin', 3); a.both(nhEll(hx - 20, hy - 18, 44, 16, -.7), 'gold', 3, { stroke: 12 });
  a.fill(nhEll(0, -118, 118, 44), 'blue', { stroke: 26 }); a.line(nhEll(0, -118, 131, 57), 2.5); a.line(nhEll(0, -118, 105, 31), 2.5);
  a.raw('fill', g => { g.fillStyle = NH.white; for (let i = 0; i < 18; i++) { const q = PI * .05 + i / 17 * PI * .9; g.beginPath(); g.arc(Math.cos(q) * 118, -118 + Math.sin(q) * 44, 4.5, 0, TAU); g.fill(); } });
  a.tf(0, -250, 1.18, (o.nod ?? 0), () => {
    [-1, 1].forEach(sd => a.both(nhEll(sd * 146, 8, 28, 36), 'skin', 3));
    a.both(nhEll(0, 0, 152, 146), 'skin', 3.5, { grad: nhRad(-20, 20, 190, '#fff6ef', '#f7dccb') });
    a.fill(g => { g.arc(0, 0, 150, PI * 1.08, PI * 1.92); g.quadraticCurveTo(0, -30, -143, -45); }, 'scalp', { alpha: .85, grad: nhLin(-150, -40, '#8fa6d4', 'rgba(174,191,224,.2)') });
    [[0, -140, 34, 0], [-122, -86, 30, -.7], [122, -86, 30, .7]].forEach(([hx2, hy2, hs, hr]) => a.both(nhHeart(hx2, hy2, hs, hr), 'dark', 2));
    [-1, 1].forEach(sd => a.fill(nhEll(sd * 82, 52, 46, 36), 'pink', { grad: nhRad(sd * 82, 52, 48, 'rgba(240,120,130,.55)', 'rgba(240,120,130,0)') }));
    const bl = clamp(o.blink ?? 0, 0, 1);
    [-1, 1].forEach(sd => { a.line(g => { g.moveTo(sd * 30, -28); g.quadraticCurveTo(sd * 58, -44, sd * 88, -30); }, 2.2, { col: '#4d6b5e' });
      a.fill(g => { g.moveTo(sd * 28, 2); g.quadraticCurveTo(sd * 56, -16 * (1 - bl), sd * 86, 0); g.quadraticCurveTo(sd * 56, 10, sd * 28, 2); }, 'white');
      if (bl < .8) a.fill(nhEll(sd * 58, -1, 9, 9 * (1 - bl)), 'dark');
      a.line(g => { g.moveTo(sd * 28, 2); g.quadraticCurveTo(sd * 56, -16 * (1 - bl), sd * 86, 0); }, 3); });
    a.line(g => { g.moveTo(-6, 22); g.quadraticCurveTo(0, 44, 10, 38); }, 2.2);
    a.both(g => { g.moveTo(-16, 70); g.quadraticCurveTo(-8, 62, 0, 68); g.quadraticCurveTo(8, 62, 16, 70); g.quadraticCurveTo(0, 84, -16, 70); }, 'red', 1.8);
  });
}); }
// ── the carp, origin at the body centre, facing left (length ~520 at s = 1); t drives the tail; o.flex bends the body
function nhFish(a, x, y, s, r, t, o = {}) { a.tf(x, y, s, r, () => {
  const w = Math.sin(t * 5) * (o.wag ?? 1), f = o.flex ?? 0;
  const tail = (up) => g => { const sd = up ? -1 : 1; g.moveTo(215, sd * 4); g.bezierCurveTo(280, sd * 70 + w * 20, 360, sd * 150 + w * 40, 450 + w * 20, sd * 210 + w * 30);
    g.bezierCurveTo(400, sd * 120 + w * 30, 390, sd * 60 + w * 10, 420 + w * 10, sd * 20 + w * 15); g.quadraticCurveTo(320, sd * 10, 215, sd * 4); };
  [true, false].forEach(up => a.both(tail(up), 'orange', 3, { alpha: .9, grad: nhLin(-200, 200, '#f6b36c', '#e8733a') }));
  a.line(g => { for (let i = 0; i < 9; i++) { const sd = i < 5 ? -1 : 1, k = (i % 5) / 4; g.moveTo(240, sd * 6); g.quadraticCurveTo(330, sd * (40 + k * 60) + w * 20, 400 + w * 15, sd * (40 + k * 150) + w * 25); } }, 1.6);
  const body = g => { g.moveTo(-262, 12); g.bezierCurveTo(-240, -112, 60, -150 + f * 30, 172, -42); g.quadraticCurveTo(202, -12, 232, -6); g.lineTo(232, 20);
    g.quadraticCurveTo(192, 30, 162, 62); g.bezierCurveTo(62, 150 - f * 30, -222, 122, -262, 12); g.closePath(); };
  a.both(g => { g.moveTo(-40, -120); g.quadraticCurveTo(40, -210 + w * 10, 110, -110); }, 'orange', 3, { alpha: .9 });
  a.both(body, 'red', 3.5, { grad: nhLin(-140, 130, '#8f2a20', '#f3a15c') });
  a.raw('line', g => { g.save(); g.beginPath(); body(g); g.clip(); g.strokeStyle = 'rgba(40,20,15,.75)'; g.lineWidth = 2;
    for (let row = -5; row <= 5; row++) for (let c = 0; c < 12; c++) { const sx = -150 + c * 34 + (row % 2) * 17, sy = row * 24; g.beginPath(); g.arc(sx, sy, 20, -PI / 2.2, PI / 2.2); g.stroke(); }
    g.restore(); });
  a.both(g => { g.moveTo(-120, 60); g.quadraticCurveTo(-90, 150 + w * 10, -30, 110); g.quadraticCurveTo(-70, 90, -120, 60); }, 'orange', 2.5);
  a.both(nhEll(-192, -22, 30, 30), 'yellow', 3); a.line(g => { g.arc(-192, -22, 22, 0, TAU); g.moveTo(-178, -22); g.arc(-192, -22, 14, 0, TAU); }, 5);
  a.fill(nhEll(-192, -22, 7, 7), 'dark');
  a.line(g => { g.moveTo(-260, 14); g.quadraticCurveTo(-245, 26, -230, 18); g.moveTo(-248, 22); g.quadraticCurveTo(-285, 60 + w * 8, -300, 50); g.moveTo(-150, -70); g.quadraticCurveTo(-120, 0, -150, 70); }, 2.5);
}); }
// ── lotus flower (origin at the flower base), open 0..1
function nhLotus(a, x, y, s, t, open = 1, stem = 360) { a.tf(x, y, s, Math.sin(t * .9) * .03, () => {
  a.both(g => { g.moveTo(0, 0); g.quadraticCurveTo(-20, stem * .5, 10, stem); }, 'green', 3, { stroke: 12 });
  a.line(g => { for (let i = 1; i < 9; i++) { const yy = stem * i / 9, xx = -20 * Math.sin(i / 9 * PI) * .9; g.moveTo(xx - 8, yy); g.lineTo(xx - 14, yy - 4); g.moveTo(xx + 8, yy + 8); g.lineTo(xx + 14, yy + 4); } }, 2);
  const petals = [[-1.25, 1], [-.75, 1.05], [-.25, 1.1], [.25, 1.1], [.75, 1.05], [1.25, 1], [0, 1.15]];
  petals.forEach(([ang, L]) => a.tf(0, 0, 1, ang * (.35 + .65 * open), () => {
    const h = 190 * L; a.both(g => { g.moveTo(0, 0); g.bezierCurveTo(-72, -h * .3, -58, -h * .85, 0, -h); g.bezierCurveTo(58, -h * .85, 72, -h * .3, 0, 0); }, 'pink', 3, { grad: nhLin(-h, 0, '#e2566b', '#fdf2ef') });
    a.line(g => { g.moveTo(0, -12); g.lineTo(0, -h * .75); }, 1.4); }));
  a.both(nhEll(0, -34, 34, 22), 'yellow', 2.5);
}); }
// ── lotus leaf (a wide wavy disc seen at a slant) and pod
function nhLeaf(a, x, y, s, r, t) { a.tf(x, y, s, r + Math.sin(t * .7) * .02, () => {
  a.both(g => { for (let i = 0; i <= 40; i++) { const q = i / 40 * TAU, rr = 1 + .06 * Math.sin(q * 9); g.lineTo(Math.cos(q) * 230 * rr, Math.sin(q) * 120 * rr); } g.closePath(); }, 'leaf', 3.5, { grad: nhRad(-40, -20, 260, '#a6cf8e', '#3f7d4f') });
  a.line(g => { for (let i = 0; i < 16; i++) { const q = i / 16 * TAU; g.moveTo(0, 0); g.lineTo(Math.cos(q) * 220, Math.sin(q) * 112); } }, 1.8, { col: 'rgba(30,60,30,.8)' });
}); }
function nhPod(a, x, y, s, r, stem = 0) { a.tf(x, y, s, r, () => {
  if (stem) a.both(g => { g.moveTo(0, 60); g.quadraticCurveTo(30, stem * .5, 0, stem); }, 'green', 3, { stroke: 11 });
  a.both(g => { g.moveTo(-70, -40); g.lineTo(70, -40); g.quadraticCurveTo(60, 40, 0, 70); g.quadraticCurveTo(-60, 40, -70, -40); }, 'green', 3, { grad: nhLin(-40, 70, '#8fae5c', '#44703f') });
  a.both(nhEll(0, -40, 70, 22), 'yellow', 3); a.raw('line', g => { g.fillStyle = '#6b4f1c'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(-44 + (i % 5) * 22 + (i > 4 ? 11 : 0), -44 + (i > 4 ? 10 : 0), 6, 0, TAU); g.fill(); } });
}); }
// ── water band with drifting ripple lines
function nhWater(a, y0, y1, t) {
  a.fill(g => { g.moveTo(-100, y0); for (let x = -100; x <= W + 100; x += 40) g.lineTo(x, y0 + Math.sin(x * .006 + t * .6) * 18); g.lineTo(W + 100, y1); g.lineTo(-100, y1); g.closePath(); }, 'water', { alpha: .85, grad: nhLin(y0, y1, 'rgba(120,150,210,.75)', 'rgba(169,191,227,.2)') });
  a.line(g => { for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { const x = ((c * 210 + r * 97 + t * 40) % (W + 300)) - 150, y = y0 + 50 + r * 44; g.moveTo(x, y); g.quadraticCurveTo(x + 30, y - 10, x + 60, y); g.quadraticCurveTo(x + 90, y + 10, x + 120, y); } }, 2, { col: 'rgba(40,60,110,.7)' });
}
// title characters in brush-kai, pressed in one at a time: k(i) → 0..1
function nhTitle(g, chars, pos, size, k = () => 1) {
  g.save(); g.fillStyle = NH.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${size}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}serif`;
  g.strokeStyle = NH.ink; g.lineWidth = size * .045; g.lineJoin = 'round';
  [...chars].forEach((c, i) => { const e = clamp(k(i), 0, 1); if (e <= 0) return; g.globalAlpha = eio(e); g.save(); g.translate(pos[i][0], pos[i][1]); g.scale(1 + (1 - eio(e)) * .3, 1 + (1 - eio(e)) * .3); g.strokeText(c, 0, 0); g.fillText(c, 0, 0); g.restore(); });
  g.restore();
}
function nhSeal(g, x, y, s, ch, k = 1) { if (k <= 0) return; g.save(); g.globalAlpha = eio(clamp(k, 0, 1)); g.translate(x, y); g.scale(s * (1 + (1 - eio(clamp(k, 0, 1))) * .4), s * (1 + (1 - eio(clamp(k, 0, 1))) * .4));
  g.fillStyle = '#c0302a'; g.fillRect(-40, -40, 80, 80); g.fillStyle = NH.paper; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `58px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}serif`; g.fillText(ch, 0, 3); g.restore(); }
// cream paper with fibre and a faint printed double border
function nhPaper(g) { g.fillStyle = NH.paper; g.fillRect(-300, -300, W + 600, H + 600); const R = rng(5); g.strokeStyle = 'rgba(150,120,70,.07)'; g.lineWidth = 1.5;
  g.beginPath(); for (let i = 0; i < 500; i++) { const x = R() * W, y = R() * H, a2 = R() * PI; g.moveTo(x, y); g.lineTo(x + Math.cos(a2) * 30, y + Math.sin(a2) * 30); } g.stroke(); }
