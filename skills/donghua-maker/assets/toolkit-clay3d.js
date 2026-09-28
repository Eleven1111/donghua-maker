// ═══ CLAY 3D toolkit (three.js r158, inlined above the film script; see references/looks/clay3d.md) ═══════════
// Real volumes lit on a tabletop set: lumpy hand-pressed shapes, a shared clay normal map with thumb dents, fingerprint
// ridges and tool marks, soft sheen, a warm key with soft shadows, a cool rim. Puppets pose at 12 poses/s with a per-exposure
// "boil" jitter, the camera glides at 60. Every pose is a pure function of time, so seeking, stills and export agree.
const SMOOTH_DEFAULT = false, POST_GRAIN = .1, VIGN_TONE = ['40,25,15', .06, .24];
const K3 = (() => {
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.15;
  // ── noise: 3D value noise (for lumps) and a periodic 2D one (for the tileable surface map)
  const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const sm = u => u * u * (3 - 2 * u);
  function vn3(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = sm(x - xi), v = sm(y - yi), w = sm(z - zi), L = (a, b, k) => a + (b - a) * k;
    const c = (i, j, k) => h3(xi + i, yi + j, zi + k);
    return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w); }
  const fbm3 = (x, y, z) => vn3(x, y, z) * .62 + vn3(x * 2.1 + 5, y * 2.1, z * 2.1) * .28 + vn3(x * 4.3, y * 4.3 + 9, z * 4.3) * .1 - .5;
  function vn2p(x, y, P) { const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi), c = (i, j) => h3(((xi + i) % P + P) % P, ((yi + j) % P + P) % P, 3.3);
    return (c(0, 0) * (1 - u) + c(1, 0) * u) * (1 - v) + (c(0, 1) * (1 - u) + c(1, 1) * u) * v; }
  // ── the clay surface: one tileable height field → normal map. Grain, thumb dents with fingerprint ridges, tool drags.
  const NM = (() => {
    const N = 512, hgt = new Float32Array(N * N), rr = rng(4242);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) hgt[y * N + x] = vn2p(x / N * 8, y / N * 8, 8) * .35 + vn2p(x / N * 40, y / N * 40, 40) * .07;
    const wrapD = (a, b) => { let d = a - b; if (d > N / 2) d -= N; if (d < -N / 2) d += N; return d; };
    for (let k = 0; k < 16; k++) {   // thumb dents: a shallow bowl, ridges inside, a slight raised lip
      const cx = rr() * N, cy = rr() * N, r = 36 + rr() * 60, ex = .7 + rr() * .5, an = rr() * 6.28, ca = Math.cos(an), sa = Math.sin(an), dep = .5 + rr() * .5;
      for (let y = Math.floor(cy - r * 1.4); y < cy + r * 1.4; y++) for (let x = Math.floor(cx - r * 1.4); x < cx + r * 1.4; x++) {
        const dx = wrapD(x, cx), dy = wrapD(y, cy), u = (dx * ca + dy * sa) / ex, v = -dx * sa + dy * ca, d = Math.hypot(u, v) / r, i = ((y % N + N) % N) * N + ((x % N + N) % N);
        if (d < 1) hgt[i] += -dep * (1 - d * d) * (1 - d * d) + .05 * Math.sin(d * r * .75) * (1 - d);
        else if (d < 1.35) hgt[i] += .12 * Math.sin((d - 1) / .35 * Math.PI) * dep;
      } }
    for (let k = 0; k < 10; k++) {   // tool drags: short grooves
      const x0 = rr() * N, y0 = rr() * N, an = rr() * 6.28, len = 30 + rr() * 70;
      for (let s = 0; s < len; s++) for (let o = -3; o <= 3; o++) { const x = Math.round(x0 + Math.cos(an) * s - Math.sin(an) * o), y = Math.round(y0 + Math.sin(an) * s + Math.cos(an) * o), i = ((y % N + N) % N) * N + ((x % N + N) % N); hgt[i] -= .09 * (1 - Math.abs(o) / 3.5); } }
    const c = mk(N, N), g = g2(c), img = g.createImageData(N, N), at = (x, y) => hgt[((y + N) % N) * N + ((x + N) % N)];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let nx = (at(x - 1, y) - at(x + 1, y)) * 6, ny = (at(x, y + 1) - at(x, y - 1)) * 6, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const i = (y * N + x) * 4; img.data[i] = (nx * .5 + .5) * 255; img.data[i + 1] = (ny * .5 + .5) * 255; img.data[i + 2] = (nz * .5 + .5) * 255; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0); return c; })();
  const tex = (c, rep, color = false) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; };
  // ── materials: matte clay with sheen; `gloss` for wet things (eyes, water), `map` a colour canvas (stripes)
  const mats = {};
  function mat(col, { rough = .64, bump = .55, rep = 2, sheen = .5, gloss = false, map = null, side = THREE.FrontSide } = {}) {
    const key = [col, rough, bump, rep, sheen, gloss, map && map.id, side].join('|'); if (mats[key]) return mats[key];
    const c = new THREE.Color(col), m = new THREE.MeshPhysicalMaterial({ color: map ? '#ffffff' : c, map: map ? map.tex : null, roughness: gloss ? .18 : rough, metalness: 0, side,
      normalMap: tex(NM, rep), normalScale: new THREE.Vector2(bump, bump), sheen, sheenRoughness: .7, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), .5), clearcoat: gloss ? .6 : 0 });
    return (mats[key] = m); }
  // colour canvas with soft wavy bands along u (meridians on a sphere, rings on a tube): tabby stripes, painted bands
  let mapId = 0;
  function stripes(base, dark, n = 9, { w = .32, wav = .06, seed = 1 } = {}) {
    const S = 512, c = mk(S, S), g = g2(c), rr = rng(seed); g.fillStyle = base; g.fillRect(0, 0, S, S); g.fillStyle = dark;
    for (let k = 0; k < n; k++) { const u0 = (k + rr() * .3) / n * S, bw = S / n * w * (.7 + rr() * .6); g.beginPath();
      for (let y = 0; y <= S; y += 8) g.lineTo(u0 + Math.sin(y / S * 6.28 * 2 + k) * S * wav - bw / 2 * Math.sin(y / S * Math.PI), y);
      for (let y = S; y >= 0; y -= 8) g.lineTo(u0 + Math.sin(y / S * 6.28 * 2 + k) * S * wav + bw / 2 * Math.sin(y / S * Math.PI), y); g.fill(); }
    return { id: ++mapId, tex: tex(c, 1, true) }; }
  // ── geometry: displace along normals by 3D noise (hand-pressed lumps), then weld seam normals so UV seams don't show
  function weld(geo) { geo.computeVertexNormals(); const p = geo.attributes.position, n = geo.attributes.normal, acc = new Map();
    for (let i = 0; i < p.count; i++) { const k = `${Math.round(p.getX(i) * 1e3)},${Math.round(p.getY(i) * 1e3)},${Math.round(p.getZ(i) * 1e3)}`, a = acc.get(k) || [0, 0, 0, []]; a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); a[3].push(i); acc.set(k, a); }
    acc.forEach(([x, y, z, ids]) => { const l = Math.hypot(x, y, z) || 1; ids.forEach(i => n.setXYZ(i, x / l, y / l, z / l)); }); n.needsUpdate = true; return geo; }
  function lump(geo, { amp = .05, freq = 1.4, seed = 1 } = {}) { if (amp <= 0) return weld(geo); geo.computeVertexNormals(); const p = geo.attributes.position, n = geo.attributes.normal, o = seed * 17.3;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = fbm3(x * freq + o, y * freq, z * freq) * amp * 2; p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d); }
    p.needsUpdate = true; return weld(geo); }
  const shadowed = m => { m.castShadow = m.receiveShadow = true; return m; };
  // ellipsoid blob rx×ry×rz, lumpy
  function blob(rx, ry, rz, col, o = {}) { const g = new THREE.SphereGeometry(1, o.seg ?? 56, o.segV ?? 40); g.scale(rx, ry, rz); return shadowed(new THREE.Mesh(lump(g, { amp: o.amp ?? Math.min(rx, ry, rz) * .06, freq: o.freq ?? 1.6 / Math.max(.4, Math.min(rx, ry, rz)), seed: o.seed ?? rx * 31 + ry }), o.mat || mat(col, o))); }
  // rounded box (edge radius r), lumpy: slabs, planks, blocks
  function rbox(w, h, d, r, col, o = {}) { const g = new THREE.BoxGeometry(w, h, d, 12, 8, 12), p = g.attributes.position, hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ix = clamp(x, -hx, hx), iy = clamp(y, -hy, hy), iz = clamp(z, -hz, hz); v.set(x - ix, y - iy, z - iz); if (v.lengthSq() > 0) v.setLength(r); p.setXYZ(i, ix + v.x, iy + v.y, iz + v.z); }
    return shadowed(new THREE.Mesh(lump(g, { amp: o.amp ?? r * .25, freq: o.freq ?? 1.2, seed: o.seed ?? w * 7 + d }), o.mat || mat(col, o))); }
  // rolled snake through points (tails, rods, whiskers, reeds): a tube with round end caps
  function snake(pts, r, col, o = {}) { const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), m = o.mat || mat(col, o), g = new THREE.Group();
    const tg = new THREE.TubeGeometry(cv, o.seg ?? 48, r, 14, false);
    if (o.taper) { const p = tg.attributes.position, seg = o.seg ?? 48; for (let i = 0; i < p.count; i++) { const s = Math.floor(i / 15) / seg, c = cv.getPointAt(Math.min(1, s)), k = lerp(1, o.taper, s); p.setXYZ(i, c.x + (p.getX(i) - c.x) * k, c.y + (p.getY(i) - c.y) * k, c.z + (p.getZ(i) - c.z) * k); } }
    g.add(shadowed(new THREE.Mesh(lump(tg, { amp: o.amp ?? r * .12, freq: 3, seed: o.seed ?? 3 }), m)));
    [[0, r], [1, r * (o.taper ?? 1)]].forEach(([s, rr]) => { const c = shadowed(new THREE.Mesh(new THREE.SphereGeometry(rr, 16, 12), m)); c.position.copy(cv.getPointAt(s)); g.add(c); });
    return g; }
  function cone(r, h, col, o = {}) { const g = new THREE.ConeGeometry(r, h, 28, 6); g.translate(0, h / 2, 0); return shadowed(new THREE.Mesh(lump(g, { amp: o.amp ?? r * .06, freq: 2, seed: o.seed ?? 5 }), o.mat || mat(col, o))); }
  // an eye: glossy white ball, iris + pupil discs on its front (+z), a catchlight, an upper lid that closes (lid(k): 0 open … 1 shut)
  function eye(r, iris = '#e3a32a', lidCol = '#e8893a', { slit = true } = {}) {
    const g = new THREE.Group(), ball = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), mat('#fbf7ee', { gloss: true, bump: .1 }))); g.add(ball);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(r * .62, 28, 20), mat(iris, { gloss: true, bump: .05 })); ir.scale.z = .35; ir.position.z = r * .8; g.add(ir);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(r * .5, 24, 16), mat('#1b1512', { gloss: true, bump: 0 })); pu.scale.set(slit ? .32 : .75, .95, .3); pu.position.z = r * .9; g.add(pu);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(r * .1, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); hl.position.set(-r * .28, r * .3, r * .98); g.add(hl);
    const lid = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(lidCol))); g.add(lid);
    const low = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(lidCol))); g.add(low);
    // open: upper lid tipped back, lower lid tipped down; shut: both meet in front. `happy` curves the shut line upwards.
    g.lid = (k, happy = 0) => { lid.rotation.x = lerp(-1.05, .98 - happy * .5, k); low.rotation.x = lerp(.62, -.55 + happy * .1, k * (happy ? 1 : .35)); };
    g.pupil = (s = 1) => { pu.scale.set((slit ? .32 : .75) * s, .95, .3); };
    g.look = (x = 0, y = 0) => { [ir, pu, hl].forEach(m => { m.position.x = (m === hl ? -r * .28 : 0) + x * r * .3; m.position.y = (m === hl ? r * .3 : 0) + y * r * .3; }); };
    g.lid(0); return g; }
  // ── set: sky backdrop (unlit gradient), one warm soft key, a cool rim, hemisphere fill
  function stage({ sky = ['#a9d6ea', '#f3e3c3'], key = [-10, 16, 12], fov = 30, keyCol = '#fff1dc', rim = '#b9d7ff' } = {}) {
    const scene = new THREE.Scene(), c = mk(4, 256), gg = g2(c), gr = gg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); gg.fillStyle = gr; gg.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
    scene.add(new THREE.HemisphereLight('#fff6e8', '#8a6a4a', 1.1));
    const L = new THREE.DirectionalLight(keyCol, 2.6); L.position.set(...key); L.castShadow = true; L.shadow.mapSize.set(2048, 2048);
    Object.assign(L.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 }); L.shadow.bias = -.0005; L.shadow.normalBias = .02; L.shadow.radius = 6; scene.add(L);
    const Rm = new THREE.DirectionalLight(rim, 1.1); Rm.position.set(8, 6, -14); scene.add(Rm);
    const cam = new THREE.PerspectiveCamera(fov, W / H, .3, 300);
    return { scene, cam, key: L }; }
  function aim(cam, { at = [0, 1, 0], az = 0, el = .25, dist = 20, roll = 0 } = {}) {
    cam.position.set(at[0] + dist * Math.cos(el) * Math.sin(az), at[1] + dist * Math.sin(el), at[2] + dist * Math.cos(el) * Math.cos(az)); cam.up.set(Math.sin(roll), Math.cos(roll), 0); cam.lookAt(...at); }
  // boil: the small per-exposure shift every hand-moved puppet has (e = exposure index from the engine)
  const boil = (obj, e, id, a = 1) => { obj.position.x += (hash(e, id) - .5) * .012 * a; obj.position.y += (hash(e, id + 1) - .5) * .012 * a; obj.rotation.z += (hash(e, id + 2) - .5) * .012 * a; obj.rotation.y += (hash(e, id + 3) - .5) * .012 * a; };
  const eBack = u => { const c = 1.6; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const wob = (t, a = 1, f = 3, d = 5) => t <= 0 ? 0 : a * Math.sin(t * f * 6.283) * Math.exp(-d * t);   // damped spring
  function frame(ctx, scene, cam) { R.render(scene, cam); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.domElement, 0, 0, W, H); }
  return { R, mat, stripes, lump, weld, blob, rbox, snake, cone, eye, stage, aim, boil, eBack, wob, frame, fbm3, shadowed };
})();
