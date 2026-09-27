// ═══ GOLD-SCROLL toolkit (金屏说史): gold-leaf screens, metallic gold serif, vermilion brush, night boards ═══
const SMOOTH_DEFAULT = true, POST_GRAIN = .16;
const SERIF = '"Noto Serif SC", "Songti SC", "STSong", serif';
const GS = { ink: '#0d1015', night: '#121822', char: '#17140f', red: '#d23a2a', redD: '#9d2419', cream: '#efe5cf', white: '#f7f1e3', goldL: '#fff2c2', gold: '#e9bf5c', goldD: '#9b6618', pine: '#2c5537', pineL: '#3f7449', river: '#1c3c5e' };
const _gtx = {};
// metallic gold text, baked once per (text, size): glow, extruded depth, banded gradient, top sheen, fine highlight edge
function goldText(txt, size, { weight = 900, glow = .75, depth = Math.round(size * .06), track = 0, flat = false } = {}) {
  const k = [txt, size, weight, glow, depth, track, flat].join('|'); if (_gtx[k]) return _gtx[k];
  const pad = Math.round(size * .6), m = mk(10, 10), mg = g2(m); mg.font = `${weight} ${size}px ${SERIF}`; mg.letterSpacing = track + 'px';
  const w = Math.ceil(mg.measureText(txt).width) + pad * 2, h = Math.round(size * 1.35) + pad * 2, c = mk(w, h), g = g2(c);
  g.font = mg.font; g.letterSpacing = mg.letterSpacing; g.textBaseline = 'middle'; g.textAlign = 'left';
  const x = pad, y = h / 2;
  if (glow > 0) { g.save(); g.shadowColor = `rgba(255,190,80,${glow})`; g.shadowBlur = size * .45; g.fillStyle = '#d59a33'; g.fillText(txt, x, y); g.restore(); }
  for (let d = depth; d >= 1; d--) { g.fillStyle = d > depth * .5 ? '#3b2306' : '#6e440f'; g.fillText(txt, x, y + d); }
  const gr = g.createLinearGradient(0, y - size * .55, 0, y + size * .55);
  if (flat) { gr.addColorStop(0, GS.goldL); gr.addColorStop(1, GS.gold); }
  else [[0, '#fff6d2'], [.28, '#f6d57e'], [.48, '#c68a2a'], [.56, '#f3d27c'], [.8, '#b9801f'], [1, '#7a4c0e']].forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillText(txt, x, y);
  g.save(); g.globalCompositeOperation = 'source-atop'; const sh = g.createLinearGradient(0, y - size * .55, 0, y); sh.addColorStop(0, 'rgba(255,255,240,.45)'); sh.addColorStop(1, 'rgba(255,255,240,0)'); g.fillStyle = sh; g.fillRect(0, 0, w, y); g.restore();
  g.lineWidth = Math.max(1, size * .012); g.strokeStyle = 'rgba(255,246,210,.55)'; g.strokeText(txt, x, y);
  return (_gtx[k] = c);
}
// place a baked sprite by its centre; s = scale, a = alpha, dy = rise
function put(g, spr, x, y, { s = 1, a = 1 } = {}) { if (a <= 0) return; g.save(); g.globalAlpha = clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.drawImage(spr, -spr.width / 2, -spr.height / 2); g.restore(); }
// vermilion dry-brush swipe, baked; draw revealed left→right by u
function brushBake(w, h, seed) {
  const c = mk(w + 40, h + 40), g = g2(c), R = rng(seed);
  for (let i = 0; i < 70; i++) {
    const yy = 20 + h * (.1 + .8 * R()), mid = Math.abs(yy - 20 - h / 2) / (h / 2), th = h * (.04 + .09 * R()), x0 = 20 + w * (.02 + .2 * mid * R()), x1 = 20 + w * (.98 - .25 * mid * R());   // outer bristles shorter: tapered ends
    g.fillStyle = `rgba(${205 + 25 * R() | 0},${45 + 20 * R() | 0},${28 + 10 * R() | 0},${.35 + .35 * R()})`;
    g.beginPath(); g.moveTo(x0, yy); for (let x = x0; x <= x1; x += 18) g.lineTo(x, yy - th / 2 + (R() - .5) * th * .5 - Math.sin((x - x0) / w * PI) * h * .12);
    for (let x = x1; x >= x0; x -= 18) g.lineTo(x, yy + th / 2 + (R() - .5) * th * .5 - Math.sin((x - x0) / w * PI) * h * .12); g.closePath(); g.fill();
  }
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(20 + w * R(), 20 + h * R(), 6 + 30 * R(), 1 + 2 * R()); }   // dry-brush gaps
  return c;
}
function brushDraw(g, spr, x, y, u) { if (u <= 0) return; const w = spr.width * clamp(u, 0, 1); g.drawImage(spr, 0, 0, w, spr.height, x - spr.width / 2, y - spr.height / 2, w, spr.height); }
// red seal with white vertical characters and a worn edge
function sealBake(txt, size) {
  const n = [...txt].length, w = size * 1.25, h = size * (n * 1.08 + .5), c = mk(w + 20, h + 20), g = g2(c), R = rng(77);
  g.translate(10, 10); g.fillStyle = GS.red; g.beginPath(); g.roundRect(0, 0, w, h, size * .16); g.fill();
  g.strokeStyle = GS.white; g.lineWidth = size * .06; g.beginPath(); g.roundRect(size * .1, size * .1, w - size * .2, h - size * .2, size * .1); g.stroke();
  g.fillStyle = GS.white; g.font = `900 ${size}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  [...txt].forEach((ch, i) => g.fillText(ch, w / 2, size * (.78 + i * 1.08)));
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(0,0,0,${.3 + .6 * R()})`; g.beginPath(); g.arc(w * R(), h * R(), 1 + 3 * R(), 0, 7); g.fill(); }
  return c;
}
// gold-leaf folding screen: leaf squares, panel folds, cloud bands (金碧障壁画 feel, drawn from scratch)
function goldScreen(w, h, seed) {
  const c = mk(w, h), g = g2(c), R = rng(seed), T = 132;
  g.fillStyle = '#c99a3f'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) {
    const v = R() * .8 + .2 * hash(x, y); g.fillStyle = `rgb(${176 + v * 58 | 0},${128 + v * 52 | 0},${48 + v * 34 | 0})`; g.fillRect(x + (y / T % 2) * T * .5, y, T, T);
    g.strokeStyle = 'rgba(120,80,20,.22)'; g.lineWidth = 2; g.strokeRect(x + (y / T % 2) * T * .5 + 1, y + 1, T - 2, T - 2);
  }
  const P = 6; for (let i = 0; i < P; i++) { const x0 = w / P * i, gr = g.createLinearGradient(x0, 0, x0 + w / P, 0), lit = i % 2 === 0;
    gr.addColorStop(0, `rgba(255,240,190,${lit ? .16 : 0})`); gr.addColorStop(1, `rgba(60,35,5,${lit ? .05 : .2})`); g.fillStyle = gr; g.fillRect(x0, 0, w / P, h);
    g.fillStyle = 'rgba(70,40,8,.45)'; g.fillRect(x0 - 2, 0, 3, h); }
  for (let i = 0; i < 5; i++) { const cy = h * (.06 + .12 * i) + R() * 40, cx = w * R(), cw = w * (.25 + .25 * R()); g.fillStyle = 'rgba(255,236,170,.18)';   // suyari cloud bands
    g.beginPath(); g.roundRect(cx - cw / 2, cy, cw, 70 + 40 * R(), 45); g.fill(); g.strokeStyle = 'rgba(150,100,30,.25)'; g.lineWidth = 3; g.stroke(); }
  const bl = g.createRadialGradient(w / 2, h * .42, 60, w / 2, h * .5, w * .62); bl.addColorStop(0, 'rgba(255,238,180,.35)'); bl.addColorStop(.55, 'rgba(255,220,140,0)'); bl.addColorStop(1, 'rgba(60,32,4,.55)'); g.fillStyle = bl; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,245,210' : '90,55,10'},${.05 + .08 * R()})`; g.fillRect(w * R(), h * R(), 2, 2); }
  return c;
}
// a stylised pine: curved dark trunk and flat layered needle clumps
function pineBake(s, seed, flip = false) {
  const c = mk(900 * s, 900 * s), g = g2(c), R = rng(seed); g.translate(flip ? c.width : 0, 0); g.scale(flip ? -s : s, s);
  g.strokeStyle = '#3a2615'; g.lineCap = 'round'; g.lineWidth = 46; g.beginPath(); g.moveTo(160, 900); g.bezierCurveTo(120, 700, 330, 560, 250, 380); g.stroke();
  g.lineWidth = 22; [[250, 430, 560, 330], [230, 520, 60, 420], [260, 600, 620, 560], [245, 380, 380, 190]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c2) / 2, b - 80, c2, d); g.stroke(); });
  [[560, 320, 190], [60, 410, 150], [620, 550, 170], [380, 180, 170], [250, 330, 140]].forEach(([x, y, r]) => {
    for (let k = 0; k < 3; k++) { g.fillStyle = k === 0 ? '#1f3d28' : k === 1 ? GS.pine : GS.pineL; g.beginPath(); g.ellipse(x, y - k * 10, r * (1 - k * .12), r * .38 * (1 - k * .15), 0, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(160,200,140,.35)'; g.lineWidth = 3; for (let q = 0; q < 12; q++) { const a = PI * (1 + q / 11); g.beginPath(); g.arc(x + Math.cos(a) * r * .6, y - 18 + Math.sin(a) * r * .12, r * .12, PI, 2 * PI); g.stroke(); }
  });
  return c;
}
// river band with gold wave lines
function riverBake(w, h) { const c = mk(w, h), g = g2(c); g.fillStyle = GS.river; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(240,215,150,.5)'; g.lineWidth = 3; for (let y = 16; y < h; y += 22) { g.beginPath(); for (let x = 0; x <= w; x += 20) g.lineTo(x, y + Math.sin(x / 90 + y) * 6); g.stroke(); } return c; }
// series header (top-left) and subtitle (bottom), drawn live so layout checks can see them
// header() reads SERIES and EP, which each episode declares: const SERIES = '金屏说史 · 中国史', EP = '第一回　赤壁之战';
function header(g, a = 1) { g.save(); g.globalAlpha = a; g.font = `700 34px ${SERIF}`; g.fillStyle = '#e8c878'; g.textBaseline = 'top'; g.fillText(SERIES, 64, 52); g.font = `500 28px ${SERIF}`; g.fillStyle = '#bda36a'; g.fillText(EP, 64, 96); g.restore(); }
let SUB_DARK = false;   // set true while a light (parchment) board is on screen
function subtitle(g, txt, a = 1) { if (a <= 0) return; g.save(); g.globalAlpha = clamp(a, 0, 1); g.font = `700 58px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.shadowColor = SUB_DARK ? 'rgba(255,245,220,.9)' : 'rgba(0,0,0,.85)'; g.shadowBlur = 14; g.shadowOffsetY = SUB_DARK ? 0 : 3; g.fillStyle = SUB_DARK ? '#2a1d10' : GS.white; g.fillText(txt, W / 2, H - 92); g.restore(); }
// gold dust drifting upward (pure function of time)
function dust(g, t, n = 60, seed = 5) { for (let i = 0; i < n; i++) { const h1 = hash(i, seed), h2 = hash(i, seed + 1), yy = (H * (1.1 - ((t * .03 * (0.5 + h2) + h1) % 1.2))), x = W * hash(i, seed + 2) + Math.sin(t * .7 + i) * 20;
  g.fillStyle = `rgba(255,226,150,${.25 + .5 * hash(i, seed + 3)})`; g.beginPath(); g.arc(x, yy, 1.5 + 2.5 * h2, 0, 7); g.fill(); } }
// odometer year: every digit column rolls continuously from `from` to `to`
function yearRoll(g, x, y, from, to, u, size) {
  const v = lerp(from, to, u), s = String(to), digits = s.length, dg = goldText('0', size), cw = (dg.width - size * 1.2) * 1.08, top = y - size * .72;
  const glyph = d => goldText(String(d), size, { glow: 0 });
  const hw = cw * digits / 2, gl = g.createRadialGradient(x, y, 10, x, y, hw * 1.3); gl.addColorStop(0, 'rgba(255,190,80,.28)'); gl.addColorStop(1, 'rgba(255,190,80,0)');
  g.fillStyle = gl; g.fillRect(x - hw * 1.4, y - size, hw * 2.8, size * 2);
  g.save(); g.beginPath(); g.rect(x - cw * digits / 2 - 20, top, cw * digits + 40, size * 1.44); g.clip();
  for (let i = 0; i < digits; i++) { const p = digits - 1 - i, val = (v / Math.pow(10, p)) % 10, d0 = Math.floor(val), fr = p === 0 ? val - d0 : Math.max(0, (val - d0 - .9) / .1);
    const cx = x - cw * digits / 2 + cw * (i + .5);
    put(g, glyph(d0 % 10), cx, y - fr * size * 1.3, {}); put(g, glyph((d0 + 1) % 10), cx, y + (1 - fr) * size * 1.3, {}); }
  g.restore();
  return x + cw * digits / 2;
}
// timeline: gold rule draws on, events pop at their time; hot events are vermilion with a ring
function timeline(g, x0, x1, y, evs, t, { y0 = 200, y1 = 208 } = {}) {
  const u = clamp(t / .6, 0, 1); g.strokeStyle = 'rgba(233,191,92,.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y); g.lineTo(lerp(x0, x1, eio(u)), y); g.stroke();
  for (const e of evs) { const k = clamp((t - e.t) / .3, 0, 1); if (k <= 0) continue; const x = lerp(x0, x1, (evs.indexOf(e) + .5) / evs.length);   // even spacing: story order, not a linear year scale
    g.fillStyle = e.hot ? GS.red : GS.gold; g.beginPath(); g.arc(x, y, 12 * B3e(k), 0, 7); g.fill();
    if (e.hot) { const r = 22 + 26 * ((t - e.t) % 1.2); g.strokeStyle = `rgba(210,58,42,${.9 * (1 - ((t - e.t) % 1.2) / 1.2)})`; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); }
    g.save(); g.globalAlpha = k; g.textAlign = 'center'; g.fillStyle = e.hot ? '#f0705f' : '#e9d3a0'; const up = e.up ? -1 : 1;
    g.font = `700 46px ${SERIF}`; g.textBaseline = e.up ? 'alphabetic' : 'top'; g.fillText(e.label, x, y + up * (e.up ? 74 : 40) + (1 - k) * 12 * up);
    g.font = `500 30px ${SERIF}`; g.fillStyle = e.hot ? '#f0705f' : '#b9a172'; g.fillText(e.sub, x, y + up * (e.up ? 30 : 90) + (1 - k) * 12 * up); g.restore(); }
}
const B3e = u => { const c = 1.6; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };   // pop with overshoot


// ── night board background (charcoal, lit centre, faint pine) — baked per shot
function nightBoard(seed = 9, { pine = true, tint = '#2a241b' } = {}) {
  const c = mk(W + 200, H + 120), g = g2(c), gr = g.createRadialGradient(W / 2, H * .4, 100, W / 2, H * .45, W * .8);
  gr.addColorStop(0, tint); gr.addColorStop(1, '#0d0b08'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  if (pine) { g.globalAlpha = .2; g.drawImage(pineBake(1.2, seed), -120, H - 1000); g.globalAlpha = 1; }
  const R = rng(seed); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,230,180,${.02 + .03 * R()})`; g.fillRect(c.width * R(), c.height * R(), 2, 2); }
  return c;
}
// top-right note that positions are schematic (maps)
function schematic(g, a = 1) { g.save(); g.globalAlpha = a; g.font = `500 28px ${SERIF}`; g.fillStyle = '#9d8a60'; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText('位置·路线为示意', W - 64, 58); g.restore(); }

// ═══ MAP: Natural Earth rivers/lakes (public domain), drawn live as vectors so lines stay crisp at any zoom ═══
// view = { lon, lat, z }: z 1 shows about 6° of longitude across the frame
const MAP_S = 441, MAP_COS = Math.cos(31.5 * PI / 180);
const proj = (lon, lat, v) => [W / 2 + (lon - v.lon) * MAP_COS * MAP_S * v.z, H / 2 - (lat - v.lat) * MAP_S * v.z];
function mapLerp(a, b, u) { u = eio(clamp(u, 0, 1)); return { lon: lerp(a.lon, b.lon, u), lat: lerp(a.lat, b.lat, u), z: lerp(a.z, b.z, u) }; }
function mapDraw(g, v, { a = 1 } = {}) {
  g.save(); g.globalAlpha = a; g.lineJoin = g.lineCap = 'round';
  const path = p => { g.beginPath(); for (let i = 0; i < p.length; i += 2) { const [x, y] = proj(p[i], p[i + 1], v); i ? g.lineTo(x, y) : g.moveTo(x, y); } };
  for (const l of MAPDATA.lakes) { path(l.p); g.closePath(); g.fillStyle = '#1d3d5f'; g.fill(); g.strokeStyle = 'rgba(233,191,92,.75)'; g.lineWidth = 2.5; g.stroke(); }
  for (const r of MAPDATA.rivers) { const main = r.n === 'Chang Jiang' || r.n === 'Yangtze'; path(r.p);
    const bw = (main ? 26 : 10) * Math.sqrt(v.z);   // water body with a gold bank line on each side
    g.strokeStyle = 'rgba(233,191,92,.7)'; g.lineWidth = bw + 5; g.stroke(); g.strokeStyle = '#1d3d5f'; g.lineWidth = bw; g.stroke();
    g.strokeStyle = 'rgba(140,180,220,.35)'; g.lineWidth = bw * .25; g.stroke(); }
  g.restore();
}
// a place: gold dot + name; hot = vermilion
function place(g, v, [lon, lat], name, { a = 1, hot = false, below = false, size = 34 } = {}) {
  if (a <= 0) return; const [x, y] = proj(lon, lat, v); g.save(); g.globalAlpha = clamp(a, 0, 1);
  g.fillStyle = hot ? GS.red : GS.gold; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,240,200,.6)'; g.lineWidth = 2; g.stroke();
  g.font = `600 ${size}px ${SERIF}`; g.fillStyle = hot ? '#f28a78' : '#d9c28a'; g.textAlign = 'center'; g.textBaseline = below ? 'top' : 'alphabetic'; g.fillText(name, x, below ? y + 18 : y - 20); g.restore();
}
// faction card with a round seal (one character), leader line to its place; side 'blue' (Cao) or 'red' (Sun-Liu)
function card(g, v, [lon, lat], name, sub, { a = 1, dx = 60, dy = -150, side = 'red', ch = '' } = {}) {
  if (a <= 0) return; const [px, py] = proj(lon, lat, v), x = px + dx, y = py + dy, col = side === 'blue' ? '#7fa3c9' : GS.red;
  g.save(); g.globalAlpha = clamp(a, 0, 1); g.font = `800 46px ${SERIF}`; const w = Math.max(g.measureText(name).width, (g.font = `500 30px ${SERIF}`, g.measureText(sub).width)) + 150, h = 118;
  g.strokeStyle = 'rgba(233,191,92,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(x + (dx < 0 ? w : 0), y + h / 2); g.stroke();
  g.fillStyle = 'rgba(12,10,8,.82)'; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(233,191,92,.85)'; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  g.fillStyle = col; g.beginPath(); g.arc(x + 62, y + h / 2, 38, 0, 7); g.fill(); g.strokeStyle = GS.white; g.lineWidth = 3; g.beginPath(); g.arc(x + 62, y + h / 2, 30, 0, 7); g.stroke();
  g.fillStyle = GS.white; g.font = `900 38px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch || name[0], x + 62, y + h / 2 + 2);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#f3e3b8'; g.font = `800 46px ${SERIF}`; g.fillText(name, x + 118, y + 54);
  g.fillStyle = '#c4ad7a'; g.font = `500 30px ${SERIF}`; g.fillText(sub, x + 118, y + 96); g.restore();
}
// route along lon/lat points, drawn to fraction u: dashed march line, or a glowing gold/red stroke with a bright head
function route(g, v, pts, u, { style = 'dash', col = GS.gold, w = 5, a = 1 } = {}) {
  if (u <= 0 || a <= 0) return; const P = pts.map(p => proj(p[0], p[1], v)); let L = 0; const seg = P.slice(1).map((p, i) => { const d = Math.hypot(p[0] - P[i][0], p[1] - P[i][1]); L += d; return d; });
  let left = L * clamp(u, 0, 1), head = P[0]; g.save(); g.globalAlpha = a; g.lineCap = g.lineJoin = 'round';
  const trace = () => { g.beginPath(); g.moveTo(...P[0]); let rem = left; for (let i = 0; i < seg.length && rem > 0; i++) { const k = Math.min(1, rem / seg[i]); head = [lerp(P[i][0], P[i + 1][0], k), lerp(P[i][1], P[i + 1][1], k)]; g.lineTo(...head); rem -= seg[i]; } };
  if (style === 'dash') { trace(); g.setLineDash([22, 16]); g.strokeStyle = col; g.lineWidth = w; g.stroke(); g.setLineDash([]); }
  else { g.globalCompositeOperation = 'lighter'; for (const [lw, al] of [[w * 7, .08], [w * 3.5, .18], [w * 1.6, .5], [w * .7, 1]]) { trace(); g.strokeStyle = col; g.globalAlpha = a * al; g.lineWidth = lw; g.stroke(); } g.globalAlpha = a; }
  if (u < 1) { const r = g.createRadialGradient(head[0], head[1], 0, head[0], head[1], 30); r.addColorStop(0, 'rgba(255,245,210,1)'); r.addColorStop(1, 'rgba(255,200,90,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = r; g.beginPath(); g.arc(head[0], head[1], 30, 0, 7); g.fill(); }
  g.restore(); return head;
}
// small burst (clash) at a place
function burst(g, x, y, k, col = '255,120,70') { if (k <= 0 || k >= 1) return; g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI, r0 = 20 + 60 * k, r1 = r0 + 70 * (1 - k); g.strokeStyle = `rgba(${col},${1 - k})`; g.lineWidth = 5; g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); g.stroke(); }
  g.restore(); }

// ═══ NIGHT RIVER DIORAMA: sky, far hills, river with reflections, war-junk silhouettes, lanterns ═══
function nightRiverBake(seed = 3) {
  const c = mk(W + 240, H + 120), g = g2(c), R = rng(seed), sky = g.createLinearGradient(0, 0, 0, H * .62);
  sky.addColorStop(0, '#070b14'); sky.addColorStop(1, '#1b2740'); g.fillStyle = sky; g.fillRect(0, 0, c.width, H * .62 + 60);
  const mg = g.createRadialGradient(W * .42, H * .5, 20, W * .42, H * .5, W * .55); mg.addColorStop(0, 'rgba(150,175,215,.55)'); mg.addColorStop(1, 'rgba(150,175,215,0)'); g.fillStyle = mg; g.fillRect(0, 0, c.width, H * .62 + 60);   // moonlit haze on the horizon, so silhouettes read
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(230,235,255,${.2 + .6 * R()})`; g.fillRect(c.width * R(), H * .5 * R(), 2, 2); }
  for (const [y0, col, amp] of [[H * .5, '#141d30', 90], [H * .56, '#0f1624', 60]]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= c.width; x += 40) g.lineTo(x, y0 - amp * (.5 + .5 * Math.sin(x / 260 + seed + y0) * Math.sin(x / 97 + y0))); g.lineTo(c.width, H); g.fill(); }
  const wg = g.createLinearGradient(0, H * .6, 0, H + 120); wg.addColorStop(0, '#0e1a2c'); wg.addColorStop(1, '#060a12'); g.fillStyle = wg; g.fillRect(0, H * .6, c.width, H);
  g.strokeStyle = 'rgba(160,190,230,.10)'; g.lineWidth = 2; for (let i = 0; i < 90; i++) { const y = H * .62 + (H * .4) * R(), x = c.width * R(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60 + 120 * R(), y); g.stroke(); }
  return c;
}
// one war junk (楼船) silhouette, bottom-centre origin; lit = lantern glow 0..1; banner character optional
function junk(g, x, y, s, { flip = false, lit = 1, ch = '', sail = 1, col = '#05070c' } = {}) {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.fillStyle = col;
  g.beginPath(); g.moveTo(-260, -40); g.quadraticCurveTo(-240, 20, -150, 30); g.lineTo(170, 30); g.quadraticCurveTo(250, 10, 280, -70); g.lineTo(200, -60); g.lineTo(-200, -60); g.closePath(); g.fill();
  g.fillRect(-190, -150, 170, 95); g.fillRect(-170, -205, 120, 60); g.fillRect(40, -130, 150, 75);   // castles
  g.fillRect(-2, -470, 10, 420); g.fillRect(-120, -380, 8, 330);
  if (sail > 0) { g.globalAlpha = sail; g.fillStyle = '#10151f'; g.fillRect(-100, -455, 190, 230 * sail + 20); g.fillRect(-190, -370, 140, 170 * sail + 10); g.globalAlpha = 1;
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-100, -440 + k * 40 * sail); g.lineTo(90, -440 + k * 40 * sail); g.stroke(); } }
  if (ch) { g.fillStyle = 'rgba(210,220,235,.85)'; g.fillRect(12, -470, 50, 90); g.fillStyle = '#10151f'; g.font = `900 40px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.save(); if (flip) g.scale(-1, 1); g.fillText(ch, flip ? -37 : 37, -425); g.restore(); }
  if (lit > 0) for (const [lx, ly] of [[-150, -120], [-90, -120], [90, -100], [140, -100], [-110, -178]]) { const r = g.createRadialGradient(lx, ly, 0, lx, ly, 40); r.addColorStop(0, `rgba(255,190,110,${.9 * lit})`); r.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = r; g.beginPath(); g.arc(lx, ly, 40, 0, 7); g.fill(); g.fillStyle = `rgba(255,220,160,${lit})`; g.fillRect(lx - 6, ly - 9, 12, 18); }
  g.restore();
}
// chain / rope between two hulls
function chain(g, x0, x1, y, t) { g.save(); g.strokeStyle = 'rgba(60,64,72,.95)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + 30 + 3 * Math.sin(t * 2), x1, y); g.stroke(); g.restore(); }
// reflection of warm lights on the water
function reflect(g, x, y, w, a, t) { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const yy = y + i * 18, ww = w * (1 - i / 9) * (.8 + .2 * Math.sin(t * 3 + i)); g.fillStyle = `rgba(255,170,80,${a * (1 - i / 7) * .35})`; g.fillRect(x - ww / 2, yy, ww, 4); } g.restore(); }
// fire: layered flame tongues + glow; pure function of t (flicker via hash), k = intensity 0..1
function fire(g, x, y, s, t, k, seed = 1) {
  if (k <= 0) return; g.save(); g.globalCompositeOperation = 'lighter';
  const gl = g.createRadialGradient(x, y - 120 * s, 0, x, y - 120 * s, 420 * s * k); gl.addColorStop(0, `rgba(255,140,50,${.55 * k})`); gl.addColorStop(1, 'rgba(255,80,20,0)'); g.fillStyle = gl; g.fillRect(x - 450 * s, y - 560 * s, 900 * s, 700 * s);
  const n = 9; for (let i = 0; i < n; i++) { const ph = hash(i, seed), fl = .75 + .35 * Math.sin(t * (9 + 5 * ph) + ph * 20) * Math.sin(t * 5.3 + i), hgt = s * k * (150 + 220 * hash(i, seed + 3)) * fl, wid = s * (38 + 40 * hash(i, seed + 5)), fx = x + (i - (n - 1) / 2) * s * 44 + Math.sin(t * 4 + i) * 8 * s;
    for (const [c1, sc] of [['255,90,20', 1], ['255,170,50', .7], ['255,240,190', .38]]) { g.fillStyle = `rgba(${c1},${.55 * k})`; g.beginPath(); g.moveTo(fx - wid * sc, y); g.quadraticCurveTo(fx - wid * sc * 1.1, y - hgt * sc * .5, fx + Math.sin(t * 6 + i) * 14 * s, y - hgt * sc); g.quadraticCurveTo(fx + wid * sc * 1.1, y - hgt * sc * .5, fx + wid * sc, y); g.fill(); } }
  g.restore();
}
function embers(g, t, k, x0, x1, yb, n = 90, seed = 7) { if (k <= 0) return; g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const h1 = hash(i, seed), sp = 120 + 260 * hash(i, seed + 1), life = ((t * (.35 + .4 * h1) + hash(i, seed + 2)) % 1), x = lerp(x0, x1, hash(i, seed + 3)) + Math.sin(t * 2 + i) * 40 - life * 160, y = yb - life * sp * 3;
    g.fillStyle = `rgba(255,${150 + 80 * h1 | 0},80,${k * (1 - life)})`; g.fillRect(x, y, 4, 4); } g.restore(); }
function smoke(g, t, k, x0, x1, yb, seed = 3) { if (k <= 0) return; g.save();
  for (let i = 0; i < 26; i++) { const life = ((t * .12 + hash(i, seed)) % 1), x = lerp(x0, x1, hash(i, seed + 1)) - life * 400, y = yb - life * 700, r = 80 + life * 260;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(20,16,14,${.45 * k * (1 - life)})`); gr.addColorStop(1, 'rgba(20,16,14,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.restore(); }
// wind streaks (東南風: from lower right toward upper left)
function wind(g, t, k, n = 26) { if (k <= 0) return; g.save(); g.strokeStyle = `rgba(220,230,255,${.25 * k})`; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const u = ((t * .8 + hash(i, 41)) % 1), x = W * (1.1 - u * 1.3) + hash(i, 42) * 400, y = H * (.2 + .5 * hash(i, 43)) + u * 60; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 90, y - 18, x - 200, y - 10); g.stroke(); } g.restore(); }

// vertical quote (right edge), with its source under it — historical wording shown as a quote, not narration
function vquote(g, txt, src, k, x = W - 150, y = 170, size = 76) { if (k <= 0) return; g.save(); g.globalAlpha = clamp(k, 0, 1);
  g.font = `900 ${size}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.shadowColor = 'rgba(255,200,120,.45)'; g.shadowBlur = 24; g.fillStyle = GS.white;
  [...txt].forEach((ch, i) => { if (ch === '，') { g.fillText('︐', x, y + i * size * 1.08); return; } g.fillText(ch, x, y + i * size * 1.08); });
  g.shadowBlur = 0; g.font = `500 30px ${SERIF}`; g.fillStyle = '#c8b27e'; g.fillText(src, x - 10, y + [...txt].length * size * 1.08 + 20); g.restore(); }

// ═══ PARCHMENT card (辨误): cream paper, brush headline, red strike, stamp ═══
function parchmentBake(seed = 21) { const c = mk(W + 200, H + 120), g = g2(c), R = rng(seed);
  const gr = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, W * .75); gr.addColorStop(0, '#f1e7cf'); gr.addColorStop(.7, '#dccaa3'); gr.addColorStop(1, '#a88f60'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 70; i++) { const x = c.width * R(), y = c.height * R(), r = 60 + 260 * R(), s = g.createRadialGradient(x, y, 0, x, y, r); s.addColorStop(0, `rgba(150,110,60,${.05 + .06 * R()})`); s.addColorStop(1, 'rgba(150,110,60,0)'); g.fillStyle = s; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  for (let i = 0; i < 14000; i++) { g.fillStyle = `rgba(90,60,30,${.03 + .05 * R()})`; g.fillRect(c.width * R(), c.height * R(), 2, 2); }
  return c; }
function inkText(txt, size, { col = '#1b1510', track = 30 } = {}) { const k = 'ink|' + txt + size + col; if (_gtx[k]) return _gtx[k];
  const pad = size * .4, m = g2(mk(4, 4)); m.font = `900 ${size}px ${SERIF}`; m.letterSpacing = track + 'px'; const w = m.measureText(txt).width + pad * 2, h = size * 1.4, c = mk(w, h), g = g2(c), R = rng(size);
  g.font = m.font; g.letterSpacing = m.letterSpacing; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(txt, pad, h / 2);
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${.2 + .6 * R()})`; g.fillRect(w * R(), h * R(), 2 + 10 * R(), 1 + 2 * R()); }   // dry-brush breaks
  return (_gtx[k] = c); }
// red brush strike through a word: drawn left→right by u
function strike(g, x0, x1, y, u, w = 26) { if (u <= 0) return; const x = lerp(x0, x1, eio(clamp(u, 0, 1))); g.save(); g.strokeStyle = GS.red; g.lineCap = 'round';
  for (let k = 0; k < 5; k++) { g.globalAlpha = .55; g.lineWidth = w * (1 - k * .15); g.beginPath(); g.moveTo(x0, y + (k - 2) * 5); g.quadraticCurveTo((x0 + x) / 2, y - 14 + (k - 2) * 4, x, y + 6 + (k - 2) * 5); g.stroke(); } g.restore(); }

// ═══ VERSUS split: two armoured silhouettes, cool left / warm right, a glowing jagged crack between ═══
function generalBake(side, seed) {   // front-facing armoured bust: tasselled helmet, neck guard, flared pauldrons, lamellar chest; lit from the outer side
  const c = mk(900, 1100), g = g2(c), rim = side === 'L' ? '120,165,220' : '240,120,75', o = side === 'L' ? -1 : 1;
  g.translate(450, 1100); g.fillStyle = '#08090c'; const P = new Path2D();
  P.moveTo(-440, 0); P.lineTo(-420, -300); P.quadraticCurveTo(-430, -430, -300, -470); P.lineTo(-150, -500); P.lineTo(-110, -560);   // left pauldron up to neck guard
  P.quadraticCurveTo(-170, -600, -165, -650); P.quadraticCurveTo(-150, -700, -120, -720);   // neck guard flare
  P.quadraticCurveTo(-150, -850, -60, -900); P.quadraticCurveTo(0, -915, 60, -900); P.quadraticCurveTo(150, -850, 120, -720);   // helmet bowl
  P.quadraticCurveTo(150, -700, 165, -650); P.quadraticCurveTo(170, -600, 110, -560); P.lineTo(150, -500); P.lineTo(300, -470); P.quadraticCurveTo(430, -430, 420, -300); P.lineTo(440, 0); P.closePath();
  g.fill(P); g.fillRect(-8, -990, 16, 95); g.beginPath(); g.ellipse(0, -1000, 26, 16, 0, 0, 7); g.fill();   // spike + knob
  g.beginPath(); g.moveTo(0, -985); g.quadraticCurveTo(o * 120, -1010, o * 150, -900); g.quadraticCurveTo(o * 90, -960, 0, -960); g.fill();   // tassel streaming outward
  g.save(); g.clip(P); g.globalCompositeOperation = 'source-atop';
  const L = g.createLinearGradient(o * 460, 0, o * 120, 0); L.addColorStop(0, `rgba(${rim},.75)`); L.addColorStop(1, `rgba(${rim},0)`); g.fillStyle = L; g.fillRect(-460, -1000, 920, 1000);
  g.strokeStyle = `rgba(${rim},.35)`; g.lineWidth = 3;
  for (let r = 0; r < 9; r++) { const y = -440 + r * 48; for (let x = -380; x < 380; x += 46) { g.beginPath(); g.arc(x + (r % 2) * 23, y, 22, 0, PI); g.stroke(); } }   // lamellar scales
  g.lineWidth = 5; g.strokeStyle = `rgba(${rim},.5)`; g.beginPath(); g.moveTo(-140, -690); g.quadraticCurveTo(0, -655, 140, -690); g.stroke();   // brim
  g.restore(); return c; }
function crack(g, t, k, seed = 5) { if (k <= 0) return; g.save(); g.globalCompositeOperation = 'lighter'; const pts = []; for (let i = 0; i <= 22; i++) pts.push([W / 2 + (hash(i, seed + Math.floor(t * 12)) - .5) * 70, H * i / 22]);
  for (const [lw, al] of [[36, .08], [16, .25], [6, .7], [2.5, 1]]) { g.strokeStyle = `rgba(255,${120 + 100 * (lw < 5)},70,${al * k})`; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); } g.restore(); }
