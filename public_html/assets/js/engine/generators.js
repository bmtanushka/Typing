/**
 * Practice-text generators – pure functions, seeded RNG for repeatable tests.
 * All output is lower-case, single-spaced and uses only the allowed characters.
 */

/** Small, fast, seedable PRNG (mulberry32). Returns () => float in [0, 1). */
export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (arr, r) => arr[Math.floor(r() * arr.length)];

export function shuffle(arr, r) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const tidy = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * Key introduction: each key typed alone in small groups.
 * keyRepeats(['f','j'], {rounds: 2, groupSize: 3}) → "fff jjj fff jjj"
 */
export function keyRepeats(keys, { rounds = 2, groupSize = 3 } = {}) {
  const out = [];
  for (let r = 0; r < rounds; r++) for (const k of keys) out.push(k.repeat(groupSize));
  return out.join(' ');
}

/**
 * Pattern drill mixing focus keys with already-learnt keys,
 * e.g. focus [d,k] + pool [f,j] → "dkf jdk kfd …"
 */
export function patternDrill(focus, pool, { length = 48, minGroup = 2, maxGroup = 4, focusBias = 0.6, r = createRng() } = {}) {
  const others = [...new Set(pool)].filter((c) => c !== ' ' && !focus.includes(c));
  const out = [];
  let len = 0;
  while (len < length) {
    const size = minGroup + Math.floor(r() * (maxGroup - minGroup + 1));
    let g = '';
    for (let i = 0; i < size; i++) {
      g += others.length && r() > focusBias ? pick(others, r) : pick(focus, r);
    }
    if (!/[^\s]/.test(g)) continue;
    if (!focus.some((f) => g.includes(f))) g = pick(focus, r) + g.slice(1);
    out.push(g);
    len += g.length + 1;
  }
  return tidy(out.join(' '));
}

/** Words that use only allowed characters. */
export function filterWords(words, allowed) {
  const set = allowed instanceof Set ? allowed : new Set(allowed);
  return words.filter((w) => w.length > 0 && [...w].every((c) => set.has(c)));
}

/**
 * Real words using only allowed keys, favouring words that contain focus keys.
 * Falls back to pronounceable-ish pattern groups when too few words exist.
 */
export function wordDrill(words, allowed, focus = [], { count = 12, focusBias = 0.7, r = createRng() } = {}) {
  const usable = filterWords(words, allowed);
  if (usable.length < 4) {
    return patternDrill(focus.length ? focus : [...allowed].filter((c) => c !== ' '), [...allowed], { length: count * 4, r });
  }
  const withFocus = usable.filter((w) => focus.some((f) => w.includes(f)));
  const out = [];
  let last = '';
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const from = withFocus.length && r() < focusBias ? withFocus : usable;
    const w = pick(from, r);
    if (w === last) continue;
    out.push(w);
    last = w;
  }
  return out.join(' ');
}

/**
 * Drill weighted towards weak keys. weights: { char: number } (e.g. error rates).
 * Groups combine a weak key with other allowed keys so it is practised in context.
 */
export function weightedDrill(weights, allowed, { length = 60, r = createRng() } = {}) {
  const pool = [...allowed].filter((c) => c !== ' ' && c !== '\n');
  const entries = Object.entries(weights).filter(([c, w]) => w > 0 && pool.includes(c));
  if (!entries.length) return patternDrill(pool, pool, { length, r });
  const total = entries.reduce((t, [, w]) => t + w, 0);
  const pickWeighted = () => {
    let x = r() * total;
    for (const [c, w] of entries) if ((x -= w) <= 0) return c;
    return entries[entries.length - 1][0];
  };
  const out = [];
  let len = 0;
  while (len < length) {
    const weak = pickWeighted();
    const size = 3 + Math.floor(r() * 2);
    const chars = [weak, weak];
    while (chars.length < size) chars.push(pick(pool, r));
    const g = shuffle(chars, r).join('');
    out.push(g);
    len += g.length + 1;
  }
  return tidy(out.join(' '));
}

/* ---------------------------------------------------------------------------
 * Word-text transforms for later units (capitals, sentences, numbers).
 * Each only uses characters in `allowed`, so lessons stay within learnt keys.
 * ------------------------------------------------------------------------- */

/** Capitalise the first letter of roughly `ratio` of the words (only capitals that are allowed). */
export function capitaliseWords(text, allowed, { ratio = 0.5, r = createRng() } = {}) {
  const set = allowed instanceof Set ? allowed : new Set(allowed);
  return text.split(' ').map((w) => {
    const cap = w.charAt(0).toUpperCase() + w.slice(1);
    return set.has(cap.charAt(0)) && cap !== w && (ratio >= 1 || r() < ratio) ? cap : w;
  }).join(' ');
}

/** Turn a word list into sentences of 4–8 words: Capital start, full stop end. */
export function toSentences(text, allowed, { r = createRng() } = {}) {
  const set = allowed instanceof Set ? allowed : new Set(allowed);
  const words = text.split(' ').filter(Boolean);
  const out = [];
  let i = 0;
  while (i < words.length) {
    const n = Math.min(words.length - i, 4 + Math.floor(r() * 5));
    const s = words.slice(i, i + n);
    i += n;
    s[0] = capitaliseWords(s[0], set, { ratio: 1, r });
    out.push(s.join(' ') + (set.has('.') ? '.' : ''));
  }
  return out.join(' ');
}

/** Mix numbers (1–4 digits, using allowed digits) in between words. */
export function sprinkleNumbers(text, allowed, { ratio = 0.35, r = createRng() } = {}) {
  const digits = [...(allowed instanceof Set ? allowed : new Set(allowed))].filter((c) => /[0-9]/.test(c));
  if (!digits.length) return text;
  return text.split(' ').map((w) => {
    if (r() >= ratio) return w;
    const len = 1 + Math.floor(r() * 4);
    let n = '';
    for (let i = 0; i < len; i++) n += pick(digits, r);
    return `${n} ${w}`;
  }).join(' ');
}
