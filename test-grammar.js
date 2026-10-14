/* The text grammar (src/60-grammar.js): 30 weeks of one company, collecting every headline, opening, verdict and
   chat line it wrote. Checks that no line is empty or has an unfilled slot, that the lines vary from week to week,
   and prints a sample to read for tone. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }), heads = [], opens = [], verdicts = [], sites = [], res = [];
let fails = 0; const bad = (what, t) => { if (fails++ < 15) console.log('  bad ' + what + ': "' + t + '"'); };
const check = (what, t) => { if (!t || /[{}#]/.test(t) || /^\s|\s$/.test(t) || /^[a-z]/.test(t) && what !== 'chat') bad(what, t); };
for (let wk = 0; wk < 30 && !S.over; wk++) {
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); } if (E.validate(S, card).errors.length) { S.qi++; continue; } E.runPlayerShow(S, card); }
  const I = E.sheetInfo(S).now; heads.push(I.lead.head); opens.push(I.lead.open); verdicts.push(I.review); I.yours.forEach(y => res.push(y.head));
  const W = E.webHeads(S); Object.keys(W).forEach(k => sites.push(k + ': ' + W[k]));
  E.endWeek(S);
}
const chat = E.feed(S).filter(p => p.k === 'f').map(p => p.t);
heads.forEach(t => check('headline', t)); opens.forEach(t => check('opening', t)); verdicts.forEach(t => check('verdict', t)); sites.forEach(t => check('site', t.split(': ').slice(1).join(': '))); res.forEach(t => check('result', t)); chat.forEach(t => check('chat', t));
const uniq = a => new Set(a).size;
const vary = (what, a, min) => { if (uniq(a) < min) { fails++; console.log('  ' + what + ': only ' + uniq(a) + ' different lines in ' + a.length); } };
vary('headlines', heads, 6); vary('openings', opens, 6); vary('site headlines', sites, 30); vary('chat lines', chat, 10);
console.log('sample headlines: ' + [...new Set(heads)].slice(0, 6).join(' | '));
console.log('sample openings: ' + [...new Set(opens)].slice(0, 3).join(' | '));
console.log('sample sites: ' + [...new Set(sites)].slice(0, 8).join(' | '));
console.log('sample chat: ' + [...new Set(chat)].slice(0, 8).join(' | '));
if (fails) { console.log('FAILED: ' + fails); process.exit(1); }
console.log('test-grammar: all passed');
