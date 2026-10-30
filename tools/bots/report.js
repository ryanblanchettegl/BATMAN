/* The bot report (docs/MASTER.md §7 row L2). Each bot plays one company model for two seasons on three seeds; the report
   says how much of each meter's movement came from player decisions (trace share, from the cause log), how the first
   three weeks graded, and how many words were on the desk in week one. Writes tools/bots/out/report.json.
   Run: node tools/bots/report.js            (MODEL=lta SEEDS=3,11,29 WEEKS=96; QUICK=1 for one seed, 12 weeks)
   Two trace shares, per meter, per season (Σ|change| ÷ Σ|change| of all causes):
     direct: causes that are a player's own answer or action (d:*, and roster mix under them);
     booked: direct plus what the player's own shows did (show:*), since the player booked the card.
   The spine (row 1) gates on direct; booked shows how much rides on the card. Seasons cut short by a firing are marked
   partial and left out of the medians. Desk words here are the desk's task lines and open matters counted headless
   ("desk task+matter words"); row 2's browser test counts the page itself.
   MODEL=all runs every company in the world. */
const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..', '..');
require(path.join(root, 'engine.js'));
const E = globalThis.GP, { BOTS, playWeek } = require('./bots');
const Q = !!process.env.QUICK;
const MODEL = process.env.MODEL || 'lta', SEEDS = (process.env.SEEDS || (Q ? '3' : '3,11,29')).split(',').map(Number), WEEKS = +(process.env.WEEKS || (Q ? 12 : 96));
const METERS = ['cash', 'pop', 'trust', 'morale'];
E.useUniverse(JSON.parse(fs.readFileSync(path.join(root, 'universes/public_domain.json'), 'utf8')));
const med = a => { const s = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y), n = s.length; return !n ? null : n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const words = s => (String(s || '').match(/\S+/g) || []).length;

/** Trace share of one season's table, per meter; also the top causes, for reading. */
function shares(t) {
  const out = {};
  METERS.forEach(m => {
    const c = (t.sum && t.sum[m]) || {}; let all = 0, dec = 0, bk = 0;
    Object.keys(c).forEach(k => { all += c[k][1]; if (t.dec[k]) dec += c[k][1]; if (t.dec[k] || /^show:|^roster mix:show:/.test(k)) bk += c[k][1]; });
    out[m] = { share: all ? dec / all : null, booked: all ? bk / all : null, total: all, top: Object.keys(c).sort((a, b) => c[b][1] - c[a][1]).slice(0, 4).map(k => [k, +c[k][1].toFixed(2), !!t.dec[k]]) };
  });
  return out;
}
function run(bot, seed, model) {
  const S = E.newGame(model, seed, { name: 'R' }), seasons = [], early = [];
  let skipped = 0;
  const tk = E.tasks(S), desk = tk.list.reduce((a, x) => a + words(x.short || x.text), 0) + S.inbox.filter(e => !e.done).reduce((a, e) => a + words(e.title) + words(e.text), 0);
  let y = 0;
  for (let wk = 1; wk <= WEEKS && !S.over; wk++) {
    const r = playWeek(E, S, bot), cs = r.cs; skipped += r.skipped;
    if (wk <= 3) early.push(...cs);
    if (S.cz && S.cz.y !== y) { const t = shares(S.cz.last); t.full = true; seasons.push(t); y = S.cz.y; }
  }
  if (S.cz && seasons.length < Math.ceil(WEEKS / 48)) { const t = shares(E.causeInfo(S)); t.full = !S.over && WEEKS % 48 === 0; seasons.push(t); }
  return { bot, seed, model, over: S.over ? S.over.why + ' (week ' + S.week + ')' : null, seasons, early: med(early), deskWords: desk, skipped, bad: (S.cz && S.cz.bad) || 0 };
}
const runs = [];
const MODELS = MODEL === 'all' ? E.universe().promotions.map(p => p.id) : [MODEL];
Object.keys(BOTS).forEach(b => MODELS.forEach(m => SEEDS.forEach(s => runs.push(run(b, s, m)))));
const summary = {};
Object.keys(BOTS).forEach(b => {
  const R = runs.filter(r => r.bot === b), sz = Math.max(...R.map(r => r.seasons.length));
  summary[b] = { seasons: [], early: med(R.map(r => r.early)), earlyGrade: null, deskWords: med(R.map(r => r.deskWords)), skipped: R.reduce((a, r) => a + r.skipped, 0), over: R.map(r => r.over).filter(Boolean) };
  summary[b].earlyGrade = summary[b].early == null ? null : E.grade(summary[b].early);
  for (let i = 0; i < sz; i++) {
    const F = R.filter(r => r.seasons[i] && r.seasons[i].full), o = { n: F.length, of: R.length, direct: {}, booked: {} };
    METERS.forEach(m => { o.direct[m] = med(F.map(r => r.seasons[i][m].share)); o.booked[m] = med(F.map(r => r.seasons[i][m].booked)); });
    summary[b].seasons.push(o);
  }
});
const report = { at: 'week ' + WEEKS, model: MODELS.join(','), seeds: SEEDS, summary, runs };
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out', 'report.json'), JSON.stringify(report, null, 1));
const pct = v => v == null ? '  -  ' : (100 * v).toFixed(1).padStart(5) + '%';
console.log('bot report: model ' + MODELS.join(',') + ', seeds ' + SEEDS.join(',') + ', ' + WEEKS + ' weeks (medians over complete seasons)');
Object.keys(summary).forEach(b => { const s = summary[b];
  s.seasons.forEach((o, i) => ['direct', 'booked'].forEach(k => console.log('  ' + b.padEnd(10) + ' season ' + (i + 1) + ' (' + o.n + '/' + o.of + ' complete)  ' + k.padEnd(6) + '  cash' + pct(o[k].cash) + '  pop' + pct(o[k].pop) + '  trust' + pct(o[k].trust) + '  morale' + pct(o[k].morale))));
  console.log('  ' + b.padEnd(10) + ' weeks 1-3 grade ' + (s.earlyGrade || '-') + ' (' + (s.early == null ? '-' : s.early.toFixed(1)) + ')   week-1 desk task+matter words ' + s.deskWords + '   shows skipped (invalid card) ' + s.skipped + (s.over.length ? '   ended: ' + s.over.join(', ') : '')); });
const bad = runs.reduce((a, r) => a + r.bad, 0);
if (bad) { console.log('FAIL: ' + bad + ' cause-log frames did not close'); process.exit(1); }
