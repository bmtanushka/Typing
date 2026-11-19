/**
 * Lesson map: decorates the server-rendered journey with local progress.
 */
import { load } from '../core/store.js';

const progress = load().progress || {};
const nodes = [...document.querySelectorAll('[data-lesson]')];

function starString(n) {
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

let next = null;
for (const node of nodes) {
  const id = node.dataset.lesson;
  const p = progress[id];
  const stars = p?.stars || 0;
  const sr = node.querySelector('[data-sr-state]');
  node.classList.remove('map-node--todo', 'map-node--done', 'map-node--current');
  if (stars > 0) {
    node.classList.add('map-node--done');
    node.querySelector('[data-stars]').textContent = starString(stars);
    sr.textContent = `, completed with ${stars} of 3 stars`;
  } else if (!next) {
    next = node;
    node.classList.add('map-node--current');
    sr.textContent = p?.attempts ? ', in progress – up next' : ', up next';
  } else {
    node.classList.add('map-node--todo');
  }
}

for (const island of document.querySelectorAll('[data-unit]')) {
  const done = island.querySelectorAll('.map-node--done').length;
  const total = island.querySelectorAll('[data-lesson]').length;
  island.querySelector('[data-unit-done]').textContent = String(done);
  island.classList.toggle('island--complete', done === total && total > 0);
}

const box = document.querySelector('[data-continue]');
if (box && next) {
  const started = Object.keys(progress).length > 0;
  box.querySelector('[data-continue-label]').textContent = started ? 'Pick up where you left off' : 'Start here';
  box.querySelector('[data-continue-title]').textContent = next.querySelector('.map-node__label').textContent;
  const link = box.querySelector('[data-continue-link]');
  link.href = next.href;
  link.textContent = started ? 'Continue' : 'Start';
  box.hidden = false;
}
