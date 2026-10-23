// ═══ TEARDOWN toolkit (爆炸拆解, three.js r158 inlined above the film script): a real object lit like a studio packshot on a
// dark graphite sweep, taken apart along its own axes in layers; every part is named by a leader that starts on a 3D point
// of the part (accent index · name · one spec line), and the camera keeps travelling. Grammar after lemo-opuscar's
// teardown STYLE.md (MIT; rules only, no code). The object comes from references/rebuild.md: a reference, a detail
// inventory, a part tree; without engineering files the frame says 示意 and shows no number it cannot source.
// references/looks/teardown.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['5,6,8', .05, .45];
// one warm white at two strengths, one accent for indices and measured things
const TDC = { ink: '#f1efe9', dim: 'rgba(241,239,233,.62)', accent: '#ff6b3d', bg: ['#3b3e43', '#1d1f23', '#0b0c0e'],
  sans: '"Noto Sans SC","PingFang SC","Hiragino Sans GB",sans-serif', mono: '"JetBrains Mono","Noto Sans SC",Menlo,monospace' };

// the studio: renderer with alpha over a canvas sweep, a prefiltered dark room with soft boxes for reflections, a warm key
// that casts soft shadows, a cool rim, an invisible floor that only takes the shadow; a part registry for the explode
const TD = (() => {
  const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false); R.outputColorSpace = THREE.SRGBColorSpace; R.setClearColor(0x000000, 0);
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;   // PCF, not PCFSoft: only PCF honours shadow.radius
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, W / H, 1, 500);
  (() => {   // [w, h, colour, strength, position]: warm soft box, cool strip behind, low bounce, two side fills
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ color: 0x15171b, side: THREE.BackSide })));
    [[50, 22, 0xfff1dc, 9, [-18, 30, 22]], [10, 60, 0xcfe2ff, 6, [26, 6, -24]], [60, 10, 0xffffff, 2.2, [0, -30, 18]], [14, 40, 0xffffff, 3, [34, 10, 20]], [16, 44, 0xfff6ea, 4, [-36, 8, 8]]].forEach(([w, h, c, k, p]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...p); m.lookAt(0, 0, 0); s.add(m); });
    const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(s, .02).texture; pm.dispose();
  })();
  const key = new THREE.DirectionalLight(0xfff0dd, 2.4); key.position.set(-30, 60, 40); key.castShadow = true;
  Object.assign(key.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 200 }); key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -.0004; key.shadow.radius = 6;   // blurred edge; 4096² keeps steps off a close-up
  const rim = new THREE.DirectionalLight(0xbfd6ff, 1.8); rim.position.set(35, 20, -40);
  scene.add(key, rim, new THREE.HemisphereLight(0x9aa4b0, 0x0c0d0f, .35));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: .42 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const phys = (color, metalness, roughness, o = {}) => new THREE.MeshPhysicalMaterial({ color, metalness, roughness, ...o });
  const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; return m; };
  function prism(pts, z0, z1, mat, bev = .1) {   // an extruded outline ([x, y] points) with a small machined bevel, z0..z1
    const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: z1 - z0 - 2 * bev, bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 2 });
    g.translate(0, 0, z0 + bev); return mesh(g, mat);
  }
  const box = (x0, x1, y0, y1, z0, z1, mat, bev) => prism([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0, z1, mat, bev);
  const cyl = (r, len, mat, seg = 24) => mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  // parts: each is a group with a home pose (built in place), an explode offset along its own way out and a layer
  // (the order it leaves in); left/right pairs are built mirrored, never rotated (rebuild.md §3)
  const list = [], named = {};
  function part(name, layer, off, build) {
    const g = new THREE.Group(); build(g); scene.add(g); const p = { g, name, off, layer, extra: [0, 0, 0] };
    list.push(p); (named[name] = named[name] || []).push(p); return p;
  }
  const floorAt = y => { floor.position.y = y; };
  return { R, scene, cam, key, rim, phys, mesh, prism, box, cyl, part, list, named, floorAt };
})();

// explode and close: k(layer) = eased open − eased close. Layers leave in order 0.15–0.2 s apart (ease-in-out cubed,
// smooth start, long settle) and come back in reverse, quicker. While apart, parts float a little, out of phase.
// p.extra is added on top (a part's own real motion: a wedge pulled up, a key pressed).
function tdApart(T, open, close = null) {
  const top = Math.max(...TD.list.map(p => p.layer));
  TD.list.forEach((p, j) => {
    if (p.layer < 0) { p.g.position.set(...p.extra); return; }
    let k = eio((T - open.t0 - p.layer * (open.stagger ?? .15)) / (open.dur ?? 1.3));
    if (close) k -= eio((T - close.t0 - (top - p.layer) * (close.stagger ?? .12)) / (close.dur ?? .8));
    const fl = Math.sin(T * 1.7 + p.layer + j * .3) * .07 * k;
    p.g.position.set(p.off[0] * k + p.extra[0], p.off[1] * k + fl + p.extra[1], p.off[2] * k + p.extra[2]);
  });
}
const tdPos = (name, i = 0) => TD.named[name][i].g.position;
const tdAt = (name, i, [x, y, z]) => { const p = tdPos(name, i); return [p.x + x, p.y + y, p.z + z]; };   // a local point, posed

// the camera path: keys [{ t, az, el, d, at: [x, y, z], sx, sy }] in the object's own coordinates, each component
// interpolated monotone cubic (Fritsch–Carlson), so a held key really holds and nothing overshoots. sx/sy slide the
// view (setViewOffset, px) to free a label column without moving the object.
function tdPath(keys) {
  const comp = ['az', 'el', 'd', 'sx', 'sy', 'atx', 'aty', 'atz'], ts = keys.map(k => k.t);
  const val = k => [k.az, k.el, k.d, k.sx ?? 0, k.sy ?? 0, ...(k.at ?? [0, 0, 0])];
  const ys = comp.map((_, c) => keys.map(k => val(k)[c])), n = keys.length;
  const tang = ys.map(y => {   // monotone tangents
    const dl = y.slice(1).map((v, i) => (v - y[i]) / (ts[i + 1] - ts[i])), m = y.map((_, i) => i === 0 ? dl[0] : i === n - 1 ? dl[n - 2] : dl[i - 1] * dl[i] <= 0 ? 0 : (dl[i - 1] + dl[i]) / 2);
    dl.forEach((d, i) => { if (d === 0) { m[i] = m[i + 1] = 0; return; } const a = m[i] / d, b = m[i + 1] / d, s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d; m[i + 1] = t * b * d; } });
    return m; });
  return T => {
    const f = ts.findIndex((t, j) => j < n - 1 && T < ts[j + 1]), i = f < 0 ? n - 2 : f, t0 = ts[i], h = ts[i + 1] - t0, u = clamp((T - t0) / h, 0, 1);
    const h00 = 2 * u ** 3 - 3 * u * u + 1, h10 = u ** 3 - 2 * u * u + u, h01 = -2 * u ** 3 + 3 * u * u, h11 = u ** 3 - u * u;
    const v = ys.map((y, c) => h00 * y[i] + h10 * h * tang[c][i] + h01 * y[i + 1] + h11 * h * tang[c][i + 1]);
    return { az: v[0], el: v[1], d: v[2], sx: v[3], sy: v[4], at: [v[5], v[6], v[7]] };
  };
}
function tdCam({ az, el, d, at, sx = 0, sy = 0 }, shake = [0, 0]) {
  TD.cam.position.set(at[0] + d * Math.cos(el) * Math.sin(az), at[1] + d * Math.sin(el), at[2] + d * Math.cos(el) * Math.cos(az));
  TD.cam.lookAt(...at); TD.cam.setViewOffset(W, H, -sx + shake[0], -sy + shake[1], W, H); TD.cam.updateMatrixWorld();
}
const tdProj = p => { const v = new THREE.Vector3(...p).project(TD.cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };

// the frame: the graphite sweep (baked once), the render on top
function tdSweep() {
  const c = mk(W, H), g = g2(c), rg = g.createRadialGradient(W * .5, H * .46, 60, W * .5, H * .5, Math.max(W, H) * .62);
  rg.addColorStop(0, TDC.bg[0]); rg.addColorStop(.55, TDC.bg[1]); rg.addColorStop(1, TDC.bg[2]); g.fillStyle = rg; g.fillRect(0, 0, W, H); return c;
}
function tdFrame(ctx, sweep) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sweep, 0, 0); TD.R.render(TD.scene, TD.cam); ctx.drawImage(TD.R.domElement, 0, 0, W, H); }

// labels: an anchor dot on the part, a leader with one elbow, accent index · name, one spec line, in a column at a fixed
// x on one side. Each column is laid out per frame: sorted by the anchor's screen height, spaced by `gap` so leaders stay
// short and flat. k: 0..1 (the leader grows over the first half, the text slides in 10 px after it; k falls back to fade).
function tdLabels(g, list, { top = H * .25, gap = 210, bot = H - 360 } = {}) {
  [-1, 1].forEach(side => {
    const col = list.filter(l => l.k > 0 && (l.side ?? -1) === side).map(l => ({ ...l, side, p: tdProj(l.anchor) })).sort((a, b) => a.p[1] - b.p[1]);
    let y = top - gap; col.forEach(l => { y = Math.min(Math.max(l.p[1] + (l.dy || 0), y + gap), bot); l.ly = y; });
    col.forEach(l => tdLabel(g, l));
  });
}
function tdLabel(g, { p: [ax, ay], side, ly, idx, name, spec, k, fade = 1 }) {
  const S = Math.min(W, H) / 1440, col = side < 0 ? 96 * S : W - 96 * S, F = [64 * S, 44 * S, 40 * S];
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = fade;
  g.font = `600 ${F[0]}px ${TDC.sans}`; const nw = g.measureText(name).width + 84 * S; g.font = `400 ${F[2]}px ${TDC.sans}`;
  const tw = Math.max(nw, g.measureText(spec).width), ex = side < 0 ? col + tw + 28 * S : col - tw - 28 * S, kl = clamp(k / .5, 0, 1), kt = clamp((k - .4) / .6, 0, 1);
  const ox = ex + (side < 0 ? 40 : -40) * S, my = ly - 18 * S, L1 = Math.hypot(ox - ax, my - ay), L2 = Math.abs(ex - ox), s = kl * (L1 + L2);
  g.strokeStyle = 'rgba(241,239,233,.75)'; g.lineWidth = 3 * S; g.beginPath(); g.moveTo(ax, ay);
  if (s <= L1) g.lineTo(ax + (ox - ax) * s / L1, ay + (my - ay) * s / L1); else { g.lineTo(ox, my); g.lineTo(ox + (ex - ox) * (s - L1) / L2, my); }
  g.stroke(); g.fillStyle = TDC.accent; g.beginPath(); g.arc(ax, ay, 9 * S, 0, TAU); g.fill(); g.strokeStyle = TDC.bg[2]; g.lineWidth = 3 * S; g.stroke();
  if (kt > 0) {
    g.globalAlpha = fade * kt; const dx = (1 - eo(kt)) * 10 * S * (side < 0 ? -1 : 1), x0 = side < 0 ? col : col - tw;
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.font = `700 ${F[1]}px ${TDC.mono}`; g.fillStyle = TDC.accent; g.fillText(idx, x0 + dx, ly - 2 * S);
    g.font = `600 ${F[0]}px ${TDC.sans}`; g.fillStyle = TDC.ink; g.fillText(name, x0 + 84 * S + dx, ly + 6 * S);
    g.font = `400 ${F[2]}px ${TDC.sans}`; g.fillStyle = TDC.dim; g.fillText(spec, x0 + dx, ly + 64 * S);
  }
  g.restore();
}
// title card in screen space: an accent bar, the name, one line that says what kind of picture this is (示意)
function tdTitle(g, title, sub, k) {
  if (k <= 0) return; const S = Math.min(W, H) / 1440, x = 96 * S, y = H * .148;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = clamp(k, 0, 1); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = TDC.accent; g.fillRect(x, y - 144 * S, 72 * S * eo(k), 8 * S);
  g.font = `800 ${112 * S}px ${TDC.sans}`; g.fillStyle = TDC.ink; g.fillText(title, x, y);
  g.font = `400 ${46 * S}px ${TDC.sans}`; g.fillStyle = TDC.dim; g.fillText(sub, x, y + 80 * S); g.restore();
}
// subtitle: one centred line in the bottom band, soft shadow, no box; a dark scrim rises behind it, since a bright part
// may sit under the band (never text on a bright, busy part without a dark backing)
function tdSub(g, text, k) {
  if (k <= 0) return; const S = Math.min(W, H) / 1440;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = clamp(k, 0, 1); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const sc = g.createLinearGradient(0, H * .78, 0, H); sc.addColorStop(0, 'rgba(11,12,14,0)'); sc.addColorStop(.45, 'rgba(11,12,14,.62)'); sc.addColorStop(1, 'rgba(11,12,14,.75)');
  g.fillStyle = sc; g.fillRect(0, H * .78, W, H * .22);
  g.font = `600 ${64 * S}px ${TDC.sans}`; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 18 * S; g.fillStyle = TDC.ink; g.fillText(text, W / 2, H * .88); g.restore();
}
