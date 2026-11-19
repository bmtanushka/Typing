/**
 * Settings page: every control saves immediately to the guest store.
 */
import { load, update, defaultState } from '../core/store.js';
import { setTheme } from '../core/theme.js';
import { play } from '../core/sound.js';

const form = document.querySelector('[data-settings]');
const saved = document.querySelector('[data-saved]');
const s = load().settings;

form.querySelector(`input[name="theme"][value="${s.theme}"]`)?.setAttribute('checked', '');
form.querySelector(`input[name="fontSize"][value="${s.fontSize || 'normal'}"]`)?.setAttribute('checked', '');
form.layout.value = s.layout || 'auto';
for (const name of ['showKeyboard', 'showHands', 'allowBackspace', 'sound']) form[name].checked = !!s[name];

let savedTimer;
function flashSaved() {
  saved.hidden = false;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => (saved.hidden = true), 1800);
}

form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('change', (e) => {
  const { name, value, checked, type } = e.target;
  if (name === 'theme') return setTheme(value), flashSaved();
  update((st) => {
    if (name === 'fontSize') st.settings.fontSize = value;
    else if (name === 'layout') st.settings.layout = value === 'auto' ? null : value;
    else if (type === 'checkbox') st.settings[name] = checked;
  });
  if (name === 'fontSize') {
    if (value === 'normal') document.documentElement.removeAttribute('data-font-size');
    else document.documentElement.dataset.fontSize = value;
  }
  if (name === 'sound' && checked) play('success', { force: true });
  flashSaved();
});

document.querySelector('[data-test-sound]').addEventListener('click', () => play('success', { force: true }));

document.querySelector('[data-export]').addEventListener('click', () => {
  const data = JSON.stringify({ exportedAt: new Date().toISOString(), app: 'KeyQuest', data: load() }, null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `keyquest-progress-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const dialog = document.querySelector('[data-reset-dialog]');
document.querySelector('[data-reset]').addEventListener('click', () => dialog.showModal());
dialog.addEventListener('close', () => {
  if (dialog.returnValue !== 'reset') return;
  update((st) => ({ ...defaultState(), settings: st.settings }));
  saved.textContent = 'Progress reset';
  flashSaved();
});
