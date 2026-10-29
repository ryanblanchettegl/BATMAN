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
// soon: an action or a trade-off whose effect is not built yet (step 4); it cannot be taken until it is
export const TREE: any = {
  creative: { n: 'Creative', d: 'Stories, promos and angles.', nodes: [
    { id: 'cr_pen', t: 0, k: 'bonus', sk: 'creative', n: 'Sharp pen' },
    { id: 'cr_ear', t: 0, k: 'bonus', sk: 'creative', n: 'An ear for a line' },
    { id: 'cr_room', t: 1, k: 'bonus', sk: 'creative', n: 'Run the room' },
    { id: 'cr_pull', t: 1, k: 'bonus', sk: 'clout', n: 'Pull in the office' },
    { id: 'cr_audible', t: 1, k: 'action', soon: 1, n: 'Call an audible', d: 'Once a show, change a finish while the match is on the air.' },
    { id: 'cr_twist', t: 2, k: 'bonus', sk: 'creative', n: 'Twist the knife' },
    { id: 'cr_weight', t: 2, k: 'bonus', sk: 'clout', n: 'Weight to throw' },
    { id: 'cr_shock', t: 2, k: 'trade', soon: 1, n: 'Shock value', d: 'Big angles hit harder, but the owner trusts a wild hand a little less.' },
    { id: 'cr_master', t: 3, k: 'bonus', sk: 'creative', n: 'Master storyteller' },
    { id: 'cr_boss', t: 3, k: 'bonus', sk: 'clout', n: 'The book is yours' },
    { id: 'cr_third', t: 3, k: 'action', soon: 1, n: 'A third act', d: 'A story can take a third twist before it goes stale.' }
  ] },
  office: { n: 'Office', d: 'Money, contracts and the network.', nodes: [
    { id: 'of_deal', t: 0, k: 'bonus', sk: 'talk', n: 'Deal maker' },
    { id: 'of_read', t: 0, k: 'bonus', sk: 'talk', n: 'Read the table' },
    { id: 'of_clause', t: 1, k: 'action', soon: 1, n: 'One more clause', d: 'Offer a wrestler one more clause than they ask for.' },
    { id: 'of_firm', t: 1, k: 'bonus', sk: 'talk', n: 'Firm hand' },
    { id: 'of_sweeten', t: 2, k: 'action', soon: 1, n: 'Sweeten the deal', d: 'Spend booking power for a better network renewal.' },
    { id: 'of_closer', t: 2, k: 'bonus', sk: 'talk', n: 'Closer' },
    { id: 'of_lean', t: 2, k: 'trade', soon: 1, n: 'Lean books', d: 'Wages cost less, but the roster grumbles about the money.' },
    { id: 'of_shark', t: 3, k: 'bonus', sk: 'talk', n: 'Shark' },
    { id: 'of_sponsor', t: 3, k: 'action', soon: 1, n: 'Sponsor patience', d: 'A sponsor gives you one more week before walking.' }
  ] },
  locker: { n: 'Locker room', d: 'People.', nodes: [
    { id: 'lr_steady', t: 0, k: 'bonus', sk: 'motivator', n: 'Steady voice' },
    { id: 'lr_door', t: 0, k: 'bonus', sk: 'motivator', n: 'Open door' },
    { id: 'lr_meet', t: 1, k: 'action', soon: 1, n: 'Closed-door meeting', d: 'Once a month, settle real heat between two people.' },
    { id: 'lr_trust', t: 1, k: 'bonus', sk: 'motivator', n: 'Earned trust' },
    { id: 'lr_patience', t: 2, k: 'action', soon: 1, n: 'Patience', d: 'Held problems wait a week longer before they lapse.' },
    { id: 'lr_leader', t: 2, k: 'bonus', sk: 'motivator', n: 'Leader' },
    { id: 'lr_hard', t: 2, k: 'trade', soon: 1, n: 'Hard but fair', d: 'Discipline lands harder, but the room warms to you more slowly.' },
    { id: 'lr_father', t: 3, k: 'bonus', sk: 'motivator', n: 'Locker room leader' },
    { id: 'lr_extra', t: 3, k: 'action', soon: 1, n: 'One more hour', d: 'One more action point every week.' }
  ] },
  eye: { n: 'Eye', d: 'Seeing what is hidden.', nodes: [
    { id: 'ey_scout', t: 0, k: 'bonus', sk: 'eye', n: 'Scout' },
    { id: 'ey_tape', t: 0, k: 'action', soon: 1, n: 'Watch the tape', d: 'The road agent says a little more about a match you have seen before.' },
    { id: 'ey_judge', t: 1, k: 'bonus', sk: 'eye', n: 'Good judge' },
    { id: 'ey_smell', t: 1, k: 'action', soon: 1, n: 'Smell trouble', d: 'See the cause of one held matter early.' },
    { id: 'ey_word', t: 2, k: 'action', soon: 1, n: 'Read the weather', d: 'The Director\u2019s word on the desk says a little more.' },
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
E.treeInfo = function (S: any) {   // reads only
  const bk = Object.assign({}, S.booker, { tree: S.booker.tree || {} });
  return { pts: bk.pts, lvl: bk.lvl, total: treeTotal(), owned: Object.keys(bk.tree).length,
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
// the old one-point-a-skill spend is gone; the tree takes its place
E.spendPoint = function () { return false; };

$L.treeHas = treeHas; $L.treeSync = treeSync;
