// Раздел «Дизайн»: глазик «рассмотреть поближе» следует за курсором,
// по клику работа открывается поверх бесшовного градиента из её основного и акцентного цветов.
(() => {
  const works = [...document.querySelectorAll('.work')];
  const viewer = document.querySelector('#work-viewer');
  if (!works.length || !viewer?.showModal) return;
  const image = viewer.querySelector('.viewer-figure img');
  let selected = 0;

  // Глазик едет за курсором внутри карточки
  for (const work of works) {
    work.addEventListener('pointermove', event => {
      const box = work.getBoundingClientRect();
      work.style.setProperty('--px', `${event.clientX - box.left}px`);
      work.style.setProperty('--py', `${event.clientY - box.top}px`);
    });
    work.addEventListener('pointerleave', () => { work.style.removeProperty('--px'); work.style.removeProperty('--py'); });
  }

  // Основной цвет — самый заметный насыщенный оттенок, акцентный — самый сильный оттенок, далёкий от него
  function paletteOf(picture) {
    const size = 72, canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(picture, 0, 0, size, size);
    const data = context.getImageData(0, 0, size, size).data; // на file:// бросит SecurityError
    const bins = Array.from({ length: 24 }, () => ({ weight: 0, r: 0, g: 0, b: 0, n: 0 }));
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255, light = (max + min) / 2;
      const chroma = max - min;
      if (chroma < .18 || light < .1 || light > .92) continue;
      let hue = max === r / 255 ? ((g - b) / 255 / chroma) % 6 : max === g / 255 ? (b - r) / 255 / chroma + 2 : (r - g) / 255 / chroma + 4;
      hue = (hue * 60 + 360) % 360;
      const bin = bins[Math.floor(hue / 15)];
      bin.weight += chroma; bin.r += r; bin.g += g; bin.b += b; bin.n++;
    }
    const ranked = bins.map((bin, k) => ({ ...bin, hue: k * 15 + 7.5 })).filter(bin => bin.n > 3).sort((a, b) => b.weight - a.weight);
    if (!ranked.length) return null;
    // Среднее по оттенку выходит блёклым — поднимаем насыщенность и держим цвет в средней яркости
    const mean = bin => vivid([bin.r / bin.n, bin.g / bin.n, bin.b / bin.n]);
    const main = ranked[0];
    const distance = bin => Math.min(Math.abs(bin.hue - main.hue), 360 - Math.abs(bin.hue - main.hue));
    const accent = ranked.find(bin => distance(bin) >= 30 && bin.weight > main.weight * .04);
    const primary = mean(main);
    const second = accent ? mean(accent) : primary.map(v => Math.round(v * .45 + 255 * .25));
    const hex = rgb => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
    return [hex(primary), hex(second)];
  }

  function vivid([r, g, b]) {
    [r, g, b] = [r / 255, g / 255, b / 255];
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    let h = 0, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    if (d) h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    s = Math.min(1, s * 1.4 + .1);
    const light = Math.min(.58, Math.max(.32, l));
    const c = (1 - Math.abs(2 * light - 1)) * s, x = c * (1 - Math.abs(h % 2 - 1)), m = light - c / 2;
    const [rr, gg, bb] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h) % 6];
    return [rr, gg, bb].map(v => Math.round((v + m) * 255));
  }

  function colorsFor(work) {
    if (work.dataset.colors) return work.dataset.colors.split(',');
    try {
      const colors = paletteOf(work.querySelector('img'));
      if (colors) work.dataset.colors = colors.join(',');
      return colors;
    } catch { return null; }
  }

  function select(index) {
    selected = (index + works.length) % works.length;
    const work = works[selected], thumb = work.querySelector('img');
    const [primary, accent] = colorsFor(work) ?? ['#3a3a3a', '#9a9a9a'];
    viewer.style.setProperty('--c1', primary);
    viewer.style.setProperty('--c2', accent);
    viewer.style.setProperty('--c3', `color-mix(in srgb, ${primary} 45%, #000)`);
    image.src = work.href;
    image.alt = thumb.alt;
    image.classList.remove('is-entering');
    void image.offsetWidth; // перезапуск анимации появления
    image.classList.add('is-entering');
  }

  works.forEach((work, index) => work.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // открыть в новой вкладке — как обычно
    event.preventDefault();
    select(index);
    viewer.showModal();
  }));
  viewer.classList.toggle('is-single', works.length < 2);
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('.viewer-prev').addEventListener('click', () => select(selected - 1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => select(selected + 1));
  // Клик мимо картинки и кнопок закрывает просмотр
  viewer.addEventListener('click', event => { if (!event.target.closest('img, button')) viewer.close(); });
  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    select(selected + (event.key === 'ArrowLeft' ? -1 : 1));
  });
})();
