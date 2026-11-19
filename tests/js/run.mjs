/**
 * Tiny dependency-free JS test runner (Node 18+).
 * Usage: node tests/js/run.mjs
 * Test files: tests/js/*.test.mjs, each calling test(name, fn).
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const tests = [];
globalThis.test = (name, fn) => tests.push({ name, fn, file: currentFile });
globalThis.assert = assert;
let currentFile = '';

for (const f of readdirSync(here).filter((f) => f.endsWith('.test.mjs')).sort()) {
  currentFile = f;
  await import(pathToFileURL(join(here, f)).href);
}

let passed = 0, failed = 0, lastFile = '';
for (const t of tests) {
  if (t.file !== lastFile) { console.log(t.file); lastFile = t.file; }
  try {
    await t.fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${t.name}`);
  } catch (e) {
    failed++;
    console.log(`  \x1b[31m✗ ${t.name}\x1b[0m\n    ${e.message.split('\n').join('\n    ')}`);
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
