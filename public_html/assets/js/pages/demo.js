/**
 * Typing playground (/demo): wires TypingEngine + Keyboard + Hands to the controls.
 */
import { TypingEngine } from '../engine/typing-engine.js';
import { Keyboard } from '../engine/keyboard.js';
import { Hands } from '../engine/hands.js';
import { connectVisuals } from '../engine/visuals.js';
import { loadLayout, detectLayout } from '../engine/layouts.js';
import { formatTime } from '../engine/stats.js';
import { load, update } from '../core/store.js';

const TEXTS = {
  home: 'asdf jkl; fdsa ;lkj fj dk sl a; jf kd ls ;a fjf jfj dkd kdk sls lsl a;a ;a;',
  words: 'a sad lad asks dad; all lads fall; a lass asks a lad; dad adds a salad; flask; glass',
  sentence: 'Keep your eyes on the screen and let your fingers find their way home. Small steps every day add up to big progress.',
  symbols: 'Pip said, "Rest on F and J!" Then Sam typed: 3 quick notes (and 5% off) - easy?',
};
const ORDER = ['home', 'words', 'sentence', 'symbols'];

const $ = (sel) => document.querySelector(sel);
const form = $('[data-demo-controls]');
const els = {
  typing: $('[data-typing]'),
  keyboard: $('[data-keyboard]'),
  hands: $('[data-hands]'),
  caps: $('[data-caps]'),
  hint: $('[data-hint]'),
  results: $('[data-results]'),
  custom: $('[data-custom]'),
  stat: (k) => $(`[data-stat="${k}"]`),
};

/* ---- Settings (persisted in the guest store) ---- */
const saved = load().settings;
form.layout.value = saved.layout || detectLayout();
form.allowBackspace.checked = saved.allowBackspace !== false;
form.showKeyboard.checked = saved.showKeyboard !== false;
form.showHands.checked = saved.showHands !== false;

function persist() {
  update((s) => {
    s.settings.layout = form.layout.value;
    s.settings.allowBackspace = form.allowBackspace.checked;
    s.settings.showKeyboard = form.showKeyboard.checked;
    s.settings.showHands = form.showHands.checked;
  });
}

let customText = '';
function currentText() {
  return form.text.value === 'custom' ? customText || TEXTS.sentence : TEXTS[form.text.value];
}

/* ---- Components ---- */
let layout = await loadLayout(form.layout.value);
const keyboard = new Keyboard(els.keyboard, layout);
const hands = new Hands(els.hands);
let engine = null;
let visuals = null;
let hintTimer = null;

function showHint(message) {
  els.hint.textContent = message;
  els.hint.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => (els.hint.hidden = true), 6000);
}

function setStats(s, timeText) {
  els.stat('wpm').textContent = String(s.wpm);
  els.stat('accuracy').textContent = `${Math.round(s.accuracy)}%`;
  els.stat('errors').textContent = String(s.errors);
  els.stat('time').textContent = timeText;
}

function timeDisplay() {
  const limit = Number(form.time.value);
  els.stat('time-label').textContent = limit ? 'Left' : 'Time';
  return limit ? formatTime(engine.remainingMs) : formatTime(engine.elapsedMs);
}

function start() {
  visuals?.disconnect();
  engine?.destroy();
  els.results.hidden = true;
  els.hint.hidden = true;

  const limit = Number(form.time.value);
  const text = currentText();
  engine = new TypingEngine(els.typing, {
    text,
    stopOnError: form.stopOnError.checked,
    allowBackspace: form.allowBackspace.checked,
    timeLimit: limit,
    getMoreText: limit ? () => ' ' + text : null,
    size: form.large.checked ? 'large' : 'normal',
  });
  visuals = connectVisuals(engine, { keyboard, hands, onHint: showHint });

  const refresh = () => setStats(engine.stats(), timeDisplay());
  engine.addEventListener('tick', refresh);
  engine.addEventListener('keystroke', refresh);
  engine.addEventListener('capslock', (e) => (els.caps.hidden = !e.detail.on));
  engine.addEventListener('complete', (e) => showResults(e.detail.results));
  setStats({ wpm: 0, accuracy: 100, errors: 0 }, limit ? formatTime(limit * 1000) : '0:00');
  els.stat('time-label').textContent = limit ? 'Left' : 'Time';
}

function message(r) {
  if (r.accuracy >= 98) return 'Superb accuracy – that’s the habit that builds real speed.';
  if (r.accuracy >= 92) return 'Lovely, steady typing. Keep your eyes on the screen and it’ll keep improving.';
  if (r.accuracy >= 80) return 'Good effort! Slow down a touch and aim for accuracy first – speed follows.';
  return 'Nice try! Rest your fingers on the home row and take it slowly – every go makes it easier.';
}

function showResults(r) {
  setStats(r, formatTime(r.elapsedMs));
  const set = (k, v) => (els.results.querySelector(`[data-r="${k}"]`).textContent = v);
  set('wpm', r.wpm);
  set('accuracy', Math.round(r.accuracy));
  set('rawWpm', r.rawWpm);
  set('time', formatTime(r.elapsedMs));
  els.results.querySelector('[data-results-title]').textContent = r.accuracy >= 92 ? 'Well done!' : 'Good going!';
  els.results.querySelector('[data-results-message]').textContent = message(r);

  const list = els.results.querySelector('[data-problem]');
  list.replaceChildren(...r.problemKeys.map((k) => {
    const li = document.createElement('li');
    const info = keyboard.info(k.char);
    li.className = `pill pill--warning`;
    const cap = document.createElement('span');
    cap.className = `keycap${info ? ` keycap--${info.finger}` : ''}`;
    cap.textContent = k.char;
    li.append(cap, ` ${Math.round(k.errorRate * 100)}% missed`);
    return li;
  }));
  els.results.querySelector('[data-problem-wrap]').hidden = r.problemKeys.length === 0;
  keyboard.setHeat(Object.fromEntries(r.problemKeys.map((k) => [k.char, k.errorRate])));
  els.results.hidden = false;
  els.results.focus({ preventScroll: true });
  els.results.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function applyVisibility() {
  els.keyboard.hidden = !form.showKeyboard.checked;
  els.hands.hidden = !form.showHands.checked;
}

/* ---- Events ---- */
form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('change', async (e) => {
  const name = e.target.name;
  if (name === 'custom') return;
  if (name === 'layout') {
    layout = await loadLayout(form.layout.value);
    keyboard.setLayout(layout);
    visuals?.refresh();
  }
  if (name === 'text') {
    els.custom.hidden = form.text.value !== 'custom';
    if (form.text.value === 'custom') {
      form.custom.focus();
      return;
    }
  }
  persist();
  applyVisibility();
  if (['text', 'time', 'stopOnError', 'allowBackspace', 'large'].includes(name)) start();
  else engine?.focus();
});
$('[data-use-custom]').addEventListener('click', () => {
  customText = form.custom.value.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!customText) return form.custom.focus();
  start();
});
$('[data-restart]').addEventListener('click', () => start());
$('[data-retry]').addEventListener('click', () => { keyboard.setHeat({}); start(); });
$('[data-next-text]').addEventListener('click', () => {
  keyboard.setHeat({});
  const i = ORDER.indexOf(form.text.value);
  form.text.value = ORDER[(i + 1) % ORDER.length];
  els.custom.hidden = true;
  start();
});

applyVisibility();
start();
