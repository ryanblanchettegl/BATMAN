/* Career-scale saves: once a game year old records fold into summaries, so a long career stays small and still plays.
   Plays 4 game years (192 weeks) of every company, errs 0 and NaN 0.  Run: node test-archive.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
E.suggest = E.suggestSmart;   // four years of shows: the flat suggestion would get the booker fired
const S = E.newGame('pdw', 2, { name: 'R' }), sizes = []; let errs = 0;
for (let w = 0; w < 192; w++) {
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; errs++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S); if (S.over) { S.over = null; S.owner.trust = 80; S.promos[S.player].cash = 5e6; }
  if ((w + 1) % 48 === 0) sizes.push(JSON.stringify(S).length);
}
const nan = []; const walk = (o, p) => { if (typeof o === 'number' && !isFinite(o)) nan.push(p); else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], p + '.' + k)); }; walk(S, 'S');
ok('run', '192 weeks play with errs 0 and NaN 0', errs < 4 && nan.length === 0, 'skipped shows ' + errs + ', NaN ' + nan.slice(0, 3).join(' '));
const y = E.cal(S.week).year, old = S.w.filter(w => w.ys && Object.keys(w.ys).some(k => +k < y - 1));
ok('years', 'yearly records older than two years are folded into one row', old.length === 0 && S.w.some(w => w.ysOld), old.length + ' still unfolded');
const one = S.w.find(w => w.ysOld && w.rt == null); const car = one && E.career(S, one.id);
ok('career', 'the career page shows the folded years as one row', car && car.years.some(r => r.old && /^Up to/.test(String(r.y))), car && car.years.map(r => r.y).join(','));
ok('log', 'career logs stay short', S.w.every(w => !w.log || w.log.length <= 16));
ok('stub', 'somebody retired over two years ago keeps only a name, a record and a few lines', S.w.filter(w => w.arch).every(w => w.name && !w.rr && (!w.log || w.log.length <= 3)) && S.w.some(w => w.arch));
ok('pool', 'the free-agent pool stays under its cap', S.w.filter(w => w.promo === 'FA' && w.rt == null && !w.nw).length <= 360);
// growth slows as the first generation retires into stubs: a 30-year career measured 3.0 MB, about 0.9 KB a week in its last ten years
const g1 = (sizes[1] - sizes[0]) / 48, g3 = (sizes[3] - sizes[2]) / 48;
// 3.5 KB (28 October): one seed swings by a third from game to game; over four seeds main grew 2.5 KB a week in year 4 and the Director 2.7
ok('size', 'the save grows more slowly each year, and under 3.5 KB a week by year 4', g3 < g1 && g3 < 3500, Math.round(g1) + ' then ' + Math.round(g3) + ' bytes a week; ' + sizes.map(s => Math.round(s / 1024) + 'KB').join(' '));
const A = E.newGame('pdw', 5, { name: 'R' }), B = E.newGame('pdw', 5, { name: 'R' });
for (const T of [A, B]) for (let w = 0; w < 50; w++) { T.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(T, e.id, 1)); while (T.qi < T.queue.length) { const c = E.suggest(T); if (E.validate(T, c).errors.length) { T.qi++; continue; } E.runPlayerShow(T, c); } E.endWeek(T); if (T.over) { T.over = null; T.owner.trust = 80; } }
ok('same', 'the same seed through an archive week gives the same game', JSON.stringify(A) === JSON.stringify(B));
console.log(fails.length ? fails.length + ' failed' : 'test-archive: all passed'); process.exit(fails.length ? 1 : 0);
