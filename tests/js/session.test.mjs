import { TypingSession, CORRECT, ERROR, PENDING } from '../../public_html/assets/js/engine/session.js';

const typeAll = (s, str, t0 = 0, step = 100) => [...str].map((c, i) => s.input(c, t0 + i * step));

test('typing the whole text correctly completes it', () => {
  const s = new TypingSession('fj fj');
  typeAll(s, 'fj fj');
  assert.equal(s.done, true);
  assert.equal(s.correctChars, 5);
  assert.equal(s.errors, 0);
  assert.equal(s.keystrokes, 5);
  assert.equal(s.input('x', 999), null, 'no input after completion');
});

test('errors advance by default and count against accuracy', () => {
  const s = new TypingSession('abc');
  const r = s.input('x', 0);
  assert.equal(r.correct, false);
  assert.equal(r.advanced, true);
  assert.equal(s.states[0], ERROR);
  typeAll(s, 'bc');
  assert.equal(s.done, true);
  assert.equal(s.correctChars, 2);
  assert.equal(s.errors, 1);
});

test('stopOnError keeps the cursor until the right key is pressed', () => {
  const s = new TypingSession('ab', { stopOnError: true });
  assert.equal(s.input('x', 0).advanced, false);
  assert.equal(s.input('y', 50).advanced, false);
  assert.equal(s.pos, 0);
  assert.equal(s.input('a', 100).advanced, true);
  assert.equal(s.errors, 2);
  assert.equal(s.keystrokes, 3);
  assert.ok(s.missed.has(0), 'remembered as corrected');
  assert.equal(s.states[0], CORRECT);
});

test('backspace fixes a mistake; the error still counts', () => {
  const s = new TypingSession('ab');
  s.input('x', 0);
  assert.equal(s.backspace(), 0);
  assert.equal(s.states[0], PENDING);
  typeAll(s, 'ab', 100);
  assert.equal(s.correctChars, 2);
  assert.equal(s.errors, 1);
  assert.equal(s.backspaces, 1);
});

test('backspace is ignored when not allowed or at the start', () => {
  const s = new TypingSession('ab', { allowBackspace: false });
  s.input('a', 0);
  assert.equal(s.backspace(), -1);
  assert.equal(s.pos, 1);
  assert.equal(new TypingSession('ab').backspace(), -1);
});

test('hint fires once after repeated errors on the same character', () => {
  const s = new TypingSession('d', { stopOnError: true, hintAfter: 3 });
  assert.equal(s.input('s', 0).hint, false);
  assert.equal(s.input('s', 1).hint, false);
  assert.equal(s.input('s', 2).hint, true);
  assert.equal(s.input('s', 3).hint, false);
});

test('per-key stats are recorded against the expected key with latency', () => {
  const s = new TypingSession('dd', { stopOnError: true });
  s.input('d', 0);       // first keystroke: no latency
  s.input('s', 300);
  s.input('d', 500);
  assert.deepEqual(s.keyStats.d, { attempts: 3, errors: 1, latencyTotal: 500, latencyCount: 2 });
});

test('Shift characters are compared exactly (case-sensitive)', () => {
  const s = new TypingSession('Ab');
  assert.equal(s.input('a', 0).correct, false);
  const t = new TypingSession('Ab');
  assert.equal(t.input('A', 0).correct, true);
});

test('appendText extends a session (timed tests)', () => {
  const s = new TypingSession('ab');
  typeAll(s, 'ab');
  assert.equal(s.done, true);
  s.appendText(' cd');
  assert.equal(s.done, false);
  assert.equal(s.expected, ' ');
});
