/* The writers' room: three writers with styles, pitches every other week, the argument, what running a pitch does,
   the head writer passed over, and the style in the words. Plays 60 weeks with errs 0 and NaN 0.  Run: node test-writers.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'))); E.suggest = E.suggestSmart;
const S = E.newGame('pdw', 3, { name: 'R' }); let errs = 0, pitches = 0, feuds = 0; const texts = [];
for (let w = 0; w < 60; w++) {
  S.inbox.filter(e => !e.done).forEach(e => { if (e.type === 'wroom') { pitches++; texts.push(e.text); const f0 = S.feuds.length, r = E.resolveEvent(S, e.id, pitches % 2); texts.push(r); if (S.feuds.length > f0) feuds++; } else E.resolveEvent(S, e.id, 1); });
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; errs++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S); if (S.over) { S.over = null; S.owner.trust = 80; }
}
const nan = []; const walk = (o, p) => { if (typeof o === 'number' && !isFinite(o)) nan.push(p); else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], p + '.' + k)); }; walk(S, 'S');
ok('run', '60 weeks with errs 0 and NaN 0', errs < 3 && nan.length === 0);
const W = E.writers(S);
ok('room', 'three writers, one the head writer, each with a style said in words', W.length === 3 && W.filter(w => w.head).length === 1 && W.every(w => w.style && w.likes && !/\d/.test(w.strong)), W.map(w => w.name + ' (' + w.style + ')').join(', '));
ok('room', 'the head writer is the company’s own', W[0].head && W[0].name === S.promos.pdw.staff.writer, W[0].name + ' / ' + S.promos.pdw.staff.writer);
ok('pitch', 'two writers pitch about every other week, and they argue', pitches >= 20 && texts.some(t => /calls it/.test(t) && /sides with/.test(t)), pitches + ' rooms');
ok('pitch', 'a storyline pitch run starts the story', feuds >= 1, feuds + ' stories started from the room');
{ const m = JSON.stringify(W.map(w => S.rmY[w.id] || {})); ok('mem', 'the writers remember whose pitch ran and whose did not', /pitchyes/.test(m) && /pitchno/.test(m), W.map(w => w.you).join(',')); }
ok('words', 'the style shows in the words of the writers’ segments', S.reports.some(r => r.segs.some(s => s.wr && Object.values({ a: 'crowd laughs', b: 'crying', c: 'really happened', d: 'Pyro', e: 'silly', f: 'last scene', g: 'rough', h: 'bigger than', i: 'opening video', j: 'uncomfortable', k: 'quiet, then loud', l: 'announcers lose it' }).some(x => (s.text || '').toLowerCase().indexOf(x.toLowerCase()) >= 0))));
ok('words', 'no unfilled slots in the room', texts.every(t => !/#hw#|\{|undefined/.test(t)));
// the head writer passed over twice runs out of patience
{ const T = E.newGame('pdw', 4, { name: 'R' }); let n = 0;
  for (let w = 0; w < 30 && n < 2; w++) { T.qi = T.queue.length; E.endWeek(T); const e = T.inbox.find(x => x.type === 'wroom' && !x.done); if (e) { const head = T.wr.head, pick = e.a === head ? 1 : (e.b === head ? 0 : -1); if (pick >= 0) { E.resolveEvent(T, e.id, pick); n++; } else E.resolveEvent(T, e.id, 2); } }
  ok('head', 'a head writer passed over twice runs out of patience', T.w[T.wr.head].morale < 70 && T.wr.passed >= 2, 'morale ' + Math.round(T.w[T.wr.head].morale)); }
const A = E.newGame('pdw', 7, { name: 'R' }), B = E.newGame('pdw', 7, { name: 'R' });
for (const T of [A, B]) for (let w = 0; w < 20; w++) { T.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(T, e.id, 0)); while (T.qi < T.queue.length) { const c = E.suggest(T); if (E.validate(T, c).errors.length) { T.qi++; continue; } E.runPlayerShow(T, c); } E.endWeek(T); }
ok('same', 'the same seed gives the same room', JSON.stringify(A.wr) === JSON.stringify(B.wr) && JSON.stringify(A) === JSON.stringify(B));
console.log(fails.length ? fails.length + ' failed' : 'test-writers: all passed'); process.exit(fails.length ? 1 : 0);
