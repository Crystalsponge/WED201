/* ============================================================
   main.js — Hi Nguyen Portfolio
   ──────────────────────────────────────────────────────────
   EXTRA 1 · Typing animation         (hero tagline)
   EXTRA 2 · Dark / Light mode toggle (localStorage + CSS vars)
   EXTRA 3 · Scroll-reveal animations (Intersection Observer)
   EXTRA 4 · Project tag filter       (DOM manipulation)
   ──────────────────────────────────────────────────────────
   Bonus  · Active nav highlighting   (same Observer as #3)
   Bonus  · Hamburger menu toggle
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Set footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initNav();
  initThemeToggle();   // Extra 2 — run before paint to avoid flash
  initTyping();        // Extra 1
  initScrollReveal();  // Extra 3 (+ active nav)
  initFilter();        // Extra 4
  initForm();          // Form validation (supporting JS)

});

/* ============================================================
   HAMBURGER NAV
   ============================================================ */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    links.classList.toggle('open');
  });

  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    });
  });
}

/* ============================================================
   EXTRA 1 · TYPING ANIMATION
   Cycles through an array of tagline strings, typing each
   character one by one, pausing, then erasing before the next.
   No libraries — just setTimeout recursion.
   ============================================================ */
function initTyping() {
  const target = document.getElementById('typing-target');
  if (!target) return;

  const phrases = [
    'CS student @ FPT University.',
    'Java & C developer.',
    'Builder of things that run.',
    'Network tinkerer (CCNA).',
    'Always curious, always building.',
  ];

  const TYPE_SPEED   = 55;   // ms per character typed
  const ERASE_SPEED  = 28;   // ms per character erased
  const PAUSE_AFTER  = 1800; // ms to hold the full phrase
  const PAUSE_BEFORE = 400;  // ms gap before typing next

  let phraseIndex = 0;
  let charIndex   = 0;
  let erasing     = false;

  function tick() {
    const phrase = phrases[phraseIndex];

    if (!erasing) {
      // Type one character
      target.textContent = phrase.slice(0, charIndex + 1);
      charIndex++;

      if (charIndex === phrase.length) {
        // Finished typing — pause then start erasing
        erasing = true;
        setTimeout(tick, PAUSE_AFTER);
        return;
      }
      setTimeout(tick, TYPE_SPEED);

    } else {
      // Erase one character
      target.textContent = phrase.slice(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        // Finished erasing — move to next phrase
        erasing = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(tick, PAUSE_BEFORE);
        return;
      }
      setTimeout(tick, ERASE_SPEED);
    }
  }

  // Small initial delay so the page feels settled before typing starts
  setTimeout(tick, 600);
}

/* ============================================================
   EXTRA 2 · DARK / LIGHT MODE TOGGLE
   Saves preference to localStorage so it persists across visits.
   Controlled via [data-theme] on <html>; CSS vars switch there.
   ============================================================ */
function initThemeToggle() {
  const btn  = document.getElementById('theme-toggle');
  const icon = btn ? btn.querySelector('.theme-icon') : null;
  const html = document.documentElement;
  if (!btn) return;

  // Restore saved preference (or honour OS preference as default)
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(initial);

  btn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (!icon) return;
    if (theme === 'dark') {
      icon.textContent = '☀';   // show sun = "switch to light"
      btn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      icon.textContent = '☾';   // show moon = "switch to dark"
      btn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }
}

/* ============================================================
   EXTRA 3 · SCROLL-REVEAL + ACTIVE NAV
   Two Intersection Observers share one pass over the page:
     a) .reveal  — fade + slide sections in as they enter view
     b) .reveal-card — staggered card entrance in the work grid
     c) Active nav link updates as sections cross the viewport
   ============================================================ */
function initScrollReveal() {
  // ── a) Section reveal ──
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target); // animate once only
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── b) Staggered card reveal ──
  const cardObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay, 10) || 0;
        setTimeout(() => entry.target.classList.add('revealed'), delay);
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal-card').forEach(el => cardObserver.observe(el));

  // ── c) Active nav ──
  const navLinks = document.querySelectorAll('.nav-link');

  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

  document.querySelectorAll('section[id]').forEach(sec => navObserver.observe(sec));
}

/* ============================================================
   EXTRA 4 · PROJECT TAG FILTER
   Reads data-tags on each .project-card and toggles visibility.
   Uses card.hidden so hidden cards are also removed from tab order.
   ============================================================ */
function initFilter() {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards   = document.querySelectorAll('.project-card');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const tags    = card.dataset.tags || '';
        const visible = filter === 'all' || tags.split(' ').includes(filter);
        card.hidden   = !visible;
      });
    });
  });

  // Set initial aria-pressed state
  buttons.forEach(b => b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false'));
}

/* ============================================================
   FORM VALIDATION (supporting JS, not counted as an extra)
   ============================================================ */
function initForm() {
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('submit-btn');
  const successMsg = document.getElementById('form-success');
  if (!form) return;

  const rules = {
    'f-name':    { validate: v => v.trim().length >= 2,                            message: 'Please enter your name (at least 2 characters).' },
    'f-email':   { validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),    message: 'Please enter a valid email address.' },
    'f-message': { validate: v => v.trim().length >= 10,                           message: 'Message must be at least 10 characters.' },
  };

  function validateField(id) {
    const field = document.getElementById(id);
    const errEl = document.getElementById('err-' + id.replace('f-', ''));
    if (!field || !errEl) return true;
    const valid = rules[id].validate(field.value);
    field.classList.toggle('invalid', !valid);
    field.setAttribute('aria-invalid', String(!valid));
    errEl.textContent = valid ? '' : rules[id].message;
    return valid;
  }

  Object.keys(rules).forEach(id => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('blur',  () => validateField(id));
    field.addEventListener('input', () => { if (field.classList.contains('invalid')) validateField(id); });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const allValid = Object.keys(rules).map(validateField).every(Boolean);
    if (!allValid) { form.querySelector('.invalid')?.focus(); return; }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Sending…';
    setTimeout(() => {
      form.reset();
      successMsg.hidden = false;
      submitBtn.hidden  = true;
    }, 800);
  });
}
