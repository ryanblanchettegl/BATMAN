# EWF 9000: working notes for Claude Code

Elite Wrestling Federation 9000 is a text-based wrestling booking sim for Steam, drawn as a 1990s PC program. The owner is Ryan. `NEXT.md` is the work queue: ordered steps for the next unattended run. `TASKS.md` is the task list and holds his decisions; `TWEAKS.md` is 100 small jobs and `WISHLIST.md` is 100 depth ideas, each with its own "how to work this list"; `docs/feature-list.md` is the full feature wording; `docs/design.md` is the design document; `app/DEV.md` says how screens are written.

## Commands

```
cd app && npm ci && cd ..                           # once; installs the build tools. Skip `npm install` at the root: it pulls Electron for the Steam wrapper
node build.js                                       # src/*.js -> engine.js, app/ -> dist/index.html and dist/gorilla-position.html
cd app && node_modules/.bin/tsc --noEmit -p .       # type-check the interface
node test-uni.js universes/public_domain.json 60    # headless: 60 weeks of every promotion. Want errs 0 and NaN 0.
npm run check                                       # build, type-check and a 20-week sim in one go
npm run test:browser                                # every file in app/tests, one after another (needs NODE_PATH as below)
node test-models.js                                 # 60 weeks as each company model; checks what makes it that model
node test-wording.js                                # no dice wording anywhere in 60 weeks of text
node test-determinism.js                            # same seed twice gives identical state
node test-editor.js                                 # the World Editor's engine parts: build a world from nothing, check it, play it
node test-create.js                                 # shows and belts made during a game, and what rivals add each year
node test-segments.js                               # promos and angles the player books, the show clock, and how a show opens
node test-tasks.js                                  # this week's tasks, and how they hold a show and the week
node test-shape.js                                  # the running order rules, and stars instead of percentages
node test-relations.js                              # the relationship matrix, memories and the notification bar
node tools/build-public-domain.js                   # rebuild universes/public_domain.json after editing rosters
python3 tools/build-font.py                         # rebuild app/fonts/ewf-blocks.woff2 (needs fonttools, brotli)
```

Browser tests need Playwright with Chromium. Build first, then run from the repo root:

```
NODE_PATH=<dir containing playwright> node app/tests/<name>.js
```

`<name>` is one of `start`, `office`, `booking`, `roster`, `stories`, `company`, `cards`, `journey`, `linker`, `save`, `sweep`, `challenge`, `scenarios`, `editor`, `create`, `leaveout`, `segments`, `net`, `tasks`, `shape`, `relations`, `advance`. `journey.js` takes `MODES=desk,tablet,tv` and `WEEKS=5`. Each test prints its failures and exits non-zero if any. They are slow (one to five minutes each); run the ones for the section you touched, then `journey.js`.

## How the code is laid out

- `src/*.js`: the simulation. Plain ES5 in one shared closure, concatenated in file-name order by `build.js`. No screen code. State `S` is plain JSON and is the save file. A seeded generator (`rnd(S)`) makes every game repeatable. Systems plug in through hook lists declared at the top of `src/10-match.js` (`MQX`, `CRX`, `FINX`, `EFX`, `POST`, `SHOWX`, `WEEKX`, `NEWX`, `PREX`, `TASKX`).
- `src/66-relations.js`: the relationship matrix (`S.rm`) and what people remember (`S.rmY` for what they remember about the booker). It is the one place that says how two people feel about each other. Change it only through `relBump()` and `youRemember()`; read it with `relOf()`, `bondOf()`, `respOf()`, `jealOf()`. It never calls `rnd(S)`. `note(S, heading, line, kind)` puts a line on the notification bar. `docs/plans/gorilla-position.md` is the plan this belongs to.
- `src/78-models.js`: the nine company models. Each is data plus small functions for match quality, crowd, finishes, pushes, hiring fit and the suggested card.
- `app/src/`: the interface in Preact and TypeScript. `store.ts` holds the game and view state, `nav.ts` the screen map, `input.ts` screen modes and remote or gamepad focus, `kit/` the building blocks, `screens/<section>/` one folder per section, `shared/` pieces used by more than one section.
- `src/86-editor.js` and `app/src/screens/editor/`: the World Editor, opened from the title screen. It edits a universe package (plain JSON kept with the player's other worlds), never a running game. Every change goes through an `E.ed*` function so it can be tested headless.
- `src/87-create.js` and `app/src/screens/manage/Create.tsx`: belts and weekly shows made during a game. A new show scales the company's overheads the way `calibrateCosts()` did for the shows it started with, and copies the main show's crowd expectations.
- `src/92-shape.js` and `app/src/screens/booking/Shape.tsx`: the running order. Where a match sits on the card changes how it lands (opener, back-to-back, main event, finishes across the night). `E.shape(S, card)` reads a card before the show; `shapeAuto()` lays out automatic cards by the same rules.
- `src/93-segments.js` and `app/src/screens/booking/Segments.tsx`: promos and angles the player books on the run sheet. There is no fixed number of them. Each is short, medium or long (5, 10 or 15 minutes). The kind `writers` hands that time to the writers (`genAngle`); the writers add nothing on their own.
- `src/97-time.js`: time is the budget. A show is two hours of weekly television or three of big event, and the run sheet has to fill it (`E.clock(S)`, `E.matchMins()`, `E.fitShow()`). More than five minutes over, or more than ten empty, and the show cannot run. The first thing on the sheet opens the show, and each way of opening pays in its own way; whatever is on the air at the top of each hour is judged against what the crowd expects. `E.suggest(S)` returns a whole show that fits, and sets the promos and angles as it goes. Anything that books without a person must call `E.fitShow(S, card)` after changing a card. Only the player's shows are on the clock.
- `src/94-net.js` and `app/src/screens/net/`: the Net section (dirt sheet, the feed, the boards). It reads the game and never uses `rnd(S)`; lines are picked with `h01()`, so a post can never change how a game plays out.
- `src/95-tasks.js` and `app/src/screens/office/Tasks.tsx`: this week's tasks on the desk. The engine lists them and answers `E.taskGate(S, 'book' | 'show' | 'week')`; the screens do the stopping, so headless games never wait. A new thing the player should fill in each week gets a task: push a function onto `TASKX`.
- `src/96-advance.js` and `app/src/shell/Advance.tsx`: the ADVANCE button (laid over the right end of the menu bar, yellow, one or two words). `E.advance(S)` says what the week needs next and only reads the game; the screen draws it and presses the right thing. When tasks are in the way it says Attention and leads to the desk. `E.comingUp(S)` is the desk's countdown line. A new step in the week, or a new countdown, goes there. `docs/plans/advance-button.md` says why it is built this way.
- `app/addons/*.js`: self-contained scripts appended to the page as they are (the soundtrack).
- `universes/public_domain.json`: the default world, generated by `tools/build-public-domain.js` plus `tools/pd-extra.js`.
- `legacy/`: the old interface. Nothing builds it.

## Rules

1. **The engine owns the game.** A screen never writes to `S`. It calls `E.something(S, ...)` inside `act()` and redraws.
2. **Zero external assets.** No hosted images, fonts, scripts or styles. Borders, bevels and scanlines are CSS; charts and room art are text; portraits are drawn on a canvas by code; the fonts are embedded as base64.
3. **Original content only.** Models and storylines may follow how real companies and angles worked. Game content never names a real promotion, wrestler, stable, title or event. The default universe is public domain: people who died before 1926, myth and folklore, or fiction published before 1929 by an author who died before 1955. No figures still honoured in a living religion. No real-world rosters in this repository.
4. **No dice wording.** Checks are "attempts" with a percentage chance and a list of what helps and what hurts.
5. **Four inputs.** Every control is a real button, select or input, reachable by mouse, touch, keyboard and remote or gamepad. Nothing depends on hover. Give each control a `data-t` name; the tests find controls that way.
5. (continued) **No phone, no portrait.** The game is for a wide screen: desk, tablet and TV. There is no phone layout and no phone test run. A tall narrow window shows one line asking for a wide one. Do not add narrow-screen layout rules.
5a. **Where things sit.** Top: the menu bar, unchanged in height and look, with the yellow ADVANCE button laid over its right end, and the notification bar under it. Bottom: the status line only, with Options, Help and Music at its right end. Tasks live on the desk, nowhere else. Nothing else goes in those bars.
6. **Seven sections:** Office (the desk, Career), Booking, Roster (Roster, Locker room, Titles, Free agents), Stories (Storylines, History), Net (Dirt sheet, The feed, The boards), Manage (Operations, House, Deals), Company (Overview, Finances, World). Net is information only, like Company. Manage holds every choice; Company is information only; the desk opens on "Before the show".
7. **Readable first.** Ryan's design goal is the pull of "one more turn" with screens that are easy to read and quick to act on. Every action shows its result at once. Prefer a pop-up or a short note to another panel.
8. **Plain writing in the game and in docs.** Short sentences, no jargon, no em dashes in new text.
8a. **Stars, not percentages.** How good a match, promo or angle was is shown as stars (`stars()` in the kit, `starG()` in the engine), never as a number. A target about a match is worded in stars and checked with `starMeets()`. Chances stay percentages (rule 4). The show's own score is still a percentage.
8c. **Words for a show.** What a crowd expects is never shown as a number. It is said on the ladder in `src/98-words.js` (a bomb, a dud, flat, decent, solid, strong, hot, red hot, blow-away, all-time classic): `E.expectWords(S)`, `E.showWord(v)`. How a show did against its crowd is `E.showVerdict(rating, exp)`: a headline ("Blew the roof off", "Came up short") and one line. New text about a show uses these, not a made-up phrase.
8b. **Money:** short form (`cash()`, `$1.2M`) in tables and lists; full form (`full()`, `$1,200,000`) for a single headline figure.
9. **Saves:** the save is `S` under the key `ewf9000-save-4`. A change that breaks old saves needs a version bump and a migration.
9a. **One step at a time.** Do one step, show Ryan the result, and wait for his go-ahead before the next. Do not run batches side by side.
9b. **Relationships are the centre.** A new decision or event says what it does to the people involved through `relBump()` and `youRemember()`, so they remember it and the notification bar reports it.
10. **Commits:** small, with a message that says what changed for the player. Tick the boxes in `TASKS.md` in the same commit.

## The live page

Ryan plays a published copy of `dist/gorilla-position.html` (a Claude artifact). A second conversation of his also publishes to it, so whoever publishes must read the live version first and merge its changes. If you cannot publish from where you are, say so and leave the build in `dist/`; do not treat publishing as part of finishing a task.

## Things that bite

- `build.js` must run before any test; the tests open `dist/index.html` and `engine.js`.
- `calibrate()` in `src/00-core.js` runs sample shows for every promotion at the start of a game to set crowd expectations. A change to match scoring moves expectations with it, so compare "rating minus expectation", not raw ratings.
- The typeface (VT323) has no box-drawing, block or shape characters. They come from the generated font `EWF Blocks`. A new symbol in the interface needs adding to `tools/build-font.py`.
- A game year is 48 weeks: twelve months of four weeks (`cal()` in `src/00-core.js`). Yearly things use 48, not 52.
- Preact needs keys on lists whose items change shape between redraws.
- Browser tests start with this week's tasks as reminders only (`helper.open()` calls `E.setGate(S, false)`). Pass `gate: true` to test the stopping.
- The headless sim never signs anyone, so its rosters shrink over time. That is the sim, not the game.
