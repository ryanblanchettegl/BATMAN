/* Packs a world kept as a folder into the one file the game loads, and checks it.
     node tools/build-parody.js                      universes/parody/  ->  universes/parody.json
     node tools/build-parody.js <folder> <out.json>  any world kept the same way (a modder's real roster, say)
   The folder (docs/modding.md says what every field means):
     manifest.json             the world: id, name, start date, how many unsigned wrestlers to invent
     companies/<id>.json       one company each: { promotion, shows, titles, roster, teams }
                               a roster entry is a wrestler with a "contract" inside it
     free_agents.json          wrestlers nobody has signed, legends among them: [worker, ...]
     people.json               people who are not wrestlers, signed or not (same shape as a roster entry)
     relationships.json        [{ a, b, type, strength, ring_chemistry, note }]
     history/<year>.json       { reigns, matches, feuds, moments } for that year
     extras.json               optional: sponsors, columnists, names for invented wrestlers
   Ids are short, lowercase and never change: a name can change, the id stays, and nothing that points at it breaks. */
const fs = require('fs'), path = require('path');
const dir = process.argv[2] || path.join(__dirname, '..', 'universes', 'parody');
const out = process.argv[3] || path.join(__dirname, '..', 'universes', path.basename(dir) + '.json');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const has = f => fs.existsSync(f);
const pkg = { manifest: read(path.join(dir, 'manifest.json')), promotions: [], shows: [], titles: [], workers: [], contracts: [], teams: [], relationships: [], events: [] };
const take = (entry, promo) => {
  const w = Object.assign({}, entry), c = w.contract; delete w.contract;
  pkg.workers.push(w);
  if (c && promo) pkg.contracts.push(Object.assign({ worker_id: w.id, promotion_id: promo }, { contract_type: c.type || 'exclusive', monthly_salary: c.monthly_salary, per_show_fee: c.per_show_fee, weeks_left: c.weeks_left, tenure_weeks: c.tenure_weeks, push_level: c.push, brand: c.brand }));
};
const cdir = path.join(dir, 'companies');
// the order companies are listed in: manifest.order first (the first one is where a new game starts), then by size
const corder = (pkg.manifest.order || []).slice();
const cfiles = fs.readdirSync(cdir).filter(f => f.endsWith('.json')).map(f => ({ f, C: read(path.join(cdir, f)) }))
  .sort((x, y) => { const a = corder.indexOf(x.C.promotion.id), b = corder.indexOf(y.C.promotion.id); return (a < 0 ? 99 : a) - (b < 0 ? 99 : b) || y.C.promotion.popularity - x.C.promotion.popularity; });
delete pkg.manifest.order;
cfiles.forEach(({ f }) => {
  const C = read(path.join(cdir, f)), id = C.promotion.id;
  // a company's twelve big events, January first, as { n: name, t: kind }: the game reads { month, name, type }
  if (Array.isArray(C.promotion.events) && C.promotion.events.length && C.promotion.events[0].n) C.promotion.events = C.promotion.events.map((e, i) => ({ month: i + 1, name: e.n, type: e.t }));
  (C.promotion.events || []).forEach(e => { if (e.name && e.name.length > 28) console.log('  warn  ' + id + ' event name over 28 letters, cut: ' + e.name); });
  pkg.promotions.push(C.promotion);
  (C.shows || []).forEach(s => pkg.shows.push(Object.assign({ promotion_id: id }, s)));
  (C.titles || []).forEach(t => pkg.titles.push(Object.assign({ promotion_id: id }, t)));
  (C.teams || []).forEach(t => pkg.teams.push(Object.assign({ promotion_id: id }, t)));
  (C.roster || []).forEach(w => take(w, id));
});
if (has(path.join(dir, 'free_agents.json'))) read(path.join(dir, 'free_agents.json')).forEach(w => take(w, null));
if (has(path.join(dir, 'people.json'))) read(path.join(dir, 'people.json')).forEach(w => take(w, w.contract && w.contract.promotion_id));
if (has(path.join(dir, 'relationships.json'))) pkg.relationships = read(path.join(dir, 'relationships.json'));
const hdir = path.join(dir, 'history');
if (has(hdir)) {
  const H = { from: null, reigns: [], matches: [], feuds: [], moments: [] };
  fs.readdirSync(hdir).filter(f => /^\d{4}\.json$/.test(f)).sort().forEach(f => { const y = read(path.join(hdir, f)); H.from = H.from || f.slice(0, 4); ['reigns', 'matches', 'feuds', 'moments'].forEach(k => (y[k] || []).forEach(x => H[k].push(x))); });
  pkg.history = H;
}
if (has(path.join(dir, 'extras.json'))) { const X = read(path.join(dir, 'extras.json')); ['sponsors', 'columnists', 'names'].forEach(k => { if (X[k]) pkg[k] = X[k]; }); }
// people.json entries carry their company inside the contract; tidy the field the packed form does not use
pkg.contracts.forEach(c => { Object.keys(c).forEach(k => { if (c[k] == null) delete c[k]; }); });
// check it with the game's own rules before writing it
require(path.join(__dirname, '..', 'engine.js'));
const E = globalThis.GP, v = E.validateUniverse(pkg);
v.errors.forEach(e => console.log('  ERROR', e.at, '-', e.msg));
v.warnings.slice(0, 40).forEach(e => console.log('  warn ', e.at, '-', e.msg));
// history must point at people and titles that exist, on dates that make sense
const W = {}, T = {}; pkg.workers.forEach(w => { W[w.id] = w; }); pkg.titles.forEach(t => { T[t.id] = t; });
let hbad = 0; const hb = m => { hbad++; console.log('  ERROR history -', m); };
const okDate = d => /^20\d\d-(0[1-9]|1[0-2])$/.test(String(d || ''));
if (pkg.history) {
  pkg.history.reigns.forEach(r => { if (!T[r.title]) hb('reign of an unknown title ' + r.title); (r.holders || []).forEach(h => { if (!W[h]) hb('reign by an unknown wrestler ' + h); }); if (!okDate(r.from) || (r.to && !okDate(r.to))) hb('reign of ' + r.title + ' has a bad date'); });
  pkg.history.matches.forEach(m => { if (!W[m.a] || !W[m.b]) hb('match with an unknown wrestler ' + m.a + ' / ' + m.b); if (!okDate(m.date)) hb('match ' + m.a + ' v ' + m.b + ' has a bad date'); });
  pkg.history.feuds.forEach(f => { (f.a || []).concat(f.b || []).forEach(x => { if (!W[x]) hb('feud with an unknown wrestler ' + x); }); });
  pkg.history.moments.forEach(x => { if (!W[x.who]) hb('moment for an unknown wrestler ' + x.who); if (!okDate(x.date)) hb('moment for ' + x.who + ' has a bad date'); });
}
if (!v.ok || hbad) { console.log('Not written: fix the errors above.'); process.exit(1); }
fs.writeFileSync(out, JSON.stringify(pkg));
console.log('Wrote ' + out + ': ' + pkg.promotions.length + ' companies, ' + pkg.workers.length + ' people, ' + pkg.titles.length + ' titles' + (pkg.history ? ', history from ' + pkg.history.from : '') + '.');
