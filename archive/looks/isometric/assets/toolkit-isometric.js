// ═══ ISOMETRIC toolkit (等距几何, three.js r158 inlined above the film script): a real 3D diorama seen through an orthographic
// camera at the true isometric angle. Soft-edged pastel blocks on a pale ground, one key light that gives the classic three tones
// (top light, left mid, right dark), soft contact shadows; rooms assemble prop by prop, cities rise tier by tier, and the camera
// can orbit because the world is real. Every pose is a pure function of time. references/looks/isometric.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .03, VIGN_TONE = ['0,0,0', 0, .06];
const ISO = { ground: '#efe6d8', ink: '#3b2f2f',
  pals: [['#f4a39a', '#f7d08a', '#9fd3c7', '#6c8ebf', '#f2efe6'], ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653'], ['#ffcdb2', '#ffb4a2', '#e5989b', '#b5838d', '#6d6875']] };
const I3 = (() => {
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace;
  const ISO_EL = Math.atan(1 / Math.SQRT2);                 // 35.26°: the true isometric elevation
  const mats = {};
  const mat = (col, o = {}) => { const k = col + JSON.stringify(o); return mats[k] || (mats[k] = matU(col, o)); };
  const matU = (col, { rough = .85, emissive = null, ei = 0 } = {}) => { const m = new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: 0 }); if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = ei; } return m; };
  const sh = m => { m.castShadow = m.receiveShadow = true; return m; };
  // soft-edged box w×h×d (x, y up, z), origin at its min corner on the floor; r = edge radius
  const geos = {};
  function rgeo(w, h, d, r) { const k = [w, h, d, r].map(v => v.toFixed(3)).join(); if (geos[k]) return geos[k];
    const g = new THREE.BoxGeometry(w, h, d, 4, 4, 4); r = Math.min(r, w / 2, h / 2, d / 2); if (r > 0) { const p = g.attributes.position, v = new THREE.Vector3(), hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ix = clamp(x, -hx, hx), iy = clamp(y, -hy, hy), iz = clamp(z, -hz, hz); v.set(x - ix, y - iy, z - iz); if (v.lengthSq() > 0) v.setLength(r); p.setXYZ(i, ix + v.x, iy + v.y, iz + v.z); }
      g.computeVertexNormals(); }
    g.translate(w / 2, h / 2, d / 2); return (geos[k] = g); }
  function box(x, y, z, w, h, d, col, o = {}) { const m = sh(new THREE.Mesh(rgeo(w, h, d, o.r ?? .04), o.own ? matU(col, o) : mat(col, o))); m.position.set(x, y, z); return m; }
  // stage: flat ground colour, a shadow-catching floor, hemisphere fill + a key light placed for top > left > right
  function stage({ bg = ISO.ground, view = 9, shadow = .2, span = 14 } = {}) {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
    scene.add(new THREE.HemisphereLight('#ffffff', '#c9b9a0', 1.35));
    const L = new THREE.DirectionalLight('#fffaf2', 2.1); L.position.set(7, 26, 16); L.castShadow = true; L.shadow.mapSize.set(2048, 2048);
    Object.assign(L.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 90 }); L.shadow.bias = -.0004; L.shadow.normalBias = .02; L.shadow.radius = 4; scene.add(L); scene.add(L.target);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: shadow })); fl.rotation.x = -Math.PI / 2; fl.position.y = -.001; fl.receiveShadow = true; scene.add(fl);
    const a = W / H, cam = new THREE.OrthographicCamera(-view * a, view * a, view, -view, .1, 400);
    return { scene, cam, key: L }; }
  // orthographic camera: azimuth az (π/4 = classic iso), elevation el (default isometric), zoom z (bigger = closer)
  function aim(cam, { at = [0, 0, 0], az = Math.PI / 4, el = ISO_EL, zoom = 1, dist = 80 } = {}) {
    cam.position.set(at[0] + dist * Math.cos(el) * Math.sin(az), at[1] + dist * Math.sin(el), at[2] + dist * Math.cos(el) * Math.cos(az)); cam.lookAt(...at); cam.zoom = zoom; cam.updateProjectionMatrix(); }
  // world point → canvas pixels (for 2D labels drawn over the frame)
  const V = new THREE.Vector3();
  const project = (p, cam) => { V.set(...p).project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H]; };
  // drop-in with overshoot: null before t0; dy = height to add while falling, s = scale overshoot
  const drop = (t, t0, d = .4) => { const k = clamp((t - t0) / d, 0, 1); if (k <= 0) return null; const c = 2.2, u = k - 1; return { k, dy: (1 - k) * (1 - k) * 4, s: 1 + (c + 1) * u * u * u + c * u * u }; };
  const spring = k => k <= 0 ? 0 : 1 - Math.cos(k * 9) * Math.exp(-5 * k) * (1 - k);    // 0 → 1 with a wobble
  // ── room and props. Room: floor w×d, back walls standing on x = 0 and z = 0 (the camera looks from +x +z)
  function room(w, d, h, col = { floor: '#e8d5b7', wallX: '#c9e6df', wallZ: '#9fd3c7' }) {
    const g = new THREE.Group(), floor = box(0, -.2, 0, w, .2, d, col.floor), wx = box(-.15, 0, -.15, .15, h, d + .15, col.wallX), wz = box(0, 0, -.15, w, h, .15, col.wallZ);
    g.add(floor, wx, wz); g.walls = [wx, wz]; g.h = h; g.rise = k => { g.walls.forEach(m => { m.scale.y = Math.max(.001, k); m.visible = k > 0; }); }; return g; }
  // window on wall 'x' (plane x = 0, runs along z) or 'z' (plane z = 0, runs along x); a..a+len along, y0..y1 up; k grows it
  function win(wall, a, len, y0, y1, sky = '#bfe3f2') { const g = new THREE.Group(), p = (u, y, du, dy, t, c) => { const m = wall === 'x' ? box(0, y, u, t, dy, du, c, { r: .01 }) : box(u, y, 0, du, dy, t, c, { r: .01 }); g.add(m); };
    p(a - .08, y0 - .08, len + .16, y1 - y0 + .16, .03, '#ffffff'); p(a, y0, len, y1 - y0, .05, sky); p(a + len / 2 - .03, y0, .06, y1 - y0, .08, '#ffffff'); p(a, (y0 + y1) / 2 - .03, len, .06, .08, '#ffffff');
    g.grow = k => { const e = clamp(k, 0, 1); g.visible = e > 0; const c = wall === 'x' ? [0, (y0 + y1) / 2, a + len / 2] : [a + len / 2, (y0 + y1) / 2, 0]; g.scale.set(wall === 'x' ? 1 : e || .001, e || .001, wall === 'x' ? e || .001 : 1); g.position.set(c[0] * (1 - g.scale.x), c[1] * (1 - g.scale.y), c[2] * (1 - g.scale.z)); };
    return g; }
  function desk(col = '#f2efe6', leg = '#8a7f72') { const g = new THREE.Group(); [[.05, .05], [1.35, .05], [.05, .65], [1.35, .65]].forEach(([a, b]) => g.add(box(a, 0, b, .1, .75, .1, leg, { r: .02 }))); g.add(box(0, .75, 0, 1.5, .1, .8, col, { r: .03 })); return g; }
  function chair(col = '#6c8ebf') { const g = new THREE.Group(); g.add(box(0, 0, 0, .55, .45, .55, col)); g.add(box(0, .45, 0, .12, .6, .55, col)); return g; }
  // shelf with rows of books [[col, height], …]; g.fill(k) reveals books row by row
  function shelf(books, col = '#c8875c') { const g = new THREE.Group(), all = []; g.add(box(0, 0, 0, .08, 2, 1.4, col), box(0, 0, 0, .5, 2, .08, col), box(0, 0, 1.32, .5, 2, .08, col), box(0, 1.92, 0, .5, .08, 1.4, col), box(0, 0, 0, .5, .1, 1.4, col));   // open to +x
    [.55, 1.05, 1.55].forEach((y, r) => { g.add(box(.05, y - .05, .05, .47, .05, 1.3, '#a86b45', { r: .01 })); (books[r] || []).forEach(([c, h], i) => { const b = box(.1, y, .12 + i * .2, .35, h, .16, c, { r: .02 }); b.userData = { r, i, n: books[r].length }; g.add(b); all.push(b); }); });
    g.fill = k => all.forEach(b => { const { r, i, n } = b.userData; b.visible = i / n <= k * 1.2 - r * .2; }); return g; }
  function lamp(shade = '#f2c14e') { const g = new THREE.Group(); g.add(box(0, 0, 0, .3, .05, .3, '#5b5b5b', { r: .02 }), box(.13, .05, .13, .04, .6, .04, '#5b5b5b', { r: .01 }), box(-.02, .6, -.02, .34, .28, .34, shade, { emissive: shade, ei: .35 })); return g; }
  function plant(s = 1, pot = '#e07a5f', leaf = '#5aa469') { const g = new THREE.Group(); g.add(box(0, 0, 0, .4 * s, .45 * s, .4 * s, pot));
    [[0, 1.05, 0, .9], [-.18, .8, .12, .7], [.2, .85, -.1, .75], [.05, .7, .22, .6]].forEach(([x, y, z, m], i) => { const l = sh(new THREE.Mesh(new THREE.SphereGeometry(.28 * s * m, 20, 14), mat(i % 2 ? leaf : '#478a55'))); l.scale.set(.75, 1.25, .75); l.position.set(.2 * s + x * s, y * s * .8, .2 * s + z * s); l.rotation.z = x * 2; g.add(l); });
    return g; }
  function rug(w, d, col = '#e76f51') { const g = new THREE.Group(); g.add(box(0, 0, 0, w, .03, d, col, { r: .01 })); g.add(box(.2, .03, .2, w - .4, .01, d - .4, '#f4a261', { r: .005 })); return g; }
  // ── city: n×n lots, towers of 1–3 set-back tiers (o.bias(i, j) scales height); returns lots with tiers and a rank t
  function city(seed, n, pal, o = {}) { const Rn = rng(seed), lots = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (Rn() < (o.empty ?? .12)) continue; const tiers = [], Hh = 1 + Math.floor(Rn() * Rn() * (o.maxH ?? 7) * (o.bias ? o.bias(i, j) : 1));
      let y = 0, inset = 0, ci = Math.floor(Rn() * pal.length);
      for (let k = 0, hh = Hh; k < 3 && hh > 0; k++) { const th = k === 2 ? hh : Math.max(1, Math.round(hh * (.5 + Rn() * .4))); tiers.push({ y, h: th, inset, ci }); y += th; hh -= th; inset += .12 + Rn() * .08; if (Rn() < .4) ci = Math.floor(Rn() * pal.length); }
      lots.push({ i, j, tiers, t: Rn() }); }
    return lots; }
  // meshes for a city (tier height 1 = .7 world units); each tier owns its material so it can be recoloured
  function cityBuild(lots, pal, { unit = .85 } = {}) { const g = new THREE.Group();
    lots.forEach(l => { const lg = new THREE.Group(); lg.position.set(l.i, 0, l.j); g.add(lg); l.g = lg; l.tile = box(.04, 0, .04, .92, .06, .92, '#d9cdbb'); lg.add(l.tile);
      l.meshes = l.tiers.map(tr => { const m = .08 + tr.inset, b = box(m, 0, m, 1 - 2 * m, 1, 1 - 2 * m, pal[tr.ci], { own: true }); b.userData = { y: tr.y * unit, h: tr.h * unit }; lg.add(b); return b; }); });
    g.lots = lots; return g; }
  // pose a city: rise(l) → height factor (overshoot allowed), col(l, tierIndex) → colour or null, pop(l) → extra top scale
  function cityPose(g, rise = () => 1, col = null) { g.lots.forEach(l => { const r = rise(l); l.meshes.forEach((b, k) => { const { y, h } = b.userData; b.visible = r > 0; b.position.y = y * r + .06; b.scale.y = Math.max(.001, h * r); if (col) { const c = col(l, k); if (c) b.material.color.set(c); } }); }); }
  // 2D pin label over the frame at world point p
  function label(g, str, p, cam, k = 1, size = 48) { if (k <= 0) return; const [px, py] = project(p, cam), e = clamp(k, 0, 1); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = `700 ${size}px ${(window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''}sans-serif`;
    const tw = g.measureText(str).width + size, th = size * 1.5, lift = size * 2.2; g.strokeStyle = 'rgba(60,40,40,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - lift * e); g.stroke();
    g.translate(px, py - lift * e - th / 2); g.scale(e, e); g.fillStyle = 'rgba(60,40,40,.18)'; g.beginPath(); g.roundRect(-tw / 2 + 6, -th / 2 + 8, tw, th, th / 2); g.fill(); g.fillStyle = '#fffdf8'; g.beginPath(); g.roundRect(-tw / 2, -th / 2, tw, th, th / 2); g.fill();
    g.fillStyle = ISO.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, 0, 2); g.restore(); }
  function frame(ctx, scene, cam) { R.render(scene, cam); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.domElement, 0, 0, W, H); }
  return { R, ISO_EL, mat, matU, box, stage, aim, project, drop, spring, room, win, desk, chair, shelf, lamp, plant, rug, city, cityBuild, cityPose, label, frame };
})();
