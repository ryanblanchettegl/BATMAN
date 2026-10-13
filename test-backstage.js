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
/* rumours that come due are settled */
S.rumF = [{ w: x.id, k: 'exp', pid: x.promo, due: S.week, lvl: 'sure' }, { w: y.id, k: 'fa', pid: S.order.find(p => p !== y.promo && p !== S.player), due: S.week, lvl: 'thin' }];
S.rumR = [];
const keep = x.promo; x.promo = 'FA';
const WK = S.week, r0 = S.reports.length;
try { E.endWeek(S); } catch (e) { console.log('endWeek threw', e.message); }
const R = (S.rumR || []).filter(r => r.w === WK);
ok('a rumour that came due is settled', R.length === 2 && !S.rumF.some(r => r.due <= WK), JSON.stringify(R));
ok('a deal that did run out is confirmed', R.some(r => r.ok && /CONFIRMED/.test(r.t) && r.t.includes(x.name)));
ok('a free agent never signed is corrected', R.some(r => !r.ok && /CORRECTION/.test(r.t)));
console.log(fails.length ? 'FAILED: ' + fails.join('; ') : 'test-backstage: all passed'); process.exit(fails.length ? 1 : 0);
