# Commands (moved verbatim from CLAUDE.md, 30 October 2026)


```
cd app && npm ci && cd ..                           # once; installs the build tools. Skip `npm install` at the root: it pulls Electron for the Steam wrapper
node build.js                                       # engine/*.ts -> engine.js, app/ -> dist/index.html and dist/gorilla-position.html
cd app && node_modules/.bin/tsc --noEmit -p .       # type-check the interface
node test-uni.js universes/public_domain.json 60    # headless: 60 weeks of every promotion. Want errs 0 and NaN 0.
npm run check                                       # build, type-check and a 20-week sim in one go
npm run test:browser                                # every file in app/tests, one after another (needs NODE_PATH as below)
node tools/headless-tests.js                        # every headless test with a summary (SHARD=1/4 runs a quarter); test-golden.js runs on its own
node test-models.js                                 # 60 weeks as each company model; checks what makes it that model
node test-wording.js                                # no dice wording anywhere in 60 weeks of text
node test-determinism.js                            # same seed twice gives identical state
node test-balance.js                                # a year as every company model: Suggest a card lands around a C and risks the job, a thinking booker keeps it and grows
node test-editor.js                                 # the World Editor's engine parts: build a world from nothing, check it, play it
node test-create.js                                 # shows and belts made during a game: the occasions, the limits, and how rarely rivals add them
node test-segments.js                               # promos and angles the player books, the show clock, and how a show opens
node test-tasks.js                                  # this week's tasks, and how they hold a show and the week
node test-shape.js                                  # the running order rules, and stars instead of percentages
node test-relations.js                              # the relationship matrix, memories and the notification bar
node test-live.js                                   # the show on the air: steps, calls from the gorilla position, what each answer does
node test-first.js                                  # the opening letter, the first-year required actions, promises on the card, flags on the run sheet
node test-people.js                                 # backstage as people: who shows up and why, and what a point spent on them does
node test-fog.js                                    # fog of war: what the road agent can say, what a show teaches, the agent in your ear
node test-road.js                                   # the road: the eight maps, where every city is, the loop a company tours, what the desk reads
node test-living.js                                 # living storylines: no lengths, feuds that stay hot or fizzle, a planned ending and a match marked as the ending
node test-logos.js                                  # company logos: every model's own, the creator's rules, ideas, logos in a world package
node test-student.js                                # a student who passes the teacher: the matter on the desk and what each answer does
node test-friends.js                                # a champion's friend next in line: how often, and what each answer does
node test-sift.js                                   # story sifting: storylines found in what has happened, varied, never a pair already feuding
node test-promo.js                                  # promo words: every booked promo has a speaker in quotes, fitted to side, mic and history, and they vary
node test-clauses.js                                # contract clauses: who wants which, what each saves and does
node test-networks.js                               # networks: tastes, ratings targets, the executive who calls, a bidding war at renewal
node test-invasion.js                               # invasions: a war starts with a deal on the finishes, and a war lost badly costs a year
node test-history.js                                # a world's history: reigns, matches, feuds and moments before the game begins
node test-segworld.js                               # a world's own promos and angles (the Stories tab): made, kept, booked and played; included ones changed and put back
node test-stipworld.js                              # a world's own match rules (the Rules tab): made, kept, booked and played; included ones changed and put back
node test-belts.js                                  # title belts: every title has one, Create a Belt's rules, belts in a world package and a game
node tools/design-belts.js                          # give every title in universes/parody/ a belt of its own (build first; then pack)
node tools/build-parody.js                          # pack and check universes/parody/ into universes/parody.json (build first)
node test-events.js                                 # big events belong to a company: twelve each, a flagship name of their own
node test-grammar.js                                # the text grammar: headlines, openings, site headlines and chat lines vary and have no unfilled slots
node test-royal.js                                  # battle royals: 6 to 30 entrants, 30 minutes per 15, a surprise entrant, a title shot
node test-cancel.js                                 # cancellation: three network warnings cancel a show, it runs as a house show, a strong run wins a deal back
node test-debut.js                                  # book a debut: vignettes, a surprise attack or a straight match, and what each does
node test-arcs.js                                   # company arcs: one a year, chapters on the desk, a payoff at the flagship, a flop that can be turned around
node test-buildorder.js                             # a file that wraps another file's functions sorts after it, and says so in a "wraps:" header
node test-archive.js                                # career-scale saves: old records fold into summaries once a year; four years play with errs 0 and NaN 0
node test-scenarios.js                              # scenarios as data: each built-in one plays exactly as before, a world package can bring its own
node test-kayfabe.js                                # the kayfabe layer: secrets kept, leaks, the answers, what the desk and Company read
node test-press.js                                  # the press: reporters with beats and sources, leaks credited, a weekly column, court, freeze and feed
node test-podcast.js                                # the podcast: an episode every week, every line filled, secrets kept, picks scored, same seed same words
node test-writers.js                                # the writers' room: three writers with styles, pitches at the desk, the argument, what a pitch run does, style in the words
node test-postmortem.js                             # post-mortems: a causal log, the month in review every four weeks, the season in review once a year
node test-venues.js                                # buildings with quirks of their own, and trouble in the building as a call on the air
node test-living-world.js                         # the living world: reigns carry their history, the world starts mid-story, rivals keep stories
node test-audience.js                               # audience share: six groups of viewers, who wins them, the ranking, television money follows share
node test-staff.js                                  # staff made and moved, a title for one show, the overall rating
node test-progress.js                               # progression: levels, points, what doing it teaches, age, and what talent costs
node test-gimmicks.js                               # gimmicks: chosen from the character's words, what they shine in, hot and flat pairings
node test-rivalbook.js                              # rival bookers: named, a style from the model, levelling at your pace, what they hold plays
node test-tree.js                                   # the booker's skill tree: four branches, tiers that open as you spend, the whole tree fillable, the old caps kept, what every action and trade-off does
node test-director.js                               # the Director's tension reading: 0 to 100, eight weeks kept, it moves with the open matters, and reading it changes nothing
node test-scenes.js                                 # scene hooks, and Create a Player files: checked, kept in a world, carried into a game, written out
node tools/state-types.js                           # rewrite engine/types.ts, the types of the game state, from six real games (build first)
node tools/build-public-domain.js                   # rebuild universes/public_domain.json after editing rosters
python3 tools/build-font.py                         # rebuild app/fonts/ewf-blocks.woff2 (needs fonttools, brotli)
python3 tools/build-ui-font.py                      # rebuild app/fonts/inter-*.woff2, the interface face (needs fonttools, brotli, fonts-inter)
<python with bpy> tools/creator/ui-pieces.py        # render the paper pieces into app/ui/*.png in Blender (bpy 4.5 from pip runs headless on Python 3.11)
MAPS_MODULES=<dir>/node_modules node tools/build-maps.js   # rebuild engine/91-maps.ts and engine/91-shapes.ts (needs world-atlas, us-atlas, topojson-client installed in <dir>)
```

Browser tests need Playwright with Chromium. Build first, then run from the repo root:

```
NODE_PATH=<dir containing playwright> node app/tests/<name>.js
```

`<name>` is one of `staff`, `player`, `scene`, `matchwin`, `kit`, `logos`, `desk`, `backstage`, `onescreen`, `start`, `office`, `booking`, `roster`, `stories`, `company`, `cards`, `journey`, `linker`, `save`, `sweep`, `challenge`, `scenarios`, `editor`, `create`, `leaveout`, `segments`, `net`, `tasks`, `shape`, `relations`, `advance`, `direction`, `calls`, `auto`, `savefile`, `sound`. A test that has to get a show from the card to its report uses `airShow(page)` from the helper (it opens the report from After the show; `toOffice(page)` goes on to the desk): there is no skipping a show on the air, and every call has to be answered (it gives the safe answer unless told otherwise). `journey.js` takes `WEEKS=5`; run it at desk size (rule 0: no tablet or TV runs). Each test prints its failures and exits non-zero if any. They are slow (one to five minutes each); run the ones for the section you touched, then `journey.js`.

