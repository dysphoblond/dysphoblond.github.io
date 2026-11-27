// Эмаль CRM — данные и логика прототипа. Все люди, цены и записи вымышлены.
const DOCTORS = [
  { id: 'd1', name: 'Анна Миронова', role: 'Терапевт', chair: 'Кресло 1' },
  { id: 'd2', name: 'Олег Ветров', role: 'Хирург-имплантолог', chair: 'Кресло 2' },
  { id: 'd3', name: 'Ирина Лаптева', role: 'Ортодонт', chair: 'Кресло 3' },
  { id: 'd4', name: 'Дмитрий Шульц', role: 'Гигиенист', chair: 'Кресло 4' },
];
const SERVICES = [
  { id: 's1', name: 'Консультация', min: 30, price: 1500 },
  { id: 's2', name: 'Лечение кариеса', min: 60, price: 6800 },
  { id: 's3', name: 'Пломба', min: 60, price: 5200 },
  { id: 's4', name: 'Лечение каналов', min: 90, price: 12400 },
  { id: 's5', name: 'Удаление зуба', min: 60, price: 4500 },
  { id: 's6', name: 'Имплантация', min: 90, price: 48000 },
  { id: 's7', name: 'Коррекция брекетов', min: 30, price: 3500 },
  { id: 's8', name: 'Профгигиена', min: 60, price: 5900 },
  { id: 's9', name: 'Отбеливание', min: 90, price: 18000 },
];
const PATIENTS = [
  ['p1', 'Белов Артём Сергеевич', 34, '+7 900 000-42-17', '03.09.2026', -2400],
  ['p2', 'Карпова Елена', 41, '+7 900 000-18-05', '12.06.2026', 0],
  ['p3', 'Морозов Илья', 29, '+7 900 000-77-31', '—', 0],
  ['p4', 'Сафина Лейла', 37, '+7 900 000-23-90', '20.10.2026', 0],
  ['p5', 'Григорьева Татьяна', 52, '+7 900 000-61-44', '15.08.2026', 0],
  ['p6', 'Носов Павел', 45, '+7 900 000-09-12', '—', 0],
  ['p7', 'Ким Виктория', 26, '+7 900 000-35-68', '02.11.2026', 0],
  ['p8', 'Орлов Сергей', 58, '+7 900 000-54-21', '30.10.2026', -48000],
  ['p9', 'Зуева Мария', 33, '+7 900 000-80-07', '—', 0],
  ['p10', 'Лебедев Роман', 49, '+7 900 000-12-63', '27.10.2026', 0],
  ['p11', 'Фомина Дарья', 22, '+7 900 000-46-39', '—', 0],
  ['p12', 'Петрова Алина', 14, '+7 900 000-38-50', '30.10.2026', 0],
  ['p13', 'Тихонов Глеб', 16, '+7 900 000-71-26', '30.10.2026', 0],
  ['p14', 'Ершова Ксения', 19, '+7 900 000-66-02', '30.10.2026', 0],
  ['p15', 'Аксенова Вера', 31, '+7 900 000-24-97', '—', 0],
  ['p16', 'Мельникова Ольга', 44, '+7 900 000-59-81', '27.05.2026', 0],
  ['p17', 'Руденко Юлия', 36, '+7 900 000-13-45', '11.04.2026', 0],
  ['p18', 'Савина Ирина', 28, '+7 900 000-87-30', '19.09.2026', 0],
  ['p19', 'Гусев Кирилл', 40, '+7 900 000-02-76', '—', 0],
  ['p20', 'Ковалёв Денис', 47, '+7 900 000-31-58', '18.05.2026', 0],
].map(([id, name, age, phone, last, balance]) => ({ id, name, age, phone, last, balance }));
const STATUS = {
  done: { label: 'Приём завершён', badge: 'badge-done' },
  arrived: { label: 'В кресле', badge: 'badge-arrived' },
  ok: { label: 'Подтверждена', badge: 'badge-ok' },
  wait: { label: 'Ждём подтверждения', badge: 'badge-wait' },
  error: { label: 'Отменена', badge: 'badge-error' },
};
// [врач, начало, услуга, пациент, статус]
let APPTS = [
  ['d1', '09:00', 's2', 'p2', 'done'], ['d1', '10:00', 's1', 'p3', 'done'], ['d1', '10:30', 's4', 'p4', 'done'],
  ['d1', '12:30', 's3', 'p1', 'arrived'], ['d1', '14:00', 's2', 'p5', 'ok'], ['d1', '16:00', 's1', 'p6', 'wait'], ['d1', '17:30', 's3', 'p7', 'ok'],
  ['d2', '09:30', 's6', 'p8', 'done'], ['d2', '11:30', 's5', 'p9', 'error'], ['d2', '13:00', 's6', 'p10', 'ok'], ['d2', '15:30', 's5', 'p11', 'wait'],
  ['d3', '09:00', 's7', 'p12', 'done'], ['d3', '11:00', 's7', 'p13', 'done'], ['d3', '12:00', 's7', 'p14', 'arrived'], ['d3', '13:30', 's7', 'p13', 'ok'],
  ['d3', '16:00', 's1', 'p15', 'ok'], ['d3', '18:00', 's7', 'p12', 'wait'],
  ['d4', '10:00', 's8', 'p16', 'done'], ['d4', '11:30', 's8', 'p17', 'done'], ['d4', '13:00', 's8', 'p17', 'ok'], ['d4', '14:30', 's9', 'p18', 'ok'], ['d4', '17:00', 's8', 'p19', 'wait'],
].map(([doc, time, svc, pat, st], i) => ({ id: 'a' + (i + 1), doc, time, svc, pat, st }));
// На 13:00 к гигиенисту — отдельный пациент, чтобы никто не был записан к двум врачам сразу
APPTS.find(a => a.time === '13:00' && a.doc === 'd4').pat = 'p20';

const NOW = '12:40';
const DAY_START = 9 * 60, DAY_END = 20 * 60, SLOT = 30;
const byId = (list, id) => list.find(x => x.id === id);
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const initials = name => name.split(' ').slice(0, 2).map(w => w[0]).join('');
const shortName = name => { const [f, i] = name.split(' '); return `${f} ${i ? i[0] + '.' : ''}`; };
const svcOf = a => byId(SERVICES, a.svc);
const ageWord = n => (n % 10 === 1 && n % 100 !== 11 ? 'год' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'года' : 'лет');
const endOf = a => toMin(a.time) + svcOf(a).min;

/* ---------- Маршруты ---------- */
function route() {
  const [screen, id] = (location.hash.slice(1) || params.get('screen') || 'schedule').split('/');
  const target = screen === 'patient' ? 'patient' : screen === 'patients' ? 'patients' : 'schedule';
  $$('.screen').forEach(s => { s.hidden = s.id !== 'screen-' + target; });
  $$('.side-nav a').forEach(a => {
    const on = a.dataset.nav === (target === 'patient' ? 'patients' : target);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (target === 'patient') renderPatient(id || params.get('id') || 'p1');
  if (target === 'patients') renderPatients();
  document.title = { schedule: 'Эмаль CRM — расписание', patients: 'Эмаль CRM — пациенты', patient: 'Эмаль CRM — карточка пациента' }[target];
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route);

/* ---------- Расписание ---------- */
let docFilter = 'all', selectedAppt = null;
const docSelect = makeSelect($('#doc-filter'), {
  options: [{ value: 'all', label: 'Все врачи', hint: '4' }, ...DOCTORS.map(d => ({ value: d.id, label: d.name, hint: d.role }))],
  value: 'all',
  onChange: v => { docFilter = v; renderSchedule(); },
});

function renderStats() {
  const live = APPTS.filter(a => a.st !== 'error');
  const count = st => APPTS.filter(a => a.st === st).length;
  const busy = live.reduce((s, a) => s + svcOf(a).min, 0);
  const freeSlots = Math.floor((DOCTORS.length * (DAY_END - DAY_START) - busy) / SLOT);
  const sum = live.reduce((s, a) => s + svcOf(a).price, 0);
  const bar = ['done', 'arrived', 'ok', 'wait'].map(st => `<i style="width:${count(st) / live.length * 100}%;background:var(--${st === 'done' ? 'line-strong' : st})"></i>`).join('');
  $('#day-stats').innerHTML = `
    <div class="stat"><b>${live.length}</b><span>записей · ${count('done')} приняли, ${count('arrived')} в кресле</span><span class="stat-bar" aria-hidden="true">${bar}</span></div>
    <div class="stat"><b>${count('wait')}</b><span>ждут подтверждения</span></div>
    <div class="stat"><b>${freeSlots}</b><span>свободных окон по 30 минут</span></div>
    <div class="stat"><b>${rub(sum)}</b><span>по записям на день</span></div>`;
}

function renderSchedule() {
  renderStats();
  const docs = docFilter === 'all' ? DOCTORS : DOCTORS.filter(d => d.id === docFilter);
  const slotPx = 44;
  const top = t => (toMin(t) - DAY_START) / SLOT * slotPx;
  let html = `<div class="time-col"><div class="time-head"></div><div class="time-body">${Array.from({ length: 12 }, (_, i) => `<span style="top:${i * 2 * slotPx}px">${toTime(DAY_START + i * 60)}</span>`).join('')}</div></div>`;
  html += docs.map(d => {
    const list = APPTS.filter(a => a.doc === d.id);
    const taken = new Set();
    list.filter(a => a.st !== 'error').forEach(a => { for (let m = toMin(a.time); m < endOf(a); m += SLOT) taken.add(m); });
    let free = '';
    for (let m = DAY_START; m < DAY_END; m += SLOT) {
      if (!taken.has(m) && m > toMin(NOW)) free += `<button class="free" type="button" style="top:${top(toTime(m)) + 3}px;height:${slotPx - 6}px" data-new-doc="${d.id}" data-new-time="${toTime(m)}" aria-label="Записать на ${toTime(m)} к ${d.name}">+ ${toTime(m)}</button>`;
    }
    const blocks = list.map(a => {
      const p = byId(PATIENTS, a.pat), s = svcOf(a), h = s.min / SLOT * slotPx - 4;
      return `<button class="appt st-${a.st}${a.st === 'error' ? ' is-error' : ''}${s.min <= 30 ? ' is-short' : ''}" type="button" data-appt="${a.id}" aria-pressed="${a.id === selectedAppt}" style="top:${top(a.time) + 2}px;height:${h}px" title="${STATUS[a.st].label}">
        <b>${s.min <= 30 ? a.time + ' ' : ''}${shortName(p.name)}</b><span>${s.min > 30 ? a.time + '–' + toTime(endOf(a)) + ' · ' : ''}${s.name}</span></button>`;
    }).join('');
    return `<div class="col"><div class="col-head"><span class="avatar">${initials(d.name)}</span><span><b>${d.name}</b><small>${d.role} · ${d.chair}</small></span></div><div class="col-body">${free}${blocks}</div></div>`;
  }).join('');
  html += `<div class="now" style="top:${64 + top(NOW)}px" data-time="${NOW}"></div>`;
  $('#grid').innerHTML = html;

  // Телефон: список записей по времени (для одного врача — со свободными окнами)
  const list = APPTS.filter(a => docFilter === 'all' || a.doc === docFilter).sort((a, b) => toMin(a.time) - toMin(b.time));
  let agenda = '';
  let cursor = DAY_START;
  for (const a of list) {
    if (docFilter !== 'all' && a.st !== 'error' && toMin(a.time) - cursor >= 60 && toMin(a.time) > toMin(NOW)) {
      agenda += `<li><button class="a-free" type="button" data-new-doc="${a.doc}" data-new-time="${toTime(Math.max(cursor, toMin('13:00')))}">Свободно ${toTime(cursor)}–${a.time} · записать</button></li>`;
    }
    const p = byId(PATIENTS, a.pat), s = svcOf(a), d = byId(DOCTORS, a.doc);
    agenda += `<li><button class="appt st-${a.st}${a.st === 'error' ? ' is-error' : ''}" type="button" data-appt="${a.id}"><span class="a-time">${a.time}<small>${s.min} мин</small></span><span class="a-main"><b>${p.name}</b><span>${s.name}${docFilter === 'all' ? ' · ' + d.name.split(' ')[1] : ''}</span></span><span class="badge ${STATUS[a.st].badge}">${STATUS[a.st].label}</span></button></li>`;
    if (a.st !== 'error') cursor = Math.max(cursor, endOf(a));
  }
  $('#agenda').innerHTML = agenda;
}

/* Детали записи */
function openAppt(id) {
  selectedAppt = id;
  const a = byId(APPTS, id), p = byId(PATIENTS, a.pat), s = svcOf(a), d = byId(DOCTORS, a.doc);
  $('#appt-title').textContent = `${a.time}–${toTime(endOf(a))} · ${s.name}`;
  $('#appt-body').innerHTML = `
    <div class="appt-who"><span class="avatar avatar-lg">${initials(p.name)}</span><span><b>${p.name}</b><a href="#patient/${p.id}" data-close>Открыть карточку</a></span></div>
    <span class="badge ${STATUS[a.st].badge}" style="align-self:flex-start">${STATUS[a.st].label}</span>
    <dl class="appt-dl">
      <div><dt>Врач</dt><dd>${d.name}, ${d.chair.toLowerCase()}</dd></div>
      <div><dt>Телефон</dt><dd><a href="tel:${p.phone.replace(/[^+\d]/g, '')}">${p.phone}</a></dd></div>
      <div><dt>Стоимость</dt><dd>${rub(s.price)}</dd></div>
      <div><dt>Длительность</dt><dd>${s.min} мин</dd></div>
      ${p.balance < 0 ? `<div><dt>Долг</dt><dd class="debt">${rub(-p.balance)}</dd></div>` : ''}
    </dl>`;
  const next = { wait: ['ok', 'Подтвердить'], ok: ['arrived', 'Пациент пришёл'], arrived: ['done', 'Завершить приём'] }[a.st];
  $('#appt-foot').innerHTML = a.st === 'error' || a.st === 'done'
    ? `<button class="btn btn-secondary btn-block" type="button" data-close>Закрыть</button>`
    : `<div class="appt-foot-stack">${next ? `<button class="btn" type="button" data-advance="${next[0]}">${next[1]}</button>` : ''}<button class="btn btn-secondary" type="button" data-move>Перенести</button><button class="btn btn-danger" type="button" data-cancel>Отменить</button></div>`;
  renderSchedule();
  openModal('appt');
}
$('#appt').addEventListener('click', e => {
  const a = byId(APPTS, selectedAppt);
  const adv = e.target.closest('[data-advance]');
  if (adv) { a.st = adv.dataset.advance; toast(`${shortName(byId(PATIENTS, a.pat).name)}: ${STATUS[a.st].label.toLowerCase()}`); openAppt(a.id); }
  if (e.target.closest('[data-move]')) { closeModal('appt'); openNew({ patient: a.pat, doctor: a.doc, service: a.svc, moving: a.id }); }
  if (e.target.closest('[data-cancel]')) {
    $('#cancel-text').textContent = `${byId(PATIENTS, a.pat).name}, ${a.time}, ${svcOf(a).name.toLowerCase()}. Пациенту уйдёт сообщение об отмене, окно освободится.`;
    closeModal('appt');
    openModal('cancel');
  }
});
$('#cancel-yes').addEventListener('click', () => {
  const a = byId(APPTS, selectedAppt);
  a.st = 'error';
  closeModal('cancel');
  renderSchedule();
  toast('Запись отменена, окно свободно');
});

/* ---------- Новая запись ---------- */
let moving = null;
const sPatient = makeSelect($('#s-patient'), {
  options: [...PATIENTS].sort((a, b) => a.name.localeCompare(b.name, 'ru')).map(p => ({ value: p.id, label: p.name, hint: p.phone })),
  placeholder: 'Выберите пациента',
  onChange: () => $('#f-patient').classList.remove('is-error'),
});
const sDoctor = makeSelect($('#s-doctor'), { options: DOCTORS.map(d => ({ value: d.id, label: d.name, hint: d.role })), value: 'd1', onChange: renderSlots });
const sService = makeSelect($('#s-service'), { options: SERVICES.map(s => ({ value: s.id, label: s.name, hint: `${s.min} мин · ${rub(s.price)}` })), value: 's1', onChange: renderSlots });
let pickedTime = null;

function renderSlots() {
  const doc = sDoctor.value, svc = byId(SERVICES, sService.value);
  const busy = APPTS.filter(a => a.doc === doc && a.st !== 'error' && a.id !== moving).map(a => [toMin(a.time), endOf(a)]);
  let html = '';
  for (let m = DAY_START; m + svc.min <= DAY_END; m += SLOT) {
    const clash = busy.some(([s, e]) => m < e && m + svc.min > s) || m <= toMin(NOW);
    html += `<button class="chip" type="button" data-time="${toTime(m)}" aria-pressed="${toTime(m) === pickedTime}"${clash ? ' disabled' : ''}>${toTime(m)}</button>`;
  }
  $('#slots').innerHTML = html;
  if (pickedTime && $(`#slots [data-time="${pickedTime}"]`)?.disabled) pickedTime = null;
  $('#new-sum').textContent = `${svc.min} мин · ${rub(svc.price)}`;
}
$('#slots').addEventListener('click', e => {
  const c = e.target.closest('.chip');
  if (!c || c.disabled) return;
  pickedTime = c.dataset.time;
  $$('#slots .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c)));
  $('#f-time').classList.remove('is-error');
  $('#time-hint').textContent = 'Серые — заняты';
});

function openNew({ patient = null, doctor = 'd1', service = 's1', time = null, moving: mv = null } = {}) {
  moving = mv;
  pickedTime = time;
  sPatient.set(patient, true);
  sDoctor.set(doctor, true);
  sService.set(service, true);
  $('#f-patient').classList.remove('is-error');
  $('#f-time').classList.remove('is-error');
  $('#time-hint').textContent = 'Серые — заняты';
  $('#new-title').textContent = mv ? 'Перенос записи' : 'Новая запись';
  $('#new-form').reset();
  renderSlots();
  openModal('new');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-open-new]');
  if (b) openNew({ patient: b.hasAttribute('data-patient-from-card') ? currentPatient : null });
  const f = e.target.closest('[data-new-time]');
  if (f) openNew({ doctor: f.dataset.newDoc, time: f.dataset.newTime });
  const ap = e.target.closest('[data-appt]');
  if (ap) openAppt(ap.dataset.appt);
});
$('#new-form').addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  if (!sPatient.value) { $('#f-patient').classList.add('is-error'); $('#f-patient .field-hint').textContent = 'Выберите пациента из списка'; ok = false; }
  if (!pickedTime) { $('#f-time').classList.add('is-error'); $('#time-hint').textContent = 'Выберите свободное время'; ok = false; }
  if (!ok) return;
  if (moving) { const a = byId(APPTS, moving); Object.assign(a, { doc: sDoctor.value, time: pickedTime, svc: sService.value, st: 'ok' }); }
  else APPTS.push({ id: 'a' + (APPTS.length + 1), doc: sDoctor.value, time: pickedTime, svc: sService.value, pat: sPatient.value, st: 'wait' });
  closeModal('new');
  if (location.hash.startsWith('#patient')) location.hash = '#schedule';
  docFilter = 'all'; docSelect.set('all', true);
  renderSchedule();
  toast(`${moving ? 'Перенесли' : 'Записали'}: ${shortName(byId(PATIENTS, sPatient.value).name)}, ${pickedTime}, ${byId(DOCTORS, sDoctor.value).name.split(' ')[1]}`);
});

/* ---------- Пациенты ---------- */
function nextVisit(p) { const a = APPTS.find(x => x.pat === p.id && x.st !== 'error' && x.st !== 'done'); return a ? `сегодня, ${a.time}` : '—'; }
function renderPatients() {
  const q = $('#pat-search').value.trim().toLowerCase();
  const list = PATIENTS.filter(p => !q || p.name.toLowerCase().includes(q) || p.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '#'));
  $('#pat-count').textContent = `${list.length} из ${PATIENTS.length}`;
  $('#pat-rows').innerHTML = list.map(p => `<tr data-pat="${p.id}" tabindex="0"><td><span class="who"><span class="avatar">${initials(p.name)}</span><span><b>${p.name}</b><small>${p.age} ${ageWord(p.age)}</small></span></span></td><td>${p.phone}</td><td>${p.last}</td><td>${nextVisit(p)}</td><td class="num${p.balance < 0 ? ' debt' : ''}">${p.balance < 0 ? '−' + rub(-p.balance) : '0 ₽'}</td></tr>`).join('');
}
$('#pat-search').addEventListener('input', renderPatients);
$('#pat-rows').addEventListener('click', e => { const r = e.target.closest('[data-pat]'); if (r) location.hash = '#patient/' + r.dataset.pat; });
$('#pat-rows').addEventListener('keydown', e => { const r = e.target.closest('[data-pat]'); if (r && e.key === 'Enter') location.hash = '#patient/' + r.dataset.pat; });
$('#sch-search').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  $$('#grid .appt, #agenda .appt').forEach(b => { const a = byId(APPTS, b.dataset.appt); b.style.opacity = !q || byId(PATIENTS, a.pat).name.toLowerCase().includes(q) ? '' : '.25'; });
});

/* ---------- Карточка пациента: зубная формула ---------- */
const TOOTH = '<svg viewBox="0 0 28 34" aria-hidden="true"><path d="M5 4c3-3 15-3 18 0 2 3 1 10-1 14-1 4-2 12-4 14-2 1-3-6-4-9-1 3-2 10-4 9-2-2-3-10-4-14C4 14 3 7 5 4z"/></svg>';
const TS = { ok: 'Здоров', filled: 'Пломба', caries: 'Кариес — в плане', crown: 'Коронка', implant: 'Имплант', missing: 'Отсутствует' };
const CHART_P1 = { 18: 'missing', 28: 'missing', 38: 'missing', 16: 'filled', 26: 'filled', 36: 'filled', 24: 'crown', 46: 'implant', 37: 'caries' };
const TOOTH_NOTE = {
  36: ['Пломба, светоотверждаемая', '12.03.2026', 'Анна Миронова'], 37: ['Кариес средней глубины', 'сегодня, на приёме', 'Анна Миронова'],
  46: ['Имплант, коронка из циркония', '14.11.2025', 'Олег Ветров'], 24: ['Коронка, керамика', '02.07.2025', 'Анна Миронова'],
  16: ['Пломба', '20.01.2025', 'Анна Миронова'], 26: ['Пломба', '20.01.2025', 'Анна Миронова'],
};
let currentPatient = 'p1', currentTooth = 37;
function chartFor(id) {
  if (id === 'p1') return CHART_P1;
  const n = Number(id.slice(1)), c = {};
  [16, 26, 36, 46, 17, 27].forEach((t, i) => { if ((n + i) % 3 === 0) c[t] = 'filled'; });
  if (n % 4 === 0) c[37] = 'caries';
  return c;
}
function renderPatient(id) {
  currentPatient = id;
  const p = byId(PATIENTS, id) || PATIENTS[0];
  $('#pc-initials').textContent = initials(p.name);
  $('#pc-name').textContent = p.name;
  $('#pc-meta').textContent = `${p.age} ${ageWord(p.age)} · ${p.phone} · в клинике с 2023 года`;
  $('#pc-call').href = 'tel:' + p.phone.replace(/[^+\d]/g, '');
  $('#pc-tags').innerHTML = (id === 'p1' ? '<span class="tag tag-alert">Аллергия: лидокаин</span><span class="tag">Боится уколов</span>' : '') + (p.balance < 0 ? `<span class="tag tag-alert">Долг ${rub(-p.balance)}</span>` : '<span class="tag">Без долгов</span>');
  const chart = chartFor(p.id);
  const tooth = n => `<button class="tooth ts-${chart[n] || 'ok'}" type="button" data-tooth="${n}" aria-pressed="${n === currentTooth}" aria-label="Зуб ${n}: ${TS[chart[n] || 'ok']}">${TOOTH}<small>${n}</small></button>`;
  const row = (l, r, cls) => `<div class="jaw ${cls}"><div class="jaw-half">${l.map(tooth).join('')}</div><span class="jaw-gap"></span><div class="jaw-half">${r.map(tooth).join('')}</div></div>`;
  $('#chart').innerHTML = row([18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28], 'upper') + row([48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38], 'lower');
  $('#legend').innerHTML = Object.entries(TS).map(([k, v]) => `<li><i class="ts-${k}" style="${{ ok: 'background:#fff;border-color:#b7bbb4', filled: 'background:#e8eefc;border-color:var(--accent)', caries: 'background:var(--wait-soft);border-color:var(--wait)', crown: 'background:#f3efe4;border-color:#8c7a4b', implant: 'background:#eeeff0;border-color:#5f656b;border-style:dashed', missing: 'background:none;border-color:var(--line-strong);border-style:dashed' }[k]}"></i>${v}</li>`).join('');
  renderTooth();
  const visits = [
    ['сегодня', 'Пломба, зуб 37', 'Анна Миронова · в кресле', 5200],
    ['03.09.2026', 'Профгигиена', 'Дмитрий Шульц', 5900],
    ['12.03.2026', 'Пломба, зуб 36', 'Анна Миронова', 5200],
    ['14.11.2025', 'Имплантация, зуб 46', 'Олег Ветров', 48000],
  ];
  $('#visits').innerHTML = visits.map(([d, w, who, s]) => `<li><time>${d}</time><span class="v-main"><b>${w}</b><small>${who}</small></span><span class="v-sum">${rub(s)}</span></li>`).join('');
  $('#pays').innerHTML = [['03.09.2026', 'Профгигиена', 'Карта', 5900], ['12.03.2026', 'Пломба, зуб 36', 'СБП', 5200], ['14.11.2025', 'Имплантация, зуб 46', 'Рассрочка, 1 из 3', 16000]].map(([d, w, how, s]) => `<tr><td>${d}</td><td>${w}</td><td>${how}</td><td class="num">${rub(s)}</td></tr>`).join('');
}
function renderTooth() {
  const st = chartFor(currentPatient)[currentTooth] || 'ok';
  const note = currentPatient === 'p1' ? TOOTH_NOTE[currentTooth] : null;
  $('#tooth-info').innerHTML = `<p class="t-caption">Зуб ${currentTooth}</p><h3>${TS[st]}</h3>
    <dl>${note ? `<div><dt>Что сделано</dt><dd>${note[0]}</dd></div><div><dt>Когда</dt><dd>${note[1]}</dd></div><div><dt>Врач</dt><dd>${note[2]}</dd></div>` : '<div><dt>Лечение</dt><dd>не проводилось</dd></div>'}</dl>
    ${st === 'caries' ? '<button class="btn btn-sm" type="button" data-open-new data-patient-from-card>Записать на лечение</button>' : ''}`;
  $$('#chart .tooth').forEach(t => t.setAttribute('aria-pressed', String(Number(t.dataset.tooth) === currentTooth)));
}
$('#chart').addEventListener('click', e => { const t = e.target.closest('[data-tooth]'); if (t) { currentTooth = Number(t.dataset.tooth); renderTooth(); } });
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.setAttribute('aria-selected', String(x === t)));
  $$('.tab-panel').forEach(p => { p.hidden = p.dataset.panel !== t.dataset.tab; });
}));
$('#day-prev').addEventListener('click', () => toast('В прототипе показан один день — 27 ноября'));
$('#day-next').addEventListener('click', () => toast('В прототипе показан один день — 27 ноября'));

/* Кнопка «+» на телефоне */
const fab = document.createElement('button');
fab.className = 'btn fab';
fab.type = 'button';
fab.setAttribute('aria-label', 'Новая запись');
fab.setAttribute('data-open-new', '');
fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
document.body.append(fab);

/* ---------- Старт и состояния для холста (?screen=…&modal=…&menu=…&err=1) ---------- */
renderSchedule();
route();
const st = params.get('modal');
if (st === 'appt') openAppt(params.get('appt') || 'a4');
if (st === 'new' || st === 'new-error') { openNew({ doctor: 'd1', service: 's2' }); if (st === 'new-error') $('#new-form').requestSubmit(); }
if (st === 'cancel') { selectedAppt = 'a6'; $('#cancel-text').textContent = 'Носов Павел, 16:00, консультация. Пациенту уйдёт сообщение об отмене, окно освободится.'; openModal('cancel'); }
if (params.get('doc')) { docFilter = params.get('doc'); docSelect.set(docFilter, true); renderSchedule(); }
if (params.get('menu') === 'doctor') setTimeout(() => docSelect.open(true), 50);
if (params.get('menu') === 'service') { openNew({ patient: 'p1', doctor: 'd1', service: 's3', time: '15:00' }); setTimeout(() => sService.open(true), 80); }
if (params.get('tab')) $(`.tab[data-tab="${params.get('tab')}"]`)?.click();
