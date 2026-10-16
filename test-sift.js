/* Story sifting (src/84-sift.js): after 30 weeks of each of three companies, the game finds storylines in what has
   happened. Checks there are some, of more than one kind, with facts and a pitch, never a pair already feuding,
   and that reading them twice gives the same list (sifting only reads the game). */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
for (const pi of [0, 1, 2]) {
  const S = E.newGame(E.universe().promotions[pi].id, 3, { name: 'R' });
  for (let wk = 0; wk < 30 && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S);
  }
  const before = JSON.stringify(S), L = E.sift(S), kinds = new Set(L.map(x => x.k));
  ok(L.length >= 3, S.player + ': only ' + L.length + ' stories found');
  ok(kinds.size >= 3, S.player + ': only ' + kinds.size + ' kinds of story');
  ok(L.every(x => x.facts.length && x.pitch && !/[{}#]/.test(x.pitch + x.facts.join(''))), S.player + ': a story without facts or with an unfilled slot');
  ok(L.every(x => !S.feuds.some(f => !f.res && ((f.a.includes(x.a) && f.b.includes(x.b)) || (f.a.includes(x.b) && f.b.includes(x.a))))), S.player + ': a pair already feuding was offered');
  ok(JSON.stringify(E.sift(S)) === JSON.stringify(L) && JSON.stringify(S) === before, S.player + ': sifting changed the game or gave a different list');
  console.log(S.player + ': ' + L.map(x => x.n + ' (' + S.w[x.a].name + ', ' + S.w[x.b].name + ')').join('; '));
}
// unfinished business: an old story that ended hot comes back as a pitch after twelve weeks, not before
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }), R = E.storyPeople(S).filter(w => w.g === 'M' && !w.n);
  const a = Math.min(R[1].id, R[4].id), b = Math.max(R[1].id, R[4].id);
  S.embers = { [a + '-' + b]: { w: S.week - 6, h: 80, n: 1 } }; ok(!E.sift(S).some(x => x.k === 'again'), 'an old story came back too soon');
  S.embers[a + '-' + b].w = S.week - 14; ok(E.sift(S).some(x => x.k === 'again' && x.a === a && x.b === b), 'an old story that ended hot was not pitched again');
}
if (fails) { console.log('FAILED: ' + fails); process.exit(1); }
console.log('test-sift: all passed');
