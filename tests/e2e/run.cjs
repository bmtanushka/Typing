/**
 * Browser end-to-end tests (Playwright – a dev-only dependency, never deployed).
 *
 *   BASE=http://localhost:8090 node tests/e2e/run.cjs            # all suites
 *   BASE=http://localhost:8090 node tests/e2e/run.cjs accounts   # one suite
 *
 * Run against Apache (not `php -S`) so .htaccess rules are exercised. The accounts suite
 * needs a database and mail.driver = 'log'. Each suite starts with a fresh browser profile.
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const only = process.argv[2];
const suites = fs.readdirSync(__dirname).filter((f) => f.endsWith('.e2e.cjs') && (!only || f.startsWith(only))).sort();
let failed = 0;
for (const s of suites) {
  console.log(`\n▶ ${s}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, s)], { stdio: 'inherit', env: process.env });
  if (r.status !== 0) failed++;
}
console.log(`\n${suites.length - failed}/${suites.length} suites passed`);
process.exit(failed ? 1 : 0);
