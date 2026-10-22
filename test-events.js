/* Big events belong to a company (src/42-events.js, NEXT.md job 3): twelve each, a flagship name of their own,
   filled for an old save that has none, and the show on the night carries the company's name for it. */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' });
const flags = S.order.map(id => S.promos[id].events.find(e => e.t === 'flag'));
ok(S.order.every(id => S.promos[id].events.length === 12), 'a company does not have twelve big events');
ok(flags.every(Boolean) && new Set(flags.map(f => f.n)).size === flags.length, 'two companies share a flagship name: ' + flags.map(f => f && f.n).join(', '));
const P = S.promos[S.player], fm = P.flagship;
ok(E.events(S)[fm].flag && E.events(S)[fm].n === P.events[fm].n, 'the player\'s flagship is not marked');
// an old save: no events on the company, and they are filled the first time they are needed
delete P.events; const nb = E.nextBig(S); ok(P.events && P.events.length === 12 && !!nb.name, 'an old save did not get its events');
// the show on the night uses the company's own name for it
for (let w = 0; w < 50 && !S.over; w++) {
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
  while (S.qi < S.queue.length && !S.over) { const sh = S.queue[S.qi];
    if (sh.big && sh.flag) ok(sh.name === P.name + ' ' + P.events[fm].n, 'the flagship night is called ' + sh.name);
    const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
  E.endWeek(S);
}
// the year planner: a later month can be renamed and given a kind; this month and the flagship's kind cannot change
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }), L = E.events(S), now = L.find(e => e.now), later = L.find(e => !e.now && !e.flag), fl = L.find(e => e.flag);
  ok(!E.evSet(S, now.m, { n: 'Something Else' }).ok, 'this month\'s event could be renamed');
  ok(!E.evSet(S, fl.m, { t: 'ballroom' }).ok, 'the flagship could be made a ballroom show');
  ok(!E.evSet(S, later.m, { n: L.find(e => e.m !== later.m).n }).ok, 'two events could share a name');
  const r = E.evSet(S, later.m, { n: 'Cellar Night', t: 'ballroom' }); ok(r.ok && E.events(S)[later.m].n === 'Cellar Night' && E.events(S)[later.m].t === 'ballroom', 'a later month could not be changed: ' + r.msg);
}
// a ballroom show draws a smaller house, and its crowd expects less than an arena's
{
  const run = ty => { const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }), now = E.events(S).find(x => x.now).m, nb = E.events(S).find(e => !e.flag && e.m === (now + 1) % 12);
    if (!nb) return null; E.evSet(S, nb.m, { t: ty });
    for (let w = 0; w < 9; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
      while (S.qi < S.queue.length) { const big = S.queue[S.qi].big && S.queue[S.qi].ty === ty, c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); }
        if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); if (big) return S.reports[0]; } E.endWeek(S); } return null; };
  const a = run('arena'), b = run('ballroom');
  ok(a && b && b.cap < a.cap && b.exp < a.exp, 'a ballroom show was not smaller with a gentler crowd: ' + JSON.stringify({ a: a && [a.cap, a.exp], b: b && [b.cap, b.exp] }));
}
// a world saved from a game keeps each company's own events, and a new game from it starts with them
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }), m = E.events(S).find(e => !e.now && !e.flag).m;
  E.evSet(S, m, { n: 'Cellar Night', t: 'ballroom' }); const flag = S.promos[S.player].events.find(e => e.t === 'flag').n;
  const pkg = E.exportUniverse(S, { name: 'Round trip' }), chk = E.validateUniverse(pkg);
  ok(!chk || !(chk.errors || []).length, 'the saved world does not check: ' + JSON.stringify(chk && chk.errors));
  E.useUniverse(pkg); const T = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }), Q = T.promos[T.player];
  ok(Q.events[m].n === 'Cellar Night' && Q.events[m].t === 'ballroom' && Q.events.find(e => e.t === 'flag').n === flag, 'a company\'s events were lost on the way: ' + JSON.stringify(Q.events[m]));
  E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
}
// rivals plan their year too: within a year at least one rival reshapes a month, and says so in the news
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }); let said = false;
  for (let w = 0; w < 50; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    E.endWeek(S); if (/turns its \w+ event/.test(JSON.stringify(S.news.slice(0, 20)))) said = true; }
  const changed = S.order.filter(id => id !== S.player && S.promos[id].events.some(e => e.t !== 'arena' && e.t !== 'flag'));
  ok(changed.length >= 1 && said, 'no rival reshaped its year: ' + changed.join(','));
}
// the buy rate report: after a big night, After the show says the buys against the forecast and what moved them
{
  const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }); let it = null;
  for (let w = 0; w < 5 && !it; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
    while (S.qi < S.queue.length && !it) { const big = S.queue[S.qi].big, c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); }
      if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); if (big) it = E.afterShow(S).items.find(x => x.k === 'buys'); }
    if (!it) E.endWeek(S); }
  ok(it && /forecast of [\d,]+/.test(it.line) && it.detail.length >= 2, 'the buy rate report is missing: ' + JSON.stringify(it));
}
// promoting the next big night: the spend builds hype each week, it lifts the night, it costs money, and it starts again after
{
  const run = lvl => { const S = E.newGame(E.universe().promotions[1].id, 3, { name: 'R' }); E.evSpend(S, lvl); let wk = null;
    for (let w = 0; w < 5; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
      while (S.qi < S.queue.length) { const big = S.queue[S.qi].big, c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); }
        if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); if (big && !wk) wk = { hype: S.reports[0].hype, after: E.evHype(S).h }; }
      const r = E.endWeek(S); }
    return { wk, adv: S.promos[S.player].hist.slice(-1)[0].adv }; };
  const a = run(0), b = run(2);
  ok(a.wk && b.wk && b.wk.hype > a.wk.hype && b.wk.after === 0 && b.adv > a.adv, 'promoting the night did nothing: ' + JSON.stringify({ a, b }));
}
// the press scrum after a big night: one question, three answers, each does what it says
{
  const S = E.newGame('pdw', 1, { name: 'R' }); let sc = null;
  for (let w = 0; w < 5 && !sc; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    sc = S.inbox.find(e => e.type === 'scrum' && !e.done); if (!sc) E.endWeek(S); }
  ok(sc && sc.choices.length === 3 && !sc.choices[1].includes(S.reports[0].name), 'no scrum after a big night, or it sells the night just gone: ' + JSON.stringify(sc && sc.choices));
  if (sc) { const h0 = S.hype || 0; E.resolveEvent(S, sc.id, 1); ok((S.hype || 0) > h0, 'selling the next big night did not build hype'); }
}
// a dark month: no big night that month, the next big night is the one after, and its crowd is hungrier
{
  const S = E.newGame('pdw', 1, { name: 'R' }), now = E.events(S).find(e => e.now).m, nx = (now + 1) % 12; ok(E.evSet(S, nx, { t: 'dark' }).ok, 'a month could not go dark');
  let bigs = [];
  for (let w = 0; w < 12; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0)); S.queue.forEach(q => { if (q.big) bigs.push(E.cal(S.week).month); });
    while (S.qi < S.queue.length) { const c = E.suggest(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); } E.endWeek(S); }
  ok(bigs.indexOf(nx) < 0 && bigs.length >= 2, 'the dark month still had a big night: ' + bigs.join(','));
  const T = E.newGame('pdw', 1, { name: 'R' }), L = E.events(T).filter(e => !e.flag && !e.now).map(e => e.m); [0, 1, 2].forEach(i => E.evSet(T, L[i], { t: 'dark' }));
  ok(!E.evSet(T, L[3], { t: 'dark' }).ok, 'a fourth dark month was allowed');
}
// each kind of company starts its year in its own shape, and a tentpole limit holds
{
  const S = E.newGame('pdw', 1, { name: 'R' }), k = id => S.promos[id].events.map(e => e.t);
  ok(k('whw').filter(t => t === 'tent').length === 3, 'the corporate giant does not have three tentpoles: ' + k('whw'));
  ok(k('ttt').filter(t => t === 'taped').length === 4, 'the underdog does not have taped specials: ' + k('ttt'));
  ok(k('ocw').includes('tourn') && k('kjp').includes('tourn'), 'the sport-first and all-women companies have no tournament month');
  const L = E.events(S).filter(e => !e.flag && !e.now && e.t !== 'tent'); let made = E.events(S).filter(e => e.t === 'tent').length;
  for (const e of L) { if (made >= 4) break; if (E.evSet(S, e.m, { t: 'tent' }).ok) made++; }
  const more = E.events(S).find(e => !e.flag && !e.now && e.t !== 'tent'); ok(!more || !E.evSet(S, more.m, { t: 'tent' }).ok, 'a fifth tentpole was allowed');
}
// the tournament month: its winner is promised the top title match at the flagship
{
  const S = E.newGame('ocw', 1, { name: 'R' }); let q = null;
  for (let w = 0; w < 48 && !q; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0));
    while (S.qi < S.queue.length) { const c = E.suggestSmart(S), pr = E.preShow(S, c); if (pr) { E.resolvePre(S, c, 0); E.fitShow(S, c); } if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); }
    q = S.quests.find(x => x.type === 'shot' && /won the tournament/.test(x.text)); E.endWeek(S); }
  ok(q && E.cal(q.due).month === S.promos.ocw.flagship, 'no tournament winner was promised the flagship: ' + JSON.stringify(q));
}
if (fails) { console.log('FAILED: ' + fails); process.exit(1); }
console.log('test-events: all passed');
