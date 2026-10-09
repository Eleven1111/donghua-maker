// qa.py, installed before the film's own scripts.
// Text-box tracking adapted from MIT-licensed code by alchaincyf (Copyright (c) 2026); see NOTICE.
// 1. Text boxes live on the canvas they were drawn on (canvas.__tb). When that canvas is drawImage'd somewhere
//    else, its boxes follow through the same transform — so text baked into sprites at boot, drawn into the pixel
//    buffer, or composited from an offscreen layer still reaches the film canvas with its on-screen box.
//    A box remembers whether a clip was active (scrolling numbers, revealed strokes: box bigger than what shows)
//    and whether it was a burned-in subtitle (film._sub).
// 2. Backdrop leak: when __qa.sub is set, the first full-canvas fill in the engine's clear colour uses it instead.
(() => {
  const P = CanvasRenderingContext2D.prototype;
  const o = { save: P.save, restore: P.restore, clip: P.clip, drawImage: P.drawImage, clearRect: P.clearRect,
    fillRect: P.fillRect, putImageData: P.putImageData, fillText: P.fillText, strokeText: P.strokeText };
  const q = window.__qa = { clear: null, sub: null };
  const MAX = 6000;
  const wipe = c => { c.__tb = []; };
  const push = (c, rec) => { const L = c.__tb || (c.__tb = []); L.push(rec); if (L.length > MAX) L.splice(0, MAX / 2); };
  // does (x, y, w, h) under the current transform cover the whole canvas? (unrotated transforms only)
  const covers = (g, x, y, w, h) => {
    const T = g.getTransform(); if (T.b !== 0 || T.c !== 0) return false;
    const xs = [T.a * x + T.e, T.a * (x + w) + T.e], ys = [T.d * y + T.f, T.d * (y + h) + T.f];
    return Math.min(...xs) <= 0 && Math.min(...ys) <= 0 && Math.max(...xs) >= g.canvas.width && Math.max(...ys) >= g.canvas.height;
  };
  const opaque = g => {
    const f = g.fillStyle; if (typeof f !== 'string') return false;
    const m = f.match(/^(rgba|hsla)\(([^)]*)\)/); return !m || +m[2].split(/[ ,/]+/).filter(Boolean)[3] >= 1;
  };
  P.save = function () { (this.__cs || (this.__cs = [])).push(!!this.__clip); return o.save.apply(this, arguments); };
  P.restore = function () { if (this.__cs && this.__cs.length) this.__clip = this.__cs.pop(); return o.restore.apply(this, arguments); };
  P.clip = function () { this.__clip = true; return o.clip.apply(this, arguments); };
  P.clearRect = function (x, y, w, h) { if (covers(this, x, y, w, h)) wipe(this.canvas); return o.clearRect.apply(this, arguments); };
  P.putImageData = function (im, x, y) {
    if (x <= 0 && y <= 0 && x + im.width >= this.canvas.width && y + im.height >= this.canvas.height) wipe(this.canvas);
    return o.putImageData.apply(this, arguments);
  };
  P.fillRect = function (x, y, w, h) {
    const c = this.canvas, full = covers(this, x, y, w, h);
    if (full && this.globalAlpha >= 1 && (this.globalCompositeOperation === 'copy' || (this.globalCompositeOperation === 'source-over' && opaque(this)))) wipe(c);
    const want = q.sub && q.clear && q.clear.get(c);
    if (want && full && String(this.fillStyle).toLowerCase() === want) {
      const s = this.fillStyle; this.fillStyle = q.sub; q.sub = null;
      try { return o.fillRect.call(this, x, y, w, h); } finally { this.fillStyle = s; }
    }
    return o.fillRect.call(this, x, y, w, h);
  };
  for (const k of ['width', 'height']) {   // resizing a canvas clears it
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k);
    Object.defineProperty(HTMLCanvasElement.prototype, k, { get: d.get, set(v) { wipe(this); d.set.call(this, v); }, configurable: true });
  }
  for (const fn of ['fillText', 'strokeText']) {
    P[fn] = function (text, x, y, maxW) {
      const t = String(text);
      if (this.globalAlpha > .15 && t.trim()) {
        const m = this.measureText(t), T = this.getTransform();
        let x0 = x - m.actualBoundingBoxLeft, x1 = x + m.actualBoundingBoxRight;
        if (maxW && x1 - x0 > maxW) x1 = x0 + maxW;
        const y0 = y - m.actualBoundingBoxAscent, y1 = y + m.actualBoundingBoxDescent, xs = [], ys = [];
        for (const [px, py] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) { xs.push(T.a * px + T.c * py + T.e); ys.push(T.b * px + T.d * py + T.f); }
        // `film` is in its TDZ while the story draws offscreen text at script load; typeof doesn't guard that.
        let sub = false; try { sub = !!film._sub; } catch (e) {}
        push(this.canvas, [t.slice(0, 40), xs, ys, !!this.__clip, sub]);
      }
      return o[fn].apply(this, arguments);
    };
  }
  P.drawImage = function (src, ...a) {
    if (this.globalCompositeOperation === 'copy') wipe(this.canvas);
    const L = src && src.__tb;
    // alpha ≤ .5 is usually a motion trail or ghost layer: passing it on would fill the frame with fake overlaps
    if (L && L.length && src !== this.canvas && this.globalAlpha > .5) {
      let sx = 0, sy = 0, sw = src.width, sh = src.height, dx, dy, dw = sw, dh = sh;
      if (a.length === 2) [dx, dy] = a; else if (a.length === 4) [dx, dy, dw, dh] = a; else [sx, sy, sw, sh, dx, dy, dw, dh] = a;
      const T = this.getTransform(), kx = dw / sw, ky = dh / sh, clip = !!this.__clip || a.length === 8;
      for (const [t, xs, ys, c0, sub] of L) {
        if (Math.max(...xs) < sx || Math.min(...xs) > sx + sw || Math.max(...ys) < sy || Math.min(...ys) > sy + sh) continue;
        const X = [], Y = [];
        for (let k = 0; k < 4; k++) { const u = dx + (xs[k] - sx) * kx, v = dy + (ys[k] - sy) * ky; X.push(T.a * u + T.c * v + T.e); Y.push(T.b * u + T.d * v + T.f); }
        push(this.canvas, [t, X, Y, c0 || clip, sub]);
      }
    }
    return o.drawImage.call(this, src, ...a);
  };
})();
