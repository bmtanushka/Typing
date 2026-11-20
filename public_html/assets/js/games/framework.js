/**
 * Shared game framework: canvas sizing, 60 fps loop, input, pause, HUD, overlays and scoring.
 *
 * A game module exports `createGame(ctx)` returning:
 *   { update(dt), draw(g), onKey(ch) -> 'hit' | 'miss' | 'ignore', score, lives, level, over, summary() }
 * `dt` is in seconds (capped so a slow frame never teleports things).
 * ctx: { width, height, keys, words, letters, difficulty, colours, rng, play, reducedMotion, announce }
 */
import { createRng, filterWords } from '../engine/generators.js';
import { play } from '../core/sound.js';

export const DIFFICULTY = {
  gentle: { label: 'Gentle', speed: 0.7, spawn: 0.7, lives: 7 },
  normal: { label: 'Normal', speed: 1, spawn: 1, lives: 5 },
  speedy: { label: 'Speedy', speed: 1.35, spawn: 1.3, lives: 3 },
};

/** Theme colours read from CSS custom properties (so dark mode works). */
export function themeColours() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return {
    bg: v('--surface'), bg2: v('--surface-2'), text: v('--text'), muted: v('--text-muted'), border: v('--border'),
    primary: v('--primary'), primarySoft: v('--primary-soft'), accent: v('--accent'), star: v('--star'),
    success: v('--success'), danger: v('--danger'), info: v('--info'), onPrimary: v('--on-primary'),
    fingers: ['--f-lp', '--f-lr', '--f-lm', '--f-li', '--f-ri', '--f-rm', '--f-rr', '--f-rp'].map(v),
    fingerText: v('--f-text'), // readable on finger colours in both themes
    finger: Object.fromEntries(['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'th'].map((f) => [f, { fill: v(`--f-${f}`), edge: v(`--f-${f}-edge`) }])),
    dark: document.documentElement.dataset.theme === 'dark',
  };
}

/** Touch-typing finger for each letter (identical on UK and US QWERTY). */
const FINGER_ROWS = { lp: 'qaz', lr: 'wsx', lm: 'edc', li: 'rfvtgb', ri: 'yhnujm', rm: 'ik,', rr: 'ol.', rp: 'p;/' };
const FINGER_OF = Object.fromEntries(Object.entries(FINGER_ROWS).flatMap(([f, keys]) => [...keys].map((k) => [k, f])));

/** { fill, edge } colours of the finger that types `ch` – games colour items by finger. */
export function fingerColour(colours, ch) {
  return colours.finger[FINGER_OF[String(ch).toLowerCase()] || 'th'];
}

/** Words usable in a game: only learnt keys, 2–8 letters. */
export function gameWords(wordlist, keys, { min = 2, max = 8 } = {}) {
  const list = filterWords(wordlist, keys).filter((w) => w.length >= min && w.length <= max);
  return list.length >= 6 ? list : filterWords(wordlist, new Set('asdfghjkl')).filter((w) => w.length >= 2);
}

export const roundRect = (g, x, y, w, h, r) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

/** Draw a word with the typed part highlighted. */
export function drawWord(g, word, typed, x, y, { size = 22, colours, active = false } = {}) {
  g.font = `800 ${size}px "JetBrains Mono", ui-monospace, monospace`;
  g.textBaseline = 'middle';
  const w = g.measureText(word).width;
  const pad = size * 0.45;
  g.fillStyle = active ? colours.primarySoft : colours.bg;
  g.strokeStyle = active ? colours.primary : colours.border;
  g.lineWidth = active ? 3 : 2;
  roundRect(g, x - w / 2 - pad, y - size * 0.75, w + pad * 2, size * 1.5, size * 0.5);
  g.fill();
  g.stroke();
  let cx = x - w / 2;
  for (let i = 0; i < word.length; i++) {
    g.fillStyle = i < typed ? colours.success : colours.text;
    g.textAlign = 'left';
    g.fillText(word[i], cx, y + 1);
    cx += g.measureText(word[i]).width;
  }
  return w + pad * 2;
}

/** Small particle bursts for pops and explosions (skipped with reduced motion). */
export class Particles {
  constructor(reducedMotion) {
    this.list = [];
    this.off = reducedMotion;
  }

  burst(x, y, colour, n = 14, speed = 160) {
    if (this.off) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6 + Math.random() * 0.3, colour });
    }
  }

  update(dt) {
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
  }

  draw(g) {
    for (const p of this.list) {
      g.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
      g.fillStyle = p.colour;
      g.beginPath();
      g.arc(p.x, p.y, 4, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
}

/**
 * Run one game in `root` (markup: app/Views/pages/game.php). Returns a controller.
 * onFinish(summary) is called when a round ends.
 */
export function runGame(root, createGame, { keys, wordlist, difficulty = 'normal', onFinish }) {
  const canvas = root.querySelector('[data-canvas]');
  const g = canvas.getContext('2d');
  const hud = {
    score: root.querySelector('[data-hud="score"]'),
    lives: root.querySelector('[data-hud="lives"]'),
    level: root.querySelector('[data-hud="level"]'),
  };
  const live = root.querySelector('[data-game-live]');
  const pauseOverlay = root.querySelector('[data-pause]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  const resize = () => {
    const box = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = Math.round(box.width);
    height = Math.round(Math.min(560, Math.max(340, box.width * 0.6)));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (game) Object.assign(game.ctx, { width, height });
  };

  let game = null;
  resize();
  const ctx = {
    width, height, keys,
    letters: [...keys].filter((c) => /[a-z;,./]/.test(c)),
    words: gameWords(wordlist, keys),
    difficulty: DIFFICULTY[difficulty] || DIFFICULTY.normal,
    colours: themeColours(),
    rng: createRng(),
    play,
    reducedMotion,
    announce: (msg) => { live.textContent = msg; },
  };
  game = createGame(ctx);
  game.ctx = ctx;
  root.kqGame = game; // read-only handle for automated browser tests (game.peek())

  const stats = { hits: 0, misses: 0, startedAt: performance.now(), activeMs: 0 };
  let paused = false;
  let running = true;
  let last = performance.now();
  let lastHud = '';

  const setPaused = (p) => {
    if (!running || paused === p) return;
    paused = p;
    pauseOverlay.hidden = !p;
    if (!p) last = performance.now();
    if (p) pauseOverlay.querySelector('button')?.focus();
    else canvas.focus({ preventScroll: true });
  };

  const onKey = (e) => {
    if (!running) return;
    if (e.key === 'Escape') { e.preventDefault(); setPaused(!paused); return; }
    if (paused || e.ctrlKey || e.metaKey || (e.altKey && !e.getModifierState?.('AltGraph'))) return;
    if (e.key.length !== 1) return;
    e.preventDefault();
    const r = game.onKey(e.key);
    if (r === 'hit') { stats.hits++; play('key'); }
    else if (r === 'miss') { stats.misses++; play('error'); }
  };
  const onBlur = () => setPaused(true);
  const onVis = () => { if (document.hidden) setPaused(true); };

  window.addEventListener('keydown', onKey);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', resize);
  pauseOverlay.querySelector('[data-resume]')?.addEventListener('click', () => setPaused(false));

  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!paused) {
      stats.activeMs += dt * 1000;
      game.update(dt);
    }
    g.clearRect(0, 0, width, height);
    game.draw(g);
    const h = `${game.score}|${game.lives}|${game.level}`;
    if (h !== lastHud) {
      lastHud = h;
      hud.score.textContent = String(game.score);
      hud.lives.textContent = game.lives == null ? '–' : '♥'.repeat(Math.max(0, game.lives)) || '0';
      hud.lives.setAttribute('aria-label', `${game.lives ?? 0} lives`);
      hud.level.textContent = String(game.level ?? 1);
    }
    if (game.over) return finish();
    requestAnimationFrame(frame);
  };

  const cleanup = () => {
    running = false;
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', resize);
  };

  const finish = () => {
    cleanup();
    const total = stats.hits + stats.misses;
    const minutes = stats.activeMs / 60000;
    const summary = {
      score: game.score,
      accuracy: total ? Math.round((stats.hits / total) * 1000) / 10 : 100,
      hits: stats.hits,
      misses: stats.misses,
      durationMs: Math.round(stats.activeMs),
      wpm: minutes > 0 ? Math.round(stats.hits / 5 / minutes) : 0,
      ...(game.summary?.() || {}),
    };
    onFinish?.(summary);
  };

  canvas.focus({ preventScroll: true });
  requestAnimationFrame(frame);
  return { stop: () => cleanup(), pause: () => setPaused(true), get paused() { return paused; } };
}

/**
 * Word targeting shared by Balloon Pop and Space Defender: the first letter typed locks onto
 * a matching word (the most urgent one), then the rest of that word must be typed.
 * items: [{ word, typed, urgency }]; returns { result, item, done }.
 */
export function typeAtTargets(items, ch, current) {
  let target = current && items.includes(current) ? current : null;
  if (!target) {
    const options = items.filter((it) => it.word[0] === ch).sort((a, b) => b.urgency - a.urgency);
    if (!options.length) return { result: 'miss', item: null, done: false };
    target = options[0];
    target.typed = 1;
    return { result: 'hit', item: target, done: target.typed >= target.word.length };
  }
  if (target.word[target.typed] === ch) {
    target.typed++;
    return { result: 'hit', item: target, done: target.typed >= target.word.length };
  }
  return { result: 'miss', item: target, done: false };
}

/** Word picker that avoids repeating the same word or first letter on screen. */
export function pickWord(words, onScreen, rng) {
  const used = new Set(onScreen.map((w) => w[0]));
  for (let i = 0; i < 20; i++) {
    const w = words[Math.floor(rng() * words.length)];
    if (!used.has(w[0])) return w;
  }
  return words[Math.floor(rng() * words.length)];
}
