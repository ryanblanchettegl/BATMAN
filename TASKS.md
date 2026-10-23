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
| The match screen, 22 Oct | Fewer kick-outs. When there is no match picture for the moment, the picture cuts to the commentators. The animation never loops while the commentary catches up; it flows. Build: an instant replay of the finish, a big referee count on near falls, paper-flip cuts between pictures, a finisher close-up with the move's name, cinema mode (the picture fills the screen), the winner celebrating after the bell, big moments for each match rule (ladder, cage, tables), run-ins drawn as their own pictures. The night's highlights go on After the show. The feed is livelier and each poster has a personality of their own; the company's sign-off post comes once, after the main event, not after every match. |
| Blueprint, questions, approval, 23 Oct | A core rule for any new game mode, system or major feature: first a complete blueprint (states, data, screens, money and balance), then a list of probing questions for Ryan, and no code until he has read both, answered and said go ahead (CLAUDE.md rule 9d). |
| Sound effects, 23 Oct | "It sounds terrible." All sound effects are off; the game is quiet except the soundtrack. The redo does not need to match the papercraft look: it should sit well with the classical music and feel good. It goes through rule 9d, and every sound is approved by ear. The office sounds are piano, not harp ("harp is wrong piano is right"). The blueprint and every pick so far are in `docs/plans/sound.md`. The broadcast sounds are in the game (step 2); the office piano is next; boos and the tweener reaction wait on a source. |
| External assets, 23 Oct | A new rule: the game can have external assets (recorded sound effects, music, images), shipped with the game and free to use commercially, each credited. It replaces "zero external assets" (CLAUDE.md rule 2). |
| Cancelling a show, 22 Oct | The network can cancel your weekly show, but you cannot quit one yourself: you play out the network contract. |
| The assistant, 22 Oct | The assistant leaves Career and gets its own window on the desk: tips, and what it is booking for the house shows. A placeholder for now, built out later. |
| Loading screen, 22 Oct | No loading screen. The game opens straight on the title screen. |
| Balance, 22 Oct | Keep it: a player who only presses Suggest a card can lose the job or go broke. |
| WPW's champions, 22 Oct | The Judge (World Heavyweight), "Unstoppable" Mike Adams (Florida State), The Dream and Jokester (World Tag Team), Raelis Shy (Canadian Pure), Dan Murph (Hardcore), The One (PCW World Heavyweight). |
| Licence, 22 Oct | All rights reserved. No licence file. |
| Parody notes in git history, 22 Oct | Rewrite the history to remove them, and force-push. Everyone re-clones afterwards. |
| Map gaps, 22 Oct | Trace the missing states and regions, and when a city still has none, show the whole country (or continent) with the pin on the city. |
| Platforms, 22 Oct | Windows first, then consoles, then others later. Keep every control working by gamepad. No TV-size test runs for now. |
| The wrestler always on show, 18 Oct | On the World Editor's Wrestlers page, the Roster page and Free agents the wrestler is always drawn full length beside the list, like the roster screens of SmackDown: Here Comes the Pain. The Wrestlers page as built is the pattern (rule 5c). |
| The art style, 18 Oct | The desk image is the art style: everything looks made from construction paper. Built in CSS and canvas now; Blender renders of the pieces later to make it more 3D. |
| The World Editor's foundation, 18 Oct | Create a Wrestler (Create a Player) and Create a Scene are the new foundation for the World Editor. Its other parts are built around them. |
| Entrances and move pictures, 18 Oct | A wrestler's own picks are for their signature moves and finishers. Entrances: pick a canned one, or make a custom entrance through Create a Scene (World Editor). No other per-wrestler scenes. |
| Create a Player in a game, 18 Oct | The roster says **Edit wrestler** and opens that wrestler's record. **Create a Player** makes someone new, and in an active game every new wrestler goes to free agency; you sign them like anybody else. Only the World Editor puts somebody into a company. |
| Create a Player, 18 Oct | Ryan's blueprint (`docs/plans/create-a-player.md`): a SmackDown-style suite, the wrestler on the left and windows on the right; body by height, weight, type and four sliders; three outfits (ring, entrance, street) worn by context; paper swatches with finishes in four slots; lettering and shapes cut from card; finishers acted out on a dummy; one `wrestler.json` a wrestler, no pictures, read by the scene engine. Real names in the blueprint were examples only (rule 3). |
| Platforms, 18 Oct | Steam first (the desktop from 1080p to 4K, and the Steam Deck), Android down the road. No more tablet or TV test runs or layout rules; browser tests run at desk size. Controls keep working by touch for Android later. |
| The look, 18 Oct | Construction paper on a mid 90s Macintosh is the new rule, replacing the grey windows of 6 October: cut card in layers, navy pinstripe title bars, cream windows, bold red, green, blue and yellow buttons stacked from card, tight shadows down and to the right, no CRT filter. Portraits and wrestlers are construction paper and replace the pixel faces. Reference `docs/mockups/paper/desk.png`; rule 2a in `CLAUDE.md`. |
| Booking, 16 Oct | No fast mode. Suggest a card gives a mediocre show: to win the game or keep the job the player has to decide well. Fog of war stays: the game never tells the player how to put on a good show; the road agent drops sly hints. Redo the booking screen: more buttons, matches dragged or moved up and down the card, match booking that looks better and is easier (pop-ups are fine), and what COULD happen on the show tonight from the player's choices. |
| Battle royals, 16 Oct | Up to 30 people. 30 minutes for every 15: a 30-man battle royal lasts an hour. |
| Buildings, 16 Oct | The player does not pick the building. Every city has its own list of buildings the road draws from. |
| TV cancellation, 16 Oct | A TV show can be cancelled. It then becomes a house show. |
| Company arcs, 16 Oct | Storylines gets Company Arcs, picked once a year: an invasion, a faction in the style of a famous 90s takeover group (original names), a hostile takeover by an authority figure, a brand split, or a plain build to the flagship. Each is its own procedurally generated engine with decisions through the year (who leads the faction, who the hostile authority fires on screen). |
| The GM, 16 Oct | After the arcs: research and rebuild booking power, action points, levelling, notifications and the RPG side of building your GM. A skill tree, like Path of Exile but smaller and about wrestling and this game's mechanics; each perk does something different. |
| Decisions, 16 Oct | The decision screens look better: big buttons that are easy to read and press, and something like simulated animation so a decision feels important. The events after every show and every week are one of the most fun parts and set the game apart. |
| Parody world, 16 Oct | Keep the public-domain universe. Add a parody universe: parodies of real wrestlers and companies (WWE, AEW, TNA, NJPW and others). Ryan's lawyer says following parody law is fine. Build it as parody: names changed into jokes on the original, never the real name or a near-copy, no real logos or photos, comic exaggeration that comments on the original, and a parody disclaimer in the game. |
| Roadmap, 16 Oct | `docs/roadmap.md` is the next 30 changes, in order: booking first, then company arcs, the GM, decisions, the living show. |
| Answers, 16 Oct | Suggest is safe and flat. A match is booked in one pop-up. Tonight's window: possible moments, who is at risk, what it sets up, the agent's gut. Better agent, better hints, never wrong. A cancelled show can earn TV back. 3 to 5 buildings a city. Battle royals: surprise entrants, the winner earns a title shot. Run sheet: drag to reorder, lock a slot. Arcs: one a year ending at the flagship; one can flop and be turned around for something at the flagship; first the faction takeover, the hostile authority and the brand split. Skill points from levels, milestones and arc payoffs, respec at a cost; five branches by role. Booking power and action points reset after every show, more of them, some carried over, perks raise them, lost or earned by actions. Decision looks: concept a few and pick the best, sound too. One big event a show, a few small ones a week. Contracts by appearance, 6 months, 1, 2, 3 years with realistic money. No end unless you retire; fired, take a job elsewhere; after ten years start your own company with backing. |
| The living world, 16 Oct | Shows are entertaining and different every week to watch and read; decisions drive how alive the show and the game feel, not only feuds. Wrestling is an ecosystem that lives without you. Great storylines should come from people reacting for human reasons, not random numbers. |
| Calendar | The game starts in the present day (October 2026). The 1990s PC look stays exactly as it is. |
| Screens | Office is the hub and opens on "Before the show" with a **Book the next show** button. Manage holds every choice. Company is information only. Music sits top right. |
| Wording | No dice or rolls anywhere. An attempt has a percentage chance, with what helps and what hurts. |
| Action points | Every action point spent leaves a note of what happened, on the desk and on the next show report. |
| Booking screen | Replaces the current card editor. Card size is set by show length: 1 hour is 3 matches and 3 promos, 2 hours is 4 and 4, 3 hours or pay-per-view is 5 and 5. |
| Promos | The player picks who and what kind; the game writes and grades it. |
| The week | Each show is booked on its own, one at a time; there is no booking the whole week ahead (Ryan, 21 October). Each show affects the next one. |
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
| Scenes are the show | 19 October: storylines and building a card are hooked into scenes. Every storyline, and every angle or promo a player can put on a card, has a scene; building a show is building out its scenes. Arc storylines and multi-week moments have scenes for their beats. The World Editor gets an easy builder for players' own storylines, angles and promos. Start it once Create a Wrestler and Create a Scene are built out; the match builder and the broadcast are redone in the new look after. CLAUDE.md rule 9c. |
| World Editor | The creation suite is its own page called **World Editor** on the title screen. A player builds a world from scratch (companies, shows, belts, wrestlers) and uploads it to the Workshop. This is the main next item. |

## Tasks

### 0aa. The Director (Bill, 21 October: "I like this feature add it to the plan")

A pacing layer that decides when trouble reaches the desk: it reads how tense the company already is and chooses which of this week's possible events happen, and how big. The player picks a style (The Promoter, The Carny, The Purist). Plan: `docs/plans/director.md`.

- [ ] Step 1: the tension reading and its eight-week history, headless only (`test-director.js`). Nothing in play changes.
- [ ] Step 2: `genEvents()` asks the Director how many events this week; compare 60 weeks before and after.
- [ ] Step 3: tag every event maker as a problem, a chance or colour, and let tension pick between them.
- [ ] Step 4: the three styles, chosen at the start of a game and shown on Career; old saves get The Promoter.
- [ ] Step 5: event sizes and the rhythm around big nights.

### 0ad. Company arcs that start from what happens (Bill, 21 October: "This is a key feature, Company Arcs need to start from beats that happen from specific events happening")

An arc starts from an event (a betrayal, an authority figure on screen, a rival folding, a comeback, a breakout) offered on the desk as the story of the year, and moves through beats fired by what happens in the game, with chapters on the desk only as a fallback. Arc types become shapes, not scripts. Still one a year, paid off at the flagship. Plan: `docs/plans/arc-beats.md`.

- [ ] Step 1: the beat format and shapes as data; today's three arcs ported with no change in play.
- [ ] Step 2: seeds, the events that can start an arc, offered on the desk; the old list as the fallback.
- [ ] Step 3: beats fired by events (live calls, results, titles, injuries, leaks, bonds), the fallback timer, more credit for beats the player booked.
- [ ] Step 4: new shapes, one at a time: the rival booker first (Bill, 21 October: "R5 - this should be a story arc"; section 4b), then the invasion, the comeback, the chosen one, the last run, civil war, blood feud, the student and the master.
- [ ] Step 5: beats and shapes in the World Editor.

### 0ae. Catching fire, and forty calls for the live show (Bill, 21 October: "we also need to have like 40 events that could happen on a show to give the director")

Catching fire (a lower-card act beating the card's prediction is called out live) and forty new calls for the gorilla position, each caused by something true of the night and tagged problem, chance or colour, so the Director can pace them through a show. Plan and the full list: `docs/plans/live-events.md`.

- [ ] Step 1: catching fire as a `LIVEK` entry (headless test).
- [ ] Step 2: today's thirteen kinds of call tagged problem, chance or colour.
- [ ] Step 3: the Director on the night, after the Director's weekly steps 1 to 3; it replaces the flat chances in `E.chaos` and `LIVEK.disaster`.
- [ ] Step 4: the forty, a few at a time, each batch shown to Bill.
- [ ] Step 5: stills for the new calls as the scene work reaches them.

### 0af. The monthly wrestling magazine (Bill, 21 October: "I want A monthly wrestling magazine")

An invented magazine every game month covering the whole world, telling the on-screen stories as if they were real (the dirt sheet tells the truth): a cover star drawn by the scene engine, the big story, rankings, match of the month, an interview, rumours, letters, a readers' poll, history. Being on the cover matters; the player can pitch a story or buy an ad. After each flagship, an annual issue that can be saved and shared. Plan: `docs/plans/magazine.md`.

- [ ] Step 1: the issue built in the engine at each month's end (headless test).
- [ ] Step 2: the desk line, the magazine spread in a pop-up, past issues in the Net section.
- [ ] Step 3: the cover's lift, the editor, pitching a story, buying an ad.
- [ ] Step 4: letters and the readers' poll.
- [ ] Step 5: the annual issue after each flagship, and saving an issue to share.

### 0ag. Promos written from everything that is going on (Bill, 21 October: "p4 = This is a main idea. Since it will make promos much better")

Promos built from what is true tonight (the match, the feud's history, last week, a title, the big event coming, wants, grievances, moods, partners, betrayals, the crowd, the arc, history), each with a weight, and said in the wrestler's own voice (a lexicon from gimmick, personality, home town and backstory). No line or topic repeats inside eight weeks; a war of words is an exchange where each answers the other; a promo about what the crowd cares about grades higher. Plan: `docs/plans/promos.md`.

- [ ] Step 1: `promoTopics()`, every fact a wrestler can talk about with weights (headless test).
- [ ] Step 2: lines for each topic, a few at a time.
- [ ] Step 3: the voice: a lexicon per wrestler and per-character grammar symbols; show Bill three wrestlers saying the same thing.
- [ ] Step 4: no repeats.
- [ ] Step 5: war of words as an exchange.
- [ ] Step 6: relevance in the grade, and catchphrases from the lexicon.
- [ ] Step 7: the magazine, the hallway, returns and the feed use it.

### 0ah. Traits, and perks at 60, 70, 80 and 90 (Bill, 21 October: "each character should have traits, that defines what they want, how they react and their personality"; "a perk at level 60, 70, 80, and 90 ... specific benefits to specific style")

Modelled on Madden (motivations and tags in 26, the Persona Engine in 27, ability slots by rating and archetype in 23 and 24, X-Factors). Every wrestler has wants (what they want), two personality traits (how they react), a mood for a while after something happens, and today's earned traits shown as reputations. A perk slot opens at overall 60, 70, 80 and 90, with two choices per tier for each of the seven styles; the 90 perk is a signature that switches on and off inside a match. A perk sleeps if the overall falls below its tier. Plan: `docs/plans/traits-and-perks.md`.

- [ ] Step 1: wants and personality in the backstory block, generated by hash, shown in the file (headless test).
- [ ] Step 2: reactions through `relBump()` and `youRemember()`; wants move morale and contract prices.
- [ ] Step 3: moods (`w.chip` becomes Proving it).
- [ ] Step 4: perk slots at 60, 70, 80, 90, the pick on screen, the computer's pick, sleeping perks.
- [ ] Step 5: signature perks at 90 inside the match.
- [ ] Step 6: wants in contract talks, and rivals that meet them.

### 0ai. Word travels (Bill, 21 October: "r4 - i like too")

How you treat one person reaches their friends, partners, teacher, family and clique, weighted by closeness and the person's standing, one step only, each with a reason in the file ("cooler on you since you buried their friend"). Small. Plan: `docs/plans/word-travels.md`.

- [ ] Step 1: passing it on in `youRemember()` (headless test).
- [ ] Step 2: reasons in the file and a line in the notification bar.
- [ ] Step 3: personality shaping it, after 0ah.

### 0aj. The hallway, on the desk (Bill, 21 October: "r2 - should be on the main desk screen")

Three to five exchanges overheard each week, picked by priority from what just happened, shown in a strip on the main desk, each used once, names that open the file. Replaces the shelved E11. Plan: `docs/plans/hallway.md`.

- [ ] Step 1: `E.hallway()`, candidates and priority (headless test).
- [ ] Step 2: lines, in the voices of 0ag when they exist.
- [ ] Step 3: the strip on the desk.
- [ ] Step 4: the rest of the candidates.

### 0ak. Backstage Politics (Bill, 21 October: "R1 - But I want it called Backstage Politics")

Secrets you learn and favours owed both ways, held and spent: a secret makes a star take the loss or a holdout sign, at a risk to trust if it gets out; wrestlers call in what you owe them at the worst time. Standing in the room, and moves that shift it. Plan: `docs/plans/backstage-politics.md`.

- [ ] Step 1: secrets you know, from the kayfabe layer and the press (headless test).
- [ ] Step 2: the Backstage Politics page.
- [ ] Step 3: spending a secret.
- [ ] Step 4: favours both ways.
- [ ] Step 5: standing in the room.

### 0al. They come back changed (Bill, 21 October: "p3 - Yes!")

Grievances kept on wrestlers (released, fired on screen, lost a loser-leaves-town match, buried, a broken promise, screwed, replaced, hurt and dropped). Months later they can return at a rival, on the indies or at your door, as a new character made from the grievance, with a target, a mood and a price to sign back. Kept clear of the Nemesis patent; a lawyer check before release. Plan: `docs/plans/come-back-changed.md`.

- [ ] Step 1: grievances (headless test).
- [ ] Step 2: the return.
- [ ] Step 3: the new character from the grievance.
- [ ] Step 4: signing them back.
- [ ] Step 5: the feud, the arc seed, the magazine story.

### 0am. The locker room as a place (Bill, 21 October: "V2 yes")

A diorama where seating is the relationship matrix: cliques on one bench, the veteran's corner, the rookie by the door, enemies at opposite ends, an empty locker with a nameplate after a release, tonight's card taped to the wall. No numbers. Built as the scene renderer allows. Plan: `docs/plans/locker-room.md`.

- [ ] Step 1: `E.lockerRoom()`, the seating by hash, stable week to week (headless test).
- [ ] Step 2: the room as a scene set.
- [ ] Step 3: the objects.
- [ ] Step 4: pressing things, and hallway lines as bubbles.

### 0an. Buildings that remember (Bill, 21 October: "v3")

Every venue keeps its own short history (title changes, betrayals, great matches, record gates, riots, debuts and farewells). A rematch in the building where it started gets heat and a line in the commentary; the crowd brings signs about it (takes in E7); a banner for a famous night; the road map lists what happened here. Small. Plan: `docs/plans/buildings-remember.md`.

- [ ] Step 1: memories per building (headless test).
- [ ] Step 2: heat from the past in the match.
- [ ] Step 3: signs in the crowd.
- [ ] Step 4: the road map list, and "what happened here" when booking.
- [ ] Step 5: banners in the venue scene.

### 0ab. Pre-history (Bill, 21 October: "prehistory from real history, and a option for new companies to have a simulated prehistory for 10 years")

The parody world's past comes from real wrestling history, as fixed anchors under parody names, with the simulation filling in between. A company with no past can start with ten simulated years. On-screen record only, and a lawyer check before shipping. Plan: `docs/plans/pre-history.md`.

- [ ] Step 1: the headless runner, `E.preHistory()`, writing a `history` table (`test-prehistory.js`).
- [ ] Step 2: anchors that must happen as written.
- [ ] Step 3: "Start with a history: none, or ten years" in Create a federation, the World Editor and quick-made worlds, with the story-so-far scroll.
- [ ] Step 4: the parody world's anchors, one company at a time, EWE first.
- [ ] Step 5: legends for the anchors that need them.

### 0ac. The last booker's mess (Bill, 21 October: "perfect for the main new game mode when we walk through people how to play the game")

Two ways to start: the **main game** opens in the week of the flagship, in the previous booker's office, whose documents (a title promise, an unhappy star, the advertised main event, the owner's memo, a leak, unpaid bills) are real matters that teach the game. The player's first job is to book the biggest show of the year; the week after, a new year begins. **A wrestling year ends at the big show** (Bill, 21 October). **Sandbox** is a free start, as today. Plan: `docs/plans/last-booker.md`.

- [ ] Step 1: the mode choice, and the main game starting in the flagship's week with year one starting the week after (headless test).
- [ ] Step 2: the mess built from what is true of the company, by hash.
- [ ] Step 3: the office screen with the drawers and documents, opening onto the desk's tasks.
- [ ] Step 4: the first year's required actions start the week after the flagship (section 0h), and yearly systems (awards, annual report, the owner's verdict) close at the flagship.
- [ ] Step 5: the last booker as a person in the history, once pre-history (0ab) exists.

### A1. The road to A+, phase 1: balance (Bill, 21 October; the review at https://claude.ai/artifact/KQmaYcSgaUeVtEWWhWGGUx)

Bill's decisions of 21 October: picking the winner is free and booking power buys the extras; Suggest a card lands around a C; both worlds ship, the parody world is the Steam default and a world switch sits at the top right of the title screen; the licence is all rights reserved; no new systems until balance, the first hour and the screens are done; Booker Mode starts at the grand show a week before the business year ends, Sandbox Mode is the free start; the long broadcasts stay; the game is built for 1080p only (no tablet, no Steam Deck).

- [x] Picking a winner costs no booking power. A draw costs 1, and a loss called on a star with creative control still costs 2. A long shot is paid for in people: the favourite told to lose loses morale and remembers it.
- [x] Suggest a card lands around a C. A match left just as suggested works in front of a flat crowd ("Booked by the numbers", `SUG_FLAT` in `src/99-suggest-flat.js`), and the crowd lowers its sights only a little after poor shows.
- [x] Coasting fails: the owner sets three goals for each year, judged at the flagship (`src/66-owner-year.js`, shown on Career), and hands over the company only after two years with all three met. When a booker runs out of money the owner covers it, for 12 trust; bankruptcy is for owners, scenarios and challenges.
- [x] Popularity follows the grades: a show that gives the crowd what it came for (a B) grows the company a little (`POP_EDGE` in `src/30-show.js`).
- [x] EWE's money: checked. With a thinking booker EWE grows its cash over two years; it loses money only on weak shows, which is the point.
- [x] A balance test with targets for every company model (`node test-balance.js`).
- [x] The licence: all rights reserved (`LICENSE`).

### A2. The road to A+, phase 2: the first hour (Bill, 21 and 22 October)

- [x] Commentary: play-by-play and colour each have their own menu, not steps (Bill, 22 October). The chairs are a list (`CHAIRS` in `app/src/screens/office/Windows.tsx`), so a third voice can be added later.
- [ ] A third commentator (later; Bill: "pretty standard now").
- [x] The owner's letter in the workbench look, naming the goals for the year.
- [x] A loading card while a new game is set up.
- [x] A new booker's first show plays to a forgiving crowd (`FIRST_NIGHT`), and the desk says so.

### A3. The road to A+, phase 3: the screens (Bill, 22 October)

- [x] 1080p is the base and every layout scales up with no cap: type follows the tighter of the window's width and height, so 1440p, 4K and ultrawide get the 1080p layout, bigger. No tablet or Steam Deck size.
- [x] Tests run 1440p (`MODES=desk,big`) and 4K (`onescreen.js`) in place of the tablet size.
- [x] No cut-off text on the desk's road window, the storylines chart or After the show.
- [x] Readable labels: figures on paper in dark ink (the sign-off), the achievement strip in dark ink.
- [x] Roster bars that differ: smooth, coloured by band, with the number.
- [x] The header counts the time into the show while on the air.
- [ ] The broadcast camera clipping through the referee (a pass on the scenes in Create a Scene).
- [ ] A limit on interruptions a week: rank matters and calls, show the top few, let the rest wait (its own phase).

### 0w. Still pictures for the moments you answer (Ryan, 18 October)

- [x] Every matter on the desk and every call from the gorilla position shows one still diorama picture of the moment (somebody hurt, a fight backstage, two people face to face, a meeting across your desk, a walkout, the crowd on its feet): the picture on the left of the pop-up, the answers on the right.
- [x] Stills are made in Create a Scene like any other scene, marked as a still: one picture, no keyframes to play.
- [x] Both pop-ups in the paper look (Ryan: "it should look like the new art style"): cream card, the navy bar in pinstripes, the info strip, answers as card buttons.
- [ ] More stills: the trainer's room with the trainer, a parking lot, the owner in the office, a contract on the desk, the whole locker room for a mutiny.

### 0v. The creator suite, built out (Ryan, 18 October: "add them to the queue"; `docs/plans/creator-suite-roadmap.md`)

Create a Wrestler:
- [x] More hair (styles and a second colour), body hair, scars, freckles, more masks and mask designs.
- [x] Face paint in layers: up to three designs painted over the first, each in its own colour (round the eyes, a tear, a painted grin, a cross, and the first list's designs).
- [x] More gear: a satin ring jacket, a long coat, a baseball cap and a wool hat, bare feet taped at the ankle, a ring bodysuit and flared ring pants, a cape, a crown, a title belt round the waist or over the shoulder.
- [x] A front and a back (Ryan, 19 October): every wrestler can be seen from behind (the back of the head and the hair, the back of a mask with its laces, the back of every top, a back tattoo, knee pads by their straps). Their back on Create a Wrestler, Show their back on a person in Create a Scene (`Fig.b`), and lettering Across the back.
- [x] Layers in Create a Scene (Ryan, 19 October): everything in the keyframe front to back (people, props, the set last), each with Forward, Back (in every keyframe both are in), Hide and Lock (for editing only).
- [x] Layers in Create a Wrestler: the lettering and shapes on an outfit listed back to front with Bring forward and Send back, and face paint layers with Over.
- [x] A move set: every wrestler has one finisher and two signature moves (Ryan, 19 October), each signature early, in the middle or late in a match; up to three taunts, played now and then by whoever is on top. Wrestlers with no file get signatures by style.
- [x] An entrance built from parts: the walk (the five entrances, or a custom one), pyro (sparks, fountains, a flash, columns of fire), lights (a spotlight, lights down, red, blue or green, strobes) and the name of their music, which the announcers say as they come out.
- [x] Paper portraits for everybody, not only the edited (`Portrait` draws every wrestler from their doll), and a quick random wrestler (Surprise me in the suite).
- [ ] Parts made in Blender with sockets, and a parts format modders can add to.
- [ ] A file per wrestler on disk on the desktop build (`/save/wrestlers/`).

Create a Scene (with 0z):
- [x] More sets: a steel cage, a parking lot, a talk show, a news desk (each a setup on the New tab).
- [x] A packed stadium and up in the rafters (sets and setups).
- [x] Effects: spotlights, coloured light, strobes, lights down, sparks, pyro fountains, a flash, columns of fire, camera flashes in the crowd, motion lines, a spray of water.
- [x] Smoke rolling along the floor.
- [x] Props: ladders, a bat, ring steps, a bin, a broken table.
- [x] A truck.
- [ ] Props that can be thrown.
- [x] Frames: tall and square pictures for posters, magazine covers and portraits (Shape, on The scene tab; the picture is cut from the middle of the set), with a masthead prop for covers and the headline for captions.
- [x] Easing: each keyframe is reached smoothly, evenly, speeding up, slowing down, or in a cut (`Key.ease`); its timing is Arrives after.
- [ ] Still to come in animation: a timeline view, sound cues, and moves that can be used again.
- [x] More hooks (the authority figure: the boss of the hostile authority arc, else the owner or booker on the roster; the interviewer: an announcer; the referee as a person, dressed in stripes) and two stills for them (an interview backstage, called out by the boss).
- [x] Presentation filters a scene can pick (Ryan, 19 October): scan lines, an old TV tube and black and white, all off by default (Look, on The scene tab; `sc.fx`); for artistic promos and old-school companies.
- [x] A background creator: the Backdrop tab in Create a Scene makes a wall of your own (wall and floor colours, banners, signs, a big screen, posters, windows, a door, curtains, a skyline, a stripe, a row of lights, plants) and keeps it in the world like a scene (`pkg.backdrops`, `E.edSetBackdrop`, `kit/backdrop.ts`); any scene can stand in front of it.

New creators, each a small file cut by code, played in the game and shared:
- [ ] Create a Belt: plates, straps, gems, lettering and the company's logo in card and foil, worn by champions in every scene, portrait and title page.
- [ ] Create a Logo: the logo maker moved into the paper look, and logos on gear, rings, banners and portraits.
- [ ] Create an Arena: the ring's colours and apron, the stage and ramp, banners, the crowd's size and signs.
- [ ] Create a Prop: shapes, lettering and finishes put together into a prop with a place to hold it.
- [ ] Create a Move: a short scene with two hooks (who does it, who takes it), the community's move library.
- [ ] Create a Show: a show's lights, its marquee, its open and its desk team.
- [ ] Create a Poster or Cover: scenes framed tall, with type, for big events, the dirt sheet and the Web pages.

The Steam Workshop:
- [ ] Upload and subscribe in the desktop build, for each kind of file (wrestler, scene, entrance, move, belt, logo, arena, prop) and for packs (a whole world).
- [ ] A browser in the game for what is subscribed, a check on every file (`E.lookClean` is the pattern), versions so old files open, and a report button for a file that breaks rule 3.

### 0x. The paper look built out in Blender (later; Ryan, 18 October)

The desk image (`docs/mockups/paper/desk.png`) is the art style: the whole game looks made from construction paper. Pages are built to it now in CSS and canvas.
- [ ] Render the interface pieces in Blender as cut card (window frames and title bars, buttons in each colour, tags, group tabs, the menu bar, the control strip tiles and keys) so the paper has real thickness, light and shadow, and use them in the game as 9-slice images or baked textures.
- [ ] Every page moved to the paper look, one at a time with Ryan's go-ahead.

### 0v3. The workbench is the art style (Ryan, 19 October: "we are switching to concept a"; "this is the new art style. make it the rule and start spreading it everywhere")

- [x] A in every build (`app/styles/craft.css`, `app/ui/craft/`): torn cream paper windows with navy title strips, cut card buttons, index cards and sticky notes, on black construction paper, no tape. Rule 2a rewritten. The zine is kept as concept C (`app/styles/looks/c.css`, `app/ui/c/`).
- [x] The desk shows the state (or region) this week's city is in, cut from green card on blue paper with a pin and a label on the city (`SHAPES`, `src/91-shapes.js`, from `tools/build-maps.js`). Dot matrix is out: lettering that was in lights is marker on black card, the ring, bell and belt are painted card, and logos are painted with marker letters.
- [x] Spread to: tables, old panels, group boxes, gauges and names in lists; the title screen and its cut-card logo; Select promotion; the broadcast's opening poster, the call from the gorilla position and the matter pop-up; After the show; tips and the SPACE key's note; the World Editor (its menu, hint strip, windows, lists) and Create a Player.
- [x] Checked page by page: the Manage pop-ups, Career, Web, History, Finances, the Scenes tab, Create a Scene, the logo creator, Help and Options.
- [ ] Blender renders of the workbench pieces (torn paper, card buttons) for more depth, as the paper look had.

### 0v2. The scrapbook zine was the core look for a day (Ryan, 19 October: "C is the winner")

- [x] Three concepts for a hand-made match page: A the workbench, B the cardboard box, C the scrapbook zine (`tools/creator/craft-kit.py`, `app/styles/looks/`).
- [x] C in every build, later replaced by A (0v3).

### 0w. Still pictures for the moments you answer (Ryan, 18 October)

- [x] Every matter on the desk and every call from the gorilla position shows one still diorama picture of the moment (somebody hurt, a fight backstage, two people face to face, a meeting across your desk, a walkout, the crowd on its feet): the picture on the left of the pop-up, the answers on the right.
- [x] Stills are made in Create a Scene like any other scene, marked as a still: one picture, no keyframes to play.
- [x] Both pop-ups in the paper look (Ryan: "it should look like the new art style"): cream card, the navy bar in pinstripes, the info strip, answers as card buttons.
- [ ] More stills: the trainer's room with the trainer, a parking lot, the owner in the office, a contract on the desk, the whole locker room for a mutiny.

### 0v. The creator suite, built out (Ryan, 18 October: "add them to the queue"; `docs/plans/creator-suite-roadmap.md`)

Create a Wrestler:
- [x] More hair (styles and a second colour), body hair, scars, freckles, more masks and mask designs.
- [x] Face paint in layers: up to three designs painted over the first, each in its own colour (round the eyes, a tear, a painted grin, a cross, and the first list's designs).
- [x] More gear: a satin ring jacket, a long coat, a baseball cap and a wool hat, bare feet taped at the ankle, a ring bodysuit and flared ring pants, a cape, a crown, a title belt round the waist or over the shoulder.
- [x] A front and a back (Ryan, 19 October): every wrestler can be seen from behind (the back of the head and the hair, the back of a mask with its laces, the back of every top, a back tattoo, knee pads by their straps). Their back on Create a Wrestler, Show their back on a person in Create a Scene (`Fig.b`), and lettering Across the back.
- [x] Layers in Create a Scene (Ryan, 19 October): everything in the keyframe front to back (people, props, the set last), each with Forward, Back (in every keyframe both are in), Hide and Lock (for editing only).
- [x] Layers in Create a Wrestler: the lettering and shapes on an outfit listed back to front with Bring forward and Send back, and face paint layers with Over.
- [x] A move set: every wrestler has one finisher and two signature moves (Ryan, 19 October), each signature early, in the middle or late in a match; up to three taunts, played now and then by whoever is on top. Wrestlers with no file get signatures by style.
- [x] An entrance built from parts: the walk (the five entrances, or a custom one), pyro (sparks, fountains, a flash, columns of fire), lights (a spotlight, lights down, red, blue or green, strobes) and the name of their music, which the announcers say as they come out.
- [x] Paper portraits for everybody, not only the edited (`Portrait` draws every wrestler from their doll), and a quick random wrestler (Surprise me in the suite).
- [ ] Parts made in Blender with sockets, and a parts format modders can add to.
- [ ] A file per wrestler on disk on the desktop build (`/save/wrestlers/`).

Create a Scene (with 0z):
- [x] More sets: a steel cage, a parking lot, a talk show, a news desk (each a setup on the New tab).
- [x] A packed stadium and up in the rafters (sets and setups).
- [x] Effects: spotlights, coloured light, strobes, lights down, sparks, pyro fountains, a flash, columns of fire, camera flashes in the crowd, motion lines, a spray of water.
- [x] Smoke rolling along the floor.
- [x] Props: ladders, a bat, ring steps, a bin, a broken table.
- [x] A truck.
- [ ] Props that can be thrown.
- [x] Frames: tall and square pictures for posters, magazine covers and portraits (Shape, on The scene tab; the picture is cut from the middle of the set), with a masthead prop for covers and the headline for captions.
- [x] Easing: each keyframe is reached smoothly, evenly, speeding up, slowing down, or in a cut (`Key.ease`); its timing is Arrives after.
- [ ] Still to come in animation: a timeline view, sound cues, and moves that can be used again.
- [x] More hooks (the authority figure: the boss of the hostile authority arc, else the owner or booker on the roster; the interviewer: an announcer; the referee as a person, dressed in stripes) and two stills for them (an interview backstage, called out by the boss).
- [x] Presentation filters a scene can pick (Ryan, 19 October): scan lines, an old TV tube and black and white, all off by default (Look, on The scene tab; `sc.fx`); for artistic promos and old-school companies.
- [x] A background creator: the Backdrop tab in Create a Scene makes a wall of your own (wall and floor colours, banners, signs, a big screen, posters, windows, a door, curtains, a skyline, a stripe, a row of lights, plants) and keeps it in the world like a scene (`pkg.backdrops`, `E.edSetBackdrop`, `kit/backdrop.ts`); any scene can stand in front of it.

New creators, each a small file cut by code, played in the game and shared:
- [ ] Create a Belt: plates, straps, gems, lettering and the company's logo in card and foil, worn by champions in every scene, portrait and title page.
- [ ] Create a Logo: the logo maker moved into the paper look, and logos on gear, rings, banners and portraits.
- [ ] Create an Arena: the ring's colours and apron, the stage and ramp, banners, the crowd's size and signs.
- [ ] Create a Prop: shapes, lettering and finishes put together into a prop with a place to hold it.
- [ ] Create a Move: a short scene with two hooks (who does it, who takes it), the community's move library.
- [ ] Create a Show: a show's lights, its marquee, its open and its desk team.
- [ ] Create a Poster or Cover: scenes framed tall, with type, for big events, the dirt sheet and the Web pages.

The Steam Workshop:
- [ ] Upload and subscribe in the desktop build, for each kind of file (wrestler, scene, entrance, move, belt, logo, arena, prop) and for packs (a whole world).
- [ ] A browser in the game for what is subscribed, a check on every file (`E.lookClean` is the pattern), versions so old files open, and a report button for a file that breaks rule 3.

### 0x. The paper look built out in Blender (later; Ryan, 18 October)

The desk image (`docs/mockups/paper/desk.png`) is the art style: the whole game looks made from construction paper. Pages are built to it now in CSS and canvas.
- [ ] Render the interface pieces in Blender as cut card (window frames and title bars, buttons in each colour, tags, group tabs, the menu bar, the control strip tiles and keys) so the paper has real thickness, light and shadow, and use them in the game as 9-slice images or baked textures.
- [ ] Every page moved to the paper look, one at a time with Ryan's go-ahead.

### 0v2. The scrapbook zine is the core look (Ryan, 19 October: "C is the winner")

- [x] Three concepts for a hand-made match page: A the workbench, B the cardboard box, C the scrapbook zine (`tools/creator/craft-kit.py`, `app/styles/looks/`).
- [x] C in every build (`app/styles/craft.css`, `app/ui/craft/`), with readable running text, option tiles as paper scraps that lift when pointed at, page headings on paper labels, the picked line as a highlighter stroke. Rule 2a rewritten.
- [ ] Page by page, with Ryan's go-ahead for each: pop-ups, the desk, Backstage, Storylines, Roster, Web, Company, Manage, Career, the title screen and the World Editor, each checked for readability; the Polaroid and the pins as Blender renders for more depth.

### 0w. Every page in the paper look (Ryan, 19 October: "the DOS days are over")

- [x] The shared look over every page: windows, group boxes, buttons and tiles cut from card in Blender (`tools/creator/ui-pieces.py`), the white menu bar, the navy desktop with grain, the control strip and the yellow SPACE key, paper pop-ups, lists, tags and fields (`app/styles/theme.css`).
- [x] The DOS face is gone: Inter (EWF Sans) in three weights, with the layouts kept in shape (`--ch`).
- [x] Buttons say one or two words, with a tip for the rest on hover, focus or a long press (`Btn tip`, `shell/Tip.tsx`). Booking's top row is done; the other pages follow as each is redone.
- [x] The broadcast as television: the picture in a set with a chyron and the bug, captions under it, tonight's order as a rail, a live feed of posts with the crowd meter at the right, and a TV pace that runs a two-hour show in about two minutes.
- [ ] Page by page, with Ryan's go-ahead for each: the desk (a paper map, the characters on it), Backstage, Storylines, Roster, Web, Company, Manage, Career; the characters and scenes on each page (posts, pictures on the web sites, faces on the lists).

### 0u. Every booking choice is a scene (Ryan, 19 October: the core mechanic; next after 0v, 0z and Create a Wrestler)

- [x] Every promo and angle kind a player can book (`SEGK` in `src/93-segments.js`) has a scene of its own (`SEG_SCENES` and `SEG_WHEN` in `kit/scene.ts`, `when: 'seg_<kind>'`), cast from the people booked into it; Create a Scene lists them as The scenes of the show. The writers' pick plays whatever the writers wrote.
- [x] Storyline beats each with a scene: every angle the story director writes says its beat and who is in it (`beat`, `bids`; `BEATS` and `beatTag()` in `src/20-story.js`), and plays `beat_<beat>` (`BEAT_SCENES` in `kit/scene.ts`: words, mind games, the parking lot, a brawl, the partner pays, the signing, the video, the stakes, a betrayal, through the table, the handshake swerve, the match made, one last face-off, the mystery, its clue and its reveal, the return, a new group and one thrown out of it), or the booked kind's scene where it is the same moment. Create a Scene lists them with the scenes of the show; `app/tests/scene.js` fails if a beat has none.
- [x] The beats that are matches: a debut plays at the newcomer's entrance (after the teasers, the surprise attack, or a plain debut; `seg.debut`), and a match that closes a chapter or ends a story plays that beat after the bell (`seg.story`: Not over yet, The story ends).
- [ ] Still to give scenes: invasions and the company arcs' chapters (these reach the desk as matters and calls, and show the still pictures for now).
- [x] The broadcast plays the scene of each booked segment.
- [x] Booking a segment shows its scene on the run sheet, so the card reads as the scenes of the show: the window that books it draws the scene once the first person is picked, and the picked promo or angle beside the sheet shows it with its cast (`SegPic`, `segPick()` in `shared/moment.tsx`, the same pick the broadcast plays).
- [x] Feuds over several weeks: a scene for each beat (the spark, the words and brawls of each chapter, a twist or turn, the match being made, the payoff).
- [x] A check that fails when an angle or promo kind has no scene (`app/tests/scene.js`, through `EWF_DEBUG.segScenes()`); storyline beats join it as they get theirs.
- [x] The World Editor's story builder (Stories tab, Ryan 20 October): a world's own promos and angles (participants, the scene, what it does to a feud and to the two through `relBump()`, the report line), kept in the world package and booked and played in a game; the included ones can be changed for a world and put back.
- [ ] Then redo the build-a-match screen and the show on the air in the paper look on top of the scenes, one at a time with Ryan's go-ahead.

### 0y. The World Editor rebuilt on Create a Wrestler and Create a Scene (Ryan, 18 October)

- [ ] A wrestler's page in the World Editor opens on Create a Wrestler (the body, outfits, entrance, finishers), with the ring-sheet details (ratings, contract, gimmick) beside it, instead of the old face panel.
- [ ] The Scenes tab and Create a Scene sit beside it as the editor's other main tool; worlds are made of wrestlers and scenes first.
- [ ] Then the rest of the editor (companies, shows, belts, teams) in the same paper look, one at a time with Ryan's go-ahead.
- [ ] The Roster page and Free agents in the game follow the same rule: the list on the left, the wrestler drawn full length in the middle at all times, the details on the right, as the World Editor's Wrestlers page (rule 5c).

- [x] Create a Belt (Ryan, 20 October): a belt for every title, built from parts in one pop-up (plate, metal, strap, gem, side plates, trim, words), from the World Editor and from your own title in a game; every title in the parody world has its own design, and a belt in a scene is the real one.
- [x] The logo creator has six lettering faces (Ryan, 20 October).
- [x] One look for every World Editor page (Ryan, 20 October): the same menu bar, note strip and bottom strip on every tab and on the list of worlds; Create a Wrestler and Create a Scene wear the same bar.
- [x] More dropdown menus than buttons on World Editor pages (Ryan, 20 October): the creators' choices in words, which part of a page shows, faces, poses, outfits, moves and entrances.
- [x] The characters polished (Bill, 22 October, after three rounds of concepts): no ears; eyes with an iris, a catch of light and a lash line; brows and a resting face from the gimmick (friendly, stern, grinning, sad, cocky, fierce); a raised paper nose; lips; a pointed hairline, a crescent of shine on the hair, long hair as one curtain behind the far shoulder; beards a shade darker than the hair with torn tufts, stubble that follows the jaw; a little bigger head, mitten hands, heavier wrestlers fill out; a cream cut-out edge round every figure. Create a Player choices for all of it: eye colour, classic dot eyes, cheeks (none unless picked), the face at rest, hair shine. Every EWE and WWC wrestler checked, and the seventeen legends with no look given one.
- [x] Stock scenes move in at least four keyframes, with a wind-up at the start and an overshoot and settle at the end (Ryan, 20 October: "scenes should average 4 keys").
- [x] 3D sets for a steel cage, the cell with a roof, an inferno, ringside on the floor, a ballroom, a gym and a stadium; 3D rooms for the entrance stage, the backstage wall, the parking lot, a talk show, a news desk and the rafters; chairs, tables, ladders, steps, bins and bats as 3D models.
- [x] A ladder match set (the belt hung over the ring), and 3D catering, trainer's room and weight room; the Titles page shows each title's belt.

### 0z. Create a Scene, built out (later; Ryan, 18 October: "the bones are there and work")

- [x] Zoomed out, the front of the ring runs too long and does not look right: the apron is lower, the barricade and stands closer, the barricade lower with a padded top.
- [x] The people do not read as 2D paper figures in the 3D view: each wrestler now has a cream cut-card margin, and stays flat and clean (no shadow or shading on them; Ryan, 19 October), while still throwing a shadow on the set.
- [x] Starting a scene, choose the set and setup (the New tab: the ring, the commentary desk, the ramp, the hallway, the locker room, the office, a talk show, plain card).
- [ ] It should do a lot more over time: the toolkit in `docs/plans/papercraft-engine.md` (light and effects, more sets, props and clothes, tall and square frames).

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
- [x] Not in the editor yet: brands, sponsors, columnists, announcers and staff names, the name lists for rookies, managers tied to wrestlers. (In the editor by 20 October.)
- [x] Bulk tools: duplicate a wrestler, move several at once, sort the list by name or company. (In the editor by 20 October.)
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
  - [x] The player can still cancel one of their own shows. Ryan to say whether that goes too. (22 October: the network can cancel it; the player cannot quit it.)
  - [x] Years on the air are worked out from a company's size. The World Editor should let a world set them, and name its own networks. Done 20 October: the World tab's name lists (small, cable, major) and each show's Network and Years on air on the Shows tab.
  - [x] This is the first part of section 5 (TV deals). Still to come there: money by the hour, tastes, ratings targets, streaming, a rival's night. (16 October: tastes and ratings targets, `src/89-networks.js`; streaming, `src/89-streaming.js`; a rival's night and the network's offer to move, `src/88-nights.js`. Money by the hour was left: the deal's rate already scales with the network and the show's standing.)
- [x] Measured over 32 weeks on three seeds: an extra show moved weekly profit between -$100K and +$214K and popularity by 0 to +1.6. It is a real choice, not free money.
- [x] Big events (the monthly pay-per-view) cannot be added or renamed in a game yet. That belongs with the year planner in task 6. (Done 15 October: P.events per company, the Year planner renames them, src/42-events.js.)
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
- [x] Rumours that turn out wrong, rival backstage drama, "on this day", and the scrum after a big event (task 8, `NEXT.md` job 9). (Done 15 October: false thin rumours that get corrected, on this day for titles, feuds and matches, rival fallings-out in the backstage column, and the press scrum, EVR.scrum.)

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
- [x] The show's own score, and what the crowd expects, are still percentages. (Done: a show is a letter grade and a word, rule 8c; what a crowd expects is words on the ladder.)

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
    - [x] "Suggest a card" does not yet put the face of the company in the main event by itself. (Done: `E.suggest` in `src/99-fog.js` moves the face into the main event.)
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
- [x] Open question for Ryan: the Assistant panel on the Career page describes a helper who books and runs the small shows. With its two buttons gone it does nothing on screen. Remove it, or keep it for a later fast mode?

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

- [x] Before a show is booked the player picks the town and then the building, with several buildings in each town: size, rent, the kind of crowd, how the company has drawn there before. This is section 4 ("Arena pick, gate report, popularity per city"), made a step that every show has. It is a task on the desk, answered in a pop-up. (Done another way, 16 October check: the road, `src/91-road.js`. Each company tours a loop of cities on its own map, the building is booked from the market before the card, the schedule shows every stop ahead, tickets sell ahead. Ryan to say if he still wants to pick the building by hand.)
- [x] Too big a building looks empty on television and costs rent. Too small leaves money at the door but looks hot. The agent gives a read, not a forecast (fog of war). (Done another way, 16 October check: the road, `src/91-road.js`. Each company tours a loop of cities on its own map, the building is booked from the market before the card, the schedule shows every stop ahead, tickets sell ahead. Ryan to say if he still wants to pick the building by hand.)

**The year's schedule**

- [x] A one-year schedule built around the country the company is based in: where the weekly shows go, the loop of towns, the big events and their buildings, the breaks. Realistic for that country (distances, seasons, holidays, the big buildings). This grows out of section 6 ("Event calendar"). (Done another way, 16 October check: the road, `src/91-road.js`. Each company tours a loop of cities on its own map, the building is booked from the market before the card, the schedule shows every stop ahead, tickets sell ahead. Ryan to say if he still wants to pick the building by hand.)
- [x] Special events in other countries at special venues, each with its own risks and rewards: a bigger gate and a new audience against travel cost, tired wrestlers, an unfamiliar crowd, weather for an outdoor show, a time zone that hurts the television number at home. (Done another way, 16 October check: the road, `src/91-road.js`. Each company tours a loop of cities on its own map, the building is booked from the market before the card, the schedule shows every stop ahead, tickets sell ahead. Ryan to say if he still wants to pick the building by hand.)
- [x] Needs first: popularity by city (section 4), the country of each company in the world file, and a list of buildings by country under invented or public-domain names. (Done another way, 16 October check: the road, `src/91-road.js`. Each company tours a loop of cities on its own map, the building is booked from the market before the card, the schedule shows every stop ahead, tickets sell ahead. Ryan to say if he still wants to pick the building by hand.)

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

- [ ] A storyline template: a name, who it needs (roles such as leader, defector, rival, champion), a cost in booking power, three to six beats spread over weeks, what each beat needs on a show (a match, a promo, a run-in, a title change), a payoff, and how it can backfire. (Partly, 15 October: Ryan chose living storylines over templates on 15 October; see NEXT.md job 4.)
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

- [x] Cities with a popularity score per federation; good shows raise it, bad shows lower it, absence fades it, overexposure shrinks the gain. Rivals have their own scores. (Done 15 October: markets, S.mkt in src/91-road.js.)
- [ ] Before a show: pick the city, then a building (capacity, rent, crowd type), with an attendance forecast as a range.
- [ ] Gate report pop-up after the show: tickets against capacity, why it drew, gate minus rent, the city's score before and after. (Partly, 15 October: After the show has The gate and the market moving; no rent.)
- [ ] Sellout streaks, bigger buildings unlocking, crowd heat feeding match ratings, seasonal weather.
- [x] A city list on Company with trend and weeks since the last visit. (Done 15 October: Company, Overview, Your cities, E.cities.)
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

- [ ] A year planner: schedule events by type (flagship, arena, ballroom, gimmick night, battle royal, tournament). The flagship has an original name per promotion. (Partly, 15 October: twelve monthly events, each with a kind, renamed or left dark, E.evSet.)
- [ ] Weekly promotion spend on this month's event, next month's and the flagship; a hype meter per event; a buy rate report after each. (Partly, 15 October: one weekly spend on the next big night builds its hype, E.evSpend.)
- [x] Sponsors with tiers, their own boosts and an ongoing goal; tier-up pop-ups, unhappy warnings, conflicts between sponsors. Today sponsors are flat deals with one condition (`src/50-company.js`). (Done 15 October in part: local, regional and national tiers; national pays most and lifts every show. `SP_TIER` in src/50-company.js.)

### 7. The tycoon layer
- [ ] A world ranking of every wrestler across all promotions and free agents: a yearly top 500 and a weekly top ten. `E.power` in `src/90-api.js` is the seed of it.
- [x] Level-up pop-ups after a show for wrestlers who improved, saying what went up. (Done 15 October: Who grew on After the show, with the match that did it.)
- [ ] Yearly awards across the world (the engine has awards and a hall of fame for the player's company).
- [x] Momentum should matter more, and say so (fan wish list). (Done 15 October: run sheet flags On a roll and Cold streak, and the crowd weighs momentum more.)

### 8. All-federation dirt sheet and dynamic events
Feature list item 9.

- [x] A dirt sheet page: lead story, a section per federation, rumours with a reliability level, business news, match of the week, next week, and a review of the player's booking. It lives in the Net section (see 0c).
- [x] Rival backstage drama, "on this day", media scrums after big events. (Done 15 October: see the dirt sheet box above.)
- [ ] Dynamic events of four kinds, on top of the inbox events in `src/40-week.js`.
- [x] History-moment events under original names: the player is put in a famous situation and makes the call. Examples of patterns: a champion is leaving and will not lose the title on the way out; a wrestler shows up on a rival's show with your belt; a live microphone goes off script; a faction's contract talks collapse the night before the big event. (Done 15 October: src/83-moments.js, ten moments with follow-ups.)

### 9. Free agents and the indie scene
- [ ] Indies as mini federations with their own small systems. They open and close over time.
- [ ] A free agent can work for any number of indies.
- [ ] An indie cannot book a signed wrestler on that wrestler's event nights, or at all if the home federation forbids outside dates (the corporate model does).
- [ ] The player does not compete with indies. Rarely, one grows into a real federation.

### 10. Locker-room and long-term items
From the table in `docs/feature-list.md`. Check each against the engine first; several exist in part.

- [ ] Career goals per wrestler; inner circle roles with political weight; canvas the locker room before a signing. (Partly, 15 October: career goals are built, src/87-goals.js; no political weight or canvassing.)
- [ ] Team bonding, interventions and call-outs (extend the backstage actions in `src/77-backstage.js`).
- [ ] Promoter friendliness per rival owner; cash in talent trades; joint super shows with shared money.
- [ ] Owner goals with visible progress; headquarters and hall of fame building projects; wrestling school affiliations.
- [ ] Custom house styles; per-title statistics. (Partly, 15 October: per-title records on Titles, most reigns, longest reign and most defences.)
- [ ] Rivals competing for time slots, cities and talent (finishes feature list item 8).

### 11. Balance and known problems
- [x] **The underdog is too hard.** (0.73: the mutiny meeting now settles the room; see docs/balance-0.73.txt) Playing the underdog company on autopilot, owner trust fell until the booker was fired around week 73. Suggested cards score about 1 to 1.5 points under the crowd's expectation there.
- [x] **Big companies bank too much.** (0.73: the giant goes 110M to 120M in 100 weeks) The corporate giant went from $110M to about $400M in 80 weeks against a planned $1.5M a week.
- [ ] **The startup is too easy once it gets a better slot** (about +$470K a week), and bleeds as intended while it does not (about -$340K a week).
- [ ] Watch roster churn among rivals after 100+ weeks (releases and signings by fit are new).
- [ ] The first-day screens grew; keep them readable (design goal: easy to read and quick to do).

### 12. Not tested or not decided
- [ ] The Steam wrapper in `desktop/` has been launched in Electron 33 (`tools/desktop-smoke.js`, 13 October: title screen, bridge, no errors). The Steam calls have never run against the Steam client.
- [ ] TV and gamepad input were tested with simulated keys only, never on hardware.
- [x] Portraits: Ryan decided to keep the code-drawn faces.
- [x] The built-in world is named The EWF World (Ryan's decision).

### 13. Later: the corkboard (Bill, 21 October: "add that for later on on tasks, not a top one")

The relationship web as a board of Polaroids and string, built by itself on the Storylines page from the feuds that are running. Concept image: project file `killer-features/corkboard-concept.png`. Plan: `docs/plans/corkboard.md`. Not before the work above it.

- [ ] A weekly snapshot of the bond for every pair worth a string, so the board can say what moved and for how long.
- [ ] The board on Storylines: a string for each live feud (thickness for heat, fraying for freshness), with partners, stable mates, managers, the champion and the arc's cast pulled in; a finished feud stays as a faint ember.
- [ ] Positions placed once by seed, cliques together, moved only when someone joins or leaves; about 20 people at most, and a focus mode for one person.
- [ ] The Backstage switch: real feelings from the relationship matrix laid over the on-screen strings, with jealousy as an arrow and known secrets as folded notes.

### 14. Later: careers and the long game (Bill, 21 October: "I like ideas 1-5 add those to long term planning")

Thirteen features from the genre research (career, sports management, dynasty, grand strategy, 4X and simulation games). Free agency week was dropped (wrestling has none), and so were power blocs. Plan: `docs/plans/careers-and-long-game.md`. Not before the balance and first-hour work above (Bill paused new features until then).

- [ ] Wrestler career mode, "Road to the Main Event": play one wrestler in the living world while that company's AI booker books you; the asks at Your office become your moves (L).
- [ ] One life in wrestling: the same save goes on from wrestler to manager, commentator or agent, then booker, then owner, and on to the student you trained (M, after the career mode).
- [ ] The owner's five-year vision: goals for each company model in the welcome letter, a checkpoint each wrestling year after the flagship, trust that follows the plan (M).
- [ ] The recruiting pitch: every free agent wants three things and may have a dealbreaker; the Offer window says in words how well you offer each; rivals pitch too (M).
- [ ] The path to the Hall: a career line and a line in words on every file ("Building a case", "On the path", "A lock"), feeding the Hall of Fame night and the magazine (S).
- [ ] Wrestling families: second- and third-generation wrestlers in the rookie class, the family name as an early lift and early pressure, a family tree on the file, dynasties the Net and the magazine follow (M).
- [ ] Coalitions: grow too fast (raids, markets, signings) and rival owners band together, sharing talent and booking against your big nights until it cools; you can join one against a rival too (M).
- [ ] Company mission trees: each of the nine models gets a tree of goals that take years, each one finished opening the next and leaving a lasting bonus; rivals follow theirs too (M).
- [ ] The territory map: a world map where each region is coloured by the company most popular there right now, striped where two are close; needs markets for rival companies first (M to L).
- [ ] Rival owners with agendas: each owner has an agenda the world knows and a hidden one found out through the press, sources and people who leave; both decide how they treat you (S to M).
- [ ] Rival plans: each month the office hears of two or three moves rivals are preparing (a raid, a show on your big night, a bid, a tour into your region); stop one with booking power or a source, the rest happen (M).
- [ ] Trends: world fads for a year or two (a hardcore craze, a high-flying boom, a tag-team revival); the first to ride one gets the most, and the Net and the magazine hint at the next one (S to M).
- [ ] World firsts: firsts only one company in the world can claim (stadium show, national TV deal, million-dollar gate), with a glowing celebration pop-up like Civilization's when you claim one, reusable for other big good moments (S to M).

## After each task

1. `node build.js`
2. `node test-uni.js universes/public_domain.json 60` (no errors, NaN 0 on every line)
3. The browser tests for the sections touched, then `app/tests/journey.js`
4. Tick the boxes here, commit, push.
5. If the live page is being updated: read the live version first and merge anything the other thread changed.
