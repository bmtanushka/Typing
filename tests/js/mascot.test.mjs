import { resultMessages, greeting } from '../../public_html/assets/js/core/mascot.js';
import { createRng } from '../../public_html/assets/js/engine/generators.js';

const negative = /\b(bad|poor|terrible|awful|fail|failed|wrong|worse)\b/i;

test('reports accuracy improvement specifically', () => {
  const m = resultMessages({ stars: 2, accuracy: 96, wpm: 12, previous: { bestAccuracy: 90, bestWpm: 12 } }, createRng(1));
  assert.equal(m[0], 'Nice! Your accuracy improved by 6%.');
});

test('reports speed improvement when accuracy held', () => {
  const m = resultMessages({ stars: 2, accuracy: 95, wpm: 18, previous: { bestAccuracy: 95, bestWpm: 14 } }, createRng(1));
  assert.equal(m[0], 'You’re 4 WPM faster than your best!');
});

test('celebrates units, level ups and streaks first', () => {
  const m = resultMessages({ stars: 3, accuracy: 99, wpm: 20, unitCompleted: true, levelUp: true, level: 4, streak: 3, streakGrew: true }, createRng(2));
  assert.match(m[0], /whole unit/);
  assert.match(m[1], /level 4/);
  assert.ok(m.length <= 3);
});

test('messages are never negative, for every outcome', () => {
  for (let seed = 0; seed < 30; seed++) {
    for (const stars of [0, 1, 2, 3]) {
      for (const msg of resultMessages({ stars, accuracy: 50 + stars * 15, wpm: 5 }, createRng(seed))) {
        assert.ok(!negative.test(msg), msg);
        assert.ok(msg.length > 5);
      }
    }
  }
  assert.ok(greeting(true, createRng(1)).length > 0);
});
