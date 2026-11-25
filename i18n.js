// Переключатель языка RU / EN. Русский текст берётся прямо из разметки, здесь — только английский перевод.
// Новый текст на сайте: добавьте его в EN (ключ — русская строка как на странице) и, если нужно, селектор в TEXT.
(() => {
  const EN = {
    // Меню и заголовки
    'Дизайн': 'Design', 'Проекты': 'Projects', 'Ещё немного...': 'A bit more...', 'Бонус': 'Bonus',
    'Контакты': 'Contacts', 'Соц сети': 'Social media', 'Плакаты и Дизайн постов': 'Posters & Post Design',
    'Плакаты и Дизайн постов: <span>галерея</span>': 'Posters & Post Design: <span>gallery</span>',
    'Your Potential — портфолио разработки': 'Your Potential — development portfolio',
    'Your Potential — портфолио': 'Your Potential — portfolio',
    'Плакаты и Дизайн постов: галерея — Your Potential': 'Posters & Post Design: gallery — Your Potential',
    // Обложка
    'Заказать': 'Order', 'Нажми на крюк': 'Pull the hook', 'Потянуть за крюк — к портфолио': 'Pull the hook — to the portfolio',
    'Постер Your Potential с подвесным крюком': 'Your Potential poster with a hanging hook',
    'Перейти к портфолио': 'Go to the portfolio', 'Анимация': 'Animation', 'Язык': 'Language',
    'Наверх': 'Back to top', 'Разделы сайта': 'Site sections', 'На главную': 'To the home page',
    // Работы
    'рассмотреть поближе': 'take a closer look', 'Рассмотреть побольше': 'See more',
    'Плакаты и Дизайн постов: галерея — все работы': 'Posters & Post Design: gallery — all works',
    'Типографическая композиция Dysph: крупные буквы с огненной фактурой и надпись «but not broken»': 'Dysph typographic composition: large letters with a fiery texture and the words “but not broken”',
    'Вертикальная графика: красные шипастые полосы и синий блок с каплями на фоне бледных анатомических рисунков': 'Vertical graphic: red thorny stripes and a blue block of droplets over pale anatomical drawings',
    'Last Bark: собака под красными звёздами': 'Last Bark: a dog under red stars',
    'Само expression: чёрно-белый коллаж с пиксельной эмблемой, глазами в шипах и повторяющейся надписью «само expression»': 'Samo expression: a black-and-white collage with a pixel emblem, thorn-framed eyes and the repeated words “само expression”',
    'Эго дремлет: белая рука с каплями крови и красные буквы «ЭГО» на розово-сером фоне': 'Ego slumbers: a white hand dripping blood and red letters “ЭГО” on a pink-grey background',
    'Dysphy: глянцевая чёрная фигура с шипастым нимбом, лежащая на камне с белым мехом': 'Dysphy: a glossy black figure with a thorny halo lying on a stone with white fur',
    'Графический глаз в обрамлении лепестков': 'A graphic eye framed by petals',
    'Хром: чёрно-белая абстракция из жидких хромовых линий и зерна': 'Chrome: a black-and-white abstraction of liquid chrome lines and grain',
    'Крыло: красно-белое крыло на кружевном фоне с жёлтыми плашками и красным текстом про вселенную dysphoblonde': 'Wing: a red-and-white wing on a lace background with yellow blocks and red text about the dysphoblonde universe',
    'Хром': 'Chrome', 'Крыло': 'Wing',
    'Просмотр работы': 'Artwork viewer', 'Закрыть': 'Close', 'Закрыть ×': 'Close ×',
    'Предыдущая работа': 'Previous work', 'Следующая работа': 'Next work',
    '← на главную': '← back to home', 'место под постер': 'poster coming soon',
    'Все работы из моего тг-канала': 'All works from my Telegram channel',
    // Проекты
    'Лендинг · концепт': 'Landing page · concept', 'Сайт застройщика · концепт': 'Developer website · concept', 'открыть сайт ↗': 'open site ↗', 'без фреймворков': 'no frameworks',
    'Сайт застройщика загородных посёлков в тёмной строгой стилистике. Слайдер посёлков, подбор дома по фильтрам из общей базы, карточки посёлков со сводкой по спальням, способы покупки, калькулятор, интерактивная планировка и новости.': 'A website for a developer of country-house villages, in a strict dark style. A village slider, home search with filters over a shared database, village cards with a bedroom summary, ways to buy, a cost calculator, an interactive floor plan and news.',
    'Telegram-бот': 'Telegram bot', 'открыть бота в Telegram ↗': 'open the bot in Telegram ↗',
    // Кнопки карточек
    'Открыть сайт ↗': 'Open site ↗', 'Архив моделей ↗': 'Model archive ↗', 'Сайт мастерской люксовых активных колонок. Структура как у производителей hi-end акустики: выпадающие меню, фото каждой модели на весь экран, архив по годам. История мастерской — поверх ночного Петербурга кисти Алексея Боголюбова. Интерактивный разрез, график АЧХ и карта залов.': 'A website for a workshop making luxury active speakers. Structured like hi-end audio makers’ sites: dropdown menus, a full-screen photo for each model, a year-by-year archive. The workshop story sits over a night view of St. Petersburg painted by Alexey Bogolyubov. Interactive cutaway, frequency response chart and showroom map.', 'Подбор дома ↗': 'Find a home ↗', 'Открыть бота ↗': 'Open the bot ↗',
    'Демо в браузере ↗': 'Browser demo ↗', 'Открыть генератор ↗': 'Open the generator ↗',
    // Placats shop и Placats Lab
    'Telegram Mini App · демо': 'Telegram Mini App · demo',
    'Магазин генеративных постеров внутри Telegram. Сами постеры рисует код — шум, искажение координат и зерно. Размер, бумага и рама меняют цену и превью, корзина хранится в облаке Telegram. Заказ приходит владельцу в бот с кнопками статусов, цены пересчитывает сервер.': 'A shop of generative posters inside Telegram. The posters themselves are drawn by code — noise, domain warping and grain. Size, paper and frame change the price and the preview, and the cart lives in Telegram’s cloud. Orders reach the owner in the bot with status buttons, and the server recalculates every price.',
    'Генеративная графика · инструмент': 'Generative graphics · tool', 'без библиотек': 'no libraries',
    'Генератор, которым сделаны постеры Placats shop. Шум Перлина, искажение координат и зерно — ползунки меняют форму и палитру, превью перерисовывается сразу. Готовый постер скачивается в PNG до 4800 px, а параметры хранятся в ссылке.': 'The generator behind the Placats shop posters. Perlin noise, domain warping and grain — sliders change the shape and the palette, and the preview redraws instantly. The finished poster downloads as a PNG up to 4800 px, and the settings live in the link.',
    'Бот учёта трат. Пишешь «кофе 300» или «такси 450 вчера» — текстом или голосом, а он сам определяет категорию и запоминает правки. По команде /month рисует график за месяц и сравнивает с прошлым. Работает на Telegram Serverless: без своего сервера, PNG-график рисуется собственным кодировщиком.': 'An expense-tracking bot. Type “coffee 300” or “taxi 450 yesterday” — as text or by voice — and it picks the category itself and remembers your corrections. The /month command draws a chart for the month and compares it with the previous one. It runs on Telegram Serverless: no server of its own, and the PNG chart is drawn by a custom encoder.',
    'скоро': 'soon', 'в работе': 'in progress', 'Скоро · в работе': 'Coming soon · in progress', 'Новый проект': 'New project', 'Скоро ↗': 'Soon ↗',
    'Проект в работе': 'Project in progress', 'Показать все проекты': 'Show all projects', 'Свернуть проекты': 'Collapse projects',
    // Kwork
    'Заказ на Kwork': 'Order on Kwork',
    'Нужен сайт, бот или дизайн? Напишите мне на Kwork — обсудим задачу и сроки.': 'Need a website, a bot or a design? Message me on Kwork — we’ll talk through the task and the timeline.',
    'Написать на Kwork ↗': 'Message me on Kwork ↗',
    // Пустые разделы
    'Раздел в работе': 'Coming soon',
    // Игра
    'Мини-игра dyspphy fly. Пробел, клик или касание — взмах': 'Mini-game dyspphy fly. Space, click or tap to flap',
    'Нажми, чтобы начать': 'Tap to start', 'пробел · клик · тап': 'space · click · tap', 'рекорд': 'best',
    'Новый рекорд': 'New best', 'Падение': 'Crashed', 'Счёт {n}. Нажми, чтобы ещё раз': 'Score {n}. Tap to try again',
    'Пауза': 'Paused', 'Нажми, чтобы продолжить': 'Tap to continue',
    // Контакты
    'Почта': 'Email', 'написать письмо ↗': 'send an email ↗', 'копировать': 'copy', 'скопировано ✓': 'copied ✓',
    'Заказать на Kwork': 'Order on Kwork', 'безопасная сделка ↗': 'safe deal ↗',
    'Написать в личку': 'Message me directly', 'личные сообщения ↗': 'direct messages ↗',
    // Соцсети и футер
    'Telegram-канал': 'Telegram channel', 'доски и референсы': 'boards & references', 'НАВЕРХ ↑': 'BACK TO TOP ↑'
  };
  // Элементы, чей текст переводится целиком
  const TEXT = ['.project-shot-mock span', '.project-mock .project-title', '.projects-toggle-label', '#hero-title', '.hint-text', '.order-text', '.topbar-nav a', '.block h2', '.work-peek > span', '.work-more',
    '.project-info small', '.project-text', '.project-go', '.project-btn', '.project-stack i', '.kwork-glass p', '.kwork-button',
    '.block-empty span', '.game-title', '.game-text', '.game-hint', '.game-best-label', '.tile small',
    '.tile-link:not(.tile-mail) b', '.tile-foot > span:first-child', '.tile-copy', '.glass b', '.glass small',
    'footer a[href="#top"]', '.viewer-close', '.gallery-back', '.work-slot span', '.hook title'];
  const HTML = ['.gallery-title']; // внутри есть разметка (серое «галерея»)
  const ATTRS = ['aria-label', 'alt'];

  let lang = 'ru';
  try { lang = localStorage.getItem('yp-lang') === 'en' ? 'en' : 'ru'; } catch {}
  const listeners = [];

  const format = (text, vars) => vars ? text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '') : text;
  const t = (ru, vars) => format(lang === 'en' ? EN[ru] ?? ru : ru, vars);

  // Текст, который ставят скрипты (игра, кнопка «копировать»): запоминаем русский оригинал, чтобы переключение языка его подхватило
  function set(element, ru, vars) {
    element.dataset.i18nRu = ru;
    if (vars) element.dataset.i18nVars = JSON.stringify(vars); else delete element.dataset.i18nVars;
    element.textContent = t(ru, vars);
  }

  function apply() {
    document.documentElement.lang = lang;
    for (const element of document.querySelectorAll(TEXT.join(','))) {
      element.dataset.i18nRu ??= element.textContent.trim();
      const vars = element.dataset.i18nVars ? JSON.parse(element.dataset.i18nVars) : undefined;
      element.textContent = t(element.dataset.i18nRu, vars);
    }
    for (const element of document.querySelectorAll(HTML.join(','))) {
      element.dataset.i18nRu ??= element.innerHTML.trim();
      element.innerHTML = t(element.dataset.i18nRu); // перевод берётся только из словаря выше
    }
    for (const name of ATTRS) {
      const key = 'i18n' + name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
      for (const element of document.querySelectorAll(`[${name}]`)) {
        element.dataset[key] ??= element.getAttribute(name);
        element.setAttribute(name, t(element.dataset[key]));
      }
    }
    document.documentElement.dataset.i18nTitle ??= document.title;
    document.title = t(document.documentElement.dataset.i18nTitle);
    for (const button of document.querySelectorAll('.lang [data-lang]')) button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    listeners.forEach(listener => listener(lang));
  }

  function choose(next) {
    lang = next === 'en' ? 'en' : 'ru';
    try { localStorage.setItem('yp-lang', lang); } catch {}
    apply();
  }

  window.I18N = { t, set, apply, onChange: listener => listeners.push(listener), get lang() { return lang; } };
  document.addEventListener('click', event => {
    const button = event.target.closest('.lang [data-lang]');
    if (button) choose(button.dataset.lang);
  });
  apply();
})();
