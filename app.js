(() => {
  /* ---------- Шапка: тень при скролле + бургер ---------- */
  const hdr = document.getElementById('hdr');
  const burger = hdr.querySelector('.burger');
  const drawer = document.getElementById('drawer');

  const onScroll = () => hdr.classList.toggle('is-scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    drawer.hidden = !open;
  };
  burger.addEventListener('click', () => setMenu(drawer.hidden));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 1200px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Hero: видео «карьера Анны» + синхронная лесенка этапов ----------
     Тайминги этапов размечены по ролику video/anna.mp4 (цикл 8,8 с):
     худи 0–2,3 с · халат 2,3–5,45 с · жакет 5,45–8,2 с · растворение обратно в худи. */
  const video = document.getElementById('heroVideo');
  const list = document.querySelector('.path__steps');
  if (video && list) {
    const steps = [...list.querySelectorAll('button')];
    const START = [0, 2.6, 5.9];         // куда перематывать по клику (уже после взмаха)
    const BOUNDS = [2.3, 5.45, 8.2];     // где заканчивается этап
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cur = -1;

    const paint = (i) => {
      if (i === cur) return;
      cur = i;
      steps.forEach((b, k) => {
        b.classList.toggle('is-done', k < i);
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      list.style.setProperty('--fill', (i / (steps.length - 1)) * 100 + '%');
    };
    const stageAt = (t) => { const k = BOUNDS.findIndex((b) => t < b); return k === -1 ? 0 : k; };

    // плавнее, чем timeupdate (тот срабатывает ~4 раза в секунду)
    const tick = () => { paint(stageAt(video.currentTime)); if (!video.paused) requestAnimationFrame(tick); };
    video.addEventListener('play', () => requestAnimationFrame(tick));
    video.addEventListener('seeked', () => paint(stageAt(video.currentTime)));
    video.addEventListener('timeupdate', () => paint(stageAt(video.currentTime)));
    if (!video.paused) requestAnimationFrame(tick); // автоплей мог стартовать до подключения скрипта

    steps.forEach((b, k) => b.addEventListener('click', () => {
      video.currentTime = START[k];
      paint(k);
      if (!reduce) video.play().catch(() => {});
    }));

    // экономим батарею: видео играет, только когда hero на экране
    new IntersectionObserver(([e]) => {
      if (reduce) return;
      e.isIntersecting ? video.play().catch(() => {}) : video.pause();
    }).observe(video);

    if (reduce) {
      video.removeAttribute('autoplay');
      video.pause();
      video.addEventListener('loadedmetadata', () => { video.currentTime = START[1]; }, { once: true });
      paint(1);
    } else {
      paint(0);
    }
  }

  /* ---------- Листья в CTA: анимация при каждом появлении блока на экране ---------- */
  const cta = document.getElementById('cta');
  if (cta && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => cta.classList.toggle('is-in', e.isIntersecting), { threshold: 0.35 }).observe(cta);
  }

  /* ---------- Истории сотрудников ----------
     Тексты — демо-заглушки, заменить на реальные истории от клиента. */
  const stories = [
    { img: 'img/story-1.jpg', name: 'Анна', role: 'заведующая аптекой, Москва',
      text: 'Пришла в Ригла фармацевтом сразу после колледжа. Через три года по программе «Карьера» стала заведующей — и теперь сама наставляю новичков.' },
    { img: 'img/story-2.jpg', name: 'Дмитрий', role: 'провизор, Санкт-Петербург',
      text: 'Ценю, что здесь можно расти без смены компании: обучение, аттестации и понятные шаги. А команда всегда подстрахует в сложной смене.' },
    { img: 'img/story-3.jpg', name: 'Марина', role: 'фармацевт, вахта в Тюмени',
      text: 'Работаю вахтой: жильё и дорогу оплачивает компания, график прозрачный. За сезон закрываю свои финансовые цели и спокойно отдыхаю дома.' },
  ];

  const main = document.getElementById('storyMain');
  const thumbs = document.getElementById('storyThumbs');
  const txt = document.getElementById('storyTxt');
  const who = document.getElementById('storyWho');
  const dots = document.getElementById('storyDots');
  let cur = 0;

  stories.forEach((s, i) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', `История ${i + 1}`);
    d.addEventListener('click', () => show(i));
    dots.appendChild(d);
  });

  function show(i) {
    cur = (i + stories.length) % stories.length;
    const s = stories[cur];
    main.style.opacity = '0';
    setTimeout(() => { main.src = s.img; main.alt = `${s.name}, ${s.role}`; main.style.opacity = '1'; }, 180);
    txt.textContent = s.text;
    who.innerHTML = `<b>${s.name}</b>, ${s.role}`;
    [...dots.children].forEach((d, k) => d.setAttribute('aria-selected', String(k === cur)));

    thumbs.innerHTML = '';
    [1, 2].forEach((off) => {
      const k = (cur + off) % stories.length;
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Открыть историю: ${stories[k].name}`);
      b.innerHTML = `<img src="${stories[k].img}" alt="">`;
      b.addEventListener('click', () => show(k));
      thumbs.appendChild(b);
    });
  }

  document.querySelectorAll('#stories .arrow').forEach((a) =>
    a.addEventListener('click', () => show(cur + Number(a.dataset.dir))));

  // свайп на мобильном
  let x0 = null;
  main.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  main.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  show(0);
})();
