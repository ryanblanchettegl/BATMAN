# Backstage Politics

Bill, 21 October 2026: "R1 - But I want it called Backstage Politics." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea R1, "the black book"). Nothing here is built. One step at a time (rule 9a).

## The idea in one paragraph

Knowledge and favours become something you hold and spend. The booker learns secrets (from road agents, a friendly reporter, a leak, a wrestler who confides) and keeps them in a book. A secret can be spent once as leverage: a star takes the loss, a holdout signs, a clique backs down. It costs trust if it gets out. It runs both ways: wrestlers hold favours and grudges over you (a broken promise, the night you covered up an injury) and call them in at the worst time. It is the politics of a locker room, played.

## What exists today

- **The kayfabe layer** (`src/99-kayfabe.js`): the secrets that are true of your company (`S.kf.sec`: friends who are not, a contract running out, a planned ending), leaks and how well the business is protected.
- **Journalists** (`src/99-press.js`): four reporters with sources, a lean and a grudge.
- **Promises** and creative control (wish 39), and `youRemember()` memories.
- **Cliques and leaders** (`src/86-room.js`).
- "Favours and debts" was brainstormed in `docs/feature-list.md` and never locked in.

## What you hold

A page called **Backstage Politics** (a pop-up from Backstage, and a tab beside the corkboard when it exists), with two lists:

**Secrets you know.** Each has who it is about, what it is, how you learned it, and how sure you are.

| Secret | Learned from |
| --- | --- |
| A contract talk with a rival company | A road agent, a reporter who likes you |
| An injury being hidden | The doctor, a training partner |
| Trouble at home, a habit, a run-in with the law | A friend who confides, the dirt sheet |
| Real heat behind a friendly front | The kayfabe layer, the hallway (R2) |
| Who leaked last week | A reporter, by trading a story |
| An affair inside the roster | Gossip (a party animal talks) |

**Favours.** Owed to you (you covered for them, gave them time off, kept their secret, gave them the push they asked for), and owed by you (they took a loss for you, worked hurt, turned down a rival's offer, and you promised something back).

## Spending

**A secret** is spent once, for one thing, through a meeting at your door:

- A star with ego agrees to take the loss (live call 25 never comes up).
- A holdout signs at your price.
- A clique backs down, or its leader breaks it up.
- A rival's star is turned (their contract talk with you gets easier).

The cost: the person whose secret it was remembers it badly (`youRemember()`), and there is a chance by hash, larger with a loose-lipped room, that it gets out. If it does, the room's trust in you falls, the press writes it up, and the Director (0aa) can turn it into a story.

**A favour owed to you** is a softer ask with no risk: work hurt for one night, take a short-notice match, talk to a rookie.

## The other side

Wrestlers keep score too. A favour you owe them is called in, and the game picks the worst time by the Director's pacing: the week before the flagship, during a contract talk. Saying no breaks it (a broken promise, a grievance for P3). A wrestler who holds a secret about you (you covered up an injury, you lied to the owner about the numbers) can use it the same way: to get a title shot, or to walk out of a contract. A Hothead or Mercenary personality calls them in sooner; a Loyal one may never.

## Power in the room

Every person has **standing** in the room (from overall, tenure, clique and leadership), and politics shows it: who has the ear of the owner, who leads which clique, who is rising and who is falling, and what each wants (`docs/plans/traits-and-perks.md`). Moves like backing one clique over another, letting a leader choose the next star, or punishing a leader on screen shift standing and can split a room.

## Steps, in build order

1. **Secrets you know**, kept in the save as ids (who, kind, source, sure), learned from the kayfabe layer and the press. Headless test: 60 weeks, errs 0, NaN 0, the book stays small.
2. **The Backstage Politics page**: both lists, in the workbench look (rule 2a).
3. **Spending a secret**, with the meeting at your door and the chance it gets out.
4. **Favours** both ways, and favours called in at the worst time.
5. **Standing in the room**, and moves that shift it.

## Open questions for Bill

- Should the owner (and the owner's style) mind if the booker plays politics, or only if it gets out?
- Can the player learn secrets about a rival company's people (to poach them), or only their own?
