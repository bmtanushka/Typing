import { isUnlocked, lessonState, blockingLesson, skipUnit, nextLessonId } from '../../public_html/assets/js/core/lesson-logic.js';

const index = { units: [
  { id: 'gs', lessons: [{ id: 'a', newKeys: [] }, { id: 'b', newKeys: [] }] },
  { id: 'hr', lessons: [{ id: 'c', newKeys: ['f'] }, { id: 'd', newKeys: ['d'] }, { id: 'chk', type: 'checkpoint', newKeys: [] }] },
  { id: 'top', lessons: [{ id: 'e', newKeys: ['e'] }] },
] };
const st = (o = {}) => ({ progress: {}, skipped: {}, ...o });

test('only the first lesson is open at the start', () => {
  const s = st();
  assert.deepEqual(['a', 'b', 'c', 'd', 'chk', 'e'].map((id) => lessonState(index, s, id)), ['open', 'locked', 'locked', 'locked', 'locked', 'locked']);
});

test('passing a lesson opens the next', () => {
  const s = st({ progress: { a: { stars: 1 } } });
  assert.equal(lessonState(index, s, 'a'), 'done');
  assert.equal(isUnlocked(index, s, 'b'), true);
  assert.equal(isUnlocked(index, s, 'c'), false);
  assert.equal(blockingLesson(index, s, 'd').id, 'b');
});

test('a failed attempt does not open the next lesson but stays open itself', () => {
  const s = st({ progress: { a: { stars: 1 }, b: { stars: 0, attempts: 2 } } });
  assert.equal(isUnlocked(index, s, 'b'), true);
  assert.equal(isUnlocked(index, s, 'c'), false);
});

test('skipping a unit opens the next unit, and its checkpoint can be taken straight away', () => {
  const s = st();
  skipUnit(s, index, 'gs');
  assert.equal(isUnlocked(index, s, 'c'), true);
  assert.equal(isUnlocked(index, s, 'd'), false);
  assert.equal(isUnlocked(index, s, 'chk'), true, 'test out');
  assert.equal(nextLessonId(index, s.progress, s.skipped), 'c');
});

test('a passed checkpoint opens the whole unit and the next unit', () => {
  const s = st({ skipped: { a: true, b: true }, progress: { chk: { stars: 2 } } });
  assert.equal(isUnlocked(index, s, 'd'), true);
  assert.equal(isUnlocked(index, s, 'e'), true);
});

test('checkpoint stays locked until its unit is reached', () => {
  assert.equal(isUnlocked(index, st(), 'chk'), false);
});
