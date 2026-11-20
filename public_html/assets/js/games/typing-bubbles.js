/**
 * Typing Bubbles – a gentle, kid-friendly game. Big, slow bubbles carry single letters;
 * type a letter to pop its bubble. No lives to lose: play for 90 seconds.
 */
import { Particles, fingerColour } from './framework.js';

export const meta = { id: 'typing-bubbles', title: 'Typing Bubbles' };

const ROUND_SECONDS = 90;

export function createGame(ctx) {
  const { colours, rng, difficulty } = ctx;
  const letters = ctx.letters.length ? ctx.letters.filter((c) => /[a-z]/.test(c)) : [...'asdfjkl'];
  const pool = letters.length ? letters : [...'asdfjkl'];
  const bubbles = [];
  const particles = new Particles(ctx.reducedMotion);
  let timeLeft = ROUND_SECONDS;
  let spawnIn = 0;
  let popped = 0;

  const game = {
    score: 0,
    lives: null,
    level: '',
    over: false,

    update(dt) {
      timeLeft -= dt;
      game.level = `${Math.max(0, Math.ceil(timeLeft))}s`;
      spawnIn -= dt;
      if (spawnIn <= 0 && bubbles.length < 5) {
        const used = new Set(bubbles.map((b) => b.ch));
        const options = pool.filter((c) => !used.has(c));
        const ch = (options.length ? options : pool)[Math.floor(rng() * (options.length || pool.length))];
        bubbles.push({ ch, x: 70 + rng() * (ctx.width - 140), y: ctx.height - 30, r: 44, drift: rng() * Math.PI * 2, colour: fingerColour(colours, ch) });
        spawnIn = 1.6 / Math.max(0.7, difficulty.spawn);
      }
      for (const b of bubbles) {
        b.y -= 34 * Math.min(1, difficulty.speed) * dt;
        b.drift += dt * 0.8;
        if (b.y < -60) b.y = ctx.height + 60; // no penalty – it just comes round again
      }
      particles.update(dt);
      if (timeLeft <= 0) game.over = true;
    },

    onKey(ch) {
      const b = bubbles.find((x) => x.ch === ch.toLowerCase());
      if (!b) return 'miss';
      bubbles.splice(bubbles.indexOf(b), 1);
      particles.burst(b.x, b.y, b.colour.edge, 22, 180);
      ctx.play('step');
      popped++;
      game.score += 10;
      if (popped % 10 === 0) ctx.announce(`${popped} bubbles popped – brilliant!`);
      return 'hit';
    },

    draw(g) {
      const { width, height } = ctx;
      const water = g.createLinearGradient(0, 0, 0, height);
      water.addColorStop(0, colours.bg);
      water.addColorStop(1, colours.dark ? '#14324a' : '#ddf0fb');
      g.fillStyle = water;
      g.fillRect(0, 0, width, height);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (const b of bubbles) {
        const x = b.x + (ctx.reducedMotion ? 0 : Math.sin(b.drift) * 16);
        g.fillStyle = b.colour.fill;
        g.globalAlpha = 0.9;
        g.beginPath();
        g.arc(x, b.y, b.r, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
        g.strokeStyle = b.colour.edge;
        g.lineWidth = 3;
        g.stroke();
        g.fillStyle = colours.bg;
        g.globalAlpha = 0.6;
        g.beginPath();
        g.arc(x - 16, b.y - 18, 9, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
        g.fillStyle = colours.fingerText;
        g.font = '900 40px Nunito, system-ui, sans-serif';
        g.fillText(b.ch.toUpperCase(), x, b.y + 2);
      }
      particles.draw(g);
    },

    summary() {
      return { detail: `You popped ${popped} bubble${popped === 1 ? '' : 's'}. Wonderful!` };
    },

    peek: () => bubbles.map((b) => b.ch),
  };
  return game;
}
