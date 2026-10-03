/* Plays 60 weeks as each company model and checks what makes it that model.  Run: node test-models.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const WEEKS = +process.argv[2] || 60, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const OF = { corporate: 'whw', outlaw: 'pdp', spectacle: 'ldd', tradition: 'lta', joshi: 'kjp', underdog: 'ttt' };
function play(id) {
  const S = E.newGame(id, 3, { name: 'R' }), st = { matches: 0, stip: 0, shows: 0, multi: 0, maxRisk: 0 };
  for (let wk = 0; wk < WEEKS && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) {
      const card = E.suggest(S), pr = E.preShow(S, card); if (pr) E.resolvePre(S, card, 0);
      if (E.validate(S, card).errors.length) { S.qi++; continue; }
      st.shows++; st.matches += card.length;
      st.stip += card.filter(m => m.stip && m.stip !== 'std').length;
      if (card.some(m => m.mt === '6man' || m.mt === '4way')) st.multi++;
      st.maxRisk = Math.max(st.maxRisk, S.promos[id].risk);
      E.runPlayerShow(S, card);
    }
    E.endWeek(S);
  }
  return { S, st };
}
const R = {};
['outlaw', 'spectacle', 'tradition', 'joshi', 'corporate'].forEach(m => { R[m] = play(OF[m]); });
{ const { st } = R.outlaw; const f = st.stip / st.matches; ok('pdp', 'outlaw: at least 30% of matches carry a stipulation', f >= 0.3, (100 * f).toFixed(0) + '%'); }
{ const { st } = R.spectacle; const f = st.multi / st.shows; ok('ldd', 'spectacle: four-way or six-man matches on most shows', f > 0.5, (100 * f).toFixed(0) + '% of shows'); }
{ const { st } = R.tradition; const f = st.multi / st.shows; ok('lta', 'tradition: six-man matches on most shows', f > 0.5, (100 * f).toFixed(0) + '% of shows'); }
{ const { S } = R.joshi; const r = E.rosterOf(S, 'kjp').filter(w => !w.roles || w.roles.indexOf('wrestler') >= 0); ok('kjp', 'joshi: the roster is all women', r.length > 0 && r.every(w => w.g === 'F'), r.length + ' on the roster'); }
{ const { st } = R.corporate; ok('whw', 'corporate: risk never above Mainstream', st.maxRisk <= 1, 'highest ' + E.RISKN[st.maxRisk]); }
{ // underdog: a castoff from a bigger company arrives with a point to prove
  const S = E.newGame(OF.underdog, 3, { name: 'R' }), P = S.promos[OF.underdog];
  const w = E.rosterOf(S, 'whw').filter(x => x.ovr <= P.image + 20).sort((a, b) => b.ovr - a.ovr)[0];
  w.promo = 'FA'; w.con = 0; w.cut = { from: 'whw', w: S.week - 1, img: S.promos.whw.image };
  const r = E.sign(S, w.id, E.ask(S, w) * 1.2, 48);
  ok('ttt', 'underdog: a castoff signs with chip set', r.ok && w.chip >= S.week, r.msg);
}
{ // the package check warns about the other gender in a gender-locked promotion
  const pkg = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')), man = pkg.workers.find(w => w.gender === 'M' && (!w.roles || w.roles.includes('wrestler')));
  const c = pkg.contracts.find(c => c.worker_id === man.id); c.promotion_id = 'kjp';
  const t = pkg.titles.find(t => t.promotion_id === 'kjp'); t.gender = 'M';
  const v = E.validateUniverse(pkg), w = v.warnings.map(x => x.msg).join(' | ');
  ok('kjp', 'a man and a men\'s title in the joshi promotion draw warnings', /signs only women/.test(w) && /men's title in a Joshi/.test(w), w.slice(0, 160));
}
{ // a very small all-women roster still gets a full suggested card
  const S = E.newGame('kjp', 3, { name: 'R' }), keep = E.rosterOf(S, 'kjp').filter(w => w.g === 'F' && !w.nw).sort((a, b) => b.ovr - a.ovr).slice(0, 12).map(w => w.id);
  E.rosterOf(S, 'kjp').forEach(w => { if (!w.nw && keep.indexOf(w.id) < 0) { w.promo = 'FA'; w.con = 0; } });
  let min = 99, shows = 0;
  for (let wk = 0; wk < 20 && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 1));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) E.resolvePre(S, c, 0); min = Math.min(min, c.length); shows++; if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S);
  }
  ok('kjp', 'twelve wrestlers still fill a card of at least three matches', min >= 3, 'smallest card ' + min + ' over ' + shows + ' shows');
}
{ // a contract can say how long someone has been with the company
  const pkg = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')), c = pkg.contracts.find(c => c.promotion_id === 'lta');
  c.tenure_weeks = 130; E.useUniverse(pkg);
  const S = E.newGame('lta', 3, { name: 'R' }), w = S.w.find(x => x.name === pkg.workers.find(y => y.id === c.worker_id).ring_name);
  ok('lta', 'tenure_weeks on a contract reaches the wrestler (w.jw)', w && E.tenure(S, w.id) === 130, 'tenure ' + (w && E.tenure(S, w.id)));
  E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
}
{ // multi-man matches on a brand's show use only that brand's wrestlers
  let bad = 0, n = 0;
  for (const id of ['lta', 'ldd']) {
    const S = E.newGame(id, 3, { name: 'R' }), P = S.promos[id]; P.brands = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
    E.rosterOf(S, id).forEach((w, i) => { w.brand = i % 2 ? 'a' : 'b'; });
    for (const b of ['a', 'b']) { S.queue[0].brand = b; S.qi = 0; for (let k = 0; k < 5; k++) E.suggest(S).forEach(m => [].concat(...m.sides).forEach(wid => { n++; if (S.w[wid].promo === id && S.w[wid].brand !== b) bad++; })); }
  }
  ok('lta', 'multi-man matches respect brand splits', bad === 0, bad + ' wrong of ' + n);
}
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-models: all passed');
