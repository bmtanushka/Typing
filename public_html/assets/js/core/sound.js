/**
 * Soft sound effects synthesised with the Web Audio API – no audio files to download.
 * Off by default; respects settings.sound. The AudioContext is created lazily on the
 * first sound (always after a key press or click, so browsers allow it).
 */
import { getSetting } from './store.js';

let ctx = null;
const audio = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function tone(freq, { at = 0, dur = 0.12, type = 'sine', vol = 0.06, slide = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SOUNDS = {
  key: () => tone(1800, { dur: 0.025, type: 'triangle', vol: 0.025 }),
  error: () => tone(220, { dur: 0.12, type: 'sine', vol: 0.05, slide: 0.8 }),
  step: () => { tone(660, { dur: 0.1 }); tone(880, { at: 0.08, dur: 0.14 }); },
  success: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.09, dur: 0.22, vol: 0.05 })); },
  badge: () => { [784, 988, 1175].forEach((f, i) => tone(f, { at: i * 0.07, dur: 0.18, type: 'triangle', vol: 0.05 })); },
  levelUp: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, { at: i * 0.08, dur: 0.25, type: 'triangle', vol: 0.05 })); },
};

/** Play a named sound if the learner has sound switched on (or force for "Test sound"). */
export function play(name, { force = false } = {}) {
  if (!force && !getSetting('sound')) return;
  try {
    SOUNDS[name]?.();
  } catch {
    /* audio unavailable – stay silent */
  }
}

/** Key click / error sounds for any TypingEngine. */
export function connectSound(engine) {
  const onKey = (e) => { if (e.detail.correct && e.detail.typed !== 'Backspace') play('key'); };
  const onErr = () => play('error');
  engine.addEventListener('keystroke', onKey);
  engine.addEventListener('error', onErr);
  return () => {
    engine.removeEventListener('keystroke', onKey);
    engine.removeEventListener('error', onErr);
  };
}
