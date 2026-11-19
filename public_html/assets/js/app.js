/**
 * App shell: runs on every page. Keep it small – page-specific code lives
 * in assets/js/pages/* and is loaded only where needed.
 */
import { initTheme, cycleTheme, themeLabel } from './core/theme.js';
import { load, update, subscribe } from './core/store.js';
import { levelInfo, currentStreak } from './core/rewards.js';
import { icon } from './core/icons.js';

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

/* ---- "Start typing" goes to the learner's next lesson ---- */
const startLink = document.querySelector('[data-start-link]');
if (startLink) {
  import('./core/store.js').then(async ({ load }) => {
    const { progress = {}, skipped = {} } = load();
    if (!Object.keys(progress).length && !Object.keys(skipped).length) return; // first visit
    const [{ nextLessonId }, res] = await Promise.all([
      import('./core/lesson-logic.js'),
      fetch(`${document.documentElement.dataset.base || ''}/api/lessons`),
    ]);
    if (!res.ok) return;
    const id = nextLessonId(await res.json(), progress, skipped);
    if (id) {
      startLink.href = `${document.documentElement.dataset.base || ''}/lessons/${id}`;
      startLink.firstChild.textContent = 'Continue typing ';
    }
  }).catch(() => {});
}

/* ---- Icons: <span data-icon="flame"></span> ---- */
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]:empty').forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
}
hydrateIcons();

/* ---- Header chip: streak + level ---- */
const chip = document.querySelector('[data-header-stats]');
function renderChip(state = load()) {
  if (!chip) return;
  const xp = state.xp || 0;
  if (!xp) return void (chip.hidden = true);
  const lvl = levelInfo(xp).level;
  const streak = currentStreak(state.streak);
  chip.innerHTML = `<span class="header-stats__item header-stats__item--streak${streak ? '' : ' is-cold'}">${icon('flame', { size: 18 })}${streak}</span>`
    + `<span class="header-stats__item header-stats__item--level">${icon('star', { size: 18 })}Lv ${lvl}</span>`;
  chip.setAttribute('aria-label', `${streak}-day streak, level ${lvl}. View badges.`);
  chip.hidden = false;
}
renderChip();
subscribe(renderChip);

/* ---- Guest banner (until accounts arrive in Phase 4) ---- */
const WEEK = 7 * 24 * 3600 * 1000;
function renderBanner(state = load()) {
  document.querySelectorAll('[data-guest-banner]').forEach((b) => {
    const dismissed = state.ui?.bannerDismissedAt && Date.now() - Date.parse(state.ui.bannerDismissedAt) < WEEK;
    b.hidden = !!document.documentElement.dataset.user || !(Object.keys(state.progress || {}).length > 0) || !!dismissed;
  });
}
renderBanner();
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-guest-banner-close]')) return;
  update((s) => { s.ui.bannerDismissedAt = new Date().toISOString(); });
  renderBanner();
});
document.addEventListener('kq:progress', () => renderBanner());

/* ---- Account sync (signed-in learners, or clean-up after signing out) ---- */
if (document.documentElement.dataset.user || load().account?.userId) {
  import('./core/sync.js').then((m) => m.initSync()).catch(() => {});
}
