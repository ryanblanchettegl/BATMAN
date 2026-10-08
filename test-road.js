/* The road: where the cities are, the eight maps, the loop a company tours, and what the desk's road window reads.
   Run: node test-road.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const U = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'));
E.useUniverse(U);
const show = S => { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } return E.runPlayerShow(S, c).rep; };
const answer = S => S.inbox.forEach(e => { if (!e.done) E.resolveEvent(S, e.id, e.choices.length - 1); });
const play = (S, weeks) => { for (let i = 0; i < weeks; i++) { answer(S); while (S.qi < S.queue.length) show(S); answer(S); E.endWeek(S); } };

/* the maps */
{ const M = E.MAPS;
  ok('map', 'eight maps: the USA, Britain and Ireland, Europe, the old world, Mexico, South America, Japan, the world', M.length === 8 && M.map(m => m.id).join(' ') === 'usa brit eur med mex sam jap world');
  ok('map', 'every map is a board of 59 by 32 dots', M.every(m => m.g.length === E.MAP_H && m.g.every(r => r.length === E.MAP_W)));
  ok('map', 'every dot is sea, other land, or an area the map names', M.every(m => m.g.every(r => r.split('').every(ch => ch === ' ' || ch === '-' || E.MAP_ABC.indexOf(ch) < m.a.length && E.MAP_ABC.indexOf(ch) >= 0))));
  ok('map', 'every area a map names has at least one dot', M.every(m => m.a.every((a, i) => m.g.some(r => r.indexOf(E.MAP_ABC[i]) >= 0))));
  const usa = M[0]; ok('map', 'the USA lights by state', usa.a.length >= 44 && usa.a.includes('Illinois') && usa.a.includes('Texas'), usa.a.length + ' states');
}
/* every city of the default world has a place and a map that lights for it */
{ const S = E.newGame('whw', 3, { name: 'R' }), bad = [], seen = {};
  S.order.forEach(id => S.promos[id].cities.forEach(c => { if (seen[c]) return; seen[c] = 1; const p = E.placeOf(S, c); if (!p) { bad.push(c + ' has no place'); return; }
    const on = E.MAPS.filter(m => E.mapArea(S, m.id, c) >= 0).map(m => m.id); if (!on.length) bad.push(c + ' is on no map'); }));
  ok('place', 'all ' + Object.keys(seen).length + ' cities of the default world have a place and light an area on a map', !bad.length, bad.join(', '));
  const at = (m, c) => { const i = E.mapArea(S, m, c); return i < 0 ? null : E.MAPS.find(x => x.id === m).a[i]; };
  ok('place', 'a city lights its own state or land', at('usa', 'Chicago') === 'Illinois' && at('usa', 'New Orleans') === 'Louisiana' && at('usa', 'San Francisco') === 'California' && at('brit', 'Edinburgh') === 'Scotland' && at('brit', 'Camelot') === 'the West Country' && at('eur', 'Paris') === 'France' && at('med', 'Troy') === 'Anatolia' && at('med', 'Uruk') === 'Mesopotamia' && at('jap', 'Kyoto') === 'Kansai' && at('jap', 'Edo') === 'Kanto' && at('sam', 'Lima') === 'Peru' && at('mex', 'Havana') === 'Cuba' && at('world', 'Melbourne') === 'Oceania',
    ['usa Chicago', 'usa New Orleans', 'brit Edinburgh', 'brit Camelot', 'med Troy', 'med Uruk', 'jap Kyoto', 'jap Edo', 'mex Havana', 'mex Tenochtitlan', 'world Melbourne', 'world Dawson City'].map(x => x + '=' + at(x.split(' ')[0], x.slice(x.indexOf(' ') + 1))).join(', '));
}
/* the road */

['whw', 'ttt', 'kjp', 'ldd', 'ocw'].forEach(pid => {
  const S = E.newGame(pid, 5, { name: 'R' }), P = S.promos[S.player], R = E.roadRoute(S);
  ok(pid, 'the road is a loop through every city once', R.length === P.cities.length && new Set(R).size === R.length, R.join(' > '));
  const before = JSON.stringify(S), D = E.road(S), ahead = E.roadAhead(S, 12);
  ok(pid, 'reading the road changes nothing in the game', JSON.stringify(S) === before);
  ok(pid, 'the desk knows the city, the land, the show and the building before the show is booked', !!(D && D.now.city === R[0] && D.now.land && D.now.show === S.queue[0].name && D.now.cap > 0 && D.now.venue.indexOf(D.now.city) === 0 && D.map), D && D.now.city + ', ' + D.now.land + ' on ' + D.mapName + ': ' + D.now.venue + ' holds ' + D.now.cap);
  ok(pid, 'this stop has a dot on the map, and its land lights', !!(D && D.stops.find(s => s.k === 'now').x != null && D.lit.now >= 0));
  const told = D.now, rep = show(S);
  ok(pid, 'the show goes on in the city and the building the desk named', rep.venue === told.venue && rep.cap === told.cap && rep.city === told.city, rep.venue + ' ' + rep.cap);
  play(S, 6);
  const D2 = E.road(S), past = D2.stops.filter(s => s.k === 'past');
  ok(pid, 'the road so far is the last three nights, each with its grade', past.length === 3 && past.every(s => /^[A-F][+-]?$/.test(s.grade) && s.att > 0), past.map(s => s.city + ' ' + s.grade).join(', '));
  const went = S.reports.map(r => r.city).reverse(), want = []; let n = (S.rdn || 0) - went.length; went.forEach(() => want.push(R[n++ % R.length]));
  ok(pid, 'the nights were run in the order the schedule gave', went.join() === want.join(), went.join(' > '));
  ok(pid, 'the schedule from week one held', ahead.slice(0, 6).every((a, i) => { const k = i; return a.city === R[k % R.length]; }));
  const c = D2.now.city; S.rdv[c] = { w: S.week - 3, cs: 82, att: 9000, cap: 9000, so: 1 }; S.bar = {}; S.bar[c] = { w: S.week - 2, d: 1, by: 'A rival', r: 80 };
  const D3 = E.road(S);
  ok(pid, 'it says when you were last here and how it went, and when a rival has had a great night in town', D3.now.last.ago === 3 && D3.now.last.so && D3.now.rival.ago === 2 && D3.now.rival.by === 'A rival', D3.now.last.grade);
});
/* tickets sold before the night */
{ const S = E.newGame('whw', 4, { name: 'R' }), D = E.road(S), N = D.now, ahead = D.stops.filter(s => s.k !== 'past');
  ok('tix', 'the next show is on sale, has sold most of the house, and sold some of it this week', N.on && N.sold > N.cap * 0.4 && N.sold <= N.cap && N.wk > 0 && N.wk < N.sold, N.sold + ' of ' + N.cap + ', ' + N.wk + ' this week');
  const same = ahead.filter(s => s.show === N.show);
  ok('tix', 'the further away a show is, the less of it is sold', same.length >= 2 && same.every((s, i, L) => !i || s.sold < L[i - 1].sold), same.map(s => s.city + ' ' + s.sold + '/' + s.cap).join(', '));
  ok('tix', 'the gate so far is what is sold at what a seat costs', N.gate === Math.round(N.sold * N.seat) || Math.abs(N.gate - N.sold * N.seat) < N.sold);
  const before = JSON.stringify(S); E.road(S); E.roadAhead(S, 12); ok('tix', 'reading the sales changes nothing', JSON.stringify(S) === before);
  const P = S.promos[S.player], s0 = E.road(S).now.sold; P.adv = 3; S.hype = 0.1; const s1 = E.road(S).now.sold;
  ok('tix', 'advertising and talking the show up sell more tickets', s1 > s0, s0 + ' then ' + s1);
  P.adv = 0; S.hype = 0; const s2 = E.road(S).now.sold; ok('tix', 'and a ticket sold when the week began stays sold', s2 >= Math.min(...[s0]) - N.wk, s2);
  answer(S); const rep = show(S); ok('tix', 'the night has at least as many in the building as had bought a ticket by the end of last week', rep.att >= (N.sold - N.wk), rep.att + ' in, ' + (N.sold - N.wk) + ' sold before the week');
}
{ /* a year of shows: tickets sold ahead never decide the gate, they only make sure a sold ticket is paid for */
  let noshow = 0, att = 0, sold = 0;
  ['whw', 'ttt', 'nmw'].forEach(pid => { const S = E.newGame(pid, 11, { name: 'R' }); for (let w = 0; w < 24; w++) { answer(S); while (S.qi < S.queue.length) { const r = show(S); noshow += r.noshow || 0; att += r.att; if (r.sellout) sold++; } answer(S); E.endWeek(S); } });
  ok('tix', 'over half a year of nights, fewer than three in a hundred seats were sold to people who stayed home', noshow / att < 0.03, (noshow / att * 100).toFixed(2) + '% of ' + att);
}
/* markets */
{ const S = E.newGame('whw', 6, { name: 'R' }), P = S.promos[S.player], R = E.roadRoute(S), D = E.road(S);
  ok('mkt', 'every stop has a market said in words', !!D.now.mkt && E.mktWords.some(x => x.w === D.now.mkt.w) && /\./.test(D.now.mkt.d), D.now.mkt.w);
  const ks = []; ['whw', 'ttt', 'kjp', 'ldd', 'ocw', 'nmw', 'pdw', 'lta'].forEach(pid => { const T = E.newGame(pid, 6, { name: 'R' }); E.roadRoute(T).forEach(c => { T.rdn = E.roadRoute(T).indexOf(c); ks.push(E.road(T).now.mktK); }); });
  const mean = ks.reduce((a, b) => a + b, 0) / ks.length;
  ok('mkt', 'markets start near the middle, so a new game draws what it drew before', mean > 47 && mean < 54 && Math.min(...ks) >= 10 && Math.max(...ks) <= 90, mean.toFixed(1) + ' across ' + ks.length + ' cities');
  const c = D.now.city, cap0 = D.now.cap; S.mkt = {}; S.mkt[c] = { k: 95, w: S.week }; const big = E.road(S).now; S.mkt[c] = { k: 5, w: S.week }; const small = E.road(S).now;
  ok('mkt', 'a strong market draws a bigger house and sells more ahead, a weak one less', big.cap >= cap0 && small.cap <= cap0 && big.sold > small.sold && big.mkt.w === 'Your territory' && small.mkt.w === 'They hardly know you', small.cap + ' / ' + cap0 + ' / ' + big.cap);
  S.mkt = {}; answer(S); const k0 = E.road(S).now.mktK, rep = show(S);
  ok('mkt', 'a night there moves the market: up for a good one, down for a bad one', S.mkt[c] && rep.mkt && (E.repCS(rep) >= 66 ? S.mkt[c].k > k0 : (E.repCS(rep) < 64 ? S.mkt[c].k < k0 : true)), E.repGrade(rep) + ': ' + k0 + ' to ' + S.mkt[c].k);
  const A = E.afterShow(S); ok('mkt', 'After the show says what the night did to the market', !!A && JSON.stringify(A).indexOf('The market') >= 0 || rep.mkt.now === rep.mkt.was);
  S.mkt[c] = { k: 90, w: S.week }; for (let i = 0; i < 12; i++) { answer(S); S.qi = S.queue.length; E.endWeek(S); }
  ok('mkt', 'stay away and a market cools', S.mkt[c].k < 90 && S.mkt[c].k >= 80, S.mkt[c].k);
}
/* hometowns and a city nobody has placed */
{ const S = E.newGame('whw', 9, { name: 'R' }), P = S.promos[S.player], w = E.rosterOf(S, P.id)[0]; w.town = E.road(S).now.city;
  ok('home', 'somebody from tonight’s city is named', E.road(S).now.home.some(h => h.id === w.id));
  P.cities = ['Nowhere Much', 'Chicago']; S.rdn = 0; const R = E.roadRoute(S), D = E.road(S);
  ok('lost', 'a city with no place still works: it comes after the placed ones and has no dot', R.join() === 'Chicago,Nowhere Much' && !!D && D.now.city === 'Chicago');
  S.rdn = 1; const D2 = E.road(S);
  ok('lost', 'on a night there the window still has the city, with no map', D2.now.city === 'Nowhere Much' && D2.map === null && D2.now.land === null && D2.now.cap > 0);
}
/* an old save has no road yet */
{ const S = E.newGame('ttt', 2, { name: 'R' }); delete S.rdn; delete S.rdv; const D = E.road(S); ok('old', 'a game saved before the road loads and starts the loop from its first stop', !!D && D.now.city === E.roadRoute(S)[0]); }
console.log(fails.length ? '\nFAILED: ' + fails.length + '\n' + fails.join('\n') : '\nall passed');
process.exit(fails.length ? 1 : 0);
