// Placats Lab — интерфейс генератора. Расчёт — в воркерах: один для живого превью, второй для экспорта.
import { RATIOS, sizeFor, DEFAULTS } from './core.js?v=1';
import { PRESETS } from './presets.js?v=1';

const $ = id => document.getElementById(id);
const PREVIEW_LONG = 800;
const EXPORT_SIZES = [1200, 2400, 4800];
const SLIDERS = [
  { key: 'scale', label: 'Масштаб', min: 0.3, max: 2, step: 0.01, hint: 'меньше — крупнее формы' },
  { key: 'warp', label: 'Искажение', min: 0, max: 5, step: 0.05, hint: 'сколько поле закручивается' },
  { key: 'gain', label: 'Контраст', min: 0.5, max: 3, step: 0.05, hint: 'насколько резкие переходы' },
  { key: 'shift', label: 'Баланс', min: -0.5, max: 0.5, step: 0.01, hint: 'тёмные ↔ светлые цвета' },
  { key: 'grain', label: 'Зерно', min: 0, max: 60, step: 1, hint: 'плёночный шум' },
];

/* ---------- Состояние ---------- */

const fromPreset = preset => ({
  preset: preset.id, ratio: preset.ratio, seed: preset.seed, scale: preset.scale, warp: preset.warp,
  gain: preset.gain, shift: preset.shift, grain: DEFAULTS.grain, hue: 0, palette: preset.palette.map(stop => [...stop]),
});
let state = fromPreset(PRESETS[0]);
let exportSize = 2400;

// Состояние живёт в адресе страницы — ссылкой можно поделиться
function readHash() {
  try {
    const data = JSON.parse(decodeURIComponent(location.hash.slice(3)));
    if (location.hash.startsWith('#p=') && Array.isArray(data.palette) && data.palette.length >= 2 && RATIOS[data.ratio]) {
      state = { ...state, ...data };
    }
  } catch {}
}
const writeHash = () => history.replaceState(null, '', `#p=${encodeURIComponent(JSON.stringify(state))}`);

/* ---------- Цвета: сдвиг оттенка всей палитры ---------- */

function hexToHsl(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToHex([h, s, l]) {
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
}
const rotate = (hex, deg) => { if (!deg) return hex; const [h, s, l] = hexToHsl(hex); return hslToHex([(h + deg + 360) % 360, s, l]); };
const effectivePalette = () => state.palette.map(([t, color]) => [t, rotate(color, state.hue)]);
const renderParams = () => ({ seed: state.seed, scale: state.scale, warp: state.warp, gain: state.gain, shift: state.shift, grain: state.grain, palette: effectivePalette() });

/* ---------- Превью: всегда считается только последняя версия параметров ---------- */

const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const previewWorker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
let busy = false;
let queued = false;
let jobId = 0;

// Вписывает постер в область превью целиком, сохраняя пропорции
const stage = document.querySelector('.stage');
function fit() {
  if (!canvas.width) return;
  const mobile = matchMedia('(max-width: 820px)').matches;
  const box = stage.getBoundingClientRect();
  const availableWidth = box.width - (mobile ? 32 : 56);
  const availableHeight = mobile ? innerHeight * 0.64 : box.height - 76;
  const ratio = canvas.width / canvas.height;
  let width = availableWidth;
  let height = width / ratio;
  if (height > availableHeight) { height = availableHeight; width = height * ratio; }
  canvas.style.width = `${Math.floor(width)}px`;
  canvas.style.height = `${Math.floor(height)}px`;
}
addEventListener('resize', fit);

function requestPreview() {
  if (busy) { queued = true; return; }
  busy = true;
  const [width, height] = sizeFor(state.ratio, PREVIEW_LONG);
  previewWorker.postMessage({ id: ++jobId, params: renderParams(), width, height });
}
previewWorker.onmessage = ({ data }) => {
  if (!data.data) return;
  canvas.width = data.width;
  canvas.height = data.height;
  fit();
  canvas.classList.add('ready');
  ctx.putImageData(new ImageData(data.data, data.width, data.height), 0, 0);
  $('meta-time').textContent = `превью ${data.ms} мс`;
  busy = false;
  if (queued) { queued = false; requestPreview(); }
};

/* ---------- Панель ---------- */

function buildPanel() {
  $('presets').innerHTML = PRESETS.map(p => `
    <button type="button" class="preset" data-preset="${p.id}" style="--a:${p.palette[1][1]};--b:${p.palette[Math.floor(p.palette.length / 2)][1]};--c:${p.palette[p.palette.length - 2][1]}">
      <i aria-hidden="true"></i><span>${p.title}</span>
    </button>`).join('');
  $('sliders').innerHTML = SLIDERS.map(s => `
    <label class="slider" title="${s.hint}"><span>${s.label} <output data-out="${s.key}"></output></span>
      <input type="range" data-key="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}">
    </label>`).join('');
  $('ratios').innerHTML = Object.keys(RATIOS).map(r => `<button type="button" class="chip" data-ratio="${r}">${r === 'A' ? 'A-формат' : r}</button>`).join('');
  $('sizes').innerHTML = EXPORT_SIZES.map(px => `<button type="button" class="chip" data-size="${px}">${px} px</button>`).join('');
}

function syncPanel() {
  for (const button of document.querySelectorAll('[data-preset]')) button.setAttribute('aria-pressed', String(button.dataset.preset === state.preset));
  for (const input of document.querySelectorAll('[data-key]')) {
    input.value = state[input.dataset.key];
    document.querySelector(`[data-out="${input.dataset.key}"]`).textContent = Number(state[input.dataset.key]).toFixed(input.step < 1 ? 2 : 0);
  }
  $('seed').value = state.seed;
  $('hue').value = state.hue;
  $('hue-out').textContent = `${state.hue > 0 ? '+' : ''}${state.hue}°`;
  const palette = effectivePalette();
  $('swatches').innerHTML = palette.map(([, color], i) => `<label class="swatch" style="--c:${color}" title="${color}"><input type="color" value="${color}" data-stop="${i}" aria-label="Цвет ${i + 1}"></label>`).join('');
  $('ramp').style.background = `linear-gradient(90deg, ${palette.map(([t, c]) => `${c} ${Math.round(t * 100)}%`).join(', ')})`;
  for (const chip of document.querySelectorAll('[data-ratio]')) chip.setAttribute('aria-pressed', String(chip.dataset.ratio === state.ratio));
  for (const chip of document.querySelectorAll('[data-size]')) chip.setAttribute('aria-pressed', String(Number(chip.dataset.size) === exportSize));
  const [w, h] = sizeFor(state.ratio, exportSize);
  $('meta-size').textContent = `${state.preset ? `${PRESETS.find(p => p.id === state.preset).title} · ` : ''}зерно ${state.seed} · экспорт ${w} × ${h}`;
}

let hashTimer;
function update(patch, { keepPreset = false } = {}) {
  state = { ...state, ...patch, ...(keepPreset ? {} : { preset: null }) };
  syncPanel();
  requestPreview();
  clearTimeout(hashTimer);
  hashTimer = setTimeout(writeHash, 250);
}

const rand = (min, max) => min + Math.random() * (max - min);
const round = (value, step) => Number((Math.round(value / step) * step).toFixed(4));
function randomize() {
  const base = PRESETS[Math.floor(Math.random() * PRESETS.length)];
  update({
    seed: Math.floor(rand(1, 99999)),
    scale: round(rand(0.6, 1.1), 0.01), warp: round(rand(1.5, 2.8), 0.05), gain: round(rand(1.4, 2.0), 0.05), shift: round(rand(-0.15, 0), 0.01),
    palette: base.palette.map(stop => [...stop]),
    hue: Math.random() < 0.5 ? 0 : Math.round(rand(-180, 180)),
  });
}

/* ---------- События ---------- */

document.addEventListener('click', event => {
  const preset = event.target.closest('[data-preset]');
  if (preset) {
    state = { ...fromPreset(PRESETS.find(p => p.id === preset.dataset.preset)), grain: state.grain };
    update({}, { keepPreset: true });
  }
  const ratio = event.target.closest('[data-ratio]');
  if (ratio) update({ ratio: ratio.dataset.ratio }, { keepPreset: true });
  const size = event.target.closest('[data-size]');
  if (size) { exportSize = Number(size.dataset.size); syncPanel(); }
});
$('sliders').addEventListener('input', event => {
  const key = event.target.dataset.key;
  if (key) update({ [key]: Number(event.target.value) });
});
$('seed').addEventListener('change', event => {
  const seed = Math.max(1, Math.min(99999, Math.round(Number(event.target.value)) || 1));
  update({ seed });
});
$('reseed').addEventListener('click', () => update({ seed: Math.floor(rand(1, 99999)) }));
$('random').addEventListener('click', randomize);
$('hue').addEventListener('input', event => update({ hue: Number(event.target.value) }));
$('reverse').addEventListener('click', () => update({ palette: state.palette.map(([t], i, all) => [t, all[all.length - 1 - i][1]]) }));
// Цвет точки палитры: правка задаётся уже с учётом сдвига оттенка, поэтому сдвиг сбрасывается
$('swatches').addEventListener('input', event => {
  const index = event.target.dataset.stop;
  if (index === undefined) return;
  const palette = effectivePalette();
  palette[Number(index)][1] = event.target.value;
  update({ palette, hue: 0 });
});
document.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'r' && !event.target.closest('input') && !event.metaKey && !event.ctrlKey) randomize();
});

/* ---------- Экспорт и ссылка ---------- */

const exportWorker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
$('download').addEventListener('click', () => {
  const [width, height] = sizeFor(state.ratio, exportSize);
  const name = `placats-${state.preset ?? `seed-${state.seed}`}-${width}x${height}.png`;
  $('download').disabled = true;
  $('download').textContent = 'Рисую…';
  $('progress').hidden = false;
  $('progress').style.setProperty('--p', 0);
  exportWorker.onmessage = ({ data }) => {
    if (!data.data) { $('progress').style.setProperty('--p', data.progress); return; }
    const out = document.createElement('canvas');
    out.width = data.width;
    out.height = data.height;
    out.getContext('2d').putImageData(new ImageData(data.data, data.width, data.height), 0, 0);
    out.toBlob(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
      $('download').disabled = false;
      $('download').textContent = 'Скачать PNG';
      $('progress').hidden = true;
    }, 'image/png');
  };
  exportWorker.postMessage({ id: Date.now(), params: renderParams(), width, height, progress: true });
});
$('share').addEventListener('click', async () => {
  writeHash();
  try {
    await navigator.clipboard.writeText(location.href);
    $('share').textContent = 'Ссылка скопирована';
  } catch {
    $('share').textContent = 'Скопируйте адрес из строки браузера';
  }
  setTimeout(() => { $('share').textContent = 'Скопировать ссылку на этот постер'; }, 2000);
});

readHash();
buildPanel();
syncPanel();
requestPreview();
