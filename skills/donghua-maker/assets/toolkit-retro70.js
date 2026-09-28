// ═══ RETRO70 toolkit (七十年代复古): warm earth palette (cream, mustard, orange, rust, brown), parallel stripe bands that flow
// around rounded corners, a sunset disc cut by horizontal slits, a slow sunburst in tone-on-tone yellow, chunky soft serif type
// stacked with offset stripe shadows, faded print: warm grain, soft vignette, a rounded TV-style frame. Motion is easy and
// groovy: stripes draw on, things bob and swing. Studied from 1970s graphic design (record sleeves, posters, TV idents);
// compositions generated. references/looks/retro70.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .09, VIGN_TONE = ['60,25,0', 0, .4];
const R7 = { cream: '#f3e3c3', mustard: '#e9a93a', orange: '#e0702c', rust: '#b3451f', brown: '#5e2c17', yellow: '#f6c85f', sky: '#f7d9a0', ink: '#3a1b0e' };
const R7_BANDS = [R7.brown, R7.rust, R7.orange, R7.mustard, R7.yellow];
// stripe band along a polyline P (world px): n bands of width w each, outermost first; k draws it on by length.
// Rounded corners: pass P already rounded (r7Round) — stroking with round joins keeps the stripes parallel.
function r7Stripes(g, P, k, o = {}) { const cols = o.cols ?? R7_BANDS, w = o.w ?? 46, n = cols.length, Q = r7Part(P, clamp(k, 0, 1)); if (Q.length < 2) return; g.save(); g.lineCap = o.cap ?? 'butt'; g.lineJoin = 'round';
  const line = () => { g.beginPath(); Q.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
  if (o.shadow !== false) { g.save(); g.translate(10, 12); line(); g.strokeStyle = 'rgba(60,20,0,.25)'; g.lineWidth = w * n; g.stroke(); g.restore(); }
  cols.forEach((c, i) => { line(); g.strokeStyle = c; g.lineWidth = w * (n - i); g.stroke(); }); g.restore(); }
// round a corner polyline with arcs of radius r (sampled), for stripe paths
function r7Round(C, r = 200, seg = 16) { const out = [C[0]]; for (let i = 1; i < C.length - 1; i++) { const a = C[i - 1], b = C[i], c = C[i + 1], l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]), rr = Math.min(r, l1 / 2, l2 / 2);
  const p = [b[0] + (a[0] - b[0]) / l1 * rr, b[1] + (a[1] - b[1]) / l1 * rr], q = [b[0] + (c[0] - b[0]) / l2 * rr, b[1] + (c[1] - b[1]) / l2 * rr];
  for (let s = 0; s <= seg; s++) { const u = s / seg, x = (1 - u) * (1 - u) * p[0] + 2 * (1 - u) * u * b[0] + u * u * q[0], y = (1 - u) * (1 - u) * p[1] + 2 * (1 - u) * u * b[1] + u * u * q[1]; out.push([x, y]); } } out.push(C[C.length - 1]);
  const D = [out[0]]; for (let i = 1; i < out.length; i++) { const a = D[D.length - 1], b = out[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 20)); for (let s = 1; s <= n; s++) D.push([lerp(a[0], b[0], s / n), lerp(a[1], b[1], s / n)]); } return D; }
function r7Part(P, k) { if (k >= 1) return P; if (k <= 0) return []; const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const s = L[L.length - 1] * k, out = [P[0]]; for (let i = 1; i < P.length; i++) { if (L[i] <= s) out.push(P[i]); else { const f = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); out.push([lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]); break; } } return out; }
// sunset disc: vertical gradient yellow→orange, cut by horizontal slits that thicken toward the bottom (slits are cut on an
// offscreen canvas so the background shows through them, not the empty canvas)
let R7_SUN = null;
function r7Sun(g, x, y, r, o = {}) { const S = Math.ceil(2 * r + 4); if (!R7_SUN || R7_SUN.width !== S) R7_SUN = mk(S, S); const q = R7_SUN.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, S, S);
  const c = S / 2, gr = q.createLinearGradient(0, c - r, 0, c + r); gr.addColorStop(0, R7.yellow); gr.addColorStop(.55, R7.orange); gr.addColorStop(1, R7.rust); q.fillStyle = gr; q.beginPath(); q.arc(c, c, r, 0, TAU); q.fill();
  q.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 7; i++) { const yy = c + r * (.12 + i * .13) + (o.drift ?? 0) % (r * .13), h = r * (.015 + i * .012); q.fillRect(0, yy, S, h); }
  g.drawImage(R7_SUN, x - c, y - c); }
// tone-on-tone sunburst (rays alternate two close colours), rotating slowly
function r7Burst(g, x, y, R, n, rot, c1 = R7.sky, c2 = R7.cream) { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = c1; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); g.fillStyle = c2;
  for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = a0 + TAU / n / 2; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a0, a1); g.closePath(); g.fill(); } g.restore(); }
// chunky soft serif with stacked stripe shadows (the 70s drop): layers offset down-right in each colour; k pops it in
function r7Title(g, str, x, y, size, k = 1, o = {}) { if (k <= 0) return; const fam = (window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''; const layers = o.layers ?? [R7.brown, R7.rust, R7.orange, R7.mustard];
  g.save(); g.translate(x, y); const s = .6 + .4 * eo(k) + Math.sin(clamp(k, 0, 1) * PI) * .08; g.scale(s, s); g.rotate(o.rot ?? -.04); g.globalAlpha = clamp(k * 2, 0, 1);
  g.font = `900 ${size}px ${fam}"Cooper Black", "Georgia", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; const st = size * .045;
  layers.forEach((c, i) => { const d = (layers.length - i) * st; g.fillStyle = c; g.fillText(str, d, d); g.lineWidth = size * .05; g.strokeStyle = c; g.strokeText(str, d, d); });
  g.fillStyle = o.fill ?? R7.cream; g.fillText(str, 0, 0); g.lineWidth = size * .03; g.strokeStyle = R7.ink; g.strokeText(str, 0, 0); g.restore(); }
// small caps line (letter-spaced), fades in
function r7Caps(g, str, x, y, size, k, col = R7.rust) { if (k <= 0) return; const fam = (window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''; g.save(); g.globalAlpha = clamp(k, 0, 1); g.fillStyle = col; g.font = `700 ${size}px ${fam}sans-serif`; g.textAlign = 'center';
  if ('letterSpacing' in g) g.letterSpacing = `${size * .3}px`; g.fillText(str, x, y); g.restore(); }
// rounded "TV" frame: cream border with rounded inner corners and a soft inner shadow
function r7Frame(g, m = 46, r = 90) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); const cw = g.canvas.width, ch = g.canvas.height, s = cw / W, M = m * s, Rr = r * s; g.fillStyle = R7.cream; g.beginPath(); g.rect(0, 0, cw, ch); g.roundRect(M, M, cw - 2 * M, ch - 2 * M, Rr); g.fill('evenodd');
  g.strokeStyle = 'rgba(60,20,0,.35)'; g.lineWidth = 6 * s; g.beginPath(); g.roundRect(M, M, cw - 2 * M, ch - 2 * M, Rr); g.stroke(); g.restore(); }
