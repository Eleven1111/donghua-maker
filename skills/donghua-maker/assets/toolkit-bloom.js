// ═══ BLOOM toolkit (发光花): luminous flowers in a dark room — each one is born, opens, glows, then its petals scatter and
// fade, so the field is always changing; flowers overlap freely and light adds up. Studied from published immersive digital
// flower installations; flowers and fields are generated, never copied. Every flower is a pure function of its birth time.
// references/looks/bloom.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .025, VIGN_TONE = ['0,0,0', 0, .4];
const BL = { ground: '#050409', cols: [[255, 120, 170], [255, 235, 240], [255, 70, 90], [190, 120, 255], [255, 200, 90], [120, 220, 255]] };
// soft halo sprite per colour (the halos add up with 'lighter'; petals draw normally so a crowded field never burns to white), baked once (radial gradient; no shadowBlur in the per-frame path)
const BL_HALO = new Map();
function blHalo(c) { const k = c.join(','); if (BL_HALO.has(k)) return BL_HALO.get(k); const s = document.createElement('canvas'); s.width = s.height = 256; const g = s.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, `rgba(${k},.55)`); r.addColorStop(.35, `rgba(${k},.18)`); r.addColorStop(1, `rgba(${k},0)`); g.fillStyle = r; g.fillRect(0, 0, 256, 256); BL_HALO.set(k, s); return s; }
// one petal (pointed-round, like a camellia/cherry petal), base at origin, pointing up, length L, width w
function blPetal(g, L, w, notch) { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-w, -L * .25, -w * .9, -L * .9, notch ? -w * .18 : 0, -L); if (notch) g.lineTo(0, -L * .9), g.lineTo(w * .18, -L);
  g.bezierCurveTo(w * .9, -L * .9, w, -L * .25, 0, 0); g.closePath(); }
// flower f = {x, y, r, n, col, born, seed, notch}; life: open 0–1.2 s, hold, scatter from f.fall (default born+3), gone ~2 s later
function blFlower(g, f, t) {
  const a = t - f.born; if (a < 0) return; const fall = (f.fall ?? f.born + 3) - f.born, open = eio(clamp(a / 1.2, 0, 1)), R = rng(f.seed), c = f.col;
  const sc = (.4 + .6 * open) * f.r, spin = (f.seed % 2 ? 1 : -1) * (a * .08 + (1 - open) * .6), halo = blHalo(c), fade = clamp(1 - (a - fall - 1.4) / .8, 0, 1);
  g.save(); g.globalCompositeOperation = 'lighter';
  const hs = sc * 3 * (a < fall ? 1 : fade); if (hs > 1) { g.globalAlpha = .55; g.drawImage(halo, f.x - hs, f.y - hs, hs * 2, hs * 2); g.globalAlpha = 1; }
  g.globalCompositeOperation = 'source-over';   // petals stay distinct; only the halos add light
  for (let i = 0; i < f.n; i++) { const ang = spin + i / f.n * TAU + (R() - .5) * .15, dLen = .9 + R() * .2, fx = R(), fy = R();
    const d = a - fall - i * .06, fl = d > 0 ? d : 0;
    if (d > 0 && fade <= 0) continue;
    g.save(); g.translate(f.x + (fl * 120 * (fx - .3) + fl * fl * 40) , f.y + fl * fl * 90 + fl * 60 * (fy - .5)); g.rotate(ang + fl * (1.5 + fx * 2) * (fy > .5 ? 1 : -1));
    const L = sc * dLen * (d > 0 ? 1 : (.35 + .65 * open)), wv = sc * .42 * (.5 + .5 * open), al = (d > 0 ? fade * .8 : .9);
    const gr = g.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, `rgba(${c.join(',')},${al * .35})`); gr.addColorStop(.7, `rgba(${c.join(',')},${al * .8})`); gr.addColorStop(1, `rgba(255,255,255,${al * .9})`);
    g.fillStyle = gr; if (d > 0) g.translate(0, -L * .6); blPetal(g, L, wv, f.notch); g.fill(); g.restore(); }
  if (a < fall + .3) { g.fillStyle = `rgba(255,240,200,${.9 * open})`; for (let k = 0; k < 7; k++) { const q = k / 7 * TAU + spin * 2; g.beginPath(); g.arc(f.x + Math.cos(q) * sc * .13, f.y + Math.sin(q) * sc * .13, sc * .035, 0, TAU); g.fill(); } }
  g.restore();
}
// a field of flowers: births spread over [t0, t1], positions from seed; o.births = extra fixed birth times (e.g. melody notes)
function blField(seed, count, t0, t1, box, o = {}) { const R = rng(seed), F = [];
  for (let i = 0; i < count; i++) { const col = o.cols ? o.cols[i % o.cols.length] : BL.cols[Math.floor(R() * BL.cols.length)];
    F.push({ x: box.x + R() * box.w, y: box.y + R() * box.h, r: (o.r ?? 150) * (.6 + R() * .8), n: R() < .5 ? 5 : 6 + Math.floor(R() * 3), col, born: t0 + R() * (t1 - t0), seed: seed * 100 + i, notch: R() < .5, fall: undefined }); }
  F.forEach(f => { f.fall = f.born + (o.hold ?? 3) + R() * 1.5; }); return F.sort((a, b) => a.r - b.r); }
