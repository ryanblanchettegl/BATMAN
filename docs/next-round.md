# Next round: inputs for the second set of 30 ideas

Everything Ryan has asked to feed into the next round, in the order it arrived. Nothing here is built yet unless marked.

## 1. Direction (2 Oct 2026)

Make this the deepest text-based RPG there is: lots to read into and lots to adjust, so a federation becomes the player's own.

Research before proposing:

- Decision making and what makes choices interesting
- Gamification of everything; stats
- 4X games and early Civilization
- Grand strategy
- Spreadsheet ("Excel") games
- Roguelikes
- Tabletop RPGs and D&D
- Fantasy sports, and what makes it compulsive: the draft, weekly line-up calls, the waiver wire, head-to-head, stat watching

The game should understand wrestling history and also track the future history it generates.

Also wanted: create-a-fed (first version built in batch 6) and, later, a career mode. The booking game and career mode must share the same underlying records (first version built in batch 6: every wrestler carries a milestone log and yearly stat lines, and the engine can already book every promotion without a human).

## 2. Roster architecture (2 Oct 2026)

Written up in the "EWF 9000 Roster Architecture" doc. Summary:

- Base game ships a public domain universe (history, myth, pre-1929 fiction as 1990s wrestling archetypes).
- Real-world rosters are Workshop packages in a JSON format; the game never ships them.
- One loader, one validator, one schema for both.

## 3. Systems brief (attachment, 2 Oct 2026)

Reference points: Madden 04-08 franchise, NBA 2K Association, SmackDown vs. RAW GM Mode, Here Comes the Pain, D&D event tables.

### 3.1 Wrestler schema and roles

- Attributes: brawling, technical, aerial, hardcore, charisma, promo, stamina, durability.
- Hidden: potential, age cliff, peak years.
- Locker-room roles: mentor, diva, gatekeeper, locker-room leader, toxic influence.
- Morale and ego: satisfaction from expected push against actual push, salary, title reigns, locker-room heat.
- Relational web: heat, tag chemistry, mentorship, backstage feuds and romances.

Status: attributes partly exist (see the engine mapping table in the roster doc). Push expectation exists only as owner directives and promises. Roles, ageing and the ego formula are new. Personality roles belong with the public domain roster, where every character is invented or long dead.

### 3.2 Brutality against fatigue

- Match intensity: gimmick matches multiply crowd satisfaction and raise fatigue and injury risk steeply.
- Wear by body zone: neck, knees, back, shoulders.
- Medical staff tiers and resting talent reduce the injury curve over a season.

Status: stipulations already raise crowd heat and injury odds; condition is a single number. Body zones, medical staff and rest planning are new.

### 3.3 Dirt sheet and podcast

- Media sentiment tracker: ratings, crowd response, bad booking, backstage leaks.
- Output: a dirt-sheet excerpt and a transcript of a weekly podcast reacting to the player's booking.

Status: a dirt sheet runs after every show, and the fan board (batch 6) reacts to shows. A two-host podcast transcript and leaks are new.

### 3.4 Backstage action points and chaos events

- A pool of action points before each card.
- Spend them: the owner's office (budget), the parking lot (sneak attack angle), the gym with a faction (chemistry), wrestlers' court (settle disputes).
- Mid-match chaos table: lights out, power failure, shoot fight, crowd riot, each needing a quick booking call.

Status: pre-show incidents exist as one random event per show. A spendable action-point phase, locations and mid-match interruptions are new.

### 3.5 Storyline writer

- 4-to-12-week templates: the betrayal, David against Goliath, the stalker, the invasion.
- Required weekly beats (week 1 sneak attack, week 2 promo war, week 3 tag match, week 4 big-event blow-off).
- Heat builds faster the more beats are hit, toward the pay-off.

Status: feuds move through four acts with storylets chosen by the engine. Player-chosen templates with required weekly beats are new.

### 3.6 Deliverables asked for in the brief

1. Data models (TypeScript/JSON) for wrestlers, shows, storylines, promotions.
2. Formulas: match rating, injury and fatigue, locker-room morale.
3. Three sample outputs of the podcast engine: a great show, a botched main event, a locker-room walkout.
4. Workshop import mapping: how a custom JSON package overrides the default data.

## 4. The look (2 Oct 2026)

Ryan asked for a 31st idea: graphs, pie charts, images, pop-ups, and anything that leans into the art style.

Built so far (batch 7): pop-up windows, text-mode pie charts and column charts, range bars for scouted ratings, generated text portraits.
Built since: body-zone figures (batch 8), boot screen, title card, pixel portraits and the Create-a-Wrestler window (concept art pass), clocks as dials and the backstage floor plan (batch 9).
Still to come: title cards for eras and big events, the territory map, monochrome themes.

## 5. Progress against The Next 31

- Batch 7 (ideas 31 to 35 and the first of 61): built and tested.
- Batch 8 (ideas 36 to 40: locker-room roles, the ego grid, stress and breaking points, body zones and the intensity dial, medical staff and rest): built and tested.
- Concept art pass (v0.8.1 and v0.8.2): boot sequence, title card, Select Promotion menu, Office gauges and dated news, monitor effect, F1 help, options window. The Windows 95 style Create-a-Wrestler window, pixel portraits for every wrestler, and a versus strip before each match. Ryan's reference images are in docs/concept-art/.
- Batch 9 (ideas 41 to 45: action points and the backstage map, wrestlers' court, mid-match chaos, clocks, house rules): built and tested.
- Tidy-up and screens pass (v0.9): the twelve tabs became five sections (Office, Booking, Roster, Stories, Company) with a row of page buttons each; the profile and the booking side panel are split into buttons; the drive path and memory read-outs are gone. One layout now scales for desk, tablet, TV and phone, with touch-sized controls, a TV-safe margin, and focus that a remote or gamepad can move.
- Batches 10 to 12: not started.
