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
fails.forEach(f => console.log('FAIL', f));
console.log(fails.length ? 'test-director: ' + fails.length + ' failures' : 'test-director: all passed');
process.exit(fails.length ? 1 : 0);
