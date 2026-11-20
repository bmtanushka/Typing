/**
 * Word Race – race a ghost car that drives at a steady target speed (WPM).
 * Your car moves forward with every correct letter. Mistakes don't move you.
 */
import { roundRect } from './framework.js';

export const meta = { id: 'word-race', title: 'Word Race' };

const GHOST_WPM = { Gentle: 10, Normal: 20, Speedy: 30 };

function drawCar(g, x, y, body, label, colours) {
  g.fillStyle = body;
  roundRect(g, x - 34, y - 14, 68, 28, 10);
  g.fill();
  g.fillStyle = colours.bg;
  g.globalAlpha = 0.85;
  roundRect(g, x - 8, y - 10, 22, 12, 4);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#2a2638';
  for (const dx of [-20, 20]) {
    g.beginPath();
    g.arc(x + dx, y + 15, 7, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = colours.text;
  g.font = '800 13px Nunito, system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText(label, x, y - 24);
}

export function createGame(ctx) {
  const { colours, difficulty, rng } = ctx;
  const ghostWpm = GHOST_WPM[difficulty.label] || 20;
  const words = [];
  while (words.join(' ').length < 140) words.push(ctx.words[Math.floor(rng() * ctx.words.length)]);
  const text = words.join(' ');
  let pos = 0;
  let countdown = 3;
  let elapsed = 0;
  let ghostTime = null;
  let playerTime = null;

  const game = {
    score: 0,
    lives: null,
    level: `${ghostWpm} WPM`,
    over: false,

    update(dt) {
      if (countdown > 0) {
        const before = Math.ceil(countdown);
        countdown -= dt;
        if (Math.ceil(countdown) !== before && countdown > 0) ctx.play('key');
        if (countdown <= 0) { ctx.play('step'); ctx.announce('Go!'); }
        return;
      }
      elapsed += dt;
      const ghostPos = Math.min(text.length, (ghostWpm * 5 * elapsed) / 60);
      if (ghostPos >= text.length && ghostTime === null) {
        ghostTime = elapsed;
        ctx.announce('The ghost car has finished – keep going!');
      }
      if (playerTime !== null) game.over = true;
    },

    onKey(ch) {
      if (countdown > 0 || playerTime !== null) return 'ignore';
      if (text[pos] !== ch) return 'miss';
      pos++;
      if (pos >= text.length) {
        playerTime = elapsed;
        const wpm = Math.round((text.length / 5) / (elapsed / 60));
        const won = ghostTime === null;
        game.score = Math.max(0, Math.round(wpm * 10 + (won ? 100 : 0)));
        ctx.play(won ? 'levelUp' : 'success');
      }
      return 'hit';
    },

    draw(g) {
      const { width, height } = ctx;
      g.fillStyle = colours.bg2;
      g.fillRect(0, 0, width, height);
      const startX = 95; // room for the "Ghost · 20 WPM" label
      const endX = width - 70;
      const lanes = [height * 0.22, height * 0.42];
      // track
      for (const y of lanes) {
        g.fillStyle = colours.bg;
        roundRect(g, 20, y - 30, width - 40, 60, 14);
        g.fill();
        g.strokeStyle = colours.border;
        g.lineWidth = 2;
        g.setLineDash([12, 12]);
        g.beginPath();
        g.moveTo(30, y + 30);
        g.lineTo(width - 30, y + 30);
        g.stroke();
        g.setLineDash([]);
      }
      // chequered finish line across both lanes
      const top = lanes[0] - 30;
      const rows = Math.ceil((lanes[1] + 30 - top) / 10);
      for (let i = 0; i < rows; i++) {
        for (let c = 0; c < 2; c++) {
          g.fillStyle = (i + c) % 2 ? colours.text : colours.bg;
          g.fillRect(endX + 30 + c * 10, top + i * 10, 10, 10);
        }
      }
      const ghostPos = countdown > 0 ? 0 : Math.min(1, (ghostWpm * 5 * elapsed) / 60 / text.length);
      g.globalAlpha = 0.55;
      drawCar(g, startX + (endX - startX) * ghostPos, lanes[0], colours.muted, `Ghost · ${ghostWpm} WPM`, colours);
      g.globalAlpha = 1;
      drawCar(g, startX + (endX - startX) * (pos / text.length), lanes[1], colours.primary, 'You', colours);

      // text strip
      const y = height * 0.72;
      g.font = '700 24px "JetBrains Mono", ui-monospace, monospace';
      g.textBaseline = 'middle';
      g.textAlign = 'left';
      const cw = g.measureText('m').width;
      const visible = Math.floor((width - 80) / cw);
      const start = Math.max(0, pos - Math.floor(visible / 3));
      g.fillStyle = colours.bg;
      roundRect(g, 30, y - 30, width - 60, 60, 14);
      g.fill();
      for (let i = start; i < Math.min(text.length, start + visible); i++) {
        const x = 40 + (i - start) * cw;
        if (i === pos) {
          g.fillStyle = colours.primarySoft;
          g.fillRect(x - 1, y - 18, cw + 2, 36);
          g.fillStyle = colours.primary;
          g.fillRect(x - 1, y + 15, cw + 2, 3);
        }
        g.fillStyle = i < pos ? colours.success : colours.muted;
        g.fillText(text[i] === ' ' ? '·' : text[i], x, y);
      }
      if (countdown > 0) {
        g.fillStyle = colours.primary;
        g.font = '900 72px Nunito, system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText(String(Math.ceil(countdown)), width / 2, height * 0.5);
      }
    },

    peek: () => text.slice(pos),

    summary() {
      const wpm = playerTime ? Math.round((text.length / 5) / (playerTime / 60)) : 0;
      const won = ghostTime === null || (playerTime !== null && playerTime <= ghostTime);
      return {
        wpm,
        won,
        detail: won ? `You beat the ${ghostWpm} WPM ghost car at ${wpm} WPM!` : `The ghost car won this time – you raced at ${wpm} WPM. Try again!`,
      };
    },
  };
  return game;
}
