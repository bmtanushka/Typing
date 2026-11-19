/**
 * Typing statistics – pure functions, no DOM. Unit-tested in tests/js.
 *
 * Definitions (industry standard, 1 "word" = 5 characters):
 *   WPM      = (correct characters / 5) / minutes
 *   raw WPM  = (all typed characters / 5) / minutes
 *   accuracy = (keystrokes - errors) / keystrokes × 100
 */

export const CHARS_PER_WORD = 5;

/** Round to n decimal places (avoids 0.1 + 0.2 noise in results). */
export function round(value, places = 0) {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

export function wpm(chars, elapsedMs) {
  if (!(elapsedMs > 0) || chars <= 0) return 0;
  return (chars / CHARS_PER_WORD) / (elapsedMs / 60000);
}

export function accuracy(keystrokes, errors) {
  if (keystrokes <= 0) return 100;
  return Math.max(0, ((keystrokes - errors) / keystrokes) * 100);
}

/**
 * @param {{correctChars:number, keystrokes:number, errors:number, elapsedMs:number}} s
 * @returns {{wpm:number, rawWpm:number, accuracy:number, errors:number, keystrokes:number, elapsedMs:number}}
 */
export function computeStats({ correctChars = 0, keystrokes = 0, errors = 0, elapsedMs = 0 }) {
  return {
    wpm: round(wpm(correctChars, elapsedMs)),
    rawWpm: round(wpm(keystrokes, elapsedMs)),
    accuracy: round(accuracy(keystrokes, errors), 1),
    errors,
    keystrokes,
    elapsedMs: Math.round(elapsedMs),
  };
}

/** "m:ss" for timers. */
export function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/* ---------------------------------------------------------------------------
 * Per-key statistics
 * Shape: { [char]: { attempts, errors, latencyTotal, latencyCount } }
 * ------------------------------------------------------------------------- */

/** Record one keystroke against the EXPECTED character (mutates and returns stats). */
export function recordKey(stats, expected, correct, latencyMs = null) {
  const s = stats[expected] || (stats[expected] = { attempts: 0, errors: 0, latencyTotal: 0, latencyCount: 0 });
  s.attempts += 1;
  if (!correct) s.errors += 1;
  // Only sensible latencies count (ignore first keystroke and long pauses).
  if (latencyMs != null && latencyMs > 0 && latencyMs < 5000) {
    s.latencyTotal += latencyMs;
    s.latencyCount += 1;
  }
  return stats;
}

/** Combine two key-stat objects (e.g. a session into saved progress). Pure. */
export function mergeKeyStats(a = {}, b = {}) {
  const out = structuredClone(a);
  for (const [ch, s] of Object.entries(b)) {
    const t = out[ch] || (out[ch] = { attempts: 0, errors: 0, latencyTotal: 0, latencyCount: 0 });
    t.attempts += s.attempts || 0;
    t.errors += s.errors || 0;
    t.latencyTotal += s.latencyTotal || 0;
    t.latencyCount += s.latencyCount || 0;
  }
  return out;
}

export function avgLatency(s) {
  return s && s.latencyCount ? s.latencyTotal / s.latencyCount : 0;
}

/**
 * Weakest keys first: ranked by error rate, then by average latency.
 * Spaces are excluded (not a useful "problem key" to drill).
 * @returns {Array<{char, attempts, errors, errorRate, avgLatencyMs}>}
 */
export function problemKeys(stats, { minAttempts = 3, limit = 5, minErrorRate = 0.05 } = {}) {
  return Object.entries(stats)
    .filter(([ch, s]) => ch !== ' ' && ch !== '\n' && s.attempts >= minAttempts)
    .map(([ch, s]) => ({
      char: ch,
      attempts: s.attempts,
      errors: s.errors,
      errorRate: round(s.errors / s.attempts, 3),
      avgLatencyMs: Math.round(avgLatency(s)),
    }))
    .filter((k) => k.errorRate >= minErrorRate)
    .sort((a, b) => b.errorRate - a.errorRate || b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, limit);
}
