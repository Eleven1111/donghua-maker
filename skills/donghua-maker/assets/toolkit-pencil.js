// ═══ PENCIL toolkit (素描): off-white drawing paper with tooth; the drawing is built the way an artist works — faint straight
// construction lines and ellipses first (HB, light), then the contour (2B, darker, sometimes doubled where it was corrected),
// then hatched tone in directional strokes clipped to the form, then a smudged cast shadow; graphite is grey with a slight
// sheen, broken by the paper tooth. Pure functions of t (everything draws on by length / by stroke count). references/looks/pencil.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .05, VIGN_TONE = ['40,35,30', 0, .3];
const PC = { paper: '#efede7', lead: [58, 58, 62], light: 'rgba(58,58,62,.28)' };
let PC_PAPER = null, PC_TOOTH = null, PC_L = null;
function pcBake() { if (PC_PAPER) return; PC_PAPER = mk(W, H); PC_TOOTH = mk(W, H); PC_L = mk(W, H); const g = PC_PAPER.getContext('2d'), R = rng(61);
  const gr = g.createRadialGradient(W * .45, H * .4, 0, W / 2, H / 2, W * .7); gr.addColorStop(0, '#f6f5f1'); gr.addColorStop(1, '#e2dfd7'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90000; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '90,85,75'},${R() * .07})`; g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
  const q = PC_TOOTH.getContext('2d'); for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) { const v = fbm(x * .02, y * .02, 2) * .5 + hash(x, y) * .6; if (v > .55) { q.fillStyle = `rgba(0,0,0,${clamp((v - .55) * 1.6, 0, 1)})`; q.fillRect(x, y, 3, 3); } } }
function pcPaper(g) { pcBake(); g.fillStyle = '#e8e5de'; g.fillRect(-400, -400, W + 800, H + 800); g.drawImage(PC_PAPER, 0, 0); }
// graphite layer: begin → draw → end (paper tooth bites into it, then it's laid on with multiply)
function pcBegin() { pcBake(); const L = PC_L.getContext('2d'); L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.clearRect(0, 0, W, H); L.lineCap = 'round'; L.lineJoin = 'round'; return L; }
function pcEnd(g, bite = .45) { const L = PC_L.getContext('2d'); L.globalCompositeOperation = 'destination-out'; L.globalAlpha = bite; L.drawImage(PC_TOOTH, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over';
  g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(PC_L, 0, 0); g.restore(); }
const pcCol = a => `rgba(${PC.lead.join(',')},${a})`;
function pcPart(P, k) { if (k >= 1) return P; if (k <= 0) return []; const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const s = L[L.length - 1] * k, out = [P[0]]; for (let i = 1; i < P.length; i++) { if (L[i] <= s) out.push(P[i]); else { const f = (s - L[i - 1]) / (L[i] - L[i - 1] || 1); out.push([lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]); break; } } return out; }
// a pencil line: pressure tapers at both ends; `soft` = construction (light, thin); o.double = a second corrected pass slightly offset
function pcLine(L, P, k, o = {}) { const Q = pcPart(P, clamp(k, 0, 1)); if (Q.length < 2) return; const a = o.a ?? (o.soft ? .28 : .85), w = o.w ?? (o.soft ? 2 : 4.4), seed = o.seed ?? 1, n = P.length;
  const passes = o.double ? [[0, 1], [1, .55]] : [[0, 1]];
  passes.forEach(([off, pa]) => { for (let i = 1; i < Q.length; i++) { const u = i / n, taper = Math.min(1, u * 6, (1 - u) * 6 + .15); L.strokeStyle = pcCol(a * pa * (.5 + .5 * taper)); L.lineWidth = w * (.5 + .5 * taper);
    const j = off * w * 1.2; L.beginPath(); L.moveTo(Q[i - 1][0] + j * Math.sin(i * .07 + seed), Q[i - 1][1] + j * Math.cos(i * .05 + seed)); L.lineTo(Q[i][0] + j * Math.sin((i + 1) * .07 + seed), Q[i][1] + j * Math.cos((i + 1) * .05 + seed)); L.stroke(); } }); }
const pcLineP = (x0, y0, x1, y1, n = 30, over = .06) => { const dx = x1 - x0, dy = y1 - y0; return Array.from({ length: n + 1 }, (_, i) => { const u = -over + i / n * (1 + 2 * over); return [x0 + dx * u, y0 + dy * u]; }); };
const pcEllP = (x, y, rx, ry, rot = 0, n = 72, turns = 1.08, a0 = 0) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + i / n * TAU * turns, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; return [x + ex * Math.cos(rot) - ey * Math.sin(rot), y + ex * Math.sin(rot) + ey * Math.cos(rot)]; });
// hatching clipped to a path: parallel strokes at angle ang, spacing gap, darkness a; k = fraction of strokes laid (left→right).
// o.shade(x, y) → 0..1 multiplies each stroke's darkness (use it to model light: darker away from the light); o.cross adds a second layer;
// o.seg = break strokes into ~seg-px pieces, each shaded on its own (soft edges for background tone)
function pcHatch(L, clipFn, box, k, o = {}) { if (k <= 0) return; const [x0, y0, x1, y1] = box, ang = o.ang ?? -.9, gap = o.gap ?? 11, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 20;
  const lay = (an, g2, a) => { const n = Math.ceil(R * 2 / g2), m = Math.floor(n * clamp(k, 0, 1)), ux = Math.cos(an), uy = Math.sin(an);
    for (let i = 0; i < m; i++) { const d = -R + i * g2, px = cx - uy * d, py = cy + ux * d, len = R * (.8 + .2 * hash(i, 3)), ns = o.seg ? Math.ceil(len * 2 / o.seg) : 1;
      for (let q = 0; q < ns; q++) { const s0 = -len + q * len * 2 / ns, s1 = s0 + len * 2 / ns * (o.seg ? .9 + .3 * hash(i, q) : 1), mx = px + ux * (s0 + s1) / 2, my = py + uy * (s0 + s1) / 2, sh = o.shade ? o.shade(mx, my) : 1; if (sh <= .02) continue;
        const jx = (hash(i, q, 5) - .5) * 14; L.strokeStyle = pcCol(a * sh * (.7 + .3 * hash(i, 9))); L.lineWidth = 1.6 + hash(i, 2) * .8; L.beginPath(); L.moveTo(px + ux * s0 - uy * jx, py + uy * s0 + ux * jx); L.lineTo(px + ux * s1 - uy * jx * .3, py + uy * s1 + ux * jx * .3); L.stroke(); } } };
  L.save(); L.beginPath(); clipFn(L); L.clip(); lay(ang, gap, o.a ?? .5); if (o.cross) lay(ang + 1.2, gap * 1.3, (o.a ?? .5) * .7); L.restore(); }
// smudged tone (finger/stump): soft radial graphite, used for cast shadows and turning edges
function pcSmudge(L, x, y, rx, ry, a, rot = 0) { if (a <= 0) return; L.save(); L.translate(x, y); L.rotate(rot); L.scale(1, ry / rx); const g = L.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, pcCol(a)); g.addColorStop(.6, pcCol(a * .5)); g.addColorStop(1, pcCol(0)); L.fillStyle = g; L.beginPath(); L.arc(0, 0, rx, 0, TAU); L.fill(); L.restore(); }
// the pencil itself (hexagonal barrel, sharpened cone) at the drawing tip, angled like a hand holding it
function pcPencil(g, p, r = -.62) { if (!p) return; g.save(); g.translate(p[0], p[1]); g.rotate(r);   g.fillStyle = '#3a3a3e'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-6, 22); g.lineTo(6, 22); g.closePath(); g.fill(); g.fillStyle = '#e8c9a0'; g.beginPath(); g.moveTo(-6, 22); g.lineTo(-17, 70); g.lineTo(17, 70); g.lineTo(6, 22); g.closePath(); g.fill();
  g.fillStyle = '#2f5f45'; g.fillRect(-17, 70, 34, 460); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-6, 70, 8, 460); g.fillStyle = '#c8b27a'; g.fillRect(-17, 520, 34, 12); g.restore(); }
function pcTip(P, k) { const Q = pcPart(P, clamp(k, 0, 1)); return Q.length ? Q[Q.length - 1] : null; }
