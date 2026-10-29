# You as the booker: levels and a skill tree

Ryan, 28 October 2026: "We need to build a level up system that works with the booker points you use throughout the game. We also have to build the skill tree without breaking the game." Rule 9d: this blueprint, then the questions one at a time, then the go-ahead. Nothing here is built.

## 1. What the game has today

Measured on 28 October (`engine/65-you.ts`; EWE seed 3, three years):

| Part | Today |
| --- | --- |
| Experience | `gainXp()` from shows (by grade), backstage visits, owner orders, tournaments, wars, live calls. About 7 or 8 levels the first year, 4 the second, 3 the third. |
| Levels | `xpNeed(l) = 80 + 50l`, a cap of 22. One skill point a level. |
| Skills | Five flat skills, 21 points in all: Creative (5), Negotiation (5), Eye for talent (3), Motivator (5), Clout (3). Each point is a straight bonus: +6% feud heat, -3% on contracts, +1.5 morale target, +1 booking power a week. |
| Booking power | `bpGrant()`: weekly, from the number of shows, the owner's trust, a third of your level, Clout, and a big month. Spent on stories and the Storylines page (`98-plot.ts`). Kept up to two weeks' worth. |
| Action points | `S.ap`: weekly visits backstage, now also Pull forward on the desk. |
| On screen | Career: your level, experience and the five skills (`E.spendPoint`). |

## 2. What is wrong with it

- **The tree runs out.** 21 points fill everything by about the fifth year; after that a level gives nothing.
- **Every point is the same kind of point**: a small number made bigger. There are no choices that change how you play, and no trade-offs, so there is no build.
- **It stacks into easy.** Level also raises booking power (a third of a point a level), and Clout adds more, so a booker in year three has noticeably more power with nothing new to spend it on.
- **It is not tied to the Director, the eras or the company's size.** A booker at an indie and one at the biggest company grow the same way.

## 3. The proposal

### Levels

- Experience keeps its sources; the curve is stretched so levels come about **6 the first year, 4 the second, 3 a year after** and never stop (no cap), with the later ones giving perks rather than raw power.
- A level gives **one skill point**. Every fifth level also gives **a perk choice** (pick one of two, for good).
- Booking power stops growing with level (`bpGrant`'s third of a level goes); power comes from the tree and the company instead, so a high level is not free power.

### The tree: four branches

Each branch has tiers. A tier opens when you have spent enough in the branch below it. Points are spent on **nodes**, and every node is one of three kinds:

1. **A small bonus** (as today, smaller and capped).
2. **A new action**: something you can do that you could not before (a button on a page), usually costing booking power or action points.
3. **A trade-off**: a node that gives something and takes something.

| Branch | It is about | Examples of nodes |
| --- | --- | --- |
| **Creative** | Stories, promos, angles | Hotter feuds; a third twist a feud; **Call an audible** (change a finish on the air once a show); the writers pitch better ideas |
| **Office** | Money, contracts, the network | Cheaper deals; one more clause in an offer; **Sweeten the deal** (pay booking power for a better network renewal); a sponsor's patience |
| **Locker room** | People | Steadier morale; **Closed-door meeting** (settle real heat between two people once a month); fewer held problems lapse; more action points |
| **Eye** | Seeing what is hidden | Surer road agent reads; scouting shows potential; **Smell trouble** (see one held matter's cause early); the Director's word on the desk says more |

### Booking power, action points and the tree

- Booking power is still earned weekly by the company (shows, trust, big months) and spent on stories. The tree adds **ways to spend it** (new actions) more than ways to get more of it.
- One branch per resource: Creative spends booking power on stories, Locker room spends action points on people, Office spends money and booking power on deals, Eye mostly reveals.

### Keeping it from breaking the game

- **A cap on any one number**: no node or set of nodes moves a match, a show or a price by more than a set amount (about 10% in total per number), so a maxed booker is better, not unbeatable.
- **Balance tests**: `test-balance.js` gains a booker in year three with a full branch: still loses the job when booking badly, still not handed an A every week.
- **Respec**: free once at the start of each year, or at a cost in the owner's trust otherwise.
- **Old saves**: existing skill points are given back as points in the new tree (a one-time free respec when the save loads), and levels kept.

## 4. Screens

Career gets the tree: four branches side by side, nodes as cut-card tiles, the next tier locked until it opens, each node saying what it does in one line. The perk choice is a pop-up with two cards. A new action from the tree appears where it is used (the broadcast, Backstage, Deals), marked as yours from the tree.

## 5. What it hands the next phase (rule 7a) and what it replaces (rule 9g)

- Hands on: a reason to want the next level (a node, an action, a perk every fifth level), and a build that shapes how you answer the Director's matters.
- Replaces: the five flat skills (`SKILLS`), the level's share of booking power, the level cap.
- Director tag: none; it is the player's growth, not an event.

## 6. Steps (after the go-ahead)

1. The new curve and no cap; booking power no longer grows with level; balance test for a year-three booker.
2. The tree as data (branches, tiers, nodes, kinds), the old five skills moved into it, old saves converted.
3. The Career page tree and the perk pop-up.
4. The new actions, one at a time, each in its own place.
5. Respec, and the cap on any one number checked by a test.

## 7. Questions for Ryan

Asked one at a time; answers written here.

## Pace of the tree (29 October)

The tree holds 43 points (a skill costs 1, the top tier 2). At about 6 levels the first year, 4 the second and 3 a year after, a career fills it in about thirteen years. Actions and trade-offs show as Soon and cannot be taken until step 4 gives them their effects; a tier opens at about three fifths of what can be taken below it.

## 8. Ryan's answers (28 October 2026)

| Topic | Question | Answer |
| --- | --- | --- |
| Points | Skill points or booking power? | **Both, kept separate.** Levels give skill points for the tree; booking power stays the weekly budget for stories, and the tree adds ways to spend it rather than more of it. |
| Pace | How fast, and a cap? | **About 6 levels the first year, 4 the second, then 3 a year, no cap.** Late levels give perks and small things, so there is always a next level. |
| Builds | A forced build, or can you have it all? | **Fill it all.** Everything can be had in a long enough career; the order you take it in is the choice. |
| Endgame | How does a full tree not make the game easy? | **Rival bookers level up too, so every inch matters more.** The world keeps pace with you. |
| Rivals | Can you see them? | **Named, with a style.** Each rival company has a named booker with a level and a build that fits its model (the corporate one leans Office, the outlaw one Creative). Their level shows on the World page; their nodes change how their company plays. |
| Perks | What is a perk? | **Signature moves:** big, named, once-in-a-while powers that define your booker ("The Swerve": one shocking finish a year the crowd never sees coming; "Old School": veterans work for less; "The Machine": one extra show a month without burnout). One of two every fifth level, for good. |
| Respec | Can you move points? | **Any time, at a cost** (the owner's trust or money). Perks stay as picked. |
| Company | Does the company's size matter? | **Same everywhere.** Experience is the same whatever the size of the company. |
| Old saves | What happens on load? | **Not a concern** (Ryan, 29 October: "I don't care about old saves"). An old save simply starts the new tree empty with its level kept; no mapping or refund is built. |

What changes in the blueprint from these answers: section 3's "a cap on any one number" stays as a safety net, but the main answer to the endgame is rival bookers who grow with you (a new part: each rival company gets a named booker with a level and a build, levelling at the same pace and spending by its model, shown on the World page). The tree is sized so a long career can fill it. Respec is any time at a cost, not once a year. Old saves get no special handling (29 October).
