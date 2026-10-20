# The week of 20 October: a living wrestling universe

Lead designer's plan for this week. Ryan is building Create a Scene, Create a Player and the World Editor, so none of this touches those. The goal: when you open a game, the world was already turning before you arrived, and it keeps turning around you.

## What playing it showed (20 October, 1920 by 1080, the default world)

- Every champion shows a reign of 0 weeks and "last defended this week", although the title's own history says the champion has held it for 60 weeks. The world's past stops at the door.
- No feud is running on week 1. Ten champions have no challenger. The world's history has feuds, but none carry into the game.
- Suggest a card leaves a brand show with two matches once that brand's roster runs thin (EWE, AYY, ARK, DDW fail in a 60-week run).
- The Roster page shows a small portrait where rule 5c wants the wrestler full length.
- The Titles page's Contenders window is cut off at 1080p. Bars on the Roster all look the same. Text is cut off on the desk.
- The booking screen still says "the odds decide who wins" (rule 4).

## The plan, in order

Each step is committed, tested headless and in the browser, and pushed. Each says what it hands to the next phase (rule 7a) and what it does to people (rule 9b).

1. **Suggest a card never comes up short.** A thin brand borrows from the rest of the roster, and the clock is filled with longer matches or a promo. The default world plays 60 weeks with no errors.
2. **Reigns carry their history.** A champion who began the game mid-reign starts with the weeks and defences the history gives them. The Titles page, the champion's file and the commentary say so.
3. **The world starts mid-story.** Feuds the history leaves open start the game running, with heat and freshness from how long they have gone on. Each champion starts with a named challenger. The desk's first week opens on a story already in motion.
4. **Rivals keep their own stories.** Rival companies run feuds of their own, change titles for reasons, and the Web and the desk report it, so the rest of the world is not just numbers.
5. **The week around the world.** A short look, once a week, at what every other company did: who won, who turned, who left. Read on the desk with a button, kept in History.
6. **The Roster as rule 5c asks.** The picked wrestler full length beside the list. Bars that differ and say a word.
7. **Readability pass.** The Contenders window fits; cut-off lines on the desk are fixed; the wording of the empty run sheet follows rule 4.
8. **More depth in the core loop**, as time allows: crowds that remember a city's last night with you, champions whose reigns build prestige and a story, and a reason in words for every number that moves.

## How it is checked

- `test-uni.js` on both worlds: errors 0, NaN 0.
- A new `test-living-world.js`: reigns, open feuds and challengers at the start; rivals' feuds and the week around the world over 60 weeks.
- The browser tests for the pages touched, at desk size.
- The full headless suite, test-determinism and test-wording, before each push.
