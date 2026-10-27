/* Runs every headless test (test-*.js at the root; test-golden.js and test-src.js are run or used elsewhere) and prints a
   summary. Build first: node build.js. SHARD=1/4 runs the first quarter, so CI can split the work across machines.
   Run: node tools/headless-tests.js */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const skip = new Set(['test-golden.js', 'test-src.js', 'test-uni.js']);
let all = fs.readdirSync(root).filter(f => /^test-.*\.js$/.test(f) && !skip.has(f)).sort();
const m = /^(\d+)\/(\d+)$/.exec(process.env.SHARD || '');
if (m) all = all.filter((f, i) => i % +m[2] === +m[1] - 1);
const failed = [];
for (const f of all) {
  const t = Date.now(), r = spawnSync(process.execPath, [path.join(root, f)], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  const ok = r.status === 0; if (!ok) failed.push(f);
  console.log((ok ? 'PASS ' : 'FAIL ') + f + ' (' + Math.round((Date.now() - t) / 1000) + 's)');
  if (!ok) console.log(((r.stdout || '') + (r.stderr || '')).split('\n').slice(-25).join('\n'));
}
console.log(failed.length ? 'FAILED: ' + failed.join(', ') : 'all ' + all.length + ' headless tests passed');
process.exit(failed.length ? 1 : 0);
