import { allowedKeys, combineResults, computeStars, applyLessonResult, nextLessonId, lessonAfter, courseOrder } from '../../public_html/assets/js/core/lesson-logic.js';

const index = { units: [
  { id: 'u1', lessons: [{ id: 'a', newKeys: [] }, { id: 'b', newKeys: ['f', 'j'] }] },
  { id: 'u2', lessons: [{ id: 'c', newKeys: ['d', 'k'] }, { id: 'd', newKeys: ['s', 'l'] }] },
] };

test('courseOrder flattens units in order', () => {
  assert.deepEqual(courseOrder(index).map((l) => `${l.unit}:${l.id}`), ['u1:a', 'u1:b', 'u2:c', 'u2:d']);
});

test('allowedKeys accumulates up to the lesson', () => {
  assert.deepEqual([...allowedKeys(index, 'c')].sort(), [' ', 'd', 'f', 'j', 'k']);
  assert.deepEqual([...allowedKeys(index, 'a')], [' ']);
});

test('combineResults: accuracy over all steps, WPM over scored steps only', () => {
  const r = combineResults([
    { scored: false, correctChars: 10, keystrokes: 20, errors: 10, elapsedMs: 60000, keyStats: { f: { attempts: 20, errors: 10, latencyTotal: 0, latencyCount: 0 } } },
    { correctChars: 100, keystrokes: 100, errors: 0, elapsedMs: 60000, keyStats: { f: { attempts: 5, errors: 0, latencyTotal: 0, latencyCount: 0 } } },
  ]);
  assert.equal(r.wpm, 20);
  assert.equal(r.accuracy, 91.7);
  assert.equal(r.keyStats.f.attempts, 25);
  assert.equal(r.problemKeys[0].char, 'f');
});

test('computeStars respects pass criteria and star thresholds', () => {
  const lesson = { passCriteria: { minAccuracy: 85 }, stars: { two: { accuracy: 92 }, three: { accuracy: 97, wpm: 15 } } };
  assert.equal(computeStars({ accuracy: 80, wpm: 30 }, lesson), 0);
  assert.equal(computeStars({ accuracy: 88, wpm: 30 }, lesson), 1);
  assert.equal(computeStars({ accuracy: 95, wpm: 30 }, lesson), 2);
  assert.equal(computeStars({ accuracy: 99, wpm: 10 }, lesson), 2, 'three stars needs speed too');
  assert.equal(computeStars({ accuracy: 99, wpm: 16 }, lesson), 3);
  assert.equal(computeStars({ accuracy: 99, wpm: 5 }, {}), 3, 'defaults');
});

test('applyLessonResult keeps bests and never loses earned stars', () => {
  const s = { progress: {}, results: [], keyStats: {} };
  const now = new Date('2026-01-01T10:00:00Z');
  applyLessonResult(s, 'b', { wpm: 10, accuracy: 95, elapsedMs: 1000, keyStats: { f: { attempts: 1, errors: 0, latencyTotal: 0, latencyCount: 0 } } }, 2, now);
  applyLessonResult(s, 'b', { wpm: 14, accuracy: 80, elapsedMs: 1000, keyStats: {} }, 0, now);
  assert.equal(s.progress.b.stars, 2);
  assert.equal(s.progress.b.attempts, 2);
  assert.equal(s.progress.b.bestWpm, 10, 'failed attempt does not set a best');
  assert.equal(s.progress.b.completedAt, now.toISOString());
  assert.equal(s.results.length, 2);
  assert.equal(s.keyStats.f.attempts, 1);
});

test('nextLessonId and lessonAfter', () => {
  assert.equal(nextLessonId(index, {}), 'a');
  assert.equal(nextLessonId(index, { a: { stars: 1 }, b: { stars: 3 } }), 'c');
  assert.equal(nextLessonId(index, { a: { stars: 1 }, b: { stars: 1 }, c: { stars: 1 }, d: { stars: 1 } }), 'd');
  assert.equal(lessonAfter(index, 'b').id, 'c');
  assert.equal(lessonAfter(index, 'd'), null);
});
