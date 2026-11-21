/**
 * Accessibility audit (dependency-free): runs in-page checks on every page, light and dark.
 * WCAG 2.2 AA colour contrast, headings, labels, accessible names, landmarks, ids, focus.
 */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8000';
const PAGES = ['/', '/lessons', '/lessons/gs-welcome', '/demo', '/practice', '/test', '/placement', '/games', '/games/key-drops',
  '/progress', '/badges', '/settings', '/login', '/register', '/forgot-password', '/reset-password', '/help', '/privacy', '/no-such-page'];

function audit() {
  const issues = [];
  const add = (rule, el, detail = '') => issues.push(`${rule}: ${describe(el)} ${detail}`.trim());
  const describe = (el) => {
    if (!el || !el.tagName) return '';
    const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}> "${t}"`;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden], [aria-hidden="true"]');
  };

  if (!document.documentElement.lang) add('html-lang', document.documentElement);
  if (!document.querySelector('main')) add('landmark', document.body, 'no <main>');
  if (!document.querySelector('header, [role=banner]')) add('landmark', document.body, 'no banner');
  if (!document.querySelector('nav')) add('landmark', document.body, 'no <nav>');

  const h1s = [...document.querySelectorAll('h1')].filter(visible);
  if (h1s.length !== 1) add('one-h1', document.body, `found ${h1s.length}`);
  let last = 0;
  for (const h of [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(visible)) {
    const lvl = Number(h.tagName[1]);
    if (last && lvl > last + 1) add('heading-order', h, `h${last} → h${lvl}`);
    last = lvl;
  }

  const ids = new Map();
  for (const el of document.querySelectorAll('[id]')) ids.set(el.id, (ids.get(el.id) || 0) + 1);
  for (const [id, n] of ids) if (n > 1) add('duplicate-id', document.getElementById(id), `x${n}`);

  for (const el of document.querySelectorAll('[tabindex]')) if (Number(el.getAttribute('tabindex')) > 0) add('tabindex>0', el);

  const name = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.getAttribute('alt') || '').trim()
    || (el.getAttribute('aria-labelledby') || '').split(' ').map((i) => document.getElementById(i)?.textContent || '').join('').trim()
    || [...el.querySelectorAll('img[alt], svg[aria-label]')].map((i) => i.getAttribute('alt') || i.getAttribute('aria-label')).join('');
  for (const el of document.querySelectorAll('a[href], button, [role=button]')) {
    if (visible(el) && !name(el)) add('accessible-name', el);
  }
  for (const el of document.querySelectorAll('input, select, textarea')) {
    if (el.type === 'hidden' || el.closest('[hidden]')) continue;
    const labelled = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label') ||
      (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`));
    if (!labelled) add('form-label', el);
  }
  for (const el of document.querySelectorAll('img')) if (!el.hasAttribute('alt')) add('img-alt', el);
  for (const el of document.querySelectorAll('svg[role=img]')) if (!el.getAttribute('aria-label')) add('svg-label', el);

  // ---- colour contrast ----
  const parse = (c) => {
    let m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    m = c.match(/color\(srgb ([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number);
      return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1];
    }
    return null;
  };
  const blend = (top, bottom) => {
    const a = top[3];
    return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return null; // image: can't judge
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    let bg = [255, 255, 255, 1];
    for (const l of layers.reverse()) bg = blend(l, bg);
    return bg;
  };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (!t.textContent.trim()) continue;
    const el = t.parentElement;
    if (!el || seen.has(el) || !visible(el) || el.closest('.visually-hidden, canvas, svg, .text-gradient, [disabled], .btn[disabled]')) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (Number(cs.opacity) < 1 || el.closest('.badge-card--locked, .map-node--locked, .typing.is-complete')) continue; // intentionally dimmed / disabled
    const bg = bgOf(el);
    const fgRaw = parse(cs.color);
    if (!bg || !fgRaw) continue;
    const fg = blend(fgRaw, bg);
    const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    const ratio = (l1 + 0.05) / (l2 + 0.05);
    const size = parseFloat(cs.fontSize);
    const bold = Number(cs.fontWeight) >= 700;
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    if (ratio < need) add('contrast', el, `${ratio.toFixed(2)} < ${need}`);
  }
  return issues;
}

(async () => {
  const b = await chromium.launch();
  let total = 0;
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme, locale: 'en-GB', reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    for (const path of PAGES) {
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      await p.waitForTimeout(150);
      const issues = await p.evaluate(audit);
      // Keyboard focus must be visible on the first few tab stops.
      for (let i = 0; i < 6; i++) {
        await p.keyboard.press('Tab');
        const ok = await p.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return true;
          const cs = getComputedStyle(el);
          return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
        });
        if (!ok) issues.push(`focus-visible: ${await p.evaluate(() => document.activeElement.outerHTML.slice(0, 80))}`);
      }
      const unique = [...new Set(issues)];
      total += unique.length;
      console.log(`${unique.length ? '✗' : '✓'} [${scheme}] ${path}${unique.length ? '\n    ' + unique.slice(0, 12).join('\n    ') : ''}`);
    }

    // Second pass: pages with saved progress (charts, stars, badges, a lesson mid-typing).
    await p.evaluate(() => {
      const now = Date.now();
      const results = Array.from({ length: 12 }, (_, i) => ({ type: i % 3 ? 'lesson' : 'test', ref: i % 3 ? 'hr-fj' : 'test-1min', wpm: 12 + i * 2, rawWpm: 14 + i * 2, accuracy: 88 + (i % 10), durationMs: 60000, chars: 120, stars: 2, at: new Date(now - (12 - i) * 86400000).toISOString() }));
      localStorage.setItem('keyquest.v1', JSON.stringify({
        schemaVersion: 1, settings: { theme: 'system' }, xp: 420,
        progress: { 'gs-welcome': { stars: 3, attempts: 1 }, 'gs-home': { stars: 2, attempts: 1 }, 'hr-fj': { stars: 2, bestWpm: 18, bestAccuracy: 95, attempts: 3 } },
        results, keyStats: { f: { attempts: 40, errors: 2, latencyTotal: 0, latencyCount: 0 }, j: { attempts: 40, errors: 12, latencyTotal: 0, latencyCount: 0 }, d: { attempts: 30, errors: 6, latencyTotal: 0, latencyCount: 0 } },
        badges: { 'first-steps': new Date().toISOString(), 'hat-trick': new Date().toISOString() }, gameScores: { 'key-drops': 140 },
        streak: { current: 2, best: 3, lastDay: new Date().toISOString().slice(0, 10) }, skipped: {}, ui: {},
      }));
    });
    for (const [path, action] of [['/progress'], ['/lessons'], ['/badges'], ['/games'], ['/test'], ['/lessons/hr-dk', 'start']]) {
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      if (action === 'start') { await p.keyboard.press('Enter'); await p.waitForSelector('.typing .ch'); await p.keyboard.type('ddx'); }
      await p.waitForTimeout(200);
      const unique = [...new Set(await p.evaluate(audit))];
      total += unique.length;
      console.log(`${unique.length ? '✗' : '✓'} [${scheme}, with progress] ${path}${action ? ' (typing)' : ''}${unique.length ? '\n    ' + unique.slice(0, 12).join('\n    ') : ''}`);
    }
    await ctx.close();
  }
  await b.close();
  console.log(`\n${total} issue(s)`);
  process.exit(total ? 1 : 0);
})();
