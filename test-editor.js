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
      try { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); } if (E.validate(S, card).errors.length) { S.qi++; continue; } E.runPlayerShow(S, card); shows++; } catch (x) { errs++; S.qi++; }
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
/* ---- random helpers: a fresh name, and ratings for a place on the card ---- */
{ const pkg = JSON.parse(JSON.stringify(builtIn)), names = new Set(pkg.workers.map(x => x.ring_name)), nm = E.edRandomName(pkg, 'F', 4);
  ok('a random name is one nobody in the world has', !!nm && !names.has(nm), nm);
  const w = pkg.workers.find(x => E.edHome(pkg, x.id)), con = () => pkg.contracts.find(c => c.worker_id === w.id);
  const lo = E.edSetTier(pkg, w.id, 'jobber', 3).ratings.overness, loPush = con().push_level, hi = E.edSetTier(pkg, w.id, 'main_eventer', 3).ratings.overness;
  ok('set ratings for a main eventer gives more overness than for an opener, and the push follows', hi > lo + 15 && loPush === 'jobber' && con().push_level === 'main_eventer', lo + ' -> ' + hi); }
/* ---- unknown free agents ---- */
{ const pkg = JSON.parse(JSON.stringify(builtIn)), n0 = pkg.workers.length, m = E.edFillFree(pkg, 6, 7);
  ok('Make unknowns adds six unsigned wrestlers with names nobody has', m.length === 6 && pkg.workers.length === n0 + 6 && m.every(w => !E.edHome(pkg, w.id)) && new Set(pkg.workers.map(x => x.ring_name)).size === pkg.workers.length);
  ok('the world still passes its check', E.edCheck(pkg).errors === 0); }
/* ---- managers ---- */
{ const pkg = JSON.parse(JSON.stringify(builtIn)), w = pkg.workers.find(x => E.edHome(pkg, x.id) && !(x.roles || []).includes('manager'));
  const m = E.edAddWorker(pkg, { ring_name: 'Test Manager', promotion_id: E.edHome(pkg, w.id) }); m.roles = ['manager'];
  ok('a manager is offered, the same company first', E.edManagers(pkg, w.id).some(x => x.id === m.id && x.same) && E.edManagers(pkg, w.id).findIndex(x => !x.same) !== 0);
  E.edSetManager(pkg, w.id, m.id); ok('picking one writes manager_id and the check accepts it', w.manager_id === m.id && E.edCheck(pkg).errors === 0);
  ok('somebody without the Manager job cannot manage', E.edSetManager(pkg, w.id, pkg.workers.find(x => !(x.roles || []).includes('manager') && x.id !== w.id).id) === null && w.manager_id === m.id);
  E.edSetManager(pkg, w.id, null); ok('Nobody unties them', !w.manager_id); }
/* ---- several at once ---- */
{ const pkg = JSON.parse(JSON.stringify(builtIn)), ids = pkg.workers.filter(x => E.edHome(pkg, x.id)).slice(0, 3).map(x => x.id), to = pkg.promotions[1].id;
  ok('sign all picked moves every one of them', E.edMany(pkg, ids, 'sign', to) === 3 && ids.every(id => E.edHome(pkg, id) === to));
  ok('release all picked makes them free agents', E.edMany(pkg, ids, 'release') === 3 && ids.every(id => !E.edHome(pkg, id)));
  const n0 = pkg.workers.length; ok('delete all picked removes them', E.edMany(pkg, ids, 'delete') === 3 && pkg.workers.length === n0 - 3 && E.edCheck(pkg).errors === 0); }
/* ---- brands ---- */
{ const pkg = JSON.parse(JSON.stringify(builtIn)), p = pkg.promotions[0], b = E.edAddBrand(pkg, p.id, 'Red'), b2 = E.edAddBrand(pkg, p.id, 'Red');
  ok('brands get their own ids, even with the same name', b.id !== b2.id && p.brands.length === 2);
  const sh = pkg.shows.find(x => x.promotion_id === p.id), t = pkg.titles.find(x => x.promotion_id === p.id), c = pkg.contracts.find(x => x.promotion_id === p.id);
  E.edPutBrand(sh, b.id); E.edPutBrand(t, b.id); E.edPutBrand(c, b.id); E.edSetBrand(pkg, p.id, b2.id, { name: 'Gold', dev: true });
  ok('a brand can be renamed and made developmental', p.brands[1].name === 'Gold' && p.brands[1].dev === true);
  ok('a world with brands passes the check', E.edCheck(pkg).errors === 0);
  E.edRemoveBrand(pkg, p.id, b.id);
  ok('removing a brand clears it from its shows, belts and contracts', !sh.brand && !t.brand && !c.brand && p.brands.length === 1); }
/* ---- the world's lists: sponsors, columnists, newcomers' names ---- */
{ const pkg = JSON.parse(JSON.stringify(builtIn));
  ok('a list is set one name a line, blanks and repeats dropped', E.edSetList(pkg, 'sponsors', 'Acme Rope\n\nAcme Rope\nBolt Cola') === 2 && pkg.sponsors.join() === 'Acme Rope,Bolt Cola');
  E.edSetList(pkg, 'columnists', 'The Bell Ringer'); E.edSetList(pkg, 'first_m', 'A1\nA2\nA3\nA4\nA5\nA6\nA7\nA8'); E.edSetList(pkg, 'last', 'B1\nB2\nB3\nB4\nB5\nB6\nB7\nB8');
  ok('the lists read back as text', E.edListText(pkg, 'columnists') === 'The Bell Ringer' && E.edListText(pkg, 'first_m').split('\n').length === 8);
  ok('a world with its own lists passes the check', E.edCheck(pkg).errors === 0);
  const fill = E.edFillFree(pkg, 3, 2); ok('newcomers are named from the world\'s lists (women from the game\'s own first names when the world has none)', fill.every(w => / B\d$/.test(w.ring_name) && (w.gender === 'F' || /^A\d /.test(w.ring_name))), fill.map(w => w.ring_name).join(', '));
  E.useUniverse(pkg); const S = E.newGame('pdw', 1, { name: 'R' });
  ok('a game played in the world uses its columnist', S.columnist === 'The Bell Ringer', S.columnist);
  E.edSetList(pkg, 'sponsors', ''); ok('an empty box goes back to the game\'s own list', !pkg.sponsors);
  E.useUniverse(builtIn); }
/* ---- quick starts ---- */
for (const k of ['territory', 'nine']) { const pkg = E.edQuick(k, '', 5), models = new Set(pkg.promotions.map(p => p.model));
  ok('quick start "' + k + '" is ready to play', E.edCheck(pkg).errors === 0 && pkg.promotions.length === (k === 'nine' ? 9 : 2) && (k !== 'nine' || models.size === 9), pkg.promotions.length + ' companies, ' + models.size + ' models'); }
/* ---- a running game kept as a world ---- */
{ E.useUniverse(builtIn); const S = E.newGame('pdw', 2, { name: 'R' }); for (let w = 0; w < 4; w++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, 0)); while (S.qi < S.queue.length) E.runPlayerShow(S, E.suggest(S)); E.endWeek(S); }
  const pk = E.exportUniverse(S, { name: 'Kept', id: 'kept_wk5' });
  ok('a game kept as a world passes the World Editor check', E.edCheck(pk).errors === 0, (E.edCheck(pk).lines || []).filter(l => l.lvl === 'error').slice(0, 2).map(l => l.msg).join(' | '));
  E.useUniverse(pk); const T = E.newGame('pdw', 1, { name: 'R' }); ok('and a new game starts in it', !!T.promos.pdw && T.w.length > 50); E.useUniverse(builtIn); }
/* ---- a health line per company ---- */
{ const pkg = JSON.parse(JSON.stringify(builtIn)), p = pkg.promotions[0], H = E.edHealth(pkg, p.id);
  ok('a company in the built-in world reads healthy', H.length >= 2 && !H.some(l => l.warn), H.map(l => l.t).join(' | '));
  pkg.contracts.filter(c => c.promotion_id === p.id && c.push_level === 'main_eventer').forEach(c => { const w = pkg.workers.find(x => x.id === c.worker_id); w.ratings.overness = 15; });
  const H2 = E.edHealth(pkg, p.id); ok('a weak top of the card is warned about in words', H2[0].warn && /far below/.test(H2[0].t), H2[0].t); }
/* ---- make a copy: a wrestler keeps their company, a belt starts vacant, a team empty, a company brings shows and belts, not people ---- */
{ const pkg = JSON.parse(JSON.stringify(builtIn)), w = pkg.workers.find(x => E.edHome(pkg, x.id)), cw = E.edDup(pkg, 'workers', w.id);
  ok('a copied wrestler has a new id and name and the same company', cw && cw.id !== w.id && /\(copy\)$/.test(cw.ring_name) && E.edHome(pkg, cw.id) === E.edHome(pkg, w.id) && !!E.edHome(pkg, cw.id));
  const t = pkg.titles.find(x => x.holder_ids && x.holder_ids.length), ct = E.edDup(pkg, 'titles', t.id);
  ok('a copied belt starts vacant', ct && ct.holder_ids.length === 0 && t.holder_ids.length > 0);
  const tm = pkg.teams[0], ctm = E.edDup(pkg, 'teams', tm.id);
  ok('a copied team starts with no members', ctm && ctm.member_ids.length === 0 && tm.member_ids.length > 0);
  const p = pkg.promotions[0], s0 = pkg.shows.filter(x => x.promotion_id === p.id).length, b0 = pkg.titles.filter(x => x.promotion_id === p.id).length, cp = E.edDup(pkg, 'promotions', p.id);
  ok('a copied company brings its shows and belts but not its roster', cp && pkg.shows.filter(x => x.promotion_id === cp.id).length === s0 && pkg.titles.filter(x => x.promotion_id === cp.id).length === b0 && !pkg.contracts.some(x => x.promotion_id === cp.id));
  ok('the ids stay unique', new Set(pkg.workers.map(x => x.id)).size === pkg.workers.length && new Set(pkg.titles.map(x => x.id)).size === pkg.titles.length); }
/* a company's own big events (NEXT.md 1.15): set in the editor, and a game from the world starts with them */
{
  const pkg = E.edCopy(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')), 'Own events'), pid = pkg.promotions[1].id;
  E.edPromoEvent(pkg, pid, 6, { name: 'Cellar Night ' }); E.edPromoEvent(pkg, pid, 6, { type: 'ballroom' }); E.edPromoEvent(pkg, pid, 7, { type: 'gimmick' });
  const pe = pkg.promotions[1].events || [];
  ok('a company keeps its own events in the package', pe.length === 2 && pe[0].name === 'Cellar Night ' && pe[0].type === 'ballroom' && pe[1].type === 'gimmick' && !!pe[1].name, JSON.stringify(pe));
  E.useUniverse(pkg); const S = E.newGame(pid, 3, { name: 'R' }), P = S.promos[S.player];
  ok('a game from that world starts with them', P.events[5].n === 'Cellar Night' && P.events[5].t === 'ballroom' && P.events[6].t === 'gimmick', JSON.stringify(P.events.slice(5, 7)));
  E.edPromoEvent(pkg, pid, 6, { name: '', type: 'arena' }); E.edPromoEvent(pkg, pid, 7, { name: '', type: 'arena' });
  ok('clearing a month gives it back to the world list', !pkg.promotions[1].events, JSON.stringify(pkg.promotions[1].events));
}

// television: a world names its own networks, and a weekly show its network and years on the air
{ const pkg = JSON.parse(JSON.stringify(builtIn)), sh = pkg.shows.find(x => x.promotion_id === 'pdw');
  E.edSetList(pkg, 'net_major', 'Lantern Family One\nHarbour Broadcasting\nHarbour Broadcasting'); E.edSetList(pkg, 'net_small', 'Only One');
  ok('a network list keeps each name once', E.edListText(pkg, 'net_major').split('\n').length === 2 && pkg.networks.major.length === 2);
  ok('the editor offers a world\'s own networks, and the game\'s own where a list is too short', E.edNetNames(pkg, 2)[0] === 'Lantern Family One' && E.edNetNames(pkg, 0).length > 2);
  sh.network = 'Lantern Family One'; sh.network_size = 2; sh.years_on_air = 21;
  ok('a world with networks and a show on one passes the check', E.edCheck(pkg).errors === 0);
  E.useUniverse(pkg); const S = E.newGame('pdw', 1, { name: 'R' }), g = S.promos.pdw.shows.find(x => x.name === sh.name);
  ok('the show is on the world\'s network, at its size', g && g.net === 'Lantern Family One' && g.tier === 2, g && g.net + ' ' + g.tier);
  ok('and has been on the air as long as the world says', g && Math.floor((S.week - g.on) / 48) === 21, g && String(S.week - g.on));
  ok('a family word in the name gives it a family taste', E.netInfo(S).some(x => x.net === 'Lantern Family One' && x.taste === E.NET_TASTE.family.n), JSON.stringify(E.netInfo(S)).slice(0, 160));
  const out = E.exportUniverse(S, { name: 'TV', id: 'tv_kept' }), o = out.shows.find(x => x.name === sh.name);
  ok('the world written back out keeps its networks and the show\'s time on the air', out.networks && out.networks.major[0] === 'Lantern Family One' && o && o.network === 'Lantern Family One' && o.network_size === 2 && o.years_on_air === 21, JSON.stringify(o));
  E.useUniverse(builtIn); }

// import: wrestlers from another world, with the moves and scenes they use, and a wrestler from a file
{ const src = JSON.parse(JSON.stringify(builtIn)), dst = E.edQuick('territory', 'Import test', 5), n0 = dst.workers.length;
  const w0 = src.workers[0]; w0.look = { name: w0.ring_name, physical_attributes: { sex: 'M' }, moveset: [{ name: 'My move', stage: 'mid', scene: 'scene-mine' }] };
  src.scenes = (src.scenes || []).concat([{ v: 1, id: 'scene-mine', name: 'My move', when: 'move', set: 'ring', slots: [], keys: [{ t: 0, figs: {}, props: [] }] }]);
  const L = E.edImportList(src); ok('the import list names every wrestler in the other world', L.length === src.workers.length && L[0].name === w0.ring_name);
  const got = E.edImportWorkers(dst, src, [w0.id, src.workers[1].id]);
  ok('picked wrestlers come in as free agents', dst.workers.length === n0 + 2 && got.every(w => !E.edHome(dst, w.id)));
  ok('the move they made in Create a Move comes with them', (dst.scenes || []).some(x => x.id === 'scene-mine'));
  E.edImportWorkers(dst, src, [w0.id]); ok('importing the same wrestler twice gives the copy its own id', new Set(dst.workers.map(w => w.id)).size === dst.workers.length);
  const f = E.edImportLook(dst, { name: 'File Person', physical_attributes: { sex: 'F' } }); ok('a wrestler file comes in as a free agent', f && f.ring_name === 'File Person' && f.gender === 'F' && !!f.look);
  ok('a world with imported wrestlers passes the check', E.edCheck(dst).errors === 0, JSON.stringify(E.edCheck(dst).lines.slice(0, 2))); }

// export: wrestlers to a file, and the file back into another world
{ const src = JSON.parse(JSON.stringify(builtIn)), w0 = src.workers[0], w1 = src.workers[1];
  w0.look = { name: w0.ring_name, physical_attributes: { sex: 'M' }, moveset: [{ name: 'My move', stage: 'mid', scene: 'scene-mine2' }] };
  src.scenes = (src.scenes || []).concat([{ v: 1, id: 'scene-mine2', name: 'My move', when: 'move', set: 'ring', slots: [], keys: [{ t: 0, figs: {}, props: [] }] }]);
  const f = JSON.parse(JSON.stringify(E.edExportWorkers(src, [w0.id, w1.id])));
  ok('Export writes the whole wrestlers and the scenes their moves use', f.kind === 'wrestlers' && f.workers.length === 2 && f.workers[0].ratings && f.scenes.some(x => x.id === 'scene-mine2'));
  const dst = E.edQuick('territory', 'Export test', 9), got = E.edImportFile(dst, f);
  ok('the file comes into a new world as free agents, ratings, look and moves', got && got.length === 2 && got[0].ratings.overness === w0.ratings.overness && !!got[0].look && (dst.scenes || []).some(x => x.id === 'scene-mine2'));
  ok('a file that is not a wrestler is refused', E.edImportFile(dst, { hello: 1 }) === null); }

// import the rest: scenes and moves, promos and angles, match rules; nothing already there is overwritten
{ const src = JSON.parse(JSON.stringify(builtIn)), dst = E.edQuick('territory', 'Things test', 4);
  src.scenes = [{ v: 1, id: 'scene-a', name: 'A move', when: 'move', set: 'ring', slots: [], keys: [{ t: 0, figs: {}, props: [] }] }];
  E.edNewSegKind(src, 'angle'); E.edNewStip(src, 'cage');
  ok('a world lists its scenes, promos and rules to import', E.edThingList(src, 'scenes').length === 1 && E.edThingList(src, 'segkinds').length === 1 && E.edThingList(src, 'stips').length === 1);
  const n = E.edImportThings(dst, src, 'scenes', ['scene-a']) + E.edImportThings(dst, src, 'segkinds', [src.segkinds[0].id]) + E.edImportThings(dst, src, 'stips', [src.stips[0].id]);
  ok('they come into the other world', n === 3 && dst.scenes.length === 1 && dst.segkinds.length === 1 && dst.stips.length === 1);
  E.edImportThings(dst, src, 'scenes', ['scene-a']); ok('importing one again gives it its own id', dst.scenes.length === 2 && dst.scenes[1].id !== 'scene-a');
  ok('the world still passes the check', E.edCheck(dst).errors === 0); }

if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('test-editor: all passed');
