/**
 * Typing test: 1, 3 or 5 minutes, with history chart.
 */
import { Exercise } from '../core/exercise.js';
import { loadData, showResultsCard } from '../core/practice-ui.js';
import { createRng, shuffle } from '../engine/generators.js';
import { load, update } from '../core/store.js';
import { recordTest } from '../core/rewards.js';
import { track, makeEvent } from '../core/sync.js';
import { lineChart } from '../core/chart.js';
import { play } from '../core/sound.js';
import { confetti } from '../core/confetti.js';

const $ = (s) => document.querySelector(s);
const { index, badges, layout, texts } = await loadData({ texts: true });
const ex = new Exercise($('[data-exercise]'), layout);
const setup = $('[data-test-setup]');
const results = $('[data-results]');
const rng = createRng();
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
let minutes = 1;

const testResults = () => (load().results || []).filter((r) => r.type === 'test' && r.ref !== 'placement');
const bestWpm = () => Math.max(0, ...testResults().map((r) => r.wpm));

function renderHistory() {
  const data = testResults().slice(-30).map((r) => ({
    label: dateFmt.format(new Date(r.at)),
    detail: `${Math.round((r.durationMs || 60000) / 60000)} min · ${Math.round(r.accuracy)}%`,
    value: Math.round(r.wpm),
  }));
  lineChart($('[data-history]'), data, { title: 'Speed (WPM)', unit: ' WPM' });
  const best = bestWpm();
  $('[data-best]').textContent = best ? `${Math.round(best)} WPM` : 'no tests yet';
}

/** Several shuffled paragraphs – plenty for five minutes. */
function testText() {
  return shuffle(texts.texts, rng).map((t) => t.text).join(' ');
}

async function start(m) {
  minutes = m;
  results.hidden = true;
  setup.hidden = true;
  const text = testText();
  const previousBest = bestWpm();
  const result = await ex.run({ text, timeLimit: m * 60, getMoreText: () => ` ${testText()}`, showHands: false });
  let out;
  update((s) => { out = recordTest(s, { result, ref: `test-${m}min`, badges, index }); });
  track(makeEvent('test', `test-${m}min`, result, { xp: out.xpGained, badges: out.newBadges }));
  const isBest = result.wpm > previousBest && previousBest > 0;
  if (isBest) { confetti({ pieces: 80, duration: 2000 }); play('levelUp'); } else play('success');
  showResultsCard(results, result, {
    title: isBest ? 'New personal best!' : `${m}-minute test complete!`,
    message: isBest
      ? `That’s ${Math.round(result.wpm - previousBest)} WPM faster than your previous best. Brilliant!`
      : result.accuracy >= 95 ? 'Lovely accuracy – speed will keep rising with practice.' : 'Well done for finishing! Aim for steady, accurate keystrokes next time.',
    xp: out.xpGained,
    keyboard: ex.keyboard,
  });
  setup.hidden = false;
  renderHistory();
}

document.querySelectorAll('[data-minutes]').forEach((b) => b.addEventListener('click', () => start(Number(b.dataset.minutes))));
$('[data-again]').addEventListener('click', () => { results.hidden = true; setup.hidden = false; setup.querySelector('[data-minutes]').focus(); });
$('[data-restart]').addEventListener('click', () => start(minutes));
renderHistory();
