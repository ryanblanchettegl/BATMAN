# The hallway, on the desk

Bill, 21 October 2026: "r2 - should be on the main desk screen." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea R2). Nothing here is built. One step at a time (rule 9a).

## The idea in one paragraph

Each week the main desk (`app/src/screens/office/Desk.tsx`) shows three to five short exchanges overheard in the hallway, picked from what just happened: somebody who lost last night, two people whose bond just crossed a line, a promise falling due, a rookie meeting their hero, a returning star (P3) walking past their old locker. Each is one or two lines in the speakers' own voices (P4, `docs/plans/promos.md`). Each line is used once. Pressing a name opens the profile. It makes the invisible relationship matrix audible every week, with no new mechanic. It replaces the shelved idea E11 (two lines after the show, `IDEAS.md`).

## Picking what is overheard

Every possible exchange is a **candidate** with a priority, as Hades does: the more it matters right now, the higher. The top three to five, at most one per person, are shown.

| Candidate | Priority | Comes from |
| --- | --- | --- |
| A bond just crossed the friends-or-enemies line | Highest | `relBump()` turn events in `src/66-relations.js` |
| A betrayal, a turn, a title change last night | Highest | Last show's results |
| A promise falls due this week | High | Promises (wish 39) |
| A favour is about to be called in | High | Backstage Politics (`docs/plans/backstage-politics.md`) |
| Someone lost and is taking it badly | High | Results, personality (Hothead, Proud) |
| Jealousy rising | Medium | The matrix (`jeal`) |
| A rookie meets their hero | Medium | First weeks of a new signing, who they look up to |
| A teacher proud of a student | Medium | `src/76-student.js` |
| A clique closing ranks | Medium | `src/86-room.js` |
| A mood starts (Bitter, On a roll) | Medium | `docs/plans/traits-and-perks.md` |
| Someone who came back changed | Medium | `docs/plans/come-back-changed.md` |
| Small talk between friends | Low | Friends in the matrix |

A candidate is only written if it is true this week, so there is never a line for its own sake.

## On the desk

A strip on the desk headed "In the hallway", in the workbench look (rule 2a): torn notes or speech bubbles pinned beside the week's matters. Each exchange shows the faces, one or two lines, and a small tag of what it is about (a feud, a friendship, a promise). Pressing a name opens their file; pressing the tag opens the matter it belongs to if there is one ("They are talking about the promise you made"). Nothing to answer: it is there to read, so the desk does not grow more buttons.

## Not repeating

A line is used once, and the same pair is not overheard two weeks running unless something new happened between them. Stored as a few ids a week, kept eight weeks.

## Steps, in build order

1. **Candidates and priority** in the engine (`E.hallway()`), with a headless test: 60 weeks, errs 0, NaN 0, every exchange true of the week, no pair two weeks running without a new event.
2. **Lines** for the top candidates, through the grammar and the voices of P4 when they exist.
3. **The strip on the desk**, with names and tags that open the right places.
4. **The rest of the candidates**, a few at a time.
