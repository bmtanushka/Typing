/**
 * Lesson map: decorates the server-rendered journey with local progress,
 * locking, skip-ahead and test-out options.
 */
import { load, update } from '../core/store.js';
import { lessonState, blockingLesson, skipUnit, nextLessonId, courseOrder } from '../core/lesson-logic.js';
import { isUnitComplete } from '../core/rewards.js';
import { greeting } from '../core/mascot.js';
import { trackSkipped } from '../core/sync.js';
import { showPageError, fetchJsonOrThrow } from '../core/errors.js';

const base = document.documentElement.dataset.base || '';
let index;
try {
  index = await fetchJsonOrThrow(`${base}/api/lessons`);
} catch (e) {
  showPageError('Your progress couldn’t be shown just now – the lessons below still work. Try again in a moment.');
  throw e;
}
const order = courseOrder(index);
const byId = Object.fromEntries(order.map((l) => [l.id, l]));
const dialog = document.querySelector('[data-locked-dialog]');
const status = document.querySelector('[data-map-status]');
const starString = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
const url = (id) => `${base}/lessons/${id}`;

function render() {
  const state = load();
  const nextId = nextLessonId(index, state.progress, state.skipped);

  for (const node of document.querySelectorAll('[data-lesson]')) {
    const id = node.dataset.lesson;
    const st = lessonState(index, state, id);
    const stars = state.progress[id]?.stars || 0;
    const skipped = !!state.skipped?.[id] && !stars;
    node.classList.remove('map-node--todo', 'map-node--done', 'map-node--current', 'map-node--locked', 'map-node--skipped');
    node.removeAttribute('aria-disabled');
    const sr = node.querySelector('[data-sr-state]');
    node.querySelector('[data-stars]').textContent = stars ? starString(stars) : '';

    if (st === 'done') {
      node.classList.add(skipped ? 'map-node--skipped' : 'map-node--done');
      sr.textContent = skipped ? ', skipped – play any time' : `, completed with ${stars} of 3 stars`;
    } else if (st === 'locked') {
      node.classList.add('map-node--locked');
      node.setAttribute('aria-disabled', 'true');
      sr.textContent = ', locked';
    } else if (id === nextId) {
      node.classList.add('map-node--current');
      sr.textContent = ', up next';
    } else {
      node.classList.add('map-node--todo');
      sr.textContent = ', open';
    }
  }

  for (const island of document.querySelectorAll('[data-unit]')) {
    const unit = index.units.find((u) => u.id === island.dataset.unit);
    const done = unit.lessons.filter((l) => state.progress[l.id]?.stars > 0 || state.skipped?.[l.id]).length;
    island.querySelector('[data-unit-done]').textContent = String(done);
    const complete = isUnitComplete(state, index, unit.id);
    island.classList.toggle('island--complete', complete);

    const actions = island.querySelector('[data-unit-actions]');
    actions.replaceChildren();
    if (complete) continue;
    const reached = lessonState(index, state, unit.lessons[0].id) !== 'locked';
    const checkpoint = unit.lessons.find((l) => l.type === 'checkpoint');
    if (checkpoint && reached) {
      const a = Object.assign(document.createElement('a'), { className: 'btn btn--ghost btn--sm', href: url(checkpoint.id), textContent: 'Test out with the checkpoint' });
      actions.append(a);
    } else if (!checkpoint && reached) {
      const b = Object.assign(document.createElement('button'), { className: 'btn btn--ghost btn--sm', type: 'button', textContent: 'Skip – I know this already' });
      b.addEventListener('click', () => {
        const before = new Set(Object.keys(load().skipped || {}));
        update((s) => skipUnit(s, index, unit.id));
        trackSkipped(Object.keys(load().skipped || {}).filter((id) => !before.has(id)));
        status.textContent = `${unit.title} skipped. You can still play those lessons any time.`;
        render();
      });
      actions.append(b);
    }
  }

  const box = document.querySelector('[data-continue]');
  if (box && nextId) {
    const started = Object.keys(state.progress).length + Object.keys(state.skipped || {}).length > 0;
    box.querySelector('[data-continue-label]').textContent = greeting(started);
    box.querySelector('[data-continue-title]').textContent = byId[nextId].title;
    const link = box.querySelector('[data-continue-link]');
    link.href = url(nextId);
    link.textContent = started ? 'Continue' : 'Start';
    box.hidden = false;
  }
}

/* Locked lessons explain what to do instead of navigating. */
document.addEventListener('click', (e) => {
  const node = e.target.closest('[data-lesson][aria-disabled="true"]');
  if (!node) return;
  e.preventDefault();
  const state = load();
  const target = byId[node.dataset.lesson];
  const blocker = blockingLesson(index, state, target.id);
  dialog.querySelector('[data-locked-text]').textContent = blocker
    ? `Finish “${blocker.title}” to open “${target.title}”. Each lesson builds on the one before.`
    : `Finish the lessons before “${target.title}” to open it.`;
  const go = dialog.querySelector('[data-locked-go]');
  go.href = url((blocker || byId[nextLessonId(index, state.progress, state.skipped)]).id);
  go.textContent = blocker ? `Go to ${blocker.title}` : 'Go to my next lesson';
  const unit = index.units.find((u) => u.id === target.unit);
  const checkpoint = unit.lessons.find((l) => l.type === 'checkpoint');
  const test = dialog.querySelector('[data-locked-test]');
  test.hidden = !(checkpoint && lessonState(index, state, checkpoint.id) !== 'locked');
  if (checkpoint) test.href = url(checkpoint.id);
  dialog.showModal();
});

render();
document.addEventListener('kq:synced', render);
