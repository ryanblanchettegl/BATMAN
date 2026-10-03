/* The running order (src/92-shape.js) and stars instead of percentages.  Run: node test-shape.js */
require('./engine.js');
const fs = require('fs'), E = globalThis.GP, fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
const house = S => { S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1)); if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); };
const fx = s => (s.fx || []).map(f => f.x);
const matches = r => r.segs.filter(s => s.k === 'match');
const pace = w => (w.speed + w.stam) / 2;
/** A fresh game with the men of the roster sorted by a key, and a way to make a singles match. */
function game(seed) {
  const S = E.newGame('pdw', seed, { name: 'R' }); house(S);
  const men = S.w.filter(w => w.promo === 'pdw' && !w.nw && w.g === 'M' && w.inj <= 0);
  return { S, men, m: (a, b, len) => ({ mt: '1v1', sides: [[a.id], [b.id]], win: -2, title: null, stip: 'std', len: len || 'M' }) };
}
/** Run a card with no promos or angles in the way, so the running order is the only thing between the matches. */
function run(S, card) { S.card = card; S.segs = []; const P = S.promos[S.player], was = P.angles; P.angles = 0; const v = E.validate(S, card); if (v.errors.length) throw new Error(v.errors.join(' | ')); const r = E.runPlayerShow(S, card).rep; P.angles = was; return r; }

/* ---- stars ---- */
ok('stars', 'quarter steps, five stars at the top, never a percentage', E.stars(90) === '★★★★½' && E.stars(98) === '★★★★★' && E.stars(97) === '★★★★¾' && E.stars(70) === '★★★½' && E.stars(5) === '¼' && E.stars(61) === '★★★', [90, 98, 97, 70, 5, 61].map(v => E.stars(v)).join(' '));

/* ---- the opener ---- */
{ const { S, men, m } = game(3), by = men.slice().sort((a, b) => pace(b) - pace(a)), fast = by.slice(0, 2), slow = by.slice(-2), rest = men.filter(w => fast.indexOf(w) < 0 && slow.indexOf(w) < 0).sort((a, b) => b.ovr - a.ovr);
  const card = [m(fast[0], fast[1], 'S'), m(rest[4], rest[5]), m(rest[2], rest[3]), m(rest[0], rest[1], 'L')];
  const sh = E.shape(S, card);
  ok('open', 'the card names its spots', sh.roles.join('/') === 'Opener//Semi-main/Main event', sh.roles.join('/'));
  ok('open', 'a fast, short opener reads well before the show', sh.notes.some(x => x.s > 0 && /fast opener/.test(x.t)) && sh.notes.some(x => x.s > 0 && /biggest match is on last/.test(x.t)));
  const r = run(S, card), ms = matches(r);
  ok('open', 'and the report says it woke the building up', fx(ms[0]).indexOf('A fast opener woke the building up') >= 0, fx(ms[0]).join(' | '));
  ok('open', 'the match keeps what the running order needs', ms[0].sh && ms[0].sh.len === 'S' && ms[3].sh.i === 3);
}
{ const { S, men, m } = game(3), by = men.slice().sort((a, b) => pace(b) - pace(a)), slow = by.slice(-2), rest = men.filter(w => slow.indexOf(w) < 0).sort((a, b) => b.ovr - a.ovr);
  const card = [m(slow[0], slow[1], 'M'), m(rest[4], rest[5]), m(rest[2], rest[3]), m(rest[0], rest[1], 'L')];
  ok('open', 'a slow opener is flagged before the show', E.shape(S, card).notes.some(x => x.s < 0 && /opener is slow/.test(x.t)));
  const r = run(S, card), ms = matches(r);
  ok('open', 'and costs the opener', fx(ms[0]).some(x => /^A slow opener/.test(x)), fx(ms[0]).join(' | '));
  ok('open', 'the next match is still flat', fx(ms[1]).indexOf('Still flat after the opener') >= 0, fx(ms[1]).join(' | '));
}
{ const { S, men, m } = game(3), rest = men.slice().sort((a, b) => b.ovr - a.ovr);
  const card = [m(rest[6], rest[7], 'L'), m(rest[4], rest[5], 'L'), m(rest[2], rest[3], 'L'), m(rest[0], rest[1], 'L')];
  const sh = E.shape(S, card);
  ok('pace', 'a long opener and long matches back to back are flagged', sh.notes.some(x => x.s < 0 && /opener is a long match/.test(x.t)) && sh.notes.some(x => x.s < 0 && /Matches 2 and 3 are both long/.test(x.t)), sh.notes.map(x => x.t).join(' / '));
  const r = run(S, card), ms = matches(r);
  ok('pace', 'the report names both', fx(ms[0]).some(x => /^A long opener/.test(x)) && fx(ms[1]).indexOf('Two long matches back to back') >= 0 && fx(ms[2]).indexOf('Two long matches back to back') >= 0, fx(ms[1]).join(' | '));
  ok('pace', 'the main event is allowed to be long after a long match', fx(ms[3]).indexOf('Two long matches back to back') < 0);
}
/* ---- a segment between two long matches lets the crowd breathe ---- */
{ const { S, men, m } = game(3), rest = men.slice().sort((a, b) => b.ovr - a.ovr);
  const card = [m(rest[6], rest[7], 'S'), m(rest[4], rest[5], 'L'), m(rest[2], rest[3], 'L'), m(rest[0], rest[1], 'L')];
  S.card = card; S.segs = [];
  const who = []; for (let i = 0; i < E.SEGK.interview.roles.length; i++) who.push(E.segChoices(S, 'interview', who, 0)[i][0]);
  const z = E.setSeg(S, 0, { k: 'interview', who, pos: 2 });
  ok('pace', 'a promo between two long matches clears the note', z.ok && !E.shape(S, card).notes.some(x => /both long/.test(x.t)), z.msg);
}
/* ---- the main event ---- */
{ const { S, men, m } = game(3), rest = men.slice().sort((a, b) => b.ovr - a.ovr), low = rest.slice(-4);
  const card = [m(rest[6], rest[7], 'S'), m(rest[0], rest[1], 'M'), m(rest[2], rest[3], 'M'), m(low[0], low[1], 'S')];
  const sh = E.shape(S, card);
  ok('main', 'bigger names earlier and a short main event are flagged', sh.notes.some(x => x.s < 0 && /bigger match than the main event/.test(x.t)) && sh.notes.some(x => x.s < 0 && /main event is short/.test(x.t)), sh.notes.map(x => x.t).join(' / '));
  const r = run(S, card), ms = matches(r);
  ok('main', 'the report says the biggest match was not on last', fx(ms[3]).indexOf('The biggest match of the night was not on last') >= 0, fx(ms[3]).join(' | '));
}
/* ---- finishes ---- */
{ const { S, men, m } = game(3), rest = men.slice().sort((a, b) => b.ovr - a.ovr);
  const card = [m(rest[6], rest[7], 'S'), m(rest[4], rest[5]), m(rest[2], rest[3]), m(rest[0], rest[1], 'L')];
  S.bp = 99; card.forEach(c => { c.call = 0; c.ff = 'cheap'; });
  const r = run(S, card), ms = matches(r), n = ms.filter(s => fx(s).indexOf('Another dirty finish: by now it meant nothing') >= 0).length;
  ok('fin', 'the third and fourth dirty finish of a night mean nothing', ms.every(s => s.fin === 'cheap') && n === 2 && fx(ms[1]).indexOf('Another dirty finish: by now it meant nothing') < 0, ms.map(s => s.fin).join(',') + ' flagged ' + n);
}
/* ---- the automatic card follows the rules, for every company, all year ---- */
{ let bad = 0, shows = 0, hot = 0, notes = {};
  for (const id of Object.keys(E.newGame('pdw', 1, { name: 'R' }).promos)) {
    const S = E.newGame(id, 5, { name: 'R' });
    for (let wk = 0; wk < 24 && !S.over; wk++) {
      house(S);
      while (S.qi < S.queue.length) {
        const card = E.suggest(S), pr = E.preShow(S, card); if (pr) E.resolvePre(S, card, 0); S.card = card;
        if (E.validate(S, card).errors.length) { S.qi++; continue; }
        const sh = E.shape(S, card); shows++;
        sh.notes.filter(x => x.s < 0).forEach(x => { const k = x.t.replace(/\d+/g, 'N').slice(0, 40); notes[k] = (notes[k] || 0) + 1; });
        if (sh.notes.some(x => /opener is a long match/.test(x.t))) bad++;
        if (sh.notes.some(x => x.s > 0 && /fast opener/.test(x.t))) hot++;
        const r = E.runPlayerShow(S, card).rep;
        if (r.segs.some(s => s.k === 'match' && !s.sh)) bad++;
        if (r.sheet.lines.some(l => /Match of the night|Low point|main event/.test(l) && /\d%/.test(l))) bad++;
      }
      house(S); E.endWeek(S);
    }
    if (S.quests.concat(S.news.map(x => ({ text: x.t }))).some(q => /main event of \d+%|rated \d+% or better this week/.test(q.text || ''))) bad++;
  }
  ok('auto', 'suggested cards never open long, and nothing about a match is a percentage', bad === 0 && shows > 300, shows + ' shows, ' + hot + ' with a fast opener; flagged: ' + JSON.stringify(notes));
}
/* ---- what the player is asked for is asked in stars, and checked in stars ---- */
{ const S = E.newGame('pdw', 3, { name: 'R' }); let q = null;
  for (let wk = 0; wk < 30 && !q; wk++) { house(S); q = S.quests.filter(x => x.type === 'network')[0]; if (q) break; while (S.qi < S.queue.length) { const card = E.suggest(S), pr = E.preShow(S, card); if (pr) E.resolvePre(S, card, 0); S.card = card; if (E.validate(S, card).errors.length) { S.qi++; continue; } E.runPlayerShow(S, card); } house(S); E.endWeek(S); }
  ok('ask', 'a network target is worded in stars', !!q && /★/.test(q.text) && !/%/.test(q.text), q ? q.text : 'no network target in 30 weeks');
  ok('ask', 'the guide has the seven rules', E.SHAPE_GUIDE.length === 7 && E.SHAPE_GUIDE.every(r => r.n && r.d && !/—/.test(r.d)));
}
if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
console.log('shape: all passed');
