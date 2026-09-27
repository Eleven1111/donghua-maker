// ═══ ELASTIC toolkit (弹性线条): thick, saturated hand-gesture lines on black that write themselves on and then wobble like
// springs; jelly blobs that bounce on the notes. The feel: playful, immediate, every stroke keeps a little life after it is drawn.
// Studied from published interactive-drawing sketches; gestures are generated, never copied. Pure functions of t.
// references/looks/elastic.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['0,0,0', 0, .15];
const EL = { ground: '#0b0b10', cols: ['#ff3d6e', '#ffb800', '#27d7ff', '#7cff5b', '#b45cff', '#ff7a1a', '#f4f1ea'] };
// damped spring response to a kick at τ = 0 (0 before the kick)
const elSpring = (tau, k = 4, w = 18) => tau < 0 ? 0 : Math.exp(-k * tau) * Math.sin(w * tau);
// resample a control polyline into n points with Catmull-Rom smoothing
function elPath(C, n) {
  const P = [], m = C.length - 1;
  for (let i = 0; i < n; i++) { const u = i / (n - 1) * m, k = Math.min(m - 1, Math.floor(u)), f = u - k;
    const p0 = C[Math.max(0, k - 1)], p1 = C[k], p2 = C[k + 1], p3 = C[Math.min(m, k + 2)];
    const cr = (a, b, c, d) => .5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    P.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]); }
  return P;
}
// a random looping gesture (like a quick doodle) inside a box
function elGesture(seed, box, n = 9) { const R = rng(seed); return Array.from({ length: n }, (_, i) => [box.x + box.w * (i / (n - 1) * .8 + .1 + (R() - .5) * .25), box.y + box.h * (.5 + (R() - .5) * .9)]); }
// the elastic stroke: points are laid over [o.t0, o.t0+o.dur]; each point rings when laid, and again on every kick (a travelling wave)
function elStroke(g, P, t, o = {}) {
  const n = P.length, t0 = o.t0 ?? 0, dur = o.dur ?? 1, amp = o.amp ?? 40, w = o.w ?? 26, kicks = o.kicks ?? [], hue = o.cols ?? [EL.cols[0], EL.cols[1]];
  const head = clamp((t - t0) / dur, 0, 1) * (n - 1); if (head < 1) return;
  const Q = [];
  for (let i = 0; i <= head; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const tl = t0 + i / (n - 1) * dur; let off = amp * elSpring(t - tl, 3.5, 16);
    kicks.forEach(tk => { off += amp * 1.4 * elSpring(t - tk - i * .004, 3, 14) * Math.sin(i * .22); });
    Q.push([P[i][0] - dy / L * off, P[i][1] + dx / L * off]); }
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 1; i < Q.length; i++) { const u = i / (n - 1), taper = Math.min(1, i / 6, (Q.length - i) / 4 + .35);
    g.strokeStyle = hue[Math.floor(u * hue.length * 3) % hue.length]; g.lineWidth = w * taper;
    g.beginPath(); g.moveTo(Q[i - 1][0], Q[i - 1][1]); g.lineTo(Q[i][0], Q[i][1]); g.stroke(); }
  g.restore();
}
// a jelly blob: radius rings on each kick with a few angular modes; squashes as it lands
function elBlob(g, x, y, r, t, kicks, col, seed = 1, o = {}) {
  const R = rng(seed), modes = [2, 3, 5].map(m => [m, R() * TAU, .5 + R() * .5]), N = 64; g.save(); g.fillStyle = col; g.beginPath();
  let bounce = 0; kicks.forEach(tk => { bounce += elSpring(t - tk, 3.2, 15); });
  for (let i = 0; i <= N; i++) { const a = i / N * TAU; let rr = r * (1 + .02 * Math.sin(a * 3 + t * 2));
    kicks.forEach(tk => modes.forEach(([m, ph, s]) => { rr += r * .22 * s * elSpring(t - tk, 3.2, 15 + m * 2) * Math.cos(m * a + ph); }));
    g.lineTo(x + Math.cos(a) * rr * (1 + bounce * .25), y + Math.sin(a) * rr * (1 - bounce * .25)); }
  g.fill();
  if (o.face) { g.fillStyle = EL.ground; const e = r * .12; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(x + s * r * .3, y - r * .1, e, e * (1.2 - Math.abs(bounce) * .6), 0, 0, TAU); g.fill(); }); }
  g.restore();
}
// dots that burst from a point on a kick and fall back to rest
function elBurst(g, x, y, t, tk, n, col, seed = 1) {
  const tau = t - tk; if (tau < 0 || tau > 1.2) return; const R = rng(seed); g.save(); g.fillStyle = col; g.globalAlpha = 1 - tau / 1.2;
  for (let i = 0; i < n; i++) { const a = R() * TAU, v = 240 + R() * 420, d = v * (1 - Math.exp(-4 * tau)) / 4 * 2.2; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d + 180 * tau * tau, 14 + R() * 18, 0, TAU); g.fill(); }
  g.restore();
}
