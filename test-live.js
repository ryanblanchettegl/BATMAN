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
const found = {}, byPick = {}, counts = { shows: 0, calls: 0, max: 0, kinds: {} }, texts = [];
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
        ev.choices.forEach((c, ci) => { const key = ev.kind + ':' + (c.k || ci); if ((c.k || ev.kind === 'audible' || ev.kind === 'overtime') && !byPick[key]) byPick[key] = { S: clone(S), ev: JSON.parse(JSON.stringify(ev)), c: ci }; });
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
for (const kind of ['titlecall', 'runin', 'hotmic', 'afterbell', 'face']) ok('kind', 'the ' + kind + ' call came up in the sample', !!found[kind]);
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
/* ---- calls in the ring ---- */
/** From a saved moment: answer with choice c, see the segment it belongs to, then see the night out. Returns {S, ev, seg, d, rep}. */
function through(F, c) {
  const S = clone(F.S), ev = S.live.ev, d = E.liveDecide(S, c); let seg = null;
  for (let g = 0; g < 40 && !seg; g++) { const r = E.liveNext(S); if (r.event) E.liveDecide(S, r.event.safe || 0); else if (r.seg) seg = r.seg; else if (r.done) break; }
  const rep = S.live ? air(S) : S.reports[0];
  return { S, ev, seg, d, rep };
}
/* somebody is hurt: a road-worn wrestler in a brutal match */
{ let F = null;
  for (const seed of [2, 3, 4, 5, 6, 7, 8, 9]) { if (F) break; const S = E.newGame('pdw', seed, { name: 'R' }); desk(S); const m = S.card.find(x => x.mt === '1v1'); if (!m) continue;
    const w = S.w[m.sides[0][0]]; w.rd = 95; m.int = 'brutal'; S.chs = { key: 'x', done: true };
    if (!E.liveBegin(S, S.card).ok) continue;
    for (let g = 0; g < 200 && !F; g++) { const r = E.liveNext(S); if (r.event) { if (r.event.kind === 'botch') F = { S: clone(S), ev: JSON.parse(JSON.stringify(r.event)), w: w.id }; else E.liveDecide(S, r.event.safe || 0); } else if (r.done) break; } }
  ok('bt0', 'a worn body in a demanding match brings the call', !!F && F.ev.who === F.w, F ? F.ev.why.join(' | ') : 'never came up');
  if (F) { found.botch = F; const w = F.ev.who, o = F.ev.other;
    ok('bt1', 'it says what it was about the body and the match, and the third answer is an attempt with its chance', F.ev.why.some(x => /on the road too long/.test(x)) && F.ev.why.some(x => /Brutal intensity/.test(x)) && F.ev.choices.length === 3 && F.ev.checks[2].p > 0 && F.ev.checks[2].p <= 1, 'chance ' + Math.round(F.ev.checks[2].p * 100) + '%');
    const stop = answer('botch', 0), go = answer('botch', 1), carry = answer('botch', 2);
    ok('bt2', 'stop the match: no winner, they are looked after, and they remember it', !stop.seg.wi.length && /stops the match/.test(stop.seg.finish) && lean(stop.S, w) > lean(F.S, w), stop.seg.finish);
    ok('bt3', 'go straight to the finish: a shorter match, and they hold it against you', go.seg.mins < carry.seg.mins && lean(go.S, w) < lean(F.S, w), go.seg.mins + ' minutes against ' + carry.seg.mins);
    ok('bt4', 'have the other one carry it: the attempt works or it does not, and the text says which', /^The attempt (worked|did not come off)\. /.test(carry.d.text) && (/worked/.test(carry.d.text) ? lean(carry.S, o) > lean(F.S, o) : lean(carry.S, w) < lean(F.S, w)), carry.d.text.slice(0, 60));
    ok('bt5', 'the same wrestler does not go down again for a month', F.S.lcd['bt' + w] === F.S.week);
  }
}
/* the crowd has gone quiet */
if (found.audible) { const F = found.audible;
  ok('au1', 'the cause is the match the building just sat through', /last match/.test(F.ev.why[0]) && F.ev.choices.length >= 2 && !F.ev.choices[0].bp, F.ev.why.join(' | '));
  const fl = byPick['audible:floor'], chq = byPick['audible:cheat'], up = byPick['audible:upset'];
  ok('au2', 'the sample had each way out of it', !!fl && !!chq && !!up, Object.keys(byPick).filter(k => /^audible/.test(k)).join(', '));
  if (fl) { const a = through(fl, fl.c); ok('au3', 'take it to the floor: the crowd wakes up and it is rougher', a.seg.fx.some(x => /fought through the seats/.test(x.x)) && a.S.bp === fl.S.bp); }
  if (chq) { const a = through(chq, chq.c), pk = chq.ev.choices[chq.c], heel = chq.S.live.card[chq.ev.mi].sides[pk.side];
    ok('au4', 'the villain cheats: a cheap win for one booking power, and a feud for it', a.seg.fin === 'cheap' && a.seg.wi.includes(heel[0]) && a.S.bp === chq.S.bp - 1 && !!feud(a.S, chq.ev.who, chq.ev.other), a.seg.fin); }
  if (up) { const a = through(up, up.c), pk = up.ev.choices[up.c], card = up.S.live.card[up.ev.mi], dog = card.sides[pk.side], other = card.sides[1 - pk.side];
    ok('au5', 'call the upset: the underdog wins for two booking power, and the loser remembers', a.seg.wi.includes(dog[0]) && a.S.bp === up.S.bp - 2 && lean(a.S, other[0]) < lean(up.S, other[0]) && lean(a.S, dog[0]) > lean(up.S, dog[0])); }
  const stay = through(F, 0); ok('au6', 'stay with the plan: nothing is spent', stay.S.bp === F.S.bp && stay.d.ok);
}
ok('kind', 'the audible call came up in the sample', !!found.audible);
/* they are not going home */
ok('kind', 'the overtime call came up in the sample', !!found.overtime);
if (found.overtime) { const F = found.overtime, home = through(F, 0);
  ok('ot1', 'it says why they are going long, and taking it home costs nothing', F.ev.why.length >= 1 && F.ev.choices.length >= 2 && home.S.bp === F.S.bp, F.ev.why.join(' | '));
  const sg = byPick['overtime:seg'], mn = byPick['overtime:main'], ov = byPick['overtime:over'];
  ok('ot2', 'the sample had more than one way to find the time', [sg, mn, ov].filter(Boolean).length >= 2, Object.keys(byPick).filter(k => /^overtime/.test(k)).join(', '));
  if (sg) { const base = through(sg, 0), a = through(sg, sg.c), cut = sg.S.live.st.steps[sg.ev.choices[sg.c].q], who = (cut.sg.who || [])[0];
    ok('ot3', 'cut a segment for them: the match is longer, the segment does not air, and its people remember', a.seg.mins > base.seg.mins && a.rep.segs.length === base.rep.segs.length - 1 && a.rep.night.filter(x => x.si < 0).length === base.rep.night.filter(x => x.si < 0).length + 1 && (who == null || lean(a.S, who) < lean(sg.S, who)), a.seg.mins + ' minutes against ' + base.seg.mins);
    ok('ot4', 'a show that lost a segment for time is not marked down as running light', !a.rep.light || a.rep.light <= (base.rep.light || 0), 'light ' + (a.rep.light || 0)); }
  if (mn) { const base = through(mn, 0), a = through(mn, mn.c), last = r => r.segs.filter(x => x.k === 'match').pop(), mainId = mn.S.live.card[mn.S.live.card.length - 1].sides[0][0];
    ok('ot5', 'take it out of the main event: this match is longer, the main event is shorter, and they know whose time it was', a.seg.mins > base.seg.mins && last(a.rep).mins < last(base.rep).mins && lean(a.S, mainId) < lean(mn.S, mainId), last(a.rep).mins + ' minutes against ' + last(base.rep).mins); }
  let ov2 = ov;   // a main event on weekly television, booked at less than full length, with somebody who has creative control
  for (const seed of [2, 3, 5, 8, 9, 10]) { if (ov2) break; const S = E.newGame('pdw', seed, { name: 'R' }); desk(S);
    const m = S.card[S.card.length - 1], other = S.card.find(x => x !== m && x.len === 'M'); if (m.mt !== '1v1' || !other) continue;
    m.len = 'M'; other.len = 'L'; S.w[m.sides[0][0]].cc = 1;   // the time taken off the main event goes to another match, so the show still fits
    if (!E.liveBegin(S, S.card).ok) continue;
    air(S, null, (ev, S) => { const ci = ev.choices.findIndex(c => c.k === 'over'); if (ev.kind === 'overtime' && ci >= 0 && !ov2) ov2 = { S: clone(S), ev: JSON.parse(JSON.stringify(ev)), c: ci }; }); }
  ok('ot6', 'a main event on weekly television can run over the slot', !!ov2);
  if (ov2) { const ov = ov2, a = clone(ov.S); E.clocks(a); const v0 = a.clocks.net.v; E.liveDecide(a, ov.c);
    ok('ot7', 'run over the slot: the network’s patience wears', a.clocks.net.v === Math.min(6, v0 + 1) && /ran over/.test(a.clocks.net.why)); }
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
/* the network on the line */
ok('kind', 'the network call came up in the sample', !!found.network);
if (found.network) { const F = found.network, net = S => { E.clocks(S); return S.clocks.net.v; }, v0 = net(clone(F.S));
  const run = c => { const S = clone(F.S); E.clocks(S); S.clocks.net.v = 2; const d = E.liveDecide(S, c); return { S, d }; };
  const a = run(0), b = run(1), c = run(2);
  ok('nw1', 'the network only calls about a weekly show in a better slot, and says what it objects to', !F.S.queue[F.S.qi].big && F.S.promos[F.S.player].slot >= 1 && F.ev.why.length >= 1 && /standards desk/.test(F.ev.text), F.ev.why.join(' | '));
  ok('nw2', 'let it run: its patience wears a little', a.S.clocks.net.v === 3);
  ok('nw3', 'tone it down: the match is tamer and the network is happier', b.S.clocks.net.v === 1 && ['normal', 'safe'].includes(b.S.live.card[F.ev.mi].int) && through(F, 1).seg.fx.some(x => /toned down for the network/.test(x.x)));
  ok('nw4', 'give them something to complain about: a hotter match and a much less patient network', c.S.clocks.net.v === 4 && c.S.live.card[F.ev.mi].int === 'brutal' && c.S.net.mood >= F.S.net.mood);
  ok('nw5', 'the standards desk does not call again for a month', F.S.lcd.net === F.S.week);
}
/* the sponsor at ringside: a deal that is nearly up */
{ let F = null;
  for (const seed of [3, 4, 5, 6]) { if (F) break; const S = E.newGame('pdw', seed, { name: 'R' }); desk(S);
    S.sponsors.push({ name: 'Harbor Lager', weeks: 3, type: 'image', val: 0, text: 'Popularity stays at 0 or better', pay: 20000 });
    if (!E.liveBegin(S, S.card).ok) continue;
    for (let g = 0; g < 200 && !F; g++) { const r = E.liveNext(S); if (r.event) { if (r.event.kind === 'sponsor') F = { S: clone(S), ev: JSON.parse(JSON.stringify(r.event)) }; else E.liveDecide(S, r.event.safe || 0); } else if (r.done) break; } }
  ok('sp0', 'a sponsor whose deal is nearly up asks for the main event', !!F && /Harbor Lager/.test(F.ev.text) && F.ev.why.length === 2, F ? F.ev.why.join(' | ') : 'never came up');
  if (F) { found.sponsor = F; const sp = S => S.sponsors.find(x => x.name === 'Harbor Lager');
    const no = through(F, 0), plug = through(F, 1);
    ok('sp1', 'not tonight: nothing changes, and they do not ask twice', sp(no.S).weeks === 3 && sp(F.S).asked === F.S.week && !no.seg.fx.some(x => /sponsor/.test(x.x)));
    ok('sp2', 'the announcers read the plug: the crowd groans and the deal is extended', sp(plug.S).weeks === 15 && plug.seg.fx.some(x => /groaned through the sponsor/.test(x.x)));
    if (F.ev.choices[2]) { const hold = through(F, 2), w = F.ev.choices[2].who;
      ok('sp3', 'the hero holds up the product: a longer deal, a bonus, and they do not enjoy it', sp(hold.S).weeks === 27 && lean(hold.S, w) < lean(F.S, w) && /bonus of \$40,000/.test(hold.d.text), hold.d.text); }
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
/* what the night left behind: filed with the report, laid out for the desk */
{ const S = E.newGame('pdw', 12, { name: 'R' });
  ok('nt1', 'before the first show the desk has nothing from a night', E.afterShow(S) === null);
  const card = desk(S), w = S.w[card[0].sides[0][0]];
  E.liveBegin(S, card); w.inj = 3; w.morale = Math.max(0, w.morale - 20); air(S, ev => ev.safe || 0);
  const r = S.reports[0], A = E.afterShow(S), by = k => A.items.find(i => i.k === k);
  ok('nt2', 'the report carries what the night left: the gate, television, who got hurt, whose mood moved, the writers', !!r.left && r.left.gate.att === r.att && r.left.gate.cap === r.cap && r.left.tv.v === r.viewers && r.left.hurt.some(h => h.id === w.id) && r.left.mood.some(m => m.id === w.id && m.d < 0) && r.left.writers.length >= 1);
  ok('nt3', 'the desk gets it one line each, trouble first, with the detail for a pop-up', !!A && A.name === r.name && A.items[0].k === 'hurt' && A.items[0].tone === 'bad' && A.items[0].line.includes(w.name) && ['room', 'gate', 'tv', 'writers'].every(k => by(k) && by(k).line && by(k).detail.length) && A.unseen === A.items.length, A.items.map(i => i.k).join(', '));
  ok('nt4', 'tickets are said against the seats there were, and the show gets a grade and a verdict in words', /tickets/.test(by('gate').line) && /^(A\+|A|A-|B\+|B|B-|C\+|C|C-|D|F)$/.test(A.grade) && !!A.head && !/%/.test(JSON.stringify(A)));
  E.nightSeen(S, 'gate');
  ok('nt5', 'looking at one marks it', E.afterShow(S).unseen === A.items.length - 1 && E.afterShow(S).items.find(i => i.k === 'gate').seen);
  while (desk(S)) { E.liveBegin(S, S.card); air(S, ev => ev.safe || 0); }
  ok('nt6', 'the next show replaces it, with nothing marked', E.afterShow(S).name === S.reports[0].name && (S.reports[0].name === r.name || E.afterShow(S).unseen === E.afterShow(S).items.length));
  week(S);
  ok('nt7', 'a new week starts with a clear desk', E.afterShow(S) === null); }
/* the night ends on a named problem: one matter in the inbox, caused by the show */
{ const S = E.newGame('pdw', 13, { name: 'R' }), P = S.promos.pdw, t = P.titles.find(x => !x.tag && x.holders.length), ch = S.w[t.holders[0]];
  S.inbox.forEach(e => { e.done = true; });
  const card = desk(S); E.liveBegin(S, card); ch.inj = 5; air(S, ev => ev.safe || 0);
  let ev = S.inbox.find(e => !e.done && e.type === 'champout'), A = E.afterShow(S);
  ok('nm1', 'a champion hurt on the show is a matter on the desk, named, with choices', !!ev && ev.w === ch.id && ev.choices.length === 2 && ev.text.includes(ch.name) && ev.text.includes(t.name) && !!A.matter && A.matter.id === ev.id && !A.matter.done, ev ? ev.text : 'no matter');
  ok('nm2', 'it holds the week: the inbox has to be answered', E.tasks(S).list.some(x => x.id === 'inbox' && x.state === 'todo'));
  const pr = t.prestige, lean = ((S.rmY || {})[ch.id] || { v: 0 }).v; E.resolveEvent(S, ev.id, 1);
  ok('nm3', 'keeping the belt on them costs the belt standing, and they remember it', t.holders[0] === ch.id && t.prestige < pr && S.rmY[ch.id].v > lean && E.afterShow(S).matter.done);
  const S2 = E.newGame('pdw', 13, { name: 'R' }), P2 = S2.promos.pdw, t2 = P2.titles.find(x => !x.tag && x.holders.length), c2 = S2.w[t2.holders[0]];
  E.liveBegin(S2, desk(S2)); c2.inj = 5; air(S2, e => e.safe || 0); E.resolveEvent(S2, S2.inbox.find(e => !e.done && e.type === 'champout').id, 0);
  ok('nm4', 'vacating it empties the belt, and they remember that too', t2.holders.length === 0 && S2.rmY[c2.id].v < 0);
  /* somebody who went home furious */
  const S3 = E.newGame('pdw', 14, { name: 'R' }); S3.inbox.forEach(e => { e.done = true; }); const k3 = desk(S3), w3 = S3.w[k3[1].sides[0][0]];
  E.liveBegin(S3, k3); w3.morale = Math.max(0, w3.morale - 30); air(S3, e => e.safe || 0);
  const f = S3.inbox.find(e => !e.done && e.type === 'furious');
  ok('nm5', 'somebody who went home furious is a matter with four answers, one of them an attempt', !!f && f.w === w3.id && f.choices.length === 4 && !!f.checks[0] && f.checks[0].p > 0, f ? f.text : (S3.inbox.filter(e => !e.done).map(e => e.type).join(',') || 'none'));
  if (f) { const q0 = S3.quests.length; E.resolveEvent(S3, f.id, 1); ok('nm6', 'a promised win is a promise the game holds you to', S3.quests.length === q0 + 1 && S3.quests[q0].type === 'win' && S3.quests[q0].w === w3.id); }
  /* at most one matter from a show, and not the same person again for weeks */
  const S4 = E.newGame('pdw', 15, { name: 'R' }); let most = 0, total = 0, shows = 0, kinds = {};
  for (let wk = 0; wk < 8; wk++) { while (desk(S4)) { const n0 = S4.inbox.length; E.liveBegin(S4, S4.card); air(S4, e => e.safe || 0); shows++; const nw = S4.inbox.slice(n0).filter(e => e.night); most = Math.max(most, nw.length); total += nw.length; nw.forEach(e => { kinds[e.type] = 1; E.resolveEvent(S4, e.id, e.choices.length - 1); }); } week(S4); }
  ok('nm7', 'a show leaves one matter at most, and over eight weeks some shows do', most <= 1 && total >= 1 && total < shows, total + ' from ' + shows + ' shows: ' + Object.keys(kinds).join(', ')); }
if (fails.length) { console.log('\nFAILED: ' + fails.length + '\n' + fails.join('\n')); process.exit(1); }
console.log('test-live: all passed');
