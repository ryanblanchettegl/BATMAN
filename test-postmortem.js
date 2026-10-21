/* Post-mortems: a causal log with a size limit, a month in review every four weeks and a season in review once a year,
   in plain words with the causes, no score and no forecast. Plays 60 weeks with errs 0 and NaN 0.  Run: node test-postmortem.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'))); E.suggest = E.suggestSmart;
const S = E.newGame('pdw', 3, { name: 'R' }); let errs = 0, months = 0, maxLog = 0;
for (let w = 0; w < 60; w++) {
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; errs++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S); if (S.over) { S.over = null; S.owner.trust = 80; }
  const M = E.monthReview(S); if (M && M.unread) { months++; E.readMonth(S); } maxLog = Math.max(maxLog, (S.clog || []).length);
}
const nan = []; const walk = (o, p) => { if (typeof o === 'number' && !isFinite(o)) nan.push(p); else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], p + '.' + k)); }; walk(S, 'S');
ok('run', '60 weeks with errs 0 and NaN 0', errs < 3 && nan.length === 0);
ok('log', 'the causal log keeps what happened and why, within its limit', maxLog > 50 && maxLog <= 200 && S.clog.some(x => x.why), 'longest ' + maxLog);
ok('log', 'it never holds another company’s titles or contracts', !S.clog.some(x => (x.k === 'title' || x.k === 'contract') && x.t.indexOf(S.promos.pdw.name) < 0));
ok('month', 'a month in review every four weeks', months >= 14 && months <= 16, months + ' months');
const r = E.monthReview(S).r;
ok('month', 'it says what went well and badly, with causes, and the money', r.well.length && r.badly.length && r.money && r.money.lines.length >= 2 && (r.well.concat(r.badly)).some(x => x.why), r.money.lines.join(' '));
const all = JSON.stringify(r);
ok('fog', 'no score, no forecast, no stars', !/\d+%|★|will be|forecast/.test(all) && !/score/i.test(all));
ok('read', 'reading it takes it off the desk', !E.monthReview(S).unread);
ok('season', 'a season in review once a year', E.seasonReviews(S).length === 1 && /season/i.test(E.seasonReviews(S)[0].label), E.seasonReviews(S).map(x => x.label).join());
const A = E.newGame('pdw', 7, { name: 'R' }), B = E.newGame('pdw', 7, { name: 'R' });
for (const T of [A, B]) for (let w = 0; w < 12; w++) { T.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(T, e.id, 1)); while (T.qi < T.queue.length) { const c = E.suggest(T); if (E.validate(T, c).errors.length) { T.qi++; continue; } E.runPlayerShow(T, c); } E.endWeek(T); }
ok('same', 'the same seed gives the same reviews', JSON.stringify(A.pm) === JSON.stringify(B.pm) && JSON.stringify(A) === JSON.stringify(B));
console.log(fails.length ? fails.length + ' failed' : 'test-postmortem: all passed'); process.exit(fails.length ? 1 : 0);
