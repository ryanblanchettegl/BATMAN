/* A world's own match rules: made in the World Editor, kept in the world, booked and played in a game, and gone again
   when another world is loaded. Run: node test-stipworld.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const U = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'));
const house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); };
/** Run the player's next show with match `i` under rule `k`. Returns the report. */
function play(S, k) {
  house(S); const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); }
  const m = c.find(x => x.mt === '1v1'); m.stip = k; E.fitShow(S, c); E.runPlayerShow(S, c); return S.reports[0];
}
const pkg = JSON.parse(JSON.stringify(U));
const n = E.edNewStip(pkg, 'cage');
ok('ed1', 'a new rule is kept in the world, built on an included one', E.edStips(pkg).length === 1 && /^c_/.test(n.id) && n.base === 'cage' && n.set === 'cage');
E.edSetStip(pkg, Object.assign({}, n, { n: 'Shark tank', set: 'inferno', d: 'Over a tank of water.', lines: ['Nobody wants to fall in.', 'The water is moving!'] }));
const o = E.edOverStip(pkg, 'ladder'); E.edSetStip(pkg, Object.assign({}, o, { n: 'Scaffold climb', set: 'bigstadium' }));
ok('ed2', 'an included rule can be changed for the world', E.edStips(pkg).some(x => x.id === 'ladder' && x.over && x.n === 'Scaffold climb'));
ok('ed3', 'a world with its own rules passes the check', E.edCheck(pkg).errors === 0);
ok('ed4', 'a rule cannot be built on one with effects of its own', E.stipClean({ id: 'c_x', n: 'X', base: 'mask' }).base === 'std');
E.useUniverse(pkg); const S = E.newGame('pdw', 4, { name: 'R' });
ok('g1', 'the world\'s rule is on the menu in a game, named and noted', E.STIP[n.id] && E.STIP[n.id].n === 'Shark tank' && E.STIPNOTE[n.id] === 'Over a tank of water.' && E.STIP[n.id].set === 'inferno');
ok('g2', 'the changed rule keeps its effects and wears its new name', E.STIP.ladder.n === 'Scaffold climb' && E.STIP.ladder.inj === E.STIP0.ladder.inj && E.STIP.ladder.set === 'bigstadium');
const r = play(S, n.id), seg = r.segs.find(x => x.sk === n.id);
ok('g3', 'a match under it goes on the air under its name', !!seg && seg.stip === 'Shark tank', r.segs.filter(x => x.k === 'match').map(x => x.stip).join(','));
ok('g4', 'the commentators say the world\'s lines', !!seg && (seg.bc || []).some(b => /fall in|water is moving/.test(b.x || '')));
ok('g5', 'no number in the report is broken', !JSON.stringify(r).includes('NaN'));
const save = JSON.parse(JSON.stringify(S));
E.useUniverse(U); const T = E.newGame('pdw', 4, { name: 'R' });
ok('g6', 'another world brings back the included rules', !E.STIP[n.id] && E.STIP.ladder.n === 'Ladder' && !E.STIP.ladder.over);
E.attach(save); ok('g7', 'a saved game from the world gets its rules back when it loads', E.STIP[n.id] && E.STIP.ladder.n === 'Scaffold climb');
const out = E.exportUniverse(save, { name: 'Kept', id: 'kept_rules' });
ok('x1', 'the world written back out keeps its rules', (out.stips || []).length === 2);
E.edRemoveStip(pkg, 'ladder'); E.edRemoveStip(pkg, n.id); ok('ed5', 'taking them out leaves the world with none', !pkg.stips);
E.attach(T);
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('stipworld: all passed');
