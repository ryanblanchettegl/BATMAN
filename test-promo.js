/* Promos (the promo grammar in src/60-grammar.js): 20 weeks of three companies, reading every booked promo's words.
   Checks every promo has a speaker in quotes, no unfilled slot, a challenger never calls the title theirs, and the
   words vary. Prints a few to read for tone. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
// since 16 October Suggest a card hands promo time to the writers; the promos this reads are booked by E.suggestSmart
E.suggest = E.suggestSmart;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0, all = []; const bad = (m) => { if (fails++ < 12) console.log('  FAIL ' + m); };
for (const pi of [0, 1, 2]) {
  const S = E.newGame(E.universe().promotions[pi].id, 3, { name: 'R' });
  for (let wk = 0; wk < 20 && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c);
      S.reports[0].segs.filter(s => s.k === 'angle' && ['interview', 'callout', 'words', 'challenge', 'faceoff'].includes(s.booked)).forEach(s => {
        all.push(s.text);
        if (!/: “[^”]+”/.test(s.text)) bad('no words: ' + s.text);
        if (/[{}#]/.test(s.text)) bad('unfilled: ' + s.text);
        if (s.booked === 'challenge') { const ch = S.w[s.ids[0]].name, m = new RegExp(ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ': “([^”]+)”').exec(s.text); if (m && /and it is mine|as the .* holder|Look at my shoulder/.test(m[1])) bad('the challenger calls the belt theirs: ' + m[1]); }
      }); }
    E.endWeek(S);
  }
}
const uniq = new Set(all.map(t => (/“([^”]+)”/.exec(t) || [])[1]));
if (all.length < 5) bad('only ' + all.length + ' promos booked');
if (uniq.size < all.length * 0.7) bad('promos repeat: ' + uniq.size + ' different in ' + all.length);
all.slice(0, 3).forEach(t => console.log('  ' + t));
if (fails) { console.log('FAILED: ' + fails); process.exit(1); }
console.log('test-promo: all passed (' + all.length + ' promos, ' + uniq.size + ' different)');
