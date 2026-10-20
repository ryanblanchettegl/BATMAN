/* Title belts: every title has a whole belt, the parody world ships a design for each, Create a Belt's rules, and
   belts travel in a world package and into a game. Run: node test-belts.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const B = E.BELT, ids = L => L.map(x => x[0]), key = b => JSON.stringify(b);
const whole = b => ids(B.plates).includes(b.pl) && ids(B.metals).includes(b.mt) && ids(B.straps).includes(b.st) && ids(B.gems).includes(b.gm) && ids(B.sides).includes(b.sd) && ids(B.sideShapes).includes(b.ss) && ids(B.trims).includes(b.tr) && typeof b.w === 'string' && b.w.length <= 14 && typeof b.top === 'string' && b.top.length <= 6;
{ const U = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')); E.useUniverse(U);
  const S = E.newGame('whw', 3, { name: 'R' }), all = [];
  S.order.forEach(pid => { const P = S.promos[pid]; P.titles.forEach(t => all.push({ P, t, b: E.beltOf(t, P) })); });
  ok('all', 'every title in the public-domain world has a whole belt, with nothing set by hand', all.length > 20 && all.every(x => whole(x.b) && !x.t.belt), all.filter(x => !whole(x.b)).map(x => x.t.name).join(', '));
  ok('all', 'a company’s letters are above the plate', all.every(x => x.b.top === E.logoOf(x.P).l));
  ok('all', 'no two belts in a company look alike', S.order.every(pid => { const L = all.filter(x => x.P.id === pid).map(x => key(x.b)); return new Set(L).size === L.length; }));
  ok('word', 'a tag title says TAG TEAM, a world title WORLD, a television title TELEVISION', E.beltOf({ id: 'a', name: 'X Tag Team Titles', tag: true, lvl: 2 }).w === 'TAG TEAM' && E.beltOf({ id: 'b', name: 'X World Title', lvl: 3 }).w === 'WORLD' && E.beltOf({ id: 'c', name: 'X TV Title', lvl: 1 }).w === 'TELEVISION');
  ok('word', 'a top title is gold with three side plates each side; a hardcore title is black and studded', E.beltOf({ id: 'd', name: 'Big Title', lvl: 3 }).mt === 'gold' && E.beltOf({ id: 'd', name: 'Big Title', lvl: 3 }).sd === 3 && E.beltOf({ id: 'e', name: 'Hardcore Title', lvl: 1 }).mt === 'black' && E.beltOf({ id: 'e', name: 'Hardcore Title', lvl: 1 }).tr === 'studs');
  const odd = E.beltFill({ pl: 'banana', mt: 'gold', st: '#123456', sd: 9, w: 'a very long word on the plate here', top: 'abcdefgh' }, { id: 'f', name: 'Odd Title', lvl: 2 });
  ok('fill', 'anything missing or unknown falls back, and the words are cut to size', whole(odd) && odd.pl !== 'banana' && odd.st !== '#123456' && odd.w.length <= 14 && odd.top === 'ABCDEF', key(odd));
  const ideas = E.beltIdeas(all[0].t, all[0].P, 6, 0), ideas2 = E.beltIdeas(all[0].t, all[0].P, 6, 1);
  ok('idea', 'six ideas, each whole and different, keeping the words; Shuffle gives others', ideas.length === 6 && ideas.every(whole) && new Set(ideas.map(key)).size === 6 && ideas.every(b => b.w === all[0].b.w) && key(ideas) !== key(ideas2));
  const before = JSON.stringify(S); E.beltOf(all[0].t, all[0].P); E.beltIdeas(all[0].t, all[0].P, 6, 3);
  ok('all', 'reading a belt changes nothing in the game', JSON.stringify(S) === before);
  const mine = S.promos[S.player].titles[0], r = E.setBelt(S, mine.id, Object.assign({}, ideas[2]));
  ok('game', 'your own title can get a new belt, and it is in the news', r.ok && key(E.beltOf(mine, S.promos[S.player])) === key(ideas[2]) && S.news[0].t.indexOf('new belt') >= 0);
  const rival = S.promos[S.order.find(id => id !== S.player)].titles[0];
  ok('game', 'a rival’s title cannot be changed', !E.setBelt(S, rival.id, ideas[0]).ok);
  const saved = JSON.parse(JSON.stringify(S));
  ok('game', 'the belt is in the save', key(saved.promos[S.player].titles[0].belt) === key(ideas[2]));
  /* the World Editor */
  const pkg = JSON.parse(JSON.stringify(U)), t0 = pkg.titles[0], set = E.edSetBelt(pkg, t0.id, ideas[4]);
  ok('ed', 'the editor sets a title’s belt', set.ok && key(t0.belt) === key(E.beltFill(ideas[4], t0)));
  ok('ed', 'the world still checks', E.validateUniverse ? E.validateUniverse(pkg).ok !== false : true);
  E.useUniverse(pkg); const S2 = E.newGame('whw', 3, { name: 'R' }), g0 = S2.order.map(id => S2.promos[id]).reduce((a, P) => a || P.titles.find(t => t.id === t0.id), null);
  ok('ed', 'a game started in that world has the belt', !!g0 && key(g0.belt) === key(t0.belt));
  const out = E.exportUniverse(S2, {}), back = out.titles.find(t => t.id === t0.id);
  ok('ed', 'a world saved from a game keeps it', !!back && key(back.belt) === key(t0.belt));
  ok('ed', 'putting it back gives the title’s own design', E.edSetBelt(pkg, t0.id, null).ok && !t0.belt);
}
{ const P = JSON.parse(fs.readFileSync('universes/parody.json', 'utf8'));
  ok('pkg', 'the parody world ships a belt designed for every title', P.titles.length > 50 && P.titles.every(t => t.belt && whole(E.beltFill(t.belt, t)) && key(E.beltFill(t.belt, t)) === key(t.belt)), P.titles.filter(t => !t.belt).map(t => t.name).join(', '));
}
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('belts: all passed');
