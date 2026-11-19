import { createRng, keyRepeats, patternDrill, filterWords, wordDrill, weightedDrill } from '../../public_html/assets/js/engine/generators.js';

const onlyUses = (text, allowed) => [...text].every((c) => allowed.includes(c));

test('seeded RNG is repeatable', () => {
  const a = createRng(42), b = createRng(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

test('keyRepeats groups each key', () => {
  assert.equal(keyRepeats(['f', 'j'], { rounds: 2, groupSize: 3 }), 'fff jjj fff jjj');
});

test('patternDrill uses only allowed keys, every group has a focus key', () => {
  const t = patternDrill(['d', 'k'], ['f', 'j', ' '], { length: 60, r: createRng(1) });
  assert.ok(t.length >= 50, 'long enough');
  assert.ok(onlyUses(t, 'dkfj '), t);
  for (const g of t.split(' ')) assert.ok(/[dk]/.test(g), `group ${g}`);
  assert.ok(!/  /.test(t) && t === t.trim(), 'single-spaced');
});

test('filterWords keeps only typeable words', () => {
  assert.deepEqual(filterWords(['sad', 'glad', 'salad', 'the'], new Set('asdl')), ['sad', 'salad']);
});

test('wordDrill uses real words, favours focus keys, avoids immediate repeats', () => {
  const words = ['a', 'as', 'ad', 'add', 'dad', 'sad', 'lad', 'fall', 'flask', 'all', 'the', 'hello'];
  const t = wordDrill(words, new Set('asdfjkl; '), ['l'], { count: 20, r: createRng(7) });
  const list = t.split(' ');
  assert.equal(list.length, 20);
  const typeable = ['a', 'as', 'ad', 'add', 'dad', 'sad', 'lad', 'fall', 'flask', 'all'];
  for (const w of list) assert.ok(typeable.includes(w), `unexpected word ${w}`);
  for (let i = 1; i < list.length; i++) assert.notEqual(list[i], list[i - 1]);
  assert.ok(list.filter((w) => w.includes('l')).length >= 10, 'focus-heavy');
});

test('wordDrill falls back to patterns when no words fit', () => {
  const t = wordDrill(['hello', 'world'], new Set('fj '), ['f', 'j'], { count: 6, r: createRng(3) });
  assert.ok(t.length > 0 && onlyUses(t, 'fj '), t);
});

test('weightedDrill practises weak keys most', () => {
  const t = weightedDrill({ d: 0.5, k: 0.05 }, new Set('asdfjkl '), { length: 200, r: createRng(9) });
  assert.ok(onlyUses(t, 'asdfjkl '), t);
  const count = (c) => [...t].filter((x) => x === c).length;
  assert.ok(count('d') > count('k') * 2, `d=${count('d')} k=${count('k')}`);
});
