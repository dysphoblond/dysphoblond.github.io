// Смена второго слова на обложке: potential → design → mini-apps → sites → bots → landings → frontend.
// Каждое слово — отдельная картинка в «drafts cover/words», показывается 3 секунды.
(() => {
  const HOLD = 3000, OUT = 420, IN = 520, MELT = 80;
  const slot = document.querySelector('.word-slot');
  if (!slot) return;
  const words = [...slot.querySelectorAll('.word')];
  const meltMap = document.querySelector('#melt-map');
  const meltNoise = document.querySelector('#melt-noise');
  let index = 0;

  const calm = () => document.documentElement.classList.contains('fx-off');
  const tween = (ms, draw) => new Promise(done => {
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / ms);
      draw(p);
      if (p < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });

  async function swap() {
    const current = words[index], next = words[index = (index + 1) % words.length];
    const animate = !calm() && !document.hidden;
    if (animate) {
      meltNoise.setAttribute('seed', String(1 + Math.floor(Math.random() * 90)));
      slot.setAttribute('filter', 'url(#melt)');
      await tween(OUT, p => { meltMap.setAttribute('scale', p * p * MELT); current.setAttribute('opacity', 1 - p); });
    }
    current.setAttribute('opacity', 0);
    if (animate) {
      await tween(IN, p => { meltMap.setAttribute('scale', (1 - p) ** 2 * MELT); next.setAttribute('opacity', p); });
      slot.removeAttribute('filter');
    }
    next.setAttribute('opacity', 1);
    setTimeout(swap, HOLD);
  }

  // Подгружаем картинки заранее, чтобы слово не мигало пустотой при первой смене
  Promise.all(words.map(word => {
    const image = new Image();
    image.src = word.getAttribute('href');
    return image.decode().catch(() => {});
  })).then(() => setTimeout(swap, HOLD));
})();
