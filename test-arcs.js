/* Company arcs: one a year, built from the roster, chapters on the desk, a payoff at the flagship, a flop that can be turned around.  Run: node test-arcs.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const ans = S => S.inbox.forEach(e => { if (!e.done && e.type !== 'arcch') E.resolveEvent(S, e.id, e.choices.length - 1); });
function play(k, pick) {
  const S = E.newGame('pdw', 4, { name: 'R' }); ans(S); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  const r = E.arcStart(S, k); let ch = 0, last = null, txt = [];
  for (let w = 0; w < 70 && S.arc; w++) { ans(S); while (S.qi < S.queue.length) E.runPlayerShow(S, E.suggest(S));
    S.inbox.filter(e => !e.done && e.type === 'arcch').forEach(e => { ch++; txt.push(e.text); if (e.last) { last = e; S.bp = Math.max(S.bp, 5); } E.resolveEvent(S, e.id, pick(e)); }); E.endWeek(S); }
  return { S, r, ch, last, txt };
}
for (const k of Object.keys(E.ARCS)) {
  const g = play(k, () => 0);
  ok(k, 'starts, brings four chapters to the desk, and ends at the flagship', g.r.ok && g.ch === 4 && !g.S.arc && g.S.arcs.length === 1, g.ch + ' chapters, ' + (g.S.arcs[0] || {}).res);
  ok(k, 'chapters name real people and leave no slots', g.txt.every(t => !/\{\w+\}/.test(t)));
}
{ const worst = e => { const o = E.ARCS.faction.ch[e.n].o; let b = 0; o.forEach((x, i) => { if (x.s < o[b].s) b = i; }); return b; };
  const g = play('faction', e => (e.last ? 0 : worst(e)));
  ok('flop', 'weak choices make it flop, and the last chapter offers to turn it around', /flopping/.test(g.last.text) && /Turn it around/.test(g.last.choices[0]), g.S.arcs[0].res);
  ok('flop', 'turned around, something is saved at the flagship', g.S.arcs[0].res === 'was saved', g.S.arcs[0].res); }
{ const S = E.newGame('pdw', 4, { name: 'R' }); ans(S); E.arcStart(S, 'split');
  ok('one', 'only one arc at a time', !E.arcStart(S, 'faction').ok); }
console.log(fails.length ? fails.length + ' failed' : 'test-arcs: all passed'); process.exit(fails.length ? 1 : 0);
