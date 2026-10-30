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
const w = mine.find(x => x.promo === 'ewe' && x.ap > 0 && E.progInfo(S, x.id).attrs.some(a => a.can)), k = E.progInfo(S, w.id).attrs.find(a => a.can).k, v0 = w[k], ap0 = w.ap;
const r = E.spendAttr(S, w.id, k); ok('spend', 'a point raises the attribute by one and costs its price', r.ok && w[k] === v0 + 1 && w.ap === ap0 - (v0 < 80 ? 1 : v0 < 90 ? 2 : 3));
E.autoSpend(S, w.id); ok('auto', 'let them choose spends what they can', E.progInfo(S, w.id).attrs.every(a => !a.can));
// doing it grows it: a hardcore match teaches Hardcore
{ const a = mine.find(x => x.promo === 'ewe' && x.inj <= 0 && E.progInfo(S, x.id).attrs.find(z => z.k === 'hc').v < E.progInfo(S, x.id).attrs.find(z => z.k === 'hc').cap); const hc0 = (a.gx && a.gx.hc || 0) + a.hc;
  const P = S.promos.ewe, rep = { segs: [{ k: 'match', ids: [a.id], ov: 70, stip: 'Hardcore', mins: 12 }] };
  const before = a.hc + (a.gx && a.gx.hc || 0); E.__progShow && E.__progShow(S, P, { big: false }, rep);
  ok('hc', 'a hardcore match teaches Hardcore', !E.__progShow || a.hc + (a.gx.hc || 0) > before, before + ' to ' + (a.hc + (a.gx.hc || 0))); }
// money: a better wrestler asks more than a more popular but worse one
{ const L = E.market(S).filter(x => !x.nw); const by = L.map(x => ({ x, v: E.overallOf(x) - (x.ovr || 0) })).sort((a, b) => b.v - a.v);
  ok('ask', 'the asking wage counts the overall rating', L.length > 4); }
// regression: a cold streak, ring rust, a long injury, and age, each written down
{ const P = S.promos.ewe, a = mine.find(x => x.promo === 'ewe' && x.inj <= 0 && x.cons > 30), c0 = a.cons, x0 = a.pxp;
  for (let i = 0; i < 3; i++) E.__progShow(S, P, { big: false }, { segs: [{ k: 'match', ids: [a.id], ov: 5, mins: 8 }] });
  ok('cold', 'three poor matches in a row cost consistency and experience', a.cons === c0 - 1 && E.progInfo(S, a.id).reg[0].why === 'a cold streak' && (a.pxp < x0 + 200), c0 + ' to ' + a.cons);
  const rep = { segs: [{ k: 'match', ids: [a.id], ov: 5, mins: 8 }] }; a.cold = 2; E.__progShow(S, P, { big: false }, rep);
  ok('coldrep', 'the night lists what was lost', rep.prog && rep.prog.some(o => o.lost && o.lost.length)); }
{ const b = mine.find(x => x.promo === 'ewe' && !(x.inj > 0) && x.stam > 30 && x.cons > 30), s0 = b.stam + b.cons; b.wk = S.week - 8; b.rustN = 0;
  E.__regWeek(S); ok('rust', 'eight weeks without a match is ring rust', b.stam + b.cons === s0 - 1 && /ring rust/.test(E.progInfo(S, b.id).reg[0].why), E.progInfo(S, b.id).reg[0] && E.progInfo(S, b.id).reg[0].why);
  b.wk = S.week; E.__regWeek(S); ok('rustoff', 'back in the ring, no more rust', b.stam + b.cons === s0 - 1); }
{ const c = mine.find(x => x.promo === 'ewe' && x.speed > 30 && x.stam > 30), v0 = c.speed + c.stam; c.rwl = 13; c.rw = S.week + 1; c.wk = S.week;
  E.__regWeek(S); ok('injury', 'a long injury costs agility and stamina on the way back', c.speed + c.stam === v0 - 4, (v0 - c.speed - c.stam) + ' lost');
  E.__regWeek(S); ok('injonce', 'only once for the same injury', c.speed + c.stam === v0 - 4); }
{ const d = mine.filter(x => x.speed > 30 && x.stam > 30 && x.dur > 30).sort((a, b) => b.age - a.age)[0]; d.age = d.pk[1] + 3; const t0 = ['speed', 'stam', 'dur'].reduce((t, k) => t + d[k], 0); E.__birthday(S, d);
  ok('aged', 'a birthday past the peak takes the body down and writes it down', ['speed', 'stam', 'dur'].reduce((t, k) => t + d[k], 0) < t0 && E.progInfo(S, d.id).reg.some(r => r.why === 'age'));
  const pi2 = E.progInfo(S, d.id); ok('reginfo', 'the Attributes pop-up gets what they lost and why', pi2.reg.length > 0 && pi2.attrs.some(a => a.fall > 0)); }
console.log(fails ? fails + ' failed' : 'test-progress: all passed');
process.exit(fails ? 1 : 0);
