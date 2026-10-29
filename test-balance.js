/* Balance targets (Bill, 21 October). Plays a year as every company model twice: once pressing Suggest a card for
   every show, once with the full suggestion (E.suggestSmart, a stand-in for a booker who thinks). Suggest a card lands
   around a C and puts the job at risk; the thinking booker keeps it and grows the company; nobody is handed the
   company in the first year.  Run: node test-balance.js [weeks] */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const WEEKS = +process.argv[2] || 48, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const OF = { corporate: 'whw', outlaw: 'pdp', spectacle: 'ldd', tradition: 'lta', joshi: 'kjp', underdog: 'ttt' };
const med = L => { const s = L.slice().sort((a, b) => a - b); return s.length ? s[s.length >> 1] : 0; };
function play(id, smart, seed) {
  const S = E.newGame(id, seed || 3, { name: 'R' }), P = S.promos[id], cs = [];
  let lowTrust = 100, handed = null;
  for (let wk = 0; wk < WEEKS && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => { if (e.type === 'handover' && handed == null) handed = S.week; E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1); });
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) {
      const card = smart ? E.suggestSmart(S) : E.suggest(S), pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); }
      cs.push(E.repCS(E.runPlayerShow(S, card).rep));
    }
    E.endWeek(S);
    if (!S.owner.me) lowTrust = Math.min(lowTrust, S.owner.trust);
  }
  return { id, over: S.over ? S.over.why : null, cs: med(cs), grade: E.grade(med(cs)), dPop: P.image - P.image0, lowTrust, handed, trust: S.owner.trust };
}
const R = {};
Object.keys(OF).forEach(m => { R[m] = { flat: play(OF[m], false), smart: play(OF[m], true) }; });
Object.keys(R).forEach(m => { const f = R[m].flat, s = R[m].smart; console.log(m.padEnd(10), 'suggest', f.grade, 'pop', f.dPop.toFixed(1), 'trust', Math.round(f.trust), f.over || '', '| thinking', s.grade, 'pop', s.dPop.toFixed(1), 'trust', Math.round(s.trust), s.over || ''); });
const all = k => Object.keys(R).map(m => R[m][k]);
const flat = all('flat'), smart = all('smart');
ok('b1', 'Suggest a card: the median show is a C band grade (C- to C+) for most models', flat.filter(r => r.cs >= 50 && r.cs < 65).length >= 4, flat.map(r => r.grade).join(' '));
// one seed swings a median by several points (28 October: the corporate model ran 59 to 72 over eight seeds, on main and with the Director alike), so b2 averages three
const flat3 = Object.keys(OF).map(m => (R[m].flat.cs + play(OF[m], false, 4).cs + play(OF[m], false, 5).cs) / 3);
ok('b2', 'Suggest a card never earns better than a B- median (three seeds)', flat3.every(v => v < 70), flat3.map(v => v.toFixed(1)).join(' '));
ok('b3', 'the thinking booker is a B or better on most models', smart.filter(r => r.cs >= 70).length >= 4, smart.map(r => r.grade).join(' '));
ok('b4', 'the thinking booker beats Suggest a card on every model', Object.keys(R).every(m => R[m].smart.cs > R[m].flat.cs));
ok('b5', 'the thinking booker is never fired or broke in a year', smart.every(r => !r.over), smart.map(r => r.over || '-').join(' '));
ok('b6', 'Suggest a card puts the job at risk: owner trust falls below 30 on most models', flat.filter(r => r.lowTrust < 30 || r.over === 'fired').length >= 4, flat.map(r => Math.round(r.lowTrust)).join(' '));
ok('b7', 'Suggest a card shrinks the company on most models', flat.filter(r => r.dPop < 0).length >= 4, flat.map(r => r.dPop.toFixed(1)).join(' '));
ok('b8', 'the thinking booker grows or holds popularity on most models', smart.filter(r => r.dPop >= -1).length >= 4, smart.map(r => r.dPop.toFixed(1)).join(' '));
ok('b9', 'nobody is handed the company in the first year', flat.concat(smart).every(r => r.handed == null || r.handed > 48), flat.concat(smart).map(r => r.handed || '-').join(' '));
ok('b10', 'a booker is never bankrupt: the owner covers the losses', flat.concat(smart).every(r => r.over !== 'bankrupt'));
console.log(fails.length ? fails.length + ' FAILED' : 'all passed');
process.exit(fails.length ? 1 : 0);
