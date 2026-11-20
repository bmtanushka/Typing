/**
 * Placement test: one minute, then recommend units to skip.
 */
import { Exercise } from '../core/exercise.js';
import { loadData } from '../core/practice-ui.js';
import { placementSkips, skipUnit, nextLessonId } from '../core/lesson-logic.js';
import { load, update } from '../core/store.js';
import { recordTest } from '../core/rewards.js';
import { track, trackSkipped, makeEvent } from '../core/sync.js';

const $ = (s) => document.querySelector(s);
const base = document.documentElement.dataset.base || '';
const { index, badges, layout, texts } = await loadData({ texts: true });
const ex = new Exercise($('[data-exercise]'), layout);
const intro = $('[data-placement-intro]');
const card = $('[data-placement-result]');
let skips = [];

async function start() {
  intro.hidden = true;
  card.hidden = true;
  const more = texts.texts.map((t) => t.text).join(' ');
  const result = await ex.run({ text: texts.placement, timeLimit: 60, getMoreText: () => ` ${more}`, showHands: false });
  let out;
  update((s) => { out = recordTest(s, { result, ref: 'placement', badges, index }); });
  track(makeEvent('test', 'placement', result, { xp: out.xpGained, badges: out.newBadges }));
  show(result);
}

function show(result) {
  skips = placementSkips(index, result);
  const wpm = Math.round(result.wpm);
  const acc = Math.round(result.accuracy);
  const list = $('[data-pl-units]');
  if (!skips.length) {
    $('[data-pl-title]').textContent = 'Let’s build strong foundations';
    $('[data-pl-summary]').textContent = acc < 90
      ? `You typed ${wpm} WPM with ${acc}% accuracy. Accuracy is the secret to real speed, so we suggest starting with the first lessons – they’ll go quickly!`
      : `You typed ${wpm} WPM with ${acc}% accuracy. The early lessons will make you faster in no time.`;
    list.replaceChildren();
  } else {
    $('[data-pl-title]').textContent = 'Great typing!';
    $('[data-pl-summary]').textContent = `You typed ${wpm} WPM with ${acc}% accuracy. You can skip these units:`;
    list.replaceChildren(...skips.map((id) => {
      const li = document.createElement('li');
      li.className = 'pill pill--success';
      li.textContent = `✓ ${index.units.find((u) => u.id === id).title}`;
      return li;
    }));
  }
  $('[data-pl-apply]').hidden = skips.length === 0;
  $('[data-pl-begin]').classList.toggle('btn--primary', skips.length === 0);
  $('[data-pl-begin]').classList.toggle('btn--secondary', skips.length > 0);
  $('[data-exercise]').hidden = true;
  card.hidden = false;
  card.focus();
}

$('[data-placement-start]').addEventListener('click', start);
$('[data-pl-retry]').addEventListener('click', start);
$('[data-restart]').addEventListener('click', start);
$('[data-pl-apply]').addEventListener('click', () => {
  const before = new Set(Object.keys(load().skipped || {}));
  update((s) => { for (const id of skips) skipUnit(s, index, id); });
  const st = load();
  trackSkipped(Object.keys(st.skipped || {}).filter((id) => !before.has(id)));
  location.href = `${base}/lessons/${nextLessonId(index, st.progress, st.skipped)}`;
});
