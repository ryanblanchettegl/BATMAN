/* Friends on a collision course (src/76-friends.js).  Run: node test-friends.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (label, pass, detail) => { console.log(pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let seen = 0, gaps = true, res = {};
for (const pid of ['pdw', 'whw', 'ttt', 'ocw']) for (const sd of [1, 2]) {
  const S = E.newGame(pid, sd, { name: 'R' }); let last = -99;
  for (let w = 0; w < 60 && !S.over; w++) {
    S.inbox.filter(e => !e.done).forEach(e => { if (e.type === 'friends') { seen++; if (S.week - last < 12) gaps = false; last = S.week; const c = seen % 3, f = S.w[e.w], ch = S.w[e.o], b0 = E.rel(S, f.id, ch.id).bond; E.resolveEvent(S, e.id, c); res[c] = res[c] || (c === 1 ? E.rel(S, f.id, ch.id).bond < b0 : c === 2 ? S.rmY[f.id].mem.some(m => m.k === 'keptoff') : S.rmY[f.id].mem.some(m => m.k === 'shot')); } else E.resolveEvent(S, e.id, 0); });
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S);
  }
}
ok('a champion\'s friend as next in line reaches the desk, but rarely', seen >= 3 && seen <= 16, seen + ' in eight games of 60 weeks');
ok('never two within twelve weeks', gaps);
ok('each answer does its own thing: respect, a friendship gone sour, kept apart', res[0] && res[1] && res[2], JSON.stringify(res));
console.log(fails.length ? 'FAILED: ' + fails.join('; ') : 'test-friends: all passed'); process.exit(fails.length ? 1 : 0);
