/* The Clock Wall booking screen's engine questions (Research/docs/plans/booking-clock-wall.md): who fits a spot, what
   a card changes, the feuds left off tonight. 60 weeks of every promotion: no errors, no NaN, the state untouched by
   asking, and the same answer twice.  Run: node test-booking-wall.js [weeks] */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const WEEKS = +(process.argv[2] || 60);
let bad = 0, asked = 0, fits = 0, knock = 0, loose = 0;
const fail = (...a) => { bad++; if (bad < 20) console.log('FAIL', ...a); };
for (const p of E.universe().promotions) {
  const S = E.newGame(p.id, 7, { name: 'R' });
  for (let wk = 0; wk < WEEKS && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) {
      const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); }
      // empty one place on each match and ask who fits it
      const before = JSON.stringify(S);
      try {
        c.forEach((m, i) => {
          const holes = JSON.parse(JSON.stringify(c)); holes[i].sides[0][0] = null;
          const f = E.fitsFor(S, holes, i, 0);
          asked++; fits += f.length;
          f.forEach(x => { if (!S.w[x.id] || isNaN(x.score)) fail(p.id, 'fitsFor', x); if (c.some((o, k) => k !== i && o.sides.some(s => s.indexOf(x.id) >= 0))) fail(p.id, 'booked twice', x.name); });
          if (JSON.stringify(E.fitsFor(S, holes, i, 0)) !== JSON.stringify(f)) fail(p.id, 'fitsFor not repeatable');
        });
        const k = E.cardKnock(S, c), l = E.looseThreads(S, c); knock += k.length; loose += l.length;
        k.forEach(x => { if (!x.text || /undefined|NaN/.test(x.text)) fail(p.id, 'knock', x); });
        l.forEach(x => { if (isNaN(x.heat) || /undefined/.test(x.stakes + x.a + x.b + x.phase)) fail(p.id, 'loose', x); });
        E.looseThreads(S, []).forEach(x => { if (!x.ids.length) fail(p.id, 'loose no ids'); });
      } catch (e) { fail(p.id, 'week', S.week, e.stack.split('\n').slice(0, 3).join(' | ')); }
      if (JSON.stringify(S) !== before) fail(p.id, 'asking changed the game in week', S.week);
      if (E.validate(S, c).errors.length) { S.qi++; continue; }
      E.runPlayerShow(S, c);
    }
    E.endWeek(S);
  }
}
console.log('asked', asked, 'spots,', fits, 'names offered,', knock, 'knock-on lines,', loose, 'loose threads');
if (!asked || !fits || !knock) fail('nothing was asked or answered');
if (bad) { console.log('FAILED: ' + bad); process.exit(1); }
console.log('test-booking-wall: all passed');
