# EWF 9000: task list

The hand-over from the build thread, written 2 October 2026 at version 0.11. Work top to bottom unless Ryan says otherwise. Read `CLAUDE.md` first for how the project works, and `docs/feature-list.md` for the full wording of each feature.

**`NEXT.md` is the work queue.** It turns the tasks below into ordered steps for an unattended run. Start there.

**`IDEAS.md` is the build thread's list:** the next 100 ideas and refinements, in five batches, chosen to stay clear of `NEXT.md`.

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
| Growing a company | A company adds titles and shows every year. So belts and weekly shows can be created inside a running game, not only in the World Editor, and rival companies add their own once a year. |
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
- [x] Works on desk, phone and TV layouts. Back steps out one level at a time.
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
- [x] **Rivals** add a belt or a show in the first week of each January when their roster and popularity support it, and drop a show when broke or short of people. The news reports it.
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
