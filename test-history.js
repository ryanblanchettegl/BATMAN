/* A world's history (src/86-history.js): reigns, matches, feuds and moments from before the game begins. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const u = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'));
u.history = { reigns: [{ title: 'whw_world', holders: ['ragnar_lothbrok'], from: '2023-01', to: '2025-02', defs: 6, event: 'Rubicon' }, { title: 'whw_world', holders: ['alexander_the_great'], from: '2025-02', to: null, defs: 9, event: 'Rubicon' }],
  matches: [{ a: 'alexander_the_great', b: 'ragnar_lothbrok', winner: 'alexander_the_great', date: '2025-02', event: 'Rubicon', stars: 5, note: 'The title changed hands.' }, { a: 'alexander_the_great', b: 'ragnar_lothbrok', winner: 'ragnar_lothbrok', date: '2023-01', event: 'Rubicon', stars: 3 }],
  feuds: [{ a: ['alexander_the_great'], b: ['harald_hardrada'], from: '2025-06', to: '2026-03', heat: 80, note: 'The summer feud.' }],
  moments: [{ who: 'ragnar_lothbrok', date: '2021-06', text: 'Debuted.' }] };
ok(E.useUniverse(u).ok, 'a world with history validates');
const S = E.newGame('whw', 1, { name: 'R' }), id = x => S.w.find(w => w.uid === x).id, a = id('alexander_the_great'), r = id('ragnar_lothbrok'), h = id('harald_hardrada');
const t = S.promos.whw.titles.find(t => t.id === 'whw_world');
ok(t.hist.length === 2 && t.hist[0].h[0] === 'Ragnar Lothbrok' && t.hist[1].to === null && t.hist[0].from < 0, 'the line of champions runs back before week 1');
const hh = S.h2h[a < r ? a + '-' + r : r + '-' + a]; ok(hh && hh.n === 2 && hh.a + hh.b === 2, 'head to head counts both matches');
ok(S.w[a].log.some(x => /The title changed hands/.test(x.t)) && S.w[r].log.some(x => x.t === 'Debuted.'), 'famous nights and moments are in the careers');
ok(S.embers && S.embers[a < h ? a + '-' + h : h + '-' + a], 'a feud that ended this year leaves an ember');
ok(E.relOf && E.relOf(S, a, h) < 0 || !E.relOf, 'an old feud is real heat between them');
const S2 = E.newGame('whw', 1, { name: 'R' }); ok(JSON.stringify(S2.h2h) === JSON.stringify(S.h2h), 'the same seed gives the same history');
console.log(fails ? 'test-history: ' + fails + ' failed' : 'test-history: all passed'); process.exit(fails ? 1 : 0);
