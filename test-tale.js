/* Storylines on the card (src/99-tale.js, src/99-ringside.js, src/99-tutorial.js): arcs the writers put on the show
   and the booker decides, storyline matches, promised matches and promos locked onto their show, a guest on
   commentary and a run-in on a match, and a new game that opens on the biggest show of the year with the tutorial.
   Run: node test-tale.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
let fails = 0; const ok = (tag, m, c, x) => { console.log(tag.padEnd(6), c ? 'ok  ' : 'FAIL', m + (x != null && !c ? ': ' + x : '')); if (!c) fails++; };
const use = u => E.useUniverse(JSON.parse(fs.readFileSync('universes/' + u + '.json', 'utf8')));
const house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
const runShow = (S, decide) => { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (decide) decide(S, c); const v = E.validate(S, c); if (v.errors.length) { S.qi++; return { err: v.errors }; } return E.runPlayerShow(S, c); };
const week = (S, decide) => { house(S); const out = []; while (S.qi < S.queue.length) out.push(runShow(S, decide)); E.endWeek(S); return out; };

use('public_domain');
/* ---------- arcs ---------- */
{
  const S = E.newGame(E.universe().promotions[0].id, 5);
  let seen = 0, decided = 0, aired = [], forcedKept = true, errs = [];
  for (let wk = 0; wk < 40; wk++) {
    week(S, (S, c) => {
      const I = E.taleInfo(S); if (!I.on || !I.tonight) return; seen++;
      // the writers' segment survives Suggest and Clear, and cannot be taken off
      const slot = E.segInfo(S).list.findIndex(x => x.k === 'arc'); if (slot < 0) { forcedKept = false; return; }
      if (E.setSeg(S, slot, null).ok) forcedKept = false;
      E.segClear(S); if (!E.segInfo(S).list.some(x => x.k === 'arc')) forcedKept = false; E.fitShow(S, c);   // the time the writers had is back to fill
      if (wk % 2 === 0) { E.taleDecide(S, I.o.length - 1); decided++; }
    }).forEach(r => { if (r.err) errs.push(r.err[0]); else (r.rep.segs || []).filter(x => x.arc).forEach(x => aired.push(x)); });
  }
  ok('arc', 'the writers put arc chapters on the shows', seen >= 6, seen);
  ok('arc', 'a chapter on the run sheet cannot be taken off, and Suggest and Clear keep it', forcedKept);
  ok('arc', 'every chapter aired plays a storyline beat with its people', aired.length >= 6 && aired.every(x => x.beat && x.bids && x.bids.length >= 2), aired.map(x => x.beat).join(','));
  ok('arc', 'what the booker decided is what aired, and the rest the writers decided', aired.some(x => x.arc.you) && aired.some(x => !x.arc.you));
  ok('arc', 'arcs end, and a new one begins after', (S.sas || []).length >= 2, JSON.stringify(S.sas));
  const ways = new Set(); (S.sas || []).forEach(a => ways.add(a.res)); aired.forEach(x => ways.add(x.arc.node + ':' + x.arc.ch));
  ok('arc', 'the story branched: different chapters and answers were taken', ways.size >= 6, [...ways].join(' | '));
  ok('arc', 'no show was refused for an arc', !errs.some(e => /arc/i.test(e)), errs.join(' | '));
  // an undecided chapter is a task on the desk that cannot be waved off
  const T = E.taleStart(S, 'betrayal'); if (T) { T.due = S.week; S.segKey = null; }
  const I = E.taleInfo(S), tk = E.tasks ? E.tasks(S) : null;
  if (I.on && I.tonight) ok('arc', 'an arc waiting for an answer is a task that stops the show', E.taskGate(S, 'show').left.some(x => /arc/i.test(x)), JSON.stringify(E.taskGate(S, 'show')));
}
/* ---------- storyline matches ---------- */
{
  const S = E.newGame(E.universe().promotions[0].id, 9); week(S); week(S);
  const f = E.activeFeuds(S).find(x => x.promo === S.player);
  const m = { mt: '1v1', sides: [[f.a[0]], [f.b[0]]], len: 'M', stip: 'std' }, o = E.rosterOf(S, S.player).find(w => f.a.concat(f.b).indexOf(w.id) < 0 && !w.nw);
  ok('story', 'two people in a feud make a storyline match', (E.storyOfMatch(S, m) || {}).k === 'feud');
  ok('story', 'two strangers do not', !E.storyOfMatch(S, { mt: '1v1', sides: [[f.a[0]], [o.id]] }) || !!E.feudOf(S, f.a[0], o.id));
}
/* ---------- promises at the next big event ---------- */
{
  const S = E.newGame(E.universe().promotions[0].id, 11); house(S);
  const P = S.promos[S.player], t = P.titles.find(x => !x.tag && x.holders.length), ch = S.w[t.holders[0]];
  const w = E.rosterOf(S, S.player).find(x => !x.nw && x.g === ch.g && x.id !== ch.id && !P.titles.some(y => y.holders.indexOf(x.id) >= 0));
  // the inbox's own answer for a title shot asked for
  const ev = { id: S.nid++, type: 'shot', w: w.id, title: t.id, text: '', choices: ['Promise the shot', 'Not yet'] }; S.inbox.push(ev);
  E.resolveEvent(S, ev.id, 0);
  const q = S.quests.find(x => x.type === 'shot' && x.w === w.id);
  ok('lock', 'a promised title shot is for the next big event', q && q.at != null && E.cal(q.at).wom === 4, q && q.text);
  let bigCard = null, kept = false, refused = null;
  // until the big event the promised wrestler stays off the weekly shows, so they cannot win the belt early or get hurt
  const keepOff = (S, c) => { if (S.queue[S.qi].big) return; for (let i = c.length - 1; i >= 0; i--) if (c[i].sides && c[i].sides.some(sd => sd.indexOf(w.id) >= 0)) c.splice(i, 1); E.fitShow(S, c); };
  for (let k = 0; k < 6 && !bigCard; k++) { house(S); while (S.qi < S.queue.length) { const sh = S.queue[S.qi];
    if (sh.big) { bigCard = S.card.map(m => JSON.parse(JSON.stringify(m))); const i = S.card.findIndex(m => m.pm != null); refused = i >= 0 ? E.cardRemove(S, i) : null; E.cardClear(S); kept = S.card.some(m => m.pm != null); }
    runShow(S, keepOff); } E.endWeek(S); }
  const pm = bigCard && bigCard.find(m => m.pm != null && m.sides[0][0] === w.id);
  ok('lock', 'the big event opens with the promised match on its card', !!pm && pm.sides[0][0] === w.id && pm.title === t.id, JSON.stringify(bigCard));
  ok('lock', 'it cannot be taken off, and Clear keeps it', refused && !refused.ok && kept, refused && refused.msg);
  ok('lock', 'the promise was kept on the night', !S.quests.some(x => x.id === q.id), JSON.stringify(S.quests.filter(x => x.w === w.id)));
  // a second promise for the same title at the same event goes to the event after it
  const w2 = E.rosterOf(S, S.player).find(x => !x.nw && x.g === ch.g && x.id !== w.id && !P.titles.some(y => y.holders.indexOf(x.id) >= 0));
  const ev1 = { id: S.nid++, type: 'shot', w: w.id, title: t.id, text: '', choices: ['a', 'b'] }, ev2 = { id: S.nid++, type: 'shot', w: w2.id, title: t.id, text: '', choices: ['a', 'b'] };
  S.inbox.push(ev1, ev2); E.resolveEvent(S, ev1.id, 0); E.resolveEvent(S, ev2.id, 0);
  const q1 = S.quests.find(x => x.w === w.id && x.type === 'shot'), q2 = S.quests.find(x => x.w === w2.id && x.type === 'shot');
  ok('lock', 'two promises for one title go to two big events', q1 && q2 && q1.at !== q2.at, q1 && q2 && q1.at + ' / ' + q2.at);
  // a promised promo is on the next show's run sheet
  const talker = E.rosterOf(S, S.player).filter(x => !x.nw && x.inj <= 0).sort((a, b) => b.mic - a.mic)[0];
  const r = E.promisePromo(S, talker.id); runShow(S); if (S.qi >= S.queue.length) { E.endWeek(S); house(S); }   // on to the show it was promised for
  const L = E.segInfo(S).list.find(x => x.pm != null);
  ok('lock', 'a promised promo is on the next show, and stays', r.ok && L && L.who[0] === talker.id && !E.setSeg(S, L.slot, null).ok, r.msg);
}
/* ---------- a guest on commentary and a run-in ---------- */
{
  const S = E.newGame(E.universe().promotions[0].id, 5); house(S);
  const c = E.suggest(S); S.card = c;
  const ch = E.ringsideChoices(S, 0);
  ok('ring', 'the desk and the curtain list the ones with a story first', ch.length > 3 && (!!ch[0].why || !ch.some(x => x.why)), JSON.stringify(ch.slice(0, 3)));
  ok('ring', 'somebody in the match cannot sit in on it', !E.setRingside(S, 0, 'gc', c[0].sides[0][0]).ok);
  E.setRingside(S, 0, 'gc', ch[0].id); E.setRingside(S, 0, 'ri', ch[1].id);
  ok('ring', 'the same one cannot be at the desk and at the curtain', !E.setRingside(S, 0, 'ri', ch[0].id).ok);
  const r = E.runPlayerShow(S, c), m = r.rep.segs.find(x => x.k === 'match');
  ok('ring', 'the guest says their piece on the call', m.bc.filter(b => b.g === ch[0].id).length === 2, m.bc.filter(b => b.g != null).map(b => b.x).join(' | '));
  ok('ring', 'the run-in happens after the bell when nobody calls it, and starts a story', m.ri === ch[1].id && E.feudsFor(S, ch[1].id).length > 0, m.notes.join(' | '));
  // the run-in leaves the finish alone: the same seed without it ends the same way
  const S2 = E.newGame(E.universe().promotions[0].id, 5); house(S2); const c2 = E.suggest(S2); S2.card = c2; const r2 = E.runPlayerShow(S2, c2);
  ok('ring', 'a run-in after the bell does not change how the match ended', r2.rep.segs.find(x => x.k === 'match').fk === m.fk, m.fk);
}
/* ---------- the first show: the tutorial ---------- */
for (const u of ['public_domain', 'parody']) {
  use(u);
  const pid = E.universe().promotions[0].id, S = E.newGame(pid, 7, { start: 'flag', name: 'R' }), P = S.promos[S.player];
  ok(u.slice(0, 6), 'a new game opens in the week of the flagship, with only that show', E.cal(S.week).month === P.flagship && E.cal(S.week).wom === 4 && S.queue.length === 1 && S.queue[0].flag);
  const I = E.tutInfo(S);
  ok(u.slice(0, 6), 'the first show is the tutorial, with its steps', I.on && I.steps.length >= 6);
  ok(u.slice(0, 6), 'a promised match is on its card already', S.card.some(m => m.pm != null));
  const A = E.taleInfo(S);
  ok(u.slice(0, 6), 'the year’s arc is on the show at its ending, after the main event', A.on && A.tonight && A.end && A.post && A.hist.length === 3 && A.hist.every(h => h.pre));
  ok(u.slice(0, 6), 'the champions not yet booked are a task that stops the show', E.taskGate(S, 'show').left.some(x => /champion/.test(x)));
  const t0 = E.suggestTitles(S);
  ok(u.slice(0, 6), 'Title matches books every champion who can work', t0.ok && E.tutInfo(S).steps.find(x => x.k === 'champs').done, t0.msg);
  S.card = E.suggestKeep(S);
  ok(u.slice(0, 6), 'Suggest keeps the title matches and the promise', E.tutInfo(S).steps.find(x => x.k === 'champs').done && S.card.some(m => m.pm != null));
  const top = P.titles.filter(t => !t.tag && t.holders.length).sort((a, b) => b.lvl - a.lvl)[0];
  if (top && top.lvl >= 3) ok(u.slice(0, 6), 'the top title is the main event', S.card[S.card.length - 1].title === top.id, S.card[S.card.length - 1].title);
  E.taleDecide(S, 2);
  const v = E.validate(S, S.card);
  ok(u.slice(0, 6), 'the card runs', !v.errors.length, v.errors.join(' | '));
  const r = E.runPlayerShow(S, S.card), last = r.rep.segs[r.rep.segs.length - 1];
  ok(u.slice(0, 6), 'the arc ends after the main event, the way the booker decided', last && last.arc && last.arc.ch === 2 && last.arc.you && (S.sas || []).length === 1, last && last.text);
  ok(u.slice(0, 6), 'the tutorial is over after the show', !S.tut.on);
  E.endWeek(S);
  ok(u.slice(0, 6), 'the next week is an ordinary week of weekly shows', S.queue.length >= 1 && !S.queue.every(x => x.big) && E.cal(S.week).wom === 1);
  const keep = JSON.stringify(E.cal(S.week)), S3 = JSON.parse(JSON.stringify(S)); E.attach(S3);
  ok(u.slice(0, 6), 'a saved game keeps its calendar', JSON.stringify(E.cal(S3.week)) === keep);
}
console.log(fails ? 'FAILED: ' + fails : 'test-tale: all passed');
process.exit(fails ? 1 : 0);
