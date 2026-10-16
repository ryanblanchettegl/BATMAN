/* Company arcs: one a year, built from the roster, chapters on the desk, a payoff at the flagship, a flop that can be turned around.  Run: node test-arcs.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.suggest = E.suggestSmart;   // a whole year of shows: the flat suggestion would get the booker fired before the flagship
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const ans = S => S.inbox.forEach(e => { if (!e.done && e.type !== 'arcch') E.resolveEvent(S, e.id, e.choices.length - 1); });
function play(k, pick) {
  const S = E.newGame('pdw', 4, { name: 'R' }); ans(S); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  const r = E.arcStart(S, k); let ch = 0, last = null, txt = [];
  for (let w = 0; w < 70 && S.arc; w++) { ans(S); let gd = 0; while (S.qi < S.queue.length && gd++ < 6) { const x = E.runPlayerShow(S, E.suggest(S)); if (!x.rep) console.log('  stuck', k, w, JSON.stringify(x).slice(0, 200)); }
    S.inbox.filter(e => !e.done && e.type === 'arcch').forEach(e => { ch++; txt.push(e.text); if (e.last) { last = e; S.bp = Math.max(S.bp, 5); } E.resolveEvent(S, e.id, pick(e)); }); E.endWeek(S); }
  return { S, r, ch, last, txt };
}
for (const k of Object.keys(E.ARCS)) {
  const g = play(k, () => 0);
  ok(k, 'starts, brings its chapters to the desk, and ends at the flagship', g.r.ok && g.ch === E.ARCS[k].ch.length + 1 && !g.S.arc && g.S.arcs.length === 1, g.ch + ' chapters, ' + (g.S.arcs[0] || {}).res);
  ok(k, 'chapters name real people and leave no slots', g.txt.every(t => !/\{\w+\}/.test(t)));
}
{ const worst = e => { const o = E.ARCS.faction.ch[e.n].o; let b = 0; o.forEach((x, i) => { if (x.s < o[b].s) b = i; }); return b; };
  const g = play('faction', e => (e.last ? 0 : worst(e)));
  ok('flop', 'weak choices make it flop, and the last chapter offers to turn it around', /flopping/.test(g.last.text) && /Turn it around/.test(g.last.choices[0]), g.S.arcs[0].res);
  ok('flop', 'turned around, something is saved at the flagship', g.S.arcs[0].res === 'was saved', g.S.arcs[0].res); }
{ const g = play('split', () => 0), P = g.S.promos.pdw;
  ok('split', 'with two weekly shows the roster is really split, and each show books its own side', P.brands && P.brands.length === 2 && P.shows.filter(s => s.brand).length >= 2 && E.rosterOf(g.S, 'pdw').filter(w => !w.nw).every(w => w.brand === 'arcA' || w.brand === 'arcB'), P.brands && P.brands.map(b => b.name).join(' / ')); }
{ const g = play('faction', e => (e.last ? 0 : e.n === 3 ? 0 : 0)), A = g.S.arcs[0];
  ok('fact', 'the betrayal turns one of the group', g.txt.some(t => /Cracks inside the group/.test(t))); }
{ const S = E.newGame('pdw', 4, { name: 'R' }); ans(S); const I = E.arcInfo(S).list.find(x => x.k === 'faction'), pick = I.pick.from[2];
  ok('fact', 'the booker picks the leader', E.arcStart(S, 'faction', { lead: pick.id }).ok && S.arc.cast.lead === pick.id, pick.n); }
{ const S = E.newGame('pdw', 4, { name: 'R' }); ans(S); E.arcStart(S, 'split');
  ok('one', 'only one arc at a time', !E.arcStart(S, 'faction').ok); }
console.log(fails.length ? fails.length + ' failed' : 'test-arcs: all passed'); process.exit(fails.length ? 1 : 0);
