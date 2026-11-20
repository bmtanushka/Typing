/**
 * A ready-made typing exercise (engine + keyboard + hands + live stats) for the practice,
 * typing-test and placement pages. Markup: app/Views/partials/exercise.php.
 *
 *   const ex = new Exercise(document.querySelector('[data-exercise]'), layout);
 *   const results = await ex.run({ text, timeLimit: 60 });
 */
import { TypingEngine } from '../engine/typing-engine.js';
import { Keyboard } from '../engine/keyboard.js';
import { Hands } from '../engine/hands.js';
import { connectVisuals } from '../engine/visuals.js';
import { formatTime } from '../engine/stats.js';
import { connectSound } from './sound.js';
import { load } from './store.js';

export class Exercise {
  constructor(root, layout) {
    this.root = root;
    this.$ = (s) => root.querySelector(s);
    this.keyboard = new Keyboard(this.$('[data-keyboard]'), layout);
    this.hands = new Hands(this.$('[data-hands]'));
    this.engine = null;
  }

  setLayout(layout) {
    this.keyboard.setLayout(layout);
  }

  stat(name, value) {
    const el = this.$(`[data-stat="${name}"]`);
    if (el) el.textContent = value;
  }

  /** Start an exercise; resolves with the engine results when it completes. */
  run({ text, timeLimit = 0, getMoreText = null, stopOnError = false, size = 'normal', showKeyboard, showHands, onTick = null }) {
    this.destroy();
    const settings = load().settings;
    const kb = showKeyboard ?? settings.showKeyboard !== false;
    const hd = showHands ?? settings.showHands !== false;
    this.$('[data-keyboard]').hidden = !kb;
    this.$('[data-hands]').hidden = !hd;
    this.root.hidden = false;
    const hint = this.$('[data-hint]');
    const caps = this.$('[data-caps]');
    hint.hidden = true;

    this.engine = new TypingEngine(this.$('[data-typing]'), {
      text, timeLimit, getMoreText, stopOnError, size, allowBackspace: settings.allowBackspace !== false,
    });
    this.visuals = connectVisuals(this.engine, {
      keyboard: kb ? this.keyboard : null,
      hands: hd ? this.hands : null,
      onHint: (msg) => {
        hint.textContent = msg;
        hint.hidden = false;
        clearTimeout(this.hintTimer);
        this.hintTimer = setTimeout(() => (hint.hidden = true), 6000);
      },
    });
    this.unsound = connectSound(this.engine);
    this.$('[data-stat-label="time"]').textContent = timeLimit ? 'Left' : 'Time';
    const show = () => {
      const s = this.engine.stats();
      this.stat('wpm', String(s.wpm));
      this.stat('accuracy', `${Math.round(s.accuracy)}%`);
      this.stat('errors', String(s.errors));
      this.stat('time', timeLimit ? formatTime(this.engine.remainingMs) : formatTime(this.engine.elapsedMs));
      onTick?.(s);
    };
    show();
    this.engine.addEventListener('tick', show);
    this.engine.addEventListener('keystroke', show);
    this.engine.addEventListener('capslock', (e) => (caps.hidden = !e.detail.on));
    return new Promise((resolve) => {
      this.engine.addEventListener('complete', (e) => {
        show();
        this.keyboard.setNext(null);
        resolve(e.detail.results);
      });
    });
  }

  focus() {
    this.engine?.focus();
  }

  destroy() {
    this.visuals?.disconnect();
    this.unsound?.();
    this.engine?.destroy();
    this.engine = null;
    this.keyboard.setHeat({});
  }
}
