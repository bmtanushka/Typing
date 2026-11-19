/**
 * Style guide (dev only): live swatches and theme picker.
 */
import { setTheme } from '../core/theme.js';
import { getSetting } from '../core/store.js';

function toHex(colour) {
  const m = colour.match(/rgba?\(([^)]+)\)/);
  if (!m) return colour.trim();
  const [r, g, b] = m[1].split(/[\s,/]+/).map(Number);
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function paintSwatches() {
  document.querySelectorAll('[data-swatch]').forEach((chip) => {
    chip.style.background = `var(${chip.dataset.swatch})`;
    const out = document.querySelector(`[data-swatch-value="${chip.dataset.swatch}"]`);
    if (out) out.textContent = toHex(getComputedStyle(chip).backgroundColor);
  });
}

const picker = document.querySelector('[data-theme-picker]');
if (picker) {
  const current = picker.querySelector(`input[value="${getSetting('theme')}"]`);
  if (current) current.checked = true;
  picker.addEventListener('change', (e) => setTheme(e.target.value));
  document.addEventListener('kq:themechange', (e) => {
    const input = picker.querySelector(`input[value="${e.detail.pref}"]`);
    if (input) input.checked = true;
  });
}

document.querySelector('[data-sg-form]')?.addEventListener('submit', (e) => e.preventDefault());
document.querySelectorAll('a[aria-disabled="true"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

paintSwatches();
document.addEventListener('kq:themechange', () => requestAnimationFrame(paintSwatches));
