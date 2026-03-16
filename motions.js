/* =============================================
   Adaptive Learning System — motions.js
   JS-powered animation layer:
     · Particle canvas (hero)
     · Scroll-reveal (IntersectionObserver)
     · Button ripple
     · Stat counter
     · Typewriter
     · Navbar scroll-shadow
     · Magnetic hover (hero buttons)
     · Stagger trigger
   ============================================= */

'use strict';

/* ── 1. NAVBAR SCROLL SHADOW ─────────────────── */
(function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── 2. SCROLL REVEAL ────────────────────────── */
(function initScrollReveal() {
  const els = document.querySelectorAll('.reveal, .stagger');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
})();

/* ── 3. HERO PARTICLE CANVAS ─────────────────── */
(function initParticles() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles, raf;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function Particle() {
    this.reset();
  }
  Particle.prototype.reset = function() {
    this.x    = Math.random() * W;
    this.y    = Math.random() * H;
    this.r    = Math.random() * 2.5 + .8;
    this.vx   = (Math.random() - .5) * .4;
    this.vy   = -(Math.random() * .5 + .2);
    this.life = 0;
    this.maxLife = 120 + Math.random() * 180;
    this.hue  = 210 + Math.random() * 30; // blue family
  };

  function init() {
    resize();
    const COUNT = Math.min(60, Math.floor((W * H) / 14000));
    particles = Array.from({ length: COUNT }, () => new Particle());
    // Stagger initial positions
    particles.forEach(p => { p.life = Math.random() * p.maxLife; });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      // Fade in/out
      const progress = p.life / p.maxLife;
      const alpha = progress < .2
        ? progress / .2
        : progress > .8
          ? (1 - progress) / .2
          : 1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${alpha * 0.55})`;
      ctx.fill();

      // Draw connecting lines to nearby particles
      particles.forEach(q => {
        if (q === p) return;
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `hsla(215, 70%, 70%, ${(1 - dist / 90) * alpha * 0.18})`;
          ctx.lineWidth = .6;
          ctx.stroke();
        }
      });

      if (p.life >= p.maxLife) p.reset();
    });

    raf = requestAnimationFrame(draw);
  }

  init();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { init(); }, 150);
  });

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { draw(); }
  });
})();

/* ── 4. BUTTON RIPPLE ────────────────────────── */
(function initRipple() {
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn || btn.disabled) return;

    const rect = btn.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
    const ry = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';

    btn.style.setProperty('--rx', rx);
    btn.style.setProperty('--ry', ry);
    btn.classList.add('ripple-active');
    setTimeout(() => btn.classList.remove('ripple-active'), 500);
  });
})();

/* ── 5. ANIMATED COUNTER ─────────────────────── */
/**
 * Animate a number from 0 → target.
 * Usage: animateCounter(el, 94, '%') → counts up "0%" → "94%"
 */
function animateCounter(el, target, suffix = '') {
  const duration = 1200;
  const start = performance.now();
  const from = 0;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.round(from + (target - from) * eased);
    el.textContent = val + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Observe stat boxes and trigger counter when visible.
 * Stat boxes must have data-count="N" and optionally data-suffix="%".
 */
(function initCounters() {
  const boxes = document.querySelectorAll('[data-count]');
  if (!boxes.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target.querySelector('.stat-val') || e.target;
      const target = parseFloat(e.target.dataset.count) || 0;
      const suffix = e.target.dataset.suffix || '';
      animateCounter(el, target, suffix);
      io.unobserve(e.target);
    });
  }, { threshold: 0.5 });

  boxes.forEach(b => io.observe(b));
})();

/* ── 6. TYPEWRITER ───────────────────────────── */
/**
 * Cycles through words inside elements with class .typewriter
 * Usage: <span class="typewriter" data-words='["Smarter","Faster","Better"]'></span>
 */
(function initTypewriter() {
  document.querySelectorAll('.typewriter[data-words]').forEach(el => {
    let words, idx = 0, charIdx = 0, deleting = false;

    try { words = JSON.parse(el.dataset.words); }
    catch { return; }
    if (!words.length) return;

    el.textContent = '';

    function tick() {
      const word = words[idx];
      if (!deleting) {
        el.textContent = word.slice(0, ++charIdx);
        if (charIdx === word.length) {
          deleting = true;
          setTimeout(tick, 1600);
          return;
        }
        setTimeout(tick, 90);
      } else {
        el.textContent = word.slice(0, --charIdx);
        if (charIdx === 0) {
          deleting = false;
          idx = (idx + 1) % words.length;
          setTimeout(tick, 300);
          return;
        }
        setTimeout(tick, 50);
      }
    }
    setTimeout(tick, 600);
  });
})();

/* ── 7. MAGNETIC BUTTONS ─────────────────────── */
/**
 * Gentle magnetic pull on elements with class .magnetic
 * Works best on large CTA buttons.
 */
(function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) * 0.28;
      const dy = (e.clientY - cy) * 0.28;
      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.03)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

/* ── 8. SMOOTH SECTION FADE ON NAV CLICK ──────── */
(function initNavFade() {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Only internal same-origin page links
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.style.transition = 'opacity .22s ease';
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = href; }, 230);
    });
  });
})();

/* ── 9. CARD TILT ────────────────────────────── */
/**
 * Subtle 3-D tilt on elements with class .tilt
 */
(function initTilt() {
  const STRENGTH = 8; // degrees max
  document.querySelectorAll('.tilt').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width  - .5;  // -0.5 → 0.5
      const yPct = (e.clientY - rect.top)  / rect.height - .5;
      const rotX = -yPct * STRENGTH;
      const rotY =  xPct * STRENGTH;
      el.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
      el.style.transition = 'transform .08s linear';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.transition = 'transform .4s var(--ease-spring, cubic-bezier(.34,1.56,.64,1))';
    });
  });
})();

/* ── 10. PROGRESS BAR ENTRANCE ───────────────── */
(function initProgressBars() {
  document.querySelectorAll('.progress-bar').forEach(bar => {
    const target = bar.style.width || '0%';
    bar.style.width = '0%';
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      setTimeout(() => { bar.style.width = target; }, 150);
      io.unobserve(bar);
    }, { threshold: .5 });
    io.observe(bar);
  });
})();

/* ── 11. EXPOSE HELPERS ──────────────────────── */
window.ALS = window.ALS || {};
window.ALS.animateCounter = animateCounter;
