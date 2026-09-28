// ═══ PAPER3D toolkit (立体纸艺剧场, three.js r158 inlined above the film script): the paper cut-out look as a real paper
// theatre — every piece is a card with thickness, a hand-cut slightly irregular edge and a white core showing on the cut, a
// fibre texture that catches the light; layers stand at different depths and cast soft shadows on the layers behind them; the
// camera dollies so the layers slide past each other (parallax). Puppets are jointed cards on pins that move at 12 poses/s with
// a small per-exposure boil. Every pose is a pure function of time. references/looks/paper3d.md
const SMOOTH_DEFAULT = false, POST_GRAIN = .1, VIGN_TONE = ['40,25,10', .08, .3];
const P3 = (() => {
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace;
  // paper fibre texture (grey-scale, multiplied with the card colour) and the same field as a bump map
  const FIB = (() => { const N = 512, c = mk(N, N), g = g2(c), Rn = rng(31); g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 9000; i++) { const x = Rn() * N, y = Rn() * N, l = 4 + Rn() * 14, a = Rn() * TAU; g.strokeStyle = Rn() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(120,110,95,.12)'; g.lineWidth = .6 + Rn(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(90,80,60,${Rn() * .06})`; g.fillRect(Rn() * N, Rn() * N, 2, 2); } return c; })();
  const tex = (rep, color) => { const t = new THREE.CanvasTexture(FIB); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; };
  const MAP = tex(.35, true), BUMP = tex(.35, false), mats = {};
  const face = col => mats[col] || (mats[col] = new THREE.MeshStandardMaterial({ color: col, map: MAP, bumpMap: BUMP, bumpScale: .6, roughness: .95, metalness: 0 }));
  const core = new THREE.MeshStandardMaterial({ color: '#fbf8f0', map: MAP, roughness: 1 });
  // a hand-cut outline: subdivide the polygon and nudge each point a little (seeded), so no edge is perfectly straight
  function cutPts(pts, { jag = .04, step = .25, seed = 1 } = {}) { const Rn = rng(seed), out = [];
    pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step));
      for (let k = 0; k < n; k++) { const u = k / n; out.push([lerp(p[0], q[0], u) + (Rn() - .5) * jag, lerp(p[1], q[1], u) + (Rn() - .5) * jag]); } }); return out; }
  // a card from a 2D outline (x right, y up), thickness d: faces take the colour, the cut edge shows the white core
  function card(pts, col, { d = .05, jag = .04, seed = 1, holes = [] } = {}) { const cp = cutPts(pts, { jag, seed }), sh = new THREE.Shape(cp.map(p => new THREE.Vector2(...p)));
    holes.forEach(h => sh.holes.push(new THREE.Path(cutPts(h, { jag: jag * .5, seed: seed + 7 }).map(p => new THREE.Vector2(...p)))));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 4 }); geo.translate(0, 0, -d);
    const uv = geo.attributes.uv, pos = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getY(i));   // world-scale fibres
    const m = new THREE.Mesh(geo, [face(col), core]); m.castShadow = m.receiveShadow = true; return m; }
  // outline helpers (2D point lists)
  const circle = (cx, cy, r, n = 40, sq = 1) => [...Array(n)].map((_, i) => [cx + Math.cos(i / n * TAU) * r, cy + Math.sin(i / n * TAU) * r * sq]);
  const ridge = (x0, x1, base, fn, n = 60) => { const p = [[x0, base]]; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); p.push([x, fn(x)]); } p.push([x1, base]); return p; };
  const blobUnion = (circles, n = 90) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; let r = 0; const cx = circles.reduce((s, c) => s + c[0], 0) / circles.length, cy = circles.reduce((s, c) => s + c[1], 0) / circles.length;
      circles.forEach(([x, y, rr]) => { const dx = x - cx, dy = y - cy, b = dx * Math.cos(a) + dy * Math.sin(a), c = dx * dx + dy * dy - rr * rr, disc = b * b - c; if (disc >= 0) r = Math.max(r, b + Math.sqrt(disc)); }); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
  const cloud = (col = '#ffffff', s = 1, seed = 1) => card(blobUnion([[-1.2 * s, 0, .7 * s], [0, .35 * s, .95 * s], [1.2 * s, 0, .65 * s], [.4 * s, -.2 * s, .7 * s], [-.5 * s, -.25 * s, .6 * s]]), col, { seed, d: .06 });
  // a pinned part: group whose origin is the pin; the card is offset so it hangs from the pin
  function part(pts, col, pin, o = {}) { const g = new THREE.Group(), m = card(pts, col, o); m.position.set(-pin[0], -pin[1], 0); g.add(m); return g; }
  // stage: a coloured back card, warm key from the front-left-top (shadows fall back onto the layers), cool fill, perspective camera
  function stage({ bg = '#bfe2e8', key = [-8, 12, 16], fov = 30 } = {}) { const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
    scene.add(new THREE.HemisphereLight('#fff8ec', '#9aa8b8', 1.2)); const L = new THREE.DirectionalLight('#fff1d8', 2.2); L.position.set(...key); L.castShadow = true; L.shadow.mapSize.set(2048, 2048);
    Object.assign(L.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18, near: 1, far: 80 }); L.shadow.bias = -.0004; L.shadow.normalBias = .02; L.shadow.radius = 7; scene.add(L, L.target);
    const cam = new THREE.PerspectiveCamera(fov, W / H, .3, 300); return { scene, cam, key: L }; }
  function aim(cam, { at = [0, 0, 0], x = 0, y = 0, z = 26 } = {}) { cam.position.set(at[0] + x, at[1] + y, at[2] + z); cam.lookAt(...at); }
  const boil = (o, e, id, a = 1) => { o.rotation.z += (hash(e, id) - .5) * .02 * a; o.position.x += (hash(e, id + 1) - .5) * .02 * a; o.position.y += (hash(e, id + 2) - .5) * .02 * a; };
  function frame(ctx, scene, cam) { R.render(scene, cam); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.domElement, 0, 0, W, H); }
  const V = new THREE.Vector3(); const project = (p, cam) => { V.set(...p).project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H]; };
  return { R, card, part, cutPts, circle, ridge, blobUnion, cloud, stage, aim, boil, frame, project, face };
})();
