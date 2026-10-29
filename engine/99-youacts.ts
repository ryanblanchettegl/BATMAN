/* You as the booker: what the tree's actions and trade-offs do (docs/plans/booker-progression.md, step 4).
   Most of them are one line where the system lives (each guarded by treeHas): One more hour (apMax), Patience (dirHold),
   One more clause (clausesWanted), Lean books (payWeek, moraleTarget), A third act (the twist), Shock value (segMean),
   Sponsor patience (the sponsors' week), Watch the tape (reads), Hard but fair (courtApply, youRemember), Closed-door
   meeting (the court, in apActs). This file holds the ones that need more: Call an audible on the air, Sweeten the deal
   on Storylines, Shock value's cost in trust, and what Smell trouble and Read the weather add to the desk. Never rnd(S).
   wraps: plotInfo, plotDo, airSign, dirDesk */
import { L as $L } from './_gen/legacy.js';
import { E, clamp, names } from './00-core';
import { SHOWX } from './10-match';
import { LIVEK, liveMatch } from './31-live';
import { treeHas } from './65-youtree';

/* Call an audible: once a show, when nothing else needs a call on the main event, the booker can call its finish on the air. */
LIVEK.callaud = { n: 'Call an audible', free: 1,
  pre: function (S: any, L: any, step: any) {
    if (!treeHas(S, 'cr_audible') || L.aud || step.t !== 'match' || step.i !== L.card.length - 1) return null;
    const M = liveMatch(S, L, step.i); if (!M || M.c.sides.length !== 2 || M.m.mt === 'br' || M.m.call != null || M.m.ff || M.m.nc) return null;
    L.aud = 1; const A = M.c.sides[0], B = M.c.sides[1];
    return { phase: 'mid', mi: step.i, who: A[0].id, other: B[0].id,
      text: 'The main event is on, and nothing else needs you. You have the referee’s ear: call the finish, or let them work it out.',
      why: ['Call an audible: once a show, you can call the main event’s finish on the air'], safe: 0,
      choices: [{ n: 'Let it play out', says: 'The match goes the way it was going to go.' },
        { n: names(A) + ' win' + (A.length > 1 ? '' : 's'), says: 'The word goes to the referee. ' + names(B) + ' will know you called it against them.' },
        { n: names(B) + ' win' + (B.length > 1 ? '' : 's'), says: 'The word goes to the referee. ' + names(A) + ' will know you called it against them.' }] };
  },
  run: function (S: any, L: any, ev: any, c: number) {
    const M = liveMatch(S, L, ev.mi); if (!M || !c) return 'You leave the finish alone.';
    const side = c - 1, win = M.c.sides[side], lose = M.c.sides[1 - side]; M.m.call = side;
    win.forEach((w: any) => $L.youRemember(S, w, 'audible', 'You called the finish on the air and gave them the win.', 3));
    lose.forEach((w: any) => $L.youRemember(S, w, 'audible', 'You called the finish on the air, and they took the fall.', -2));
    return 'The referee nods. ' + names(win) + ' ' + (win.length > 1 ? 'are' : 'is') + ' going over.';
  } };
$L.LIVE_ORDER.push('callaud');   // tried last of all: it never takes the place of another call

/* Shock value: segments land harder (segMean), and each booked angle on your show costs a little of the owner's trust. */
SHOWX.push(function (S: any, P: any, show: any, rep: any) {
  if (S.cal || P.id !== S.player || !treeHas(S, 'cr_shock') || !S.owner || S.owner.me) return;
  const n = (rep.segs || []).filter((r: any) => r && r.booked && $L.SEGK[r.booked] && $L.SEGK[r.booked].t === 'angle').length;
  if (n) S.owner.trust = clamp(S.owner.trust - 0.75 * n * (n + 1) / 2, 0, 100);   // each angle costs more than the one before
});

/* Sweeten the deal: booking power for a better rate at the next network renewal. */
$L.PLOT.sweeten = { n: 'Sweeten the deal', cost: 3, d: 'Wine and dine the network ahead of the next renewal. That deal pays about 8% more, however it goes: stay, move or a bidding war.' };
function sweetShow(S: any) { const P = S.promos[S.player]; return (P.shows || []).filter((sh: any) => sh.deal != null && !sh.sweet).sort((a: any, b: any) => a.deal - b.deal)[0] || null; }
const plotInfo0 = E.plotInfo;
E.plotInfo = function (S: any) { const I = plotInfo0.apply(this, arguments as any);
  if (!treeHas(S, 'of_sweeten')) I.acts = I.acts.filter((a: any) => a.id !== 'sweeten');
  else { const sh = sweetShow(S), a = I.acts.find((x: any) => x.id === 'sweeten'); if (a) { a.show = sh ? sh.n || sh.name : null; if (!sh) a.can = false; } }
  return I; };
const plotDo0 = E.plotDo;
E.plotDo = function (S: any, id: string, o: any) {
  if (id !== 'sweeten') return plotDo0.apply(this, arguments as any);
  if (!treeHas(S, 'of_sweeten')) return { ok: false, msg: 'That is not something booking power buys yet.' };
  const A = $L.PLOT.sweeten, sh = sweetShow(S);
  if (!sh) return { ok: false, msg: 'Every network deal is already sweetened.' };
  if (S.bp < A.cost) return { ok: false, msg: A.n + ' takes ' + A.cost + ' booking power. You have ' + S.bp + '.' };
  S.bp -= A.cost; sh.sweet = 1;
  return { ok: true, msg: 'The network had a good night on you. ' + (sh.n || sh.name || 'Your show') + ' gets a better rate when its deal is up in week ' + sh.deal + '.' };
};
const airSign0 = $L.airSign;
$L.airSign = function (S: any, P: any, sh: any, net: any, tier: any, rate: number) {
  if (sh && sh.sweet && P.id === S.player) { rate *= 1.08; delete sh.sweet; }
  return airSign0.call(this, S, P, sh, net, tier, rate);
};

/* Smell trouble: each held matter says how long it waits. Read the weather: the desk's word says what is driving it. */
const PART_WORDS: any = { open: 'the matters already on your desk', clocks: 'a clock close to running out', room: 'the mood in the locker room', money: 'the money', stories: 'a story near its peak', wait: 'how long it has been quiet' };
const dirDesk0 = E.dirDesk;
E.dirDesk = function (S: any) {
  const D = dirDesk0.apply(this, arguments as any);
  if (treeHas(S, 'ey_smell')) D.held.forEach((h: any) => { h.left = Math.max(0, $L.dirKeep(S) - (S.week - h.since)); });
  if (treeHas(S, 'ey_word')) { const p = E.dirInfo(S).parts; let top = null, v = 0; for (const k in PART_WORDS) if ((p[k] || 0) > v) { v = p[k]; top = k; }
    D.more = top ? 'Most of the pressure is ' + PART_WORDS[top] + '.' : 'Nothing much is pressing.'; }
  return D;
};
