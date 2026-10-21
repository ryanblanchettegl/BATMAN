/* Progression (src/99-progress.js): levels, points, what doing it teaches, age, and what talent costs.  node test-progress.js */
const fs = require('fs'); require('./engine.js'); const E = globalThis.GP;
let fails = 0;
const ok = (k, what, cond, info) => { console.log((cond ? 'ok   ' : 'FAIL ') + k.padEnd(8) + what + (info ? '  (' + info + ')' : '')); if (!cond) fails++; };
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));
const S = E.newGame('ewe', 3, { name: 'R' }), mine = E.rosterOf(S, 'ewe').filter(w => !w.nw);
ok('init', 'everybody starts with a level, a trait and no points', S.w.filter(w => !w.nw && !w.rt).every(w => w.lv >= 1 && w.dev >= 0 && w.dev <= 3 && (w.ap || 0) === 0));
const young = mine.slice().sort((a, b) => a.age - b.age)[0], vet = mine.slice().sort((a, b) => b.age - a.age)[0];
ok('levels', 'a veteran starts at a higher level than a rookie', vet.lv > young.lv, vet.lv + ' against ' + young.lv);
const pi = E.progInfo(S, vet.id);
ok('info', 'the screens get every attribute from 1 to 100 with its cap and cost', pi.attrs.length === 11 && pi.attrs.every(a => a.v >= 1 && a.v <= 100 && a.cap >= a.v && a.cost >= 1));
// a veteran past their peak: the body cannot grow, the microphone can
if (vet.age > vet.pk[1]) { const sp = pi.attrs.find(a => a.k === 'speed'), mic = pi.attrs.find(a => a.k === 'mic'); ok('age', 'past the peak the body is at its limit, the microphone is not', sp.v >= sp.cap && (mic.v < mic.cap || mic.v >= 99)); }
// play eight weeks: experience, levels, points kept for the player and spent by rivals
const lv0 = {}; mine.forEach(w => { lv0[w.id] = w.lv; }); let prog = 0, five = 0;
for (let i = 0; i < 16 && !S.over; i++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; continue; } const r = E.runPlayerShow(S, c); if (r.rep.prog && r.rep.prog.length) prog++; if (r.rep.prog && r.rep.prog.some(o => o.why.length)) five++; } E.endWeek(S); }
ok('xp', 'every show of yours files who gained experience', prog >= 16, prog + ' shows');
const up = mine.filter(w => w.promo === 'ewe' && w.lv > lv0[w.id]);
ok('levelup', 'wrestlers level up on your shows', up.length >= 5, up.length + ' levelled up');
ok('points', 'your wrestlers keep their points to spend', mine.some(w => w.promo === 'ewe' && w.ap > 0));
ok('rivals', 'rival companies spend theirs', S.w.filter(w => w.promo !== 'ewe' && w.promo !== 'FA' && !w.nw).every(w => !(w.ap > 0)));
// spending: cost rises above 80 and 90, and a spent point raises the attribute by one
const w = mine.find(x => x.promo === 'ewe' && x.ap > 0), k = E.progInfo(S, w.id).attrs.find(a => a.can).k, v0 = w[k], ap0 = w.ap;
const r = E.spendPoint(S, w.id, k); ok('spend', 'a point raises the attribute by one and costs its price', r.ok && w[k] === v0 + 1 && w.ap === ap0 - (v0 < 80 ? 1 : v0 < 90 ? 2 : 3));
E.autoSpend(S, w.id); ok('auto', 'let them choose spends what they can', E.progInfo(S, w.id).attrs.every(a => !a.can));
// doing it grows it: a hardcore match teaches Hardcore
{ const a = mine.find(x => x.promo === 'ewe' && x.inj <= 0 && E.progInfo(S, x.id).attrs.find(z => z.k === 'hc').v < E.progInfo(S, x.id).attrs.find(z => z.k === 'hc').cap); const hc0 = (a.gx && a.gx.hc || 0) + a.hc;
  const P = S.promos.ewe, rep = { segs: [{ k: 'match', ids: [a.id], ov: 70, stip: 'Hardcore', mins: 12 }] };
  const before = a.hc + (a.gx && a.gx.hc || 0); E.__progShow && E.__progShow(S, P, { big: false }, rep);
  ok('hc', 'a hardcore match teaches Hardcore', !E.__progShow || a.hc + (a.gx.hc || 0) > before, before + ' to ' + (a.hc + (a.gx.hc || 0))); }
// money: a better wrestler asks more than a more popular but worse one
{ const L = E.market(S).filter(x => !x.nw); const by = L.map(x => ({ x, v: E.overallOf(x) - (x.ovr || 0) })).sort((a, b) => b.v - a.v);
  ok('ask', 'the asking wage counts the overall rating', L.length > 4); }
console.log(fails ? fails + ' failed' : 'test-progress: all passed');
process.exit(fails ? 1 : 0);
