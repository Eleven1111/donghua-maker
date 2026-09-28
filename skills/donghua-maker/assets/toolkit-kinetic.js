// ═══ KINETIC toolkit (动态字体): type is the only actor — warm grey paper under a soft spotlight, black words that arrive on the
// beat with big contrasts of scale and weight (a small italic serif lead-in, then a huge heavy sans word slams in), walls of a
// repeated phrase scrolling in alternating rows, letters that fly apart, one red full stop as the only colour.
// Fonts: embed "notosans,notoserif" → EMBED_FONTS[0] heavy sans, [1] serif. Pure functions of t. references/looks/kinetic.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['40,35,30', 0, .35];
const KT = { paper: '#e9e5dd', ink: '#111111', grey: '#8c8780', light: '#c9c3b8', red: '#e0301e' };
const ktSans = (size, w = 900) => `${w} ${size}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}sans-serif`;
const ktSerif = (size, w = 400, it = true) => `${it ? 'italic ' : ''}${w} ${size}px ${(window.EMBED_FONTS || [])[1] ? `"${window.EMBED_FONTS[1]}", ` : ''}serif`;
function ktBg(g) { g.fillStyle = KT.paper; g.fillRect(-300, -300, W + 600, H + 600); const gr = g.createRadialGradient(W / 2, H * .42, 0, W / 2, H / 2, W * .62); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(120,110,95,.22)'); g.fillStyle = gr; g.fillRect(-300, -300, W + 600, H + 600); }
// a word: style 'sans' | 'serif'; motion 'slam' (from 2.4× scale, overshoot) | 'up' | 'down' | 'left' | 'right' (slide through a mask) | 'fade' | 'type';
// k 0..1 arrival, out 0..1 exit (same motion reversed); returns the word width
function ktWord(g, str, x, y, size, k, o = {}) { const out = clamp(o.out ?? 0, 0, 1); if (k <= 0 || out >= 1) return 0; g.save(); g.font = o.style === 'serif' ? ktSerif(size, o.weight ?? 400, o.italic ?? true) : ktSans(size, o.weight ?? 900);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left'; if ('letterSpacing' in g) g.letterSpacing = `${o.track ?? (o.style === 'serif' ? 0 : -size * .03)}px`; const w = g.measureText(str).width, x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
  const m = o.motion ?? 'up', e = eo(clamp(k, 0, 1)), q = eio(out); g.fillStyle = o.col ?? KT.ink;
  if (m === 'slam') { const c = 2.6, u = clamp(k, 0, 1) - 1, s = lerp(2.4, 1, 1 + (c + 1) * u * u * u + c * u * u) * (1 - q * .3); g.globalAlpha = clamp(k * 3, 0, 1) * (1 - q); g.translate(x0 + w / 2, y - size * .35); g.scale(s, s); g.fillText(str, -w / 2, size * .35); }
  else if (m === 'fade') { g.globalAlpha = e * (1 - q); g.fillText(str, x0, y); }
  else if (m === 'type') { const n = Math.ceil([...str].length * clamp(k, 0, 1)); g.globalAlpha = 1 - q; g.fillText([...str].slice(0, n).join(''), x0, y); }
  else { g.beginPath(); g.rect(x0 - size, y - size * 1.05, w + size * 2, size * 1.35); g.clip(); const d = size * 1.2, dir = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[m]; g.translate(dir[0] * d * (1 - e - q), dir[1] * d * (1 - e - q)); g.fillText(str, x0, y); }
  g.restore(); return w; }
// the red full stop after a word ending at x
function ktDot(g, x, y, size, k) { if (k <= 0) return; const s = 1 + (1 - eo(clamp(k, 0, 1))) * 1.5; g.save(); g.fillStyle = KT.red; g.beginPath(); g.arc(x + size * .16, y - size * .09, size * .09 * s, 0, TAU); g.fill(); g.restore(); }
// a wall of a repeated phrase: rows scroll in alternating directions; words in `hot` drawn darker/bolder; k fades the wall in
function ktWall(g, words, y0, rows, size, t, k = 1, o = {}) { if (k <= 0) return; g.save(); g.textBaseline = 'alphabetic'; const gap = size * .45, lh = size * (o.lh ?? 1.25);
  for (let r = 0; r < rows; r++) { const y = y0 + r * lh, dir = r % 2 ? 1 : -1, sp = (o.speed ?? 90) * (1 + (r % 3) * .2); g.globalAlpha = clamp(k * rows - Math.abs(r - (rows - 1) / 2) * 1.2, 0, 1) * (o.a ?? .9);
    let x = -((t * sp * dir) % 2400) - 2400; while (x < W + 2400) { words.forEach((wd, i) => { const hot = (o.hot ?? []).includes(i); g.font = hot ? ktSans(size, 800) : ktSans(size, 400); g.fillStyle = hot ? KT.grey : KT.light; g.fillText(wd, x, y); x += g.measureText(wd).width + gap; }); } }
  g.restore(); }
// letters of a word fly away one by one (exit): u 0..1; direction per letter from hash
function ktScatter(g, str, x, y, size, u, o = {}) { g.save(); g.font = ktSans(size, o.weight ?? 900); g.textBaseline = 'alphabetic'; const ch = [...str], ws = ch.map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0); let cx = x - tot / 2;
  ch.forEach((c, i) => { const d = clamp(u * (ch.length + 2) - (ch.length - 1 - i), 0, 1), e = eio(d); g.save(); g.translate(cx + ws[i] / 2 + e * (300 + hash(i, 3) * 500), y - e * (hash(i, 4) - .3) * 400); g.rotate(e * (hash(i, 6) - .5) * 1.6); g.globalAlpha = 1 - e; g.fillStyle = o.col ?? KT.ink; g.fillText(c, -ws[i] / 2, 0); g.restore(); cx += ws[i]; });
  g.restore(); return tot; }
