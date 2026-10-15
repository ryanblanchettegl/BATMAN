# Run notes, 14 and 15 October 2026

What this run of `NEXT.md` built, what it skipped, and what the next run should pick up. Versions 0.51 to 0.60.

## Built

- **Living storylines** (Ryan's ask, `docs/plans/living-storylines.md`). Feuds have heat and freshness, no length, and end when the booker ends them or fizzle when nobody cares. On top of the first build:
  - stipulations need a hot enough feud;
  - a turn inside a story;
  - an ending in a home town pays more;
  - automatic feud starts: one at a time per wrestler, and a pair rests twelve weeks before they can start again;
  - Backstage asks for the ending of a ripe story;
  - run sheet flags: Boiling, Stale feud, Final chapter.
- **Stories waiting** gained Unfinished business, The long chase and A mutiny in the group. Ryan chose these living patterns over scripted templates (job 4).
- **Big events belong to a company** (job 3): `src/42-events.js`.
  - Twelve events each, every flagship with a name of its own.
  - The Year planner renames an event, gives it a kind of night, or leaves a month dark. It also holds the weekly spend that promotes the next big night.
  - After the show reports the buys against a forecast; Finances keeps every big night.
  - Rivals reshape their own year.
  - World packages and the World Editor carry each company's events.
- **The press scrum** after every big night, and **Who grew** on After the show (8.3).
- **The power ten matters** (8.2) and **momentum flags** on the run sheet (8.4).
- **Rumours can be wrong** (9.2). On this day remembers feuds and great matches.
- **Your cities** on the Company overview (6.5).
- **Contract clauses** (11.1, in part): paid travel, a no-cut promise, a merchandise share and a title match, when signing and when renewing.
- **Balance** (job 12): the giant pays shareholders out of very good weeks, and saves stay under 1.5 MB at week 150. The underdog, roster sizes and free agents were checked.
- **Pages:**
  - History, Overview and Finances: rebuilt so they fit a tablet without cutting anything off.
  - Manage pages: in windows.
  - Titles: the empty window now shows each belt's line of champions.
  - Career: the skills fit.
  - Free agents: fits a tablet.
  - Web: a hover fix on the dirt sheet.

## Skipped, and why

- **Job 4, scripted storyline templates:** Ryan chose living storylines on 15 October. Invasions (11.2) wait for the same treatment.
- **3.4, a second big event in a month:** the game assumes one big night in the fourth week of a month in many places. It needs its own plan.
- **Job 5, the new booking screen:** the run sheet and the show clock already do most of it. What is left (pre-booking the week, fast mode, creative energy) is design work for Ryan.
- **Job 7, networks and streaming:** `src/88-shows.js` covers part of it. The rest is a large system that needs Ryan's choices.
- **Job 10, indies:** not started.
- **11.1, the rest of the clauses:** dates, outside dates, and talks over several rounds.

## Things the next run should know

- `tools/balance.js` answers every inbox matter with its second choice. On PDW, one of those answers gives up the broadcast slot and drains the money. That is the harness, not the game.
- `app/tests/roster.js` sometimes times out picking a style in the wrestler creator. It passes on a rerun.
- A version takes five changes before its number moves. This run put the number up once too early and took it back.
