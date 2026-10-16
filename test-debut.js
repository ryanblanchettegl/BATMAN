/* Book a debut: vignettes, a surprise attack or a straight match, and what each does.  Run: node test-debut.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.choices.length - 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
const fresh = (seed) => { const S = E.newGame('pdw', seed, { name: 'R' }); house(S); const w = S.w.filter(x => x.promo === 'pdw' && !x.nw && x.g === 'M' && x.inj <= 0).sort((a, b) => a.ovr - b.ovr)[3]; w.deb = true; w.hy = 0; return { S, w }; };
{ const { S, w } = fresh(4);
  ok('task', 'a newcomer with no plan is a task on the desk', E.tasks(S).list.some(t => t.id === 'deb-' + w.id));
  ok('plan', 'a debut can be planned', E.debutPlan(S, w.id, 'vig').ok && w.dk === 'vig' && E.tasks(S).list.find(t => t.id === 'deb-' + w.id).state === 'done');
  S.qi = S.queue.length; house(S); E.endWeek(S); ok('vig', 'vignettes build hype every week before the debut', w.hy === 1, 'hy ' + w.hy); }
for (const k of ['atk', 'match']) { const { S, w } = fresh(6); E.debutPlan(S, w.id, k);
  const card = E.suggest(S), m = card.find(x => x.mt === '1v1' && !x.title);
  const opp = m.sides[1][0]; m.sides = [[w.id], [opp]];
  for (let q = card.length - 1; q >= 0; q--) if (card[q] !== m && [].concat(...card[q].sides).some(id => id === w.id || id === opp)) card.splice(q, 1);
  const o0 = w.ovr, mom0 = w.mom; E.fitShow(S, card); const rep = E.runPlayerShow(S, card).rep, seg = rep && rep.segs.find(s => s.ids && s.ids.includes(w.id) && s.k === 'match');
  ok(k, 'the debut ran', !!seg && !w.deb && !w.dk, seg && seg.win);
  if (k === 'atk') ok(k, 'a surprise attack is louder and builds momentum', seg && seg.fx.some(f => /came out of nowhere/.test(f.x)) && w.mom >= mom0);
  if (k === 'match') ok(k, 'a straight match: a win makes them, a loss sets them back', seg && (seg.win && seg.win.indexOf(w.name) >= 0 ? w.ovr > o0 - 0.01 : w.ovr < o0), o0 + ' to ' + w.ovr);
}
console.log(fails.length ? fails.length + ' failed' : 'test-debut: all passed'); process.exit(fails.length ? 1 : 0);
