/* The student passes the teacher (src/76-student.js): once, on the desk, and each answer is remembered.  Run: node test-student.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (label, pass, detail) => { console.log(pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
function setup(seed) {
  const S = E.newGame('pdw', seed, { name: 'R' }); S.inbox.forEach(e => E.resolveEvent(S, e.id, 0));
  const R = S.w.filter(w => w.promo === 'pdw' && !w.nw).sort((a, b) => b.ovr - a.ovr), st = R[0], m = R[R.length - 1];
  st.coach = m.id; S.week = 5; E.endWeek(S);
  return { S, st, m, ev: S.inbox.find(e => e.type === 'passed' && !e.done) };
}
const a = setup(1);
ok('a student more over than the one who trained them reaches the desk', !!a.ev && a.ev.w === a.st.id && a.ev.o === a.m.id, a.ev && a.ev.text);
E.endWeek(a.S); ok('only once', a.S.inbox.filter(e => e.type === 'passed').length === 1);
const before = E.rel(a.S, a.m.id, a.st.id).jealA, ra = E.rel(a.S, a.m.id, a.st.id);
E.resolveEvent(a.S, a.ev.id, 0);
ok('the teacher puts the student over: the student has momentum, and the teacher remembers being asked', a.S.rmY[a.m.id] && a.S.rmY[a.m.id].mem.some(x => x.k === 'putover') && a.S.rmY[a.st.id].mem.some(x => x.k === 'putover'));
const b = setup(2); E.resolveEvent(b.S, b.ev.id, 1);
ok('leaving it alone makes the teacher jealous', E.rel(b.S, b.m.id, b.st.id).jealA >= 20 || E.rel(b.S, b.m.id, b.st.id).jealB >= 20, JSON.stringify(E.rel(b.S, b.m.id, b.st.id)));
const c = setup(3); const f0 = c.S.feuds.length; E.resolveEvent(c.S, c.ev.id, 2);
ok('teacher against student starts a feud between them, or says why not', c.S.feuds.length > f0 || /too many feuds/.test(c.ev.result || ''), c.ev.result);
console.log(fails.length ? 'FAILED: ' + fails.join('; ') : 'test-student: all passed'); process.exit(fails.length ? 1 : 0);
