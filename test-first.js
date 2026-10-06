/* The first year and the core loop: how a game opens, the actions every game makes you take once, promises that
   reach the card, and the risk shown on every line of the run sheet.  Run: node test-first.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const req = S => E.tasks(S).list.filter(t => t.req);
const show = S => { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } E.runPlayerShow(S, c); };

/* the opening: the owner's letter */
E.universe().promotions.forEach(d => { const S = E.newGame(d.id, 2, { name: 'Ryan' }), W = E.welcome(S), all = W.lines.join(' ');
  ok(d.id, 'a new game opens on a letter from the owner: the job, where the company stands, the first show', W.from === S.owner.name && W.to === 'Ryan' && /Congratulations\. The job is yours\./.test(W.lines[0]) && W.lines.length >= 4 && all.includes(S.queue[0].name) && /number \d+ of \d+|biggest company|near the bottom/.test(all) && !/undefined|NaN/.test(all + W.company + W.date), W.lines[2]); });

/* after the first show: a sponsor, once */
{ const S = E.newGame('pdw', 4, { name: 'R' });
  ok('sp1', 'before the first show nothing is required', req(S).length === 0 && E.tasks(S).list.find(t => t.id === 'sponsors').waive);
  show(S); const t = E.tasks(S).list.find(x => x.id === 'sponsors');
  ok('sp2', 'after the first show, signing a sponsor is required and says what a sponsor is', !!t && t.req && !t.waive && t.state === 'todo' && /first sponsor/.test(t.text) && /condition/.test(t.text) && !E.taskWave(S, 'sponsors').ok, t && t.text);
  ok('sp3', 'it holds the next show', !E.taskGate(S, 'show').ok || !E.taskGate(S, 'book').ok);
  E.acceptSponsor(S, S.spOffers.findIndex(o => E.sponsorOk(S, o)));
  ok('sp4', 'signing one settles it for good', req(S).length === 0 && S.req.sponsor === 1);
  S.sponsors = []; E.tasks(S);
  ok('sp5', 'it is asked once: later offers can be left for another week', !req(S).length && (E.tasks(S).list.find(x => x.id === 'sponsors') || { waive: true }).waive); }

/* before the first big event: the face of the company */
{ const S = E.newGame('pdw', 4, { name: 'R' });
  while (S.week < 4) { S.inbox.forEach(e => { if (!e.done) E.resolveEvent(S, e.id, e.choices.length - 1); }); while (S.qi < S.queue.length) show(S); S.inbox.forEach(e => { if (!e.done) E.resolveEvent(S, e.id, e.choices.length - 1); }); E.endWeek(S); }
  const named = !!S.fc, t = E.tasks(S).list.find(x => x.id === 'face');
  if (named) ok('fc1', 'the building already chose somebody on the air, so nothing is asked', !t);
  else {
    ok('fc1', 'in the week of the first big event, naming the face of the company is required', S.queue.some(q => q.big) && !!t && t.req && !t.waive && !E.taskGate(S, 'book').ok, t && t.text);
    const C = E.faceCandidates(S), ch = S.promos.pdw.titles.find(x => !x.tag && x.lvl === 3 && x.holders.length);
    ok('fc2', 'the pop-up offers the biggest names, each with a reason', C.length >= 4 && C.every(c => c.name && c.why) && (!ch || C.some(c => c.id === ch.holders[0])), C.map(c => c.name).join(', '));
    const r = E.nameFace(S, C[1].id), w = S.w[C[1].id];
    ok('fc3', 'naming one builds the shows around them, and they remember it', r.ok && S.fc.id === w.id && E.faceInfo(S) && S.rmY[w.id].v > 0 && !E.tasks(S).list.some(x => x.id === 'face' && x.state === 'todo'));
    ok('fc4', 'it is asked once', S.req.face === 1); } }

/* promises reach the card */
{ const S = E.newGame('pdw', 6, { name: 'R' }); S.bp = 12; let c = E.suggest(S); const w = S.w[c[1].sides[1][0]];
  S.quests.push({ id: S.nid++, type: 'win', w: w.id, due: S.week, text: 'Promise: book a win for ' + w.name });
  const i = c.findIndex(m => m.sides.some(s => s.includes(w.id))); c.forEach(m => { m.call = null; });
  let F = E.cardFlags(S, c);
  ok('pr1', 'a match with somebody you promised a win is flagged on its line', F[i].some(f => f.t === 'Promised a win' && f.k === 'warn'), JSON.stringify(F[i]));
  S.qi = S.queue.length - 1; const last = E.suggest(S); last.forEach(m => { m.call = null; });
  ok('pr2', 'on the last show before it falls due, the card warns when they are not called to win', E.validate(S, last).warnings.some(x => x.includes(w.name) && /promised/.test(x)) || !last.some(m => m.sides.some(s => s.includes(w.id))));
  S.qi = 0; c = E.suggest(S); const m = c.find(x => x.sides.some(s => s.includes(w.id)));
  ok('pr3', 'the suggested card calls the promised win when the booking power is there', !m || (m.call != null && m.sides[m.call].includes(w.id) && E.cardCost(S, c) <= S.bp && E.validate(S, c).errors.length === 0), m ? 'called ' + m.call : 'not on the card');
  if (m) ok('pr4', 'and the line says the promise is kept', E.cardFlags(S, c)[c.indexOf(m)].some(f => f.t === 'Promise kept' && f.k === 'good'));
  S.bp = 0; const c0 = E.suggest(S);
  ok('pr5', 'with no booking power it does not call what it cannot pay for', E.cardCost(S, c0) <= S.bp); }

/* the face of the company goes in the main event of a suggested card */
{ const S = E.newGame('pdw', 7, { name: 'R' }), c = E.suggest(S), mid = c[1].sides[0][0]; S.fc = { id: mid, w: S.week };
  const c2 = E.suggest(S), at = c2.findIndex(m => m.sides.some(s => s.includes(mid)));
  ok('fm1', 'when the face of the company is on the suggested card, they are in the main event', at < 0 || at === c2.length - 1 || (c2[c2.length - 1].title && !c2[at].title), 'match ' + (at + 1) + ' of ' + c2.length);
  ok('fm2', 'and the show still fits its time', E.validate(S, c2).errors.length === 0, E.validate(S, c2).errors.join(' | ')); }

/* the risk is on every line */
{ const S = E.newGame('pdw', 8, { name: 'R' }), c = E.suggest(S); S.w[c[0].sides[0][0]].morale = 15; S.w[c[2].sides[0][0]].cond = 25;
  const F = E.cardFlags(S, c);
  ok('fl1', 'one list of flags for each match, short enough for a line', F.length === c.length && F.every(L => L.every(f => f.t.length <= 16 && f.x && /^(good|bad|warn)$/.test(f.k))));
  ok('fl2', 'somebody unhappy and somebody running on fumes are flagged where they are booked', F[0].some(f => f.t === 'Unhappy') && F[2].some(f => f.t === 'Worn down'), JSON.stringify(F.map(L => L.map(f => f.t))));
  const R = E.agentReads(S, c);
  ok('fl3', 'a flag about the ring never says more than the agent’s read does', F.every((L, i) => L.filter(f => !/Unhappy|Promis/.test(f.t)).every(f => R[i].lines.some(l => l.t === f.x)))); }

/* booking power on the Storylines page */
{ const S = E.newGame('pdw', 9, { name: 'R' }), P = S.promos.pdw; S.bp = 0; let I = E.plotInfo(S);
  ok('bp1', 'three things booking power buys on Storylines, each with its price', I.acts.map(a => a.id).join() === 'split,push,tape' && I.acts.every(a => a.cost >= 1 && a.d && !a.can));
  ok('bp2', 'with no booking power nothing can be bought', !E.plotDo(S, 'push', { w: I.push[0].id }).ok && !E.plotDo(S, 'split', { team: (I.teams[0] || {}).id }).ok);
  S.bp = 6; I = E.plotInfo(S); const t = I.teams[0], n0 = S.teams.length, f0 = S.feuds.filter(f => !f.res).length;
  const r = E.plotDo(S, 'split', { team: t.id, who: t.b });
  ok('bp3', 'breaking up a team ends it, starts a rivalry between the two, and the one who turns is the villain', r.ok && S.teams.length === n0 - 1 && S.w[t.a].team == null && S.feuds.filter(f => !f.res).length === f0 + 1 && !!E.feudOf(S, t.a, t.b) && S.w[t.b].align === 'H' && S.bp === 4, r.msg);
  ok('bp4', 'they both remember who did it', S.rmY[t.a].v < 0 && S.rmY[t.b].v > 0);
  const w = S.w[I.push[6].id], m0 = w.mom || 0, o0 = w.ovr, rp = E.plotDo(S, 'push', { w: w.id });
  ok('bp5', 'a push gives momentum now, costs two, and is remembered', rp.ok && w.mom > m0 && w.ovr >= o0 && S.bp === 2 && S.rmY[w.id].v > 0, rp.msg);
  ok('bp6', 'one push in eight weeks for each wrestler', !E.plotDo(S, 'push', { w: w.id }).ok && S.bp === 2);
  const a = E.plotTapeWho(S, 'callout', [])[0][4], b = E.plotTapeWho(S, 'callout', [a])[1][0], rt = E.plotDo(S, 'tape', { k: 'callout', who: [a, b], at: 'end' });
  ok('bp7', 'a pre-tape costs one and is on the next show’s run sheet at once', rt.ok && S.bp === 1 && S.segs.some(x => x.tape && x.k === 'callout' && x.at === 'end') && E.plotInfo(S).taped.where === 'End of the show', rt.msg);
  ok('bp8', 'one pre-tape a show', !E.plotDo(S, 'tape', { k: 'interview', who: [E.plotTapeWho(S, 'interview', [])[0][0]], at: 'start' }).ok);
  const card = E.suggest(S);
  ok('bp9', 'a suggested card keeps the pre-tape, and the show still fits its time', S.segs.some(x => x.tape) && E.validate(S, card).errors.length === 0, E.validate(S, card).errors.join(' | '));
  E.runPlayerShow(S, card);
  ok('bp10', 'it airs on that show and is gone from the next', S.reports[0].segs.some(x => x.k !== 'match' && (x.ids || []).includes(a)) && !E.plotInfo(S).taped); }

if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-first: all passed');
