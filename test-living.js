/* Living storylines (src/21-living.js, docs/plans/living-storylines.md): no lengths. Plays 60 weeks of three companies
   and checks that feuds can live long and hot, that some never catch on and fizzle, that a
   planned ending and a match marked as the ending both end a feud with a payoff, and that nothing has a length. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const week = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); } E.endWeek(S); };
let longest = 0, fizz = 0, rivalEnds = 0, stale = 0, ripe = 0;
for (const pi of [0, 1, 2]) {
  const S = E.newGame(E.universe().promotions[pi].id, 3, { name: 'R' }), seen = {};
  for (let wk = 0; wk < 60 && !S.over; wk++) {
    week(S);
    S.feuds.forEach(f => { seen[f.id] = f; if (!f.res) { const p = E.feudPlan(S, f); if (p.phase === 'stale') stale++; if (p.ripe) ripe++; if (f.heat >= 50) longest = Math.max(longest, S.week - f.start); } });
  }
  Object.values(seen).forEach(f => { if (f.fizzle === 'cold') fizz++; if (f.res && !f.dead && f.promo !== S.player) rivalEnds++; ok(f.len == null || f.pay == null || f.start < 1, 'feud ' + f.id + ' was given a length'); });
}
console.log('longest hot feud ' + longest + ' weeks, fizzled ' + fizz + ', rival endings ' + rivalEnds + ', stale weeks seen ' + stale + ', ripe weeks seen ' + ripe);
ok(longest >= 10, 'no feud stayed hot for ten weeks or more');
ok(fizz >= 1, 'no feud ever fizzled out');
ok(stale >= 1 && ripe >= 1, 'no feud ever went stale or ripe');
// the booker ends one: a planned ending at the next big event pays off when the two meet on that show
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }); for (let i = 0; i < 6; i++) week(S);
  const f = S.feuds.filter(x => !x.res && x.promo === S.player).sort((a, b) => b.heat - a.heat)[0];
  ok(!!f, 'no feud to end');
  if (f) { const r = E.storyPlanEnd(S, f.id); ok(r.ok && f.endAt != null, 'planning an ending did not take');
    for (let i = 0; i < 6 && !f.res; i++) week(S);
    ok(f.res && !f.dead, 'the planned ending did not settle the feud with a payoff (res ' + f.res + ', dead ' + f.dead + ')'); }
  // a match marked as the ending ends it on a weekly show
  const g = S.feuds.filter(x => !x.res && x.promo === S.player)[0];
  // (a disqualification or a count-out is not an ending, so it may take a second try)
  if (g) { for (let t = 0; t < 4 && !g.res; t++) { if (S.qi >= S.queue.length) E.endWeek(S); const c = E.suggest(S); c.unshift({ mt: '1v1', sides: [[g.a[0]], [g.b[0]]], len: 'M', stip: 'std', end: 1 }); E.fitShow(S, c);
    if (!E.validate(S, c).errors.length) E.runPlayerShow(S, c); else S.qi++; }
    ok(g.res && !g.dead, 'a match marked as the ending did not end it'); }
}
if (fails) { console.log('FAILED: ' + fails); process.exit(1); }
console.log('test-living: all passed');
