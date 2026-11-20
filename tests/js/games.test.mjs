import { typeAtTargets, pickWord, gameWords, DIFFICULTY } from '../../public_html/assets/js/games/framework.js';
import { createRng } from '../../public_html/assets/js/engine/generators.js';

test('first letter locks the most urgent matching word', () => {
  const a = { word: 'sad', typed: 0, urgency: 1 };
  const b = { word: 'sea', typed: 0, urgency: 5 };
  const c = { word: 'dad', typed: 0, urgency: 9 };
  const r = typeAtTargets([a, b, c], 's', null);
  assert.equal(r.result, 'hit');
  assert.equal(r.item, b);
  assert.equal(typeAtTargets([a, b, c], 'x', b).result, 'miss', 'wrong letter keeps the target');
  assert.equal(b.typed, 1);
  typeAtTargets([a, b, c], 'e', b);
  const done = typeAtTargets([a, b, c], 'a', b);
  assert.equal(done.done, true);
});

test('no matching word is a miss', () => {
  assert.equal(typeAtTargets([{ word: 'ok', typed: 0, urgency: 0 }], 'z', null).result, 'miss');
});

test('pickWord avoids first letters already on screen', () => {
  const r = createRng(3);
  for (let i = 0; i < 20; i++) assert.notEqual(pickWord(['ask', 'dad', 'sad', 'lad'], ['all', 'sea', 'lad'], r)[0], 'a');
});

test('gameWords keeps learnt-key words of a sensible length, with a fallback', () => {
  const words = ['a', 'as', 'ad', 'sad', 'dad', 'lad', 'salads', 'flasks', 'hello', 'alfalfas'];
  // 'a' is too short, 'hello' uses unlearnt keys, 'alfalfas' (8) is allowed, 9+ would not be.
  assert.deepEqual(gameWords(words, new Set('asdlfk')), ['as', 'ad', 'sad', 'dad', 'lad', 'salads', 'flasks', 'alfalfas']);
  // Too few typeable words → fall back to home-row words so the game is still playable.
  assert.deepEqual(gameWords(['zz', 'zoo', 'sad', 'lad', 'dad', 'ask', 'gas', 'has'], new Set('zo')), ['sad', 'lad', 'dad', 'ask', 'gas', 'has']);
});

test('difficulty levels are gentle first', () => {
  assert.ok(DIFFICULTY.gentle.lives > DIFFICULTY.normal.lives && DIFFICULTY.gentle.speed < DIFFICULTY.speedy.speed);
});
