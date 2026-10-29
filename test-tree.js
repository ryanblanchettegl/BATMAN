/* The booker's skill tree (docs/plans/booker-progression.md, engine/65-youtree.ts): four branches in tiers, a tier opens
   as you spend in its branch, bonus nodes add to the old five numbers capped where they were, the whole tree can be
   filled, and spending is checked. Run: node test-tree.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));
const S = E.newGame('ewe', 3, { name: 'R' }), b = S.booker;
const I = E.treeInfo(S);
ok(I.branches.length === 4 && I.branches.map(x => x.n).join() === 'Creative,Office,Locker room,Eye', 'four branches: Creative, Office, Locker room, Eye');
ok(I.total >= 35 && I.total <= 50, 'the whole tree costs ' + I.total + ' points: a long career fills it');
ok(Object.values(b.sk).every(v => v === 0) && I.owned === 0, 'a new booker starts with an empty tree');
b.pts = 0; ok(!E.treeSpend(S, 'cr_pen').ok, 'no points, nothing taken');
b.pts = 1; const r = E.treeSpend(S, 'cr_pen'); ok(r.ok && b.sk.creative === 1 && b.pts === 0, 'a bonus node adds one to its number: ' + r.msg);
b.pts = 5; ok(!E.treeSpend(S, 'cr_audible').ok, 'a locked tier cannot be taken yet');
ok(E.treeSpend(S, 'cr_ear').ok && E.treeSpend(S, 'cr_audible').ok, 'spending in the branch opens its next tier');
ok(!E.treeSpend(S, 'cr_pen').ok, 'a node is taken once');
b.pts = 999; let all = 0;
for (let pass = 0; pass < 6; pass++) E.treeInfo(S).branches.forEach(br => br.tiers.forEach(t => t.nodes.forEach(n => { if (!n.has && E.treeSpend(S, n.id).ok) all++; })));
const F = E.treeInfo(S);
ok(F.owned === F.branches.reduce((a, br) => a + br.tiers.reduce((x, t) => x + t.nodes.length, 0), 0), 'the whole tree can be filled');
ok(b.sk.creative === 5 && b.sk.talk === 5 && b.sk.motivator === 5 && b.sk.eye === 3 && b.sk.clout === 3, 'a full tree reaches the old caps and no further: ' + JSON.stringify(b.sk));
ok(!E.spendPoint(S, 'creative'), 'the old one-point spend is gone');
fails.forEach(f => console.log('FAIL', f));
console.log(fails.length ? 'test-tree: ' + fails.length + ' failures' : 'test-tree: all passed');
process.exit(fails.length ? 1 : 0);
