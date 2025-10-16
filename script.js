const ready = (fn) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
};

ready(() => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  if (!slides.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const slide = entry.target;
        if (entry.isIntersecting) {
          slide.classList.add("is-active");
          slide.classList.remove("is-fading-out");
          if (slide._fadeTimeout) {
            clearTimeout(slide._fadeTimeout);
            slide._fadeTimeout = null;
          }
        } else if (slide.classList.contains("is-active")) {
          slide.classList.remove("is-active");
          slide.classList.add("is-fading-out");
          slide._fadeTimeout = setTimeout(() => {
            slide.classList.remove("is-fading-out");
            slide._fadeTimeout = null;
          }, 2500);
        }
      });
    },
    {
      threshold: 0.6,
    }
  );

  slides.forEach((slide) => observer.observe(slide));

  // Ensure the first slide is active on load for browsers that do not trigger IntersectionObserver immediately.
  slides[0].classList.add("is-active");

});

// === Line-by-Line wrapper ===
ready(() => {
  const paragraphs = document.querySelectorAll(
    ".slides .slide:not(:first-child) p"
  );

  paragraphs.forEach((p) => {
    const raw = p.innerHTML.trim();
    if (!raw) return;

    // режем по <br> (включая варианты <br>, <br/>, <br />)
    const parts = raw.split(/<br\s*\/?>/i);

    // собираем построчно со span-обёртками и теми же <br> между строками
    const html = parts
      .map((seg, i) => {
        const trimmed = seg.trim();
        if (!trimmed) return "";
        return `
          <span class="line" style="--delay:${(i * 0.08).toFixed(2)}s">
            <span class="line__inner">${trimmed}</span>
          </span>
        `;
      })
      .join("<br />");

    p.innerHTML = html;
  });
});

(() => {
  const el = document.querySelector(".cm-bg-bubbles");
  if (!el) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const TAU = Math.PI * 2;
  const bubbles = [
    {
      xProp: "--x1",
      yProp: "--y1",
      x: {
        base: 28,
        waves: [
          { amp: 16, freq: 0.018, phase: 0.00 },
          { amp: 6.4, freq: 0.051, phase: 0.31 },
          { amp: 3.1, freq: 0.079, phase: 0.17, fn: Math.cos },
        ],
      },
      y: {
        base: 42,
        waves: [
          { amp: 12, freq: 0.023, phase: 0.43 },
          { amp: 4.6, freq: 0.056, phase: 0.11 },
          { amp: 2.4, freq: 0.096, phase: 0.70, fn: Math.cos },
        ],
      },
    },
    {
      xProp: "--x2",
      yProp: "--y2",
      x: {
        base: 70,
        waves: [
          { amp: 14, freq: 0.023, phase: 0.19 },
          { amp: 5.0, freq: 0.064, phase: 0.56 },
          { amp: 3.2, freq: 0.098, phase: 0.87, fn: Math.cos },
        ],
      },
      y: {
        base: 30,
        waves: [
          { amp: 12.5, freq: 0.029, phase: 0.61 },
          { amp: 4.1, freq: 0.078, phase: 0.24 },
          { amp: 2.7, freq: 0.113, phase: 0.91, fn: Math.cos },
        ],
      },
    },
    {
      xProp: "--x3",
      yProp: "--y3",
      x: {
        base: 59,
        waves: [
          { amp: 17, freq: 0.02, phase: 0.12 },
          { amp: 5.8, freq: 0.061, phase: 0.47 },
          { amp: 3.6, freq: 0.094, phase: 0.78, fn: Math.cos },
        ],
      },
      y: {
        base: 70,
        waves: [
          { amp: 14, freq: 0.026, phase: 0.32 },
          { amp: 4.6, freq: 0.071, phase: 0.92 },
          { amp: 3.0, freq: 0.11, phase: 0.44, fn: Math.cos },
        ],
      },
    },
    {
      xProp: "--x4",
      yProp: "--y4",
      x: {
        base: 52,
        waves: [
          { amp: 11, freq: 0.027, phase: 0.28 },
          { amp: 3.8, freq: 0.073, phase: 0.63 },
          { amp: 2.2, freq: 0.12, phase: 0.18, fn: Math.cos },
        ],
      },
      y: {
        base: 58,
        waves: [
          { amp: 9, freq: 0.031, phase: 0.51 },
          { amp: 3.4, freq: 0.082, phase: 0.37 },
          { amp: 2.0, freq: 0.125, phase: 0.95, fn: Math.cos },
        ],
      },
    },
  ];

  const evaluateAxis = (time, axis) =>
    axis.waves.reduce((acc, wave) => {
      const fn = wave.fn || Math.sin;
      return acc + fn(TAU * (time * wave.freq + wave.phase)) * wave.amp;
    }, axis.base);

  let start = performance.now();

  function tick(now) {
    const time = (now - start) / 1000;

    bubbles.forEach((bubble) => {
      const x = evaluateAxis(time, bubble.x);
      const y = evaluateAxis(time, bubble.y);
      el.style.setProperty(bubble.xProp, `${x.toFixed(2)}%`);
      el.style.setProperty(bubble.yProp, `${y.toFixed(2)}%`);
    });

    const blurLight = 48 + 8 * Math.sin(TAU * time * 0.024);
    const blurDark = 52 + 6 * Math.cos(TAU * time * 0.02);
    const lightPulse = 0.7 + 0.1 * (0.5 + 0.5 * Math.sin(TAU * time * 0.031 + 0.6));
    const shadowPulse = 0.88 + 0.06 * (0.5 + 0.5 * Math.cos(TAU * time * 0.028 - 0.4));
    el.style.setProperty("--cm-blur-light", blurLight.toFixed(1));
    el.style.setProperty("--cm-blur-dark", blurDark.toFixed(1));
    el.style.setProperty("--cm-light-opacity", lightPulse.toFixed(3));
    el.style.setProperty("--cm-shadow-opacity", shadowPulse.toFixed(3));

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
