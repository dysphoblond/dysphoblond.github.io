// Ears of God — концепт-лендинг. Все цены и сроки берутся из одних данных ниже.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const PARTS = {
  shell: { title: 'Корпус', spec: '18 мм алюминия 6061', text: 'Шар фрезеруем из блока весом 210 кг — после обработки остаётся 38. Толстая стенка и форма без параллельных граней: корпус не гудит, внутри не возникает стоячих волн.' },
  tweeter: { title: 'Твитер', spec: 'Бериллиевый купол 25 мм', text: 'Бериллий в четыре раза жёстче алюминия и легче его, поэтому купол не гнётся вплоть до 40 кГц. Стоит точно в центре среднечастотника.' },
  mid: { title: 'Среднечастотник', spec: '130 мм, соосно с твитером', text: 'Голос и инструменты приходят из одной точки. Сцена не разваливается, даже если сесть сбоку от центра дивана.' },
  woofer: { title: 'Басовый динамик', spec: '200 мм, смотрит в пол', text: 'Излучает вниз, в узкий зазор между корпусом и полом: шар стоит без стойки и ножек. Бас расходится одинаково во все стороны, поэтому колонку можно поставить в 30 см от стены.' },
  radiator: { title: 'Пассивный излучатель', spec: '200 мм, на задней стороне', text: 'Работает вместо фазоинвертора: добавляет баса, но не шумит воздухом в трубе на громких местах.' },
  dsp: { title: 'Усилители и процессор', spec: '3 × 250 Вт, класс D', text: 'Свой усилитель у каждого динамика. Процессор выравнивает звук по замерам именно этого экземпляра — их записывают при калибровке.' },
};

/* ---------- Шапка ---------- */
const header = $('#header');
const burger = $('#burger');
const mobileNav = $('#mobile-nav');
const setMenu = open => {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.classList.toggle('open', open);
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
mobileNav.addEventListener('click', event => { if (event.target.closest('a, button')) setMenu(false); });
const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
// Высота шапки нужна сценам моделей, чтобы прилипать прямо под ней
const setHeaderH = () => document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
setHeaderH();
addEventListener('resize', setHeaderH);

/* ---------- Выпадающие меню «Модели» и «Мастерская» ---------- */
const drops = $$('.nav-drop');
function closeDrops(except) {
  drops.forEach(d => {
    if (d === except) return;
    d.setAttribute('aria-expanded', 'false');
    $('#' + d.getAttribute('aria-controls')).hidden = true;
  });
}
drops.forEach(d => d.addEventListener('click', () => {
  const open = d.getAttribute('aria-expanded') !== 'true';
  closeDrops(d);
  d.setAttribute('aria-expanded', String(open));
  $('#' + d.getAttribute('aria-controls')).hidden = !open;
}));
$$('.mega').forEach(m => m.addEventListener('click', event => { if (event.target.closest('a')) closeDrops(); }));
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeDrops(); });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const open = drops.find(d => d.getAttribute('aria-expanded') === 'true');
  closeDrops();
  if (open) open.focus();
});
addEventListener('scroll', () => { if (scrollY > 400) closeDrops(); }, { passive: true });

/* ---------- Архив: лента листается стрелками, колесом и свайпом ---------- */
const arc = $('#archive-scroll');
const arcStep = () => $('.archive li', arc).offsetWidth;
const arcButtons = () => {
  $('#arc-prev').disabled = arc.scrollLeft < 4;
  $('#arc-next').disabled = arc.scrollLeft + arc.clientWidth > arc.scrollWidth - 4;
};
$('#arc-prev').addEventListener('click', () => arc.scrollBy({ left: -arcStep(), behavior: reduce ? 'auto' : 'smooth' }));
$('#arc-next').addEventListener('click', () => arc.scrollBy({ left: arcStep(), behavior: reduce ? 'auto' : 'smooth' }));
arc.addEventListener('scroll', arcButtons, { passive: true });
addEventListener('resize', arcButtons);
arcButtons();

/* ---------- Разрез ---------- */
let currentPart = null;
function showPart(id) {
  if (id === currentPart) return; // не перезапускать анимацию выноски на той же детали
  currentPart = id;
  $$('#xsec .part, #xsec .hot, #xsec .callout').forEach(g => g.classList.toggle('on', g.dataset.part === id));
  $$('#part-list button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.part === id)));
  const p = PARTS[id];
  $('#part-card').innerHTML = `<h3>${p.title}</h3><p class="part-spec">${p.spec}</p><p>${p.text}</p>`;
}
$('#xsec').addEventListener('click', event => { const g = event.target.closest('[data-part]'); if (g) showPart(g.dataset.part); });
// На узких экранах выноски скрыты (подпись — карточкой под схемой), поэтому схему обрезаем до самого шара
const narrow = matchMedia('(max-width: 900px)');
const fitXsec = () => $('#xsec').setAttribute('viewBox', narrow.matches ? '270 0 440 470' : '0 0 980 470');
fitXsec();
if (narrow.addEventListener) narrow.addEventListener('change', fitXsec);
// Мышью достаточно навести на деталь или номер — подпись появится сразу на схеме
$$('#xsec .part, #xsec .hot').forEach(g => g.addEventListener('mouseenter', () => showPart(g.dataset.part)));
$('#part-list').addEventListener('click', event => { const b = event.target.closest('[data-part]'); if (b) showPart(b.dataset.part); });
showPart('shell');

/* ---------- График АЧХ ---------- */
function showLine(id) {
  $$('.fr-tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.line === id)));
  $$('.fr-line').forEach(l => l.classList.toggle('on', l.dataset.line === id));
  const line = $(`.fr-line[data-line="${id}"]`);
  line.parentNode.appendChild(line); // активная линия поверх остальных
}
$('.fr-tabs').addEventListener('click', event => {
  const b = event.target.closest('[data-line]');
  if (!b) return;
  $('.fr-board').classList.add('drawn');
  showLine(b.dataset.line);
});
showLine('orb');

/* ---------- Залы: карта и список подсвечивают друг друга ---------- */
function markCity(i) {
  $$('.city').forEach(c => c.classList.toggle('on', c.dataset.city === i));
  $$('#room-list li').forEach(li => li.classList.toggle('on', li.dataset.city === i));
}
$$('.city, #room-list li').forEach(el => {
  el.addEventListener('mouseenter', () => markCity(el.dataset.city));
  el.addEventListener('mouseleave', () => markCity(null));
});
$$('.city').forEach(c => c.addEventListener('click', () => {
  const li = $(`#room-list li[data-city="${c.dataset.city}"]`);
  markCity(c.dataset.city);
  $('.text-link', li).focus();
}));

/* ---------- Окно заявки ---------- */
const dialog = $('#dialog');
const dialogForm = $('#dialog-form');
const done = $('.dialog-done', dialogForm);
const roomField = $('#room-field');
const MODES = {
  listen: b => ({ title: 'Запись на прослушивание', sub: 'Час в зале и все три модели. Перезвоним, чтобы выбрать время.', submit: 'Записаться', room: true,
    room0: b.dataset.room, done: () => `${dialogForm.elements.room.value}: перезвоним в течение часа, чтобы выбрать время.` }),
  partner: () => ({ title: 'Партнёрам', sub: 'Для салонов и студий, у которых есть отдельный зал от 25 м². Пришлём условия и прайс для партнёров.', submit: 'Запросить условия', room: false,
    done: () => 'Пришлём условия в течение двух рабочих дней.' }),
  press: () => ({ title: 'Прессе', sub: 'Пресс-кит, фото в высоком разрешении и пара колонок на тест для обзора.', submit: 'Запросить пресс-кит', room: false,
    done: () => 'Пресс-кит отправим сегодня, про тестовую пару договоримся отдельно.' }),
  catalog: () => ({ title: 'Каталог в PDF', sub: '24 страницы: модели, отделки, замеры и размеры для дизайнеров интерьера.', submit: 'Получить каталог', room: false,
    done: () => 'Каталог отправим на указанный контакт в течение часа.' }),
  ask: () => ({ title: 'Спросите мастера', sub: 'Про комнату, подключение или отделку. Мастер отвечает в течение рабочего дня.', submit: 'Отправить', room: false,
    done: () => 'Вопрос у мастера. Ответим в течение рабочего дня.' }),
};
let mode = MODES.ask();
document.addEventListener('click', event => {
  const button = event.target.closest('[data-dialog]');
  if (!button) return;
  event.preventDefault();
  mode = MODES[button.dataset.dialog](button);
  $('#dialog-title').textContent = mode.title;
  $('#dialog-sub').textContent = mode.sub;
  $('#dialog-submit').textContent = mode.submit;
  roomField.hidden = !mode.room;
  if (mode.room0) {
    const opt = [...dialogForm.elements.room.options].find(o => o.text.startsWith(mode.room0));
    if (opt) opt.selected = true;
  }
  done.hidden = true;
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  dialogForm.elements.name.focus();
});
const closeDialog = () => (typeof dialog.close === 'function' ? dialog.close() : dialog.removeAttribute('open'));
$('#dialog-close').addEventListener('click', closeDialog);
$('#dialog-ok').addEventListener('click', closeDialog);
dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });

const checks = {
  name: v => (v.trim().length >= 2 ? '' : 'Как к вам обращаться?'),
  contact: v => (v.replace(/\D/g, '').length >= 10 || /^\S+@\S+\.\S+$/.test(v.trim()) ? '' : 'Нужен телефон или почта'),
};
dialogForm.addEventListener('submit', event => {
  event.preventDefault();
  let ok = true;
  [dialogForm.elements.name, dialogForm.elements.contact].forEach(input => {
    const msg = checks[input.name](input.value);
    input.closest('.field').classList.toggle('invalid', !!msg);
    $(`[data-for="${input.name}"]`, dialogForm).textContent = msg;
    if (msg) ok = false;
  });
  if (!ok) return;
  $('#done-title').textContent = `Спасибо, ${dialogForm.elements.name.value.trim()}`;
  $('#done-sub').textContent = mode.done();
  done.hidden = false;
  dialogForm.reset();
  $('#dialog-ok').focus();
});

/* ---------- Появление крупных блоков ---------- */
(function motion() {
  const items = $$('.manifest, .story-grid > *, .tile, .details-grid, .cats, .tech, .fr-board, .work-grid h2, .steps, .passport, .archive, .rooms');
  const order = new Map();
  items.forEach(el => {
    const i = order.get(el.parentElement) ?? 0;
    order.set(el.parentElement, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 3) * 90}ms`);
    el.dataset.reveal = '';
  });
  if (reduce || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-motion');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(el => io.observe(el));
})();
