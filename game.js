// «dyspphy fly» — мини-игра в разделе «Бонус».
// Логотип машет крыльями сквозь колонны: обычные, движущиеся (лиловые) и шипастые (с длинными шипами в проёме).
(() => {
  const game = document.querySelector('.game');
  if (!game) return;
  const canvas = game.querySelector('.game-canvas');
  const context = canvas.getContext('2d');
  const scoreView = game.querySelector('.game-score');
  const panel = game.querySelector('.game-panel');
  const [titleView, textView, hintView] = panel.querySelectorAll('p');
  const startButton = panel.querySelector('.game-start');
  const bestView = panel.querySelector('.game-best-value');
  // Тексты панели — через переводчик (i18n.js), чтобы переключение RU / EN их подхватывало
  const say = (element, ru, vars) => window.I18N ? I18N.set(element, ru, vars) : (element.textContent = ru.replace('{n}', vars?.n ?? ''));

  // Мир: высота всегда 600 единиц, ширина — по пропорциям блока
  const H = 600, GROUND = 46, PILLAR = 74, THORN = 16;
  const GRAVITY = 1650, FLAP = -500, MAX_FALL = 760;
  const INK = '#f1f0ec', LILAC = '#9c9ca3' /* движущиеся колонны — серые, чтобы отличались от белых */, SHADE = '#0d0d0d';
  let W = 960, scale = 1;

  const logo = new Image();
  logo.src = 'complogo.png';
  const LOGO_CROP = [9, 366, 1254, 464]; // эмблема внутри квадратного PNG
  const BIRD_W = 84, BIRD_H = BIRD_W * LOGO_CROP[3] / LOGO_CROP[2];

  let state = 'ready', paused = false, visible = true;
  let bird, pillars, sparks, stars = [], score, best = 0, time = 0, groundShift = 0, lockUntil = 0;
  try { best = Number(localStorage.getItem('yp-flight-best')) || 0; } catch {}
  bestView.textContent = best;

  // Растровая «сеточка» для колонн — как пиксельные облака на обложке
  const dots = document.createElement('canvas');
  dots.width = dots.height = 6;
  const dotContext = dots.getContext('2d');
  dotContext.fillStyle = 'rgba(241,240,236,.16)';
  dotContext.fillRect(0, 0, 1.5, 1.5);
  dotContext.fillRect(3, 3, 1.5, 1.5);
  const dither = context.createPattern(dots, 'repeat');

  // Мягкие спрайты для размытого фона: рисуются один раз, дальше только копируются — дёшево
  const sprite = (size, stops) => {
    const canvasSprite = document.createElement('canvas');
    canvasSprite.width = canvasSprite.height = size;
    const spriteContext = canvasSprite.getContext('2d');
    const gradient = spriteContext.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, size, size);
    return canvasSprite;
  };
  const starSprite = sprite(32, [[0, '#ffffffff'], [.25, '#e8e8e8b0'], [.6, '#e8e8e830'], [1, '#e8e8e800']]);
  const glowSprite = sprite(128, [[0, '#ffffff1c'], [.5, '#ffffff0b'], [1, '#ffffff00']]);
  let hazes = [];

  function resize() {
    const box = canvas.getBoundingClientRect();
    if (!box.width) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    W = Math.round(H * box.width / box.height);
    scale = canvas.height / H;
    if (bird) bird.x = W * .26;
    hazes = Array.from({ length: 4 }, (_, k) => ({ x: (k + .5) * W / 4 + (Math.random() - .5) * 80, y: 80 + Math.random() * (H - GROUND - 160), r: 110 + Math.random() * 90, a: .6 + Math.random() * .4, speed: 4 + Math.random() * 5 }));
    stars = Array.from({ length: Math.round(W / 14) }, () => ({ x: Math.random() * W, y: Math.random() * (H - GROUND), r: Math.random() < .12 ? 1.6 : .8, speed: 8 + Math.random() * 22 }));
    if (state !== 'play') draw();
  }

  function reset() {
    bird = { x: W * .26, y: H * .42, vy: 0, tilt: 0 };
    pillars = []; sparks = []; score = 0; groundShift = 0;
    scoreView.textContent = '0';
  }

  function spawn() {
    const level = Math.min(score, 30);
    const gap = 196 - level * 2;
    const roll = Math.random();
    const kind = score < 2 ? 'still' : roll < .34 ? 'still' : roll < .67 ? 'moving' : 'spiky';
    const both = score > 12 && kind === 'moving' && Math.random() < .35; // позже движущиеся бывают ещё и с шипами
    const margin = 60 + gap / 2;
    pillars.push({
      x: W + 20, gap, passed: false,
      center: margin + Math.random() * (H - GROUND - margin * 2),
      moving: kind === 'moving',
      spiky: kind === 'spiky' || both,
      amp: kind === 'moving' ? 48 + Math.random() * 38 : 0,
      speed: 1.4 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2
    });
  }

  const gapCenter = pillar => {
    const limit = 50 + pillar.gap / 2;
    const y = pillar.center + Math.sin(time * pillar.speed + pillar.phase) * pillar.amp;
    return Math.max(limit, Math.min(H - GROUND - limit, y));
  };
  const speed = () => 200 + Math.min(score, 40) * 3.5;

  // Старт, рестарт и продолжение — только кнопкой на панели; тап и пробел во время игры дают взмах
  function start() {
    if (performance.now() < lockUntil) return;
    game.focus({ preventScroll: true }); // чтобы пробел сразу работал как взмах
    panel.hidden = true;
    if (paused) { paused = false; last = 0; loop(); return; }
    if (state === 'over') reset();
    state = 'play'; last = 0; loop();
    game.classList.add('is-playing');
    flap();
  }

  function showPanel(title, text, button) {
    say(titleView, title);
    say(textView, text.ru, text.vars);
    say(startButton, button);
    const hadFocus = document.activeElement === game;
    panel.hidden = false;
    if (hadFocus) startButton.focus({ preventScroll: true }); // клавиатура: Enter сразу запускает снова
  }

  function flap() {
    if (state !== 'play' || paused) return;
    bird.vy = FLAP;
    for (let i = 0; i < 6; i++) sparks.push({ x: bird.x - BIRD_W * .3, y: bird.y + 4, vx: -60 - Math.random() * 90, vy: (Math.random() - .3) * 120, life: .45 });
  }

  function crash() {
    state = 'over'; game.classList.remove('is-playing');
    lockUntil = performance.now() + 450;
    for (let i = 0; i < 26; i++) sparks.push({ x: bird.x, y: bird.y, vx: (Math.random() - .5) * 420, vy: (Math.random() - .7) * 380, life: .8 });
    if (score > best) {
      best = score;
      try { localStorage.setItem('yp-flight-best', String(best)); } catch {}
    }
    bestView.textContent = best;
    showPanel(score > 0 && score === best ? 'Новый рекорд' : 'Падение', { ru: 'Счёт {n}', vars: { n: score } }, 'Ещё раз');
  }

  function update(dt) {
    time += dt;
    for (const star of stars) { star.x -= star.speed * dt; if (star.x < -2) star.x += W + 4; }
    for (const haze of hazes) { haze.x -= haze.speed * dt; if (haze.x < -haze.r) haze.x += W + haze.r * 2; }
    sparks = sparks.filter(spark => (spark.life -= dt) > 0);
    for (const spark of sparks) { spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.vy += 700 * dt; }
    if (state === 'over') { // после удара логотип падает на землю
      bird.vy = Math.min(MAX_FALL, bird.vy + GRAVITY * dt);
      bird.y = Math.min(H - GROUND - BIRD_H * .3, bird.y + bird.vy * dt);
      bird.tilt = Math.min(1.4, bird.tilt + dt * 4);
    }
    if (state !== 'play') return;

    groundShift = (groundShift + speed() * dt) % 24;
    bird.vy = Math.min(MAX_FALL, bird.vy + GRAVITY * dt);
    bird.y += bird.vy * dt;
    if (bird.y < BIRD_H / 2) { bird.y = BIRD_H / 2; bird.vy = 0; }
    bird.tilt = Math.max(-.45, Math.min(1.1, bird.vy / 650));

    if (!pillars.length || pillars[pillars.length - 1].x < W - 300) spawn();
    for (const pillar of pillars) {
      pillar.x -= speed() * dt;
      if (!pillar.passed && pillar.x + PILLAR < bird.x) {
        pillar.passed = true;
        scoreView.textContent = ++score;
        scoreView.classList.remove('is-up'); void scoreView.offsetWidth; scoreView.classList.add('is-up');
      }
    }
    pillars = pillars.filter(pillar => pillar.x > -PILLAR - 20);

    // Столкновения: корпус логотипа чуть меньше картинки, шипы сужают проём
    const half = { x: BIRD_W * .36, y: BIRD_H * .34 };
    if (bird.y + half.y >= H - GROUND) return crash();
    for (const pillar of pillars) {
      if (bird.x + half.x < pillar.x || bird.x - half.x > pillar.x + PILLAR) continue;
      const center = gapCenter(pillar), reach = pillar.spiky ? THORN : 0;
      if (bird.y - half.y < center - pillar.gap / 2 + reach || bird.y + half.y > center + pillar.gap / 2 - reach) return crash();
    }
  }

  function drawThorns(x, y, direction, length, color) {
    context.fillStyle = color;
    context.beginPath();
    for (let tx = x + 4; tx < x + PILLAR - 6; tx += 14) {
      context.moveTo(tx, y);
      context.lineTo(tx + 5, y + direction * length);
      context.lineTo(tx + 10, y);
    }
    context.fill();
  }

  function drawPillar(pillar) {
    const center = gapCenter(pillar), top = center - pillar.gap / 2, bottom = center + pillar.gap / 2;
    const edge = pillar.moving ? LILAC : INK;
    for (const [y, h] of [[0, top], [bottom, H - GROUND - bottom]]) {
      context.fillStyle = SHADE; context.fillRect(pillar.x, y, PILLAR, h);
      context.fillStyle = dither; context.fillRect(pillar.x, y, PILLAR, h);
    }
    context.strokeStyle = edge; context.lineWidth = 1.5;
    context.strokeRect(pillar.x + .75, -2, PILLAR - 1.5, top + 2);
    context.strokeRect(pillar.x + .75, bottom, PILLAR - 1.5, H - GROUND - bottom + 2);
    // Шапки колонн, как перекладина у эмблемы
    context.fillStyle = edge;
    context.fillRect(pillar.x - 6, top - 8, PILLAR + 12, 8);
    context.fillRect(pillar.x - 6, bottom, PILLAR + 12, 8);
    const length = pillar.spiky ? THORN : 5;
    drawThorns(pillar.x, top, 1, length, edge);
    drawThorns(pillar.x, bottom, -1, length, edge);
    if (pillar.moving) { // стрелки-подсказки, что колонна ездит
      context.fillStyle = LILAC;
      context.font = '12px ui-monospace, monospace';
      context.textAlign = 'center';
      context.fillText('↕', pillar.x + PILLAR / 2, top - 18);
    }
  }

  function draw() {
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.fillStyle = '#060606'; context.fillRect(0, 0, W, H);
    const glow = context.createRadialGradient(W * .5, H * .4, 10, W * .5, H * .4, H * .75);
    glow.addColorStop(0, '#191919'); glow.addColorStop(1, '#060606');
    context.fillStyle = glow; context.fillRect(0, 0, W, H);
    // Фон чуть не в фокусе: звёзды — мягкие размытые точки, плюс туманные пятна
    for (const haze of hazes) { context.globalAlpha = haze.a; context.drawImage(glowSprite, haze.x - haze.r, haze.y - haze.r, haze.r * 2, haze.r * 2); }
    context.globalAlpha = 1;
    for (const star of stars) { const size = star.r > 1 ? 9 : 5.5; context.globalAlpha = star.r > 1 ? .9 : .55; context.drawImage(starSprite, star.x - size / 2, star.y - size / 2, size, size); }
    context.globalAlpha = 1;

    for (const pillar of pillars) drawPillar(pillar);

    // Земля: растровая полоса, бегущая вместе с колоннами
    context.fillStyle = SHADE; context.fillRect(0, H - GROUND, W, GROUND);
    context.fillStyle = dither; context.fillRect(0, H - GROUND, W, GROUND);
    context.fillStyle = INK; context.fillRect(0, H - GROUND, W, 1.5);
    context.fillStyle = '#ffffff30';
    for (let x = -groundShift; x < W; x += 24) context.fillRect(x, H - GROUND + 10, 10, 1);

    for (const spark of sparks) { context.fillStyle = `rgba(241,240,236,${Math.min(1, spark.life * 2)})`; context.fillRect(spark.x, spark.y, 2, 2); }

    drawBird();
  }

  function drawBird() {
    const bob = state === 'ready' ? Math.sin(time * 3) * 8 : 0;
    context.save();
    context.translate(bird.x, bird.y + bob);
    context.rotate(state === 'ready' ? 0 : bird.tilt);
    const halo = context.createRadialGradient(0, 0, 2, 0, 0, BIRD_W * .75);
    halo.addColorStop(0, '#ffffff55'); halo.addColorStop(1, '#ffffff00');
    context.fillStyle = halo; context.fillRect(-BIRD_W, -BIRD_W, BIRD_W * 2, BIRD_W * 2);
    // Взмах: крылья логотипа на миг сжимаются по вертикали
    const beat = state === 'play' && bird.vy < -150 ? .78 : 1;
    if (logo.complete && logo.naturalWidth) context.drawImage(logo, ...LOGO_CROP, -BIRD_W / 2, -BIRD_H / 2 * beat, BIRD_W, BIRD_H * beat);
    else { context.fillStyle = INK; context.beginPath(); context.ellipse(0, 0, BIRD_W / 2, BIRD_H / 2, 0, 0, 7); context.fill(); }
    context.restore();
  }

  let frame = 0, last = 0;
  function loop(now) {
    cancelAnimationFrame(frame);
    if (now !== undefined) {
      const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 0;
      last = now;
      update(dt);
      draw();
    }
    const animate = visible && !document.hidden && !paused;
    if (animate) frame = requestAnimationFrame(loop);
  }

  // Управление: клик/тап по игре, пробел/стрелка вверх, когда игра в фокусе
  startButton.addEventListener('click', start);
  game.addEventListener('pointerdown', event => {
    if (event.button > 0 || event.target.closest('.game-start')) return;
    if (state !== 'play' || paused) return; // начать можно только кнопкой
    event.preventDefault();
    game.focus({ preventScroll: true });
    flap();
  });
  game.addEventListener('keydown', event => {
    if (event.target !== game || ![' ', 'ArrowUp', 'w', 'W'].includes(event.key)) return;
    event.preventDefault();
    if (!event.repeat) flap();
  });

  // Ушли с экрана посреди игры — пауза, вернулись — ждём нажатия
  function hold() {
    if (state === 'play' && !paused) {
      paused = true;
      showPanel('Пауза', { ru: 'Игра остановлена' }, 'Продолжить');
    }
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) hold();
    last = 0; loop();
  }, { threshold: .25 }).observe(game);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hold(); last = 0; loop(); });
  game.addEventListener('blur', () => { if (state === 'play') hold(); });

  // Размер блока меняется при повороте телефона и при первой раскладке страницы
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else addEventListener('resize', resize);
  logo.addEventListener('load', () => { if (state !== 'play') draw(); });
  reset();
  resize();
  last = 0; loop();
})();
