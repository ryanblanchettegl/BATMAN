/* The booker's skill tree (docs/plans/booker-progression.md, engine/65-youtree.ts): four branches in tiers, a tier
   opens as you spend in its branch, each bonus raises its number when taken (capped where it was), skills whose effect
   is still to come cannot be taken, the levelling pace, a booker carried to a new company, and the same seed giving the
   same game. Run: node test-tree.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
const play = (S, wk) => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S); if (S.over) { S.over = null; S.owner.trust = 60; } };
for (const uni of ['parody', 'public_domain']) {
  E.useUniverse(JSON.parse(fs.readFileSync('universes/' + uni + '.json', 'utf8')));
  const id = uni === 'parody' ? 'ewe' : 'pdw', S = E.newGame(id, 3, { name: 'R' }), b = S.booker;
  const I = E.treeInfo(S), nodes = I.branches.flatMap(br => br.tiers.flatMap(t => t.nodes.map(n => Object.assign({ br: br.id, t: t.t }, n))));
  ok(I.branches.map(x => x.n).join() === 'Creative,Office,Locker room,Eye', uni + ': four branches: Creative, Office, Locker room, Eye');
  ok(I.total >= 35 && I.total <= 50, uni + ': the whole tree costs ' + I.total + ' points: a long career fills it');
  ok(Object.values(b.sk).every(v => v === 0) && I.owned === 0, uni + ': a new booker starts with an empty tree');
  { const before = JSON.stringify(S); E.treeInfo(S); E.treeInfo(S); ok(JSON.stringify(S) === before && JSON.stringify(E.treeInfo(S)) === JSON.stringify(I), uni + ': reading the tree changes nothing'); }
  ok(I.stand && I.stand.creative.v === 0 && I.stand.creative.cap === 5, uni + ': the tree says where each number stands (Creative 0 of 5)');
  ok(new Set(nodes.map(n => n.n)).size === nodes.length && new Set(nodes.filter(n => n.k !== 'bonus').map(n => n.d)).size === nodes.filter(n => n.k !== 'bonus').length, uni + ': no two skills share a name, and no two actions say the same thing');
  ok(nodes.filter(n => n.k === 'bonus').every(n => /\+1:/.test(n.d)), uni + ': every bonus says plainly what it adds');
  b.pts = 0; ok(!E.treeSpend(S, 'cr_pen').ok, uni + ': no points, nothing taken');
  const soon = nodes.find(n => n.soon); b.pts = 99; ok(soon && !E.treeSpend(S, soon.id).ok && !b.tree[soon.id], uni + ': a skill still to come (' + soon.n + ') cannot be taken');
  b.pts = 1; const t1 = nodes.find(n => n.br === 'creative' && n.t === 1 && !n.soon); ok(!E.treeSpend(S, t1.id).ok, uni + ': a locked tier cannot be taken yet');
  // take every bonus in order of tier: each raises its number by one when taken
  b.pts = 999; let raised = true;
  for (const t of [0, 1, 2, 3]) nodes.filter(n => n.t === t && n.k === 'bonus').forEach(n => { const v0 = b.sk[n.sk], r = E.treeSpend(S, n.id); if (!r.ok || b.sk[n.sk] !== v0 + 1) raised = false; });
  ok(raised, uni + ': every bonus opens in its turn and raises its number by one when taken');
  ok(nodes.filter(n => !n.soon).every(n => b.tree[n.id]), uni + ': everything that can be taken can be filled');
  ok(b.sk.creative === 5 && b.sk.talk === 5 && b.sk.motivator === 5 && b.sk.eye === 3 && b.sk.clout === 3, uni + ': a full tree reaches the old caps and no further: ' + JSON.stringify(b.sk));
  // booking power: a level adds none, and a full tree adds only Clout's three
  { const lv = b.lvl, g0 = E.bpGrantOf(S); b.lvl = 40; ok(E.bpGrantOf(S) === g0, uni + ': a high level adds no booking power (' + g0 + ' a week either way)'); b.lvl = lv;
    const sk = b.sk; b.sk = { creative: 0, talk: 0, eye: 0, motivator: 0, clout: 0 }; const g1 = E.bpGrantOf(S); b.sk = sk;
    ok(g0 - g1 === 3, uni + ': a full tree adds three booking power a week, no more (' + g1 + ' to ' + g0 + ')'); }
  // a booker carried to a new company keeps the tree and what it adds
  const T = E.newGame(id, 4, { name: 'R', booker: JSON.parse(JSON.stringify(b)) });
  ok(JSON.stringify(T.booker.tree) === JSON.stringify(b.tree) && JSON.stringify(T.booker.sk) === JSON.stringify(b.sk), uni + ': a booker carried to a new company keeps the tree and its numbers');
}
// the levelling pace: about 6 the first year, 4 the second (Ryan's answer), measured in a headless game
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));
{ const S = E.newGame('ewe', 3, { name: 'R' }), at = [];
  for (let wk = 1; wk <= 96; wk++) { play(S, wk); if (wk === 48 || wk === 96) at.push(S.booker.lvl); }
  ok(at[0] >= 5 && at[0] <= 8, 'about six levels the first year: level ' + at[0] + ' after 48 weeks');
  ok(at[1] - at[0] >= 3 && at[1] - at[0] <= 5, 'about four the second: level ' + at[1] + ' after 96 weeks'); }
// the same seed, with skills taken, gives the same game
{ const run = () => { const S = E.newGame('ewe', 9, { name: 'R' }); for (let wk = 1; wk <= 12; wk++) { if (S.booker.pts) E.treeInfo(S).branches.forEach(br => br.tiers.forEach(t => t.nodes.forEach(n => { if (n.can) E.treeSpend(S, n.id); }))); play(S, wk); } return JSON.stringify(S); };
  ok(run() === run(), 'the same seed with skills taken gives the same game'); }
ok(!E.spendPoint(null, 'creative'), 'the old one-point spend is gone');
fails.forEach(f => console.log('FAIL', f));
console.log(fails.length ? 'test-tree: ' + fails.length + ' failures' : 'test-tree: all passed');
process.exit(fails.length ? 1 : 0);
