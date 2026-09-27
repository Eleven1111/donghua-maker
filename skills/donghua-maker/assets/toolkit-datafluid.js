// ═══ DATAFLUID toolkit (粒子流体): tens of thousands of glowing particles on a dark ground, carried by a divergence-free swirl
// field so the mass moves like liquid; particles morph between forms (a data grid, a wave, a sphere) and are coloured by speed.
// Studied from published data-driven fluid installations; fields and forms are generated, never copied.
// Each particle's position is an analytic function of t (form blend + swirl displacement), so seeking is exact.
// references/looks/datafluid.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['0,0,0', 0, .35];
const DF = { ground: '#04050c', ramp: [[30, 70, 220], [30, 190, 255], [40, 230, 190], [130, 240, 110], [255, 220, 90], [255, 140, 60], [255, 70, 130], [190, 80, 255]] };
// particle set: per particle a seed triple (u, v, w in 0..1) used by every form
function dfParticles(n, seed) { const R = rng(seed), P = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) P[i] = R(); return { n, P }; }
// forms: map (u, v, w) → screen point. grid = a data table; wave = a flowing sheet; sphere = a ball seen slightly from above
const DF_FORMS = {
  grid: (u, v, w, t) => { const c = Math.floor(u * 160), r = Math.floor(v * 90); return [W * .1 + c / 160 * W * .8, H * .15 + r / 90 * H * .7]; },
  wave: (u, v, w, t) => { const x = W * (-.05 + u * 1.1), y = H * (.5 + (v - .5) * .35) + Math.sin(u * 7 + t * 1.3) * 160 + Math.sin(u * 3.1 - t * .8 + v * 2) * 90; return [x, y]; },
  sphere: (u, v, w, t) => { const th = u * TAU + t * .35, ph = Math.acos(2 * v - 1), r = 470 * (.96 + w * .04), x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
    const tilt = .35, yy = y * Math.cos(tilt) - z * Math.sin(tilt); return [W / 2 + x * r, H / 2 + yy * r]; }
};
// divergence-free swirl: displacement = curl of ψ = Σ a·sin(k·p + ω t + φ)
const DF_WAVES = [[.0021, .0013, .9, 0, 1], [-.0012, .0026, -.7, 1.7, .8], [.0034, -.0019, 1.3, 4.1, .5], [.0007, .0041, .5, 2.2, .6]];
function dfSwirl(x, y, t, amp) { let dx = 0, dy = 0;
  for (const [kx, ky, w, ph, a] of DF_WAVES) { const c = Math.cos(kx * x + ky * y + w * t + ph) * a; dx += ky * c; dy -= kx * c; }
  return [dx * amp / .003, dy * amp / .003]; }
// position of particle i at t: blend of two forms (k 0..1) plus swirl of strength amp
function dfPos(S, i, t, A, B, k, amp) { const u = S.P[i * 3], v = S.P[i * 3 + 1], w = S.P[i * 3 + 2], a = DF_FORMS[A](u, v, w, t), b = DF_FORMS[B](u, v, w, t);
  const e = eio(clamp(k * 1.3 - w * .3, 0, 1)), x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e, d = dfSwirl(x, y, t + w * .6, amp); return [x + d[0], y + d[1]]; }
// draw: each particle as a short streak from t−dt to t (at least a dot), coloured by a hue cycle over its layer v, position u and speed, drifting slowly with t (8-colour ramp, wraps), additive
function dfDraw(g, S, t, A, B, k, amp, o = {}) {
  const dt = o.dt ?? 1 / 20, bins = DF.ramp.map(() => []), vmax = o.vmax ?? 14, mix = o.mix ?? .55;
  for (let i = 0; i < S.n; i++) { const p = dfPos(S, i, t, A, B, k, amp), q = dfPos(S, i, t - dt, A, B, k, amp), sp = Math.hypot(p[0] - q[0], p[1] - q[1]);
    const c0 = S.P[i * 3 + 1] * mix + S.P[i * 3] * .35 + clamp(sp / vmax, 0, 1) * (1 - mix) + t * (o.drift ?? .04), c = c0 - Math.floor(c0); bins[Math.floor(c * bins.length)].push(q[0], q[1], p[0], p[1]); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  bins.forEach((L, b) => { const c = DF.ramp[b]; g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${o.alpha ?? .7})`; g.lineWidth = o.lw ?? 3; g.beginPath();
    for (let j = 0; j < L.length; j += 4) { g.moveTo(L[j], L[j + 1]); g.lineTo(L[j + 2] + 1.2, L[j + 3] + .4); } g.stroke(); });
  g.restore();
}
