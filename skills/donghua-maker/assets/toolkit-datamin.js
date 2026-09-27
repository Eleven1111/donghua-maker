// ═══ DATA-MINIMAL toolkit (数据极简): black field, white only, numbers on a fixed grid, barcodes, scans, flicker locked to clicks ═══
// Technique studied from data-driven audiovisual installation art; everything here is our own. references/looks/datamin.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .07, VIGN_TONE = ['0,0,0', 0, .25];
const DM = { bg: '#000', fg: '#fff', mid: 'rgba(255,255,255,.55)', dim: 'rgba(255,255,255,.22)', hair: 2 };
const dmFont = (px, w = 500) => `${w} ${px}px ${((window.EMBED_FONTS || []).find(f => /Sans/.test(f)) ? '"Noto Sans SC", ' : '')}"Helvetica Neue", Arial, sans-serif`;
const dmFrame = st => Math.floor(st * 60);
// text on a fixed cell grid, so digits never jitter as they change (proportional fonts would); CJK takes a full-width cell
function dmText(g, s, x, y, px, o = {}) {
  const cw = px * (o.cell ?? .62), wide = c => c.charCodeAt(0) > 0x2E7F, ws = [...s].map(c => wide(c) ? px * 1.02 : cw), tw = ws.reduce((a, b) => a + b, 0);
  g.save(); g.font = dmFont(px, o.w ?? 500); g.fillStyle = o.col ?? DM.fg; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  let cx = o.align === 'right' ? x - tw : o.align === 'center' ? x - tw / 2 : x;
  [...s].forEach((c, i) => { g.fillText(c, cx + ws[i] / 2, y); cx += ws[i]; }); g.restore(); return tw;
}
// a number that resolves left to right: unresolved places spin through random digits every frame
function dmResolve(target, u, f, seed = 1) {
  const n = target.length, k = Math.floor(clamp(u, 0, 1) * (n + 1));
  return [...target].map((c, i) => (i < k || !/\d/.test(c)) ? c : String(Math.floor(hash(f, i, seed) * 10))).join('');
}
// full columns of scrolling digits (the "data rain"); rows scroll at column-specific speeds
function dmColumns(g, x0, y0, w, h, st, o = {}) {
  const px = o.px ?? 26, cw = px * .62 * (o.gapX ?? 1.6), rh = px * 1.25, cols = Math.floor(w / cw), rows = Math.ceil(h / rh) + 1;
  g.save(); g.font = dmFont(px); g.textAlign = 'center'; g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  for (let c = 0; c < cols; c++) {
    const sp = (40 + hash(c, 7, o.seed ?? 3) * 260) * (o.speed ?? 1), off = (st * sp) % rh, base = Math.floor(st * sp / rh);
    for (let r = -1; r < rows; r++) {
      const v = hash(c, r - base, o.seed ?? 3); if (v < (o.sparse ?? .15)) continue;
      g.fillStyle = v > .97 ? DM.fg : v > .8 ? DM.mid : DM.dim; g.fillText(String(Math.floor(v * 1e4) % 10), x0 + cw * (c + .5), y0 + r * rh + off);
    }
  }
  g.restore();
}
// barcode band: stripe widths from a seed, re-dealt every `hold` frames (a hard cut, never a fade)
function dmBarcode(g, x, y, w, h, f, o = {}) {
  const hold = o.hold ?? 6, seed = Math.floor(f / hold) + (o.seed ?? 0) * 997; let cx = x; g.fillStyle = o.col ?? DM.fg;
  for (let i = 0; cx < x + w; i++) { const bw = 2 + Math.floor(hash(i, seed, 5) ** 2 * (o.maxW ?? 28)), on = hash(i, seed, 9) < (o.fill ?? .45); if (on) g.fillRect(cx, y, Math.min(bw, x + w - cx), h); cx += bw; }
}
// hairline ruler with ticks and end labels
function dmRuler(g, x0, x1, y, o = {}) {
  g.save(); g.fillStyle = DM.mid; g.fillRect(x0, y, x1 - x0, DM.hair); const n = o.ticks ?? 40;
  for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), big = i % (o.major ?? 10) === 0; g.fillRect(x, y - (big ? 26 : 12), DM.hair, big ? 26 : 12); }
  if (o.l) dmText(g, o.l, x0, y + 70, 44, { col: DM.mid }); if (o.r) dmText(g, o.r, x1, y + 70, 44, { col: DM.mid, align: 'right' });
  g.restore();
}
const dmScan = (g, y, a = 1) => { g.save(); g.globalAlpha = a; g.fillStyle = DM.fg; g.fillRect(0, y, W, DM.hair); g.globalAlpha = a * .12; g.fillRect(0, y - 40, W, 80); g.restore(); };
// a hit: full-frame inversion for n frames starting at t (use sparingly: one per shot at most; photosensitivity)
function dmInvert(g, st, t, n = 3) { const f = dmFrame(st) - Math.round(t * 60); if (f < 0 || f >= n) return; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); }
// small caps-style caption: label (dim) over value (white)
function dmCaption(g, x, y, label, value, o = {}) { dmText(g, label, x, y, o.lpx ?? 40, { col: DM.mid, align: o.align }); if (value) dmText(g, value, x, y + (o.vpx ?? 60) * 1.4, o.vpx ?? 60, { align: o.align, w: 600 }); }
// clicks in the score that match the flicker: one tick per re-deal of a barcode, etc.
const dmClicks = (t0, t1, every, o = {}) => { const ev = []; for (let t = t0; t < t1 - 1e-6; t += every) ev.push({ t: +t.toFixed(4), k: 'tick', v: o.v ?? .35, pan: o.pan ?? 0 }); return ev; };
