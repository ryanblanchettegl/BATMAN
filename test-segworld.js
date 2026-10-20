/* A world's own promos and angles (TASKS.md 0u): made in the World Editor, kept in the world, booked and played in a game.
   Run: node test-segworld.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const U = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')), house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
/* the editor */
const pkg = JSON.parse(JSON.stringify(U));
const a = E.edNewSegKind(pkg, 'angle'), p = E.edNewSegKind(pkg, 'promo');
ok('ed', 'a new angle and a new promo are kept in the world, with their own ids', E.edSegKinds(pkg).length === 2 && /^c_/.test(a.id) && a.id !== p.id && a.t === 'angle' && p.t === 'promo');
E.edSetSegKind(pkg, Object.assign({}, a, { n: 'Coffee in the face', fx: 'start', heat: 12, bond: -8, lift: 1, scene: 'seg_ambush', line: '{a} throws hot coffee in the face of {b} in catering.' }));
const k = E.edSegKinds(pkg).find(x => x.id === a.id);
ok('ed', 'it says what it does: starts a feud, a lot of heat, worse enemies, a lift, its scene and its line', k.n === 'Coffee in the face' && k.fx === 'start' && k.heat === 12 && k.bond === -8 && k.lift === 1 && k.scene === 'seg_ambush' && /\{a\}/.test(k.line));
const odd = E.segkClean({ id: 'bad id!', n: 'x'.repeat(80), t: 'dance', roles: ['a', 'b', 'c'], fx: 'explode', heat: 99, bond: 50 });
ok('ed', 'anything wrong is put right: the id, the name cut to size, a promo, two people at most, known effects', /^c_/.test(odd.id) && odd.n.length <= 28 && odd.t === 'promo' && odd.roles.length === 2 && odd.fx === 'none' && odd.heat === 8 && odd.bond === 0);
E.edRemoveSegKind(pkg, p.id);
ok('ed', 'one can be taken out', E.edSegKinds(pkg).length === 1);
/* the game */
E.useUniverse(pkg);
const S = E.newGame('pdw', 3, { name: 'R' });
house(S); S.card = E.suggest(S); while (E.segInfo(S).booked) E.setSeg(S, 0, null);
ok('game', 'the world\'s kind can be booked like the game\'s own', !!E.SEGK[a.id] && E.SEGK[a.id].t === 'angle' && E.SEGK[a.id].n === 'Coffee in the face');
const c0 = E.segChoices(S, a.id, [], -1)[0], A = c0[0], c1 = E.segChoices(S, a.id, [A], -1)[1], B = c1.find(id => !E.feudsFor(S, A).some(f => f.a.concat(f.b).indexOf(id) >= 0));
const r0 = E.setSeg(S, -1, { k: a.id, who: [A, B], pos: 1 });
ok('game', 'it books with two people and reads what it will do', r0.ok && E.segLook(S, E.segInfo(S).list[0], 0).notes.length >= 2, r0.msg);
E.fitShow(S, S.card);
const bond0 = E.relations ? null : null, rep = E.runPlayerShow(S, S.card).rep, seg = rep.segs.find(x => x.booked === a.id);
ok('game', 'it plays on the night with its own line', !!seg && /hot coffee/.test(seg.text) && seg.text.indexOf(S.w[A].name) >= 0 && seg.text.indexOf(S.w[B].name) >= 0, seg && seg.text);
ok('game', 'it started a feud between the two', E.feudsFor(S, A).some(f => f.a.concat(f.b).indexOf(B) >= 0));
ok('game', 'and the two remember it', JSON.stringify(S.rm || {}).indexOf('Coffee in the face') >= 0);
const S2 = E.newGame('pdw', 3, { name: 'R' }), out = E.exportUniverse(S2, {});
ok('game', 'a world saved from a game keeps its own kinds', Array.isArray(out.segkinds) && out.segkinds.some(x => x.id === a.id));
E.useUniverse(U); const S3 = E.newGame('pdw', 3, { name: 'R' }); E.segInfo(S3);
ok('game', 'a game of another world does not have them', !E.SEGK[a.id]);
/* the game's own kinds, changed for a world */
{ const pk = JSON.parse(JSON.stringify(U)), o = E.edOverSegKind(pk, 'callout');
  ok('own', 'one of the game\'s own kinds can be changed for this world, starting as the game ships it', !!o && o.id === 'callout' && o.n === 'Call-out' && o.roles.length === 2);
  E.edSetSegKind(pk, Object.assign({}, o, { n: 'Calling out', roles: ['Character A', 'Character B'], line: '{a} points at {b} and says it.' }));
  ok('own', 'the writers\' pick cannot be changed', E.edOverSegKind(pk, 'writers') === null);
  E.useUniverse(pk); const S4 = E.newGame('pdw', 3, { name: 'R' }); house(S4); S4.card = E.suggest(S4); while (E.segInfo(S4).booked) E.setSeg(S4, 0, null);
  ok('own', 'in a game it carries the world\'s name and labels', E.SEGK.callout.n === 'Calling out' && E.SEGK.callout.roles[0] === 'Character A' && !!E.SEGK.callout.over);
  const A = E.segChoices(S4, 'callout', [], -1)[0][0], B = E.segChoices(S4, 'callout', [A], -1)[1][0]; E.setSeg(S4, -1, { k: 'callout', who: [A, B], pos: 1 }); E.fitShow(S4, S4.card);
  const rep = E.runPlayerShow(S4, S4.card).rep, sg = rep.segs.find(x => x.booked === 'callout');
  ok('own', 'its report line is the world\'s, and it still does what the game\'s does (a feud)', !!sg && /points at/.test(sg.text) && E.feudsFor(S4, A).some(f => f.a.concat(f.b).indexOf(B) >= 0), sg && sg.text);
  E.useUniverse(U); E.newGame('pdw', 3, { name: 'R' }); E.segInfo(E.newGame('pdw', 3, { name: 'R' }));
  ok('own', 'another world plays the game\'s own again', E.SEGK.callout.n === 'Call-out' && !E.SEGK.callout.over);
}
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('segworld: all passed');
