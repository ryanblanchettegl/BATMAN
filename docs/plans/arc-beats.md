# Company arcs that start from what happens

Bill, 21 October 2026: "E3 - This is a key feature, Company Arcs need to start from beats that happen from specific events happening. build out this idea and add it as a task." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea E3). Nothing here is built. One step at a time (rule 9a).

## Where arcs stand today

`src/99-arcs.js`. Three arcs (the faction takeover, the hostile authority, the brand split), picked from a list in the month after the flagship. Each is a fixed chain of three or four chapters that arrive on the desk on a timer spread across the year, each with three answers that move how well the arc is landing (`arc.s`, 0 to 100), then a last chapter and a payoff at the flagship. The cast is chosen from what is true of the roster, which is good. What is missing: an arc never starts because of something that happened, and its chapters come on a clock, not because of anything the player booked.

## The change in one paragraph

An arc starts from an **event**: a betrayal, a title change, a rival folding, a star coming back, the owner putting an authority figure on screen. That event is the arc's first beat, and the game offers it to the player as the story of the year. After that, the arc moves forward through **beats**, each fired by something that happens in the game (a live call answered, a match result, a relationship crossing a line, an injury, a leak), with a chapter on the desk only as a fallback when nothing has happened in time. An arc type is a **shape** (setup, rising beats, a twist, the stakes, the payoff), not a script. It still runs one a year and pays off at the flagship, where the wrestling year ends.

## 1. Seeds: the events that can start an arc

A seed is an event that happens anyway in the game. When one happens, the game checks whether it could become a year-long story and, if so, offers it on the desk: "This could be the story of the year." The player runs with it or lets it pass. Several seeds can come up in a year; only one arc runs at a time.

| Seed (what happened) | Where the game already knows it | The arc it can start |
| --- | --- | --- |
| A tag partner or stable mate turns on the others | The jealous partner in `src/66-relations.js`, live call 38 (`docs/plans/live-events.md`), stable unity in `src/60-rpg.js` | **The faction takeover**, or **Civil war** inside a stable |
| A clique with a top star starts throwing its weight around | Cliques in `src/86-room.js` | **The faction takeover** |
| The owner puts an authority figure on screen | The first year's required action (`src/96-first.js`), the on-screen boss (wish 34) | **The hostile authority** |
| The roster outgrows its shows, or a second weekly show is added | `src/87-create.js` (a new show needs an occasion) | **The brand split** |
| A rival company folds, or a working agreement sours | Rivals that die (wish 62), `src/80-world.js`, `src/81-invasion.js` | **The invasion** |
| A star returns after a long injury or a long time away | Comebacks (wish 12), the release and return idea (P3) | **The comeback** |
| The breakout clock fills for a young wrestler | `src/77-backstage.js` | **The chosen one** |
| A veteran announces a final year | The last year (wish 10, `src/82-wishes.js`) | **The last run** |
| Two members of a wrestling family fall out | Family ties in the world's relationships | **Blood feud** |
| A student passes the teacher | `src/76-student.js` | **The student and the master** |
| You raid a rival's star, beat their big night in the same city, or win a ratings war week by a mile | `src/80-world.js`, `src/88-nights.js`, rival owners (wish 59) | **The rival booker** (section 4b) |

If the month after the flagship ends with no seed taken, the game offers today's list as it does now, so a year is never without an arc.

## 2. Beats: how an arc moves

A beat is a piece of story with roles, a condition and an effect. It is data, one entry in a `BEATS` table:

| Field | What it holds |
| --- | --- |
| `id`, `n` | A name ("The right hand walks out") |
| `kind` | `seed`, `rise`, `setback`, `twist`, `stakes` or `payoff` |
| `fits` | The shapes it can appear in (faction, authority, split, invasion, comeback...) |
| `roles` | Who it needs, by role in the arc (`lead`, `hero`, `a`, `traitor`) or by what is true of them (a champion, someone with real heat with the lead) |
| `when` | What has to be true for it to fire (a match between two roles, a call answered a certain way, a bond past a line) |
| `fire` | The event that makes it happen (see section 3), or `offer` for a chapter on the desk |
| `does` | What it changes, using the effects arcs already have: bond changes, a join, a betrayal, a firing on screen, a turn, the room's morale, a split, a title on the line |
| `s` | How much it moves how well the arc is landing |

Today's twelve chapters become the first beats, so nothing is lost.

## 3. Events that fire beats

The game watches for these while an arc is running. When one involves the arc's cast and a beat that fits is waiting, the beat fires, the desk says so ("The faction takeover: Klaus Cuckoo walked out on Barbwire Burke tonight"), and the arc moves.

| Event | Beat it fires |
| --- | --- |
| A live call answered on the night (a run-in, off the script, the jealous partner, the cash-in, the turn is ready) | The matching rise, twist or turn |
| A match between two of the cast, and who won it | A rise for the winner's side, or a setback |
| A title changes hands to or from the cast | Stakes, or a setback |
| One of the cast is hurt | A setback ("the hero is down"), and room for somebody new to step up |
| One of the cast's contracts is running out (the kayfabe secret) | A twist ("will they leave?") |
| The planned ending leaks (`src/99-kayfabe.js`) | A twist: change the ending, or own it |
| A bond in the cast crosses the friends-or-enemies line | A join or a betrayal |
| The crowd turns on the hero (wish 70) | A twist: lean in, or fight it |
| A rival company signs one of the cast | A setback, or an invasion beat |

**The fallback.** If an arc has gone a set number of weeks with no beat, the next fitting beat is offered as a chapter on the desk, as today. A beat that fires from something the player booked counts for more (`s`) than one taken from the desk, so a booker who builds the story on the show is rewarded over one who answers matters.

## 4. Shapes

A shape says what kinds of beat an arc needs and in what order: a seed, two to four rises or setbacks, at most one twist, the stakes, then the payoff at the flagship. Any beat that fits the shape and the cast can fill a slot. The same shape plays differently every year because the beats come from what happened.

New shapes this makes possible, beyond today's three: the invasion, the comeback, the chosen one, the last run, civil war, blood feud, the student and the master, and the rival booker.

## 4b. The rival booker (Bill, 21 October: "R5 - this should be a story arc")

From the killer features research (idea R5, "a rival booker who knows you"). One rival company's booker becomes your career rival, and their year-long war with you is a company arc, not a background number.

- **The seed.** You hurt a rival company in a way that is personal: you raid their star, put your big night against theirs in the same city and win, or beat them in the ratings by a mile. Their booker takes it personally, and the desk offers it as the story of the year.
- **The booker as a person.** A name, a temperament (from the rival owner's, wish 59), habits (the shelved idea E17: likes stars, likes stunts, books the same finish), and a record of what you did to them, kept as memories like a wrestler's (`youRemember()`).
- **Beats, fired by what happens** (section 3): they raid one of your people (a setback); they run their big show against yours (stakes); they talk about you in the dirt sheet and the magazine (0af); one of your people with a grievance (P3) turns up on their show (a twist); you win a ratings week (a rise); a working agreement or a peace offer (a twist); a leak from your room reaches them (Backstage Politics).
- **The payoff at the flagship.** The war is decided by your flagship against their biggest night of the year: ratings, crowd, who signed whom. Beat them and their owner fires them; lose and your owner hears about it.
- **It does not end with the year.** The booker is kept in the history. A fired booker turns up at another company, or as a rival booker again a year later, remembering. If you change jobs (wish 90), they can follow you. Their replacement has heard of you.
- **Not the Nemesis system.** It is a rivalry between two companies' bookers through business decisions, kept clear of that patent (see `docs/plans/come-back-changed.md`).

## 5. The Director, scenes and modders

- **The Director** (`docs/plans/director.md`) treats a waiting beat as a high-value event and paces offered chapters around the rest of the week.
- **Scenes** (TASKS 0u, rule 9c): every beat gets a scene, as arc chapters are already meant to.
- **Modders** add beats and shapes as data in the World Editor's Stories tab, checked like the other world tables.

## Decision this changes

Ryan, 16 October: "Company Arcs, picked once a year." Still one arc a year ending at the flagship. What changes is how it starts (from an event, with the list as a fallback) and how it moves (beats fired by events, chapters as a fallback).

## Steps, in build order

1. **The beat format.** `BEATS` and shapes as data; today's three arcs ported onto them with the same chapters as offered beats. Headless test: the three arcs still start, run and pay off over 60 weeks with errs 0 and NaN 0.
2. **Seeds.** The watcher that turns the events in section 1 into an offer on the desk, with the old list as the fallback after the month following the flagship.
3. **Beats fired by events.** The events in section 3, the fallback timer, and more credit for beats the player booked. Test how often beats fire on their own over 60 weeks of every company and say so in the commit.
4. **New shapes**, one at a time, each shown to Bill: the rival booker first (section 4b, Bill asked for it), then the invasion, the comeback, the chosen one, the last run, civil war, blood feud, the student and the master.
5. **Beats in the World Editor**, for modders.

## Open questions for Bill

- Can a seed that comes late in the year (a few weeks before the flagship) be saved to start the next year's arc?
- Should the player be able to turn down every seed and run no arc at all?
- Does a beat that fires on its own need the player's say-so, or does it just happen and get reported?
