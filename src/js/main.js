/* ── NWMHS — Main JavaScript ─────────────────────────────────── */

(function () {
  'use strict';

  // ── Mobile nav toggle ──────────────────────────────────────
  const navToggle = document.querySelector('.nav__toggle');
  const navLinks  = document.querySelector('.nav__links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('nav__links--open');
      navToggle.setAttribute(
        'aria-expanded',
        navLinks.classList.contains('nav__links--open')
      );
    });
  }

  // ── Contact form → serverless endpoint ─────────────────────
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn     = contactForm.querySelector('[type="submit"]');
      const status  = document.getElementById('form-status');
      const data    = Object.fromEntries(new FormData(contactForm));

      btn.disabled    = true;
      btn.textContent = 'Sending…';

      try {
        const res = await fetch('/_hcms/api/contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data)
        });

        const json = await res.json();

        if (res.ok) {
          contactForm.reset();
          showStatus(status, 'success', 'Message sent! We\'ll be in touch soon.');
        } else {
          showStatus(status, 'error', json.error || 'Something went wrong. Please try again.');
        }
      } catch (err) {
        showStatus(status, 'error', 'Network error. Please try again.');
      } finally {
        btn.disabled    = false;
        btn.textContent = 'Send Message';
      }
    });
  }

  // ── Smooth scroll for anchor links ─────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Helper ─────────────────────────────────────────────────
  function showStatus(el, type, msg) {
    if (!el) return;
    el.textContent  = msg;
    el.className    = 'form-status form-status--' + type;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 6000);
  }

})();
