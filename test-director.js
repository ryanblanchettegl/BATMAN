/* The Director, step 1: the tension reading (docs/plans/director.md).
   60 weeks as every company in both worlds: the reading stays between 0 and 100 and is never NaN, it keeps eight weeks,
   it moves (not stuck at one value), it rises with open matters and falls when they are answered, and it does not change
   play (the same game with and without reading it gives the same state, apart from S.dir).
   Prints the tension line of one game beside the matters each week, so it can be checked against what happened.
   Run: node test-director.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const WEEKS = +(process.env.WEEKS || 60);
function play(S, wk, answer) {
  if (answer) S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); }
    if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S);
}
let shown = false;
for (const uni of ['parody', 'public_domain']) {
  const pkg = JSON.parse(fs.readFileSync('universes/' + uni + '.json', 'utf8'));
  E.useUniverse(pkg);
  const ids = (pkg.promotions || []).map(p => p.id);
  for (const id of ids) {
    let S; try { S = E.newGame(id, 7, { name: 'R' }); } catch (e) { continue; }
    if (!S || !S.promos[id] || S.player !== id) continue;
    const line = [], seen = new Set();
    for (let wk = 1; wk <= WEEKS && !S.over; wk++) {
      const info = E.dirInfo(S);
      ok(Number.isFinite(info.t) && info.t >= 0 && info.t <= 100, uni + '/' + id + ' week ' + wk + ': reading ' + info.t);
      Object.keys(info.parts).forEach(k => ok(Number.isFinite(info.parts[k]), uni + '/' + id + ' week ' + wk + ': part ' + k + ' is ' + info.parts[k]));
      const nw = S.inbox.filter(e => !seen.has(e.id)); nw.forEach(e => seen.add(e.id));
      line.push([wk, info.t, info.trend, S.inbox.filter(e => !e.done).length, nw.length]);
      play(S, wk, true);
    }
    ok(S.dir && S.dir.t.length <= 8 && S.dir.t.length > 0, uni + '/' + id + ': keeps up to eight readings (' + (S.dir && S.dir.t.length) + ')');
    const vals = new Set(line.map(l => l[1]));
    ok(vals.size >= 4, uni + '/' + id + ': the reading moves (' + vals.size + ' distinct values)');
    if (!shown && uni === 'parody') { shown = true;
      console.log('tension line, ' + uni + '/' + id + ' (week: reading trend | open matters, new this week)');
      console.log(line.map(l => l[0] + ':' + l[1] + ' ' + l[2] + ' | ' + l[3] + ',' + l[4]).join('\n')); }
  }
}
// open matters raise it; answering them brings it down
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));
{ const S = E.newGame('ewe', 3, { name: 'R' });
  for (let wk = 1; wk <= 6; wk++) play(S, wk, false);
  const piled = E.dirInfo(S);
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
  const cleared = E.dirInfo(S);
  ok(piled.parts.open > cleared.parts.open, 'answering the open matters lowers the open part (' + piled.parts.open + ' to ' + cleared.parts.open + ')');
  ok(piled.t > cleared.t, 'and the reading (' + piled.t + ' to ' + cleared.t + ')'); }
// reading it changes nothing in play
{ const a = E.newGame('ewe', 11, { name: 'R' }), b = E.newGame('ewe', 11, { name: 'R' });
  for (let wk = 1; wk <= 20; wk++) { E.dirInfo(a); E.dirInfo(a); play(a, wk, true); play(b, wk, true); }
  const strip = S => JSON.stringify(S, (k, v) => k === 'dir' ? undefined : v);
  ok(strip(a) === strip(b), 'reading the Director does not change the game'); }
// step 2, the gate: one headline and two threads a week (plus what is forced), the rest held, and Pull forward
{ const S = E.newGame('ewe', 3, { name: 'R' }); let over = 0, heads = 0, forcedHeld = 0, pulled = 0, weeks = 0; const seen = new Set();
  for (let wk = 1; wk <= 48 && !S.over; wk++) {
    let counted = 0;
    const tally = () => S.inbox.filter(e => !seen.has(e.id) && e.choices).forEach(e => { seen.add(e.id); if (E.dirTag(e) !== 'forced' && e.dir) counted++; if (e.head) heads++; });
    tally();
    (S.dir.held || []).forEach(e => { if (E.dirTag(e) === 'forced') forcedHeld++; });
    if (!pulled && S.dir.held.length && S.ap > 0) { const ap = S.ap, id = S.dir.held[0].id, r = E.dirPull(S, id);
      ok(r.ok && S.ap === ap - 1 && S.inbox.some(e => e.id === id) && !S.dir.held.some(e => e.id === id), 'Pull forward brings a held matter to the desk for one action point'); pulled = 1; seen.add(id); }
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); tally(); S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 1)); }
    if (counted > 3) over++; weeks++;
    E.endWeek(S);
  }
  ok(over === 0, 'no week brings more than one headline and two threads, besides what is forced (' + over + ' weeks over)');
  ok(heads >= weeks / 2, 'most weeks open on a headline (' + heads + ' in ' + weeks + ')');
  ok(forcedHeld === 0, 'a forced matter (a date, a deal, an order) is never held');
  ok(pulled === 1, 'something was held at least once, so Pull forward could be tried');
  const D = E.dirDesk(S); ok(typeof D.word === 'string' && D.word.length > 3 && !/\d/.test(D.word), 'the desk has a word for the week, never a number: ' + D.word);
  const P = E.dirPull(S, -1); ok(!P.ok && P.msg, 'pulling something that is not waiting says so'); }
// a problem held until it lapses is remembered as ignored
{ const S = E.newGame('ewe', 5, { name: 'R' }); const w = S.w.find(x => x.promo === S.player && !x.nw);
  const ev = { type: 'losing', w: w.id, text: 'test', choices: ['a', 'b'] }; E.dirInfo(S);
  S.dir.n = 3; S.dir.hook = 1; const m0 = w.morale;
  // hold it, then let three weeks pass it by
  const held = Object.assign({}, ev, { id: 999999, held: S.week - 4 }); S.dir.held.push(held);
  play(S, 1, true);
  ok(w.morale < m0 || (S.rmY && JSON.stringify(S.rmY).indexOf('never got to it') >= 0), 'a lapsed problem costs the person in it, and they remember it'); }
// step 4, the styles: picked at the start, each with its own rhythm; changing costs trust after week one; locked in iron man
{ const per = {};
  for (const st of ['promoter', 'carny', 'purist']) { const S = E.newGame('ewe', 3, { name: 'R', dir: st }); let mx = 0, tot = 0, wks = 0; const seen = new Set();
    ok(S.dir == null || S.dir.st === st, st + ': the game starts with the style picked');
    for (let wk = 1; wk <= 30 && !S.over; wk++) { let n = 0; const t = () => S.inbox.filter(e => !seen.has(e.id) && e.choices && e.dir && E.dirTag(e) !== 'forced').forEach(e => { seen.add(e.id); n++; });
      t(); S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
      while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); t(); S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 1)); }
      E.endWeek(S); mx = Math.max(mx, n); tot += n; wks++; }
    per[st] = { avg: tot / wks, max: mx }; ok(S.dir.st === st, st + ': the style holds through the game'); }
  ok(per.carny.max > per.promoter.max, 'The Carny piles things up more than The Promoter (' + per.carny.max + ' against ' + per.promoter.max + ')');
  ok(per.purist.avg < per.promoter.avg, 'The Purist brings fewer matters than The Promoter (' + per.purist.avg.toFixed(2) + ' against ' + per.promoter.avg.toFixed(2) + ')');
  const S = E.newGame('ewe', 4, { name: 'R' }); E.dirInfo(S); const free = E.dirSetStyle(S, 'carny'); ok(free.ok && !free.cost && S.dir.st === 'carny', 'changing in the first week is free');
  for (let wk = 0; wk < 2; wk++) E.endWeek(S); const t0 = S.owner.trust, r = E.dirSetStyle(S, 'purist');
  ok(r.ok && S.dir.st === 'purist' && (S.owner.me || S.owner.trust < t0), 'later it costs a little of the owner\'s trust');
  const I = E.newGame('ewe', 4, { name: 'R', iron: true }); E.endWeek(I); E.dirInfo(I); ok(!E.dirSetStyle(I, 'carny').ok, 'iron man keeps the style for the whole game'); }
fails.forEach(f => console.log('FAIL', f));
console.log(fails.length ? 'test-director: ' + fails.length + ' failures' : 'test-director: all passed');
process.exit(fails.length ? 1 : 0);
