// ═══ ASCII toolkit (字符画): the whole picture is a grid of characters on black; brightness picks the glyph from a density
// ramp (" .:-=+*#%@"), colour is a single phosphor tint with the brightest cells glowing; scenes are brightness functions
// (a lit torus, a flyover terrain, a ringed planet) sampled per cell. Studied from terminal and demoscene text art; scenes are
// generated. Pure functions of t. references/looks/ascii.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['0,0,0', 0, .5];
const AS = { ground: '#050806', ramp: ' .\'`:-~=+*co#%&@', tint: [120, 255, 150] };
// render a brightness field: fn(u, v) → brightness 0..1 (u, v in −1..1, v down, aspect-corrected so circles stay round).
// cw × ch cell in px; o.tint rgb; o.glow = cells above this brightness also draw a soft halo; o.over(i, j) → char to force
function asRender(g, fn, cw = 16, ch = 28, o = {}) {
  const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch), R = AS.ramp, n = R.length - 1, tint = o.tint ?? AS.tint, lv = 6, bins = Array.from({ length: lv }, () => []);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const u = ((i + .5) * cw - W / 2) / (H / 2), v = ((j + .5) * ch - H / 2) / (H / 2), f = o.over && o.over(i, j, cols, rows);
    const b = f ? 1 : clamp(fn(u, v), 0, 1), c = f || R[Math.round(b * n)]; if (c === ' ') continue; bins[Math.min(lv - 1, Math.floor(b * lv))].push(i * cw + cw / 2, j * ch + ch * .78, c);
  }
  g.save(); g.textAlign = 'center'; g.font = `600 ${Math.round(ch * .82)}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}monospace`;
  bins.forEach((L, k) => { const a = .25 + .75 * (k + 1) / lv, m = k === lv - 1 ? 1.25 : 1; g.fillStyle = `rgba(${Math.min(255, tint[0] * m + (k === lv - 1 ? 60 : 0))},${Math.min(255, tint[1] * m)},${Math.min(255, tint[2] * m + (k === lv - 1 ? 60 : 0))},${a})`;
    if (k === lv - 1 && (o.glow ?? true)) { g.shadowColor = `rgb(${tint.join(',')})`; g.shadowBlur = 14; } else g.shadowBlur = 0;
    for (let q = 0; q < L.length; q += 3) g.fillText(L[q + 2], L[q], L[q + 1]); });
  g.restore();
}
// scenes (brightness functions). torus: ray-marched ring lit from the upper left, spinning (a, b)
function asTorus(a, b, R1 = .32, R2 = .72, zoom = 1) { const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), L = [-.5, -.6, -.6], Ln = Math.hypot(...L);
  const sdf = (x, y, z) => { const X = x * cb + z * sb, Z = -x * sb + z * cb, Y = y * ca - Z * sa, Z2 = y * sa + Z * ca; const q = Math.hypot(X, Z2) - R2; return Math.hypot(q, Y) - R1; };
  return (u, v) => { let t = 0; const ox = u / zoom, oy = v / zoom; for (let k = 0; k < 28; k++) { const d = sdf(ox * (3 + t) / 3, oy * (3 + t) / 3, -2 + t); if (d < .002) {
      const x = ox * (3 + t) / 3, y = oy * (3 + t) / 3, z = -2 + t, e = .003, nx = sdf(x + e, y, z) - d, ny = sdf(x, y + e, z) - d, nz = sdf(x, y, z + e) - d, nn = Math.hypot(nx, ny, nz) || 1;
      return .15 + .85 * Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / nn / Ln); } t += d; if (t > 4) break; } return 0; }; }
// flyover: five ridge layers from far (dim) to near (bright), each a scrolling skyline; ridge crests brightest; a round sun
function asTerrain(t, hy = -.05) { const ridge = (k, u) => { const z = 1 + k * .9, x = u * (1.5 + k * .4) + t * (.25 + k * .35) + k * 7.3;
    return hy + .12 * k - (.22 + .06 * k) * (Math.sin(x * 1.7) * .55 + Math.sin(x * 3.9 + 1.3) * .3 + Math.sin(x * 8.1) * .12 + .4) / z * 1.4; };
  return (u, v) => { for (let k = 4; k >= 0; k--) { const y = ridge(k, u); if (v > y) { const crest = v - y < .035 ? .35 : 0; return clamp(.14 + k * .15 + crest - (v - y) * .25 * (k === 4 ? 0 : 1), 0, 1); } }
    const d = Math.hypot(u - .55, v + .38); return d < .16 ? 1 : d < .2 ? .45 : clamp(.05 + (v - (-1)) * .06, 0, .18); }; }
// planet with a ring, lit from the left; ring tilt r
function asPlanet(rad = .5, spin = 0, tilt = .35) { return (u, v) => { const d = Math.hypot(u, v);
  const ringY = v - u * .18, rr = Math.hypot(u, ringY / tilt), inRing = rr > rad * 1.35 && rr < rad * 2.1 && !(d < rad && ringY < 0);
  if (d < rad) { const z = Math.sqrt(rad * rad - d * d), l = clamp((-u * .7 - v * .4 + z * .6) / rad, 0, 1), band = .12 * Math.sin((v / rad) * 9 + Math.sin(u * 3 + spin) * .8); return clamp(.15 + l * .8 + band, 0, 1); }
  if (inRing) return .35 + .35 * Math.sin(rr * 40) ** 2; const hsh = Math.sin(u * 127.1 + v * 311.7) * 43758.5453; return hsh - Math.floor(hsh) > .985 ? .6 : 0; }; }
