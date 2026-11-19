/**
 * TypingEngine – reusable typing surface used by lessons, tests and games.
 *
 *   const engine = new TypingEngine(container, {
 *     text: 'fff jjj fjf jfj',
 *     stopOnError: true,      // beginner mode: must press the right key
 *     allowBackspace: true,
 *     timeLimit: 0,           // seconds; 0 = finish at end of text
 *     getMoreText: null,      // () => string, for timed tests
 *     size: 'normal',         // 'normal' | 'large'
 *   });
 *   engine.addEventListener('complete', (e) => console.log(e.detail));
 *
 * Events (CustomEvent, detail in brackets):
 *   start, keystroke {typed, expected, correct, index, next}, error {typed, expected, index},
 *   hint {char, index}, tick {stats}, pause, resume, capslock {on}, complete {results}
 *
 * Input handling: a visually hidden <textarea> receives keys so dead keys, IME
 * composition and mobile keyboards work; ordinary keys are handled on keydown.
 */
import { TypingSession, CORRECT, ERROR, PENDING } from './session.js';
import { computeStats, problemKeys, formatTime } from './stats.js';

const SPACE_GLYPH = ' ';
const ENTER_GLYPH = '↵';

export class TypingEngine extends EventTarget {
  constructor(container, options = {}) {
    super();
    this.root = container;
    this.opts = {
      text: '',
      stopOnError: false,
      allowBackspace: true,
      timeLimit: 0,
      getMoreText: null,
      size: 'normal',
      autofocus: true,
      ...options,
    };
    this.#build();
    this.load(this.opts.text);
  }

  /* ---------------------------------------------------------------- setup */

  #build() {
    this.root.classList.add('typing');
    this.root.classList.toggle('typing--large', this.opts.size === 'large');
    this.root.innerHTML = '';

    this.viewport = document.createElement('div');
    this.viewport.className = 'typing__viewport';
    this.textEl = document.createElement('div');
    this.textEl.className = 'typing-text typing__text';
    this.caret = document.createElement('span');
    this.caret.className = 'typing__caret';
    this.caret.setAttribute('aria-hidden', 'true');
    this.textEl.setAttribute('aria-hidden', 'true');
    this.viewport.append(this.textEl);
    this.textEl.append(this.caret);

    this.input = document.createElement('textarea');
    this.input.className = 'typing__input';
    this.input.setAttribute('aria-label', 'Typing area. Type the text shown.');
    for (const [k, v] of Object.entries({ autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', rows: '1' })) {
      this.input.setAttribute(k, v);
    }

    // Screen-reader friendly description of what to type next.
    this.live = document.createElement('p');
    this.live.className = 'visually-hidden';
    this.live.id = `typing-live-${Math.random().toString(36).slice(2, 8)}`;
    this.live.setAttribute('aria-live', 'polite');
    this.input.setAttribute('aria-describedby', this.live.id);

    this.overlay = document.createElement('button');
    this.overlay.type = 'button';
    this.overlay.className = 'typing__overlay';
    this.overlay.innerHTML = '<span class="typing__overlay-inner"><span class="typing__overlay-icon" aria-hidden="true">⌨</span><span class="typing__overlay-text">Click here to start typing</span></span>';

    this.root.append(this.viewport, this.input, this.live, this.overlay);

    this.input.addEventListener('keydown', (e) => this.#onKeyDown(e));
    this.input.addEventListener('input', (e) => this.#onInput(e));
    this.input.addEventListener('compositionstart', () => { this.composing = true; });
    this.input.addEventListener('compositionend', (e) => this.#onCompositionEnd(e));
    this.input.addEventListener('focus', () => this.#onFocus());
    this.input.addEventListener('blur', () => this.#onBlur());
    this.overlay.addEventListener('click', () => this.focus());
    this.viewport.addEventListener('mousedown', (e) => { e.preventDefault(); this.focus(); });
    this._onResize = () => this.#positionCaret(false);
    window.addEventListener('resize', this._onResize);
  }

  /** Replace the text and reset everything (also used for Retry). */
  load(text = this.opts.text) {
    this.#stopTimer();
    this.opts.text = text;
    this.session = new TypingSession(text, {
      stopOnError: this.opts.stopOnError,
      allowBackspace: this.opts.allowBackspace,
    });
    this.started = false;
    this.completed = false;
    this.paused = false;
    this.startedAt = 0;
    this.pausedAt = 0;
    this.pausedTotal = 0;
    this.composing = false;
    this.results = null;
    this.root.classList.remove('is-complete', 'is-shake');

    this.textEl.querySelectorAll('.word, .typing__break').forEach((n) => n.remove());
    this.chars = [];
    this.#renderChars(text, 0);
    this.scrollY = 0;
    this.textEl.style.transform = '';
    this.#updateCurrent();
    this.#overlayText('Click here to start typing');
    if (this.opts.autofocus) this.focus();
    this.#syncOverlay();
  }

  #renderChars(text, offset) {
    const frag = document.createDocumentFragment();
    let word = null;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (!word) {
        word = document.createElement('span');
        word.className = 'word';
        frag.append(word);
      }
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch === ' ' ? SPACE_GLYPH : ch === '\n' ? ENTER_GLYPH : ch;
      if (ch === ' ') span.classList.add('ch--space');
      if (ch === '\n') span.classList.add('ch--enter');
      word.append(span);
      this.chars[offset + i] = span;
      if (ch === ' ' || ch === '\n') {
        word = null;
        if (ch === '\n') {
          const br = document.createElement('span');
          br.className = 'typing__break';
          frag.append(br);
        }
      }
    }
    this.textEl.append(frag);
  }

  destroy() {
    this.#stopTimer();
    window.removeEventListener('resize', this._onResize);
    this.root.innerHTML = '';
  }

  focus() {
    if (this.completed) return;
    this.input.focus({ preventScroll: true });
  }

  /* --------------------------------------------------------------- timing */

  now() {
    return performance.now();
  }

  get elapsedMs() {
    if (!this.started) return 0;
    const end = this.completed ? this.endedAt : this.paused ? this.pausedAt : this.now();
    return Math.max(0, end - this.startedAt - this.pausedTotal);
  }

  get remainingMs() {
    return this.opts.timeLimit ? Math.max(0, this.opts.timeLimit * 1000 - this.elapsedMs) : null;
  }

  stats() {
    return computeStats({
      correctChars: this.session.correctChars,
      keystrokes: this.session.keystrokes,
      errors: this.session.errors,
      elapsedMs: this.elapsedMs,
    });
  }

  #startTimer() {
    this.#stopTimer();
    this.timer = setInterval(() => {
      if (this.paused || this.completed) return;
      if (this.opts.timeLimit && this.elapsedMs >= this.opts.timeLimit * 1000) {
        this.#complete();
        return;
      }
      this.#emit('tick', { stats: this.stats(), elapsed: formatTime(this.elapsedMs), remainingMs: this.remainingMs });
    }, 200);
  }

  #stopTimer() {
    clearInterval(this.timer);
    this.timer = null;
  }

  /* ---------------------------------------------------------- focus/pause */

  #onFocus() {
    if (this.paused) {
      this.pausedTotal += this.now() - this.pausedAt;
      this.paused = false;
      this.#emit('resume');
    }
    this.#syncOverlay();
  }

  #onBlur() {
    if (this.started && !this.completed && !this.paused) {
      this.paused = true;
      this.pausedAt = this.now();
      this.#overlayText('Paused – click to continue');
      this.#emit('pause');
    }
    this.#syncOverlay();
  }

  pause() {
    this.input.blur();
  }

  #overlayText(t) {
    this.overlay.querySelector('.typing__overlay-text').textContent = t;
  }

  #syncOverlay() {
    const focused = document.activeElement === this.input;
    const show = !this.completed && !focused;
    this.overlay.hidden = !show;
    this.root.classList.toggle('is-focused', focused && !this.completed);
  }

  /* ---------------------------------------------------------------- input */

  #onKeyDown(e) {
    if (this.completed) return;

    const caps = e.getModifierState?.('CapsLock') ?? false;
    if (caps !== this.capsLock) {
      this.capsLock = caps;
      this.#emit('capslock', { on: caps });
    }

    // Composition (IME) and dead keys arrive through input/compositionend.
    if (e.isComposing || e.key === 'Dead' || e.key === 'Process' || e.keyCode === 229) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.pause();
      return;
    }
    const altGr = e.getModifierState?.('AltGraph');
    if ((e.ctrlKey || e.metaKey || e.altKey) && !altGr) return; // leave browser shortcuts alone
    if (e.key === 'Tab') return; // never trap focus: Tab leaves (and pauses)

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.#backspace();
      return;
    }
    let ch = null;
    if (e.key === 'Enter') ch = '\n';
    else if (e.key.length === 1) ch = e.key;
    else if ([...e.key].length === 1) ch = e.key; // astral characters
    if (ch === null) return; // arrows, F-keys, Shift alone…

    e.preventDefault(); // stops page scroll on space, Firefox quick-find on ' and /
    this.#type(ch);
  }

  #onInput(e) {
    // Only reached for text we did not handle on keydown (dead keys, mobile keyboards).
    if (e.isComposing || this.composing) return;
    if (e.inputType === 'insertText' && e.data) [...e.data].forEach((c) => this.#type(c));
    if (e.inputType === 'deleteContentBackward') this.#backspace();
    this.input.value = '';
  }

  #onCompositionEnd(e) {
    this.composing = false;
    if (e.data) [...e.data].forEach((c) => this.#type(c));
    this.input.value = '';
  }

  /* ---------------------------------------------------------------- logic */

  #type(ch) {
    if (this.completed) return;
    if (!this.started) {
      this.started = true;
      this.startedAt = this.now();
      this.#startTimer();
      this.#emit('start');
    }
    const r = this.session.input(ch, this.now());
    if (!r) return;

    const span = this.chars[r.index];
    if (r.advanced) {
      this.#paint(r.index);
    } else {
      span.classList.add('ch--error-flash');
      clearTimeout(span._t);
      span._t = setTimeout(() => span.classList.remove('ch--error-flash'), 300);
    }
    if (!r.correct) {
      this.root.classList.remove('is-shake');
      void this.root.offsetWidth;
      this.root.classList.add('is-shake');
      this.#emit('error', { typed: r.typed, expected: r.expected, index: r.index });
    }
    if (r.hint) this.#emit('hint', { char: r.expected, index: r.index });

    this.#emit('keystroke', { typed: r.typed, expected: r.expected, correct: r.correct, index: r.index, next: this.session.expected });

    if (this.session.done) {
      const more = this.opts.timeLimit && this.opts.getMoreText ? this.opts.getMoreText() : '';
      if (more) this.appendText(more);
      else return this.#complete();
    }
    this.#updateCurrent();
  }

  #backspace() {
    const idx = this.session.backspace();
    if (idx < 0) return;
    this.#paint(idx);
    this.#updateCurrent();
    this.#emit('keystroke', { typed: 'Backspace', expected: null, correct: true, index: idx, next: this.session.expected });
  }

  appendText(more) {
    const offset = this.session.text.length;
    this.session.appendText(more);
    this.#renderChars(more, offset);
  }

  #paint(i) {
    const span = this.chars[i];
    const state = this.session.states[i];
    span.classList.toggle('ch--correct', state === CORRECT);
    span.classList.toggle('ch--error', state === ERROR);
    span.classList.toggle('ch--fixed', state === CORRECT && this.session.missed.has(i));
    if (state === PENDING) span.classList.remove('ch--fixed');
  }

  #updateCurrent() {
    this.textEl.querySelector('.ch--current')?.classList.remove('ch--current');
    const span = this.chars[this.session.pos];
    if (span) span.classList.add('ch--current');
    const next = this.session.expected;
    this.live.textContent = next == null ? '' : `Next: ${next === ' ' ? 'space' : next === '\n' ? 'Enter' : next}`;
    this.#positionCaret(true);
  }

  #positionCaret(animate) {
    const span = this.chars[this.session.pos] || this.chars[this.chars.length - 1];
    if (!span) return;
    const atEnd = !this.chars[this.session.pos];
    const x = span.offsetLeft + (atEnd ? span.offsetWidth : 0);
    const y = span.offsetTop;
    this.caret.classList.toggle('no-anim', !animate);
    this.caret.style.transform = `translate(${x}px, ${y}px)`;
    this.caret.style.height = `${span.offsetHeight}px`;

    // Scroll by whole lines: keep the current line as the second visible line.
    const lineH = span.offsetHeight || 1;
    const target = Math.max(0, y - lineH);
    if (target !== this.scrollY) {
      this.scrollY = target;
      this.textEl.style.transform = `translateY(${-target}px)`;
    }
  }

  #complete() {
    if (this.completed) return;
    this.endedAt = this.paused ? this.pausedAt : this.now();
    this.completed = true;
    this.#stopTimer();
    const stats = this.stats();
    this.results = {
      ...stats,
      correctChars: this.session.correctChars,
      totalChars: this.session.pos,
      backspaces: this.session.backspaces,
      keyStats: structuredClone(this.session.keyStats),
      problemKeys: problemKeys(this.session.keyStats),
      timeLimit: this.opts.timeLimit || 0,
    };
    this.textEl.querySelector('.ch--current')?.classList.remove('ch--current');
    this.root.classList.add('is-complete');
    this.input.blur();
    this.#syncOverlay();
    this.#emit('complete', { results: this.results });
  }

  #emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
