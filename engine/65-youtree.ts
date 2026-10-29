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
// a tier opens when about three fifths of the branch's lower tiers are spent (treeNeed); four tiers
export const TREE_TIER = [0, 1, 2, 3];
export function treeNeed(br: string, t: number) { let s = 0; TREE[br].nodes.forEach((n: any) => { if (n.t < t) s += n.c; }); return Math.ceil(s * 0.6); }

export const TREE: any = {
  creative: { n: 'Creative', d: 'Stories, promos and angles.', nodes: [
    { id: 'cr_pen', t: 0, c: 1, k: 'bonus', sk: 'creative', n: 'Sharp pen', d: 'Hotter feuds and better angles.' },
    { id: 'cr_ear', t: 0, c: 1, k: 'bonus', sk: 'creative', n: 'An ear for a line', d: 'Promos land better.' },
    { id: 'cr_room', t: 1, c: 1, k: 'bonus', sk: 'creative', n: 'Run the room', d: 'Better odds on creative gambles.' },
    { id: 'cr_pull', t: 1, c: 2, k: 'bonus', sk: 'clout', n: 'Pull in the office', d: 'One more point of booking power every week.' },
    { id: 'cr_audible', t: 1, c: 2, k: 'action', n: 'Call an audible', d: 'Once a show, change a finish while the match is on the air.' },
    { id: 'cr_twist', t: 2, c: 1, k: 'bonus', sk: 'creative', n: 'Twist the knife', d: 'Twists give a story more back.' },
    { id: 'cr_weight', t: 2, c: 2, k: 'bonus', sk: 'clout', n: 'Weight to throw', d: 'One more point of booking power every week.' },
    { id: 'cr_shock', t: 2, c: 2, k: 'trade', n: 'Shock value', d: 'Big angles hit harder, but the owner trusts a wild hand a little less.' },
    { id: 'cr_master', t: 3, c: 2, k: 'bonus', sk: 'creative', n: 'Master storyteller', d: 'The best feuds burn longer.' },
    { id: 'cr_boss', t: 3, c: 3, k: 'bonus', sk: 'clout', n: 'The book is yours', d: 'One more point of booking power every week.' },
    { id: 'cr_third', t: 3, c: 3, k: 'action', n: 'A third act', d: 'A story can take a third twist before it goes stale.' }
  ] },
  office: { n: 'Office', d: 'Money, contracts and the network.', nodes: [
    { id: 'of_deal', t: 0, c: 1, k: 'bonus', sk: 'talk', n: 'Deal maker', d: 'Contracts cost a little less.' },
    { id: 'of_read', t: 0, c: 1, k: 'bonus', sk: 'talk', n: 'Read the room', d: 'Better odds when you have to talk someone round.' },
    { id: 'of_clause', t: 1, c: 2, k: 'action', n: 'One more clause', d: 'Offer a wrestler one more clause than they ask for.' },
    { id: 'of_firm', t: 1, c: 1, k: 'bonus', sk: 'talk', n: 'Firm hand', d: 'Contracts cost a little less.' },
    { id: 'of_sweeten', t: 2, c: 2, k: 'action', n: 'Sweeten the deal', d: 'Spend booking power for a better network renewal.' },
    { id: 'of_closer', t: 2, c: 1, k: 'bonus', sk: 'talk', n: 'Closer', d: 'Better odds at the table.' },
    { id: 'of_lean', t: 2, c: 2, k: 'trade', n: 'Lean books', d: 'Wages cost less, but the roster is a little less happy with the money.' },
    { id: 'of_shark', t: 3, c: 2, k: 'bonus', sk: 'talk', n: 'Shark', d: 'Contracts cost less still.' },
    { id: 'of_sponsor', t: 3, c: 3, k: 'action', n: 'Sponsor patience', d: 'A sponsor gives you one more week before walking.' }
  ] },
  locker: { n: 'Locker room', d: 'People.', nodes: [
    { id: 'lr_steady', t: 0, c: 1, k: 'bonus', sk: 'motivator', n: 'Steady voice', d: 'Steadier morale.' },
    { id: 'lr_door', t: 0, c: 1, k: 'bonus', sk: 'motivator', n: 'Open door', d: 'More effort in the ring.' },
    { id: 'lr_meet', t: 1, c: 2, k: 'action', n: 'Closed-door meeting', d: 'Once a month, settle real heat between two people.' },
    { id: 'lr_trust', t: 1, c: 1, k: 'bonus', sk: 'motivator', n: 'Earned trust', d: 'Steadier morale.' },
    { id: 'lr_patience', t: 2, c: 2, k: 'action', n: 'Patience', d: 'Held problems wait a week longer before they lapse.' },
    { id: 'lr_leader', t: 2, c: 1, k: 'bonus', sk: 'motivator', n: 'Leader', d: 'More effort in the ring.' },
    { id: 'lr_hard', t: 2, c: 2, k: 'trade', n: 'Hard but fair', d: 'Discipline lands harder, but the room warms to you more slowly.' },
    { id: 'lr_father', t: 3, c: 2, k: 'bonus', sk: 'motivator', n: 'Locker room leader', d: 'The steadiest morale.' },
    { id: 'lr_extra', t: 3, c: 3, k: 'action', n: 'One more hour', d: 'One more action point every week.' }
  ] },
  eye: { n: 'Eye', d: 'Seeing what is hidden.', nodes: [
    { id: 'ey_scout', t: 0, c: 1, k: 'bonus', sk: 'eye', n: 'Scout', d: 'See potential in young wrestlers; the road agent reads surer.' },
    { id: 'ey_tape', t: 0, c: 1, k: 'action', n: 'Watch the tape', d: 'The road agent says a little more about a match you have seen before.' },
    { id: 'ey_judge', t: 1, c: 2, k: 'bonus', sk: 'eye', n: 'Good judge', d: 'Surer reads on every match.' },
    { id: 'ey_smell', t: 1, c: 2, k: 'action', n: 'Smell trouble', d: 'See the cause of one held matter early.' },
    { id: 'ey_word', t: 2, c: 2, k: 'action', n: 'Read the weather', d: 'The Director’s word on the desk says a little more.' },
    { id: 'ey_seer', t: 3, c: 3, k: 'bonus', sk: 'eye', n: 'Seer', d: 'Your staff spot more problems, and the agent tells you more about each match.' }
  ] }
};
// a node costs one point, the top tier two: about 43 in all, so a long career (about twelve years) can fill it
for (const b in TREE) TREE[b].nodes.forEach((n: any) => { n.c = n.t === 3 ? 2 : 1; });
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
E.treeInfo = function (S: any) {
  const bk = S.booker; if (!bk.tree) bk.tree = {};
  return { pts: bk.pts, lvl: bk.lvl, total: treeTotal(), owned: Object.keys(bk.tree).length,
    branches: Object.keys(TREE).map(b => { const sp = treeSpent(bk, b);
      return { id: b, n: TREE[b].n, d: TREE[b].d, spent: sp,
        tiers: TREE_TIER.map(t => { const need = treeNeed(b, t); return { t, need, open: sp >= need,
          nodes: TREE[b].nodes.filter((n: any) => n.t === t).map((n: any) => ({ id: n.id, n: n.n, d: n.d, k: n.k, c: n.c, has: !!bk.tree[n.id],
            can: !bk.tree[n.id] && sp >= need && bk.pts >= n.c })) }; }) }; }) };
};
E.treeSpend = function (S: any, id: string) {
  const bk = S.booker, n = treeNode(id); if (!n) return { ok: false, msg: 'There is no such skill.' };
  if (!bk.tree) bk.tree = {};
  if (bk.tree[id]) return { ok: false, msg: 'You already have ' + n.n + '.' };
  if (treeSpent(bk, n.br) < treeNeed(n.br, n.t)) return { ok: false, msg: 'Spend ' + (treeNeed(n.br, n.t) - treeSpent(bk, n.br)) + ' more in ' + TREE[n.br].n + ' to open this.' };
  if (bk.pts < n.c) return { ok: false, msg: 'It costs ' + n.c + ' skill point' + (n.c > 1 ? 's' : '') + '.' };
  bk.pts -= n.c; bk.tree[id] = 1; treeSync(bk);
  return { ok: true, msg: n.n + ': ' + n.d };
};
// the old one-point-a-skill spend is gone; the tree takes its place
E.spendPoint = function () { return false; };

$L.treeHas = treeHas; $L.treeSync = treeSync;
