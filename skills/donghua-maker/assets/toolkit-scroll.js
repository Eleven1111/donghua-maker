// ── long scroll: one horizontal scroll of worlds laid end to end, one world per shot, a hero walking left to right ──
// through all of them. Crossing a seam changes the world AND the hero's drawing; the camera only ever moves forward.
// references/looks/scroll.md has the rules; this file is the skeleton.
//
//   SCROLL.add(S1, { name: '纸村', w: 3600,
//     back(g, S) { … },  front(g, S) { … },           // draw in WORLD-LOCAL x (0 … w); screen y. S below.
//     hero(g, x, y, h, phase, S) { … },               // the hero in this world's material: feet at (x, y), h tall,
//                                                     //   phase 0…1 = gait cycle (continuous across seams)
//     end: 'stop' | 'exit',                           // last world only: rest where the camera stops (default) or walk out
//     seam(g, y, S) { … },                            // optional: the edge this world enters on, drawn at local x 0
//     ground: lx => y,                                // optional bridges/steps; must return GROUND within 150 px of each end
//     acts: [{ at: 1500, dur: 1.2, lead: 200, pose: u => phase }] });   // stop at local x `at` for `dur` s
//   S = { camX (world-local camera left edge), T (film s), lt (s since this world's shot began), hx, hy (hero feet,
//         local), act: { i, u } | null (u = s into the act), e (exposure index, for boil), W, H, G (ground y) }
//
// Timing comes from the shots: each world lasts its shot (scaffold --durs, so every seam lands on the beat); the walking
// speed in a world is derived from its width minus its acts. Keep w / (walking time) close across worlds (SCROLL.speeds
// reports them) or the stride visibly changes at a seam.
const SCROLL = {
  worlds: [], GROUND: H * .74, HERO_H: H * .30, HERO_X: W * .36, START_X: W * .22,
  LABEL_X: W * .04, LABEL_Y: H * .06,   // portrait for 小红书: W * .08, H * .165 (inside the 3:4 crop and its UI margins)
  overlay: null,      // (g, T) => …: whole-screen layer above every world (a hook title, a caption); not clipped at seams
  add(shot, world) {
    world.shot = shot; this.worlds.push(world); this._plan = null;
    shot.cam = st => ({ x: SCROLL.camAt(shot.t0 + st) + W / 2, y: H / 2, z: 1 });   // the real camera, for qa.py
    shot.draw = (g, st, sq, e) => SCROLL.draw(g, shot.t0 + st, e);
    for (const k of ['reset', 'step', 'snap']) if (!shot[k]) shot[k] = () => {};
    shot.build = () => { if (world.build) world.build.call(world); };   // the engine builds shots; the world bakes its own sprites
    if (!shot.score) shot.score = () => [];
    return world;
  },
  layout() {
    if (this._plan) return this._plan;
    let x = 0, walked = 0; const plan = [], speeds = [];
    this.worlds.forEach((wd, k) => {
      wd.x0 = x; wd.x1 = x + wd.w;
      const acts = (wd.acts || []).slice().sort((a, b) => a.at - b.at), t0 = wd.shot.t0, t1 = wd.shot.t1;
      const lx0 = k === 0 ? Math.min(this.START_X, (acts[0] ? acts[0].at : wd.w) - 60) : 0;   // frame 0 shows the whole hero
      // the last world brings him to rest where the camera stops (his usual screen x), unless it says end: 'exit'
      const last = k === this.worlds.length - 1, xEnd = last && wd.end !== 'exit' ? wd.w - (W - this.HERO_X) : wd.w;
      const actT = acts.reduce((a, q) => a + q.dur, 0), dist = xEnd - lx0;
      if (actT >= t1 - t0) throw new Error(`scroll world ${wd.name}: acts (${actT}s) leave no time to walk in a ${t1 - t0}s shot`);
      const v = dist / (t1 - t0 - actT); speeds.push(Math.round(v));
      let t = t0, lx = lx0;
      for (const a of acts) {
        const tw = (a.at - lx) / v;
        plan.push({ wd, kind: 'walk', t0: t, t1: t + tw, x0: x + lx, x1: x + a.at, d0: walked }); walked += a.at - lx; t += tw;
        plan.push({ wd, kind: 'act', act: a, i: acts.indexOf(a), t0: t, t1: t + a.dur, x0: x + a.at, x1: x + a.at, d0: walked }); t += a.dur; lx = a.at;
      }
      plan.push({ wd, kind: 'walk', t0: t, t1: t1, x0: x + lx, x1: x + xEnd, d0: walked }); walked += xEnd - lx;
      for (const lxe of [0, wd.w]) if (wd.ground && Math.abs(wd.ground(lxe) - this.GROUND) > 2) throw new Error(`scroll world ${wd.name}: ground at x=${lxe} is ${wd.ground(lxe)}, must be GROUND (${this.GROUND}) at both ends`);
      x += wd.w;
    });
    this.total = x; this.speeds = speeds; return (this._plan = plan);
  },
  heroAt(T) {
    const plan = this.layout(), p = plan.find(q => T >= q.t0 && T < q.t1) || plan[plan.length - 1];
    const u = clamp((T - p.t0) / Math.max(1e-6, p.t1 - p.t0), 0, 1), x = lerp(p.x0, p.x1, u);
    const walked = p.d0 + (p.kind === 'walk' ? x - p.x0 : 0);
    return { x, p, u: T - p.t0, walked };
  },
  // camera: target = hero x − HERO_X + an act's lead; running maximum (never back); Gaussian smoothing keeps it monotonic
  camAt(T) {
    if (!this._cam) {
      this.layout(); const R = 60, n = Math.ceil(DUR * R) + 2, raw = new Float64Array(n); let mx = -1e9;
      for (let k = 0; k < n; k++) {
        const h = this.heroAt(k / R), lead = h.p.kind === 'act' ? (h.p.act.lead ?? W * .08) * smooth(0, .6, h.u) : 0;
        mx = Math.max(mx, h.x - this.HERO_X + lead); raw[k] = mx;
      }
      const sig = .14 * R, K = Math.ceil(sig * 3), ker = []; let ks = 0;
      for (let j = -K; j <= K; j++) { const wgt = Math.exp(-j * j / (2 * sig * sig)); ker.push(wgt); ks += wgt; }
      const sm = new Float64Array(n);
      for (let k = 0; k < n; k++) { let a = 0; for (let j = -K; j <= K; j++) a += ker[j + K] * raw[clamp(k + j, 0, n - 1)]; sm[k] = clamp(a / ks, 0, Math.max(0, this.total - W)); }
      this._cam = { R, sm };
    }
    const { R, sm } = this._cam, f = clamp(T * R, 0, sm.length - 1), k = Math.floor(f), u = f - k;
    return sm[k] + (sm[Math.min(k + 1, sm.length - 1)] - sm[k]) * u;
  },
  seamX(wd, y) { return wd.x0 + H * .012 * Math.sin(y * .006 + wd.x0 * .001) + H * .005 * Math.sin(y * .03 + wd.x0 * .003); },
  // clip to the band between this world's entry seam and the next world's
  band(g, k, camX) {
    const a = this.worlds[k], b = this.worlds[k + 1]; g.beginPath();
    for (let y = -10; y <= H + 10; y += 16) g.lineTo(k ? this.seamX(a, y) - camX : -60, y);
    for (let y = H + 10; y >= -10; y -= 16) g.lineTo(b ? this.seamX(b, y) - camX : W + 60, y);
    g.closePath(); g.clip();
  },
  draw(g, T, e) {
    const camX = this.camAt(T), hero = this.heroAt(T), plan = this._plan;
    const vis = this.worlds.map((wd, k) => [wd, k]).filter(([wd]) => wd.x1 > camX - 100 && wd.x0 < camX + W + 100);
    const ctxFor = wd => {
      const hx = hero.x - wd.x0, gy = (hero.p.wd === wd && hero.p.kind === 'act' && hero.p.act.y) ? hero.p.act.y(hx, hero.u) : (wd.ground ? wd.ground(hx) : this.GROUND);
      return { camX: camX - wd.x0, T, lt: T - wd.shot.t0, hx, hy: gy, e, W, H, G: this.GROUND,
               act: hero.p.wd === wd && hero.p.kind === 'act' ? { i: hero.p.i, u: hero.u } : null };
    };
    const local = (wd, S) => { g.setTransform(1, 0, 0, 1, -S.camX, 0); };
    const layer = fn => { for (const [wd, k] of vis) { if (!wd[fn] && fn !== 'hero') continue; const S = ctxFor(wd);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); this.band(g, k, camX); local(wd, S);
      if (fn === 'hero') { if (Math.abs(hero.x - (wd.x0 + wd.w / 2)) < wd.w / 2 + this.HERO_H) {
          const act = S.act && wd.acts[S.act.i], phase = act && act.pose ? act.pose(S.act.u) : (hero.walked / (this.HERO_H * .95)) % 1;
          wd.hero(g, S.hx, S.hy, this.HERO_H, phase, S); } }
      else wd[fn](g, S);
      g.restore(); } };
    layer('back'); layer('hero'); layer('front');
    for (const [wd, k] of vis) { if (!k) continue; const S = ctxFor(wd);   // the seam belongs to the world it opens
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      if (wd.seam) { for (let y = -10; y < H + 10; y += 12) { g.save(); g.translate(this.seamX(wd, y) - camX, 0); wd.seam(g, y, S); g.restore(); } }
      else { g.fillStyle = '#f3eee2'; for (let y = -10; y < H + 10; y += 6) g.fillRect(this.seamX(wd, y) - camX - 5, y, 7 + hash(y, k) * 5, 7); }
      g.restore(); }
    if (this.overlay) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); this.overlay(g, T); g.restore(); }
    this.label(g, T);
  },
  label(g, T) {   // the world's name, top left, fading in after each crossing
    const hero = this.heroAt(T), wd = hero.p.wd, t0 = wd.shot.t0, a = smooth(t0 + .15, t0 + .55, T) * (1 - smooth(wd.shot.t1 - .4, wd.shot.t1, T));
    if (!wd.name || a <= 0) return;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.font = `600 ${Math.round(H * .045)}px ${typeof SUBFONT === 'function' ? SUBFONT() : 'serif'}`;
    g.textBaseline = 'top'; const w = g.measureText(wd.name).width, pad = H * .02;
    g.fillStyle = 'rgba(250,246,236,.8)'; g.beginPath(); g.roundRect(this.LABEL_X - pad, this.LABEL_Y - pad * .7, w + pad * 2, H * .045 + pad * 1.4, pad * .6); g.fill();
    g.fillStyle = 'rgba(30,30,40,.9)'; g.fillText(wd.name, this.LABEL_X, this.LABEL_Y); g.restore();
  },
};
