/**
 * App shell: runs on every page. Keep it small – page-specific code lives
 * in assets/js/pages/* and is loaded only where needed.
 */
import { initTheme, cycleTheme, themeLabel } from './core/theme.js';

initTheme();

/* ---- Theme toggle button(s) ---- */
function labelToggle(btn) {
  btn.setAttribute('aria-label', `Theme: ${themeLabel()}. Click to change.`);
  btn.title = `Theme: ${themeLabel()}`;
}
document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
  labelToggle(btn);
  btn.addEventListener('click', () => {
    cycleTheme();
    labelToggle(btn);
  });
});
document.addEventListener('kq:themechange', () => {
  document.querySelectorAll('[data-theme-toggle]').forEach(labelToggle);
});

/* ---- Mobile navigation ---- */
const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.getElementById('site-nav');
if (navToggle && nav) {
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  };
  navToggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      navToggle.focus();
    }
  });
}

/* ---- Animated progress bars: <span class="progress__bar" data-progress="40"> ---- */
requestAnimationFrame(() => {
  document.querySelectorAll('.progress__bar[data-progress]').forEach((bar) => {
    const pct = Math.max(0, Math.min(100, Number(bar.dataset.progress) || 0));
    bar.style.width = `${pct}%`;
  });
});
