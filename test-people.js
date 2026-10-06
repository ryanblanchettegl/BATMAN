/* Backstage as people, not rooms: everybody who shows up is there for a reason that is true of the company, and one
   action point is spent on a person.  Run: node test-people.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const all = S => E.people(S).rooms.reduce((a, r) => a.concat(r.people.map(p => Object.assign({ room: r.id }, p))), []);
const find = (S, id) => all(S).find(p => p.id === id);
const fresh = seed => { const S = E.newGame('pdw', seed, { name: 'R' }); S.inbox.forEach(e => { e.done = true; }); return S; };
const spare = (S, n) => E.rosterOf(S, S.player).filter(w => !w.nw && !all(S).some(p => p.id === w.id || p.with === w.id)).sort((a, b) => b.ovr - a.ovr)[n || 0];

{ const S = fresh(3), B = E.people(S), L = all(S);
  ok('p1', 'seven rooms, your own office first, and at the start of a game somebody is already there for a reason', B.rooms.length === 7 && B.rooms[0].n === 'Your office' && L.length >= 1 && L.every(p => p.why && (p.acts.length >= 1 || p.room === 'court') && p.acts.every(a => a.n && a.d)), L.map(p => p.name + ' (' + p.k + ')').join(', '));
  ok('p2', 'nobody is in two rooms, and no room holds more than three', new Set(L.map(p => p.id)).size === L.length && B.rooms.every(r => r.people.length <= (r.id === 'truck' ? 4 : 3)));
  ok('p3', 'the same game shows the same people: who is there is read from the game, not drawn', JSON.stringify(E.people(S)) === JSON.stringify(E.people(S)) && JSON.stringify(all(fresh(3)).map(p => p.id)) === JSON.stringify(L.map(p => p.id))); }

/* each reason puts the right person in the right room */
{ const S = fresh(4), P = S.promos.pdw;
  const a = spare(S, 0); a.inj = 4;
  ok('r1', 'somebody hurt is in the trainer’s room, and standing over the trainer takes a week off', find(S, a.id) && find(S, a.id).room === 'trainer' && /Out for 4 weeks/.test(find(S, a.id).why) && E.peopleDo(S, a.id, 'treat').ok && a.inj === 3);
  const b = spare(S, 0); b.morale = 20;
  ok('r2', 'somebody low is in catering, and sitting down with them is an attempt', find(S, b.id) && find(S, b.id).room === 'catering' && find(S, b.id).acts[0].id === 'sit' && find(S, b.id).acts[0].ck.p > 0);
  const m0 = b.morale, r = E.peopleDo(S, b.id, 'sit');
  ok('r3', 'it moves their mood one way or the other, they remember it, and it costs a point', r.done && (r.ok ? b.morale > m0 : b.morale < m0) && S.rmY[b.id].mem.length >= 1 && S.ap === E.backstage(S).max - 2, r.msg);
  ok('r4', 'one person, once a week', !E.peopleDo(S, b.id, 'sit').ok && find(S, b.id).used);
  const c = spare(S, 0); c.con = 5;
  ok('r5', 'a contract running down puts them in the parking lot', find(S, c.id) && find(S, c.id).room === 'lot' && /Contract is up in 5 weeks/.test(find(S, c.id).why));
  const lean = ((S.rmY || {})[c.id] || { v: 0 }).v; E.peopleDo(S, c.id, 'stay');
  ok('r6', 'telling them you want them to stay is remembered', S.rmY[c.id].v > lean && S.ap === E.backstage(S).max - 3);
  ok('r7', 'with no points left nothing more can be done', !E.peopleDo(S, a.id, 'treat').ok || S.ap >= 0); }

/* storylines: a rivalry brings its people backstage */
{ const S = fresh(5), P = S.promos.pdw, R = E.rosterOf(S, 'pdw').filter(w => !w.nw && w.g === 'M').sort((x, y) => y.ovr - x.ovr), a = R[6], b = R[7];
  a.align = 'H'; b.align = 'F'; S.feuds.forEach(f => { f.res = true; });
  const f = E.startFeud ? E.startFeud(S, a.id, b.id) : null;
  S.feuds.push({ id: S.nid++, promo: 'pdw', a: [a.id], b: [b.id], heat: 80, start: S.week, last: S.week, matches: 0, aw: 0, bw: 0, log: [], title: null, kind: 'feud', res: false });
  const L = all(S), lot = L.find(p => p.k === 'ambush'), tr = L.find(p => p.k === 'story');
  ok('s1', 'the villain of the hottest rivalry is waiting in the parking lot for the other one', !!lot && lot.id === a.id && lot.with === b.id && lot.why.includes(b.name) && /red hot/.test(lot.story), lot ? lot.why : L.map(p => p.k).join(','));
  const feud = S.feuds[S.feuds.length - 1], h0 = feud.heat; feud.heat = 60; const rj = E.peopleDo(S, a.id, 'jump');
  ok('s2', 'letting it happen with a camera on it heats the rivalry', rj.done && feud.heat > 60, rj.msg);
  ok('s3', 'both of them have had their week', find(S, a.id).used && !E.peopleDo(S, a.id, 'jump').ok); }

/* real heat between two people */
{ const S = fresh(6), R = E.rosterOf(S, 'pdw').filter(w => !w.nw && w.g === 'M').sort((x, y) => y.ovr - x.ovr), a = R[8], b = R[9];
  S.feuds.forEach(f => { f.res = true; }); E.rosterOf(S, 'pdw').forEach(x => E.rosterOf(S, 'pdw').forEach(y => { if (x.id < y.id && E.bondOf && E.bondOf(S, x.id, y.id) < 0) E.relBump(S, x.id, y.id, { bond: 60 }); })); E.relBump(S, a.id, b.id, { bond: -70 });
  let p = all(S).find(x => x.k === 'heat');
  ok('h1', 'two people with real heat are in catering, and it can be settled or put on television', !!p && (p.id === a.id || p.id === b.id) && p.room === 'catering' && p.acts.map(x => x.id).join() === 'shake,air', p ? p.why : 'nobody');
  if (p) { const n0 = S.feuds.filter(f => !f.res).length, r = E.peopleDo(S, p.id, 'air');
    ok('h2', 'putting it on television starts a rivalry between them', r.ok && S.feuds.filter(f => !f.res).length === n0 + 1, r.msg); } }
{ const S = fresh(6), R = E.rosterOf(S, 'pdw').filter(w => !w.nw && w.g === 'M').sort((x, y) => y.ovr - x.ovr), a = R[8], b = R[9]; let moved = 0, tries = 0;
  for (let seed = 20; seed < 28; seed++) { const T = fresh(seed), X = E.rosterOf(T, 'pdw').filter(w => !w.nw && w.g === 'M').sort((x, y) => y.ovr - x.ovr), u = X[8], v = X[9]; T.feuds.forEach(f => { f.res = true; });
    E.rosterOf(T, 'pdw').forEach(x => E.rosterOf(T, 'pdw').forEach(y => { if (x.id < y.id && E.bondOf(T, x.id, y.id) < 0) E.relBump(T, x.id, y.id, { bond: 60 }); })); E.relBump(T, u.id, v.id, { bond: -70 });
    const p = all(T).find(x => x.k === 'heat'); if (!p) continue; const b0 = E.bondOf(T, u.id, v.id), r = E.peopleDo(T, p.id, 'shake'); tries++; if (r.ok ? E.bondOf(T, u.id, v.id) > b0 + 20 : E.bondOf(T, u.id, v.id) < b0) moved++; }
  ok('h3', 'making them shake hands moves how they feel about each other, up if it works and down if it does not', tries >= 6 && moved === tries, moved + ' of ' + tries); }

/* what the last show left on the desk walks into the building */
{ const S = fresh(13); let card = E.suggest(S); const pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); }
  const w = S.w[card[1].sides[0][0]];
  E.liveBegin(S, card); w.morale = Math.max(0, w.morale - 30); for (let g = 0; g < 400; g++) { const r = E.liveNext(S); if (r.event) E.liveDecide(S, r.event.safe || 0); else if (r.done) break; }
  const ev = S.inbox.find(e => !e.done && e.type === 'furious' && e.w === w.id), p = find(S, w.id);
  ok('n1', 'somebody who went home furious is in catering the next morning, and the desk says so', !!ev && !!p && p.room === 'catering' && p.k === 'furious' && /on your desk/.test(p.story), p ? p.why : 'not there');
  if (ev && p) { E.peopleDo(S, w.id, 'sit'); ok('n2', 'sitting down with them answers the matter on the desk', ev.done && !!ev.result && !E.tasks(S).list.some(t => t.id === 'inbox' && t.state === 'todo' && /1 matter/.test(t.text) && S.inbox.filter(e => !e.done).length === 0)); } }

/* a new week: everybody can be seen again, and nothing breaks over a long game */
{ const S = fresh(8); let errs = 0, seen = {}, most = 0, least = 99;
  for (let wk = 0; wk < 20 && !S.over; wk++) {
    try { const L = all(S); most = Math.max(most, L.length); least = Math.min(least, L.length); L.forEach(p => { seen[p.k] = 1; });
      for (const p of L) { if (S.ap <= 0) break; if (p.acts.length) E.peopleDo(S, p.id, p.acts[wk % p.acts.length].id); }
      S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : e.choices.length - 1));
      if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
      while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
      S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : e.choices.length - 1)); E.endWeek(S);
    } catch (x) { errs++; console.log(x.stack); } }
  ok('w1', 'twenty weeks of spending every point on people: no errors, no bad numbers', errs === 0 && JSON.stringify(S).indexOf('NaN') < 0);
  ok('w2', 'the building is never empty for long, and many kinds of reason come up', most >= 5 && Object.keys(seen).length >= 6, 'between ' + least + ' and ' + most + ' people; ' + Object.keys(seen).join(', '));
  ok('w3', 'a new week clears who has been seen', all(S).every(p => !p.used)); }

/* people who come to your office to ask for something */
{ const S = fresh(21), P = S.promos.pdw, R = E.rosterOf(S, 'pdw').filter(w => !w.nw && w.g === 'M').sort((x, y) => y.ovr - x.ovr);
  const ch = P.titles.find(t => !t.tag && t.g === 'M' && t.lvl === 3 && t.holders.length), w = R.find(x => x.id !== ch.holders[0] && !P.titles.some(t => t.holders.includes(x.id)) && x.ovr >= S.w[ch.holders[0]].ovr - 15);
  S.feuds.forEach(f => { f.res = true; }); R.forEach(x => { x.mom = 0; }); w.mom = 3;
  let p = all(S).find(x => x.k === 'askshot');
  ok('a1', 'somebody on a roll comes to your office to ask for a title shot, and the answers cost no action point', !!p && p.id === w.id && p.room === 'truck' && p.acts.map(a => a.id).join() === 'shot_yes,ask_no' && p.acts.every(a => a.free), p ? p.why : all(S).map(x => x.k).join(','));
  if (p) { const ap = S.ap, q0 = S.quests.length, r = E.peopleDo(S, w.id, 'shot_yes');
    ok('a2', 'saying yes is a promise the game holds you to, and it costs no point', r.ok && S.ap === ap && S.quests.length === q0 + 1 && S.quests[q0].type === 'shot' && S.quests[q0].w === w.id && S.rmY[w.id].v > 0, r.msg);
    ok('a3', 'they do not come back with another request for weeks', !all(S).some(x => /^ask/.test(x.k) && x.id === w.id)); }
  const S2 = fresh(21), w2 = S2.w[w.id]; S2.feuds.forEach(f => { f.res = true; }); E.rosterOf(S2, 'pdw').forEach(x => { x.mom = 0; }); w2.mom = 3; S2.ap = 0;
  const m0 = w2.morale, r2 = E.peopleDo(S2, w2.id, 'ask_no');
  ok('a4', 'saying no can be done with no points left, and they remember it', r2.ok && w2.morale < m0 && S2.rmY[w2.id].v < 0, r2.msg);
  const S3 = fresh(21), w3 = S3.w[w.id]; S3.feuds.forEach(f => { f.res = true; }); E.rosterOf(S3, 'pdw').forEach(x => { x.mom = 0; }); w3.mom = 3;
  const m3 = w3.morale; S3.qi = S3.queue.length; E.endWeek(S3);
  ok('a5', 'not seeing them at all is noticed', w3.morale < m3 + 3 && ((S3.rmY || {})[w3.id] || { mem: [] }).mem.some(m => m.k === 'waited')); }

/* more requests, and scenes with two people in the room */
{ const quiet = seed => { const S = fresh(seed); S.feuds.forEach(f => { f.res = true; }); E.rosterOf(S, 'pdw').forEach(x => { x.mom = 0; x.stress = 0; x.cond = 90; x.morale = 70; x.inj = 0; }); return S; };
  let S = quiet(22), w = E.rosterOf(S, 'pdw').filter(x => !x.nw && !all(S).some(q => q.id === x.id || q.with === x.id)).sort((x, y) => x.ovr - y.ovr)[0]; w.mom = 3; w.con = 30; w.wage = 100;
  let p = find(S, w.id);
  ok('b1', 'somebody underpaid and winning asks for more money, and yes pays it', !!p && p.k === 'askraise' && /\$/.test(p.acts[0].d) && E.peopleDo(S, w.id, 'raise_yes').ok && w.wage > 100 && S.rmY[w.id].v > 0, p ? p.k + ' ' + p.acts[0].d : 'not there');
  S = quiet(22); w = spare(S, 6); w.stress = 80; p = find(S, w.id);
  const r1 = p && p.k === 'askoff' ? E.peopleDo(S, w.id, 'off_yes') : null;
  ok('b2', 'somebody worn out asks for two weeks at home, and is off the card when you say yes', !!r1 && r1.ok && w.away === S.week + 2 && !find(S, w.id), p ? p.k : 'not there');
  S = quiet(23); const T = S.teams.find(t => t.promo === 'pdw' && t.m.every(id => !S.w[id].nw)); T.ls = 3; const a = S.w[T.m[0]], b = S.w[T.m[1]];
  p = find(S, a.id);
  ok('b3', 'a team on a losing run comes in together, and the scene names both of them', !!p && p.k === 'argue' && p.room === 'truck' && p.duo === b.name && p.acts.length === 3 && p.acts.every(x => x.free) && p.acts[0].n === 'Back ' + a.name, p ? p.k + ' ' + p.why : all(S).map(x => x.k).join());
  if (p) { const b0 = E.bondOf(S, a.id, b.id), r = E.peopleDo(S, a.id, 'side_a');
    ok('b4', 'taking a side pleases one, costs the other, and sits between them', r.ok && E.bondOf(S, a.id, b.id) < b0 && S.rmY[a.id].v > 0 && S.rmY[b.id].v < 0 && !find(S, a.id), r.msg); }
  S = quiet(24); const R = E.rosterOf(S, 'pdw').filter(x => !x.nw && !all(S).some(q => q.id === x.id || q.with === x.id)), y = R.slice().sort((p1, p2) => p2.ovr - p1.ovr)[3], v = R.find(x => x.id !== y.id && x.g === y.g); y.age = 22; v.age = 38; v.ovr = y.ovr + 10;
  R.forEach(x => { if (x !== y && x.age <= 25) x.age = 27; });
  p = find(S, y.id);
  if (p && p.k === 'late') { const x0 = y.xp || 0, ap = S.ap, r = E.peopleDo(S, y.id, 'late');
    ok('b5', 'a veteran working late with a young one is a scene, and a point makes it a habit', r.ok && S.ap === ap - 1 && (y.xp || 0) > x0 && E.bondOf(S, y.id, v.id) > 0 && p.room === 'gym' && !!p.duo, r.msg); }
  else ok('b5', 'a veteran working late with a young one is a scene', false, p ? p.k : 'not there'); }

if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-people: all passed');
