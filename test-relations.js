/* The relationship matrix and what people remember (src/66-relations.js).  Run: node test-relations.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
const notes = S => S.toasts.filter(t => t && typeof t === 'object');
const by = (S, name) => S.w.find(w => w.name === name);
function week(S) { house(S); while (S.qi < S.queue.length) { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) E.resolvePre(S, card, 0); S.card = card; if (E.validate(S, card).errors.length) { S.qi++; continue; } E.runPlayerShow(S, card); } house(S); E.endWeek(S); }

/* ---- a new game ---- */
{ const S = E.newGame('pdw', 3, { name: 'R' }), n = Object.keys(S.rm).length;
  ok('new', 'the matrix starts with the working relationships of every company', n > 100 && !S.rel && !S.bond, n + ' pairs');
  const a = by(S, 'King Arthur'), m = by(S, 'Mordred'), l = by(S, 'Sir Lancelot');
  const R = E.relations(S, a.id);
  ok('new', 'the world file’s friends and enemies are in it', R.good.some(x => x.id === l.id) && R.bad.some(x => x.id === m.id) && E.rel(S, a.id, m.id).word === 'real heat', E.rel(S, a.id, m.id).word);
  ok('new', 'nothing is announced while a game is being made', notes(S).length === 0);

  /* ---- one change, both directions ---- */
  const x = S.w.filter(w => w.promo === 'pdw' && !w.nw && w.g === 'M' && w.id !== a.id).filter(w => !S.rm[a.id < w.id ? a.id + '-' + w.id : w.id + '-' + a.id])[0];
  E.relBump(S, a.id, x.id, { bond: -40, ra: 20, rb: -30, jb: 50 }, { k: 'test', t: x.name + ' showed up King Arthur in catering.', keep: true });
  const r1 = E.rel(S, a.id, x.id), r2 = E.rel(S, x.id, a.id);
  ok('bump', 'respect and jealousy point one way; the bond is shared', r1.bond === -40 && r2.bond === -40 && r1.respA === 20 && r1.respB === -30 && r2.respA === -30 && r2.respB === 20 && r1.jealA === 0 && r2.jealA === 50, JSON.stringify(r1));
  ok('bump', 'both remember it', r1.mem.length === 1 && r1.mem[0].k === 'test' && r1.mem[0].w === S.week);
  const N = notes(S);
  ok('bump', 'turning two people into enemies goes on the notification bar', N.length === 1 && /have real heat now/.test(N[0].h) && N[0].k === 'bad' && /catering/.test(N[0].t), JSON.stringify(N));
  ok('bump', 'the wrestler card lists it', E.relations(S, x.id).bad.some(w => w.id === a.id) && E.relations(S, x.id).notes.some(q => /catering/.test(q.t)) && E.relations(S, x.id).notes.some(q => /Jealous of King Arthur/.test(q.t)));
  /* settling: most of a thing nobody gets over is permanent */
  const e = S.rm[a.id < x.id ? a.id + '-' + x.id : x.id + '-' + a.id];
  ok('bump', 'a thing nobody gets over mostly sticks', Math.abs(e.base - (-28)) < 0.01, 'base ' + e.base);
  S.toasts.length = 0;

  /* ---- what you did ---- */
  E.youRemember(S, a.id, 'test', 'You sent them to the finish while they were hurt.', -35);
  const Y = E.relations(S, a.id).you, N2 = notes(S);
  ok('you', 'a wrestler remembers what you did, and the bar says so', Y && Y.v === -35 && Y.word === 'Has not forgiven you' && Y.mem[0].t.indexOf('hurt') > 0 && N2.length === 1 && N2[0].h === 'King Arthur will remember that' && N2[0].k === 'bad', JSON.stringify(N2));
  S.toasts.length = 0;

  /* ---- time ---- */
  // two people in another company, so nothing but time touches them
  const O = S.w.filter(w => w.promo === 'ocw' && !w.nw), p = O[0], q = O.find(w => w.id !== p.id && !S.rm[p.id < w.id ? p.id + '-' + w.id : w.id + '-' + p.id]);
  E.relBump(S, p.id, q.id, { bond: -40, jb: 60 }, { k: 'test', t: 'A test grudge.', keep: true });
  const f = S.rm[p.id < q.id ? p.id + '-' + q.id : q.id + '-' + p.id];
  for (let k = 0; k < 3; k++) week(S);
  const soured = f.bond;
  for (let k = 0; k < 40; k++) week(S);
  ok('time', 'jealousy sours a bond while it is high, then fades, and the bond drifts to where it has settled', soured < -40 && f.bond > soured && f.bond < f.base + 6 && Math.max(f.jeal[0], f.jeal[1]) < 20 && f.mem.length === 1, 'bond -40 -> ' + soured + ' -> ' + f.bond + ' (settled at ' + f.base + '), jealousy 60 -> ' + Math.max(f.jeal[0], f.jeal[1]));
}
/* ---- a decision on the headset leaves a memory ---- */
{ const S = E.newGame('pdw', 5, { name: 'R' }); house(S); S.card = E.suggest(S);
  let ch = null; for (let i = 0; i < 4000 && !(ch && ch.type === 'ko'); i++) { S.chs = null; ch = E.chaos(S, S.card); }
  ok('live', 'a knockout on the headset can be planted', !!ch && ch.type === 'ko');
  if (ch) { const w = S.w[ch.w]; S.toasts.length = 0; E.resolveChaos(S, S.card, 0);
    const Y = E.relations(S, w.id).you, N = notes(S);
    ok('live', 'stopping the match is remembered kindly', Y && Y.v === 25 && N.some(n => n.h === w.name + ' will remember that' && n.k === 'good'), JSON.stringify(N)); }
}
{ const S = E.newGame('pdw', 5, { name: 'R' }); house(S); S.card = E.suggest(S);
  let ch = null; for (let i = 0; i < 4000 && !(ch && ch.type === 'shoot'); i++) { S.chs = null; ch = E.chaos(S, S.card); }
  if (ch) { const a = S.w[ch.w], b = S.w[ch.o], was = Math.max(-45, E.rel(S, a.id, b.id).bond); if (E.rel(S, a.id, b.id).bond < -45) E.relBump(S, a.id, b.id, { bond: -45 - E.rel(S, a.id, b.id).bond }); S.toasts.length = 0; E.resolveChaos(S, S.card, 1);
    const r = E.rel(S, a.id, b.id);
    ok('live', 'a real fight costs the pair 55 points of bond, leaves a memory, and two people who blame you', r.bond === was - 55 && r.mem.some(m => m.k === 'shoot') && E.relations(S, a.id).you.v < 0 && E.relations(S, b.id).you.v < 0, was + ' -> ' + r.bond); }
  else ok('live', 'a real fight could be planted', false);
}
/* ---- an old save is folded in ---- */
{ const S = E.newGame('pdw', 7, { name: 'R' }), R = S.w.filter(w => w.promo === 'pdw' && !w.nw);
  delete S.rm; delete S.rmY; S.rel = {}; S.bond = {};
  const k = (a, b) => a.id < b.id ? a.id + '-' + b.id : b.id + '-' + a.id;
  S.rel[k(R[0], R[1])] = 1; S.rel[k(R[0], R[2])] = -1; S.bond[k(R[3], R[4])] = 5; S.bond[k(R[0], R[1])] = 2;
  const rr = E.relations(S, R[0].id);
  ok('old', 'an old save keeps its friends, enemies and bonds', rr.good.some(w => w.id === R[1].id) && rr.bad.some(w => w.id === R[2].id) && E.rel(S, R[3].id, R[4].id).bond === 50 && E.rel(S, R[0].id, R[1].id).bond === 80 && !S.rel && !S.bond, JSON.stringify(E.rel(S, R[0].id, R[1].id)));
  week(S);
  ok('old', 'and plays on', S.week === 2);
}
/* ---- sixty weeks as three companies ---- */
{ let bad = 0, out = [];
  for (const id of ['pdw', 'ttt', 'kjp']) {
    const S = E.newGame(id, 11, { name: 'R' }); let errs = 0;
    for (let k = 0; k < 60 && !S.over; k++) { try { week(S); } catch (e) { errs++; console.log(id, e.message); break; } }
    const M = S.rm, ks = Object.keys(M), mine = ks.filter(k2 => { const p = k2.split('-'); return S.w[+p[0]].promo === id && S.w[+p[1]].promo === id; });
    const nan = ks.filter(k2 => { const e = M[k2]; return [e.bond, e.base, e.resp[0], e.resp[1], e.jeal[0], e.jeal[1]].some(v => typeof v !== 'number' || v !== v || Math.abs(v) > 100.001) || e.mem.length > 6; }).length;
    const mems = mine.reduce((a, k2) => a + M[k2].mem.length, 0), jeal = mine.filter(k2 => Math.max(M[k2].jeal[0], M[k2].jeal[1]) >= 5).length, resp = mine.filter(k2 => Math.max(M[k2].resp[0], M[k2].resp[1]) >= 10).length;
    const heat = mine.filter(k2 => M[k2].bond <= -30).length, friends = mine.filter(k2 => M[k2].bond >= 30).length;
    out.push(id + ': ' + ks.length + ' pairs, ' + friends + ' friends, ' + heat + ' with heat, ' + resp + ' with respect, ' + jeal + ' jealous, ' + mems + ' memories, ' + Math.round(JSON.stringify(M).length / 1024) + ' KB');
    if (errs || nan || !mems || !resp) bad++;
    if (JSON.stringify(S.toasts).length > 20000) bad++;
  }
  ok('long', 'the matrix stays sound, bounded and alive', bad === 0, out.join(' | '));
}
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('relations: all passed');
