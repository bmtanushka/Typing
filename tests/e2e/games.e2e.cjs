const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS || require('path').join(__dirname, 'shots'); require('fs').mkdirSync(SHOTS, { recursive: true });
const assert = (c, m) => { if (!c) throw new Error('FAIL: ' + m); console.log('  ok', m); };
const BASE = process.env.BASE || 'http://localhost:8000';
const peek = (p) => p.evaluate(() => document.querySelector('[data-game]').kqGame?.peek());

async function startGame(p, id, { difficulty = 'gentle', keys = 'home' } = {}) {
  await p.goto(`${BASE}/games/${id}`);
  await p.waitForSelector('[data-play]');
  await p.click(`label:has(input[name="difficulty"][value="${difficulty}"])`);
  await p.selectOption('#g-keys', keys);
  await p.click('[data-play]');
  await p.waitForFunction(() => document.querySelector('[data-game]').kqGame);
}

async function waitResults(p) {
  for (let i = 0; i < 200 && !(await p.isVisible('[data-results]')); i++) await p.clock.runFor(1000);
  await p.waitForSelector('[data-results]:not([hidden])');
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-GB' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', (e) => errs.push(e.message));
  await p.clock.install();

  await p.goto(BASE + '/games');
  assert(await p.$$eval('[data-game-card]', (l) => l.length) === 5, 'five games in the hub');
  await p.screenshot({ path: SHOTS + '/p6-hub.png', fullPage: true });

  // Key Drops: burst falling letters, then let the rest land
  await startGame(p, 'key-drops');
  let burst = 0;
  for (let i = 0; i < 12; i++) {
    await p.clock.runFor(1500);
    if (i === 5) await p.screenshot({ path: SHOTS + '/p6-key-drops.png' });
    for (const ch of await peek(p)) { await p.keyboard.press(ch === ';' ? 'Semicolon' : ch); burst++; }
  }
  assert(burst >= 5, `burst ${burst} drops`);
  assert(Number(await p.textContent('[data-hud="score"]')) >= 50, 'score rises in the HUD');
  await p.keyboard.press('Escape');
  assert(await p.isVisible('[data-pause]'), 'Esc pauses');
  await p.click('[data-resume]');
  await waitResults(p);
  assert(Number(await p.textContent('[data-res="best"]')) >= 50, 'best score recorded');
  assert((await p.textContent('[data-res-badges]')).includes('Game on'), 'first-game badge');
  await p.screenshot({ path: SHOTS + '/p6-results.png' });

  // Balloon Pop: type whole words
  await startGame(p, 'balloon-pop');
  let popped = 0;
  for (let i = 0; i < 8; i++) {
    await p.clock.runFor(1800);
    const words = await peek(p);
    if (i === 3) await p.screenshot({ path: SHOTS + '/p6-balloon-pop.png' });
    if (words.length) { await p.keyboard.type(words[0]); popped++; }
  }
  assert(popped >= 3 && Number(await p.textContent('[data-hud="score"]')) > 0, `popped ${popped} balloons`);
  await waitResults(p);

  // Space Defender
  await startGame(p, 'space-defender', { difficulty: 'normal' });
  for (let i = 0; i < 6; i++) {
    await p.clock.runFor(1600);
    const words = await peek(p);
    if (words.length) await p.keyboard.type(words[0]);
  }
  await p.screenshot({ path: SHOTS + '/p6-space-defender.png' });
  assert(Number(await p.textContent('[data-hud="score"]')) > 0, 'asteroids cleared');
  await waitResults(p);

  // Word Race: finish the text quickly → beat the ghost
  await startGame(p, 'word-race');
  await p.clock.runFor(3200); // countdown
  const text = await peek(p);
  await p.screenshot({ path: SHOTS + '/p6-word-race.png' });
  await p.keyboard.type(text);
  await p.clock.runFor(1000);
  await waitResults(p);
  assert((await p.textContent('[data-results-detail]')).includes('You beat'), 'beat the ghost car: ' + await p.textContent('[data-results-detail]'));

  // Typing Bubbles: no lives, ends after 90 s
  await startGame(p, 'typing-bubbles');
  await p.clock.runFor(4000);
  await p.screenshot({ path: SHOTS + '/p6-bubbles.png' });
  for (const ch of await peek(p)) await p.keyboard.press(ch);
  assert((await p.textContent('[data-hud="lives"]')) === '–', 'bubbles has no lives');
  await waitResults(p);

  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('keyquest.v1')));
  assert(Object.keys(st.gameScores).length === 5, 'best score stored for every game');
  assert(st.results.filter((r) => r.type === 'game').length === 5, 'five game results recorded');
  await p.goto(BASE + '/games');
  assert((await p.textContent('[data-game-card="key-drops"] [data-best]')).startsWith('Your best'), 'hub shows best scores');

  // Dark theme + mobile snapshot of a game
  await p.emulateMedia({ colorScheme: 'dark' });
  await startGame(p, 'balloon-pop');
  await p.clock.runFor(4000);
  await p.screenshot({ path: SHOTS + '/p6-balloon-dark.png' });
  console.log('console errors:', errs.length ? errs : 'none');
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
