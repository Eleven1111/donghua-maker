// ═══ LAYERED toolkit (图层卡通讲解): the 2.5D story-explainer look for creators — bold-ink cartoon illustrations cut into
// named layers (character parts, props, backgrounds) and animated like a motion-graphics rig: breathing, blinking, mouth swaps,
// pop-ins with overshoot, stamped captions, gauges with needles, piles that grow, green value pills, a running HUD counter,
// sunburst rays, sparkles, glitch cuts, slow camera pushes. Every layer is looked up by name in LY.src: a code-drawn placeholder
// by default, or an image (e.g. an AI-generated PNG the creator owns) registered with LY.image(name, dataURI) — the animation
// code does not change. Studied from the general grammar of illustrated finance/story explainers; characters and scenes are
// our own. Pure functions of t. references/looks/layered.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .06, VIGN_TONE = ['5,10,20', .12, .45];
const LYC = { ink: '#15110f', skin: '#f4c9a0', skinS: '#dea27a', hair: '#2b1d17', hairS: '#1b120e', hoodie: '#f08a3c', hoodieS: '#c7682a', tee: '#f6f1e6', blush: '#f29b8f',
  green: '#39d353', greenD: '#1f8f33', gold: '#ffd23f', red: '#e5484d', navy: '#0f1b2d', teal: '#12303a', screen: '#0b2a1e', white: '#fffdf6' };
const lyFam = (w = 900) => `${w} ${'{S}'}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}sans-serif`;
const lyFont = (size, w = 900) => lyFam(w).replace('{S}', size);
const LY = (() => {
  const src = {};        // name → { c: canvas|image, ax, ay } (anchor in px inside the layer)
  // bake a code-drawn layer w×h with anchor (ax, ay); draw(g) paints in layer px
  function bake(name, w, h, ax, ay, draw) { if (src[name] && src[name].img) return src[name]; const c = mk(w, h), g = g2(c); g.lineJoin = g.lineCap = 'round'; draw(g); return (src[name] = { c, ax, ay, w, h }); }
  // replace a layer by an image (same anchor convention: ax, ay in the image's own px; default bottom-centre)
  function image(name, uri, { ax = null, ay = null } = {}) { const im = new Image(); im.src = uri; const e = { c: im, img: true, ax, ay }; im.onload = () => { e.w = im.width; e.h = im.height; if (e.ax == null) e.ax = im.width / 2; if (e.ay == null) e.ay = im.height; }; src[name] = e; return e; }
  // draw layer `name` with its anchor at (x, y): s scale (number or [sx, sy]), rot, a alpha
  function put(g, name, x, y, { s = 1, rot = 0, a = 1 } = {}) { const L = src[name]; if (!L || a <= 0) return; const [sx, sy] = Array.isArray(s) ? s : [s, s]; if (!sx || !sy) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.scale(sx, sy); g.drawImage(L.c, -L.ax, -L.ay); g.restore(); }
  // ── ink helpers. Shapes are point lists through curvePath (closed); `ink` draws, in order: a thick silhouette stroke
  // (under the fill, so only its outer half shows), the fill, a cel shadow (the shape minus a copy shifted by dx, dy),
  // a soft light gradient (top-left light, bottom-right dark), optional hatching in the shadow, and a thin inner line.
  const P = fn => Object.assign(g => { g.beginPath(); fn(g); }, { raw: fn });
  const C = pts => P(q => curvePath(q, pts, true, false));
  function ink(g, path, fill, { lw = 9, shade = null, dx = 18, dy = 10, light = true, hatch = 0, inner = true } = {}) { g.save();
    if (lw) { path(g); g.strokeStyle = LYC.ink; g.lineWidth = lw * 2; g.stroke(); }
    path(g); g.fillStyle = fill; g.fill();
    g.save(); path(g); g.clip();
    if (shade && path.raw) { g.fillStyle = shade; g.beginPath(); g.rect(-1e4, -1e4, 2e4, 2e4); g.save(); g.translate(-dx, -dy); path.raw(g); g.restore(); g.fill('evenodd');
      if (hatch) { g.save(); g.beginPath(); g.rect(-1e4, -1e4, 2e4, 2e4); g.translate(-dx * 1.5, -dy * 1.5); path.raw(g); g.clip('evenodd'); g.setTransform(g.getTransform()); g.strokeStyle = 'rgba(21,17,15,.35)'; g.lineWidth = 3; for (let x = -800; x < 1600; x += hatch) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x + 500, 1200); g.stroke(); } g.restore(); } }
    if (light) { const bb = g.canvas, lg = g.createLinearGradient(0, 0, bb.width, bb.height); lg.addColorStop(0, 'rgba(255,255,255,.16)'); lg.addColorStop(.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,.14)'); g.fillStyle = lg; g.fillRect(-10, -10, bb.width + 20, bb.height + 20); }
    g.restore();
    if (lw && inner) { path(g); g.strokeStyle = LYC.ink; g.lineWidth = Math.max(2, lw * .35); g.stroke(); }
    g.restore(); }
  // tapered brush stroke through points: width w, profile 'mid' | 'in' (thick at start) | 'out' (thick at end)
  function sample(pts, n = 32) { const out = [], m = pts.length - 1, Q = i => pts[clamp(i, 0, m)];
    for (let k = 0; k <= n; k++) { const u = k / n * m, i = Math.min(Math.floor(u), m - 1), f = u - i, p0 = Q(i - 1), p1 = Q(i), p2 = Q(i + 1), p3 = Q(i + 2), f2 = f * f, f3 = f2 * f;
      out.push([0, 1].map(d => .5 * (2 * p1[d] + (-p0[d] + p2[d]) * f + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * f2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * f3))); } return out; }
  function taper(g, pts, w, { col = LYC.ink, prof = 'mid', a = 1 } = {}) { const S = sample(pts), L = [], R = [];
    S.forEach((p, i) => { const u = i / (S.length - 1), q = S[Math.min(i + 1, S.length - 1)], r = S[Math.max(i - 1, 0)], dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1;
      const k = prof === 'in' ? 1 - u * .9 : prof === 'out' ? .1 + u * .9 : .15 + .85 * Math.sin(u * PI), hw = w * k / 2; L.push([p[0] - dy / l * hw, p[1] + dx / l * hw]); R.push([p[0] + dy / l * hw, p[1] - dx / l * hw]); });
    g.save(); g.globalAlpha *= a; g.fillStyle = col; g.beginPath(); L.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); R.reverse().forEach(p => g.lineTo(...p)); g.closePath(); g.fill(); g.restore(); }
  const pop = k => { if (k <= 0) return 0; if (k >= 1) return 1; const c = 2.2, u = k - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
  const HL = '#6e4b3a';   // hair highlight
  // ── placeholder hero ("小林"): layers hero.body, hero.head, hero.eyes.{open,wide,closed,happy}, hero.mouth.{smile,talk,open,o}, hero.arm
  function hero() {
    bake('hero.body', 820, 600, 410, 600, g => {
      ink(g, C([[40, 600], [60, 330], [170, 200], [300, 160], [410, 150], [520, 160], [650, 200], [760, 330], [780, 600]]), LYC.hoodie, { lw: 10, shade: LYC.hoodieS, dx: 60, dy: 0, hatch: 16 });
      ink(g, C([[230, 190], [300, 130], [410, 118], [520, 130], [590, 190], [520, 250], [410, 262], [300, 250]]), LYC.hoodieS, { lw: 8, light: false });   // hood roll around the neck
      ink(g, C([[330, 170], [410, 150], [490, 170], [470, 250], [410, 280], [350, 250]]), LYC.tee, { lw: 7, shade: '#d9d0bd', dx: 0, dy: -18 });
      [[372, 270, 360, 400], [448, 270, 460, 400]].forEach(([a, b, c, d]) => { taper(g, [[a, b], [(a + c) / 2 + 4, (b + d) / 2], [c, d]], 11); ink(g, P(q => q.ellipse(c, d + 14, 12, 18, 0, 0, TAU)), LYC.white, { lw: 5, light: false }); });
      // headphones around the neck
      taper(g, [[245, 215], [300, 285], [410, 305], [520, 285], [575, 215]], 30, { col: '#23262d', prof: 'mid' });
      [[235, 225], [585, 225]].forEach(([x, y], i) => { ink(g, P(q => q.ellipse(x, y, 62, 72, i ? .35 : -.35, 0, TAU)), '#2b2f38', { lw: 8, shade: '#1a1c22', dx: 16, dy: 8 }); ink(g, P(q => q.ellipse(x, y, 34, 42, i ? .35 : -.35, 0, TAU)), '#34c6c4', { lw: 5 }); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(x - 14, y - 18, 10, 6, -.6, 0, TAU); g.fill(); });
      // folds
      [[[190, 420], [230, 520], [225, 600]], [[630, 420], [590, 520], [598, 600]], [[300, 480], [320, 560]], [[520, 470], [505, 560]]].forEach(p => taper(g, p, 7, { col: 'rgba(21,17,15,.7)' }));
    });
    bake('hero.head', 640, 700, 320, 660, g => {
      ink(g, C([[95, 600], [55, 420], [60, 210], [170, 70], [320, 40], [470, 70], [580, 210], [585, 420], [545, 600], [470, 610], [320, 590], [170, 610]]), LYC.hair, { lw: 10, shade: LYC.hairS, dx: 40, dy: 0 });   // back hair (bob)
      ink(g, P(q => { q.moveTo(255, 500); q.lineTo(245, 700); q.lineTo(395, 700); q.lineTo(385, 500); q.closePath(); }), LYC.skin, { lw: 8, light: false });
      g.save(); g.beginPath(); g.rect(250, 520, 140, 180); g.clip(); g.fillStyle = LYC.skinS; g.beginPath(); g.ellipse(320, 540, 100, 50, 0, 0, TAU); g.fill(); g.restore();   // shadow under the chin
      [[118, 370, 1], [522, 370, -1]].forEach(([x, y, s]) => { ink(g, P(q => q.ellipse(x, y, 38, 52, s * .15, 0, TAU)), LYC.skin, { lw: 8, shade: LYC.skinS, dx: 10 * s, dy: 4 }); taper(g, [[x + s * 8, y - 26], [x - s * 10, y], [x + s * 6, y + 26]], 7); });
      ink(g, C([[128, 270], [138, 410], [198, 505], [320, 562], [442, 505], [502, 410], [512, 270], [440, 150], [320, 128], [200, 150]]), LYC.skin, { lw: 10, shade: LYC.skinS, dx: 44, dy: 10 });
      g.fillStyle = LYC.blush; g.globalAlpha = .5; [[195, 425], [445, 425]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 40, 20, 0, 0, TAU); g.fill(); }); g.globalAlpha = 1;
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; [[181, 420], [195, 423], [209, 426], [431, 420], [445, 423], [459, 426]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x - 5, y + 8); g.stroke(); });
      taper(g, [[328, 416], [336, 432], [320, 438]], 8, { prof: 'out' });   // nose: a small tick between the eyes and the mouth
      // bangs: pointed locks along the forehead, strand lines, highlight streaks
      ink(g, C([[92, 330], [70, 190], [170, 80], [320, 55], [470, 80], [570, 190], [548, 330], [500, 250], [320, 232], [140, 250]]), LYC.hair, { lw: 10, shade: LYC.hairS, dx: 34, dy: 12 });
      // locks: overlapping curved clumps of different lengths, one hair colour, with thin dark partings between them
      const LOCKS = [[128, 206, 138, 318, -1], [178, 196, 190, 292, 1], [232, 190, 222, 308, -1], [290, 186, 300, 280, 1], [346, 188, 336, 300, -1], [404, 192, 422, 286, 1], [458, 198, 470, 306, -1], [506, 208, 512, 318, 1]];
      LOCKS.forEach(([x0, y0, x1, y1, c]) => taper(g, [[x0, y0 - 50], [(x0 + x1) / 2 + c * 8, (y0 + y1) / 2], [x1, y1 + 4]], 82, { prof: 'in', col: LYC.ink }));
      LOCKS.forEach(([x0, y0, x1, y1, c]) => taper(g, [[x0, y0 - 50], [(x0 + x1) / 2 + c * 8, (y0 + y1) / 2 - 2], [x1, y1 - 6]], 68, { prof: 'in', col: LYC.hair }));
      LOCKS.slice(1).forEach(([x0, y0, x1, y1], i) => { const [px, , qx] = LOCKS[i]; taper(g, [[(x0 + px) / 2, y0 - 30], [(x1 + qx) / 2 + 2, (y0 + y1) / 2 + 10]], 5, { col: LYC.hairS, prof: 'in' }); });
      [[[320, 70], [300, 150], [290, 240]], [[250, 90], [220, 170], [210, 240]], [[400, 90], [440, 170], [450, 240]]].forEach(p => taper(g, p, 6, { col: LYC.hairS }));
      [[[180, 150], [260, 95], [360, 88]], [[420, 120], [470, 150], [505, 200]]].forEach((p, i) => taper(g, p, i ? 10 : 16, { col: HL }));
      // side locks in front of the cheeks
      [[1, [[122, 250], [110, 400], [135, 520], [170, 560]]], [-1, [[518, 250], [530, 400], [505, 520], [470, 560]]]].forEach(([s, p]) => { ink(g, C([...p, [p[3][0] + s * 20, p[3][1] - 70], [p[2][0] + s * 30, p[2][1] - 120], [p[1][0] + s * 28, p[1][1] - 100]]), LYC.hair, { lw: 8, shade: LYC.hairS, dx: 10 * s, dy: 0 }); });
      ink(g, P(q => q.roundRect(440, 176, 76, 28, 12)), LYC.gold, { lw: 6, shade: '#d19a10', dx: 0, dy: -10 }); g.fillStyle = '#fff6c8'; g.fillRect(452, 182, 30, 6);
      taper(g, [[168, 272], [218, 252], [268, 262]], 15); taper(g, [[472, 272], [422, 252], [372, 262]], 15);   // brows, over the bangs   // brows
    });
    const eye = (name, fn) => bake(name, 440, 190, 220, 95, fn), EX = [[125, 100, 1], [315, 100, -1]];
    const lids = (g, x, y, s, open) => { taper(g, [[x - 66 * s, y + 4], [x - 26 * s, y - open * 1.02], [x + 22 * s, y - open], [x + 62 * s, y + 2]], 15, { prof: 'mid' }); taper(g, [[x - 58 * s, y - 4], [x - 80 * s, y - 22], [x - 92 * s, y - 30]], 10, { prof: 'in' }); taper(g, [[x - 40 * s, y + 50], [x, y + 58], [x + 40 * s, y + 48]], 5); };
    eye('hero.eyes.open', g => EX.forEach(([x, y, s]) => { const sh = C([[x - 62, y + 8], [x - 20, y - 56], [x + 26, y - 56], [x + 62, y], [x + 26, y + 56], [x - 26, y + 54]]);
      ink(g, sh, LYC.white, { lw: 0, shade: '#e4ddd2', dx: 0, dy: -14, light: false }); g.save(); sh(g); g.clip();
      const ig = g.createLinearGradient(0, y - 40, 0, y + 50); ig.addColorStop(0, '#2a170c'); ig.addColorStop(1, '#b8722c'); g.fillStyle = ig; g.beginPath(); g.arc(x + 4 * s, y + 8, 40, 0, TAU); g.fill(); g.strokeStyle = LYC.ink; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#0d0704'; g.beginPath(); g.arc(x + 4 * s, y + 10, 19, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - 10, y - 8, 13, 10, -.5, 0, TAU); g.fill(); g.beginPath(); g.arc(x + 18, y + 26, 6, 0, TAU); g.fill(); g.restore(); lids(g, x, y, s, 56); }));
    eye('hero.eyes.wide', g => EX.forEach(([x, y, s]) => { const sh = P(q => q.ellipse(x, y, 60, 70, 0, 0, TAU)); ink(g, sh, LYC.white, { lw: 7, light: false }); g.fillStyle = '#2a170c'; g.beginPath(); g.arc(x, y + 4, 20, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 6, y - 4, 7, 0, TAU); g.fill(); taper(g, [[x - 60 * s, y - 30], [x, y - 76], [x + 64 * s, y - 36]], 10); }));
    eye('hero.eyes.closed', g => EX.forEach(([x, y, s]) => { taper(g, [[x - 62 * s, y], [x, y + 26], [x + 64 * s, y + 4]], 16); [[-30, 18], [0, 26], [30, 20]].forEach(([dx, dy]) => taper(g, [[x + dx * s, y + dy], [x + dx * s * 1.1, y + dy + 22]], 6, { prof: 'in' })); }));
    eye('hero.eyes.happy', g => EX.forEach(([x, y, s]) => { taper(g, [[x - 58, y + 26], [x, y - 36], [x + 58, y + 26]], 20); taper(g, [[x + 56 * s, y + 20], [x + 80 * s, y + 4]], 8, { prof: 'in' }); }));
    const mouth = (name, fn) => bake(name, 260, 180, 130, 60, g => { g.translate(130, 60); g.scale(.7, .7); g.translate(-130, -60); fn(g); });
    mouth('hero.mouth.smile', g => { taper(g, [[62, 48], [130, 98], [198, 48]], 14); taper(g, [[56, 40], [66, 56]], 6); taper(g, [[204, 40], [194, 56]], 6); });
    const openM = (g, d) => { const sh = C([[50, 40], [130, 52], [210, 40], [180, 40 + d * .8], [130, 44 + d], [80, 40 + d * .8]]); ink(g, sh, '#6b1a20', { lw: 8, light: false }); g.save(); sh(g); g.clip(); g.fillStyle = '#fff'; g.fillRect(40, 30, 180, 24); g.fillStyle = '#ef7d86'; g.beginPath(); g.ellipse(130, 44 + d, 56, d * .45, 0, 0, TAU); g.fill(); g.restore(); taper(g, [[60, 40], [130, 50], [200, 40]], 8); };
    mouth('hero.mouth.talk', g => openM(g, 48)); mouth('hero.mouth.open', g => openM(g, 100));
    mouth('hero.mouth.o', g => { const sh = P(q => q.ellipse(130, 76, 36, 46, 0, 0, TAU)); ink(g, sh, '#6b1a20', { lw: 8, light: false }); g.fillStyle = '#ef7d86'; g.beginPath(); g.ellipse(130, 100, 22, 12, 0, 0, TAU); g.fill(); });
    bake('hero.arm', 320, 480, 70, 460, g => {
      ink(g, C([[20, 460], [10, 320], [60, 200], [150, 120], [215, 160], [140, 250], [110, 350], [125, 460]]), LYC.hoodie, { lw: 10, shade: LYC.hoodieS, dx: 26, dy: 0, hatch: 14 });
      ink(g, P(q => { q.save(); q.translate(182, 140); q.rotate(-.65); q.roundRect(-58, -26, 116, 52, 20); q.restore(); }), LYC.hoodieS, { lw: 7 });   // cuff
      ink(g, C([[150, 110], [150, 50], [190, 18], [250, 22], [285, 60], [275, 110], [230, 132], [180, 130]]), LYC.skin, { lw: 9, shade: LYC.skinS, dx: 18, dy: 10 });   // fist
      [[[200, 40], [260, 44]], [[196, 68], [270, 72]], [[200, 96], [262, 100]]].forEach(p => taper(g, p, 7)); taper(g, [[168, 60], [200, 92], [236, 110]], 8);   // fingers, thumb
    });
  }
  // draw the hero at (x, y) = bottom-centre of the body; o: { t, s, eyes, mouth, talk, tilt, arm, look, bob }
  function heroDraw(g, x, y, o = {}) { const t = o.t ?? 0, s = o.s ?? 1, br = 1 + Math.sin(t * 2.6) * .012;
    const blink = o.eyes ? null : ((t % 3.7) > 3.55 ? 'hero.eyes.closed' : null), eyes = blink || `hero.eyes.${o.eyes || 'open'}`;
    const mouth = o.talk ? (Math.floor(t * 8) % 3 === 0 ? 'hero.mouth.smile' : 'hero.mouth.talk') : `hero.mouth.${o.mouth || 'smile'}`;
    g.save(); g.translate(x, y); g.scale(s, s);
    put(g, 'hero.body', 0, 0, { s: [1, br] });
    const hx = (o.look ?? 0) * 14, hy = -395 * br + (o.bob ?? 0);
    g.save(); g.translate(0, hy); g.rotate(o.tilt ?? Math.sin(t * 1.3) * .03); put(g, 'hero.head', 0, 0); put(g, eyes, hx, -320); put(g, mouth, hx * .6, -192); g.restore();
    if (o.arm != null) put(g, 'hero.arm', 300, -330, { rot: -.35 + o.arm * .45 + Math.sin(t * 10) * .04 * o.arm });
    g.restore(); }
  // ── motion-graphics pieces
  // stamped caption: slams from 1.8× with a shake, thick outline, slight rotation; o: { col, fill, size, rot, bg }
  function stamp(g, str, x, y, k, o = {}) { if (k <= 0) return; const e = k < 1 ? 1.8 - .8 * pop(k) : 1, size = o.size ?? 150; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(x + (k < 1.2 ? Math.sin(k * 60) * 8 * (1.2 - k) : 0), y); g.rotate(o.rot ?? -.06); g.scale(e, e); g.globalAlpha = clamp(k * 3, 0, 1);
    g.font = lyFont(size); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (o.bg) { const w = g.measureText(str).width + size * .8, h = size * 1.35; g.fillStyle = LYC.ink; g.beginPath(); g.roundRect(-w / 2 + 12, -h / 2 + 14, w, h, 18); g.fill(); g.fillStyle = o.bg; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 18); g.fill(); g.strokeStyle = LYC.ink; g.lineWidth = 10; g.stroke(); }
    g.lineWidth = size * .16; g.strokeStyle = LYC.ink; g.strokeText(str, 0, 6); g.fillStyle = o.col ?? LYC.gold; g.fillText(str, 0, 0); g.restore(); }
  // top caption bar (white caps with ink outline), types on
  function caption(g, str, x, y, k, size = 84) { if (k <= 0) return; const n = Math.ceil([...str].length * clamp(k * 1.6, 0, 1)); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = lyFont(size); g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round'; const s = [...str].slice(0, n).join('');
    g.lineWidth = size * .2; g.strokeStyle = LYC.ink; g.strokeText(s, x, y); g.fillStyle = LYC.white; g.fillText(s, x, y); g.restore(); }
  // green value pill (like a price tag), pops with k
  function pill(g, str, x, y, k, { size = 64, col = LYC.green } = {}) { const e = pop(clamp(k, 0, 1)); if (e <= 0) return; g.save(); g.translate(x, y); g.scale(e, e); g.font = lyFont(size); const w = g.measureText(str).width + size * .9, h = size * 1.3;
    g.fillStyle = LYC.ink; g.beginPath(); g.roundRect(-w / 2 + 6, -h / 2 + 8, w, h, h * .3); g.fill(); g.fillStyle = col; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h * .3); g.fill(); g.strokeStyle = LYC.ink; g.lineWidth = 7; g.stroke();
    g.fillStyle = LYC.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, 0, 4); g.restore(); }
  // running HUD counter, top-right, amber digits on a dark plate; value v; o: { label, flash }
  function hud(g, label, v, o = {}) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); const str = Math.round(v).toLocaleString('en-US'), x = W - 90, y = 90, size = 58; g.font = lyFont(size, 800);
    const lw = g.measureText(label).width, vw = Math.max(g.measureText(str).width, size * 4.5), w = lw + vw + 110, h = size * 1.5, fl = o.flash ?? 0;
    g.fillStyle = 'rgba(8,10,14,.85)'; g.strokeStyle = fl > 0 ? LYC.gold : '#b8860b'; g.lineWidth = 5 + fl * 4; g.beginPath(); g.roundRect(x - w, y - h / 2, w, h, 12); g.fill(); g.stroke();
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#e0a530'; g.fillText(label, x - w + 30, y + 3); g.textAlign = 'right'; g.fillStyle = fl > 0 ? '#fff6c8' : LYC.gold; g.shadowColor = 'rgba(255,190,40,.8)'; g.shadowBlur = 16 + fl * 30; g.fillText(str, x - 30, y + 3); g.restore(); }
  // gauge: half-dial with ticks 0–10, red needle at value v (0–10), label under it
  function gauge(g, x, y, r, v, label, k = 1) { const e = pop(clamp(k, 0, 1)); if (e <= 0) return; g.save(); g.translate(x, y); g.scale(e, e);
    ink(g, P(q => { q.arc(0, 0, r, PI, 0); q.closePath(); }), '#1d1f24', { lw: 12 }); g.fillStyle = LYC.white; g.font = lyFont(r * .13, 800); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i <= 10; i++) { const a = PI + i / 10 * PI, c = Math.cos(a), s = Math.sin(a); g.strokeStyle = LYC.white; g.lineWidth = 6; g.beginPath(); g.moveTo(c * r * .86, s * r * .86); g.lineTo(c * r * .95, s * r * .95); g.stroke(); if (i) g.fillText(i, c * r * .72, s * r * .72); }
    const a = PI + clamp(v, 0, 10) / 10 * PI; g.strokeStyle = LYC.red; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8); g.stroke(); g.fillStyle = LYC.white; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.fill(); g.strokeStyle = LYC.ink; g.lineWidth = 6; g.stroke();
    g.font = lyFont(r * .3); g.lineWidth = r * .05; g.strokeStyle = LYC.ink; g.lineJoin = 'round'; g.strokeText(label, 0, r * .28); g.fillStyle = LYC.gold; g.fillText(label, 0, r * .28); g.restore(); }
  // a pile of items (layer name) growing: n items shown, stacked in a pyramid, each popping in
  function pile(g, name, x, y, n, t, { gap = 150, lift = 70, per = .08 } = {}) { let i = 0; for (let row = 0; i < n; row++) { const cols = Math.max(1, 5 - row); for (let c = 0; c < cols && i < n; c++, i++) {
    const k = clamp((t - i * per) / .25, 0, 1); put(g, name, x + (c - (cols - 1) / 2) * gap, y - row * lift - (1 - pop(k)) * 60, { s: pop(k) }); } } }
  // sunburst rays behind a subject
  function rays(g, x, y, t, { n = 18, col = 'rgba(255,210,80,.12)', r = 2600 } = {}) { g.save(); g.translate(x, y); g.rotate(t * .08); g.fillStyle = col; for (let i = 0; i < n; i++) { const a = i / n * TAU; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, a, a + TAU / n / 2); g.closePath(); g.fill(); } g.restore(); }
  function sparkles(g, pts, t, col = LYC.gold) { g.save(); pts.forEach(([x, y, s], i) => { const k = .5 + .5 * Math.sin(t * 5 + i * 1.7); if (k < .15) return; g.translate(x, y); g.scale(s * k, s * k); g.fillStyle = col; g.beginPath(); for (let j = 0; j < 8; j++) { const a = j / 8 * TAU, rr = j % 2 ? 10 : 34; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill(); g.setTransform(1, 0, 0, 1, 0, 0); }); g.restore(); }
  // glitch: shifted horizontal slices with an RGB offset, amount k (0–1); call last, over the finished frame
  const GL = mk(W, H), GG = g2(GL);
  function glitch(g, k, seed = 1) { if (k <= 0) return; GG.clearRect(0, 0, W, H); GG.drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); const R = rng(seed);
    for (let i = 0; i < 14; i++) { const y = R() * H, h = 20 + R() * 120, dx = (R() - .5) * 260 * k; g.drawImage(GL, 0, y, W, h, dx, y, W, h); }
    g.globalCompositeOperation = 'screen'; g.globalAlpha = .35 * k; g.drawImage(GL, 14 * k, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = `rgba(80,255,160,${.08 * k})`; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); g.restore(); }
  return { src, bake, image, put, ink, P, C, taper, pop, hero, heroDraw, stamp, caption, pill, hud, gauge, pile, rays, sparkles, glitch };
})();
