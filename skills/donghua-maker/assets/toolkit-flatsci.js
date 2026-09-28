// ═══ FLATSCI toolkit (扁平科普): the flat-vector science-explainer look — deep indigo-violet space with tiny twinkling stars and
// soft nebula blobs; planets as flat discs with simple land shapes, cloud pills, a hard terminator shadow and a thin rim light;
// saturated candy accents (cyan, pink, yellow, green) that glow a little; bold rounded white captions; dashed orbits; icon-like
// objects with no outlines. Motion is smooth and eased. Studied from the general language of flat science-explainer animation;
// no specific film or studio artwork is copied. Pure functions of t. references/looks/flatsci.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .025, VIGN_TONE = ['10,0,40', 0, .4];
const FS = { sp0: '#2a1f6b', sp1: '#0c0a2a', ocean: '#2f7fe0', ocean2: '#2466c4', land: '#6bd07a', land2: '#4fb266', cloud: '#f4f7ff', cyan: '#4fe0ff', pink: '#ff6fae', yellow: '#ffd54a', white: '#ffffff', moon: '#cfd3e6', moonDark: '#4a4a74', sun: '#ffcf4a' };
const fsFam = () => ((window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : '') + '"Arial Rounded MT Bold", sans-serif';
// space: vertical indigo gradient, a few soft nebula blobs, seeded twinkling stars (drawn in world coords over the given rect)
function fsSpace(g, t, rect = [-600, -400, W + 1200, H + 800], seed = 3) { const [x, y, w, h] = rect, gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, FS.sp0); gr.addColorStop(1, FS.sp1); g.fillStyle = gr; g.fillRect(x, y, w, h);
  const R = rng(seed); for (let i = 0; i < 5; i++) { const cx = x + R() * w, cy = y + R() * h, r = 300 + R() * 500, q = g.createRadialGradient(cx, cy, 0, cx, cy, r); q.addColorStop(0, `rgba(${R() < .5 ? '120,80,220' : '60,120,230'},.18)`); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
  for (let i = 0; i < 260; i++) { const sx = x + R() * w, sy = y + R() * h, s = R() < .9 ? 2 + R() * 2 : 4 + R() * 3, tw = .55 + .45 * Math.sin(t * (1 + R() * 2) + i); g.fillStyle = `rgba(255,255,255,${.35 + .5 * tw * R()})`; g.beginPath(); g.arc(sx, sy, s / 2, 0, TAU); g.fill(); } }
// flat planet: ocean disc, drifting land blobs (seeded), cloud pills, terminator shadow toward angle `light` (radians, where the
// sun is), rim light on the lit edge, soft atmosphere glow. rot = surface drift (units of radius)
function fsPlanet(g, x, y, r, o = {}) { const rot = o.rot ?? 0, light = o.light ?? PI, R = rng(o.seed ?? 5); g.save();
  const at = g.createRadialGradient(x, y, r * .9, x, y, r * 1.35); at.addColorStop(0, 'rgba(90,170,255,.35)'); at.addColorStop(1, 'rgba(90,170,255,0)'); g.fillStyle = at; g.beginPath(); g.arc(x, y, r * 1.35, 0, TAU); g.fill();
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip(); g.fillStyle = o.ocean ?? FS.ocean; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  const lands = Array.from({ length: o.lands ?? 6 }, () => ({ u: R() * 4, v: (R() - .5) * 1.4, s: .25 + R() * .4, k: R() }));
  lands.forEach((L, i) => { const u = ((L.u + rot) % 4 + 4) % 4 - 2, lx = x + u * r, ly = y + L.v * r; if (Math.abs(u) > 1.6) return; g.fillStyle = i % 2 ? FS.land : FS.land2; g.beginPath();
    for (let j = 0; j < 14; j++) { const a = j / 14 * TAU, rr = L.s * r * (.7 + .3 * Math.sin(a * 3 + L.k * 9) + .15 * Math.sin(a * 5 + i)); g.lineTo(lx + Math.cos(a) * rr * 1.2, ly + Math.sin(a) * rr * .8); } g.closePath(); g.fill(); });
  for (let i = 0; i < (o.clouds ?? 5); i++) { const u = ((R() * 4 + rot * 1.3) % 4 + 4) % 4 - 2, cy = y + (R() - .5) * 1.5 * r, w = r * (.3 + R() * .4); g.fillStyle = FS.cloud; g.globalAlpha = .9; g.beginPath(); g.roundRect(x + u * r - w / 2, cy - r * .05, w, r * .1, r * .05); g.fill(); g.globalAlpha = 1; }
  // terminator: a big dark disc offset away from the light, multiplied
  g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(40,30,110,.62)'; g.beginPath(); g.arc(x - Math.cos(light) * r * .95, y - Math.sin(light) * r * .95, r * 1.05, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
  g.restore(); g.save(); g.strokeStyle = 'rgba(200,235,255,.8)'; g.lineWidth = r * .035; g.beginPath(); g.arc(x, y, r * .985, light - 1.1, light + 1.1); g.stroke(); g.restore(); }
// moon (flat grey disc + craters) with the half facing `light` lit and the other half dark
function fsMoon(g, x, y, r, light = PI) { g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip(); g.fillStyle = FS.moonDark; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.fillStyle = FS.moon; g.beginPath(); g.arc(x, y, r, light - PI / 2, light + PI / 2); g.closePath(); g.fill(); g.fillStyle = 'rgba(80,80,130,.25)'; [[-.3, -.2, .22], [.25, .3, .16], [.1, -.4, .12]].forEach(([a, b, s]) => { g.beginPath(); g.arc(x + a * r, y + b * r, s * r, 0, TAU); g.fill(); }); g.restore(); }
// a moon phase as seen from Earth: ph 0 new → .25 first quarter → .5 full → .75 last quarter (northern-hemisphere view: waxing lit on the right)
function fsPhase(g, x, y, r, ph) { ph = ((ph % 1) + 1) % 1; g.save(); g.fillStyle = FS.moonDark; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); const c = Math.cos(ph * TAU), rx = Math.abs(c) * r, waxing = ph < .5;
  g.fillStyle = FS.moon; g.beginPath(); if (waxing) { g.arc(x, y, r, -PI / 2, PI / 2); g.ellipse(x, y, rx, r, 0, PI / 2, -PI / 2, c > 0); } else { g.arc(x, y, r, PI / 2, PI * 1.5); g.ellipse(x, y, rx, r, 0, PI * 1.5, PI / 2, c > 0); } g.closePath(); g.fill(); g.restore(); }
// bold rounded caption with a smaller sub line; k slides + fades it up
function fsTitle(g, str, x, y, size, k, o = {}) { if (k <= 0) return; const e = eo(clamp(k, 0, 1)); g.save(); g.globalAlpha = e; g.fillStyle = o.col ?? FS.white; g.font = `800 ${size}px ${fsFam()}`; g.textAlign = o.align ?? 'center'; g.shadowColor = 'rgba(10,0,40,.5)'; g.shadowBlur = 20; g.fillText(str, x, y + (1 - e) * 30);
  if (o.sub) { g.font = `600 ${size * .36}px ${fsFam()}`; g.fillStyle = o.subCol ?? 'rgba(255,255,255,.7)'; if ('letterSpacing' in g) g.letterSpacing = `${size * .06}px`; g.fillText(o.sub, x, y + size * .62 + (1 - e) * 30); } g.restore(); }
// dashed orbit ring, drawn on with k
function fsOrbit(g, x, y, r, k = 1, col = 'rgba(255,255,255,.35)') { if (k <= 0) return; g.save(); g.strokeStyle = col; g.lineWidth = 4; g.setLineDash([18, 16]); g.beginPath(); g.arc(x, y, r, -PI / 2, -PI / 2 + TAU * clamp(k, 0, 1)); g.stroke(); g.restore(); }
// sun at (x, y): layered glow + disc; sunlight as parallel soft bands moving along +x
function fsSun(g, x, y, r, t) { g.save(); [2.6, 1.9, 1.4].forEach((m, i) => { g.fillStyle = `rgba(255,200,80,${.08 + i * .07})`; g.beginPath(); g.arc(x, y, r * m * (1 + .03 * Math.sin(t * 2 + i)), 0, TAU); g.fill(); }); g.fillStyle = FS.sun; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore(); }
function fsBeams(g, x0, x1, ys, t, a = .12) { g.save(); ys.forEach((y, i) => { const off = ((t * 260 + i * 170) % 520); const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, `rgba(255,220,120,${a})`); gr.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gr; g.fillRect(x0, y - 14, x1 - x0, 28);
  g.fillStyle = `rgba(255,235,170,${a * 2.5})`; for (let x = x0 + off; x < x1; x += 520) g.fillRect(x, y - 3, 120, 6); }); g.restore(); }
// a small pointer label: dot + line + text
function fsCallout(g, px, py, tx, ty, str, k, col = FS.yellow) { if (k <= 0) return; const e = eo(clamp(k, 0, 1)); g.save(); g.globalAlpha = e; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(px, py, 9, 0, TAU); g.fill(); g.beginPath(); g.moveTo(px, py); g.lineTo(lerp(px, tx, e), lerp(py, ty, e)); g.stroke();
  g.font = `700 52px ${fsFam()}`; g.textAlign = tx < px ? 'right' : 'left'; g.fillText(str, tx + (tx < px ? -16 : 16), ty + 18); g.restore(); }
