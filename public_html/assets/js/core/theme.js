/**
 * Theme handling (light / dark / system). Initial paint is handled by
 * theme-init.js; this module handles changes at runtime.
 */
import { getSetting, setSetting, subscribe } from './store.js';

export const THEMES = ['system', 'light', 'dark'];
const LABELS = { system: 'System', light: 'Light', dark: 'Dark' };
const media = window.matchMedia('(prefers-color-scheme: dark)');

export function applyTheme(pref = getSetting('theme')) {
  const root = document.documentElement;
  const dark = pref === 'dark' || (pref === 'system' && media.matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.themePref = pref;
  document.dispatchEvent(new CustomEvent('kq:themechange', { detail: { pref, dark } }));
}

export function setTheme(pref) {
  if (!THEMES.includes(pref)) return;
  setSetting('theme', pref);
  applyTheme(pref);
}

export function cycleTheme() {
  const current = getSetting('theme');
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  setTheme(next);
  return next;
}

export function themeLabel(pref = getSetting('theme')) {
  return LABELS[pref] || LABELS.system;
}

export function initTheme() {
  media.addEventListener('change', () => {
    if (getSetting('theme') === 'system') applyTheme('system');
  });
  subscribe((state) => applyTheme(state.settings.theme)); // other tabs
}
