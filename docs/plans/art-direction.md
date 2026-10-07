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

## 4. Lights: pictures and lettering in dots

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

### 6.1 The numbers that moved (small, do first)
`S.was = { cash, image, trust, w }`, set when a show goes off the air and at week end. `E.moved(S)` returns the change in each. The bottom line shows it. This is also items 17 and 18 of the outside playtest.

### 6.2 A tone for the key (small)
`E.advance(S)` gains `tone`: `go` (yellow), `stop` (red: tasks in the way, a call on the air), `air` (green: ring the bell), `home` (white: back to the Office), `end` (teal: end the week). `Advance.tsx` moves from the menu bar to the bottom line. Update rule 5a, `app/tests/advance.js`, and every test that finds the button by its place.

### 6.3 Company marks
Section 3. Small engine change, one component, an editor control. Do it early because every later screen uses it.

### 6.4 Places (this is the big decision; see question 1)
The default world is not the USA. WHW runs Rome, Athens, London, Kyoto and Chicago. OCW runs Athens, Sparta and Troy. KJP runs Kyoto and Osaka. PDP runs Whitby and Sleepy Hollow. NMW runs West Egg. A map of US states only suits two of the nine companies.

What I recommend building:
- A city becomes a record, not a string: `{ n, lat, lon, land, area }`, where `land` is the country and `area` is the state, province or island. `P.cities` keeps its names; a new table `S.places` (from the universe package, with a built-in table for the default world) holds the rest. Fictional and ancient cities get a real spot on the map (Troy at its site, West Egg on Long Island, Sleepy Hollow in New York).
- One world land mask in the code, a few kilobytes: a grid of land and sea. The map is this mask drawn as square dots.
- A company's map frames its own cities: the view zooms to the box around them. KJP sees Japan. LDD and LTA see Mexico and the Caribbean. TTT sees the American West. WHW sees the world.
- "The state they are in" is lit by area: the dots nearest this week's city within the same `area`. For the USA that means real state outlines can come later as an optional layer; the first version lights the area around the city.
- `E.placeOf(S, city)`, `E.mapOf(S)` (the view box, the cities, which are lit), all read-only.

### 6.5 The road: a schedule
Today a show's city is picked when the show runs. The road needs it picked ahead.
- `S.road`: the next twelve weeks of the player's shows, each `{ w, show, city, venue, cap }`. Filled at the start of a game and topped up each week. `venueFor()` reads from it, so the night matches what the desk said.
- The player can change a stop that is more than two weeks away (the venue pick in section 0i of `TASKS.md`). A big event's city is set when the event is announced.
- A tour (`E.startTour`) rewrites the affected weeks.
- `E.road(S)` returns the list with grades for stops already run, for the desk and the ticker.
- Rivals do not need a schedule. Their city is still picked on the night.

### 6.6 Tickets sold before the night
- Each stop on the road carries `sold`, starting when it goes on sale (four weeks out for television, eight for a big event).
- Each week `sold` moves toward what the night will draw: the same things that set attendance today (popularity, ticket price, the market, the show's standing), plus what has been announced (a title match, a hot story's next act, a hometown star).
- The night's attendance is what was sold plus the walk-up. It must still come out where the current formula puts it, so calibration does not move. Test: a year of gates before and after this change agree within a few percent.
- `E.sales(S)` for the desk: sold, capacity, sold this week, gate so far.

### 6.7 Markets: how well a place knows you
- `S.mkt[area] = { know, last, grade, taste }`. `know` is 0 to 100 and is only ever said in words (Do not know you, Know you, A strong market, Your territory).
- It rises when you run a good show there and fades slowly when you stay away. It feeds ticket sales.
- Taste already exists by region (`REGIONS` in `src/89-regions.js`: brawling, work rate, spectacle). Give every area a taste and use the existing regional rule.
- A rival's recent show in the same place already raises the bar (`S.bar`). Show it on the desk as "A rival ran here 3 weeks ago".

### 6.8 Hometowns
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
4. Company marks (6.3).
5. The desk in windows, with the lower three windows real and the road window showing only what exists today (this week's venue, capacity, the crowd's taste).

**Version B: the road**
6. Places (6.4), after question 1 is answered.
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

**Version D: the show**
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

1. **The map.** The default world is not the USA (section 6.4). My recommendation is one world map in dots, zoomed to each company's own cities, with the area around this week's city lit. The alternative is to move the default world's companies to US cities so a state map fits everyone, which changes the character of the world. Which?
2. **Company colours on the title bars.** Yes or no (section 3).
3. **The page tabs.** Restyle them to match the windows, or leave them?
4. **Roster and Book the show.** Are `final-6` and `final-7` right, or do you want options the way you had for the others?
5. **Backstage.** You said the dossier layout was "the closest". What should change?
6. **The old look.** While pages are moved over one at a time, the game will have both looks at once. Is that acceptable in the published copy, or should the new look ship only when a whole section is done?

## 10. Before anything else next session

Version 0.38 is committed but not published. It holds items 1, 2, 3, 5, 6, 7 and 8 of the outside playtest (`TASKS.md`, section 0o): the letter grade is now the show against its own crowd, one verdict everywhere, the owner's trust shown moving, and targets that say Hit or Missed.

1. Run the full test suite on the current build. The last full run was partly cut short: roster failed (it has failed under load before and was not re-run), and calls and company did not finish.
2. Read the live page, confirm its version id is still `1791332227-7383`, and publish 0.38.
3. Then start Version A above.

Still open from the playtest and not part of the art work: item 4 (stretch the stars so two is a bad match and four and a half is rare) and Ryan's call that every difficulty should need the player. Both are balance work and both move every crowd's expectations. Do them in a version of their own, not mixed in with the new look.
