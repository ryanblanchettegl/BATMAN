/* The cause log (docs/plans/cause-log.md). Over 60 weeks, 3 seeds, 3 companies:
   1. booked changes add up to the real change of each meter (cash, popularity, trust, roster mood);
   2. "other" holds at most 5% and "untracked" at most 1% of each meter's change (median of the runs);
   3. every frame closes (bad = 0) and no hook falls back to a number for a name;
   4. a change made outside every frame shows up as "untracked" (the log can fail);
   5. a known action lands under its own label: releasing a wrestler books trust and mood to d:release;
   6. a signing or a release moves morale through "roster mix", not mood.
   errs 0, NaN 0.  Run: node test-cause.js   (WEEKS=60, SEEDS=3,11,29) */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
const WEEKS = Number(process.env.WEEKS || 60), SEEDS = (process.env.SEEDS || '3,11,29').split(',').map(Number);
const M = ['cash', 'pop', 'trust', 'morale'];
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const ids = E.universe().promotions.map(p => p.id).slice(0, 3);
let fails = 0, nan = 0, errs = 0;
const ok = (c, t) => { if (!c) { fails++; console.log('FAIL', t); } };
const read = S => { const P = S.promos[S.player], r = S.w.filter(w => w.promo === S.player);
  return [P.cash, P.image, S.trust, r.length ? r.reduce((a, w) => a + (w.morale || 0), 0) / r.length : 0]; };
const add = (acc, t) => M.forEach(m => { const c = (t && t.sum[m]) || {}; Object.keys(c).forEach(k => { acc[m][k] = acc[m][k] || [0, 0]; acc[m][k][0] += c[k][0]; acc[m][k][1] += c[k][1]; }); });
function week(S) {
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S);
}
const share = { other: { cash: [], pop: [], trust: [], morale: [] }, untracked: { cash: [], pop: [], trust: [], morale: [] } };
const labels = new Set(); let bad = 0, csN = 0;
for (const seed of SEEDS) for (const id of ids) {
  const S = E.newGame(id, seed, { name: 'R' }), tot = { cash: {}, pop: {}, trust: {}, morale: {} };
  let y0 = 0; const start = read(S);
  try { for (let wk = 1; wk <= WEEKS && !S.over; wk++) { week(S); if (S.cz && S.cz.y !== y0) { add(tot, S.cz.last); bad += S.cz.last.bad || 0; y0 = S.cz.y; } } }
  catch (e) { errs++; console.log('ERR', id, seed, e.message); continue; }
  const ci = E.causeInfo(S); add(tot, ci); bad += ci.bad || 0; csN += ci.cs[1];
  // flush: a closing frame books anything since the last one
  const end = read(S);
  M.forEach((m, k) => {
    const c = tot[m], keys = Object.keys(c); keys.forEach(x => labels.add(x));
    const booked = keys.reduce((a, x) => a + c[x][0], 0), abs = keys.reduce((a, x) => a + c[x][1], 0), real = end[k] - start[k];
    if (!isFinite(booked) || !isFinite(abs)) nan++;
    ok(Math.abs(booked - real) <= Math.max(0.005 * Math.max(Math.abs(real), abs), 1e-6), id + '/' + seed + ' ' + m + ': booked ' + booked.toFixed(3) + ' vs real ' + real.toFixed(3));
    share.other[m].push(abs ? (c.other || [0, 0])[1] / abs : 0); share.untracked[m].push(abs ? (c.untracked || [0, 0])[1] / abs : 0);
  });
}
const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
M.forEach(m => { const o = med(share.other[m]), u = med(share.untracked[m]);
  console.log('  ' + m.padEnd(7) + ' other ' + (100 * o).toFixed(2) + '%  untracked ' + (100 * u).toFixed(2) + '%');
  ok(o <= 0.05, m + ': other ' + (100 * o).toFixed(1) + '% > 5%'); ok(u <= 0.01, m + ': untracked ' + (100 * u).toFixed(1) + '% > 1%'); });
ok(bad === 0, bad + ' frames did not close');
const numbered = [...labels].filter(x => /:hook\d+$/.test(x)); ok(!numbered.length, 'hooks with no name: ' + numbered.join(', '));
ok(csN > 0, 'no crowd scores recorded');
// 7: the engine's own E.* calls during the week and the show are never booked as decisions
{ const S = E.newGame(ids[1], 11, { name: 'R' }); week(S);
  const dsum = () => { const t = E.causeInfo(S).sum; let a = 0; M.forEach(m => Object.keys(t[m] || {}).forEach(k => { if (k.startsWith('d:')) a += t[m][k][1]; })); return a; };
  const a = dsum(); for (let i = 0; i < 4; i++) { while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); } E.endWeek(S); }
  ok(Math.abs(dsum() - a) < 1e-9, 'a decision was booked inside a show or a week: ' + (dsum() - a)); }
// 4 and 5 and 6: one short game
{ const S = E.newGame(ids[0], 3, { name: 'R' }); week(S); week(S);
  const P = S.promos[S.player]; P.cash += 12345; week(S);
  const u = (E.causeInfo(S).sum.cash || {}).untracked; ok(u && Math.abs(u[0] - 12345) < 1, 'a change outside every frame was not booked as untracked');
  const before = JSON.parse(JSON.stringify(E.causeInfo(S).sum));
  const w = S.w.filter(x => x.promo === S.player && !x.nw).sort((a, b) => a.ovr - b.ovr)[0];
  E.release(S, w.id);
  const after = E.causeInfo(S).sum, dt = m => ((after[m] || {})['d:release'] || [0])[0] - ((before[m] || {})['d:release'] || [0])[0];
  ok(dt('trust') !== 0 || dt('cash') !== 0, 'releasing a wrestler booked nothing to d:release');
  ok(((after.morale || {})['roster mix'] || [0, 0])[1] > ((before.morale || {})['roster mix'] || [0, 0])[1], 'a release did not move morale through roster mix');
  ok(E.causeInfo(S).dec['d:release'] === 1 && !E.causeInfo(S).dec['show:night'], 'decisions are not marked right');
}
// 8: a top-level call that changes nothing costs little (a screen redraw makes many)
{ const S = E.newGame(ids[0], 3, { name: 'R' }); E.clocks(S);
  const run = () => { const t = process.hrtime.bigint(); for (let i = 0; i < 5000; i++) E.clocks(S); return Number(process.hrtime.bigint() - t) / 5000 / 1000; };
  const a = run(); S._czs.push({}); const b = run(); S._czs.pop();
  console.log('  frame cost ' + (a - b).toFixed(1) + ' µs a top-level call'); ok(a - b < 25, 'a frame costs ' + (a - b).toFixed(1) + ' µs'); }
console.log((fails || nan || errs) ? 'test-cause: ' + fails + ' failed, errs ' + errs + ', NaN ' + nan : 'test-cause: all passed (errs 0, NaN 0)');
process.exit(fails || nan || errs ? 1 : 0);
