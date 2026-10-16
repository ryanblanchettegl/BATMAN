/* Battle royals: 6 to 30 entrants, 30 minutes per 15, a surprise entrant from outside, a title shot for the winner.  Run: node test-royal.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
const S = E.newGame('pdw', 7, { name: 'R' }); house(S);
const card = E.suggest(S); S.card = card;
const men = S.w.filter(w => w.promo === 'pdw' && !w.nw && w.g === 'M' && w.inj <= 0 && !card.some(m => [].concat(...m.sides).includes(w.id)));
const br = { mt: 'br', sides: men.slice(0, 8).map(w => [w.id]), win: -2, title: null, stip: 'std', len: 'M' };
card.unshift(br);
const t8 = E.matchMins(S, br, 0, card.length).bell;
ok('size', 'eight entrants by default, 16 minutes in the ring', t8 === 16, t8 + ' min');
E.brSize(S, 0, 40); ok('size', 'no more than 30', br.sides.length === 30);
E.brSize(S, 0, 2); ok('size', 'no fewer than 6', br.sides.length === 6);
E.brSize(S, 0, 15); ok('time', '15 entrants is 30 minutes', E.matchMins(S, br, 0, card.length).bell === 30);
E.brSize(S, 0, 30); ok('time', '30 entrants is an hour', E.matchMins(S, br, 0, card.length).bell === 60);
E.brSize(S, 0, Math.min(10, men.length)); br.sides = men.slice(0, br.sides.length).map(w => [w.id]);
const v = E.validate(S, card); ok('valid', 'a ten-man battle royal can be booked', !v.errors.some(e => /Match 1/.test(e)), v.errors.join(' | '));
const info = E.brSurpriseInfo(S, br);
ok('surp', 'the surprise spot says what it costs and never who', info.n > 0 && info.fee > 0 && !S.w.some(w => w.promo === 'FA' && info.d.includes(w.name)), info.d);
E.brSurprise(S, 0, 1); E.brShot(S, 0, 1); E.fitShow(S, card);
const cash0 = S.promos.pdw.cash, r = E.liveBegin(S, card);
ok('surp', 'the show goes on the air', r.ok, (r.errors || []).join(' | '));
const lm = S.live && S.live.card[0], who = lm && S.w[lm.surpId];
ok('surp', 'a free agent walks out as the eleventh entrant and is paid', who && who.promo === 'FA' && lm.sides.length === 11 && S.promos.pdw.cash < cash0, who && who.name);
let n = 0; while (S.live && n++ < 200) { const x = E.liveNext(S); if (x && x.event) E.liveDecide(S, 0); }
const rep = S.reports[0], seg = rep && rep.segs.find(s => s.mt === 'Battle royal');
ok('run', 'the battle royal runs with the surprise in it and has a winner', seg && seg.ids.includes(who.id) && seg.win, seg && seg.win);
const win = seg && S.w.find(w => w.name === seg.win);
ok('shot', 'the winner (if on the roster) has a title shot', !win || win.promo !== 'pdw' || win.shot || !S.promos.pdw.titles.some(t => !t.tag && t.g === win.g && t.holders.length && t.holders[0] !== win.id), win && (win.name + ' shot ' + win.shot));
{ const S2 = E.newGame('pdw', 9, { name: 'R' }); house(S2); const c2 = E.suggest(S2);
  const free = S2.w.filter(w => w.promo === 'pdw' && !w.nw && w.g === 'M' && w.inj <= 0 && !c2.some(m => [].concat(...m.sides).includes(w.id))).slice(0, 6);
  c2.unshift({ mt: 'br', sides: free.map(w => [w.id]), win: -2, title: null, stip: 'std', len: 'M' }); E.fitShow(S2, c2);
  const before = free.map(w => w.shot); E.runPlayerShow(S2, c2);
  ok('shot', 'a battle royal not booked for a title shot gives none', free.every((w, k) => w.shot === before[k])); }
console.log(fails.length ? fails.length + ' failed' : 'test-royal: all passed'); process.exit(fails.length ? 1 : 0);
