const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS || require('path').join(__dirname, 'shots'); require('fs').mkdirSync(SHOTS, { recursive: true });
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('  ok', m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8000') + '/demo');
  await p.waitForSelector('.kb__key');
  assert(await p.$eval('#demo-layout', s => s.value) === 'uk', 'layout defaults to UK for en-GB');
  assert(await p.evaluate(() => document.activeElement.classList.contains('typing__input')), 'input autofocused');

  const text = await p.evaluate(() => [...document.querySelectorAll('.typing .ch')].map(s => s.textContent === ' ' ? ' ' : s.textContent).join(''));
  assert(await p.$('.kb__key.is-next[data-code="KeyA"]'), 'next key A highlighted');
  assert(await p.$('.hands__finger--lp.is-active'), 'left little finger active');
  await p.screenshot({ path: SHOTS + '/demo-start.png' });

  // make one error then fix with backspace, then type the rest
  await p.keyboard.type('x');
  assert(await p.$eval('.typing .ch', s => s.classList.contains('ch--error')), 'error marked');
  await p.keyboard.press('Backspace');
  assert(!(await p.$eval('.typing .ch', s => s.classList.contains('ch--error'))), 'backspace clears error');
  await p.keyboard.type(text.slice(0, 20), { delay: 15 });
  await p.screenshot({ path: SHOTS + '/demo-typing.png' });

  // blur → pause overlay
  await p.evaluate(() => document.activeElement.blur());
  assert(await p.$eval('.typing__overlay', o => !o.hidden && o.textContent.includes('Paused')), 'paused overlay on blur');
  await p.click('.typing__overlay');
  assert(await p.$eval('.typing__overlay', o => o.hidden), 'click resumes');

  await p.keyboard.type(text.slice(20), { delay: 5 });
  await p.waitForSelector('[data-results]:not([hidden])');
  const acc = await p.$eval('[data-r="accuracy"]', e => e.textContent);
  console.log('  results: wpm', await p.$eval('[data-r="wpm"]', e => e.textContent), 'accuracy', acc);
  assert(Number(acc) < 100 && Number(acc) > 90, 'accuracy reflects the one error');
  await p.screenshot({ path: SHOTS + '/demo-results.png', fullPage: true });

  // beginner mode: wrong key does not advance
  await p.click('label:has(input[name="stopOnError"])');
  await p.waitForTimeout(100);
  await p.keyboard.type('zz');
  assert(await p.evaluate(() => document.querySelectorAll('.typing .ch--correct, .typing .ch--error').length) === 0, 'stopOnError holds position');

  // shift character: symbols text
  await p.selectOption('#demo-text', 'symbols');
  await p.waitForTimeout(100);
  assert(await p.$('.kb__key.is-next[data-code="KeyP"]') && await p.$('.kb__key.is-next[data-code="ShiftLeft"]'), 'capital P highlights P + left Shift');
  assert(await p.$('.hands__finger--rp.is-active'), 'hands show right little finger for P');
  await p.keyboard.type('Pip said, "');
  assert(await p.evaluate(() => document.querySelectorAll('.typing .ch--correct').length) === 11, 'shifted chars incl. " typed correctly');

  // layout switch to US: " moves to Quote key
  await p.selectOption('#demo-layout', 'us');
  await p.waitForFunction(() => document.querySelector('.kb').dataset.layout === 'us');
  assert(await p.$eval('.kb__key[data-code="Digit2"] .kb__shift', e => e.textContent) === '@', 'US keyboard shows @ on 2');

  // hint after repeated errors (stopOnError on)
  await p.keyboard.type('qqq');
  assert(await p.$eval('[data-hint]', e => !e.hidden && /Use your/.test(e.textContent)), 'hint shown after 3 misses: ' + await p.$eval('[data-hint]', e => e.textContent));

  // dark theme screenshot
  await p.emulateMedia({ colorScheme: 'dark' });
  await p.reload(); await p.waitForSelector('.kb__key');
  await p.screenshot({ path: SHOTS + '/demo-dark.png' });
  // mobile
  await p.setViewportSize({ width: 390, height: 900 });
  await p.screenshot({ path: SHOTS + '/demo-mobile.png', fullPage: true });
  console.log('console errors:', errs.length ? errs : 'none');
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
