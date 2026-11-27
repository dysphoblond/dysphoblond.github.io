// Цепочка крюка продолжается вдоль страницы: пиксельная цепь в технике постера у правого края
// «разматывается» при прокрутке, на её конце висит крюк с постера, а у каждого раздела — кольцо, которое загорается, когда цепь до него доходит.
// При FX OFF и «уменьшить движение» цепочка видна целиком и не двигается.
(() => {
  const main = document.querySelector('main');
  const first = document.querySelector('#design');
  if (!main || !first) return;

  const chain = document.createElement('div');
  chain.className = 'chain';
  chain.setAttribute('aria-hidden', 'true');
  chain.innerHTML = '<i class="chain-line"></i><i class="chain-hook"></i>'; // крюк висит на конце размотанной цепочки
  main.append(chain);

  const sections = [...main.querySelectorAll('section.block, aside.kwork')];
  const nodes = sections.map(() => {
    const node = document.createElement('b');
    node.className = 'chain-node';
    chain.append(node);
    return node;
  });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduce.matches || document.documentElement.classList.contains('fx-off');
  let top = 0, height = 1, marks = [], frame = 0;

  // Где начинается цепочка, какой она длины и где висят звенья (координаты внутри main)
  function measure() {
    const base = main.getBoundingClientRect().top + scrollY;
    top = first.getBoundingClientRect().top + scrollY - base;
    chain.style.top = `${top}px`;
    marks = sections.map((section, i) => {
      const title = section.querySelector('h2') || section;
      const box = title.getBoundingClientRect();
      const y = box.top + scrollY - base - top + Math.min(box.height / 2, 40);
      nodes[i].style.top = `${y}px`;
      return y;
    });
    // Цепочка кончается на кольце последнего раздела — дальше крюк не уезжает
    height = Math.max(1, marks[marks.length - 1] || main.scrollHeight - top);
    chain.style.height = `${height}px`;
    update();
  }

  function update() {
    frame = 0;
    // Цепочка доходит до точки чуть ниже середины экрана
    const reach = calm() ? height : Math.min(height, Math.max(0, scrollY + innerHeight * .62 - (main.getBoundingClientRect().top + scrollY) - top));
    chain.style.setProperty('--reach', `${reach}px`);
    marks.forEach((y, i) => nodes[i].classList.toggle('is-lit', y <= reach));
  }

  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(main); // раскрытие проектов, загрузка картинок
  document.fonts?.ready.then(measure);
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); // переключатель FX
  measure();
})();
