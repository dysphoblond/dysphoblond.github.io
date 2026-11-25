// Пиксельная анимация постера: облака дрейфуют, растровые точки мерцают,
// края логотипа «кипят» и изредка ловят глитч. Рисуется на canvas под SVG-слоями.
(() => {
  const stage = document.querySelector('.poster-stage');
  const canvas = stage?.querySelector('.poster-pixels');
  const source = stage?.querySelector('#art')?.getAttribute('href');
  if (!canvas || !source) return;

  const W = 1280, H = 1280, FPS = 14;
  const BLACK = 0xff000000, WHITE = 0xffffffff;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  // Облака: центр и радиусы эллипса влияния (координаты исходника 1280×1280)
  const clouds = [
    { cx: 930, cy: 235, rx: 320, ry: 220, drift: 7, wave: 4, lift: 4, phase: 0 },
    { cx: 330, cy: 925, rx: 330, ry: 220, drift: 8, wave: 4, lift: 4, phase: 2.4 }
  ];
  // Логотип (крылья с лампой) и цепочка, которую не трогаем
  const logo = { x0: 300, x1: 1140, y0: 540, y1: 800 };
  const isChain = (x, y) => (x >= 932 && x <= 988 && y >= 585) ||
    (x >= 775 && x < 932 && y >= 640 && y <= 830 && ((x - 720) / 182) ** 2 + ((y - 690) / 92) ** 2 > 1);

  let src, out, image, flags, noise, active, weights, cell = 24;
  let enabled = false, visible = true, frame = 0, last = 0, glitch = null, nextGlitch = 0;

  function prepare(picture) {
    canvas.width = W; canvas.height = H;
    context.drawImage(picture, 0, 0, W, H);
    const pristine = context.getImageData(0, 0, W, H); // бросит SecurityError на file://
    src = new Uint32Array(pristine.data.buffer.slice(0));
    image = pristine;
    out = new Uint32Array(image.data.buffer);
    flags = new Uint8Array(W * H);
    noise = new Uint8Array(W * H);
    const tone = new Uint8Array(W * H); // 1 — светлый, 2 — тёмный, 0 — полутон
    for (let i = 0; i < W * H; i++) { const r = src[i] & 0xff; tone[i] = r > 140 ? 1 : r < 70 ? 2 : 0; }
    const reach = c => (x, y) => {
      const q = ((x - c.cx) / c.rx) ** 2 + ((y - c.cy) / c.ry) ** 2;
      return Math.max(0, Math.min(1, (1 - q) * 2.2));
    };
    const [reachA, reachB] = clouds.map(reach);
    // Шум общий для блока 3×3 — гаснет и вспыхивает вся растровая точка, а не один пиксель
    const blockW = Math.ceil(W / 3), blocks = Uint8Array.from({ length: blockW * Math.ceil(H / 3) }, () => Math.random() * 255);
    const list = [], wa = [], wb = [];
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x, own = tone[i];
        noise[i] = blocks[((y / 3) | 0) * blockW + ((x / 3) | 0)];
        if (own && !isChain(x, y)) {
          const near = [tone[i - 1], tone[i + 1], tone[i - W], tone[i + W]];
          let other = 0;
          for (const n of near) if (n && n !== own) other++;
          // Растровая точка: светлый пиксель среди тёмных или тёмная дырка среди светлых
          if ((own === 1 && other >= 2) || (own === 2 && other >= 3)) flags[i] |= 1;
          // Контур логотипа: граница сплошной белой заливки
          if (other === 1 && x >= logo.x0 && x <= logo.x1 && y >= logo.y0 && y <= logo.y1) flags[i] |= 2;
        }
        const a = reachA(x, y), b = reachB(x, y);
        if (a || b || flags[i]) { list.push(i); wa.push(a); wb.push(b); }
      }
    }
    active = Int32Array.from(list);
    weights = [Float32Array.from(wa), Float32Array.from(wb)];
  }

  const rows = clouds.map(() => new Float32Array(H)), cols = clouds.map(() => new Float32Array(W));
  const cellsX = Math.ceil(W / cell), field = new Float32Array(cellsX * Math.ceil(H / cell)), edge = new Float32Array(field.length);

  function render(t) {
    clouds.forEach((c, k) => {
      const swayX = Math.sin(t * .32 + c.phase) * c.drift, swayY = Math.cos(t * .27 + c.phase) * c.lift;
      for (let y = 0; y < H; y++) rows[k][y] = swayX + Math.sin(y * .016 + t * .9 + c.phase) * c.wave;
      for (let x = 0; x < W; x++) cols[k][x] = swayY + Math.sin(x * .014 - t * .7 + c.phase) * c.wave * .6;
    });
    for (let n = 0; n < field.length; n++) {
      const cx = n % cellsX, cy = (n / cellsX) | 0;
      const f = .5 + .5 * Math.sin(cx * .7 + cy * .4 + t * 1.8) * Math.cos(cy * .6 - t * 1.2);
      field[n] = f * f * f * 170;
      const g = .5 + .5 * Math.sin(cx * 1.3 - t * 2.6) * Math.sin(cy * 1.1 + t * 1.9);
      edge[n] = g * g * 150;
    }
    out.set(src);
    const [wa, wb] = weights;
    for (let k = 0; k < active.length; k++) {
      const i = active[k], x = i % W, y = (i / W) | 0;
      let j = i;
      if (wa[k] || wb[k]) {
        const dx = Math.round(wa[k] * rows[0][y] + wb[k] * rows[1][y]);
        const dy = Math.round(wa[k] * cols[0][x] + wb[k] * cols[1][x]);
        const sx = Math.min(W - 1, Math.max(0, x - dx)), sy = Math.min(H - 1, Math.max(0, y - dy));
        j = sy * W + sx;
      }
      let v = src[j];
      const fl = flags[j];
      if (fl) {
        const jx = j % W, jy = (j / W) | 0, c = ((jy / cell) | 0) * cellsX + ((jx / cell) | 0);
        if (fl & 1) {
          const bright = (v & 0xff) > 140;
          if (bright && noise[j] < field[c]) v = BLACK;               // точка гаснет
          else if (!bright && noise[j] < field[c] * .5) v = WHITE;    // точка вспыхивает
        }
        if (fl & 2 && noise[j] < edge[c]) v = (v & 0xff) > 140 ? BLACK : WHITE;
      }
      out[i] = v;
    }
    if (glitch) {
      for (const band of glitch.bands) {
        for (let y = band.y; y < band.y + band.h; y++) for (let x = logo.x0; x <= logo.x1; x++) {
          out[y * W + x] = src[y * W + x - band.shift];
        }
      }
    }
    context.putImageData(image, 0, 0);
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (now - last < 1000 / FPS) return;
    last = now;
    const t = now / 1000;
    if (glitch && t > glitch.until) glitch = null;
    if (!glitch && t > nextGlitch) {
      if (nextGlitch) glitch = {
        until: t + .12 + Math.random() * .18,
        bands: Array.from({ length: 1 + (Math.random() * 3 | 0) }, () => ({
          y: logo.y0 + Math.random() * (logo.y1 - logo.y0 - 18) | 0,
          h: 4 + Math.random() * 14 | 0,
          shift: (Math.random() < .5 ? -1 : 1) * (3 + Math.random() * 10 | 0)
        }))
      };
      nextGlitch = t + 2.5 + Math.random() * 4;
    }
    render(t);
  }

  function update() {
    const run = enabled && visible && !document.hidden && !document.documentElement.classList.contains('fx-off');
    cancelAnimationFrame(frame);
    if (run) frame = requestAnimationFrame(tick);
    else if (enabled) { out.set(src); context.putImageData(image, 0, 0); }
  }

  const picture = new Image();
  picture.decoding = 'async';
  picture.onload = () => {
    try { prepare(picture); } catch { return; } // без доступа к пикселям остаётся статичный SVG-фон
    enabled = true;
    stage.classList.add('is-live');
    update();
  };
  picture.src = source;

  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', update);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }).observe(stage);
})();
