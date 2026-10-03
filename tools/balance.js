/* Balance table: plays each company on suggested cards and prints one table of how it went.
   Usage:  node build.js && node tools/balance.js [--weeks=100] [--seeds=3,7,11] [--only=whw,ttt] [--universe=universes/public_domain.json] [--out=docs/balance-0.13.txt]
   The autopilot is the one test-uni.js uses: the suggested card every show, the first choice on a handover and the second on every other inbox event.
   "r-exp" is the show rating minus what the crowd expected, averaged over every show. Compare that, not raw ratings (CLAUDE.md, "Things that bite").
   "FA" is the free agents left at the end who are worth signing (overness 40 or more); "FA all" counts everyone unsigned and not retired. */
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const weeks = +arg('weeks', 100), seeds = arg('seeds', '3,7,11').split(',').map(Number), only = arg('only', ''), file = arg('universe', 'universes/public_domain.json'), out = arg('out', '');
require(path.join(__dirname, '..', 'engine.js'));
const E = globalThis.GP;
const v = E.useUniverse(JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8')));
if (!v.ok) { console.error('universe failed to load'); process.exit(1); }
const info = E.universe(), ids = info.promotions.map(p => p.id).filter(id => !only || only.split(',').indexOf(id) >= 0);

/** One run: returns the figures for the table. */
function play(pid, seed) {
  const S = E.newGame(pid, seed, { name: 'Balance' }), P = S.promos[pid], rs = [], c0 = P.cash, p0 = P.image, minTrust = [S.owner.trust];
  let errs = 0;
  for (let wk = 0; wk < weeks && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) {
      const card = E.suggest(S), pr = E.preShow(S, card);
      if (pr) E.resolvePre(S, card, 0);
      if (E.validate(S, card).errors.length) { errs++; S.qi++; continue; }
      const r = E.runPlayerShow(S, card);
      if (r.errors) { errs++; S.qi++; continue; }
      rs.push(r.rep.rating - r.rep.exp);
    }
    E.endWeek(S);
    minTrust.push(S.owner.trust);
  }
  const R = S.w.filter(w => w.promo === pid && !w.nw), fa = S.w.filter(w => w.promo === 'FA' && !w.rt && !w.nw);
  return {
    cash0: c0, cash1: P.cash, pop0: p0, pop1: P.image, rexp: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0,
    trust: S.owner.trust, trustMin: Math.min.apply(null, minTrust), weeks: S.over ? S.over.week : S.week - 1, over: S.over ? S.over.why : '',
    roster: R.length, fa: fa.filter(w => w.ovr >= 40).length, faAll: fa.length, kb: Math.round(JSON.stringify(S).length / 1024), errs: errs,
    bad: S.w.filter(w => [w.ovr, w.cond, w.morale, w.mom, w.wage, w.age].some(x => !isFinite(x))).length
  };
}

const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const pad = (s, n) => String(s).padEnd(n), lpad = (s, n) => String(s).padStart(n);
const lines = [];
const say = s => { lines.push(s); console.log(s); };
say('EWF 9000 balance table. ' + weeks + ' weeks, seeds ' + seeds.join(', ') + ', suggested cards, ' + info.name + '.');
say('Autopilot: the suggested card every show; inbox answers as in test-uni.js. Figures are means over the seeds; "min" is the worst seed.');
say('');
say(pad('company', 8) + pad('model', 11) + lpad('cash start', 11) + lpad('cash end', 10) + lpad('pop start', 10) + lpad('pop end', 8) + lpad('r-exp', 7) + lpad('trust end', 10) + lpad('trust min', 10) + lpad('weeks min', 10) + lpad('roster', 8) + lpad('FA 40+', 8) + lpad('FA all', 8) + lpad('save KB', 9) + '  ended');
const t0 = Date.now();
let problems = 0;
ids.forEach(pid => {
  const rows = seeds.map(sd => play(pid, sd)), P = info.promotions.filter(p => p.id === pid)[0];
  const m = k => avg(rows.map(r => r[k])), mn = k => Math.min.apply(null, rows.map(r => r[k]));
  const ended = rows.filter(r => r.over).map(r => r.over + '@' + r.weeks).join(' ') || '-';
  problems += rows.filter(r => r.errs || r.bad).length;
  say(pad(pid, 8) + pad(P.model || 'classic', 11) +
    lpad((m('cash0') / 1e6).toFixed(1) + 'M', 11) + lpad((m('cash1') / 1e6).toFixed(1) + 'M', 10) + lpad(m('pop0').toFixed(1), 10) + lpad(m('pop1').toFixed(1), 8) +
    lpad(m('rexp').toFixed(2), 7) + lpad(m('trust').toFixed(0), 10) + lpad(mn('trustMin').toFixed(0), 10) + lpad(mn('weeks'), 10) + lpad(m('roster').toFixed(0), 8) +
    lpad(m('fa').toFixed(0), 8) + lpad(m('faAll').toFixed(0), 8) + lpad(m('kb').toFixed(0), 9) + '  ' + ended);
  process.stderr.write(pid + ' done (' + Math.round((Date.now() - t0) / 1000) + ' s)\n');
});
say('');
say(problems ? 'PROBLEMS: ' + problems + ' run(s) had validation errors or bad numbers.' : 'No validation errors and no bad numbers in any run.');
if (out) fs.writeFileSync(path.join(__dirname, '..', out), lines.join('\n') + '\n');
process.exit(problems ? 1 : 0);
