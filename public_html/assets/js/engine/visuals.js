/**
 * Connects a TypingEngine to the on-screen keyboard and hands overlay so every
 * exercise gets the same behaviour: highlight next key + finger, pulse on press.
 */
import { fingersFor, hintFor } from './layouts.js';

export function connectVisuals(engine, { keyboard = null, hands = null, onHint = null } = {}) {
  const show = (char) => {
    const info = keyboard ? keyboard.setNext(char) : null;
    if (hands) hands.setActive(info ? fingersFor(info) : []);
  };

  const onKey = (e) => {
    const { expected, correct, next } = e.detail;
    if (keyboard && expected != null) keyboard.flash(expected, correct);
    show(next);
  };
  const onHintEvt = (e) => {
    if (!onHint || !keyboard) return;
    const ch = e.detail.char;
    onHint(hintFor(ch, keyboard.info(ch)), ch);
  };
  const onDone = () => {
    keyboard?.setNext(null);
    hands?.setActive([]);
  };

  engine.addEventListener('keystroke', onKey);
  engine.addEventListener('hint', onHintEvt);
  engine.addEventListener('complete', onDone);
  show(engine.session.expected);

  return {
    refresh: () => show(engine.session.expected),
    disconnect() {
      engine.removeEventListener('keystroke', onKey);
      engine.removeEventListener('hint', onHintEvt);
      engine.removeEventListener('complete', onDone);
    },
  };
}
