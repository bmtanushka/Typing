/**
 * Pip's messages – varied, specific and never negative. Pure (rng injectable) and tested.
 */
import { createRng, pick } from '../engine/generators.js';

const POOLS = {
  three: ['Brilliant – accurate and quick!', 'Superb! Your fingers really know their way now.', 'Three stars! That’s touch typing at its best.'],
  two: ['Lovely, steady typing.', 'Great work – smooth and careful.', 'Really solid. You’re building great habits.'],
  one: ['You passed – well done!', 'Nice one! Every lesson makes the next one easier.', 'Done! A little extra care will earn more stars.'],
  zero: ['So close! Take it a touch slower and you’ll have it.', 'Good effort – accuracy first, speed will follow.', 'Nearly there! Rest your fingers on the home row and try again.'],
  tutorial: ['You’re all set – let’s get typing!', 'Great start! You know where home is now.'],
  welcome: ['Hi! Ready for a few minutes of typing?', 'Welcome! Let’s warm up those fingers.'],
  welcomeBack: ['Welcome back! Ready to carry on?', 'Good to see you again!', 'Back for more? Brilliant.'],
};

/**
 * @param {object} c context: {stars, accuracy, wpm, previous:{bestAccuracy,bestWpm}|null,
 *   streak, streakGrew, levelUp, level, unitCompleted, tutorial, newBadges}
 * @returns {string[]} one to three short sentences, most specific first
 */
export function resultMessages(c, r = createRng()) {
  const out = [];
  if (c.unitCompleted) out.push('You’ve finished the whole unit – what an achievement!');
  if (c.levelUp) out.push(`Level up! You’re now level ${c.level}.`);

  const prev = c.previous;
  if (prev && prev.bestAccuracy > 0 && !c.tutorial) {
    const dAcc = Math.round(c.accuracy - prev.bestAccuracy);
    const dWpm = Math.round(c.wpm - prev.bestWpm);
    if (dAcc >= 2) out.push(`Nice! Your accuracy improved by ${dAcc}%.`);
    else if (dWpm >= 2 && c.stars > 0) out.push(`You’re ${dWpm} WPM faster than your best!`);
  }
  if (c.streakGrew && c.streak > 1) out.push(`That’s ${c.streak} days in a row – keep it going!`);

  if (out.length === 0 || out.length < 2) {
    const pool = c.tutorial ? POOLS.tutorial : POOLS[['zero', 'one', 'two', 'three'][Math.max(0, Math.min(3, c.stars))]];
    out.push(pick(pool, r));
  }
  return out.slice(0, 3);
}

export function greeting(hasProgress, r = createRng()) {
  return pick(hasProgress ? POOLS.welcomeBack : POOLS.welcome, r);
}
