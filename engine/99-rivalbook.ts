/* Rival bookers (docs/plans/booker-progression.md, Ryan 28 October: "Named, with a style"). Every rival company has a
   named booker with a level and a build that fits its model. They level at the player's pace (about 6 levels the first
   year, 4 the second, then 3), spend each point by their model's lean, and what they hold changes how their company plays:
   every branch plays: Creative lifts their matches, Locker room their wrestlers' effort, Office (Negotiation) cuts their
   wage bill and Clout lifts their popularity a little after each show, Eye grows their young wrestlers. Kept on P.bk; made on first read, so a world
   needs nothing. Their level and style show on the World page. Never rnd(S). */
import { L as $L } from './_gen/legacy.js';
import { E, h01, rosterOf } from './00-core';
import { EFX, MQX, NEWX, SHOWX, WEEKX } from './10-match';
import { TREE, treeNeed, treeSpent, treeSync } from './65-youtree';
import { xpNeed } from './65-you';

// which branch each kind of company leans to first (the corporate one Office, the outlaw one Creative)
const BK_LEAN: any = {
  corporate: ['office', 'locker', 'eye', 'creative'], outlaw: ['creative', 'locker', 'eye', 'office'],
  workrate: ['eye', 'creative', 'locker', 'office'], purist: ['eye', 'locker', 'creative', 'office'],
  underdog: ['locker', 'creative', 'eye', 'office'], startup: ['office', 'creative', 'eye', 'locker'],
  spectacle: ['creative', 'eye', 'locker', 'office'], tradition: ['locker', 'eye', 'creative', 'office'],
  joshi: ['eye', 'locker', 'creative', 'office'], classic: ['creative', 'office', 'locker', 'eye']
};
const BK_STYLE: any = { creative: 'The storyteller', office: 'The suit', locker: 'The players’ booker', eye: 'The scout' };
// what each number does for a rival, in words for the World page
const BK_SAYS: any = { creative: 'Better matches: Creative', motivator: 'Harder workers: Motivator', talk: 'Cheaper wages: Negotiation', clout: 'More buzz: Clout', eye: 'Young talent grows: Eye' };
const BK_FIRST = ['Dale', 'Marty', 'Gina', 'Rocco', 'Lena', 'Hal', 'Tess', 'Vic', 'Nora', 'Buck', 'Ida', 'Sal', 'Rhoda', 'Gus', 'Wren', 'Abe', 'Flo', 'Cyrus', 'Dot', 'Lyle'];
const BK_LAST = ['Pruitt', 'Okafor', 'Delacroix', 'Haskins', 'Moreau', 'Vance', 'Tamura', 'Kowalczyk', 'Ibarra', 'Lindqvist', 'Mabry', 'Stroud', 'Quintero', 'Fennimore', 'Adair', 'Castellan', 'Rourke', 'Nakashima', 'Brandvold', 'Ortega'];

// spend every point waiting: the cheapest open skill in the first branch of its lean that has one
function bkSpend(bk: any) {
  for (let guard = 0; guard < 99 && bk.pts > 0; guard++) {
    let took = false;
    for (const br of bk.lean) {
      const sp = treeSpent(bk, br), n = TREE[br].nodes.find((x: any) => !bk.tree[x.id] && !x.soon && sp >= treeNeed(br, x.t) && bk.pts >= x.c);
      if (n) { bk.tree[n.id] = 1; bk.pts -= n.c; took = true; break; }
    }
    if (!took) break;
  }
  treeSync(bk);
}
function bkGain(bk: any, n: number) { bk.xp += n; while (bk.xp >= xpNeed(bk.lvl)) { bk.xp -= xpNeed(bk.lvl); bk.lvl++; bk.pts++; } bkSpend(bk); }
/* The booker of a rival company, made the first time it is asked for. */
// on() is false only when a test turns the bookers off (S.nobk) to measure what they add
function on(S: any) { return !S.nobk; }
export function rivalBk(S: any, P: any) {
  if (!P || P.id === S.player) return null;
  if (P.bk) return P.bk;
  const h = (k: string) => h01(S.seed + ':bk:' + P.id + ':' + k);
  const lean = BK_LEAN[P.model] || BK_LEAN.classic, lvl = 1 + Math.floor((P.image || 30) / 15);
  const used = new Set((S.order || []).map((x: string) => S.promos[x] && S.promos[x].bk && S.promos[x].bk.name).filter(Boolean));
  let f = Math.floor(h('f') * BK_FIRST.length), l = Math.floor(h('l') * BK_LAST.length), name = '';
  for (let i = 0; i < 400; i++) { name = BK_FIRST[(f + i) % BK_FIRST.length] + ' ' + BK_LAST[(l + Math.floor(i / BK_FIRST.length) * 7 + i) % BK_LAST.length]; if (!used.has(name)) break; }
  const bk: any = P.bk = { name, lvl: 1, xp: 0, pts: 0, tree: {}, lean, sk: {} };
  for (let l = 1; l < lvl; l++) bkGain(bk, xpNeed(bk.lvl));
  treeSync(bk); return bk;
}
// a week's experience at the player's pace, whatever level they start at: 6 levels the first year, 4 the second, then 3
function bkRate(S: any, bk: any) { const y = Math.floor((S.week - 1) / 48), per = y <= 0 ? 6 : (y === 1 ? 4 : 3); return xpNeed(bk.lvl) * per / 48; }
NEWX.push(function (S: any) { (S.order || []).forEach((id: string) => { if (id !== S.player) rivalBk(S, S.promos[id]); }); });
WEEKX.push(function (S: any) {
  (S.order || []).forEach((id: string) => { const P = S.promos[id]; if (!P || id === S.player || P.dead) return; const bk = rivalBk(S, P); if (!bk) return;
    const was = bk.lvl; bkGain(bk, bkRate(S, bk));
    if (on(S)) { const k = bk.sk;
      // Negotiation: a little back on the wage bill; Eye: their three most promising young wrestlers grow
      if (k.talk && $L.payWeek) P.cash += Math.round($L.payWeek(S, P) * 0.02 * k.talk);
      if (k.eye) rosterOf(S, P.id).filter((w: any) => !w.nw && w.age <= 25 && w.pot > (w.xp || 0)).sort((a: any, b: any) => b.pot - a.pot).slice(0, 3).forEach((w: any) => { w.xp += 0.04 * k.eye; }); }
    if (bk.lvl > was && bk.lvl % 5 === 0) $L.news(S, 'world', bk.name + ', who books ' + P.name + ', has reached level ' + bk.lvl + '.'); });
});
// Clout: the office's pull gets their shows talked about
SHOWX.push(function (S: any, P: any) { if (S.cal || !P || P.id === S.player || !on(S) || !P.bk) return; const c = P.bk.sk.clout || 0; if (c) P.image = Math.min(100, P.image + 0.02 * c); });
// what they hold plays: Creative lifts their matches, Locker room their wrestlers' effort
MQX.push(function (ctx: any) { const S = ctx.S, P = ctx.P; if (!P || P.id === S.player || !on(S)) return null; const bk = rivalBk(S, P); const c = bk ? bk.sk.creative || 0 : 0; return c ? { d: 0.3 * c, x: null } : null; });
EFX.push(function (ctx: any) { const S = ctx.S, P = ctx.P; if (!P || P.id === S.player || !on(S)) return 0; const bk = rivalBk(S, P); return bk ? 0.6 * (bk.sk.motivator || 0) : 0; });

/* A rival's booker for the screens: name, level, style and the numbers the tree gives them. Reads only. */
E.rivalBooker = function (S: any, id: string) {
  const P = S.promos[id]; if (!P || id === S.player) return null; const bk = P.bk;   // made when the game starts (its first shows)
  if (!bk) return null; const top = Object.keys(BK_SAYS).sort((a, b) => (bk.sk[b] || 0) - (bk.sk[a] || 0))[0];
  return { name: bk.name, lvl: bk.lvl, style: BK_STYLE[bk.lean[0]], lean: bk.lean[0], sk: Object.assign({}, bk.sk), skills: Object.keys(bk.tree).length,
    does: bk.sk[top] ? BK_SAYS[top] + ' ' + bk.sk[top] : 'Still learning' };
};
$L.rivalBk = rivalBk;
