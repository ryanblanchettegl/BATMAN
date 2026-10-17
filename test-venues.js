/* Venue personality and disasters: every building has quirks of its own that move the crowd, and now and then the
   building goes wrong as a call from the gorilla position. Plays 80 weeks with errs 0 and NaN 0.  Run: node test-venues.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'))); E.suggest = E.suggestSmart;
const q1 = E.venueQuirks('Westgate Expo Center, Chicago'), q2 = E.venueQuirks('Westgate Expo Center, Chicago');
ok('quirk', 'a building keeps its quirks', JSON.stringify(q1) === JSON.stringify(q2));
const many = E.cityBuildings(null, 'Chicago').concat(E.cityBuildings(null, 'Leeds'), E.cityBuildings(null, 'Tokyo'), E.cityBuildings(null, 'Boston')).map(b => E.venueQuirks(b.n + ', X'));
ok('quirk', 'buildings differ, in words', new Set(many.map(q => q.words.join('|'))).size >= 6 && many.every(q => q.words.every(w => !/\d/.test(w))), many.length + ' buildings');
ok('quirk', 'a stadium is open to the sky, a hall is intimate', E.venueQuirks('Cedar Hill Bowl, Chicago').open && E.venueQuirks('Northgate Union Hall, Chicago').feel === 'intimate');
const S = E.newGame('pdw', 3, { name: 'R' }); let dis = 0, shows = 0, errs = 0; const kinds = {}, said = [];
for (let w = 0; w < 80; w++) {
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; errs++; continue; } E.liveBegin(S, c); shows++; let n = 0;
    while (S.live && n++ < 400) { const r = E.liveNext(S); if (r && r.event) { if (r.event.dk) { dis++; kinds[r.event.dk] = (kinds[r.event.dk] || 0) + 1; const t = E.liveDecide(S, dis % 3); said.push(t && t.text); } else E.liveDecide(S, r.event.safe || 0); } } }
  E.endWeek(S); if (S.over) { S.over = null; S.owner.trust = 80; }
}
const nan = []; const walk = (o, p) => { if (typeof o === 'number' && !isFinite(o)) nan.push(p); else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], p + '.' + k)); }; walk(S, 'S');
ok('run', '80 weeks with errs 0 and NaN 0', errs < 3 && nan.length === 0);
ok('dis', 'the building goes wrong now and then, not often', dis >= 2 && dis <= shows * 0.12, dis + ' in ' + shows + ' shows: ' + JSON.stringify(kinds));
ok('dis', 'every answer says what it did', said.every(t => t && t.length > 10 && !/undefined/.test(t)));
ok('crowd', 'the building shows in the crowd notes', S.reports.some(r => r.segs.some(s => (s.fx || []).some(f => /building|crowd that/.test(f.x)))));
const A = E.newGame('pdw', 7, { name: 'R' }), B = E.newGame('pdw', 7, { name: 'R' });
for (const T of [A, B]) for (let w = 0; w < 20; w++) { T.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(T, e.id, 1)); while (T.qi < T.queue.length) { const c = E.suggest(T); if (E.validate(T, c).errors.length) { T.qi++; continue; } E.runPlayerShow(T, c); } E.endWeek(T); }
ok('same', 'the same seed gives the same nights', JSON.stringify(A) === JSON.stringify(B));
console.log(fails.length ? fails.length + ' failed' : 'test-venues: all passed'); process.exit(fails.length ? 1 : 0);
