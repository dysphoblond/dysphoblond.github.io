// Контакты: карточки Kwork и Telegram «проваливаются» в ту сторону, где курсор, и кнопка «Скопировать почту».
(() => {
  const TILT = 7, DEPTH = -10; // градусы наклона и глубина «нажатия», px — мягче, чем раньше
  const calm = () => document.documentElement.classList.contains('fx-off') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reset = card => { for (const name of ['--rx', '--ry', '--z', '--mx', '--my']) card.style.removeProperty(name); card.classList.remove('is-pressed'); };

  for (const card of document.querySelectorAll('.reach-card')) {
    card.addEventListener('pointermove', event => {
      if (calm() || event.pointerType === 'touch') return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height;
      // Точка под курсором уходит вглубь: курсор справа — правый край назад, сверху — верхний
      card.style.setProperty('--ry', `${((x - .5) * 2 * TILT).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((.5 - y) * 2 * -TILT).toFixed(2)}deg`);
      card.style.setProperty('--z', `${DEPTH}px`);
      card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      card.classList.add('is-pressed');
    });
    card.addEventListener('pointerleave', () => reset(card));
    card.addEventListener('blur', () => reset(card));
  }
})();

// Кнопка «Скопировать почту».
(() => {
  for (const button of document.querySelectorAll('.reach-copy')) {
    button.addEventListener('click', async () => {
      const text = button.dataset.copy;
      try { await navigator.clipboard.writeText(text); }
      catch { // без доступа к буферу (старые браузеры, http) — копируем через временное поле
        const field = Object.assign(document.createElement('textarea'), { value: text });
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;opacity:0';
        document.body.append(field); field.select();
        try { document.execCommand('copy'); } catch {}
        field.remove();
      }
      const say = text => window.I18N ? I18N.set(button, text) : (button.textContent = text);
      say('Почта скопирована');
      clearTimeout(button.timer);
      button.timer = setTimeout(() => say('Скопировать почту'), 1800);
    });
  }
})();
