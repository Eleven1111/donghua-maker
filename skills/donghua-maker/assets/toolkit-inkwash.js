// ═══ INKWASH toolkit (写意水墨): wet ink on xuan paper — graded translucent blobs with wet edges, a few sure lines, wide blank space,
// signature column + red seal. Construction studied from Qi Baishi's shrimp (public-domain reproductions); every drawing here is our own.
// references/looks/inkwash.md
const POST_GRAIN = .18, VIGN_TONE = ['60,50,30', .02, .08];
const IW = { paper: '#f5f0e4', paper2: '#ece4d2', ink: '20,18,16', seal: '#c23a2a' };
const iwFont = px => `${px}px ${(window.EMBED_FONTS || []).includes('LXGW WenKai') ? '"LXGW WenKai", ' : ''}"Kaiti SC", serif`;
function iwPaper(seed = 3) { const c = backdrop(W + 256, H + 144, { grad: [[0, IW.paper], [1, IW.paper2]], mottle: .25, seed }), g = g2(c), R = rng(seed); g.strokeStyle = 'rgba(120,100,70,.05)'; for (let i = 0; i < 700; i++) { const x = R() * c.width, y = R() * c.height; g.lineWidth = .8 + R(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 30, y + (R() - .5) * 30); g.stroke(); } return c; }
// wet ink blob: soft interior, darker pooled edge (the "water ring" of a loaded brush), tone 0..1
function iwBlob(g, x, y, rx, ry, rot, tone, seed) {
  g.save(); g.translate(x, y); g.rotate(rot); const a = tone;
  const rg = g.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry)); rg.addColorStop(0, `rgba(${IW.ink},${a * .55})`); rg.addColorStop(.78, `rgba(${IW.ink},${a * .7})`); rg.addColorStop(.95, `rgba(${IW.ink},${a})`); rg.addColorStop(1, `rgba(${IW.ink},0)`);
  g.fillStyle = rg; g.scale(1, ry / rx); blobPath(g, 0, 0, rx, rx, { amp: .06, seed }); g.fill(); g.restore();
}
// a single tapered brush line through points (whiskers, legs, stems)
function iwLine(g, pts, w, tone, o = {}) { const n = pts.length; if (n < 2) return; g.save(); g.lineCap = 'round'; g.strokeStyle = `rgba(${IW.ink},${tone})`;
  for (let i = 0; i < n - 1; i++) { const u = i / (n - 1); g.lineWidth = Math.max(.6, w * (o.taper === false ? 1 : (1 - u) ** .8)); g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]); g.stroke(); } g.restore(); }
// thick brush band along an arc (a body segment / a claw joint): wide wet stroke, darker edges
function iwBand(g, pts, w, tone) { g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = `rgba(${IW.ink},${tone * .75})`; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.stroke(); g.strokeStyle = `rgba(${IW.ink},${tone * .35})`; g.lineWidth = w * .45; g.stroke(); g.restore(); }
// shrimp (our own drawing of the genre): translucent segmented body in curved brush bands, a dark "brain" in the head, long waving
// whiskers, jointed claws in thick tapering strokes. Head at (x, y), facing angle ang; flick 0..1 curls the tail; t drives whiskers.
function iwShrimp(g, x, y, s, ang, t, id, flick = 0) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, Math.cos(ang) < 0 ? -s : s);   /* facing left: mirror so the belly stays down */
  // spine: arches down and back from the head; flick curls it tighter
  const segs = 6, body = []; let px = -50, py = 6, a = .1;
  for (let i = 0; i < segs; i++) { a += .2 + flick * .25; px -= Math.cos(a) * 30; py += Math.sin(a) * 30; body.push([px, py, a]); }
  // whiskers (behind): two long lines sweeping back over the body, one short pair forward
  for (const k of [-1, 1]) { const pts = []; for (let j = 0; j <= 16; j++) { const u = j / 16; pts.push([70 + u * 140 - u * u * 520, -10 * k - u * 60 * (k + 1.2) + Math.sin(t * 1.6 + u * 4 + k) * 30 * u]); } iwLine(g, pts, 2.6, .8); }
  for (const k of [-1, 1]) iwLine(g, [[90, -6 * k], [150, -20 * k + Math.sin(t * 2 + k) * 6], [190, -30 * k]], 2, .75);
  // claws: thin long arms, heavier joints, pincers of two dark strokes
  for (const k of [-1, 1]) { const sw = Math.sin(t * 1.2 + k) * .1, j1 = [60, 14 * k + 10], j2 = [150, 60 * k + 20 + sw * 50], j3 = [250, 40 * k + 30 + sw * 80], j4 = [320, 50 * k + 34 + sw * 90];
    iwLine(g, [j1, j2], 4, .8, { taper: false }); iwLine(g, [j2, j3], 3.4, .85, { taper: false }); iwBlob(g, j2[0], j2[1], 7, 7, 0, 1, id + 3); iwBlob(g, j3[0], j3[1], 8, 7, 0, 1, id + 4);
    iwBlob(g, (j3[0] + j4[0]) / 2, (j3[1] + j4[1]) / 2, 40, 13, Math.atan2(j4[1] - j3[1], j4[0] - j3[0]), 1, id + 5 + k);
    iwLine(g, [j4, [j4[0] + 40, j4[1] - 10 * k]], 8, 1); iwLine(g, [[j4[0] - 4, j4[1] + 8 * k], [j4[0] + 30, j4[1] + 14 * k]], 5, 1); }
  // swimming legs: a comb of short strokes under the belly
  body.slice(0, 5).forEach(([bx, by, ba], i) => iwLine(g, [[bx + 4, by + 34 - i * 3], [bx + 2 + Math.sin(t * 7 + i) * 8, by + 66 - i * 4]], 2.4, .65));
  // body segments: overlapping wet blocks laid across the spine (each overlaps the next), a darker stroke on each back edge
  body.slice().reverse().forEach(([bx, by, ba], ii) => { const i = segs - 1 - ii, r = 40 - i * 4;
    iwBlob(g, bx, by, 21, r, -ba, .42, id + 20 + i);
    const nx = -Math.sin(-ba), ny = Math.cos(-ba), ex = bx - Math.cos(-ba) * 15, ey = by - Math.sin(-ba) * 15;
    iwLine(g, [[ex - nx * r * .85, ey - ny * r * .85], [ex - Math.cos(-ba) * 6, ey - Math.sin(-ba) * 6], [ex + nx * r * .85, ey + ny * r * .85]], 4 - i * .3, .7, { taper: false }); });
  // tail fan
  const [tx, ty, ta] = body[segs - 1]; for (const k of [-1, 0, 1]) iwBlob(g, tx - Math.cos(ta + k * .45) * 36, ty + Math.sin(ta + k * .45) * 36, 28, 11, -ta - k * .45, .55, id + 40 + k);
  // head: a pale translucent carapace that narrows forward, a rostrum, a dark irregular "brain" stroke inside, eyes on stalks
  g.fillStyle = `rgba(${IW.ink},.3)`; g.beginPath(); g.moveTo(-50, -34); g.bezierCurveTo(10, -46, 70, -30, 110, -8); g.bezierCurveTo(70, 18, 10, 34, -50, 30); g.bezierCurveTo(-60, 10, -60, -14, -50, -34); g.fill();
  g.strokeStyle = `rgba(${IW.ink},.55)`; g.lineWidth = 2.5; g.stroke(); iwLine(g, [[100, -10], [170, -26]], 5, .85);
  g.fillStyle = `rgba(${IW.ink},.95)`; g.beginPath(); g.moveTo(-30, -24); g.bezierCurveTo(0, -36, 40, -26, 50, -8); g.bezierCurveTo(30, -2, 10, 4, -20, 2); g.bezierCurveTo(-34, -6, -38, -16, -30, -24); g.fill();
  for (const k of [-1, 1]) { iwLine(g, [[70, -4 * k], [96, -18 * k]], 3, .9); g.beginPath(); g.arc(100, -20 * k, 8, 0, TAU); g.fill(); }
  g.restore();
}
// signature column (vertical, kai) + square red seal
function iwSign(g, x, y, text, px, seal, a = 1) { g.save(); g.globalAlpha = a; g.fillStyle = `rgb(${IW.ink})`; g.font = iwFont(px); g.textAlign = 'center'; g.textBaseline = 'top'; [...text].forEach((c, i) => g.fillText(c, x, y + i * px * 1.08));
  const s = px * .9, sy = y + text.length * px * 1.08 + 18; g.fillStyle = IW.seal; g.globalAlpha = a * .88; g.fillRect(x - s / 2, sy, s, s); g.fillStyle = IW.paper; g.font = iwFont(Math.round(s * .62)); g.textBaseline = 'middle'; g.fillText(seal, x, sy + s / 2 + 2); g.restore(); }
