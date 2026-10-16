/* Scenarios as data: each built-in scenario plays out exactly as it did before it was data, a world package can bring
   its own, and a bundled one plays 60 weeks with errs 0 and NaN 0.  Run: node test-scenarios.js */
require('./engine.js');
const fs = require('fs'), crypto = require('crypto'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const PD = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')); E.useUniverse(PD);
const md5 = o => crypto.createHash('md5').update(JSON.stringify(o)).digest('hex');
const REF = JSON.parse(fs.readFileSync('tests/scenario-reference.json', 'utf8')), CHK = JSON.parse(fs.readFileSync('tests/scenario-checks.json', 'utf8'));
const play = (S, weeks) => { for (let w = 0; w < weeks && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length && !S.over) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); } if (!S.over) E.endWeek(S); } };
const FORCE = { rescue: S => { S.promos[S.player].cash = 2e6; }, champion: S => { const P = S.promos[S.player], w = S.w[S.scn.target]; const top = P.titles.filter(t => !t.tag && t.g === w.g).sort((a, b) => b.lvl - a.lvl)[0]; top.holders = [w.id]; }, war: S => { S.scn.me = [2, 3]; S.scn.rv = [0]; } };
for (const sc of E.SCENARIOS.filter(s => REF[s.id])) {
  const S = E.scenarioStart(sc.id), r = REF[sc.id];
  ok(sc.id, 'starts exactly as before', md5(S) === r.start);
  play(S, 60); const res = S.scn.res, score = res.score; delete res.score;
  ok(sc.id, 'plays out exactly as before', md5(S) === r.end && S.week === r.week && JSON.stringify(res) === JSON.stringify(r.res), 'week ' + S.week + ': ' + res.text);
  ok(sc.id, 'ends with a score from 0 to 100', score >= 0 && score <= 100, String(score));
  const T = E.scenarioStart(sc.id); ok(sc.id, 'the losing words are as before', JSON.stringify(E.scnCheck(T)) === JSON.stringify(CHK[sc.id].lose));
  FORCE[sc.id](T); ok(sc.id, 'the winning words are as before', JSON.stringify(E.scnCheck(T)) === JSON.stringify(CHK[sc.id].win), E.scnCheck(T).text);
}
ok('format', 'the format lists its steps and its win conditions', E.SCENARIO_FORMAT.ops.length >= 6 && E.SCENARIO_FORMAT.win.length >= 3);
// a world package brings its own scenario
const pkg = JSON.parse(JSON.stringify(PD));
pkg.scenarios = [{ id: 'longhaul', name: 'The long haul', promotion: 'lta', weeks: 60, description: 'Sixty weeks with the money you have.', setup: [{ op: 'cash', inc0: 2 }], win: { type: 'cash', atLeast: 1 }, text: { win: 'Still open with {cash}.', lose: 'Only {cash} left.' }, figures: ['Cash {cash}'] }];
ok('pkg', 'a scenario in a world package is checked', E.scenarioProblems(pkg.scenarios, pkg.promotions.map(p => p.id)).length === 0 && E.scenarioProblems([{ id: 'x', promotion: 'nope', weeks: 0, win: { type: 'fly' } }], ['lta']).length >= 3);
E.useUniverse(pkg);
ok('pkg', 'it sits beside the built-in ones', E.SCENARIOS.some(s => s.id === 'longhaul') && E.SCENARIOS.some(s => s.id === 'rescue'));
E.suggest = E.suggestSmart;
const L = E.scenarioStart('longhaul'); play(L, 70);
const nan = []; const walk = (o, p) => { if (typeof o === 'number' && !isFinite(o)) nan.push(p); else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], p + '.' + k)); }; walk(L, 'S');
ok('pkg', 'it plays its 60 weeks to a result, NaN 0', L.scn.done && L.scn.res && L.week >= 60 && nan.length === 0, L.scn.res && L.scn.res.text);
E.useUniverse(PD); ok('pkg', 'another world drops it again', !E.SCENARIOS.some(s => s.id === 'longhaul'));
console.log(fails.length ? fails.length + ' failed' : 'test-scenarios: all passed'); process.exit(fails.length ? 1 : 0);
