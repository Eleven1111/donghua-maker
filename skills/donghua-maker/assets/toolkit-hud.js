// ═══ HUD toolkit (科幻界面): deep navy glass, hairline cyan instruments — corner brackets, concentric tick rings that rotate at
// different speeds, arc gauges with a readout, a radar sweep with blips, symmetric waveform bars, tiny letter-spaced labels and
// numbers that roll; one warm accent (amber) for alerts. Everything glows a little. Pure functions of t. references/looks/hud.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['0,5,20', 0, .55];
const HD = { bg0: '#0b1a2e', bg1: '#040a14', line: '#7fe3ff', dim: 'rgba(127,227,255,.35)', faint: 'rgba(127,227,255,.12)', amber: '#ffb347', white: '#e8fbff' };
const hdFam = () => ((window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : '') + 'sans-serif';
function hdBg(g) { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * .65); gr.addColorStop(0, HD.bg0); gr.addColorStop(1, HD.bg1); g.fillStyle = gr; g.fillRect(-300, -300, W + 600, H + 600);
  g.fillStyle = HD.faint; for (let x = 40; x < W; x += 80) for (let y = 40; y < H; y += 80) g.fillRect(x - 1, y - 1, 2, 2); }
const hdGlow = (g, b = 10, c = HD.line) => { g.shadowColor = c; g.shadowBlur = b; };
// corner brackets around a rect; k draws them out from the corners
function hdCorners(g, x, y, w, h, len = 60, k = 1, col = HD.line) { if (k <= 0) return; const l = len * clamp(k, 0, 1); g.save(); hdGlow(g, 8); g.strokeStyle = col; g.lineWidth = 3; g.beginPath();
  [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy]) => { g.moveTo(cx + sx * l, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + sy * l); }); g.stroke(); g.restore(); }
// a ring: {r, w, ticks (count), tickLen, a0, a1 (arc span), rot, dash, col, k (draw-on fraction of the span)}
function hdRing(g, x, y, o) { const k = clamp(o.k ?? 1, 0, 1); if (k <= 0) return; const a0 = (o.a0 ?? 0) + (o.rot ?? 0), a1 = a0 + ((o.a1 ?? TAU) - (o.a0 ?? 0)) * k; g.save(); hdGlow(g, 8); g.strokeStyle = o.col ?? HD.line; g.lineWidth = o.w ?? 2; g.setLineDash(o.dash ?? []);
  g.beginPath(); g.arc(x, y, o.r, a0, a1); g.stroke(); g.setLineDash([]);
  if (o.ticks) { const n = o.ticks, tl = o.tickLen ?? 12; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < n; i++) { const a = (o.a0 ?? 0) + (o.rot ?? 0) + i / n * ((o.a1 ?? TAU) - (o.a0 ?? 0)); if (a > a1 + 1e-6) break; const L = i % 5 === 0 ? tl * 1.8 : tl;
    g.moveTo(x + Math.cos(a) * o.r, y + Math.sin(a) * o.r); g.lineTo(x + Math.cos(a) * (o.r - L), y + Math.sin(a) * (o.r - L)); } g.stroke(); } g.restore(); }
// arc gauge: background track + filled arc to val (0..1) + big readout in the middle
function hdGauge(g, x, y, r, val, o = {}) { const a0 = o.a0 ?? PI * .75, span = o.span ?? PI * 1.5, col = val > (o.alert ?? 2) ? HD.amber : HD.line; g.save(); g.lineCap = 'butt';
  g.strokeStyle = HD.faint; g.lineWidth = o.w ?? 26; g.beginPath(); g.arc(x, y, r, a0, a0 + span); g.stroke(); hdGlow(g, 16, col); g.strokeStyle = col; g.beginPath(); g.arc(x, y, r, a0, a0 + span * clamp(val, 0, 1)); g.stroke();
  const e = a0 + span * clamp(val, 0, 1); g.fillStyle = HD.white; g.beginPath(); g.arc(x + Math.cos(e) * r, y + Math.sin(e) * r, 8, 0, TAU); g.fill();
  g.fillStyle = HD.white; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `300 ${o.size ?? r * .55}px ${hdFam()}`; g.fillText(o.text ?? `${Math.round(val * 100)}%`, x, y);
  if (o.label) hdLabel(g, o.label, x, y + r * .45, r * .1, HD.dim, 1, 'center'); g.restore(); }
// small letter-spaced label, typed on
function hdLabel(g, str, x, y, size, col = HD.dim, k = 1, align = 'left') { if (k <= 0) return; const s = [...str].slice(0, Math.ceil([...str].length * clamp(k, 0, 1))).join(''); g.save(); g.fillStyle = col; g.font = `500 ${size}px ${hdFam()}`; g.textAlign = align; g.textBaseline = 'alphabetic';
  if ('letterSpacing' in g) g.letterSpacing = `${size * .25}px`; hdGlow(g, 6, col); g.fillText(s, x, y); g.restore(); }
// rolling number from a to b over [t0, t0+d], formatted with fixed decimals
const hdNum = (t, a, b, t0, d, dec = 0) => (lerp(a, b, eo(clamp((t - t0) / d, 0, 1)))).toFixed(dec);
// symmetric waveform bars across w, heights fn(u) 0..1; o.hi highlights bars with u < hi (playhead)
function hdWave(g, x, y, w, h, n, fn, o = {}) { g.save(); hdGlow(g, 8); const bw = w / n; for (let i = 0; i < n; i++) { const u = i / (n - 1), a = clamp(fn(u), 0, 1) * h; g.fillStyle = o.hi !== undefined ? (u < o.hi ? HD.line : HD.dim) : HD.line; g.fillRect(x + i * bw + bw * .2, y - a / 2, bw * .6, Math.max(2, a)); } g.restore(); }
// radar: rings, crosshair, a sweeping wedge with fading trail at angle ang; blips [{x,y (relative −1..1), a0 (reveal angle)}]
function hdRadar(g, x, y, r, ang, blips = [], k = 1) { if (k <= 0) return; g.save(); [1, .66, .33].forEach(f => hdRing(g, x, y, { r: r * f, w: 1.5, col: f === 1 ? HD.line : HD.dim, k }));
  g.strokeStyle = HD.faint; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke();
  for (let i = 0; i < 24; i++) { const a = ang - i * .03; g.fillStyle = `rgba(127,227,255,${.22 * (1 - i / 24) * k})`; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, a - .03, a); g.closePath(); g.fill(); }
  hdGlow(g, 12); g.strokeStyle = HD.line; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); g.stroke();
  blips.forEach(b => { const ba = Math.atan2(b.y, b.x), since = ((ang - ba) % TAU + TAU) % TAU, seen = ang > b.a0; if (!seen) return; const fade = 1 - since / TAU * .7; g.fillStyle = b.col ?? HD.amber; hdGlow(g, 18, b.col ?? HD.amber); g.globalAlpha = fade; g.beginPath(); g.arc(x + b.x * r, y + b.y * r, 10, 0, TAU); g.fill(); g.globalAlpha = 1; });
  g.restore(); }
// crosshair reticle at (x, y), size s, rotation r
function hdReticle(g, x, y, s, r = 0, col = HD.line) { g.save(); g.translate(x, y); g.rotate(r); hdGlow(g, 10, col); g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath();
  for (let i = 0; i < 4; i++) { const a = i * PI / 2; g.moveTo(Math.cos(a) * s * .35, Math.sin(a) * s * .35); g.lineTo(Math.cos(a) * s * .75, Math.sin(a) * s * .75); } g.stroke(); g.beginPath(); g.arc(0, 0, s * .55, .2, PI / 2 - .2); g.stroke(); g.beginPath(); g.arc(0, 0, s * .55, PI + .2, PI * 1.5 - .2); g.stroke(); g.restore(); }
