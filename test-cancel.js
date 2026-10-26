/* Cancellation: three network meetings in a year cancel the weakest weekly show; it runs on as a house show; a strong run wins a deal back.  Run: node test-cancel.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const answer = S => S.inbox.forEach(e => { if (!e.done && e.type !== 'netmeet' && e.type !== 'netback') E.resolveEvent(S, e.id, e.choices.length - 1); });
const S = E.newGame('pdw', 5, { name: 'R' }); answer(S);
const P = S.promos.pdw, meet = () => { E.clocks(S); S.clocks.net.v = 6; const ev = { type: 'netmeet', text: 'x', choices: ['a', 'b', 'c'] }; S.inbox.push(Object.assign(ev, { id: S.nid++, done: false })); return E.resolveEvent(S, ev.id, 1); };
const r1 = meet(); ok('warn', 'the first meeting is warning 1 of 3', /warning 1 of 3/.test(String(r1 && (r1.text || r1))), String(r1 && (r1.text || r1)).slice(-60));
meet(); const r3 = meet(), off = P.shows.filter(s => s.off);
ok('cancel', 'the third cancels one weekly show', off.length === 1, off.map(s => s.name).join());
ok('cancel', 'and the people at the top remember it', S.rmY && Object.values(S.rmY).some(e => e.mem.some(m => m.k === 'cancel')));
// play until the cancelled show runs as a house show
let rep = null; for (let w = 0; w < 4 && !rep; w++) { answer(S); while (S.qi < S.queue.length) { const c = E.suggest(S); const r = E.runPlayerShow(S, c).rep; if (r && r.id === off[0].id) rep = r; } answer(S); E.endWeek(S); }
ok('house', 'the house show earns no television money', rep && rep.tv === 0 && rep.hs === 1, rep && ('tv ' + rep.tv + ', crowd ' + rep.att));
off[0].offRun = 5; answer(S);
// a strong run takes a booker who thinks (E.suggestSmart); flat Suggest a card lands around a C, under the bar
let back = null; for (let w = 0; w < 4 && !back; w++) { while (S.qi < S.queue.length) { const c = E.suggestSmart(S); const r = E.runPlayerShow(S, c).rep; if (r && r.id === off[0].id && E.crowdScore) {} } back = S.inbox.find(e => !e.done && e.type === 'netback'); if (!back) { off[0].offRun = Math.max(off[0].offRun, 5); answer(S); E.endWeek(S); } }
ok('back', 'a strong run of house shows brings an offer', !!back);
if (back) { E.resolveEvent(S, back.id, 0); ok('back', 'taking it puts the show back on television', !off[0].off && off[0].net === back.net, off[0].net); }
console.log(fails.length ? fails.length + ' failed' : 'test-cancel: all passed'); process.exit(fails.length ? 1 : 0);
