/**
 * On-screen keyboard (DOM). Data-driven from a layout JSON object.
 *
 *   const kb = new Keyboard(el, layout);
 *   kb.setNext('D');          // highlight D + right Shift
 *   kb.flash('d', true);      // gentle green pulse (false = red)
 */
import { buildCharMap } from './layouts.js';

export class Keyboard {
  constructor(container, layout) {
    this.el = container;
    this.el.classList.add('kb');
    this.el.setAttribute('aria-hidden', 'true'); // purely visual; hints are announced elsewhere
    this.keys = new Map(); // code -> [elements] (Enter can have two parts)
    this.setLayout(layout);
  }

  setLayout(layout) {
    this.layout = layout;
    this.charMap = buildCharMap(layout);
    this.keys.clear();
    this.el.replaceChildren();
    this.el.dataset.layout = layout.id;

    for (const row of layout.rows) {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb__row';
      for (const key of row) {
        const k = document.createElement('div');
        k.className = `kb__key keycap${key.finger ? ` keycap--${key.finger}` : ''}`;
        if (key.special) k.classList.add('kb__key--special');
        if (layout.homeRow?.[key.code]) k.classList.add('keycap--bump');
        if (key.part) k.classList.add(`kb__key--enter-${key.part}`);
        k.style.flexGrow = String(key.width || 1);
        k.dataset.code = key.code;

        if (key.special) {
          k.textContent = key.label || '';
        } else if (/^Key[A-Z]$/.test(key.code)) {
          k.textContent = key.shift; // letters show the capital, like real keycaps
        } else {
          const top = document.createElement('span');
          top.className = 'kb__shift';
          top.textContent = key.shift;
          const bottom = document.createElement('span');
          bottom.className = 'kb__base';
          bottom.textContent = key.base;
          k.append(top, bottom);
        }
        rowEl.append(k);
        if (!this.keys.has(key.code)) this.keys.set(key.code, []);
        this.keys.get(key.code).push(k);
      }
      this.el.append(rowEl);
    }
    if (this.nextChar !== undefined) this.setNext(this.nextChar);
  }

  info(char) {
    return this.charMap.get(char) || null;
  }

  #els(code) {
    return this.keys.get(code) || [];
  }

  /** Highlight the key (and Shift / Alt Gr) needed for the next character. */
  setNext(char) {
    this.nextChar = char;
    this.el.querySelectorAll('.is-next').forEach((k) => k.classList.remove('is-next'));
    const info = char == null ? null : this.info(char);
    if (!info) return null;
    this.#els(info.code).forEach((k) => k.classList.add('is-next'));
    if (info.shift) this.#els(info.shiftCode).forEach((k) => k.classList.add('is-next'));
    if (info.altGr) this.#els('AltRight').forEach((k) => k.classList.add('is-next'));
    return info;
  }

  /** Highlight several keys at once (intro screens). Returns the infos found. */
  highlightKeys(chars = []) {
    this.nextChar = undefined;
    this.el.querySelectorAll('.is-next').forEach((k) => k.classList.remove('is-next'));
    return chars.map((c) => this.info(c)).filter(Boolean).map((info) => {
      this.#els(info.code).forEach((k) => k.classList.add('is-next'));
      return info;
    });
  }

  /** Mark a key as done (ticked off) during "press each key" steps. */
  markDone(char, done = true) {
    const info = this.info(char);
    if (info) this.#els(info.code).forEach((k) => k.classList.toggle('is-done', done));
  }

  clearMarks() {
    this.el.querySelectorAll('.is-done').forEach((k) => k.classList.remove('is-done'));
  }

  /** Brief feedback on the key that should have been pressed. */
  flash(char, ok) {
    const info = this.info(char);
    if (!info) return;
    const cls = ok ? 'is-correct' : 'is-wrong';
    for (const k of this.#els(info.code)) {
      k.classList.remove('is-correct', 'is-wrong');
      void k.offsetWidth; // restart the animation
      k.classList.add(cls);
      clearTimeout(k._flashTimer);
      k._flashTimer = setTimeout(() => k.classList.remove(cls), 450);
    }
  }

  /**
   * Problem-key heatmap: keys turn neutral and are shaded by error rate (one hue, light → dark).
   * rates: {char: 0..1}; pass {} (or nothing) to return to finger colours.
   */
  setHeat(rates = {}, { always = false } = {}) {
    for (const els of this.keys.values()) els.forEach((k) => k.removeAttribute('data-heat'));
    this.el.classList.toggle('kb--heatmap', always || Object.keys(rates).length > 0);
    for (const [char, rate] of Object.entries(rates)) {
      const info = this.info(char);
      if (!info) continue;
      const level = rate >= 0.25 ? 3 : rate >= 0.12 ? 2 : rate > 0.04 ? 1 : 0;
      if (level) this.#els(info.code).forEach((k) => (k.dataset.heat = String(level)));
    }
  }
}
