/* The living world (the week of 20 October): a game opens on a world that was already turning.
   node test-living-world.js */
const fs = require('fs'); require('./engine.js'); const E = globalThis.GP;
let fails = 0;
const ok = (k, what, cond, info) => { console.log((cond ? 'ok   ' : 'FAIL ') + k.padEnd(8) + what + (info ? '  (' + info + ')' : '')); if (!cond) fails++; };
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));

// 1. reigns carry the history: a champion who began the game mid-reign keeps its weeks and defences
{
  const S = E.newGame('ewe', 3, { name: 'R' }), P = S.promos.ewe;
  const ts = P.titles.filter(t => t.holders.length);
  const long = ts.filter(t => S.week - t.since > 4);
  ok('reigns', 'champions start with the reign the history gives them', long.length >= ts.length - 1, long.length + ' of ' + ts.length);
  const w = P.titles.find(t => t.name === 'EWE World Championship');
  ok('reign1', 'the world title: weeks, defences and a recent defence', w && S.week - w.since >= 20 && w.defs > 0 && w.last <= 0 && w.last > w.since, w && (S.week - w.since) + ' wk, ' + w.defs + ' defences, last ' + w.last);
  ok('hist', 'the running reign in the title line matches the title', w && w.hist.some(h => h.to == null && h.from === w.since));
}

// 2. the world starts mid-story: title chases and real heat already running, a few weeks old
{
  for (const pid of ['ewe', 'wpw', 'ddw']) {
    const S = E.newGame(pid, 3, { name: 'R' }), F = S.feuds.filter(f => !f.res && f.promo === pid);
    ok('mid-' + pid, 'stories already running at the start (2 to 4), each a few weeks old', F.length >= 2 && F.length <= 4 && F.every(f => f.start < 1 && f.fresh < 100 && f.heat > 20), F.length + ' stories');
    ok('chase-' + pid, 'at least one is a challenger chasing a champion', F.some(f => f.title && S.promos[pid].titles.some(t => t.id === f.title && f.a.concat(f.b).some(id => t.holders.includes(id)))));
    const ids = F.flatMap(f => f.a.concat(f.b));
    ok('one-' + pid, 'nobody is in two of them', new Set(ids).size === ids.length);
  }
  const A = E.newGame('ewe', 3, { name: 'R' }), B = E.newGame('ewe', 3, { name: 'R' });
  ok('same', 'the same world and seed open on the same stories', JSON.stringify(A.feuds) === JSON.stringify(B.feuds));
}

// 3. the week around the world, and rival offices that plan their reigns (60 weeks)
{
  const S = E.newGame('ewe', 3, { name: 'R' }); let filed = 0, changes = 0, words = true, errs = 0;
  for (let i = 0; i < 60 && !S.over; i++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { errs++; S.qi++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S);
    const w = E.worldWeek(S, 1)[0]; if (w && w.w === S.week - 1) filed++;
    if (w) w.cos.forEach(co => { co.titles.forEach(x => { if (!/vacant/.test(x.how)) changes++; }); if (co.lead && /NaN|undefined|null/.test(co.lead)) words = false; });
  }
  ok('filed', 'a week around the world is filed every week', filed >= 58, filed + ' of 60');
  ok('kept', 'twelve weeks are kept', E.worldWeek(S).length === 12);
  ok('words', 'every lead line reads as words', words);
  const nt = S.order.filter(p => p !== 'ewe').reduce((a, p) => a + S.promos[p].titles.length, 0);
  ok('reigns', 'rival belts change hands at a believable rate (reigns of about 20 weeks or more on average)', changes > 0 && changes < nt * 3, changes + ' changes, ' + nt + ' titles');
  ok('errs', 'every show could run', errs === 0, errs + ' short cards');
}

console.log(fails ? fails + ' failed' : 'test-living-world: all passed');
process.exit(fails ? 1 : 0);
