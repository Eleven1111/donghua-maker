// ═══ BRICK 3D toolkit (three.js r158, inlined above the film script; see references/looks/brick3d.md) ═══════════
// Studded plastic bricks on a flat colour ground, one soft sun, a long-lens camera, bricks raining in and snapping into
// sub-assemblies. Every pose is a pure function of time (no state), so seeking, stills and export stay exact.
const SMOOTH_DEFAULT = true, POST_GRAIN = .12, VIGN_TONE = ['40,70,90', .03, .1];
const B3 = (() => {
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.VSMShadowMap;   // VSM: blurred, large soft shadows like a studio softbox
  R.outputColorSpace = THREE.SRGBColorSpace;
  const ACC = mk(W, H), AG = g2(ACC);
  const PAL = { o: '#e2742b', a: '#f3a836', w: '#f3f2ec', l: '#a6aaae', d: '#5d6166', k: '#2c2e31', y: '#f6c431', r: '#d8412f', b: '#3f7fc1', g: '#5aa45a' };
  const U = 1, BH = 1.2, PH = .4, GAP = .03;              // stud pitch, brick and plate heights, seam between bricks
  const geo = {}, mat = {};
  const box = (w, h, d) => geo[`b${w},${h},${d}`] || (geo[`b${w},${h},${d}`] = new THREE.BoxGeometry(w * U - GAP, h - GAP, d * U - GAP));
  const stud = () => geo.stud || (geo.stud = new THREE.CylinderGeometry(.3, .3, .18, 20));
  const paint = col => mat[col] || (mat[col] = new THREE.MeshStandardMaterial({ color: new THREE.Color(PAL[col] || col), roughness: .36, metalness: 0 }));
  // one brick (w×d studs, h = BH or PH) as a group whose origin is its bottom-centre
  function brick(w, d, h, col, { studs = true } = {}) {
    const g = new THREE.Group(), m = new THREE.Mesh(box(w, h, d), paint(col));
    m.position.y = h / 2; m.castShadow = m.receiveShadow = true; g.add(m);
    if (studs) for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
      const s = new THREE.Mesh(stud(), paint(col)); s.position.set((i - (w - 1) / 2) * U, h + .09, (j - (d - 1) / 2) * U); s.castShadow = true; g.add(s);
    }
    return g;
  }
  // model from ASCII layers, bottom first: each layer is rows of palette keys ('.' = empty); `h` per layer (BH or PH).
  // Cells merge greedily into standard bricks (2×4 … 1×1). Studs only where nothing sits on top.
  const SIZES = [[2, 4], [4, 2], [2, 3], [3, 2], [2, 2], [1, 4], [4, 1], [1, 3], [3, 1], [1, 2], [2, 1], [1, 1]];
  function parts(layers, { h = BH } = {}) {
    const out = [], hs = layers.map(L => L.h || h), rows = layers.map(L => L.rows || L);
    const nz = Math.max(...rows.map(r => r.length)), nx = Math.max(...rows.flatMap(r => r.map(s => s.length)));
    let y = 0;
    rows.forEach((L, li) => {
      const used = L.map(r => [...r].map(c => c === '.' || c === ' '));
      const at = (x, z) => (L[z] || '')[x] || '.';
      for (let z = 0; z < L.length; z++) for (let x = 0; x < nx; x++) {
        if (used[z][x] === undefined || used[z][x]) continue;
        const c = at(x, z);
        const [w, d] = SIZES.find(([w, d]) => { for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (at(x + i, z + j) !== c || used[z + j]?.[x + i]) return false; return true; });
        for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) used[z + j][x + i] = true;
        const above = rows[li + 1], covered = above && [...Array(w)].every((_, i) => [...Array(d)].every((_, j) => ((above[z + j] || '')[x + i] || '.') !== '.'));
        out.push({ x: x + w / 2 - nx / 2, z: z + d / 2 - nz / 2, y, w, d, h: hs[li], col: c, studs: !covered });
      }
      y += hs[li];
    });
    out.forEach((p, i) => { p.i = i; p.seed = hash(i, 7); });
    return out;
  }
  // meshes for a part list; returns a group with .parts (each mesh remembers its home position)
  function build(ps) {
    const g = new THREE.Group(); g.parts = ps.map(p => { const m = brick(p.w, p.d, p.h, p.col, { studs: p.studs }); m.userData = p; g.add(m); return m; });
    const top = Math.max(...ps.map(p => p.y + p.h)); g.height = top; return g;
  }
  const eOut = u => 1 - Math.pow(1 - u, 3), eBack = u => { const c = 1.4; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  // bricks fall in bottom-up, one every `gap` s from t0, each taking `dur` s; spin and lateral drift fade out as they land
  function assemble(g, t, { t0 = 0, gap = .04, dur = .5, fall = 7, drift = 2.5, spin = 1.2 } = {}) {
    for (const m of g.parts) {
      const p = m.userData, u = clamp((t - t0 - p.i * gap) / dur, 0, 1);
      m.visible = u > 0;
      const k = 1 - eBack(u), s = p.seed * 6.283;
      m.position.set(p.x + Math.cos(s) * drift * k * k, p.y + fall * (1 - eOut(u)), p.z + Math.sin(s) * drift * k * k);
      m.rotation.set(spin * k * Math.sin(s * 3), spin * k * Math.cos(s * 2), spin * k * Math.sin(s));
    }
    return clamp((t - t0 - (g.parts.length - 1) * gap) / dur, 0, 1);   // 1 when the last brick has landed
  }
  function done(g) { for (const m of g.parts) { const p = m.userData; m.visible = true; m.position.set(p.x, p.y, p.z); m.rotation.set(0, 0, 0); } }
  // stage: flat-colour world, shadow-only ground, sky fill + one soft sun, long lens
  function stage({ bg = '#a9d8ee', sun = [14, 24, -6], shadow = .26, fov = 26, soft = 12 } = {}) {
    const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
    scene.add(new THREE.HemisphereLight('#ffffff', '#9fc7dc', 1.7));
    const L = new THREE.DirectionalLight('#fffaf0', 2.4); L.position.set(...sun); L.castShadow = true;
    L.shadow.mapSize.set(2048, 2048); Object.assign(L.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 }); L.shadow.bias = -.0006; L.shadow.radius = soft; L.shadow.blurSamples = 16;
    scene.add(L);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: shadow })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const cam = new THREE.PerspectiveCamera(fov, W / H, .5, 600);
    return { scene, cam, sun: L };
  }
  // aim the camera: orbit angle `az` (rad), elevation `el` (rad), distance `dist`, looking at `at`
  function aim(cam, { at = [0, 2, 0], az = .8, el = .5, dist = 40 } = {}) {
    cam.position.set(at[0] + dist * Math.cos(el) * Math.sin(az), at[1] + dist * Math.sin(el), at[2] + dist * Math.cos(el) * Math.cos(az)); cam.lookAt(...at);
  }
  // draw one film frame: pose(t) sets the scene for time t and returns [scene, cam]. blur>1 averages that many sub-frames
  // across `shutter` seconds before t (motion blur on anything moving, camera included).
  // Live playback uses at most LIVE_BLUR sub-frames so it keeps up in a browser; stills and export (which seek) get all of them.
  const LIVE_BLUR = 3;
  function frame(ctx, t, pose, { blur = 1, shutter = 1 / 40 } = {}) {
    if (film.playing && !film.seeking) blur = Math.min(blur, LIVE_BLUR);
    if (blur <= 1) { const [s, c] = pose(t); R.render(s, c); ctx.drawImage(R.domElement, 0, 0, W, H); return; }
    AG.globalCompositeOperation = 'source-over';
    for (let k = 0; k < blur; k++) { const [s, c] = pose(t - shutter * (blur - 1 - k) / (blur - 1)); R.render(s, c); AG.globalAlpha = 1 / (k + 1); AG.drawImage(R.domElement, 0, 0); }
    AG.globalAlpha = 1; ctx.drawImage(ACC, 0, 0, W, H);
  }
  // round part (eye, wheel, dial): radius r, depth d along +z, bottom-centre origin on its back face
  function disc(r, d, col, { seg = 32 } = {}) {
    const k = `c${r},${d},${seg}`, m = new THREE.Mesh(geo[k] || (geo[k] = new THREE.CylinderGeometry(r, r, d, seg)), paint(col));
    m.rotation.x = Math.PI / 2; m.position.z = d / 2; m.castShadow = m.receiveShadow = true; const g = new THREE.Group(); g.add(m); return g;
  }
  // film times at which each brick of an assemble() call lands (for click sounds); every `every`-th brick
  const landings = (g, { t0 = 0, gap = .04, dur = .5 } = {}, every = 2) => g.parts.filter((_, i) => i % every === 0).map(m => t0 + m.userData.i * gap + dur * .72);
  // a finished sub-assembly dropping from `lift` above its home y onto it between t0 and t0+dur (lands with a tiny bounce)
  function drop(g, t, { t0, dur = .45, lift = 6, home = 0 }) { const u = clamp((t - t0) / dur, 0, 1), v = clamp((t - t0 - dur) / .22, 0, 1); g.position.y = home + lift * (1 - u * u) + .3 * Math.sin(v * Math.PI); return u; }
  // render the scene once into a new 2D canvas (for printed pages): bg overrides the background colour
  function snapshot(scene, cam, w, h, { bg = '#ffffff' } = {}) {
    const old = scene.background; scene.background = new THREE.Color(bg); R.render(scene, cam); scene.background = old;
    const c = mk(w, h), g = g2(c), s = Math.max(w / W, h / H); g.drawImage(R.domElement, (w - W * s) / 2, (h - H * s) / 2, W * s, H * s); return c;
  }
  // a printed page: plane of w×h world units showing a 2D canvas; back = second canvas (or plain paper)
  function page(w, h, front, back = null) {
    const g = new THREE.Group(), tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    const mk1 = (c, flip) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: c ? tex(c) : null, color: c ? '#ffffff' : '#f4f2ec', roughness: .9, side: THREE.FrontSide }));
      m.position.x = w / 2; if (flip) { m.rotation.y = Math.PI; } m.castShadow = true; m.receiveShadow = true; return m; };
    g.add(mk1(front, false)); g.add(mk1(back, true)); g.children[1].position.x = w / 2; return g;
  }
  return { R, PAL, U, BH, PH, brick, parts, build, assemble, done, stage, aim, frame, eOut, eBack, disc, landings, drop, snapshot, page };
})();
