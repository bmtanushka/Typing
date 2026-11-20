/**
 * Game page: options → play (lazy-loaded game module) → results.
 */
import { runGame } from '../games/framework.js';
import { load, update, setSetting } from '../core/store.js';
import { loadData, learntKeys } from '../core/practice-ui.js';
import { recordGame } from '../core/rewards.js';
import { track, makeEvent } from '../core/sync.js';
import { play } from '../core/sound.js';
import { confetti } from '../core/confetti.js';

const GAMES = ['key-drops', 'balloon-pop', 'space-defender', 'word-race', 'typing-bubbles'];
const root = document.querySelector('[data-game]');
const id = root.dataset.game;
if (!GAMES.includes(id)) throw new Error('Unknown game');
const $ = (s) => root.querySelector(s);

const [{ createGame }, data, wordlist] = await Promise.all([
  import(`../games/${id}.js`), // lazy: only this game's code is downloaded
  loadData(),
  fetch(`${document.documentElement.dataset.base || ''}/api/wordlists/en-common`).then((r) => r.json()),
]);
const { index, badges } = data;
const form = $('[data-options]');
const startOverlay = $('[data-start]');
const resultsOverlay = $('[data-results]');
let controller = null;

form.sound.checked = !!load().settings.sound;
const prefs = load().ui?.games?.[id];
if (prefs?.difficulty) form.querySelector(`input[value="${prefs.difficulty}"]`)?.click();
if (prefs?.keys) form.keys.value = prefs.keys;
const best = () => Number(load().gameScores?.[id] || 0);
$('[data-best-line]').textContent = best() ? `Your best score: ${best()}` : 'Your first game – have fun!';

function keySet(choice) {
  if (choice === 'home') return new Set('asdfghjkl; ');
  if (choice === 'all') return new Set('abcdefghijklmnopqrstuvwxyz ');
  const learnt = learntKeys(index);
  return new Set([...learnt].filter((c) => /[a-z;,./ ]/.test(c)));
}

function start() {
  const difficulty = form.difficulty.value;
  update((s) => {
    s.ui.games = { ...(s.ui.games || {}), [id]: { difficulty, keys: form.keys.value } };
  });
  setSetting('sound', form.sound.checked);
  startOverlay.hidden = true;
  resultsOverlay.hidden = true;
  controller = runGame(root, createGame, {
    keys: keySet(form.keys.value), wordlist: wordlist.words, difficulty, onFinish: finish,
  });
}

function finish(summary) {
  let out;
  update((s) => { out = recordGame(s, { gameId: id, summary, badges, index }); });
  track(makeEvent('game', id, {
    wpm: summary.wpm, rawWpm: summary.wpm, accuracy: summary.accuracy, elapsedMs: summary.durationMs, keystrokes: summary.hits,
  }, { score: summary.score, xp: out.xpGained, badges: out.newBadges }));

  const set = (k, v) => ($(`[data-res="${k}"]`).textContent = String(v));
  set('score', summary.score);
  set('best', best());
  set('accuracy', Math.round(summary.accuracy));
  $('[data-results-title]').textContent = out.newBest && out.previousBest > 0 ? 'New best score!' : summary.won === false ? 'Good race!' : 'Well played!';
  $('[data-results-detail]').textContent = summary.detail || '';
  $('[data-res-xp]').textContent = `+${out.xpGained} XP${out.levelUp ? ` · Level ${out.level.level}!` : ''}`;
  $('[data-res-badges]').replaceChildren(...out.newBadges.map((bid) => {
    const li = document.createElement('li');
    li.className = 'pill pill--primary';
    li.textContent = `New badge: ${badges.find((b) => b.id === bid)?.title || bid}`;
    return li;
  }));
  resultsOverlay.hidden = false;
  $('[data-results-card]').focus();
  if (out.newBest && out.previousBest > 0) { confetti({ pieces: 90 }); play('levelUp'); }
  else if (out.newBadges.length) play('badge');
  else play('success');
  $('[data-best-line]').textContent = `Your best score: ${best()}`;
}

form.addEventListener('submit', (e) => { e.preventDefault(); start(); });
$('[data-again]').addEventListener('click', () => { resultsOverlay.hidden = true; startOverlay.hidden = false; $('[data-play]').focus(); });
window.addEventListener('pagehide', () => controller?.stop());
$('[data-play]').focus();
