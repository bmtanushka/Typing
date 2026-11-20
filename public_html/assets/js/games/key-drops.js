/**
 * Key Drops – letters fall like raindrops; type them before they reach the ground.
 * Starts slowly with generous lives; speeds up a little every level.
 */
import { Particles, fingerColour } from './framework.js';

export const meta = { id: 'key-drops', title: 'Key Drops' };

export function createGame(ctx) {
  const { colours, difficulty, rng } = ctx;
  const letters = ctx.letters.length ? ctx.letters : [...'asdfjkl;'];
  const drops = [];
  const splashes = [];
  const particles = new Particles(ctx.reducedMotion);
  let spawnIn = 0.6;
  let hits = 0;

  const game = {
    score: 0,
    lives: difficulty.lives + 2,
    level: 1,
    over: false,

    fallSpeed() { return (48 + game.level * 7) * difficulty.speed; },
    spawnGap() { return Math.max(0.55, (1.9 - game.level * 0.12) / difficulty.spawn); },

    update(dt) {
      spawnIn -= dt;
      if (!drops.length) spawnIn = Math.min(spawnIn, 0.4);
      if (spawnIn <= 0 && drops.length < 3 + game.level) {
        const ch = letters[Math.floor(rng() * letters.length)];
        drops.push({ ch, x: 40 + rng() * (ctx.width - 80), y: 10, wobble: rng() * Math.PI * 2, colour: fingerColour(colours, ch) });
        spawnIn = game.spawnGap();
      }
      const ground = ctx.height - 34;
      for (const d of drops) {
        d.y += game.fallSpeed() * dt;
        d.wobble += dt * 2;
        if (d.y >= ground) {
          d.gone = true;
          game.lives--;
          splashes.push({ x: d.x, t: 0.5 });
          ctx.play('error');
          ctx.announce(`Missed ${d.ch}. ${game.lives} lives left.`);
        }
      }
      for (let i = drops.length - 1; i >= 0; i--) if (drops[i].gone) drops.splice(i, 1);
      for (const s of splashes) s.t -= dt;
      while (splashes.length && splashes[0].t <= 0) splashes.shift();
      particles.update(dt);
      if (game.lives <= 0) game.over = true;
    },

    onKey(ch) {
      // Burst the lowest drop with this letter (the most urgent one).
      let best = null;
      for (const d of drops) if (d.ch === ch && (!best || d.y > best.y)) best = d;
      if (!best) return 'miss';
      best.gone = true;
      drops.splice(drops.indexOf(best), 1);
      particles.burst(best.x, best.y, best.colour.edge);
      hits++;
      game.score += 10 * game.level;
      if (hits % 15 === 0) {
        game.level++;
        ctx.play('step');
        ctx.announce(`Level ${game.level}!`);
      }
      return 'hit';
    },

    draw(g) {
      const { width, height } = ctx;
      const sky = g.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, colours.primarySoft);
      sky.addColorStop(1, colours.bg);
      g.fillStyle = sky;
      g.fillRect(0, 0, width, height);
      // ground
      g.fillStyle = colours.success;
      g.globalAlpha = 0.25;
      g.fillRect(0, height - 30, width, 30);
      g.globalAlpha = 1;
      for (const s of splashes) {
        g.strokeStyle = colours.info;
        g.lineWidth = 3;
        g.beginPath();
        g.ellipse(s.x, height - 30, 26 * (1.2 - s.t), 6, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (const d of drops) {
        const x = d.x + (ctx.reducedMotion ? 0 : Math.sin(d.wobble) * 4);
        g.fillStyle = d.colour.fill;
        g.strokeStyle = d.colour.edge;
        g.globalAlpha = 0.95;
        g.beginPath(); // teardrop
        g.moveTo(x, d.y - 30);
        g.bezierCurveTo(x + 20, d.y - 6, x + 22, d.y + 20, x, d.y + 20);
        g.bezierCurveTo(x - 22, d.y + 20, x - 20, d.y - 6, x, d.y - 30);
        g.fill();
        g.globalAlpha = 1;
        g.lineWidth = 3;
        g.stroke();
        g.fillStyle = colours.fingerText;
        g.font = '800 22px "JetBrains Mono", ui-monospace, monospace';
        g.fillText(d.ch, x, d.y + 4);
      }
      particles.draw(g);
    },

    summary() {
      return { detail: `You burst ${hits} drops and reached level ${game.level}.` };
    },

    peek: () => drops.map((d) => d.ch),
  };
  return game;
}
