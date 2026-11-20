/**
 * Balloon Pop – words float up in balloons; type a word to pop its balloon before it
 * drifts away. The first letter picks the balloon.
 */
import { Particles, drawWord, typeAtTargets, pickWord, fingerColour } from './framework.js';

export const meta = { id: 'balloon-pop', title: 'Balloon Pop' };

export function createGame(ctx) {
  const { colours, difficulty, rng } = ctx;
  const balloons = [];
  const particles = new Particles(ctx.reducedMotion);
  let target = null;
  let spawnIn = 0.3;
  let popped = 0;

  const game = {
    score: 0,
    lives: difficulty.lives,
    level: 1,
    over: false,

    update(dt) {
      spawnIn -= dt;
      if (!balloons.length) spawnIn = Math.min(spawnIn, 0.4); // never leave an empty sky
      const max = 2 + Math.min(3, Math.floor(game.level / 2));
      if (spawnIn <= 0 && balloons.length < max) {
        const word = pickWord(ctx.words, balloons.map((b) => b.word), rng);
        balloons.push({
          word, typed: 0, urgency: 0,
          x: 70 + rng() * (ctx.width - 140), y: ctx.height - 60, // starts fully in view
          sway: rng() * Math.PI * 2, colour: fingerColour(colours, word[0]),
        });
        spawnIn = Math.max(1.1, (3.2 - game.level * 0.2) / difficulty.spawn);
      }
      const speed = (30 + game.level * 4) * difficulty.speed;
      for (const b of balloons) {
        b.y -= speed * dt;
        b.sway += dt;
        b.urgency = ctx.height - b.y;
        if (b.y < -70) {
          b.gone = true;
          game.lives--;
          if (target === b) target = null;
          ctx.play('error');
          ctx.announce(`The ${b.word} balloon floated away. ${game.lives} lives left.`);
        }
      }
      for (let i = balloons.length - 1; i >= 0; i--) if (balloons[i].gone) balloons.splice(i, 1);
      particles.update(dt);
      if (game.lives <= 0) game.over = true;
    },

    onKey(ch) {
      const r = typeAtTargets(balloons, ch, target);
      target = r.item;
      if (r.done) {
        const b = r.item;
        b.gone = true;
        target = null;
        particles.burst(b.x, b.y, b.colour.edge, 20, 200);
        ctx.play('step');
        popped++;
        game.score += 5 * b.word.length * game.level;
        if (popped % 8 === 0) {
          game.level++;
          ctx.announce(`Level ${game.level}!`);
        }
      }
      return r.result;
    },

    draw(g) {
      const { width, height } = ctx;
      const sky = g.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, colours.bg2);
      sky.addColorStop(1, colours.primarySoft);
      g.fillStyle = sky;
      g.fillRect(0, 0, width, height);
      for (const b of balloons) {
        const x = b.x + (ctx.reducedMotion ? 0 : Math.sin(b.sway) * 10);
        // string
        g.strokeStyle = colours.muted;
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(x, b.y + 44);
        g.quadraticCurveTo(x - 8, b.y + 70, x, b.y + 96);
        g.stroke();
        // balloon
        g.fillStyle = b.colour.fill;
        g.beginPath();
        g.ellipse(x, b.y, 34, 42, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = b === target ? colours.primary : b.colour.edge;
        g.lineWidth = b === target ? 4 : 2.5;
        g.stroke();
        g.fillStyle = colours.bg;
        g.globalAlpha = 0.5;
        g.beginPath();
        g.ellipse(x - 12, b.y - 16, 7, 11, -0.4, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
        drawWord(g, b.word, b.typed, x, b.y + 6, { size: 20, colours, active: b === target }); // word across the balloon: always readable
      }
      particles.draw(g);
    },

    summary() {
      return { detail: `You popped ${popped} balloon${popped === 1 ? '' : 's'}.` };
    },

    peek: () => balloons.map((b) => b.word),
  };
  return game;
}
