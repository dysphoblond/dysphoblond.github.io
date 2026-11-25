// Placats Lab — ядро генератора «жидких» градиентов с зерном.
// Шум Перлина (3 октавы) → двойное искажение координат (domain warping) → цветовая шкала → плёночное зерно.
// Чистый модуль без DOM и Node: работает и в браузере (воркер), и в скриптах сборки.
// Одинаковые параметры и размер дают одинаковую картинку байт в байт.

export const RATIOS = { '9:16': 9 / 16, '3:4': 3 / 4, A: Math.SQRT1_2, '1:1': 1, '4:3': 4 / 3 };

// Размер в пикселях по соотношению сторон и длинной стороне
export function sizeFor(ratio, longSide) {
  const r = RATIOS[ratio] ?? 1;
  return r >= 1 ? [longSide, Math.round(longSide / r)] : [Math.round(longSide * r), longSide];
}

export function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(random) {
  const p = new Uint8Array(512);
  const base = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [base[i], base[j]] = [base[j], base[i]]; }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y) * ((h & 4) ? 0.5 : 1);
  const perlin = (x, y) => {
    const xi = Math.floor(x) & 255; const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x); const yf = y - Math.floor(y);
    const u = fade(xf); const v = fade(yf);
    const aa = p[p[xi] + yi]; const ab = p[p[xi] + yi + 1]; const ba = p[p[xi + 1] + yi]; const bb = p[p[xi + 1] + yi + 1];
    const x1 = grad(aa, xf, yf) + u * (grad(ba, xf - 1, yf) - grad(aa, xf, yf));
    const x2 = grad(ab, xf, yf - 1) + u * (grad(bb, xf - 1, yf - 1) - grad(ab, xf, yf - 1));
    return x1 + v * (x2 - x1);
  };
  return (x, y) => {
    let sum = 0; let amp = 0.5; let freq = 1;
    for (let o = 0; o < 3; o++) { sum += amp * perlin(x * freq, y * freq); freq *= 2.02; amp *= 0.42; }
    return sum;
  };
}

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

// Палитра — точки [позиция 0…1, '#rrggbb'] по возрастанию позиции
export function ramp(palette) {
  const stops = palette.map(([t, color]) => [t, hex(color)]);
  return t => {
    t = Math.min(1, Math.max(0, t));
    let i = 1;
    while (i < stops.length - 1 && stops[i][0] < t) i++;
    const [t0, c0] = stops[i - 1]; const [t1, c1] = stops[i];
    const k = (t - t0) / (t1 - t0 || 1);
    const s = k * k * (3 - 2 * k);
    return [0, 1, 2].map(c => c0[c] + (c1[c] - c0[c]) * s);
  };
}

export const DEFAULTS = { seed: 11, scale: 0.85, warp: 2.2, gain: 1.7, shift: -0.12, grain: 26 };

/**
 * Рисует картинку.
 * @param params    { seed, scale, warp, gain, shift, grain, palette }
 * @param channels  3 — RGB (для файлов), 4 — RGBA (для canvas ImageData)
 * @param onRow     необязательно: вызывается с долей готовности 0…1 раз в несколько строк
 */
export function render(params, width, height, { channels = 3, onRow } = {}) {
  const { seed, scale, warp, gain, shift, palette } = params;
  const grainAmount = params.grain ?? DEFAULTS.grain;
  const random = mulberry32(seed);
  const noise = makeNoise(random);
  const color = ramp(palette);
  const grain = mulberry32(seed * 7919);
  const offsets = Array.from({ length: 8 }, () => random() * 100);
  const aspect = width / height;
  const out = new Uint8ClampedArray(width * height * channels);
  const put = (i, value) => { out[i] = Math.trunc(Math.max(0, Math.min(255, value))); };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = (x / width) * aspect * scale;
      const py = (y / height) * scale;
      // Двойное искажение: поле «затекает» само в себя — отсюда языки и острые изгибы
      const qx = noise(px + offsets[0], py + offsets[1]);
      const qy = noise(px + offsets[2], py + offsets[3]);
      const rx = noise(px + warp * qx + offsets[4], py + warp * qy + offsets[5]);
      const ry = noise(px + warp * qx + offsets[6], py + warp * qy + offsets[7]);
      const v = noise(px + warp * rx, py + warp * ry);
      const [r, g, b] = color(0.5 + v * gain + shift);
      const n = (grain() + grain() + grain() - 1.5) * grainAmount;
      const i = (y * width + x) * channels;
      put(i, r + n);
      put(i + 1, g + n);
      put(i + 2, b + n);
      if (channels === 4) out[i + 3] = 255;
    }
    if (onRow && (y & 31) === 31) onRow((y + 1) / height);
  }
  return out;
}
