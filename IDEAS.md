# EWF 9000: the next 100

One hundred ideas and refinements, built by the build thread in five batches of twenty. They are chosen to stay out of the way of `NEXT.md`, which Claude Code is working at the same time: nothing here touches the World Editor, the booking card editor, the layout of Manage Operations, big events, storyline templates, cities, television deals, the world top 500, the dirt sheet page or the indie scene.

**How to work a batch**

- Read `CLAUDE.md` first. Every rule holds: no real names, no dice wording, every control a real button with a `data-t`, nothing on hover, plain short sentences, a game year is 48 weeks, Company shows information and Manage holds choices.
- **Check first.** 97 wishes were built overnight. Before each idea, look for it in the code (`grep` the engine, read the page). If it exists, make it better in the way the idea describes and say so in the commit. If it exists and is already good, tick the box, say so, and build one of the batch's spares instead.
- **Engine first.** Each batch has one new engine file and one headless test. Use the hook lists (`WEEKX`, `SHOWX`, `POST`, `NEWX`, `MQX`, `CRX`, `EFX`) before editing core files. New fields on `S`, a wrestler or a promotion need a default when missing, so old saves load.
- **Do not make pages longer.** Ryan wants screens that are easy to read and quick to act on. A new thing shows up as one line, a button, or a row in a list that is already there, and opens a window (`openModal`, a `Window` from the kit) or a pop-up card for the detail. New windows go in new files inside your batch's folders. Keep edits to existing page files to a line or two.
- **Say what happened.** Every action shows its result at once (`say()` or a line in the window). Every system the player cannot see is not done.
- **Version 0.16:** how two people feel about each other lives in the relationship matrix (`src/66-relations.js`). An idea that makes friends, enemies, respect or jealousy goes through `relBump()`; a decision by the player that a wrestler would remember goes through `youRemember()`. Ideas are now built one at a time, not in batches.
- **Version 0.15:** how good a match or a segment was is always shown as stars (`stars()` in the kit, `starG()` in the engine), never a percentage or a letter grade. The running order (`src/92-shape.js`) names each spot on the card and its rules; build on it, do not add a second set of placement rules.
- **Since this list was written (version 0.14):** promos and angles are booked on the run sheet (`src/93-segments.js`), Net is its own section, and the desk has **This week's tasks** (`src/95-tasks.js`). Anything the player should fill in or answer goes on that list through the `TASKX` hook, with a button that goes to it. Do not add a panel or an alert for it.
- Stay inside your batch's files. Do not edit `TASKS.md`, `NEXT.md`, `CLAUDE.md`, `build.js`, `app/src/screens/editor/`, `app/src/screens/booking/Card.tsx`, `Editor.tsx` or `app/src/screens/manage/Operations.tsx`. Only batch D edits `store.ts`, `input.ts`, `flow.ts`, `app.tsx`, `shell/` and `screens/start/`. Put styles in your section's existing CSS file.
- One idea, one commit. Tick its box here in the same commit, in your batch's section only. Commit sources only: never `git add` `dist/` or `engine.js`.
- Tests: your headless test must exercise every idea in the batch and play 60 weeks as three companies with errs 0 and NaN 0. Your browser test opens every new window on desk and phone and checks nothing overflows.

## A. Wrestlers and the roster

Engine: `src/96-ideas-people.js`. Screens: `app/src/screens/roster/`, `app/src/shared/cards.tsx`. Tests: `test-ideas-a.js`, `app/tests/ideas-a.js`.

- [ ] **A1. Named injuries.** An injury has a body part and a name: a tweaked knee, a separated shoulder, a concussion. A part hurt twice becomes a weak spot that is hurt more easily. The card and the medical note say it in words.
- [ ] **A2. Depth chart.** A window from Roster: each division as a ladder from main event to opening match, faces on one side and heels on the other, with gaps flagged in words ("no heel in the upper mid-card").
- [ ] **A3. Compare two wrestlers.** From any wrestler card, "Compare with" opens the two side by side: ratings, age, wage, contract, fit, record.
- [ ] **A4. Contract timeline.** A window: every contract ending in the next 26 weeks in date order, with the asking price and a renew button on each row.
- [ ] **A5. Watch list.** Star any wrestler anywhere. Free agents gets a "Watching" filter. The inbox tells you when a watched wrestler becomes free, is hurt, or is close to re-signing.
- [ ] **A6. Earned nicknames.** A wrestler earns a nickname from what they do: a long clean winning run, a year as champion, three hard matches in a month. It shows under the name and the commentary uses it.
- [ ] **A7. Streaks that draw.** A long unbeaten run is news, lifts interest in that wrestler's matches, and pays off for whoever ends it. The booking odds line mentions a live streak.
- [ ] **A8. Training focus.** Pick one skill for a wrestler to work on, or let the trainer choose. Progress is slow, shown as a short bar, and faster for the young.
- [ ] **A9. Requests.** Every few weeks one wrestler asks for something concrete: a week off, a match with a named rival, a new look, a friend signed. Yes becomes a promise on the desk. No costs a little morale.
- [ ] **A10. Weight classes that matter.** A belt can be limited to a weight class. A big size gap changes the match: the crowd loves a giant-killer and tires of a squash.
- [ ] **A11. Entrances.** Each wrestler has an entrance worth something, from charisma and time at the top. A "big entrance" on a big event costs production money and lifts the pop.
- [ ] **A12. Scouting in words.** The scout's view of a free agent as three sentences: best at, weak at, who they would work well with here.
- [ ] **A13. Saved roster views.** Keep up to three filter-and-sort setups on the Roster table and switch between them with one press.
- [ ] **A14. Milestones on the night.** "Tenth year in the business", "hundredth match for you": the game notices, the crowd reacts, and the report says so.
- [ ] **A15. Why the morale.** The card gives the three biggest reasons for a wrestler's morale, in words, best and worst.
- [ ] **A16. Rookie year.** A wrestler in their first year carries a rookie tag, learns faster from veterans they share a ring with, and is up for rookie of the year.
- [ ] **A17. Partner finder.** From a wrestler: "Find a partner" lists the three best tag partners on the roster and why (styles, friendship, size).
- [ ] **A18. Time-off planner.** A window: who is worn down, with a tick box each, and what resting them costs this week's cards. Rest several with one press.
- [ ] **A19. Family ties.** Relatives in the business ask to team, look out for each other backstage, and a family falling out is a feud with extra heat.
- [ ] **A20. Release with respect.** Letting someone go offers three ways: a quiet release, a farewell match, or notice of twelve weeks. Each changes how the locker room and the wrestler remember it.
- Spares: a retirement watch list with likely dates; "who they travel with" as a line on the card.

## B. Stories, fans and the press

Engine: `src/96-ideas-stories.js`. Screens: `app/src/screens/stories/` and `app/src/screens/net/` (the Net section: Dirt sheet, The feed, The boards; engine in `src/94-net.js`, which never calls `rnd(S)`; keep fan and press flavour that way). Tests: `test-ideas-b.js`, `app/tests/ideas-b.js`.

- [ ] **B1. Feud recap.** Each feud keeps a short timeline: how it began, every match and angle, who is ahead. It opens from any feud.
- [ ] **B2. Feud forecast.** For each live feud, one line on where it is heading: "ready for a big finish in two weeks if tonight goes well", "cooling: nothing has happened for three weeks".
- [ ] **B3. Fan mail.** Three short letters a month in the Net section (a window from The feed), from different kinds of fan, each about something that happened on your shows.
- [ ] **B4. The monthly fan poll.** Fans vote on a question: best match, who deserves a title shot, who should turn. The result is a booking hint, and following it pleases them.
- [ ] **B5. Predictions.** Before a big event the fan board predicts each winner. Surprising them with a result that makes sense lifts interest. A swerve for its own sake annoys them.
- [ ] **B6. What they are talking about.** The top three topics among fans this week, one line each, with a name to tap.
- [ ] **B7. This week in your history.** A line or two on the History page from the save's own past: a title change a year ago, a debut, a record gate.
- [ ] **B8. Head to head.** Any two wrestlers: their record against each other, last meeting, best match. Opens from a feud and from the compare window if batch A built it.
- [ ] **B9. Interview requests.** The press asks for a wrestler. You pick who goes. Their promo skill and mood decide whether it helps the company or starts trouble.
- [ ] **B10. The cover.** An invented monthly magazine puts one wrestler in the world on its cover. Being on it lifts their merchandise and their asking price.
- [ ] **B11. Pinned notes.** Pin a private note to a feud or a wrestler ("turn him in March"). Notes are listed in one window and saved with the game.
- [ ] **B12. Cheered and booed.** The five most cheered and five most booed on your roster this month, with who is not getting the reaction their side should.
- [ ] **B13. Angle archive.** History lists the angles you have run with their grades, and warns when the same kind has been used too often lately.
- [ ] **B14. What the fans think of your booking.** Three habits they have noticed ("the champion always wins clean", "tag matches every week"), good and bad.
- [ ] **B15. The anniversary show.** Each year on the company's birthday the weekly show is an anniversary: expectations are higher and so is the lift for getting it right.
- [ ] **B16. Monthly honours.** Match, feud and wrestler of the month for your company, kept as a list in History.
- [ ] **B17. Stable pages.** Each stable gets a pop-up page: members and roles, record as a group, how united they are and which way that is moving.
- [ ] **B18. The story so far.** A window that writes one paragraph about your last twelve weeks: who rose, who fell, what the big story was. For coming back to a save after a break.
- [ ] **B19. The title picture.** One window for all belts: the champion, how long, the next challenger by the ladder, and the feud around it.
- [ ] **B20. Rising and falling.** Who has gained and lost the most popularity over eight weeks, across the world and on your roster.
- Spares: a "first time ever" list of fresh match-ups worth booking; a quote of the week from the commentary desk.

## C. Money and the company

Engine: `src/96-ideas-money.js`. Screens: `app/src/screens/company/Finances.tsx`, `Overview.tsx`, and new windows under `app/src/screens/manage/` (not `Operations.tsx`). Tests: `test-ideas-c.js`, `app/tests/ideas-c.js`.

- [ ] **C1. The week in one line.** Finances opens with one sentence: what you made or lost this week and the biggest reason it changed.
- [ ] **C2. Profit by show.** Each weekly show and the big events: money in, money out, and profit over its last eight runs, as a text chart.
- [ ] **C3. What a wrestler earns you.** Per wrestler: wage against what they bring in (tickets when they headline, merchandise). One word: a bargain, fair, expensive.
- [ ] **C4. Forecast.** Cash in twelve weeks if nothing changes, with a good case and a bad case.
- [ ] **C5. A savings goal.** Set a cash target with a reason. A bar fills on Company, and the owner comments when you reach it or raid it.
- [ ] **C6. Sponsor fit.** Before you sign a sponsor: does it suit your product and your crowd, in words, and what would make it unhappy.
- [ ] **C7. Bonus pool.** After a great show, pay a bonus to the people who made it. Morale lifts. Doing it every week makes it expected.
- [ ] **C8. Ticket deals.** Two-for-one and family nights as a one-week choice: the building fills, and overuse cheapens the ticket.
- [ ] **C9. Star insurance.** Pay a premium on your top draw. If they are hurt, the policy pays the gate you lose.
- [ ] **C10. Year on year.** A table on Finances: this year against last by money source, with the change.
- [ ] **C11. The owner's quarterly letter.** Every twelve weeks: a grade for money, shows and roster, and one thing the owner wants next quarter.
- [ ] **C12. Company value.** One number built from popularity, cash, the tape library and contracts, with its trend. It is what a buyer would pay.
- [ ] **C13. Charity night.** Once a year a show can be for charity: no gate money, a lift in popularity, and families notice.
- [ ] **C14. Cost alerts.** One line on Finances when a cost has grown more than a fifth in eight weeks, with the reason.
- [ ] **C15. Top sellers.** The five best-selling wrestlers this month and who fell off the list.
- [ ] **C16. Asking for a pay cut.** In a cash crisis, ask the locker room to take less for a while. It is an attempt: trust and the locker-room leaders decide it, and it is remembered.
- [ ] **C17. Break-even.** For the next show: how many tickets cover its costs, against how many you expect to sell.
- [ ] **C18. Money records.** Biggest gate, best week, best big event, with dates. A new record is news.
- [ ] **C19. What if.** Before asking the owner to change a setting: a window showing what the new ticket price or production level would have done to the last four weeks.
- [ ] **C20. The rainy-day rule.** The owner expects a number of weeks of wages in the bank. A warning comes before trouble, not after.
- Spares: payroll by card level as a text chart; a loan calculator before borrowing.

## D. The desk, your career and ease of use

Engine: `src/96-ideas-desk.js`. Screens: `app/src/screens/office/`, `app/src/shell/`, `app/src/screens/start/` (Options and Help only), and the shared files this batch alone may edit. Tests: `test-ideas-d.js`, `app/tests/ideas-d.js`.

- [ ] **D1. The week that was.** After End week: one window with money, popularity, the biggest story, injuries and who is unhappy. One button closes it, and Options can turn it off.
- [ ] **D2. Find anything.** A search box on the menu bar and the `/` key: wrestlers, belts, teams, companies and pages. Enter opens the top result.
- [ ] **D3. Keys for this page.** The Help window opens on the keys and tips for the page you are on.
- [ ] **D4. Roll back a week.** Keep the last three weekly saves. Options can go back one. Not in iron man.
- [ ] **D5. Notepad.** A notepad window from the desk, saved with the game.
- [ ] **D6. First-month hints.** For the first four weeks, one short hint at a time about the next thing worth trying, on the desk. It can be turned off and never comes back once dismissed.
- [ ] **D7. The trophy wall.** Achievements as a wall on Career: earned ones with dates, locked ones with a progress bar where progress can be counted.
- [ ] **D8. Your record by show.** Career: average grade for weekly shows, big events and the flagship, by year.
- [ ] **D9. The old hand.** Now and then a retired booker phones with one piece of advice aimed at your weakest number.
- [ ] **D10. Room keys.** On the desk, keys 1 to 7 open the seven rooms. The key is shown on each room.
- [ ] **D11. Badges that explain themselves.** Pressing a section's badge lists what is waiting there, each with a button to go to it.
- [ ] **D12. Confirm a big spend.** Any single spend above a tenth of your cash asks once, in a window that says what it buys.
- [ ] **D13. Small stuff, handled.** An option for the assistant to answer low-stakes inbox items the way you usually do, with a log of what it decided.
- [ ] **D14. The booker's diary.** The game writes one line a week about what you did. Career shows it, and it can be copied as text.
- [ ] **D15. News that matters.** A short notice when something happens that you would want to know at once: a rival signs your target, a watched free agent appears. Pressing it takes you there.
- [ ] **D16. Easier to read.** Options: a high-contrast setting and wider line spacing. Both leave the look alone when off.
- [ ] **D17. A bigger glossary.** Thirty game words, each one line, and the words on the pages open their entry when pressed.
- [ ] **D18. Save check.** When a save loads, check it and repair what can be repaired (missing fields, dangling ids), and say what was fixed.
- [ ] **D19. A safety net.** If a screen fails, show a plain message with "Copy the details" and a way back to the desk, not a blank page.
- [ ] **D20. Long tables stay quick.** Tables over a hundred rows draw fifty at a time with "Show more", so the roster of a giant company opens at once on a phone.
- Spares: copy any page as plain text; choose which page the game opens on.

## E. The world, rivals and the show

Engine: `src/96-ideas-world.js`. Screens: `app/src/screens/company/World.tsx`, `app/src/screens/manage/Rivals.tsx`, `app/src/screens/booking/Report.tsx`, `Live.tsx`. Tests: `test-ideas-e.js`, `app/tests/ideas-e.js`.

- [ ] **E1. Rival results.** World shows each rival's last show in one line: the grade, the main event, and anything that changed.
- [ ] **E2. Act on a release.** When a rival lets go of someone worth having, the inbox item carries a "Make an offer" button.
- [ ] **E3. Cash in trades.** A trade can include money either way. The rival owner's temperament decides how they take a cash offer.
- [ ] **E4. The rival file.** For each rival: what they do well, their top five, their weak division and how they book, in words.
- [ ] **E5. The company table.** Every company ranked by popularity, with last month's place and whether it is rising.
- [ ] **E6. Talent loans.** Lend a wrestler to a partner company for four weeks. They come back with experience, a new following, or a knock.
- [ ] **E7. Signs in the crowd.** The show report lists two or three signs seen in the crowd, written from who is hot and who is not.
- [ ] **E8. Moment of the night.** The report picks one moment from the show and says why it mattered.
- [ ] **E9. Attendance records.** Each company's record gates, kept for the world. Breaking one is news.
- [ ] **E10. More voices.** Sixty new commentary lines keyed to styles, finishes, stakes and history between the two.
- [ ] **E11. After the show.** Two wrestlers say a line each after the show, reflecting how they feel about how they were booked.
- [ ] **E12. Stars by place on the card.** Your openers, mid-card and main events: average star rating for each over eight weeks, so you can see where shows sag. Use the spot names from `src/92-shape.js`.
- [ ] **E13. The world calendar.** What every company runs this month and next, in one list.
- [ ] **E14. The going rate.** Wages for each level of the card drift with how hard companies are competing. World shows this year's rate against last.
- [ ] **E15. Where are they now.** Retired and released names from your company: what they are doing today.
- [ ] **E16. Company timelines.** Each company keeps a short list of its big moments: title changes, signings, records, a new show.
- [ ] **E17. Booker habits.** Each rival booker has two habits (pushes big men, loves tag matches, short title reigns). It shapes their cards and the rival file names them.
- [ ] **E18. What the crowd wanted.** One line in the report on what tonight's crowd came for and whether they got it.
- [ ] **E19. The night's energy.** The report draws the crowd's energy across the show as a text line, segment by segment.
- [ ] **E20. Star and struggler.** The report names who had the best night and who had the worst, and why.
- Spares: tonight against the same show last week, in one line; a rival debut announced a week ahead in the news.
