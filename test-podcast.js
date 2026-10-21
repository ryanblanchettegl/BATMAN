/* The podcast (src/99-zpodcast.js): 60 weeks of every promotion. An episode every week, its lines all filled and plain,
   the hosts named, segments that vary, picks scored, secrets kept, the same seed giving the same words, and an old save
   with no podcast in it picking one up.  Run: node test-podcast.js [weeks] */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const WEEKS = +process.argv[2] || 60;
function play(S, weeks, each) {
  for (let wk = 0; wk < weeks && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S); if (each) each(S);
  }
}
const badLine = t => !t || /[{}#]/.test(t) || /^\s|\s$/.test(t) || /—/.test(t) || !/^[A-Z0-9“"\[]/.test(t);
let eps = 0, weeks = 0, bad = [], segKinds = {}, kept = 0, leaked = [], lens = [], allLines = [], picks = 0;
for (const p of E.universe().promotions) {
  const S = E.newGame(p.id, 3, { name: 'R' });
  play(S, WEEKS, T => {
    weeks++; const ep = E.podEp(T); if (!ep || ep.w !== T.week - 1) return; eps++; lens.push(ep.lines.length);
    ep.segs.forEach(s => { segKinds[s.k] = (segKinds[s.k] || 0) + 1; });
    ep.lines.forEach(L => { allLines.push(L.t); if (badLine(L.t) || !/^[abx]$/.test(L.s) || !ep.segs[L.g]) bad.push(p.id + ' w' + ep.w + ': ' + L.t); });
    // a secret that has not leaked is never said on the air
    const sec = (T.kf && T.kf.sec) || {}; Object.keys(sec).forEach(k => { kept++; if (ep.lines.some(L => L.t.indexOf(sec[k].real) >= 0)) leaked.push(sec[k].real); });
  });
  const pod = E.podcast(S); picks += pod.rec.r + pod.rec.x;
  if (p === E.universe().promotions[0]) {
    ok('hosts', 'two named hosts, the writer one of the press', pod.hosts.length === 2 && pod.hosts.every(h => h.name) && E.press(S).some(r => r.name.split(' of ')[0] === pod.hosts[0].name), pod.hosts.map(h => h.name + ' (' + h.role + ')').join(', '));
    ok('name', 'the show is named after the dirt sheet', / Radio$/.test(pod.show), pod.show);
    ok('keep', 'the last four episodes are kept, newest first', pod.eps.length === 4 && pod.eps[0].n > pod.eps[1].n);
    const ep = E.podEp(S); console.log('sample episode, ' + ep.title + ' (' + ep.mins + ' min):'); ep.lines.slice(0, 14).forEach(L => console.log('    ' + (L.s === 'a' ? pod.hosts[0].name : L.s === 'b' ? pod.hosts[1].name : '') + ': ' + L.t));
  }
}
ok('weekly', 'an episode every week', eps >= weeks - 2, eps + ' episodes in ' + weeks + ' weeks');
ok('lines', 'every line filled, plain and said by a host', bad.length === 0, bad.slice(0, 5).join(' | '));
ok('size', 'episodes are a few minutes long', Math.min(...lens) >= 12 && Math.max(...lens) <= 72, Math.min(...lens) + ' to ' + Math.max(...lens) + ' lines');
ok('segs', 'every kind of segment turns up', ['open', 'yours', 'world', 'feuds', 'money', 'rumours', 'titles', 'mail', 'picks'].every(k => segKinds[k] > 0), JSON.stringify(segKinds));
ok('vary', 'the lines vary', new Set(allLines).size >= allLines.length * 0.35, new Set(allLines).size + ' different in ' + allLines.length);
ok('picks', 'picks are made and scored', picks > 0, picks + ' scored');
ok('kayfabe', 'no secret is said before it leaks', leaked.length === 0, kept + ' secrets checked' + (leaked.length ? '; said: ' + leaked[0] : ''));
// words never change a game: nothing in the file draws on the game's random stream, and the same seed says the same words
const src = fs.readFileSync('src/99-zpodcast.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
ok('rnd', 'the podcast never uses the random stream', !/\b(rnd|chance|ri|pick|pickW)\(S\b/.test(src));
const A = E.newGame('pdw', 7, { name: 'R' }), B = E.newGame('pdw', 7, { name: 'R' }); play(A, 20); play(B, 20);
ok('same', 'the same seed gives the same episodes', JSON.stringify(A.pod) === JSON.stringify(B.pod));
// an old save has no podcast: it starts one, and the first episode comes at the end of the week
const O = E.newGame('pdw', 5, { name: 'R' }); play(O, 3); delete O.pod; const L = JSON.parse(JSON.stringify(O));
ok('old', 'an old save shows an empty podcast', E.podcast(L).eps.length === 0);
play(L, 1); ok('old', 'and gets its first episode a week later', E.podcast(L).eps.length === 1);
console.log(fails.length ? fails.length + ' failed' : 'test-podcast: all passed'); process.exit(fails.length ? 1 : 0);
