/* The live show: a show on the air runs one step at a time and stops for calls from the gorilla position.
   Run: node test-live.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
const clone = S => { const c = JSON.parse(JSON.stringify(S)); E.attach(c); return c; };
/** Put the next show that can run on the desk. Returns its card, or null when the week has none left. */
function desk(S) {
  house(S);
  while (S.qi < S.queue.length) {
    const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); }
    if (E.validate(S, c).errors.length) { S.qi++; continue; }
    S.card = c; return c;
  }
  return null;
}
/** See the show on the air through to its report. `pick(ev, n)` chooses an answer (default: the safe one). `seen(ev, S)` is told about each call before it is answered. */
function air(S, pick, seen) {
  for (let g = 0, n = 0; g < 400; g++) {
    const r = E.liveNext(S);
    if (r.event) { if (seen) seen(r.event, S); let c = pick ? pick(r.event, n++) : (r.event.safe || 0); if (r.event.choices[c].bp > S.bp) c = r.event.safe || 0; const d = E.liveDecide(S, c); if (!d.ok) throw new Error('a call would not take its answer: ' + d.msg); }
    else if (r.done) return r.rep;
  }
  throw new Error('the show never ended');
}
const week = S => { house(S); if (S.qi >= S.queue.length) E.endWeek(S); };
const bond = (S, a, b) => E.rel(S, a, b).bond, lean = (S, id) => (S.rmY && S.rmY[id] ? S.rmY[id].v : 0);
const feud = (S, a, b) => S.feuds.find(f => !f.res && ((f.a.includes(a) && f.b.includes(b)) || (f.a.includes(b) && f.b.includes(a))));
const DICE = /\b(roll|rolls|rolled|dice|die roll|d20|saving throw)\b/i;

/* ---- on and off the air ---- */
{ const S = E.newGame('pdw', 3, { name: 'R' }); const card = desk(S), bp0 = S.bp;
  ok('air1', 'a card that cannot run does not go on the air', !!E.liveBegin(S, []).errors && !S.live);
  const b = E.liveBegin(S, card);
  ok('air2', 'a good card goes on the air, and the card is closed', b.ok && !!S.live && S.live.card !== card && S.live.card.length === card.length && E.advance(S).k === 'live', JSON.stringify(E.advance(S).k));
  ok('air3', 'a show on the air cannot be started again', !!E.liveBegin(S, card).errors);
  let I = E.liveInfo(S);
  ok('air4', 'the night’s run sheet lists every step with its time, and nothing has run', I.sheet.length === I.steps && I.sheet.every(x => !x.ran && x.si < 0 && x.ov == null && x.at != null && x.label) && I.sheet.filter(x => x.main).length === 1, I.sheet.map(x => x.at + ' ' + x.label).join(' | '));
  ok('air5', 'the save holds the show on the air', JSON.parse(JSON.stringify(S)).live.st.steps.length === I.steps);
  let first = null; for (let g = 0; g < 40 && !first; g++) { const r = E.liveNext(S); if (r.event) E.liveDecide(S, r.event.safe || 0); else if (r.seg) first = r; }
  I = E.liveInfo(S);
  ok('air6', 'after one segment the sheet shows it ran, with its stars to come from the segment', !!first && I.sheet.filter(x => x.ran && x.si === 0 && x.ov === first.seg.ov).length === 1 && I.segs === 1);
  const rep = air(S);
  ok('air7', 'off the air: the report is filed, the card is cleared and the week moves on', !S.live && S.reports[0] === rep && S.card.length === 0 && S.qi === 1 && E.advance(S).k !== 'live');
  ok('air8', 'the report keeps the night’s run sheet and the calls that were made', Array.isArray(rep.night) && rep.night.length === I.steps && rep.night.every(x => x.si < rep.segs.length) && (rep.calls || []).every(c => c.q && c.a && c.r), (rep.calls || []).length + ' calls');
}

/* ---- the same night three ways: in one go, step by step, and through a save taken at every stop ---- */
{ const run = how => { const S0 = E.newGame('pdw', 11, { name: 'R' }); let S = S0;
    for (let wk = 0; wk < 4; wk++) { while (desk(S)) { if (how === 'whole') { E.runPlayerShow(S, S.card); continue; }
        E.liveBegin(S, S.card);
        for (let g = 0; g < 400; g++) { if (how === 'saved') S = clone(S); const r = E.liveNext(S); if (r.event) { if (how === 'saved') S = clone(S); E.liveDecide(S, r.event.safe || 0); } else if (r.done) break; } }
      week(S); }
    return JSON.stringify(S); };
  const a = run('whole'), b = run('steps'), c = run('saved');
  ok('same1', 'a show run in one go is the same show as one answered step by step with the safe answers', a === b);
  ok('same2', 'saving and loading at every stop of the night changes nothing', b === c);
}

/* ---- every kind of call, and what each answer does ---- */
const found = {}, counts = { shows: 0, calls: 0, max: 0, kinds: {} }, texts = [];
for (const pid of E.universe().promotions.map(p => p.id).slice(0, 3)) for (const seed of [3, 7, 11]) {
  const S = E.newGame(pid, seed, { name: 'R' });
  for (let wk = 0; wk < 10 && !S.over; wk++) {
    while (desk(S)) {
      S.bp = Math.max(S.bp, 6);   // enough in hand that every answer is open
      if (!E.liveBegin(S, S.card).ok) { S.qi++; continue; }
      let n = 0;
      air(S, (ev, k) => (k + wk + seed) % ev.choices.length, (ev, S) => {
        n++; counts.kinds[ev.kind] = (counts.kinds[ev.kind] || 0) + 1;
        texts.push(ev.text, ...ev.choices.map(c => c.n + ' ' + (c.says || '')), ...(ev.why || []));
        if (!found[ev.kind]) found[ev.kind] = { S: clone(S), ev: JSON.parse(JSON.stringify(ev)) };
      });
      counts.shows++; counts.calls += n; counts.max = Math.max(counts.max, n);
    }
    week(S);
  }
}
ok('many1', 'most nights bring at least one call, and no night is all calls', counts.calls / counts.shows >= 1 && counts.calls / counts.shows <= 3.5 && counts.max <= 6, counts.shows + ' shows, ' + counts.calls + ' calls, most in one night ' + counts.max + ', ' + JSON.stringify(counts.kinds));
ok('many2', 'no dice wording in any call', !texts.some(t => DICE.test(t)), texts.find(t => DICE.test(t)));
ok('many3', 'no em dashes in any call', !texts.some(t => /—/.test(t)), texts.find(t => /—/.test(t)));
ok('many4', 'every call says why it came up now, or is trouble nobody could plan for', Object.keys(found).every(k => k === 'chaos' || found[k].ev.why.length > 0));
/** From the saved moment of a call: answer it with choice c and run until the segment it belongs to has aired. Returns {S, seg, text}. */
function answer(kind, c) {
  const S = clone(found[kind].S), ev = S.live.ev, d = E.liveDecide(S, c);
  let seg = ev.phase === 'post' ? S.live.st.rep.segs[ev.si] : null;
  for (let g = 0; g < 40 && !seg; g++) { const r = E.liveNext(S); if (r.event) E.liveDecide(S, r.event.safe || 0); else if (r.seg) seg = r.seg; else if (r.done) break; }
  return { S, ev, seg, d };
}
for (const kind of ['titlecall', 'runin', 'hotmic', 'afterbell', 'owner', 'face']) ok('kind', 'the ' + kind + ' call came up in the sample', !!found[kind]);
if (found.titlecall) { const F = found.titlecall, P0 = F.S.promos[F.S.player], m = F.S.live.card[F.ev.mi], t0 = P0.titles.find(t => t.id === m.title), champ = t0.holders.slice();
  const stay = answer('titlecall', 0), swap = answer('titlecall', 1), dq = answer('titlecall', 2);
  const holders = R => R.S.promos[R.S.player].titles.find(t => t.id === m.title).holders;
  ok('tc1', 'call the title change: the title changes hands, it costs booking power, and both remember who made the call', holders(swap).includes(F.ev.who) && !holders(swap).includes(champ[0]) && swap.S.bp === F.S.bp - 2 && lean(swap.S, champ[0]) < lean(F.S, champ[0]) && lean(swap.S, F.ev.who) > lean(F.S, F.ev.who), 'new holder ' + holders(swap).join(','));
  ok('tc2', 'protect the champion: a disqualification, and the title stays', holders(dq).join() === champ.join() && dq.seg.fin === 'dq' && dq.S.bp === F.S.bp - 1 && lean(dq.S, F.ev.who) < lean(F.S, F.ev.who), dq.seg.fin);
  ok('tc3', 'stay with the plan: nothing is spent and nobody holds it against you', stay.S.bp === F.S.bp && lean(stay.S, champ[0]) === lean(F.S, champ[0]));
  const poor = clone(F.S); poor.bp = 0; const no = E.liveDecide(poor, 1);
  ok('tc4', 'a call that costs more booking power than is in hand is not taken', !no.ok && /booking power/.test(no.msg) && !poor.live.ev.done);
  ok('tc5', 'the answer is on the broadcast and on the segment', swap.seg.bc.some(b => b.t === 'call' && /Your call: Call the title change/.test(b.x)) && swap.seg.calls.length === 1);
}
if (found.runin) { const F = found.runin, p = F.ev.other, r = F.ev.who, f0 = F.S.feuds.find(f => f.id === F.ev.feud).heat;
  const back = answer('runin', 0), cost = answer('runin', 1), strong = answer('runin', 2), heat = R => R.S.feuds.find(f => f.id === F.ev.feud).heat;
  ok('ri1', 'send the rival out to cost them the match: they lose, and the feud gets hotter', !cost.seg.wi.includes(p) && heat(cost) > f0 && heat(cost) > heat(back) && cost.S.bp === F.S.bp - 1, 'heat ' + f0 + ' to ' + heat(cost) + ', kept back ' + heat(back));
  ok('ri2', 'send the rival out and they fight them off: they win', strong.seg.wi.includes(p) && lean(strong.S, p) > lean(F.S, p));
  ok('ri3', 'the rival remembers being used', lean(cost.S, r) > lean(F.S, r));
  ok('ri4', 'keep the rival in the back: nothing is spent, and the rival does not come out', back.S.bp === F.S.bp && !JSON.stringify(back.seg.bc).includes(F.S.w[r].name + ' hits the ring'));
}
if (found.hotmic) { const F = found.hotmic, w = F.ev.who, o = F.ev.other;
  const cut = answer('hotmic', 0), talk = answer('hotmic', 1);
  ok('hm1', 'cut the microphone: the segment suffers, the speaker holds it against you, the target is grateful', cut.seg.ov < talk.seg.ov && lean(cut.S, w) < lean(F.S, w) && lean(cut.S, o) > lean(F.S, o), cut.seg.ov + ' against ' + talk.seg.ov);
  ok('hm2', 'let them talk: the two of them are worse than before, and the target knows you let it air', (bond(talk.S, w, o) < bond(F.S, w, o) || bond(talk.S, w, o) === -100) && lean(talk.S, o) < lean(F.S, o), bond(F.S, w, o) + ' to ' + bond(talk.S, w, o));
  ok('hm3', 'the same speaker does not go off the script again for weeks', F.S.lcd['hm' + w] === F.S.week);
}
if (found.afterbell) { const F = found.afterbell, w = F.ev.who, l = F.ev.other;
  const fade = answer('afterbell', 0), shake = answer('afterbell', 1), attack = answer('afterbell', 2);
  ok('ab1', 'they shake hands: the two of them think more of each other', bond(shake.S, w, l) > bond(F.S, w, l) && bond(fade.S, w, l) === bond(F.S, w, l));
  ok('ab2', 'the loser attacks: there is a feud between them, or the office says why not', !!feud(attack.S, w, l) || /too many feuds/.test(attack.d.text), attack.d.text);
  ok('ab3', 'what happened after the bell is on that match', shake.seg.bc[shake.seg.bc.length - 1].t === 'call' && shake.seg.calls.length >= 1);
  if (F.ev.choices[3]) { const walk = answer('afterbell', 3), c = F.ev.choices[3]; ok('ab4', 'a challenger walks out: they have a title shot coming', walk.S.w[c.who].shot === c.title); }
}
/* ---- the direction of the company ---- */
if (found.owner) { const F = found.owner, f = F.ev.who, opp = F.ev.other, t0 = F.S.owner.trust;
  const play = answer('owner', 0), win = answer('owner', 1), dq = answer('owner', 2);
  ok('ow1', 'the owner only calls about a favourite who may well lose, and says so', /does not lose tonight/.test(F.ev.text) && F.ev.why.length === 2 && /% chance tonight/.test(F.ev.why[1]) && (F.S.owner.fav === f || F.S.quests.some(q => q.type === 'o_strong' && q.w === f)), F.ev.why.join(' | '));
  ok('ow2', 'do as the office says: the favourite wins, it costs no booking power, the owner is pleased and the other side remembers', win.seg.wi.includes(f) && win.S.bp === F.S.bp && win.S.owner.trust === Math.min(100, t0 + 4) && lean(win.S, opp) < lean(F.S, opp));
  ok('ow3', 'the favourite loses, but not clean: a disqualification, for one booking power', dq.seg.fin === 'dq' && !dq.seg.wi.includes(f) && dq.S.bp === F.S.bp - 1 && dq.S.owner.trust === Math.min(100, t0 + 1), dq.seg.fin);
  const won = play.seg.wi.includes(f), clean = !won && (play.seg.fin === 'clean' || play.seg.fin === 'flash'), want = Math.max(0, Math.min(100, t0 - 2 + (won ? 3 : (clean ? -3 : 0))));
  ok('ow4', 'refuse the office: it is a bet on the match, and the other side respects it', play.S.bp === F.S.bp && Math.abs(play.S.owner.trust - want) < 0.001 && lean(play.S, opp) > lean(F.S, opp), (won ? 'the favourite won anyway' : (clean ? 'the favourite lost clean' : 'the favourite lost, not clean')) + ', trust ' + t0 + ' to ' + play.S.owner.trust);
  ok('ow5', 'the office does not call again for a few weeks', F.S.lcd.owner === F.S.week);
}
if (found.face) { const F = found.face, w = F.ev.who;
  const stay = answer('face', 0), build = answer('face', 1);
  ok('fc1', 'the question comes after a main event, with the reasons', F.ev.phase === 'post' && F.ev.why.length >= 1 && /who is this company built around/.test(F.ev.text), F.ev.why.join(' | '));
  ok('fc2', 'build the company around the winner: it is recorded, and they remember who decided it', !!build.S.fc && build.S.fc.id === w && build.S.fc.w === build.S.week && E.faceInfo(build.S).name === F.S.w[w].name && lean(build.S, w) > lean(F.S, w));
  ok('fc3', 'decide nothing: nothing is recorded', JSON.stringify(stay.S.fc || null) === JSON.stringify(F.S.fc || null) && stay.d.ok);
  /* what it does on the next show: the same card with and without a face of the company */
  const A = build.S; air(A); week(A); const card = desk(A);
  if (card) { const B = clone(A); B.fc = null; const on = card[card.length - 1].sides.flat().includes(w) ? 2 : (card.some(m => m.sides.flat().includes(w)) ? 1 : 0);
    const A0 = clone(A), sh = A0.queue[A0.qi], x = A0.w[w], said = c => E.validate(A0, c).warnings.some(t => /The shows are built around/.test(t));
    const expect = E.faceInfo(A0).here && !(!sh.big && sh.brand && x.brand && x.brand !== sh.brand), off = card.filter(m => !m.sides.flat().includes(w));
    const ra = E.runPlayerShow(A, card).rep, rb = E.runPlayerShow(B, card).rep, d = ra.hype - rb.hype;
    const capped = ra.hype >= 1.4 || rb.hype >= 1.4 || ra.hype <= 0.8 || rb.hype <= 0.8;
    ok('fc4', 'the crowd comes to see them: more interest when they are in the main event, less when they are left off', capped || (on === 2 ? Math.abs(d - 0.04) < 1e-9 : (on === 1 ? Math.abs(d) < 1e-9 : d <= 0)), 'on the card: ' + ['no', 'yes', 'in the main event'][on] + ', difference ' + d.toFixed(3));
    ok('fc5', 'the card builder warns when they are left off their own show, and only then', said(off) === expect && (on === 0 || !said(card)), 'left off: ' + said(off) + ', expected ' + expect);
    ok('fc6', 'their matches are louder', on === 0 || ra.segs.some(sg => sg.k === 'match' && (sg.fx || []).some(x => /The crowd came to see/.test(x.x))));
  }
}
/* a company that already has a face: the third answer takes the place away from everyone */
{ const S = E.newGame('pdw', 4, { name: 'R' }); let third = null;
  for (let wk = 0; wk < 60 && !third && !S.over; wk++) { while (!third && desk(S)) { S.bp = Math.max(S.bp, 6); E.liveBegin(S, S.card); air(S, ev => ev.kind === 'face' ? 1 : (ev.safe || 0), (ev, S) => { if (ev.kind === 'face' && ev.choices.length === 3 && !third) third = { S: clone(S), ev: JSON.parse(JSON.stringify(ev)) }; }); } if (!third) week(S); }
  ok('fc7', 'with someone already at the centre, the question comes again when a rival earns it', !!third, third ? third.ev.why.join(' | ') : 'never came up in 60 weeks');
  if (third) { const old = third.S.fc.id, nw = third.ev.who;
    const a = clone(third.S); E.liveDecide(a, 1); const b = clone(third.S); E.liveDecide(b, 2); const c = clone(third.S); E.liveDecide(c, 0);
    ok('fc8', 'build it around the new name: the old one holds it against you and is jealous', a.fc.id === nw && lean(a, old) < lean(third.S, old) && E.rel(a, old, nw).bond < E.rel(third.S, old, nw).bond);
    ok('fc9', 'nobody is bigger than the company: the place is empty, and the one who had it remembers', b.fc === null && lean(b, old) < lean(third.S, old) && E.faceInfo(b) === null);
    ok('fc10', 'stay with them: they remember that too, and so does the one passed over', c.fc.id === old && lean(c, old) > lean(third.S, old) && lean(c, nw) < lean(third.S, nw));
  }
}
/* trouble on the air comes up in the match it happens in */
{ const S = E.newGame('pdw', 5, { name: 'R' }); desk(S);
  let ch = null; for (let i = 0; i < 400 && !ch; i++) { S.chs = null; ch = E.chaos(S, S.card); }
  const mi = ch && ch.mi; E.liveBegin(S, S.card);
  let ev = null, at = -1; air(S, null, (e, S) => { if (e.kind === 'chaos') { ev = e; at = S.live.st.steps[S.live.st.k].i; } });
  ok('ch1', 'planted trouble comes up as a call at its own match, with the same choices', !!ev && at === mi && ev.choices.length === ch.choices.length && S.chs.done, ev && ev.text);
  ok('ch2', 'trouble does not count against the night’s other calls', !!ev && (S.reports[0].calls || []).some(c => c.k === 'chaos'));
}
/* the same answers on the same night give the same night */
{ const run = () => { const S = E.newGame('pdw', 7, { name: 'R' }); for (let wk = 0; wk < 3; wk++) { while (desk(S)) { E.liveBegin(S, S.card); air(S, (ev, k) => (k + 1) % ev.choices.length); } week(S); } return JSON.stringify(S); };
  ok('det1', 'the same answers give the same game', run() === run());
}
if (fails.length) { console.log('\nFAILED: ' + fails.length + '\n' + fails.join('\n')); process.exit(1); }
console.log('test-live: all passed');
