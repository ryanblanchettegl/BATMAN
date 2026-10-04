/* Wording rule: no dice anywhere. Plays 60 weeks of every promotion and scans all the text in the save (news, inbox, reports, logs). */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const WEEKS = +process.argv[2] || 60, BAD = /\bdice\b|\bdie roll|\b2d6\b|\brolled\b|\brolls?\s+(a\s+)?\d|\broll(ing)?\s+(the\s+)?(dice|die)\b/i;
let hits = 0, scanned = 0;
function scan(v, path, id) { if (typeof v === 'string') { scanned++; const m = BAD.exec(v); if (m && hits++ < 20) console.log('  ' + id + ' ' + path + ': …' + v.slice(Math.max(0, m.index - 30), m.index + 40) + '…'); } else if (v && typeof v === 'object') for (const k in v) scan(v[k], path + '.' + k, id); }
for (const p of E.universe().promotions) {
  const S = E.newGame(p.id, 3, { name: 'R' });
  for (let wk = 0; wk < WEEKS && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => { const r = E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1); scan(r, 'resolve', p.id); });
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) {
      const card = E.suggest(S), pr = E.preShow(S, card); if (pr) { scan(pr, 'preShow', p.id); scan(E.resolvePre(S, card, 0), 'pre', p.id); E.fitShow(S, card); }
      if (E.validate(S, card).errors.length) { S.qi++; continue; }
      scan(E.runPlayerShow(S, card), 'show', p.id);
    }
    E.endWeek(S);
  }
  scan(S, 'S', p.id);
}
console.log('scanned ' + scanned + ' strings');
if (hits) { console.log('FAILED: ' + hits + ' line(s) with dice wording'); process.exit(1); }
console.log('test-wording: all passed');
