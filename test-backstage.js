/* The dirt sheet's Backstage reports: they come from the relationship matrix and carry a level by how close the paper is.  Run: node test-backstage.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (label, pass, detail) => { console.log(pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const S = E.newGame('pdw', 3, { name: 'R' });
const mine = S.w.filter(w => w.promo === 'pdw' && !w.nw), other = S.w.filter(w => w.promo !== 'pdw' && w.promo !== 'FA' && !w.nw);
const key = (a, b) => a.id < b.id ? a.id + '-' + b.id : b.id + '-' + a.id;
const fresh = (pool, ex) => { for (const a of pool) for (const b of pool) if (a.id < b.id && !S.rm[key(a, b)] && !(ex && ex.length && ex[0] === a.id)) return [a, b]; };
const [a, b] = fresh(mine), [c, d] = fresh(other);
const x = mine[0], y = other[0];
E.relBump(S, a.id, b.id, { bond: -40 }, { k: 't', t: a.name + ' and ' + b.name + ' argued in catering.' });
E.relBump(S, a.id, y.id, { bond: -35 }, { k: 't', t: a.name + ' called out ' + y.name + ' on the road.' });
const wk = S.week, s1 = E.sheetInfo(S).now;
ok('the sheet has a backstage list', Array.isArray(s1.backstage));
const r1 = s1.backstage.find(r => r.t.includes('catering')), r2 = s1.backstage.find(r => r.t.includes('road'));
ok('two of your own: sure', r1 && r1.lvl === 'sure');
ok('one of yours, one rival: likely', !r2 || r2.lvl === 'likely');
ok('at most three reports', s1.backstage.length <= 3);
const before = JSON.stringify(S.rng !== undefined ? S.rng : S.seed); E.sheetInfo(S);
ok('reading it does not touch the random stream', JSON.stringify(S.rng !== undefined ? S.rng : S.seed) === before);
ok('an old week with no changes is empty', E.sheetInfo(S).now.week === wk && (() => { S.week += 1; const n = E.sheetInfo(S).now.backstage.length; S.week -= 1; return n === 0; })());
/* two people turning on each other gets a post from a fan */
{ const n0 = (S.feed || []).length, [p, q] = fresh(mine.slice(5));
  E.relBump(S, p.id, q.id, { bond: -50 }, { k: 't', t: 'x' });
  ok('a new enemy pair gets a feed post', S.feed.length === n0 + 1 && S.feed[0].k === 'f' && S.feed[0].t.includes(p.name), S.feed[0] && S.feed[0].t);
  const n1 = S.feed.length; E.relBump(S, p.id, q.id, { bond: -5 }, { k: 't', t: 'y' });
  ok('no second post while nothing turns', S.feed.length === n1); }
/* looking back at a title win, a year on */
{ const P = S.promos[S.player], t = P.titles[0];
  t.hist = [{ ids: '1', h: ['Test Champion'], from: S.week, to: S.week + 30, show: 'Old Night', defs: 0 }];
  S.week += 48; const tb = E.sheetInfo(S).now.throwback; S.week -= 48;
  ok('a title win is remembered a year on', tb.length >= 1 && /1 year ago/.test(tb[0].t) && tb[0].t.includes('Test Champion') && /30 weeks/.test(tb[0].t), tb[0] && tb[0].t);
  S.week += 20; ok('and not on any other week', E.sheetInfo(S).now.throwback.length === 0); S.week -= 20; }
/* the moment of the week comes from the show's marked beats */
{ const T = E.newGame('pdw', 4, { name: 'R' }); T.inbox.forEach(e => E.resolveEvent(T, e.id, 0)); const c = E.suggest(T), pr = E.preShow(T, c); if (pr) { E.resolvePre(T, c, 0); E.fitShow(T, c); }
  const rep = E.runPlayerShow(T, c).rep, m = E.sheetInfo(T).now.moment, all = rep.segs.flatMap(s => (s.bc || []).filter(b => b.h).map(b => b.x));
  ok('the sheet names the moment of the week, as it aired', !!m && all.includes(m.t), m && m.t); }
/* a jealous partner: the sheet warns first, and the jealous one is the one who turns */
{ const T = E.newGame('pdw', 6, { name: 'R' }); T.inbox.forEach(e => E.resolveEvent(T, e.id, 0));
  const tm = T.teams.find(t => t.m.length === 2 && t.m.every(id => T.w[id].promo === 'pdw'));
  if (!tm) ok('a two-man team to test with', false); else {
    const [a, b] = tm.m.map(id => T.w[id]);
    E.relBump(T, a.id, b.id, a.id < b.id ? { ja: 70 } : { jb: 70 });
    const r = E.sheetInfo(T).now.rumours.find(x => x.t.includes('shadow'));
    ok('the sheet warns that a team is coming apart, naming the jealous one', !!r && r.t.startsWith('People backstage say ' + a.name) && r.lvl === 'likely', r && r.t);
  } }
/* a rival star unhappy with their spot is followed up once, whatever else is said about them */
{ const T = E.newGame('pdw', 2, { name: 'R' }); const twice = {};
  for (let w = 0; w < 40 && !T.over; w++) { T.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(T, e.id, 0)); if (T.owner.pending) E.setCreed(T, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (T.qi < T.queue.length) { const c = E.suggest(T); E.runPlayerShow(T, c); } E.endWeek(T);
    const ids = (T.rumF || []).map(r => r.w); ids.forEach((id, i) => { if (ids.indexOf(id) !== i) twice[id] = 1; }); }
  ok('nobody is followed up twice at once', !Object.keys(twice).length, Object.keys(twice).join(',')); }
/* rumours that come due are settled */
S.rumF = [{ w: x.id, k: 'exp', pid: x.promo, due: S.week, lvl: 'sure' }, { w: y.id, k: 'fa', pid: S.order.find(p => p !== y.promo && p !== S.player), due: S.week, lvl: 'thin' }];
S.rumR = [];
const keep = x.promo; x.promo = 'FA';
const WK = S.week, r0 = S.reports.length;
try { E.endWeek(S); } catch (e) { console.log('endWeek threw', e.message); }
const R = (S.rumR || []).filter(r => r.w === WK);
ok('a rumour that came due is settled', R.length === 2 && !S.rumF.some(r => r.due <= WK), JSON.stringify(R));
ok('a deal that did run out is confirmed', R.some(r => r.ok && /CONFIRMED/.test(r.t) && r.t.includes(x.name)));
x.promo = keep;
S.rumF = [{ w: x.id, k: 'exp', pid: keep, due: S.week, lvl: 'sure' }]; S.rumR = [];
try { E.endWeek(S); } catch (e) {}
ok('a deal that was renewed is an update, not a correction', S.rumR.some(r => !r.ok && /^UPDATE/.test(r.t) && /re-signed/.test(r.t)), JSON.stringify(S.rumR));
ok('a free agent never signed is corrected', R.some(r => !r.ok && /CORRECTION/.test(r.t)));
console.log(fails.length ? 'FAILED: ' + fails.join('; ') : 'test-backstage: all passed'); process.exit(fails.length ? 1 : 0);
