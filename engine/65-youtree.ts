/* You as the booker: the skill tree (docs/plans/booker-progression.md, TASKS.md 0aw; Ryan's go-ahead 28 October).
   Four branches, each in tiers. A tier opens when enough points are spent in its branch. A node is one of three kinds:
   a bonus (it adds to one of the old five numbers, b.sk, which the rest of the engine already reads, capped where they
   were), a new action (a flag the action's own page checks; built in step 4), or a trade-off (a gain with a cost).
   The whole tree can be filled in a long career (Ryan: "fill it all"). Spending is E.treeSpend; b.tree holds what is
   bought; b.sk is worked out from it by treeSync(). Old saves get nothing special (Ryan, 29 October). Never rnd(S). */
import { L as $L } from './_gen/legacy.js';
import { E } from './00-core';

// what each old number can reach, as before: the tree never moves one further
export const TREE_CAP: any = { creative: 5, talk: 5, eye: 3, motivator: 5, clout: 3 };

// What each bonus adds, said once and plainly: every bonus node raises one of these by one (capped as TREE_CAP).
export const SK_SAYS: any = {
  creative: 'Creative +1: hotter feuds, better angles, better odds on creative gambles',
  talk: 'Negotiation +1: cheaper contracts and better odds when you talk someone round',
  motivator: 'Motivator +1: steadier morale and more effort in the ring',
  eye: 'Eye +1: surer road agent reads and potential seen in young wrestlers',
  clout: 'Clout +1: one more point of booking power every week'
};
// soon: an action or a trade-off whose effect is not built yet; it cannot be taken until it is (step 4 built them all, engine/99-youacts.ts)
export const TREE: any = {
  creative: { n: 'Creative', d: 'Stories, promos and angles.', nodes: [
    { id: 'cr_pen', t: 0, k: 'bonus', sk: 'creative', n: 'Sharp pen' },
    { id: 'cr_ear', t: 0, k: 'bonus', sk: 'creative', n: 'An ear for a line' },
    { id: 'cr_room', t: 1, k: 'bonus', sk: 'creative', n: 'Run the room' },
    { id: 'cr_pull', t: 1, k: 'bonus', sk: 'clout', n: 'Pull in the office' },
    { id: 'cr_audible', t: 1, k: 'action', n: 'Call an audible', d: 'Once a show, when nothing else needs you, call the main event\u2019s finish yourself while it is on the air.' },
    { id: 'cr_twist', t: 2, k: 'bonus', sk: 'creative', n: 'Twist the knife' },
    { id: 'cr_weight', t: 2, k: 'bonus', sk: 'clout', n: 'Weight to throw' },
    { id: 'cr_shock', t: 2, k: 'trade', n: 'Shock value', d: 'Promos and angles hit harder, but every angle on a show costs the owner\u2019s trust, each more than the last.' },
    { id: 'cr_master', t: 3, k: 'bonus', sk: 'creative', n: 'Master storyteller' },
    { id: 'cr_boss', t: 3, k: 'bonus', sk: 'clout', n: 'The book is yours' },
    { id: 'cr_third', t: 3, k: 'action', n: 'A third act', d: 'A twist gives a story half as much room again before it goes stale.' }
  ] },
  office: { n: 'Office', d: 'Money, contracts and the network.', nodes: [
    { id: 'of_deal', t: 0, k: 'bonus', sk: 'talk', n: 'Deal maker' },
    { id: 'of_read', t: 0, k: 'bonus', sk: 'talk', n: 'Read the table' },
    { id: 'of_clause', t: 1, k: 'action', n: 'One more clause', d: 'A wrestler can take four clauses in a deal instead of three, and asks for less with each.' },
    { id: 'of_firm', t: 1, k: 'bonus', sk: 'talk', n: 'Firm hand' },
    { id: 'of_sweeten', t: 2, k: 'action', n: 'Sweeten the deal', d: 'On Storylines: three booking power for a better rate at your next network renewal.' },
    { id: 'of_closer', t: 2, k: 'bonus', sk: 'talk', n: 'Closer' },
    { id: 'of_lean', t: 2, k: 'trade', n: 'Lean books', d: 'Wages cost 8% less, but the roster\u2019s mood settles lower.' },
    { id: 'of_shark', t: 3, k: 'bonus', sk: 'talk', n: 'Shark' },
    { id: 'of_sponsor', t: 3, k: 'action', n: 'Sponsor patience', d: 'A sponsor gives you one more week before walking.' }
  ] },
  locker: { n: 'Locker room', d: 'People.', nodes: [
    { id: 'lr_steady', t: 0, k: 'bonus', sk: 'motivator', n: 'Steady voice' },
    { id: 'lr_door', t: 0, k: 'bonus', sk: 'motivator', n: 'Open door' },
    { id: 'lr_meet', t: 1, k: 'action', n: 'Closed-door meeting', d: 'In wrestlers\u2019 court, once a month: sit two people with real heat down and settle most of it.' },
    { id: 'lr_trust', t: 1, k: 'bonus', sk: 'motivator', n: 'Earned trust' },
    { id: 'lr_patience', t: 2, k: 'action', n: 'Patience', d: 'Held problems wait a week longer before they lapse.' },
    { id: 'lr_leader', t: 2, k: 'bonus', sk: 'motivator', n: 'Leader' },
    { id: 'lr_hard', t: 2, k: 'trade', n: 'Hard but fair', d: 'Your rulings in court land harder, but everyone warms to you more slowly.' },
    { id: 'lr_father', t: 3, k: 'bonus', sk: 'motivator', n: 'Locker room leader' },
    { id: 'lr_extra', t: 3, k: 'action', n: 'One more hour', d: 'One more action point every week.' }
  ] },
  eye: { n: 'Eye', d: 'Seeing what is hidden.', nodes: [
    { id: 'ey_scout', t: 0, k: 'bonus', sk: 'eye', n: 'Scout' },
    { id: 'ey_tape', t: 0, k: 'action', n: 'Watch the tape', d: 'The road agent reads more of every match on the sheet.' },
    { id: 'ey_judge', t: 1, k: 'bonus', sk: 'eye', n: 'Good judge' },
    { id: 'ey_smell', t: 1, k: 'action', n: 'Smell trouble', d: 'See how long each waiting matter has before it lapses.' },
    { id: 'ey_word', t: 2, k: 'action', n: 'Read the weather', d: 'The word on your desk says what is driving the week.' },
    { id: 'ey_seer', t: 3, k: 'bonus', sk: 'eye', n: 'Seer' }
  ] }
};
// a node costs one point, the top tier two (43 in all: at about 6, 4, then 3 levels a year, a career fills it in about 13 years);
// a bonus says what it adds from SK_SAYS
for (const b in TREE) TREE[b].nodes.forEach((n: any) => { n.c = n.t === 3 ? 2 : 1; if (n.k === 'bonus') n.d = SK_SAYS[n.sk] + '.'; });
// the tiers, from the data
export const TREE_TIER: number[] = (() => { let m = 0; for (const b in TREE) TREE[b].nodes.forEach((n: any) => { m = Math.max(m, n.t); }); return Array.from({ length: m + 1 }, (_, i) => i); })();
// a tier opens at about three fifths of what can be taken below it (a skill coming later does not count yet)
export function treeNeed(br: string, t: number) { let s = 0; TREE[br].nodes.forEach((n: any) => { if (n.t < t && !n.soon) s += n.c; }); return Math.ceil(s * 0.6); }
export function treeNode(id: string) { for (const b in TREE) for (const n of TREE[b].nodes) if (n.id === id) return Object.assign({ br: b }, n); return null; }
export function treeSpent(bk: any, br: string) { let s = 0; TREE[br].nodes.forEach((n: any) => { if (bk.tree && bk.tree[n.id]) s += n.c; }); return s; }
export function treeTotal() { let s = 0; for (const b in TREE) TREE[b].nodes.forEach((n: any) => { s += n.c; }); return s; }

/* b.sk from the tree: each bonus node adds one to its number, capped as before. */
export function treeSync(bk: any) {
  if (!bk) return; if (!bk.tree) bk.tree = {};
  const sk: any = { creative: 0, talk: 0, eye: 0, motivator: 0, clout: 0 };
  for (const b in TREE) TREE[b].nodes.forEach((n: any) => { if (n.k === 'bonus' && bk.tree[n.id]) sk[n.sk] = Math.min(TREE_CAP[n.sk], sk[n.sk] + 1); });
  bk.sk = sk;
}
/* Whether the booker has a node (an action or a trade-off checks this). */
export function treeHas(S: any, id: string) { const b = S && S.booker; return !!(b && b.tree && b.tree[id]); }

E.TREE = TREE;
E.bpGrantOf = function (S: any) { return $L.bpGrant(S); };   // reads only
E.treeInfo = function (S: any) {   // reads only
  const bk = Object.assign({}, S.booker, { tree: S.booker.tree || {} });
  const sk = bk.sk || {}, stand: any = {}; for (const k in TREE_CAP) stand[k] = { v: sk[k] || 0, cap: TREE_CAP[k], n: SK_SAYS[k].split(' +')[0] };
  return { pts: bk.pts, lvl: bk.lvl, stand, total: treeTotal(), owned: Object.keys(bk.tree).length,
    branches: Object.keys(TREE).map(b => { const sp = treeSpent(bk, b);
      return { id: b, n: TREE[b].n, d: TREE[b].d, spent: sp,
        tiers: TREE_TIER.map(t => { const need = treeNeed(b, t); return { t, need, open: sp >= need,
          nodes: TREE[b].nodes.filter((n: any) => n.t === t).map((n: any) => ({ id: n.id, n: n.n, d: n.d, k: n.k, sk: n.sk, c: n.c, has: !!bk.tree[n.id],
            soon: !!n.soon, can: !n.soon && !bk.tree[n.id] && sp >= need && bk.pts >= n.c })) }; }) }; }) };
};
E.treeSpend = function (S: any, id: string) {
  const bk = S.booker, n = treeNode(id); if (!n) return { ok: false, msg: 'There is no such skill.' };
  if (!bk.tree) bk.tree = {};
  if (bk.tree[id]) return { ok: false, msg: 'You already have ' + n.n + '.' };
  if (n.soon) return { ok: false, msg: n.n + ' is coming in a later update.' };
  if (treeSpent(bk, n.br) < treeNeed(n.br, n.t)) return { ok: false, msg: 'Spend ' + (treeNeed(n.br, n.t) - treeSpent(bk, n.br)) + ' more in ' + TREE[n.br].n + ' to open this.' };
  if (bk.pts < n.c) return { ok: false, msg: 'It costs ' + n.c + ' skill point' + (n.c > 1 ? 's' : '') + '.' };
  bk.pts -= n.c; bk.tree[id] = 1; treeSync(bk);
  return { ok: true, msg: n.n + '. ' + n.d };
};
/* Respec (Ryan, 28 October: "any time, at a cost"): every point comes back to spend again. It costs the owner's trust,
   or wages when the company is yours, and each time in the same year costs more (5, 8, 12, then 16 trust; one, one and a
   half, two, then two and a half weeks' wages), so a trade-off is a commitment, not a switch. Perks stay as picked. */
const RESPEC_TRUST = [5, 8, 12, 16];
E.treeRespecCost = function (S: any) {
  const bk = S.booker || {}, own = !!(S.owner && S.owner.me), P = S.promos[S.player], n = Object.keys(bk.tree || {}).length;
  const yr = Math.floor((S.week - 1) / 48), k = Math.min(3, bk.rsY === yr ? bk.rsN || 0 : 0);
  const trust = own ? 0 : RESPEC_TRUST[k], money = own ? Math.round($L.wagesWeek(S, P) * (1 + k * 0.5)) : 0, t0 = own ? 0 : Math.round(S.owner.trust);
  const why = !n ? 'There is nothing to take back yet.' : (own ? (P.cash < money ? 'It costs $' + money.toLocaleString('en-US') + ' in wages, and the company cannot pay it now.' : '')
    : (t0 <= trust ? 'It would cost ' + trust + ' of the owner\u2019s trust, and you only have ' + t0 + '. It would cost you the job.' : ''));
  return { n, own, k, trust, cash: money, t0, t1: own ? 0 : t0 - trust, can: !why, why };
};
E.treeRespec = function (S: any) {
  const bk = S.booker, C = E.treeRespecCost(S); if (!C.can) return { ok: false, msg: C.why };
  let back = 0; for (const id in bk.tree) { const n = treeNode(id); if (n) back += n.c; }
  bk.tree = {}; bk.pts += back; treeSync(bk);
  const yr = Math.floor((S.week - 1) / 48); bk.rsN = (bk.rsY === yr ? bk.rsN || 0 : 0) + 1; bk.rsY = yr;
  if (C.own) S.promos[S.player].cash -= C.cash; else S.owner.trust = Math.max(0, S.owner.trust - C.trust);
  const cost = C.own ? '$' + C.cash.toLocaleString('en-US') + ' in wages' : C.trust + ' of the owner\u2019s trust';
  $L.note(S, 'You started the tree again, for ' + cost, back + ' skill point' + (back > 1 ? 's' : '') + ' to spend again.', 'bad');
  if (!C.own) $L.news(S, 'you', S.owner.name + ' noticed you changed your whole approach. Do it again this year and it will cost more.');
  return { ok: true, msg: 'Every skill is gone and ' + back + ' point' + (back > 1 ? 's are' : ' is') + ' back to spend. It cost ' + cost + '.', back };
};
// the old one-point-a-skill spend is gone; the tree takes its place
E.spendPoint = function () { return false; };

$L.treeHas = treeHas; $L.treeSync = treeSync;
