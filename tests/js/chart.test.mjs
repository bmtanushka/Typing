import { lineGeometry, niceMax } from '../../public_html/assets/js/core/chart.js';

const box = { width: 200, height: 100, pad: { t: 0, r: 0, b: 0, l: 0 } };

test('niceMax rounds up to readable axis maxima', () => {
  assert.equal(niceMax(0), 10);
  assert.equal(niceMax(7), 10);
  assert.equal(niceMax(23), 25);
  assert.equal(niceMax(41), 50);
  assert.equal(niceMax(101), 200);
});

test('line geometry maps values into the plot box', () => {
  const g = lineGeometry([0, 50, 100], { ...box, yMax: 100 });
  assert.deepEqual(g.points.map((p) => [p.x, p.y]), [[0, 100], [100, 50], [200, 0]]);
  assert.equal(g.path, 'M0 100 L100 50 L200 0');
  assert.equal(g.yTicks.length, 5);
  assert.equal(g.yTicks[0].v, 0);
});

test('single point is centred; values are clamped to the axis', () => {
  const g = lineGeometry([120], { ...box, yMin: 50, yMax: 100 });
  assert.equal(g.points[0].x, 100);
  assert.equal(g.points[0].y, 0);
  const h = lineGeometry([20], { ...box, yMin: 50, yMax: 100 });
  assert.equal(h.points[0].y, 100);
});
