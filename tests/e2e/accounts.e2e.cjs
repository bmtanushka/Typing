const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS || require('path').join(__dirname, 'shots'); require('fs').mkdirSync(SHOTS, { recursive: true });
const fs = require('fs');
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('  ok', m); };
const BASE = process.env.BASE || 'http://localhost:8000';
const MAIL = require('path').join(__dirname, '../../storage/logs/mail.log');
const textOf = (p) => p.evaluate(() => [...document.querySelectorAll('.typing .ch')].map(s => s.classList.contains('ch--space') ? ' ' : s.textContent).join(''));
async function playThrough(p, delay = 70) {
  await p.waitForSelector('[data-start]'); await p.keyboard.press('Enter');
  for (;;) {
    await p.waitForSelector('.typing .ch, .results, .info');
    if (await p.$('.results')) return;
    if (await p.$('.info')) { await p.keyboard.press(' '); await p.waitForTimeout(50); continue; }
    const t = await textOf(p);
    await p.keyboard.type(t.slice(0, 1), { delay });
    await p.keyboard.press('q'); // one deliberate mistake for key stats (advances in non-beginner steps)
    await p.keyboard.press('Backspace');
    await p.keyboard.type(t.slice(1), { delay });
    await p.waitForSelector('.between, .results');
    if (await p.$('.results')) return;
    await p.keyboard.press('Enter');
  }
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => m.type() === 'error' && !m.text().includes('401') && errs.push(m.text()));
  p.on('pageerror', e => errs.push(e.message));
  const email = `pip${Date.now()}@example.com`;

  // Guest progress first
  await p.goto(BASE + '/progress');
  await p.waitForSelector('[data-dash-empty]:not([hidden])');
  assert(true, 'empty dashboard for a brand-new guest');
  await p.goto(BASE + '/lessons');
  await p.click('#unit-getting-started [data-unit-actions] button');
  await p.click('[data-lesson="hr-fj"]');
  await playThrough(p);
  const guestXp = await p.evaluate(() => JSON.parse(localStorage.getItem('keyquest.v1')).xp);
  assert(guestXp > 0, 'guest earned XP: ' + guestXp);

  // Register → merge
  await p.goto(BASE + '/register');
  await p.click('.auth__submit');
  assert(await p.isVisible('[data-field="email"] [data-error]'), 'client-side validation messages');
  await p.fill('#f-displayName', 'Pip Tester');
  await p.fill('#f-email', email);
  await p.fill('#f-password', 'typing is fun');
  await p.screenshot({ path: SHOTS + '/p4-register.png' });
  await p.click('.auth__submit');
  await p.waitForURL('**/progress');
  await p.waitForSelector('[data-dash-content]:not([hidden])');
  assert((await p.textContent('.account-chip__name')).trim() === 'Pip Tester', 'header shows the account');
  assert((await p.textContent('[data-dash-sync]')).includes('Saved to your account'), 'dashboard says synced');
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('keyquest.v1')));
  assert(st.account?.userId > 0 && st.xp === guestXp && st.progress['hr-fj']?.stars > 0 && st.skipped['gs-welcome'], 'guest progress merged into account');
  assert(await p.isHidden('[data-guest-banner]'), 'no guest banner when signed in');
  await p.waitForSelector('[data-chart="wpm"] .chart__dot');
  assert(await p.$('[data-dash-keyboard] .kb__key'), 'heatmap keyboard drawn');
  await p.hover('[data-chart="wpm"] .chart__svg');
  assert(await p.isVisible('[data-chart="wpm"] .chart__tip'), 'chart tooltip on hover');
  await p.screenshot({ path: SHOTS + '/p4-dashboard.png', fullPage: true });

  // Signed-in lesson syncs straight away
  await p.goto(BASE + '/lessons/hr-dk');
  await playThrough(p);
  await p.waitForFunction(() => (JSON.parse(localStorage.getItem('keyquest.v1')).syncQueue || []).length === 0, null, { timeout: 8000 });
  const server = await p.evaluate(async () => (await (await fetch('/api/progress')).json()).state);
  assert(server.progress['hr-dk']?.stars > 0 && server.xp > guestXp, 'lesson synced to the server (xp ' + server.xp + ')');

  // Log out clears this device, log in restores
  await p.goto(BASE + '/account');
  await p.screenshot({ path: SHOTS + '/p4-account.png', fullPage: true });
  await p.click('[data-logout]');
  await p.waitForURL(BASE + '/');
  const after = await p.evaluate(() => JSON.parse(localStorage.getItem('keyquest.v1')));
  assert(Object.keys(after.progress).length === 0 && !after.account, 'logging out removes account data from this device');
  assert(await p.isVisible('a[href="/login"]'), 'header shows Log in again');
  await p.goto(BASE + '/login');
  await p.fill('#f-email', email);
  await p.fill('#f-password', 'wrong password');
  await p.click('.auth__submit');
  await p.waitForSelector('[data-form-error]:not([hidden])');
  assert((await p.textContent('[data-form-error]')).includes('don’t match'), 'friendly wrong-password message');
  await p.fill('#f-password', 'typing is fun');
  await p.click('.auth__submit');
  await p.waitForURL('**/progress');
  await p.waitForFunction(() => JSON.parse(localStorage.getItem('keyquest.v1')).progress['hr-dk']);
  assert(true, 'logging back in restores progress');

  // Another device: fresh context sees the same progress
  const ctx2 = await b.newContext({ locale: 'en-GB' });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE + '/login');
  await p2.fill('#f-email', email); await p2.fill('#f-password', 'typing is fun'); await p2.click('.auth__submit');
  await p2.waitForURL('**/progress');
  await p2.goto(BASE + '/lessons');
  await p2.waitForSelector('[data-lesson="hr-dk"].map-node--done');
  assert(true, 'progress appears on a second device');
  await ctx2.close();

  // Profile update
  await p.goto(BASE + '/account');
  await p.fill('[data-auth-form="profile"] #f-displayName', 'Pip T');
  await p.click('[data-auth-form="profile"] [type=submit]');
  await p.waitForSelector('[data-auth-form="profile"] [data-form-success]:not([hidden])');
  assert((await p.textContent('.account-chip__name')).trim() === 'Pip T', 'name updated in header');

  // Forgot / reset via the mail log
  await p.click('[data-logout]'); await p.waitForURL(BASE + '/');
  await p.goto(BASE + '/forgot-password');
  await p.fill('#f-email', email);
  await p.click('.auth__submit');
  await p.waitForSelector('[data-form-success]:not([hidden])');
  const mail = fs.readFileSync(MAIL, 'utf8');
  const link = [...mail.matchAll(/(http\S+reset-password\?token=[a-f0-9]{64})/g)].pop()[1];
  assert(mail.includes(email) && link, 'reset email written with a one-hour link');
  await p.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
  await p.fill('#f-password', 'brand new pass');
  await p.click('.auth__submit');
  await p.waitForURL('**/progress');
  assert(await p.isVisible('.account-chip'), 'reset signs you in');

  // Delete account
  await p.goto(BASE + '/account');
  await p.click('[data-delete-open]');
  await p.fill('[data-auth-form="delete"] #f-password', 'brand new pass');
  await p.click('[data-auth-form="delete"] [type=submit]');
  await p.waitForURL('**/?account=deleted');
  const res = await p.evaluate(async (e) => (await (await fetch('/api/session')).json()).user, email);
  assert(res === null, 'account deleted and signed out');
  console.log('console errors:', errs.length ? errs : 'none');
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
