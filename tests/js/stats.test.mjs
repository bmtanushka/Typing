import { wpm, accuracy, computeStats, formatTime, recordKey, mergeKeyStats, problemKeys, avgLatency } from '../../public_html/assets/js/engine/stats.js';

test('WPM: 5 chars in 1 minute is 1 WPM', () => {
  assert.equal(wpm(5, 60000), 1);
  assert.equal(wpm(250, 60000), 50);
  assert.equal(wpm(125, 30000), 50);
});

test('WPM is 0 with no time or no chars', () => {
  assert.equal(wpm(10, 0), 0);
  assert.equal(wpm(0, 1000), 0);
  assert.equal(wpm(10, -5), 0);
});

test('accuracy counts every wrong keystroke', () => {
  assert.equal(accuracy(100, 0), 100);
  assert.equal(accuracy(100, 4), 96);
  assert.equal(accuracy(0, 0), 100);
  assert.equal(accuracy(3, 5), 0, 'never negative');
});

test('computeStats rounds and separates net/raw WPM', () => {
  const s = computeStats({ correctChars: 200, keystrokes: 220, errors: 20, elapsedMs: 60000 });
  assert.equal(s.wpm, 40);
  assert.equal(s.rawWpm, 44);
  assert.equal(s.accuracy, 90.9);
  assert.equal(s.errors, 20);
});

test('formatTime', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65000), '1:05');
  assert.equal(formatTime(599999), '9:59');
});

test('recordKey tracks attempts, errors and sensible latency only', () => {
  const s = {};
  recordKey(s, 'a', true, null);
  recordKey(s, 'a', false, 200);
  recordKey(s, 'a', true, 400);
  recordKey(s, 'a', true, 9000); // long pause ignored
  assert.deepEqual(s.a, { attempts: 4, errors: 1, latencyTotal: 600, latencyCount: 2 });
  assert.equal(avgLatency(s.a), 300);
});

test('mergeKeyStats sums without mutating inputs', () => {
  const a = { a: { attempts: 2, errors: 1, latencyTotal: 100, latencyCount: 1 } };
  const b = { a: { attempts: 3, errors: 0, latencyTotal: 300, latencyCount: 3 }, b: { attempts: 1, errors: 1, latencyTotal: 0, latencyCount: 0 } };
  const m = mergeKeyStats(a, b);
  assert.deepEqual(m.a, { attempts: 5, errors: 1, latencyTotal: 400, latencyCount: 4 });
  assert.equal(m.b.attempts, 1);
  assert.equal(a.a.attempts, 2);
});

test('problemKeys ranks by error rate, ignores space and rare keys', () => {
  const s = {
    d: { attempts: 10, errors: 4, latencyTotal: 0, latencyCount: 0 },
    k: { attempts: 10, errors: 2, latencyTotal: 0, latencyCount: 0 },
    ' ': { attempts: 10, errors: 9, latencyTotal: 0, latencyCount: 0 },
    q: { attempts: 1, errors: 1, latencyTotal: 0, latencyCount: 0 },
    f: { attempts: 10, errors: 0, latencyTotal: 0, latencyCount: 0 },
  };
  assert.deepEqual(problemKeys(s).map((k) => k.char), ['d', 'k']);
});
