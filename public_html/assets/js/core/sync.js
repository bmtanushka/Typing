/**
 * Account sync. When signed in, the local store mirrors the server and every activity is
 * queued as an event (with a unique id, so retries are harmless). The queue survives
 * reloads and offline periods and is flushed with back-off.
 */
import { load, update, subscribe, defaultState } from './store.js';
import { get, post } from './api.js';
import { dayKey } from './rewards.js';

export const currentUserId = () => Number(document.documentElement.dataset.user || 0) || null;
export const isSignedIn = () => currentUserId() !== null;

export const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => ((Math.random() * 16) | (c === 'x' ? 0 : 8)).toString(16)));

/** Build a sync event from an engine/lesson result. */
export function makeEvent(type, ref, result = {}, extra = {}) {
  const now = new Date();
  return {
    id: uuid(), type, ref: ref || '', at: now.toISOString(), day: dayKey(now),
    wpm: result.wpm || 0, rawWpm: result.rawWpm || 0, accuracy: result.accuracy ?? 0,
    durationMs: Math.round(result.elapsedMs || 0), chars: result.keystrokes || 0,
    stars: extra.stars || 0, score: extra.score || 0, xp: extra.xp || 0,
    keyStats: result.keyStats || {}, badges: extra.badges || [], skipped: extra.skipped || [],
  };
}

/** Queue an event (signed-in only) and try to send it. */
export function track(event) {
  if (!isSignedIn()) return;
  update((s) => { s.syncQueue = [...(s.syncQueue || []), event].slice(-300); });
  flush();
}

export function trackSkipped(ids) {
  if (!isSignedIn() || !ids.length) return;
  update((s) => { s.pendingSkipped = [...new Set([...(s.pendingSkipped || []), ...ids])]; });
  flush();
}

/** Replace local progress with the account's (settings: server wins where set). */
export function applyServerState(server, userId = currentUserId()) {
  update((s) => ({
    ...s,
    progress: server.progress || {},
    results: server.results || [],
    keyStats: server.keyStats || {},
    badges: server.badges || {},
    gameScores: server.gameScores || {},
    skipped: server.skipped || {},
    xp: server.xp || 0,
    streak: server.streak || { current: 0, best: 0, lastDay: null },
    settings: { ...s.settings, ...(server.settings || {}) },
    account: { userId },
  }));
  document.dispatchEvent(new CustomEvent('kq:synced'));
}

let inFlight = null;
let retryDelay = 4000;
let retryTimer = null;

export function flush() {
  if (!isSignedIn()) return Promise.resolve();
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const s = load();
    const events = (s.syncQueue || []).slice(0, 50);
    const skipped = s.pendingSkipped || [];
    const settingsDirty = !!s.settingsDirty;
    if (!events.length && !skipped.length && !settingsDirty) return;
    const res = await post('/api/progress/sync', { events, skipped, ...(settingsDirty ? { settings: s.settings } : {}) });
    if (!res.ok) {
      if (res.status === 401) return; // signed out elsewhere – keep the queue for next sign-in
      clearTimeout(retryTimer);
      retryTimer = setTimeout(flush, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 120000);
      return;
    }
    retryDelay = 4000;
    const done = new Set([...(res.accepted || []), ...Object.keys(res.rejected || {})]);
    update((st) => {
      st.syncQueue = (st.syncQueue || []).filter((e) => !done.has(e.id));
      st.pendingSkipped = (st.pendingSkipped || []).filter((id) => !skipped.includes(id));
      if (settingsDirty) st.settingsDirty = false;
    });
    if (!(load().syncQueue || []).length && res.state) applyServerState(res.state);
    else if ((load().syncQueue || []).length) setTimeout(flush, 0);
  })().finally(() => { inFlight = null; });
  return inFlight;
}

function hasGuestData(s) {
  return !s.account?.userId && (Object.keys(s.progress || {}).length > 0 || (s.xp || 0) > 0 ||
    Object.keys(s.badges || {}).length > 0 || Object.keys(s.skipped || {}).length > 0 || (s.results || []).length > 0);
}

/** After login/registration: merge guest progress (once) and load the account. */
export async function completeSignIn(userId) {
  document.documentElement.dataset.user = String(userId);
  const s = load();
  if (hasGuestData(s)) {
    const mergeId = s.mergeId || uuid();
    update((st) => { st.mergeId = mergeId; });
    const { progress, results, keyStats, badges, gameScores, xp, streak, skipped, settings } = load();
    const res = await post('/api/progress/merge', { mergeId, guest: { progress, results, keyStats, badges, gameScores, xp, streak, skipped, settings } });
    if (!res.ok) throw new Error(res.message || 'merge failed');
    applyServerState(res.state, userId);
    update((st) => { delete st.mergeId; });
    return { merged: true };
  }
  const res = await get('/api/progress');
  if (res.ok) applyServerState(res.state, userId);
  return { merged: false };
}

/** Sign out locally: forget this account's data on this device (keep settings). */
export function clearLocalAccount() {
  update((s) => ({ ...defaultState(), settings: s.settings }));
}

/** Runs on every page. */
export async function initSync() {
  const s = load();
  if (!isSignedIn()) {
    // Signed out (or session expired): don't leave someone else's progress on a shared device.
    if (s.account?.userId) clearLocalAccount();
    return;
  }
  if (s.account?.userId !== currentUserId()) {
    await completeSignIn(currentUserId());
  } else {
    await flush();
    if (!(load().syncQueue || []).length) {
      const res = await get('/api/progress');
      if (res.ok) applyServerState(res.state);
    }
  }
  // Push settings changes (debounced).
  let last = JSON.stringify(load().settings);
  let t;
  subscribe((st) => {
    const now = JSON.stringify(st.settings);
    if (now === last) return;
    last = now;
    clearTimeout(t);
    t = setTimeout(() => { update((x) => { x.settingsDirty = true; }); flush(); }, 800);
  });
  window.addEventListener('online', () => flush());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') flush(); });
}
