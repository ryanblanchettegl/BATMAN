# Game review, 30 October 2026 (v0.88): 68 / 100 (provisional until Ryan's next hour of play)

**Thesis in one line: 68 → 100 is coherence, not features: one readable spine (+8), lock the look (+7), a first hour that teaches by fire (+6), a broadcast with weight (+6), merge overlapping systems (+4), ship (+5), prove it with outside players (+2).**

Evidence: the code (110 engine modules, 58 root headless test files, 42 browser test files), `test-balance.js` run today (all ten checks pass), `test-uni.js`, the last 265 commits, Bill's reviews of 21 to 23 October (`docs/research/plans/`), `TASKS.md` and every plan. No fresh full playthrough was done for this review; the first-hour and look scores lean on Bill's play reviews and the commit history.

## Score

| Area | Weight | Score /10 | Points | Why |
|---|---|---|---|---|
| Simulation depth | 15 | 9.0 | 13.5 | Deep, deterministic and tested: living feuds, relationships with memory, markets, networks, contracts, progression, nine company models. Deeper than anything in the genre except TEW's raw data. |
| Core loop and stakes | 15 | 7.0 | 10.5 | The balance fix landed: Suggest a card sits at C and risks the job; a thinking booker reaches B to B+ and grows. But the reasons are spread over a dozen meters; the player cannot see one spine of promises paying off. |
| The live show | 12 | 8.0 | 9.6 | The genre's best idea: calls caused by what is true on the night, answers people remember, Director caps. Held back by weightless motion and a camera that does not direct. |
| Presentation and art | 12 | 5.5 | 6.6 | The workbench look is charming where it is done, but the art has pivoted at least four times in three weeks (grey windows, paper Mac, zine, workbench; wrestlers style G then C at critic round 11). Many pages are not converted; it does not yet look like one game. |
| First hour and readability | 10 | 5.5 | 5.5 | The owner's letter, required actions and "ask, do not show" help. Still: a busy desk, many tasks, a lot of words to read before the first good show. No guided scenario (0ac, the last booker's mess) yet. |
| Coherence and scope | 10 | 5.0 | 5.0 | Press, podcast, Web, writers' room, kayfabe, post-mortems, Director, booking demands and arcs all talk to the player. 233 open boxes and 45 blueprints. Systems overlap more than they combine. |
| Sound | 6 | 6.5 | 3.9 | Soundtrack and Ryan-picked broadcast and office sounds are in. Boos and mixed reactions missing; voices are a placeholder style. |
| Creation and modding | 8 | 8.0 | 6.4 | World Editor, Create a Player, three scene studios, belts, logos, stories and rules as data. Strong Workshop story once Steam is wired. |
| Technical health | 6 | 8.0 | 4.8 | TypeScript modules, golden games, lint for determinism, CI shards. Non-strict types, 85 MB of build output in git, a 1,090-line task file. |
| Ship readiness | 6 | 3.0 | 1.8 | No Windows installer or icon built, Steam calls never run, no cloud save, no performance budget measured on a modest PC. |
| **Total** | 100 | | **67.6 → 68** | |

## Thesis: how we get to 100

**The game has the engine of an A and the experience of a C+. The last 32 points come from coherence, not from more features.** Every system we already have must feed one readable spine the player feels each week; the look must be locked once and applied everywhere; and the broadcast must have weight. Nothing new is added unless it closes a gap in that spine. In order, with what each is worth:

1. **One spine you can read (+8; queue 2 to 4).** Build the promise ledger, preview before consequence and the three clocks as one system, not three. Every promise (a promised win, a title shot asked for, a ripe feud, a network target) is a line with a payoff window; the card is the act of paying them off; the week, the month and the era each end on a ceremony (a stamped grade, the magazine, the flagship verdict). Gate: in a 20-week playtest Ryan can say, unprompted, why the company grew or shrank.
2. **Lock the look, then convert everything (+7).** One art bible from the workbench: three critic-passed concepts for the remaining open choices (wrestlers' final cut, page chrome, motion), Ryan picks, then the look is frozen until launch. Every page moves to the craft look and 22/56/22. Gate: a stranger cannot tell which page was built first.
3. **A first hour that teaches by fire (+6).** Make the last booker's mess (0ac) the default new game: week one opens on one fire, three tasks at most, and a first show a thoughtful player can grade B. Hide every meter not yet needed. Gate: a new player books a B within 30 minutes without the manual.
4. **A broadcast with weight (+6; 0au).** Stop-motion poses on twos, hit-stop by weight, a television director camera, crowd density by the size of the house, boos and mixed reactions. Gate: Ryan watches a full big event without pressing skip.
5. **Merge, do not add (+4).** Press, podcast, Web and the planned magazine become one media voice with one weekly output; the writers' room, booking demands and the Director share one gate. Each merge deletes code and a screen. Gate: fewer screens and fewer words on the desk than today, with the same depth.
6. **Ship it (+5; queue 11).** Windows installer and icon, Steam achievements, cloud saves, Workshop worlds, a 60 fps budget on a modest PC tested in CI, the default world switched to the original world (D5). Gate: a clean install on a fresh Windows machine plays a full year.
7. **Prove it outside (+2).** Twenty outside players, `design:research-synthesis` on their notes, two fix rounds. 100 is a game strangers finish a second season of and recommend.

What not to do: no new system until steps 1 to 3 are done (Bill's scope warning still holds); no new art pivot after step 2; no feature that ends a phase on a clean slate (rule 7a).
