const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS || require('path').join(__dirname, 'shots'); require('fs').mkdirSync(SHOTS, { recursive: true });
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('  ok', m); };
const BASE = process.env.BASE || (process.env.BASE || 'http://localhost:8000') + '';
async function typeCurrent(p, { mistakes = 0 } = {}) {
  await p.waitForSelector('.typing .ch');
  const text = await p.evaluate(() => [...document.querySelectorAll('.typing .ch')].map(s => s.classList.contains('ch--space') ? ' ' : s.textContent).join(''));
  for (let i = 0; i < mistakes; i++) await p.keyboard.type('q');
  await p.keyboard.type(text, { delay: 8 });
  return text;
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push(e.message));

  // Home → Start typing goes straight to the first lesson
  await p.goto(BASE + '/');
  await p.click('[data-start-link]');
  await p.waitForURL('**/lessons/gs-welcome');
  await p.waitForSelector('[data-start]');
  await p.screenshot({ path: SHOTS + '/l-intro-welcome.png' });
  await p.keyboard.press('Enter');                       // start lesson
  await p.waitForSelector('.info');
  assert(await p.textContent('.step-head__title') === 'Sit tall and relaxed', 'step 1 info');
  await p.screenshot({ path: SHOTS + '/l-info-posture.png' });
  await p.keyboard.press(' ');                           // continue via space
  await p.waitForFunction(() => document.querySelector('.step-head__title')?.textContent === 'Eyes on the screen');
  await p.keyboard.press(' ');
  await p.waitForFunction(() => document.querySelector('.step-head__title')?.textContent === 'How lessons work');
  await p.keyboard.press(' ');
  await p.waitForSelector('.typing');
  await p.keyboard.type('     ', { delay: 30 });
  await p.waitForSelector('.results');
  assert((await p.textContent('.results__pip')).length > 10, 'tutorial results with Pip message');
  await p.screenshot({ path: SHOTS + '/l-results-welcome.png' });

  // Next lesson: gs-home with waitFor keys
  await p.click('[data-next]');
  await p.waitForURL('**/lessons/gs-home');
  await p.waitForSelector('[data-start]'); await p.keyboard.press('Enter');
  await p.waitForSelector('.checklist');
  await p.waitForTimeout(50); // key handlers attach one tick after the screen renders
  assert(await p.isHidden('[data-continue]'), 'continue hidden until keys pressed');
  await p.keyboard.press('f'); await p.keyboard.press('j');
  await p.waitForSelector('[data-continue]:not([hidden])');
  assert(await p.$$eval('.checklist li.is-done', l => l.length) === 2, 'both keys ticked');
  await p.keyboard.press('Enter');
  await p.waitForSelector('.checklist li[data-k=";"]');
  await p.waitForTimeout(50);
  await p.screenshot({ path: SHOTS + '/l-info-hands.png' });
  for (const k of 'asdfjkl;') await p.keyboard.press(k === ';' ? 'Semicolon' : k);
  await p.waitForSelector('[data-continue]:not([hidden])'); await p.keyboard.press('Enter');
  await typeCurrent(p);
  await p.waitForSelector('.between'); await p.keyboard.press('Enter');
  await typeCurrent(p);
  await p.waitForSelector('.results');
  assert(await p.$$eval('.player__step.is-done', l => l.length) === 4, 'step indicator complete');

  // hr-fj: full lesson with a few mistakes
  await p.click('[data-next]');
  await p.waitForURL('**/lessons/hr-fj');
  await p.waitForSelector('.intro__keys');
  assert((await p.textContent('.intro__keys')).includes('Left index finger'), 'intro names the finger');
  await p.screenshot({ path: SHOTS + '/l-intro-fj.png' });
  await p.keyboard.press('Enter');
  await p.waitForSelector('.typing--large');
  await p.screenshot({ path: SHOTS + '/l-keys-fj.png' });
  await typeCurrent(p, { mistakes: 1 });          // keys step (stopOnError) with one miss
  await p.waitForSelector('.between'); await p.keyboard.press('Enter');
  await typeCurrent(p); await p.waitForSelector('.between'); await p.keyboard.press('Enter');
  const drill = await typeCurrent(p);
  assert(/^[fj ]+$/.test(drill), 'generated drill uses only f, j and space: ' + drill);
  await p.waitForSelector('.between'); await p.keyboard.press('Enter');
  await p.waitForSelector('.kb.is-faded');
  assert(true, 'challenge fades keyboard hints');
  await p.screenshot({ path: SHOTS + '/l-challenge.png' });
  await typeCurrent(p);
  await p.waitForSelector('.results');
  const stars = await p.$$eval('.result-star.is-on', l => l.length);
  assert(stars === 3, 'three stars with near-perfect accuracy: ' + stars);
  await p.waitForTimeout(900);
  await p.screenshot({ path: SHOTS + '/l-results-fj.png' });

  // Retry works, then fail checkpoint deliberately
  await p.click('[data-retry]');
  await p.waitForSelector('.typing--large');
  assert(true, 'retry restarts at step 1');
  await p.goto(BASE + '/lessons/hr-check');
  await p.waitForSelector('[data-start]'); await p.keyboard.press('Enter');
  assert(await p.isHidden('[data-guides]'), 'checkpoint hides keyboard');
  for (let s = 0; s < 2; s++) {
    await p.waitForSelector('.typing .ch');
    const t = await p.evaluate(() => [...document.querySelectorAll('.typing .ch')].map(s => s.classList.contains('ch--space') ? ' ' : s.textContent).join(''));
    await p.keyboard.type(t.replace(/a/g, 'q'), { delay: 3 });   // lots of errors
    if (s === 0) { await p.waitForSelector('.between'); await p.keyboard.press('Enter'); }
  }
  await p.waitForSelector('.results');
  assert(await p.$$eval('.result-star.is-on', l => l.length) === 0, 'failed checkpoint gives no stars');
  assert((await p.textContent('.results__message')).includes('90% accuracy'), 'kind message names pass mark');
  assert(await p.$('[data-next]') === null, 'no Next button when not passed');
  assert(await p.$('.results__problem'), 'problem keys listed');
  await p.screenshot({ path: SHOTS + '/l-results-fail.png', fullPage: true });

  // Map shows progress
  await p.goto(BASE + '/lessons');
  await p.waitForSelector('.map-node--done');
  assert(await p.$$eval('.map-node--done', l => l.length) === 3, '3 lessons done on map');
  assert(await p.$eval('[data-lesson="hr-dk"]', n => n.classList.contains('map-node--current')), 'D and K is next');
  assert((await p.textContent('[data-continue-title]')) === 'D and K', 'continue card');
  await p.screenshot({ path: SHOTS + '/l-map.png', fullPage: true });

  // Home start link now continues
  await p.goto(BASE + '/');
  await p.waitForFunction(() => document.querySelector('[data-start-link]').href.endsWith('/lessons/hr-dk'));
  assert(true, 'home Continue points to next lesson');

  await p.emulateMedia({ colorScheme: 'dark' });
  await p.goto(BASE + '/lessons'); await p.waitForSelector('.map-node--done');
  await p.screenshot({ path: SHOTS + '/l-map-dark.png' });
  await p.setViewportSize({ width: 390, height: 900 });
  await p.goto(BASE + '/lessons/hr-dk'); await p.waitForSelector('[data-start]');
  await p.screenshot({ path: SHOTS + '/l-intro-mobile.png', fullPage: true });
  console.log('console errors:', errs.length ? errs : 'none');
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
