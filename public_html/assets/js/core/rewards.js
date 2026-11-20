/**
 * Motivation rules – XP, levels, streaks and badges. Pure functions (unit-tested).
 */
import { applyLessonResult, courseOrder, skipUnit } from './lesson-logic.js';
import { mergeKeyStats } from '../engine/stats.js';

/* ---------------------------------------------------------------- XP / levels */

/** XP for finishing a lesson. Rewards effort, first passes and new stars – not grinding. */
export function xpForLesson({ stars, previousStars = 0, type = 'lesson' }) {
  let xp = 10;                                   // turning up and finishing
  if (stars > 0) xp += 5 * stars;                // quality
  if (stars > 0 && previousStars === 0) xp += type === 'checkpoint' ? 50 : 20; // first pass
  if (stars > previousStars && previousStars > 0) xp += 10 * (stars - previousStars); // improvement
  return xp;
}

export const XP_PRACTICE = 8;

/** XP needed to go from level n to n+1: 100, 150, 200, … */
export const xpToNext = (level) => 100 + 50 * (level - 1);

/** @returns {{level:number, into:number, needed:number, total:number}} */
export function levelInfo(totalXp = 0) {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp));
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, needed: xpToNext(level), total: Math.max(0, Math.floor(totalXp)) };
}

/* -------------------------------------------------------------------- streaks */

/** Local calendar day as YYYY-MM-DD (streaks follow the learner's own midnight). */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Update a streak for activity on `today`. Returns a new object plus whether it grew. */
export function updateStreak(streak = { current: 0, best: 0, lastDay: null }, today = dayKey()) {
  const s = { current: streak.current || 0, best: streak.best || 0, lastDay: streak.lastDay || null };
  if (s.lastDay === today) return { ...s, grew: false };
  const gap = s.lastDay ? daysBetween(s.lastDay, today) : null;
  s.current = gap === 1 ? s.current + 1 : 1;
  s.best = Math.max(s.best, s.current);
  s.lastDay = today;
  return { ...s, grew: true };
}

/** Streak as it stands today (0 if the learner missed yesterday). */
export function currentStreak(streak, today = dayKey()) {
  if (!streak?.lastDay) return 0;
  const gap = daysBetween(streak.lastDay, today);
  return gap <= 1 ? streak.current : 0;
}

/* --------------------------------------------------------------------- badges */

/** Facts about the learner used by badge criteria. */
export function badgeFacts(state, index) {
  const lessons = Object.entries(state.progress || {});
  const passed = lessons.filter(([, p]) => p.stars > 0);
  // Speed/accuracy badges count passed lessons and typing tests.
  const lessonResults = (state.results || []).filter((r) => (r.type === 'lesson' && r.stars > 0) || r.type === 'test');
  const unitsComplete = new Set();
  if (index) {
    for (const u of index.units) {
      if (u.lessons.length && u.lessons.every((l) => state.progress?.[l.id]?.stars > 0 || state.skipped?.[l.id])) unitsComplete.add(u.id);
    }
  }
  return {
    lessonsCompleted: passed.length,
    threeStarLessons: passed.filter(([, p]) => p.stars === 3).length,
    bestWpm: Math.max(0, ...lessonResults.filter((r) => (r.chars ?? 999) >= 50).map((r) => r.wpm)),
    bestAccuracy: Math.max(0, ...lessonResults.filter((r) => (r.chars ?? 999) >= 100).map((r) => r.accuracy)),
    perfectLessons: lessonResults.filter((r) => r.accuracy >= 100 && (r.chars ?? 999) >= 60).length,
    practiceSessions: (state.results || []).filter((r) => r.type === 'practice').length,
    bestStreak: state.streak?.best || 0,
    xp: state.xp || 0,
    gamesPlayed: Object.keys(state.gameScores || {}).length,
    bestGameScore: Math.max(0, ...Object.values(state.gameScores || {}).map(Number)),
    unitsComplete,
  };
}

const CRITERIA = {
  lessonsCompleted: (f, c) => f.lessonsCompleted >= c.count,
  threeStars: (f, c) => f.threeStarLessons >= (c.count || 1),
  wpm: (f, c) => f.bestWpm >= c.min,
  accuracy: (f, c) => f.bestAccuracy >= c.min,
  perfect: (f, c) => f.perfectLessons >= (c.count || 1),
  practice: (f, c) => f.practiceSessions >= c.count,
  streak: (f, c) => f.bestStreak >= c.days,
  xp: (f, c) => f.xp >= c.min,
  unitComplete: (f, c) => f.unitsComplete.has(c.unit),
  gamesPlayed: (f, c) => f.gamesPlayed >= c.count,
  gameScore: (f, c) => f.bestGameScore >= c.min,
};

export const KNOWN_CRITERIA = Object.keys(CRITERIA);

/** Badge ids newly earned (not already in state.badges). */
export function newBadges(state, defs, index) {
  const facts = badgeFacts(state, index);
  return defs
    .filter((b) => !state.badges?.[b.id])
    .filter((b) => CRITERIA[b.criteria?.type]?.(facts, b.criteria) === true)
    .map((b) => b.id);
}

/** Award badges into the draft state; returns the newly earned ids. */
export function awardBadges(state, defs, index, now = new Date()) {
  const earned = newBadges(state, defs, index);
  state.badges = state.badges || {};
  for (const id of earned) state.badges[id] = now.toISOString();
  return earned;
}

/* --------------------------------------------------------- recording a lesson */

/**
 * Apply a finished lesson to the guest state draft and return a summary for the
 * results screen: XP, level-up, streak, new badges, unit completion.
 */
export function recordLesson(state, { lesson, index, result, stars, badges = [], now = new Date() }) {
  const previous = state.progress?.[lesson.id] || null;
  const previousStars = previous?.stars || 0;
  const levelBefore = levelInfo(state.xp).level;
  const unitDoneBefore = isUnitComplete(state, index, lesson.unit);

  applyLessonResult(state, lesson.id, result, stars, now);
  // Passing a checkpoint skips the rest of its unit ("test out").
  if (lesson.type === 'checkpoint' && stars > 0) skipUnit(state, index, lesson.unit);
  const last = state.results[state.results.length - 1];
  last.chars = result.keystrokes ?? 0;

  const xpGained = xpForLesson({ stars, previousStars, type: lesson.type });
  state.xp = (state.xp || 0) + xpGained;

  const streak = updateStreak(state.streak, dayKey(now));
  state.streak = { current: streak.current, best: streak.best, lastDay: streak.lastDay };

  const unitCompleted = !unitDoneBefore && isUnitComplete(state, index, lesson.unit);
  const earned = awardBadges(state, badges, index, now);

  return {
    xpGained,
    level: levelInfo(state.xp),
    levelUp: levelInfo(state.xp).level > levelBefore,
    streak: state.streak.current,
    streakGrew: streak.grew,
    newBadges: earned,
    unitCompleted,
    firstPass: stars > 0 && previousStars === 0,
    previous,
  };
}

/** Record a practice session (problem keys, free practice) – XP + streak + badges. */
export function recordPractice(state, { result, ref = 'practice', badges = [], index = null, now = new Date(), type = 'practice', xp = XP_PRACTICE }) {
  const levelBefore = levelInfo(state.xp).level;
  state.results.push({
    type, ref, wpm: result.wpm, rawWpm: result.rawWpm, accuracy: result.accuracy,
    durationMs: result.elapsedMs, chars: result.keystrokes ?? 0, at: now.toISOString(),
  });
  if (state.results.length > 300) state.results.splice(0, state.results.length - 300);
  if (result.keyStats) state.keyStats = mergeKeyStats(state.keyStats, result.keyStats);
  state.xp = (state.xp || 0) + xp;
  const streak = updateStreak(state.streak, dayKey(now));
  state.streak = { current: streak.current, best: streak.best, lastDay: streak.lastDay };
  return {
    xpGained: xp, newBadges: awardBadges(state, badges, index, now), streak: state.streak.current,
    streakGrew: streak.grew, level: levelInfo(state.xp), levelUp: levelInfo(state.xp).level > levelBefore,
  };
}

export const XP_TEST = 12;

/** Record a finished game: best score per game, XP (bonus for a new best), streak, badges. */
export function recordGame(state, { gameId, summary, badges = [], index = null, now = new Date() }) {
  const levelBefore = levelInfo(state.xp).level;
  const previousBest = Number(state.gameScores?.[gameId] || 0);
  const newBest = summary.score > previousBest;
  state.gameScores = state.gameScores || {};
  if (newBest) state.gameScores[gameId] = summary.score;
  state.results.push({
    type: 'game', ref: gameId, score: summary.score, wpm: summary.wpm || 0, rawWpm: summary.wpm || 0,
    accuracy: summary.accuracy ?? 0, durationMs: summary.durationMs || 0, chars: summary.hits || 0, at: now.toISOString(),
  });
  if (state.results.length > 300) state.results.splice(0, state.results.length - 300);
  const xp = 10 + (newBest && previousBest > 0 ? 10 : 0);
  state.xp = (state.xp || 0) + xp;
  const streak = updateStreak(state.streak, dayKey(now));
  state.streak = { current: streak.current, best: streak.best, lastDay: streak.lastDay };
  return {
    xpGained: xp, newBest, previousBest, newBadges: awardBadges(state, badges, index, now),
    streak: state.streak.current, level: levelInfo(state.xp), levelUp: levelInfo(state.xp).level > levelBefore,
  };
}

/** Record a timed typing test (counts towards speed badges). */
export function recordTest(state, opts) {
  return recordPractice(state, { ...opts, type: 'test', xp: XP_TEST });
}

export function isUnitComplete(state, index, unitId) {
  const unit = index?.units.find((u) => u.id === unitId);
  return !!unit && unit.lessons.length > 0 &&
    unit.lessons.every((l) => state.progress?.[l.id]?.stars > 0 || state.skipped?.[l.id]);
}

export { courseOrder };
