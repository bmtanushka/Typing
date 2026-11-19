/**
 * Guest store: all local state in one versioned localStorage key.
 *
 * Shape is versioned via `schemaVersion`; add a migration to MIGRATIONS
 * whenever the shape changes. Never throw if storage is unavailable –
 * fall back to an in-memory copy so the app still works (e.g. private mode).
 */

export const STORAGE_KEY = 'keyquest.v1';
export const SCHEMA_VERSION = 1;

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    settings: {
      theme: 'system',        // light | dark | system
      fontSize: 'normal',     // small | normal | large | xlarge
      layout: null,           // 'uk' | 'us' – null = detect from browser locale
      sound: false,
      showKeyboard: true,
      showHands: true,
      allowBackspace: true,
    },
    progress: {},             // lessonId -> { stars, bestWpm, bestAccuracy, attempts, completedAt }
    results: [],              // recent results (capped)
    keyStats: {},             // char -> { attempts, errors, totalLatencyMs }
    badges: {},               // badgeId -> earnedAt
    gameScores: {},           // gameId -> bestScore
    xp: 0,
    streak: { current: 0, best: 0, lastDay: null },
  };
}

/**
 * Migrations keyed by the version they upgrade FROM.
 * e.g. 1: (s) => ({ ...s, newField: [], schemaVersion: 2 })
 */
const MIGRATIONS = {};

/** Bring any stored object up to the current schema (pure – unit-testable). */
export function migrate(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;

  let state = { ...raw };
  let v = Number.isInteger(state.schemaVersion) ? state.schemaVersion : 1;
  while (v < SCHEMA_VERSION && MIGRATIONS[v]) {
    state = MIGRATIONS[v](state);
    v = state.schemaVersion;
  }
  // Fill in any missing keys from the defaults (shallow + settings).
  return {
    ...base,
    ...state,
    settings: { ...base.settings, ...(state.settings || {}) },
    schemaVersion: SCHEMA_VERSION,
  };
}

let memory = null;
const listeners = new Set();

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false; // quota exceeded or blocked – keep in memory
  }
}

export function load() {
  if (!memory) memory = migrate(readStorage());
  return memory;
}

/** Apply a mutation function and persist. Returns the new state. */
export function update(mutator) {
  const draft = structuredClone(load());
  const next = mutator(draft) || draft;
  memory = next;
  writeStorage(next);
  listeners.forEach((fn) => fn(next));
  return next;
}

export function getSetting(key) {
  return load().settings[key];
}

export function setSetting(key, value) {
  return update((s) => { s.settings[key] = value; });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* Keep tabs in sync. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    memory = migrate(readStorage());
    listeners.forEach((fn) => fn(memory));
  });
}
