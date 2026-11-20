/** Games hub: show best scores. */
import { load } from '../core/store.js';

const scores = load().gameScores || {};
for (const card of document.querySelectorAll('[data-game-card]')) {
  const best = scores[card.dataset.gameCard];
  if (best) card.querySelector('[data-best]').textContent = `Your best: ${best}`;
}
