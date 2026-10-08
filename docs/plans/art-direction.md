# The new look: plan for the next session

Written 6 October 2026, at the end of the session where Ryan picked the art direction. Read this first next time. It says what was decided, what the pictures promise that the game cannot do yet, the engine work behind each promise, and the order to build it in.

Nothing in this document is built. The game today is version 0.38 in the repo, not yet published (see "Before anything else" at the end).

## 1. What Ryan decided

All of these are his words or his picks from mock-ups on 6 October. They are also in `TASKS.md` (the decisions table and section 0p). Do not reopen them.

| Thing | Decision | Picture |
|---|---|---|
| The look of the game | Grey desktop windows on the blue desktop. "The new art direction of the game." | `docs/mockups/final/final-1-desk.png` |
| The desk | Four windows on one screen. The road map runs across the top. | `final-1-desk.png` |
| Backstage | A board, one line a person, worst first, with a standing dossier for the picked person. "Closest", so expect changes. | `final-2-backstage.png` |
| Storylines | The season calendar: twelve weeks, each story a bar running to its ending. "Great." | `final-3-storylines.png` |
| The show on the air | Keeps the old black screen with scrolling text. Big moments arrive as grey pop-up windows. A live feed reacts on the right. | `final-4a`, `final-4b`, `final-5` |
| The big button | A key on the bottom line: SPACE and what happens next. Its colour says what kind of step it is. The floating yellow button goes. | every `final-*` picture |
| Dot-matrix art | Colour lights: round lit dots on a black board with a glow, set in a grey window. | `docs/mockups/dots-sheet1.png` |
| Company marks | Every company has its own icon built from its three initials. | `final/company-marks.png` |
| Roster, Book the show | Mocked up in the new look. Ryan has not reacted to these two yet. | `final-6`, `final-7` |

The scripts that drew every picture are beside them (`final.js`, `dotlib.js`, `maplib.js`, `marks.js`). They are throwaway mock-up code, but the drawing routines in them are the starting point for the real ones.

## 2. The parts of the look

One kit, used by every page. Build this before any page.

**The window.** Grey body (`--grey`), a two-pixel bevel (white top and left, dark grey bottom and right), a hard drop shadow down and to the right. Title bar in blue with the title centred in yellow, a small box mark on the left and a short status on the right (a count, a date, "3 points"). A window that wants attention has a red title bar. A window for a celebration has a gold one.

**Inside a window.** Black text. Blue for names and headline figures, dark red for trouble, dark green for good news, dark grey for notes. A group box is a thin dark-grey frame with its heading in red sitting on the top edge. A label and value line has the label in a fixed-width column so values line up.

**Buttons.** Green with white text and a hard black shadow. Yellow for the one that moves things on. Grey for the lesser choice. Red for the one that hurts. A button that costs something shows the cost at its right end. A row of answers can be drawn as a wide bar with a coloured left edge, the way the calls on the broadcast are.

**Tags.** A small filled box with one word: Today, To do, Required, Good, Gap, Late, Clash. Red, grey, green, blue, yellow.

**The list box.** Teal, sunk into the window, with a grey header row. One line an item. The picked line is green with white text. Bars for mood, popularity and so on are block characters, ten wide in a full row and five or eight wide where space is tight.

**Lights.** A black board sunk into a window, holding either a picture or lettering in round lit dots. See section 4.

**Spacing.** Gaps between windows are about two and a half characters wide and a little over one line tall. Nothing is cut off with "..." except a long name in a list. If a line does not fit, shorten the words.

**Where things sit (this replaces rule 5a).** Top: the menu bar, with the company and the date at its right end, and nothing laid over it. Bottom: one line with the numbers on the left (and how each moved since the last show), three small keys for Help, Options and Music, and the SPACE key at the right end. The notification bar stays under the menu bar. The page tabs (The desk, Backstage, Storylines, Career) are still the old teal buttons in the pictures. Ask Ryan whether to restyle them.

**Black is allowed in two places only.** The broadcast's scrolling text, and the board behind lights.

## 3. Company marks

Ryan: "I want every company to have their own icons based on their 3 initials."

`final/company-marks.png` shows all nine. Each mark is three things:

1. **The initials.** `P.name` is already three letters for every company in the default world (WHW, PDW, OCW, PDP, TTT, NMW, LDD, LTA, KJP). A company with a longer or shorter short name uses its first three letters, or the capitals of `P.full` if that reads better.
2. **A shape from its model.** Corporate is a shield. Work rate is a ring seen from above. Purist is a laurel. Outlaw is a slashed banner. Underdog is a star. Start-up is a diamond. Spectacle is a sun. Tradition is a stepped pyramid. Joshi is a crescent moon.
3. **Two colours.** One for the shape, one for the edge and trim.

**Engine.** Add `P.mark = { sh, c1, c2 }` to a promotion. `E.markOf(P)` returns it, filling in what is missing from the model's defaults, so old saves and worlds with no mark still get one. The universe package gets an optional `mark` on a promotion (`src/85-universe.js`), and the World Editor gets a small picker: shape, two colours, and the three letters (`E.edSetMark`). A player who starts their own company picks one. Marks are data, never images.

**Interface.** One component, `Mark`, in three sizes:
- **Chip:** the three letters on the company's colour. For tables, the world page, the feed.
- **Badge:** the mark in lights, about 40 by 32 dots. For a company's card, the title screen's company picker, the top of the desk.
- **Board:** the same at four times the size, for the opening of a show and the game-over screen.

**Where marks go.** The menu bar beside the company name. The company picker on the title screen. The World page and every rival's card. The broadcast's top bar. The road map (a rival's mark on a city they ran recently). The feed, beside posts from a company's own account.

**Company colours as a theme (ask Ryan first).** The window title bars could take the player's company colour instead of always being blue, so changing jobs changes how the whole game looks. It is cheap once marks exist: one CSS variable. It is his call because it changes the look he just approved.

## 3a. The logo creator

Ryan, 6 October: "We also need to concept a logo creator." The concept is `docs/mockups/final/logo-creator.png` (`logomaker.js` draws it). It is one window, and the mark on the left redraws with every choice.

**What a mark is made of.** Five choices, all data:

| Choice | Options |
|---|---|
| The letters | Two or three initials. A style: block, slanted or wide. |
| The shape | Twelve to start: shield, ring, laurel, banner, star, diamond, sun, pyramid, moon, seal, plate, crown. |
| The colours | One for the shape, one for the trim, one for the letters, from the game's sixteen. |
| One extra | None, three stars, a bar under the letters, or lights round the edge. |
| Where it started | The company's model, a rival's mark, or nothing. |

So the stored mark grows from section 3 to `P.mark = { l, st, sh, c1, c2, c3, ex }`. Every field has a default from the company's model, so a mark is never missing.

**The window.**
- **Left:** the mark at full size in lights, and "How it will look": the chip for lists, the small badge, the menu bar, the broadcast's top bar, and a window title bar in the company's colours.
- **Middle:** the letters, the shape as a grid of twelve small boards, three rows of colour swatches, and the extra.
- **Right:** Ideas, which is six finished marks made from the same letters at once (press one to take it, Shuffle for six more), and Start from.
- **Bottom:** Undo, Put it back, and a yellow Save the mark. Nothing is saved until that is pressed.

**The full range (added the same evening).** Ryan asked for enough options that a player could build a mark in the style of any wrestling company they have in mind. `docs/mockups/final/logo-range.png` shows the wider set and twelve marks made with it (`marks2.js`):

| Choice | Options |
|---|---|
| Letter style | Block, slanted, wide, tall, outlined, shadowed |
| Layout | In a row, stacked, stairs, big middle letter |
| Shape | Eighteen: the twelve above plus oval, globe, bolt, wings, flame, pennant. Or no shape at all, letters only. |
| Finish | Flat, two-tone, striped |
| One extra | Three stars, a bar, a small second line of text (up to eight characters), lights round the edge |
| Colours | Shape, trim and letters, from sixteen |

That is several million different marks before a single new shape is added. The stored mark becomes `P.mark = { l, st, lay, sh, fin, c1, c2, c3, ex, tag }`.

**What the creator does not ship with.** No presets that copy a real company's logo, and no examples named after one. Rule 3 covers it: game content never names a real promotion, and that includes its trademarks. The creator is a set of general parts. What a player builds with those parts in their own world is theirs to decide, the same as in the World Editor.

**Shapes worth adding next,** because they widen the range the most: a plain circle with a thick rim, a rectangle with cut corners, a chevron, a ribbon across the middle, a pair of crossed bars, a cog, and three or four animal heads drawn the way the portraits are (an eagle, a wolf, a bull, a dragon). Each is one drawing function and one name.

**Rules it keeps.**
- The letters always stay readable. The creator will not allow letters the same colour as the shape, and shows the nearest colour that works.
- Two companies in one world cannot have the same mark. The creator says which rival already has it.
- Ideas and Shuffle are picked with the editor's own counter, never `rnd(S)`, so making a logo cannot change how a game plays out.
- Every choice is a real button reachable by keys and a gamepad (rule 5). The shape grid and the swatches move with the arrows.
- It fits one screen.

**Where it opens.**
- The World Editor, on a company (the first home for it).
- When the player takes ownership of a company or starts one.
- Manage, House, as "The company's mark", if Ryan wants a booker who is not the owner to be able to change it. Ask him. A real booker would not be allowed to.

**Engine.** `E.markOf(P)` (section 3), `E.markIdeas(letters, n, seed)` for the six ideas, `E.markOk(pkg, mark)` for the two checks above, and `E.edSetMark(pkg, pid, mark)` for the editor. A mark set during a game goes through `E.setMark(S, mark)`. Headless test: every model gives a valid mark, a clash is caught, an unreadable colour pair is refused, and the same seed gives the same six ideas.

**Later, if it earns its place.** More shapes (wings, a globe, a mask, a lightning bolt), a second line of small text under the letters (a year or a city), a mark for each weekly show and each title built the same way, and a mark that changes when the company changes its model.

## 3b. The creation suite

Ryan, 6 October, late: put the logo creator on the create-a-federation screen, and concept a creator for a move, a show, a belt, a tag team, a stable, a relationship, a storyline, an event and a gimmick, "with all logical options that can help the game". The ten mock-ups are in `docs/mockups/create/` (`creators.js` draws them). They are World Editor pages in the new look.

Every creator has the same three windows, so a player learns it once:
- **Left: the thing.** Its name and the choices that define it.
- **Middle: how it looks or reads.** A preview that redraws with every choice: a mark, a belt, a stage, or the lines the commentators will say.
- **Right: what it means.** What it does in the game, what it connects to, and **the check**: a short list of ticks and warnings, so a broken thing cannot be saved without the player seeing why.

The bottom key always says what it will save. Nothing is saved until it is pressed.

| Creator | Picture | What you choose | In the engine today | New work |
|---|---|---|---|---|
| A federation | `create-1-federation.png` | Name, initials, model, home and cities, money, the owner, the product. The mark is made on the same page. Shows, belts and people are listed with buttons to their creators. | `E.edAddPromo` and the company form | The mark (section 3a). The owner's fields on one page. |
| A move | `create-2-move.png` | Name, kind, finisher or not, which part of the body it works, how often it ends a match, the pop, the danger, who can do it, how it can be beaten, and the call lines | A finisher is only a name (`w.fin`). Body parts and their wear exist (`ZONES`, `w.bz`). | A moves table. A move changes the finish, the wear on the taker and the lines read out. The biggest new system here. |
| A show | `create-3-show.png` | Name, company, weekly or big event, night, length, network and slot, production, how it opens, voices, building, stage look, its tradition | `E.edAddShow`, and everything in `src/88-shows.js` and `src/87-create.js` | The stage look, and a tradition as a rule the night follows |
| A belt | `create-4-belt.png` | Name, rank, who can hold it, the rules, the first champion, and the look: centre plate, metal, strap, side plates, jewel, plate text | `E.edAddTitle`, levels, tag and women's belts, tournaments | The look as data (`t.look`), drawn in lights. The defence rule. Writing past reigns. |
| A tag team | `create-5-tag-team.png` | Two people, a name, what kind of team, side, team move, who talks, manager, how it ends, and a mark | `E.edAddTeam`, team experience and chemistry | The kind of team, the team move, who talks. Chemistry stays hidden in a game (fog of war); the editor may set it. |
| A stable | `create-6-stable.png` | Name, why they are together, side, members and their roles, the pecking order, rivals, a target, and a mark | Stables with a leader, members and tension | Roles and purpose as data. The who-gets-on grid is read from `S.rm`. |
| A relationship | `create-7-relationship.png` | Two people, what they are to each other, the bond, respect each way, jealousy each way, who knows, why (the line they remember), and how they are in the ring | `E.edAddRel`, and the whole matrix in `src/66-relations.js` | "Who knows" is new. Everything else maps onto bond, respect, jealousy and a memory. |
| A storyline | `create-8-storyline.png` | Name, kind, cost, what it needs, how long, where it ends, how it can go wrong, a cast of parts, and four acts each with a kind of segment and a line | Feuds in four acts. The plan in `docs/plans/storyline-templates.md`, with a draft engine set aside in the git stash. | The template engine that plan describes. Read the plan and the stash first. |
| An event | `create-9-event.png` | Where it happens (desk, backstage, on the air, after the show), its causes, how often, a deadline, what ignoring it costs, the words, two to four answers, and what each answer changes | Inbox events (`pushEv`, `EVR`), calls on the air (`LIVEK`), backstage reasons (`peopleNow`) are all code today | Events as data: causes, answers and effects from fixed lists. Never a flat chance, only causes. Effects go through `relBump()` and `youRemember()`. |
| A gimmick | `create-10-gimmick.png` | Name, kind of act, who it suits, where it works, how long it stays fresh, the entrance, the catchphrase and lines | Fourteen gimmicks as code, each with a fit rule (`GIMS` in `src/60-rpg.js`) | Gimmicks as data with the same fit rule, plus the entrance and lines |

**Rules for all ten.**
- Text the player writes uses a small fixed set of names in braces: `{a}`, `{b}`, `{who}`, `{friend}`, `{rival}`, `{hero}`, `{villain}`, `{move}`, `{event}`, `{show}`. The creator shows the line filled in with real people as it is typed. A line with a name the creator does not know fails the check.
- Rule 3 holds inside the creators as it does everywhere: nothing ships that names a real promotion, wrestler, move, title or event.
- Rule 4 holds: an answer with a chance shows the chance and what helps and hurts it.
- Every creator fits one screen and works from keys and a gamepad.
- Everything made here is part of the universe package, so it travels with a shared world. `src/85-universe.js` gets a new optional list for moves, gimmicks, story templates and events, and `E.edCheck` validates each.

**The World Editor as a whole** has its own plan: `docs/plans/world-editor.md`. It says what ships in every list and what a player can add (30 open lists with 1,172 entries in the box, 21 fixed lists, 24 rules of the world), the stories running on day one and the written past, and the engine work in order. Its pictures are in `docs/mockups/world-editor/`. The ten creators here are the pages that plan uses.

**Order to build them in.** Belt look and the federation page first (small, and they show off the new art). Then gimmicks and relationships (data that already exists as code). Then tag teams and stables. Then moves. Then storylines. Events last: they are the most powerful and the easiest to break a game with, so they need the check and "Play it now" working before anything else.

## 4. Lights: pictures and lettering in dots

**Built 7 October** in `app/src/kit/lights.tsx`: the routine, the lettering (`LightText`) and three pictures (`LightPic`: ring, bell, belt). The other seven pictures below are still mock-ups.

**Pictures.** Each picture is drawn by code onto a 64 by 48 grid, then every cell becomes one light. Ten exist as mock-ups: ring, belt, champion, mask, bell, microphone, cage, ladder, chair, entrance (`mock9.js`). In the game, a picture is a function in `app/src/kit/lights.tsx` that paints the small grid. One shared routine turns a grid into lights on a canvas.

**Lettering.** A five by seven face, one light a pixel, defined as data (`dotlib.js` has A to Z, digits and a few signs). The game's own typeface does not survive being turned into dots at small sizes, so do not try to use it.

**Rules for using lights.**
- Lights are for moments and headlines: a show's name, a ticker, NEW CHAMPION, YOUR CALL, a countdown, the crowd meter. Never for text the player has to read to play.
- Everything in lights is also in plain text nearby, or in the control's `aria-label`. A screen reader and a test must be able to read it.
- Draw once and keep the canvas. A board that does not change must not be redrawn every frame.
- Movement (a ticker that scrolls, a countdown, fireworks) stops when "Reduce motion" is on. The still frame must make sense by itself.
- No new characters are needed in the `EWF Blocks` font for any of this.

## 5. What the pictures promise that the game cannot do yet

The mock-ups use the real roster, portraits, tasks, run sheet and clock. Everything else in them is made up. This is the list of what has to be real before each screen can be built honestly.

| Screen | Already in the engine | Missing |
|---|---|---|
| The desk: the road | A venue name for each show (`venueFor()`), attendance and capacity, a list of cities for each company (`P.cities`), tours (`E.tourInfo`), a rival's good night in a city (`S.bar`) | Where each city is. A schedule of where the next shows are. Tickets sold before the night. How well a city knows you. Who is from where. |
| The desk: the rest | Inbox matters, tasks, the next show, what the crowd expects | Nothing. This part can be built first. |
| Backstage | Who is there and why (`peopleNow()`), actions, requests, scenes, memories (`S.rmY`), bonds (`S.rm`) | One call that returns a whole dossier. A summary of the room. Mood change since the last show. |
| Storylines | Feuds, heat, the four acts worked out from heat (`feudAct()`), booking power buys | A planned ending for a story. The calendar checks. People with no story. |
| The show | Everything on the black screen. The Net's feed after a show (`netPosts()`). | Feed posts during a show. Which moments deserve a pop-up window. A crowd meter value at each step. |
| The bottom key | `E.advance(S)` already says what happens next | A tone for the key. How the numbers moved since the last show. |
| Roster, Book the show | Almost all of it | A wrestler's record and current run in one place. "Tonight's stakes" as one list. |

## 6. Engine work, in build order

Each step is its own `src/NN-name.js` where it is a new system, with a headless test, and a default for every new field so old saves load (rule 9). The save key stays `ewf9000-save-4` unless a step says otherwise.

### 6.1 The numbers that moved (built 7 October)
`S.was` is how cash, popularity and the owner's trust stood at the start of this week, `S.wasPrev` the week before. `E.moved(S)` returns the change in each: last week's until a show of the new week has run, then this week so far. The bottom line shows it. This is item 18 of the outside playtest (the weekly change). Item 17 (gate and television money reaching the bank after each show, not at the week's end) is not done: it changes when every company's money moves, so it is a job of its own.

### 6.2 A tone for the key (built 7 October)
`E.advance(S)` has `tone`: `go` (yellow), `stop` (red: tasks in the way, a call on the air), `air` (green: a show goes on the air), `home` (white: back to the Office), `end` (teal: end the week). The key is the right end of the bottom line (`Advance.tsx`, `StatusBar` in `Frame.tsx`). Rule 5a and `app/tests/advance.js` are updated.

### 6.3 Company marks
Section 3. Small engine change, one component, an editor control. Do it early because every later screen uses it.

### 6.4 Places and maps (decided 7 October)
Ryan, 7 October: "I like the USA map and want to keep it. You will need to create new maps for the other regions." So question 1 is answered: the USA map stays as drawn in `final-1-desk.png`, with real state outlines and the week's state lit, and the rest of the world gets maps of its own in the same style. The default world's companies stay where they are.

**The maps to draw.** The default world's nine companies tour 88 cities. They fall on eight maps:

| Map | Areas that light up | Who needs it |
|---|---|---|
| The USA | States | TTT and NMW mostly; WHW, PDW and PDP in part |
| Britain and Ireland | Nations and regions | PDW, PDP |
| Europe | Countries | WHW, PDW, PDP, NMW |
| The Mediterranean and the Near East | Lands of the old world (Greece, Italy, Egypt, Anatolia, Mesopotamia) | OCW, WHW |
| Mexico and Central America | States and lands | LDD, LTA |
| South America | Countries | LDD, LTA |
| Japan | Regions | KJP, WHW |
| The world | Continents | A long trip (Melbourne, a tour abroad), and any city with no map of its own |

**How they work.**
- A city becomes a record, not a string: `{ n, map, area, x, y }`. `map` is which map it is on, `area` is the state, country or region that lights, and `x, y` is its dot. `P.cities` keeps its names; a new table `S.places` (from the universe package, with a built-in table for the default world) holds the rest. Fictional and ancient cities get a real spot (Troy at its site, West Egg on Long Island, Sleepy Hollow in New York, Camelot in the west of England).
- A map is data in the code: a grid of dots, each dot marked with its area, plus the area names. No image files (rule 2). The USA grid from the mock-up (`maplib.js`) is the pattern; each other map is drawn the same way, once.
- The road window shows the map this week's city is on. A company that crosses from one map to another shows the change as the tour moves: the title bar names the map, and the next stops that are off this map are listed under it with an arrow.
- A world made in the World Editor picks its maps from this set, places its cities on them, and can use the world map alone if it wants none of the others. New maps come with updates (they are one of the fixed lists in `docs/plans/world-editor.md`).
- `E.placeOf(S, city)`, `E.mapOf(S)` (which map, the cities on it, which area is lit, the road so far), all read-only.

**Cost.** This is eight drawings, not one. The USA is done as a mock-up. Do the other seven one at a time, starting with the maps the most companies need (Europe, then the Mediterranean, then Japan), and show each to Ryan.

### 6.5 The road: a schedule
Today a show's city is picked when the show runs. The road needs it picked ahead.
- `S.road`: the next twelve weeks of the player's shows, each `{ w, show, city, venue, cap }`. Filled at the start of a game and topped up each week. `venueFor()` reads from it, so the night matches what the desk said.
- The player can change a stop that is more than two weeks away (the venue pick in section 0i of `TASKS.md`). A big event's city is set when the event is announced.
- A tour (`E.startTour`) rewrites the affected weeks.
- `E.road(S)` returns the list with grades for stops already run, for the desk and the ticker.
- Rivals do not need a schedule. Their city is still picked on the night.

### 6.6 Tickets sold before the night (built 8 October)
Built as planned, with one change: the night's crowd still comes from the same sum as before, and the tickets sold ahead are a floor under it (a sold ticket is paid for even if nobody comes). Over half a year of nights fewer than three seats in a hundred are sold to people who stay home, so calibration does not move (`test-road.js`). The desk shows sold of capacity, sold this week and the gate so far; the road list and the schedule show what each stop ahead has sold, or that it is not on sale yet; the line of lights says sold and how many to a sell-out.

- Each stop on the road carries `sold`, starting when it goes on sale (four weeks out for television, eight for a big event).
- Each week `sold` moves toward what the night will draw: the same things that set attendance today (popularity, ticket price, the market, the show's standing), plus what has been announced (a title match, a hot story's next act, a hometown star).
- The night's attendance is what was sold plus the walk-up. It must still come out where the current formula puts it, so calibration does not move. Test: a year of gates before and after this change agree within a few percent.
- `E.sales(S)` for the desk: sold, capacity, sold this week, gate so far.

### 6.7 Markets: how well a place knows you (built 8 October)
Built by city rather than by area, since a city is what the road visits. Four words: They hardly know you, They know you, A strong market, Your territory. A market scales what a stop draws from 0.85 to 1.15, so it sets the size of the building and how fast tickets sell; it is centred on 50, and markets start at 50 on average, so calibration does not move. A good night raises it (a sell-out a little more), a bad one lowers it, and after six weeks away it cools half a point a week. The desk's crowd group says the market and the region's taste on one line; the schedule has a Market column; After the show says when a night moved it. Taste by area is still the region's (`REGIONS`).

- `S.mkt[area] = { know, last, grade, taste }`. `know` is 0 to 100 and is only ever said in words (Do not know you, Know you, A strong market, Your territory).
- It rises when you run a good show there and fades slowly when you stay away. It feeds ticket sales.
- Taste already exists by region (`REGIONS` in `src/89-regions.js`: brawling, work rate, spectacle). Give every area a taste and use the existing regional rule.
- A rival's recent show in the same place already raises the bar (`S.bar`). Show it on the desk as "A rival ran here 3 weeks ago".

### 6.8 Hometowns (built 8 October)
All 473 people in the default world have one: the place they were born, or for a character from myth or fiction the place their story belongs to. 216 of those towns are not stops on any road, so the engine knows where they are (`TOWN_AT`); three storybook ones (the Land of Oz, Kor, the Dragon Palace) have no place and only count in their own name. A night in the town itself counts in full and one within 100 km counts half: a louder pop, a few more tickets, and a win or a loss there is remembered. The effect on rating against expectation over 60 weeks stays within about a point for every company.

- 47 of 509 people in the default world have a hometown (`w.town`). Fill in the rest in `tools/build-public-domain.js` and rebuild the universe.
- On a night in or near a wrestler's hometown: a louder reaction, a little more sold, and a line on the desk. Losing there is remembered (`youRemember()`), winning there too (rule 9b).
- `E.hometown(S, city)` returns who is from here.

### 6.9 Story endings and the season
- A feud gains `end: { w, show }`, the planned blow-off. Set when a story starts (default: the next big event at least three weeks away) and movable by the player.
- A story that reaches its ending and is paid off there gets a lift. One that runs past its ending cools. One ended early loses its payoff.
- `E.season(S)` returns twelve weeks of every story (which act in which week, worked out from heat today and the ending) and the checks: two endings on one night, a month with none, a story with no ending, a person in two stories, a champion with no challenger, people with no story in four weeks.
- Each check is a line the player can act on, not a punishment.

### 6.10 The dossier and the room
- `E.dossier(S, id)`: why they are here, mood and how it moved since the last show, where they stand with you, stress, the last three things they remember, their two closest friends and two worst rivals, and the answers open to you with their costs.
- `E.roomInfo(S)`: trust, average mood, how many are unhappy or hurt, cliques, pairs with real heat.
- Read-only, built from `peopleNow()`, `S.rm`, `S.rmY` and `S.live.n0`. No new state except a snapshot of moods at the last show.

### 6.11 The live feed and the moments
- The Net must never change how a game plays (`src/94-net.js` uses `h01()`, never `rnd(S)`). The live feed keeps that rule.
- Each step of a live show (`E.liveNext`) returns, beside its beats, `feed: [posts]` and `noise` (posts a minute, from the crowd score and the stars). Posts are picked with `h01()` from the step's result: a title change, an upset, an injury, a flat match, a hot promo.
- Each step also returns `moment` when something deserves a window: a title change, five stars, an upset nobody called, a debut, a broken streak, a hometown win. The screen decides how to show it. The result of the match is already decided; a moment changes nothing.
- The crowd meter is the step's crowd score, already computed.

### 6.12 Small reads for Roster and Book the show
- A wrestler's record and current run (`E.recordOf`).
- `E.stakes(S)`: promises due, targets, what each story wants tonight, what this crowd likes. All of it exists in pieces.

## 7. Order of work

Five changes a version (rule 10a). One step at a time, shown to Ryan (rule 9a). Every converted page is one screen, tested with `fits()` at 1280 by 720 as well as larger (rule 5b). Every control keeps a `data-t` name and works from keys and a gamepad (rule 5). Hover never holds anything that focus does not.

**Version A: the kit, and the first screen**
1. The window kit: `Win`, group box, buttons, tags, list box, bars. Old panels keep working.
2. The bottom line and the SPACE key (6.1 and 6.2). The floating button goes.
3. Lights: the routine, the five by seven face, and three pictures (ring, bell, belt).
4. Company marks (6.3) and the logo creator in the World Editor (section 3a).
5. The desk in windows, with the lower three windows real and the road window showing only what exists today (this week's venue, capacity, the crowd's taste).

**Version B: the road**
6. Places and the eight maps (6.4), one map at a time.
7. The schedule (6.5).
8. Ticket sales (6.6).
9. Markets (6.7) and hometowns (6.8).
10. The road window complete: the map, the ticker, the legend.

**Version C: people and stories**
11. The dossier and the room (6.10).
12. Backstage as the board.
13. Story endings (6.9).
14. Storylines as the season calendar.
15. Roster in windows.

**Version E: the creation suite** (section 3b) and the World Editor (`docs/plans/world-editor.md`, eight steps of its own), after the four versions above. The federation page and the belt look can move earlier if Ryan wants the World Editor to show the new art first.

**Version D: the show** (built before Version E)
16. Moments and their pop-up windows (6.11).
17. The live feed and the crowd meter.
18. The call from the gorilla position as a window with a countdown.
19. Book the show in windows.
20. The remaining pages, one at a time.

## 8. Going further, once the base is in

These only become possible after the steps above. None is promised.

- **A map with modes.** Switch the road map between how well each place knows you, ticket sales, and where rivals have been.
- **Rivals on the map.** A rival's mark on the city they ran this week. A ratings-war night shows both marks on one city.
- **Lights that move.** A ticker that scrolls, stars that light one at a time with the last half-star held back, a three count in full-board numerals, a champion's name that shimmers.
- **A crowd you can see.** The crowd meter as a strip of lights that ripples when the building is hot and thins when it goes quiet.
- **Moments that are kept.** A five-star match, a title change or a big upset gets its board saved to company History, to be looked at again.
- **A share picture.** One key saves the current board or result window as an image.
- **Company colours everywhere.** Section 3, if Ryan says yes.
- **The season on the wall.** The calendar reaching a full year, with every big event's card filling in as stories are aimed at it.

## 9. Questions for Ryan

1. **The map.** Answered 7 October: keep the USA map, and draw new maps for the other regions (section 6.4).
2. **Company colours on the title bars.** Yes or no (section 3).
3. **The page tabs.** Restyle them to match the windows, or leave them?
4. **Roster and Book the show.** Are `final-6` and `final-7` right, or do you want options the way you had for the others?
5. **Backstage.** You said the dossier layout was "the closest". What should change?
6. **Who may change a company's mark.** Only the owner, or the booker too (section 3a)?
7. **The old look.** While pages are moved over one at a time, the game will have both looks at once. Is that acceptable in the published copy, or should the new look ship only when a whole section is done?

## 10. Where the work stands

- 7 October: version 0.39 (the kit, the SPACE key, lights, logos, the desk with the road) passed the full test run and is published. The live page's version id is `1791416911-389a` (Version 50). Read the live page and check that id before the next publish. (0.38 was `1791393273-993d`, Version 49.)
- 7 October: the game was renamed EWF Wrestling Manager (`TASKS.md`, the decisions table).
- 7 October: Version A, step 1 is done: the window kit (`app/src/kit/win.tsx`, `app/styles/win.css`, the kit sheet at `go('kit')`, `app/tests/kit.js`). Pop-ups wear the new look.
- 7 October: Version A, step 2 is done: the bottom line and the SPACE key. The floating button is gone.
- 7 October: Version A, step 3 is done: the lights. Also fixed on the way: on a TV, the menu and the bottom line lay over the top and bottom of every one-screen page. 
- 7 October: Version A, step 4 is done: company logos (`src/89-logos.js`, `Logo` in `app/src/kit/logo.tsx`) and the logo creator in the World Editor (`app/src/shared/logomaker.tsx`), with the full range of parts from section 3a. logos show on the menu bar, the company picker and every company's card. Not done yet: the creator for a player who owns their company (question 6), logos on the World page, the feed and the broadcast's top bar, and the extra shapes listed in 3a. Next is step 5, the desk in windows.
- 7 October, Ryan: "the desk needs to have the map" and "follow the concept art for the map. I want it to look like that." So step 5 took the map and the schedule with it, ahead of Version B. Done: the desk in four windows on one screen (`app/src/screens/office/Desk.tsx`, `app/tests/desk.js`); all eight maps as boards of 59 by 32 dots (`src/91-maps.js`, built by `tools/build-maps.js` from Natural Earth's public-domain outlines), with every one of the 88 cities placed (`CITY_AT` in `src/91-road.js`); the schedule (6.5, in a simpler form: the company tours its cities in a loop, the nearest city next, and `S.rdn` counts the stops, so nothing new is kept in the save but that number and `S.rdv`, the last night in each city); the building booked before the card. The road window shows only what is real: the city and its land, the building, what it holds, the price of a seat, what the crowd likes, the last night here, a rival's great night in town, who on the roster is from here, the last three stops with their grades and the stops ahead. Left for Version B: tickets sold before the night (6.6), markets (6.7), hometowns for everybody (6.8), changing a stop or the building, and a closer map of central Mexico (four of LDD's cities share two dots). The pictures are `docs/mockups/final/built-desk.png` and `built-maps.png`.
- The desk had to give way in three places to fit 1280 by 720, which is shorter than the 860 the concept was drawn at. The legend is the road list's colour chips, not a line under the map. The two buttons sit at the end of the line of lights. A matter on the desk is two or three lines and an Answer button that opens it in a pop-up; the answers are not on the desk itself. Everything else the old desk held is behind one button, The week.
- 7 October, Ryan: "its not marks. Its Logo." The word is logo everywhere: in the game, in the code (`P.logo`, `E.logoOf`, `Logo`) and in these notes from here on. Sections 3 and 3a above were written before that and still say mark; read it as logo.

Still open from the playtest and not part of the art work: item 4 (stretch the stars so two is a bad match and four and a half is rare) and Ryan's call that every difficulty should need the player. Both are balance work and both move every crowd's expectations. Do them in a version of their own, not mixed in with the look.
