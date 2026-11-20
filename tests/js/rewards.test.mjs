import { readFileSync } from 'node:fs';
import { xpForLesson, levelInfo, xpToNext, dayKey, updateStreak, currentStreak, newBadges, recordLesson, recordPractice, KNOWN_CRITERIA } from '../../public_html/assets/js/core/rewards.js';

const badges = JSON.parse(readFileSync(new URL('../../content/badges.json', import.meta.url))).badges;
const index = { units: [
  { id: 'gs', lessons: [{ id: 'a', newKeys: [], type: 'tutorial' }] },
  { id: 'home-row', lessons: [{ id: 'b', newKeys: ['f', 'j'] }, { id: 'c', newKeys: ['d', 'k'] }, { id: 'chk', newKeys: [], type: 'checkpoint' }] },
] };
const fresh = () => ({ progress: {}, results: [], keyStats: {}, badges: {}, skipped: {}, xp: 0, streak: { current: 0, best: 0, lastDay: null }, gameScores: {} });
const res = (o = {}) => ({ wpm: 12, rawWpm: 13, accuracy: 95, elapsedMs: 30000, keystrokes: 120, keyStats: {}, ...o });

test('XP rewards first passes and improvements, not grinding', () => {
  assert.equal(xpForLesson({ stars: 0 }), 10);
  assert.equal(xpForLesson({ stars: 2, previousStars: 0 }), 10 + 10 + 20);
  assert.equal(xpForLesson({ stars: 3, previousStars: 1 }), 10 + 15 + 20);
  assert.equal(xpForLesson({ stars: 2, previousStars: 2 }), 20, 'replaying gives a little');
  assert.equal(xpForLesson({ stars: 1, previousStars: 0, type: 'checkpoint' }), 10 + 5 + 50);
});

test('levels grow by 50 XP each time', () => {
  assert.deepEqual(levelInfo(0), { level: 1, into: 0, needed: 100, total: 0 });
  assert.equal(levelInfo(99).level, 1);
  assert.equal(levelInfo(100).level, 2);
  assert.equal(levelInfo(250).level, 3);
  assert.equal(levelInfo(260).into, 10);
  assert.equal(xpToNext(3), 200);
});

test('streaks count consecutive local days, across month ends', () => {
  let s = updateStreak(undefined, '2026-01-30');
  assert.equal(s.current, 1); assert.equal(s.grew, true);
  s = updateStreak(s, '2026-01-30'); assert.equal(s.current, 1); assert.equal(s.grew, false);
  s = updateStreak(s, '2026-01-31'); assert.equal(s.current, 2);
  s = updateStreak(s, '2026-02-01'); assert.equal(s.current, 3);
  s = updateStreak(s, '2026-02-05'); assert.equal(s.current, 1); assert.equal(s.best, 3);
  assert.equal(currentStreak({ current: 4, lastDay: '2026-03-01' }, '2026-03-02'), 4);
  assert.equal(currentStreak({ current: 4, lastDay: '2026-03-01' }, '2026-03-03'), 0);
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
});

test('every badge uses a known criteria type and has a unique id', () => {
  const ids = new Set();
  for (const b of badges) {
    assert.ok(KNOWN_CRITERIA.includes(b.criteria.type), `${b.id}: ${b.criteria.type}`);
    assert.ok(!ids.has(b.id), `duplicate ${b.id}`);
    ids.add(b.id);
    assert.ok(b.title && b.description && b.icon);
  }
});

test('recordLesson: XP, streak, first badges', () => {
  const s = fresh();
  const out = recordLesson(s, { lesson: { id: 'b', unit: 'home-row', type: 'lesson' }, index, result: res({ accuracy: 100, wpm: 11 }), stars: 3, badges, now: new Date(2026, 4, 1, 10) });
  assert.equal(out.xpGained, 10 + 15 + 20);
  assert.equal(s.xp, 45);
  assert.equal(out.streak, 1);
  assert.ok(out.newBadges.includes('first-steps'));
  assert.ok(out.newBadges.includes('hat-trick'));
  assert.ok(out.newBadges.includes('flawless'));
  assert.ok(out.newBadges.includes('sharp-shooter'));
  assert.ok(out.newBadges.includes('picking-up-pace'));
  assert.ok(!out.newBadges.includes('home-sweet-home'));
  const again = recordLesson(s, { lesson: { id: 'b', unit: 'home-row', type: 'lesson' }, index, result: res(), stars: 3, badges, now: new Date(2026, 4, 1, 11) });
  assert.deepEqual(again.newBadges, [], 'badges are awarded once');
});

test('passing a checkpoint tests out of the unit and completes it', () => {
  const s = fresh();
  const out = recordLesson(s, { lesson: { id: 'chk', unit: 'home-row', type: 'checkpoint' }, index, result: res(), stars: 2, badges });
  assert.equal(s.skipped.b, true);
  assert.equal(s.skipped.c, true);
  assert.equal(out.unitCompleted, true);
  assert.ok(out.newBadges.includes('home-sweet-home'));
});

test('failed attempt still earns a little XP but no completion', () => {
  const s = fresh();
  const out = recordLesson(s, { lesson: { id: 'b', unit: 'home-row', type: 'lesson' }, index, result: res({ accuracy: 70 }), stars: 0, badges });
  assert.equal(out.xpGained, 10);
  assert.ok(!out.newBadges.includes('first-steps'));
  assert.equal(out.unitCompleted, false);
});

test('level up is reported', () => {
  const s = fresh(); s.xp = 90;
  const out = recordLesson(s, { lesson: { id: 'b', unit: 'home-row', type: 'lesson' }, index, result: res(), stars: 2, badges });
  assert.equal(out.levelUp, true);
  assert.equal(out.level.level, 2);
});

test('practice sessions count towards a badge', () => {
  const s = fresh();
  for (let i = 0; i < 3; i++) recordPractice(s, { result: res(), badges });
  assert.ok(s.badges['practice-pays']);
  assert.equal(s.xp, 24);
});

import { recordGame } from '../../public_html/assets/js/core/rewards.js';

test('recordGame keeps the best score, rewards a new best and earns game badges', () => {
  const s = fresh();
  const a = recordGame(s, { gameId: 'key-drops', summary: { score: 80, accuracy: 90, hits: 20, durationMs: 60000 }, badges });
  assert.equal(s.gameScores['key-drops'], 80);
  assert.equal(a.xpGained, 10, 'first game: no "beat your best" bonus');
  assert.ok(a.newBadges.includes('game-on') && !a.newBadges.includes('high-scorer'));
  const b = recordGame(s, { gameId: 'key-drops', summary: { score: 50 }, badges });
  assert.equal(s.gameScores['key-drops'], 80, 'lower score keeps the best');
  assert.equal(b.newBest, false);
  const c = recordGame(s, { gameId: 'key-drops', summary: { score: 140 }, badges });
  assert.equal(c.xpGained, 20);
  assert.ok(c.newBadges.includes('high-scorer'));
  assert.equal(s.results.filter((r) => r.type === 'game').length, 3);
});
