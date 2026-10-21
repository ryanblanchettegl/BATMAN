# The last booker's mess: how the main game opens

Bill, 21 October 2026: "This is perfect for the main new game mode when we walk through people how to play the game. It's right before the big show of the year, and the previous booker left you with a mess. For a sandbox mode game, this wont happen as you'll get a free start." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea V4). Nothing here is built. One step at a time (rule 9a).

## Two ways to start a game

| Mode | How it opens |
| --- | --- |
| **The main game** (the default, and the one that teaches) | A few weeks before the company's flagship. The last booker is gone and left a mess in the office. Clearing it up is how the player learns the game. |
| **Sandbox** | A free start: no mess, no forced timing, the opening the game has today. For players who know the game or want to build from nothing. |

## The main game's opening

**The timing.** The game starts six to eight weeks before the company's flagship (`P.flagship`), so the first thing the player books toward is the biggest night of the year. The flagship is the end of the tutorial: everything the player cleans up pays off, or blows up, there.

**The office.** The first screen is the previous booker's office, not the desk. The drawers and the desk hold documents, each a real matter in the save, each one teaching one part of the game:

| Document | What it is in the game | What it teaches |
| --- | --- | --- |
| A contract with a title promise in it | A promise (`S.quests`) to a wrestler, due before the flagship | Promises, booking power, the titles |
| A letter from an unhappy star | A wrestler with low morale and a holdout clock running | Morale, Backstage, talking to people |
| A half-planned main event on a napkin | The flagship's main event pencilled in as the long plan (`S.lp`, wish 26), with a feud that is not hot enough yet | Feuds, heat, the long plan |
| The owner's last memo | An owner directive with a deadline | The owner, trust, directives |
| A dirt sheet with a leak circled | A kayfabe secret already out (`src/99-kayfabe.js`) | The Net, kayfabe, rumours |
| Unpaid bills | Cash lower than it should be, a sponsor unhappy | Money, sponsors |

Each document is opened by the player, says in one or two lines what it is and what to do about it, and puts a task on the desk (`TASKX`). The first time only, a line names the mechanic it teaches (as section 0h does today). The player can leave the drawers and go straight to the desk; the tasks are waiting there either way.

**Why it works.** It replaces a tutorial with a mystery, and the first week opens on a fire, as design rule 2a asks. It also explains in story terms why the player has a job: somebody else failed at it.

**It builds on:**
- `src/99-midstory.js`, which already starts the company in the middle of things (challengers for every champion, the worst rivalries already running). The mess is a stronger, hand-picked version of that.
- `src/96-first.js` and TASKS 0h, the required actions of the first year. Their order may need to change: the first flagship now comes within the first two months.
- The kayfabe layer, promises, owner directives, the long plan and sponsors, all built.
- Pre-history (`docs/plans/pre-history.md`). With a real or simulated past, the last booker becomes a real person in the save: their bookings are in the history, the wrestlers remember them, and the owner compares you to them.

**Who the last booker was.** A name and a short line ("fired after a bad flagship", "left for a rival"). If they left for a rival, they are there now, which sets up a rival booker who knows you (idea R5 in the research).

## Sandbox

Today's opening, unchanged: the player picks the company and starts on the world's start date. Create a federation is always a sandbox start (a new company has no previous booker), unless the ten years of simulated pre-history are switched on, in which case it could offer the main game's opening too.

## Steps, in build order

1. **The mode choice and the timing.** "Main game" or "Sandbox" when a game starts; the main game starts six to eight weeks before the flagship. Headless test: every company of the parody world starts on the right week and plays 60 weeks with errs 0 and NaN 0.
2. **The mess, in the engine.** `src/9x-lastbooker.js` builds the six matters from what is true of the company (who is unhappy, which feud fits the flagship, what the owner wants), by hash, never `rnd(S)`. Test: the same world and seed make the same mess.
3. **The office screen.** The drawers and the documents, in the scrapbook look, opening onto the desk's tasks.
4. **The first year re-ordered** around a flagship that comes early (TASKS 0h).
5. **The last booker as a person**, once pre-history exists.

## Open questions for Bill

- Six to eight weeks before the flagship, or a fixed number?
- Does sandbox keep today's mid-story opening (challengers and rivalries already running), or start with nothing running at all?
- Should the main game force the parody world's starting company (EWE), or let the player pick any company?
