// ═══ HARMONIC toolkit (谐波运动): points on rotating circles at integer frequency ratios, glowing trails, sound at the same ratios ═══
// Technique studied from early computer-animation "visual music" (harmonic dot patterns, Lissajous figures); our own implementation.
// Every curve is a pure function of time: trails are drawn by sampling p(t − k·dt) backwards, never stored. references/looks/harmonic.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .1, VIGN_TONE = ['0,0,8', .1, .45];
const HM = { bg: '#0a0e18', grid: 'rgba(160,190,255,.10)', axis: 'rgba(200,220,255,.35)', ink: '#f4efe4', dim: 'rgba(244,239,228,.5)', hues: ['#ffcf6b', '#ff8a5c', '#ff5c8a', '#b98cff', '#5cc8ff', '#6bffcf'] };
const hmFont = (px, w = 500) => `${w} ${px}px ${((window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : '')}"Helvetica Neue", sans-serif`;
function hmBg(g) { g.fillStyle = HM.bg; g.fillRect(-W, -H, W * 3, H * 3); }
function hmGrid(g, cx, cy, step, n) { g.save(); g.strokeStyle = HM.grid; g.lineWidth = 2; g.beginPath(); for (let i = -n; i <= n; i++) { g.moveTo(cx + i * step, cy - n * step); g.lineTo(cx + i * step, cy + n * step); g.moveTo(cx - n * step, cy + i * step); g.lineTo(cx + n * step, cy + i * step); } g.stroke(); g.restore(); }
// glowing dot (additive)
function hmDot(g, x, y, r, col, a = 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; const rg = g.createRadialGradient(x, y, 0, x, y, r * 4); rg.addColorStop(0, col); rg.addColorStop(.25, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r * 4, 0, TAU); g.fill(); g.globalAlpha = a; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * .55, 0, TAU); g.fill(); g.restore(); }
// trail of p(t) over the last `span` seconds, fading toward the tail; p(t) → [x, y]
function hmTrail(g, p, t, span, col, o = {}) {
  const n = o.n ?? 160, lw = o.lw ?? 6; g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = col;
  let prev = p(t);
  for (let k = 1; k <= n; k++) { const tt = t - span * k / n; if (tt < (o.t0 ?? -1e9)) break; const q = p(tt); g.globalAlpha = (1 - k / n) ** 1.4 * (o.a ?? 1); g.lineWidth = lw * (1 - k / n * .6); g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke(); prev = q; }
  g.restore();
}
// Lissajous point: x = sin(a·ωt + φ), y = sin(b·ωt)
const hmLiss = (cx, cy, R, a, b, w, ph = Math.PI / 2) => t => [cx + R * Math.sin(a * w * t + ph), cy - R * Math.sin(b * w * t)];
// harmonic dot field: dot i sits on radius r(i) at angle i·θ(t). Whenever θ = 2π/m the dots line up in m arms, so sweeping θ
// slowly through 2π/50 → 2π/3 passes through a sequence of figures. o.theta(t) → θ (default: i turns at ω)
function hmField(g, cx, cy, t, o = {}) {
  const n = o.n ?? 96, R = o.R ?? 560, r0 = o.r0 ?? 30, th = o.theta ?? (tt => (o.w ?? .25) * tt);
  for (let i = 1; i <= n; i++) {
    const r = r0 + (R - r0) * i / n, pos = tt => { const a = i * th(tt) + (o.ph ?? 0); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }, col = HM.hues[Math.floor(i / n * (HM.hues.length - .001))];
    if (o.trail) hmTrail(g, pos, t, o.trail, col, { n: 12, lw: 4, a: .5 });
    const [x, y] = pos(t); hmDot(g, x, y, o.dot ?? 7, col);
  }
}
function hmLabel(g, s, x, y, px = 56, o = {}) { g.save(); g.font = hmFont(px, o.w ?? 500); g.fillStyle = o.col ?? HM.ink; g.textAlign = o.align ?? 'left'; g.globalAlpha = o.a ?? 1; g.fillText(s, x, y); g.restore(); }
// score helper: a plucked tone for each whole turn of a circle turning at f turns/s (so you hear the ratio)
const hmTurns = (t0, t1, f, hz, o = {}) => { const ev = []; for (let k = 1; k / f + (o.at ?? 0) < t1 - t0; k++) ev.push({ t: +(t0 + (o.at ?? 0) + k / f).toFixed(4), k: 'pluck', f: hz, dur: o.dur ?? .9, v: o.v ?? .5, pan: o.pan ?? 0 }); return ev; };
