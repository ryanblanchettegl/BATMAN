<!-- Text copy of the PDF beside it (pdftotext -layout), so it can be searched. The PDF is the source. -->
WrestleCraft: game review and the road to A+

WrestleCraft: game review and the road to A+

 Oct 21, 2026 � @Bill

The verdict

WrestleCraft is a B game with A+ bones: the deepest booking simulation I have seen in the
genre, a charming paper-diorama broadcast, and a test suite most indie games never get.
What holds it back is not missing features. It is that the game is too easy to coast, its
numbers tell the player conflicting stories, and the screens still show their seams. The
fastest route to A+ is to stop adding systems for a while and make the existing ones bite,
read clearly and feel finished.

Area                                          Grade In one line

Depth of simulation                           A   102 engine systems that feed each other through
                                                  people, memory and money.

Stability and tests                           A-  All 50 headless tests and 4 of 5 browser suites

                                                  pass; zero errors or bad numbers in two-year runs.

The broadcast                                 A-  The live show with calls from the gorilla position is

                                                  the game's best idea, and it looks great.

Challenge and balance C                           On Suggest a card alone, nobody was fired in 30
                                                  two-year runs, and most bookers were handed the
                                                  company.

Feedback and clarity C+                           Grades say "good show" while popularity and cash
                                                  fall; the player cannot tell which number matters.

First hour                                    C   Busywork tasks, a C grade on the first show from

                                                  the game's own suggestion, a letter in the wrong

                                                  art style.

Polish                                        B-  Cut-off text on most pages, a few unreadable

                                                  labels, camera clipping on the broadcast.

Audio                                         D   Synthesised music and blips only; no crowd, no

                                                  bell, no pops.

                                                                                                         Page 1 of 11
WrestleCraft: game review and the road to A+

Area                                          Grade In one line
Code health
                                              B-  Clear rules and hooks, but 1.3 MB of dense ES5 in
Ready for Steam
                                                  one scope with functions rewritten up to six times.

                                              C   Desktop wrapper untested, one save slot, no

                                                  options for resolution or audio mix, legal questions

                                                  open.

How I reviewed it

This is version 0.88 at commit a6ecb99 on main (20 October), read and run in a fresh cloud
machine. Nothing in the repo was changed.

    Read: CLAUDE.md, NEXT.md, the roadmap, the earlier reviews in docs/plans, and the
    core of the engine (core, match, live show, week, booking power, owner, tasks) plus the
    store, the broadcast and the desk on the interface side.
    Built and tested: the build is reproducible (it matches the committed dist byte for
    byte). The type-check is clean. All 50 headless tests pass. Browser suites: journey,
    calls, desk and scene pass; onescreen fails one check at tablet size.
    Played: a fresh game as a new player would see it (default settings, the parody world,
    EWE) at 1920x1080 and at Steam Deck size, three weeks with suggested cards,
    screenshots of every main page and the broadcast with scenes on.
    Balance runs: every company in the parody world, three seeds each, 96 weeks,
    booking only with Suggest a card and taking the safe answer to every call. That is 30
    two-year careers.

On the open issue from the earlier session: the only broadcast check I saw fail is
onescreen's "every answer is on screen" for a run-in call at 1024x768. That size is no longer
a target (rule 0), so the test should drop tablet mode rather than the game change. The
debut checks in the scene test passed.

Gameplay

The week loop (desk, backstage, book, air the show, after the show) is sound, and every
phase hands the next a problem, as the design asks. The trouble is weight: too many
systems speak at once, and the ones that should bite do not.

What works

                                                                                                        Page 2 of 11
WrestleCraft: game review and the road to A+

      The gorilla position. Calls that are caused, never random (a rival at the curtain, the
      owner wanting a favourite to win, a hot crowd begging for the title change), each with
      costs people remember. This is the hook that sets the game apart.
      People with memory. Backstage reads like a locker room: real heat at separate tables
      in catering, two wrestlers who do not click, a veteran staying late with a kid. The
      relationship matrix and youRemember() make choices stick.
      Living storylines. Heat and freshness instead of fixed lengths is a better model than
      most games in the genre use.
      Writing. Commentary, the dirt sheet and the chat room are varied, true to the game
      state, and often funny.
  What does not
      You do not decide who wins. Unless you spend booking power, the winner is a
      weighted roll ( winOdds() in src/10-match.js). Calling the favourite costs 1 point, an
      underdog 2 or 3, and a show refills about 3 to 5. In every booking game players know,
      the booker's first power is the finish. Here it is rationed, and the README even
      promises "pick who wins". This is the biggest design question in the game.
      Three shows a week for the starting company. EWE airs three weekly shows, so every
      week is three cards to book and three broadcasts. Even skipping each segment, a show
      took about two minutes in my run; at the default TV pace it is longer. The "one more
      turn" pull gets heavy fast.
      Busywork in week one. The first desk has three must-do tasks: pick a play-by-play
      voice, pick a colour voice, and look at sponsors. The commentary team already exists in
      the data; the game should seat them and let the player change it later.
      Too many voices. The desk, tasks, notification bar, inbox, writers, road agent, feed and
      after-show page all compete. The earlier review asked for a cap on interruptions a
      week; it is still not there.
      No pressure to stay sharp. See Balance: the game plays itself for two years without
      getting you fired.

 Balance

  A booker who only presses Suggest a card is never fired, is usually handed the company,
  and watches it shrink while being told the shows were good. That is three problems in one:
  no fail state, no clear goal, and feedback that contradicts itself.

                                                                                                                                                                                                                                                    Page 3 of 11
WrestleCraft: game review and the road to A+

      Nobody was fired in 30 two-year runs. Owner trust rose to 76 to 100 in about 25 of
      them, and the owner then handed over the keys (the handover needs trust 80, booker
      level 5 and week 30). After that, firing is off the table for good. Two runs went bankrupt
      (EWE in week 91, WPW in week 82), both while the owner was delighted.
      Suggest a card is not "flat, around a C". Ryan's roadmap asks for that. Across 4,722
      suggested shows: 30% graded A- or better, 37% in the B band, 30% in the C band and
      5% D or F. The median show is a B.
      Good grades, shrinking company. The grade measures a show against its own crowd,
      while popularity and cash measure the business, and they disagree. EWE's suggested
      shows were mostly B and A, yet it lost 9 to 13 popularity and $42M to $78M in two
      years.
      The starting company bleeds money. EWE's three weekly shows each run about $1M a
      week in the red before the big event. A new player will go broke without knowing why.

  30 headless runs of engine.js v0.88, parody world, seeds 3, 11 and 29, Suggest a card every show, safe answer to
  every call

  The fix is not "make it harder". It is to tie the owner's trust, the grade and the money to one
  clear yearly goal, and to make a coasting booker feel it within a season.

                                                                                                                                                                                                                                                    Page 4 of 11
WrestleCraft: game review and the road to A+

 Polish and presentation

  The workbench look is distinctive and the diorama broadcast is genuinely charming:
  entrances, near falls with a referee in frame, a feed of fans posting as the show goes. The
  rest of the screens are close but not finished.

      Cut-off text everywhere. At 1920x1080 the desk alone truncates the building name,
      the hometown line, the road list, the market and the tasks note ("A show cannot run
      until those marked ! are done or left for..."). The roster cuts the Holds column and the
      buttons at the foot of the wrestler's file. The earlier review flagged this; fits()
      checks height, not ellipses.
      Unreadable labels. On the sign-off card the Attendance and TV viewers values and the
      best-match stars are near-white on cream. The achievement toast prints white text on
      yellow. The storylines title bar draws "Building" over the feud's name.
      One page in the old style. The owner's letter, the first thing a new player reads, is still
      green-on-black terminal text with a broken box-drawing border, against rule 2a.
      Week one says nothing on the heat chart. Storylines shows twelve empty teal weeks
      even though feuds have been running for seven.
      Bars without meaning. Crowd, Mood and Body on the roster are nearly all full green,
      and the overall rating sits between 82 and 91 for the whole top of a 75-person roster.
      Broadcast camera. A close-up put the camera inside the referee, who fills the top-left
      of the frame.
      Audio is the weakest part. A synthesised rock band and UI blips. No crowd bed, no
      pops for entrances, no bell, no kick-out roar. For a game whose centrepiece is a live
      show, sound is half the experience.
      Load time. A new game takes about 10 seconds in the browser before the desk
      appears (calibration runs sample shows for every company). It needs a progress card,
      not a frozen screen.
  The first hour, as a new player sees it: a terminal-style letter, then a desk with three must-
  do chores, then a red-hot crowd expecting four-and-a-half-star matches, then the game's
  own Suggest a card graded C, "Lost the crowd", with the owner's trust down. The depth is
  there, but the first impression is failure and admin.

 Bugs found

  No crashes, no console errors (one missing favicon) and no bad numbers in any run. What
  I found is presentation and edge cases, worst first.

                                                                                                                                                                                                                                                    Page 5 of 11
WrestleCraft: game review and the road to A+

Bug                   Where                                  Evidence      Severity
                                                             Read in code
A failed save is      app/src/store.ts, save() and                         High for
never reported:                                                            Steam
save() returns        idbPut()
!!db || true ,
and the IndexedDB
write swallows its
errors

Sign-off card         app/src/screens/booking/Live.tsx:103   Screenshot at Medium
values                                                       1920x1080
(attendance,
viewers, best
match) are near-
invisible

Achievement toast     Toast over the after-show page         Screenshot    Medium
is white text on
yellow

Owner's letter in     WelcomeWindow in                       Screenshot    Medium
the retired terminal  app/src/screens/office/Windows.tsx
look, border
characters out of
line

Dirt sheet prints     app/src/screens/net/Sheet.tsx, the ed  Screenshot    Low
"Edited by �" with    split
no name when the
columnist's name
has no " of "

Storylines window     Storylines, picked feud window         Screenshot    Low
title draws
"Building" over the
feud name

                                                                                Page 6 of 11
WrestleCraft: game review and the road to A+

Bug                   Where                              Evidence    Severity

Broadcast header      Live.tsx, the ON AIR bar           Screenshots 7 Low
stays at "0:00 into                                      s apart
the show" during
the first match
while the feed
shows 0:07

Close-up camera       kit/diorama3d.ts camera placement  Screenshot  Low
clips through the
referee

Escape does not       WelcomeWindow                      Playwright run Low
close the owner's
letter; only the
button does

onescreen test still  app/tests/onescreen.js             Test log    Test only
runs tablet size and
fails there

Two content flags for Ryan rather than bugs: a WPW wrestler billed as "The Black Russian"
reads as an ethnic gimmick on the dirt sheet, and the parody companies' owners and
wrestlers are recognisable by design (see Legal).

Code quality

The architecture is disciplined: the engine owns plain-JSON state, the screens never
write to it, everything is seeded and repeatable, and hook lists let systems plug in. The
cost is readability, and it is growing faster than the game.

    Size and density. 102 engine files, 14,538 lines, 1.3 MB: about 91 characters a line on
    average, 208 lines over 300 characters, three over 1,000. The interface adds 13,000 lines
    with 338 lines over 300.
    Functions rewritten in place. Later files replace earlier functions ( E.validate is
    wrapped six times, E.runPlayerShow three) and 21 files use the wrap pattern. To know
    what a function does you must read every file that sorts after it. A test-
    buildorder.js check guards the order, which is good, but it is a symptom.
    A "99-" pile. 33 files are named 99-something so they load last. File order has become
    the dependency system.

                                                                             Page 7 of 11
WrestleCraft: game review and the road to A+

      Weak typing at the seam. The interface is strict TypeScript, but noImplicitAny is off
      and there are 740 : any annotations; the engine is untyped ES5.
      Tests check fit, not legibility. The suites are a real strength (50 headless, about 40
      browser), but they passed while labels were invisible and text was cut off. Tests also
      run with broadcast pictures off by default, so the renderer is lightly covered.
      Docs are thorough but huge. CLAUDE.md is 77 KB and TASKS.md 124 KB. They work
      for Claude sessions; a human contributor would struggle.
  No big rewrite is needed. Turn the wraps into proper hooks as files are touched, split files
  over 500 lines, and add a contrast and ellipsis check to fits() .

 Legal and release risks

  The repository is public, the game is meant to be sold on Steam, and the default world
  parodies real people closely. That combination needs a lawyer's read before launch, not
  after.

      The parody world is the default. Companies map one-to-one onto real promotions, the
      starting company's owner is a recognisable real executive, and since 20 October the
      EWE and WWC rosters are "dressed after the people they parody" in their real colours
      and signature gear, with their real moves under joke names. That is closer to likeness
      than changed names alone. The public-domain world is safer as the default for a
      commercial launch, with the parody world as a free download or an opt-in.
      Who-is-who notes are still in git history (decisions-needed.md says so), and the repo
      is public. Anyone can read them today.
      No licence is chosen, so the code is all rights reserved by default, while the repo is
      public.
      Steam readiness: the Electron wrapper and every Steam call are untested; saves live in
      IndexedDB with one slot and no save files the player can see or back up; there is no
      Steam Cloud, no settings for resolution, window mode or audio levels, and no credits
      screen.

 The plan to A+

  Freeze new systems until phase 3 is done. Every step below makes something that already
  exists bite harder, read clearer or feel finished. In order of impact:
  Phase 1: Make the game a game (balance and goals)

                                                                                                                                                                                                                                                    Page 8 of 11
WrestleCraft: game review and the road to A+

   1. Give the booker the finish. Picking a winner is free. Booking power buys the extras
      instead: a protected finish, a run-in, a surprise, a title change against the odds the
      locker room will resent. The cost of a bad call moves to people and the crowd, where
      the game's strength is. If Ryan keeps rationing, at least make calling the favourite free.

   2. One yearly goal from the owner, stated in the letter and on the desk: a popularity
      target, a cash floor and one story beat ("make a new world champion by the flagship").
      Owner trust follows that goal, not just weekly grades.

   3. Make coasting fail. Retune so Suggest a card lands around a C as the roadmap says,
      and so a booker who only suggests is in danger by the end of year one. Raise the
      handover bar (two years, the yearly goal met twice).

   4. Make the numbers agree. If shows grade B and A, popularity should rise. Either fix the
      drift or show the player why it falls ("rivals are winning the diehards", "three shows a
      week is burning the crowd out").

   5. Fix the starting company's money. EWE should not lose $1M a show by default. A new
      player's first year should be winnable with a few good choices.

   6. A balance test in CI with targets per company model (fired rate, bankrupt rate,
      popularity drift, grade spread on Suggest), three seeds, two years. My probe script is a
      starting point.

  Phase 2: The first hour

   7. Seat the commentary team and skip sponsor admin in week one; the first desk has
      one task, "Book your first show".

   8. A guided first month (the Timekeeper plan already written in EWF-road-to-a-
      plus.pdf). The first show is set up to succeed: a crowd that expects a solid show, not a
      red-hot one.

   9. Start smaller. Default to one weekly show for a first game, or let EWE's three shows
      unlock over the first months.

 10. Restyle the owner's letter in the workbench look and show a progress card during the
      10-second start.

  Phase 3: Finish the screens

 11. Zero cut-off text. Add an ellipsis check and a contrast check to fits() , then fix every
      page it flags at 1280x800 and 1920x1080.

 12. Fix the invisible and overlapping labels listed under Bugs.
 13. A cap on interruptions: rank matters and calls, show the top three a week, let the rest

      resolve on their own.

                                                                                                                                                                                                                                                    Page 9 of 11
WrestleCraft: game review and the road to A+

 14. Roster bars that differ: words and a wider colour range, so a glance tells you who is
      tired or unhappy.

 15. Pace the broadcast: a "key moments" pace that airs a weekly show in under a minute,
      and full pace for big events.

  Phase 4: Sound and feel
 16. Real audio: crowd beds that follow the crowd meter, entrance pops, the bell, near-fall

      roars, a kick-out gasp. Relax rule 2 for the Steam build, where shipped audio files cost
      nothing.
 17. Camera rules for the diorama so close-ups never clip through figures, and a quality
      setting for the Deck.
  Phase 5: Ship it
 18. Saves for a PC game: several named slots, files the player can see and back up, Steam
      Cloud, and a visible error when a save fails.
 19. Test the wrapper on Windows and a Steam Deck, and the Steam achievement calls
      against app 480.
 20. Legal: a lawyer's read of the parody world; make the public-domain world the default
      for the paid release; scrub the parody notes from git history or make the repo private;
      pick a licence.
 21. Options a PC player expects: resolution, window mode, text size, audio levels, key
      rebinding.
  Alongside, every week: turn one wrap into a proper hook, split one file over 500 lines, and
  keep the test suite green on both worlds.

 Decisions for Ryan and Bill

  These change what the game is, so they are yours to call. My recommendation is in bold.
   1. Who picks the winner? Keep booking power as the price of a finish, or make picking

      the winner free and charge for the extras.
   2. How good should Suggest a card be? A C, as the roadmap says, or a B as it plays today.
   3. Which world ships by default on Steam? The parody world, or the public-domain

      world, with parody as an option after a lawyer's read.
   4. The repo: keep it public, or make it private and scrub the parody notes from history

      before release.
   5. Licence: pick one now (all rights reserved is the simplest for a paid game).

                                                                                                                                                                                                                                                  Page 10 of 11
WrestleCraft: game review and the road to A+

   6. New systems: keep adding, or pause new systems until phases 1 to 3 are done.
   7. Starting size: keep EWE's three weekly shows, or start a first game with one show and

      grow.
   8. The tablet test: fix the broadcast fit at 1024x768, or drop tablet from the onescreen

      suite since the game ships on PC and Deck.
  Nothing in the repo was changed for this review. Say which phase to start on and I will
  open a branch for it.

                                                                                                                                                                                                                                                  Page 11 of 11

