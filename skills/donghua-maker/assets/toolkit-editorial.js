// ═══ EDITORIAL toolkit (报刊数据图): newspaper-style data graphics — a warm white page, a small red kicker, a serif headline with
// one keyword in red, a grey deck line; hairline axes and gridlines; a line chart where one red series carries the story and the
// others stay grey; end-of-line value labels; a shaded gap with a big red annotation; horizontal bars with the highlighted bar in
// red; a source note. Things draw on in reading order and numbers count up. Fonts: "notoserif,notosans" → [0] serif, [1] sans.
// Pure functions of t. references/looks/editorial.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .015, VIGN_TONE = ['0,0,0', 0, .05];
const ED = { page: '#f6f4ef', ink: '#1d1d1f', grey: '#9a9a9a', light: '#d9d6cf', red: '#d7372b', redSoft: 'rgba(215,55,43,.12)' };
const edSerif = (size, w = 600) => `${w} ${size}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}serif`;
const edSans = (size, w = 400) => `${w} ${size}px ${(window.EMBED_FONTS || [])[1] ? `"${window.EMBED_FONTS[1]}", ` : ((window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : '')}sans-serif`;
function edPage(g) { g.fillStyle = ED.page; g.fillRect(-300, -300, W + 600, H + 600); }
// header: kicker (small red caps), headline parts [[text, isRed]], deck; k reveals in order
function edHead(g, x, y, kicker, parts, deck, k, o = {}) { if (k <= 0) return; const size = o.size ?? 84; g.save(); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.globalAlpha = clamp(k * 3, 0, 1); g.fillStyle = ED.red; g.font = edSans(size * .3, 700); if ('letterSpacing' in g) g.letterSpacing = `${size * .05}px`; g.fillText(kicker, x, y - size * 1.05); if ('letterSpacing' in g) g.letterSpacing = '0px';
  g.font = edSerif(size, 600); let cx = x; const shown = clamp((k - .15) / .55, 0, 1), total = parts.reduce((a, [s]) => a + [...s].length, 0); let used = 0;
  parts.forEach(([s, red]) => { const ch = [...s], n = clamp(Math.ceil(total * shown) - used, 0, ch.length); used += ch.length; const str = ch.slice(0, n).join(''); g.fillStyle = red ? ED.red : ED.ink; g.fillText(str, cx, y);
    if (red && n === ch.length) { const w = g.measureText(s).width; g.fillRect(cx, y + size * .14, w * clamp((k - .7) / .2, 0, 1), size * .05); } cx += g.measureText(str).width; });
  g.globalAlpha = clamp((k - .7) / .3, 0, 1); g.fillStyle = ED.grey; g.font = edSans(size * .34, 400); g.fillText(deck, x, y + size * .75); g.restore(); }
// chart frame: box [x, y, w, h], xr/yr = data ranges; returns a mapper
const edMap = (box, xr, yr) => (vx, vy) => [box[0] + (vx - xr[0]) / (xr[1] - xr[0]) * box[2], box[1] + box[3] - (vy - yr[0]) / (yr[1] - yr[0]) * box[3]];
// axes: y gridlines at yticks with labels, a baseline, x tick labels; k draws the lines left→right
function edAxes(g, box, xr, yr, xticks, yticks, k, o = {}) { if (k <= 0) return; const M = edMap(box, xr, yr), e = eio(clamp(k, 0, 1)); g.save(); g.lineWidth = 1.5; g.font = edSans(o.size ?? 30, 400); g.fillStyle = ED.grey;
  yticks.forEach(v => { const [, y] = M(xr[0], v); g.strokeStyle = v === yr[0] ? ED.ink : ED.light; g.lineWidth = v === yr[0] ? 2.5 : 1.5; g.beginPath(); g.moveTo(box[0], y); g.lineTo(box[0] + box[2] * e, y); g.stroke(); g.globalAlpha = e; g.textAlign = 'right'; g.fillText((o.yfmt ?? String)(v), box[0] - 18, y + 10); g.globalAlpha = 1; });
  xticks.forEach(v => { const [x] = M(v, yr[0]); if ((x - box[0]) / box[2] > e) return; g.textAlign = 'center'; g.fillText((o.xfmt ?? String)(v), x, box[1] + box[3] + 46); });
  if (o.ylab) { g.textAlign = 'left'; g.fillText(o.ylab, box[0], box[1] - 30); } g.restore(); }
// a series drawn on to fraction k of its x-extent; o.col, o.w, o.label (end label text), o.dot
function edLine(g, box, xr, yr, data, k, o = {}) { if (k <= 0) return null; const M = edMap(box, xr, yr), n = data.length, upto = clamp(k, 0, 1) * (n - 1), i0 = Math.floor(upto), f = upto - i0; g.save(); g.strokeStyle = o.col ?? ED.grey; g.lineWidth = o.w ?? 4; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
  let end = null; for (let i = 0; i <= Math.min(i0 + 1, n - 1); i++) { let [vx, vy] = data[i]; if (i === i0 + 1) { vx = lerp(data[i0][0], vx, f); vy = lerp(data[i0][1], vy, f); } const p = M(vx, vy); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); end = [p, vy]; } g.stroke();
  if (end && o.dot !== false) { g.fillStyle = o.col ?? ED.grey; g.beginPath(); g.arc(end[0][0], end[0][1], (o.w ?? 4) * 2.2, 0, TAU); g.fill(); }
  if (end && o.label) { g.font = edSans(o.labelSize ?? 34, 700); g.fillStyle = o.col ?? ED.grey; g.textAlign = 'left'; g.fillText(typeof o.label === 'function' ? o.label(end[1]) : o.label, end[0][0] + 26, end[0][1] + 12); } g.restore(); return end; }
// shaded gap between series a (top) and b (bottom) up to fraction k
function edGap(g, box, xr, yr, a, b, k, col = ED.redSoft) { if (k <= 0) return; const M = edMap(box, xr, yr), n = Math.max(2, Math.ceil(clamp(k, 0, 1) * (a.length - 1)) + 1); g.save(); g.fillStyle = col; g.beginPath();
  a.slice(0, n).forEach(([x, y], i) => { const p = M(x, y); i ? g.lineTo(...p) : g.moveTo(...p); }); b.slice(0, n).reverse().forEach(([x, y]) => g.lineTo(...M(x, y))); g.closePath(); g.fill(); g.restore(); }
// big annotation: value (red, bold) + small note under it, with a vertical bracket from y0 to y1 at x
function edNote(g, x, y0, y1, big, note, k, o = {}) { if (k <= 0) return; const e = eo(clamp(k, 0, 1)); g.save(); g.strokeStyle = ED.red; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 14, y0); g.lineTo(x, y0); g.lineTo(x, lerp(y0, y1, e)); if (e >= 1) g.lineTo(x - 14, y1); g.stroke();
  g.globalAlpha = clamp((k - .4) / .4, 0, 1); g.fillStyle = ED.red; g.font = edSans(o.size ?? 96, 800); g.textAlign = 'left'; g.fillText(big, x + 30, (y0 + y1) / 2 + (o.size ?? 96) * .3); g.font = edSans(30, 400); g.fillStyle = ED.grey; g.fillText(note, x + 34, (y0 + y1) / 2 + (o.size ?? 96) * .3 + 50); g.restore(); }
// horizontal bars: rows [[label, value, highlight]], max; k grows them (staggered); value labels count up
function edBars(g, box, rows, max, k, o = {}) { if (k <= 0) return; const [x, y, w, h] = box, rh = h / rows.length, bh = rh * .5; g.save();
  rows.forEach(([lab, v, hi], i) => { const kk = eio(clamp(k * (rows.length + 1) - i, 0, 1)), yy = y + i * rh; g.font = edSans(34, hi ? 700 : 400); g.fillStyle = ED.ink; g.textAlign = 'right'; g.fillText(lab, x - 26, yy + bh * .7);
    g.fillStyle = hi ? ED.red : (o.col ?? '#3d3d3f'); if (!hi && i === rows.length - 1) g.fillStyle = ED.grey; g.fillRect(x, yy, w * v / max * kk, bh);
    if (kk > 0) { g.font = edSans(34, 700); g.fillStyle = hi ? ED.red : ED.ink; g.textAlign = 'left'; g.fillText(`${Math.round(v * kk)}${o.unit ?? ''}`, x + w * v / max * kk + 18, yy + bh * .72); } }); g.restore(); }
function edSource(g, str, x, y, k) { if (k <= 0) return; g.save(); g.globalAlpha = clamp(k, 0, 1); g.fillStyle = ED.grey; g.font = edSans(26, 400); g.textAlign = 'left'; g.fillText(str, x, y); g.restore(); }
