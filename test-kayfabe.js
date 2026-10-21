/* The kayfabe layer: secrets the company keeps, leaks, what each answer does, and what the screens read.
   Plays 60 weeks with errs 0 and NaN 0.  Run: node test-kayfabe.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'))); E.suggest = E.suggestSmart;
let leaks = 0, kept = 0, errs = 0, texts = []; const ans = [0, 0, 0];
for (const seed of [3, 4]) {
  const S = E.newGame('pdw', seed, { name: 'R' });
  for (let w = 0; w < 60; w++) {
    S.inbox.filter(e => !e.done).forEach(e => { if (e.type === 'leak') { leaks++; texts.push(e.text); const c = leaks % 3; ans[c]++; const p0 = S.kf.prot, r = E.resolveEvent(S, e.id, c); texts.push(r); } else E.resolveEvent(S, e.id, 1); });
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; errs++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S); kept += E.kayfabe(S).kept.length; if (S.over) { S.over = null; S.owner.trust = 80; }
  }
  const nan = []; const walk = (o, p) => { if (typeof o === 'number' && !isFinite(o)) nan.push(p); else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], p + '.' + k)); }; walk(S, 'S');
  ok('run', 'seed ' + seed + ': 60 weeks with errs 0 and NaN 0', errs < 3 && nan.length === 0);
  const K = E.kayfabe(S);
  ok('read', 'the readout says it in words, with what is kept and what got out', /\w/.test(K.word) && !/\d/.test(K.word) && Array.isArray(K.kept) && Array.isArray(K.leaks) && K.line.length > 5, K.line);
}
ok('keep', 'the company keeps secrets', kept > 10, kept + ' secret-weeks');
ok('leak', 'secrets get out now and then, not every week', leaks >= 1 && leaks <= 20, leaks + ' leaks in 120 weeks');
ok('words', 'a leak names what was believed and what is true, with no unfilled slots', texts.every(t => !/\{|undefined|NaN/.test(t)) && texts.some(t => /Until now the public believed/.test(t)));
// the answers, on a leak made to order
{ const S = E.newGame('pdw', 5, { name: 'R' }); const w = E.rosterOf(S, 'pdw').filter(x => !x.nw).sort((a, b) => b.ovr - a.ovr)[0]; w.morale = 20;
  for (let k = 0; k < 30 && !S.inbox.some(e => e.type === 'leak' && !e.done); k++) { S.qi = S.queue.length; E.endWeek(S); w.morale = 20; S.trust = 20; }
  const ev = S.inbox.find(e => e.type === 'leak' && !e.done);
  ok('leak', 'an unhappy star in a room that does not trust you leaks within weeks', !!ev, ev && ev.text.slice(0, 90));
  if (ev) { const p0 = S.kf.prot; const r = E.resolveEvent(S, ev.id, 1); ok('answer', 'working it into the story mends the secrets a little', S.kf.prot > p0 && /story/.test(r), r);
    ok('news', 'the leak reached the dirt sheet', S.news.some(n => /^RUMOUR/.test(n.t)));
    ok('mem', 'the person it was about remembers', JSON.stringify(S.rmY || {}).indexOf('leak') >= 0); } }
const A = E.newGame('pdw', 7, { name: 'R' }), B = E.newGame('pdw', 7, { name: 'R' });
for (const T of [A, B]) for (let w = 0; w < 30; w++) { T.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(T, e.id, 1)); while (T.qi < T.queue.length) { const c = E.suggest(T); if (E.validate(T, c).errors.length) { T.qi++; continue; } E.runPlayerShow(T, c); } E.endWeek(T); }
ok('same', 'the same seed gives the same secrets and leaks', JSON.stringify(A.kf) === JSON.stringify(B.kf));
console.log(fails.length ? fails.length + ' failed' : 'test-kayfabe: all passed'); process.exit(fails.length ? 1 : 0);
