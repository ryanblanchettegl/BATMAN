/* Runs every browser test in app/tests (one after another) and prints a summary. Build first: node build.js
   Needs Playwright with Chromium: NODE_PATH=<dir containing playwright> npm run test:browser
   Pass names to run some: npm run test:browser -- cards roster */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const dir = path.join(__dirname, '..', 'app', 'tests');
const all = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'helper.js' && !f.startsWith('_')).map(f => f.replace(/\.js$/, ''));
const names = process.argv.slice(2).length ? process.argv.slice(2) : all;
const failed = [];
for (const n of names) {
  console.log('=== ' + n);
  const r = spawnSync(process.execPath, [path.join(dir, n + '.js')], { stdio: 'inherit', env: process.env });
  if (r.status !== 0) failed.push(n);
}
console.log(failed.length ? 'FAILED: ' + failed.join(', ') : 'all browser tests passed: ' + names.join(', '));
process.exit(failed.length ? 1 : 0);
