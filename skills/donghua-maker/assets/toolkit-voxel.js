// ═══ VOXEL toolkit (体素像素, three.js r158 inlined above the film script): the pixel-art farm look rebuilt as a 3D voxel
// diorama — a floating island of cubes (grass top, dirt and stone tapering underneath), voxel trees, a house with glowing
// windows, crops that grow layer by layer, a blocky farmer rig that walks, chickens, water, clouds; a long lens with soft
// shadows and a tilt-shift blur that makes it read as a miniature; a day cycle of light colours. Every pose is a pure function
// of time. references/looks/voxel.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .04, VIGN_TONE = ['20,20,40', .05, .25];
const V3 = (() => {
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace;
  const CUBE = new THREE.BoxGeometry(1, 1, 1);
  const V = new THREE.Vector3(), M4 = new THREE.Matrix4(), CL = new THREE.Color();
  // a set of voxels [x, y, z, colour] → one InstancedMesh with per-voxel colour (a small jitter gives each cube its own tone)
  function mesh(vox, { jitter = .05, seed = 1, emissive = null } = {}) {
    const m = new THREE.InstancedMesh(CUBE, new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: emissive || '#000000' }), vox.length); const Rn = rng(seed);
    vox.forEach(([x, y, z, c], i) => { M4.makeTranslation(x + .5, y + .5, z + .5); m.setMatrixAt(i, M4); CL.set(c); const j = 1 + (Rn() - .5) * 2 * jitter; CL.r *= j; CL.g *= j; CL.b *= j; m.setColorAt(i, CL); });
    m.castShadow = m.receiveShadow = true; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.vox = vox; return m; }
  // ASCII model, bottom layer first: layers = [rows…], rows run along +z, characters along +x; pal maps characters to colours
  function model(layers, pal, o = {}) { const vox = []; layers.forEach((rows, y) => rows.forEach((row, z) => [...row].forEach((ch, x) => { if (pal[ch]) vox.push([x, y, z, pal[ch]]); })));
    const g = new THREE.Group(), m = mesh(vox, o), w = Math.max(...vox.map(v => v[0])) + 1, d = Math.max(...vox.map(v => v[2])) + 1; m.position.set(-w / 2, 0, -d / 2); g.add(m); g.size = [w, layers.length, d]; return g; }
  // floating island: radius r, grass top with a gentle height field, dirt + stone tapering to a point underneath
  function island(r, { seed = 3, grass = '#6fbf4a', grass2 = '#5aa83d', dirt = '#8a5a3b', stone = '#7d7f86', depth = 9, flat = null } = {}) {
    const vox = [], Rn = rng(seed), hf = (x, z) => flat && flat(x, z) ? 0 : Math.max(0, Math.round((Math.sin(x * .35 + seed) + Math.cos(z * .4)) * .6 + Rn() * .3));
    for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) { const d = Math.hypot(x, z) / r; if (d > 1) continue; const h = hf(x, z), under = Math.ceil(depth * (1 - d * d) + 1);
      for (let y = -under; y <= h; y++) vox.push([x, y, z, y === h ? (Rn() < .25 ? grass2 : grass) : y > h - 3 ? dirt : (Rn() < .15 ? '#6a6c73' : stone)]); }
    const m = mesh(vox, { seed }); m.heightAt = (x, z) => hf(Math.round(x), Math.round(z)) + 1; return m; }
  // voxel tree: trunk + a lumpy leaf ball
  function tree(seed = 1, { h = 4, r = 2.2, leaf = '#3f9a3a', leaf2 = '#5bb14a', trunk = '#7a4f2e' } = {}) { const vox = [], Rn = rng(seed);
    for (let y = 0; y < h; y++) vox.push([0, y, 0, trunk]);
    for (let x = -3; x <= 3; x++) for (let y = -2; y <= 3; y++) for (let z = -3; z <= 3; z++) if (Math.hypot(x, y * 1.1, z) < r + Rn() * .6) vox.push([x, h + y, z, Rn() < .3 ? leaf2 : leaf]);
    const g = new THREE.Group(); g.add(mesh(vox, { seed })); g.children[0].position.set(-.5, 0, -.5); return g; }
  // house: walls, a stepped roof, a door, windows (their glow is a separate emissive mesh: g.glow(k))
  function house({ w = 7, d = 6, h = 4, wall = '#f0e2c4', roof = '#c8503a', roof2 = '#a8402e', door = '#6b4228' } = {}) { const vox = [], win = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) { const edge = x === 0 || z === 0 || x === w - 1 || z === d - 1; if (!edge) continue;
      const isDoor = z === d - 1 && (x === 2 || x === 3) && y < 3, isWin = y === 2 && ((z === d - 1 && x === 5) || (x === w - 1 && (z === 2 || z === 3)) || (x === 0 && z === 2));
      if (isWin) win.push([x, y, z, '#ffd36b']); else vox.push([x, y, z, isDoor ? door : (x === 0 || x === w - 1) && (z === 0 || z === d - 1) ? '#b98a5e' : wall]); }
    for (let k = 0; k <= Math.ceil(d / 2); k++) for (let x = -1; x <= w; x++) { vox.push([x, h + k, k - 1, k % 2 ? roof2 : roof]); vox.push([x, h + k, d - k, k % 2 ? roof2 : roof]); }
    for (let x = 1; x < w - 1; x++) for (let k = 1; k < Math.ceil(d / 2); k++) for (let z = k; z < d - k; z++) vox.push([x, h + k - 1, z, wall]);
    [[5, h + 1], [5, h + 2], [5, h + 3]].forEach(([x, y]) => vox.push([x, y, 1, '#8a8a8a']));   // chimney
    const g = new THREE.Group(), body = mesh(vox, { seed: 11 }), glow = mesh(win, { jitter: 0, emissive: '#ffb640' }); g.add(body, glow); g.children.forEach(c => c.position.set(-w / 2, 0, -d / 2));
    g.glow = k => { glow.material.emissiveIntensity = k; glow.material.color.set(k > .5 ? '#ffe39a' : '#bcd6e8'); }; g.chimney = [5 - w / 2 + .5, h + 4, 1 - d / 2 + .5]; return g; }
  // crop at growth k (0..1): sprout → leaves → a round head (cabbage) or tall stalk (corn)
  function crop(kind = 'cabbage') { const g = new THREE.Group(), stages = [];
    const S = kind === 'corn' ? [[[0, 0, 0, '#7cc04a']], [[0, 0, 0, '#6aae3c'], [0, 1, 0, '#7cc04a'], [1, 1, 0, '#8fd05a']], [[0, 0, 0, '#5a9e34'], [0, 1, 0, '#6aae3c'], [0, 2, 0, '#6aae3c'], [-1, 2, 0, '#8fd05a'], [0, 3, 0, '#f2c94c'], [1, 1, 0, '#8fd05a']]]
      : [[[0, 0, 0, '#7cc04a']], [[0, 0, 0, '#6aae3c'], [1, 0, 0, '#8fd05a'], [-1, 0, 0, '#8fd05a'], [0, 0, 1, '#8fd05a']], [[0, 0, 0, '#9ed36a'], [1, 0, 0, '#9ed36a'], [0, 0, 1, '#9ed36a'], [1, 0, 1, '#9ed36a'], [0, 1, 0, '#b8e27f'], [1, 1, 1, '#b8e27f'], [-1, 0, 0, '#6aae3c'], [2, 0, 1, '#6aae3c'], [0, 0, -1, '#6aae3c'], [1, 0, 2, '#6aae3c']]];
    S.forEach((v, i) => { const m = mesh(v, { seed: 20 + i }); m.scale.setScalar(.7); m.position.set(-.35, 0, -.35); m.visible = false; g.add(m); stages.push(m); });
    g.grow = k => { const i = k <= 0 ? -1 : Math.min(S.length - 1, Math.floor(k * S.length)); stages.forEach((m, j) => { m.visible = j === i; }); const f = k * S.length - Math.floor(k * S.length); g.scale.set(1, i >= 0 ? .75 + .25 * Math.min(1, f * 3) : 1, 1); }; return g; }
  // blocky farmer: legs, body, arms, head, straw hat; g.pose({ walk, wave, water })
  function farmer({ shirt = '#d9534f', pants = '#3b5b92', skin = '#f1c29a', hat = '#e8c35a', hair = '#4a3020' } = {}) { const part = (vox, px, py, pz) => { const p = new THREE.Group(), m = mesh(vox, { jitter: .02 }); m.scale.setScalar(.25); p.add(m); p.position.set(px, py, pz); return p; };
    const box = (w, h, d, c, ox = 0, oy = 0, oz = 0) => { const v = []; for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) v.push([x + ox, y + oy, z + oz, typeof c === 'function' ? c(x, y, z) : c]); return v; };
    const g = new THREE.Group();
    const legL = part(box(2, 5, 2, pants, -2, -5, -1), -.25, 1.25, 0), legR = part(box(2, 5, 2, pants, 0, -5, -1), .25, 1.25, 0);
    const body = part(box(4, 5, 2, (x, y) => y === 0 ? '#5a3a22' : shirt, -2, 0, -1), 0, 1.25, 0);
    const armL = part(box(1, 5, 2, (x, y) => y < 1 ? skin : shirt, -1, -5, -1), -.62, 2.5, 0), armR = part(box(1, 5, 2, (x, y) => y < 1 ? skin : shirt, 0, -5, -1), .62, 2.5, 0);
    const head = part([...box(4, 4, 4, (x, y, z) => z === 3 && y === 2 && (x === 1 || x === 2) ? '#2a1a10' : z === 3 && y === 0 && (x === 1 || x === 2) ? '#c98a6a' : (y === 3 && !(z === 3 && (x === 1 || x === 2))) || z === 0 ? hair : skin, -2, 0, -2), ...box(6, 1, 6, hat, -3, 5, -3), ...box(4, 2, 4, hat, -2, 6, -2), ...box(4, 1, 1, '#b8862e', -2, 5, 2), ...box(4, 1, 4, hair, -2, 4, -2)], 0, 2.5, 0);
    g.add(legL, legR, body, armL, armR, head);
    g.pose = ({ walk = 0, wave = 0, water = 0, t = 0 } = {}) => { const s = Math.sin(walk * TAU); legL.rotation.x = s * .6; legR.rotation.x = -s * .6; armL.rotation.x = -s * .5; armR.rotation.x = s * .5 - water * 1.3; armR.rotation.z = -wave * (2.4 + Math.sin(t * 14) * .3);
      body.position.y = 1.25 + Math.abs(Math.cos(walk * TAU)) * .06; head.position.y = 2.5 + Math.abs(Math.cos(walk * TAU)) * .06; head.rotation.y = Math.sin(t * .8) * .15; };
    g.can = part([...box(3, 3, 2, '#8fb3c9', 0, 0, -1), ...box(2, 1, 1, '#8fb3c9', 3, 2, -.5)], .7, 1.35, .5); armR.add(g.can); g.can.position.set(.1, -1.2, .35); g.can.visible = false; return g; }
  function chicken() { const v = [[0, 0, 0, '#f6f2e8'], [1, 0, 0, '#f6f2e8'], [0, 1, 0, '#f6f2e8'], [1, 1, 0, '#f6f2e8'], [1, 2, 0, '#f6f2e8'], [2, 2, 0, '#f0a830'], [1, 3, 0, '#d9392e'], [-1, 1, 0, '#e8e2d4']]; const g = new THREE.Group(), m = mesh(v, { jitter: .02 }); m.scale.setScalar(.3); m.position.set(-.15, 0, -.15); g.add(m); return g; }
  function cloud(seed = 1, s = 1) { const vox = [], Rn = rng(seed); for (let x = -5; x <= 5; x++) for (let y = 0; y <= 2; y++) for (let z = -3; z <= 3; z++) if (Math.hypot(x / 1.6, y * 1.4, z) < 3 + Rn()) vox.push([x, y, z, '#ffffff']); const m = mesh(vox, { jitter: .03, seed }); m.material.emissive = new THREE.Color('#8a8a9a'); m.castShadow = false; m.scale.setScalar(s); return m; }
  // stage: gradient sky (set per time of day with sky([top, bottom])), sun light with soft shadows, hemisphere fill, long lens
  function stage({ fov = 24 } = {}) { const scene = new THREE.Scene(), c = mk(4, 256), gg = g2(c), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; scene.background = tex;
    const hemi = new THREE.HemisphereLight('#dfefff', '#6a5a4a', 1.1), sun = new THREE.DirectionalLight('#fff4de', 2.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 140 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .03; sun.shadow.radius = 5; scene.add(hemi, sun, sun.target);
    const cam = new THREE.PerspectiveCamera(fov, W / H, .5, 600);
    const sky = ([a, b]) => { const g = gg.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, a); g.addColorStop(1, b); gg.fillStyle = g; gg.fillRect(0, 0, 4, 256); tex.needsUpdate = true; };
    return { scene, cam, sun, hemi, sky }; }
  // time of day u (0 dawn … .5 noon … 1 dusk … 1.25 night): sky colours, sun direction and colour, fill
  const KEYS = [[0, ['#f7b58a', '#ffe3c2'], '#ffb27a', 1.6, .7, .15], [.35, ['#7fc4f0', '#d9f0ff'], '#fff4de', 2.5, 1.15, .9], [.75, ['#6aa9e0', '#ffd7a8'], '#ffd6a0', 2.2, 1, .6], [1, ['#4a3a7a', '#f08a5d'], '#ff9a60', 1.4, .7, .2], [1.25, ['#0d1330', '#2a2a5a'], '#8aa0ff', .35, .35, -.2]];
  function daylight(st, u) { let i = 0; while (i < KEYS.length - 2 && u > KEYS[i + 1][0]) i++; const [a, b] = [KEYS[i], KEYS[i + 1]], k = clamp((u - a[0]) / (b[0] - a[0]), 0, 1), mix = (p, q) => '#' + new THREE.Color(p).lerp(new THREE.Color(q), k).getHexString();
    st.sky([mix(a[1][0], b[1][0]), mix(a[1][1], b[1][1])]); st.sun.color.set(mix(a[2], b[2])); st.sun.intensity = lerp(a[3], b[3], k); st.hemi.intensity = lerp(a[4], b[4], k);
    const el = lerp(a[5], b[5], k), az = -.9 + u * 1.6; st.sun.position.set(Math.cos(az) * 40 * Math.cos(Math.max(el, .15)), 40 * Math.sin(Math.max(el, .15)), Math.sin(az) * 40 + 20); }
  function aim(cam, { at = [0, 0, 0], az = .7, el = .45, dist = 70 } = {}) { cam.position.set(at[0] + dist * Math.cos(el) * Math.sin(az), at[1] + dist * Math.sin(el), at[2] + dist * Math.cos(el) * Math.cos(az)); cam.lookAt(...at); }
  // tilt-shift: blur bands at the top and bottom of the frame (reads as a miniature)
  const TS = mk(W, H), TG = g2(TS);
  function frame(ctx, scene, cam, { tilt = 1 } = {}) { R.render(scene, cam); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.domElement, 0, 0, W, H); if (tilt <= 0) return;
    TG.globalCompositeOperation = 'source-over'; TG.clearRect(0, 0, W, H); TG.filter = 'blur(9px)'; TG.drawImage(R.domElement, 0, 0, W, H); TG.filter = 'none';
    const m = TG.createLinearGradient(0, 0, 0, H); m.addColorStop(0, `rgba(0,0,0,${tilt})`); m.addColorStop(.3, 'rgba(0,0,0,0)'); m.addColorStop(.72, 'rgba(0,0,0,0)'); m.addColorStop(1, `rgba(0,0,0,${tilt})`);
    TG.globalCompositeOperation = 'destination-in'; TG.fillStyle = m; TG.fillRect(0, 0, W, H); TG.globalCompositeOperation = 'source-over'; ctx.drawImage(TS, 0, 0); }
  const V2 = new THREE.Vector3(); const project = (p, cam) => { V2.set(...p).project(cam); return [(V2.x + 1) / 2 * W, (1 - V2.y) / 2 * H]; };
  return { R, mesh, model, island, tree, house, crop, farmer, chicken, cloud, stage, daylight, aim, frame, project };
})();
