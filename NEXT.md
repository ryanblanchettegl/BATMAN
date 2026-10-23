# EWF Wrestling Manager: the next run

Work for Claude Code, in order. `TWEAKS.md` and `WISHLIST.md` are finished; this file is what comes after them. It turns the big tasks in `TASKS.md` into steps small enough to land one at a time. Read `CLAUDE.md` first, then the decisions table in `TASKS.md`.

**23 October: the next thing is `TASKS.md` 0ao, the four moves that close the gap** (the Director runs the week, a promise ledger, three clocks with their ceremonies, preview before consequence). Each starts with rule 9d's blueprint, question vault and Ryan's go-ahead; no code before that.

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

## Job 0. The next 30 changes

Work `docs/roadmap.md` in order, one change at a time. Tick each there as it is done.

## Job 5. The new booking screen (task 3, the core loop)

Ryan's decisions: it replaces the card editor; card size follows show length (1 hour is 3 matches and 3 promos, 2 hours is 4 and 4, 3 hours or pay-per-view is 5 and 5); the player picks who is in a promo and what kind; each show is booked on its own, not the week ahead (Ryan, 21 October); each show affects the next; fast mode books and runs the week and stops for decisions.

Build it beside the old screen. Add a switch in Options, "New booking screen", off until step 5.9. `journey.js` must pass with the switch off after every step, and with it on from step 5.4.

- [x] **5.1 Show length.** (Done another way: the show clock, `src/97-time.js`, two hours of television or three of a big event.) Every show has hours: weekly shows 1 or 2 (from their size), big events 3. `E.cardShape(S)` returns how many matches and promos tonight's show takes. Old cards still validate.
- [x] **5.2 Promos are segments.** Built in 0.14: `src/93-segments.js`, `app/src/screens/booking/Segments.tsx`. Build on it, do not replace it. What is left: a contract signing kind, and the opening promo as an ordinary slot once 5.1 gives shows a length.
- [x] **5.3 Time.** (Done another way: every segment has minutes and the run sheet must fill the clock, `E.clock`, `E.fitShow`.) Each segment has minutes. The show has a total. `E.cardTime(S, card)` returns each segment's ideal length and what too short or too long costs it.
- [ ] **5.4 The screen.** Slot cards in running order: tap a slot to fill it (people, match type or promo kind, finish), with suggested picks first. One time bar across the top split by segment. Each split moves with plus and minus buttons as well as by dragging. Quick-fill buttons: "Suggest the whole card", "Suggest the rest". (Waits for Ryan, 16 October: the card builder is already a one-screen page of windows with a show clock; a new slot screen is a redesign and needs his go-ahead, rule 5b.)
- [x] **5.5 What the screen tells you.** Crowd heat for tonight, the storyline beat due (job 4), who is tired or hurt, and booking power left. No more than one line each. (Done 16 October: Book the show's top line says what the crowd expects, booking power, who is hurt or worn down, what the last main event carried over, and the rival on the same night.)
- [x] **5.6 The show plays segment by segment.** After each: a grade, the work score and the crowd score side by side, and the points that moved it, popping up one at a time. A grade for the show at the end. Skippable with one button. (Done another way: the show plays segment by segment on the live broadcast, with stars after each and a grade at the end.)
- [x] **5.7 Pre-book the week.** (Dropped, Ryan, 21 October: "i dont want to book every show ahead of time". Each show is booked on its own, one at a time. Do not build it.)
- [x] **5.8 Each show feeds the next.** (Partly, 15 October: a main event well above the crowd's bar lifts the next show's house, a flat one costs it, `rep.feed`; open threads already carry, `E.openThreads`.) A strong ending lifts the next show's audience. A thread left hanging (a challenge not answered, a cliffhanger not followed) costs it. The booking screen says what carried over in one line, and the report says what tonight set up. (Done 16 October: the main event carries hype to the next show, `rep.feed`, said on Book the show and After the show; open threads already carry.)
- [x] **5.9 Fast mode.** (Ryan, 16 October: no fast mode.) One button: the assistant (`src/86-asst.js`) books and runs every show left this week, skips the broadcast, and stops for anything that needs a decision. Results in one window. (Not built, 16 October: running a show without the broadcast breaks the rule that a show on the air cannot be skipped. Ask Ryan before building it.)
- [x] **5.10 Switch over.** Turn the new screen on by default, remove `Card.tsx` and `Editor.tsx`, remove the Options switch, rewrite `app/tests/booking.js`, update the Help window and `docs/design.md`. (Done earlier: the run sheet is the booking screen; there is no old screen or switch left.)
- [x] **5.11 Creative energy.** The booking team generates a little each week; fresh ideas (a new match-up, a new promo kind for that pair) spend none, repeats spend some. Shown as one meter. Leave this out if it does not make booking more fun in a 20-week test; say so in `docs/decisions-needed.md`. (Left out, 16 October: freshness in living storylines already rewards new match-ups and costs repeats, so a second meter would say the same thing.)

## Job 6. Cities and buildings (task 4)

- [x] **6.1 City scores.** (Done by the road's markets, `S.mkt` in `src/91-road.js`: good nights raise it, bad ones lower it, staying away cools it.) Each promotion has a popularity score per city it runs. Good shows raise it, bad ones lower it, absence fades it, and running the same city too often shrinks the gain. Rivals have their own.
- [x] **6.2 Pick the place.** Before a show: the city, then a building (capacity, rent, kind of crowd), with an attendance forecast as a range. A suggested pick so it is one press when the player does not care. (Done another way: the road books the building before the card, from the market, and the schedule shows every stop with its building.)
- [x] **6.3 Gate report.** (Done by After the show: The gate item, tickets against the house and the market moving.) A pop-up after the show: tickets against capacity, why it drew, gate minus rent, the city's score before and after.
- [x] **6.4 The long game.** (Done 16 October: sell-out streaks, `S.soRun`; a city that sold out gets a bigger building next time, `soldOutLast()`; cold months cost a weekly show far from the equator a little walk-up trade, `weatherMult()`.) Sell-out streaks, bigger buildings unlocking as a city warms up, crowd heat feeding match ratings, weather by season.
- [x] **6.5 The list.** (Done 15 October: Company, Overview, Your cities: every city on the road with its market in words, the last night there with its grade, and how full it was. `E.cities`.) A city list on Company with trend and weeks since the last visit. The World Editor's cities box (job 1) feeds it.

## Job 7. Television by the hour, streaming, ratings wars (task 5)

- [x] **7.1 Networks.** (Done 16 October another way, `src/89-networks.js`: the networks the game already had (`AIR_NETS`, three sizes) each have a taste, and a deal has a ratings target. `P.slot` is kept; replacing it was not needed for any of this.) Four to six invented networks and streamers, each with tastes (family, sport, late night, niche). A deal has an hourly rate, a night, a slot, a length in weeks and a ratings target. Replace `P.slot`, `E.askSlot` and the network attempt in `E.makeShow` with deals; migrate old saves to an equal deal.
- [x] **7.2 Ratings per hour** (Done another way: the top of each hour is judged against the crowd and kept as `rep.tops`.) in the show report, against the target.
- [x] **7.3 The network talks to you.** (Done 16 October: an executive calls after three misses, a bidding war at renewal; the patience clock and its meeting were already there, and a network never cancels a show, it moves to a smaller one.) Executive calls, content rules, renewal countdowns, a bidding war when two want you, a warning before a cancellation.
- [x] **7.4 Streaming.** (Done 16 October, `src/89-streaming.js`.) Pays per subscriber, grows with the tape library and match quality, lifts popularity in cities you do not tour, and can clash with a television deal that wants exclusivity.
- [x] **7.5 Nights.** (Done 16 October, `src/88-nights.js`: shows on the same night go head to head, and once a year at most the network offers to move a show onto a rival's night for a tenth more, `nightmove`.)
- [x] **7.6 The startup model** (Decided 16 October: it keeps its push on the broadcast slot, `P.slot`, which networks did not replace.) moves its "land a better TV deal" pressure onto this system (`MODELS.startup.month` in `src/78-models.js`).

## Job 8. The world top 500 and level-ups (task 7)

- [x] **8.1 The ranking.** (Done 16 October: `E.power` counts the year's results, how over they are and a belt; the World page's power ten shows each move since last week, `S.pwPrev`; History keeps the top 500 for three years, names written for the top 25, with last year's place. Free agents are not ranked: they have no results to rank.)
- [x] **8.2 It matters.** (Done 15 October: climbing into the power ten lifts morale, dropping out of it on a losing run costs some, and the notification bar says so. From 16 October a wrestler in the power ten asks a little more to sign or renew.) A wrestler cares about their place: a big rise lifts morale and their asking price, a fall on a losing run starts grumbling.
- [x] **8.3 Level-up pop-ups.** (Done 15 October as an item on After the show rather than a pop-up: Who grew, each with the match that did it.) After a show, wrestlers who improved get one line each in a pop-up: what went up and why.
- [x] **8.4 Momentum.** (Done 15 October: the run sheet flags On a roll and Cold streak, and the crowd weighs momentum a third more. The report already named hot and cold momentum.) Make it count for more in match odds and crowd reaction, and say so on the card and in the report.

## Job 9. The dirt sheet (task 8)

- [x] **9.1 One page a week.** Built in 0.14 as Net, Dirt sheet (`src/94-net.js`, `app/src/screens/net/Sheet.tsx`). Net code never calls `rnd(S)`; keep it that way.
- [x] **9.2 Rumours can be wrong.** (Done 15 October: about half the weeks the paper prints a thin rumour that a happy star wants out; it comes due and is corrected like any other.) (`netRumours` in `src/94-net.js` only prints true ones today.) A thin rumour is false about half the time. Acting on one is the player's risk.
- [x] **9.3 The rest.** (Done 15 October: the press scrum after every big night, `EVR.scrum` in `src/42-events.js`; on this day remembers titles, feuds and great matches; the backstage column already carries rival companies' fallings-out from the relationship matrix, `netBackstage()`.) Rival backstage drama, "on this day" from the save's own history, and a scrum after each big event where one answer is the player's to choose.

## Job 10. The indie scene (task 9)

- [x] **10.1 Indies.** (Done 16 October: names, regions, a size and a night each, `indieMeta()`; one closes and one opens every year.)
- [x] **10.2 Dates.** (Done 16 October: free agents work any indie; a signed wrestler only with the outside dates clause, on nights off; a corporate company does not offer that clause.)
- [x] **10.3 What the player sees.** (Done 16 October: Free agents names each one's indie and how long, Hot on the indies names the night and the region, the news reports who is tearing it up and which indie closed or opened.)
- [x] **10.4 Rarely, one grows up.** (15 October: a new company that grows out of the indies now takes the name of one of the circuits, `src/88-newco.js`.) An indie on a long hot run becomes a real company through `src/88-newco.js`.

## Job 11. Two plans already written

- [x] **11.1 Contract clauses.** (Partly done 15 October: paid travel, a no-cut promise and a title match, `src/97-clauses.js`, toggles in the Offer window on Free agents, `test-clauses.js`. Renewals take clauses too, in the contract pop-up on the desk. A merchandise share sends a quarter of their lines' money to them. Two dates a week caps their shows and the suggested card respects it. Outside dates let them work the indies on off nights. Not yet: talks over several rounds.) Follow `docs/plans/contract-clauses.md`. (Talks done 16 October: a low offer brings a counter; meet them halfway is an attempt, and if they will not take it they come back once with a last word.)
- [x] **11.2 Invasions.** Follow `docs/plans/invasions.md`. Build it as a storyline template once job 4 is in. (Done 16 October, `src/81-invasion.js`: the jump over the rail and the war were already there; now the two offices agree the finishes, and a war lost badly leaves a company weak for a year.)

## Job 12. Balance (task 11)

Use `tools/balance.js` from step 0.3. Change one thing at a time and commit the table each time.

- [x] **12.1 The underdog** (Checked 15 October: TTT survives 100 weeks on all three seeds.) should survive 100 weeks on suggested cards with owner trust above 40.
- [x] **12.2 The corporate giant** (Done 15 October: a publicly traded company pays its shareholders 60% of a week above 1.2 times the board's target. WHW nets about $1.7M a week against $1.5M over 100 weeks; Finances shows it as Shareholders.) should bank near its weekly target, not three times it.
- [x] **12.3 The startup** should still be in danger after it wins a better deal. (15 October: on suggested cards NMW runs out of money near week 80 to 95; the backer now tops it up once a year at a cost in the owner's patience, so it is in danger, not doomed.)
- [x] **12.4 Free agents** (Checked 15 October: 78 to 90 unsigned at week 100.) should not run dry: at least 25 unsigned wrestlers worth signing at week 100.
- [x] **12.5 Roster churn** (Checked 15 October: at week 150 every company has 39 to 72, with 129 free agents.) among rivals at 150 weeks: no company under 14 wrestlers, none over 90.
- [x] **12.6 Save size** (Done 15 October: about 1.43 to 1.47 MB at week 151. Old reports drop their play-by-play, six reports kept, rivals keep 12 weeks of books, relationships with the retired are pruned, four recent results, a log of 16.) under 1.5 MB after 150 weeks. Trim logs that only grow. (Checked again 16 October after networks, streaming and the yearly top 200: 1.47 to 1.50 MB at week 152 on three seeds; every 26 weeks a wrestler's numbers are rounded to three places and old match keys go.)
- [x] **12.7 A new show** (`E.makeShow`) should stay a real choice after jobs 3 and 7: rerun the 32-week comparison from `TASKS.md` task 0b. (Done 16 October: over 32 weeks on three seeds an extra show moved weekly profit by -$781K, +$166K and -$41K, and popularity by -4.2 to +0.3. Still a real choice.)

## Job 13. Last, every time

- [x] **13.1** Rerun step 0.1: `TASKS.md` matches the code. (Done 16 October: today's work is ticked, and boxes found already built were ticked with where: the face in the main event, the letter grade, the road for the town, building and schedule.)
- [x] **13.2** `docs/map.md` matches the files (made again by `node tools/map.js`).
- [x] **13.3** (15 October: the glossary has heat as living storylines, freshness, kinds of night and contract clauses.) The Help window and the glossary cover what was added, in plain words, and still fit one tablet screen each. (Done 16 October: the glossary and the Help window are both a row of topics with the picked one beneath, so each fits one tablet screen; the glossary has networks, night wars, streaming, looking weak and sell-out streaks.)
- [x] **13.4** Write `docs/run-notes.md` (done 15 October): what was built, what was skipped and why, what the next run should do first, and every line added to `docs/decisions-needed.md`.
