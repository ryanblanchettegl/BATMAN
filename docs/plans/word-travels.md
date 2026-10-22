# Word travels

Bill, 21 October 2026: "r4 - i like too." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea R4). Nothing here is built. Small, and one of the first to build. One step at a time (rule 9a).

## The idea in one paragraph

How you treat one person changes how their friends see you, weighted by how close they are and how much the room respects the person. Bury a locker-room leader and the whole clique cools on you; keep a promise to a rookie and their trainer notices. The wrestler's file says why: "Cooler on you since you buried their friend."

## How it works

`youRemember()` in `src/66-relations.js` already keeps what each wrestler thinks of you (`S.rmY`, a value and a list of memories). When it fires for one wrestler, it now passes on to the people close to them:

- **Who hears.** Everyone with a bond past the friends line (`REL_ON`, 30) with the wrestler, their tag partner and stable mates, their teacher or students, family, and their clique.
- **How much.** A share of the original, by how close they are (family and partners most, friends less) and by the wrestler's standing in the room (a leader's treatment counts for more). Enemies hear it the other way round, a little: burying someone's rival pleases them.
- **Personality.** Loyal friends take it harder; a Loner barely notices; Jealous wrestlers enjoy a rival's bad news (`docs/plans/traits-and-perks.md`).
- **One step only.** It passes to friends, never to friends of friends, so it stays readable and cheap.
- **The memory says why.** Each passed-on memory is its own line with a reason ("since you buried {friend}"), shown in the wrestler's file under what they think of you, as Crusader Kings shows named opinion reasons.

Small changes (under a set size) do not travel, so everyday booking does not spread noise.

## On screen

The notification bar already says "{name} will remember that". When word travels it adds one line: "Their friends noticed: {a}, {b} and two others." The hallway (`docs/plans/hallway.md`) can overhear it.

## Steps

1. **Passing it on** in `youRemember()`, one step, with the shares and the size floor. Headless test: 60 weeks, errs 0, NaN 0, and the matrix of what people think of you stays within its bounds.
2. **Reasons in the file** and the line in the notification bar.
3. **Personality** shaping it, once traits exist.
