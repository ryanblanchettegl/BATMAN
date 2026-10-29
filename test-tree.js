/* The booker's skill tree (docs/plans/booker-progression.md, engine/65-youtree.ts): four branches in tiers, a tier
   opens as you spend in its branch, each bonus raises its number when taken (capped where it was), skills whose effect
   is still to come cannot be taken, the levelling pace, a booker carried to a new company, and the same seed giving the
   same game. Run: node test-tree.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
const play = (S, wk) => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S); if (S.over) { S.over = null; S.owner.trust = 60; } };
for (const uni of ['parody', 'public_domain']) {
  E.useUniverse(JSON.parse(fs.readFileSync('universes/' + uni + '.json', 'utf8')));
  const id = uni === 'parody' ? 'ewe' : 'pdw', S = E.newGame(id, 3, { name: 'R' }), b = S.booker;
  const I = E.treeInfo(S), nodes = I.branches.flatMap(br => br.tiers.flatMap(t => t.nodes.map(n => Object.assign({ br: br.id, t: t.t }, n))));
  ok(I.branches.map(x => x.n).join() === 'Creative,Office,Locker room,Eye', uni + ': four branches: Creative, Office, Locker room, Eye');
  ok(I.total >= 35 && I.total <= 50, uni + ': the whole tree costs ' + I.total + ' points: a long career fills it');
  ok(Object.values(b.sk).every(v => v === 0) && I.owned === 0, uni + ': a new booker starts with an empty tree');
  { const before = JSON.stringify(S); E.treeInfo(S); E.treeInfo(S); ok(JSON.stringify(S) === before && JSON.stringify(E.treeInfo(S)) === JSON.stringify(I), uni + ': reading the tree changes nothing'); }
  ok(I.stand && I.stand.creative.v === 0 && I.stand.creative.cap === 5, uni + ': the tree says where each number stands (Creative 0 of 5)');
  ok(new Set(nodes.map(n => n.n)).size === nodes.length && new Set(nodes.filter(n => n.k !== 'bonus').map(n => n.d)).size === nodes.filter(n => n.k !== 'bonus').length, uni + ': no two skills share a name, and no two actions say the same thing');
  ok(nodes.filter(n => n.k === 'bonus').every(n => /\+1:/.test(n.d)), uni + ': every bonus says plainly what it adds');
  b.pts = 0; ok(!E.treeSpend(S, 'cr_pen').ok, uni + ': no points, nothing taken');
  ok(!nodes.some(n => n.soon), uni + ': every skill in the tree can be taken (no skill is still to come)');
  b.pts = 1; const t1 = nodes.find(n => n.br === 'creative' && n.t === 1 && !n.soon); ok(!E.treeSpend(S, t1.id).ok, uni + ': a locked tier cannot be taken yet');
  // take every bonus in order of tier: each raises its number by one when taken
  b.pts = 999; let raised = true;
  for (const t of [0, 1, 2, 3]) nodes.filter(n => n.t === t).forEach(n => { const v0 = n.k === 'bonus' ? b.sk[n.sk] : 0, r = E.treeSpend(S, n.id); if (!r.ok || (n.k === 'bonus' && b.sk[n.sk] !== v0 + 1)) raised = false; });
  ok(raised, uni + ': every bonus opens in its turn and raises its number by one when taken');
  ok(nodes.every(n => b.tree[n.id]), uni + ': everything that can be taken can be filled');
  ok(b.sk.creative === 5 && b.sk.talk === 5 && b.sk.motivator === 5 && b.sk.eye === 3 && b.sk.clout === 3, uni + ': a full tree reaches the old caps and no further: ' + JSON.stringify(b.sk));
  // booking power: a level adds none, and a full tree adds only Clout's three
  { const lv = b.lvl, g0 = E.bpGrantOf(S); b.lvl = 40; ok(E.bpGrantOf(S) === g0, uni + ': a high level adds no booking power (' + g0 + ' a week either way)'); b.lvl = lv;
    const sk = b.sk; b.sk = { creative: 0, talk: 0, eye: 0, motivator: 0, clout: 0 }; const g1 = E.bpGrantOf(S); b.sk = sk;
    ok(g0 - g1 === 3, uni + ': a full tree adds three booking power a week, no more (' + g1 + ' to ' + g0 + ')'); }
  // a booker carried to a new company keeps the tree and what it adds
  const T = E.newGame(id, 4, { name: 'R', booker: JSON.parse(JSON.stringify(b)) });
  ok(JSON.stringify(T.booker.tree) === JSON.stringify(b.tree) && JSON.stringify(T.booker.sk) === JSON.stringify(b.sk), uni + ': a booker carried to a new company keeps the tree and its numbers');
}
// step 4: what each action and trade-off does (engine/99-youacts.ts and the one-line hooks)
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));
const fresh = (seed, ids) => { const S = E.newGame('ewe', seed || 3, { name: 'R' }); S.booker.tree = {}; (ids || []).forEach(id => { S.booker.tree[id] = 1; }); return S; };
{ const A = fresh(3), B = fresh(3, ['lr_extra']); ok(E.backstage(B).max === E.backstage(A).max + 1, 'One more hour: one more action point a week (' + E.backstage(A).max + ' to ' + E.backstage(B).max + ')'); }
{ const held = S => { E.dirInfo(S); const w = S.w.find(x => x.promo === S.player && !x.nw); S.dir.held.push({ id: 999001, type: 'losing', w: w.id, text: 'test', choices: ['a', 'b'], held: S.week }); return E.dirDesk(S).held.find(h => h.id === 999001); };
  ok(held(fresh(3)).left == null, 'without Smell trouble a waiting matter does not say how long it waits');
  ok(held(fresh(3, ['ey_smell'])).left === 3, 'Smell trouble: a waiting matter says it waits 3 more weeks');
  ok(held(fresh(3, ['ey_smell', 'lr_patience'])).left === 4, 'Patience: a held matter waits a week longer (4)');
  ok(E.dirDesk(fresh(3)).more == null && /pressure|pressing/.test(E.dirDesk(fresh(3, ['ey_word'])).more || ''), 'Read the weather: the desk says what is driving the week'); }
{ const A = fresh(3), B = fresh(3, ['of_clause']), fa = S => S.w.filter(w => w.promo === 'FA' && !w.nw), most = S => Math.max(...fa(S).map(w => E.clauses(S, w.id).length));
  ok(most(A) <= 3 && most(B) <= 4 && most(B) >= most(A), 'One more clause: a deal can take four clauses, never more (' + most(A) + ' to ' + most(B) + ')'); }
{ const A = fresh(3), B = fresh(3, ['of_lean']), c0 = A.promos.ewe.cash; E.endWeek(A); E.endWeek(B);
  ok(B.promos.ewe.cash > A.promos.ewe.cash, 'Lean books: the wage bill is smaller, so more cash after a week');
  const mt = S => { let m = 0; for (let i = 0; i < 6; i++) E.endWeek(S); S.w.filter(w => w.promo === 'ewe' && !w.nw).forEach(w => { m += w.morale; }); return m; };
  ok(mt(B) < mt(A), 'Lean books: and the roster\'s mood settles lower'); }
{ const A = fresh(3), B = fresh(3, ['of_sweeten']);
  ok(!E.plotInfo(A).acts.some(a => a.id === 'sweeten') && !E.plotDo(A, 'sweeten', {}).ok, 'without Sweeten the deal, Storylines does not offer it');
  B.bp = 5; const r = E.plotDo(B, 'sweeten', {}), sh = B.promos.ewe.shows.find(x => x.sweet);
  ok(E.plotInfo(B).acts.some(a => a.id === 'sweeten') && r.ok && B.bp === 2 && sh, 'Sweeten the deal: three booking power marks the next renewal: ' + r.msg); }
{ const S = fresh(3, ['lr_meet']), me = S.w.filter(w => w.promo === 'ewe' && !w.nw && !(w.inj > 0) && !w.camp); let pair = null, calm = null;
  for (const a of me) for (const b of me) if (a.id < b.id) { const v = E.rel(S, a.id, b.id).bond; if (!pair && v <= -40) pair = [a, b, v]; if (!calm && v > -5) calm = [a, b]; }
  ok(!E.backstage(fresh(3)).places.find(p => p.id === 'court').acts.some(x => x.id === 'meet'), 'without Closed-door meeting, court has no meeting');
  ok(calm && !E.apDo(S, 'court', 'meet', { a: calm[0].id, b: calm[1].id }).ok, 'a meeting needs real heat between the two');
  ok(pair, 'the world has two people with real heat to sit down');
  if (pair) { const r = E.apDo(S, 'court', 'meet', { a: pair[0].id, b: pair[1].id }), now = E.rel(S, pair[0].id, pair[1].id).bond;
    ok(r.ok && now > pair[2], 'Closed-door meeting: the heat between them drops (' + pair[2] + ' to ' + now + ')');
    ok(E.backstage(S).places.find(p => p.id === 'court').acts.find(x => x.id === 'meet').off, 'and it waits a month before the next'); } }
{ // Call an audible: the main event offers one call, and its answer decides the finish
  const S = fresh(3, ['cr_audible']); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  let c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); }
  E.liveBegin(S, c); let seen = null, rep = null;
  for (let g = 0; g < 400 && !rep; g++) { const r = E.liveNext(S); if (r.event) { const k = r.event.kind; if (k === 'callaud') { seen = r.event; E.liveDecide(S, 2); } else E.liveDecide(S, r.event.safe || 0); } else if (r.done) rep = r.rep; }
  ok(seen && seen.choices.length === 3, 'Call an audible: the main event offers the call');
  const last = rep && rep.matches && rep.matches[rep.matches.length - 1];
  ok(!seen || !last || !last.winners || last.winners.length, 'and the show runs to its end with the finish called'); }
{ const sp = S => { S.sponsors = [{ name: 'Test Cola', type: 'image', val: 999, weeks: 6, text: 'A test' }]; E.endWeek(S); return S.sponsors.some(x => x.name === 'Test Cola'); };
  const A = fresh(3), B = fresh(3, ['of_sponsor']);
  ok(!sp(A), 'a sponsor whose terms are broken walks at the end of the week');
  ok(sp(B) && (E.endWeek(B), !B.sponsors.some(x => x.name === 'Test Cola')), 'Sponsor patience: it gives you one more week, then walks'); }
{ let a = 0, b = 0;
  for (const seed of [3, 4, 5, 6, 7, 8]) { const A = fresh(seed), B = fresh(seed, ['ey_tape']), cA = E.suggest(A), cB = E.suggest(B);
    const n = (S, c) => E.agentReads(S, c).reduce((t, r) => t + (r ? r.lines.filter(l => l.src === 'read').length : 0), 0); a += n(A, cA); b += n(B, cB); }
  ok(b > a, 'Watch the tape: the road agent reads more (' + a + ' reads to ' + b + ' over six cards)'); }
{ const aud = ids => { const S = fresh(3, ids); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } E.liveBegin(S, c);
    for (let g = 0; g < 400; g++) { const r = E.liveNext(S); if (r.event) E.liveDecide(S, r.event.kind === 'callaud' ? 1 : (r.event.safe || 0)); else if (r.done) break; }
    let v = 0; Object.values(S.rmY || {}).forEach(e => e.mem.forEach(m => { if (m.k === 'audible' && m.v > 0) v = Math.max(v, m.v); })); return v; };
  const v0 = aud(['cr_audible']), v1 = aud(['cr_audible', 'lr_hard']);
  ok(v0 === 3 && v1 > 0 && v1 < v0, 'Hard but fair: a good turn is remembered a little less warmly (' + v0 + ' to ' + v1 + ')'); }
{ const A = fresh(3), B = fresh(3, ['cr_shock']), w = A.w.find(x => x.promo === 'ewe' && !x.nw && !(x.inj > 0));
  const m = S => { const L = E.segLook(S, { k: 'interview', who: [w.id] }); return L && L.ok ? (L.mean != null ? L.mean : L.mid) : null; };
  ok(m(A) != null && m(B) > m(A), 'Shock value: a promo is expected to land harder (' + m(A) + ' to ' + m(B) + ')'); }
{ const fr = ids => { const S = fresh(3, ids), me = S.w.filter(w => w.promo === 'ewe' && !w.nw && !(w.inj > 0)).sort((x, y) => y.ovr - x.ovr);
    let r = null; for (let i = 2; i < me.length && !(r && r.ok); i++) r = E.storyStart(S, me[0].id, me[i].id);
    const f = S.feuds.filter(x => !x.res).slice(-1)[0]; if (!f) return null; f.fresh = 20; S.bp = 9; E.storyDo(S, f.id, 'stakes');
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    return f.fresh; };
  const f0 = fr([]), f1 = fr(['cr_third']);
  ok(f0 != null && f1 > f0, 'A third act: a twist gives a story more room (freshness ' + f0 + ' to ' + f1 + ')'); }
// the levelling pace: about 6 the first year, 4 the second (Ryan's answer), measured in a headless game
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));
{ const S = E.newGame('ewe', 3, { name: 'R' }), at = [];
  for (let wk = 1; wk <= 96; wk++) { play(S, wk); if (wk === 48 || wk === 96) at.push(S.booker.lvl); }
  ok(at[0] >= 5 && at[0] <= 8, 'about six levels the first year: level ' + at[0] + ' after 48 weeks');
  ok(at[1] - at[0] >= 3 && at[1] - at[0] <= 5, 'about four the second: level ' + at[1] + ' after 96 weeks'); }
// the same seed, with skills taken, gives the same game
{ const run = () => { const S = E.newGame('ewe', 9, { name: 'R' }); for (let wk = 1; wk <= 12; wk++) { if (S.booker.pts) E.treeInfo(S).branches.forEach(br => br.tiers.forEach(t => t.nodes.forEach(n => { if (n.can) E.treeSpend(S, n.id); }))); play(S, wk); } return JSON.stringify(S); };
  ok(run() === run(), 'the same seed with skills taken gives the same game'); }
ok(!E.spendPoint(null, 'creative'), 'the old one-point spend is gone');
fails.forEach(f => console.log('FAIL', f));
console.log(fails.length ? 'test-tree: ' + fails.length + ' failures' : 'test-tree: all passed');
process.exit(fails.length ? 1 : 0);
