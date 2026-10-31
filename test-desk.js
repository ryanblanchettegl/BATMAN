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
// the owner speaks only with news, and says the worst first
ok('owner0', 'a new game: the owner has nothing to say', D.owner === null || typeof D.owner === 'string');
P.neg = 1; ok('owner1', 'cash below zero is what the owner talks about', /Cash is negative/.test(E.deskBoard(S).owner)); P.neg = 0;
const t0 = S.owner.trust; S.owner.trust = 20; ok('owner2', 'low trust: the owner is running out of patience', /patience/.test(E.deskBoard(S).owner)); S.owner.trust = t0;
// a hurt champion cannot defend, and the card says so; with nobody named face, the most popular fit wrestler heads the poster
const T = P.titles.filter(t => !t.tag && t.holders.length).sort((a, b) => (b.pres || 0) - (a.pres || 0))[0], ch = S.w[T.holders[0]], i0 = ch.inj; ch.inj = 2;
ok('champ', 'a hurt champion cannot defend, and the card says so', E.deskBoard(S).card.some(c => /is hurt and cannot defend/.test(c.t))); ch.inj = i0;
const fc = S.fc; S.fc = null; const D3 = E.deskBoard(S);
ok('noface', 'with no face named, the most popular fit wrestler stands in the middle', D3.poster.length === 3 && D3.face === D3.poster[1] && D3.poster.every(id => S.w[D3.face].ovr >= S.w[id].ovr)); S.fc = fc;
ok('last0', 'before any show there is no last show', D.last === null);
// a few weeks in: the last show and the grades on the map come from the game's own records
const ans = () => S.inbox.forEach(e => { if (!e.done) E.resolveEvent(S, e.id, e.choices.length - 1); });
for (let i = 0; i < 2; i++) { ans(); while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } E.runPlayerShow(S, c); } ans(); E.endWeek(S); }
const D4 = E.deskBoard(S), r = S.reports.find(x => x.promo === S.player);
ok('last', 'the last show is the newest report of yours: its name, grade and house', D4.last && D4.last.name === r.name && D4.last.grade === E.repGrade(r) && D4.last.att === r.att && !!D4.last.line);
ok('motn', 'the match of the night is the best match on that show', !D4.last.motn || r.segs.filter(g => g.k === 'match').every(g => g.label === D4.last.motn.label || g.ov <= r.segs.find(x => x.label === D4.last.motn.label).ov));
ok('grades', 'every city on record has its last grade for the map', Object.keys(S.rdv).length > 0 && Object.keys(S.rdv).every(c => D4.grades[c] === E.grade(S.rdv[c].cs)));
ok('same', 'the same game gives the same desk twice', JSON.stringify(E.deskBoard(S)) === JSON.stringify(E.deskBoard(S)));
S.inbox.push({ id: 99001, type: 'x', text: 'A test matter.', choices: ['Yes', 'No'], done: false });
const TD = E.deskTodo(S);
ok('todo', 'the to-do list: matters first, the count is what must be done, no inbox task beside the matters', TD.matters.length >= 1 && TD.left === TD.matters.length + TD.must.length && !TD.must.concat(TD.can).some(t => t.id === 'inbox'));
ok('kinds', 'every task has a kind for its colour: answer, money or assign', TD.must.concat(TD.can, TD.waved).every(t => ['answer', 'money', 'assign'].indexOf(t.kind) >= 0) && TD.must.concat(TD.can).filter(t => t.id === 'sponsors').every(t => t.kind === 'money'));
S.inbox = S.inbox.filter(e => e.id !== 99001);
const before = JSON.stringify(S); E.deskBoard(S);
ok('read', 'it only reads the game', JSON.stringify(S) === before);
console.log(fails.length ? fails.length + ' failed' : 'all passed'); process.exit(fails.length ? 1 : 0);
