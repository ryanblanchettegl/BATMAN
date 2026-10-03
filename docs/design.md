# EWF 9000: design

The fixed target for the interface rebuild. Change this file first, then the code.

## 1. The game in one paragraph

Elite Wrestling Federation 9000 is a wrestling booking sim in the Extreme Warfare tradition. You are the booker. You build cards; the odds decide who wins, unless you spend booking power granted by the owner to call a finish. Shows play out as a broadcast you click through. Everything else (locker room, money, rivals, history) exists to make next week's card a harder and more interesting decision. Earn enough trust and you own the company.

## 2. Pillars

1. **The card is the game.** Every system must change what you want to book.
2. **Odds, not orders.** Outcomes are simulated. Control is a scarce resource.
3. **A show feels like a show.** Title card, commentary, a result you did not fully choose.
4. **Depth you can read.** Every number has a reason the player can see.
5. **One game on every screen.** Couch, desk, tablet, handheld and phone play the same save.

## 3. Screen map

Start flow: Boot, Title, Select promotion, First day (or Create a federation).

Six sections, each with a row of page buttons. Nothing lives outside this map.

| Section | Pages | What you do there |
|---|---|---|
| Office | The desk, Career | The hub. Opens on "Before the show": the next show, Book the next show, action points and the backstage rooms. Then the inbox, the week, what needs attention, clocks and news |
| Booking | Card, Broadcast, Report | Build the card, make the calls, watch it, read the fallout |
| Roster | Roster, Locker room, Titles, Free agents | Everything about talent: who you have, how they feel, what they hold, who you could sign |
| Stories | Storylines, History, The Net | What your booking set in motion, what it added up to, what the fans say |
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
| Phone | 640px wide or less | 19px | One column |
| Tablet | Touch, wider than a phone | 21 to 30px | Two columns in landscape |
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
- **Tests.** Seeded sims catch engine faults. Browser runs cover each section on phone, tablet, desk and TV, driven by mouse and by arrow keys.

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
