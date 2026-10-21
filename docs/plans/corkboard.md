# The corkboard: who is tied to whom, as string

Bill, 21 October 2026: "let's add that for later on on tasks, not a top one." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea R3). Concept image: project file `killer-features/corkboard-concept.png`. Nothing here is built. It sits low in `TASKS.md` (section 13) on purpose.

## The idea

A board of Polaroids pinned to cork, with string between them, on the Storylines page. It builds itself every week from what is running, so the player never pins anything by hand.

## Two layers

- **On screen (the default).** One string for each live feud (`activeFeuds(S)`: `f.a`, `f.b`, `f.heat`, `f.fresh`), labelled with its name. Thicker for more heat, frayed as freshness runs out. Pulled in around it: tag partners, stable mates, managers, the champion when a title is involved, and the cast of the year's company arc (`src/99-arcs.js`). A feud that just ended stays as a faint string while it is an ember (`emberOf()` in `src/21-living.js`).
- **Backstage (a switch).** The real feelings from the relationship matrix (`src/66-relations.js`) laid over the top: red for real heat, green for friends, gold for family, blue for teacher and student, an arrow for jealousy (it goes one way), faint for a feeling that is fading. Cliques (`E.cliques()`) are looped and labelled. Secrets that are true of the company (`src/99-kayfabe.js`) are folded notes. Where the two layers disagree (a feud between real friends, partners who cannot stand each other) is where the stories are.

## What makes it readable

- Only strings worth seeing: a feud, or a bond past the friends-or-enemies line (`REL_ON`, 30). Never every pair.
- About 20 people at most, the people in trouble first (as Backstage sorts them), and a focus mode that shows one person's strings only.
- Positions placed once by seed with each clique kept together, and moved only when somebody joins or leaves, so the player learns the board.
- Pressing a string opens its history (the pair's memories, `mem`, each with a week and a sentence) and what can be done about it.

## The one engine addition

The matrix keeps the week a pair last changed (`last`) but not what the bond was before. A weekly snapshot of the bond for every pair on the board gives "worse three weeks running" and the list of strings that moved this week. Kept short (eight weeks) so the save stays small.

## Steps

1. The weekly snapshot, headless, with a test that it stays small over 60 weeks.
2. The on-screen layer on Storylines.
3. Stable positions, the cap, focus mode.
4. The Backstage switch.
