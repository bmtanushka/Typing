/**
 * Lesson player: intro → steps (info / keys / drill / words / challenge) → results.
 * Lesson JSON is embedded in the page; the course index, layout and word list are fetched.
 */
import { TypingEngine } from '../engine/typing-engine.js';
import { Keyboard } from '../engine/keyboard.js';
import { Hands } from '../engine/hands.js';
import { connectVisuals } from '../engine/visuals.js';
import { loadLayout, detectLayout, fingersFor, FINGER_NAMES } from '../engine/layouts.js';
import { createRng, pick, keyRepeats, patternDrill, wordDrill, weightedDrill } from '../engine/generators.js';
import { formatTime, mergeKeyStats } from '../engine/stats.js';
import { allowedKeys, combineResults, computeStars, lessonAfter, lessonState, blockingLesson, DEFAULT_PASS } from '../core/lesson-logic.js';
import { recordLesson, recordPractice, levelInfo } from '../core/rewards.js';
import { resultMessages } from '../core/mascot.js';
import { play, connectSound } from '../core/sound.js';
import { confetti } from '../core/confetti.js';
import { icon } from '../core/icons.js';
import { load, update } from '../core/store.js';
import { track, makeEvent } from '../core/sync.js';
import { ART } from '../core/art.js';

const lesson = JSON.parse(document.getElementById('lesson-data').textContent);
const base = document.documentElement.dataset.base || '';
const $ = (s, root = document) => root.querySelector(s);
const stage = $('[data-stage]');
const guides = $('[data-guides]');
const stepsEl = $('[data-steps]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- tiny DOM helper: h('p', {class: 'x'}, 'text', child) ---- */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}
const keyLabel = (k) => (k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k);

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

/* ---- Load everything ---- */
const settings = load().settings;
let index, layout, wordlist, badgeDefs;
try {
  [index, layout, wordlist, badgeDefs] = await Promise.all([
    fetchJson(`${base}/api/lessons`),
    loadLayout(settings.layout || detectLayout()),
    fetchJson(`${base}/api/wordlists/en-common`),
    fetchJson(`${base}/api/badges`).then((d) => d.badges),
  ]);
} catch (e) {
  stage.replaceChildren(h('div', { class: 'alert alert--danger', role: 'alert' },
    'Sorry – this lesson could not load. Check your connection and refresh the page.'));
  throw e;
}

const allowed = allowedKeys(index, lesson.id);
const keyboard = new Keyboard($('[data-keyboard]'), layout);
const hands = new Hands($('[data-hands]'));
const rng = createRng();
const steps = lesson.steps;
const pass = { ...DEFAULT_PASS, ...(lesson.passCriteria || {}) };

let engine = null;
let visuals = null;
let unsound = null;
let stepResults = [];
let screenKeyHandler = null;
let demoTimer = null;

/* ---- Step indicator ---- */
const stepItems = [...steps.map((s) => s.title), 'Results'].map((title, i) =>
  h('li', { class: 'player__step', title }, h('span', { class: 'visually-hidden' }, `Step ${i + 1}: ${title}`)));
stepsEl.replaceChildren(...stepItems);
function markStep(i) {
  stepItems.forEach((li, j) => {
    li.classList.toggle('is-done', j < i);
    li.classList.toggle('is-current', j === i);
    if (j === i) li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
  });
}

/* ---- Screen plumbing ---- */
function cleanup() {
  document.querySelector('[data-player]').classList.remove('is-results');
  visuals?.disconnect();
  unsound?.();
  unsound = null;
  engine?.destroy();
  engine = null;
  visuals = null;
  clearInterval(demoTimer);
  hands.el.classList.remove('is-demo');
  keyboard.el.classList.remove('is-faded');
  keyboard.clearMarks();
  keyboard.setHeat({});
  if (screenKeyHandler) document.removeEventListener('keydown', screenKeyHandler);
  screenKeyHandler = null;
}

function onScreenKeys(handler) {
  // Keys pressed on a focused control belong to that control (Enter clicks a button).
  const fn = (e) => { if (!e.target.closest?.('a, button, input, select, textarea')) handler(e); };
  screenKeyHandler = fn;
  // Defer so the key that triggered this screen doesn't also act on it.
  setTimeout(() => screenKeyHandler === fn && document.addEventListener('keydown', fn), 0);
}

function showScreen(...children) {
  stage.replaceChildren(h('section', { class: 'screen' }, ...children));
  if (!reduceMotion) stage.firstChild.classList.add('screen--enter');
}

function setGuides({ keyboard: showKb = true, hands: showHands = true } = {}) {
  keyboard.el.hidden = !showKb;
  hands.el.hidden = !showHands;
  guides.hidden = !showKb && !showHands;
}

function focusFirst(sel) {
  const el = stage.querySelector(sel);
  if (el) el.focus({ preventScroll: true });
}

/* ---- Intro ---- */
function intro() {
  cleanup();
  markStep(-1);
  const keys = lesson.newKeys || [];
  const infos = keys.map((k) => ({ k, info: keyboard.info(k) }));

  const keyCards = keys.length
    ? h('div', { class: 'intro__keys' }, infos.map(({ k, info }) =>
        h('div', { class: 'intro__key' },
          h('span', { class: `keycap keycap--xl${info ? ` keycap--${info.finger}` : ''}${'fj'.includes(k) ? ' keycap--bump' : ''}` }, keyLabel(k)),
          h('span', { class: 'intro__finger' }, info ? capitalise(FINGER_NAMES[info.finger]) : ''))))
    : null;

  showScreen(
    h('div', { class: 'intro' },
      keyCards,
      h('div', { class: 'intro__copy' },
        h('p', { class: 'eyebrow' }, keys.length ? 'New keys' : lesson.type === 'checkpoint' ? 'Checkpoint' : 'Getting started'),
        h('h2', { class: 'intro__title', tabindex: '-1' }, lesson.title),
        h('p', { class: 'lead' }, lesson.intro?.text || ''),
        lesson.intro?.tip ? h('div', { class: 'tip' }, h('span', { class: 'tip__icon', 'aria-hidden': 'true' }, '💡'), h('p', {}, lesson.intro.tip)) : null,
        h('p', { class: 'small text-muted' }, `${steps.length} short steps · about ${lesson.estimatedMinutes} minutes`),
        h('div', { class: 'intro__actions' },
          h('button', { class: 'btn btn--primary btn--lg', type: 'button', 'data-start': true, onclick: () => runStep(0) }, 'Start lesson'),
          h('span', { class: 'small text-muted' }, 'or press ', h('kbd', {}, 'Enter'))))));

  if (keys.length) {
    setGuides({ keyboard: true, hands: true });
    hands.setActive(infos.flatMap(({ info }) => (info ? [info.finger] : [])));
    hands.el.classList.add('is-demo');
    keyboard.highlightKeys(keys);
    // Animated demo: "press" each new key in turn.
    let i = 0;
    if (!reduceMotion) {
      demoTimer = setInterval(() => {
        const k = keys[i++ % keys.length];
        keyboard.flash(k, true);
        hands.setActive(fingersFor(keyboard.info(k)));
      }, 1100);
    }
  } else {
    setGuides({ keyboard: false, hands: false });
  }
  focusFirst('[data-start]');
  onScreenKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      runStep(0);
    }
  });
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---- Steps ---- */
function stepHeader(i, step) {
  return h('header', { class: 'step-head' },
    h('p', { class: 'eyebrow' }, `Step ${i + 1} of ${steps.length}`),
    h('h2', { class: 'step-head__title', tabindex: '-1' }, step.title),
    step.instructions ? h('p', { class: 'text-muted step-head__text' }, step.instructions) : null);
}

function runStep(i) {
  cleanup();
  if (i >= steps.length) return finish();
  markStep(i);
  const step = steps[i];
  if (step.type === 'info') return infoStep(i, step);
  return typingStep(i, step, { text: textFor(step), onDone: (res) => afterStep(i, res) });
}

function textFor(step) {
  if (step.text) return Array.isArray(step.text) ? pick(step.text, rng) : step.text;
  const pool = [...allowed].filter((c) => c !== ' ');
  const focus = step.focus || (lesson.newKeys?.length ? lesson.newKeys : pool);
  switch (step.type) {
    case 'keys': return keyRepeats(step.keys || lesson.newKeys, { rounds: step.rounds ?? 3, groupSize: step.groupSize ?? 3 });
    case 'words': return wordDrill(wordlist.words, allowed, focus, { count: step.count ?? 12, r: rng });
    default: return patternDrill(focus, pool, { length: step.length ?? 48, r: rng });
  }
}

function infoStep(i, step) {
  const body = (Array.isArray(step.body) ? step.body : [step.body || '']).map((p) => h('p', {}, p));
  const waitFor = step.waitFor || [];
  const remaining = new Set(waitFor);
  const checklist = waitFor.length
    ? h('ul', { class: 'checklist', 'aria-label': 'Keys to press' }, waitFor.map((k) => {
        const info = keyboard.info(k);
        return h('li', { 'data-k': k }, h('span', { class: `keycap keycap--lg${info ? ` keycap--${info.finger}` : ''}` }, keyLabel(k)),
          h('span', { class: 'visually-hidden', 'data-k-state': true }, ' not pressed yet'));
      }))
    : null;
  const next = () => runStep(i + 1);
  const continueBtn = h('button', { class: 'btn btn--primary btn--lg', type: 'button', 'data-continue': true, onclick: next }, 'Continue');

  showScreen(stepHeader(i, step),
    h('div', { class: `info${step.art && ART[step.art] ? '' : ' info--no-art'}` },
      step.art && ART[step.art] ? h('div', { class: 'info__art' }) : null,
      h('div', { class: 'info__body' }, body, checklist,
        h('div', { class: 'info__actions' }, continueBtn,
          h('span', { class: 'small text-muted' }, waitFor.length ? 'Press the keys above to continue' : 'or press the space bar')))));
  if (step.art && ART[step.art]) stage.querySelector('.info__art').innerHTML = ART[step.art]; // static, trusted markup

  const highlight = step.highlight || waitFor;
  if (highlight.length || step.art === 'hands') {
    setGuides({ keyboard: true, hands: true });
    const infos = keyboard.highlightKeys(highlight);
    hands.setActive([...new Set(infos.map((x) => x.finger))]);
  } else {
    setGuides({ keyboard: false, hands: false });
  }

  if (waitFor.length) {
    continueBtn.hidden = true;
    onScreenKeys((e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : null;
      if (!k || !remaining.has(k)) return;
      e.preventDefault();
      remaining.delete(k);
      keyboard.markDone(k);
      keyboard.flash(k, true);
      const li = stage.querySelector(`[data-k="${CSS.escape(k)}"]`);
      li?.classList.add('is-done');
      if (li) li.querySelector('[data-k-state]').textContent = ' pressed';
      if (remaining.size === 0) {
        continueBtn.hidden = false;
        continueBtn.textContent = 'Great – continue';
        continueBtn.focus();
        onScreenKeys((ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); next(); } });
      }
    });
    focusFirst('.step-head__title');
  } else {
    continueBtn.focus({ preventScroll: true });
    onScreenKeys((e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); } });
  }
}

function typingStep(i, step, { text, onDone, title = null }) {
  const hints = step.hints || 'show';
  const isKeys = step.type === 'keys';
  const typingEl = h('div', { class: 'player__typing' });
  const hintEl = h('div', { class: 'speech speech--hint', role: 'status', hidden: true });
  const capsEl = h('p', { class: 'alert alert--warning', role: 'status', hidden: true }, 'Caps Lock is on – turn it off to type lower-case letters.');

  showScreen(title || stepHeader(i, step), typingEl, h('div', { class: 'player__notices' }, capsEl, hintEl));

  const showKb = isKeys || (hints !== 'none' && settings.showKeyboard !== false);
  const showHands = isKeys || (hints === 'show' && settings.showHands !== false);
  setGuides({ keyboard: showKb, hands: showHands });
  keyboard.el.classList.toggle('is-faded', hints === 'fade');

  engine = new TypingEngine(typingEl, {
    text,
    stopOnError: isKeys || !!step.stopOnError,
    allowBackspace: settings.allowBackspace !== false,
    size: isKeys ? 'large' : 'normal',
  });
  let hintTimer;
  visuals = connectVisuals(engine, {
    keyboard: showKb ? keyboard : null,
    hands: showHands ? hands : null,
    onHint: (msg) => {
      hintEl.textContent = msg;
      hintEl.hidden = false;
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => (hintEl.hidden = true), 6000);
    },
  });
  if (!showKb) {
    // Hints off: still offer finger help after repeated misses.
    engine.addEventListener('hint', (e) => {
      hintEl.textContent = `Look for “${e.detail.char === ' ' ? 'space' : e.detail.char}” – your fingers know the way.`;
      hintEl.hidden = false;
    });
  }
  unsound = connectSound(engine);
  engine.addEventListener('capslock', (e) => (capsEl.hidden = !e.detail.on));
  engine.addEventListener('complete', (e) => onDone({ ...e.detail.results, scored: !isKeys }));
}

const PRAISE = [
  [98, ['Spot on!', 'Flawless fingers!', 'Superb accuracy!']],
  [92, ['Lovely work!', 'Nice and steady!', 'Great going!']],
  [80, ['Good effort!', 'Keep it up!', 'Getting there!']],
  [0, ['Nice try!', 'Every go helps!', 'Keep practising!']],
];
const praiseFor = (acc) => pick(PRAISE.find(([min]) => acc >= min)[1], rng);

function afterStep(i, res) {
  stepResults.push(res);
  if (i + 1 >= steps.length) return finish();
  play('step');
  const next = () => runStep(i + 1);
  const btn = h('button', { class: 'btn btn--primary', type: 'button', onclick: next }, 'Continue');
  stage.querySelector('.screen').append(
    h('div', { class: 'between card', role: 'status' },
      h('p', { class: 'between__praise' }, praiseFor(res.accuracy)),
      h('p', { class: 'text-muted' }, `${Math.round(res.accuracy)}% accuracy${res.scored ? ` · ${res.wpm} WPM` : ''}`),
      btn, h('span', { class: 'small text-muted' }, 'or press ', h('kbd', {}, 'Enter'))));
  btn.focus({ preventScroll: true });
  btn.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  onScreenKeys((e) => { if (e.key === 'Enter') { e.preventDefault(); next(); } });
}

/* ---- Results ---- */
const TITLES = { 3: ['Brilliant!', 'Superstar!', 'Perfect!'], 2: ['Great work!', 'Well done!', 'Smashing!'], 1: ['Lesson complete!', 'You did it!', 'Nice one!'], 0: ['So close!', 'Nearly there!', 'Good try!'] };

function message(stars, result) {
  if (lesson.type === 'tutorial') return 'You’re all set. Keep your fingers on the home row and your eyes on the screen.';
  if (stars === 0) return `You need ${pass.minAccuracy}% accuracy to pass – you got ${Math.round(result.accuracy)}%. Slow down a little and try again; you’re nearly there.`;
  if (stars === 3) return 'Accurate and quick – your fingers are learning fast.';
  if (stars === 2) return `Lovely accuracy. Aim for ${lesson.stars?.three?.accuracy ?? 97}%${lesson.stars?.three?.wpm ? ` at ${lesson.stars.three.wpm} WPM` : ''} to earn all three stars.`;
  return 'You passed! A little more accuracy will earn you another star.';
}

let lastResults = null;

function finish() {
  cleanup();
  const result = stepResults.length ? combineResults(stepResults)
    : { wpm: 0, rawWpm: 0, accuracy: 100, errors: 0, keystrokes: 0, elapsedMs: 0, keyStats: {}, problemKeys: [] };
  const stars = computeStars(result, lesson);
  const previous = load().progress[lesson.id]?.stars || 0;
  let summary;
  const skippedBefore = new Set(Object.keys(load().skipped || {}));
  update((s) => { summary = recordLesson(s, { lesson, index, result, stars, badges: badgeDefs }); });
  const newlySkipped = Object.keys(load().skipped || {}).filter((id) => !skippedBefore.has(id));
  track(makeEvent('lesson', lesson.id, result, { stars, xp: summary.xpGained, badges: summary.newBadges, skipped: newlySkipped }));
  document.dispatchEvent(new CustomEvent('kq:progress'));
  lastResults = { result, stars, previous, summary, fresh: true };
  renderResults();
}

function renderResults() {
  cleanup();
  markStep(steps.length);
  const { result, stars, previous, summary, fresh } = lastResults;
  lastResults.fresh = false;
  const next = lessonAfter(index, lesson.id);
  const isTutorial = lesson.type === 'tutorial';

  const starRow = h('div', { class: 'result-stars', role: 'img', 'aria-label': `${stars} of 3 stars` },
    [1, 2, 3].map((n) => h('span', { class: `result-star${n <= stars ? ' is-on' : ''} result-star--${n}`, 'aria-hidden': 'true' }, '★')));

  const stat = (label, value, unit = '') =>
    h('div', { class: 'stat' }, h('p', { class: 'stat__label' }, label), h('p', { class: 'stat__value' }, String(value), unit ? h('span', {}, unit) : null));

  const problem = result.problemKeys || [];
  const problemList = problem.length
    ? h('div', { class: 'results__problem' },
        h('h3', {}, 'Keys to keep an eye on'),
        h('ul', { class: 'cluster' }, problem.map((k) => {
          const info = keyboard.info(k.char);
          return h('li', { class: 'pill pill--warning' },
            h('span', { class: `keycap${info ? ` keycap--${info.finger}` : ''}` }, keyLabel(k.char)),
            ` ${Math.round(k.errorRate * 100)}% missed`);
        })))
    : null;

  const passed = stars > 0;
  const nextBtn = next && passed
    ? h('a', { class: 'btn btn--primary btn--lg', href: `${base}/lessons/${next.id}`, 'data-next': true }, `Next: ${next.title}`)
    : null;
  const retryBtn = h('button', { class: `btn ${passed ? 'btn--secondary' : 'btn--primary btn--lg'}`, type: 'button', 'data-retry': true, onclick: retry }, 'Try again');
  const practiseBtn = problem.length
    ? h('button', { class: 'btn btn--secondary', type: 'button', onclick: () => practise(problem) }, 'Practise problem keys')
    : null;

  showScreen(
    h('div', { class: `results${passed ? ' results--passed' : ''}` },
      h('div', { class: 'results__head' },
        h('div', { class: 'results__mascot', 'aria-hidden': 'true' }),
        h('div', {},
          h('h2', { class: 'results__title', tabindex: '-1' }, pick(TITLES[stars], rng)),
          isTutorial ? null : starRow,
          stars === 0 && !isTutorial ? h('p', { class: 'lead results__message' }, message(stars, result)) : null,
          h('div', { class: 'speech speech--left results__pip' },
            resultMessages({
              stars, accuracy: result.accuracy, wpm: result.wpm, previous: summary.previous,
              streak: summary.streak, streakGrew: summary.streakGrew, levelUp: summary.levelUp,
              level: summary.level.level, unitCompleted: summary.unitCompleted, tutorial: isTutorial,
            }, rng).map((m) => h('p', {}, m))),
          passed && stars > previous && previous > 0 ? h('p', { class: 'pill pill--success' }, 'New best!') : null)),
      isTutorial && !result.keystrokes ? null : h('div', { class: 'results__stats' },
        stat('Speed', result.wpm, ' WPM'),
        stat('Accuracy', Math.round(result.accuracy), '%'),
        stat('Time', formatTime(result.elapsedMs)),
        stat('Errors', result.errors)),
      problemList,
      rewardsPanel(summary),
      h('div', { class: 'results__actions' }, nextBtn, retryBtn, practiseBtn,
        h('a', { class: 'btn btn--ghost', href: `${base}/lessons` }, 'Back to lessons'))));

  // Mascot (cheer when passed) – reuse the SVG from the page header? Build a simple one.
  stage.querySelector('.results__mascot').append(mascot(passed ? 'cheer' : 'happy'));

  if (problem.length) {
    setGuides({ keyboard: true, hands: false });
    keyboard.setNext(null);
    keyboard.setHeat(Object.fromEntries(problem.map((k) => [k.char, k.errorRate])));
  } else {
    setGuides({ keyboard: false, hands: false });
  }
  focusFirst('.results__title');
  document.querySelector('[data-player]').classList.add('is-results');
  if (fresh) celebrate(summary, stars);
  onScreenKeys((e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (nextBtn) location.href = nextBtn.href;
    else retry();
  });
}

/** XP, level, streak and new badges for the results screen. */
function rewardsPanel(summary) {
  const { level } = summary;
  const pct = Math.round((level.into / level.needed) * 100);
  const bar = h('div', { class: 'progress progress--xp', role: 'progressbar', 'aria-label': `Level ${level.level} progress`, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) },
    h('span', { class: 'progress__bar' }));
  requestAnimationFrame(() => requestAnimationFrame(() => (bar.firstChild.style.width = `${pct}%`)));
  const iconEl = (name, cls = '') => { const span = h('span', { class: `rewards__icon ${cls}`, 'aria-hidden': 'true' }); span.innerHTML = icon(name, { size: 20 }); return span; };

  const badges = summary.newBadges.map((id) => badgeDefs.find((b) => b.id === id)).filter(Boolean);
  return h('div', { class: 'rewards' },
    h('div', { class: 'rewards__row' },
      h('span', { class: 'rewards__xp' }, `+${summary.xpGained} XP`),
      h('div', { class: 'rewards__level' },
        h('span', { class: 'rewards__level-label' }, iconEl('star', 'rewards__icon--star'), summary.levelUp ? `Level up! Level ${level.level}` : `Level ${level.level}`),
        bar,
        h('span', { class: 'small text-muted' }, `${level.into} / ${level.needed} XP`)),
      summary.streak > 0 ? h('span', { class: `rewards__streak${summary.streakGrew ? ' is-new' : ''}` }, iconEl('flame', 'rewards__icon--flame'), `${summary.streak}-day streak`) : null),
    badges.length ? h('div', { class: 'rewards__badges' },
      h('h3', {}, badges.length === 1 ? 'New badge!' : `${badges.length} new badges!`),
      h('ul', { class: 'rewards__badge-list' }, badges.map((b) => {
        const medal = h('span', { class: `badge-card__medal badge-card--${b.colour || 'primary'}`, 'aria-hidden': 'true' });
        medal.innerHTML = icon(b.icon, { size: 28 });
        return h('li', { class: `rewards__badge badge-card--${b.colour || 'primary'}` }, medal,
          h('div', {}, h('p', { class: 'rewards__badge-title' }, b.title), h('p', { class: 'small text-muted' }, b.description)));
      }))) : null);
}

function celebrate(summary, stars) {
  if (summary.unitCompleted) {
    confetti();
    play('levelUp');
  } else if (summary.levelUp) {
    confetti({ pieces: 70, duration: 1800 });
    play('levelUp');
  } else if (summary.newBadges.length) {
    play('badge');
  } else if (stars > 0) {
    play('success');
  }
}

function retry() {
  stepResults = [];
  runStep(0);
}

function practise(problem) {
  cleanup();
  const weights = Object.fromEntries(problem.map((k) => [k.char, k.errorRate]));
  const text = weightedDrill(weights, allowed, { length: 60, r: rng });
  const step = { type: 'drill', title: 'Practise your problem keys' };
  typingStep(0, step, {
    text,
    title: h('header', { class: 'step-head' },
      h('p', { class: 'eyebrow' }, 'Extra practice'),
      h('h2', { class: 'step-head__title', tabindex: '-1' }, step.title),
      h('p', { class: 'text-muted step-head__text' }, 'This drill focuses on the keys you found tricky.')),
    onDone: (res) => {
      let out;
      update((s) => {
        s.keyStats = mergeKeyStats(s.keyStats, res.keyStats);
        out = recordPractice(s, { result: res, ref: lesson.id, badges: badgeDefs, index });
      });
      track(makeEvent('practice', lesson.id, res, { xp: out.xpGained, badges: out.newBadges }));
      // Show what the practice earned on the results screen.
      lastResults.summary = { ...lastResults.summary, xpGained: out.xpGained, newBadges: out.newBadges,
        level: levelInfo(load().xp), levelUp: false, streak: out.streak, streakGrew: false };
      lastResults.fresh = out.newBadges.length > 0;
      renderResults();
    },
  });
}

/* Inline mascot (same artwork as partials/mascot.php, simplified moods). */
function mascot(mood) {
  const wrap = document.createElement('div');
  const eyes = mood === 'cheer'
    ? '<path d="M38 50q6-8 12 0M70 50q6-8 12 0" fill="none" stroke="#1e1b2e" stroke-width="4" stroke-linecap="round"/>'
    : '<circle cx="44" cy="48" r="7" fill="#1e1b2e"/><circle cx="76" cy="48" r="7" fill="#1e1b2e"/><circle cx="46.5" cy="45.5" r="2.4" fill="#fff"/><circle cx="78.5" cy="45.5" r="2.4" fill="#fff"/>';
  const arms = mood === 'cheer'
    ? '<path d="M18 64 6 40M102 64l12-24" class="m-dark-stroke" stroke-width="8" stroke-linecap="round"/>'
    : '<path d="M18 70 8 84M102 70l10 14" class="m-dark-stroke" stroke-width="8" stroke-linecap="round"/>';
  wrap.innerHTML = `<svg class="mascot mascot--${mood}" width="96" height="104" viewBox="0 0 120 130" aria-hidden="true">
    <ellipse cx="60" cy="123" rx="34" ry="5" fill="currentColor" opacity=".12"/>
    <rect x="36" y="108" width="16" height="12" rx="6" class="m-dark"/><rect x="68" y="108" width="16" height="12" rx="6" class="m-dark"/>
    ${arms}
    <rect x="14" y="22" width="92" height="90" rx="22" class="m-dark"/><rect x="14" y="16" width="92" height="84" rx="22" class="m-main"/>
    <rect x="24" y="22" width="72" height="62" rx="16" class="m-light"/><rect x="50" y="76" width="20" height="4" rx="2" class="m-main" opacity=".7"/>
    ${eyes}
    <circle cx="33" cy="60" r="5" class="m-accent" opacity=".45"/><circle cx="87" cy="60" r="5" class="m-accent" opacity=".45"/>
    <path d="M48 60q12 12 24 0" fill="${mood === 'cheer' ? '#1e1b2e' : 'none'}" stroke="#1e1b2e" stroke-width="4" stroke-linecap="round"/></svg>`;
  return wrap.firstChild;
}

/* ---- Locked lessons: explain and point the way ---- */
function lockedScreen() {
  const state = load();
  const blocker = blockingLesson(index, state, lesson.id);
  const unit = index.units.find((u) => u.id === lesson.unit);
  const checkpoint = unit?.lessons.find((l) => l.type === 'checkpoint' && l.id !== lesson.id);
  const canTestOut = checkpoint && lessonState(index, state, checkpoint.id) !== 'locked';
  setGuides({ keyboard: false, hands: false });
  const art = h('div', { class: 'locked__mascot', 'aria-hidden': 'true' });
  art.append(mascot('happy'));
  showScreen(h('div', { class: 'locked card' }, art,
    h('div', {},
      h('h2', { tabindex: '-1', class: 'locked__title' }, 'This lesson is still locked'),
      h('p', { class: 'lead' }, blocker ? `Finish “${blocker.title}” first – each lesson builds on the one before.` : 'Finish the earlier lessons to open this one.'),
      h('div', { class: 'cluster' },
        blocker ? h('a', { class: 'btn btn--primary', href: `${base}/lessons/${blocker.id}` }, `Go to ${blocker.title}`) : null,
        canTestOut ? h('a', { class: 'btn btn--secondary', href: `${base}/lessons/${checkpoint.id}` }, 'Test out with the checkpoint') : null,
        h('a', { class: 'btn btn--ghost', href: `${base}/lessons` }, 'See all lessons')))));
  focusFirst('.locked__title');
}

if (lessonState(index, load(), lesson.id) === 'locked') lockedScreen();
else intro();
