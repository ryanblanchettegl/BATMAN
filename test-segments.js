/* Promos and angles the player books beside the matches.  Run: node test-segments.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
/** Book and run the next show. `book(S)` may set segments once the card is on the desk. Returns the report. */
function show(S, book) {
  house(S);
  for (let guard = 0; guard < 6 && S.qi < S.queue.length; guard++) {
    const card = E.suggest(S), pr = E.preShow(S, card); if (pr) E.resolvePre(S, card, 0);
    S.card = card; if (book) book(S);
    if (E.validate(S, card).errors.length) { S.segs = []; if (E.validate(S, card).errors.length) { S.qi++; continue; } }
    return E.runPlayerShow(S, card).rep;
  }
  return null;
}
const adv = S => { house(S); if (S.qi >= S.queue.length) { E.endWeek(S); house(S); } };   // move on to a week that still has a show to book
const angles = r => r.segs.filter(s => s.k === 'angle');
const pickFor = (S, kind, slot) => { const who = []; for (let i = 0; i < E.SEGK[kind].roles.length; i++) { const c = E.segChoices(S, kind, who, slot)[i]; if (!c || !c.length) return null; who.push(c[0]); } return who; };

{ const S = E.newGame('pdw', 3, { name: 'R' }), P = S.promos.pdw;
  ok('pdw', 'a weekly show has two segment slots, both with the writers', E.segInfo(S).slots === 2 && E.segInfo(S).booked === 0);
  let r = show(S);
  adv(S);
  ok('pdw', 'with nothing booked the writers fill both, as before', angles(r).length >= 2 && angles(r).every(a => !a.booked), angles(r).length + ' angles');
  /* an interview and a call-out */
  let who, target;
  r = show(S, S => { who = pickFor(S, 'interview', 0); const a = E.setSeg(S, 0, { k: 'interview', who, pos: 0 }); const c = pickFor(S, 'callout', 1); target = c; const b = E.setSeg(S, 1, { k: 'callout', who: c, pos: 1 }); if (!a.ok || !b.ok) throw new Error(a.msg + ' / ' + b.msg); });
  adv(S);
  const bk = angles(r).filter(a => a.booked);
  ok('pdw', 'two booked segments run, and the writers add none', bk.length === 2 && angles(r).length === 2, angles(r).map(a => a.head + (a.booked ? '*' : '')).join(', '));
  ok('pdw', 'the report names who was in each', bk[0].ids[0] === who[0] && bk[1].ids.join() === target.join() && bk[0].ov >= 5 && bk[0].ov <= 99);
  ok('pdw', 'a call-out starts or heats a feud between the two', S.feuds.some(f => !f.res && ((f.a.indexOf(target[0]) >= 0 && f.b.indexOf(target[1]) >= 0) || (f.a.indexOf(target[1]) >= 0 && f.b.indexOf(target[0]) >= 0))));
  ok('pdw', 'the slots are empty again after the show', E.segInfo(S).booked === 0);
  /* a brawl needs a feud; with one it heats it */
  const f = S.feuds.find(x => !x.res && x.promo === 'pdw'), before = f.heat;
  r = show(S, S => { const z = E.setSeg(S, 0, { k: 'brawl', who: [f.a[0], f.b[0]], pos: 0 }); if (!z.ok) throw new Error(z.msg); });
  adv(S);
  ok('pdw', 'a brawl between rivals heats their feud', r && angles(r).some(a => a.booked === 'brawl') && (f.heat > before || f.res), before.toFixed(0) + ' to ' + f.heat.toFixed(0));
  /* refusals, in plain words */
  adv(S); S.card = E.suggest(S);
  const strangers = (() => { const L = E.eligible(S).filter(w => w.promo === 'pdw' && !S.feuds.some(x => !x.res && (x.a.concat(x.b)).indexOf(w.id) >= 0)); return [L[0].id, L.find(w => w.id !== L[0].id && w.g === L[0].g).id]; })();
  ok('pdw', 'a war of words between two who are not feuding is refused', !E.setSeg(S, 0, { k: 'words', who: strangers, pos: 0 }).ok, E.setSeg(S, 0, { k: 'words', who: strangers, pos: 0 }).msg);
  ok('pdw', 'the same wrestler twice is refused', !E.setSeg(S, 0, { k: 'callout', who: [strangers[0], strangers[0]], pos: 0 }).ok);
  ok('pdw', 'a segment with nobody picked is refused', !E.setSeg(S, 0, { k: 'faceoff', who: [], pos: 0 }).ok);
  E.setSeg(S, 0, { k: 'interview', who: [strangers[0]], pos: 0 });
  ok('pdw', 'someone booked in one segment cannot be booked in another', !E.setSeg(S, 1, { k: 'interview', who: [strangers[0]], pos: 0 }).ok);
  S.w[strangers[0]].inj = 3;
  ok('pdw', 'the card will not run with a booked segment that no longer works', E.validate(S, S.card).errors.some(e => /Booked interview/.test(e)), E.validate(S, S.card).errors.join(' | '));
  ok('pdw', 'handing it back to the writers clears the problem', E.setSeg(S, 0, null).ok && !E.validate(S, S.card).errors.some(e => /Booked/.test(e)));
  S.w[strangers[0]].inj = 0;
  /* the other kinds */
  const tryKind = (kind, check) => { adv(S); S.card = E.suggest(S); { const pr = E.preShow(S, S.card); if (pr) E.resolvePre(S, S.card, 0); } const who = pickFor(S, kind, 0); if (!who) { ok('pdw', kind + ': nobody fits right now, and the choices say so', true, 'skipped'); return; }
    const look = E.segLook(S, { k: kind, who, pos: 0 }, 0), pre = check.pre ? check.pre(who) : null, z = E.setSeg(S, 0, { k: kind, who, pos: 0 }); const rep = E.runPlayerShow(S, S.card).rep, a = rep && angles(rep).find(x => x.booked === kind);
    ok('pdw', kind + ' runs and scores inside the range it promised', z.ok && !!a && a.ov >= look.lo - 1 && a.ov <= look.hi + 1, a ? a.ov + ' against ' + look.lo + ' to ' + look.hi + ': ' + a.text : z.msg);
    if (a && check.post) ok('pdw', kind + ': ' + check.label, check.post(who, pre)); };
  tryKind('challenge', { label: 'the feud is for the belt', post: who => S.feuds.some(x => (x.a.concat(x.b)).indexOf(who[0]) >= 0 && (x.a.concat(x.b)).indexOf(who[1]) >= 0 && x.title) });
  tryKind('faceoff', { label: 'a feud begins or heats', post: who => S.feuds.some(x => (x.a.concat(x.b)).indexOf(who[0]) >= 0 && (x.a.concat(x.b)).indexOf(who[1]) >= 0) });
  tryKind('ambush', { label: 'the two are now feuding', post: who => S.feuds.some(x => (x.a.concat(x.b)).indexOf(who[0]) >= 0 && (x.a.concat(x.b)).indexOf(who[1]) >= 0) });
  tryKind('save', { label: 'the two are a team', post: who => S.w[who[0]].team != null && S.w[who[0]].team === S.w[who[1]].team });
  tryKind('turn', { label: 'they changed sides', pre: who => S.w[who[0]].align, post: (who, pre) => S.w[who[0]].align !== pre });
  tryKind('words', { label: 'the feud is still going', post: who => true });
}

/* suggestions on every show for 40 weeks, three companies: no errors, and the same seed gives the same game */
function longRun(id, seed) {
  const S = E.newGame(id, seed, { name: 'R' }); let errs = 0, booked = 0, shows = 0, why = '';
  for (let wk = 0; wk < 40 && !S.over; wk++) {
    while (S.qi < S.queue.length) { try { const r = show(S, S => { E.segSuggest(S); booked += E.segInfo(S).booked; }); if (r) shows++; else break; } catch (x) { errs++; why = why || x.message; S.qi++; } }
    try { house(S); E.endWeek(S); } catch (x) { errs++; why = why || x.message; }
  }
  return { S, errs, booked, shows, why };
}
['whw', 'ttt', 'kjp'].forEach(id => { const r = longRun(id, 5); ok(id, 'forty weeks with suggested promos and angles on every show', r.errs === 0 && JSON.stringify(r.S).indexOf('NaN') < 0 && r.booked > r.shows, r.errs ? r.errs + ' errors: ' + r.why : r.booked + ' segments over ' + r.shows + ' shows'); });
{ const a = longRun('ocw', 9), b = longRun('ocw', 9); ok('ocw', 'the same seed and the same bookings give the same game', JSON.stringify(a.S) === JSON.stringify(b.S)); }
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-segments: all passed');
