# EWF Wrestling Manager: design

The fixed target for the interface rebuild. Change this file first, then the code.

## 1. The game in one paragraph

Elite Wrestling Federation Wrestling Manager is a wrestling booking sim in the Extreme Warfare tradition. You are the booker. You build cards; the odds decide who wins, unless you spend booking power granted by the owner to call a finish. Shows play out as a broadcast you click through. Everything else (locker room, money, rivals, history) exists to make next week's card a harder and more interesting decision. Earn enough trust and you own the company.

## 2. Pillars

1. **The card is the game.** Every system must change what you want to book.
2. **Odds, not orders.** Outcomes are simulated. Control is a scarce resource.
3. **A show feels like a show.** Title card, commentary, a result you did not fully choose.
4. **Depth you can read.** Every number has a reason the player can see.
5. **One game on every wide screen.** Couch, desk, tablet and handheld play the same save. There is no phone or portrait layout.
6. **No clean stopping point.** Office, Booking and the Show each hand the next one something unresolved. See section 2a.

## 2a. The loop: one more turn

Ryan, 4 October 2026, in his words. This is the philosophy the game is built to from here on.

> Hitting that "one more turn" addiction requires ensuring every single phase of the Office-Book-Show loop feeds directly into the next with unresolved tension, meaning the player never feels like they are at a clean stopping point.
>
> During the Office phase, the Dirt Sheets and relationship matrices can do the heavy lifting to create immediate hooks. Inject urgent, time-sensitive dilemmas right when the player hits the new week—a star threatening to jump ship to your IPO-funded rival, a sudden travel issue, or a sponsor demanding a specific demographic push. If the player opens their dashboard to a fire they have to put out, they are instantly engaged before they even look at the roster.
>
> The Booking phase thrives when it acts as a risk/reward puzzle rather than a simple drag-and-drop chore. Make chemistry, morale, and fatigue tangible constraints so players are constantly agonizing over the perfect card. They should have to weigh the risk of pushing an exhausted champion for a guaranteed television rating against the long-term benefit of giving a rookie a trial-by-fire in the main event.
>
> The Show phase is the payout, but it is also the prime opportunity to set the hook for the next turn. Trigger unexpected, organic consequences as the results roll in. Instead of just seeing a "B+" match grade, the player might see that a promo went wildly off-script, two wrestlers developed massive real-life heat after a stiff clothesline, or a mid-card act suddenly spiked the ratings. By ending the Show phase not with a clean slate, but with a brand-new problem or opportunity for the next week, the player is compelled to jump right back into the Office phase to address it.

What it means for anything new:

- **Office opens on a fire.** A new week starts with something urgent that has a deadline, drawn from the dirt sheet and from how people feel about each other and about the booker. It is on the desk before the roster is.
- **Booking is a risk and reward puzzle.** Chemistry, morale and fatigue are limits the player can see and has to weigh. The safe card and the card that builds the future are not the same card.
- **The Show pays out and sets the next hook.** A result is never only a grade. Something happens that nobody booked, and the night ends on a new problem or a new chance that sends the player back to the Office.
- **Every phase hands the next one something unresolved.** A feature that ends a phase on a clean slate is not finished.

Where the game stands against it, at version 0.31:

| Phase | In the game now | Still missing |
| --- | --- | --- |
| Office | The week opens with events that need an answer (the owner's directives, a rival's offer to one of your stars, the network asking for a meeting, the locker room meeting without you), this week's tasks, the pressure clocks and the notification bar. | The fire is not always the first thing on the desk, and it rarely comes from last night's show. The dirt sheet sits in Net, not on the desk. No sponsor asking for a kind of show. No travel problem at the start of the week (only before the bell). |
| Booking | Time is the budget. Fog of war: the road agent says what can be seen (worn down, running on fumes, a squash) and the rest is learned by running it. Wear, morale and effort change how a match goes, and the staff notes argue with the card. | Fatigue, morale and chemistry are not on every line of the run sheet. Nothing yet sets a tired champion against a rookie's chance as one clear trade. The five goals for every show are not built. |
| Show | The show is live and cannot be left. A segment can be skipped to its result, a call never can, and the yellow button at the top right is the only way forward. Twelve kinds of call from the gorilla position, each caused by the night: titles, rivals, a promo off the script, somebody hurt, a quiet crowd, a match going long, the owner, the network, a sponsor, who the shows are built around. People remember every answer. The report says what was learned and what was called. | From 0.30 the night ends on the desk: injuries, the locker room, the gate, television, the writers and the dirt sheet, each a line that opens a pop-up. From 0.31 about one show in four also leaves a named matter that has to be answered before the week ends. Not yet every show. A mid-card act catching fire is not yet called out as it happens. |

## 2b. The first year teaches the game

Ryan, 4 October 2026, for the road map. Every new game should feel free. But some actions are required early, so that every mechanic is used and is explained through play, not through a manual. Some of these happen in every playthrough at a fixed point. Some are dynamic and come from the state of the game.

His first three, all fixed: after the first show, the player has to pick a sponsor. Before the first pay-per-view, the player has to name the face of the company. The week before the third pay-per-view, the owner wants an authority figure added to a show, and that becomes a required addition.

A required action is a task on the desk that cannot be waved off. It names the mechanic it teaches in a line or two, the first time only. The list and its state are in `TASKS.md`, section 0h.

## 2c. After the show, back to the desk

Ryan, 4 October 2026, for the road map. A show does not end on its report. When the report is closed the player is back at the Office desk, with whatever the night left behind waiting there: new events and decisions first, and in time always something to read or settle. The dirt sheets on last night. Injuries. What the writers thought. How relationships changed. Tickets sold against tickets available. Streaming numbers by demographic. Each is a line on the desk that opens a pop-up, so the player can do all of it without leaving the Office.

Pop-ups are how the game shows more while every page stays one screen. The first is picking commentators from the desk. The aim is that every action, required or not, can be done from the Office.

## 2d. Where a show is held

Ryan, 4 October 2026, for the road map, not to be built yet. Before every show the player picks a venue, with several to choose from in each town. Later the game lays out a realistic one-year schedule around the country the company is based in. Special events can be booked in other countries at special venues, and each has its own risks and rewards. The list of work is in `TASKS.md`, section 0i.

## 2e. Shows last

Ryan, 4 October 2026. A weekly show is not a thing a company opens and shuts. It stays on the air for years, and the years are part of what it is worth. It gains prestige the longer it runs and as its audience grows. It does not end: now and then it changes network. New shows and new belts are rare because each needs an occasion, not because a rule locks them in the first years. The model is how companies work today.

## 3. Screen map

Start flow: Boot, Title, Select promotion, First day (or Create a federation).

Seven sections, each with a row of page buttons. Nothing lives outside this map.

Around every page: the menu bar at the top, with the yellow **ADVANCE button** laid over its right end (big, one or two words, always the next thing the week needs; the space bar presses it), and the notification bar under it. At the bottom, the status line, with Options, Help and Music at its right end. When tasks are in the way the button says Attention and leads to the desk, which is the one place tasks are listed.

| Section | Pages | What you do there |
|---|---|---|
| Office | The desk, Career | The hub. Opens on "Before the show": the next show, Book the next show, this week's tasks, action points and the backstage rooms. Then the inbox, the week, what is worth knowing, clocks and news. A show cannot be booked and a week cannot end while a task is open; each task is done or left for another week |
| Booking | Card, Broadcast, Report | Build the card: matches, promos and angles on one run sheet, with each spot named (opener, semi-main, main event) and the running order read against the rules of a well-laid-out show. Make the calls, watch it, read the fallout. Matches and segments are rated in stars |
| Roster | Roster, Locker room, Titles, Free agents | Everything about talent: who you have, how they feel, what they hold, who you could sign |
| Stories | Storylines, History | What your booking set in motion and what it added up to |
| Net | Dirt sheet, The feed, The boards | Information only: the weekly sheet on every company, short posts from wrestlers, fans and the press, and the fan boards. All names invented |
| Manage | Operations, House, Deals | Every choice about the company: slot and settings, house style and rules, sponsors, rivals and trades |
| Company | Overview, Finances, World | Information only: cash, popularity and booking power, how the company is run, the money, the world |

Pop-up windows: help, options, scouting report, clock detail, week closed, universe import and export, the headset call, create a wrestler, the Jukebox. Profile pop-ups (wrestler, tag team, title history) open from any name and stack; Back steps out one at a time.

A wrestler profile is a panel with four pages: Overview, Contract, Locker room, Scouting and career.

Rules for adding a feature: it goes on an existing page, or it replaces something. A new page needs a reason this map cannot absorb.

## 4. Input

Four ways in, all first-class. Every control must work with each.

| Input | Select | Back | Sections |
|---|---|---|---|
| Mouse | Click | Close button, Esc | Click |
| Touch | Tap (targets 44px or taller) | Close button | Tap |
| Keyboard | Tab and Enter, hotkeys | Esc | O B R S M C |
| Remote or gamepad | Arrows or D-pad, OK or A | Back or B | LB and RB |

- Focus never disappears. After any action it stays where it was, or moves to the obvious next control.
- Back always does one thing: close the pop-up, else leave the profile or report, else go to the desk.
- Nothing depends on hover.
- Selects change with left and right on a remote. Text entry uses the device keyboard.

## 5. Screens

One layout, scaled by a single type size.

| Mode | When | Type size | Notes |
|---|---|---|---|
| Tablet | Touch, or a small landscape screen | 21 to 30px | Two columns in landscape |
| Desk | Mouse | 19 to 32px, grows with the window | Content capped at 59em |
| TV | TV browser, or chosen in Options | 1.9% of screen width | Fills the screen, 2.5% edge margin |

Options offers Screen (Auto, Desk, Tablet, TV) and Text size. One breakpoint (860px) switches two columns to one.

## 6. Art direction

Source: Ryan's concept art in `docs/concept-art/`.

- **A 1990s PC program.** Sixteen-colour palette: blue screen, grey bars, yellow headings, cyan labels, white values, green good, red bad, magenta warnings.
- **Type.** One monospace face (VT323, with system fallbacks). Headings are yellow, centred and wide-spaced.
- **Frame.** One grey menu bar on top, one grey status bar below. No decoration that is not information: no fake drive paths, memory or version read-outs in the game frame.
- **Panels.** Double-line boxes. Gauge panels centre their title inside the box.
- **Gauges and charts.** Segmented bars, text-mode pies, column charts and clock dials. Colour is never the only signal.
- **Pop-ups.** Grey DOS dialog with a drop shadow. The wrestler creator is the one Windows 95 window, as in the concept art.
- **Portraits.** Generated pixel faces, eight numbers each. Original faces only. Marquee public-domain names follow the books and the historical record, never a film.
- **Monitor effect.** Scanlines and a darkened edge, off in Options.
- **Boot and title.** Green loading sequence, then the yellow title card.

## 7. Systems

All of these live in the engine and are already built and tested.

| Area | Systems |
|---|---|
| Matches and shows | Match quality, crowd, finishes, odds, booking power, intensity, stipulations, battle royals, pre-show incidents, mid-match chaos, broadcast commentary |
| Stories | Feuds in four acts, storylets, angles, opening promo, tournaments, rankings, season saga |
| People | Full stat sheet, hidden stats and scouting, ageing and retirement, rookie classes, gimmicks, traits, teams, stables, managers, relationships |
| Locker room | Roles, ego grid, morale, stress and breaking points, body zones, medical staff, mentors, wrestlers' court |
| You | Booker level and skills, owner trust, directives, promises, becoming owner, difficulty |
| Company | Broadcast slot, production, risk, tickets, advertising, sponsors, training camp, house rules, finances |
| World | Rival promotions, fed against fed, trades, power rankings, the Net, news |
| Long game | Title histories, record book, awards, hall of fame, career logs, clocks, achievements |
| Data | Universe packages (schema v1), import, export, validation, the built-in EWF World |

Still to build: see `TASKS.md` and `docs/feature-list.md`.

## 8. Architecture

```
universes/*.json        data: rosters as packages
src/*.js  -> engine.js  simulation. No screen code. State is plain JSON. Seeded dice.
app/                    interface. Reads state, calls the engine API, draws.
tools/                  package builders
test*.js                headless sims.  app/tests: browser runs
```

- **The boundary.** The interface never changes game state directly. It calls `GP.*` and redraws.
- **Interface stack.** Preact components in TypeScript, bundled by esbuild into one file. One store holds the game state and the view state. Components are small files grouped by section.
- **Building blocks.** Panel, Button, Tabs, MenuList, Gauge, Meter, Table, Window, Dial, Pie, ColChart, Portrait, Tag, CheckLine, Banner. A screen is built only from these.
- **Saves.** One versioned JSON blob. A version bump comes with a migration.
- **Tests.** Seeded sims catch engine faults. Browser runs cover each section on desk, tablet and TV, driven by mouse and by arrow keys.

## 9. Rebuild order

1. Foundation: tooling, store, frame, building blocks, input.
2. A playable loop: start flow, the desk, booking, broadcast, report, end of week.
3. The remaining pages, section by section.
4. Parity tests on every screen mode, then swap the published game.
5. Resume the feature batches on the new interface.

## 10. Lessons kept

- Decide the screen map before adding screens.
- Design for the couch and the finger from the start; retrofitting input is expensive.
- One building block per job; a second panel style is clutter.
- Flavour text that looks like data reads as noise.
- The engine stays free of screen code, so the interface can change without touching balance.
- Real-world rosters ship only as player-made packages.
