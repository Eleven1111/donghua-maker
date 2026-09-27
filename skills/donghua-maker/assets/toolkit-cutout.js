// ═══ CUTOUT toolkit (剪纸拼贴 · 马蒂斯式): gouache-painted paper cut with scissors — clean organic edges, flat saturated colour with
// faint brush streaks, shapes pinned on coloured panels, a slight paper lift shadow. The opposite of torn-paper's ragged edges.
// Technique studied from late cut-out practice; every shape here is our own (no reproductions). references/looks/cutout.md
const POST_GRAIN = .15, VIGN_TONE = ['40,40,40', .02, .1];
const CU = { white: '#f5f1e6', cobalt: '#1f4fb5', ultra: '#243a8a', orange: '#f08a24', red: '#d8342a', yellow: '#f5c518', green: '#2f9a5a', pink: '#ec8fb0', black: '#1a1a1a', sea: '#6fc0d8' };
// gouache paper: flat colour + faint streaks in one direction (the brush that painted the sheet)
function cuPaperPattern(col, seed) { const c = mk(256, 256), g = g2(c), R = rng(seed); g.fillStyle = col; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${.012 + R() * .018})`; g.fillRect(0, R() * 256, 256, 4 + R() * 10); } return g2(mk(1, 1)).createPattern(c, 'repeat'); }
const _cuPat = {}; const cuPat = (col) => _cuPat[col] || (_cuPat[col] = cuPaperPattern(col, col.length * 7 + col.charCodeAt(1)));
// fill a closed path as cut paper: lift shadow, gouache pattern, faint scissor facets on the edge
function cuCut(g, path, col, o = {}) { g.save(); g.shadowColor = 'rgba(0,0,0,.22)'; g.shadowBlur = o.lift ?? 10; g.shadowOffsetX = 4; g.shadowOffsetY = 6; g.fillStyle = cuPat(col); g.beginPath(); path(g); g.fill(); g.restore(); }
// panels: the coloured backing sheets the shapes are pinned to
function cuPanels(g, panels) { panels.forEach(([x, y, w, h, col]) => cuCut(g, gg => gg.rect(x, y, w, h), col, { lift: 4 })); }
// algae: a branching cut silhouette — a stem that forks into arms, each arm ending in a rounded lobe (one continuous paper shape).
// Drawn as fat round strokes + lobes in one pass so the lift shadow falls under the whole shape. sway −1..1, grow 0..1
function cuAlgae(g, x, y, h, col, sway = 0, seed = 1, grow = 1) {
  const R = rng(seed), segs = []; const walk = (x0, y0, a, len, w, d) => { if (d > 3 || len < 30) { segs.push({ lobe: [x0, y0, w * 1.5] }); return; }
    const n = 4, pts = [[x0, y0]]; let cx = x0, cy = y0, ca = a; for (let i = 0; i < n; i++) { ca += (R() - .5) * .3 + sway * .06 * (d + 1); cx += Math.cos(ca) * len / n; cy += Math.sin(ca) * len / n; pts.push([cx, cy]); }
    segs.push({ pts, w }); const kids = d === 0 ? 3 : 2; for (let k = 0; k < kids; k++) { const f = .45 + k * .25, [bx, by] = pts[Math.min(n, Math.round(f * n))]; walk(bx, by, ca + (k % 2 ? .75 : -.75) * (1 + R() * .3), len * .62, w * .7, d + 1); } walk(cx, cy, ca, len * .55, w * .75, d + 1); };
  walk(x, y, -Math.PI / 2, h * .45 * grow, h * .07, 0);
  // many strokes: a per-stroke blurred shadow costs ~1 s a frame at 2560, so lay one hard offset shadow pass, then the paper
  const pass = (dx, dy, style) => { g.save(); g.translate(dx, dy); g.fillStyle = g.strokeStyle = style; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); segs.forEach(s => { if (s.lobe) { const [lx, ly, r] = s.lobe; g.moveTo(lx + r, ly); g.ellipse(lx, ly, r, r * 1.25, 0, 0, TAU); } }); g.fill();
    segs.forEach(s => { if (!s.pts) return; g.lineWidth = s.w * 2; g.beginPath(); s.pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.stroke(); }); g.restore(); };
  pass(5, 7, 'rgba(0,0,0,.16)'); pass(0, 0, cuPat(col));
}
// star with irregular rounded points (a scissor star, never a ruled one)
function cuStar(g, x, y, r, n, rot, col, seed) { const R = rng(seed); cuCut(g, gg => { for (let i = 0; i <= n * 2; i++) { const a = rot + i / (n * 2) * TAU, rr = i % 2 ? r * (.38 + R() * .1) : r * (.85 + R() * .25); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (!i) gg.moveTo(px, py); else { const pa = rot + (i - .5) / (n * 2) * TAU; gg.quadraticCurveTo(x + Math.cos(pa) * rr * 1.05, y + Math.sin(pa) * rr * 1.05, px, py); } } gg.closePath(); }, col); }
// leaf / feather: a lens with 3–4 bites cut out of each side
function cuLeaf(g, x, y, l, rot, col) { cuCut(g, gg => { gg.save(); gg.translate(x, y); gg.rotate(rot); gg.moveTo(0, 0); for (let i = 1; i <= 4; i++) { const u = i / 4; gg.quadraticCurveTo(l * (u - .12), -l * .32 * Math.sin(u * Math.PI) - 12, l * u, -l * .12 * Math.sin(u * Math.PI)); } for (let i = 3; i >= 0; i--) { const u = i / 4; gg.quadraticCurveTo(l * (u + .12), l * .32 * Math.sin((u + .25) * Math.PI) + 12, l * u, l * .1 * Math.sin(u * Math.PI)); } gg.restore(); }, col); }
// bird: a simple swallow-like cut silhouette; flap −1..1
function cuBird(g, x, y, s, flap, col) { cuCut(g, gg => { gg.save(); gg.translate(x, y); gg.scale(s, s); gg.moveTo(-60, 0); gg.quadraticCurveTo(-20, -10 - flap * 50, 10, -70 - flap * 40); gg.quadraticCurveTo(10, -20, 30, -6); gg.quadraticCurveTo(70, -10, 90, 4); gg.quadraticCurveTo(40, 10, 20, 12); gg.quadraticCurveTo(0, 40 + flap * 30, -30, 60 + flap * 40); gg.quadraticCurveTo(-20, 20, -60, 0); gg.restore(); }, col); }
