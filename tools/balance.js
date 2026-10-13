/* Balance: plays every company for 100 weeks on three seeds with suggested cards and prints one table.
   Run: node tools/balance.js [weeks]   (build first). Later work reruns it to see what moved. */
require('../engine.js');
const fs = require('fs'), path = require('path'), E = globalThis.GP, WEEKS = +process.argv[2] || 100;
const U = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'universes', 'public_domain.json'), 'utf8'));
E.useUniverse(U);
const ids = process.argv[3] ? process.argv[3].split(',') : Object.keys(E.newGame('pdw', 1, { name: 'R' }).promos);
const row = (a) => a.map((x, i) => String(x).padStart(i ? 9 : 5)).join('');
console.log(row(['co', 'cash0', 'cash1', 'pop0', 'pop1', 'r-exp', 'trust', 'weeks', 'roster', 'freeag', 'saveKB']));
for (const pid of ids) {
  const acc = [];
  for (const seed of [1, 2, 3]) {
    const S = E.newGame(pid, seed, { name: 'R' }), P = S.promos[pid], c0 = P.cash, p0 = P.image, d = [];
    let w = 0;
    for (; w < WEEKS && !S.over; w++) {
      S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
      if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
      while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } const r = E.runPlayerShow(S, c); d.push(r.rep.rating - r.rep.exp); }
      E.endWeek(S);
    }
    acc.push([c0 / 1e6, P.cash / 1e6, p0, P.image, d.reduce((a, b) => a + b, 0) / Math.max(1, d.length), S.trust, w, S.w.filter(x => x.promo === pid && !x.nw).length, S.w.filter(x => x.promo === 'FA' && !x.rt).length, JSON.stringify(S).length / 1024]);
  }
  const m = acc[0].map((_, i) => acc.reduce((a, r) => a + r[i], 0) / acc.length), f = (v, n) => v.toFixed(n);
  console.log(row([pid, f(m[0], 1) + 'M', f(m[1], 1) + 'M', f(m[2], 1), f(m[3], 1), f(m[4], 2), f(m[5], 0), f(m[6], 0), f(m[7], 0), f(m[8], 0), f(m[9], 0)]));
}
