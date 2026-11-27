// Клиника «Эмаль» — общие компоненты: выпадающие списки, модалки, тост. Без библиотек.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rub = v => `${Math.round(v).toLocaleString('ru-RU')} ₽`;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Во фрейме холста фокус не переводим: иначе страница холста прокручивается к фрейму
const inFrame = window.self !== window.top;
const CARET = '<svg class="caret" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Выпадающий список: <div class="select" data-name> с options [{value,label,hint}] */
function makeSelect(root, { options, value = null, placeholder = 'Выберите', onChange = () => {} }) {
  root.classList.add('select');
  const id = 'm' + Math.random().toString(36).slice(2, 8);
  root.innerHTML = `<button class="select-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}"><span class="select-value"></span>${CARET}</button><div class="menu" role="listbox" id="${id}"></div>`;
  const btn = $('.select-btn', root), menu = $('.menu', root), label = $('.select-value', root);
  const api = {
    value,
    set(v, silent) {
      api.value = v;
      const o = options.find(x => x.value === v);
      label.textContent = o ? o.label : placeholder;
      label.classList.toggle('is-placeholder', !o);
      $$('.menu-item', menu).forEach(i => i.setAttribute('aria-selected', String(i.dataset.value === String(v))));
      if (!silent) onChange(v, o);
    },
    setOptions(next) { options = next; render(); api.set(options.some(o => o.value === api.value) ? api.value : null, true); },
    open(on = !root.classList.contains('is-open')) {
      $$('.select.is-open').forEach(s => { if (s !== root) { s.classList.remove('is-open'); $('.select-btn', s).setAttribute('aria-expanded', 'false'); } });
      root.classList.toggle('is-open', on);
      btn.setAttribute('aria-expanded', String(on));
      if (on && !inFrame) ($('[aria-selected="true"]', menu) || $('.menu-item', menu))?.focus();
    },
  };
  function render() {
    menu.innerHTML = options.map(o => `<button class="menu-item" type="button" role="option" data-value="${o.value}">${o.label}${o.hint ? `<small>${o.hint}</small>` : ''}</button>`).join('');
  }
  render();
  api.set(value, true);
  btn.addEventListener('click', () => api.open());
  menu.addEventListener('click', e => {
    const item = e.target.closest('.menu-item');
    if (!item) return;
    const o = options.find(x => String(x.value) === item.dataset.value);
    api.set(o.value);
    api.open(false);
    btn.focus();
  });
  menu.addEventListener('keydown', e => {
    const items = $$('.menu-item', menu), i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(i + 1, items.length - 1)].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(i - 1, 0)].focus(); }
    if (e.key === 'Escape') { api.open(false); btn.focus(); }
  });
  root._select = api;
  return api;
}
document.addEventListener('click', e => {
  if (e.target.closest('.select')) return;
  $$('.select.is-open').forEach(s => { s.classList.remove('is-open'); $('.select-btn', s).setAttribute('aria-expanded', 'false'); });
});

/* Модалки: .overlay#id, открытие openModal(id), закрытие — крестик, фон, Escape */
let lastFocus = null;
function openModal(id) {
  const o = document.getElementById(id);
  lastFocus = document.activeElement;
  o.classList.add('is-open');
  o.removeAttribute('aria-hidden');
  if (!inFrame) setTimeout(() => ($('[autofocus]', o) || $('.modal button, .modal input', o))?.focus(), 30);
}
function closeModal(id) {
  const o = id ? document.getElementById(id) : $('.overlay.is-open');
  if (!o) return;
  o.classList.remove('is-open');
  o.setAttribute('aria-hidden', 'true');
  lastFocus?.focus?.();
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('overlay')) closeModal(e.target.id);
  const c = e.target.closest('[data-close]');
  if (c) closeModal(c.closest('.overlay').id);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('.overlay.is-open') && !$('.select.is-open')) closeModal(); });

/* Тост */
function toast(text) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = text;
  t.classList.add('is-on');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('is-on'), 2600);
}

const params = new URLSearchParams(location.search);
