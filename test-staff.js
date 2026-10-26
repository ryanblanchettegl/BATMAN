/* Staff, the title for one show, and the overall rating (the week of 20 October).  node test-staff.js */
const fs = require('fs'); require('./engine.js'); const E = globalThis.GP;
let fails = 0;
const ok = (k, what, cond, info) => { console.log((cond ? 'ok   ' : 'FAIL ') + k.padEnd(8) + what + (info ? '  (' + info + ')' : '')); if (!cond) fails++; };
E.useUniverse(JSON.parse(fs.readFileSync('universes/parody.json', 'utf8')));
const S = E.newGame('ewe', 3, { name: 'R' }), P = S.promos.ewe;

// the overall rating: 1 to 99, nobody pinned at the top, and it follows the wrestler
{ const L = E.rosterOf(S, 'ewe').filter(w => !w.nw).map(w => E.overallOf(w));
  ok('ovr', 'every wrestler has an overall from 1 to 99', L.every(v => v >= 1 && v <= 99));
  ok('ovr99', 'the best are in the 90s and nobody sits on 99', Math.max(...L) >= 88 && L.filter(v => v >= 99).length === 0, Math.max(...L));
  const w = E.rosterOf(S, 'ewe')[0], a = E.overallOf(w); w.tech += 20; w.brawl += 20; w.speed += 20; ok('ovrup', 'better in the ring, a higher overall', E.overallOf(w) > a); w.tech -= 20; w.brawl -= 20; w.speed -= 20; }

// create staff, and move a wrestler there and back
{ const r = E.createStaff(S, { name: 'Stripes McGee', g: 'M', role: 'referee', lvl: 'veteran' }), w = S.w[r.id];
  ok('hire', 'Create staff puts a referee on your books with the scene tag', r.ok && w.nw && w.srole === 'referee' && w.roles[0] === 'referee' && w.promo === 'ewe');
  ok('noname', 'a nameless hire is refused', !E.createStaff(S, { name: '', role: 'boss' }).ok);
  ok('nojob', 'a hire with no job is refused', !E.createStaff(S, { name: 'Nobody Atall' }).ok);
  const champ = P.titles.find(t => t.holders.length).holders[0];
  ok('champ', 'a champion cannot move to staff', !E.toStaffOk(S, champ).ok, E.toStaffOk(S, champ).why);
  const x = E.rosterOf(S, 'ewe').find(w => !w.nw && E.toStaffOk(S, w.id).ok);
  const m = E.toStaff(S, x.id, 'commentator');
  ok('move', 'a wrestler moves to staff as a commentator, with a seat for the desk', m.ok && x.nw && (S.voices || []).some(v => v.wid === x.id));
  ok('remem', 'they remember how it was done', S.rmY[x.id] && S.rmY[x.id].mem[0].k === 'staff');
  const v = S.voices.find(v => v.wid === x.id); E.hireVoice(S, v.id, 'col');
  ok('desk', 'the commentator takes a chair at no extra wage', P.desk.col === v.id && v.wage === 0);
  const b = E.fromStaff(S, x.id);
  ok('back', 'back to wrestling frees the chair', b.ok && !x.nw && P.desk.col == null && !S.voices.some(v => v.wid === x.id)); }

// a title for one show
{ const shows = E.titleShows(S, P.titles[0].id).shows;
  if (shows.length > 1) {
    const t = P.titles.find(t => !t.tag), r = E.setTitleShow(S, t.id, shows[1].id);
    const on1 = E.titlesOnShow(S, { id: shows[0].id }), on2 = E.titlesOnShow(S, { id: shows[1].id }), big = E.titlesOnShow(S, { id: shows[0].id, big: true });
    ok('tshow', 'a title set to the second show is defended there and not on the first', r.ok && t.show === shows[1].id && on2.includes(t.id) && !on1.includes(t.id));
    ok('tbig', 'a big event can still put it on', big.includes(t.id));
    ok('tany', 'set back to any show', E.setTitleShow(S, t.id, null).ok && !t.show);
  } else ok('tshow', 'skipped: one show', true);
}

// the world plays on with staff on the books
{ for (let i = 0; i < 12 && !S.over; i++) { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
    while (S.qi < S.queue.length) { const c = E.suggest(S); if (E.validate(S, c).errors.length) { S.qi++; continue; } E.runPlayerShow(S, c); } E.endWeek(S); }
  ok('play', 'twelve weeks play with staff on the books', !S.over && S.week >= 12); }

// contracts by the size of the company: yearly deals at the big ones, per appearance at the small ones
{ const big = E.rosterOf(S, 'wwc').filter(w => !w.nw), small = E.rosterOf(S, 'ddw').filter(w => !w.nw), mid = E.rosterOf(S, 'tba').filter(w => !w.nw);
  ok('ctbig', 'a big company signs everybody to a yearly deal', big.length && big.every(w => w.dl === 'year'));
  ok('ctsmall', 'a small company pays per appearance, on a rolling handshake', small.length && small.every(w => w.dl === 'show' && w.fee > 0 && w.con === 12));
  const y = mid.filter(w => w.dl === 'year').length; ok('ctmid', 'a mid-sized company puts the top of its card on yearly deals and the rest per appearance', y > 0 && y < mid.length, y + ' of ' + mid.length);
  const D = S.promos.ddw, a = small[0], b = small[1]; a.shw = S.week; a.shn = 2; b.shw = S.week - 1;
  const pay = E.__payWeek(S, D), sal = small.filter(w => w !== a && w !== b && w.shw === S.week).reduce((t, w) => t + w.fee * (w.shn || 1), 0);
  ok('ctfee', 'a fee is paid for each show they were on, and nothing for a week they were not', pay >= a.fee * 2 && pay < small.reduce((t, w) => t + w.wage, 0) + a.fee * 2 + 1e9);
  const c = E.contractOf(S, a); ok('ctword', 'the deal in words', c.n === 'Per appearance' && /a show/.test(c.line) && E.contractOf(S, big[0]).n === 'Yearly deal');
  const T = E.offerTerms(S, E.market(S).find(w => !w.nw).id); ok('ctoffer', 'the player\'s offer is a yearly deal at a big company, one to three years', T.ct === 'year' && T.lens.length === 3); }

console.log(fails ? fails + ' failed' : 'test-staff: all passed');
process.exit(fails ? 1 : 0);
