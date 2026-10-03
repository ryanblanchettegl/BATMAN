/* The same promotion and seed played twice for 20 weeks must end in identical state.  Run: node test-determinism.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
function run(id, seed) {
  const S = E.newGame(id, seed, { name: 'R' });
  for (let wk = 0; wk < 20 && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) E.resolvePre(S, c, 0); if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S);
  }
  return JSON.stringify(S);
}
let bad = 0;
for (const p of E.universe().promotions) for (const seed of [3, 11]) {
  const a = run(p.id, seed), b = run(p.id, seed), same = a === b;
  if (!same) { bad++; let i = 0; while (a[i] === b[i]) i++; console.log('FAIL', p.id, seed, 'differs at', i, a.slice(Math.max(0, i - 60), i + 40)); } else console.log('ok  ', p.id, seed);
}
if (bad) { console.log('FAILED: ' + bad); process.exit(1); }
console.log('test-determinism: all passed');
