// Верхняя строка: выезжает при прокрутке или нажатии на крюк, лого возвращает наверх и прячет её.
(() => {
  const bar = document.querySelector('#topbar');
  if (!bar) return;
  const SHOW_AFTER = 80;
  const links = [...bar.querySelectorAll('.topbar-nav a')];
  let returning = false, returnTimer = 0, pinned = false;
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
  for (const type of ['wheel', 'touchmove', 'keydown']) addEventListener(type, () => { returning = false; }, { passive: true });

  // Крюк: логотип вспыхивает светом, и только потом страница едет к разделам.
  // Без анимации (FX OFF или «уменьшить движение») — обычный переход по якорю сразу.
  const hook = document.querySelector('.hook');
  const stage = document.querySelector('.poster-stage');
  const designSection = document.querySelector('#design');
  const FLASH_PEAK = 420; // мс: прокрутка стартует, когда вспышка уже гаснет
  let flashTimer = 0;
  hook?.addEventListener('click', event => {
    pinned = true; returning = false; show(true);
    const calm = document.documentElement.classList.contains('fx-off') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm || !stage || !designSection) return;
    event.preventDefault();
    if (flashTimer) return; // повторный клик во время вспышки ничего не перезапускает
    stage.classList.remove('is-flashing');
    void stage.offsetWidth; // перезапуск анимации
    stage.classList.add('is-flashing');
    flashTimer = setTimeout(() => {
      flashTimer = 0;
      history.pushState(null, '', '#design');
      designSection.scrollIntoView({ behavior: 'smooth' });
      designSection.focus({ preventScroll: true });
    }, FLASH_PEAK);
  });
  stage?.addEventListener('animationend', event => { if (event.animationName === 'stage-flash') stage.classList.remove('is-flashing'); });

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
