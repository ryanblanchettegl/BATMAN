/* Big events belong to a company (src/42-events.js, NEXT.md job 3): twelve each, a flagship name of their own,
   filled for an old save that has none, and the show on the night carries the company's name for it. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' });
const flags = S.order.map(id => S.promos[id].events.find(e => e.t === 'flag'));
ok(S.order.every(id => S.promos[id].events.length === 12), 'a company does not have twelve big events');
ok(flags.every(Boolean) && new Set(flags.map(f => f.n)).size === flags.length, 'two companies share a flagship name: ' + flags.map(f => f && f.n).join(', '));
const P = S.promos[S.player], fm = P.flagship;
ok(E.events(S)[fm].flag && E.events(S)[fm].n === P.events[fm].n, 'the player\'s flagship is not marked');
// an old save: no events on the company, and they are filled the first time they are needed
delete P.events; const nb = E.nextBig(S); ok(P.events && P.events.length === 12 && !!nb.name, 'an old save did not get its events');
// the show on the night uses the company's own name for it
for (let w = 0; w < 50 && !S.over; w++) {
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
  while (S.qi < S.queue.length) { const sh = S.queue[S.qi];
    if (sh.big && sh.flag) ok(sh.name === P.name + ' ' + P.events[fm].n, 'the flagship night is called ' + sh.name);
    const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S);
}
if (fails) { console.log('FAILED: ' + fails); process.exit(1); }
console.log('test-events: all passed');
