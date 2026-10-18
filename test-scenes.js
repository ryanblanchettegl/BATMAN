/* Scenes in the engine: hooks, the parts of a scene the game fills from a moment of the show.  Run: node test-scenes.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [], ok = (c, m) => { if (!c) fails.push(m); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const S = E.newGame('pdw', 3, { name: 'R' }), P = S.promos.pdw, mine = S.w.filter(w => w && w.promo === 'pdw');
const heels = mine.filter(w => w.align === 'H'), faces = mine.filter(w => w.align !== 'H');
const hero = faces[0], vil = heels[0], m1 = heels[1], m2 = heels[2], m3 = heels[3];
// a stable for the villain, led by somebody else, so the leader comes first among the villain's people
S.stables = [{ id: 9001, promo: 'pdw', name: 'The Test', leader: m1.id, m: [m1.id, vil.id, m2.id], formed: 1, tension: 0 }];
[m1, vil, m2].forEach(w => { w.stable = 9001; });
vil.mgr = m3.id;
const before = JSON.stringify(S);
let h = E.sceneHooks(S, { ids: [vil.id, hero.id], a: vil.id, b: hero.id });
ok(JSON.stringify(S) === before, 'sceneHooks changed the game');
ok(h.hero === hero.id, 'the hero is the face in the moment');
ok(h.villain === vil.id, 'the villain is the heel in the moment');
ok(h.attacker === vil.id && h.victim === hero.id, 'the attacker and who gets attacked');
ok(h.heel1 === m1.id && h.heel2 === m2.id, 'the heel group: the leader first, then the rest of the stable (' + h.heel1 + ', ' + h.heel2 + ')');
ok(h.heel3 === m3.id, 'the manager comes after the stable');
ok(h.manager === m3.id, 'the manager');
// order does not decide the hero: the face is the hero whoever is named first
h = E.sceneHooks(S, { ids: [hero.id, vil.id] });
ok(h.hero === hero.id && h.villain === vil.id, 'hero and villain by side, not by order');
// two heroes: the first is the hero, the other plays the villain's part
h = E.sceneHooks(S, { ids: [faces[1].id, faces[2].id] });
ok(h.hero === faces[1].id && h.villain === faces[2].id, 'two of a side still fill hero and villain');
// a title on the line: its holder is the champion and the other the challenger
const t = P.titles.find(x => !x.tag && x.holders.length), ch = S.w[t.holders[0]], other = mine.find(w => w.id !== ch.id && w.g === ch.g);
h = E.sceneHooks(S, { ids: [other.id, ch.id], title: t.name });
ok(h.champ === ch.id && h.challenger === other.id, 'the champion and the challenger of the title on the line');
// winners and losers
h = E.sceneHooks(S, { ids: [hero.id, vil.id], win: [vil.id] });
ok(h.winner === vil.id && h.loser === hero.id, 'the winner and the loser');
// a tag partner is the hero's partner
const tm = S.teams.find(x => x.promo === 'pdw' && x.m.every(id => S.w[id].align !== 'H'));
if (tm) { h = E.sceneHooks(S, { ids: [tm.m[0], vil.id] }); ok(h.ally === tm.m[1], "the hero's tag partner is the ally"); }
// nobody in the moment: nothing is filled, and nothing breaks
h = E.sceneHooks(S, { ids: [] }); ok(h.hero == null && h.villain == null, 'an empty moment fills no parts');
ok(Array.isArray(E.SCENE_HOOKS) && E.SCENE_HOOKS.includes('heel1'), 'the list of hooks');
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'ok: scene hooks');
process.exit(fails.length ? 1 : 0);
