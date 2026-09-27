// ═══ GROWTH toolkit (差分生长): a closed line that keeps splitting its long edges; neighbours pull together, everything nearby
// pushes apart, so the loop buckles into coral / brain folds. Drawn as fine ink on paper, with older outlines kept as faint
// growth rings. Studied from published generative-ink works on differential growth; forms are simulated, never copied.
// The simulation runs once at load (deterministic, seeded) and stores snapshots; draw picks one by time. references/looks/growth.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .06, VIGN_TONE = ['40,30,20', 0, .05];
const GR = { paper: '#f0ebe0', ink: '28,26,24', red: '#c23b22', faint: '28,26,24' };
// grow(seed, {steps, every, maxN, rest, rad, bound, split}) → { snaps: [Float32Array xy…] }. Flat typed arrays + a linked-list
// cell grid keep it about O(n) per step (3–4k nodes × 600 steps ≈ 1–2 s at load).
function grGrow(seed, o = {}) {
  const R = rng(seed), rest = o.rest ?? 5, maxL = rest * 1.6, rad = o.rad ?? 10, bound = o.bound ?? 520, maxN = o.maxN ?? 3200, every = o.every ?? 4;
  const G = Math.ceil(bound * 2.4 / rad), off = bound * 1.2, head = new Int32Array(G * G);
  let n = o.n0 ?? 30, X = new Float64Array(maxN * 2), Y = new Float64Array(maxN * 2), next = new Int32Array(maxN * 2), FX = new Float64Array(maxN * 2), FY = new Float64Array(maxN * 2);
  for (let i = 0; i < n; i++) { const a = i / n * TAU, r = 30 * (1 + (R() - .5) * .2); X[i] = Math.cos(a) * r; Y[i] = Math.sin(a) * r; }
  const snaps = [];
  for (let s = 0; s < (o.steps ?? 600); s++) {
    head.fill(-1);
    for (let i = 0; i < n; i++) { const c = clamp(Math.floor((X[i] + off) / rad), 0, G - 1) * G + clamp(Math.floor((Y[i] + off) / rad), 0, G - 1); next[i] = head[c]; head[c] = i; }
    for (let i = 0; i < n; i++) { const a = (i - 1 + n) % n, b = (i + 1) % n, px = X[i], py = Y[i];
      let fx = ((X[a] + X[b]) / 2 - px) * (o.attr ?? .2), fy = ((Y[a] + Y[b]) / 2 - py) * (o.attr ?? .2);
      const cx = Math.floor((px + off) / rad), cy = Math.floor((py + off) / rad);
      for (let gx = Math.max(0, cx - 1); gx <= Math.min(G - 1, cx + 1); gx++) for (let gy = Math.max(0, cy - 1); gy <= Math.min(G - 1, cy + 1); gy++)
        for (let j = head[gx * G + gy]; j >= 0; j = next[j]) { if (j === i) continue; const dx = px - X[j], dy = py - Y[j], d2 = dx * dx + dy * dy;
          if (d2 < rad * rad && d2 > 1e-9) { const d = Math.sqrt(d2), f = (rad - d) / rad * (o.rep ?? 1); fx += dx / d * f; fy += dy / d * f; } }
      const r = Math.sqrt(px * px + py * py); if (r > bound) { fx -= px / r * (r - bound) * .2; fy -= py / r * (r - bound) * .2; }
      FX[i] = fx + (R() - .5) * .05; FY[i] = fy + (R() - .5) * .05; }
    for (let i = 0; i < n; i++) { X[i] += FX[i]; Y[i] += FY[i]; }
    if (n < maxN) { const NX = new Float64Array(maxN * 2), NY = new Float64Array(maxN * 2); let m = 0;
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; NX[m] = X[i]; NY[m++] = Y[i];
        if (m < maxN && ((X[j] - X[i]) ** 2 + (Y[j] - Y[i]) ** 2 > maxL * maxL || R() < (o.split ?? .012))) { NX[m] = (X[i] + X[j]) / 2 + (R() - .5) * .3; NY[m++] = (Y[i] + Y[j]) / 2 + (R() - .5) * .3; } }
      X = NX; Y = NY; n = m; }
    if (s % every === 0) { const A = new Float32Array(n * 2); for (let i = 0; i < n; i++) { A[i * 2] = X[i]; A[i * 2 + 1] = Y[i]; } snaps.push(A); }
  }
  return { snaps };
}
// closed smooth path through the nodes (quadratic curves via edge midpoints, so the coarse sim reads as a soft ink line)
function grPath(g, a, x, y, sc) { const n = a.length / 2, P = i => [x + a[(i % n) * 2] * sc, y + a[(i % n) * 2 + 1] * sc]; g.beginPath();
  let p = P(0), q = P(1); g.moveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  for (let i = 1; i <= n; i++) { p = P(i); q = P(i + 1); g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } g.closePath(); }
// draw at progress u (0..1): the current outline in ink, plus every `ring`-th earlier outline faintly (growth rings);
// marks = snapshot indices (e.g. note times) that flash red and fade over markFade snapshots
function grDraw(g, G, u, x, y, sc, o = {}) {
  const k = Math.round(clamp(u, 0, 1) * (G.snaps.length - 1)), ring = o.ring ?? 12;
  g.save(); g.lineJoin = 'round';
  if (ring > 0) { g.lineWidth = o.ringW ?? 1.2; g.strokeStyle = `rgba(${GR.faint},${o.ringA ?? .18})`; for (let i = k % ring; i < k; i += ring) { grPath(g, G.snaps[i], x, y, sc); g.stroke(); } }
  (o.marks || []).forEach(m => { const a = 1 - (k - m) / (o.markFade ?? 12); if (m <= k && a > 0) { g.lineWidth = 3; g.globalAlpha = a; g.strokeStyle = GR.red; grPath(g, G.snaps[m], x, y, sc); g.stroke(); g.globalAlpha = 1; } });
  grPath(g, G.snaps[k], x, y, sc); if (o.fill) { g.fillStyle = o.fill; g.fill(); } g.lineWidth = o.lw ?? 2.6; g.strokeStyle = `rgb(${GR.ink})`; g.stroke();
  g.restore();
}
