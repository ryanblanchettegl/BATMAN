/* Networks (src/89-networks.js): tastes, ratings targets, the executive who calls, and a bidding war at renewal. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const play = (S, n) => { for (let k = 0; k < n; k++) { S.inbox.filter(e => !e.done && e.type !== 'netexec' && e.type !== 'rights').forEach(e => E.resolveEvent(S, e.id, 0)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const c = E.suggest(S); E.runPlayerShow(S, c); } E.endWeek(S); } };
// every show has a network with a taste and a target
{ const S = E.newGame('pdw', 1, { name: 'R' }); play(S, 2); const I = E.netInfo(S);
  ok(I.length >= 1, 'netInfo lists the weekly shows'); I.forEach(n => { ok(n.net && n.taste && n.want, n.name + ' has a network and a taste'); ok(n.tgt > 0, n.name + ' has a target'); });
  ok(S.reports[0].net && 'hit' in S.reports[0].net, 'a filed show says how it did against the target'); }
// three misses and an executive calls; each answer does something
for (const ch of [0, 1, 2]) { const S = E.newGame('pdw', 2 + ch, { name: 'R' }); play(S, 2); S.promos.pdw.shows.forEach(sh => { if (!sh.big) sh.tgt = 99e6; });
  play(S, 3); const ev = S.inbox.find(e => e.type === 'netexec' && !e.done); ok(ev, 'an executive calls after three misses (answer ' + ch + ')');
  if (ev) { const sh = S.promos.pdw.shows.find(x => x.id === ev.sid), q0 = S.quests.length; E.resolveEvent(S, ev.id, ch);
    if (ch === 0) ok(S.quests.length === q0 + 1, 'promising a main event makes a promise');
    if (ch === 1) ok(sh.tgt < 99e6, 'lowering the target lowers it');
    if (ch === 2) ok(sh.miss === 0, 'telling them the numbers will come resets the count'); } }
// a bidding war at renewal for a show the business rates
{ const S = E.newGame('pdw', 7, { name: 'R' }); play(S, 1); let got = 0;
  for (const sh of S.promos.pdw.shows.filter(x => !x.big)) { for (let d = 0; d < 4 && !got; d++) { sh.lv = 4; sh.deals = d; sh.deal = S.week + 1; S.inbox = S.inbox.filter(e => e.type !== 'rights'); S.lcd = {}; play(S, 1);
    const ev = S.inbox.find(e => e.type === 'rights' && !e.done && e.third); if (ev) { got = 1; ok(ev.choices.length === 4, 'the bidding war is a fourth answer'); const was = sh.net; E.resolveEvent(S, ev.id, 3); ok(sh.net !== was, 'a bidding war moves the show'); } } }
  ok(got, 'a rated show can start a bidding war'); }
// determinism: the tastes come from a hash
ok(E.netInfo(E.newGame('pdw', 1, { name: 'R' })).map(n => n.taste).join() === E.netInfo(E.newGame('pdw', 1, { name: 'R' })).map(n => n.taste).join(), 'tastes are the same each time');
console.log(fails ? 'test-networks: ' + fails + ' failed' : 'test-networks: all passed'); process.exit(fails ? 1 : 0);
