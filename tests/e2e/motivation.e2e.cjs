const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS || require('path').join(__dirname, 'shots'); require('fs').mkdirSync(SHOTS, { recursive: true });
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('  ok', m); };
const BASE = process.env.BASE || 'http://localhost:8000';
const textOf = (p) => p.evaluate(() => [...document.querySelectorAll('.typing .ch')].map(s => s.classList.contains('ch--space') ? ' ' : s.textContent).join(''));
async function playThrough(p) {          // play every step of the current lesson perfectly
  await p.waitForSelector('[data-start]'); await p.keyboard.press('Enter');
  for (;;) {
    await p.waitForSelector('.typing .ch, .results, .info');
    if (await p.$('.results')) return;
    if (await p.$('.info')) { await p.keyboard.press(' '); await p.waitForTimeout(50); continue; }
    await p.keyboard.type(await textOf(p), { delay: 4 });
    await p.waitForSelector('.between, .results');
    if (await p.$('.results')) return;
    await p.keyboard.press('Enter');
  }
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'en-GB', acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push(e.message));

  await p.goto(BASE + '/lessons');
  await p.waitForSelector('[data-lesson="gs-welcome"].map-node--current');
  assert(await p.$eval('[data-lesson="hr-fj"]', n => n.classList.contains('map-node--locked')), 'F and J locked at start');
  assert(await p.$eval('[data-lesson="hr-check"]', n => n.classList.contains('map-node--locked')), 'checkpoint locked until unit reached');
  assert(await p.isHidden('[data-guest-banner]'), 'no guest banner before any progress');
  assert(await p.isHidden('[data-header-stats]'), 'no header chip yet');
  await p.click('[data-lesson="hr-dk"]', { force: true });
  await p.waitForSelector('[data-locked-dialog][open]');
  assert((await p.textContent('[data-locked-text]')).includes('Welcome aboard'), 'locked dialog names the lesson to finish');
  await p.screenshot({ path: SHOTS + '/p3-locked-dialog.png' });
  await p.keyboard.press('Escape');

  await p.goto(BASE + '/lessons/hr-dk');
  await p.waitForSelector('.locked');
  assert(true, 'direct URL to a locked lesson shows the locked screen');

  // Skip Getting started
  await p.goto(BASE + '/lessons');
  await p.click('#unit-getting-started [data-unit-actions] button');
  await p.waitForSelector('[data-lesson="hr-fj"].map-node--current');
  assert(await p.$eval('[data-lesson="gs-welcome"]', n => n.classList.contains('map-node--skipped')), 'skipped lessons marked');
  assert(await p.$('#unit-home-row [data-unit-actions] a'), 'test-out link appears for home row');
  await p.screenshot({ path: SHOTS + '/p3-map-skipped.png', fullPage: true });

  // F and J perfectly → rewards
  await p.click('[data-lesson="hr-fj"]');
  await playThrough(p);
  await p.waitForSelector('.rewards');
  assert((await p.textContent('.rewards__xp')).match(/\+\d+ XP/), 'XP shown: ' + await p.textContent('.rewards__xp'));
  assert((await p.textContent('.rewards__streak')).includes('1-day streak'), 'streak shown');
  const badgeTitles = await p.$$eval('.rewards__badge-title', l => l.map(x => x.textContent));
  assert(badgeTitles.includes('First steps') && badgeTitles.includes('Hat-trick'), 'new badges: ' + badgeTitles.join(', '));
  assert((await p.textContent('.results__pip')).length > 10, 'Pip message: ' + await p.textContent('.results__pip'));
  assert(await p.isVisible('[data-header-stats]'), 'header chip appears');
  assert(await p.isVisible('[data-guest-banner]'), 'guest banner on results');
  await p.waitForTimeout(1200);
  await p.screenshot({ path: SHOTS + '/p3-results.png', fullPage: true });

  // Retry same lesson → improvement message logic doesn't crash, XP smaller
  // Test out of the home row
  await p.goto(BASE + '/lessons/hr-check');
  await playThrough(p);
  await p.waitForSelector('.rewards');
  assert(await p.$('canvas.confetti'), 'confetti for unit completion');
  assert((await p.textContent('.results__pip')).includes('whole unit'), 'Pip celebrates the unit');
  const b2 = await p.$$eval('.rewards__badge-title', l => l.map(x => x.textContent));
  assert(b2.includes('Home sweet home'), 'unit badge: ' + b2.join(', '));
  await p.screenshot({ path: SHOTS + '/p3-unit-complete.png' });

  await p.goto(BASE + '/lessons');
  await p.waitForSelector('#unit-home-row.island--complete');
  assert(await p.$eval('[data-lesson="hr-gh"]', n => n.classList.contains('map-node--skipped')), 'tested-out lessons skipped but playable');
  // banner dismiss
  await p.click('[data-guest-banner-close]');
  assert(await p.isHidden('[data-guest-banner]'), 'banner dismissed');
  await p.reload(); await p.waitForSelector('#unit-home-row.island--complete');
  assert(await p.isHidden('[data-guest-banner]'), 'dismissal remembered');

  // Badges page
  await p.goto(BASE + '/badges');
  await p.waitForSelector('.badge-card--earned');
  const earned = Number(await p.textContent('[data-earned-count]'));
  assert(earned >= 4, 'badges page shows earned: ' + earned);
  assert((await p.textContent('[data-streak]')) === '1 day', 'streak summary');
  await p.screenshot({ path: SHOTS + '/p3-badges.png', fullPage: true });

  // Settings
  await p.goto(BASE + '/settings');
  await p.click('label:has(input[name="theme"][value="dark"])');
  assert(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'theme switches');
  await p.click('label:has(input[name="fontSize"][value="large"])');
  assert(await p.evaluate(() => document.documentElement.dataset.fontSize) === 'large', 'text size applies');
  await p.selectOption('#set-layout', 'us');
  await p.click('label:has(input[name="sound"])');
  await p.click('label:has(input[name="showHands"])');
  await p.reload();
  assert(await p.$eval('#set-layout', s => s.value) === 'us' && await p.isChecked('input[name="sound"]') && !(await p.isChecked('input[name="showHands"]')), 'settings persist');
  assert(await p.evaluate(() => document.documentElement.dataset.fontSize) === 'large', 'text size applied before paint');
  await p.screenshot({ path: SHOTS + '/p3-settings-dark.png', fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-export]')]);
  assert(dl.suggestedFilename().startsWith('keyquest-progress-'), 'export downloads ' + dl.suggestedFilename());
  await p.click('[data-reset]');
  await p.click('[data-confirm-reset]');
  await p.waitForFunction(() => JSON.parse(localStorage.getItem('keyquest.v1')).xp === 0, null, { timeout: 3000 }).catch(() => {});
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('keyquest.v1')));
  assert(Object.keys(st.progress).length === 0 && st.xp === 0 && st.settings.layout === 'us', 'reset clears progress, keeps settings');
  console.log('console errors:', errs.length ? errs : 'none');
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
