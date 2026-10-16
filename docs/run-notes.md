# Run notes, 16 October 2026

Versions 0.64 to 0.68. Ryan: "Lets knock it all out in this go." The queue is worked through; what is left needs him.

## Built

- **Networks** (7.1, 7.3), `src/89-networks.js`: each network has a taste (family, sport, late night, niche) and each deal a ratings target; an executive calls after three misses; a rated show can start a bidding war at renewal. `test-networks.js`.
- **Streaming** (7.4), `src/89-streaming.js`: open a service on Manage, Deals; subscribers pay weekly and grow with the company's size, popularity and tape library; cities you do not tour stay warm; a major network pays a little less.
- **Night wars** (7.5), `src/88-nights.js`: a show on the same night as a rival's in your part of the world goes head to head; the network can offer to move a show onto a rival's night.
- **Indies** (10): a size and a night for each; one closes and one opens each year; corporate companies do not offer outside dates.
- **The ranking** (8.1): belts count, the power ten shows moves since last week, History keeps each year's top 200 (top 25 by name) for two years. The power ten asks more money (8.2).
- **Contract talks** (11.1): meet them halfway, then a last word.
- **Invasions** (11.2), `src/81-invasion.js`: a war starts with a deal on the finishes; a war lost badly leaves a company weak for a year. `test-invasion.js`.
- **The road** (6.4): sell-out streaks, a bigger building after a sell-out, cold nights in winter.
- **Smaller:** the kind of big night named on the desk, the schedule, the week list and Book the show; Book the show says what carried over, who is hurt, and the rival on your night; Help and the glossary are a row of topics that fits one screen.
- **Save size:** 1.47 to 1.50 MB at week 152. Every 26 weeks a wrestler's numbers are rounded to three places.

## Left for Ryan

- **5.4 and 5.7:** a new slot screen and booking the whole week ahead. Both rework the card builder, which already fits one screen.
- **5.9 Fast mode:** not built, because running a show without the broadcast breaks his rule that a show on the air cannot be skipped.
- **Job 4:** scripted storyline templates. Not built; he chose living storylines.
- **Building by hand:** the road books the building, so picking the town and building by hand (TASKS) is ticked as done another way. He may still want it.

## Things the next run should know

- `app/tests/roster.js` no longer flakes on the creator's style picks.
- Files that wrap another file's functions must sort after it (`89-networks` after `88-shows`, `81-invasion` after `80-world`).

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
- `app/tests/roster.js` used to time out picking a style in the wrestler creator (the preview lay over the pick). Fixed 16 October: the test presses the pick through the page.
- A version takes five changes before its number moves. This run put the number up once too early and took it back.

# Run notes: the add-ons run, Phase 0 (fixes), versions 0.73 to 0.77

Built:
- 0.73 Balance (TASKS 11). The biggest cause was a bug: the mutiny meeting's clock was never reset when the owner calmed the room, so it fired every few weeks and cost 6 owner trust each time. Fixed; the owner also takes a middling show calmly, and income-linked overheads are 4% lower. Before and after tables: `docs/balance-0.73.txt`. The underdog now survives 100 weeks on suggested cards on all three seeds; no company more than about triples its cash (the underdog 3.7x).
- 0.74 One version number: `VER` in `app/src/store.ts`; the build writes it into both package.json files and the README.
- 0.75 Build order: every file that wraps another file's functions has a `wraps:` header; `test-buildorder.js` reads it and also finds wraps in the code, and fails when one sorts too early. It found a real one: `85-history.js` wrapped `buildDB` from `85-universe.js` while sorting before it (it only worked by hoisting); renamed `86-history.js`. Added to `npm run check`.
- 0.76 `docs/INDEX.md`: what each planning file is for and which is current. Nothing deleted.
- 0.77 Legal housekeeping: the notes on who each parody character is based on moved to `private/` (gitignored); history still has them (decisions-needed). The modding guide asks for legal review before sharing a real-life roster. No licence chosen; options listed for the owner.

Skipped or left: on suggested cards the giant is still fired on two seeds of three, and two companies go broke on one seed each (decisions-needed). Nothing published.
