// Заголовки разделов плавно появляются при прокрутке (анимацию .arrive задаёт style.css).
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('arrive');
      observer.unobserve(entry.target);
    }
  });
  document.querySelectorAll('.block h2, .kwork p').forEach(element => observer.observe(element));
}

// Соцсети: бесконечная лента стеклянных кнопок
(() => {
  const row = document.querySelector('.socials-row');
  if (!row) return;
  const stage = row.parentElement;
  const originals = [...row.children];
  const SPEED = 45; // px в секунду
  let builtFor = 0;

  // Лента = набор кнопок, повторённый до ширины экрана, и его точная копия; сдвиг на −50% замыкает круг без шва
  function build() {
    const width = stage.clientWidth;
    if (!width || width === builtFor) return;
    builtFor = width;
    row.classList.remove('is-looping');
    row.replaceChildren(...originals);
    const setWidth = () => originals.reduce((sum, item) => sum + item.getBoundingClientRect().width + parseFloat(getComputedStyle(item).marginRight), 0);
    const one = setWidth();
    const copies = Math.max(1, Math.ceil(width / one));
    const set = [];
    for (let k = 0; k < copies; k++) set.push(...originals.map(item => k ? clone(item) : item));
    row.replaceChildren(...set, ...set.map(clone));
    row.style.setProperty('--loop', `${(one * copies / SPEED).toFixed(1)}s`);
    row.classList.add('is-looping');
  }
  function clone(item) {
    const copy = item.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true'); // для скринридеров и Tab — только первые три кнопки
    copy.querySelector('a').tabIndex = -1;
    return copy;
  }

  // Блик следует за курсором (делегирование — работает и на копиях)
  row.addEventListener('pointermove', event => {
    const button = event.target.closest('.glass');
    if (!button) return;
    const box = button.getBoundingClientRect();
    button.style.setProperty('--mx', `${event.clientX - box.left}px`);
    button.style.setProperty('--my', `${event.clientY - box.top}px`);
  });
  row.addEventListener('pointerout', event => {
    const button = event.target.closest('.glass');
    if (button && !button.contains(event.relatedTarget)) { button.style.removeProperty('--mx'); button.style.removeProperty('--my'); }
  });

  if ('ResizeObserver' in window) new ResizeObserver(build).observe(stage); else addEventListener('resize', build);
  window.I18N?.onChange(() => { builtFor = 0; build(); }); // другой язык — другая ширина кнопок
  build();
})();

// Стеклянная строка Kwork: блик следует за курсором
document.querySelectorAll('.kwork-glass').forEach(panel => {
  panel.addEventListener('pointermove', event => {
    const box = panel.getBoundingClientRect();
    panel.style.setProperty('--mx', `${event.clientX - box.left}px`);
    panel.style.setProperty('--my', `${event.clientY - box.top}px`);
  });
  panel.addEventListener('pointerleave', () => { panel.style.removeProperty('--mx'); panel.style.removeProperty('--my'); });
});

// Проекты: стрелка раскрывает и сворачивает проекты после третьего
(() => {
  const more = document.querySelector('#projects-more');
  const toggle = document.querySelector('.projects-toggle');
  if (!more || !toggle) return;
  const row = toggle.parentElement, label = toggle.querySelector('.projects-toggle-label');
  const say = text => window.I18N ? I18N.set(label, text) : (label.textContent = text);
  more.inert = true; // свёрнутые карточки не ловят Tab и клики
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    row.classList.toggle('is-open', open);
    more.inert = !open;
    say(open ? 'Свернуть проекты' : 'Показать все проекты');
    if (open) {
      more.style.maxHeight = `${more.getBoundingClientRect().height}px`;
      more.classList.remove('is-collapsed');
      void more.offsetHeight; // зафиксировать стартовую высоту, чтобы переход сработал
      more.style.maxHeight = `${more.scrollHeight}px`;
      clearTimeout(more.timer); // после раскрытия снимаем ограничение — карточки могут менять высоту
      // анимация сборки в заглушке стартует с начала, когда раскрытие закончилось, а не поверх него
      more.timer = setTimeout(() => {
        if (toggle.getAttribute('aria-expanded') !== 'true') return;
        more.style.maxHeight = 'none';
        more.querySelectorAll('.build').forEach(b => b.classList.add('build-run'));
      }, 800);
    } else {
      clearTimeout(more.timer);
      more.querySelectorAll('.build').forEach(b => b.classList.remove('build-run'));
      more.style.maxHeight = `${more.scrollHeight}px`;
      void more.offsetHeight;
      more.style.maxHeight = '';
      more.classList.add('is-collapsed');
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
})();
