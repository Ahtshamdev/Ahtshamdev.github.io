// Shared motion helpers. Everything here is progressive: without JS, or with reduced
// motion, the page shows its final, static state.

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Adds `.live` while an element is on screen, so its animations play (and replay). */
export function watchLive(selector = '[data-live]') {
  const els = document.querySelectorAll<HTMLElement>(selector);
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('live', e.isIntersecting)),
    { threshold: 0.35 },
  );
  els.forEach((el) => io.observe(el));
}

const NUMBER = /^([^\d]*?)(\d[\d,]*(?:\.\d+)?)(.*)$/;

/** Counts numeric metrics up from zero the first time they appear. */
export function countUp(selector = '[data-count]') {
  if (reduced()) return;
  const els = [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => {
    const m = el.textContent?.trim().match(NUMBER);
    // Skip values like "AX5" whose prefix is a word, not a sign.
    return m && !/[a-z]/i.test(m[1]);
  });
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(e.target as HTMLElement);
      }),
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));

  function run(el: HTMLElement) {
    const final = el.textContent!.trim();
    const [, pre, num, post] = final.match(NUMBER)!;
    const target = parseFloat(num.replace(/,/g, ''));
    const decimals = num.includes('.') ? num.split('.')[1].length : 0;
    const commas = num.includes(',');
    const fmt = (v: number) => {
      const s = v.toFixed(decimals);
      return commas ? Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals }) : s;
    };
    el.style.minWidth = `${el.offsetWidth}px`;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(2, -10 * t);
      el.textContent = t < 1 ? `${pre}${fmt(target * eased)}${post}` : final;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

/** Tilts an element toward the pointer while it hovers over `area`. */
export function tilt(area: HTMLElement, target: HTMLElement, max = 7) {
  if (reduced() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let rx = 0,
    ry = 0,
    tx = 0,
    ty = 0,
    raf = 0;
  const loop = () => {
    rx += (tx - rx) * 0.12;
    ry += (ty - ry) * 0.12;
    target.style.transform = `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    raf = Math.abs(tx - rx) + Math.abs(ty - ry) > 0.01 ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };
  area.addEventListener('pointermove', (e) => {
    const r = area.getBoundingClientRect();
    ty = ((e.clientX - r.left) / r.width - 0.5) * 2 * max;
    tx = -((e.clientY - r.top) / r.height - 0.5) * 2 * max;
    kick();
  });
  area.addEventListener('pointerleave', () => {
    tx = ty = 0;
    kick();
  });
}
