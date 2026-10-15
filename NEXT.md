# EWF Wrestling Manager: the next run

Work for Claude Code, in order. `TWEAKS.md` and `WISHLIST.md` are finished; this file is what comes after them. It turns the big tasks in `TASKS.md` into steps small enough to land one at a time. Read `CLAUDE.md` first, then the decisions table in `TASKS.md`.

**7 October: this list is not the next thing.** Ryan's main goal for the next session is the new art style. Start from `docs/plans/art-direction.md` (finish and publish version 0.38 first, as its last section says). Come back to this list after that.

**How to work this list**

- Start from `origin/main`. It holds everything: the overnight work, the World Editor (version 0.12), shows and belts made during a game (0.13), booked promos and angles, the Net section and this week's tasks (0.14), and the running order rules with stars instead of percentages (0.15: read rule 8a in `CLAUDE.md` and `src/92-shape.js` before touching booking). If your branch started before 0.14, merge `origin/main` into it first: the menu has seven sections now, The Net page moved out of Stories, and the desk's alerts became tasks. Work on your own branch and push it after every job.
- Go top to bottom. Jobs are in the order Ryan cares about. A job's steps are in build order. Tick a box in the commit that finishes it.
- One step, one or a few commits. After each step: `node build.js`, the type-check, the headless test for what you touched, and the browser test for the section. After each job: `npm run check`, every `test-*.js`, `npm run test:browser`.
- Engine first. Each new system goes in its own `src/NN-name.js` with `E.` functions and a headless `test-name.js` that plays it for 60 weeks with errs 0 and NaN 0. Then the screen.
- Do not stop to ask. Ryan's decisions are in `TASKS.md` and are not reopened. Where a step needs a choice he has not made, take the option closest to his decisions, write one line in `docs/decisions-needed.md` (what you chose, what the other option was), and carry on.
- Old saves must load (rule 9). A new field on `S` gets a default when missing. If a step changes the shape of something saved, bump the save key and write the migration, and add a case to `app/tests/save.js`.
- Every rule in `CLAUDE.md` holds. The ones that get forgotten: no real names, no dice wording, no hover-only controls, every control has a `data-t`, a game year is 48 weeks, Company shows information and Manage holds the choices.
- There is no phone or portrait layout any more (rule 5 in `CLAUDE.md`). Do not build or test one.
- Publish every new build to the live page (Ryan, 13 October; see "The live page" in `CLAUDE.md`).
- When a job is done, update its section in `TASKS.md` (tick boxes, say what is left) and bump `VER` in `app/src/store.ts` by 0.01.

## Job 0. Know what exists (small, do this first)

The overnight run built 97 wishes, and many of them are parts of the big tasks. `TASKS.md` still shows those tasks as untouched.

- [ ] **0.1** Go through tasks 2 to 10 in `TASKS.md` box by box and check each against the code. Tick what is fully there. For a box that is partly there, leave it open and add one line saying what exists and where. Places to look: history moments in `src/83-moments.js` (task 8), career goals in `src/87-goals.js` (task 10), awards night in `src/89-board.js` and the yearly awards in `src/70-season.js` (task 7), ticket prices and the tape library in `src/86-room.js` (tasks 4 and 5), new companies in `src/88-newco.js` (task 9), rival owners in `src/80-world.js` and working agreements in `src/89-regions.js` (task 10), promo kinds in `src/80-world.js` and agent notes in `src/82-wishes.js` (task 3), the assistant in `src/86-asst.js` (fast mode in task 3).
- [x] **0.2** Write `docs/map.md` (made by `node tools/map.js`): one line per `src/*.js` file saying what it owns and which `E.` functions it adds. Future runs read this before the code.
- [x] **0.3** Add `tools/balance.js`: plays each company for 100 weeks on three seeds with suggested cards and prints one table: cash start and end, popularity start and end, rating minus expectation, owner trust, weeks survived, roster size, free agents left, save size. Commit its output as `docs/balance-0.13.txt`. Later jobs rerun it to see what they moved.

## Job 1. World Editor, round two (Ryan's main item)

Code: `src/86-editor.js`, `app/src/screens/editor/`. Tests: `test-editor.js`, `app/tests/editor.js`. Keep every change behind an `E.ed*` function.

- [x] **1.1 Sort and find.** The Wrestlers list sorts by name, overness, age or company (a select, kept per world). Show the total and how many are shown. (Done 13 October. The sort is kept per world for the session, not across a reload.)
- [x] **1.2 Duplicate.** A "Make a copy" button on a wrestler, a belt, a team and a company (a company copy takes its shows and belts, not its roster).
- [x] **1.3 Move several at once.** A "Pick several" switch on the Wrestlers list turns rows into toggles. Then: sign all picked to a company, release all picked, delete all picked (two presses).
- [x] **1.4 Random helpers.** "Random name" beside the ring name (uses the world's name lists, falls back to the built-in ones). "Set ratings for" a main eventer, a mid-carder or an opener: fills the ratings to suit the company's popularity, the same maths as `E.edFill`.
- [x] **1.5 Unknown free agents.** On the Wrestlers tab with "Free agents" chosen, a "Make unknowns" button adds unsigned wrestlers.
- [x] **1.6 Managers.** A wrestler with the Manager job can be tied to clients: a "Managed by" select on the wrestler form writes `manager_id`. The checker already validates it.
- [x] **1.7 Announcers and staff.** On a company: play-by-play and colour names (`announcers`), road agent and head writer (`staff`).
- [x] **1.8 Brands.** On a company: add, rename and remove brands (`brands`, with the developmental switch). Shows, belts and contracts get a Brand select when the company has brands. Removing a brand clears it from them.
- [x] **1.9 Sponsors and columnists.** A world-level list for each on the World tab, if the package format has them (`sponsors`, `columnists` in `buildDB`). Document the fields in `docs/universe-format.md` as you go.
- [x] **1.10 Rookie names.** On the World tab: three text boxes for first names (men), first names (women) and last names, one per line. The game uses them for newcomers and `E.edFill` uses them for unknowns.
- [x] **1.11 Quick starts.** On "Start a new world": "A two-company territory" and "A nine-company world of unknowns". Each makes companies of different sizes and models with filled rosters, so a player can rename instead of build.
- [x] **1.12 From a running game.** Manage, Operations, Universe gets "Open this world in the World Editor". It exports the game as it stands (`E.exportUniverse`), stores it with the player's worlds, and says where to find it. It does not leave the game.
- [x] **1.13 Undo a delete.** After deleting a wrestler, belt, team, show or company, the note offers "Undo" until the next change. Keep the removed records in memory and put them back with their contracts, holders and members.
- [x] **1.14 A health line per company.** On the company form: average overness of its main eventers against its popularity, men and women counts against its belts, and a warning in plain words when the top of the card is far below what a company that size needs.
- [x] **1.15 Big events per company.** (Done 14 October: on the Shows tab, a panel of the picked company's own events, `E.edPromoEvent`.) Only after job 3. A company's own named big events on the Shows tab.
- [x] **1.16 Tests.** Extend `test-editor.js` and `app/tests/editor.js` for every step above, on desk, tablet and TV.

## Job 2. Pages that are too long

Ryan's goal is screens that are easy to read and quick to act on. Manage, Operations now has 15 panels and is more than four screens tall on a desk.

- [x] **2.1 Measure.** Add to `app/tests/sweep.js`: for every page, the page height in screens on desk and tablet, printed as a table. Fail when a page is taller than 3 screens on desk or 6 on a phone. Commit the first table as `docs/page-heights.txt`. Expect failures; the steps below fix them.
- [x] **2.2 Operations.** (Done another way, 6 October: every Manage page is buttons that open pop-ups, `tiles()` in `screens/manage/Operations.tsx`.) Keep on the page what is used every week: Broadcast, Shows and belts, and the settings. Move the rest (commentary desk, merchandise, school, tours, budgets, universe) into windows opened from one short "More to manage" list that shows each one's state in a line ("Commentary desk: both chairs empty"). Keep every `data-t`. Update `app/tests/company.js`.
- [x] **2.3 Every other page over the limit.** Same treatment: the weekly things stay, the rest becomes a one-line row that opens a window. Do not remove information and do not add pages to the menu.
- [x] **2.4 The desk.** (Done by the new desk: one screen of four windows, `app/tests/desk.js` checks it fits.) "Before the show" must be fully visible without scrolling on a desk screen, with **Book the next show** in view. Check with a screenshot test.
- [ ] **2.5 First week.** Play week one on a tablet as a new player would and list every screen where the first useful button is below the fold. Fix each.

## Job 3. The year planner and big events (task 6, first two boxes)

A company adds shows every year. Weekly shows can be added now (`src/87-create.js`); big events cannot.

- [x] **3.1 Events belong to a company.** (Done 14 October: `src/42-events.js`, `P.events`, `evName()`, `E.events`, `test-events.js`. Filled lazily, so old saves need no migration.) Today the twelve big events are one list for the world (`dbOf(S).events`, used in `weekShows()` in `src/40-week.js`). Give each promotion its own `P.events`: twelve slots, each with a name, a type and an optional rule. Fill it from the world list at game start and for old saves. Each company's flagship gets its own original name from word lists.
- [x] **3.2 Event types.** (Done 14 October: `EV_TYPES` in `src/42-events.js` scales the house, the price, the buys, production and what the crowd expects. Flagship and arena change nothing, so a game that never touches them plays as before. A gimmick night lifts stipulation matches and frowns on a plain main event; a battle royal night lifts its battle royal.) Flagship, arena show, ballroom show, gimmick night, battle royal night, tournament night. A type changes capacity, ticket price, what the crowd expects, and which matches suit it.
- [x] **3.3 Plan the year.** (Done: the Year planner renames an event, changes its kind, or leaves a month dark, from next month, `E.evSet`. At most three dark months a year; the big night after one draws a hungrier crowd. `isBigWeek(w, S)` and `nextBigFrom(w, S)` skip your dark months, so feud endings and the calendar never land on one.) A "Year planner" window from Manage, Operations: twelve months in a list. Rename an event, change its type, or leave a month dark (no big event that month: cheaper, and the next one is hungrier). Changes take effect from the next month.
- [ ] **3.4 Add a second big event in a month.** For a company popular enough. It is an attempt with the network, like adding a weekly show. Too many big events in a year thins the buy rate for all of them.
- [x] **3.5 Promotion spend and hype.** (Done 15 October, simpler than written: one weekly spend on the next big night, Nothing, Some or Heavy, builds its hype meter (`P.evHype`, `E.evSpend`, `E.evHype`) on the Year planner; hot feuds and the face of the company already lift every night through `cardHype()`.) A weekly spend on this month's event, next month's and the flagship. Each event has a hype meter that the spend, hot feuds and a title match raise. Hype feeds buys and the gate.
- [x] **3.6 Buy rate report.** (Done 14 October: After the show has The buys after a big night, against the forecast, with what helped and hurt, `hypeParts()` in `src/30-show.js`. Finances keeps every big night on its Big nights tab, `E.buyLog`. The forecast is what the last three big nights drew.) After a big event: buys against forecast, what helped, what hurt, and the money. As a pop-up, and kept on Finances.
- [x] **3.7 Rivals.** (Done 14 October: once a year in a month of its own, a small rival turns an arena show into a ballroom show and a big one makes a gimmick night; the news says so.) Rivals rename, add and drop big events once a year, the same hook as `rivalGrow()`.
- [x] **3.8 Export.** (Done 14 October: `promotions[].events` in the package, written by `E.exportUniverse` and read at game start. The editor step 1.15 can now be built.) `E.exportUniverse` and the package format carry per-company events. Update `docs/universe-format.md` and unlock editor step 1.15.

## Job 4. Storylines from wrestling history (task 2)

**Ryan, 15 October: living storylines instead.** The scripted templates below are not built. Feuds stay living (`src/21-living.js`, `docs/plans/living-storylines.md`): no beats on a timetable, heat and freshness moved by what the booker puts on the shows. What the templates wanted (factions, title trades, the long chase, betrayals) comes as more twists and story sifting patterns inside that system, not as scripts. Invasions (11.2) wait for the same treatment.

The plan is in `docs/plans/storyline-templates.md`. Ryan's decision: the player spends booking power to start the epic ones, every name is invented, and the patterns follow famous and infamous real storylines.

- [ ] **4.1 The template.** Name, roles needed (leader, defector, rival, champion, authority), cost in booking power, three to six beats over weeks, what each beat needs on a show (a match, a promo of a kind, a run-in, a title change), the payoff, and how it backfires.
- [ ] **4.2 Running one.** `E.storyStart`, `E.storyInfo`, a `SHOWX` hook that checks whether tonight's card delivered the beat, cooling when a beat is missed, and the payoff when the last beat lands.
- [ ] **4.3 Seven epic templates** under original names: a renegade faction of outsiders takes over; an elite four-member stable built around a champion; two top stars trade the title across three big events; a blood feud that escalates through gimmick matches; the owner against the rebel; the long underdog chase; partners who explode over jealousy.
- [ ] **4.4 Four infamous templates** that can go wrong: an invasion nobody takes seriously; a title handed over without a match; a champion leaving with the belt; a mystery attacker whose reveal disappoints. Each has a real chance to backfire, shown as an attempt.
- [ ] **4.5 Smaller ones.** Six short templates that start by themselves or are offered by the writer in the inbox.
- [ ] **4.6 The screen.** A section on Stories, Storylines: start one (who fits each role, with suggestions), see its beats as a line of boxes, and "what the next show needs" in one sentence. The booking screen shows the same sentence.
- [ ] **4.7 Rivals** run them too, and the news reports the big beats.
- [ ] **4.8 Tests.** `test-stories.js` plays every template to its payoff and to its backfire. `app/tests/stories.js` starts one and delivers a beat.

## Job 5. The new booking screen (task 3, the core loop)

Ryan's decisions: it replaces the card editor; card size follows show length (1 hour is 3 matches and 3 promos, 2 hours is 4 and 4, 3 hours or pay-per-view is 5 and 5); the player picks who is in a promo and what kind; the week can be pre-booked; each show affects the next; fast mode books and runs the week and stops for decisions.

Build it beside the old screen. Add a switch in Options, "New booking screen", off until step 5.9. `journey.js` must pass with the switch off after every step, and with it on from step 5.4.

- [x] **5.1 Show length.** (Done another way: the show clock, `src/97-time.js`, two hours of television or three of a big event.) Every show has hours: weekly shows 1 or 2 (from their size), big events 3. `E.cardShape(S)` returns how many matches and promos tonight's show takes. Old cards still validate.
- [x] **5.2 Promos are segments.** Built in 0.14: `src/93-segments.js`, `app/src/screens/booking/Segments.tsx`. Build on it, do not replace it. What is left: a contract signing kind, and the opening promo as an ordinary slot once 5.1 gives shows a length.
- [x] **5.3 Time.** (Done another way: every segment has minutes and the run sheet must fill the clock, `E.clock`, `E.fitShow`.) Each segment has minutes. The show has a total. `E.cardTime(S, card)` returns each segment's ideal length and what too short or too long costs it.
- [ ] **5.4 The screen.** Slot cards in running order: tap a slot to fill it (people, match type or promo kind, finish), with suggested picks first. One time bar across the top split by segment. Each split moves with plus and minus buttons as well as by dragging. Quick-fill buttons: "Suggest the whole card", "Suggest the rest".
- [ ] **5.5 What the screen tells you.** Crowd heat for tonight, the storyline beat due (job 4), who is tired or hurt, and booking power left. No more than one line each.
- [ ] **5.6 The show plays segment by segment.** After each: a grade, the work score and the crowd score side by side, and the points that moved it, popping up one at a time. A grade for the show at the end. Skippable with one button.
- [ ] **5.7 Pre-book the week.** A tab per show this week. A card for a later show is kept until it runs (`S.cards` keyed by show id, replacing the single `S.card`; write the save migration). A wrestler hurt on Monday is flagged on Friday's card.
- [ ] **5.8 Each show feeds the next.** A strong ending lifts the next show's audience. A thread left hanging (a challenge not answered, a cliffhanger not followed) costs it. The booking screen says what carried over in one line, and the report says what tonight set up.
- [ ] **5.9 Fast mode.** One button: the assistant (`src/86-asst.js`) books and runs every show left this week, skips the broadcast, and stops for anything that needs a decision. Results in one window.
- [ ] **5.10 Switch over.** Turn the new screen on by default, remove `Card.tsx` and `Editor.tsx`, remove the Options switch, rewrite `app/tests/booking.js`, update the Help window and `docs/design.md`.
- [ ] **5.11 Creative energy.** The booking team generates a little each week; fresh ideas (a new match-up, a new promo kind for that pair) spend none, repeats spend some. Shown as one meter. Leave this out if it does not make booking more fun in a 20-week test; say so in `docs/decisions-needed.md`.

## Job 6. Cities and buildings (task 4)

- [x] **6.1 City scores.** (Done by the road's markets, `S.mkt` in `src/91-road.js`: good nights raise it, bad ones lower it, staying away cools it.) Each promotion has a popularity score per city it runs. Good shows raise it, bad ones lower it, absence fades it, and running the same city too often shrinks the gain. Rivals have their own.
- [ ] **6.2 Pick the place.** Before a show: the city, then a building (capacity, rent, kind of crowd), with an attendance forecast as a range. A suggested pick so it is one press when the player does not care.
- [x] **6.3 Gate report.** (Done by After the show: The gate item, tickets against the house and the market moving.) A pop-up after the show: tickets against capacity, why it drew, gate minus rent, the city's score before and after.
- [ ] **6.4 The long game.** Sell-out streaks, bigger buildings unlocking as a city warms up, crowd heat feeding match ratings, weather by season.
- [x] **6.5 The list.** (Done 15 October: Company, Overview, Your cities: every city on the road with its market in words, the last night there with its grade, and how full it was. `E.cities`.) A city list on Company with trend and weeks since the last visit. The World Editor's cities box (job 1) feeds it.

## Job 7. Television by the hour, streaming, ratings wars (task 5)

- [ ] **7.1 Networks.** Four to six invented networks and streamers, each with tastes (family, sport, late night, niche). A deal has an hourly rate, a night, a slot, a length in weeks and a ratings target. Replace `P.slot`, `E.askSlot` and the network attempt in `E.makeShow` with deals; migrate old saves to an equal deal.
- [x] **7.2 Ratings per hour** (Done another way: the top of each hour is judged against the crowd and kept as `rep.tops`.) in the show report, against the target.
- [ ] **7.3 The network talks to you.** Executive calls, content rules, renewal countdowns, a bidding war when two want you, a warning before a cancellation.
- [ ] **7.4 Streaming.** Pays per subscriber, grows with the tape library and match quality, lifts popularity in cities you do not tour, and can clash with a television deal that wants exclusivity.
- [ ] **7.5 Nights.** Every promotion has a night. A network or streamer can offer to move your show onto a rival's night. Saying yes starts a ratings war with a weekly winner in the news.
- [ ] **7.6 The startup model** moves its "land a better TV deal" pressure onto this system (`MODELS.startup.month` in `src/78-models.js`).

## Job 8. The world top 500 and level-ups (task 7)

- [ ] **8.1 The ranking.** Every wrestler in every promotion and every free agent, ranked each week from results, match quality, titles and popularity. `E.power` is the seed. A weekly top ten on Stories; a yearly top 500 kept in History with last year's place beside each name.
- [x] **8.2 It matters.** (Done 15 October: climbing into the power ten lifts morale, dropping out of it on a losing run costs some, and the notification bar says so. Asking price is not touched yet.) A wrestler cares about their place: a big rise lifts morale and their asking price, a fall on a losing run starts grumbling.
- [x] **8.3 Level-up pop-ups.** (Done 15 October as an item on After the show rather than a pop-up: Who grew, each with the match that did it.) After a show, wrestlers who improved get one line each in a pop-up: what went up and why.
- [x] **8.4 Momentum.** (Done 15 October: the run sheet flags On a roll and Cold streak, and the crowd weighs momentum a third more. The report already named hot and cold momentum.) Make it count for more in match odds and crowd reaction, and say so on the card and in the report.

## Job 9. The dirt sheet (task 8)

- [x] **9.1 One page a week.** Built in 0.14 as Net, Dirt sheet (`src/94-net.js`, `app/src/screens/net/Sheet.tsx`). Net code never calls `rnd(S)`; keep it that way.
- [x] **9.2 Rumours can be wrong.** (Done 15 October: about half the weeks the paper prints a thin rumour that a happy star wants out; it comes due and is corrected like any other.) (`netRumours` in `src/94-net.js` only prints true ones today.) A thin rumour is false about half the time. Acting on one is the player's risk.
- [x] **9.3 The rest.** (Done 15 October: the press scrum after every big night, `EVR.scrum` in `src/42-events.js`; on this day remembers titles, feuds and great matches; the backstage column already carries rival companies' fallings-out from the relationship matrix, `netBackstage()`.) Rival backstage drama, "on this day" from the save's own history, and a scrum after each big event where one answer is the player's to choose.

## Job 10. The indie scene (task 9)

- [ ] **10.1 Indies.** Twelve to twenty small promotions, each a name, a region, a size and a night. Not full companies: no finances page, no rosters under contract. They open and close over the years.
- [ ] **10.2 Dates.** A free agent works for any number of indies. A signed wrestler can take an indie date only on a night their company has no show, and never if the company forbids outside dates (the corporate model does). Dates pay the wrestler, build their following, and wear them a little.
- [ ] **10.3 What the player sees.** On Free agents: where each one has been working and how they did. In the news: indie results that matter (a free agent on a hot run).
- [ ] **10.4 Rarely, one grows up.** An indie on a long hot run becomes a real company through `src/88-newco.js`.

## Job 11. Two plans already written

- [ ] **11.1 Contract clauses.** (Partly done 15 October: paid travel, a no-cut promise and a title match, `src/97-clauses.js`, toggles in the Offer window on Free agents, `test-clauses.js`. Renewals take clauses too, in the contract pop-up on the desk. A merchandise share sends a quarter of their lines' money to them. Not yet: dates, outside dates, and talks over several rounds.) Follow `docs/plans/contract-clauses.md`.
- [ ] **11.2 Invasions.** Follow `docs/plans/invasions.md`. Build it as a storyline template once job 4 is in.

## Job 12. Balance (task 11)

Use `tools/balance.js` from step 0.3. Change one thing at a time and commit the table each time.

- [x] **12.1 The underdog** (Checked 15 October: TTT survives 100 weeks on all three seeds.) should survive 100 weeks on suggested cards with owner trust above 40.
- [x] **12.2 The corporate giant** (Done 15 October: a publicly traded company pays its shareholders 60% of a week above 1.2 times the board's target. WHW nets about $1.7M a week against $1.5M over 100 weeks; Finances shows it as Shareholders.) should bank near its weekly target, not three times it.
- [ ] **12.3 The startup** should still be in danger after it wins a better deal.
- [x] **12.4 Free agents** (Checked 15 October: 78 to 90 unsigned at week 100.) should not run dry: at least 25 unsigned wrestlers worth signing at week 100.
- [x] **12.5 Roster churn** (Checked 15 October: at week 150 every company has 39 to 72, with 129 free agents.) among rivals at 150 weeks: no company under 14 wrestlers, none over 90.
- [x] **12.6 Save size** (Done 15 October: about 1.43 to 1.47 MB at week 151. Old reports drop their play-by-play, six reports kept, rivals keep 12 weeks of books, relationships with the retired are pruned, four recent results, a log of 16.) under 1.5 MB after 150 weeks. Trim logs that only grow.
- [ ] **12.7 A new show** (`E.makeShow`) should stay a real choice after jobs 3 and 7: rerun the 32-week comparison from `TASKS.md` task 0b.

## Job 13. Last, every time

- [ ] **13.1** Rerun step 0.1: `TASKS.md` matches the code.
- [x] **13.2** `docs/map.md` matches the files (made again by `node tools/map.js`).
- [ ] **13.3** (15 October: the glossary has heat as living storylines, freshness, kinds of night and contract clauses.) The Help window and the glossary cover what was added, in plain words, and still fit one tablet screen each.
- [x] **13.4** Write `docs/run-notes.md` (done 15 October): what was built, what was skipped and why, what the next run should do first, and every line added to `docs/decisions-needed.md`.
