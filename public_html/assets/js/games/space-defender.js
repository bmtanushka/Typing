/**
 * Space Defender – asteroids carrying words drift towards your ship. Type a word to fire
 * your laser at it. Shields protect you a few times.
 */
import { Particles, drawWord, typeAtTargets, pickWord } from './framework.js';

export const meta = { id: 'space-defender', title: 'Space Defender' };

export function createGame(ctx) {
  const { colours, difficulty, rng } = ctx;
  const rocks = [];
  const lasers = [];
  const particles = new Particles(ctx.reducedMotion);
  const stars = Array.from({ length: 70 }, () => ({ x: rng(), y: rng(), s: 0.5 + rng() * 1.5 }));
  let target = null;
  let spawnIn = 0.5;
  let destroyed = 0;
  let shake = 0;
  const ship = () => ({ x: ctx.width / 2, y: ctx.height - 40 });

  const game = {
    score: 0,
    lives: difficulty.lives - 1,
    level: 1,
    over: false,

    update(dt) {
      spawnIn -= dt;
      if (!rocks.length) spawnIn = Math.min(spawnIn, 0.5);
      if (spawnIn <= 0 && rocks.length < 2 + Math.min(4, game.level)) {
        const word = pickWord(ctx.words, rocks.map((r) => r.word), rng);
        rocks.push({ word, typed: 0, urgency: 0, x: 60 + rng() * (ctx.width - 120), y: 30, r: 22 + word.length * 2, spin: rng() * 6 });
        spawnIn = Math.max(1, (3 - game.level * 0.18) / difficulty.spawn);
      }
      const s = ship();
      const speed = (26 + game.level * 4) * difficulty.speed;
      for (const r of rocks) {
        const dx = s.x - r.x;
        const dy = s.y - r.y;
        const d = Math.hypot(dx, dy) || 1;
        r.x += (dx / d) * speed * dt * 0.35;
        r.y += speed * dt;
        r.spin += dt;
        r.urgency = r.y;
        if (r.y > s.y - 30) {
          r.gone = true;
          game.lives--;
          shake = 0.4;
          if (target === r) target = null;
          particles.burst(r.x, r.y, colours.danger, 18);
          ctx.play('error');
          ctx.announce(`Shield hit! ${game.lives} shields left.`);
        }
      }
      for (let i = rocks.length - 1; i >= 0; i--) if (rocks[i].gone) rocks.splice(i, 1);
      for (const l of lasers) l.t -= dt;
      while (lasers.length && lasers[0].t <= 0) lasers.shift();
      shake = Math.max(0, shake - dt);
      for (const st of stars) {
        st.y += (st.s * 0.02 + 0.01) * dt * (ctx.reducedMotion ? 0 : 1);
        if (st.y > 1) st.y = 0;
      }
      particles.update(dt);
      if (game.lives <= 0) game.over = true;
    },

    onKey(ch) {
      const r = typeAtTargets(rocks, ch, target);
      target = r.item;
      if (r.result === 'hit') lasers.push({ x: r.item.x, y: r.item.y, t: 0.12 });
      if (r.done) {
        const rock = r.item;
        rock.gone = true;
        target = null;
        particles.burst(rock.x, rock.y, colours.accent, 24, 220);
        ctx.play('step');
        destroyed++;
        game.score += 6 * rock.word.length * game.level;
        if (destroyed % 8 === 0) {
          game.level++;
          ctx.announce(`Wave ${game.level}!`);
        }
      }
      return r.result;
    },

    draw(g) {
      const { width, height } = ctx;
      g.save();
      if (shake && !ctx.reducedMotion) g.translate((rng() - 0.5) * 8, (rng() - 0.5) * 8);
      g.fillStyle = colours.dark ? '#0b0a14' : '#1e1b3a';
      g.fillRect(-10, -10, width + 20, height + 20);
      g.fillStyle = '#ffffff';
      for (const st of stars) {
        g.globalAlpha = 0.3 + st.s * 0.3;
        g.fillRect(st.x * width, st.y * height, st.s, st.s);
      }
      g.globalAlpha = 1;
      const s = ship();
      for (const l of lasers) {
        g.strokeStyle = colours.accent;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(s.x, s.y - 24);
        g.lineTo(l.x, l.y);
        g.stroke();
      }
      for (const r of rocks) {
        g.save();
        g.translate(r.x, r.y);
        g.rotate(ctx.reducedMotion ? 0 : r.spin * 0.3);
        g.fillStyle = '#7a6f9b';
        g.beginPath();
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const rr = r.r * (0.82 + ((i * 37) % 10) / 50);
          g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        g.closePath();
        g.fill();
        g.strokeStyle = r === target ? colours.accent : '#4b4266';
        g.lineWidth = r === target ? 4 : 2;
        g.stroke();
        g.restore();
        drawWord(g, r.word, r.typed, r.x, r.y + r.r + 18, { size: 19, colours, active: r === target });
      }
      // ship
      g.fillStyle = colours.primary;
      g.beginPath();
      g.moveTo(s.x, s.y - 26);
      g.lineTo(s.x + 22, s.y + 16);
      g.lineTo(s.x, s.y + 8);
      g.lineTo(s.x - 22, s.y + 16);
      g.closePath();
      g.fill();
      g.fillStyle = colours.accent;
      g.beginPath();
      g.arc(s.x, s.y - 4, 5, 0, Math.PI * 2);
      g.fill();
      if (game.lives > 0) {
        g.strokeStyle = colours.info;
        g.globalAlpha = 0.35;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(s.x, s.y, 36, Math.PI, 0);
        g.stroke();
        g.globalAlpha = 1;
      }
      particles.draw(g);
      g.restore();
    },

    summary() {
      return { detail: `You cleared ${destroyed} asteroid${destroyed === 1 ? '' : 's'} and reached wave ${game.level}.` };
    },

    peek: () => rocks.map((r) => r.word),
  };
  return game;
}
