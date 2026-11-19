/**
 * Hands overlay (inline SVG): two stylised hands resting on the home row.
 * The finger(s) to use light up in their finger colour and lift slightly.
 *
 *   const hands = new Hands(el);
 *   hands.setActive(['lm', 'rp']);   // left middle + right little (Shift)
 */
const NS = 'http://www.w3.org/2000/svg';

// Left hand geometry (viewBox units). Right hand is mirrored.
// [finger, x, width, top-y]  – fingers grow up from the palm at y = 118.
const FINGERS = [
  ['lp', 30, 24, 52],
  ['lr', 58, 26, 30],
  ['lm', 88, 27, 20],
  ['li', 119, 27, 34],
];
const MIRROR = { lp: 'rp', lr: 'rr', lm: 'rm', li: 'ri' };
const HOME = { lp: 'A', lr: 'S', lm: 'D', li: 'F', rp: ';', rr: 'L', rm: 'K', ri: 'J' };

function el(name, attrs) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

function buildHand(side) {
  const g = el('g', { class: `hands__hand hands__hand--${side}` });
  if (side === 'right') g.setAttribute('transform', 'translate(400 0) scale(-1 1)');

  for (const [finger, x, w, top] of FINGERS) {
    const id = side === 'left' ? finger : MIRROR[finger];
    const f = el('g', { class: `hands__finger hands__finger--${id}`, 'data-finger': id });
    f.append(el('rect', { x, y: top, width: w, height: 128 - top, rx: w / 2, class: 'hands__digit' }));
    f.append(el('ellipse', { cx: x + w / 2, cy: top + 9, rx: w / 2 - 6, ry: 5, class: 'hands__nail' }));
    const label = el('text', { x: x + w / 2, y: top + 30, class: 'hands__label' });
    if (side === 'right') label.setAttribute('transform', `translate(${2 * (x + w / 2)} 0) scale(-1 1)`);
    label.textContent = HOME[id];
    f.append(label);
    g.append(f);
  }
  // Thumb
  const thumb = el('g', { class: 'hands__finger hands__finger--th', 'data-finger': 'th' });
  thumb.append(el('rect', { x: 140, y: 112, width: 26, height: 64, rx: 13, class: 'hands__digit', transform: 'rotate(-38 153 144)' }));
  g.append(thumb);
  // Palm (drawn last so finger bases tuck under it)
  g.append(el('rect', { x: 26, y: 104, width: 126, height: 92, rx: 34, class: 'hands__palm' }));
  return g;
}

export class Hands {
  constructor(container) {
    this.el = container;
    this.el.classList.add('hands');
    const svg = el('svg', { viewBox: '0 0 400 200', class: 'hands__svg', 'aria-hidden': 'true', focusable: 'false' });
    svg.append(buildHand('left'), buildHand('right'));
    this.el.replaceChildren(svg);
    this.svg = svg;
  }

  setActive(fingers = []) {
    const set = new Set(fingers);
    this.svg.querySelectorAll('.hands__finger').forEach((f) => {
      f.classList.toggle('is-active', set.has(f.dataset.finger));
    });
  }
}
