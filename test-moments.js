/* Every history moment: build it, answer every choice, check nothing throws and the result is plain text.  Run: node test-moments.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0; const seen = {};
function play(S, n) { for (let w = 0; w < n && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); } E.endWeek(S); } }
for (const id of E.momentIds()) {
  let maxChoices = 0, tried = 0;
  for (let c = 0; c < 4; c++) {
    let done = false;
    for (const promo of ['pdw', 'whw', 'ocw', 'pdp', 'nmw', 'ldd']) {
      for (let sd = 1; sd <= 6 && !done; sd++) {
        const S = E.newGame(promo, sd, { name: 'R' });
        for (let k = 0; k < 40 && !done; k++) {
          // make sure the situation exists: lower a few morales and contracts so every story can appear
          S.w.filter(w => w.promo === S.player && !w.nw).slice(0, 8).forEach((w, i) => { if (id === 'liveMic' || id === 'walkout' || id === 'beltElsewhere') w.morale = 30; if (id === 'leaving' || id === 'beltElsewhere') w.con = 3; });
          const ev = E.momentForce(S, id);
          if (ev) { maxChoices = Math.max(maxChoices, ev.choices.length); if (c < ev.choices.length) { tried++; try { const r = E.resolveEvent(S, ev.id, c); if (typeof r !== 'string' || !r.length || /NaN|undefined/.test(r)) throw new Error('bad text: ' + r); seen[id] = (seen[id] || 0) + 1; play(S, 8); const bad = S.w.filter(w => [w.ovr, w.morale, w.mom, w.wage].some(x => !isFinite(x))); if (bad.length) throw new Error('NaN after ' + id); } catch (e) { fails++; console.log('FAIL', id, 'choice', c, e.message.slice(0, 160)); } } done = true; }
          else play(S, 1);
        }
      }
      if (done) break;
    }
  }
  console.log(id.padEnd(15), 'choices', maxChoices, 'answers tried', tried);
}
for (const id of E.momentIds()) if (!seen[id]) { fails++; console.log('FAIL', id, 'never appeared'); }
if (fails) { console.log('FAILED: ' + fails); process.exit(1); }
console.log('test-moments: all passed');
