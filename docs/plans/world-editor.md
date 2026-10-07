# The World Editor: what ships, what a player can add

Written 6 October 2026. A concept, not a build. Ryan asked: "Concept out world editor and how many options we give as selectable options as core concepts and how many options can be added by the user. We want alot of options out of the box but we have to have enough flexibility the user can create anything in their world. Included current roster storyline and historic ones."

Pictures are in `docs/mockups/world-editor/` (five pages in the new look, drawn by `world-editor.js`). The ten creators this plan leans on are in `docs/mockups/create/` and in `docs/plans/art-direction.md`, section 3b.

Counts marked "today" were measured in the engine on 6 October. Counts marked "at release" are proposals for Ryan to change.

## 1. The short answer

| | In the game today | In the box at release | A player can add |
|---|---|---|---|
| Open lists (moves, stipulations, gimmicks, story templates, events and so on) | about 410 entries in code | **1,172 entries in 30 lists** | Any number, in all 30 |
| Fixed lists (the engine's bones) | about 90 parts | **233 parts in 20 lists** | None. They are picked from, not added to |
| Rules of the world | 1 (difficulty) | **24 switches, 6 eras** | Their own eras, saved from the switches |
| The world itself (companies, people, belts, ties) | 9 companies, 473 people, 39 belts, 85 ties | The same, plus the three rows below | Any number. No fixed limit |
| Stories running on day one | 0 | **18** (two a company) | Any number |
| Stories in the past | 0 | **54** (six a company, five years) | Any number |
| Title reigns and big events in the past | made up when a game starts | **212 reigns, 45 big events**, written | Any number |

So about 1,400 things to pick from on day one, and nothing a player picks from that they cannot also make, except the twenty lists the engine needs fixed.

## 2. Three layers

Everything in the editor sits in one of three layers. The layer says whether a player can add to it.

**The bones.** The parts the engine does its sums with: the fifteen ratings, the eight ways a match can end, the four acts of a story, the parts a belt is drawn from. A new one needs new code, so these are fixed and grow only with updates. The editor marks them **Fixed** and says why.

**The library.** Named things built from the bones: a stipulation, a move, a gimmick, a story template, an office event. This is where "a lot of options out of the box" lives. Every shipped entry is built from the same dials the player gets, and from nothing else. That is the rule that makes the whole thing work: if the shipped Ladder match is eight dials, a player's Scaffold match is the same eight dials, and it works everywhere Ladder does (the card, the agent's read, the report, a rival's booking).

**The world.** Companies, people, belts, shows, teams, ties, the stories running, and the past. All of it is the player's. The default world is one world among many.

Shipped library entries cannot be deleted or changed, so a shared world always opens on somebody else's machine. They can be **copied** (the copy is the player's to change) and **switched off** for one world.

## 3. The bones: 20 fixed lists, 233 parts

| List | Count | Why it is fixed |
|---|---|---|
| Ratings a person has | 15 | Every match and promo sum reads them |
| Roles | 7 | Wrestler, manager, announcer, referee, road agent, owner, booker |
| Places on the card | 6 | Main eventer down to enhancement talent, and non-wrestler |
| Sides | 3 | Hero, villain, in between |
| Weight classes | 3 | |
| Acts of a story | 4 | Spark, Escalation, Twist, Blow-off |
| Ways a match ends | 8 | Clean, flash, cheap, interference, interference that fails, disqualification, count-out, draw |
| Ways to open a show | 6 | Each pays in its own way in code |
| Ways to deliver a promo | 3 | |
| Production levels | 5 | Bare bones to State of the art |
| How rough the product is | 4 | Family to Extreme |
| Time slots | 3 | |
| Network sizes | 3 | |
| What a crowd likes | 3 | Brawling, work rate, spectacle |
| Rooms backstage | 7 | |
| The words for a show | 10 | A bomb up to an all-time classic (rule 8c) |
| **When it can happen** | about 40 | New. See section 5 |
| **What it does** | about 40 | New. See section 5 |
| Parts of a company mark | 37 | Drawn by code (art-direction plan, section 3a) |
| Parts of a belt | 26 | Drawn by code |

Portrait parts, the achievements and the six clocks are also fixed, and are not things a world picks from.

## 4. The library: 30 open lists, 1,172 entries

"Today" is what the engine holds now, mostly as code. "At release" is what ships in the box. A player can add to every one of these.

### The ring

| List | Today | At release | A new one is made of |
|---|---|---|---|
| Wrestling styles | 7 | 10 | A weight on each ring rating, what tires it, the moves it draws on |
| Moves | 86 names | 300 | Name, finisher or signature or team move, the kind of move, danger, what it needs, who it suits, its call line |
| Match types | 6 | 12 | Sides, people a side, how it is won, whether people are eliminated, minutes it wants |
| Stipulations | 10 | 24 | Danger, crowd, what it needs, who it suits, the finish it favours, how rough a product it needs, how often before it wears off, its line |
| Entrances | about 12 lines | 40 | The line, the side it suits, the gimmick kinds it suits |

### People

| List | Today | At release | A new one is made of |
|---|---|---|---|
| Gimmick kinds | 14 | 24 | Who it suits, where it works, how long it stays fresh, what it lifts and costs |
| Gimmicks, written up | 0 | 120 | A kind, a name, an entrance, a catchphrase, six lines. Ready to hand to somebody |
| Traits | 10 | 24 | Two to four entries from "what it does", each with a condition |
| Kinds of tie | 6 | 8 | Starting bond, respect and jealousy, and which stories it opens |
| Owner types | 4 | 6 | What they want, how patient they are, who they favour |
| Name pools | 1 | 12 | First names and last names for the unknowns a world fills up with |

### Stories

| List | Today | At release | A new one is made of |
|---|---|---|---|
| Story kinds | 2 | 9 | Rivalry, title chase, team story, group story, a turn, a mystery, company against company, a career at stake, a dream match |
| Story templates | 0 | 40 | A cast of parts, four acts, the beats each act can use, how it can end, what it leaves behind (section 7) |
| Story beats | 13 | 60 | The acts it fits, who it needs, what it moves, its lines |
| Promo and angle kinds | 11 | 16 | Who is in it, which skill carries it, what it moves |
| Promo topics | 4 | 8 | What suits it, what it risks |

### Things that happen

| List | Today | At release | A new one is made of |
|---|---|---|---|
| Office events | about 37 | 80 | When it can happen, who it is about, a deadline, two to four answers, what each answer does |
| Calls on the headset | 12 | 20 | The same, tied to what is about to go on the air |
| Backstage reasons, asks and scenes | about 25 | 45 | The room, the reason, what a point spent there does |
| Wrestlers' court cases | 6 | 16 | The charge, the verdicts, what each does |
| Life events | 5 | 20 | Who, how often, what changes |

### The company

| List | Today | At release | A new one is made of |
|---|---|---|---|
| Company models | 10 | 12 | About fourteen dials: what makes a match good here, what the crowd wants, finishes, who gets pushed, who fits, how a card is shaped |
| House rules | 11 | 16 | What it does to people, which models like it |
| Networks | 15 | 18 | Name, size, patience |
| Sponsors | 12 | 24 | Name, what it pays, what it asks for |
| Big event themes | 4 | 12 | A stipulation or a kind of story the night favours |
| Venues | 0 | 60 | City, seats, cost, what crowd it draws |
| Cities | 88 | 100 | Name, region, size, a spot on the map |
| Columnists and fan voices | 3 | 12 | Name, taste, how kind |

### The look

| List | Today | At release | A new one is made of |
|---|---|---|---|
| Light-board pictures | 0 in the game | 24 | A picture on the 64 by 48 grid, drawn dot by dot in the editor |

**How deep to stock each list.** The numbers follow one test: a player booking for three game years should not see the same entry feel worn out. Moves and written-up gimmicks are the big ones because every wrestler needs one. Story templates and events are next, because repeats there are what make a sim feel small.

## 5. The two menus that let a player make anything

An event, a call, a trait, a story beat and a backstage reason all need to say two things: when can this happen, and what does it do. Today each one is a small piece of code. To open them to players, both become menus.

**When it can happen** (about 40 conditions). Plain tests a player picks and joins with "and" or "or": is a champion, mood is low, has a contract with eight weeks or fewer, the tie between them is a rivalry, has worked three hard matches running, the company is this model, a big event is within four weeks, has this trait, has this tag, lost the last match, is the face of the company.

**What it does** (about 40 effects). Mood up or down, the tie between two people warms or cools, somebody remembers it, a story of this kind starts, heat up or down, popularity up or down, money, the owner's trust, the network's patience, hurt for so many weeks, leaves the company, turns, a promise is made, a title shot is owed, a line on the notification bar.

Both menus are fixed lists. Everything built from them is open. A new condition or effect is new code and comes with an update.

Three more things keep it open-ended:

- **Tags.** A free label on anybody or anything: "royalty", "masked", "from the north". The engine does not know what a tag means, and does not need to. A condition can test for it, so a player's story template can ask for "somebody with the tag royalty". About 30 ship; a player adds any number.
- **Copy and change.** Every library page has "Copy one". Nobody starts from a blank form unless they want to.
- **Words in braces.** Text a player writes uses the same small set of names as the creators: `{a}`, `{b}`, `{who}`, `{move}`, `{event}`, `{show}`. The page shows the line filled in with real people as it is typed.

## 6. Rules of the world: 24 switches, 6 eras

Picture: `world-4-rules.png`. These are what let a world be a different kind of place without touching the library. Each has a shipped setting, and a world that changes none of them plays exactly like the game in the box.

| Group | Rules |
|---|---|
| The calendar (4) | The year it begins. Length of a weekly show: 1, 2 or 3 hours. Length of a big event: 2, 3 or 4. Big events a year: 4, 6 or 12 |
| The ring (6) | How often people get hurt. How fast bodies wear down. When careers peak. Men and women apart or mixed. Whether weight classes count. How much a crowd minds a non-finish |
| What you can know (2) | How much the road agent can read. How news comes: on paper, with the feed, with the boards |
| The business (6) | The scale of money. Wages. How patient networks are. Raids on talent: never, sometimes, open war. Whether new companies can open. Whether companies can close |
| The people (4) | How fast moods move. How long memories last. How often people ask for things. Newcomers a year |
| Play (2) | Which difficulty levels are offered. Whether the first-year asks are on |

An **era** is a saved set of switches. Six ship: Today, The territory days, The boom, A small pond, The long war, and one slot that is the player's own. An era names no real period, company or person. It only moves switches.

"How news comes" is the one that changes a page: a world on paper has no feed and no boards, and the Net section is a weekly newsletter. That needs the Net to read the rule; it is the largest of the 24.

## 7. Stories: running on day one, and the past

Today a new game starts with no story running anywhere and no written past. This is the biggest gap in the default world, and the one Ryan named.

### Running when the game begins

Picture: `world-3-history.png`, top window.

The package gets a `stories` list. Each entry: a template (or just a kind), the cast by id, the company, which act it is in, its heat, how many weeks it has run, the big event it wants to end at, and the belt if there is one. When a game starts, each becomes a live story already in its act, with its log filled in so the Storylines page can show how it got here.

The default world ships with **18: two a company**, written for the roster it has. The 85 ties already in the package are the raw material; many are rivalries with a line of history. At least one in each company is in act 3 or 4, so every new game opens with an ending to book in its first month (rule 7a: the week opens on a fire with a deadline).

A new game offers a choice: start with the stories running, or with a clean slate.

Engine note: `startFeud()` stops at eight live stories. Stories from the package must not count toward that, or the cap should be per company.

### Before the game begins

Picture: `world-3-history.png`, lower window and the pane on the right.

The package gets a `history` block with five lists:

| List | An entry | Ships at release |
|---|---|---|
| Past stories | Template or kind, cast, company, year, weeks it ran, where it ended, how, the match in stars | 54 (six a company) |
| Title reigns | Belt, holder, from, to, defences, who they beat, where | 212 (five years, 39 belts) |
| Big events | Company, event, year, main event, stars, the letter | 45 (each company's biggest night, five years) |
| Careers | Person, year, one line | As needed |
| The company's years | Company, year, one line | As needed |

**The past has to do something, or it is only flavour.** Each past story says what it leaves behind, and the editor shows it:

- **A tie.** The two people start with an old score, or respect, set in the relationship matrix.
- **A memory.** Each remembers how it ended, in a line the dossier can show.
- **A record.** A streak, a count of reigns, a match of the year. The Net and the commentators can quote it.
- **A story ready to start.** A rematch template with its cast already filled in.
- **Something the office already knows.** If two people had a great match in the past, the road agent can already read their chemistry (fog of war, `S.know`). A written past makes day one less blind.
- **An anniversary.** "Five years ago this week" on the dirt sheet, and an occasion for a show or a belt.

**Write a past for me.** One button fills in as many years as asked for: champions, stories and results that fit everybody's age and standing. It uses a seed, so the same world always gets the same past. This is how the 212 reigns get written without anybody typing them, and how a player's own world gets a past in one press.

### Story templates: the old shapes

Picture: `world-5-templates.png`.

Forty ship. Each follows a shape wrestling has told many times. None names anybody, any company or any real angle (rule 3): the cast is filled from the player's own roster.

| Group | Templates |
|---|---|
| Titles (8) | The chase. The long reign. Champion against champion. The stolen belt. The shot held back. The empty throne. The rematch owed. The reluctant champion |
| Friends and partners (8) | The break-up. The betrayal. Unlikely partners. Teacher and pupil. The jealous partner. The reunion. The third wheel. Family at war |
| Sides (6) | The turn. The double turn. The long road back. The hero falls. The crowd picks its own. Nobody trusts the stranger |
| Companies and groups (6) | The invasion. The takeover from inside. The boss against the star. The walkout. The group splits. Show against show |
| Mystery and legend (6) | Who did it? The masked stranger. The streak. The jinx. The impostor. The countdown |
| Stakes and endings (6) | Last chance. Loser leaves. The farewell. The comeback. The grudge with no end. Passing the torch |

A template can be used three ways: the player starts it on the Storylines page when the cast fits, a rival's booker picks it for its own roster, or a world opens with it already in an act or already in the past. One template, three uses, which is why forty is enough to start.

## 8. The editor's pages

Seven sections across the top, each with a row of pages under it. Every page is one screen in the new look, with the SPACE key on the bottom line saying what it will save.

| Section | Pages |
|---|---|
| World | At a glance. Rules of the world. Packs. Share |
| Companies | One page a company: details and mark, shows, belts, money, cities and venues, the year's schedule |
| People | Wrestlers. Staff and voices. Teams. Stables. Ties. Gimmicks |
| Stories | Running. Templates. Beats. Events. Calls on the headset |
| History | Stories. Champions. Big events. Careers. The company's years |
| Library | Every list. Packs. Names. Cities and places |
| Check | What must be fixed, what is worth a look, and "Play a year, unattended" |

**At a glance** (`world-1-home.png`) shows what is in the world, split into what shipped and what is the player's, and the check. **Every list** (`world-2-library.png`) shows all fifty lists with what ships, what is the player's, and Add or Fixed.

**Packs.** A pack is a file of library entries that can be switched on for a world: a set of moves, a set of story templates, a set of rough stipulations. Core is always on. A shared world carries the packs it needs inside it. This is how a player's forty moves travel to their next world without being typed again.

**Starter worlds.** Four ways to begin: the world that ships, two companies in one town, nine companies of unknowns, nothing at all. Or a copy of another world of the player's.

## 9. What keeps a player's world from breaking

- **Dials have ends.** A stipulation's lift to a crowd has a top. An effect has a largest size. A player can make something strong, not something that breaks the sums.
- **The check.** Three levels: must fix (the world cannot be played), worth a look, and fine. It reads every list.
- **Play a year, unattended.** Runs 48 weeks of every company and reports anything that broke, the way `test-uni.js` does today.
- **People must feel it.** An event or a call whose answers change nobody's tie and leave no memory gets a warning (rule 9b).
- **Chances are worded as chances.** An answer with a chance shows the percentage and what helps and hurts (rule 4).
- **Size.** No fixed limit. Past about 2,000 people or 40 companies a week takes longer to turn, and the page says so.
- **Missing pieces.** If a save needs a library entry that is gone, the game falls back to the nearest shipped one of the same kind and says which.
- **Original content.** Nothing in the box names a real promotion, wrestler, stable, title, move or event, and the repository holds no real rosters (rule 3).

## 10. Engine work, in build order

Each step is a version of its own. None is started.

1. **The package grows.** `src/85-universe.js`: schema version 2 with optional `library`, `stories`, `history`, `rules`, `packs` and `tags`, a migration from version 1, and `E.edCheck` reading all of them. Old worlds and old saves keep working.
2. **The lists that are already nearly data.** Moves, stipulations, match types, entrances, networks, sponsors, cities, venues, name pools. Each moves from a table in code to the library, built from its dials. `E.edAddLib(pkg, list, o)`, `E.edCopyLib`, `E.edLibOff`.
3. **Stories on day one, and the past.** `stories` and `history` in the package, read when a game starts. `E.edAddStory`, `E.edAddPast`, `E.edAddReign`, `E.edPast(pkg, years, seed)` for "Write a past for me". What a past story leaves behind goes through the relationship matrix and memories. Then write the 18 and the 54 for the default world.
4. **Story templates and beats.** The thirteen beats in `src/20-story.js` become data, then grow to sixty. A template names the beats each act may use. This is the same work as the season calendar in the art-direction plan (section 6.9), so do them together.
5. **The two menus.** Conditions and effects as fixed lists with a small reader for each. Then office events, calls, backstage reasons, court cases and life events move onto them one list at a time, shipped entries first. This is the largest step.
6. **Models, traits and styles.** The nine company models become sets of dials. The last to move, because every part of the game reads them.
7. **Rules of the world.** 24 switches read by the parts they touch, and the six eras.
8. **The pages.** The editor's seven sections in the new look, using the ten creators already drawn.

Until a list has moved, the editor shows it as **Opens later**, with its shipped entries listed. Nothing is hidden.

**What each step hands to play (rule 7a).** Step 3 means every new game opens with an ending to book. Step 4 gives the Storylines page things to start. Step 5 gives the week more fires. Step 7 lets a second game feel like a different place.

## 11. Questions for Ryan

1. **The numbers.** 1,172 in the box across 30 lists. Which lists should be deeper, and which can ship thinner?
2. **Day one.** Should a new game open with stories already running by default, with a clean slate as the option? This plan says yes.
3. **How much past.** Five years for the default world. More is cheap once "Write a past for me" exists.
4. **Player-made events and calls.** They need the two menus, the largest step. In for release, or the first big update after?
5. **Sharing.** A world is one file today. Is the Steam Workshop wanted?
6. **Eras.** Is a world with no feed and no boards (news on paper) worth the work on the Net pages?
