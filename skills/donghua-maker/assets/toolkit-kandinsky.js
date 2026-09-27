// ═══ KANDINSKY toolkit (康定斯基 · 构成): geometric "visual music" — haloed circles, sharp triangles, crossing lines, checkerboards,
// arcs and soft colour clouds on a pale ground; every element enters and pulses on the score.
// Construction studied from public-domain abstract compositions (Composition VIII); arrangements are our own. references/looks/kandinsky.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .2, VIGN_TONE = ['60,50,40', .04, .14];
const KD = { ground: '#efe9dc', ground2: '#e2dac8', black: '#161616', purple: '#5a3a8a', red: '#d8342a', yellow: '#f2c230', blue: '#2a5fb0', pink: '#e8a6b6', green: '#3f8a5a', sky: '#9ec3dc' };
// pale ground with soft colour clouds (the painting's atmosphere)
function kdGround(seed, clouds) { const c = backdrop(W + 256, H + 144, { grad: [[0, KD.ground], [1, KD.ground2]], mottle: .3, seed }), g = g2(c); g.translate(128, 72);
  clouds.forEach(([x, y, r, col, a]) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }); g.globalAlpha = 1; return c; }
// circle with core, rim and a soft halo; k = 0..1 grow-in, p = pulse
function kdCircle(g, x, y, r, core, rim, halo, k = 1, p = 0) { if (k <= 0) return; const rr = r * eio(k) * (1 + p * .08);
  if (halo) { const rg = g.createRadialGradient(x, y, rr * .9, x, y, rr * 1.7); rg.addColorStop(0, halo); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, rr * 1.7, 0, TAU); g.fill(); }
  g.fillStyle = rim; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); if (core) { g.fillStyle = core; g.beginPath(); g.arc(x + rr * .06, y - rr * .04, rr * .62, 0, TAU); g.fill(); } }
function kdTri(g, pts, col, k = 1, o = {}) { if (k <= 0) return; const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3, e = eio(k); g.save(); g.globalAlpha = o.a ?? .9; g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](cx + (p[0] - cx) * e, cy + (p[1] - cy) * e)); g.closePath(); g.fill(); if (o.line) { g.strokeStyle = KD.black; g.lineWidth = 3; g.stroke(); } g.restore(); }
// a line that slashes in from one end
function kdLine(g, x0, y0, x1, y1, w, k = 1, col = KD.black) { if (k <= 0) return; const e = eio(k); g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'butt'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, e), lerp(y0, y1, e)); g.stroke(); g.restore(); }
function kdChecker(g, x, y, cw, n, m, cols, rot = 0, k = 1) { if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); const shown = Math.floor(eio(k) * n * m); for (let i = 0; i < n * m && i < shown; i++) { const a = i % n, b = Math.floor(i / n); g.fillStyle = (a + b) % 2 ? cols[0] : cols[1 + (i % (cols.length - 1))]; g.fillRect(a * cw, b * cw, cw, cw); } g.strokeStyle = KD.black; g.lineWidth = 2; g.strokeRect(0, 0, n * cw, m * cw); g.restore(); }
function kdArc(g, x, y, r, a0, a1, w, k = 1, col = KD.black) { if (k <= 0) return; g.save(); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, a0, lerp(a0, a1, eio(k))); g.stroke(); g.restore(); }
// appear/pulse helpers from a cue time: grow over d seconds, then pulse on each later cue in `beats`
const kdK = (st, t, d = .35) => clamp((st - t) / d, 0, 1);
const kdPulse = (st, beats) => { let p = 0; for (const b of beats) { const dt = st - b; if (dt >= 0 && dt < .5) p = Math.max(p, 1 - dt / .5); } return p; };
