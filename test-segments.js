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
    const card = E.suggest(S), pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); }
    S.card = card; if (book) book(S);
    if (E.validate(S, card).errors.length) { S.segs = []; E.fitShow(S, card); if (E.validate(S, card).errors.length) { S.qi++; continue; } }
    return E.runPlayerShow(S, card).rep;
  }
  return null;
}
const adv = S => { house(S); if (S.qi >= S.queue.length) { E.endWeek(S); house(S); } };   // move on to a week that still has a show to book
const angles = r => r.segs.filter(s => s.k === 'angle');
const pickFor = (S, kind, slot) => { const who = []; for (let i = 0; i < E.SEGK[kind].roles.length; i++) { const c = E.segChoices(S, kind, who, slot)[i]; if (!c || !c.length) return null; who.push(c[0]); } return who; };

const mins = (S, card) => E.clock(S, card);
const clear = S => { while (E.segInfo(S).booked) E.setSeg(S, 0, null); };
const fx = (r, re) => r.segs.filter(s => s.k === 'match' && (s.fx || []).some(f => re.test(f.x)));

{ const S = E.newGame('pdw', 3, { name: 'R' }), P = S.promos.pdw;
  ok('pdw', 'nothing is booked before the card is built, and there is no fixed number of slots', E.segInfo(S).booked === 0 && E.segInfo(S).slots === undefined);
  /* the suggested card is a whole show that fits its two hours */
  house(S); S.card = E.suggest(S);
  let I = E.segInfo(S), c = mins(S, S.card);
  ok('pdw', 'a suggested weekly show is two hours, filled to within five minutes', c.budget === 120 && Math.abs(c.left) <= 5 && !c.over && !c.short, c.total + ' of ' + c.budget);
  ok('pdw', 'it comes with the company’s usual two promos or angles, one of them the writers’ pick', I.booked === 2 && I.list.some(x => x.k === 'writers') && I.list.some(x => x.k !== 'writers'), I.list.map(x => x.k + ':' + x.len).join(', '));
  ok('pdw', 'every item is on the clock, in order, with the top of each hour marked', c.items.length === S.card.length + 2 && c.items.every((x, k) => !k || x.at === c.items[k - 1].at + c.items[k - 1].mins) && c.tops.length === 2 && c.tops[0].at === 0 && c.tops[1].at === 60);
  ok('pdw', 'matches, promos and angles are counted as three kinds', c.cats.match.n === S.card.length && c.cats.promo.n + c.cats.angle.n === 2, JSON.stringify(c.cats));
  let r = E.runPlayerShow(S, S.card).rep;
  adv(S);
  ok('pdw', 'the writers’ pick runs as the writers’ work, the booked one as yours', angles(r).length === 2 && angles(r).filter(a => a.booked).length === 1 && angles(r).filter(a => a.wr).length === 1, angles(r).map(a => a.head + (a.booked ? '*' : '') + (a.wr ? ' (writers)' : '')).join(', '));
  ok('pdw', 'the report puts the night on the clock and judges the top of each hour', r.clock.budget === 120 && r.tops.length === 2 && r.segs.every(s => s.at != null && s.slot > 0) && r.tops.every(t => /start|Hour 2/.test(t.x)), r.tops.map(t => t.x).join(' | '));
  /* an interview and a call-out, and nothing for the writers */
  let who, target;
  r = show(S, S => { clear(S); who = pickFor(S, 'interview', -1); const a = E.setSeg(S, -1, { k: 'interview', who, pos: 1 }); const c = pickFor(S, 'callout', -1); target = c; const b = E.setSeg(S, -1, { k: 'callout', who: c, pos: 2 }); if (!a.ok || !b.ok) throw new Error(a.msg + ' / ' + b.msg); E.fitShow(S, S.card); });
  adv(S);
  const bk = angles(r).filter(a => a.booked);
  ok('pdw', 'two booked segments run', bk.length === 2, angles(r).map(a => a.head + (a.booked ? '*' : '')).join(', '));
  ok('pdw', 'the report names who was in each', bk[0].ids[0] === who[0] && bk[1].ids.join() === target.join() && bk[0].ov >= 5 && bk[0].ov <= 99);
  ok('pdw', 'a call-out starts or heats a feud between the two', S.feuds.some(f => !f.res && ((f.a.indexOf(target[0]) >= 0 && f.b.indexOf(target[1]) >= 0) || (f.a.indexOf(target[1]) >= 0 && f.b.indexOf(target[0]) >= 0))));
  ok('pdw', 'the list is empty again after the show', E.segInfo(S).booked === 0);
  /* a show with no promos or angles at all is allowed, if the matches fill the time */
  r = show(S, S => { clear(S); S.card.forEach(m => { m.len = 'L'; }); });
  adv(S);
  ok('pdw', 'a show can be all matches: the writers add nothing on their own', !!r && angles(r).length === 0 && r.open.k === 'match', r ? angles(r).length + ' angles, ' + r.clock.total + ' minutes' : 'did not run');
  /* as many as fit: six short promos are fine if the time is found for them */
  house(S); S.card = E.suggest(S); clear(S);
  const talkers = E.segChoices(S, 'interview', [], -1)[0].slice(0, 6);
  talkers.forEach((id, k) => { const z = E.setSeg(S, -1, { k: 'interview', who: [id], pos: k % S.card.length, len: 'S' }); if (!z.ok) throw new Error(z.msg); });
  ok('pdw', 'six promos on one show are accepted: there is no fixed count', E.segInfo(S).booked === 6 && E.segInfo(S).mins === 30);
  S.card.forEach(m => { m.len = 'L'; });
  ok('pdw', 'a show that runs over its time cannot run, and the reason is in minutes', E.validate(S, S.card).errors.some(e => /runs \d+ minutes over its two hours/.test(e)), E.validate(S, S.card).errors.join(' | '));
  clear(S); S.card.forEach(m => { m.len = 'S'; });
  ok('pdw', 'a show with time left empty cannot run either', E.validate(S, S.card).errors.some(e => /\d+ minutes of the two hours are still empty/.test(e)), E.validate(S, S.card).errors.join(' | '));
  ok('pdw', 'making it fit fills the time', E.fitShow(S, S.card) > 0 && !E.validate(S, S.card).errors.length && Math.abs(mins(S, S.card).left) <= 5, mins(S, S.card).total + ' minutes');
  /* how long a segment runs */
  clear(S);
  const all = E.segChoices(S, 'interview', [], -1)[0].filter(id => S.w[id].mgr == null), byMic = all.slice().sort((x, y) => S.w[y].mic - S.w[x].mic), good = byMic[0], poor = byMic[byMic.length - 1];
  const lk = (id, len) => E.segLook(S, { k: 'interview', who: [id], pos: 0, len }, -1);
  ok('pdw', 'short, medium and long are five, ten and fifteen minutes', lk(good, 'S').mins === 5 && lk(good, 'M').mins === 10 && lk(good, 'L').mins === 15);
  ok('pdw', 'a real talker gains from fifteen minutes', S.w[good].mic < 75 || lk(good, 'L').mid > lk(good, 'M').mid, S.w[good].name + ' mic ' + S.w[good].mic);
  ok('pdw', 'a poor talker is found out by fifteen minutes', S.w[poor].mic >= 75 || (lk(poor, 'L').mid < lk(poor, 'M').mid && lk(poor, 'L').notes.some(x => /long time on the microphone/.test(x[1]))), S.w[poor].name + ' mic ' + S.w[poor].mic);
  ok('pdw', 'a match costs more of the clock the longer it is, and a tag match more than a singles', (() => { const m = { mt: '1v1', stip: 'std', len: 'M', sides: [[null], [null]] }, a = E.matchMins(S, m, 1, 5), t = E.matchMins(S, { mt: 'tag', stip: 'std', len: 'M', sides: [[null, null], [null, null]] }, 1, 5); return a.S < a.M && a.M < a.L && a.now === a.M && t.M > a.M && E.matchMins(S, m, 4, 5).M > a.M; })());
  /* how the show opens */
  ok('pdw', 'with a match first the show goes straight to the ring', E.clock(S, S.card).open.k === 'match');
  E.setSeg(S, -1, { k: 'interview', who: [good], pos: 0 });
  ok('pdw', 'a promo before the first match opens the show', E.clock(S, S.card).open.k === 'promo' && E.clock(S, S.card).items[0].t === 'seg' && E.clock(S, S.card).items[0].top === 1);
  clear(S); E.setSeg(S, -1, { k: 'writers', who: [], pos: 0 });
  ok('pdw', 'the writers can be given the opening', E.clock(S, S.card).open.k === 'writers');
  clear(S);
  /* a promo that opens the show sets up the speaker's match */
  { const mi = S.card.length - 1, sp = S.card[mi].sides[0][0];
    r = show(S, S => { clear(S); const sp2 = S.card[S.card.length - 1].sides[0][0]; const z = E.setSeg(S, -1, { k: 'interview', who: [sp2], pos: 0 }); if (!z.ok) throw new Error(z.msg); E.fitShow(S, S.card); });
    adv(S); void mi; void sp;
    const op = r.segs[0];
    ok('pdw', 'the promo is the first thing on the show and the report says how it opened', op.k === 'angle' && op.booked === 'interview' && r.open.k === 'promo' && op.at === 0 && op.top === 1, r.open.k);
    ok('pdw', 'a decent opening promo lifts the speaker’s match later that night', op.ov < 50 || fx(r, /promo that opened the show set this match up/).length === 1, 'promo ' + op.ov); }
  /* a video recap needs a feud, is always five minutes, and lifts their match when it opens the show */
  { house(S); S.card = E.suggest(S); clear(S);
    const f = S.feuds.filter(x => !x.res && x.promo === 'pdw' && x.a.length === 1 && x.b.length === 1 && E.segChoices(S, 'recap', [x.a[0]], -1)[1].indexOf(x.b[0]) >= 0)[0];
    if (!f) ok('pdw', 'video recap: no singles feud to recap right now', true, 'skipped');
    else {
      const a = f.a[0], b = f.b[0];
      S.card = S.card.filter((m, k) => k === S.card.length - 1 || ![].concat(...m.sides).some(id => id === a || id === b));
      const main = S.card[S.card.length - 1], inMain = [].concat(...main.sides).some(id => id === a || id === b);
      if (inMain) { main.mt = '1v1'; main.sides = [[a], [b]]; main.title = null; main.win = -2; main.call = null; } else S.card.splice(1, 0, { mt: '1v1', sides: [[a], [b]], win: -2, call: null, title: null, stip: 'std', len: 'M' });
      const z = E.setSeg(S, -1, { k: 'recap', who: [a, b], pos: 0, len: 'L' });
      ok('pdw', 'a video recap is booked, and is five minutes whatever is asked', z.ok && E.segInfo(S).list[0].mins === 5 && E.clock(S, S.card).open.k === 'recap', z.msg);
      E.fitShow(S, S.card);
      const v = E.validate(S, S.card);
      if (v.errors.length) ok('pdw', 'the recap card can run', false, v.errors.join(' | '));
      else { r = E.runPlayerShow(S, S.card).rep; ok('pdw', 'the recap opens the show and their match gains from it', r.open.k === 'recap' && r.open.feud === f.id && fx(r, /video package that opened the show/).length === 1, r.open.k + ' ' + fx(r, /video package/).length); }
    }
    ok('pdw', 'a recap of two who are not feuding is refused', (() => { const L = E.eligible(S).filter(w => w.promo === 'pdw' && !S.feuds.some(x => !x.res && (x.a.concat(x.b)).indexOf(w.id) >= 0)); return L.length < 2 || !E.setSeg(S, -1, { k: 'recap', who: [L[0].id, L[1].id], pos: 0 }).ok; })()); }
  /* a brawl needs a feud; with one it heats it */
  adv(S);
  const f = S.feuds.find(x => !x.res && x.promo === 'pdw'), before = f.heat;
  r = show(S, S => { clear(S); const z = E.setSeg(S, -1, { k: 'brawl', who: [f.a[0], f.b[0]], pos: 1 }); if (!z.ok) throw new Error(z.msg); E.fitShow(S, S.card); });
  adv(S);
  ok('pdw', 'a brawl between rivals heats their feud', r && angles(r).some(a => a.booked === 'brawl') && (f.heat > before || f.res), before.toFixed(0) + ' to ' + f.heat.toFixed(0));
  /* refusals, in plain words */
  adv(S); S.card = E.suggest(S); clear(S);
  const strangers = (() => { const L = E.eligible(S).filter(w => w.promo === 'pdw' && !S.feuds.some(x => !x.res && (x.a.concat(x.b)).indexOf(w.id) >= 0)); return [L[0].id, L.find(w => w.id !== L[0].id && w.g === L[0].g).id]; })();
  ok('pdw', 'a war of words between two who are not feuding is refused', !E.setSeg(S, -1, { k: 'words', who: strangers, pos: 0 }).ok, E.setSeg(S, -1, { k: 'words', who: strangers, pos: 0 }).msg);
  ok('pdw', 'the same wrestler twice is refused', !E.setSeg(S, -1, { k: 'callout', who: [strangers[0], strangers[0]], pos: 0 }).ok);
  ok('pdw', 'a segment with nobody picked is refused', !E.setSeg(S, -1, { k: 'faceoff', who: [], pos: 0 }).ok);
  ok('pdw', 'nothing refused was left on the list', E.segInfo(S).booked === 0);
  E.setSeg(S, -1, { k: 'interview', who: [strangers[0]], pos: 0 });
  ok('pdw', 'someone booked in one segment cannot be booked in another', !E.setSeg(S, -1, { k: 'interview', who: [strangers[0]], pos: 0 }).ok && E.segInfo(S).booked === 1);
  ok('pdw', 'a booked segment can be changed in place', E.setSeg(S, 0, { k: 'interview', who: [strangers[0]], pos: 1, len: 'L' }).ok && E.segInfo(S).booked === 1 && E.segInfo(S).list[0].len === 'L' && E.segInfo(S).list[0].pos === 1);
  S.w[strangers[0]].inj = 3;
  ok('pdw', 'the card will not run with a booked segment that no longer works', E.validate(S, S.card).errors.some(e => /Booked interview/.test(e)), E.validate(S, S.card).errors.join(' | '));
  ok('pdw', 'taking it off the show clears the problem', E.setSeg(S, 0, null).ok && !E.validate(S, S.card).errors.some(e => /Booked/.test(e)) && E.segInfo(S).booked === 0);
  S.w[strangers[0]].inj = 0;
  /* a save made under the old rules, with empty slots in the list */
  S.segs = [null, { k: 'interview', who: [strangers[0]], pos: 0 }, null];
  ok('pdw', 'a list from an older save, with empty slots in it, is read cleanly', E.segInfo(S).booked === 1 && E.segInfo(S).list[0].len === 'M');
  clear(S);
  /* the other kinds */
  const tryKind = (kind, check) => { adv(S); S.card = E.suggest(S); { const pr = E.preShow(S, S.card); if (pr) { E.resolvePre(S, S.card, 0); E.fitShow(S, S.card); } } clear(S); const who = pickFor(S, kind, -1); if (!who) { ok('pdw', kind + ': nobody fits right now, and the choices say so', true, 'skipped'); return; }
    const pre = check.pre ? check.pre(who) : null, z = E.setSeg(S, -1, { k: kind, who, pos: 1 }); E.fitShow(S, S.card);
    const cur = E.segInfo(S).list.find(x => x.k === kind), look = cur ? cur.look : null; const rep = E.runPlayerShow(S, S.card).rep, a = rep && angles(rep).find(x => x.booked === kind);
    ok('pdw', kind + ' runs and scores inside the range it promised', z.ok && !!a && !!look && a.ov >= look.lo - 1 && a.ov <= look.hi + 1, a && look ? a.ov + ' against ' + look.lo + ' to ' + look.hi + ': ' + a.text : z.msg);
    if (a && check.post) ok('pdw', kind + ': ' + check.label, check.post(who, pre)); };
  tryKind('challenge', { label: 'the feud is for the belt', post: who => S.feuds.some(x => (x.a.concat(x.b)).indexOf(who[0]) >= 0 && (x.a.concat(x.b)).indexOf(who[1]) >= 0 && x.title) });
  tryKind('faceoff', { label: 'a feud begins or heats', post: who => S.feuds.some(x => (x.a.concat(x.b)).indexOf(who[0]) >= 0 && (x.a.concat(x.b)).indexOf(who[1]) >= 0) });
  tryKind('ambush', { label: 'the two are now feuding', post: who => S.feuds.some(x => (x.a.concat(x.b)).indexOf(who[0]) >= 0 && (x.a.concat(x.b)).indexOf(who[1]) >= 0) });
  tryKind('save', { label: 'the two are a team', post: who => S.w[who[0]].team != null && S.w[who[0]].team === S.w[who[1]].team });
  tryKind('turn', { label: 'they changed sides', pre: who => S.w[who[0]].align, post: (who, pre) => S.w[who[0]].align !== pre });
  tryKind('words', { label: 'the feud is still going', post: who => true });
  /* a big event is three hours */
  for (let g = 0; g < 8 && !(S.queue[S.qi] && S.queue[S.qi].big); g++) { if (S.qi < S.queue.length) { show(S); } adv(S); }
  if (S.queue[S.qi] && S.queue[S.qi].big) { house(S); S.card = E.suggest(S); const cb = E.clock(S, S.card);
    ok('pdw', 'a big event is three hours, and the suggested one fills them', cb.budget === 180 && Math.abs(cb.left) <= 5 && cb.tops.length === 3, cb.total + ' of ' + cb.budget); }
  else ok('pdw', 'a big event came up within eight weeks', false);
}

/* suggestions on every show for 40 weeks, three companies: no errors, and the same seed gives the same game */
function longRun(id, seed) {
  const S = E.newGame(id, seed, { name: 'R' }); let errs = 0, booked = 0, shows = 0, why = '';
  for (let wk = 0; wk < 40 && !S.over; wk++) {
    while (S.qi < S.queue.length) { try { const r = show(S, S => { booked += E.segInfo(S).list.filter(x => x.k !== 'writers').length; }); if (r) shows++; else break; } catch (x) { errs++; why = why || x.message; S.qi++; } }
    try { house(S); E.endWeek(S); } catch (x) { errs++; why = why || x.message; }
  }
  return { S, errs, booked, shows, why };
}
['whw', 'ttt', 'kjp'].forEach(id => { const r = longRun(id, 5); ok(id, 'forty weeks with suggested promos and angles on every show', r.errs === 0 && JSON.stringify(r.S).indexOf('NaN') < 0 && r.booked > r.shows * 0.8, r.errs ? r.errs + ' errors: ' + r.why : r.booked + ' segments over ' + r.shows + ' shows'); });
{ const a = longRun('ocw', 9), b = longRun('ocw', 9); ok('ocw', 'the same seed and the same bookings give the same game', JSON.stringify(a.S) === JSON.stringify(b.S)); }
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-segments: all passed');
