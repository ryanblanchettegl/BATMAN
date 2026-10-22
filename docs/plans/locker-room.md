# The locker room as a place

Bill, 21 October 2026: "V2 yes". From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea V2). Nothing here is built. It rides on the scene renderer, so it is built as that lands. One step at a time (rule 9a).

## The idea in one paragraph

A diorama of the locker room where where people sit is the relationship matrix. Cliques share a bench, the veteran has the corner, the rookie sits by the door, two people with real heat sit at opposite ends, and an empty locker keeps the nameplate of somebody who was released. Tonight's card is taped to the wall with marker notes. No numbers. It shows the soap opera at a glance, and it is the room every wrestling fan wants to see inside.

## What decides the room

Everything comes from what the game already knows. Positions are worked out by hash and kept from week to week, and move only when something changes, so the player learns the room.

| What you see | Comes from |
| --- | --- |
| A clique sitting together on one bench, the leader in the middle | Cliques and leaders (`E.cliques()`, `src/86-room.js`) |
| The veteran's corner | Tenure and age, a Leader personality (`docs/plans/traits-and-perks.md`) |
| The rookie by the door | First year, low standing |
| Two people at opposite ends, not looking at each other | Real heat in the matrix (`src/66-relations.js`) |
| Tag partners side by side; a jealous partner turned away | Teams, jealousy |
| Teacher and student sharing a bench | `src/76-student.js` |
| Someone alone, head down | A mood: Bitter, Rattled (`docs/plans/traits-and-perks.md`) |
| An empty locker with a nameplate | A release (`w.cut`), kept a few weeks; the plate gets crossed out if they come back at a rival (P3) |
| An ice pack, crutches by a locker | Injuries |
| A title belt on a hook | Champions |
| Tonight's card taped to the wall, with marker notes | The card being booked, notes from the agents |
| A newspaper or the magazine on the bench | The dirt sheet, the monthly magazine (0af) |
| Hushed groups | A secret that is about to leak (the kayfabe layer, Backstage Politics) |

## Using it

- It opens from Backstage (and from the desk, as a button), as one of the scene engine's sets in the workbench look (rule 2a).
- Pressing a person opens their file; pressing a bench opens the clique; pressing the empty locker opens the release.
- The hallway lines (`docs/plans/hallway.md`) can play as speech bubbles in the room.
- A **Kayfabe** setting (the "no numbers" way to play, from `docs/ideas`) makes this the main way to read the room.

## Steps

1. **The seating in the engine** (`E.lockerRoom()`): who sits where and why, by hash, stable week to week. Headless test: 60 weeks, errs 0, NaN 0, enemies never side by side, cliques together.
2. **The room as a scene set**, figures placed by the seating, once the scene renderer can draw a set this full.
3. **The objects** (lockers, nameplates, belts, the card on the wall, the magazine).
4. **Pressing things** to open files, cliques and matters; hallway lines as bubbles.
