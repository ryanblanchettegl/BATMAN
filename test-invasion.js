/* Invasions (src/81-invasion.js): a war starts with a deal on the finishes, and a war lost badly costs a year. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const war = seed => { for (let s = seed; s < seed + 40; s++) { const S = E.newGame('pdw', s, { name: 'R' }); S.week = 10; const pid = S.order.find(id => id !== 'pdw' && !E.xfCan(S, id));
  if (!pid) continue; const r = E.xfPropose(S, pid, 'war'); if (r.ok) return { S, pid }; } return null; };
for (const ch of [0, 1, 2]) { const g = war(100 + ch * 50); ok(g, 'a war can start (answer ' + ch + ')'); if (!g) continue; const { S, pid } = g;
  const ev = S.inbox.find(e => e.type === 'xfdeal' && !e.done); ok(ev && ev.choices.length === 3, 'a war starts with a call about the finishes');
  if (!ev) continue; E.resolveEvent(S, ev.id, ch);
  if (ch === 0) ok(S.xf && S.xf.deal === 'trade', 'trading wins is agreed');
  if (ch === 1) ok((S.xf && S.xf.deal === 'ours') || !S.xf, 'asking them to put you over is agreed, or they pull out');
  if (ch === 2) ok(S.xf && S.xf.deal === 'ring', 'the ring decides');
  if (S.xf) { S.xf.sc = ch === 2 ? [0, 3] : [3, 0]; const RV = S.promos[pid], P = S.promos.pdw; S.xf.until = S.week; E.endWeek(S);
    if (ch === 0) ok(!P.weak && !RV.weak, 'a traded war leaves nobody weak');
    if (ch === 1) ok(RV.weak > S.week, 'a war they agreed to lose leaves them weak');
    if (ch === 2) { ok(P.weak > S.week && E.weakUntil(S) > S.week, 'a war lost badly leaves you weak for a year');
      for (let k = 0; k < 6 && !(S.queue[S.qi] && S.queue[S.qi].big); k++) { while (S.qi < S.queue.length && !S.queue[S.qi].big) { E.runPlayerShow(S, E.suggest(S)); } if (S.qi >= S.queue.length) E.endWeek(S); }
      if (S.queue[S.qi] && S.queue[S.qi].big) ok(E.tonight(S).stakes.some(x => x.k === 'weak'), 'the next big night says you are living it down'); } } }
console.log(fails ? 'test-invasion: ' + fails + ' failed' : 'test-invasion: all passed'); process.exit(fails ? 1 : 0);
