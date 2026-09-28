// ═══ FLATSCI toolkit (扁平科普, three.js r158 inlined above the film script): the flat science-explainer look built in real 3D.
// Deep indigo-violet space with twinkling stars and nebula glows; planets are real spheres in two-tone toon shading (a hard
// terminator where the sun's light really falls, a violet shadow side), flat continents and cloud pills on the surface, a cyan
// atmosphere rim; candy accents; bold rounded white captions drawn over the frame; dashed orbits. Because light is real, moon
// phases come out of the geometry. Studied from the general language of flat science animation; no specific film or studio
// artwork is copied. Every pose is a pure function of time. references/looks/flatsci.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .025, VIGN_TONE = ['10,0,40', 0, .4];
const FS = { sp0: '#2a1f6b', sp1: '#0c0a2a', ocean: '#2f7fe0', ocean2: '#2466c4', land: '#6bd07a', land2: '#4fb266', ice: '#eef4ff', cloud: '#f4f7ff', cyan: '#4fe0ff', pink: '#ff6fae', yellow: '#ffd54a', white: '#ffffff', moon: '#cfd3e6', moonDark: '#4a4a74', sun: '#ffcf4a', shade: '#5a4bb8' };
const fsFam = () => ((window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : '') + '"Arial Rounded MT Bold", sans-serif';
// ── 2D captions over the frame (screen pixels)
function fsTitle(g, str, x, y, size, k, o = {}) { if (k <= 0) return; const e = eo(clamp(k, 0, 1)); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = e; g.fillStyle = o.col ?? FS.white; g.font = `800 ${size}px ${fsFam()}`; g.textAlign = o.align ?? 'center'; g.shadowColor = 'rgba(10,0,40,.5)'; g.shadowBlur = 20; g.fillText(str, x, y + (1 - e) * 30);
  if (o.sub) { g.font = `600 ${size * .36}px ${fsFam()}`; g.fillStyle = o.subCol ?? 'rgba(255,255,255,.7)'; if ('letterSpacing' in g) g.letterSpacing = `${size * .06}px`; g.fillText(o.sub, x, y + size * .62 + (1 - e) * 30); } g.restore(); }
function fsCallout(g, px, py, tx, ty, str, k, col = FS.yellow) { if (k <= 0) return; const e = eo(clamp(k, 0, 1)); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = e; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(px, py, 9, 0, TAU); g.fill(); g.beginPath(); g.moveTo(px, py); g.lineTo(lerp(px, tx, e), lerp(py, ty, e)); g.stroke();
  g.font = `700 52px ${fsFam()}`; g.textAlign = tx < px ? 'right' : 'left'; g.fillText(str, tx + (tx < px ? -16 : 16), ty + 18); g.restore(); }
const F3 = (() => {
  const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false); R.outputColorSpace = THREE.SRGBColorSpace;
  // two-tone toon ramp: shadow side / lit side (the ambient light tints the shadow violet)
  const ramp = new THREE.DataTexture(new Uint8Array([0, 255]), 2, 1, THREE.RedFormat); ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const toon = (col, map = null, o = {}) => new THREE.MeshToonMaterial({ color: map ? '#ffffff' : col, map, gradientMap: ramp, ...o });
  const ctex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  // 3D value noise (seamless on a sphere when sampled by direction)
  const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }, sm = u => u * u * (3 - 2 * u);
  function vn(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = sm(x - xi), v = sm(y - yi), w = sm(z - zi), L = (a, b, k) => a + (b - a) * k, c = (i, j, k) => h3(xi + i, yi + j, zi + k);
    return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w); }
  const fbm = (x, y, z) => vn(x, y, z) * .6 + vn(x * 2.2, y * 2.2, z * 2.2) * .28 + vn(x * 4.7, y * 4.7, z * 4.7) * .12;
  // equirect canvas painted per pixel from direction: f(dir) → css colour
  function equi(w, h, f) { const c = mk(w, h), g = g2(c), img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) { const lat = (.5 - y / h) * Math.PI; for (let x = 0; x < w; x++) { const lon = x / w * TAU, d = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)], col = f(d, lat), i = (y * w + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = col[3] ?? 255; } }
    g.putImageData(img, 0, 0); return c; }
  const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  // Earth-like planet: flat ocean, two-tone land blobs, ice caps; cloud pills on a shell; a cyan atmosphere rim
  function planet(r, { seed = 1, land = .56, clouds = 18, atmo = FS.cyan } = {}) {
    const O = rgbOf(FS.ocean), L1 = rgbOf(FS.land), L2 = rgbOf(FS.land2), I = rgbOf(FS.ice), o = seed * 13.7;
    const surf = equi(1024, 512, (d, lat) => { if (Math.abs(lat) > 1.25 + vn(d[0] * 5 + o, 0, d[2] * 5) * .12) return I; const n = fbm(d[0] * 1.9 + o, d[1] * 1.9, d[2] * 1.9); return n > land + .06 ? L2 : n > land ? L1 : O; });
    const g = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64), toon(null, ctex(surf))); g.add(body); g.body = body;
    const cc = mk(1024, 512), cg = g2(cc), rr = rng(seed + 5); cg.fillStyle = FS.cloud;
    for (let i = 0; i < clouds; i++) { const x = rr() * 1024, y = 90 + rr() * 330, w = 60 + rr() * 120, h = 16 + rr() * 14; [-1024, 0, 1024].forEach(dx => { cg.beginPath(); cg.roundRect(x + dx, y, w, h, h / 2); cg.fill(); if (rr() < .5) { cg.beginPath(); cg.roundRect(x + dx + w * .3, y - h * .8, w * .5, h, h / 2); cg.fill(); } }); }
    const cl = new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, 96, 64), toon(null, ctex(cc), { transparent: true, alphaTest: .4 })); g.add(cl); g.clouds = cl;
    const at = new THREE.Mesh(new THREE.SphereGeometry(r * 1.12, 64, 48), new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(atmo) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - abs(dot(vN, vV)), 3.); gl_FragColor = vec4(c, f * .9); }' }));
    g.add(at); g.spin = t => { body.rotation.y = t; cl.rotation.y = t * 1.35; }; return g; }
  // moon: pale disc with craters (lighter rims), two-tone lit by the same sun
  function moon(r, seed = 7) { const M = rgbOf(FS.moon), C = rgbOf('#aeb2cc'), Rm = rgbOf('#e3e6f4'), rr = rng(seed), cr = [...Array(26)].map(() => { const lat = (rr() - .5) * 2.4, lon = rr() * TAU; return [[Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)], .08 + rr() * .16]; });
    const tex = equi(512, 256, d => { for (const [c, s] of cr) { const a = Math.acos(clamp(d[0] * c[0] + d[1] * c[1] + d[2] * c[2], -1, 1)); if (a < s * .8) return C; if (a < s) return Rm; } return M; });
    return new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), toon(null, ctex(tex))); }
  // round glow sprite (additive)
  function glow(size, col, a = .5) { const c = mk(256, 256), g = g2(c), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128), [r, gg, b] = rgbOf(col); gr.addColorStop(0, `rgba(${r},${gg},${b},${a})`); gr.addColorStop(.4, `rgba(${r},${gg},${b},${a * .35})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.set(size, size, 1); return s; }
  function sun(r) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshBasicMaterial({ color: FS.sun }))); [[5.2, .35], [3.2, .45], [2.1, .6]].forEach(([m, a]) => g.add(glow(r * m, '#ffc850', a))); return g; }
  // space: indigo gradient backdrop, nebula glows, three layers of stars; returns { twinkle(t) }
  function space(scene, { seed = 3 } = {}) { const c = mk(4, 256), g = g2(c), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, FS.sp0); gr.addColorStop(1, FS.sp1); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); scene.background = ctex(c);
    const rr = rng(seed), dot = mk(32, 32), dg = g2(dot); dg.fillStyle = '#fff'; dg.beginPath(); dg.arc(16, 16, 14, 0, TAU); dg.fill(); const dt = ctex(dot);
    const layers = [[500, 3], [180, 5], [50, 8]].map(([n, sz]) => { const p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = rr() * 2 - 1, a = rr() * TAU, s = Math.sqrt(1 - u * u); p.set([s * Math.cos(a) * 160, u * 160, s * Math.sin(a) * 160], i * 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: sz, sizeAttenuation: false, map: dt, transparent: true, alphaTest: .1, depthWrite: false, color: '#ffffff' })); scene.add(pts); return pts; });
    [[-60, 30, -120, 150, '#7850dc'], [70, -25, -130, 170, '#3c78e6'], [10, 60, -140, 120, '#9a5ad8'], [-80, -50, -110, 130, '#3c78e6']].forEach(([x, y, z, s, col]) => { const n = glow(s, col, .22); n.position.set(x, y, z); scene.add(n); });
    return { twinkle: t => layers.forEach((L, i) => { L.material.opacity = .55 + .35 * Math.sin(t * (1.3 + i * .7) + i * 2); }) }; }
  // stage: space + ambient (violet shadow side) + the sun's directional light
  function stage({ sunPos = [-40, 0, 0], seed = 3, fov = 32 } = {}) { const scene = new THREE.Scene(), sp = space(scene, { seed });
    scene.add(new THREE.AmbientLight(FS.shade, 1.3)); const L = new THREE.DirectionalLight('#fff6e0', 2.4); L.position.set(...sunPos); scene.add(L); scene.add(L.target);
    const cam = new THREE.PerspectiveCamera(fov, W / H, .1, 600); return { scene, cam, light: L, space: sp }; }
  function aim(cam, { at = [0, 0, 0], az = 0, el = .1, dist = 14 } = {}) { cam.position.set(at[0] + dist * Math.cos(el) * Math.sin(az), at[1] + dist * Math.sin(el), at[2] + dist * Math.cos(el) * Math.cos(az)); cam.lookAt(...at); }
  // dashed orbit of radius r in the xz plane; o.grow(k) draws it on from the start angle
  function orbit(r, { col = '#ffffff', a0 = Math.PI, seg = 256 } = {}) { const p = []; for (let i = 0; i <= seg; i++) { const a = a0 + i / seg * TAU; p.push(new THREE.Vector3(Math.cos(a) * r, 0, -Math.sin(a) * r)); }
    const geo = new THREE.BufferGeometry().setFromPoints(p), l = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: col, dashSize: r * .07, gapSize: r * .05, transparent: true, opacity: .5 })); l.computeLineDistances();
    l.grow = k => { geo.setDrawRange(0, Math.round(clamp(k, 0, 1) * (seg + 1))); l.visible = k > 0; }; return l; }
  const V = new THREE.Vector3();
  const project = (p, cam) => { V.set(...p).project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H]; };
  function frame(ctx, scene, cam) { R.setScissorTest(false); R.setViewport(0, 0, W, H); R.render(scene, cam); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.domElement, 0, 0, W, H); }
  // several small views over one full-frame backdrop: views = [{ scene, cam, rect: [x, y, w, h] (canvas px, y down), before() }]
  function views(ctx, bg, list) { R.setScissorTest(false); R.setViewport(0, 0, W, H); R.render(bg[0], bg[1]); const ac = R.autoClear; R.autoClear = false; R.setScissorTest(true);
    list.forEach(({ scene, cam, rect: [x, y, w, h], before }) => { if (before) before(); const gy = H - y - h; R.setViewport(x, gy, w, h); R.setScissor(x, gy, w, h); R.clearDepth(); R.render(scene, cam); });
    R.setScissorTest(false); R.autoClear = ac; R.setViewport(0, 0, W, H); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.domElement, 0, 0, W, H); }
  return { R, toon, planet, moon, sun, glow, space, stage, aim, orbit, project, frame, views };
})();
