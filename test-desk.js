/* The desk as the Map Board (docs/plans/desk-map-board.md): what E.deskBoard reads for the three columns.  Run: node test-desk.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const S = E.newGame('pdw', 3, { name: 'R' }), D = E.deskBoard(S), P = S.promos[S.player];
ok('rank', 'the rank is by TV share, with your row in the table', D.rank >= 1 && D.rank <= D.of && D.table.some(x => x.mine) && D.table.length <= 4);
ok('stars', 'three top stars, highest overall first', D.stars.length === 3 && D.stars[0].ovr >= D.stars[1].ovr && D.stars[1].ovr >= D.stars[2].ovr);
ok('watch', 'the ones to watch are not the stars', D.watch.length >= 2 && D.watch.every(x => !D.stars.some(s => s.id === x.id)));
ok('poster', 'three on the poster, nobody hurt, the face in the middle when there is one', D.poster.length === 3 && D.poster.every(id => !(S.w[id].inj > 0)) && D.poster[1] === D.face);
const hurt = S.w[D.poster[0]]; hurt.inj = 3; const D2 = E.deskBoard(S);
ok('hurt', 'a hurt star steps off the poster', D2.poster.indexOf(hurt.id) < 0 && D2.poster.length === 3); hurt.inj = 0;
ok('big', 'the next big event has a name and a distance', !!D.big.name && D.big.in >= 0);
ok('card', 'what is on the card so far is a list of lines', Array.isArray(D.card) && D.card.every(c => c.k && c.t));
const before = JSON.stringify(S); E.deskBoard(S);
ok('read', 'it only reads the game', JSON.stringify(S) === before);
console.log(fails.length ? fails.length + ' failed' : 'all passed'); process.exit(fails.length ? 1 : 0);
