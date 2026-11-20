const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS || require('path').join(__dirname, 'shots'); require('fs').mkdirSync(SHOTS, { recursive: true });
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('  ok', m); };
const BASE = process.env.BASE || 'http://localhost:8000';
const textOf = (p) => p.evaluate(() => [...document.querySelectorAll('.typing .ch')].map((s) => (s.classList.contains('ch--space') ? ' ' : s.textContent)).join(''));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', (e) => errs.push(e.message));
  await p.clock.install(); // virtual time: one-minute tests finish instantly

  // The map shows all ten units
  await p.goto(BASE + '/lessons');
  await p.waitForSelector('[data-lesson="gs-welcome"].map-node--current');
  assert(await p.$$eval('[data-unit]', (l) => l.length) === 10, 'ten units on the map');
  assert(await p.$eval('[data-lesson="cs-left-shift"] .map-node__disc', (d) => d.textContent.trim()) === '⇧ J', 'short map labels for many-key lessons');

  // Placement test → skip ahead
  await p.goto(BASE + '/placement');
  await p.click('[data-placement-start]');
  await p.waitForSelector('.typing .ch');
  const placementText = await textOf(p);
  await p.keyboard.type(placementText.slice(0, 250), { delay: 5 });
  await p.clock.fastForward(5000);     // 250 chars in 5 s ≈ 60 WPM pace at accuracy 100%
  await p.clock.fastForward(56000);
  await p.waitForSelector('[data-placement-result]:not([hidden])');
  const skipped = await p.$$eval('[data-pl-units] li', (l) => l.map((x) => x.textContent));
  assert(skipped.length >= 6, 'placement recommends skipping units: ' + skipped.join(', '));
  await p.screenshot({ path: SHOTS + '/p5-placement.png' });
  await p.click('[data-pl-apply]');
  await p.waitForURL(/\/lessons\/(cs|pu|nu|sy|rw)-/);
  assert(true, 'skip ahead lands on the next lesson: ' + p.url());

  // Capitals lesson: Shift highlight on the opposite hand
  await p.goto(BASE + '/lessons/cs-left-shift');
  await p.waitForSelector('.intro__keys--many');
  await p.screenshot({ path: SHOTS + '/p5-capitals-intro.png' });
  await p.keyboard.press('Enter');
  await p.waitForSelector('.typing .ch');
  assert(await p.$('.kb__key.is-next[data-code="KeyY"]') && await p.$('.kb__key.is-next[data-code="ShiftLeft"]'), 'capital Y lights Y + left Shift');
  await p.keyboard.type((await textOf(p)), { delay: 5 });
  await p.waitForSelector('.between');
  assert(true, 'capital letters typed with Shift');

  // Speed unit is still locked (real-world practice is never skipped by placement)
  await p.goto(BASE + '/lessons/sp-one-minute');
  await p.waitForSelector('.locked');
  assert(true, 'speed building stays locked after placement');
  await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('keyquest.v1'));
    for (const id of ['rw-sentences', 'rw-story', 'rw-email', 'rw-quotes', 'rw-check', 'sp-rhythm']) s.skipped[id] = true;
    localStorage.setItem('keyquest.v1', JSON.stringify(s));
  });

  // Timed lesson step shows a countdown and finishes on time
  await p.goto(BASE + '/lessons/sp-one-minute');
  await p.waitForSelector('[data-start]');
  await p.keyboard.press('Enter');
  await p.waitForSelector('.player__timer');
  const t = await textOf(p);
  await p.keyboard.type(t.slice(0, 120), { delay: 5 });
  await p.clock.fastForward(61000);
  await p.waitForSelector('.between');
  assert(true, 'one-minute lesson step ends when the time is up');

  // Typing test (1 minute) + history
  await p.goto(BASE + '/test');
  await p.click('[data-minutes="1"]');
  await p.waitForSelector('.typing .ch');
  const tt = await textOf(p);
  await p.keyboard.type(tt.slice(0, 200), { delay: 5 });
  await p.clock.fastForward(61000);
  await p.waitForSelector('[data-results]:not([hidden])');
  assert(Number(await p.textContent('[data-results] [data-r="wpm"]')) > 0, 'test result WPM shown');
  await p.waitForSelector('[data-history] .chart__dot');
  assert(true, 'test history chart updated');
  await p.screenshot({ path: SHOTS + '/p5-test.png', fullPage: true });

  // Practice: own text (with smart quotes) and problem keys
  await p.goto(BASE + '/practice?mode=own');
  await p.fill('#pr-own', 'It’s a “lovely” day – isn’t it?');
  await p.click('[data-use-own]');
  await p.waitForSelector('.typing .ch');
  const own = await textOf(p);
  assert(own === 'It\'s a "lovely" day - isn\'t it?', 'smart punctuation converted: ' + own);
  await p.keyboard.type(own, { delay: 5 });
  await p.waitForSelector('[data-results]:not([hidden])');
  assert((await p.textContent('[data-results-xp]')).includes('XP'), 'practice earns XP');
  await p.click('label:has(input[value="problem"])');
  await p.waitForSelector('[data-problem-note]:not([hidden])');
  assert((await p.textContent('[data-problem-note]')).length > 10, 'problem-key note: ' + await p.textContent('[data-problem-note]'));
  await p.screenshot({ path: SHOTS + '/p5-practice.png', fullPage: true });

  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('keyquest.v1')));
  assert(st.results.some((r) => r.type === 'test') && st.results.some((r) => r.type === 'practice'), 'tests and practice recorded');
  console.log('console errors:', errs.length ? errs : 'none');
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
