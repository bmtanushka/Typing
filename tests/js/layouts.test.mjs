import { readFileSync } from 'node:fs';
import { buildCharMap, fingersFor, hintFor, detectLayout } from '../../public_html/assets/js/engine/layouts.js';

const load = (id) => JSON.parse(readFileSync(new URL(`../../content/layouts/${id}.json`, import.meta.url)));
const uk = load('uk');
const us = load('us');
const FINGERS = new Set(['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp', 'th']);

test('every row is 15 units wide in both layouts', () => {
  for (const lay of [uk, us]) {
    for (const row of lay.rows) {
      const w = row.reduce((t, k) => t + (k.width || 1), 0);
      assert.equal(w, 15, `${lay.id} row`);
    }
  }
});

test('every printable ASCII character is typeable on US', () => {
  const map = buildCharMap(us);
  for (let c = 32; c < 127; c++) assert.ok(map.has(String.fromCharCode(c)), `missing ${String.fromCharCode(c)}`);
});

test('every printable ASCII character is typeable on UK, plus £ ¬ €', () => {
  const map = buildCharMap(uk);
  for (let c = 32; c < 127; c++) assert.ok(map.has(String.fromCharCode(c)), `missing ${String.fromCharCode(c)}`);
  assert.equal(map.get('£').code, 'Digit3');
  assert.equal(map.get('¬').code, 'Backquote');
  assert.equal(map.get('@').code, 'Quote');
  assert.equal(map.get('"').code, 'Digit2');
  assert.equal(map.get('#').code, 'Backslash');
  assert.equal(map.get('\\').code, 'IntlBackslash');
  assert.equal(map.get('€').altGr, true);
});

test('layout-specific symbols differ correctly', () => {
  assert.equal(buildCharMap(us).get('@').code, 'Digit2');
  assert.equal(buildCharMap(us).get('"').code, 'Quote');
});

test('all keys use a valid finger and home keys are correct', () => {
  for (const lay of [uk, us]) {
    for (const k of lay.rows.flat()) if (k.finger) assert.ok(FINGERS.has(k.finger), `${lay.id} ${k.code}`);
    const map = buildCharMap(lay);
    assert.deepEqual('asdfjkl;'.split('').map((c) => map.get(c).finger), ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp']);
  }
});

test('capitals use the opposite-hand Shift', () => {
  const map = buildCharMap(uk);
  assert.deepEqual(fingersFor(map.get('D')), ['lm', 'rp']);
  assert.equal(map.get('D').shiftCode, 'ShiftRight');
  assert.deepEqual(fingersFor(map.get('J')), ['ri', 'lp']);
  assert.deepEqual(fingersFor(map.get('j')), ['ri']);
});

test('friendly hints', () => {
  const map = buildCharMap(uk);
  assert.equal(hintFor('d', map.get('d')), 'Use your left middle finger for “d”.');
  assert.match(hintFor('D', map.get('D')), /holding right Shift/);
  assert.equal(hintFor(' ', map.get(' ')), 'Tap the space bar with either thumb.');
});

test('detectLayout from browser languages', () => {
  assert.equal(detectLayout(['en-GB', 'en']), 'uk');
  assert.equal(detectLayout(['en-US']), 'us');
  assert.equal(detectLayout(['fr-FR', 'en-GB']), 'uk');
  assert.equal(detectLayout([]), 'us');
});
