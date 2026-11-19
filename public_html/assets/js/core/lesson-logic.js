/**
 * Lesson rules – pure functions shared by the lesson player and the map.
 * Unit-tested in tests/js/lesson-logic.test.mjs.
 */
import { computeStats, mergeKeyStats, problemKeys } from '../engine/stats.js';

export const DEFAULT_PASS = { minAccuracy: 85, minWpm: 0 };
export const DEFAULT_STARS = { two: { accuracy: 92 }, three: { accuracy: 97 } };

/** Flatten the course index into an ordered list of lessons (with unit id). */
export function courseOrder(index) {
  return index.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u.id })));
}

/** Characters available in a lesson: every newKey up to and including it, plus space. */
export function allowedKeys(index, lessonId) {
  const set = new Set([' ']);
  for (const l of courseOrder(index)) {
    for (const k of l.newKeys || []) set.add(k);
    if (l.id === lessonId) return set;
  }
  return set;
}

/**
 * Combine per-step engine results into one lesson result.
 * Accuracy uses every typing step; WPM uses only "scored" steps (key intros are slow on purpose).
 */
export function combineResults(steps) {
  const all = steps.filter(Boolean);
  const scored = all.filter((s) => s.scored !== false);
  const sum = (list, k) => list.reduce((t, s) => t + (s[k] || 0), 0);
  const speedFrom = scored.length ? scored : all;
  const speed = computeStats({
    correctChars: sum(speedFrom, 'correctChars'),
    keystrokes: sum(speedFrom, 'keystrokes'),
    errors: sum(speedFrom, 'errors'),
    elapsedMs: sum(speedFrom, 'elapsedMs'),
  });
  const acc = computeStats({
    correctChars: sum(all, 'correctChars'),
    keystrokes: sum(all, 'keystrokes'),
    errors: sum(all, 'errors'),
    elapsedMs: sum(all, 'elapsedMs'),
  });
  const keyStats = all.reduce((m, s) => mergeKeyStats(m, s.keyStats || {}), {});
  return {
    wpm: speed.wpm,
    rawWpm: speed.rawWpm,
    accuracy: acc.accuracy,
    errors: acc.errors,
    keystrokes: acc.keystrokes,
    elapsedMs: acc.elapsedMs,
    keyStats,
    problemKeys: problemKeys(keyStats),
  };
}

/** 0 = not passed yet, 1–3 stars otherwise. */
export function computeStars(result, lesson = {}) {
  const pass = { ...DEFAULT_PASS, ...(lesson.passCriteria || {}) };
  if (result.accuracy < pass.minAccuracy || result.wpm < pass.minWpm) return 0;
  const stars = { ...DEFAULT_STARS, ...(lesson.stars || {}) };
  const meets = (c) => result.accuracy >= (c.accuracy ?? 0) && result.wpm >= (c.wpm ?? 0);
  if (meets(stars.three)) return 3;
  if (meets(stars.two)) return 2;
  return 1;
}

/**
 * Record a finished lesson into the guest state (mutates the draft passed in by store.update).
 * Keeps the best stars / WPM / accuracy, counts attempts, logs the result, merges key stats.
 */
export function applyLessonResult(state, lessonId, result, stars, now = new Date()) {
  const p = state.progress[lessonId] || { stars: 0, bestWpm: 0, bestAccuracy: 0, attempts: 0, completedAt: null };
  p.attempts += 1;
  p.stars = Math.max(p.stars, stars);
  if (stars > 0) {
    p.bestWpm = Math.max(p.bestWpm, result.wpm);
    p.bestAccuracy = Math.max(p.bestAccuracy, result.accuracy);
    p.completedAt = p.completedAt || now.toISOString();
  }
  p.updatedAt = now.toISOString();
  state.progress[lessonId] = p;

  state.results.push({
    type: 'lesson', ref: lessonId, wpm: result.wpm, rawWpm: result.rawWpm,
    accuracy: result.accuracy, durationMs: result.elapsedMs, stars, at: now.toISOString(),
  });
  if (state.results.length > 300) state.results.splice(0, state.results.length - 300);
  state.keyStats = mergeKeyStats(state.keyStats, result.keyStats || {});
  return state;
}

/** First lesson in course order that has not been passed yet (or the last one). */
export function nextLessonId(index, progress = {}) {
  const order = courseOrder(index);
  const next = order.find((l) => !(progress[l.id]?.stars > 0));
  return (next || order[order.length - 1])?.id ?? null;
}

/** Lesson that follows `lessonId` in course order, or null at the end. */
export function lessonAfter(index, lessonId) {
  const order = courseOrder(index);
  const i = order.findIndex((l) => l.id === lessonId);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}
