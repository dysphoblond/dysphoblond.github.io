// Холст макета: UI-кит из живых компонентов + фреймы экранов (iframe прототипа в нужном состоянии) + схема переходов.
// Конфиг страницы — window.CANVAS = { app, frames: [{group, items:[{w,h,scale,title,q}]}], flows: [...] }
(function () {
  const C = window.CANVAS;
  const TOKENS = [
    ['bg', '#f1f2ef', 'Фон'], ['surface', '#ffffff', 'Поверхность'], ['surface-2', '#f7f8f6', 'Поверхность 2'], ['line', '#e1e3de', 'Линия'],
    ['text', '#16181b', 'Текст и кнопки'], ['muted', '#5f656b', 'Второй текст'], ['accent', '#1f55d6', 'Акцент: фокус, выбор'],
    ['ok', '#1e7f47', 'Подтверждена'], ['wait', '#a8650f', 'Ждём ответа'], ['error', '#c0392b', 'Ошибка, отмена'],
  ];
  const TYPE = [['t-display', 'Расписание на пятницу', '32 / 600 / −2%'], ['t-h1', 'Карточка пациента', '24 / 600'], ['t-h2', 'Новая запись', '18 / 600'], ['t-body', 'Пломба, зуб 36 · 60 мин · 5 200 ₽', '15 / 400'], ['t-caption', 'Ждём подтверждения до 18:00', '13 / 400']];
  const BTN = [['', 'Основная'], ['btn-secondary', 'Вторичная'], ['btn-danger', 'Опасная']];
  const STATES = [['', 'Обычная'], ['is-hover', 'Наведение'], ['is-active', 'Нажатие'], ['is-disabled', 'Неактивная']];
  const kit = `
  <div class="board-kit">
    <div class="kit-card kit-wide"><h3>Палитра</h3><div class="swatches">${TOKENS.map(([k, hex, name]) => `<div class="sw"><i style="background:${hex}"></i><b>${name}</b><span>--${k}</span><span>${hex}</span></div>`).join('')}</div></div>
    <div class="kit-card"><h3>Типографика · Golos Text</h3>${TYPE.map(([c, t, m]) => `<div class="type-row"><span class="${c}">${t}</span><code>${m}</code></div>`).join('')}</div>
    <div class="kit-card"><h3>Кнопки · 4 состояния</h3><div class="state-grid"><span></span>${STATES.map(s => `<span class="hd">${s[1]}</span>`).join('')}
      ${BTN.map(([v, n]) => `<span class="hd">${n}</span>${STATES.map(([s]) => `<button class="btn btn-sm ${v} ${s}" type="button" tabindex="-1"${s === 'is-disabled' ? ' disabled' : ''}>Записать</button>`).join('')}`).join('')}</div></div>
    <div class="kit-card kit-wide"><h3>Поля ввода · пустое, заполненное, фокус, ошибка</h3><div class="inputs-grid">
      <label class="field"><span class="field-label">Пустое</span><input class="input" placeholder="+7 900 000-00-00" tabindex="-1"><span class="field-hint">Подсказка под полем</span></label>
      <label class="field"><span class="field-label">Заполненное</span><input class="input" value="+7 900 000-42-17" tabindex="-1"><span class="field-hint">Пришлём напоминание</span></label>
      <label class="field"><span class="field-label">Фокус</span><input class="input is-focus" value="+7 900 00" tabindex="-1"><span class="field-hint">Синяя рамка и подсветка</span></label>
      <label class="field is-error"><span class="field-label">Ошибка</span><input class="input" value="+7 900 12" tabindex="-1"><span class="field-hint">Не хватает цифр: нужен номер из 11 цифр</span></label>
    </div></div>
    <div class="kit-card"><h3>Выпадающий список · закрыт и открыт</h3><div class="comp-row"><div id="kit-sel-a" style="width:220px"></div></div><div class="kit-select-open select is-open" style="width:260px"><button class="select-btn" type="button" tabindex="-1"><span class="select-value">Анна Миронова</span><svg class="caret" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button><div class="menu"><span class="menu-item" aria-selected="true">Анна Миронова<small>Терапевт</small></span><span class="menu-item is-hover">Олег Ветров<small>Хирург</small></span><span class="menu-item">Ирина Лаптева<small>Ортодонт</small></span><span class="menu-item">Дмитрий Шульц<small>Гигиенист</small></span></div></div></div>
    <div class="kit-card"><h3>Статусы, время, вкладки, переключатель</h3>
      <div class="comp-row"><span class="badge badge-ok">Подтверждена</span><span class="badge badge-wait">Ждём подтверждения</span><span class="badge badge-arrived">В кресле</span><span class="badge badge-done">Приём завершён</span><span class="badge badge-error">Отменена</span></div>
      <div class="comp-row"><button class="chip" type="button" tabindex="-1">10:00</button><button class="chip" type="button" aria-pressed="true" tabindex="-1">10:30</button><button class="chip" type="button" disabled>11:00</button></div>
      <div class="tabs"><span class="tab" aria-selected="true">Зубная формула</span><span class="tab">Визиты</span><span class="tab">Оплаты</span></div>
      <div class="comp-row"><label class="switch"><input type="checkbox" checked tabindex="-1"><i></i><span>Напомнить за 2 часа</span></label><label class="switch"><input type="checkbox" tabindex="-1"><i></i><span>Выключено</span></label></div>
    </div>
  </div>`;
  $('#kit').innerHTML = kit;
  makeSelect($('#kit-sel-a'), { options: [{ value: 1, label: 'Все врачи' }, { value: 2, label: 'Анна Миронова' }], value: 1 });

  // Фреймы: iframe прототипа в реальном размере, уменьшенный трансформом; клик открывает это состояние
  $('#frames').innerHTML = C.frames.map(g => `<h3 class="t-h2" style="margin:28px 0 14px">${g.group}</h3><div class="frames">${g.items.map(f => {
    const url = `${C.app}${f.q || ''}`;
    return `<figure class="frame" style="margin:0"><figcaption class="frame-label"><b>${f.title}</b><span>${f.w} × ${f.h}</span></figcaption>
      <div class="frame-box" style="width:${Math.round(f.w * f.scale)}px;height:${Math.round(f.h * f.scale)}px"><iframe src="${url}" width="${f.w}" height="${f.h}" style="transform:scale(${f.scale})" loading="lazy" title="${f.title}" tabindex="-1"></iframe><a href="${url}" target="_blank" rel="noopener" aria-label="Открыть «${f.title}» в прототипе"></a></div></figure>`;
  }).join('')}</div>`).join('');

  $('#flows').innerHTML = C.flows.map(([from, how, to, q]) => `<li><span class="from">${from}</span><span class="how">${how}</span><span class="arrow">→</span><span class="to">${to}</span><a href="${C.app}${q || ''}" target="_blank" rel="noopener">Открыть ↗</a></li>`).join('');
})();
