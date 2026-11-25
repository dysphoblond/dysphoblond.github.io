// Контакты: плитки «проваливаются» в ту сторону, где курсор, и копирование почты.
(() => {
  const tiles = [...document.querySelectorAll('.tile')];
  const TILT = 11, DEPTH = -14; // градусы наклона и глубина «нажатия», px
  const calm = () => document.documentElement.classList.contains('fx-off');

  for (const tile of tiles) {
    tile.addEventListener('pointermove', event => {
      if (calm() || event.pointerType === 'touch') return;
      const box = tile.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height;
      // Точка под курсором уходит вглубь: справа — правый край назад, сверху — верхний
      tile.style.setProperty('--ry', `${((x - .5) * 2 * TILT).toFixed(2)}deg`);
      tile.style.setProperty('--rx', `${((.5 - y) * 2 * -TILT).toFixed(2)}deg`);
      tile.style.setProperty('--z', `${DEPTH}px`);
      tile.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      tile.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      tile.classList.add('is-pressed');
    });
    tile.addEventListener('pointerleave', () => {
      for (const name of ['--rx', '--ry', '--z', '--mx', '--my']) tile.style.removeProperty(name);
      tile.classList.remove('is-pressed');
    });
  }

  for (const button of document.querySelectorAll('.tile-copy')) {
    button.addEventListener('click', async () => {
      const text = button.dataset.copy;
      try { await navigator.clipboard.writeText(text); }
      catch { // без доступа к буферу — выделяем вручную
        const field = Object.assign(document.createElement('textarea'), { value: text });
        document.body.append(field); field.select();
        try { document.execCommand('copy'); } catch {}
        field.remove();
      }
      const say = text => window.I18N ? I18N.set(button, text) : (button.textContent = text);
      say('скопировано ✓');
      clearTimeout(button.timer);
      button.timer = setTimeout(() => say('копировать'), 1800);
    });
  }
})();
