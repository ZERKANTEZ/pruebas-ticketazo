/**
 * carousel.js
 * Hero carousel con soporte touch/swipe y teclado.
 */

window.Carousel = (() => {
  // ── State ──────────────────────────────
  let current  = 0;
  let timer    = null;
  let dragging = false;
  let startX   = 0;
  let currentX = 0;
  let diffX    = 0;
  let snapTimeout = null;

  const INTERVAL     = 7000;
  const SWIPE_THRESH = 60; // px mínimos para cambiar slide

  // ── DOM refs ───────────────────────────
  const track  = () => document.getElementById('hero-track');
  const dots   = () => document.getElementById('hero-dots');
  const titleEl = () => document.getElementById('hero-title');
  const subEl   = () => document.getElementById('hero-sub');
  const ctaBtn  = () => document.getElementById('hero-cta-btn');
  const inner   = () => document.getElementById('hero-inner');

  // ── Init ───────────────────────────────
  function init() {
    const t = track();
    if (t && t.children.length > 0) {
      const firstClone = t.firstElementChild.cloneNode(true);
      const lastClone = t.lastElementChild.cloneNode(true);
      t.appendChild(firstClone);
      t.insertBefore(lastClone, t.firstElementChild);

      t.style.transition = 'none';
      applyTranslate(-100, '%');
    }
    buildDots();
    updateContent();
    bindTouch();
    bindKeyboard();
    startTimer();
  }

  function buildDots() {
    const el = dots();
    el.innerHTML = HERO_SLIDES.map((_, i) =>
      `<button class="hero-dot${i === 0 ? ' active' : ''}"
        onclick="Carousel.goTo(${i})"
        aria-label="Slide ${i + 1}"
        role="tab"
        aria-selected="${i === 0}">
      </button>`
    ).join('');
  }

  // ── Navigation ─────────────────────────
  function goTo(n) {
    const maxIdx = HERO_SLIDES.length;
    const t = track();

    if (n < -1) {
      if (t) {
        t.style.transition = 'none';
        applyTranslate((maxIdx) * -100, '%');
        void t.offsetWidth;
      }
      n = maxIdx - 2;
    }
    
    if (n > maxIdx) {
      if (t) {
        t.style.transition = 'none';
        applyTranslate(1 * -100, '%');
        void t.offsetWidth;
      }
      n = 1;
    }
    
    current = n;
    
    if (t) {
      t.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    applyTranslate((current + 1) * -100, '%');
    
    updateDots();
    updateContent();
    restartTimer();

    clearTimeout(snapTimeout);
    if (current === maxIdx) {
      snapTimeout = setTimeout(() => {
        if (!dragging && track() && current === maxIdx) {
          track().style.transition = 'none';
          current = 0;
          applyTranslate((current + 1) * -100, '%');
        }
      }, 500);
    } else if (current === -1) {
      snapTimeout = setTimeout(() => {
        if (!dragging && track() && current === -1) {
          track().style.transition = 'none';
          current = maxIdx - 1;
          applyTranslate((current + 1) * -100, '%');
        }
      }, 500);
    }
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function applyTranslate(value, unit = 'px') {
    const t = track();
    if (!t) return;
    t.style.transform = `translateX(${value}${unit})`;
  }

  function updateDots() {
    const maxIdx = HERO_SLIDES.length;
    const realIdx = (current % maxIdx + maxIdx) % maxIdx;
    const allDots = dots().querySelectorAll('.hero-dot');
    allDots.forEach((d, i) => {
      d.classList.toggle('active', i === realIdx);
      d.setAttribute('aria-selected', i === realIdx);
    });
  }

  function updateContent() {
    const maxIdx = HERO_SLIDES.length;
    const realIdx = (current % maxIdx + maxIdx) % maxIdx;
    const slide = HERO_SLIDES[realIdx];
    const el = inner();
    if (!el) return;

    // Reset animation
    el.style.animation = 'none';
    void el.offsetWidth; // reflow
    el.style.animation = 'heroFadeUp 0.6s ease both';

    if (titleEl()) titleEl().textContent = slide.title;
    if (subEl())   subEl().textContent   = slide.sub;
    if (ctaBtn())  ctaBtn().textContent  = slide.cta;
  }

  // ── Timer ──────────────────────────────
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => next(), INTERVAL);
  }

  function restartTimer() {
    clearInterval(timer);
    startTimer();
  }

  // ── Touch / Mouse drag ─────────────────
  function bindTouch() {
    const el = document.getElementById('hero-section');
    if (!el) return;

    // Touch events
    el.addEventListener('touchstart', onDragStart, { passive: true });
    el.addEventListener('touchmove',  onDragMove,  { passive: true });
    el.addEventListener('touchend',   onDragEnd,   { passive: true });

    // Mouse events (desktop drag)
    el.addEventListener('mousedown',  onDragStart);
    el.addEventListener('mousemove',  onDragMove);
    el.addEventListener('mouseup',    onDragEnd);
    el.addEventListener('mouseleave', onDragEnd);
  }

  function getClientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onDragStart(e) {
    dragging = true;
    startX   = getClientX(e);
    diffX    = 0;
    const t  = track();
    if (t) t.classList.add('dragging');
    clearInterval(timer);
  }

  function onDragMove(e) {
    if (!dragging) return;
    currentX = getClientX(e);
    diffX    = currentX - startX;

    // Move track live with resistance at edges
    const containerWidth = document.getElementById('hero-section')?.offsetWidth || window.innerWidth;
    const baseOffset     = (current + 1) * -containerWidth;
    const drag           = diffX * 0.85; // slight resistance
    track().style.transition = 'none';
    track().style.transform  = `translateX(${baseOffset + drag}px)`;
  }

  function onDragEnd() {
    if (!dragging) return;
    dragging = false;

    const t = track();
    if (t) {
      t.classList.remove('dragging');
    }

    if (Math.abs(diffX) >= SWIPE_THRESH) {
      diffX < 0 ? next() : prev();
    } else {
      goTo(current);
    }

    diffX = 0;
  }

  // ── Keyboard ───────────────────────────
  function bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    });
  }

  // ── Hero button handlers ───────────────
  function handleBuy() {
    const maxIdx = HERO_SLIDES.length;
    const realIdx = (current % maxIdx + maxIdx) % maxIdx;
    const eventId = HERO_SLIDES[realIdx].eventId;
    if (!Auth.isLoggedIn()) { Auth.openModal(); return; }
    Pages.openEvent(eventId);
  }

  function handleCta() {
    const maxIdx = HERO_SLIDES.length;
    const realIdx = (current % maxIdx + maxIdx) % maxIdx;
    Pages.openEvent(HERO_SLIDES[realIdx].eventId);
  }

  // ── Public API ─────────────────────────
  return { init, goTo, next, prev, handleBuy, handleCta };
})();
