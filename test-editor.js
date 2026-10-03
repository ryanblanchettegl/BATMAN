/* The World Editor's engine parts: build a world from nothing, check it, play it.  Run: node test-editor.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (label, pass, detail) => { console.log(pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(label); };
const builtIn = JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8'));

/* 1. an empty world is not playable, and the checker says why in plain words */
const W = E.edNew('Test World', 'Tester');
let v = E.edCheck(W);
ok('an empty world fails the check', !v.ok && v.errors > 0, v.errors + ' problems');
ok('every problem names a tab to go to', v.lines.every(l => ['world', 'companies', 'shows', 'belts', 'wrestlers', 'teams'].indexOf(l.tab) >= 0));
ok('problems do not use the word promotion', v.lines.every(l => !/promotion/i.test(l.msg)), v.lines.map(l => l.msg).join(' | '));

/* 2. two companies, each filled with unknowns: playable */
const a = E.edAddPromo(W, { name: 'AAA', full_name: 'Alpha Wrestling', popularity: 70, model: 'workrate' });
const b = E.edAddPromo(W, { name: 'BBB', full_name: 'Beta Wrestling', popularity: 40, model: 'joshi' });
ok('a new company arrives with a show and a top title', W.shows.length === 2 && W.titles.length === 2);
ok('an all-women company gets a women\'s title', W.titles.find(t => t.promotion_id === b.id).gender === 'F');
v = E.edCheck(W);
ok('companies without wrestlers still fail', !v.ok);
E.edFill(W, a.id, 18, 11); E.edFill(W, b.id, 12, 12);
ok('the same seed makes the same people', (() => { const X = E.edNew('x'); const p = E.edAddPromo(X, { name: 'XX' }); const Y = E.edNew('y'); const q = E.edAddPromo(Y, { name: 'XX' }); return JSON.stringify(E.edFill(X, p.id, 6, 5).map(w => w.ring_name)) === JSON.stringify(E.edFill(Y, q.id, 6, 5).map(w => w.ring_name)); })());
ok('an all-women company is filled with women', W.workers.filter(w => E.edHome(W, w.id) === b.id).every(w => w.gender === 'F'));
ok('ids are unique', new Set(W.workers.map(w => w.id)).size === W.workers.length);
v = E.edCheck(W);
ok('two filled companies pass the check', v.ok, v.lines.filter(l => l.lvl === 'error').map(l => l.msg).join(' | '));

/* 3. belts, teams, shows and ties; removing things leaves nothing pointing at them */
const ros = W.workers.filter(w => E.edHome(W, w.id) === a.id && w.gender === 'M');
const belt = W.titles.find(t => t.promotion_id === a.id); belt.holder_ids = [ros[0].id];
const tag = E.edAddTitle(W, a.id, { name: 'AAA Tag Titles', tag: true, level: 2 }); tag.holder_ids = [ros[1].id, ros[2].id];
const team = E.edAddTeam(W, a.id, 'tag'); team.member_ids = [ros[1].id, ros[2].id]; team.name = 'The Pair';
const stable = E.edAddTeam(W, a.id, 'stable'); stable.member_ids = [ros[0].id, ros[3].id, ros[4].id]; stable.leader_id = ros[0].id;
E.edAddShow(W, a.id, 'Second Show'); E.edAddRel(W, ros[0].id, ros[1].id, 'rivalry');
W.events.push({ month: 3, name: 'Spring Clash', rule: 'all_titles' });
v = E.edCheck(W);
ok('a world with belts, teams, a second show and an event passes', v.ok, v.lines.filter(l => l.lvl === 'error').map(l => l.msg).join(' | '));
E.edRemove(W, 'workers', ros[0].id);
ok('removing a champion vacates the belt', belt.holder_ids.length === 0);
ok('removing a wrestler clears teams, ties and contracts', stable.member_ids.indexOf(ros[0].id) < 0 && !stable.leader_id && W.relationships.length === 0 && !W.contracts.some(c => c.worker_id === ros[0].id));
E.edSign(W, ros[1].id, b.id);
ok('moving a wrestler to another company takes them off the old belts and teams', tag.holder_ids.indexOf(ros[1].id) < 0 && team.member_ids.indexOf(ros[1].id) < 0 && E.edHome(W, ros[1].id) === b.id);
E.edSign(W, ros[1].id, a.id); E.edSign(W, ros[5].id, null);
ok('a released wrestler is a free agent', E.edHome(W, ros[5].id) === null && E.edInfo(W).free === 1);
ok('the world still passes after the changes', E.edCheck(W).ok, E.edCheck(W).lines.filter(l => l.lvl === 'error').map(l => l.msg).join(' | '));

/* ids follow names, and nothing is left pointing at an old id */
{ const X = E.edNew('Rename');
  const p1 = E.edAddPromo(X, { name: 'NEW1' }), p2 = E.edAddPromo(X, { name: 'NEW2' }); E.edFill(X, p1.id, 6, 3); E.edFill(X, p2.id, 6, 4);
  const pid = E.edRename(X, 'promotions', p1.id, 'Zeta');
  ok('a renamed company gets an id from its name', pid === 'zeta' && X.contracts.filter(c => c.promotion_id === 'zeta').length === 6 && !X.contracts.some(c => c.promotion_id === 'new1'));
  ok('its default show and title are renamed with it', X.shows.some(s => s.promotion_id === 'zeta' && s.name === 'Zeta Weekly' && s.id === 'zeta_weekly') && X.titles.some(t => t.name === 'Zeta World Title' && t.id === 'zeta_world'));
  const w = X.workers.find(x => E.edHome(X, x.id) === 'zeta'), t = X.titles.find(x => x.promotion_id === 'zeta'); t.holder_ids = [w.id];
  const wid = E.edRename(X, 'workers', w.id, 'Captain Thunder');
  ok('a renamed wrestler keeps the belt and the contract', wid === 'captain_thunder' && t.holder_ids[0] === wid && E.edHome(X, wid) === 'zeta');
  const w2 = X.workers.find(x => x.id !== wid), same = E.edRename(X, 'workers', w2.id, 'Captain Thunder');
  ok('two people with one name still get different ids', same !== wid && new Set(X.workers.map(x => x.id)).size === X.workers.length, same);
  ok('an emptied name keeps the id', E.edRename(X, 'workers', wid, '') === wid);
  E.edRename(X, 'workers', wid, 'Captain Thunder');
  ok('the renamed world passes the check', E.edCheck(X).ok, E.edCheck(X).lines.filter(l => l.lvl === 'error').map(l => l.msg).join(' | ')); }

/* 4. the game plays the made world */
function play(pkg, pid, weeks) {
  const r = E.useUniverse(pkg); if (!r.ok) return { errs: 1, why: 'did not load' };
  const S = E.newGame(pid, 3, { name: 'R' }); let errs = 0, shows = 0;
  for (let wk = 0; wk < weeks && !S.over; wk++) {
    S.inbox.filter(e => !e.done).forEach(e => { try { E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1); } catch (x) { errs++; } });
    if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) {
      try { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) E.resolvePre(S, card, 0); if (E.validate(S, card).errors.length) { S.qi++; continue; } E.runPlayerShow(S, card); shows++; } catch (x) { errs++; S.qi++; }
    }
    try { E.endWeek(S); } catch (x) { errs++; }
  }
  const P = S.promos[pid]; return { errs, shows, nan: JSON.stringify(S).indexOf('NaN') >= 0 || !isFinite(P.cash) || !isFinite(P.image) };
}
[a.id, b.id].forEach(pid => { const r = play(W, pid, 16); ok('sixteen weeks as ' + pid + ' in the made world', r.errs === 0 && !r.nan && r.shows > 0, 'errs ' + r.errs + ', shows ' + r.shows + (r.why ? ', ' + r.why : '')); });

/* 5. removing a company takes its shows, belts, teams and contracts with it */
E.edRemove(W, 'promotions', b.id);
ok('removing a company removes what belonged to it', !W.shows.some(s => s.promotion_id === b.id) && !W.titles.some(t => t.promotion_id === b.id) && !W.contracts.some(c => c.promotion_id === b.id));
ok('a world with one company fails the check', !E.edCheck(W).ok);

/* 6. a copy of the built-in world is a separate, playable world */
const C = E.edCopy(builtIn, 'My copy');
ok('a copy has its own name and id', C.manifest.name === 'My copy' && C.manifest.id === 'my_copy' && builtIn.manifest.id !== 'my_copy');
ok('a copy of the built-in world passes the check', E.edCheck(C).ok);
C.workers[0].ring_name = 'Changed'; ok('changing the copy leaves the original alone', builtIn.workers[0].ring_name !== 'Changed');

/* 7. the same world with companies left out: a player who wants only two */
{ const ids = builtIn.promotions.map(p => p.id), keep = ['pdw', 'ttt'], out = ids.filter(x => keep.indexOf(x) < 0);
  const fa = E.edWithout(builtIn, out, false), gone = E.edWithout(builtIn, out, true);
  ok('leaving companies out keeps the ones you want', fa.promotions.map(p => p.id).join() === keep.join() && gone.promotions.length === 2);
  ok('their wrestlers become free agents', fa.workers.length === builtIn.workers.length && E.edInfo(fa).free > 250, E.edInfo(fa).free + ' free agents');
  ok('or leave the world too', gone.workers.length < 200 && E.edInfo(gone).free === E.edInfo(builtIn).free, gone.workers.length + ' people left');
  ok('nothing points at anyone who left', gone.relationships.every(r => gone.workers.some(w => w.id === r.a) && gone.workers.some(w => w.id === r.b)) && gone.contracts.every(c => keep.indexOf(c.promotion_id) >= 0));
  ok('the original world is untouched', builtIn.promotions.length === ids.length);
  ok('both smaller worlds pass the check', E.edCheck(fa).ok && E.edCheck(gone).ok, E.edCheck(fa).lines.concat(E.edCheck(gone).lines).filter(l => l.lvl === 'error').map(l => l.msg).join(' | '));
  [fa, gone].forEach((w, i) => { const r = play(w, 'ttt', 12); ok('twelve weeks in a two-company world (' + (i ? 'wrestlers gone' : 'free agents') + ')', r.errs === 0 && !r.nan && r.shows > 0, 'errs ' + r.errs + ', shows ' + r.shows); }); }

E.useUniverse(builtIn);
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-editor: all passed');
