/* Shows and belts made during a game: the player's own, and what rivals add each year.  Run: node test-create.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
function week(S, st) {
  S.inbox.filter(e => !e.done).forEach(e => { try { E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1); } catch (x) { st.errs++; st.why = st.why || x.message; } });
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) {
    try { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) E.resolvePre(S, card, 0); if (E.validate(S, card).errors.length) { S.qi++; continue; } st.names[S.queue[S.qi].name] = 1; E.runPlayerShow(S, card); st.shows++; }
    catch (x) { st.errs++; st.why = st.why || x.message; S.qi++; }
  }
  try { E.endWeek(S); } catch (x) { st.errs++; st.why = st.why || x.message; }
}
const net = S => { const P = S.promos[S.player], h = P.hist.slice(-8); return h.length ? Math.round(h.reduce((a, x) => a + (x.net || 0), 0) / h.length) : 0; };

E.universe().promotions.forEach(d => {
  const id = d.id, S = E.newGame(id, 3, { name: 'R' }), P = S.promos[id], st = { errs: 0, shows: 0, names: {} };
  for (let i = 0; i < 9 && !S.over; i++) week(S, st);
  const before = net(S), I = E.makeInfo(S), g = I.gender || 'M';
  /* a belt */
  ok(id, 'a belt with no name is refused', !E.makeTitle(S, { name: ' ', g, lvl: 2 }).ok);
  ok(id, 'a belt with a name already used is refused', !E.makeTitle(S, { name: P.titles[0].name, g, lvl: 2 }).ok);
  const cash0 = P.cash, n0 = P.titles.length, mt = E.makeTitle(S, { name: 'Test Lantern Title', g, lvl: 3 });
  if (mt.ok) {
    const t = P.titles[P.titles.length - 1];
    ok(id, 'a new belt is vacant, costs money and starts with little prestige', P.titles.length === n0 + 1 && t.holders.length === 0 && P.cash < cash0 && t.prestige <= 60, 'prestige ' + t.prestige + ', level ' + t.lvl);
    ok(id, 'a second top title is not allowed while one exists', t.lvl < 3 || !P.titles.some(x => x !== t && x.g === t.g && !x.tag && x.lvl >= 3));
  } else ok(id, 'a belt was refused for a stated reason', /roster|belts|costs|only/.test(mt.msg), mt.msg);
  /* a show: ask until the network says yes, as a player would over a few months */
  let ms = null, tries = 0; const s0 = P.shows.length;
  if (!I.showWhy || /network will not/.test(I.showWhy)) { do { S.showAsk = null; ms = E.makeShow(S, { name: 'Test Night Lantern' }); tries++; } while (!ms.ok && tries < 40 && !E.makeInfo(S).showWhy.replace(/The network will not.*/, '')); }
  const added = !!(ms && ms.ok);
  if (added) ok(id, 'a new weekly show joins the schedule as a small show', P.shows.length === s0 + 1 && P.shows[s0].mult === 0.4 && isFinite(P.fixed) && isFinite(P.inc0), tries + ' asks');
  else ok(id, 'a show was refused for a stated reason', !!E.makeInfo(S).showWhy, E.makeInfo(S).showWhy);
  for (let i = 0; i < 26 && !S.over; i++) week(S, st);
  if (added && !S.over) ok(id, 'the new show ran', !!st.names['Test Night Lantern']);
  if (mt.ok && !S.over) { const t = P.titles.find(x => x.name === 'Test Lantern Title'); ok(id, 'the new belt found a champion through the suggested cards', !!t && t.holders.length > 0, t ? 'defences ' + t.defs + ', prestige ' + Math.round(t.prestige) : 'gone'); }
  const after = net(S);
  /* retire and cancel */
  if (mt.ok && !S.over) { const t = P.titles.find(x => x.name === 'Test Lantern Title'), r = E.dropTitle(S, t.id); ok(id, 'the belt can be retired, or the game says why not', r.ok ? !P.titles.some(x => x.id === t.id) && P.oldTitles[0].name === 'Test Lantern Title' : r.msg.length > 10, r.ok ? '' : r.msg); }
  if (added && !S.over) { const sh = P.shows.find(x => x.name === 'Test Night Lantern'), r = E.dropShow(S, sh.id); ok(id, 'the show can be cancelled', r.ok && P.shows.length === s0, r.msg); }
  ok(id, 'a company cannot cancel its last show', P.shows.length > 1 || !E.dropShow(S, P.shows[0].id).ok);
  for (let i = 0; i < 6 && !S.over; i++) week(S, st);
  ok(id, 'no errors and no bad numbers over ' + S.week + ' weeks', st.errs === 0 && JSON.stringify(S).indexOf('NaN') < 0 && isFinite(P.cash), st.errs ? st.errs + ' errors: ' + st.why : 'weekly net before ' + before + ', with the extras ' + after + (S.over ? ', game over: ' + S.over : ''));
});

/* rivals grow once a year */
{ const S = E.newGame('pdw', 5, { name: 'R' }), st = { errs: 0, shows: 0, names: {} }, t0 = {}, s0 = {};
  S.order.forEach(p => { t0[p] = S.promos[p].titles.length; s0[p] = S.promos[p].shows.length; });
  for (let i = 0; i < 64 && !S.over; i++) week(S, st);
  const rv = S.order.filter(p => p !== S.player), dT = rv.reduce((a, p) => a + S.promos[p].titles.length - t0[p], 0), dS = rv.reduce((a, p) => a + S.promos[p].shows.length - s0[p], 0);
  const made = rv.reduce((a, p) => a.concat(S.promos[p].titles.filter(t => t.born)), []);
  ok('world', 'over two new years rivals added belts or shows', dT + Math.abs(dS) > 0, 'belts ' + (dT >= 0 ? '+' : '') + dT + ', shows ' + (dS >= 0 ? '+' : '') + dS + ' across ' + rv.length + ' rivals');
  ok('world', 'no rival has more than three weekly shows or too many belts', rv.every(p => S.promos[p].shows.length <= 3 && S.promos[p].titles.length <= 14));
  ok('world', 'rival belts made a year ago have champions', made.filter(t => S.week - t.born > 40).every(t => t.holders.length > 0), made.map(t => t.name + (t.holders.length ? '' : ' (vacant)')).join(', '));
  ok('world', 'the player was not given belts or shows', S.promos.pdw.titles.length === t0.pdw && S.promos.pdw.shows.length === s0.pdw);
  ok('world', 'no errors', st.errs === 0, st.why); }

if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-create: all passed');
