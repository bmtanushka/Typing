/**
 * TypingSession – the pure state machine behind every exercise.
 * No DOM, no timers: the caller passes timestamps, so it is fully unit-testable.
 */
import { recordKey } from './stats.js';

export const PENDING = 0;
export const CORRECT = 1;
export const ERROR = 2;      // typed wrong and moved on (stopOnError = false)

export class TypingSession {
  /**
   * @param {string} text
   * @param {{stopOnError?: boolean, allowBackspace?: boolean, hintAfter?: number}} options
   */
  constructor(text, { stopOnError = false, allowBackspace = true, hintAfter = 3 } = {}) {
    this.text = String(text);
    this.stopOnError = stopOnError;
    this.allowBackspace = allowBackspace;
    this.hintAfter = hintAfter;

    this.states = new Array(this.text.length).fill(PENDING);
    this.missed = new Set();   // indexes that were ever typed wrongly (shown as "corrected")
    this.pos = 0;
    this.keystrokes = 0;
    this.errors = 0;
    this.backspaces = 0;
    this.keyStats = {};
    this.lastKeyAt = null;
    this.streak = { index: -1, count: 0, hinted: false };
  }

  get done() {
    return this.pos >= this.text.length;
  }

  get expected() {
    return this.done ? null : this.text[this.pos];
  }

  /** Characters currently correct (net – fixed errors count, uncorrected ones don't). */
  get correctChars() {
    let n = 0;
    for (const s of this.states) if (s === CORRECT) n++;
    return n;
  }

  appendText(more) {
    this.text += more;
    this.states.push(...new Array(more.length).fill(PENDING));
  }

  /**
   * Feed one typed character.
   * @returns {{correct:boolean, expected:string, typed:string, index:number, advanced:boolean, hint:boolean, done:boolean} | null}
   */
  input(typed, now = 0) {
    if (this.done) return null;
    const index = this.pos;
    const expected = this.text[index];
    const correct = typed === expected;
    const latency = this.lastKeyAt == null ? null : now - this.lastKeyAt;
    this.lastKeyAt = now;

    this.keystrokes++;
    recordKey(this.keyStats, expected, correct, latency);

    let hint = false;
    if (correct) {
      this.states[index] = CORRECT;
      this.pos++;
      this.streak = { index: -1, count: 0, hinted: false };
    } else {
      this.errors++;
      this.missed.add(index);
      if (this.streak.index === index) this.streak.count++;
      else this.streak = { index, count: 1, hinted: false };
      if (this.streak.count >= this.hintAfter && !this.streak.hinted) {
        this.streak.hinted = true;
        hint = true;
      }
      if (!this.stopOnError) {
        this.states[index] = ERROR;
        this.pos++;
      }
    }
    return { correct, expected, typed, index, advanced: this.pos > index, hint, done: this.done };
  }

  /** Step back one character. Returns the index that was cleared, or -1. */
  backspace() {
    if (!this.allowBackspace || this.pos === 0 || this.stopOnError) return -1;
    this.pos--;
    this.states[this.pos] = PENDING;
    this.backspaces++;
    return this.pos;
  }
}
