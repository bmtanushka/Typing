/**
 * Badges page: marks earned badges and shows level / streak summary.
 */
import { load, update } from '../core/store.js';
import { levelInfo, currentStreak } from '../core/rewards.js';

const state = load();
const lvl = levelInfo(state.xp);
const streak = currentStreak(state.streak);
const $ = (s) => document.querySelector(s);

$('[data-level]').textContent = `Level ${lvl.level}`;
$('[data-level-text]').textContent = `${lvl.into} / ${lvl.needed} XP to level ${lvl.level + 1}`;
const pct = Math.round((lvl.into / lvl.needed) * 100);
$('[data-level-progress]').setAttribute('aria-valuenow', String(pct));
requestAnimationFrame(() => ($('[data-level-progress] .progress__bar').style.width = `${pct}%`));
$('[data-streak]').textContent = `${streak} day${streak === 1 ? '' : 's'}`;
$('[data-streak-best]').textContent = `Best: ${state.streak?.best || 0} day${state.streak?.best === 1 ? '' : 's'}`;

const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
let earned = 0;
for (const card of document.querySelectorAll('[data-badge]')) {
  const at = state.badges?.[card.dataset.badge];
  if (!at) continue;
  earned++;
  card.classList.remove('badge-card--locked');
  card.classList.add('badge-card--earned');
  if (!state.ui?.seenBadges?.[card.dataset.badge]) card.classList.add('badge-card--new');
  card.querySelector('[data-badge-state]').textContent = `Earned ${fmt.format(new Date(at))}`;
}
$('[data-earned-count]').textContent = String(earned);

// Mark all as seen so the "new" sparkle shows once.
if (earned) update((s) => { for (const id of Object.keys(s.badges)) s.ui.seenBadges[id] = true; });
