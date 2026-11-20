/**
 * Shared bits for the practice, typing-test and placement pages.
 */
import { load } from './store.js';
import { loadLayout, detectLayout } from '../engine/layouts.js';
import { allowedKeys, nextLessonId, courseOrder } from './lesson-logic.js';
import { formatTime } from '../engine/stats.js';

const base = () => document.documentElement.dataset.base || '';
const json = (path) => fetch(base() + path, { headers: { Accept: 'application/json' } }).then((r) => {
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
});

/** Fetch what the pages need, in parallel. */
export async function loadData({ texts = false, words = false } = {}) {
  const [index, badges, layout, textData, wordlist] = await Promise.all([
    json('/api/lessons'),
    json('/api/badges').then((d) => d.badges),
    loadLayout(load().settings.layout || detectLayout()),
    texts ? json('/api/texts/tests') : null,
    words ? json('/api/wordlists/en-common') : null,
  ]);
  return { index, badges, layout, texts: textData, wordlist };
}

/** Keys the learner has met so far (home row at minimum). */
export function learntKeys(index, state = load()) {
  const order = courseOrder(index);
  const next = nextLessonId(index, state.progress, state.skipped);
  const done = order.every((l) => state.progress?.[l.id]?.stars > 0 || state.skipped?.[l.id]);
  const keys = done ? allowedKeys(index, order.at(-1).id) : allowedKeys(index, next);
  for (const k of 'asdfghjkl; ') keys.add(k);
  return keys;
}

/** Fill a results card (practice / test pages). */
export function showResultsCard(card, result, { title, message, xp = 0, keyboard = null } = {}) {
  const set = (k, v) => { const el = card.querySelector(`[data-r="${k}"]`); if (el) el.textContent = v; };
  set('wpm', String(Math.round(result.wpm)));
  set('rawWpm', String(Math.round(result.rawWpm)));
  set('accuracy', String(Math.round(result.accuracy)));
  set('errors', String(result.errors));
  set('time', formatTime(result.elapsedMs));
  if (title) card.querySelector('[data-results-title]').textContent = title;
  card.querySelector('[data-results-message]').textContent = message || '';
  const xpEl = card.querySelector('[data-results-xp]');
  if (xpEl) {
    xpEl.textContent = xp ? `+${xp} XP` : '';
    xpEl.hidden = !xp;
  }
  const list = card.querySelector('[data-results-problem]');
  if (list) {
    list.replaceChildren(...(result.problemKeys || []).map((k) => {
      const li = document.createElement('li');
      li.className = 'pill pill--warning';
      const info = keyboard?.info(k.char);
      const cap = document.createElement('span');
      cap.className = `keycap${info ? ` keycap--${info.finger}` : ''}`;
      cap.textContent = k.char === ' ' ? 'Space' : k.char;
      li.append(cap, ` ${Math.round(k.errorRate * 100)}% missed`);
      return li;
    }));
  }
  card.hidden = false;
  card.focus({ preventScroll: true });
  card.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

/** Encouraging one-liner for practice results (never negative). */
export function practiceMessage(r) {
  if (r.accuracy >= 97) return 'Excellent accuracy – that’s exactly how speed is built.';
  if (r.accuracy >= 92) return 'Lovely steady typing. Keep it up!';
  if (r.accuracy >= 85) return 'Good work. Slowing down a touch will boost your accuracy.';
  return 'Every practice helps. Rest on the home row and take it gently.';
}
