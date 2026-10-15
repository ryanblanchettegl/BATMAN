/* Contract clauses (src/97-clauses.js): what a wrestler wants, what each clause saves, and what each does. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const S = E.newGame('pdw', 1, { name: 'R' }), P = S.promos.pdw; S.owner.trust = 90;
const fa = S.w.filter(w => w.promo === 'FA' && !w.rt && !w.nw && E.canSign(S, w)).map(w => ({ w, c: E.clauses(S, w.id) })).filter(x => x.c.length);
ok(fa.length > 0, 'no free agent wants any clause');
ok(fa.every(x => x.c.length <= 3 && x.c.every(c => c.save > 0)), 'a clause list is too long or saves nothing');
// signing with a clause: they accept less, the clause is kept, and the title clause makes a promise
const t = fa.find(x => x.c.some(c => c.k === 'title')) || fa[0], w = t.w, ask = E.ask(S, w), cl = t.c.map(c => c.k), save = t.c.reduce((a, c) => a + c.save, 0);
const r = E.sign(S, w.id, ask - save + 50, 48, cl);
ok(r.ok && w.promo === 'pdw' && w.cl && cl.every(k => w.cl[k] != null), 'signing with clauses for less did not work: ' + r.msg);
if (cl.includes('title')) ok(S.quests.some(q => q.type === 'shot' && q.w === w.id), 'the title clause made no promise');
// a no-cut promise makes letting them go dear
const nc = S.w.filter(x => x.promo === 'pdw' && !x.nw)[5]; nc.cl = { nocut: S.week }; const c0 = P.cash; const msg = E.release(S, nc.id);
ok(/no-cut/.test(msg) && c0 - P.cash >= nc.wage * 24, 'breaking a no-cut promise was cheap: ' + msg);
// paid travel: the body recovers faster
const tr = S.w.filter(x => x.promo === 'pdw' && !x.nw)[6], ot = S.w.filter(x => x.promo === 'pdw' && !x.nw)[7]; tr.cl = { travel: S.week }; tr.cond = 60; ot.cond = 60;
E.endWeek(S); ok(tr.cond > ot.cond, 'paid travel did not help the body: ' + tr.cond + ' against ' + ot.cond);
// renewing with a clause: the price comes down and the clause is kept for the new deal
{
  const T = E.newGame('pdw', 2, { name: 'R' }), w = T.w.filter(x => x.promo === 'pdw' && !x.nw && E.clauses(T, x.id).length)[0];
  if (w) { const k = E.clauses(T, w.id)[0].k, a0 = E.renewAsk(T, w.id, 48), a1 = E.renewAsk(T, w.id, 48, [k]); const msg = E.renew(T, w.id, 48, [k]);
    ok(a1 < a0 && w.cl && w.cl[k] != null && w.wage === a1 && /in the contract/.test(msg), 'renewing with a clause did not work: ' + msg); }
}
// two dates a week: never on a third show that week, and the suggested card leaves them off
{
  const T = E.newGame('pdw', 3, { name: 'R' }), R = T.w.filter(x => x.promo === 'pdw' && !x.nw).sort((a, b) => b.ovr - a.ovr); R.slice(0, 6).forEach(w => { w.cl = { dates: T.week }; });
  let worst = 0;
  for (let wk = 0; wk < 6; wk++) { T.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(T, e.id, 0)); const n = {};
    while (T.qi < T.queue.length) { const c = E.suggest(T), pr = E.preShow(T, c); if (pr) { E.resolvePre(T, c, 0); E.fitShow(T, c); } if (E.validate(T, c).errors.length) { T.qi++; continue; }
      c.forEach(m => m.sides.flat().forEach(id => { if (R.slice(0, 6).some(w => w.id === id)) n[id] = (n[id] || 0) + 1; })); E.runPlayerShow(T, c); }
    Object.values(n).forEach(v => { worst = Math.max(worst, v); }); E.endWeek(T); }
  ok(worst <= 2, 'somebody with two dates a week worked ' + worst);
}
if (fails) { console.log('FAILED: ' + fails); process.exit(1); }
console.log('test-clauses: all passed');
