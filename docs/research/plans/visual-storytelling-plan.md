<!-- Text copy of the PDF beside it (pdftotext -layout), so it can be searched. The PDF is the source. -->
Visual storytelling plan

 Visual storytelling plan

  WrestleCraft: Be The Booker (repo ryanblanchettegl/batman) � 21 October 2026 � design
  only, no code changed yet

 The short version

  The game already has a strong picture engine: the paper diorama ( kit/scene.ts ,
   kit/puppet.ts , ScenePlayer ). It draws every wrestler from their own Create a Player
  look, plays a scene for every match moment, promo, angle and entrance, and already
  knows how to put a title belt over a champion's shoulder. Today most of that only shows
  up in two places: the broadcast window and the Roster file. The rankings, the Titles page,
  the Web sites, History and the show's opening are still words and tables.
  So the plan is mostly about pointing the engine we have at more screens, not building a
  new one. Almost every idea below reuses three things that already exist:

      Champions already wear their gold. A wrestler's recipe takes belts and beltL
      ( kit/puppet.ts , around line 433): the first belt goes over the shoulder, the second
      round the waist, the third over the other shoulder, each drawn as that title's own belt
      from Create a Belt. Entrances ( Live.tsx ) and the Roster file ( Roster.tsx line 89)
      use it. Portraits and everything else do not.
      Still pictures are cheap. PaperPortrait paints a doll once and caches the canvas, so
      ten portraits on a page cost ten draws, once. ScenePlayer with still gives a full-
      length picture.
      Templates exist. Create a Scene already has a poster, a magazine cover, a video game
      cover, an action shot, a portrait and "the champion with the belt" ( TEMPLATES in
       kit/scene.ts ). Captions include a lower third and a title card ( CAP_STYLES ).

 Phase 1: champions and rankings you can see

 1. Champions carry their belt in every portrait (small)

  What the player sees: anywhere a champion's face shows (run sheet, the vs strip on the
  broadcast, the desk, the feed, contenders lists), they have the belt over their shoulder, in
  that title's own colours.

                                                                                                                                                                                                                                                      Page 1 of 5
Visual storytelling plan

  How: move the inline code in Roster.tsx:89 into one helper, champRecipe(w, P) in
   kit/portrait.tsx , and have Portrait use it. The shoulder plate sits on the chest, so
  the existing "To the chest" frame shows it; for head-and-shoulders portraits, a champion
  gets the chest frame automatically. The portrait cache key already includes the recipe, so
  a title change redraws on its own.
  Test: app/tests/roster.js gains a check that a champion's portrait differs from the
  same wrestler's without the title.

 2. The Titles page becomes a wall of champions (medium)

  What the player sees: the table stays, but above it (or as its own window, "The
  champions") each title is a cut-card panel: the champion full length with the belt on the
  shoulder, arms crossed, the title's name in marker on a strip of black card, and the reign in
  weeks and defences under it. A tag title shows both partners, each with a belt. A vacant
  title shows the belt alone on a stand with VACANT across it.
  How: a new still, champ_shoulder , alongside the champ template (pose CROSS , set
   plain or the company's backdrop, square frame). Cast with champRecipe . One
   ScenePlayer still per title is fine at 1080p, so the wall is the page's main window and
  shows every title at once in a grid. Rule 5b (one screen) holds because the panels replace
  the Contenders window's top half, and contenders move into a pop-up per title (rule 6a).
  Test: a new app/tests/titles.js (or extend roster.js ): every held title has a picture, a
  vacant title shows VACANT, and the page still fits ( fits() ).

 3. The Power Ten board (medium)

  What the player sees: a proper top ten, like a magazine's rankings page. Number one
  stands full length on the left, wearing whatever gold they hold, with "No. 1" in big marker.
  Numbers two to ten are large index cards in a three by three grid that fills the rest of the
  screen: chest portrait, rank number, name, company logo chip, and a red or green arrow
  with how far they moved. Clicking a card opens their file.
  Where it lives: the World page (replacing the text PowerTen in company/World.tsx ) and
  the Top Ten Tuesday site on the Web ( Rankings in net/Search.tsx , which uses
   E.criticList ). The engine side is done: E.power(S, 10) and E.powerWas() already
  give the list and the movement.
  Optional extra: each title's contender top five ( E.rankFor ) as a smaller board of the same
  cards on the title's pop-up.

                                                                                                                                                                                                                                                      Page 2 of 5
Visual storytelling plan

  Test: the board shows ten cards with portraits, number one has a full-length picture,
  arrows match E.powerWas . Never calls rnd(S) .

 Phase 2: the broadcast tells the story in pictures

  All of these respect the Scenes on/off switch ( pref.pics ) and reduced motion, and none
  change the result of anything.

 4. Show open: the poster, not a text card

  Today the opening ( TitleCard in Live.tsx ) is text. Swap in the main event's poster (the
  same PosterPic the desk already shows for the next show), with the show's name as the
  masthead and the company logo in the corner. Big events get the tall poster frame.

 5. Tale of the tape before a title match or main event

  Before the bell, one still: both wrestlers' chest portraits face to face, the belt between
  them, and a few lines under each: record against each other ( S.h2h ), weeks as champion,
  finisher, the crowd's side. It is a lower-third style card, so it sits on the broadcast frame
  without a new layout.

 6. "Previously on" for a feud match

  Every story beat already has a scene ( beat_<beat> , BEAT_SCENES ). Before a match in a
  living storyline, show up to three stills of that feud's last beats as a comic strip ("Two
  weeks ago: the attack. Last week: the contract signing."). This is the strongest piece of
  visual storytelling we can add, because it ties the show to the Storylines page.

 7. The new champion's moment, kept

  The champion scene already plays when a title changes. Add a closing still of the new
  champion with the belt over the shoulder and a title card ("AND NEW"), and use that
  same picture on After the show, on the Titles wall, and as the photo for that week's dirt
  sheet headline.

 8. Tonight's moments as a strip at the sign-off

   Moments in Live.tsx lists the night's three biggest moments as text. Draw each as a
  small still (the near fall, the finish, the new champion) in a three-panel strip.

                                                                                                                                                                                                                                                      Page 3 of 5
Visual storytelling plan

 Phase 3: the world remembers in pictures

 9. Big event posters

  Every big event ( P.events ) gets a poster four weeks out: the main event face to face, the
  event's name as the masthead. It shows on the desk and the Web. After the event, the
  poster goes on a wall in History. This is the open task "Create a Poster or Cover" in
   TASKS.md .

 10. A monthly magazine cover

  Once a month, the month's top wrestler on a magazine cover (the mag template) with a
  headline from the text grammar ( GR_SHEET style). Shown on the Web page and kept as a
  gallery in History. Year end: a "Wrestler of the year" cover.

 11. The title's lineage as portraits

  The Lineage window on the Titles page becomes a row of small portraits, each champion
  holding that belt, with reign length under each. History keeps the full line.

 12. Trading card on a wrestler's file

  A tall card with the wrestler in their entrance gear, their overall badge, finisher and title,
  for the Roster file and the World Editor. It doubles as a share image later for the Steam
  Workshop.

 13. Match of the year, with pictures

   S.moty already keeps the year's best matches. Show its top ten on the Web with an
  action-shot still of each, cast with the two who fought.

 Rules this has to follow

      Rule 2a, the hand-made look: every board is cut card and paper, numbers in marker, no
      dot matrix.
      Designed at 1080p as the base, and every board scales up to the main modern
      resolutions: 1440p, ultrawide and 4K (Bill, 22 October). No Steam Deck or tablet.
      Boards use the whole screen and are laid out in grid fractions, not fixed pixels. Pictures
      are painted at the size they show on screen, so a 4K portrait stays sharp. Lists still use
      cached portraits so pages draw quickly.

                                                                                                                                                                                                                                                      Page 4 of 5
Visual storytelling plan

      Rule 5b: one screen, no page scrolling. Boards replace windows, they do not add to
      them.
      Rule 5: every card is a real button with a data-t name, reachable by mouse, keys and
      pad.
      Pictures only read the game. No rnd(S) , so a picture can never change how a game
      plays.
      Rule 9a: one step at a time, with a look at the result before the next.

 Suggested order

   1. Champions carry their belt in every portrait. Small, and it lifts every other idea.
   2. The Power Ten board.
   3. The Titles wall of champions.
   4. Tale of the tape and "Previously on" on the broadcast.
   5. Posters, covers and the History galleries.
  Each step is one small pull request with its browser test, a version bump once five are in
  (rule 10a), and the live build pushed after it passes.

                                                                                                                                                                                                                                                      Page 5 of 5

