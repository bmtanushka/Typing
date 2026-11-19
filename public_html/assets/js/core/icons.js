/**
 * Original 24×24 line icons for badges and stats (stroke = currentColor).
 * Returned as SVG markup strings – static, trusted content only.
 */
const P = {
  footsteps: '<path d="M7 4c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5z"/><path d="M5 17h4"/><path d="M17 8c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5z"/><path d="M15 21h4"/>',
  rocket: '<path d="M12 2c4 3 5 7 4 12l-4 3-4-3c-1-5 0-9 4-12z"/><circle cx="12" cy="9" r="2"/><path d="M8 14l-3 3 1 3 3-2M16 14l3 3-1 3-3-2M10 20l2 2 2-2"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 14v4M8 21h8M9 18h6"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  stars: '<path d="M12 3l2 4 4.5.6-3.3 3.1.8 4.5L12 13l-4 2.2.8-4.5L5.5 7.6 10 7z"/><path d="M5 18l1 2 2 .3-1.5 1.4.4 2L5 22.6 3.1 23.7l.4-2L2 20.3l2-.3zM19 18l1 2 2 .3-1.5 1.4.4 2-1.9-1.1-1.9 1.1.4-2-1.5-1.4 2-.3z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><path d="M21 3l-7 7M17 3h4v4"/>',
  gem: '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 6 3-6M12 21l-3-12M12 21l3-12"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-5-4-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z"/><path d="M12 22c-2 0-3-1.5-3-3.5S11 15 12 13c1 2 3 3.5 3 5.5S14 22 12 22z"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  medal: '<path d="M8 2l4 7 4-7M6 2h4M14 2h4"/><circle cx="12" cy="15" r="6"/><path d="M12 12l1 2 2 .3-1.5 1.4.4 2L12 16.7l-1.9 1 .4-2L9 14.3l2-.3z"/>',
  gamepad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 13h.01"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
};

export function icon(name, { size = 24, label = '', cls = '' } = {}) {
  const body = P[name] || P.star;
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`;
}

export const ICONS = Object.keys(P);
