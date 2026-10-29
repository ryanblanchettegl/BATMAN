<!-- Text copy of the PDF beside it (pdftotext -layout), so it can be searched. The PDF is the source. -->
WrestleCraft: Review and Master Plan

WrestleCraft: Review and Master Plan

 Oct 21, 2026 � @ Bill

The verdict

WrestleCraft has the best idea in its genre and is not yet the best game in it. The live show
run from the gorilla position, with people who remember every call, is something no
booking sim on Steam does as well, and the paper diorama broadcast is the most
charming presentation the genre has had. But today the game can be coasted for two
years without getting fired, its numbers contradict each other, and the first hour is
chores. I would grade it B- today, with a clear road to A.

Question                              Short answer                         Confidence
Is it fun?
                                      The core loop is fun for a           Medium. Based on the 30-run
Is it commercially                    wrestling fan. Today it lacks        balance probe and the play-
viable?                               stakes, so the fun leaks out after   through in the earlier review,
                                      a few weeks. Fix balance and it      plus a read of the code and
Is it better than the                 holds.                               plans; I did not play it again for
others?                                                                    this doc.

                                      Yes, as a niche indie. A realistic   Medium. Built from competitors'
                                      first year is roughly 8,000 to       Steam review counts and a rule
                                      20,000 copies at $24.99. It is not   of thumb, not market data.
                                      a living for a team, but it can pay
                                      back and build a franchise.

                                      On presentation and the live         High on the comparison, medium
                                      show, yes. On depth of data,         on how players will weigh it.
                                      modding and balance, Total
                                      Extreme Wrestling is still ahead,
                                      and Pro Wrestling Sim plays
                                      cleaner today.

The biggest danger is not a competitor. It is scope. In one day the project approved 14 new
feature sections, 13 long-game features, a corkboard, a podcast and a visual storytelling
plan, about 1,400 lines of plans in PR #6, on top of a game whose basics are unfinished.

                                                                                       Page 1 of 13
WrestleCraft: Review and Master Plan

  Bill's call to pause new features until balance is fixed is the right one, and the plan below
  keeps to it.

 The game today (version 0.88)

  The engine is A-grade and the experience on top of it is C-grade. This section builds on the
  earlier game review, which built the game, ran all 50 headless tests and 30 two-year
  balance runs, and played it at 1920x1080.

 Is it fun?

  The fun is real, and it lives in three places:
      The gorilla position. Calls arrive because something true happened on the night: a rival
      at the curtain, the owner wanting a favourite to win, a hot crowd begging for a title
      change. Each answer costs something with people who remember it. This is the
      moment players will clip and stream.
      A locker room with memory. Backstage reads like real catering-table politics, and
      choices stick through the relationship matrix. Bill's approved plans (word travels, the
      hallway, come back changed) all deepen exactly this.
      Writing. Commentary, the dirt sheet and the Net are varied, funny and true to the
      game state.

  Three things drain that fun today:
   1. No stakes. In 30 two-year runs using only Suggest a card and the safe answer to every

      call, nobody was fired, and about 25 bookers were handed the company. A
      management game you cannot lose is a toy. Phase 1, already under way, fixes this.
   2. Mixed signals. Shows grade B and A while popularity falls 9 to 13 points and cash falls
      $42M to $78M. The player cannot tell which number matters, so good play does not feel
      good.
   3. A slow, admin-heavy start. The first desk asks for two commentators and a sponsor
      review, the owner's letter is in the retired terminal style, and the game's own suggested
      card grades C with "Lost the crowd". The first impression is failure and paperwork.
  Two smaller drains: too many voices compete for attention each week (desk, tasks, inbox,
  writers, road agent, feed), and audio is synthesised music and blips with no crowd, bell or
  pops. For a game built around a live show, sound is half of it.

                                                                                                                                                                                                                                                    Page 2 of 13
WrestleCraft: Review and Master Plan

 What is strong under the hood

      102 engine files that feed each other through people, memory and money, all seeded
      and repeatable.
      50 headless tests and about 40 browser tests, all passing except one tablet check that
      is no longer a target.
      A clean split: the engine owns the state and the screens never write to it. That makes
      balance work safe.

 What is weak

      Readability of code. 1.3 MB of dense ES5, with some functions rewritten in later files
      up to six times. It works, but each new feature costs more than the last.
      Steam readiness. The Electron wrapper launches, but Steam calls have never run
      against the Steam client, there is no Windows installer or icon, one save slot, a save
      failure is never reported, and there is no settings screen for resolution or audio.
      Visual churn. The art direction changed five times between 6 and 19 October. Each
      change restarts "move every page to the new look".

 What "everything we just added" is

  PR #6 (branch claude/director-plan ) adds 17 plan files and about 1,400 lines to
  TASKS.md and docs/plans/ . It holds no code. The plans are good: each has headless-
  test-first steps, ties into existing systems, and records Bill's exact words. The problem is
  volume. The 14 newly approved sections (TASKS 0aa to 0an) hold 69 numbered steps,
  before the 13 long-game features, the creator suite and the 16 older roadmap items still
  open. That is more than a year of work at the current pace, which is why the plan below
  draws a launch line.

 Is it commercially viable?

  Yes, as a focused niche game, and the timing is good: the genre leader is not on Steam, but
  at least four new booking sims are arriving there in 2026. The market is small and loyal.
  Success depends on launching with a polished first hour, a demo and a clear hook, not on
  more features.

                                                                                                                                                                                                                                                    Page 3 of 13
WrestleCraft: Review and Master Plan

The competition on Steam

Game                                  Price Released         Steam reviews     What it means for
                                                                               WrestleCraft
Total Extreme                         $34.95 Aug 2024        Not on Steam;
Wrestling IX                                                 sold direct with  The deepest sim, 20+
                                                             a free trial      years of fans and mods.
                                                                               Its absence from Steam
Pro Wrestling                         $19.99 Mar 2021        669, 97%          leaves the store's shelf
Sim                                                          positive          open.

Wrestling                             $19.99 Jul 2021        3,164, 94%        The closest comparison:
Empire                                                       positive          text-based, clean, loved.
                                                                               Shows the ceiling for a
Believr Pro                           not      Jan 2026, early 27, mostly      pure booking sim on
Wrestling                             listed                                   Steam.
                                               access        positive
                                                                               An action game with a
Booker Blitz                          not yet  Early access  none              booking career. Proves
                                               planned Nov                     wrestling fans buy
                                               2026                            charming, low-budget
                                                                               indies.
Territory                             not yet  Coming soon   none
Titans: Booking                                                                New indie promotion
Wars                                                                           sim; a weak start shows
                                                                               how hard visibility is.

                                                                               The direct threat. Its
                                                                               store page leads with a
                                                                               "Gorilla Position" for live
                                                                               match control: run-ins,
                                                                               changed finishes, cut or
                                                                               extended matches. It
                                                                               has a demo, Steam
                                                                               Cloud and
                                                                               achievements. Most of
                                                                               its wrestlers, belts and
                                                                               logos are AI-generated.

                                                                               Territory-era
                                                                               management sim;
                                                                               overlaps the territory
                                                                               map idea.

                                                                               Page 4 of 13
WrestleCraft: Review and Master Plan

Game                                  Price Released   Steam reviews      What it means for
                                                       none               WrestleCraft
Pro Wrestling:                        not yet Q4 2026
The Ascent                                                                Text career sim; overlaps
                                                                          the planned wrestler
                                                                          career mode.

Outside the indie shelf, WWE 2K's MyGM mode gives casual fans a light, licensed booking
game every year inside a full-price wrestling game. It sets expectations for presentation,
not depth (from memory, not checked for this doc).

How big could it be?

A common rule of thumb puts Steam sales at about 30 to 60 copies per review. On that
rule, Pro Wrestling Sim has sold roughly 20,000 to 40,000 copies over five years and
Wrestling Empire roughly 100,000 to 190,000. These are estimates, not reported figures.

Case First-year                       Gross at  After Steam's 30%,        What it takes
           copies                     $24.99    refunds and regional
                                                pricing (about 55% kept)  Launch with today's
Low 2,000 to                          $50K to   $28K to $55K              balance and first hour; no
           4,000                      $100K                               demo.
                                                $110K to $275K
Base 8,000 to                         $200K to                            Phases 1 to 5 done, a demo
           20,000                     $500K     $550K+                    in Steam Next Fest, 7,000+
                                                                          wishlists at launch.
High 40,000+                          $1M+
                                                                          Base, plus streamers pick
                                                                          up the live show and the
                                                                          parody world travels on
                                                                          social media.

The base case pays back a small team and funds updates. It is not a studio-sized hit, and
nothing in the genre suggests one.

                                                                          Page 5 of 13
WrestleCraft: Review and Master Plan

 Price

  $24.99, with a 10 to 15% launch discount. That sits above the $19.99 text sims, because the
  broadcast and art earn it, and under TEW's $34.95, because TEW has twenty years of
  depth. Offer a free demo of Booker Mode's first month: TEW, Booker Blitz and Pro
  Wrestling Sim's fans all expect to try first.

 Risks, most serious first

   1. Scope. Well over 100 open plan steps against one developer. Every month spent on new
      systems is a month of competitors on the shelf and no wishlists building.

   2. Booker Blitz claims the hook first. It launches into early access next month with
      "Gorilla Position" as its headline. WrestleCraft must market the difference: calls
      caused by the people and the night, consequences people remember, and a broadcast
      you watch, not a menu.

   3. The parody world as the Steam default. This is Bill's decision and the plan keeps it.
      Since 20 October the parody rosters wear their real people's colours and signature
      gear, which is closer to likeness than changed names. Get a written opinion from an
      entertainment lawyer on the actual build before the store page goes up, because a
      takedown after launch would cost the launch.

   4. No stakes at launch. Players review the first two hours. If coasting still works, reviews
      will say "no challenge" and the score will sink below the 90% the genre's hits hold.

   5. Steam technical gaps. No Windows installer, Steam calls never run, one save slot, silent
      save failures. Any one of these produces refunds.

   6. Audio. A live show with no crowd noise will read as unfinished in a trailer.
   7. Screen sizes. Not a risk: Bill confirmed the game is laid out at 1080p and will scale up to

      all main modern resolutions. Phase 3 tests text stays sharp at each.

 Is it better than the others?

  Not yet overall, but it is the only one that could be the best of both worlds: TEW's living
  world with a show you actually watch. It already wins on presentation and the live show,
  and loses on balance, clarity and modding history. Once phases 1 to 3 below are done, I
  would expect it to beat Pro Wrestling Sim and Booker Blitz outright and to be the better
  game than TEW for anyone who is not a spreadsheet purist.

                                                                                                                                                                                                                                                    Page 6 of 13
WrestleCraft: Review and Master Plan

Area          WrestleCraft today TEW IX                   Pro           Booker Blitz
                                                          Wrestling     (from its store
                                                          Sim           page)

Watching      Best. Paper             Text results        Text results  Text with voiced
the show      diorama broadcast                                         announcers
              with entrances,
              near falls and a live
              fan feed

Live calls    Best. Caused by         None                None          Strong: audibles,
during the    the night and the                                         run-ins, finishes
show          people,                                                   changed
              remembered
              afterwards

People and    Best. Relationship      Strong, with inner  Moderate      Unknown
memory        matrix, backstage       circles and
              people, memory of       backstage politics
              your calls

Depth of the  Strong: nine            Best: huge          Moderate      Unknown
world         company models,         database, real-
              rival bookers, a        world calendar, 20
              living world            years of tuning

Challenge     Weak: cannot be         Strong              Strong        Unknown

and balance lost today

Clarity and   Weak: chores,           Weak: famously      Best: simple  Keyboard-first
first hour    mixed signals, cut-     steep               and
              off text                                    readable

Modding       Good: World Editor,     Best: decades of    Good          JSON datapacks
and worlds    Create a Wrestler,      community                         and a data editor
              Workshop planned        worlds
              but untested

Art and       Art best and hand-      Minimal             Minimal       AI-generated
sound         made; sound                                               art, neon theme
              weakest of all

On Steam      Coming                  No                  Yes           Next month,

                                                                        early access

                                                                                      Page 7 of 13
WrestleCraft: Review and Master Plan

  Two marketing angles fall out of this table. First, "the show you watch, the calls you make,
  the people who remember". Second, "made by hand": with Booker Blitz built on AI art, a
  hand-made paper look is a point of pride with this audience.

 The plan going forward

  Seven phases, one pull request each, merged by Bill or Ryan. New features stay paused
  until phases 1 to 3 are done, as Bill decided. Launch comes after phase 6. Phase 7 is free
  updates after launch, which keep the game visible on Steam. Store-page and Steam
  technical work starts in parallel from phase 2, because wishlists take months to build.
  This replaces the earlier roadmap and the A+ plan in the game review, and puts every plan
  in PR #6 in one order.

  the road to launch � 8 phases, 1 gate, launch after phase 6

  The top row fixes what exists; new features start only once its gate is passed. Everything
  right of the launch line ships as free updates.

 Phase 0: lock the plan (days)

      Merge PR #6 as the plan of record. It holds only plans, so it changes nothing in play.
      Tidy the backlog: mark TASKS sections 3 to 9 done or cut, remove the duplicate 0v, 0w
      and 0x sections, retire IDEAS.md, and update docs/design.md , which still describes
      the DOS look and tablet modes.

                                                                                                                                                                                                                                                    Page 8 of 13
WrestleCraft: Review and Master Plan

      Lock the workbench art style. No more look changes before launch.

 Phase 1: balance (in progress)

  Started in the Game review and A+ plan thread. Free winner picks are already in.
      Picking the winner is free; booking power buys extras (protected finish, run-in,
      surprise, upset title change).
      Suggest a card lands around a C.
      Coasting fails within a year: one yearly owner goal (popularity target, cash floor, one
      story beat), and a tougher handover.
      Popularity follows good shows, or the game says why it does not.
      EWE stops losing about $1M a show.
      A balance test in the suite with targets per company model.
      All rights reserved licence file.

  Gate: in the balance test, a Suggest-only booker is in danger by the end of year one, and a
  thoughtful one can win.

 Phase 2: Booker Mode and the first hour

      The two modes: Booker Mode opens in the week of the grand show, one week before
      the business year ends, with the last booker's mess as the teaching tool (TASKS 0ac).
      Sandbox Mode is a free start with no mess. The wrestling year runs flagship to
      flagship.
      The world switch at the top right of the title screen, parody world as the default.
      Commentary: separate screens for play-by-play and colour, built to allow a third voice
      later.
      Seat the commentary team and skip sponsor admin in week one, so the first desk has
      one job.
      Restyle the owner's letter in the workbench look; a progress card during the 10-second
      start.
      A cap on interruptions: the top three matters a week, the rest resolve on their own.
  Gate: a new player books and airs the grand show within 15 minutes, understands the
  yearly goal, and is not graded a failure for following the game's own advice.

                                                                                                                                                                                                                                                    Page 9 of 13
WrestleCraft: Review and Master Plan

 Phase 3: finish the screens at 1080p

      An ellipsis and contrast check in the screen test, then zero cut-off text and no
      unreadable labels at 1920x1080. Drop tablet size from the tests.
      Use the full 1080p screen, as Bill asked, and scale it up to all main modern resolutions
      (1440p, 4K, ultrawide), checking text stays sharp at each.
      Roster bars that differ, with words, so a glance shows who is tired or unhappy.
      The bug list from the review: silent save failures first, then the sign-off card, the toast,
      the dirt-sheet byline, the storylines title, the camera clipping through the referee.
      Keep the longer broadcasts, as Bill decided.
  Gate: the screen test passes with the new checks on every page. New features unpause
  here.

 Phase 4: the live show, the core feature

  This is what sells the game against Booker Blitz. Build in this order, because each step
  feeds the next.
   1. The Director, steps 1 to 3 (TASKS 0aa): the tension reading, then it chooses the week's

      events.
   2. Catching fire and tagging today's 13 calls (0ae steps 1 and 2), then the Director on the

      night (step 3).
   3. Word travels (0ai). Small, and every call then ripples.
   4. Promos written from everything going on (0ag), Bill's "main idea".
   5. The hallway on the desk (0aj), in the promo voices.
   6. Company arcs from beats (0ad), Bill's "key feature", steps 1 to 4 with the rival booker

      shape first.
   7. The forty new calls (0ae step 4), a batch at a time; the Director's three styles and event

      sizes (0aa steps 4 and 5).
  Gate: a show in a playtest produces at least one call a player wants to talk about, and arcs
  start from what happened rather than a menu.

 Phase 5: people and the world, the launch slice

  Only the pieces that make the launch better, or that screenshots and trailers need.
      Traits, wants and moods (0ah steps 1 to 3). Perk slots at 60 to 90 can follow after
      launch.

                                                                                                                                                                                                                                                  Page 10 of 13
WrestleCraft: Review and Master Plan

      The monthly magazine (0af steps 1 to 2, and the annual issue). Its covers are ready-
      made marketing images.
      Visual storytelling, first steps from the visual plan: champions carry their belts in every
      portrait, then the Power Ten board.
      The weekly podcast replacing the chat room (podcast plan), if Phase 4 lands on time;
      otherwise it is the first post-launch update.

 Phase 6: sound and ship

      Audio: crowd beds that follow the crowd meter, entrance pops, the bell, near-fall roars.
      Saves for a PC game: named slots, visible save files, Steam Cloud, a clear error when a
      save fails.
      The Windows installer and icon; Steam achievements and Workshop calls run against
      the real Steam client.
      An options screen: window mode, text size, audio levels.
      The lawyer's written opinion on the parody world as built.
      Store page, trailer cut from the broadcast, a demo of Booker Mode's first month, Steam
      Next Fest. Start the store page as soon as phase 3 is done.
  Gate: launch at $24.99 with a launch discount, with about 7,000 wishlists or more.

 Phase 7: after launch, as free updates

  Roughly in this order, one update every four to six weeks:
   1. Backstage Politics (0ak) and They come back changed (0al).
   2. Pre-history from real history, and ten simulated years for new companies (0ab), after

      the lawyer has seen the anchors.
   3. Perk slots and signature perks (0ah steps 4 to 6); the rest of the magazine.
   4. The locker room diorama (0am) and buildings that remember (0an).
   5. The corkboard (TASKS 13); a three-person commentary booth.
   6. Careers and the long game (TASKS 14): the owner's five-year vision and the path to the

      Hall first, since they are small and feed the yearly loop, then families, trends, world
      firsts, mission trees, rival owners and plans, coalitions, the territory map, and last the
      wrestler career mode and one life in wrestling.
   7. Owner mode and the rest of the creator suite.

                                                                                                                                                                                                                                                  Page 11 of 13
WrestleCraft: Review and Master Plan

What stays cut: free agency week, power blocs and privileges, fast mode leftovers, pre-
booking the week, picking the building, and the Steam Deck and tablet targets.

Decisions this plan follows, and what is still open

Every decision below was made by Bill on 21 October 2026 and is built into the phases
above.

Topic                                 Decision                                             Phase

New features                          Paused until balance, the first hour and the screens 1 to 3
                                      are fixed

Picking the winner Free; booking power pays for extras                                     1

Suggest a card                        Lands around a C                                     1

Licence                               All rights reserved                                  1

Modes                                 Booker Mode starts at the grand show in the last     2

                                      week of the business year; Sandbox is a free start;

                                      years run flagship to flagship

Worlds                                Both ship; parody is the Steam default; world        2

                                      switch top right of the title screen

Commentary                            Separate screens for play-by-play and colour;        2, 7

                                      three-person booths later

Screens                               Laid out at 1080p using the full screen, scaled up to 3
                                      all main modern resolutions; no Steam Deck or
                                      tablet

Broadcasts                            Keep the longer broadcasts                           3

Pull requests                         One per phase, merged by Bill or Ryan                All

Rejected                              Free agency week; power blocs and privileges         Cut

Open questions

    Does Ryan agree with this order, in particular moving the GM skill tree, which he
    queued after the arcs on 16 October, to after launch?
    Who is the entertainment lawyer, and when can they see the parody world as built?

                                                                                                   Page 12 of 13
WrestleCraft: Review and Master Plan

      Is there a target launch window? It decides whether the podcast makes the launch
      slice.
      Should the store page and demo go up early to answer Booker Blitz's November early
      access, or wait for phase 4 so the demo shows the full live show?

                                                                                                                                                                                                                                                  Page 13 of 13

