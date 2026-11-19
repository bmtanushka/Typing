/**
 * Tiny inline-SVG line chart (one series per chart – never dual-axis).
 * Geometry is pure (`lineGeometry`, unit-tested); `lineChart` builds the DOM with a
 * crosshair + tooltip on hover and a data table for screen readers.
 */
const NS = 'http://www.w3.org/2000/svg';

/** "Nice" ceiling for an axis: 10, 20, 25, 50, 100… */
export function niceMax(v) {
  if (v <= 0) return 10;
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * mag) return m * mag;
  return 10 * mag;
}

/**
 * @param {number[]} values
 * @param {{width:number, height:number, pad:{t,r,b,l}, yMin?:number, yMax?:number}} o
 * @returns {{points:{x:number,y:number,v:number}[], path:string, yTicks:{y:number,v:number}[], yMin:number, yMax:number}}
 */
export function lineGeometry(values, { width, height, pad, yMin = 0, yMax = null, ticks = 4 }) {
  const max = yMax ?? niceMax(Math.max(...values, 1));
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const n = values.length;
  const x = (i) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => pad.t + ih - ((Math.min(Math.max(v, yMin), max) - yMin) / (max - yMin || 1)) * ih;
  const points = values.map((v, i) => ({ x: round(x(i)), y: round(y(v)), v }));
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = yMin + ((max - yMin) * i) / ticks;
    return { v: round(v), y: round(y(v)) };
  });
  return { points, path, yTicks, yMin, yMax: max };
}

const round = (n) => Math.round(n * 10) / 10;

function el(name, attrs = {}, parent = null) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (parent) parent.append(n);
  return n;
}

/**
 * Render a chart into `container`.
 * data: [{ label: '12 Nov', value: 24, detail: 'F and J' }]
 */
export function lineChart(container, data, { title, unit = '', yMin = 0, yMax = null, format = (v) => String(v), tone = 'primary' } = {}) {
  container.replaceChildren();
  container.classList.add('chart', `chart--${tone}`);
  if (!data.length) {
    const p = document.createElement('p');
    p.className = 'chart__empty text-muted';
    p.textContent = 'Finish a lesson or test to start your chart.';
    container.append(p);
    return;
  }
  const W = 560, H = 220;
  const pad = { t: 14, r: 16, b: 28, l: 40 };
  const g = lineGeometry(data.map((d) => d.value), { width: W, height: H, pad, yMin, yMax });

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart__svg', role: 'img', 'aria-label': `${title}: line chart of the last ${data.length} results. A table of the values follows.` });
  for (const t of g.yTicks) {
    el('line', { x1: pad.l, x2: W - pad.r, y1: t.y, y2: t.y, class: t.v === g.yMin ? 'chart__axis' : 'chart__grid' }, svg);
    const label = el('text', { x: pad.l - 8, y: t.y + 4, class: 'chart__tick', 'text-anchor': 'end' }, svg);
    label.textContent = format(t.v);
  }
  // x labels: first and last only (selective labelling)
  if (data.length) {
    const first = el('text', { x: g.points[0].x, y: H - 8, class: 'chart__tick', 'text-anchor': data.length > 1 ? 'start' : 'middle' }, svg);
    first.textContent = data[0].label;
    if (data.length > 1) {
      const last = el('text', { x: g.points.at(-1).x, y: H - 8, class: 'chart__tick', 'text-anchor': 'end' }, svg);
      last.textContent = data.at(-1).label;
    }
  }
  el('path', { d: g.path, class: 'chart__line' }, svg);
  for (const p of g.points) el('circle', { cx: p.x, cy: p.y, r: 4, class: 'chart__dot' }, svg);
  // Latest value: direct label
  if (g.points.length) {
    const p = g.points.at(-1);
    const tag = el('text', { x: Math.min(p.x, W - pad.r), y: Math.max(p.y - 12, 12), class: 'chart__value', 'text-anchor': 'end' }, svg);
    tag.textContent = `${format(p.v)}${unit}`;
  }
  const cross = el('line', { y1: pad.t, y2: H - pad.b, class: 'chart__cross', visibility: 'hidden' }, svg);
  const focus = el('circle', { r: 6, class: 'chart__focus', visibility: 'hidden' }, svg);

  const tip = document.createElement('div');
  tip.className = 'chart__tip';
  tip.hidden = true;
  container.append(svg, tip);

  const show = (clientX) => {
    if (!g.points.length) return;
    const box = svg.getBoundingClientRect();
    const sx = ((clientX - box.left) / box.width) * W;
    let best = 0;
    g.points.forEach((p, i) => { if (Math.abs(p.x - sx) < Math.abs(g.points[best].x - sx)) best = i; });
    const p = g.points[best];
    const d = data[best];
    cross.setAttribute('x1', p.x); cross.setAttribute('x2', p.x); cross.setAttribute('visibility', 'visible');
    focus.setAttribute('cx', p.x); focus.setAttribute('cy', p.y); focus.setAttribute('visibility', 'visible');
    tip.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = `${format(d.value)}${unit}`;
    const small = document.createElement('span');
    small.textContent = [d.label, d.detail].filter(Boolean).join(' · ');
    tip.append(strong, small);
    tip.hidden = false;
    const left = (p.x / W) * box.width;
    tip.style.left = `${Math.min(Math.max(left, 60), box.width - 60)}px`;
    tip.style.top = `${(p.y / H) * box.height}px`;
  };
  const hide = () => { cross.setAttribute('visibility', 'hidden'); focus.setAttribute('visibility', 'hidden'); tip.hidden = true; };
  svg.addEventListener('pointermove', (e) => show(e.clientX));
  svg.addEventListener('pointerleave', hide);

  // Table view (screen readers, and anyone who prefers numbers)
  const details = document.createElement('details');
  details.className = 'chart__table';
  const summary = document.createElement('summary');
  summary.textContent = 'Show as a table';
  const table = document.createElement('table');
  const head = table.createTHead().insertRow();
  for (const h of ['Date', 'Activity', title]) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = h; head.append(th); }
  const body = table.createTBody();
  for (const d of data) {
    const r = body.insertRow();
    r.insertCell().textContent = d.label;
    r.insertCell().textContent = d.detail || '';
    r.insertCell().textContent = `${format(d.value)}${unit}`;
  }
  details.append(summary, table);
  container.append(details);
}
