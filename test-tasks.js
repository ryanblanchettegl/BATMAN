/* This week's tasks: what should be filled in before a show is booked or the week ends.  Run: node test-tasks.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(5), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const ids = S => E.tasks(S).list.filter(t => t.state === 'todo').map(t => t.id);
const st = (S, id) => (E.tasks(S).list.find(t => t.id === id) || {}).state;

{ const S = E.newGame('pdw', 3, { name: 'R' }), P = S.promos.pdw;
  let T = E.tasks(S);
  ok('new', 'a new game opens with the commentary chairs and the sponsor offers on the list', ['desk-pbp', 'desk-col', 'sponsors'].every(id => ids(S).indexOf(id) >= 0), ids(S).join(', '));
  ok('new', 'every task says where to go and what the button is called', T.list.every(t => t.state === 'done' || (t.to && t.label && t.text)));
  ok('new', 'the list counts what is to do', T.todo === ids(S).length && T.show <= T.todo && T.strict === true);
  ok('gate', 'open tasks stop the show and the week', !E.taskGate(S, 'show').ok && !E.taskGate(S, 'week').ok && E.taskGate(S, 'show').left.length === T.show);
  /* doing a task ticks it */
  const V = E.voices(S).pool;
  E.hireVoice(S, V[0].id, 'pbp');
  ok('do', 'filling a chair ticks that task and leaves the other', st(S, 'desk-pbp') === 'done' && st(S, 'desk-col') === 'todo');
  /* waving one off */
  const w = E.taskWave(S, 'desk-col');
  ok('wave', 'a task can be left for another week', w.ok && st(S, 'desk-col') === 'waved' && ids(S).indexOf('desk-col') < 0, w.msg);
  ok('wave', 'and put back', E.taskUnwave(S, 'desk-col').ok && st(S, 'desk-col') === 'todo');
  E.taskWave(S, 'desk-col');
  ok('wave', 'a task that is not open cannot be waved', !E.taskWave(S, 'nope').ok);
  /* sponsors: sign what can be signed */
  for (let g = 0; g < 4 && ids(S).indexOf('sponsors') >= 0; g++) { const i = S.spOffers.findIndex(o => E.sponsorOk(S, o)); E.acceptSponsor(S, i); }
  ok('do', 'signing the sponsors on offer ticks that task', st(S, 'sponsors') === 'done', st(S, 'sponsors'));
  ok('gate', 'with everything done or waved the show may run', E.taskGate(S, 'show').ok, E.taskGate(S, 'show').left.join(' | '));
  /* a vacant belt */
  const t = P.titles[0], was = t.holders.slice();
  t.holders = [];
  ok('belt', 'a vacant title is a task', ids(S).indexOf('title-' + t.id) >= 0 && !E.taskGate(S, 'show').ok);
  ok('belt', 'it does not stop the card opening, since the card is where it is answered', E.taskGate(S, 'book').ok);
  S.card = [{ title: t.id, sides: [] }];
  ok('belt', 'a match for it on the card answers the task', ids(S).indexOf('title-' + t.id) < 0);
  S.card = []; t.holders = was;
  /* a contract about to end */
  const star = S.w.filter(x => x.promo === 'pdw' && !x.nw).sort((a, b) => b.ovr - a.ovr)[0], con = star.con;
  star.con = 1;
  ok('deal', 'a contract ending next week is a task', ids(S).indexOf('con-' + star.id) >= 0 && /next week/.test(E.tasks(S).list.find(x => x.id === 'con-' + star.id).text));
  E.renew(S, star.id, 48);
  ok('deal', 'renewing it ticks the task', st(S, 'con-' + star.id) === 'done');
  /* the inbox holds the week, not the show */
  S.inbox.push({ id: 99999, type: 'x', text: 'A test matter.', choices: ['Yes', 'No'], done: false });
  const row = E.tasks(S).list.find(x => x.id === 'inbox');
  ok('inbox', 'an unanswered matter is a task that cannot wait', row && row.state === 'todo' && !row.waive && !E.taskWave(S, 'inbox').ok);
  ok('inbox', 'it holds the week but not the show', E.taskGate(S, 'show').ok && !E.taskGate(S, 'week').ok);
  S.inbox = S.inbox.filter(e => e.id !== 99999);
  /* optional things never block */
  ok('opt', 'action points and promises due are listed but never in the way', E.tasks(S).list.some(x => x.state === 'optional') && E.taskGate(S, 'show').ok && E.taskGate(S, 'week').ok, E.tasks(S).list.filter(x => x.state === 'optional').map(x => x.id).join(', '));
  /* the rule can be turned off */
  E.taskUnwave(S, 'desk-col');
  ok('rule', 'an open task blocks again', !E.taskGate(S, 'show').ok);
  const off = E.setGate(S, false);
  ok('rule', 'turned off, tasks are reminders only', off.ok && E.taskGate(S, 'show').ok && E.tasks(S).todo === 1 && E.tasks(S).strict === false);
  E.setGate(S, true);
  ok('rule', 'turned back on, they block', !E.taskGate(S, 'show').ok);
  /* a new week brings a waved task back */
  E.taskWave(S, 'desk-col');
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
  while (S.qi < S.queue.length) { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); } S.card = card; if (E.validate(S, card).errors.length) { S.qi++; continue; } E.runPlayerShow(S, card); }
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
  E.endWeek(S);
  ok('week', 'next week the waved task is back on the list and last week’s ticks are gone', st(S, 'desk-col') === 'todo' && !E.tasks(S).list.some(x => x.id === 'desk-pbp'), E.tasks(S).list.map(x => x.id + ':' + x.state).join(', '));
}
/* every company: the list builds without errors all through a year, and the engine itself never stops a game */
{ let bad = 0, n = 0, most = 0;
  for (const id of Object.keys(E.newGame('pdw', 1, { name: 'R' }).promos)) {
    const S = E.newGame(id, 7, { name: 'R' });
    for (let wk = 0; wk < 48 && !S.over; wk++) {
      try { const T = E.tasks(S); n++; most = Math.max(most, T.todo); if (T.list.some(t => !t.text || /undefined|NaN/.test(t.text))) bad++; } catch (e) { bad++; console.log(id, wk, e.message); }
      S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
      if (S.owner && S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
      while (S.qi < S.queue.length) { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); } S.card = card; if (E.validate(S, card).errors.length) { S.qi++; continue; } E.runPlayerShow(S, card); }
      S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
      E.endWeek(S);
    }
  }
  ok('all', 'a year of lists for every company, no broken lines', bad === 0 && n > 300, n + ' lists, most to do in one week ' + most);
}
/* a target that is settled says how it went, on the desk and after the show; the owner's trust is shown moving */
{ let hit = null, miss = null, own = 0, ownWhy = 0, apBad = 0, shows = 0;
  for (const seed of [3, 5, 8]) { const S = E.newGame('pdw', seed, { name: 'R' });
    for (let wk = 0; wk < 30 && !(hit && miss); wk++) {
      E.tasks(S);
      while (S.qi < S.queue.length) { E.tasks(S); E.runPlayerShow(S, E.suggest(S)); shows++; const r = S.reports[0];
        if (r.owner && r.owner.was != null && r.owner.why && r.owner.why.length) ownWhy++;
        const A = E.afterShow(S); if (A && A.items.some(x => x.k === 'owner' && /trust (up|down|unchanged)/.test(x.line))) own++;
        (r.targets || []).forEach(t => { const row = E.tasks(S).list.find(x => /^q-/.test(x.id) && x.text === t.t); const it = A && A.items.find(x => x.line === t.t);
          if (row && it) { if (t.ok && row.hit && !row.miss && /needed/.test(t.t)) hit = t.t; if (!t.ok && row.miss && /needed .*got /.test(t.t)) miss = t.t; } }); }
      const ap = E.tasks(S).list.find(x => x.id === 'ap' && x.state === 'done'); if (ap && E.backstage(S).ap > 0 && !ap.miss) apBad++;
      S.inbox.forEach(e => { if (!e.done) E.resolveEvent(S, e.id, 0); }); E.endWeek(S); } }
  ok('tgt', 'a target that was hit says so on the desk and after the show', !!hit, hit || 'none seen');
  ok('tgt', 'a target that was missed says Missed, with what was needed and what it got', !!miss, miss || 'none seen');
  ok('own', 'every show says where the owner’s trust moved and why', own === shows && ownWhy === shows, own + ' and ' + ownWhy + ' of ' + shows);
  ok('ap', 'action points are never called spent while some are left', apBad === 0, apBad + ' weeks');
}
/* the key on the bottom line: its colour, and the numbers that moved */
{ const S = E.newGame('pdw', 3, { name: 'R' }), P = S.promos.pdw;
  ok('tone', 'a step that wants the booker first is a stop', E.advance(S).k === 'task' && E.advance(S).tone === 'stop', JSON.stringify(E.advance(S).tone));
  const c0 = P.cash, i0 = P.image, t0 = S.owner.trust;
  ok('mv', 'a new game marks the numbers as they stand, and says nothing about moving yet', !!S.was && S.was.cash === c0 && S.was.image === i0 && S.was.trust === t0 && S.was.w === 1 && !S.wasPrev && E.moved(S) === null, JSON.stringify(S.was));
  E.setGate(S, false);
  ok('tone', 'booking a show moves the week on', E.advance(S).k === 'book' && E.advance(S).tone === 'go');
  const book = () => { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); } S.card = card; return card; };
  book();
  ok('tone', 'a card that is ready puts a show on the air', E.advance(S).k === 'run' && E.advance(S).tone === 'air', E.advance(S).k + ' ' + E.advance(S).tone);
  E.runPlayerShow(S, S.card);
  let M = E.moved(S);
  ok('mv', 'after the first show, each number says how far it has moved this week and which way', !!M && M.now && M.cash.d === Math.round(P.cash - c0) && M.cash.dir === (M.cash.d >= 1000 ? 1 : (M.cash.d <= -1000 ? -1 : 0)) && Math.abs(M.image.d - Math.round((P.image - i0) * 10) / 10) < 1e-9 && Math.abs(M.trust.d - Math.round((S.owner.trust - t0) * 10) / 10) < 1e-9 && /this week/.test(M.since), JSON.stringify(M));
  ok('mv', 'a move too small to show is called steady', E.moved(S).image.dir === (Math.abs(E.moved(S).image.d) >= 0.1 ? Math.sign(E.moved(S).image.d) : 0));
  P.cash -= 250000; M = E.moved(S);
  ok('mv', 'money spent since then is counted too', M.cash.d === Math.round(P.cash - c0) && M.cash.dir === -1);
  while (S.qi < S.queue.length) { const card = book(); if (E.validate(S, card).errors.length) { S.qi++; continue; } E.runPlayerShow(S, card); }
  S.inbox.forEach(e => { if (!e.done) E.resolveEvent(S, e.id, 0); });
  ok('tone', 'ending the week is its own colour', E.advance(S).k === 'week' && E.advance(S).tone === 'end', E.advance(S).k + ' ' + E.advance(S).tone);
  E.endWeek(S); M = E.moved(S);
  ok('mv', 'when the week ends the numbers are marked again, and the last mark is kept', S.week === 2 && S.was.w === 2 && S.was.cash === P.cash && S.wasPrev.w === 1 && S.wasPrev.cash === c0, JSON.stringify([S.was, S.wasPrev]));
  ok('mv', 'until a show of the new week has run, the line says what last week did', !!M && !M.now && /last week/.test(M.since) && M.cash.d === Math.round(P.cash - c0) && Math.abs(M.image.d - Math.round((P.image - i0) * 10) / 10) < 1e-9, JSON.stringify(M));
  const c1 = P.cash; E.setGate(S, false); book(); E.runPlayerShow(S, S.card); M = E.moved(S);
  ok('mv', 'after it, the line is this week so far', M.now && /this week/.test(M.since) && M.cash.d === Math.round(P.cash - c1), JSON.stringify(M));
  E.advance(S); const A = JSON.stringify(S); E.moved(S);
  ok('mv', 'reading how they moved changes nothing', JSON.stringify(S) === A);
  const old = JSON.parse(A); delete old.was; delete old.wasPrev;
  ok('mv', 'a save from before this shows no movement, and picks it up at its next week', E.moved(old) === null && (() => { while (old.qi < old.queue.length) old.qi++; old.inbox.forEach(e => { if (!e.done) E.resolveEvent(old, e.id, 0); }); E.endWeek(old); return !!old.was && !old.wasPrev && E.moved(old) === null; })());
  const sc = E.SCENARIOS && E.SCENARIOS[0] ? E.newGame('pdw', 5, { name: 'R', scn: E.SCENARIOS[0].id }) : null;
  ok('mv', 'a scenario marks the numbers after it has set its own start', !sc || sc.was.cash === sc.promos[sc.player].cash);
}
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('tasks: all passed');
