// ═══ BAUHAUS toolkit (包豪斯构成): primary colours plus black on off-white; circle, square, triangle, half-disc and bars; a visible
// construction grid; strong diagonals; bold sans type set large, rotated to the diagonal, sometimes cut by shapes. Elements move
// like parts of a machine: they slide along axes, snap to the grid on the beat, rotate by quarter turns. Studied from public-domain
// Bauhaus-era posters and teaching exercises (the yellow-triangle / red-square / blue-circle exercise); compositions are generated.
// references/looks/bauhaus.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .07, VIGN_TONE = ['40,30,10', 0, .1];
const BH = { paper: '#efe9dc', black: '#161514', red: '#d8321f', yellow: '#f1bd1b', blue: '#1f4f9c', grey: '#b9b3a6' };
// snap-in: 0 before t0, overshoot then settle, 1 after
const bhSnap = (t, t0, d = .35) => { const k = clamp((t - t0) / d, 0, 1); return k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.cos(k * 7) * Math.exp(-5 * k) * (1 - k); };
function bhGrid(g, step = 160, a = .12) { g.save(); g.strokeStyle = `rgba(22,21,20,${a})`; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += step) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = 0; y <= H; y += step) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); g.restore(); }
// shapes: kind circle | square | triangle | half | bar; (x, y) centre, s size, r rotation, col
function bhShape(g, kind, x, y, s, r, col, o = {}) { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = col; g.beginPath();
  if (kind === 'circle') g.arc(0, 0, s / 2, 0, TAU);
  else if (kind === 'square') g.rect(-s / 2, -s / 2, s, s);
  else if (kind === 'triangle') { g.moveTo(0, -s * .58); g.lineTo(s * .5, s * .29); g.lineTo(-s * .5, s * .29); g.closePath(); }
  else if (kind === 'half') { g.arc(0, 0, s / 2, PI, TAU); g.closePath(); }
  else if (kind === 'bar') g.rect(-s / 2, -(o.h ?? s * .08) / 2, s, o.h ?? s * .08);
  g.fill(); if (o.stroke) { g.strokeStyle = BH.black; g.lineWidth = o.stroke; g.stroke(); } g.restore(); }
// bold type: text set large, rotated, reveal k slides it in along its own baseline from a mask
function bhType(g, text, x, y, size, r, col, k = 1, o = {}) { if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(r);
  g.font = `${o.weight ?? 900} ${size}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}sans-serif`; g.textBaseline = 'alphabetic'; g.textAlign = o.align ?? 'left';
  const w = g.measureText(text).width, x0 = o.align === 'center' ? -w / 2 : 0; g.beginPath(); g.rect(x0 - 10, -size, (w + 20) * clamp(k, 0, 1), size * 1.3); g.clip();
  g.fillStyle = col; g.fillText(text, 0, 0); g.restore(); }
// a quick "machine" path helper: slide along one axis then the other (L-shaped move), k 0..1
function bhSlide(ax, ay, bx, by, k) { const e = eio(clamp(k, 0, 1)); return e < .5 ? [lerp(ax, bx, e * 2), ay] : [bx, lerp(ay, by, (e - .5) * 2)]; }
