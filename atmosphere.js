const atmosphere = document.querySelector('.atmosphere');
const field = document.querySelector('#dust');
const context = field.getContext('2d');
const switcher = document.querySelector('#fx');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let enabled = !preference.matches;
let frame = 0;
let previous = 0;
let phase = 0;
let motes = [];
const aim = { x: .52, y: .42 };
const halo = { ...aim };
function sizeField() {
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  field.width = Math.round(innerWidth * ratio);
  field.height = Math.round(innerHeight * ratio);
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  motes = Array.from({ length: Math.min(100, Math.round(innerWidth / 13) + 18) }, () => ({
    x: Math.random(), y: Math.random(), speed: 3 + Math.random() * 10,
    radius: .5 + Math.random() * 1.2, offset: Math.random() * 6.28
  }));
}
// Свечение за курсором: вытягивается по направлению движения — получается размытый «шлейф».
// Направление и длину берём из сглаженной скорости: при резком развороте шлейф плавно сжимается
// в круг и вытягивается уже в новую сторону, а не перескакивает.
const aureole = atmosphere.querySelector('.aureole');
const trail = { x: halo.x * innerWidth, y: halo.y * innerHeight, vx: 0, vy: 0 };
function moveAureole() {
  const x = halo.x * innerWidth, y = halo.y * innerHeight;
  trail.vx += (x - trail.x - trail.vx) * .12;
  trail.vy += (y - trail.y - trail.vy) * .12;
  trail.x = x; trail.y = y;
  const stretch = 1 + Math.min(Math.hypot(trail.vx, trail.vy) / 12, 1.5);
  const angle = Math.atan2(trail.vy, trail.vx);
  aureole.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${angle.toFixed(3)}rad) scale(${stretch.toFixed(3)},${(1 / Math.sqrt(stretch)).toFixed(3)})`;
}
function draw(now) {
  if (!enabled || document.hidden || !context) return;
  phase += Math.min(50, now - (previous || now)) / 1000;
  previous = now;
  halo.x += (aim.x - halo.x) * .055;
  halo.y += (aim.y - halo.y) * .055;
  moveAureole();
  context.clearRect(0, 0, innerWidth, innerHeight);
  for (const mote of motes) {
    const left = mote.x * innerWidth + Math.sin(phase * .18 + mote.offset) * 16;
    const top = ((mote.y * innerHeight - phase * mote.speed) % innerHeight + innerHeight) % innerHeight;
    const alpha = .22 + .18 * (1 + Math.sin(phase + mote.offset));
    context.fillStyle = `rgba(236,236,236,${alpha})`;
    context.beginPath();context.arc(left, top, mote.radius, 0, Math.PI * 2);context.fill();
    if (mote.radius > 1.55) { context.fillRect(left - 3, top - .4, 6, .8);context.fillRect(left - .4, top - 3, .8, 6); }
  }
  frame = requestAnimationFrame(draw);
}
function refresh() {
  cancelAnimationFrame(frame);
  previous = 0;
  document.documentElement.classList.toggle('fx-off', !enabled);
  switcher.setAttribute('aria-pressed', String(enabled));
  switcher.textContent = enabled ? 'FX ON' : 'FX OFF';
  if (enabled && !document.hidden) frame = requestAnimationFrame(draw);
}
addEventListener('pointermove', event => { aim.x = event.clientX / innerWidth; aim.y = event.clientY / innerHeight; }, { passive: true });
addEventListener('resize', sizeField);
preference.addEventListener('change', () => { enabled = !preference.matches; refresh(); });
switcher.addEventListener('click', () => { enabled = !enabled; refresh(); });
document.addEventListener('visibilitychange', refresh);
sizeField();refresh();
