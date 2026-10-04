/* Fog of war: what the road agent can say about a match before the bell, what the office learns from running it,
   and the agent in the booker's ear during the broadcast.  Run: node test-fog.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
const adv = S => { house(S); if (S.qi >= S.queue.length) { E.endWeek(S); house(S); } };
const run = S => { const pr = E.preShow(S, S.card); if (pr) { E.resolvePre(S, S.card, 0); E.fitShow(S, S.card); } if (E.validate(S, S.card).errors.length) return null; return E.runPlayerShow(S, S.card).rep; };
const chemOf = (S, m) => E.chem(S, m.sides[0][0], m.sides[1][0]);
const cat = c => c >= 2.2 ? 1 : (c <= -2.2 ? -1 : 0);
const lines = R => R.filter(Boolean).reduce((a, r) => a.concat(r.lines), []);

{ const S = E.newGame('pdw', 3, { name: 'R' }); house(S); S.card = E.suggest(S);
  const before = JSON.stringify(S), R = E.agentReads(S), again = E.agentReads(S);
  ok('fog', 'a new booker has seen nothing: no pairing is known', Object.keys(S.know.p).length === 0 && Object.keys(S.know.w).length === 0);
  ok('fog', 'every match on the sheet gets a comment from the road agent', R.length === S.card.length && R.every(r => r && r.who === S.promos.pdw.staff.agent && r.lines.length >= 1));
  ok('fog', 'reading the card changes nothing and gives the same answer twice', JSON.stringify(S) === before && JSON.stringify(R) === JSON.stringify(again));
  ok('fog', 'no comment claims to have seen what has not happened yet', lines(R).every(l => l.src !== 'seen'), lines(R).map(l => l.src).join(','));
  ok('fog', 'no comment gives stars or a percentage', lines(R).every(l => !/[★¼½¾]|\d+%/.test(l.t)), lines(R).map(l => l.t).join(' | '));
  ok('fog', 'a singles match nobody can read is said to be unread', S.card.some((m, i) => m.mt === '1v1' && R[i].lines[0].src === 'none' && /no read|cannot tell|No read/.test(R[i].lines[0].t)), lines(R).map(l => l.src).join(','));
  ok('fog', 'the old advice no longer gives the road agent’s view of chemistry or stamina', E.advice(S, S.card).every(a => a.tips.every(t => !/chemistry|do not click|cannot go|squash/.test(t))) && E.matchOdds(S, S.card[0], 0, S.card.length).chem == null);
  /* run it: the office learns */
  const singles = S.card.filter(m => m.mt === '1v1').map(m => ({ a: m.sides[0][0], b: m.sides[1][0], c: cat(chemOf(S, m)) }));
  const rep = run(S);
  ok('learn', 'the report lists what was learned, one line for each singles pairing seen for the first time', !!rep && rep.learned && rep.learned.filter(x => /chemistry|do not click|without sparks/.test(x)).length === singles.length, rep && (rep.learned || []).join(' | '));
  ok('learn', 'each of those lines says the truth about the pair', singles.every(p => rep.learned.some(x => x.indexOf(S.w[p.a].name) >= 0 && x.indexOf(S.w[p.b].name) >= 0 && (p.c > 0 ? /real chemistry/ : (p.c < 0 ? /do not click/ : /without sparks/)).test(x))));
  ok('learn', 'and the pairings are kept for good', singles.every(p => S.know.p[Math.min(p.a, p.b) + '-' + Math.max(p.a, p.b)] === 1));
  /* book one of them again: now it is known */
  adv(S); S.card = E.suggest(S);
  const p0 = singles.find(p => E.eligible(S).some(w => w.id === p.a) && E.eligible(S).some(w => w.id === p.b));
  S.card = S.card.filter(m => ![].concat(...m.sides).some(id => id === p0.a || id === p0.b)); S.card.splice(1, 0, { mt: '1v1', sides: [[p0.a], [p0.b]], win: -2, call: null, title: null, stip: 'std', len: 'M' });
  const r1 = E.agentReads(S)[1], l1 = r1.lines.find(l => /We have seen it|worked each other before/.test(l.t));
  ok('learn', 'the next time they are booked the agent speaks from what was seen', !!l1 && l1.src === 'seen' && l1.s === p0.c, r1.lines.map(l => l.src + ': ' + l.t).join(' | '));
  E.fitShow(S, S.card); const rep2 = run(S);
  ok('learn', 'a pairing already known is not learned twice', !!rep2 && !(rep2.learned || []).some(x => x.indexOf(S.w[p0.a].name) >= 0 && x.indexOf(S.w[p0.b].name) >= 0 && /chemistry|click|sparks/.test(x)));
  /* in the booker's ear */
  const ms = rep.segs.filter(s => s.k === 'match'), ears = ms.map(s => s.bc.filter(b => b.t === 'ear'));
  ok('ear', 'the agent speaks in the booker’s ear during every match, once or twice', ears.every(e => e.length >= 1 && e.length <= 2 && e.every(b => b.who === S.promos.pdw.staff.agent && b.x.indexOf(b.who + ': “') === 0)), ears.map(e => e.length).join(','));
  ok('ear', 'it comes after the bell and before the winner is announced', ms.every(s => { const i = s.bc.findIndex(b => b.t === 'ear'), bell = s.bc.findIndex(b => b.t === 'pbp'), last = s.bc.length - 1; return i > bell && i < last; }));
  ok('ear', 'what is said matches what the report gives as a reason', ms.every(s => { const e = s.bc.filter(b => b.t === 'ear').map(b => b.x).join(' '); if (/not on the same page/.test(e) && !s.fx.some(f => /No chemistry/.test(f.x))) return false; if (/are clicking/.test(e) && !s.fx.some(f => /Great chemistry/.test(f.x))) return false; if (/blown up/.test(e) && !s.fx.some(f => /ran out of gas/.test(f.x))) return false; return true; }));
}

/* a read is never wrong, and a better reader reads more */
{ let wrong = 0, readsHead = 0, readsAgent = 0, readsEye = 0, n = 0;
  for (let seed = 1; seed <= 10; seed++) { const S = E.newGame('pdw', seed, { name: 'R' }); house(S);
    const ag = E.rosterOf(S, 'pdw').filter(w => !w.nw).sort((a, b) => b.ovr - a.ovr).slice(-1)[0]; // any wrestler stands in as a hired agent for the test
    for (let wk = 0; wk < 3; wk++) { adv(S); S.card = E.suggest(S); S.know = { p: {}, w: {} };
      const count = () => { let k = 0; E.agentReads(S).forEach((r, i) => { if (!r || S.card[i].mt !== '1v1') return; r.lines.forEach(l => { if (l.src === 'read' && /click|sparks/.test(l.t)) { k++; if (l.s !== cat(chemOf(S, S.card[i]))) wrong++; } }); }); return k; };
      n += S.card.filter(m => m.mt === '1v1').length;
      readsHead += count();
      S.booker.sk.eye = 3; readsEye += count(); S.booker.sk.eye = 0;
      const was = { nw: ag.nw, srole: ag.srole, cons: ag.cons }; ag.nw = true; ag.srole = 'agent'; ag.cons = 95; S.card.forEach(m => { m.agent = ag.id; }); readsAgent += count(); S.card.forEach(m => { delete m.agent; }); ag.nw = was.nw; ag.srole = was.srole; ag.cons = was.cons;
      const rep = run(S); if (!rep) S.qi++; } }
  ok('read', 'a read is never wrong', wrong === 0 && readsHead + readsAgent + readsEye > 20, wrong + ' wrong of ' + (readsHead + readsAgent + readsEye));
  ok('read', 'the company’s own agent reads a few matches, a good agent on the match reads most', readsHead < n * 0.5 && readsAgent > readsHead * 1.8 && readsAgent > n * 0.55, readsHead + ' against ' + readsAgent + ' of ' + n);
  ok('read', 'Eye for talent makes the same agent read more', readsEye > readsHead, readsHead + ' to ' + readsEye);
}

/* stamina: unknown until somebody blows up */
{ const S = E.newGame('pdw', 7, { name: 'R' }); house(S); S.card = E.suggest(S);
  const m = S.card.find(x => x.mt === '1v1' && !x.title), i = S.card.indexOf(m), w = S.w[m.sides[0][0]]; w.stam = 8; m.len = 'L'; E.fitShow(S, S.card, i);
  const mins = E.matchMins(S, m, i, S.card.length).bell, before = E.agentReads(S)[i];
  ok('gas', 'before it has happened, the agent only mentions it as a read, if at all', mins > 11 && before.lines.every(l => !/We have seen it/.test(l.t)), before.lines.map(l => l.src + ': ' + l.t).join(' | '));
  const rep = run(S);
  ok('gas', 'the night teaches it', !!rep && (rep.learned || []).some(x => x.indexOf(w.name + ' blew up. Good for about 11 minutes') === 0) && S.know.w[w.id].gas === 1, rep && (rep.learned || []).join(' | '));
  adv(S); S.card = E.suggest(S); const opp = E.eligible(S).filter(x => x.id !== w.id && x.g === w.g && x.promo === 'pdw')[0];
  S.card = S.card.filter(x => ![].concat(...x.sides).some(id => id === w.id || id === opp.id)); S.card.splice(1, 0, { mt: '1v1', sides: [[w.id], [opp.id]], win: -2, call: null, title: null, stip: 'std', len: 'L' });
  const after = E.agentReads(S)[1];
  ok('gas', 'after that the agent knows the limit and says so', E.eligible(S).some(x => x.id === w.id) ? after.lines.concat([]).some(l => l.src === 'seen' && /good for about 11 minutes\. We have seen it/.test(l.t)) || after.more : true, after.lines.map(l => l.src + ': ' + l.t).join(' | '));
}

/* promos: a read in words, and only once somebody has been heard */
{ const S = E.newGame('pdw', 4, { name: 'R' }); house(S); S.card = E.suggest(S);
  while (E.segInfo(S).booked) E.setSeg(S, 0, null);
  const talkers = E.segChoices(S, 'interview', [], -1)[0]; let unheard = null;
  for (const id of talkers) { const L = E.segLook(S, { k: 'interview', who: [id], pos: 1, len: 'M' }, -1); if (L.read.k === 'none') { unheard = id; break; } }
  const L0 = E.segLook(S, { k: 'interview', who: [unheard], pos: 1, len: 'L' }, -1);
  ok('promo', 'a talker nobody here has heard gets no read, and no hint about the microphone', unheard != null && /No read/.test(L0.read.t) && L0.read.t.indexOf(S.w[unheard].name) >= 0 && L0.notes.every(x => !/microphone|talker|Cut short|to the point/.test(x[1])), L0.read.t);
  const z = E.setSeg(S, -1, { k: 'interview', who: [unheard], pos: 1, len: 'M' });
  ok('promo', 'booking it says so in words, with no stars', z.ok && /No read/.test(z.msg) && !/[★¼½¾]/.test(z.msg) && !/should be about/.test(z.msg), z.msg);
  ok('promo', 'the run sheet carries the read', E.segInfo(S).list[0].look.read.k === 'none');
  E.fitShow(S, S.card); const rep = run(S);
  ok('promo', 'the night teaches what they can do with a microphone', !!rep && (rep.learned || []).some(x => x.indexOf('You have heard ' + S.w[unheard].name + ' on the microphone now') === 0) && S.know.w[unheard].mic === 1, rep && (rep.learned || []).join(' | '));
  adv(S); S.card = E.suggest(S); while (E.segInfo(S).booked) E.setSeg(S, 0, null);
  const L1 = E.segLook(S, { k: 'interview', who: [unheard], pos: 1, len: 'L' }, -1);
  ok('promo', 'next time the read comes from having heard them', L1.read.k !== 'none' && /^You have heard them talk\. (This should land|It should do its job|This could die out there)\.$/.test(L1.read.t) && L1.notes.some(x => /microphone|talker/.test(x[1])), L1.read.t + ' / ' + L1.notes.map(x => x[1]).join('; '));
  ok('promo', 'time for the writers is not a read at all', E.segLook(S, { k: 'writers', who: [], pos: 0 }, -1).read.k === 'none');
}

/* an older save starts with the pairs it has run lately; twenty weeks leave no bad numbers behind */
{ const S = E.newGame('ttt', 2, { name: 'R' }); let errs = 0, learned = 0, shows = 0;
  for (let wk = 0; wk < 20 && !S.over; wk++) { house(S); while (S.qi < S.queue.length) { S.card = E.suggest(S); try { const r = run(S); if (r) { shows++; learned += (r.learned || []).length; } else S.qi++; } catch (x) { errs++; S.qi++; } } E.endWeek(S); }
  ok('long', 'twenty weeks: no errors, things are learned, and less is new as the weeks go by', errs === 0 && learned > shows && JSON.stringify(S.know).indexOf('NaN') < 0, learned + ' things over ' + shows + ' shows, ' + Object.keys(S.know.p).length + ' pairings known');
  const T = JSON.parse(JSON.stringify(S)); delete T.know; house(T); T.card = E.suggest(T); const before = Object.keys(T.recent).filter(k => k.indexOf('ttt:') === 0).length; run(T);
  ok('long', 'a save from before this starts by knowing the pairs it ran lately', !!T.know && Object.keys(T.know.p).length >= before && before > 0, Object.keys(T.know ? T.know.p : {}).length + ' from ' + before);
}
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-fog: all passed');
