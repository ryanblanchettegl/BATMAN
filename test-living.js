/* Living storylines (src/21-living.js, docs/plans/living-storylines.md): no lengths. Plays 60 weeks of three companies
   and checks that feuds can live long and hot, that some never catch on and fizzle, that a
   planned ending and a match marked as the ending both end a feud with a payoff, and that nothing has a length. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, GP_ember = (S, f) => E.feudEmber(S, f);
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
ok(rivalEnds >= 3, 'rivals ended only ' + rivalEnds + ' feuds');
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
// embers: two who finished a feud start the next one warmer
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }); for (let i = 0; i < 3; i++) week(S);
  const R = E.storyPeople(S).filter(w => w.g === 'M' && !w.n && !w.hurt), a = R[2].id, b = R[5].id; S.bp = 10;
  const cold = E.storyStart(S, R[3].id, R[6].id); const h0 = S.feuds.find(f => f.id === cold.id).heat;
  const r = E.storyStart(S, a, b), f = S.feuds.find(x => x.id === r.id); f.heat = 80; E.storyEnd(S, f.id); GP_ember(S, f);
  ok(E.storyPreview(S, a, b).good.some(t => /history/.test(t)), 'Start a feud does not say they have history');
  const r2 = E.storyStart(S, a, b), f2 = S.feuds.find(x => x.id === r2.id);
  ok(f2.heat > h0 && f2.log.some(l => /picks up where it left off/.test(l.t)), 'a feud between two with history did not start warmer (' + f2.heat + ' against ' + h0 + ')');
}
// what the booker can do from Storylines: a sit-down heats it and costs one, raising the stakes freshens it, a champion's belt goes on it
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }); S.bp = 10;
  const P = S.promos[S.player], t = P.titles.find(x => !x.tag && x.holders.length), ch = t.holders[0];
  const o = E.storyPeople(S).find(w => w.id !== ch && w.g === S.w[ch].g && !w.n && !w.hurt);
  const r = E.storyStart(S, ch, o.id), f = S.feuds.find(x => x.id === r.id), bp0 = S.bp, h0 = f.heat;
  const sd = E.storyDo(S, f.id, 'sitdown'); ok(sd.ok && f.heat > h0 && S.bp === bp0 - 1, 'a sit-down did not heat the feud for one booking power');
  ok(!E.storyDo(S, f.id, 'sitdown').ok, 'two sit-downs in one week were allowed');
  f.fresh = 30; const st = E.storyDo(S, f.id, 'stakes'); E.heatStory(S, f, 1);
  ok(st.ok && !!f.stakes && f.fresh > 30, 'raising the stakes did not set them or freshen the story');
  const tt = E.storyDo(S, f.id, 'title'); ok(tt.ok && f.title === t.id, 'the champion\'s belt did not go on the feud');
}
// the back burner: a cold story set aside for four weeks does not fizzle, freshens, and the suggested card leaves it alone
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }); S.bp = 10;
  const R = E.storyPeople(S).filter(w => w.g === 'M' && !w.n && !w.hurt), r = E.storyStart(S, R[4].id, R[7].id), f = S.feuds.find(x => x.id === r.id);
  f.heat = 10; f.fresh = 40; ok(E.storyDo(S, f.id, 'shelf').ok && f.bb === S.week + 4, 'the back burner did not take');
  for (let i = 0; i < 4; i++) { const c = E.suggest(S); ok(!c.some(m => m.sides && m.sides.length === 2 && ((m.sides[0][0] === f.a[0] && m.sides[1][0] === f.b[0]) || (m.sides[0][0] === f.b[0] && m.sides[1][0] === f.a[0]))), 'the suggested card booked a story on the back burner'); S.qi = S.queue.length; E.endWeek(S); }
  ok(!f.res && f.fresh > 40, 'a story on the back burner fizzled or did not freshen (res ' + f.res + ', fresh ' + f.fresh + ')');
}
// a contract signing makes the match and plans the ending for the next big event
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }); S.bp = 10;
  const R = E.storyPeople(S).filter(w => w.g === 'M' && !w.n && !w.hurt), r = E.storyStart(S, R[2].id, R[5].id), f = S.feuds.find(x => x.id === r.id), h0 = f.heat;
  const c = E.suggest(S).filter(m => !m.sides.some(sd => sd.includes(f.a[0]) || sd.includes(f.b[0]))); S.segs = [{ k: 'signing', who: [f.a[0], f.b[0]], pos: 0, len: 'M' }]; E.fitShow(S, c);
  const v = E.validate(S, c); ok(!v.errors.length, 'the signing could not be booked: ' + v.errors.join(' | '));
  if (!v.errors.length) { E.runPlayerShow(S, c); ok(S.reports[0].segs.some(x => x.booked === 'signing') && f.endAt != null && f.finale && f.heat > h0, 'a contract signing did not make the match, plan the ending or heat the feud'); }
}
// escalation: a cage is too soon for a cold feud and earned for a white hot one; a submission match fits early
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }); S.bp = 10;
  const R = E.storyPeople(S).filter(w => w.g === 'M' && !w.n && !w.hurt), r = E.storyStart(S, R[1].id, R[4].id), f = S.feuds.find(x => x.id === r.id);
  const m = { sides: [[f.a[0]], [f.b[0]]] }; f.heat = 25; let o = E.stipFits(S, m);
  ok(o && o.cage === 'soon' && o.mask === 'soon' && o.sub !== 'soon', 'a cold feud: ' + JSON.stringify(o));
  f.heat = 90; o = E.stipFits(S, m); ok(o && o.cage === 'good' && o.mask === 'good', 'a white hot feud: ' + JSON.stringify(o));
}
if (fails) { console.log('FAILED: ' + fails); process.exit(1); }
console.log('test-living: all passed');
