// ═══ FILM16 toolkit (16mm 老纪录片): black-and-white 16 mm documentary — a projector countdown leader, ornamental intertitle
// cards in a serif face, spot-lit subjects on dark ground; the print is worn: heavy grain, gate weave (the frame wobbles a few
// px per film frame), exposure flicker, vertical scratches, dust and hairs, burned-in vignette, 24 fps cadence for the damage.
// Everything is grey — draw with fmG(v) greys only. Pure functions of t (damage keyed to floor(t·24)). references/looks/film16.md
const SMOOTH_DEFAULT = true, POST_GRAIN = .22, VIGN_TONE = ['0,0,0', 0, .75];
const fmG = (v, a = 1) => { const c = Math.round(clamp(v, 0, 1) * 255); return `rgba(${c},${c},${c},${a})`; };
const fmFrameNo = t => Math.floor(t * 24 + 1e-6);
// gate weave: small per-film-frame offset (px) — apply with ctx.translate before drawing the picture
function fmWeave(t, amt = 1) { const f = fmFrameNo(t); return [(hash(f, 1) - .5) * 6 * amt + Math.sin(t * 1.7) * 2 * amt, (hash(f, 2) - .5) * 5 * amt]; }
// the worn-print pass, drawn last in screen space: flicker, scratches, dust, hairs, frame-edge burn
function fmPost(g, t, o = {}) { const f = fmFrameNo(t), s = g.canvas.width / W; g.save(); g.setTransform(s, 0, 0, s, 0, 0);
  const fl = (hash(f, 3) - .5) * (o.flicker ?? .12); g.fillStyle = fl > 0 ? `rgba(255,255,255,${fl})` : `rgba(0,0,0,${-fl})`; g.fillRect(0, 0, W, H);
  // long scratches persist a few frames and drift sideways
  for (let i = 0; i < (o.scratches ?? 3); i++) { const life = Math.floor((f + i * 7) / 9), x = hash(life, i, 5) * W + ((f + i * 7) % 9) * (hash(life, i, 6) - .5) * 8, on = hash(life, i, 7) > .35; if (!on) continue;
    g.fillStyle = hash(life, i, 8) > .5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.45)'; g.fillRect(x, 0, 1.5 + hash(life, i, 9) * 2, H); }
  // dust specks and a hair or two, new every frame
  for (let i = 0; i < (o.dust ?? 14); i++) { const x = hash(f, i, 11) * W, y = hash(f, i, 12) * H, r = 1 + hash(f, i, 13) * 5; g.fillStyle = hash(f, i, 14) > .6 ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)'; g.beginPath(); g.ellipse(x, y, r, r * (.5 + hash(f, i, 15)), hash(f, i) * 3, 0, TAU); g.fill(); }
  if (hash(f, 21) > .82) { const x = hash(f, 22) * W, y = hash(f, 23) * H; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 40, y - 60, x + 90, y + 40, x + 130, y - 20); g.stroke(); }
  const gr = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, W * .72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${o.burn ?? .55})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
// SMPTE-style countdown leader: number n, sweep u 0..1 within the second
function fmLeader(g, n, u) { g.fillStyle = fmG(.62); g.fillRect(-300, -300, W + 600, H + 600); const cx = W / 2, cy = H / 2, R = 560;
  g.save(); g.fillStyle = fmG(.42); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 1600, -PI / 2, -PI / 2 + u * TAU); g.closePath(); g.fill(); g.restore();
  g.strokeStyle = fmG(.95); g.lineWidth = 6; g.beginPath(); g.moveTo(0, cy); g.lineTo(W, cy); g.moveTo(cx, 0); g.lineTo(cx, H); g.stroke();
  [R, R * .82].forEach((r, i) => { g.lineWidth = i ? 5 : 9; g.strokeStyle = fmG(.97); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); });
  g.fillStyle = fmG(.08); g.font = `700 760px "Times New Roman", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), cx, cy + 40); }
// ornamental intertitle card: black card, double rule border with corner dots, serif lines [text, size, italic]; k fades in
function fmCard(g, lines, k, o = {}) { const fam = (window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''; g.fillStyle = fmG(.06); g.fillRect(-300, -300, W + 600, H + 600); if (k <= 0) return; g.save(); g.globalAlpha = clamp(k, 0, 1);
  const m = o.m ?? 150; g.strokeStyle = fmG(.8); g.lineWidth = 3; g.strokeRect(m, m, W - 2 * m, H - 2 * m); g.lineWidth = 1.5; g.strokeRect(m + 22, m + 22, W - 2 * m - 44, H - 2 * m - 44);
  g.fillStyle = fmG(.8); [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); });
  let y = o.y ?? H / 2 - (lines.length - 1) * 80; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([str, size, it, gap]) => { if (str === '—') { g.fillRect(W / 2 - 120, y, 240, 2); g.beginPath(); g.arc(W / 2, y + 1, 7, 0, TAU); g.fill(); } else { g.font = `${it ? 'italic ' : ''}${size > 100 ? 600 : 400} ${size}px ${fam}"Times New Roman", serif`; if ('letterSpacing' in g) g.letterSpacing = `${o.track ?? (size < 60 ? size * .35 : 0)}px`; g.fillText(str, W / 2, y); } y += gap ?? size * 1.5; });
  g.restore(); }
// typewriter caption at lower left (monospace), typed on by k
function fmType(g, str, x, y, size, k, a = .85) { if (k <= 0) return; const fam = (window.EMBED_FONTS || [])[0] ? `"${window.EMBED_FONTS[0]}", ` : ''; g.save(); g.fillStyle = fmG(.92, a); g.font = `400 ${size}px ${fam}"Courier New", monospace`;
  const c = [...str], n = Math.floor(c.length * clamp(k, 0, 1)); g.fillText(c.slice(0, n).join('') + (k < 1 && fmFrameNo(k * 50) % 2 ? '▌' : ''), x, y); g.restore(); }
// a hard spotlight cone from above onto the floor at (x, y)
function fmSpot(g, x, y, w, a = .5) { g.save(); const gr = g.createLinearGradient(0, -200, 0, y); gr.addColorStop(0, fmG(1, a * .1)); gr.addColorStop(1, fmG(1, a * .35)); g.fillStyle = gr; g.beginPath(); g.moveTo(x - w * .12, -200); g.lineTo(x + w * .12, -200); g.lineTo(x + w / 2, y); g.lineTo(x - w / 2, y); g.closePath(); g.fill();
  const e = g.createRadialGradient(x, y, 0, x, y, w * .6); e.addColorStop(0, fmG(1, a * .5)); e.addColorStop(1, fmG(1, 0)); g.fillStyle = e; g.save(); g.translate(x, y); g.scale(1, .22); g.beginPath(); g.arc(0, 0, w * .6, 0, TAU); g.fill(); g.restore(); g.restore(); }
