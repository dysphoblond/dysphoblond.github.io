// Верхняя строка: выезжает при прокрутке или нажатии на крюк, лого возвращает наверх и прячет её.
(() => {
  const bar = document.querySelector('#topbar');
  if (!bar) return;
  const SHOW_AFTER = 80;
  const links = [...bar.querySelectorAll('.topbar-nav a')];
  let returning = false, returnTimer = 0, pinned = false, locked = false;
  const nav = bar.querySelector('.topbar-nav');
  let pending = false, current;

  // Стеклянная капсула под активным пунктом: одна на всё меню, переезжает от пункта к пункту
  const pill = document.createElement('span');
  pill.className = 'nav-pill';
  pill.setAttribute('aria-hidden', 'true');
  nav.prepend(pill);
  function placePill(link) {
    if (!link) { pill.classList.remove('is-on'); return; }
    if (!pill.classList.contains('is-on')) pill.classList.add('is-still'); // первое появление — без переезда из угла
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.height = `${link.offsetHeight}px`;
    pill.style.transform = `translate(${link.offsetLeft}px, ${link.offsetTop}px)`;
    pill.classList.add('is-on');
    requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.remove('is-still')));
  }
  addEventListener('resize', () => placePill(current));
  window.I18N?.onChange(() => placePill(current)); // длина слов меняется вместе с языком

  const always = bar.hasAttribute('data-always'); // на странице галереи строка видна всегда, лого ведёт на главную
  const show = visible => bar.classList.toggle('is-shown', always || visible);
  const update = () => {
    if (returning) { if (scrollY <= 2) returning = false; return; }
    if (pinned) { if (scrollY > SHOW_AFTER) pinned = false; return; } // после крюка строка держится, пока страница едет вниз
    show(scrollY > SHOW_AFTER);
  };
  addEventListener('scroll', update, { passive: true });
  // Пользователь сам крутит страницу — перестаём ждать возврата наверх
  for (const type of ['wheel', 'touchmove', 'keydown']) addEventListener(type, () => { if (!locked) returning = false; }, { passive: true });

  // Крюк и прокрутка с постера: логотип вспыхивает светом, и только потом страница едет к разделам.
  // Обратно — прокрутка вверх от начала разделов просто возвращает на постер, без вспышки.
  // Без анимации (FX OFF или «уменьшить движение») — тот же скачок, но без вспышки.
  const hook = document.querySelector('.hook');
  const stage = document.querySelector('.poster-stage');
  const designSection = document.querySelector('#design');
  const FLASH_PEAK = 420; // мс: прокрутка стартует, когда вспышка уже гаснет
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduce.matches || document.documentElement.classList.contains('fx-off');
  let flashTimer = 0;

  function flash() {
    if (!stage || calm()) return;
    stage.classList.remove('is-flashing');
    void stage.offsetWidth; // перезапуск анимации
    stage.classList.add('is-flashing');
  }
  stage?.addEventListener('animationend', event => { if (event.animationName === 'stage-flash') stage.classList.remove('is-flashing'); });

  // Где окажется страница, когда раздел «Дизайн» доедет до верха (с учётом отступа под строку меню)
  const sectionsTop = () => designSection.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(designSection).scrollMarginTop) || 0);

  // Пока идёт скачок, колесо, свайп и клавиши не мешают: инерция тачпада не утаскивает страницу дальше
  let lastInput = 0;
  function lockUntilArrived(dest) {
    locked = true;
    const started = performance.now();
    const wait = () => {
      const now = performance.now();
      const arrived = Math.abs(scrollY - dest()) < 3;
      // отпускаем, когда доехали и инерция стихла (нет ввода 220 мс), но не позже чем через 2 с
      if ((arrived && now - lastInput > 220) || now - started > 2000) { locked = false; return; }
      requestAnimationFrame(wait);
    };
    requestAnimationFrame(wait);
  }

  function goSections({ fromHook = false } = {}) {
    if (!designSection || flashTimer) return;
    pinned = true; returning = false; show(true);
    lockUntilArrived(sectionsTop);
    const go = () => {
      flashTimer = 0;
      if (fromHook) history.pushState(null, '', '#design');
      designSection.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
      designSection.focus({ preventScroll: true });
    };
    if (calm() || !stage) { go(); return; }
    flash();
    flashTimer = setTimeout(go, FLASH_PEAK);
  }

  function goPoster() {
    if (flashTimer) return;
    returning = true; pinned = false; show(false);
    clearTimeout(returnTimer);
    returnTimer = setTimeout(() => { returning = false; }, 2000);
    history.replaceState(null, '', location.pathname + location.search);
    lockUntilArrived(() => 0);
    scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' }); // наверх без вспышки
  }

  hook?.addEventListener('click', event => {
    event.preventDefault();
    goSections({ fromHook: true });
  });

  // Прокрутка в зоне постера: вниз — скачок к разделам, вверх от начала разделов — скачок на постер.
  // Возвращает true, если скачок сработал (тогда обычную прокрутку отменяем)
  function intent(down) {
    if (!designSection || !stage) return false;
    const y = scrollY, target = sectionsTop();
    if (down && y < target - 4) { goSections(); return true; }
    if (!down && y > 2 && y <= target + 4) { goPoster(); return true; }
    return false;
  }
  const busyTarget = el => el?.closest?.('input, textarea, select, [contenteditable], .game, dialog[open]');

  addEventListener('wheel', event => {
    lastInput = performance.now();
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || busyTarget(event.target)) return;
    if (locked) { event.preventDefault(); return; }
    if (event.deltaY && intent(event.deltaY > 0)) event.preventDefault();
  }, { passive: false });

  // Свайп на телефоне: в зоне постера родную прокрутку не запускаем, а решаем по направлению пальца
  let touchY = null, touchDone = false;
  addEventListener('touchstart', event => {
    lastInput = performance.now();
    touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
    touchDone = false;
  }, { passive: true });
  addEventListener('touchmove', event => {
    lastInput = performance.now();
    if (touchY === null || event.touches.length !== 1 || busyTarget(event.target)) return;
    if (locked || touchDone) { if (event.cancelable) event.preventDefault(); return; }
    if (!designSection || scrollY > sectionsTop() + 4) return; // ниже начала разделов — обычная прокрутка
    const dy = touchY - event.touches[0].clientY;
    if (Math.abs(dy) < 8) { if (event.cancelable) event.preventDefault(); return; }
    if (intent(dy > 0)) { touchDone = true; if (event.cancelable) event.preventDefault(); }
  }, { passive: false });

  addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || busyTarget(event.target) || event.target.closest?.('button, a, [role="application"]') && event.key === ' ') return;
    const down = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey);
    const up = ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey);
    if (!down && !up) return;
    lastInput = performance.now();
    if (locked) { event.preventDefault(); return; }
    if (intent(down)) event.preventDefault();
  });

  const toTop = event => {
    event.preventDefault();
    returning = true;
    pinned = false;
    clearTimeout(returnTimer);
    returnTimer = setTimeout(() => { returning = false; }, 2000);
    show(false);
    bar.querySelector(':focus')?.blur();
    history.replaceState(null, '', location.pathname + location.search);
    scrollTo(0, 0); // плавность берётся из CSS (scroll-behavior), с FX OFF — мгновенно
  };
  // Лого и «Наверх» в футере: страница едет наверх, строка сразу уезжает
  if (!always) bar.querySelector('.topbar-logo').addEventListener('click', toTop);
  document.querySelector('footer a[href="#top"]')?.addEventListener('click', toTop);

  // Ссылка на свёрнутый проект сразу раскрывает его
  for (const link of links) link.addEventListener('click', () => {
    const target = document.querySelector(link.hash);
    if (target?.tagName === 'DETAILS') target.open = true;
    links.forEach(other => other.toggleAttribute('aria-current', other === link)); // сразу, даже если прокручивать некуда
    current = link;
    placePill(link);
  });

  // Подсветка раздела, который сейчас на экране: последний, чей верх выше трети окна
  const sections = links.map(link => [link, document.querySelector(link.hash)]).filter(([, section]) => section);
  const highlight = () => {
    pending = false;
    if (!sections.length) return; // в галерее разделов главной нет — подсветка задана в разметке
    let active = null;
    for (const [link, section] of sections) if (section.getBoundingClientRect().top <= innerHeight * .3) active = link;
    // Последний раздел до трети окна не доезжает — у самого низа страницы подсвечиваем его
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) active = sections[sections.length - 1]?.[0] ?? active;
    if (active === current) return;
    current = active;
    for (const [link] of sections) link.toggleAttribute('aria-current', link === active);
    placePill(active);
    // На телефоне лента ссылок шире экрана — докручиваем её к активной ссылке
    if (active && nav.scrollWidth > nav.clientWidth) {
      const left = active.offsetLeft, right = left + active.offsetWidth;
      if (left < nav.scrollLeft || right > nav.scrollLeft + nav.clientWidth - 24) nav.scrollTo({ left: Math.max(0, left - 12), behavior: 'smooth' });
    }
  };
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(highlight); } }, { passive: true });

  update();
  highlight();
})();
