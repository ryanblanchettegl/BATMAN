/* Rival bookers (engine/99-rivalbook.ts): every rival company has a named booker with a level and a style from its
   model, they level at the player's pace and spend by their lean, what they hold changes how their company plays,
   and the same seed gives the same bookers. Run: node test-rivalbook.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const play = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S); if (S.over) { S.over = null; S.owner.trust = 60; } };
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
for (const uni of ['parody', 'public_domain']) {
  const pkg = JSON.parse(fs.readFileSync('universes/' + uni + '.json', 'utf8')); E.useUniverse(pkg);
  const id = uni === 'parody' ? 'ewe' : 'pdw', S = E.newGame(id, 3, { name: 'R' }), rivals = S.order.filter(x => x !== S.player);
  const B = rivals.map(r => E.rivalBooker(S, r));
  ok(B.every(b => b && /^\w+ \w+$/.test(b.name) && b.lvl >= 1 && b.style), uni + ': every rival company has a named booker with a level and a style');
  ok(E.rivalBooker(S, S.player) === null, uni + ': you are not a rival booker');
  ok(new Set(B.map(b => b.name)).size === B.length, uni + ': every booker has a name of their own (' + new Set(B.map(b => b.name)).size + ' names for ' + B.length + ' companies)');
  ok(B.every(b => b.skills > 0 || b.lvl === 1), uni + ': a booker above level one starts with skills spent');
  const corp = rivals.find(r => S.promos[r].model === 'corporate'), out = rivals.find(r => S.promos[r].model === 'outlaw');
  if (corp) ok(E.rivalBooker(S, corp).lean === 'office', uni + ': the corporate company\'s booker leans Office');
  if (out) ok(E.rivalBooker(S, out).lean === 'creative', uni + ': the outlaw company\'s booker leans Creative');
  const T = E.newGame(id, 3, { name: 'R' }); ok(JSON.stringify(rivals.map(r => E.rivalBooker(T, r))) === JSON.stringify(B), uni + ': the same seed gives the same bookers');
  const l0 = rivals.map(r => E.rivalBooker(S, r).lvl);
  const w0 = S.week; for (let wk = 0; wk < 96 && !S.over; wk++) play(S);
  ok(S.week - w0 >= 90, uni + ': the game ran two years (' + (S.week - w0) + ' weeks)');
  const d = rivals.map((r, i) => E.rivalBooker(S, r) ? E.rivalBooker(S, r).lvl - l0[i] : 10);
  ok(d.every(x => x >= 8 && x <= 12), uni + ': two years add about ten levels (6 and 4) to every rival booker (' + Math.min(...d) + ' to ' + Math.max(...d) + ')');
  const all = rivals.map(r => E.rivalBooker(S, r)).filter(Boolean), CAP = { creative: 5, talk: 5, eye: 3, motivator: 5, clout: 3 };
  ok(all.every(b => Object.keys(b.sk).every(k => b.sk[k] <= CAP[k])), uni + ': what every rival holds stays within the old caps');
  ok(all.every(b => b.does && b.does !== 'Still learning'), uni + ': after two years every rival\'s build does something, whatever its lean: ' + [...new Set(all.map(b => b.does.split(':')[0]))].join(', '));
}
// balance: two years with the bookers on and off. Rivals should gain a little, not run away, and the player's standing hold
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));
{ const run = off => { const S = E.newGame('ewe', 5, { name: 'R' }); if (off) S.nobk = 1; const r = S.order.filter(x => x !== S.player), i0 = r.map(x => S.promos[x].image), p0 = S.promos[S.player].image;
    for (let wk = 0; wk < 96 && !S.over; wk++) play(S);
    return { riv: r.reduce((t, x, i) => t + S.promos[x].image - i0[i], 0) / r.length, me: S.promos[S.player].image - p0 }; };
  const on = run(false), off = run(true), d = on.riv - off.riv;
  ok(d > 0 && d < 6, 'rival bookers lift their companies a little over two years (' + off.riv.toFixed(1) + ' to ' + on.riv.toFixed(1) + ' popularity on average)');
  ok(Math.abs(on.me - off.me) < 6, 'and the player\'s popularity holds within a band (' + off.me.toFixed(1) + ' against ' + on.me.toFixed(1) + ')'); }
fails.forEach(f => console.log('FAIL', f));
console.log(fails.length ? 'test-rivalbook: ' + fails.length + ' failures' : 'test-rivalbook: all passed');
process.exit(fails.length ? 1 : 0);
