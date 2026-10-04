/* Shows and belts made during a game. A new belt or a new weekly show is a big moment: it takes an occasion, the
   player gets one belt a year and one show in two at most, and rivals add them rarely.  Run: node test-create.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
function week(S, st) {
  S.inbox.filter(e => !e.done).forEach(e => { try { E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1); } catch (x) { st.errs++; st.why = st.why || x.message; } });
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) {
    try { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); } if (E.validate(S, card).errors.length) { S.qi++; continue; } st.names[S.queue[S.qi].name] = 1; E.runPlayerShow(S, card); st.shows++; }
    catch (x) { st.errs++; st.why = st.why || x.message; S.qi++; }
  }
  try { E.endWeek(S); } catch (x) { st.errs++; st.why = st.why || x.message; }
}
const net = S => { const P = S.promos[S.player], h = P.hist.slice(-8); return h.length ? Math.round(h.reduce((a, x) => a + (x.net || 0), 0) / h.length) : 0; };

E.universe().promotions.forEach(d => {
  const id = d.id, S = E.newGame(id, 3, { name: 'R' }), P = S.promos[id], st = { errs: 0, shows: 0, names: {}, first: 0 };
  for (let i = 0; i < 9 && !S.over; i++) week(S, st);
  const before = net(S), I = E.makeInfo(S);
  ok(id, 'the window lists the occasions for a belt and for a show, each with its reason', I.beltOcc.length >= 1 && I.beltOcc.every(o => o.n && o.say && o.what) && I.showOcc.length === 3 && I.showOcc.every(o => o.n && o.say), I.beltOcc.map(o => o.k + (o.open ? ' (open)' : '')).join(', '));
  /* a belt: only on an occasion, and one a year */
  const open = I.beltOcc.filter(o => o.open), cash0 = P.cash, n0 = P.titles.length;
  let made = null;
  if (!open.length || I.beltWait) ok(id, 'with nothing that calls for a belt, one is refused and the game says why', !E.makeTitle(S, { name: 'Test Lantern Title' }).ok && /Nothing has happened that calls for a new belt|big moment|roster this size/.test(E.makeTitle(S, { name: 'Test Lantern Title' }).msg), E.makeTitle(S, { name: 'Test Lantern Title' }).msg.slice(0, 70));
  else {
    const o = open[0];
    ok(id, 'a belt with no name is refused', !E.makeTitle(S, { name: ' ', occ: o.k }).ok);
    ok(id, 'a belt with a name already used is refused', !E.makeTitle(S, { name: P.titles[0].name, occ: o.k }).ok);
    ok(id, 'a belt cannot be asked for on an occasion that is not open', !E.makeTitle(S, { name: 'Test Lantern Title', occ: 'tag:X' }).ok && I.beltOcc.filter(x => !x.open).every(x => !E.makeTitle(S, { name: 'Test Lantern Title', occ: x.k }).ok));
    const mt = E.makeTitle(S, { name: 'Test Lantern Title', occ: o.k });
    if (mt.ok) { made = P.titles[P.titles.length - 1];
      ok(id, 'a new belt is what its occasion calls for: vacant, paid for, with little prestige', P.titles.length === n0 + 1 && made.g === o.g && made.tag === o.tag && made.lvl === o.lvl && made.holders.length === 0 && P.cash < cash0 && made.prestige <= 60 && made.why === o.n, o.k + ': ' + o.what);
      ok(id, 'it is on the company’s record with its occasion', P.grown[0].t === 'belt' && P.grown[0].n === 'Test Lantern Title' && P.grown[0].why === o.n && P.mk.belt === S.week);
      const again = E.makeTitle(S, { name: 'Second Lantern Title' });
      ok(id, 'a company does not add two belts in a year', !again.ok && /big moment/.test(again.msg) && /big moment/.test(E.makeInfo(S).beltWhy), again.msg.slice(0, 80));
    } else ok(id, 'a belt was refused for a stated reason', /costs|roster/.test(mt.msg), mt.msg);
  }
  /* a show: not in a booker's first year, only on an occasion, and one in two years */
  const s0 = P.shows.length, early = E.makeShow(S, { name: 'Test Night Lantern' });
  ok(id, 'the network wants a year of your shows before it talks about another night', !early.ok && (/year of your shows/.test(early.msg) || /Three weekly shows|roster of|costs/.test(early.msg)), early.msg.slice(0, 80));
  P.mk.t0 = S.week - 48;
  let ms = null, tries = 0, added = false;
  const why1 = E.makeInfo(S).showWhy;
  if (!E.makeInfo(S).showOcc.some(o => o.open) && !/Three weekly shows|roster of|costs/.test(why1)) {
    ok(id, 'with nothing that calls for another show, the game says so', /Nothing has happened that calls for another weekly show/.test(why1), why1.slice(0, 70));
    if (P.image >= 44) { P.mk.img = P.image - 6; P.image = Math.max(P.image, 50); }   // then a boom: popularity up six points since the game began
  }
  if (!E.makeInfo(S).showWhy || /network will not/.test(E.makeInfo(S).showWhy)) { do { S.showAsk = null; ms = E.makeShow(S, { name: 'Test Night Lantern' }); tries++; } while (!ms.ok && tries < 40 && !E.makeInfo(S).showWhy.replace(/The network will not.*/, '')); }
  added = !!(ms && ms.ok);
  if (added) {
    ok(id, 'a new weekly show joins the schedule as a small show, with its occasion on record', P.shows.length === s0 + 1 && P.shows[s0].mult === 0.4 && isFinite(P.fixed) && isFinite(P.inc0) && !!P.shows[s0].why && P.grown[0].t === 'show' && P.mk.show === S.week, tries + ' asks, ' + P.shows[s0].why);
    const again = E.makeShow(S, { name: 'Another Night' });
    ok(id, 'a company does not launch two shows in two years', !again.ok && /once in years|Three weekly shows/.test(again.msg), again.msg.slice(0, 80));
    if (!made && !E.makeInfo(S).beltWait) ok(id, 'a new show is an occasion for a title of its own', E.makeInfo(S).beltOcc.some(o => /^show:/.test(o.k) && o.open));
  } else ok(id, 'a show was refused for a stated reason', !!E.makeInfo(S).showWhy, E.makeInfo(S).showWhy.slice(0, 80));
  for (let i = 0; i < 26 && !S.over; i++) week(S, st);
  if (added && !S.over) ok(id, 'the new show ran, and its first night was marked as an occasion', !!st.names['Test Night Lantern'] && S.reports.concat(st.reps || []).some(r => r.firstNight) || P.shows.some(x => x.name === 'Test Night Lantern' && x.aired), 'aired week ' + (P.shows.find(x => x.name === 'Test Night Lantern') || {}).aired);
  if (made && !S.over) { const t = P.titles.find(x => x.name === 'Test Lantern Title'); ok(id, 'the new belt found a first champion through the suggested cards, and that night was marked', !!t && (t.holders.length > 0 || (t.hist || []).length > 0) && t.crowned > 0, t ? 'crowned week ' + t.crowned + ', defences ' + t.defs + ', prestige ' + Math.round(t.prestige) : 'gone'); }
  const after = net(S);
  /* retire and cancel */
  if (made && !S.over) { const t = P.titles.find(x => x.name === 'Test Lantern Title'), r = E.dropTitle(S, t.id); ok(id, 'the belt can be retired, or the game says why not', r.ok ? !P.titles.some(x => x.id === t.id) && P.oldTitles[0].name === 'Test Lantern Title' : r.msg.length > 10, r.ok ? '' : r.msg); }
  if (added && !S.over) { const sh = P.shows.find(x => x.name === 'Test Night Lantern'), r = E.dropShow(S, sh.id); ok(id, 'the show can be cancelled', r.ok && P.shows.length === s0, r.msg); }
  ok(id, 'a company cannot cancel its last show', P.shows.length > 1 || !E.dropShow(S, P.shows[0].id).ok);
  for (let i = 0; i < 6 && !S.over; i++) week(S, st);
  ok(id, 'no errors and no bad numbers over ' + S.week + ' weeks', st.errs === 0 && JSON.stringify(S).indexOf('NaN') < 0 && isFinite(P.cash), st.errs ? st.errs + ' errors: ' + st.why : 'weekly net before ' + before + ', with the extras ' + after + (S.over ? ', game over: ' + S.over : ''));
});

/* rivals: a new belt or a new show is rare, has an occasion, and is news */
{ const S = E.newGame('pdw', 5, { name: 'R' }), st = { errs: 0, shows: 0, names: {} }, t0 = {}, s0 = {};
  S.order.forEach(p => { t0[p] = S.promos[p].titles.length; s0[p] = S.promos[p].shows.length; });
  let firstYear = 0;
  for (let i = 0; i < 150 && !S.over; i++) { week(S, st); if (S.week === 48) firstYear = S.order.filter(p => p !== S.player).reduce((a, p) => a + (S.promos[p].grown || []).filter(g => g.t === 'show').length, 0); }
  const rv = S.order.filter(p => p !== S.player), all = rv.reduce((a, p) => a.concat((S.promos[p].grown || []).map(g => Object.assign({ p }, g))), []);
  const belts = all.filter(g => g.t === 'belt').sort((a, b) => a.w - b.w), shows = all.filter(g => g.t === 'show').sort((a, b) => a.w - b.w), gaps = L => L.slice(1).map((g, i) => g.w - L[i].w);
  const made = rv.reduce((a, p) => a.concat(S.promos[p].titles.filter(t => t.born)), []);
  ok('world', 'over three years the rivals together add a few belts and shows, not one each every year', belts.length + shows.length >= 1 && belts.length <= 4 && shows.length <= 2, all.map(g => 'week ' + g.w + ' ' + g.p + ' ' + g.t + ': ' + g.n + ' (' + g.why + ')').join(' | '));
  ok('world', 'every one has its occasion on record, and was news', all.every(g => g.why && g.n && S.promos[g.p].name) && all.filter(g => g.t !== 'cut').every(g => g.why.length > 8));
  ok('world', 'no rival launches a show in the first year', firstYear === 0 && shows.every(g => g.w > 48));
  ok('world', 'new belts across the rivals come at least 36 weeks apart, and new shows at least 72', gaps(belts).every(x => x >= 36) && gaps(shows).every(x => x >= 72), 'belts ' + gaps(belts).join(',') + ' shows ' + gaps(shows).join(','));
  ok('world', 'no rival adds two belts in a year or two shows in two', rv.every(p => { const g = S.promos[p].grown || [], b = g.filter(x => x.t === 'belt').map(x => x.w).sort((a, c) => a - c), s = g.filter(x => x.t === 'show').map(x => x.w).sort((a, c) => a - c); return gaps(b.map(w => ({ w }))).every(x => x >= 48) && gaps(s.map(w => ({ w }))).every(x => x >= 96); }));
  ok('world', 'no rival has more than three weekly shows or too many belts', rv.every(p => S.promos[p].shows.length <= 3 && S.promos[p].titles.length <= 14));
  ok('world', 'rival belts made a year ago have champions', made.filter(t => S.week - t.born > 40).every(t => t.holders.length > 0 || (t.hist || []).length > 0), made.map(t => t.name + (t.holders.length ? '' : ' (vacant)')).join(', '));
  ok('world', 'the player was not given belts or shows', S.promos.pdw.titles.length === t0.pdw && S.promos.pdw.shows.length === s0.pdw);
  ok('world', 'no errors', st.errs === 0, st.why); }

if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-create: all passed');
