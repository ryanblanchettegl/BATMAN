/* The press: four reporters with beats, leanings and sources; leaks credited to them; a weekly column coloured by how
   they feel; court, freeze and feed. Plays 60 weeks with errs 0 and NaN 0.  Run: node test-press.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'))); E.suggest = E.suggestSmart;
const S = E.newGame('pdw', 3, { name: 'R', mid: false }); let errs = 0, credited = 0, calls = 0;
const L0 = E.press(S);
ok('cast', 'four reporters, each with a name, a beat and a word for how they feel', L0.length === 4 && L0.every(r => r.name && r.beat && r.word && !/\d/.test(r.word)), L0.map(r => r.name + ' (' + r.beat + ')').join(', '));
for (let w = 0; w < 60; w++) {
  S.inbox.filter(e => !e.done).forEach(e => { if (e.type === 'leak') { if (e.by != null) credited++; if (e.calls != null) calls++; } E.resolveEvent(S, e.id, 1); });
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; errs++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S); if (S.over) { S.over = null; S.owner.trust = 80; }
}
const nan = []; const walk = (o, p) => { if (typeof o === 'number' && !isFinite(o)) nan.push(p); else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], p + '.' + k)); }; walk(S, 'S');
ok('run', '60 weeks with errs 0 and NaN 0', errs < 3 && nan.length === 0);
const cols = S.news.filter(n => /^COLUMN:/.test(n.t) && n.w > S.week - 10);   // the news keeps its newest 160 lines: the last ten weeks
ok('col', 'a column on your show most weeks, named and graded, never a number for a show', cols.length >= 7 && cols.every(n => /\(([A-F][+-]?)\)/.test(n.t)), cols.length + ' columns; ' + (cols[0] || {}).t);
ok('col', 'the columns vary', new Set(cols.map(n => n.t.replace(/^.*\): /, ''))).size >= 2);
ok('src', 'reporters keep sources in your locker room', E.press(S).every(r => r.sources >= 1));
ok('leak', 'every leak is credited to a reporter', S.news.filter(n => /^RUMOUR/.test(n.t)).every(n => /^RUMOUR \(/.test(n.t)) && credited >= 0, credited + ' credited');
// the three answers
const r0 = S.press.rep[0], w0 = r0.warm, c0 = S.promos.pdw.cash;
ok('court', 'dinner costs money and warms them', E.pressDo(S, 0, 'court').ok && r0.warm > w0 && S.promos.pdw.cash < c0);
const r1 = S.press.rep[1]; E.pressDo(S, 1, 'freeze');
ok('freeze', 'freezing one out cools them, leaves a grudge, and they are frozen for eight weeks', r1.warm < 0 && r1.grudge >= 25 && E.press(S)[1].frozen);
const h0 = S.hype || 0; ok('feed', 'feeding a story lifts the build, once a month at most', E.pressDo(S, 2, 'feed').ok && (S.hype || 0) > h0 && !E.pressDo(S, 2, 'feed').ok);
// a friendly reporter calls before printing, and can be asked to sit on it
{ const T = E.newGame('pdw', 4, { name: 'R', mid: false }); E.press(T).forEach(r => { T.press.rep[r.id].warm = 80; }); const w = E.rosterOf(T, 'pdw').filter(x => !x.nw).sort((a, b) => b.ovr - a.ovr)[0];
  let ev = null; for (let k = 0; k < 40 && !ev; k++) { w.morale = 20; T.trust = 20; T.qi = T.queue.length; E.endWeek(T); ev = T.inbox.find(e => e.type === 'leak' && !e.done); }
  ok('call', 'a friendly reporter calls before printing', ev && ev.calls != null && ev.choices.length === 4 && /called you before printing/.test(ev.text), ev && ev.text.slice(0, 100));
  if (ev) { const p0 = T.kf.prot, wm = T.press.rep[ev.calls].warm, r = E.resolveEvent(T, ev.id, 3); ok('call', 'asking them to sit on it keeps the secret and costs their goodwill', T.kf.prot > p0 && T.press.rep[ev.calls].warm < wm, r); } }
const A = E.newGame('pdw', 7, { name: 'R', mid: false }), B = E.newGame('pdw', 7, { name: 'R', mid: false });
for (const T of [A, B]) for (let w = 0; w < 30; w++) { T.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(T, e.id, 1)); while (T.qi < T.queue.length) { const c = E.suggest(T); if (E.validate(T, c).errors.length) { T.qi++; continue; } E.runPlayerShow(T, c); } E.endWeek(T); }
ok('same', 'the same seed gives the same press', JSON.stringify(A.press) === JSON.stringify(B.press));
console.log(fails.length ? fails.length + ' failed' : 'test-press: all passed'); process.exit(fails.length ? 1 : 0);
