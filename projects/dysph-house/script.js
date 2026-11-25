// Кольцо+ — меню, подбор дома, посёлки, слайдер, интерактивный план, калькулятор, заявки
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const num = value => new Intl.NumberFormat('ru-RU').format(Math.round(value));
const rub = value => `${num(value)} ₽`;

/* ---------- Шапка и мобильное меню ---------- */
const header = $('#header');
const nav = $('#nav');
const burger = $('#burger');
const syncHeader = () => document.documentElement.style.setProperty('--header-h', `${header.getBoundingClientRect().bottom}px`);
addEventListener('resize', syncHeader);
addEventListener('scroll', syncHeader, { passive: true });
syncHeader();
function setMenu(open) {
  nav.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  if (open) syncHeader();
}
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });

/* ---------- Данные калькулятора (цены вымышленные) ---------- */
const MODELS = {
  blond: { name: 'Blond 96', area: 96, floors: 1, months: 0, hint: '96 м² · 2 спальни' },
  potential: { name: 'Potential 128', area: 128, floors: 1, months: 1, hint: '128 м² · 3 спальни' },
  dysph: { name: 'Dysph 164', area: 164, floors: 2, months: 2, hint: '164 м² · 4 спальни' },
};
const PACKAGES = {
  box: { name: 'Коробка', rate: 38000, months: 4, hint: 'Фундамент, стены, перекрытия, кровля, окна. Фасад не утеплён.' },
  warm: { name: 'Тёплый контур', rate: 52000, months: 5, hint: 'Плюс утепление, штукатурка фасада и входная дверь. Можно зимовать с временным отоплением.' },
  turnkey: { name: 'Под ключ', rate: 77000, months: 6, hint: 'Плюс отопление, вода, электрика, чистовая отделка, сантехника и кухня.' },
  furnished: { name: 'Под ключ с мебелью', rate: 93000, months: 7, hint: 'Плюс мебель, свет и текстиль по проекту нашего дизайнера.' },
};
const FOUNDATIONS = {
  piles: { name: 'Винтовые сваи', line: 'сваи', rate: 0, hint: 'Входят в цену' },
  slab: { name: 'Плита УШП', line: 'плита УШП', rate: 5200, hint: '5 200 ₽/м², тёплый пол в плите' },
  strip: { name: 'Лента', line: 'лента', rate: 3900, hint: '3 900 ₽/м², для пучинистых грунтов' },
};
const OPTIONS = {
  terrace: { name: 'Терраса 27 м²', price: 540000, months: 0 },
  garage: { name: 'Гараж на одну машину', price: 1150000, months: 1 },
  panoramic: { name: 'Окна в пол в гостиной', price: 380000, months: 0 },
  fireplace: { name: 'Камин', price: 260000, months: 0 },
  sauna: { name: 'Сауна 6 м²', price: 450000, months: 0 },
  smart: { name: 'Умный дом', price: 190000, months: 0 },
  floors: { name: 'Тёплый пол во всём доме', perSqm: 1800, months: 0 },
  solar: { name: 'Солнечные панели 6 кВт', price: 620000, months: 0 },
};

const form = $('#calc-form');
const opt = (type, group, key, title, hint, price = '') =>
  `<label class="opt"><input type="${type}" name="${group}" value="${key}"><b>${title}</b>${price ? `<em>${price}</em>` : ''}${hint ? `<small>${hint}</small>` : ''}</label>`;
$('#model-choices').innerHTML = Object.entries(MODELS).map(([key, model]) => opt('radio', 'model', key, model.name, model.hint)).join('');
$('#package-choices').innerHTML = Object.entries(PACKAGES).map(([key, pack]) => opt('radio', 'package', key, pack.name, pack.hint, `${num(pack.rate)} ₽/м²`)).join('');
$('#foundation-choices').innerHTML = Object.entries(FOUNDATIONS).map(([key, base]) => opt('radio', 'foundation', key, base.name, base.hint)).join('');
$('#option-choices').innerHTML = Object.entries(OPTIONS).map(([key, option]) => opt('checkbox', 'option', key, option.name, '', option.price ? rub(option.price) : `${num(option.perSqm)} ₽/м²`)).join('');
form.elements.model.value = 'potential';
form.elements.package.value = 'turnkey';
form.elements.foundation.value = 'piles';

/* Анимация цифр: значение плавно доезжает от прежнего к новому (ease-out, 0,5 с).
   Ширина не прыгает — у шрифта включены моноширинные цифры. При prefers-reduced-motion — сразу итог. */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const running = new WeakMap();
function tween(element, to, format, from = Number(element.dataset.value ?? to)) {
  const previous = running.get(element);
  if (previous) { cancelAnimationFrame(previous.frame); clearTimeout(previous.timer); }
  element.dataset.value = to;
  const finish = () => { element.textContent = format(to); running.delete(element); };
  if (reduceMotion.matches || from === to) { finish(); return; }
  const start = performance.now();
  const state = {};
  const frame = now => {
    const progress = Math.min(1, (now - start) / 500);
    if (progress === 1) { clearTimeout(state.timer); finish(); return; }
    element.textContent = format(from + (to - from) * (1 - (1 - progress) ** 3));
    state.frame = requestAnimationFrame(frame);
  };
  // В фоновой вкладке requestAnimationFrame стоит на паузе — таймер всё равно выставит итог
  state.timer = setTimeout(() => { cancelAnimationFrame(state.frame); finish(); }, 650);
  state.frame = requestAnimationFrame(frame);
  running.set(element, state);
}

let total = 0;
let totalMonths = 0;
let previousLines = null; // null — первый расчёт при загрузке, без анимации
const selectedOptions = () => $$('input[name="option"]:checked', form).map(input => input.value);
function recalc() {
  const model = MODELS[form.elements.model.value];
  const pack = PACKAGES[form.elements.package.value];
  const base = FOUNDATIONS[form.elements.foundation.value];
  const options = selectedOptions();
  // [ключ строки, название, сумма] — по ключу строка узнаёт свою прошлую сумму и анимируется от неё
  const lines = [
    ['house', `Дом, ${pack.name.toLowerCase()}`, model.area * pack.rate],
    ['foundation', `Фундамент: ${base.line}`, (model.area / model.floors) * base.rate],
  ];
  let months = pack.months + model.months;
  for (const key of options) {
    const option = OPTIONS[key];
    lines.push([key, option.name, option.price ?? option.perSqm * model.area]);
    months += option.months;
  }
  total = lines.reduce((sum, [, , price]) => sum + price, 0);
  totalMonths = months;
  $('#sum-model').textContent = model.name;
  tween($('#sum-total'), total, rub);
  tween($('#sum-sqm'), total / model.area, value => `${rub(value)} за м²`);
  tween($('#sum-time'), months, value => `${Math.round(value)} мес. стройки`);
  const body = $('#sum-lines');
  body.innerHTML = lines.map(([key, name]) => `<tr><td>${name}</td><td data-line="${key}"></td></tr>`).join('');
  for (const [key, , price] of lines) {
    const cell = $(`[data-line="${key}"]`, body);
    // Новая опция появляется с нуля, остальные строки — от прежней суммы; нулевая строка в конце пишет «в цене»
    const from = previousLines ? previousLines.get(key) ?? 0 : price;
    tween(cell, price, value => (price === 0 && Math.round(value) === 0 ? 'в цене' : rub(value)), from);
  }
  previousLines = new Map(lines.map(([key, , price]) => [key, price]));
  $('#extra-terrace').classList.toggle('on', options.includes('terrace'));
  $('#extra-garage').classList.toggle('on', options.includes('garage'));
  if (ROOMS[activeRoom]?.option) showRoom(activeRoom, false);
}
form.addEventListener('change', recalc);

$$('[data-pick]').forEach(button => button.addEventListener('click', () => {
  form.elements.model.value = button.dataset.pick;
  recalc();
  $('#calc').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}));

/* ---------- Интерактивный план ---------- */
const ROOMS = {
  living: { title: 'Кухня-гостиная', area: 48, text: 'Кухня вдоль северной стены, остров 2,2 м, стол на восемь человек. Потолок 3,1 м, окна в пол на юг, дверь на террасу.' },
  master: { title: 'Мастер-спальня', area: 14, text: 'Окна на юг и восток. Своя ванная и гардеробная, кровать 180 см встаёт с проходами по 70 см.' },
  kids: { title: 'Детская', area: 12, text: 'Окно на восток, утром здесь солнце. Кровать, стол и шкаф в нише занимают 7 м², остальное — под игры.' },
  bedroom: { title: 'Спальня', area: 10, text: 'Вторая детская или гостевая. Часто её делают кабинетом: розетки уже разведены под стол у окна.' },
  hall: { title: 'Прихожая', area: 12, text: 'Шкаф до потолка на 3 м, скамья, тёплый пол у входа. Из прихожей — сразу в гостиную и в постирочную.' },
  corridor: { title: 'Коридор', area: 7, text: 'Отделяет спальни от гостиной. В гостиной можно смотреть кино, пока ребёнок спит.' },
  bath: { title: 'Ванная', area: 7, text: 'Только для мастер-спальни: ванна, душ без поддона, две раковины и окно.' },
  wardrobe: { title: 'Гардеробная', area: 5, text: 'Вход из мастер-спальни. Полки и штанги на всю высоту — около 9 погонных метров хранения.' },
  laundry: { title: 'Постирочная', area: 6, text: 'Котёл, бойлер, стиральная и сушильная машины. Шумная техника — не в ванной. В полу трап.' },
  wc: { title: 'Гостевой санузел', area: 6, text: 'Душ, раковина и унитаз. Гостям не нужно проходить в спальную часть дома.' },
  terrace: { title: 'Терраса', area: 27, option: 'terrace', text: 'Лиственница 28 мм вдоль всей гостиной, навес над половиной площади. Летом сюда переезжает обеденный стол.' },
  garage: { title: 'Гараж', area: 36, option: 'garage', text: 'Тёплый, на одну машину, с воротами на автоматике и розеткой для электромобиля. Вход в дом через прихожую.' },
};
const card = $('#room-card');
const list = $('#room-list');
const optionInput = key => $(`input[name="option"][value="${key}"]`, form);
let activeRoom = null;

list.innerHTML = Object.entries(ROOMS).map(([key, room]) =>
  `<li><button type="button" data-room="${key}" aria-pressed="false"${room.option ? ' class="is-option"' : ''}><span>${room.title}</span><span>${room.area} м²</span></button></li>`).join('');

function showOverview() {
  card.innerHTML = '<h3>Potential 128</h3><p class="room-area">128 м² · 10 помещений · 1 этаж</p><p>Слева — дневная зона, справа — спальни, между ними коридор. Все спальни смотрят на юг или восток. Выберите комнату, чтобы узнать подробности.</p>';
}
function showRoom(key, scroll = true) {
  activeRoom = key;
  const room = ROOMS[key];
  $$('.room, .extra').forEach(element => element.classList.toggle('active', element.dataset.room === key));
  $$('button', list).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.room === key)));
  let action = '';
  if (room.option) {
    const added = optionInput(room.option).checked;
    action = `<button class="link" type="button" id="toggle-option">${added ? 'Убрать из расчёта' : `Добавить в расчёт за ${rub(OPTIONS[room.option].price)}`}</button>`;
  }
  card.innerHTML = `<h3>${room.title}</h3><p class="room-area">${room.area} м²${room.option ? (optionInput(room.option).checked ? ' · в расчёте' : ' · опция') : ''}</p><p>${room.text}</p>${action}`;
  $('#toggle-option', card)?.addEventListener('click', () => {
    const input = optionInput(room.option);
    input.checked = !input.checked;
    recalc();
    $('#toggle-option', card)?.focus();
  });
  if (scroll && matchMedia('(max-width:1080px)').matches) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
$$('.room, .extra').forEach(element => element.addEventListener('click', () => showRoom(element.dataset.room)));
list.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button) showRoom(button.dataset.room, false);
});

// Слои плана. Синхронизация и при загрузке: браузер может восстановить состояние чекбоксов
const planSvg = $('#plan-svg');
function syncLayers() {
  planSvg.classList.toggle('no-furniture', !$('#layer-furniture').checked);
  planSvg.classList.toggle('show-dims', $('#layer-dims').checked);
}
$('#layer-furniture').addEventListener('change', syncLayers);
$('#layer-dims').addEventListener('change', syncLayers);
addEventListener('pageshow', syncLayers);
syncLayers();

showOverview();
recalc();

/* ---------- Посёлки и дома в продаже: единая база, из неё строятся подбор, слайды и сводки ---------- */
const VILLAGES = { blond: 'Blond Hills', hook: 'Северный Крюк', lake: 'Озёрная Линия' };
const ORDER = Object.keys(VILLAGES);
// Цены — в миллионах рублей; null у проданных
const LOTS = [
  { v: 'blond', no: 3, model: 'Potential 128', area: 128, beds: 3, land: 12, state: 'ready', when: 'Готов, с отделкой', price: 14.9, status: 'free' },
  { v: 'blond', no: 7, model: 'Blond 96', area: 96, beds: 2, land: 10, state: 'ready', when: 'Готов, с отделкой', price: 11.2, status: 'free' },
  { v: 'blond', no: 14, model: 'Potential 128', area: 128, beds: 3, land: 12, state: 'ready', when: 'Готов, заселён', price: null, status: 'sold' },
  { v: 'blond', no: 18, model: 'Potential 128 + гараж', area: 164, beds: 3, land: 14, state: 'ready', when: 'Готов, с отделкой', price: 16.4, status: 'hold', note: 'Бронь до 28.11' },
  { v: 'blond', no: 11, model: 'Dysph 164', area: 164, beds: 4, land: 15, state: 'building', when: 'Сдача — март 2027', price: 17.8, status: 'free' },
  { v: 'blond', no: 22, model: 'Dysph 164', area: 164, beds: 4, land: 18, state: 'building', when: 'Сдача — май 2027', price: 19.3, status: 'free' },
  { v: 'blond', no: 25, model: 'Blond 96', area: 96, beds: 2, land: 10, state: 'building', when: 'Сдача — июль 2027', price: 10.6, status: 'free' },
  { v: 'hook', no: 4, model: 'Blond 96', area: 96, beds: 2, land: 8, state: 'ready', when: 'Готов, с отделкой', price: 9.8, status: 'free' },
  { v: 'hook', no: 21, model: 'Blond 96', area: 96, beds: 2, land: 8, state: 'ready', when: 'Готов, с отделкой', price: 9.6, status: 'hold', note: 'Бронь до 30.11' },
  { v: 'hook', no: 9, model: 'Potential 128', area: 128, beds: 3, land: 10, state: 'building', when: 'Сдача — февраль 2027', price: 12.4, status: 'free' },
  { v: 'hook', no: 12, model: 'Potential 128', area: 128, beds: 3, land: 12, state: 'building', when: 'Сдача — апрель 2027', price: 12.9, status: 'free' },
  { v: 'hook', no: 15, model: 'Dysph 164', area: 164, beds: 4, land: 12, state: 'building', when: 'Сдача — июнь 2027', price: 15.6, status: 'free' },
  { v: 'hook', no: 30, model: 'Dysph 164', area: 164, beds: 4, land: 12, state: 'ready', when: 'Готов, заселён', price: null, status: 'sold' },
  { v: 'lake', no: 2, model: 'Potential 128', area: 128, beds: 3, land: 14, state: 'building', when: 'Сдача — сентябрь 2027', price: 13.7, status: 'free' },
  { v: 'lake', no: 5, model: 'Dysph 164', area: 164, beds: 4, land: 20, state: 'building', when: 'Сдача — октябрь 2027', price: 17.2, status: 'free' },
  { v: 'lake', no: 6, model: 'Potential 128', area: 128, beds: 3, land: 16, state: 'building', when: 'Сдача — сентябрь 2027', price: 14.2, status: 'hold', note: 'Бронь до 02.12' },
  { v: 'lake', no: 8, model: 'Blond 96', area: 96, beds: 2, land: 12, state: 'building', when: 'Сдача — август 2027', price: 10.9, status: 'free' },
];
const mln = value => `${String(value).replace('.', ',')} млн ₽`;
const plural = (n, [one, few, many]) => (n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
const houses = n => `${n} ${plural(n, ['дом', 'дома', 'домов'])}`;
const freeIn = village => LOTS.filter(lot => lot.v === village && lot.status === 'free');

// Цифры на слайдах: сколько свободно и цена от
for (const id of ORDER) {
  const free = freeIn(id);
  $$(`[data-free="${id}"]`).forEach(el => { el.textContent = houses(free.length); });
  $$(`[data-from="${id}"]`).forEach(el => { el.textContent = `от ${mln(Math.min(...free.map(lot => lot.price)))}`; });
}

// Сводка по спальням в карточке посёлка: от скольки м², от какой цены, сколько свободно
const BEDS_WORD = { 2: '2 спальни', 3: '3 спальни', 4: '4 спальни' };
for (const id of ORDER) {
  const list = $(`[data-beds="${id}"]`);
  list.innerHTML = [2, 3, 4].map(beds => {
    const lots = freeIn(id).filter(lot => lot.beds === beds);
    if (!lots.length) return `<li class="beds-none"><b>${BEDS_WORD[beds]}</b><span>свободных нет</span></li>`;
    return `<li><b>${BEDS_WORD[beds]}</b><span>от ${Math.min(...lots.map(lot => lot.area))} м²</span><span>от ${mln(Math.min(...lots.map(lot => lot.price)))}</span>
      <button class="link" type="button" data-select="${id}" data-beds="${beds}">${houses(lots.length)}</button></li>`;
  }).join('');
}

/* ---------- Подбор дома ---------- */
const picker = $('#picker');
const lotsBody = $('#lots-body');
const STATUS = { free: ['Свободен', ''], hold: [null, ' status-hold'], sold: ['Продан', ' status-sold'] };
function renderLots() {
  const f = Object.fromEntries(new FormData(picker));
  const maxPrice = Number(f.price);
  const rows = LOTS
    .filter(lot => f.village === 'all' || lot.v === f.village)
    .filter(lot => f.beds === 'all' || lot.beds === Number(f.beds))
    .filter(lot => f.state === 'all' || lot.state === f.state)
    .filter(lot => !maxPrice || (lot.price !== null && lot.price <= maxPrice))
    .filter(lot => !f.free || lot.status === 'free')
    .sort((a, b) => ORDER.indexOf(a.v) - ORDER.indexOf(b.v) || (a.state === b.state ? 0 : a.state === 'ready' ? -1 : 1) || (a.price ?? 99) - (b.price ?? 99));
  lotsBody.innerHTML = rows.map(lot => {
    const [label, cls] = STATUS[lot.status];
    const action = lot.status === 'free'
      ? `<button class="link" type="button" data-dialog="lot" data-lot="№ ${lot.no} · ${VILLAGES[lot.v]} · ${lot.model}">Показ</button>` : '';
    return `<tr><th scope="row">№ ${lot.no}</th><td data-label="Посёлок">${VILLAGES[lot.v]}</td><td data-label="Проект">${lot.model}</td><td data-label="Дом">${lot.area} м²</td>
      <td data-label="Земля">${lot.land} сот.</td><td data-label="Готовность">${lot.when}</td><td data-label="Цена" class="price">${lot.price ? mln(lot.price) : '—'}</td>
      <td data-label="Статус"><span class="status${cls}">${label ?? lot.note}</span></td><td>${action}</td></tr>`;
  }).join('');
  $('#picker-count').textContent = rows.length ? `Найдено: ${houses(rows.length)}` : '';
  $('#picker-empty').hidden = rows.length > 0;
  $('.lots-table').hidden = rows.length === 0;
}
picker.addEventListener('change', renderLots);
picker.addEventListener('submit', event => event.preventDefault());
renderLots();

// Кнопки «Выбрать дом», «Все дома в посёлке», «3 дома» — ставят фильтр и ведут к подбору
document.addEventListener('click', event => {
  const button = event.target.closest('[data-select]');
  if (!button) return;
  picker.elements.village.value = button.dataset.select;
  picker.elements.beds.value = button.dataset.beds ?? 'all';
  picker.elements.state.value = 'all';
  picker.elements.price.value = '0';
  picker.elements.free.checked = true;
  renderLots();
  $('#select').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});

/* ---------- Слайдер посёлков на первом экране: только кнопками, без автопрокрутки ---------- */
const slides = $$('.slide');
let current = 0;
$('#slide-names').innerHTML = slides.map((s, i) => `<button type="button" data-goto="${i}">${$('.slide-title', s).textContent}</button>`).join('');
function showSlide(index) {
  current = (index + slides.length) % slides.length;
  slides.forEach((s, i) => { s.hidden = i !== current; });
  $('#slide-count').textContent = `${current + 1} / ${slides.length}`;
  $$('[data-goto]').forEach(b => b.setAttribute('aria-current', String(Number(b.dataset.goto) === current)));
}
$('#slide-prev').addEventListener('click', () => showSlide(current - 1));
$('#slide-next').addEventListener('click', () => showSlide(current + 1));
$('#slide-names').addEventListener('click', event => {
  const b = event.target.closest('[data-goto]');
  if (b) showSlide(Number(b.dataset.goto));
});
$('#top').addEventListener('keydown', event => {
  if (event.target.closest('input, select, textarea')) return;
  if (event.key === 'ArrowLeft') showSlide(current - 1);
  if (event.key === 'ArrowRight') showSlide(current + 1);
});
showSlide(0);

/* ---------- Окно заявки: смета, показ, звонок, консультация, предложение ---------- */
const dialog = $('#dialog');
const dialogForm = $('#dialog-form');
const done = $('.dialog-done', dialogForm);
const MODES = {
  quote: () => ({
    title: `Смета на ${MODELS[form.elements.model.value].name}`,
    sub: `По калькулятору — ${rub(total)}, ${totalMonths} мес. стройки. Архитектор перезвонит и договорится о выезде на участок.`,
    submit: 'Получить смету',
    doneText: 'Архитектор позвонит в течение рабочего дня.',
  }),
  lot: button => ({
    title: `Показ: участок ${button.dataset.lot.split(' · ').slice(0, 2).join(', ')}`,
    sub: `${button.dataset.lot.split(' · ')[2]}. Менеджер встретит у шлагбаума и покажет дом и участок. Бронь — 5 дней без предоплаты.`,
    submit: 'Записаться на показ',
    doneText: 'Перезвоним в течение 15 минут и согласуем время показа.',
  }),
  callback: () => ({
    title: 'Заказать звонок',
    sub: 'Менеджер перезвонит за 15 минут в рабочее время: ежедневно с 10:00 до 20:00.',
    submit: 'Жду звонка',
    doneText: 'Менеджер перезвонит в течение 15 минут.',
  }),
  consult: button => ({
    title: `${button.dataset.topic}: консультация`,
    sub: 'Расскажем, как устроена сделка, какие документы нужны и сколько она займёт.',
    submit: 'Получить консультацию',
    doneText: 'Менеджер позвонит сегодня и всё расскажет.',
  }),
  offer: button => ({
    title: button.dataset.offer,
    sub: 'Пришлём условия и список домов, на которые действует предложение.',
    submit: 'Узнать подробности',
    doneText: 'Отправим условия и перезвоним, если появятся вопросы.',
  }),
};
let mode = MODES.callback();
// Делегирование: кнопки «Показ» в таблице подбора создаются заново при каждом фильтре
document.addEventListener('click', event => {
  const button = event.target.closest('[data-dialog]');
  if (!button) return;
  mode = MODES[button.dataset.dialog](button);
  $('#dialog-title').textContent = mode.title;
  $('#dialog-sub').textContent = mode.sub;
  $('#dialog-submit').textContent = mode.submit;
  done.hidden = true;
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  dialogForm.elements.name.focus();
});
const closeDialog = () => (typeof dialog.close === 'function' ? dialog.close() : dialog.removeAttribute('open'));
$('#dialog-close').addEventListener('click', closeDialog);
$('#dialog-ok').addEventListener('click', closeDialog);
dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });

const checks = {
  name: value => value.trim().length >= 2 ? '' : 'Введите имя',
  contact: value => /^\S+@\S+\.\S+$/.test(value.trim()) || value.replace(/\D/g, '').length >= 10 ? '' : 'Нужен телефон или почта',
  phone: value => value.replace(/\D/g, '').length >= 10 ? '' : 'Нужен номер целиком, например +7 900 000-00-00',
};
function checkField(input) {
  const message = checks[input.name](input.value);
  const field = input.closest('.field');
  field.classList.toggle('invalid', Boolean(message));
  $('.error', field).textContent = message;
  input.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}
const inputs = [dialogForm.elements.name, dialogForm.elements.contact];
inputs.forEach(input => input.addEventListener('input', () => {
  if (input.closest('.field').classList.contains('invalid')) checkField(input);
}));
dialogForm.addEventListener('submit', event => {
  event.preventDefault();
  const valid = inputs.map(checkField);
  if (!valid.every(Boolean)) { inputs[valid.indexOf(false)].focus(); return; }
  $('#done-title').textContent = `Спасибо, ${dialogForm.elements.name.value.trim()}`;
  $('#done-text').textContent = mode.doneText;
  done.hidden = false;
  dialogForm.reset();
  $('#dialog-ok').focus();
});

/* ---------- Обратный звонок в разделе «Контакты» ---------- */
const callback = $('#callback');
const callbackInputs = [callback.elements.name, callback.elements.phone];
callbackInputs.forEach(input => input.addEventListener('input', () => {
  if (input.closest('.field').classList.contains('invalid')) checkField(input);
}));
callback.addEventListener('submit', event => {
  event.preventDefault();
  const valid = callbackInputs.map(checkField);
  if (!valid.every(Boolean)) { callbackInputs[valid.indexOf(false)].focus(); return; }
  const doneNote = $('#callback-done');
  doneNote.textContent = `Спасибо, ${callback.elements.name.value.trim()}! Менеджер перезвонит в течение 15 минут.`;
  doneNote.hidden = false;
  callback.reset();
});

/* ---------- Фон светлых секций: волна из точек в перспективе ---------- */
(function dotWaves() {
  const hosts = $$('.section-surface, .statement');
  if (!hosts.length || !window.HTMLCanvasElement) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const Z_NEAR = 1, Z_FAR = 9;

  const waves = hosts.map((host, i) => {
    host.classList.add('has-wave');
    const canvas = document.createElement('canvas');
    canvas.className = 'dot-wave';
    canvas.setAttribute('aria-hidden', 'true');
    host.prepend(canvas);
    return { host, canvas, ctx: canvas.getContext('2d'), w: 0, h: 0, visible: false, phase: i * 1.7 };
  });

  function resize(wave) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wave.canvas.getBoundingClientRect();
    wave.w = rect.width;
    wave.h = rect.height;
    wave.canvas.width = Math.round(rect.width * dpr);
    wave.canvas.height = Math.round(rect.height * dpr);
    wave.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Высота поверхности: три синусоиды под разными углами дают «живую» волну
  const height = (x, z, t) =>
    Math.sin(x * 1.25 + t * 0.55) * 0.55 +
    Math.sin(z * 0.9 - t * 0.8) * 0.45 +
    Math.sin((x + z) * 0.6 + t * 0.35) * 0.35;

  function draw(wave, t) {
    const { ctx, w, h } = wave;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const small = w < 640;
    const rows = small ? 40 : 62;
    const horizon = h * 0.1;
    const camY = 0.85;
    const fy = (h * 1.02 - horizon) / camY;   // ближний ряд упирается в низ секции
    const fx = w * 0.5;
    const amp = 0.3;
    const tt = t + wave.phase;
    ctx.fillStyle = '#ecebe6';
    for (let r = 0; r < rows; r++) {
      // ряды почти равномерны по экрану, а не по глубине — иначе передний план редкий
      const u = r / (rows - 1);
      const z = 1 / (1 / Z_NEAR + (1 / Z_FAR - 1 / Z_NEAR) * u ** 0.85);
      const depth = 1 - u; // 1 — ближе, 0 — у горизонта
      const spread = (w / 2 / fx + 0.15) * z;   // ряд всегда во всю ширину
      const dx = ((small ? 6 : 7) + 9 * depth) * z / fx; // шаг на экране: 7 px вдали, 16 px вблизи
      const size = Math.max(0.9, 2.6 / z);
      const fade = 0.05 + 0.33 * depth ** 1.2; // приглушено, чтобы текст поверх читался
      for (let x = -spread; x <= spread; x += dx) {
        const k = height(x, z, tt);
        const sx = w / 2 + (x / z) * fx;
        const sy = horizon + ((camY - amp * k) / z) * fy;
        if (sx < -4 || sx > w + 4 || sy > h + 4) continue;
        // гребни светлее впадин — так читается объём
        ctx.globalAlpha = fade * (0.35 + 0.65 * (k + 1.35) / 2.7);
        ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  let frame = 0;
  const start = performance.now();
  function loop(now) {
    frame = 0;
    const t = (now - start) / 1000;
    let any = false;
    for (const wave of waves) if (wave.visible) { draw(wave, t); any = true; }
    if (any && !reduce.matches) frame = requestAnimationFrame(loop);
  }
  const kick = () => {
    if (reduce.matches) { waves.forEach(wave => wave.visible && draw(wave, 0)); return; }
    if (!frame) frame = requestAnimationFrame(loop);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => { waves.find(item => item.host === entry.target).visible = entry.isIntersecting; });
    kick();
  }, { rootMargin: '100px 0px' });
  const ro = new ResizeObserver(entries => {
    entries.forEach(entry => {
      const wave = waves.find(item => item.host === entry.target);
      resize(wave);
      if (reduce.matches || !frame) draw(wave, (performance.now() - start) / 1000);
    });
  });
  waves.forEach(wave => { io.observe(wave.host); ro.observe(wave.host); });
  if (reduce.addEventListener) reduce.addEventListener('change', kick);
})();

/* ---------- Базовая анимация: появление блоков, счётчики, полосы графика ---------- */
(function motion() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const TARGETS = [
    '.head-split > *', '.offer', '.picker', '.village', '.models-table tbody tr',
    '.plan-board', '.plan-side', '.calc-fields fieldset', '.receipt', '.buy-row',
    '.statement h2', '.terms p', '.gantt-scroll', '.note', '.case-text', '.case-table',
    '.about-photo', '.about-text', '.about-stats > div', '.news li', '.faq > h2', '.faq details',
    '.visit-grid > *', '.footer-cols > *',
  ].join(',');
  const items = $$(TARGETS).filter(el => !el.closest('.slide') && !el.closest('dialog'));
  if (!items.length) return;

  // Соседи из одной группы появляются лесенкой, но не дольше полусекунды
  const order = new Map();
  items.forEach(el => {
    const i = order.get(el.parentElement) ?? 0;
    order.set(el.parentElement, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`);
    el.dataset.reveal = '';
  });

  // Счётчики в «О компании»: 3, 112, ≈ 340
  const counters = $$('.about-stats dt').map(el => {
    const m = el.textContent.match(/^(\D*)(\d+)(.*)$/);
    return m && Number(m[2]) > 0 ? { el, pre: m[1], to: Number(m[2]), post: m[3] } : null;
  }).filter(Boolean);
  const count = c => {
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / 1400, 1);
      c.el.textContent = c.pre + Math.round(c.to * (1 - (1 - p) ** 3)) + c.post;
      if (p < 1) requestAnimationFrame(tick);
    };
    c.el.textContent = c.pre + 0 + c.post;
    requestAnimationFrame(tick);
  };

  const header = $('.header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduce || !('IntersectionObserver' in window)) return; // без анимации всё видно сразу
  root.classList.add('js-motion');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('in');
      io.unobserve(el);
      counters.filter(c => el.contains(c.el)).forEach(count);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  items.forEach(el => io.observe(el));
})();
