# EWF Wrestling Manager: task list

The hand-over from the build thread, written 2 October 2026 at version 0.11. Work top to bottom unless Ryan says otherwise. Read `CLAUDE.md` first for how the project works, and `docs/feature-list.md` for the full wording of each feature.

**`NEXT.md` is the work queue.** It turns the tasks below into ordered steps for an unattended run. Start there.

**`IDEAS.md` is shelved.** Ryan scrapped the "next 100 ideas" direction on 3 October. None of them were built. The work is now fine-tuning the engine, the game loop, its logic and its rewards, one step at a time.

Two more lists sit beside this one, both finished:

- `TWEAKS.md`: 100 small jobs, one commit each. All done.
- `WISHLIST.md`: 100 ideas that make the game deeper. 97 done; the three left have plans in `docs/plans/` and are steps in `NEXT.md`.

## Where things stand

- **Built and tested:** the engine, the rebuilt interface (seven sections), nine company models, the nine-promotion public-domain universe set in the present day, attempts instead of dice wording, action notes on the desk, the Music button, Free agents with a Fit column.
- **Built, not fully tested:** click-anywhere pop-ups (task 1).
- **The live page** (a Claude artifact Ryan plays from) is one step behind this repository: it does not have the pop-ups yet.
- **Sims:** all nine promotions ran 80 weeks headless with no errors and no bad numbers.

## Ryan's decisions (do not reopen these)

| Topic | Decision |
| --- | --- |
| Calendar | The game starts in the present day (October 2026). The 1990s PC look stays exactly as it is. |
| Screens | Office is the hub and opens on "Before the show" with a **Book the next show** button. Manage holds every choice. Company is information only. Music sits top right. |
| Wording | No dice or rolls anywhere. An attempt has a percentage chance, with what helps and what hurts. |
| Action points | Every action point spent leaves a note of what happened, on the desk and on the next show report. |
| Booking screen | Replaces the current card editor. Card size is set by show length: 1 hour is 3 matches and 3 promos, 2 hours is 4 and 4, 3 hours or pay-per-view is 5 and 5. |
| Promos | The player picks who and what kind; the game writes and grades it. |
| The week | The player can pre-book every show of the week. Each show affects the next one. |
| The goal | Open-ended, like a tycoon game: a world top 500 of every wrestler (yearly, with a weekly top ten), level-up pop-ups after shows, yearly awards, numbers that visibly climb, more dynamic events. |
| Events | Backstage incidents, the business calling, wrestler life events, fan and internet moments, and situations modelled on famous moments in wrestling history. |
| Storylines | Templates modelled on famous and infamous real storylines. The player spends booking power to start the epic ones. |
| Rivals | Each company keeps its own night, as in real life. Moving a show onto a rival's night is a choice made with the network or streamer, and it starts a ratings war. |
| TV money | The network pays per hour of programming. Streaming is available from week one. |
| Arena pick | Pick the city, then a building in it. |
| Sponsors | Three per federation. |
| Fast mode | One button books the week with suggested cards, skips the broadcast, and stops for anything that needs a decision. |
| Free agents | The Market page is now Free agents. Indies are mini federations (task 9). |
| Roster | Figures still honoured in living traditions were swapped out of the default universe. |
| Names | Company models and storylines follow how real companies and angles worked, but every name in the game is invented or public domain. No real promotion, wrestler, stable or event names in game content. Real-world rosters stay out of this repository. |
| Publishing | Two threads publish to the same live page. Whoever publishes merges the other's changes first. |
| Four kinds of fan | Build it in phase 4, with the living-world work (`docs/proposals/four-kinds-of-fan.md`). |
| Trouble in public | Build it, and make it gritty: failed tests, arrests, lawsuits, named plainly (`docs/proposals/trouble-in-public.md`). |
| Owner mode | It will be complex. Build it later, after release. |
| Portraits | Keep the code-drawn faces. |
| Pictures in shared worlds | Yes. The game itself stays image-free. A world shared on the Workshop may carry its own portrait and belt pictures, and code-drawn faces fill any gaps. |
| The built-in world | It is called **The EWF World**. |
| Launch | A full release on Steam after phases 3, 4 and 5. Not early access. |
| Smaller worlds | A player can leave companies out at the start of a game, down to two, and chooses whether their wrestlers become free agents or leave the world too. |
| Booking | Booking a show means booking matches, promos and angles. The player picks all three. |
| Net | Net is its own section at the top of the screen: the dirt sheet, a feed of short posts, and boards with threads. All under invented names. That makes seven sections. |
| The week's tasks | The Office desk lists every task for the week (commentators not assigned, sponsor offers waiting, and so on). Anything that should be filled in is filled in, or waved off, before a show is booked or the week ends. |
| Stars, not percentages | How good a match, a promo or an angle was is shown as a star rating out of five, in quarter steps. Never as a percentage. Targets about a match are worded and checked in stars too. (The show's own score is still a percentage; Ryan has not said to change it.) |
| How a show is laid out | The game follows the old rules of the booking office and tells the player what they are: open hot, peaks and valleys, the biggest match on last with time to work, mix the finishes, send them home happy or wanting more. Where a match sits changes how it lands. |
| Direction | The "next 100 ideas" are scrapped. The work goes back to fine-tuning the engine, the game loop, its logic and how it rewards the player. Depth comes from making what is there play well, not from adding a hundred features. |
| One step at a time | From 3 October (evening): one step, shown to Ryan, then wait for his go-ahead before the next. No batches run side by side. |
| Relationships | Relationships are the centre of the game. Every decision ripples through how wrestlers feel about each other, about the booker and about the crowd. People remember what you did, the way they do in a Telltale game, and a notification bar says what changed after an action. |
| The broadcast | The Gorilla Position becomes an active phase: live events stop the show and the player makes the call (`docs/plans/gorilla-position.md`). |
| Promos | Promos get real depth: archetypes that must fit the wrestler, heat that opens a feud's next act, and a good promo that shifts the odds of that wrestler's match (step 4 of the same plan). |
| No phone | The game will not be on phones for the foreseeable future. Portrait mode is gone: the layouts are desk, tablet and TV, and a tall narrow window is asked to turn sideways. |
| One more turn | 4 October: every phase of the Office, Booking, Show loop feeds the next with something unresolved, so there is never a clean stopping point. The Office opens on an urgent problem with a deadline. Booking is a risk and reward puzzle (chemistry, morale, fatigue). The Show ends on a new problem or chance for next week. His full words and where the game stands against them are in `docs/design.md`, section 2a. |
| The first year | 4 October, for the road map: every new game should feel free, but some actions are required early so that every mechanic gets used and is explained through play. Some happen in every playthrough at a fixed point, some are dynamic. His first three: after your first show you have to pick a sponsor; before your first pay-per-view you have to name the face of your company; the week before your third pay-per-view the owner wants an authority figure added to a show, and that becomes a required addition. More of both kinds are to be thought up. Plan: section 0h. |
| The ADVANCE button | Like Civilization 6: one button that always leads to the next big action. It is a core part of how the game is played. It is laid **over the right end of the top menu bar** (not inside it: the bar keeps its original height and look), big, bold and **always yellow**, **one or two words** (Attention, Book show, Fix card, Open card, Run show, Continue, End week), so it is satisfying to hit. When this week's tasks are in the way it says only **Attention**; a note under it (on hover or focus) says what, and pressing it goes to **the desk**, where the list lives. There is **no to-do strip** elsewhere: the desk is the place for tasks, and the ones that cannot be skipped are marked there (a yellow bar, a blinking marker, a solid tag) and flash when the button sends you. **Options, Help and Music are at the bottom right.** Notifications show at the top, under the menu. The week plays as the days that have something in them. The button guides, and only acts for running the show and ending the week. |
| A deep character sheet | The roster grows to include referees, road agents, managers, legends, authority figures and commentators, as skills any person can have. Backstory and gimmick get real depth, with many options drawn from wrestling history, so players can build anyone they like with the creation tools. Researched from how the genre's deepest character creators do it. Work on this only after the current projects are done. |
| Growing a company | 4 October, replacing the earlier wording: companies do **not** add titles and shows every year. A new belt or a new weekly show is a big deal when it happens, and it follows real-life precedent. It takes an occasion (a division with no title, enough teams for tag belts, a roster that has outgrown its titles, a new show that needs a title; for a show: a boom, a hit in prime time, a roster too big for its nights). No company adds more than one belt in a year or one show in two. Rivals add them rarely, one at a time, and each is news. Belts and weekly shows can still be created inside a running game, not only in the World Editor. |
| On the air: the one button | 4 October: during a show the player can skip a promo, an angle or a match to its result. A dynamic moment (a call from the gorilla position) can never be skipped: skipping stops at it. The focus is the yellow button at the top right. The broadcast has no continue button of its own at the bottom. Built in 0.28. |
| After the show | 4 October, for the road map: after a show the game goes back to the Office and the desk, so the player can work through whatever the night left behind. In time there is always something to do there after a show: read the dirt sheets, review injuries, hear from the writers, see how relationships changed, tickets sold against tickets available, streaming numbers by demographic. Plan: section 0i. |
| Venues and the year | 4 October, for the road map: the player picks a venue before every show, with several options in each town. Later the game builds a realistic one-year schedule around the country the company is based in, and the player can book special events in other countries at special venues, each with its own risks and rewards. Not to be built yet. Plan: section 0i. |
| Pop-ups from the desk | 4 October: the player picks commentators from the Office in a pop-up that lists who is available. Pop-ups will be used more and more to show information while everything stays on one screen. The aim is that every action, required or not, can be done from the Office if the player wants. |
| Shows last | 4 October: shows and belts are not locked in a booker's first years. A weekly show stays on the air: it does not end, it changes network now and then. It gains prestige the longer it is on and with its viewers and growth. The model is how companies work today. |
| Versions | 6 October: at least five changes before a version number moves. |
| Backstage | 6 October: people, not rooms. The people who show up backstage are connected to ongoing storylines or to what is going on in the company. Section 0j. |
| After the show | 6 October: a show ends on its own After the show screen, not on the report. The Office has only a button back to it, After the show recap, and opens on Before the show. |
| The Office | 6 October: The desk, Backstage and Storylines are the main tabs of the Office. Backstage is its own page. The production truck is Your office. Storylines is no longer its own menu. |
| The show grade | 6 October: the letter is the show against its own crowd. An A beat what this crowd expected, a B is what they came for. The headline, the dirt sheet, the Net and the milestones read the same result. |
| Stars | 6 October: stretch the stars so two stars is a bad match and four and a half is rare. Its own version, with the balance pass. |
| Difficulty | 6 October: every level should need you. Suggested cards aim to meet the crowd, not beat it. |
| Your shows | 6 October: the player cannot cancel a show, like rivals. History stays on Company. Venues and the year's schedule are to be started. |
| The outside playtest | 6 October: work its 50 upgrades in order, five a version (project doc `claude/outside-view-playtest-2026-10-06.md`). |
| Art direction | 6 October, evening: the desk mock-up in grey desktop windows is "perfect and the new art direction of the game" (`docs/mockups/desk-windows.png`). Grey windows with a blue title bar, a drop shadow, grouped boxes with red headings, green buttons with a hard shadow, on the blue desktop. The road map sits across the top of the desk: a dotted country, this week's state lit, the tour as arcs, with the arena, ticket sales, hometown names and the road list beside it. Backstage becomes a board (one line a person, worst first, portraits kept, a card on hover or focus); its art style is still being chosen. |
| The name | 7 October: the game is **EWF Wrestling Manager**, in full Elite Wrestling Federation Wrestling Manager. It was EWF 9000. The title card, the page title, the save message, the wide-screen message and the Steam wrapper say the new name. The stored keys (`ewf9000-save-4`, `ewf9000-universes`, `ewf9000-legacy`) keep the old name so nobody loses a save. |
| The word is logo | 7 October: "its not marks. Its Logo." A company's icon is its logo, in the game, in the code and in the notes. |
| The map | 7 October: "I like the USA map and want to keep it. You will need to create new maps for the other regions." So the road window keeps the USA drawn in dots with the week's state lit, and every other part of the world the default companies tour gets a map of its own in the same style, with its own areas to light: Britain and Ireland, Europe, the Mediterranean and the Near East, Mexico and Central America, South America, Japan, and a world map for a long trip. The window shows the map this week's city is on. `docs/plans/art-direction.md`, section 6.4. |
| World Editor | The creation suite is its own page called **World Editor** on the title screen. A player builds a world from scratch (companies, shows, belts, wrestlers) and uploads it to the Workshop. This is the main next item. |

## Tasks

### 0. The World Editor (Ryan's main next item)
Code: `src/86-editor.js` (the `E.ed*` functions; no screen code), `app/src/screens/editor/`, `app/styles/editor.css`. Tests: `node test-editor.js` and `app/tests/editor.js`.

- [x] Its own page, opened from **World Editor** on the title screen and from the start menu bar.
- [x] Start a world from scratch, from a copy of the built-in world, or from a world file. Worlds are kept on the device as they are changed.
- [x] Tabs: World (name, author, start date, newcomers), Companies (name, popularity, model, owner, money, cities), Shows (weekly shows and the twelve big events), Belts (division, level, tag, champions), Wrestlers (details, ratings, portrait, contract), Teams (tag teams, stables, and ties between people).
- [x] "Fill the roster with unknowns" makes a new company playable in one press.
- [x] Check and share: every problem in plain words with a **Go to it** button, **Play this world**, copy the world as text, save it as a file.
- [x] Hidden ids follow names, so a shared file reads cleanly.
- [x] Works on desk, tablet and TV layouts. Back steps out one level at a time.
- [ ] **Workshop upload and subscribed worlds.** Written in `desktop/main.js` and `desktop/preload.js` (`gpSteam.workshopUpload`, `gpSteam.workshopWorlds`) from the steamworks.js documentation. Never run. Needs the Steam wrapper working first (task 12).
- [ ] Pictures: a world cannot carry portrait or belt images yet. Portraits are drawn from the face settings. The folder form with `graphics/` is the Workshop build's job.
- [ ] Not in the editor yet: brands, sponsors, columnists, announcers and staff names, the name lists for rookies, managers tied to wrestlers.
- [ ] Bulk tools: duplicate a wrestler, move several at once, sort the list by name or company.
- [ ] A creator for each thing on its own from the title screen, if Ryan wants shortcuts (show creator, belt creator) beyond the tabs.
- [ ] Try the remote and gamepad on real hardware.

### 0b. Shows and belts made during a game
Code: `src/87-create.js` (`E.makeShow`, `E.dropShow`, `E.makeTitle`, `E.dropTitle`, `E.renameShow`, `E.renameTitle`, `E.makeInfo`), `app/src/screens/manage/Create.tsx`. Tests: `node test-create.js` and `app/tests/create.js`.

- [x] Manage, Operations has a **Shows and belts** panel. It opens a window for weekly shows and a window for belts. The Titles page has a button for the belts window too.
- [x] **Create a belt:** name, division, singles or tag, level. It costs money, starts vacant with little prestige, and the roster size limits how many belts a company can carry. Rename and retire (two presses; refused with a reason while a feud, promise, tournament or story depends on the belt).
- [x] **Add a weekly show:** an attempt with the network (popularity, shows already on the air, current run). Needs twelve wrestlers per show and a launch fee. Starts as a small show, and grows a little each year the company is doing well. Up to three weekly shows. Rename and cancel.
- [x] ~~Rivals add a belt or a show in the first week of each January.~~ Replaced in 0.27, below.
- [x] **(0.27) A new belt or weekly show is a big moment.** Ryan, 4 October: "companies don't add titles and shows every year. These are big deals when they happen and these events should mimic real life precedent."
  - A belt takes an occasion: a division with no title of its own (six wrestlers), a tag team division (four regular teams and no tag belts), a roster that has outgrown one title (fourteen, then a second title), a roster big enough for a third (twenty-four), or a weekly show launched in the last year with no title of its own. The occasion decides what the belt is. The window lists every occasion, says which are open and why, and only then offers the form.
  - A weekly show takes an occasion too: popularity up five points since the start or the last launch, a prime time show at popularity 70, or a roster of sixteen a show more than it has nights for. The network also wants a year of the booker's shows first.
  - One new belt a year at most, one new show in two years at most.
  - The night a new belt gets its first champion, and a new show's first night, are occasions: a louder crowd, more interest, a line on the report.
  - Rivals look at themselves once a year, each in its own month, and do one thing at most. They only add a belt for something that has come about since the game began. A new show needs a boom, the people and the money, and a third show waits until the ones before it have found their audience. Across all rivals, new belts are at least 36 weeks apart and new shows at least 72. Each is in the news with its reason, and on the notification bar.
  - Measured over five years on two seeds: five big moments in the whole world (two shows, three belts). Before, most rivals added something every January.
  - [x] **(0.29) No first-year lock.** Ryan, 4 October: "shows and belts aren't closed in the first years." The rule that a network wanted a year of the booker's shows first is gone, for the player and for rivals. The occasion is what makes a new show rare.
  - [ ] The other real-life occasions: a brand split (a top title for each brand), unifying two belts at a big event, buying a rival and taking in its title, a title retired when its division is gone.
  - [ ] A rival's new belt should get its first champion at that rival's next big event.
- [x] **(0.29) A show lasts.** Ryan, 4 October: "Shows exist and can gain prestige the longer they are on and based on viewership and growth. [A flagship] has been on the air for like 40 years, it doesn't close, it just changes networks occasionally. Look at how current wrestling models work." Code: `src/88-shows.js`. Tests: the last part of `node test-create.js`.
  - Every weekly show in the world has years on the air, an episode count, a network and a standing in words: Brand new, Finding its feet, Established, A fixture, Appointment viewing, An institution. The giant's flagship starts at 27 years and over 1,300 episodes. The new-money company's show is in its first year.
  - Standing moves a little with every episode: up when the show beats what its crowd expected and when its audience is growing, down when it does not, and a point on every anniversary. It takes years. More standing means more viewers. A new game starts exactly where it did before.
  - A network deal runs three to five years. When it is up, the matter is on the desk: stay, move to the other network that wants the show, or hold out for more (an attempt). A show that has grown is paid more and can move to a bigger network (more viewers, popularity moves faster, the audience has to find it again). One that has slipped is kept for less or can take a smaller network's money.
  - Rivals settle their own deals. Some of their shows change network, and it is news. A rival in the red no longer cancels a show: it moves to a smaller network with a cheaper production.
  - An anniversary and a milestone episode (100, 250, every 500) are occasions: the desk hears as the week begins, the title card says it, the building is up for it. The title card always carries the episode number and the network.
  - The Weekly shows window lists each show's standing, years, episodes, network and when the deal runs out.
  - [ ] The player can still cancel one of their own shows. Ryan to say whether that goes too.
  - [ ] Years on the air are worked out from a company's size. The World Editor should let a world set them, and name its own networks (`networks` in the world file is read already).
  - [ ] This is the first part of section 5 (TV deals). Still to come there: money by the hour, tastes, ratings targets, streaming, a rival's night.
- [x] Measured over 32 weeks on three seeds: an extra show moved weekly profit between -$100K and +$214K and popularity by 0 to +1.6. It is a real choice, not free money.
- [ ] Big events (the monthly pay-per-view) cannot be added or renamed in a game yet. That belongs with the year planner in task 6.
- [ ] A new show or belt cannot be given to one brand of a brand split.
- [ ] Rivals do not retire belts.

### 0c. Ryan's play notes of 3 October (version 0.14)

**Promos and angles are booked.** Code: `src/93-segments.js`, `app/src/screens/booking/Segments.tsx`. Tests: `node test-segments.js`, `app/tests/segments.js`.
- [x] The run sheet holds the opening promo, the matches, and the promos and angles between them. A weekly show has two slots, a big event two.
- [x] Nine kinds: interview, call-out, war of words, title challenge, face-off (promos); ambush, brawl, save, turn (angles). The player picks the kind, who is in it and where it goes. The window says what it should score and what helps or hurts.
- [x] A slot left alone goes to the writers, as before. Suggest fills the slots too. The report marks the ones the player booked.
- [ ] Segment length, contract signings and the rest of the promo kinds come with the time bar in task 3.

**Net is its own section.** Code: `src/94-net.js`, `app/src/screens/net/`. Test: `app/tests/net.js`.
- [x] Seventh section in the top menu, between Stories and Manage: **Dirt sheet** (one issue a week: lead story, your shows, match of the week, a part per company, business, rumours marked sure, likely or thin, next week, a review of the booking; the last four issues are kept), **The feed** (short posts from wrestlers, the company, the press and fans after every show), **The boards** (the fan boards, moved from Stories).
- [x] It never touches the game's random stream, so it cannot change a result.
- [ ] Rumours that turn out wrong, rival backstage drama, "on this day", and the scrum after a big event (task 8, `NEXT.md` job 9).

**This week's tasks on the desk.** Code: `src/95-tasks.js`, `app/src/screens/office/Tasks.tsx`. Tests: `node test-tasks.js`, `app/tests/tasks.js`.
- [x] The desk lists every task for the week under Book the next show: house style to set, inbox to answer, empty commentary chairs, sponsor offers with a free slot, vacant titles, contracts about to end. Each has a button that goes to it. Action points and promises due are listed as worth doing.
- [x] A show cannot be booked or run, and the week cannot end, while a task is open. A task is done by doing it or by **Not this week** (back next week if still open). The inbox and the house style cannot wait.
- [x] Options has "This week's tasks come first: On / Off" for players who want reminders only.
- [ ] More tasks as systems land: arena pick, TV deal renewals, the year planner, an unbooked promo slot.

### 0d. The running order, and stars (version 0.15)

Ryan: "look up the philosophy of booking a wrestling show, the importance of the opening match, main event and so on, and incorporate it. Also I do not want to see a percentage on how good the match was, just a star rating."

**The running order.** Code: `src/92-shape.js`, `app/src/screens/booking/Shape.tsx`. Tests: `node test-shape.js`, `app/tests/shape.js`.
- [x] Seven rules, each a small push on the crowd that the report names in plain words: open hot (and the next two matches feel it); peaks and valleys (not two long matches or two of a kind back to back, unless a promo or angle sits between); the biggest match goes on last (names, top title, hottest feud); give the main event time and do not make it follow a great match with no break; one gimmick match a night; mix the finishes (the third dirty finish means nothing, a clean sweep for one side kills the room); a big event ends with a face winning clean, weekly television can end on a cliffhanger that brings more people next week.
- [x] Every spot on the card is named on the run sheet and in the report: Opener, Semi-main, Main event.
- [x] **Running order** notes beside the card read the card against the rules before the show, with a "How a show should flow" window that spells them out, including that the main event counts three times in the rating, the semi-main twice and the opener one and a half times.
- [x] Suggested cards and rival cards are laid out by the same rules, so a well-shaped card is what the crowd expects. Measured over 60 weeks for all nine companies: rating minus expectation moved by less than 0.7 either way.
- [ ] Title changes are not counted yet (two in one night should mean less). The second match as the place to teach a rookie is idea A16.

**Stars.**
- [x] Matches, promos and angles show a star rating and nothing else: the report, the broadcast, History, the dirt sheet, the boards, wrestler cards, the season review, the end-of-game page. The work, the crowd and effort are bars with no number.
- [x] Network targets, promises, season goals and achievements about a match are worded in stars and checked in quarter stars, so "★★★★½ or better" is met by any match that shows ★★★★½.
- [ ] The show's own score, and what the crowd expects, are still percentages.

### 0e. The live Gorilla Position, in steps (`docs/plans/gorilla-position.md`)

- [x] **Step 1 (0.16): the relationship matrix, memories and the notification bar.** Code: `src/66-relations.js`. Tests: `node test-relations.js`, `app/tests/relations.js`. One entry per pair: a shared bond, respect each way, jealousy each way, and what they remember. A separate list of what each wrestler remembers about the booker. The old friend-or-enemy flags and bond scores are folded into it, and old saves convert on load. The status bar announces "X will remember that" and when two people become friends or enemies. The wrestler card lists what they remember and where the booker stands with them.
- [x] **Step 2 (0.24): the live show.** Ryan, 3 October: "focus on the broadcast now... more decisions that shape storylines and the direction of the company, titles and relationships... the broadcast is no longer skippable and the most important hopefully funnest part of the game". Code: `src/30-show.js`, `src/31-live.js`. Test: `node test-live.js`.
  - The player's show goes on the air and runs one step at a time. Nobody knows how a match ends until it has run. A save taken mid-show loads back on the air.
  - The show stops for calls from the gorilla position. Five kinds so far, each caused by what is true that night: the title is on the line (stay with the plan, call the title change, protect the champion with a disqualification), a rival at the curtain (keep them back, cost the match, get fought off), off the script (cut the microphone, let them talk), after the bell (fade out, shake hands, the loser attacks, a challenger walks out), and trouble on the air (the old headset calls, now in their own match).
  - Every answer says what it does before it is picked, and people remember it. Titles change, feuds start or heat up, friends take sides.
  - About two calls a night. Three at most on weekly television and four at a big event, plus the one after the bell.
  - A show on the air cannot be skipped or left. A finished show can still be replayed, and a replay can be skipped.
  - [x] **(0.26) More calls in the ring.** Ryan, 4 October: "Both" (these and more of the company kind). Code: `src/33-ring.js`. Tests: `node test-live.js`, `app/tests/calls.js`.
    - Somebody is hurt. A worn body (road wear, a bad neck, back, shoulder or knee, already hurt this week) in a demanding match (brutal intensity, a dangerous stipulation, a long match for their stamina) goes down wrong. Stop the match, go straight to the finish, or have the other one carry it (an attempt). The same wrestler does not go down again for four weeks.
    - The crowd has gone quiet. After a match that fell flat: stay with the plan, take it to the floor (rougher, harder on their bodies), have the villain cheat (1 BP, a feud starts or heats up), or call the upset (2 BP, the loser remembers).
    - They are not going home. Two who work well together, a hot feud, or somebody with creative control. Take it home, or give them the time and say who pays: a segment that has not aired yet (cut, and its people remember), the main event (shorter), or the network's slot (its patience wears).
  - [ ] More kinds: a manager at ringside, a debut, a walk-out, a double turn, a referee who misses the finish.
  - [x] **(0.25) Calls that set the direction of the company.** Ryan, 4 October: "2". Code: `src/32-direction.js`. Tests: `node test-live.js`, `app/tests/direction.js`.
    - The owner on the headset. When the owner's favourite, or someone the owner asked to be kept strong, is in a match they may well lose, the office calls the truck: "They do not lose tonight." Let the match play out (a bet: the owner is angrier if they lose clean, and has to admit you were right if they win), tell the referee they win (free, the owner is pleased, the other side remembers being fed to the favourite), or have them lose by disqualification for one booking power.
    - A title match the owner wants changed now says so in its call.
    - Who the show is built around. After a main event, when the building will not sit down for a top name, the truck asks where the last shot goes. Build the company around them, stay with who it is built around now, or say nobody is bigger than the company. The one chosen remembers it, the one replaced holds it against you, the other top names are jealous, and the owner has a view.
    - What it does afterwards: more interest in a show with them in the main event, less in a show they are left off, louder matches. The card builder warns when they are left off. The Company page and their card say who it is.
    - The question comes at most once in eight weeks. The office calls at most once in three.
    - [ ] "Suggest a card" does not yet put the face of the company in the main event by itself.
    - [x] **(0.26) The network on the line.** On weekly television in early evening or prime time, when a match is brutal, a dangerous stipulation, or an edgy product with a feud this hot. Let it run (the network's patience wears), tone it down (a tamer match, a happier network), or give them something to complain about (a hotter match, the people online love it, the network's patience wears twice, and a sponsor that asked for a tamer product holds back a week's money). At most once in four weeks.
    - [x] **(0.26) The sponsor at ringside.** A sponsor with four weeks or fewer left on its deal wants its name on the main event. Not tonight, the announcers read the plug (the crowd groans, 12 more weeks), or the hero holds up the product after the bell (24 more weeks and a bonus, and they do not enjoy it). Each sponsor asks once.
    - [x] (0.26) Told "no one name above the company", the truck does not ask again for sixteen weeks.
    - [ ] More of this kind: the owner's creed (what the crowd is being taught to expect), a rival company's star in the building.
  - [x] **(0.28) "Skip to the result" stays, and a call can never be skipped.** Ryan, 4 October: "During the shows they can skip to match results, but they can't skip dynamic moments, it will skip to those." A show on the air stops at every call whatever is skipped.
  - [x] **(0.28) The big button is the only way forward.** Ryan: "I want the focus to be them hitting the next button on the top right. The advance button on the bottom is redundant." The broadcast's own continue button is gone. The yellow button says what it will do (Ring bell, Continue, Next, Sign off, Report, Your call), holds the focus through the show, and Enter and Space do the same thing. Its note stays shut on the air. Code: `liveStep()`, `liveGo()` in `app/src/screens/booking/run.ts`, `app/src/shell/Advance.tsx`.
- [x] **Step 3 (0.24): the broadcast screen.** Code: `app/src/screens/booking/Live.tsx`, `run.ts`. Tests: `app/tests/booking.js`, `advance.js`, `journey.js`. One screen, nothing scrolls. Left: what is on the air. Right: tonight's run sheet, with stars for what has aired. A call is a box of wide buttons, one for each answer, and the number keys answer too. The old headset window is gone.
  - [ ] The show report is still a scrolling page.
- [ ] **Step 4: promo depth.** Archetypes, heat by act, odds shifted by a good promo.

### 0f. The ADVANCE button (version 0.17)

Plan and research: `docs/plans/advance-button.md`. Code: `src/96-advance.js` (`E.advance`, `E.comingUp`), `app/src/shell/Advance.tsx`. Test: `app/tests/advance.js` plays a whole week on the one button.
- [x] One button laid over the right end of the menu bar, on every page, always yellow, on the space bar (right trigger on a gamepad). Its words are the next thing the week needs: Attention, Book show, Fix card, Open card, Run show, Continue, End week.
- [x] Attention: a note opens under the button on hover or focus and lists what needs the player. Pressing it goes to the desk, brings this week's tasks into view and flashes the ones that cannot be skipped. Pressing it again there says how many need you.
- [x] On the desk the tasks that cannot be skipped are marked "Must do": a yellow bar, a blinking marker, a solid yellow tag. The desk also shows **Coming up**: the nearest countdowns (the next big event, a feud close to its next act, a contract running out, a promise due, the year-end awards).
- [x] Options, Help and Music moved to the bottom right. Notifications moved to the top, under the menu. The menu bar itself is unchanged.
- [x] Tried and dropped at Ryan's word: a strip of to-do chips at the bottom (clutter), the button inside the menu bar (it changed the bar's shape), a colour per state (he wants yellow).
- [ ] More countdowns as systems land (title reigns, the owner's clocks, sponsor deals ending).
- [ ] "Thursday: what the rivals did" as its own stop in the week.

### 0g. The booking screen, rebuilt one step at a time (version 0.18 on)

Ryan's list of 3 October, after looking at the booking screen. Each step is built, shown to him, and waits for his word before the next.

- [x] **Step 1 (0.18).** "Book it my way", "Assistant runs the small shows" and the small "Run the show" button are gone. The big yellow button is the only way to run a show: on the card it runs it, or brings up the list of what to fix. A remote's Play key presses it. The remote walk in `app/tests/booking.js` is parked (run it with `TV=1`): Ryan is not working on the remote for now.
- [x] **Step 2 (0.19). Time is the budget.** Code: `src/97-time.js`, `src/93-segments.js`, `app/src/screens/booking/Segments.tsx`. Tests: `node test-segments.js`, `app/tests/segments.js`.
  - A weekly show is two hours and a big event is three. Everything on the run sheet takes time: a match is its bell time plus entrances and a break (singles 5 minutes, tag and three-way 6, four-way and six-man 7, battle royal 9; a cage adds 3, a ladder 2), and a promo or an angle is short, medium or long (5, 10 or 15 minutes).
  - No fixed count. As many matches, promos and angles as fit. Up to five minutes over is allowed. More than ten minutes empty and the show cannot run; six to ten light costs a little on the night.
  - Three kinds, three Add buttons: a match, a promo, an angle. A new promo kind, the video recap (always five minutes). "Writers' pick" hands the time to the writers. The writers no longer add anything on their own.
  - Length matters: a real talker gains from fifteen minutes and a poor one is found out; a long angle heats a feud faster; a longer segment counts for more in the show's rating.
  - How the show opens is whatever is first on the sheet: straight to a match (no time spent), a promo (the speaker's match later gains), an angle (the feud heats faster, and a good one lifts the first match), a video recap (their match that night gains, more at a big event), or the writers.
  - The top of the hour: whatever is on the air when each hour starts is judged against what the crowd expects of the company. Clearly better lifts the show's rating, clearly worse drops it. The run sheet marks those items, every row shows its start time, and the report says how each hour opened.
  - "Suggest a card" now builds a whole show that fits the time.
  - [ ] Sponsor segments (Ryan: later).
  - [ ] A segment after the main event (a closing angle).
  - [ ] Shows of other lengths (one hour, or a longer big event), tied to the TV deal.
  - [ ] The scripted opening promo is still its own form in the side panel. Fold it into the promo window when promos get depth (plan step 4 in `docs/plans/gorilla-position.md`).
- [x] **Step 3 (0.20). Words, not numbers.** Code: `src/98-words.js`. Tests: `node test-shape.js`, `app/tests/booking.js`, `app/tests/shape.js`.
  - "The crowd expects about 80%" is gone. The booking page says "This crowd expects a hot show", with a "What that means" window that lists the ladder and marks this crowd's rung.
  - One ladder of ten rungs for a show: a bomb, a dud, flat, decent, solid, strong, hot, red hot, blow-away, all-time classic.
  - How a show did against its crowd is a headline and a line: Blew the roof off, Sent them home happy, Gave them what they came for, Came up short, Died in front of them. "A strong show for a crowd that expects a hot one." Used on the report, the sign-off card of the broadcast, the dirt sheet page, and the fans' numbers line.
  - What a crowd expects is never shown as a number anywhere now.
  - [x] **(0.21) Ryan: "just letter grade".** A show's own score is a letter grade and nothing else, everywhere: the report, the broadcast sign-off, the week's list, the dirt sheet page, the world table, history, the news, the boards. Sponsor targets are worded as grades ("big event graded A- or better", "No show graded under C") and checked by grade. The word ladder now changes rungs where the grades do, and the ladder window shows the grade beside each word. Achievements say "graded A- or better".
- [x] **Step 4 (0.22). Fog of war.** Code: `src/99-fog.js`. Tests: `node test-fog.js`, `app/tests/shape.js`, `app/tests/segments.js`.
  - The road agent comments on every match on the run sheet, under its row. The agent only says what can be seen (worn down, a squash, not a regular team), what the office has seen on its own shows, or what the agent can read.
  - What you have seen you know for good: once two people have had a singles match their chemistry is known; once someone blows up their limit in minutes is known; once someone has cut a promo the writers know what they can do with a microphone.
  - Better agents give better advice: the company's own agent reads about one new match in four. A hired road agent put on the match reads most of them and says more. A read is never wrong; a weaker agent just has less to say.
  - Level-ups give more: every level of Eye for talent, and every booker level, makes each read more likely. Eye for talent 3 adds a line to every match.
  - Promos and angles no longer show a forecast in stars. They get a read in words ("This should land", "It should do its job", "This could die out there"), or "No read" for a talker nobody here has heard.
  - During the broadcast the agent talks in your ear in every match: what is working and what is not, in words.
  - The report has "What you learned tonight".
  - The old "ring chemistry" line in the match editor, and the road agent's block in "The office says", are gone: the row comment replaces both.
  - [ ] More to learn this way: style clashes, who works well in which stipulation, who draws in which city, hidden traits (careless, ego) when live events arrive.
  - [ ] The reads could be shown on the wrestler's card ("What we know about them").
- [x] **(0.23) One screen, no scrolling: the card builder.** Ryan, 3 October: "before that we need to start having everything fit on one screen with no scrolling". Code: `app/src/screens/booking/Card.tsx`, `Side.tsx`, `Editor.tsx`, the end of `app/styles/booking.css`. Tests: `app/tests/onescreen.js` (six window sizes), `fits()` in the helper.
  - The card builder is one fixed screen. Top: the show, what the crowd expects, booking power, the clock, the Add buttons. Left: the run sheet, one line for each match, promo and angle, with its start time. Right: whatever is selected on the sheet (a match with its editor and the road agent's comment, or a promo or an angle), or one of six tabs of notes when nothing is: Notes, Order, Clock, Promo, Stories, Targets.
  - Move earlier, move later and Remove are in the pane for the selected match. What stands in the way of the show (tasks on the desk, the list of what to fix, a problem before the bell) shows in the pane too.
  - A run sheet of more than 13 lines turns pages. Long lists in the pane turn pages. Nothing scrolls.
  - Type is sized from the window's height as well as its width, so the page fits at 1280x720, 1920x1080, an ultrawide window, a tablet and a TV.
  - [x] (0.24) The broadcast is one screen.
  - [ ] The show report is still a scrolling page.
  - [ ] Every other page (the desk, Roster, Stories, Net, Manage, Company, the title screens), one at a time.
- [ ] **Step 5. Five goals for every show**, drawn from a first set of ten easy ones (later hundreds, from the stories in play). They move storylines, objectives and rookies along. Rewards differ: money, AP, the owner's mood, the fans' mood.
- [ ] **Step 6. The page itself.** The opener and the main event look important, and so do big storyline moments. The right-hand side says much more: who won last week, winning runs, who has not been used in more than two weeks, relationship news, what the owner has liked lately.
- [ ] Open question for Ryan: the Assistant panel on the Career page describes a helper who books and runs the small shows. With its two buttons gone it does nothing on screen. Remove it, or keep it for a later fast mode?

### 0h. The first year: things every game makes you do (road map, not started)

Ryan, 4 October: "We want every new game to feel free but some required actions need to be taken early on to make sure all available mechanics are being used. Like after your first show, you have to pick a sponsor, so that mechanic is used and explained through game play." Some of these happen in every playthrough at a fixed point. Some are dynamic. "We are going to think of a bunch of stuff like this."

How it fits what is built: a required action is a task on the desk that cannot be waved off (`src/95-tasks.js`, `waive:false`), so the ADVANCE button says Attention and the show or the week waits for it. Each one names the mechanic it teaches in a line or two, the first time only.

Fixed, in every playthrough (Ryan's list so far):

- [x] **(0.34) After your first show: pick a sponsor.** Teaches sponsors. Today the sponsor offers are a task that can be left for another week. It becomes required once, after the first show.
- [x] **(0.34) Before your first pay-per-view: name the face of your company.** Teaches who the shows are built around (`src/32-direction.js`, built in 0.25). Today it is only decided on the air, when the building will not sit down for someone. It becomes a required choice on the desk before the first big event. The call on the air stays as the way it changes later.
- [ ] **The week before your third pay-per-view: the owner wants an authority figure added to a show.** A required addition. Needs people who are not wrestlers with jobs on the show (the character sheet work in Ryan's decisions: authority figures, managers, referees, road agents, commentators).
- [ ] More fixed ones, to be thought up with Ryan. Every mechanic should have the moment that makes the player use it once.

Dynamic (they come from the state of the game, so no two games get the same ones):

- [ ] To be thought up with Ryan. The game already has the raw material: the owner's monthly directives, the pressure clocks (the network's patience, a talent raid, a stale act, mutiny), the calls from the gorilla position, and the occasions for a new belt or show.

Candidates for the fixed list, not decided (one for each mechanic that a player can miss today): the commentary desk (already a task), a house rule, a first title defence, a first feud taken to a big event, a first contract renewal, a first signing from the free agents, a first week in training camp for someone, a first tour, asking the network for a better slot.

### 0i. After the show, venues and the year's schedule (road map, not started)

Ryan, 4 October: "After a show, it should go back to the Office or your desk, so you can work through any new events or decisions that need to be made after the show." And: "I want to also pick a venue before every show having multiple options per town. Eventually we will have to build a realistic 1 year schedule around whatever country the company is located in with the ability to book special events in different countries with special venues with different risks and rewards. Don't build this now, but add it to the road map."

**Back to the desk after a show**

- [x] **(0.33) After the show is its own screen.** Ryan, 6 October: "After the show, I don't want them to go to the show report screen. I want them to go to an After the Show screen that has all of the info that you have on the after the show section in the office. Take after the show off of the office screen and just have it be a button called after the show recap, that brings them back to After the show. When you are done with this screen, you then go to the office where the before the show option is first thing you see."
  - The sign-off leads to After the show: grade, verdict, the matter that needs an answer (with its answers), and the list of what the night left with the picked one beside it. Nothing pops up.
  - The match-by-match report is a button there (Match by match) and closes back to it.
  - The yellow button says Office. The Office opens on Before the show, with no After the show panel. A small button, After the show recap, goes back.
  - Code: `app/src/screens/booking/After.tsx`, `run.ts`. Tests: `app/tests/booking.js`, `advance.js`, `journey.js`.
  - [x] (0.34) After the show is a one-screen page.
- [x] ~~(0.30) Back to the desk after a show, with an After the show panel on the desk.~~ Replaced by 0.33, above. What follows describes 0.30.
- [x] **(0.30) Back to the desk after a show.** Closing the report of a show that ran this week goes to the Office. The report's button says Back to the desk and the yellow button says The desk. From the desk the next show is one press away. Code: `src/34-night.js`, `AfterShow` in `app/src/screens/office/Desk.tsx`. Tests: `node test-live.js` (nt1 to nt7), `app/tests/booking.js`, `journey.js`.
- [x] **(0.30) The desk after a show.** An "After the show" panel at the top of the desk: the grade and the verdict, then one line each, trouble first, each marked New until it has been looked at, each opening a pop-up on the desk:
  - injuries from the show, how long, and whether a champion is out
  - the locker room: who went home unhappy or happier, and what people will remember from tonight
  - the gate: tickets sold against tickets available, and how the house looked
  - television: who watched, against the show's recent run (buys for a big event)
  - the writers: what they want followed up, what did not get across, an act the crowd took to, a hot feud left off the show
  - the dirt sheet on the night
- [ ] Still to come there: numbers by demographic (needs the four kinds of fan), the city's score after the gate (section 4), and decisions made in the pop-up itself (today each one informs; the deciding is still done on its page or in the inbox).
- [x] **(0.31) The night ends on a named problem.** A show can leave one matter in the inbox, at the top of the After the show panel, and the week cannot end until it is answered. Each is caused by the night and each answer is remembered. Code: the second half of `src/34-night.js`. Tests: `node test-live.js` (nm1 to nm7).
  - A champion hurt for two weeks or more: vacate the title, or keep the belt on them (the belt loses standing).
  - Somebody who went home furious: talk to them tonight (an attempt), promise a win within two weeks, pay a bonus, or let them cool off.
  - An act lower on the card that was as loud as the main event: promise a win and build on it, or wait.
  - The match of the night between two people with no story: make it a rivalry, or leave it as one great night.
  - Measured over 201 shows on three seeds: 50 matters, about one show in four. Nobody is the subject twice in eight weeks.
- [ ] One show in four is not every show. More causes are needed so that most nights leave something: a soft house, two people with real heat, a promo that went off the script, a rival's offer the morning after, a sponsor unhappy with what went out.
- [ ] This is the Show phase handing the Office something unresolved (the "one more turn" rule, `docs/design.md` section 2a). It joins "the show ends on next week's problem".

**A venue before every show**

- [ ] Before a show is booked the player picks the town and then the building, with several buildings in each town: size, rent, the kind of crowd, how the company has drawn there before. This is section 4 ("Arena pick, gate report, popularity per city"), made a step that every show has. It is a task on the desk, answered in a pop-up.
- [ ] Too big a building looks empty on television and costs rent. Too small leaves money at the door but looks hot. The agent gives a read, not a forecast (fog of war).

**The year's schedule**

- [ ] A one-year schedule built around the country the company is based in: where the weekly shows go, the loop of towns, the big events and their buildings, the breaks. Realistic for that country (distances, seasons, holidays, the big buildings). This grows out of section 6 ("Event calendar").
- [ ] Special events in other countries at special venues, each with its own risks and rewards: a bigger gate and a new audience against travel cost, tired wrestlers, an unfamiliar crowd, weather for an outdoor show, a time zone that hurts the television number at home.
- [ ] Needs first: popularity by city (section 4), the country of each company in the world file, and a list of buildings by country under invented or public-domain names.

**Pop-ups from the desk**

- [x] **(0.29) The commentary desk from the Office.** Ryan, 4 October: "From the office screen, I want you to be able to pick commentators via a pop up with available players." The two tasks for the commentary desk open a pop-up on the desk: both chairs, who is available for the chair being filled, what each costs, and how they would get on with the other voice. Signing one moves on to the empty chair. A button on the desk opens it at any time. Code: `VoicesWindow` in `app/src/screens/office/Windows.tsx`. Test: `app/tests/tasks.js`.
- [ ] The same for every other task on the desk, so everything can be done from the Office: sponsor offers, the venue, contracts that are running out, a vacant title.
- [ ] The people available are the hired voices on the market. Wrestlers, managers and legends at the desk wait for the character sheet work.

### 0q. Storylines: short, medium and long feuds, and rivals (Ryan, 8 October)
"We want short, medium and long feuds. We also want rivals." The plan is `docs/plans/storylines.md`; the pictures are `docs/mockups/storylines/`. His five questions in the plan are still open; the build goes on the plan's defaults until he answers.

- [x] **Step 1. Lengths in the engine** (`src/21-feudlen.js`). Every feud has a length (`f.len`: s, m, l) and the week it is meant to end (`f.pay`); a long one has three chapters at big events (`f.ch`, `f.chd`). The act comes from the calendar (`feudAct(f, S)`). A story ends on its night, not before: the autobooker books it there first, for every company, and keeps its people out of other title matches. A medium story that misses its night gets one more big event, then cools; a chapter missed twice is lost. A short story never passes 60 heat, a medium 85. The ending's lift scales with the length and the heat. Old saves get a length the first time a feud is read (no version bump). The story cards say the length and the night. `node test-stories.js`.
- [x] **Step 2. Start a feud** (`StoryWindow` in `app/src/screens/stories/StartStory.tsx`, `E.storyPreview`, `E.storyStart`). The first button on the Storylines page. Pick two people and a length: three cards say what each runs, the night it ends (a long one, its three chapters), how hot it can get, and its cost (short 1, medium 2, long 3 booking power). The office says what it knows about them together, and the road agent gives a read only when he has seen them or can read it (fog of war). It refuses two who cannot wrestle each other or are already in a story together, and warns about someone hurt, someone already in a story, two on the same side, and real heat. Both remember who gave them the story.
- [x] **Step 3. Storylines is one screen of windows** (`app/src/screens/stories/Season.tsx`, `E.season`, after `docs/mockups/final/final-3-storylines.png`). The next twelve weeks across, one line a story with its length, both faces and its heat, each week coloured by act, a star on each ending and chapter, the big events along the bottom, pages when there are more stories than lines, and the next ending in lights. The picked story down the right: its track, heat, weeks run, where it (or its next chapter) ends, what it needs this week, the last thing that happened, the whole log, and End it (no payoff, both remember). The calendar says: late, hurt past the night, someone in two stories, a long story with no twist, too many endings on one night, a big event with none, champions with no challenger, top names with no story; a line about a story picks it. Booking power (Start a feud first) and Around the stories (finished stories, streaks, stables, teams) are buttons that open pop-ups. A medium story nobody planned moves to the next big event when its night already has three endings.
- [ ] Step 4. Rivalries in the engine: `S.rv`, how one begins, the series, the level, the crowd lift, the rekindle.
- [ ] Step 5. The Rivalries window and the rivalry file.
- [ ] Step 6. Rivals in the file, the Roster, the ear, the desk, the dirt sheet.
- [ ] Step 7. Rival companies run lengths by model.

### 0p. The new look: grey desktop windows (decided 6 October; the kit, the key, lights, logos and the desk are built and are version 0.39)

**The plan is `docs/plans/art-direction.md`.** It is the next session's main goal (Ryan, 6 October). It lists the engine work behind every screen, the build order in four versions, and seven questions for him. Company marks from three initials are in it (`docs/mockups/final/company-marks.png`), and so is the logo creator (`docs/mockups/final/logo-creator.png`, section 3a of the plan). The creation suite is section 3b: ten creators mocked up in `docs/mockups/create/` (a federation with the logo creator in it, a move, a show, a belt, a tag team, a stable, a relationship, a storyline, an event, a gimmick).

Mock-ups and the script that drew them are in `docs/mockups/`. Nothing here is built. The road data in the mock-up is made up: the game has no tour, state markets, hometowns or advance ticket sales yet.

- [x] The reference set. Ryan, 6 October: redo the picked screens with an outsider's eye, fix spacing and type, use the new key and drop the old button. They are in `docs/mockups/final/` and replace the earlier pictures as the thing to build toward: `final-1-desk.png`, `final-2-backstage.png`, `final-3-storylines.png`, `final-4a-show-feed.png`, `final-4b-show-champion.png`, `final-5-show-call.png`, plus `final-6-roster.png` and `final-7-book-show.png` (those two not yet picked by him). `final.js` draws them. What they settle: one window title style, wider gutters, labels that never clip, the SPACE key on the bottom line with the week's numbers and how they moved, and lettering in lights (a ticker on the road, the show's name, the season's next ending, NEW CHAMPION with the belt and fireworks, YOUR CALL with a countdown, a crowd meter on the broadcast).
- [x] The window kit (7 October): `Desktop`, `Win`, `Group`, `Line`, `ListBox`, `Row`, `Answer` in `app/src/kit/win.tsx`, styles in `app/styles/win.css`. `Btn`, `Tag` and `Meter` draw themselves for grey inside a window (green, yellow, grey and red buttons, a cost at the right end; filled tags; bars ten, eight or five wide). Every pop-up in the game now wears the bevel and the blue bar with the title in the middle. The kit sheet (`go('kit')`) shows every part; `app/tests/kit.js` checks it at five sizes. Old panels are untouched.
- [x] (built 7 October, `screens/office/Desk.tsx`, `app/tests/desk.js`) The desk as four windows on one screen: The road across the top, then On your desk, This week's tasks, Next show. The big page heading goes; the week is in the road window's title bar.
- [x] (built 7 October for all eight maps, `src/91-maps.js`, `tools/build-maps.js`, `app/src/kit/roadmap.tsx`; Ryan: "the desk needs to have the map", "follow the concept art for the map") The road map itself: the country as dots drawn by code, each state's outline as points in the code (a one-time job for the USA), this week's state lit, arcs for the road.
- [ ] (partly built 7 October: where each show is, the stops ahead, the building, the last visit, who is from this town, a rival's great night. Tickets sold before the night, markets and hometowns for everybody built 8 October. The road window is complete) What the road window needs from the engine: where each show is (venue, city, state), tickets sold against seats and sold this week, who is from this town, how the market knows you, the last visit. This is the venues and year's schedule work (0i).
- [x] (8 October) What the board needs from the engine: a person's file (`E.dossier`, the Their file pop-up on Backstage) and the room (`E.roomInfo`, one line at the top of Backstage).
- [x] (built 8 October, Ryan: "build out backstage based on my chosen concept image") Backstage as the board. Ryan picks the art style from three (`backstage-board-window.png`, `-textmode.png`, `-paper.png`).
- [ ] Backstage: Ryan, 6 October, "bs full 1 is the closest" (`bs-full-1-dossier.png`: the board, a standing dossier for the picked person, and things to do, your door and the room along the bottom). Closest, not final: ask what to change before building. The three layouts were: `bs-full-1-dossier.png` (board and a standing dossier), `bs-full-2-rooms.png` (a window a room), `bs-full-3-web.png` (board and who gets on with whom).
- [ ] Mock-ups of the other screens, for his reaction: `new-roster.png`, `new-book-show.png`, `new-show-call.png` and `new-show-champion.png` (pop-ups for drama on the air), `story-1-board.png`, `story-2-season.png`, `story-3-wall.png`.
- [ ] Storylines: Ryan, 6 October, "story 2 season is great" (`story-2-season.png`). The page is the season calendar: the next twelve weeks, each story a bar running through its four acts to its ending, big events marked, the picked story beside it, and a window that says what the calendar shows (a stacked card, a month with no ending, a story with no ending planned, somebody in two stories). The engine has acts and heat today; it has no planned ending week for a story, so that is new.
- [ ] The show on the air keeps its old look. Ryan, 6 October: "I dont like how the matches look. I prefer the old style. But I love the pop up windows." So the broadcast stays black with scrolling text, and big moments arrive as grey pop-up windows over it (`show-old-style-champion.png`: a title change with NEW CHAMPION and the belt in dot-matrix lights). The right column gains a live reaction from The feed under tonight's run sheet (`show-old-style-feed.png`). `new-show-call.png` and `new-show-champion.png` are the rejected all-window versions; their pop-ups are the part he liked.
- [x] Lights, built 7 October (`app/src/kit/lights.tsx`, on the kit sheet, checked by `app/tests/kit.js`): the routine that turns a small grid into round lit dots with a glow, lettering in a five by seven face (`LightText`, pieces can each have a colour), and three pictures (`LightPic`: ring, bell, belt). A light is always a whole number of screen pixels and grows with the type. The other seven mock-up pictures (champion, mask, microphone, cage, ladder, chair, entrance) are not ported yet; each is one more entry when a page needs it. What was asked: Dot-matrix pictures: the style is colour lights. Ryan, 6 October: "I like dots sheet 1" (`dots-sheet1.png`): round lit dots in full colour on a black board with a soft glow, unlit dots showing faintly, each board set in a grey window. That is the look for dot-matrix art in the game. Background to the pick: he asked for wrestling images in dots so a style could be chosen. `dots-sheet1.png` is ten pictures drawn by code (ring, belt, champion, mask, bell, microphone, cage, ladder, chair, entrance); `dots-sheet2.png` and `dots-sheet3.png` show six ways of lighting the dots (colour lights, amber scoreboard, sixteen colours on blue, printed programme, pocket screen, green screen). `mock9.js` in the same folder draws them: each picture is a 64 by 48 grid, so it keeps the zero-assets rule. The other five styles were not picked.
- [x] Built 7 October (`app/src/shell/Advance.tsx`, `StatusBar` in `Frame.tsx`, styles in `win.css`, `app/tests/advance.js`): the floating yellow button is gone. The key's cap says SPACE (RT on a pad, PLAY on a remote), its colour is the step's tone (yellow, red, green, white, teal), and its note opens over it as a small grey window. The numbers on the left show the weekly change (playtest item 18): last week's until a show of the new week has run, then this week so far. F2 is Options and F3 is Music. Not done here: playtest item 17, gate and television money landing in the bank after each show instead of at the week's end. That changes when every company's money moves, so it is a job of its own. What was asked: The big button is a key on the bottom line. Ryan, 6 October: "I like key 5 for the button" (`key-5-what-it-says.png`): one line along the bottom, the numbers on the left, Help, Options and Music as small keys, and SPACE with what happens next at the right end. Its colour says what kind of step it is: yellow moves the week on, red wants you first, green puts a show on the air. Rule 5a in `CLAUDE.md` changes when this is built.
- [x] Earlier round on the button: Four takes on it are waiting on his pick (`key-1-full-row.png`, `key-2-week-and-keys.png`, `key-3-tall-key.png`, `key-4-space-bar.png`), and `key-5-what-it-says.png` shows the key's colours through a week. Earlier note: it floats, sits awkwardly and covers text. Three fixes mocked up: `button-a-in-the-bar.png`, `button-b-bottom-keys.png`, `button-c-week-strip.png`. Rule 5a changes with whichever he picks.
- [x] Company logos and the logo creator (Ryan, 7 October: "its not marks. Its Logo", so the word everywhere is logo), built 7 October. Every company has its own icon from its three initials: a shape from its model and its own colours, in lights. It shows on the menu bar, the company picker and every company's card. The creator is on a company's page in the World Editor: 18 shapes or letters only, 6 letter styles, 4 layouts, 3 finishes, 16 colours for shape, trim and letters, one extra, and six ideas at a press. It refuses a logo another company has and letters that cannot be read. `node test-logos.js`, `app/tests/logos.js`. Still to do: a button for a player who owns their company (`E.setLogo` is ready), and logos on the World page, the feed and the broadcast.
- [ ] Then the other pages, one at a time, with Ryan's go-ahead for each.
- [ ] The World Editor, concepted (Ryan, 6 October: "how many options we give as selectable options as core concepts and how many options can be added by the user"). The plan is `docs/plans/world-editor.md`, with five pictures in `docs/mockups/world-editor/`. Three layers: 21 fixed lists the engine needs (241 parts), 30 open lists a player can add to without limit (1,172 entries in the box at release, about 410 in code today), and the world itself. 24 rules of the world and 6 eras. A new game opens with stories already running (18 in the default world) and a written past (54 stories, 212 title reigns, 45 big events) that leaves ties, memories and records behind. 40 story templates that follow old shapes and name nobody. Eight build steps, none started, and six questions for Ryan at the end of the plan.

### 0o. The outside playtest, part A: knowing how you did (0.38)

The playtest's items are numbered 1 to 50. Five a version, in its order.

- [x] 1. The letter grade is the show against its crowd (`crowdScore()`, `repCS()`, `E.repGrade()` in `src/98-words.js`). Sponsor targets moved to the same scale (`cgFix()` for old saves).
- [x] 2. One verdict: the headline, the letter, the dirt sheet's opener and the Net all read `verdictBand()`.
- [x] 3. The "First A- show" milestone and the two show achievements go by the crowd grade.
- [ ] 4. Stretch the stars. Its own version.
- [x] 5. Words follow stars: "Below this crowd's bar" for a good match that was the weakest, and no "ordinary" for a top of the hour.
- [x] 6. The bar before the bell: the card builder says what this crowd expects in stars.
- [x] 7. Owner trust moves after every show, with the reason: a line on After the show (`rep.owner.was`, `now`, `why`), and a warning when the owner is close to letting you go.
- [x] 8. Targets get a headline result: needed and got, at the top of the report and on After the show (`rep.targets`), and Hit or Missed on the desk (`S.qres`). Action points left over read Unspent, not spent (item 27).

### 0n. Five more, picked from the open list (0.37)

Ryan, 6 October: "next". These are the five open items offered after 0.36.

- [x] **1. A Backstage result goes back to its pop-up.** Closing the result of a thing to do returns to the pop-up it came from, which now says the room is used. (`apact` in `BACK_TO`.)
- [x] **2. More requests, and scenes with two people.** Two more reasons to come to Your office: more money (underpaid for their level, and winning or holding a belt) and two weeks at home (worn out). Three scenes put two people in a room together, named as a pair: a regular team at your door blaming each other for a losing run (back one, back the other, or tell them to sort it out, all free and all remembered), somebody in catering jealous of the spot another has (take them aside, or put it on television), and a veteran in the gym who has stayed late with a young one (make it a habit). Your office holds four people.
  - [ ] Still to come: a new look, a match with somebody they name, off a show. A third answer: not yet, but here is what it would take.
- [x] **3. More ways a night ends on a problem.** Three more causes, each from what happened on the show: a belt changed hands and the old champion wants a rematch, an upset the office did not call, and a main event that was the weakest match on the card (take the blame or hand it out). In the test game a matter now comes up on about six shows in ten, up from one in four.
- [x] **4. The owner's letter has its own switch.** Options has a line for it, apart from the boot sequence. The desk has a button to read it again. The letter is kept as it was written on day one (`S.letter`).
  - [ ] Build out the pretext.
- [x] **5. The remaining desk tasks are pop-ups.** House style and sponsor offers open over the desk without leaving it. A vacant title opens a pop-up with who is first in line, a tournament in either format, or a way to the card. A contract about to end opens a pop-up with the price of one year and two.

### 0m. Buttons that open pop-ups, and people at your door (0.36)

- [x] **1. Manage is buttons.** Ryan, 6 October: "On the manage screen, I love all the different options. But I want them all to be buttons you hit that a pop up comes up with the selectable options." Operations is fifteen buttons in four groups (On the air, At the door, Your people, The books). House is two, Deals is seven. Each says what it is set to now. The pop-up holds the same choices as before. The sponsor task and the new owner's house style task open their pop-up directly.
- [x] **2. Storylines is buttons.** Ryan: "I would like the storyline page to be buttons too." Break up a tag team, push a wrestler, buy a pre-tape and the long plan are four buttons with their price. Each opens a pop-up with the choices.
- [x] **3. Backstage buttons say what they do.** Ryan: "the buttons need to more accurately describe what they do rather than vague things like hold a production meeting. It has to be clear and look good." Each button is named for what you get (Train two wrestlers together, Advertise your next show, Ask the owner for 3 more booking power), says the effect in a line, shows the chance or "Sure thing", and sits in one of four groups: Your people, Your next show, The stories, The money and the office.
- [x] **4. A result goes back to the pop-up it came from.** On Manage and Storylines, closing a result returns to the choices, so several things can be done in one visit. (`BACK_TO` in `app/src/store.ts`.)
- [x] **5. People come to Your office to ask for things.** Up to two a week, different each week, and only when it is true of them: a title shot (on a roll and close enough to the champion), out of a rivalry that has gone cold, a turn to villain (losing, unhappy, no story), or a team with a friend. Say yes or say no: neither costs an action point. Yes is a real thing in the game (a promised title match the game holds you to, the rivalry ends, they turn, the team is formed). No is remembered. Not seeing them at all is remembered too. Nobody asks again for twelve weeks. Code: the `ask` block in `peopleNow()` and the `_yes` and `ask_no` entries of `PPL_ACT` in `src/79-people.js`. Tests: `node test-people.js` (a1 to a5).
  - [ ] More to ask for: a raise, time off, a new look, a match with somebody they name, off a show.
  - [ ] A third answer: not yet, but here is what it would take.

### 0l. The Office: The desk, Backstage, Storylines (0.35)

Ryan, 6 October: "Backstage needs to move to its own page in the office menu. That will give you room to expand that section so we can see the other rooms and who's in them. I also want to change production truck to Your Office (like wrestlers go to the booker's office to ask for storyline changes). I would also like to move Storylines from its own menu option to its own tab on office. I want The Desk, Backstage, and Storylines to be the main tabs in Office."

- [x] **1. Backstage is its own page in the Office.** All seven rooms and who is in them, the person you pick under them, then the rooms' own actions and the week's log. The desk keeps one line (points left, how many people are in the building for a reason) and a Go backstage button.
- [x] **2. The production truck is Your office.** It comes first and is the widest. People come to your door: an idea for the next chapter of a rivalry, the champion asking who is next, a newcomer, the face of the company. The owner's favourite is now in the owner's office, and whoever has brought a case is in the court.
- [x] **3. Storylines is a tab in the Office.** The Office tabs are The desk, Backstage, Storylines, Career. The Stories section is gone from the menu. History moved to Company with the other information pages.
- [x] **4. Things to do backstage are buttons, each with its own pop-up.** Ryan, 6 October: "the 'rooms themselves' menu needs to go. It should be various buttons that pop up things you can use your actions on. Like training 2 wrestlers of your choosing." Twelve buttons: ask for booking power, a bigger wage budget, the trainer, drills for two wrestlers, the class, the rounds, the pep talk, a sneak attack, the production meeting, a teaser, a hype package, hold court. The pop-up says what it does, asks who, shows the chance, and spends the point.
- [x] **5. Booking power on the Storylines page.** Ryan: "you can use booking points to do various things on the Storylines screen besides start the top feud. Like tag team break up, push a wrestler, buy budget pre-tape angle/promo that auto adds itself to the next show based on where you say it goes on this screen. Like start of the show, mid show, end of show." Code: `src/98-plot.js`. Tests: `node test-first.js` (bp1 to bp10), `app/tests/stories.js`.
  - Break up a tag team (2): pick the team and who turns. The team ends, a rivalry starts hot, and both remember.
  - Push a wrestler (2): momentum now, a little more standing, and the two nearest them on the card get jealous. Once in eight weeks each.
  - Buy a budget pre-tape (1): an interview, a call-out or an attack, for the next show, at the start, the middle or the end. It is on the run sheet at once, takes five minutes, grades a little under a live one, and a suggested card keeps it. One a show.
  - [ ] More to buy: a turn, a title shot, a new stable, a mystery, a return. And prices that move with how hot the story is.
- [x] (0.36) People coming to Your office ask for things. Section 0m.

### 0k. Core systems: six changes (0.34)

Ryan, 6 October: "we can build out the depths of reasons later. Let's focus on core systems." And: "I also want a sixth add. When you start a new game you get a cool retro opening of the owner congratulating you on the new job and a little pretext. We can build out the pretext later." Tests: `node test-first.js`, `node test-people.js`, `app/tests/office.js`, `booking.js`.

- [x] **1. The risk is on every line of the run sheet.** Each match shows short flags from what the road agent can see or has read: Worn down, No chemistry, Chemistry, Too long, Squash, Rough team, Unhappy. The fog holds: a flag never says more than the agent's read.
- [x] **2. Promises reach the card.** A match with somebody you promised a win says so (Promised a win, or Promise kept once you call it). The card warns on the last show before a promise falls due. "Suggest a card" calls promised wins it has the booking power for, and puts the face of the company in the main event when they are on the card.
- [x] **3. The Office opens on the fire.** Matters that need an answer are first on the desk, above the tasks, with their answers and "before the week can end". The one from last night is marked. Answered ones are in a panel lower down.
- [x] **4. After the show hands you next week.** It is a one-screen page now (desk, tablet and TV): a list of one-line rows and a pane for the one picked. A "Next week" row lists promises coming due and what the desk is counting down to.
- [x] **5. The first two required actions.** After your first show you have to sign a sponsor (the task says what a sponsor is, and cannot be left for another week). In the week of your first big event you have to name the face of your company, in a pop-up on the desk with the six biggest names and a reason for each. Each is asked once. (Section 0h.)
- [x] **6. The opening.** A new game opens on a telex from the owner on a black screen, typed out a line at a time: the job is yours, what kind of company it is, where it stands in the world, who holds the top title and who the owner's money is on, your first show. An owner-booker gets their own version.
  - [ ] The pretext is short. Ryan will build it out: how you got the job, who had it before, what the owner wants.
  - [ ] It is shown with the start-up screens, so turning those off in Options turns it off too. It should get its own switch, and a way to read the letter again.
- [x] Fixed on the way: making two people shake hands backstage did not change how they felt about each other. It does now.

### 0j. Backstage: people, not rooms (0.32)

Ryan, 6 October, after seeing three mock-ups: "I like people not rooms. Let's expand on this concept and game it. I want the people who show up in these rooms to be connected to ongoing storylines or the current goings-on in your company." Code: `src/79-people.js`, `People` in `app/src/screens/office/BeforeShow.tsx`. Tests: `node test-people.js`, `app/tests/office.js`.

- [x] The desk shows five rooms as columns, with a face for everybody who is there and one line saying why. Nobody is there by chance.
- [x] Who shows up, and what one action point does about it:
  - **Trainer's room:** hurt (stand over the trainer for a week off, or look in on them), worn down (the full treatment). A champion comes first.
  - **Catering:** went home furious after the last show (sit down with them: an attempt, and it answers the matter on the desk), low (the same), real heat with somebody (make them shake hands, or put it on television as a rivalry), the owner's favourite (ask them to put in a word).
  - **Parking lot:** a rival's offer or a contract running down (tell them you want them to stay), the villain of the hottest rivalry waiting for the other one (let it happen with a camera on it).
  - **Gym:** the one the breakout clock is following (work with them yourself), an act the crowd is with (tell them they are next: a promised win), two rivals who do not click in the ring (make them walk through it).
  - **Production truck:** somebody with an idea for the next chapter of a rivalry (shoot it), the champion who wants to know who is next, a newcomer who has not appeared (a teaser), the one the shows are built around (walk them through the show).
- [x] One point, one person, once a week each. Everything done is remembered by the people involved and is on the week's log.
- [x] The rooms' own actions are still there under "Around the building".
- [ ] More reasons, from more of the game: a stable falling out, a tag team that wants to split, a mentor and a rookie, somebody back from injury, a title promise coming due, the dirt sheet's rumour of the week, a sponsor's guest, a rival's star in the building.
- [ ] People talking to each other: two faces in one room as a scene, and the choice is which side to take.
- [ ] The desk is not a one-screen page yet. This is the first piece of making it one: the people grid is the middle of that page.
- [ ] The court and the owner are still rooms. They could become people too (the judge's bench, the owner at the desk).

### 1. Finish the pop-ups (small)
Feature list items 10 and 11. Code: `app/src/shared/cards.tsx`, `Name`, `TitleName`, `TeamName` and `Txt` in `app/src/kit/index.tsx`, the card stack in `app/src/store.ts`.

- [x] Wrestler, tag team and title pop-ups; names inside open more; Back steps out; Close shuts all.
- [x] Names in news, the inbox, reports, stories and tables are links.
- [x] `app/tests/cards.js`, `office.js`, `roster.js`, `stories.js` pass.
- [x] Run `app/tests/booking.js`, `start.js`, `company.js` and `journey.js` on this build and fix what they find. All pass. One TV check in `company.js` was too strict: after scrapping a house rule the only live controls left are the page tabs, so the highlight goes there.
- [x] Team **record** on the tag team card (wins and losses are now stored on the team; older saves start at 0 and 0).
- [ ] Still not built: names in the live broadcast (typed out letter by letter, so not linked). Wrestler goals on the card are done (wish 1).

### 2. Storylines from wrestling history
The player spends booking power to start an epic storyline; smaller ones can start by themselves or be offered by the writer.

- [ ] A storyline template: a name, who it needs (roles such as leader, defector, rival, champion), a cost in booking power, three to six beats spread over weeks, what each beat needs on a show (a match, a promo, a run-in, a title change), a payoff, and how it can backfire.
- [ ] Templates under original names, each modelled on a real pattern. Epic ones: a renegade faction of outsiders takes over; an elite four-member stable built around a champion; two top stars trade the title across three big events; a personal blood feud that escalates through gimmick matches; the owner against the rebel wrestler; the long underdog chase for the title; partners who explode over jealousy. Infamous ones that can go wrong: an invasion nobody takes seriously; a title handed over without a match; a champion leaving with the belt; a mystery attacker whose reveal disappoints.
- [ ] A Storylines page section to start one, see its beats, and see what the next show needs. Missing a beat cools it; hitting the payoff lifts everyone in it.
- [ ] Rival promotions run them too, and the news reports it.
- Engine starting points: feuds in four acts and the angle generator in `src/20-story.js`, stables in `src/60-rpg.js`, the saga in `src/80-world.js`.

### 3. The new booking screen (large; the core loop)
Feature list item 6. Replaces `app/src/screens/booking/` card editing; the engine's match maths stays.

- [ ] Shows have a length: 1, 2 or 3 hours, or pay-per-view. The length sets the card: 3+3, 4+4 or 5+5 matches and promos.
- [ ] Slot cards for matches and promos, and one time bar the player drags to split the show. Each segment shows its ideal length; too short or too long costs it.
- [x] Promos and angles as booked segments: pick the people and a kind (see 0c). Still to do here: contract signings and segment length.
- [ ] Suggested picks and quick-fill buttons. Booking power to call finishes carries over unchanged.
- [ ] The show plays out segment by segment with points popping up, a grade per segment, and a grade for the show. Keep the work score and the crowd score separate and visible (they already exist as `mq` and `cr`).
- [ ] Crowd heat shown while booking; creative energy as a resource the booking team generates.
- [ ] **Pre-book the week:** a tab per show; cards for later shows are kept until they run. Today `S.card` holds one card for `S.queue[S.qi]`.
- [ ] **Each show feeds the next:** a strong ending lifts the next show's audience, a thread left hanging costs it, and the booking screen says what carried over.
- [ ] **Fast mode:** one button books and runs the week with suggested cards and stops for decisions.
- [ ] Works with mouse, touch, keyboard and remote. Dragging needs a button alternative.

### 4. Arena pick, gate report, popularity per city
Feature list items 1 and 2, plus weather, star names and event intent from the table.

- [ ] Cities with a popularity score per federation; good shows raise it, bad shows lower it, absence fades it, overexposure shrinks the gain. Rivals have their own scores.
- [ ] Before a show: pick the city, then a building (capacity, rent, crowd type), with an attendance forecast as a range.
- [ ] Gate report pop-up after the show: tickets against capacity, why it drew, gate minus rent, the city's score before and after.
- [ ] Sellout streaks, bigger buildings unlocking, crowd heat feeding match ratings, seasonal weather.
- [ ] A city list on Company with trend and weeks since the last visit.
- Engine starting points: `demand`, `capFor`, `ticket` and `venueFor` in `src/00-core.js` and `src/10-match.js`; each promotion already has a `cities` list.

### 5. TV deals paid per hour, streaming, same-night wars
Feature list items 3 and 4. Replaces the three-level broadcast slot (`P.slot`, `E.askSlot`).

- [ ] Networks with tastes; deals with an hourly rate, a night and slot, a length and a ratings target. Ratings reported per hour.
- [ ] Executive calls, content rules, renewal countdowns, bidding wars, cancellation warnings.
- [ ] Streaming: pays per subscriber, grows with back catalogue and match quality, lifts popularity in cities not toured, exclusivity that can conflict with TV.
- [ ] Every promotion has a night. Moving onto a rival's night is offered by the network or streamer and starts a ratings war with a weekly winner.
- [ ] The startup model's "land a better TV deal" pressure (`MODELS.startup.month` in `src/78-models.js`) should move onto this system.

### 6. Event calendar, promotion spending, sponsor tiers
Feature list items 5 and 7.

- [ ] A year planner: schedule events by type (flagship, arena, ballroom, gimmick night, battle royal, tournament). The flagship has an original name per promotion.
- [ ] Weekly promotion spend on this month's event, next month's and the flagship; a hype meter per event; a buy rate report after each.
- [ ] Sponsors with tiers, their own boosts and an ongoing goal; tier-up pop-ups, unhappy warnings, conflicts between sponsors. Today sponsors are flat deals with one condition (`src/50-company.js`).

### 7. The tycoon layer
- [ ] A world ranking of every wrestler across all promotions and free agents: a yearly top 500 and a weekly top ten. `E.power` in `src/90-api.js` is the seed of it.
- [ ] Level-up pop-ups after a show for wrestlers who improved, saying what went up.
- [ ] Yearly awards across the world (the engine has awards and a hall of fame for the player's company).
- [ ] Momentum should matter more, and say so (fan wish list).

### 8. All-federation dirt sheet and dynamic events
Feature list item 9.

- [x] A dirt sheet page: lead story, a section per federation, rumours with a reliability level, business news, match of the week, next week, and a review of the player's booking. It lives in the Net section (see 0c).
- [ ] Rival backstage drama, "on this day", media scrums after big events.
- [ ] Dynamic events of four kinds, on top of the inbox events in `src/40-week.js`.
- [ ] History-moment events under original names: the player is put in a famous situation and makes the call. Examples of patterns: a champion is leaving and will not lose the title on the way out; a wrestler shows up on a rival's show with your belt; a live microphone goes off script; a faction's contract talks collapse the night before the big event.

### 9. Free agents and the indie scene
- [ ] Indies as mini federations with their own small systems. They open and close over time.
- [ ] A free agent can work for any number of indies.
- [ ] An indie cannot book a signed wrestler on that wrestler's event nights, or at all if the home federation forbids outside dates (the corporate model does).
- [ ] The player does not compete with indies. Rarely, one grows into a real federation.

### 10. Locker-room and long-term items
From the table in `docs/feature-list.md`. Check each against the engine first; several exist in part.

- [ ] Career goals per wrestler; inner circle roles with political weight; canvas the locker room before a signing.
- [ ] Team bonding, interventions and call-outs (extend the backstage actions in `src/77-backstage.js`).
- [ ] Promoter friendliness per rival owner; cash in talent trades; joint super shows with shared money.
- [ ] Owner goals with visible progress; headquarters and hall of fame building projects; wrestling school affiliations.
- [ ] Custom house styles; per-title statistics.
- [ ] Rivals competing for time slots, cities and talent (finishes feature list item 8).

### 11. Balance and known problems
- [ ] **The underdog is too hard.** Playing the underdog company on autopilot, owner trust fell until the booker was fired around week 73. Suggested cards score about 1 to 1.5 points under the crowd's expectation there.
- [ ] **Big companies bank too much.** The corporate giant went from $110M to about $400M in 80 weeks against a planned $1.5M a week.
- [ ] **The startup is too easy once it gets a better slot** (about +$470K a week), and bleeds as intended while it does not (about -$340K a week).
- [ ] Watch roster churn among rivals after 100+ weeks (releases and signings by fit are new).
- [ ] The first-day screens grew; keep them readable (design goal: easy to read and quick to do).

### 12. Not tested or not decided
- [ ] The Steam wrapper in `desktop/` has never been run.
- [ ] TV and gamepad input were tested with simulated keys only, never on hardware.
- [x] Portraits: Ryan decided to keep the code-drawn faces.
- [x] The built-in world is named The EWF World (Ryan's decision).

## After each task

1. `node build.js`
2. `node test-uni.js universes/public_domain.json 60` (no errors, NaN 0 on every line)
3. The browser tests for the sections touched, then `app/tests/journey.js`
4. Tick the boxes here, commit, push.
5. If the live page is being updated: read the live version first and merge anything the other thread changed.
