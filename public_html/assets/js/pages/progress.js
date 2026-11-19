/**
 * Progress dashboard (guest or signed in – reads the local store, which mirrors the
 * account when signed in).
 */
import { load } from '../core/store.js';
import { levelInfo, currentStreak } from '../core/rewards.js';
import { problemKeys } from '../engine/stats.js';
import { Keyboard } from '../engine/keyboard.js';
import { loadLayout, detectLayout } from '../engine/layouts.js';
import { lineChart } from '../core/chart.js';
import { icon } from '../core/icons.js';
import { courseOrder } from '../core/lesson-logic.js';

const base = document.documentElement.dataset.base || '';
const $ = (s) => document.querySelector(s);
const [index, badges, layout] = await Promise.all([
  fetch(`${base}/api/lessons`).then((r) => r.json()),
  fetch(`${base}/api/badges`).then((r) => r.json()).then((d) => d.badges),
  loadLayout(load().settings.layout || detectLayout()),
]);
const titles = Object.fromEntries(courseOrder(index).map((l) => [l.id, l.title]));
const keyboard = new Keyboard($('[data-dash-keyboard]'), layout);
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const TYPE_LABEL = { lesson: 'Lesson', practice: 'Practice', test: 'Typing test', game: 'Game' };

function describe(r) {
  if (r.type === 'lesson') return titles[r.ref] || 'Lesson';
  if (r.type === 'test') return `${Math.round((r.durationMs || 60000) / 60000)}-minute test`;
  if (r.type === 'game') return r.ref ? r.ref.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'Game';
  return r.ref && titles[r.ref] ? `Practice: ${titles[r.ref]}` : 'Practice';
}

function render() {
  const s = load();
  const signedIn = !!document.documentElement.dataset.user;
  $('[data-dash-sync]').textContent = signedIn ? 'Saved to your account – carry on from any device.' : 'Your progress is saved in this browser.';
  const lvl = levelInfo(s.xp);
  $('[data-dash-level]').textContent = `Level ${lvl.level} · ${s.xp || 0} XP`;
  const streak = currentStreak(s.streak);
  $('[data-dash-streak]').textContent = `${streak}-day streak`;

  const typing = (s.results || []).filter((r) => r.type !== 'game' && (r.chars ?? 1) > 0 && r.accuracy > 0);
  const empty = typing.length === 0 && !Object.keys(s.progress || {}).length;
  $('[data-dash-empty]').hidden = !empty;
  $('[data-dash-content]').hidden = empty;
  if (empty) return;

  // Summary
  const passed = Object.values(s.progress || {}).filter((p) => p.stars > 0).length;
  const total = courseOrder(index).length;
  $('[data-s="lessons"]').textContent = String(passed);
  $('[data-s="lessons-sub"]').textContent = `of ${total} lessons`;
  const scored = typing.filter((r) => r.wpm > 0);
  const best = scored.reduce((m, r) => (r.wpm > m.wpm ? r : m), { wpm: 0 });
  $('[data-s="best"]').textContent = String(Math.round(best.wpm));
  $('[data-s="best-sub"]').textContent = best.at ? `${describe(best)}, ${dateFmt.format(new Date(best.at))}` : '';
  const last10 = typing.slice(-10);
  $('[data-s="acc"]').textContent = last10.length ? String(Math.round(last10.reduce((t, r) => t + r.accuracy, 0) / last10.length)) : '0';
  const minutes = Math.round((s.results || []).reduce((t, r) => t + (r.durationMs || 0), 0) / 60000);
  $('[data-s="time"]').textContent = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
  $('[data-s="sessions"]').textContent = `${(s.results || []).length} sessions`;

  // Charts – last 30 scored results
  const points = scored.slice(-30).map((r) => ({ label: dateFmt.format(new Date(r.at)), detail: describe(r), value: Math.round(r.wpm), acc: Math.round(r.accuracy) }));
  lineChart($('[data-chart="wpm"]'), points, { title: 'Speed (WPM)', unit: ' WPM' });
  lineChart($('[data-chart="accuracy"]'), points.map((p) => ({ ...p, value: p.acc })), { title: 'Accuracy (%)', unit: '%', yMin: 50, yMax: 100, tone: 'success' });

  // Heatmap
  const problems = problemKeys(s.keyStats || {}, { minAttempts: 5, limit: 6 });
  const rates = {};
  for (const [ch, st] of Object.entries(s.keyStats || {})) if (st.attempts >= 5 && ch !== ' ') rates[ch.toLowerCase()] = Math.max(rates[ch.toLowerCase()] || 0, st.errors / st.attempts);
  keyboard.setHeat(rates, { always: true });
  const list = $('[data-dash-problem]');
  list.replaceChildren(...problems.map((k) => {
    const li = document.createElement('li');
    li.className = 'pill pill--warning';
    const info = keyboard.info(k.char);
    const cap = document.createElement('span');
    cap.className = `keycap${info ? ` keycap--${info.finger}` : ''}`;
    cap.textContent = k.char;
    li.append(cap, ` ${Math.round(k.errorRate * 100)}% missed`);
    return li;
  }));
  $('[data-dash-practise]').hidden = problems.length === 0;
  $('[data-dash-noproblem]').hidden = problems.length > 0;

  // Course units
  for (const li of document.querySelectorAll('[data-dash-unit]')) {
    const unit = index.units.find((u) => u.id === li.dataset.dashUnit);
    const done = unit.lessons.filter((l) => s.progress?.[l.id]?.stars > 0 || s.skipped?.[l.id]).length;
    const pct = Math.round((done / unit.lessons.length) * 100);
    li.querySelector('[data-unit-count]').textContent = `${done} / ${unit.lessons.length}`;
    li.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(pct));
    requestAnimationFrame(() => (li.querySelector('.progress__bar').style.width = `${pct}%`));
  }

  // Recent activity
  const recent = (s.results || []).slice(-8).reverse();
  $('[data-dash-recent]').replaceChildren(...recent.map((r) => {
    const li = document.createElement('li');
    li.className = 'activity__item';
    const what = document.createElement('div');
    const title = document.createElement('p');
    title.className = 'activity__title';
    title.textContent = describe(r);
    const meta = document.createElement('p');
    meta.className = 'small text-muted';
    meta.textContent = `${TYPE_LABEL[r.type] || 'Activity'} · ${dateFmt.format(new Date(r.at))}`;
    what.append(title, meta);
    const nums = document.createElement('p');
    nums.className = 'activity__nums';
    nums.textContent = r.type === 'game' ? `${r.score || 0} points` : `${Math.round(r.wpm)} WPM · ${Math.round(r.accuracy)}%`;
    if (r.stars) nums.textContent += ` · ${'★'.repeat(r.stars)}`;
    li.append(what, nums);
    return li;
  }));

  // Badges earned
  const earned = badges.filter((b) => s.badges?.[b.id]);
  const row = $('[data-dash-badges]');
  row.replaceChildren(...(earned.length ? earned : []).map((b) => {
    const li = document.createElement('li');
    li.className = `dash__badge badge-card--${b.colour || 'primary'}`;
    li.title = b.description;
    const medal = document.createElement('span');
    medal.className = 'badge-card__medal';
    medal.innerHTML = icon(b.icon, { size: 26 });
    const name = document.createElement('span');
    name.className = 'small';
    name.textContent = b.title;
    li.append(medal, name);
    return li;
  }));
  if (!earned.length) {
    const li = document.createElement('li');
    li.className = 'text-muted';
    li.textContent = 'Your first badge is one lesson away!';
    row.append(li);
  }
}

render();
document.addEventListener('kq:synced', render);
