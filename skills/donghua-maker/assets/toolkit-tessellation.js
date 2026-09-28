// ═══ TESSELLATION toolkit (镶嵌变形): a square lattice whose edges bend into interlocking creature tiles — the bend grows from 0
// (plain checkerboard) to full (fish), so squares turn into animals across the frame or over time. Translation symmetry: every
// horizontal edge and every vertical edge is its own shared curve, so neighbouring tiles always fit with no gaps even when the
// bend amount varies from place to place. Two tones, fine outline, a few inner marks (eye, gill, fin lines) once the shape is
// strong enough. Studied from the regular-division technique of mid-20th-century graphic art; tiles are generated, never copied.
// references/looks/tessellation.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .05, VIGN_TONE = ['30,20,10', 0, .1];
const TS = { paper: '#efe8d8', a: '#1f2a3a', b: '#e8dcc4', line: '#161616', accent: '#c8553d' };
// edge profiles (offset perpendicular to the edge, in cell units, s = 0..1 along it). H: horizontal edges, V: vertical edges.
const TS_H = s => .16 * Math.sin(TAU * s) + .1 * Math.sin(2 * TAU * s);
const TS_V = s => .3 * Math.sin(TAU * s);
// one tile path at lattice cell (i, j): amp(x, y) gives the bend at an edge midpoint (world px), shared by both neighbours
function tsTile(g, i, j, c, ox, oy, amp, n = 16) {
  const X = k => ox + k * c, Y = k => oy + k * c, aB = amp(X(i + .5), Y(j)), aT = amp(X(i + .5), Y(j + 1)), aL = amp(X(i), Y(j + .5)), aR = amp(X(i + 1), Y(j + .5));
  g.moveTo(X(i), Y(j));
  for (let k = 1; k <= n; k++) { const s = k / n; g.lineTo(X(i + s), Y(j) + aB * c * TS_H(s)); }
  for (let k = 1; k <= n; k++) { const s = k / n; g.lineTo(X(i + 1) + aR * c * TS_V(s), Y(j + s)); }
  for (let k = n - 1; k >= 0; k--) { const s = k / n; g.lineTo(X(i + s), Y(j + 1) + aT * c * TS_H(s)); }
  for (let k = n - 1; k >= 0; k--) { const s = k / n; g.lineTo(X(i) + aL * c * TS_V(s), Y(j + s)); }
  g.closePath();
}
// draw the whole field: cell c px, lattice origin (ox, oy) (animate it to make the shoal swim), amp(x, y) 0..1,
// o.cols = [colour of (i+j) even, odd], o.marks = draw eye/gill once amp > .55
function tsField(g, x0, y0, x1, y1, c, ox, oy, amp, o = {}) {
  const cols = o.cols ?? [TS.a, TS.b], i0 = Math.floor((x0 - ox) / c) - 1, i1 = Math.ceil((x1 - ox) / c) + 1, j0 = Math.floor((y0 - oy) / c) - 1, j1 = Math.ceil((y1 - oy) / c) + 1;
  g.save(); g.lineJoin = 'round';
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const par = ((i + j) % 2 + 2) % 2; g.beginPath(); tsTile(g, i, j, c, ox, oy, amp); g.fillStyle = cols[par]; g.fill();
    g.lineWidth = o.lw ?? 2.5; g.strokeStyle = TS.line; g.stroke();
    const cx = ox + (i + .5) * c, cy = oy + (j + .5) * c, k = amp(cx, cy);
    if (o.marks !== false && k > .55) { const e = clamp((k - .55) / .3, 0, 1), ink = par ? TS.a : TS.b, ex = cx - c * .16, ey = cy - c * .04; g.globalAlpha = e;
      g.fillStyle = ink; g.beginPath(); g.arc(ex, ey, c * .085, 0, TAU); g.fill(); g.fillStyle = cols[par]; g.beginPath(); g.arc(ex + c * .015, ey, c * .04, 0, TAU); g.fill();
      g.strokeStyle = ink; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.arc(cx - c * .1, cy + c * .02, c * .18, -1, 1);
      for (let f = 0; f < 4; f++) { const fx = cx + c * (.12 + f * .08); g.moveTo(fx, cy - c * .1); g.lineTo(fx + c * .05, cy); g.lineTo(fx, cy + c * .1); } g.stroke(); g.globalAlpha = 1; }
  }
  g.restore();
}
