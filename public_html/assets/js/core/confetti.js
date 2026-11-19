/**
 * Lightweight confetti burst on a temporary full-screen canvas.
 * Does nothing when the learner prefers reduced motion.
 */
const COLOURS = ['#4f46e5', '#ff7a59', '#f5a700', '#16a34a', '#0891b2', '#c026d3', '#e11d48'];

export function confetti({ pieces = 140, duration = 2600 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
  };
  resize();
  const c = canvas.getContext('2d');
  c.scale(dpr, dpr);

  const parts = Array.from({ length: pieces }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
  }));

  const start = performance.now();
  const frame = (now) => {
    const t = now - start;
    c.clearRect(0, 0, innerWidth, innerHeight);
    c.globalAlpha = Math.max(0, 1 - Math.max(0, t - duration * 0.6) / (duration * 0.4));
    for (const p of parts) {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.r);
      c.fillStyle = p.colour;
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r)));
      c.restore();
    }
    if (t < duration) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
