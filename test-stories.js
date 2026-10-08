/* Stories with a length: short, medium and long feuds, their planned endings, chapters, and what happens when an ending is missed.
   node test-stories.js */
const fs = require('fs'); require('./engine.js'); const E = globalThis.GP;
E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json', 'utf8')));
let fails = 0; const ok = (c, t) => { console.log((c ? 'ok   ' : 'FAIL ') + t); if (!c) fails++; };
const big = w => E.cal(w).wom === 4;
function game(pid) { const S = E.newGame(pid || 'whw', 3, { name: 'R' }); return S; }
function playWeek(S, fn) {
  S.inbox.filter(e => !e.done).forEach(e => E.resolveEvent(S, e.id, e.type === 'handover' ? 0 : 1));
  if (S.owner.pending) E.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' });
  while (S.qi < S.queue.length) { if (S.noLp) S.lp = null; const card = E.suggest(S);   /* noLp: the flagship long plan would take these two for its own main event */ if (fn) fn(S, card); const pr = E.preShow(S, card); if (pr) { E.resolvePre(S, card, 0); E.fitShow(S, card); } const v = E.validate(S, card); if (v.errors.length) { S.qi++; continue; } E.runPlayerShow(S, card); }
  E.endWeek(S);
}
/* two healthy people of the same gender on the player's roster who are in no story */
function pair(S) {
  const R = E.rosterOf(S, S.player).filter(w => !w.nw && w.inj <= 0 && !E.feudsFor(S, w.id).length).sort((a, b) => b.ovr - a.ovr);
  const a = R[2], b = R.find(w => w !== a && w.g === a.g && w.id !== a.id && R.indexOf(w) > 4); return [a, b];
}
function start(S, len) {
  const [a, b] = pair(S);
  return E.startStory(S, a.id, b.id, len, 'test');
}

// 1. the three lengths and where each ends
{
  const S = game(), f = start(S, 'm'), p = E.feudPlan(S, f);
  ok(f.len === 'm' && big(f.pay) && f.pay - f.start >= 5 && f.pay - f.start <= 8, 'a medium story ends at a big event 5 to 8 weeks out (in ' + (f.pay - f.start) + ')');
  ok(p.n === 'Medium' && /Hallows|Crown|.+/.test(p.at) && p.in === f.pay - S.week, 'the plan names the length and the night: ' + p.at);
  const s = start(S, 's');
  ok(s.len === 's' && s.pay - s.start >= 2 && s.pay - s.start <= 4, 'a short story ends 2 to 4 weeks out (in ' + (s.pay - s.start) + ')');
  const l = start(S, 'l');
  ok(l.len === 'l' && l.ch && l.ch.length === 3 && l.ch.every(big) && l.pay === l.ch[2] && l.pay - l.start <= 24 && l.ch[0] - l.start >= 5, 'a long story has three chapters at big events, the last inside 24 weeks: ' + l.ch.map(w => w - l.start).join(', '));
  ok(E.feudSetLen(S, s.id, 'm') && s.len === 'm' && big(s.pay), 'a story can change length, and its ending moves with it');
}
// 2. the act comes from the calendar
{
  const S = game(), f = start(S, 'm'), acts = [];
  for (let i = 0; i < 9 && !f.res; i++) { acts.push(E.feudAct(f, S)); playWeek(S); }
  const mono = acts.every((a, i) => !i || a >= acts[i - 1]);
  ok(acts[0] === 1 && acts.includes(4) && mono, 'a medium story moves through its acts week by week: ' + acts.join(' '));
  const s = start(S, 's'); const a0 = E.feudAct(s, S);
  ok(a0 === 1, 'a short story opens with a spark');
}
// 3. the heat a short story can reach
{
  const S = game(), f = start(S, 's');
  for (let i = 0; i < 12; i++) E.heatStory(S, f, 9);
  ok(f.heat <= 60, 'a short story never gets hotter than 60 (' + Math.round(f.heat) + ')');
}
// 4. it ends on the night it was meant to, not before
{
  const S = game(), f = start(S, 'm');
  let earlyEnd = false, endWeek = null, wk = 0;
  while (!f.res && wk++ < 14) { const before = S.week; playWeek(S); if (f.res) endWeek = f.end; if (f.res && before < f.pay) earlyEnd = true; }
  ok(!earlyEnd, 'a medium story does not end before its night');
  ok(f.res && !f.dead && endWeek != null && endWeek >= f.pay && big(endWeek), 'it is settled on its night (planned ' + f.pay + ', ended ' + endWeek + ')');
}
// 5. a long story closes its chapters and goes on
{
  const S = game(), f = start(S, 'l'); S.noLp = 1; let wk = 0, sawChapter = false;
  while (!f.res && wk++ < 30) { playWeek(S); if ((f.chd || 0) >= 1 && !f.res) sawChapter = true; }
  ok(sawChapter, 'a long story closes a chapter and is still running (' + (f.chd || 0) + ' of ' + f.ch.length + ')');
  ok((f.res && !f.dead) || f.chd >= 2, 'it keeps going chapter by chapter: ' + f.chd + ' closed, ' + (f.res ? 'settled in week ' + f.end : 'still running, last chapter at week ' + f.pay));
}
// 6. a missed ending: a medium story gets one more big event, then cools
{
  const S = game(), f = start(S, 'm'), pay0 = f.pay, ids = f.a.concat(f.b);
  const keepOff = (S, card) => { for (let i = card.length - 1; i >= 0; i--) if (card[i].sides.some(sd => sd.some(id => ids.includes(id)))) card.splice(i, 1); E.fitShow(S, card); };
  while (S.week <= pay0) playWeek(S, keepOff);
  ok(f.slip && f.pay > pay0 && big(f.pay), 'a missed ending moves once to the next big event (' + pay0 + ' to ' + f.pay + ')');
  const h0 = f.heat; while (S.week <= f.pay + 1 && !f.res) playWeek(S, keepOff);
  ok(f.res || f.heat < h0, 'missed twice, it cools (' + Math.round(h0) + ' to ' + Math.round(f.heat) + ')');
}
// 7. an old save: a feud with no length gets one
{
  const S = game(), f = start(S, 'm'); delete f.len; delete f.pay; f.start = S.week - 20;
  const p = E.feudPlan(S, f);
  ok(f.len === 'm' && f.pay > S.week && big(f.pay), 'a story from an old save gets a length and an ending ahead of today (' + p.n + ', in ' + p.in + ')');
}
// 8. a year of play: stories end on their nights, few fizzle, nothing breaks
{
  const S = game('pdw'); const seen = {};
  for (let i = 0; i < 48; i++) { playWeek(S); S.feuds.forEach(f => { seen[f.id] = f; }); }
  const L = Object.values(seen).filter(f => f.promo === S.player && f.res), onTime = L.filter(f => !f.dead && f.end >= f.pay), dead = L.filter(f => f.dead);
  ok(L.length >= 10 && onTime.length >= L.length * 0.5, 'a year: ' + L.length + ' stories ended, ' + onTime.length + ' on their night, ' + dead.length + ' fizzled');
  ok(S.feuds.every(f => f.len && f.pay), 'every story has a length and an ending');
}
// 9. Start a story: what the pop-up shows, what it costs, what it refuses, and who remembers
{
  const S = game(), P = S.promos[S.player], R = E.storyPeople(S).filter(w => !w.n && !w.hurt), M = R.filter(w => w.g === 'M'), F = R.find(w => w.g === 'F');
  const pv = E.storyPreview(S, M[1].id, M[5].id);
  ok(pv.ok && pv.lens.length === 3 && pv.lens.every(x => x.at && x.in > 0) && pv.lens[2].ch.length === 3, 'the preview names each length, its night and the long one\'s chapters');
  ok(pv.know.length >= 1 && typeof pv.read === 'string' && pv.read.length > 5, 'the office says what it knows about them together: ' + pv.read);
  if (F) ok(!E.storyPreview(S, M[1].id, F.id).ok && !E.storyStart(S, M[1].id, F.id, 'm').ok, 'two who cannot wrestle each other cannot be in a story');
  ok(!E.storyStart(S, M[1].id, M[1].id, 's').ok, 'nobody is in a story with themselves');
  S.bp = 2; const no = E.storyStart(S, M[1].id, M[5].id, 'l');
  ok(!no.ok && /3 booking power/.test(no.msg) && S.bp === 2, 'a long story needs three booking power: ' + no.msg);
  const was = (S.rmY && S.rmY[M[1].id] ? S.rmY[M[1].id].v : 0), r = E.storyStart(S, M[1].id, M[5].id, 'm'), f = E.feudOf(S, M[1].id, M[5].id);
  ok(r.ok && S.bp === 0 && f && f.len === 'm' && f.chose === 1, 'a medium story costs two: ' + r.msg);
  ok(S.rmY[M[1].id].v > was && S.rmY[M[1].id].mem[0].k === 'story', 'both remember who gave them the story');
  ok(!E.storyPreview(S, M[1].id, M[5].id).ok, 'two already in a story cannot start another one together');
  ok(E.storyPreview(S, M[1].id, M[6].id).warn.some(t => /already in/.test(t)), 'somebody in a story already gets a warning, not a refusal');
}
console.log(fails ? 'test-stories: ' + fails + ' failed' : 'test-stories: all passed'); process.exit(fails ? 1 : 0);
