// qa.py, evaluated once the film is ready. Each helper runs a whole shot inside the page to keep round trips low.
(() => {
  const q = window.__qa, cv = document.getElementById('film'), g = cv.getContext('2d');
  const norm = c => { const t = document.createElement('canvas').getContext('2d'); t.fillStyle = c; return String(t.fillStyle).toLowerCase(); };
  const src = render.toString(), pix = typeof PIX !== 'undefined' && PIX && typeof LO !== 'undefined' && LO;
  const mMain = src.match(/fillStyle = '(#[0-9a-fA-F]{3,6})'; ctx\.fillRect\(0, 0, W, H\)/), mLog = src.match(/LOG\.fillStyle = '(#[0-9a-fA-F]{3,6})'/);
  q.clear = new Map();
  if (pix) { if (mLog) q.clear.set(LO, norm(mLog[1])); } else if (mMain) q.clear.set(cv, norm(mMain[1]));
  const hasSubs = () => typeof NARR !== 'undefined' && NARR.subs && NARR.subs.length > 0 && film.subs !== false;
  const span = s => [Math.round(s.t0 * 60), Math.round(s.t1 * 60) - 1];
  const hash = () => { const d = new Uint32Array(g.getImageData(0, 0, cv.width, cv.height).data.buffer); let h = 2166136261;
    for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619); return (h >>> 0).toString(16); };
  const sm = document.createElement('canvas'), sg = sm.getContext('2d', { willReadFrequently: true });
  const gray = w => { sm.width = w; sm.height = Math.round(w * cv.height / cv.width); sg.drawImage(cv, 0, 0, sm.width, sm.height);
    const d = sg.getImageData(0, 0, sm.width, sm.height).data, o = new Uint8Array(d.length / 4);
    for (let i = 0; i < o.length; i++) o[i] = (d[4 * i] * 77 + d[4 * i + 1] * 150 + d[4 * i + 2] * 29) >> 8; return o; };
  const seekText = f => { cv.__tb = []; __film.seek(f); return (cv.__tb || []).slice(); };
  const leak = () => {
    if (!q.clear.size) return null;
    q.sub = '#ff00ff'; render(); const a = g.getImageData(0, 0, cv.width, cv.height).data;
    q.sub = '#00ff00'; render(); const b = g.getImageData(0, 0, cv.width, cv.height).data; q.sub = null; render();
    let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1]) n++; return n / (a.length / 4);
  };
  window.__qaInfo = () => ({ w: cv.width, h: cv.height, pix: !!pix, leakable: q.clear.size > 0, subs: hasSubs(), scroll: typeof SCROLL !== 'undefined',
    expo: typeof EXPO !== 'undefined' ? EXPO : 5, shots: SHOTS.map((s, i) => ({ i, name: s.name || 'shot' + (i + 1), t0: s.t0, t1: s.t1 })) });
  // stop-motion pass: on-screen text boxes, render cost, and backdrop leak on a sparser grid
  window.__qaStill = (i, step, leakStep) => {
    const [f0, f1] = span(SHOTS[i]), rows = [];
    for (let f = f0; f <= f1; f += step) {
      const text = seekText(f);
      const t0 = performance.now(); render(); g.getImageData(0, 0, 1, 1); const ms = performance.now() - t0;
      const lk = (f - f0) % leakStep === 0 || f + step > f1 ? leak() : null;
      rows.push({ f, text, ms, leak: lk });
    }
    return rows;
  };
  window.__qaHash = f => { __film.seek(f); return hash(); };
  window.__qaSnap = f => { const h = window.__qaHash(f), t = gray(640); let b = ''; for (let i = 0; i < t.length; i += 8192) b += String.fromCharCode(...t.subarray(i, i + 8192));
    return { hash: h, thumb: btoa(b) }; };
  // subtitle boxes of the current frame, padded like the engine's backing plate, in thumbnail pixels
  const subMask = (text, w, h) => {
    const k = w / cv.width, m = new Uint8Array(w * h); let n = 0;
    for (const [, xs, ys, , sub] of text) {
      if (!sub) continue;
      const bh = Math.max(...ys) - Math.min(...ys), x0 = Math.max(0, (Math.min(...xs) - bh * .6) * k | 0), x1 = Math.min(w - 1, (Math.max(...xs) + bh * .6) * k | 0);
      const y0 = Math.max(0, (Math.min(...ys) - bh * .4) * k | 0), y1 = Math.min(h - 1, (Math.max(...ys) + bh * .4) * k | 0);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!m[y * w + x]) { m[y * w + x] = 1; n++; }
    }
    return n ? m : null;
  };
  // smooth pass, one sample per exposure: moving area, a strip of 4 frames + heat map, and (films with subtitles)
  // how much of the picture moves under the subtitle plate — measured with subtitles hidden, so phrase changes don't count
  window.__qaMotion = (i, step, w) => {
    const [f0, f1] = span(SHOTS[i]), area = [], mag = [], blank = [], under = [], camx = [], subs = hasSubs();
    const h = Math.round(w * cv.height / cv.width), strip = document.createElement('canvas'), sx = strip.getContext('2d');
    strip.width = w * 5; strip.height = h;
    const shots4 = [.05, .35, .65, .95].map(p => f0 + Math.round(p * (f1 - f0))); let tile = 0, prev = null, heat = null, mid = null;
    for (let f = f0; f <= f1; f += step) {
      const text = seekText(f), mask = subs ? subMask(text, w, h) : null;
      camx.push(film.cam && typeof film.cam.x === 'number' ? film.cam.x : null);
      if (subs) { film.subs = false; render(); }
      const cur = gray(w);
      while (tile < 4 && f + step > shots4[tile]) sx.drawImage(cv, tile++ * w, 0, w, h);
      if (subs) { film.subs = true; render(); }
      let mu = 0; for (const v of cur) mu += v; mu /= cur.length; let va = 0; for (const v of cur) va += (v - mu) ** 2;
      blank.push(Math.sqrt(va / cur.length) < 3);
      if (prev) {
        let n = 0, s = 0, nu = 0, nm = 0;
        for (let k = 0; k < cur.length; k++) { const d = Math.abs(cur[k] - prev[k]); s += d; if (d > 12) n++; if (d > heat[k]) heat[k] = d;
          if (mask && mask[k]) { nm++; if (d > 12) nu++; } }
        area.push(n / cur.length); mag.push(s / cur.length); under.push(mask ? [f, nu / nm, n / cur.length] : null);
      } else heat = new Float32Array(cur.length);
      if (!mid && f >= (f0 + f1) / 2) mid = cur; prev = cur;
    }
    const id = sg.createImageData(w, h); mid = mid || prev;
    for (let k = 0; k < mid.length; k++) { const a = Math.min(1, heat[k] / 60) * (heat[k] > 12), v = mid[k] * .55;
      id.data.set([v + (255 - v) * a, v * (1 - a), v * (1 - a), 255], 4 * k); }
    sg.putImageData(id, 0, 0); sx.drawImage(sm, w * 4, 0);
    return { area, mag, blank, camx, under: under.filter(Boolean), img: strip.toDataURL('image/jpeg', .8) };
  };
  return window.__qaInfo();
})()
