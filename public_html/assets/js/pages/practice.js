/**
 * Practice: problem keys, word sets or your own text.
 */
import { Exercise } from '../core/exercise.js';
import { loadData, learntKeys, showResultsCard, practiceMessage } from '../core/practice-ui.js';
import { createRng, pick, shuffle, weightedDrill, patternDrill, wordDrill, toSentences } from '../engine/generators.js';
import { load, update } from '../core/store.js';
import { recordPractice } from '../core/rewards.js';
import { track, makeEvent } from '../core/sync.js';
import { play } from '../core/sound.js';

const $ = (s) => document.querySelector(s);
const form = $('[data-practice-form]');
const note = $('[data-problem-note]');
const results = $('[data-results]');
const { index, badges, layout, texts, wordlist } = await loadData({ texts: true, words: true });
const ex = new Exercise($('[data-exercise]'), layout);
const rng = createRng();
const ALL = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,;:\'"?!- ');
let ownText = '';
let lastRef = 'problem-keys';

function problemText() {
  const keys = learntKeys(index);
  const stats = load().keyStats || {};
  const weights = {};
  for (const [ch, s] of Object.entries(stats)) {
    if (s.attempts >= 5 && keys.has(ch) && ch !== ' ' && s.errors > 0) weights[ch] = s.errors / s.attempts;
  }
  const weak = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!weak.length) {
    note.textContent = 'No problem keys yet – here’s a warm-up with the keys you’ve learnt. Keep practising and we’ll spot your tricky keys.';
    note.hidden = false;
    return patternDrill([...keys].filter((c) => c !== ' '), [...keys], { length: 90, r: rng });
  }
  note.textContent = `Focusing on: ${weak.map(([c]) => c).join(' ')} – the keys you miss most often.`;
  note.hidden = false;
  return weightedDrill(Object.fromEntries(weak), keys, { length: 100, r: rng });
}

function wordsText() {
  const set = form.set.value;
  if (set === 'learnt') return wordDrill(wordlist.words, learntKeys(index), [], { count: 30, r: rng });
  if (set === 'common') return shuffle(wordlist.words, rng).slice(0, 30).join(' ');
  if (set === 'sentences') return toSentences(shuffle(wordlist.words, rng).slice(0, 36).join(' '), ALL, { r: rng });
  return pick(texts.texts, rng).text;
}

function updateModeUi() {
  const mode = form.mode.value;
  form.querySelectorAll('[data-for-mode]').forEach((el) => (el.hidden = el.dataset.forMode !== mode));
  note.hidden = mode !== 'problem';
}

async function start() {
  updateModeUi();
  results.hidden = true;
  const mode = form.mode.value;
  let text;
  if (mode === 'problem') { text = problemText(); lastRef = 'problem-keys'; }
  else if (mode === 'words') { text = wordsText(); lastRef = 'word-sets'; }
  else {
    if (!ownText) { $('[data-exercise]').hidden = true; form.own.focus(); return; }
    text = ownText;
    lastRef = 'own-text';
  }
  const limit = Number(form.time.value);
  const result = await ex.run({
    text, timeLimit: limit,
    getMoreText: limit ? () => ` ${mode === 'own' ? ownText : mode === 'problem' ? problemText() : wordsText()}` : null,
  });
  finish(result);
}

function finish(result) {
  let out;
  update((s) => { out = recordPractice(s, { result, ref: lastRef, badges, index }); });
  track(makeEvent('practice', lastRef, result, { xp: out.xpGained, badges: out.newBadges }));
  play(out.newBadges.length ? 'badge' : 'success');
  const badgeNames = out.newBadges.map((id) => badges.find((b) => b.id === id)?.title).filter(Boolean);
  showResultsCard(results, result, {
    title: badgeNames.length ? `New badge: ${badgeNames.join(', ')}!` : 'Nice practice!',
    message: practiceMessage(result),
    xp: out.xpGained,
    keyboard: ex.keyboard,
  });
  ex.keyboard.setHeat(Object.fromEntries((result.problemKeys || []).map((k) => [k.char, k.errorRate])));
}

form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('change', (e) => {
  if (e.target.name === 'own') return;
  if (e.target.name === 'mode') history.replaceState(null, '', `?mode=${form.mode.value}`);
  start();
});
$('[data-use-own]').addEventListener('click', () => {
  // Smart quotes/dashes → keyboard equivalents; drop anything this keyboard can't type.
  const cleaned = form.own.value
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...')
    .replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n');
  ownText = [...cleaned].filter((c) => ex.keyboard.charMap.has(c)).join('').replace(/ {2,}/g, ' ').trim();
  if (!ownText) return form.own.focus();
  start();
});
$('[data-restart]').addEventListener('click', () => start());
$('[data-again]').addEventListener('click', () => start());
start();
