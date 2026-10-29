<!-- Text copy of the PDF beside it (pdftotext -layout), so it can be searched. The PDF is the source. -->
WrestleCraft roadmap: what to build first, what waits, what to cut

 WrestleCraft roadmap: what to build first,
 what waits, what to cut

   Oct 21, 2026 � @Bill

 The short version

  Stop adding systems and make the live show the thing every other system feeds. The
  game has 102 engine files and more than 450 open, planned or wished-for items across
  nine lists. The killer features PDF names the core: you run the show live from the gorilla
  position, and people remember every call you make. Every item below was judged on one
  question: does it make the live show, or the week that feeds into it, better and easier to
  feel?

      Build first (next 4 to 6 weeks): clean up the lists and fix known bugs. Then make the
      show louder: a mid-card act catching fire on air, more kinds of call, decisions that feel
      big, commentary that remembers, word that travels through the locker room, and a
      Director that paces the fires.
      Then give it a past and a first hour: simulated pre-history, backstories, the last
      booker's desk as the tutorial, and the black book.
      Ship it: the Steam build has never talked to the Steam client, no Windows installer
      exists, and the gamepad has never been tried on hardware. These gate the launch more
      than any feature.
      Wait until after launch: the GM skill tree, owner mode, most of the creator suite,
      multiplayer, new modes and the tycoon ideas.
      Cut: fast mode leftovers, pre-booking the week, picking the building, fixed-length
      feuds and storyline templates, five goals for every show, the four-kinds-of-fan
      proposal, and anything left from the DOS, tablet and TV eras.
  One risk sits above all of these. The art direction changed five times between 6 and 19
  October (grey windows, paper Macintosh, scrapbook, workbench). Each change
  reopened "move every page to the new look". Lock the workbench look now, or the art
  queue will keep eating the feature queue.

                                                                                                                                                                                                                                                    Page 1 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

What was read

Everything below comes from the repo at version 0.88 (last merge 20 October) and the
killer features PDF. The GitHub repo has no open issues and the code has no TODO or
FIXME comments, so the lists are the whole backlog.

Source                                                              Open items                State

TASKS.md                                                            144 unticked boxes        Many are stale: sections 3
                                                                                              to 9 were finished another
                                                                                              way through NEXT.md , and
                                                                                              sections 0v, 0w and 0x
                                                                                              appear twice

docs/roadmap.md (the next 30) 16 (items 15 to 30)                                             Items 1 to 14 done. The
                                                                                              current work queue

docs/plans/week-of-20-                                              8 steps                   Living world work; mostly
october.md                                                                                    built ( 99-reigns , 99-
                                                                                              midstory , 99-worldweek )

WISHLIST.md                                                         1 (wish 25, storyline     97 of 100 done
                                                                    templates)

docs/proposals/                                                     3 (four kinds of fan, owner Decided in TASKS.md , not

                                                                    mode, trouble in public)  built

docs/plans/ (characters,                                            About 40 steps            Characters plan waits on
creator suite, storylines, gorilla                                                            decisions
position)

docs/ideas/a-plus-plus-                                             200 ideas                 A list to ponder, nothing
plus-plus.md                                                                                  promised

IDEAS.md                                                            100 ideas                 Shelved on 3 October

Killer features PDF                                                 17 ideas                  Research, 21 October

Known bugs from docs/decisions-needed.md and the run notes are counted under Build
first.

                                                                                                                       Page 2 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

Build first, in this order

The order goes from cheap to deep. Each step makes the live show louder before any new
system is added. Sizes follow the repo's own scale: S is about a commit, M a few, L a
planned project.

Step 0: clear the ground (about a week)

# Item                                                              Source     Size Why now
                                                                    All lists
0.1 One backlog. Untick nothing;                                               S  The design doc still
         mark the stale TASKS.md                                    CLAUDE.md
         boxes done or cut, remove                                                describes a DOS look,
         duplicate sections, retire                                 rule 2a
          IDEAS.md and docs/next-                                                 tablet and TV modes, and
         round.md , rewrite the stale
         parts of docs/design.md                                                  "the odds decide who

0.2 Lock the workbench look and                                                   wins". Every future run
         freeze art direction changes
                                                                                  reads it

                                                                               S  Five looks in two weeks

                                                                                  reset the page-by-page

                                                                                  queue each time

0.3 Fix Suggest a card when a                                       Run notes  S  Weekly shows with two
         parody brand runs thin                                     0.83
                                                                                  matches break the first

                                                                                  impression

0.4 Fix the desk map when a city                                    Decisions  S  The desk is the first screen
         has no state outline                                       needed
                                                                                  of every week

0.5 Give WPW's belts their                                          Decisions  S  Vacant belts flood the first
         holders                                                    needed
                                                                                  week with title changes

0.6 Stretch the stars (two stars is                                 TASKS.md   M Stars are the show's main
         bad, four and a half is rare)                                                  payout; they need range
                                                                    0o.4

0.7 The giant fired on 2 of 3 seeds, Decisions                                 M Balance check, not a
                                                                                        feature
two companies broke                                                 needed

                                                                                                           Page 3 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

Step 1: make the show louder (3 to 4 weeks)

# Item                                                              Source       Size What it does for the core

1.1 Catching fire, live. A mid- PDF E2,                                          S to  The quickest win. The
                                                                                       design doc names it as
card act outperforming                                              design.md 2a M     missing

gets a call: more time, a mic

after, or stick to the sheet

1.2 More kinds of call: a                                           TASKS.md 0e M      More variety in the one
                                                                                       screen that makes the
manager at ringside, a                                                                 game unique

debut, a walk-out, a double

turn, a referee who misses

the finish, a rival's star in

the building

1.3 Every show leaves                                               TASKS.md 0i  M     The one-more-turn rule, at
                                                                                       the hand-off from Show to
something. Today one                                                                   Office

show in four leaves a

matter. Add causes: a soft

house, real heat, a promo

off the script, a rival's offer,

an unhappy sponsor

1.4 Decisions that feel big.                                        Roadmap 23 to M    Calls are the core moment;
         Concepts, then build the                                   25                 they should look like it
         picked one for calls and
         matters

1.5 The show tells one story.                                       Roadmap 26,  M to  Fold P4 (voices) in here; it is
         Commentary that                                            27, PDF P4   L     the same grammar work
         remembers last week,
         catchphrases, the crowd
         as a character, sponsor
         spots

1.6 Word travels, and                                               PDF R4,      S     Every call ripples; small to
                                                                                 then  build on youRemember()
wrestlers remember each roadmap 29b                                              M

other. How you treat one

person moves their

friends; memories

between wrestlers

                                                                                                                Page 4 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

# Item                                                              Source             Size What it does for the core

1.7 The hallway. Three to five PDF R2                                                  M     Makes the relationship
         overheard lines a week,
         picked by what just                                                                 matrix audible without a
         happened
                                                                                             new mechanic

1.8 The Director. Confirmed                                         PDF E1             M     Gives "the office opens on a

by Bill on 21 October. A                                                                     fire" a shape instead of flat

weekly tension score                                                                         chances. Absorbs

(open matters, clocks,                                                                       TASKS.md 0h dynamic

morale, cash, feud heat)                                                                     required actions

picks which eligible events

fire, with three personas

the player chooses: the

Promoter, the Carny, the

Purist. Start with the score

in tests only, then let it

choose

Step 2: a past, and a first hour (4 to 6 weeks)

# Item                                                              Source             Size      Why

2.1 Decide the default                                              Characters plan,   Decision  Everything in this step
                                                                                                 depends on it, and so
world (original, parody, decisions 1 and 2                                                       does the legal position
                                                                                                 at launch
or both)

2.2 Simulated pre-history.                                          PDF P1             L         Gives sifting, callbacks
         Run 10 to 25 years
         before day one                                                                          and "they have history"

                                                                                                 real material from week

                                                                                                 one. Check generation

                                                                                                 time and save size first

2.3 Backstories from what PDF P2, characters M                                                   One job: the plan's
                                                                                                 generator is P2
happened, plus the                                                  plan steps 1 to 3

backstory block and

traits

                                                                                                                       Page 5 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

# Item                                                              Source           Size       Why
                                                                                     M          Replaces a tutorial with
2.4 The last booker's desk PDF V4, TASKS.md                                                     a mystery. The first
         as the opening, with the 0h                                                 M          hour is where 100
         first-year required                                                                    systems bury the core
         actions folded in (the                                                      M
         authority figure before                                                                Turns the kayfabe layer
         the third big event)                                                        S, then    and promises into play
                                                                                     M
2.5 The black book. Secrets PDF R1, proposal,                                                   A face for the world;
                                                                                                rivals already keep
and favours you can                                                 TASKS.md                    feuds since 20 October

hold and spend, both                                                decisions                   17 is cheap and makes
                                                                                                arcs part of the record
ways. Trouble in public

(decided: build it, gritty)

feeds it secrets

2.6 Rivals react to you.                                            Roadmap 29, PDF

Rival companies raid                                                R5

your stars and answer

your moves, with one

rival booker who knows

you

2.7 Arcs on the Net and in Roadmap 17, 15, 16
         History, then the
         invasion and plain-build
         arcs

Ship it: release blockers

The recorded decision is a full Steam release, not early access. None of these are
features, but each one can stop a launch, and none has been run yet. Start them alongside
step 1, because they need hardware and accounts more than code.

Blocker                                                             State today                 Source

Steam calls (achievements,                                          Written, never run against the TASKS.md 12,
Workshop upload)
                                                                    Steam client                commercial roadmap
Windows installer and icon
                                                                    Not built; needs a Windows  Commercial roadmap
                                                                    host

                                                                                                                 Page 6 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

Blocker                                                             State today                  Source
                                                                                                 TASKS.md 12, 0
Gamepad and Steam Deck on                                           Simulated keys only          CLAUDE.md rule 0
real hardware
                                                                                                 TASKS.md 0v
Diorama renderer at 60 fps on a                                     Rule 0 target, not measured
Steam Deck, with a quality                                                                       Decisions needed
setting                                                                                          NEXT.md 12.6

Workshop: wrestlers and whole                                       Planned for every creator;
worlds only, with a file check and                                  ship two kinds first
a report button

Licence and the parody world's                                      No licence chosen; parody
legal footing                                                       notes still in git history

Save size over a long career                                        Fine to about week 150;
                                                                    recheck after pre-history
                                                                    (2.2)

Build with the art

These show the game the player already has. Build each one only when the piece of art it
rides on is ready, not before.

Item                                                                Source               Rides on
                                                                    PDF R3               Wrestlers remember each other
The corkboard: the locker room as                                                        (1.6), cliques
photos and red string                                               PDF V1, idea         The desk in the workbench look
                                                                    46
The office that remembers: objects                                  PDF E4               Create a Scene templates (poster,
from great nights on the desk                                                            magazine cover already exist)
                                                                    TASKS.md
The year in paper: a shareable zine                                                      Create a Scene
of the year. Merge in the poster                                    0w
maker (idea 101) and the season
card (idea 162)

More stills: the trainer's room, the
parking lot, the owner, a contract, a
mutiny

                                                                                                                   Page 7 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

Item                                                                Source                Rides on

Scenes for invasions and arc                                        TASKS.md 0u Arcs (2.7)
chapters
                                                                    PDF V3                The road and venues
Buildings that remember: crowd
signs, banners, heat for a return to                                TASKS.md 0u Locked art direction (0.2)
the scene

The build-a-match screen and the
show on the air redone in the paper
look

The locker room as a place (PDF V2) also belongs here, but it is the biggest of these. Do it
last.

Wait until after launch

These are good ideas, but each one adds a layer beside the live show rather than feeding
it. Build them on a game that has already shipped.

Item                                                                Source                Why it waits
                                                                    Roadmap 18 to 22
The GM skill tree, points, level                                                          Five branches is a lot of new
notifications, legacy score                                                               numbers. If it comes back, make
                                                                                          perks change the calls on the
Owner mode                                                          Proposal; decided     air (an extra answer, a better
                                                                    "after release"       read) so it feeds the core. The
                                                                                          legacy score is the cheap part
Creator suite expansion:                                            TASKS.md 0v, creator  worth keeping
Create an Arena, a Prop, a                                          suite roadmap
Show, a Poster, thrown props,                                                             Already decided. It also takes
the animation timeline, Blender                                                           you away from the gorilla
parts with sockets                                                                        position, so it needs a rethink

                                                                                          The creators built so far are
                                                                                          enough for launch. Each new
                                                                                          one is a product of its own

                                                                                                               Page 8 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

Item                                                                Source            Why it waits
                                                                    TASKS.md 0x, 0v3  Polish once the look is locked
Blender renders of the
interface pieces                                                    PDF E3            Rewards everything above
Arcs built from beats                                                                 being in place; port the three
                                                                                      arcs first
They come back changed                                              PDF P3            Strong idea, but get legal advice
                                                                                      on the Nemesis patent first
Careers: fired, a job elsewhere,                                    Roadmap 30        Long-game content; most
your own company after ten                                                            players will not reach it before
years                                                                                 launch reviews
                                                                                      Clauses and talks already give
Contracts by appearance, 6                                          Roadmap 28        contracts depth
months to 3 years                                                                     Small, but none fixes a problem
                                                                                      players have today
Pre-show extras: sponsor                                            TASKS.md 0g
segments, a closing angle after                                                       Good depth for fog of war, after
the main event, shows of other                                                        launch
lengths
                                                                                      A second game beside the
More reads to learn (style                                          TASKS.md 0g       booking game
clashes, who draws where,
hidden traits)                                                                        The deterministic engine makes
                                                                                      asynchronous play possible
Tycoon ideas: build an arena,                                       Ideas 21 to 40,   later; nothing about it is needed
own a studio, buy a rival,                                          TASKS.md 10       now
shares, concessions

Multiplayer (ideas 61 to 80) and 200 ideas
new modes (81 to 100)

No longer makes sense

These are still open in a list somewhere, but a later decision or a built system has
overtaken them. Close them so no future run builds them by mistake.

                                                                                      Page 9 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

Item                       Where it is still open                   Why it no longer fits
Fast mode, and the         TASKS.md 3 and the decisions
Assistant panel on Career  table; 0g open question                  Decided 16 October: no fast
                           NEXT.md 5.7, TASKS.md 3                  mode. A show on the air
Pre-book the week                                                   cannot be skipped, and that
( S.cards )                TASKS.md 4, design.md 2d                 rule is the core. Remove the
                           TASKS.md 0q steps 4 to 7,                panel
Pick the city and the      storylines plan
building before a show                                              Each show now changes the
                           Wish 25, TASKS.md 2                      next (feed, calls, matters). A
Short, medium and long                                              card booked before
feuds; rivalries as a      TASKS.md 0g step 5                       Monday's show is stale by
separate system ( S.rv )                                            Friday. Draft cards for a big
                                                                    night (idea 187) cover the
Storyline templates with                                            real need
fixed beats
                                                                    Decided 16 October: the
Five goals for every show                                           road picks the building.
                                                                    Markets and sell-out streaks
                                                                    are built

                                                                    Living storylines replaced
                                                                    fixed lengths. Rivalry history
                                                                    is better carried by sifting
                                                                    and wrestlers remembering
                                                                    each other (1.6) than by a
                                                                    second system

                                                                    Overtaken by living
                                                                    storylines and company
                                                                    arcs. If templates come
                                                                    back, it is as arcs built from
                                                                    beats (PDF E3)

                                                                    A checklist on every show
                                                                    competes with reading the
                                                                    crowd and the story. The
                                                                    owner, the network and
                                                                    promises already set
                                                                    targets; the Director (1.8)
                                                                    can raise one when it
                                                                    matters

                                                                    Page 10 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

Item                        Where it is still open                  Why it no longer fits
Creative energy             TASKS.md 3
                                                                    Left out 16 October:
Four kinds of fan           Proposal                                freshness already does this

Every page moved to the     TASKS.md 0p, 0v2, 0w, 0x                Audience share with six
paper look, the scrapbook                                           groups was built ( src/99-
look, the grey windows                                              audience.js ). Close the
                                                                    proposal
DOS look, CRT filter, scan  docs/design.md 5 and 6
lines, tablet and TV                                                Overtaken by the
modes, 860px breakpoint                                             workbench look. Keep one
                                                                    "move pages to the
Terminal mode, theme        Ideas 90, 179, 164                      workbench look" task
packs, a companion phone
app                                                                 Rules 0, 2a and 5 replaced
                                                                    them
A second big event in a     Run notes
month                                                               Each works against the
                                                                    hand-made look or the wide-
The startup's TV-deal       TASKS.md 5                              screen rule
pressure moved onto
networks                                                            Decided: one big event a
                                                                    month, always
IDEAS.md (the next 100) Repo root
                                                                    Decided 16 October: it stays
                                                                    on the broadcast slot

                                                                    Shelved 3 October. Archive
                                                                    it so it stops being read

Decisions for Bill

These need an answer before step 2 starts. Nothing in this plan changes code; it is a
reading of the lists.

    Lock the workbench look as final until launch?
    Default world at launch: an original world, the parody world, or both (characters plan,
    decisions 1 and 2)?

                                                                    Page 11 of 12
WrestleCraft roadmap: what to build first, what waits, what to cut

      Cut the items in "No longer makes sense" from TASKS.md and the plans, and archive
       IDEAS.md ?
      Shrink the GM skill tree to perks that change the calls on the air, or drop it until after
      launch?
      Trouble in public was decided as gritty. Build it as a source of secrets for the black book
      rather than as its own event chain?
  Worth noting: rule 9a says one step at a time with a go-ahead between steps. With this
  many steps, a weekly batch of three to five approved items would move faster without
  losing control.

                                                                                                                                                                                                                                                  Page 12 of 12

