// ═══ PROCESS toolkit (规则粒子): simple elements (circles) follow simple behaviours (travel straight, reflect at the edge);
// whenever two overlap, a faint line joins their centres, and the lines accumulate into the picture. The drawing is the record
// of the rules, not a picture of the elements. Studied from published process-based generative works; systems are generated,
// never copied. Everything is a pure function of t (positions are analytic), so seeking is exact. references/looks/process.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .04, VIGN_TONE = ['0,0,0', 0, .1];
const PR = { paper: '#f1efe9', ground: '#0e0e10', ink: '22,22,24', light: '236,232,222', accent: '196,70,52' };
const prTri = v => { const m = ((v % 2) + 2) % 2; return m > 1 ? 2 - m : m; };
// n elements in a box; each has a start (0..1), heading, speed (box-fractions per second) and radius (px); born = appearance time
function prElements(n, seed, o = {}) {
  const R = rng(seed);
  return Array.from({ length: n }, (_, i) => ({ x: R(), y: R(), a: R() * TAU, s: (o.speed ?? .04) * (.5 + R()), r: (o.r ?? 90) * (.55 + R() * .9), born: o.born ? o.born(i) : -1e9 }));
}
function prPos(e, t, box) { return [box.x + box.w * prTri(e.x + Math.cos(e.a) * e.s * t), box.y + box.h * prTri(e.y + Math.sin(e.a) * e.s * t)]; }
// the accumulated record: for sample times from t0 to t, a line between every overlapping pair (alpha builds up where rules repeat)
function prTrace(g, E, t0, t, box, o = {}) {
  const dt = o.dt ?? 1 / 30, rgb = o.rgb ?? PR.ink, a = o.alpha ?? .05, n = E.length;
  g.save(); g.lineWidth = o.lw ?? 1.2; g.strokeStyle = `rgba(${rgb},${a})`;
  for (let tk = t0; tk <= t + 1e-6; tk += dt) {
    const P = E.map(e => tk >= e.born ? prPos(e, tk, box) : null);
    g.beginPath();
    for (let i = 0; i < n; i++) { const p = P[i]; if (!p) continue;
      for (let j = i + 1; j < n; j++) { const q = P[j]; if (!q) continue; const dx = p[0] - q[0], dy = p[1] - q[1], rr = E[i].r + E[j].r;
        if (dx * dx + dy * dy < rr * rr) { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } } }
    g.stroke();
  }
  g.restore();
}
// the elements themselves (thin outlines, a centre dot); overlapping pairs get their live joining line in the accent colour
function prElementsDraw(g, E, t, box, o = {}) {
  const rgb = o.rgb ?? PR.ink, P = E.map(e => t >= e.born ? prPos(e, t, box) : null);
  g.save(); g.lineWidth = o.lw ?? 2;
  E.forEach((e, i) => { const p = P[i]; if (!p) return; const k = clamp((t - e.born) / .25, 0, 1);
    g.strokeStyle = `rgba(${rgb},${(o.alpha ?? .55) * k})`; g.beginPath(); g.arc(p[0], p[1], e.r * eio(k), 0, TAU); g.stroke();
    g.fillStyle = `rgba(${rgb},${.9 * k})`; g.fillRect(p[0] - 3, p[1] - 3, 6, 6); });
  if (o.live !== false) { g.strokeStyle = `rgba(${o.liveRgb ?? PR.accent},.85)`; g.lineWidth = 3; g.beginPath();
    for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { const p = P[i], q = P[j]; if (!p || !q) continue;
      const rr = E[i].r + E[j].r; if ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 < rr * rr) { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } }
    g.stroke(); }
  g.restore();
}
// small caption in the gallery-label manner: rule text, monospace-ish, bottom-left
function prLabel(g, lines, x, y, rgb = PR.ink, a = 1) {
  g.save(); g.globalAlpha = a; g.fillStyle = `rgb(${rgb})`; g.font = `500 34px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}sans-serif`;
  lines.forEach((s, i) => g.fillText(s, x, y + i * 50)); g.restore();
}
