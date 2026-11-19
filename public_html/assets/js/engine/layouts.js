/**
 * Keyboard layouts: loading (browser) + pure lookup helpers (unit-tested).
 * Layout data lives in /content/layouts/<id>.json and is served by /api/layouts/<id>.
 */

export const LAYOUTS = { uk: 'UK QWERTY', us: 'US QWERTY' };

export const FINGER_NAMES = {
  lp: 'left little finger', lr: 'left ring finger', lm: 'left middle finger', li: 'left index finger',
  ri: 'right index finger', rm: 'right middle finger', rr: 'right ring finger', rp: 'right little finger',
  th: 'thumb',
};

export const LEFT_HAND = new Set(['lp', 'lr', 'lm', 'li']);

/** Default layout from the browser locale: UK/Ireland → uk, everything else → us. */
export function detectLayout(languages = (typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [])) {
  for (const lang of languages || []) {
    if (/^en-(GB|IE|IM|JE|GG)$/i.test(lang)) return 'uk';
    if (/^en-(US|CA|AU|NZ|PH|IN|ZA)$/i.test(lang)) return 'us';
  }
  return 'us';
}

/**
 * Build char → { code, finger, shift, shiftCode, altGr } for one layout.
 * Shift is taken with the opposite hand (good touch-typing technique).
 */
export function buildCharMap(layout) {
  const map = new Map();
  for (const row of layout.rows) {
    for (const key of row) {
      if (key.special) continue;
      const shiftCode = LEFT_HAND.has(key.finger) ? 'ShiftRight' : 'ShiftLeft';
      if (key.base != null && !map.has(key.base)) {
        map.set(key.base, { code: key.code, finger: key.finger, shift: false, shiftCode: null, altGr: false });
      }
      if (key.shift != null && !map.has(key.shift)) {
        map.set(key.shift, { code: key.code, finger: key.finger, shift: true, shiftCode, altGr: false });
      }
    }
  }
  for (const [code, ch] of Object.entries(layout.altGr || {})) {
    const key = layout.rows.flat().find((k) => k.code === code);
    if (key && !map.has(ch)) map.set(ch, { code, finger: key.finger, shift: false, shiftCode: null, altGr: true });
  }
  map.set(' ', { code: 'Space', finger: 'th', shift: false, shiftCode: null, altGr: false });
  map.set('\n', { code: 'Enter', finger: 'rp', shift: false, shiftCode: null, altGr: false });
  return map;
}

/** Fingers involved in typing a character (key finger + Shift finger). */
export function fingersFor(info) {
  if (!info) return [];
  const f = [info.finger];
  if (info.shift) f.push(info.shiftCode === 'ShiftLeft' ? 'lp' : 'rp');
  return f;
}

/** Friendly hint, e.g. "Use your left middle finger for D." */
export function hintFor(char, info) {
  if (!info) return '';
  const label = char === ' ' ? 'the space bar' : char === '\n' ? 'Enter' : `“${char}”`;
  if (info.finger === 'th') return 'Tap the space bar with either thumb.';
  let msg = `Use your ${FINGER_NAMES[info.finger]} for ${label}`;
  if (info.shift) msg += `, holding ${info.shiftCode === 'ShiftLeft' ? 'left' : 'right'} Shift with your other little finger`;
  if (info.altGr) msg += ', holding Alt Gr';
  return msg + '.';
}

/* ---- Browser loading ---------------------------------------------------- */
const cache = new Map();

export function loadLayout(id) {
  if (!LAYOUTS[id]) id = 'us';
  if (!cache.has(id)) {
    const base = document.documentElement.dataset.base || '';
    cache.set(id, fetch(`${base}/api/layouts/${id}`, { headers: { Accept: 'application/json' } })
      .then((r) => {
        if (!r.ok) throw new Error(`Layout ${id} failed to load (${r.status})`);
        return r.json();
      })
      .catch((e) => {
        cache.delete(id);
        throw e;
      }));
  }
  return cache.get(id);
}
