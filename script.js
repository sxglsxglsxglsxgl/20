(() => {
  // ===== Utilities =====
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== 1) Aura Background =====
  const aura = $('#aura-bg');
  let ctx, w, h, dpr, blobs;

  function initAura() {
    if (!aura || prefersReduced) return;
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // cap DPR for perf
    w = Math.floor(window.innerWidth * dpr);
    h = Math.floor(window.innerHeight * dpr);
    aura.width = w;
    aura.height = h;
    aura.style.width = '100vw';
    aura.style.height = '100vh';
    ctx = aura.getContext('2d', { alpha: true });

    const count = Math.round(Math.max(6, Math.min(12, (window.innerWidth + window.innerHeight) / 240)));
    blobs = new Array(count).fill(0).map(() => ({
      x: Math.random() * w, y: Math.random() * h,
      r: (Math.random() * 0.08 + 0.06) * Math.min(w, h),
      vx: (Math.random() - 0.5) * 0.08 * dpr,
      vy: (Math.random() - 0.5) * 0.08 * dpr,
      hue: 38 + Math.random() * 12,     // тёплые, молочные
      sat: 24 + Math.random() * 10,
      alp: 0.12 + Math.random() * 0.1
    }));
  }

  function stepAura() {
    if (!ctx || prefersReduced) return;
    // мягкая «стеклянная» заливка
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      grad.addColorStop(0, `hsla(${b.hue} ${b.sat}% 76% / ${b.alp})`);
      grad.addColorStop(0.6, `hsla(${b.hue} ${b.sat}% 86% / ${b.alp * 0.6})`);
      grad.addColorStop(1, `hsla(${b.hue} ${b.sat}% 96% / 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      // хаотичное мягкое движение
      b.x += b.vx; b.y += b.vy;
      // лёгкое «дыхание» радиуса
      b.r *= (1 + (Math.sin((b.x + b.y) * 0.000002) * 0.001));
      // отражение от границ с небольшой потерей скорости
      if (b.x < -b.r || b.x > w + b.r) b.vx *= -1;
      if (b.y < -b.r || b.y > h + b.r) b.vy *= -1;
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(stepAura);
  }

  function resizeAura() {
    initAura();
  }

  // ===== 2) Slides IO (enter/leave) =====
  const slides = $$('.slide');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        el.classList.add('is-active');
        el.classList.remove('is-fading-out');
      } else {
        if (el.classList.contains('is-active')) {
          el.classList.remove('is-active');
          el.classList.add('is-fading-out');
          // снимем is-fading-out чуть позже, чтобы дать анимации уйти
          setTimeout(() => el.classList.remove('is-fading-out'), 500);
        }
      }
    });
  }, { threshold: [0, 0.25, 0.6, 0.85] });

  slides.forEach(s => io.observe(s));

  // ===== 3) Line-by-line text processing =====
  function wrapLines() {
    slides.forEach(slide => {
      const p = slide.querySelector('p');
      if (!p || p.dataset.enhanced === '1') return;

      // Разбиваем по <br> и пустым строкам. Сохраняем <em> и прочий inline.
      const fragments = p.innerHTML
        .split(/<br\s*\/?>/i)
        .map(s => s.trim())
        .filter(Boolean);

      const html = fragments.map((frag, i) => {
        const delay = (i * 90); // мс между строками
        return `<span class="line" aria-hidden="false">
                  <span class="line__inner" style="--delay:${delay}ms">${frag}</span>
                </span><br/>`;
      }).join('');

      p.innerHTML = html;
      p.dataset.enhanced = '1';
    });
  }

  // ===== 4) Adaptive font tuning via CSS var (fail-safe) =====
  function tuneType() {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const tight = (vh < 620 || (vw < 360 && vh < 700));
    document.documentElement.style.setProperty('--type-tight', tight ? '1' : '0');
  }

  // ===== Init =====
  function init() {
    wrapLines();
    tuneType();
    if (!prefersReduced) {
      initAura();
      requestAnimationFrame(stepAura);
      window.addEventListener('resize', resizeAura, { passive: true });
    }
    window.addEventListener('resize', tuneType, { passive: true });
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
