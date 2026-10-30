/* Golden masters (docs/plans/typescript-engine.md, step 1). Every company in both built-in worlds plays 100 weeks on fixed
   seeds; a fingerprint (sha256) of the whole state is kept every 10 weeks. The rebuild must reproduce every fingerprint.
   Record: node test-golden.js record      Check: node test-golden.js
   Options: SEEDS=3,11,29 (default), WEEKS=100. Fingerprints live in tests/golden.json. */
require('./engine.js');
const fs = require('fs'), crypto = require('crypto'), E = globalThis.GP;
const SEEDS = (process.env.SEEDS || '3,11,29').split(',').map(Number), WEEKS = Number(process.env.WEEKS || 100);
const FILE = 'tests/golden.json', record = process.argv[2] === 'record';
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
function run(id, seed) {
  const S = E.newGame(id, seed, { name: 'R' }), marks = [];
  for (let wk = 1; wk <= WEEKS && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S);
    if (wk % 10 === 0 || S.over) marks.push(wk + ':' + sha(JSON.stringify(S, (k, v) => k === 'dir' ? undefined : v)));   // the Director's reading (step 1) is left out until it changes play
  }
  return marks;
}
const out = {}, old = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
let bad = 0, n = 0;
for (const uni of ['public_domain', 'parody']) {
  E.useUniverse(JSON.parse(fs.readFileSync('universes/' + uni + '.json', 'utf8')));
  for (const p of E.universe().promotions) for (const seed of SEEDS) {
    const key = uni + '/' + p.id + '/' + seed, marks = run(p.id, seed); out[key] = marks; n++;
    if (record) { console.log('rec ', key, marks.at(-1)); continue; }
    const want = old[key];
    if (!want) { console.log('NEW ', key, '(not recorded)'); bad++; continue; }
    const i = marks.findIndex((m, k) => m !== want[k]);
    if (i < 0 && marks.length === want.length) console.log('ok  ', key);
    else { bad++; console.log('FAIL', key, 'first differs at', (want[i] || marks[i] || '?').split(':')[0] ? 'week ' + (want[i] || marks[i]).split(':')[0] : 'the end'); }
  }
}
if (record) { fs.mkdirSync('tests', { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n'); console.log('recorded', n, 'games to', FILE); process.exit(0); }
if (bad) { console.log('FAILED: ' + bad + ' of ' + n); process.exit(1); }
console.log('test-golden: all ' + n + ' games match');
