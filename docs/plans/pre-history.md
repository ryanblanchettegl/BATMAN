# Pre-history: the years before day one

Bill, 21 October 2026: "prehistory from real history, and a option for new companies to have a simulated prehistory for 10 years." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea P1). Nothing here is built. One step at a time (rule 9a).

## The idea in one paragraph

A world should start with a past that really happened, so sifting, callbacks, embers, the record book and the kayfabe layer have material from week one. Two ways to get it. **The parody world** gets its past from real wrestling history: the big title changes, feuds and matches, under parody names, as fixed anchors, with the simulation filling in everything between them. **A company that has no past** (one made with Create a federation, in the World Editor, or by a quick-made world) can be given ten years of simulated history: the engine books it, and the world around it, for ten years before the player arrives.

## What exists today

- `src/86-history.js` reads a world's `history` table (reigns, matches, feuds, moments) once when a game starts, lays it into title lines, head to head records, careers and the relationship matrix, and never calls `rnd(S)`.
- The parody world carries hand-written history in `universes/parody/history/2020.json` to `2026.json`: about 83 reigns, 24 matches, 9 feuds and 29 moments in all. Thin outside 2024 and 2025.
- The engine runs headless and seeded. `test-uni.js` plays every company of a world for any number of weeks with no screen.
- `src/99-archive.js` already trims old records so a long save stays small.

## Part 1: the parody world's past, from real history

1. **Anchors.** For each parody company, the real on-screen record of the company it parodies, written as `history` entries under parody names and ids: every title reign (who, from, to), the famous matches, the feuds and how they ended, debuts, turns and returns. Ten years back to start (2016 on); further back later.
2. **Legends.** People who mattered in those years and are retired now join the world as legends (`legend` on the worker), so the anchors have somebody to point to.
3. **The simulation fills in.** Between anchors the engine plays the weeks itself (Part 2's runner), with one rule: an anchor always happens as written. A reign that the anchors say starts in March starts in March; the simulation decides the undercard, the relationships, the minor careers and the records around it.
4. **Kept to the on-screen record.** Title changes, matches, feuds, turns, debuts. No real injuries, arrests, deaths or backstage incidents, and nothing about anyone's private life. Who each character parodies stays in `docs/parody/`, never in the world file (rule 3). Check with the lawyer before shipping: the parody clearance covered names and gimmicks, and a detailed retelling of real events is a step further.

## Part 2: ten years for a company with no past

- **Where the choice is.** Create a federation at the start of a game, the World Editor's companies, and the quick-made worlds (`ED_QUICK` in `src/86-editor.js`): "Start with a history: none, or ten years". Default none for Create a federation (a new company is new), ten years for a quick-made world.
- **The fiction for a player's own company.** The company was founded ten years ago and booked by somebody else; the player is the new booker. Its titles have lines, its roster has careers, and the owner remembers the last booker.
- **How it runs.** Start the game ten years early on a fixed seed, play 480 weeks headless with every company (the player's too) booked by the AI, then write what happened into the world's `history` table and start the real game from it. The same world and seed always make the same past.
- **What is kept.** Reigns, the best matches, feuds, careers, debuts and retirements, rookie classes that grew up, companies that folded or were born, the record book and the awards. The archive's trimming rules decide the rest.
- **A short scroll while it runs.** "The story so far": a line for each year (the champion, the feud of the year, who arrived, who left), from the grammar.

## Steps, in build order

1. **The runner, headless.** `E.preHistory(S, weeks)`: play a world for a number of weeks with no player company, then turn the result into a `history` table in the format `src/86-history.js` reads. Test `test-prehistory.js`: ten years of the parody world and of a quick-made world, errs 0 and NaN 0, the same output twice from the same seed. Report how long it takes and how big the history is.
2. **Anchors.** Let the runner take a list of anchors that must happen as written. Test with three hand-made anchors.
3. **The option.** "Start with a history" in Create a federation, the World Editor and quick-made worlds. The story-so-far scroll.
4. **The parody world's anchors**, one company at a time, starting with the company a new game starts in (EWE). Shown to Bill before the next.
5. **Legends** for the anchors that need them.

## Open questions for Bill

- How far back for the parody world: 2016, or further?
- Ten years only, or a choice (5, 10, 25)?
- Should the past be seen before the game starts (the scroll), or discovered in History once playing?
