/**
 * Error states: when the API can't be reached, pages explain kindly instead of going blank.
 */
const { chromium } = require('playwright');
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('  ok', m); };
const BASE = process.env.BASE || 'http://localhost:8000';

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ locale: 'en-GB' });
  const p = await ctx.newPage();
  await p.route('**/api/**', (route) => route.abort('internetdisconnected'));
  for (const path of ['/progress', '/practice', '/test', '/games/key-drops', '/lessons']) {
    await p.goto(BASE + path);
    await p.waitForSelector('[data-page-error]', { timeout: 8000 });
    assert(await p.isVisible('[data-page-error] button'), `${path}: friendly error with a Try again button`);
  }
  await p.goto(BASE + '/lessons/gs-welcome');
  await p.waitForSelector('.alert--danger');
  assert((await p.textContent('.alert--danger')).includes('could not load'), 'lesson page: friendly error');
  await p.unroute('**/api/**');
  await p.goto(BASE + '/progress');
  await p.waitForSelector('[data-dash-empty]:not([hidden]), [data-dash-content]:not([hidden])');
  assert(!(await p.$('[data-page-error]')), 'back online: page works again');
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
