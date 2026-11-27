// Эмаль — Telegram Mini App для записи пациента. Демо: работает и в браузере, и внутри Telegram.
const tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.initData ? Telegram.WebApp : null;
if (tg) { document.documentElement.classList.add('is-telegram'); tg.ready(); tg.expand(); }

const SERVICES = [
  { id: 's1', name: 'Консультация и план лечения', min: 30, price: 1500, docs: ['d1', 'd2', 'd3'] },
  { id: 's8', name: 'Профгигиена', min: 60, price: 5900, docs: ['d4'] },
  { id: 's2', name: 'Лечение кариеса', min: 60, price: 6800, docs: ['d1'] },
  { id: 's5', name: 'Удаление зуба', min: 60, price: 4500, docs: ['d2'] },
  { id: 's9', name: 'Отбеливание', min: 90, price: 18000, docs: ['d4'] },
  { id: 's7', name: 'Консультация ортодонта', min: 30, price: 2000, docs: ['d3'] },
];
const DOCTORS = [
  { id: 'd1', name: 'Анна Миронова', role: 'Терапевт', exp: 'Стаж 12 лет', note: 'Анестезию подбирает по весу и аллергиям' },
  { id: 'd2', name: 'Олег Ветров', role: 'Хирург-имплантолог', exp: 'Стаж 15 лет', note: '1 400 имплантов, гарантия 10 лет' },
  { id: 'd3', name: 'Ирина Лаптева', role: 'Ортодонт', exp: 'Стаж 9 лет', note: 'Брекеты и элайнеры, детям с 7 лет' },
  { id: 'd4', name: 'Дмитрий Шульц', role: 'Гигиенист', exp: 'Стаж 6 лет', note: 'Чистка ультразвуком и Air Flow за час' },
];
const BRANCHES = [{ value: 'lit', label: 'На Литейном', hint: 'Литейный, 31' }, { value: 'vas', label: 'На Васильевском', hint: '7-я линия, 40' }];
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTH = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const START = new Date(2026, 10, 27); // пятница, 27 ноября
const DAYS = Array.from({ length: 10 }, (_, i) => { const d = new Date(START); d.setDate(d.getDate() + i); return d; });
const byId = (l, id) => l.find(x => x.id === id);
const initials = n => n.split(' ').map(w => w[0]).join('');
const dayLabel = d => `${d.getDate()} ${MONTH[d.getMonth()]}, ${['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'][d.getDay()]}`;

// Занятость — детерминированная по врачу и дню, чтобы прототип был одинаковым при каждом открытии
function busy(doc, d, t) {
  const n = (doc.charCodeAt(1) * 31 + d.getDate() * 17 + Number(t.replace(':', ''))) % 7;
  return n < 3 || (d.getDate() === 27 && Number(t.slice(0, 2)) < 14);
}
const TIMES = []; for (let m = 9 * 60; m <= 19 * 60 + 30; m += 30) TIMES.push(`${String(m / 60 | 0).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
function nearest(doc) { for (const d of DAYS) { if (d.getDay() === 0) continue; const t = TIMES.find(x => !busy(doc, d, x)); if (t) return `${d.getDate() === 27 ? 'сегодня' : d.getDate() === 28 ? 'завтра' : d.getDate() + ' ' + MONTH[d.getMonth()]} в ${t}`; } return ''; }

const state = { branch: 'lit', service: null, doctor: null, day: 0, time: null, mode: 'new', editing: null };
let bookings = [{ id: 'b1', service: 's8', doctor: 'd4', day: 4, time: '14:00' }];
const PAST = [['03.09.2026', 'Профгигиена', 'Дмитрий Шульц', 5900], ['12.03.2026', 'Пломба, зуб 36', 'Анна Миронова', 5200]];

/* ---------- Навигация со стеком: кнопка «Назад» и анимация в нужную сторону ---------- */
const stack = ['home'];
function show(page, back = false) {
  $$('.page').forEach(p => { p.hidden = p.dataset.page !== page; p.classList.toggle('is-back', back); });
  const flow = ['doctor', 'time', 'confirm'].includes(page);
  $('#back').hidden = stack.length < 2 || page === 'done';
  $('#tabbar').hidden = flow || page === 'done';
  $('#main-btn-wrap').hidden = !(flow || page === 'done');
  if (tg) { if (stack.length > 1 && page !== 'done') tg.BackButton.show(); else tg.BackButton.hide(); }
  $$('#tabbar [data-go]').forEach(b => { if (b.dataset.go === page) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  ({ home: renderHome, doctor: renderDoctors, time: renderTime, confirm: renderConfirm, done: renderDone, mine: renderMine })[page]();
  window.scrollTo(0, 0);
}
function go(page) { stack.push(page); show(page); }
function back() { if (stack.length > 1) { stack.pop(); show(stack[stack.length - 1], true); } }
$('#back').addEventListener('click', back);
if (tg) tg.BackButton.onClick(back);
$('#tabbar').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { stack.length = 0; stack.push(b.dataset.go); show(b.dataset.go); } });

/* Главная кнопка: в Telegram — нативная MainButton, в браузере — своя внизу */
let mainAction = null;
function mainButton(text, enabled, action) {
  mainAction = action;
  const b = $('#main-btn');
  b.textContent = text;
  b.disabled = !enabled;
  if (tg) { tg.MainButton.setText(text); enabled ? tg.MainButton.enable() : tg.MainButton.disable(); tg.MainButton.show(); }
}
$('#main-btn').addEventListener('click', () => mainAction && mainAction());
if (tg) tg.MainButton.onClick(() => mainAction && mainAction());
const haptic = type => tg && tg.HapticFeedback && (type === 'ok' ? tg.HapticFeedback.notificationOccurred('success') : tg.HapticFeedback.selectionChanged());

/* ---------- Экраны ---------- */
const branchSelect = makeSelect($('#branch'), { options: BRANCHES, value: 'lit', onChange: v => { state.branch = v; toast(`Филиал: ${BRANCHES.find(b => b.value === v).label.toLowerCase()}`); } });

function renderHome() {
  if (tg) tg.MainButton.hide();
  const b = bookings[0];
  if (b) {
    const s = byId(SERVICES, b.service), d = byId(DOCTORS, b.doctor), day = DAYS[b.day];
    $('#next-card').innerHTML = `<div class="next-top"><span class="t-caption">Ближайшая запись</span><span class="badge badge-ok">Подтверждена</span></div>
      <div class="next-when"><b>${day.getDate()} ${MONTH[day.getMonth()]}, ${b.time}</b><span>${WD[day.getDay()]}</span></div>
      <div class="next-who"><span class="avatar">${initials(d.name)}</span><span><b>${s.name}</b><small>${d.name} · ${d.role.toLowerCase()}</small></span></div>
      <div class="next-actions"><button class="btn btn-secondary btn-sm" type="button" data-move="${b.id}">Перенести</button><button class="btn btn-danger btn-sm" type="button" data-cancel="${b.id}">Отменить</button></div>`;
  } else $('#next-card').innerHTML = '<p class="next-empty">Записей нет. Выберите услугу ниже — свободные окна есть уже сегодня.</p>';
  $('#services').innerHTML = SERVICES.map(s => `<li><button class="svc" type="button" data-svc="${s.id}"><span class="svc-main"><b>${s.name}</b><small>${s.min} мин · ${s.docs.length > 1 ? s.docs.length + ' врача' : byId(DOCTORS, s.docs[0]).name}</small></span><span class="svc-price">${rub(s.price)}</span><svg class="ico" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></li>`).join('');
  $('#doctors').innerHTML = DOCTORS.map(d => `<li><span class="avatar">${initials(d.name)}</span><b>${d.name}</b><small>${d.role} · ${d.exp.toLowerCase()}</small></li>`).join('');
}
$('#services').addEventListener('click', e => {
  const b = e.target.closest('[data-svc]');
  if (!b) return;
  Object.assign(state, { service: b.dataset.svc, doctor: null, time: null, day: 0, mode: 'new', editing: null });
  const s = byId(SERVICES, state.service);
  if (s.docs.length === 1) { state.doctor = s.docs[0]; go('time'); } else go('doctor');
});
$('#next-card').addEventListener('click', e => {
  const m = e.target.closest('[data-move]'), c = e.target.closest('[data-cancel]');
  if (m) { const b = byId(bookings, m.dataset.move); Object.assign(state, { service: b.service, doctor: b.doctor, day: b.day, time: null, mode: 'move', editing: b.id }); go('time'); }
  if (c) askCancel(c.dataset.cancel);
});

function renderDoctors() {
  const s = byId(SERVICES, state.service);
  $('#doc-service').textContent = `${s.name} · ${s.min} мин · ${rub(s.price)}`;
  $('#doc-list').innerHTML = s.docs.map(id => { const d = byId(DOCTORS, id); return `<li><button class="pick" type="button" data-doc="${id}" aria-pressed="${state.doctor === id}"><span class="avatar">${initials(d.name)}</span><span class="pick-main"><b>${d.name}</b><small>${d.role} · ${d.exp.toLowerCase()}</small><small>${d.note}</small><span class="pick-near">Ближайшее окно: ${nearest(id)}</span></span><span class="radio" aria-hidden="true"></span></button></li>`; }).join('');
  mainButton('Выбрать время', !!state.doctor, () => go('time'));
}
$('#doc-list').addEventListener('click', e => {
  const b = e.target.closest('[data-doc]');
  if (!b) return;
  state.doctor = b.dataset.doc;
  haptic();
  $$('#doc-list .pick').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  mainButton('Выбрать время', true, () => go('time'));
});

function renderTime() {
  const d = byId(DOCTORS, state.doctor), s = byId(SERVICES, state.service);
  $('#time-title').textContent = state.mode === 'move' ? 'Новое время' : 'Дата и время';
  $('#time-doc').textContent = `${d.name} · ${s.name.toLowerCase()}, ${s.min} мин`;
  $('#days').innerHTML = DAYS.map((day, i) => `<button class="day" type="button" data-day="${i}" aria-pressed="${state.day === i}"${day.getDay() === 0 ? ' disabled aria-label="Воскресенье — выходной"' : ''}><small>${i === 0 ? 'сегодня' : WD[day.getDay()]}</small><b>${day.getDate()}</b></button>`).join('');
  renderSlots();
}
function renderSlots() {
  const day = DAYS[state.day];
  const part = (from, to, label) => { const list = TIMES.filter(t => t >= from && t < to); return `<span class="slot-group">${label}</span>` + list.map(t => `<button class="chip" type="button" data-time="${t}" aria-pressed="${state.time === t}"${busy(state.doctor, day, t) ? ' disabled' : ''}>${t}</button>`).join(''); };
  $('#slots').innerHTML = part('09:00', '12:00', 'Утро') + part('12:00', '17:00', 'День') + part('17:00', '20:00', 'Вечер');
  const free = $$('#slots .chip:not(:disabled)').length;
  $('#slot-hint').textContent = free ? `${dayLabel(day)} · свободно ${free} окон` : 'В этот день всё занято — выберите другой';
  mainButton(state.time ? `Продолжить · ${state.time}` : 'Выберите время', !!state.time, () => go('confirm'));
}
$('#days').addEventListener('click', e => { const b = e.target.closest('[data-day]'); if (!b || b.disabled) return; state.day = Number(b.dataset.day); state.time = null; haptic(); $$('#days .day').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderSlots(); });
$('#slots').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b || b.disabled) return; state.time = b.dataset.time; haptic(); $$('#slots .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b))); mainButton(`Продолжить · ${state.time}`, true, () => go('confirm')); });

function summaryHtml() {
  const s = byId(SERVICES, state.service), d = byId(DOCTORS, state.doctor), day = DAYS[state.day];
  return `<div><dt>Услуга</dt><dd>${s.name}</dd></div><div><dt>Врач</dt><dd>${d.name}</dd></div><div><dt>Когда</dt><dd>${day.getDate()} ${MONTH[day.getMonth()]}, ${state.time}</dd></div><div><dt>Филиал</dt><dd>${BRANCHES.find(b => b.value === state.branch).label}</dd></div><div><dt>Стоимость</dt><dd>${rub(s.price)}</dd></div>`;
}
function renderConfirm() {
  $('#summary').innerHTML = summaryHtml();
  mainButton(state.mode === 'move' ? 'Перенести запись' : 'Записаться', true, submit);
}
const form = $('#form');
form.elements.phone.addEventListener('input', () => { $('#f-phone').classList.remove('is-error'); $('#phone-hint').textContent = 'Пришлём напоминание в Telegram и СМС за день'; });
function submit() {
  const digits = form.elements.phone.value.replace(/\D/g, '');
  if (digits.length < 11) {
    $('#f-phone').classList.add('is-error');
    $('#phone-hint').textContent = digits.length ? 'Не хватает цифр: нужен номер из 11 цифр' : 'Укажите телефон — без него не сможем подтвердить запись';
    if (!inFrame) form.elements.phone.focus();
    if (tg) tg.HapticFeedback.notificationOccurred('error');
    return;
  }
  if (state.mode === 'move') Object.assign(byId(bookings, state.editing), { day: state.day, time: state.time });
  else bookings.unshift({ id: 'b' + Date.now(), service: state.service, doctor: state.doctor, day: state.day, time: state.time });
  bookings.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  haptic('ok');
  stack.length = 0; stack.push('done'); show('done');
}
form.addEventListener('submit', e => { e.preventDefault(); submit(); });

function renderDone() {
  const s = byId(SERVICES, state.service), day = DAYS[state.day];
  $('#done-title').textContent = state.mode === 'move' ? 'Запись перенесена' : 'Вы записаны';
  $('#done-text').textContent = `Ждём ${day.getDate()} ${MONTH[day.getMonth()]} в ${state.time}. Напомним накануне в этом чате.`;
  $('#done-summary').innerHTML = summaryHtml();
  mainButton('На главную', true, () => { stack.length = 0; stack.push('home'); show('home'); });
  void s;
}
$('#to-calendar').addEventListener('click', () => toast('Событие добавлено в календарь'));

let mineTab = 'soon';
function renderMine() {
  if (tg) tg.MainButton.hide();
  if (mineTab === 'soon') {
    $('#mine').innerHTML = bookings.length ? bookings.map(b => { const s = byId(SERVICES, b.service), d = byId(DOCTORS, b.doctor), day = DAYS[b.day]; return `<li><div class="mine-top"><b>${day.getDate()} ${MONTH[day.getMonth()]}, ${b.time}</b><span class="badge badge-ok">Подтверждена</span></div><span>${s.name}<br><small>${d.name} · ${rub(s.price)}</small></span><div class="mine-actions"><button class="btn btn-secondary btn-sm" type="button" data-move="${b.id}">Перенести</button><button class="btn btn-danger btn-sm" type="button" data-cancel="${b.id}">Отменить</button></div></li>`; }).join('') : '<li class="empty">Предстоящих записей нет</li>';
  } else {
    $('#mine').innerHTML = PAST.map(([d, w, who, sum]) => `<li><div class="mine-top"><b>${d}</b><span class="badge badge-done">Приём завершён</span></div><span>${w}<br><small>${who} · ${rub(sum)}</small></span></li>`).join('');
  }
}
$$('.tab').forEach(t => t.addEventListener('click', () => { mineTab = t.dataset.tab; $$('.tab').forEach(x => x.setAttribute('aria-selected', String(x === t))); renderMine(); }));
$('#mine').addEventListener('click', e => {
  const m = e.target.closest('[data-move]'), c = e.target.closest('[data-cancel]');
  if (m) { const b = byId(bookings, m.dataset.move); Object.assign(state, { service: b.service, doctor: b.doctor, day: b.day, time: null, mode: 'move', editing: b.id }); go('time'); }
  if (c) askCancel(c.dataset.cancel);
});

/* Отмена — нижняя шторка */
let cancelId = null;
function askCancel(id) {
  cancelId = id;
  const b = byId(bookings, id), s = byId(SERVICES, b.service), day = DAYS[b.day];
  $('#cancel-text').textContent = `${s.name}, ${day.getDate()} ${MONTH[day.getMonth()]} в ${b.time}. Окно сразу уйдёт другим пациентам. Отменить можно бесплатно до 18:00 накануне.`;
  openModal('cancel');
}
$('#cancel-yes').addEventListener('click', () => {
  bookings = bookings.filter(b => b.id !== cancelId);
  closeModal('cancel');
  toast('Запись отменена');
  show(stack[stack.length - 1]);
});

/* ---------- Старт и состояния для холста: ?page=…&err=1&menu=branch&modal=cancel ---------- */
const startPage = params.get('page');
if (startPage && startPage !== 'home') {
  Object.assign(state, { service: 's1', doctor: startPage === 'doctor' ? null : 'd1', day: 1, time: ['confirm', 'done'].includes(startPage) ? '15:30' : startPage === 'time' ? '11:00' : null });
  if (startPage === 'doctor') state.doctor = 'd1';
  stack.length = 0; stack.push('home');
  if (startPage !== 'done' && startPage !== 'mine') stack.push(startPage); else stack[0] = startPage;
  show(startPage);
  if (params.get('err')) { form.elements.phone.value = '+7 900 12'; submit(); }
  if (startPage === 'confirm' && params.get('filled')) form.elements.phone.value = '+7 900 000-42-17';
} else show('home');
if (params.get('menu') === 'branch') setTimeout(() => branchSelect.open(true), 60);
if (params.get('modal') === 'cancel') askCancel('b1');
