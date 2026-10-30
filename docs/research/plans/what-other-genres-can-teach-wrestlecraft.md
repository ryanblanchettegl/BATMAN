<!-- Text copy of the PDF beside it (pdftotext -layout), so it can be searched. The PDF is the source. -->
What other genres can teach WrestleCraft

 What other genres can teach WrestleCraft

   Oct 21, 2026 � @ Bill
  Twenty-one features from career, sports management, dynasty, simulation, 4X and grand
  strategy games, each tied to systems WrestleCraft already has. Nothing here is already
  built or already on the wishlists or the A++++ list. Where an idea grows a listed item, it
  says so. Sizes follow WISHLIST.md : S is one commit, M is two or three, L is a week with a
  plan written first. (Visual) marks the ideas that also add visual storytelling.

 The short version

  If you build six things from this doc, build these:
   1. Wrestler career mode. Play one wrestler in the same living world while an AI booker

      books you. This is the biggest mode the game is missing, and most of the parts already
      exist.
   2. Eras mode. Start in the territory days and live through cable, pay-per-view, the internet
      and streaming. The Net changes its look with each era, from newsletter to message
      board to social feed to podcast.
   3. The territory map. One map of the world, with every city coloured by the company
      that owns it. Strategy you can see.
   4. The war as a struggle. Head-to-head nights, raids, invasions and giving away results
      become one war. It moves through phases and ends in a buyout, a truce or a company
      folding.
   5. The recruiting pitch. Every free agent wants three things, and you see how well your
      company offers each one. Signing someone becomes a pitch, not just a price.
   6. The owner's five-year vision. Long goals with a checkpoint every year, so a save has a
      shape across years and not just weeks.

 Career modes: play a life, not just a company

 1. Wrestler career mode ("Road to the Main Event")

  Borrowed from: NBA 2K MyCareer, MLB The Show's Road to the Show, EA FC Player
  Career and WWE 2K MyRise. You are one player, someone above you decides your
  minutes, and you grow by playing well and handling the people in charge.

                                                                                                                                                                                                                                                    Page 1 of 10
What other genres can teach WrestleCraft

  In WrestleCraft: make a wrestler in Create a Wrestler and sign with any company in the
  world. That company's AI booker books you, the way rival shows are booked now. Your
  week is spent backstage: asking for a title shot, a turn, a team or time off, building
  friendships and heat, cutting promos when you get the microphone, spending progression
  points, and weighing offers when your contract runs down. Being buried, losing at home,
  or being promised a push that never comes all happen to you this time.
  Builds on: rival shows already run with no player ( livePlay ). The seven asks people bring
  to Your office ( ask* in peopleNow() ) become your own moves, pointed the other way.
  Progression ( 99-progress.js ), contract clauses ( 97-clauses.js ), job offers (wish 90),
  followers (wish 72), the live microphone (wish 81) and the relationship matrix work as they
  are.
  Size: L. The biggest new mode here, and the one that most clearly turns a booking sim into
  a world builder.

 2. One life in wrestling

  Borrowed from: Crusader Kings III, where you play on as your heir when your character
  dies, and Football Manager, where one save follows a manager across clubs for decades.
  In WrestleCraft: a wrestler's career that keeps going after the boots come off. Retire into
  a second career as a manager, commentator or road agent, take the pencil as booker, and
  one day own the company. When that character is done, carry on as the student you
  trained.
  Builds on: second careers already exist for everyone else ( 85-second.js , SROLES ), plus
  who trained whom ( w.coach ), owner mode (wish 93) and careers with no end (roadmap
  30). It grows A++++ 3 ("From ring crew to booker") and 42 ("New game plus").
  Size: M, once idea 1 exists.

 Sports management and dynasty

 3. The owner's five-year vision

  Borrowed from: Football Manager's Club Vision. The board sets goals over five years
  (style of play, youth, money, league finish) and reviews you every season.

                                                                                                                                                                                                                                                    Page 2 of 10
What other genres can teach WrestleCraft

  In WrestleCraft: the owner's opening letter sets a five-year plan that fits the company
  model. A public giant wants to double its TV money and fill a stadium. A purist wants three
  new stars and a five-star match every month. A lucha traditionalist wants a mask-versus-
  mask main event at the anniversary show. Each year has a checkpoint and a review on the
  desk, and owner's trust follows the plan, not just the last few weeks.
  Builds on: the welcome letter ( E.welcome , 96-first.js ), owner's trust, the annual
  report (wish 57) and the nine models ( 78-models.js ). The win conditions in 92-
  scenarios.js ( SCN_WIN ) can already test most goals.
  Size: M.

 4. The recruiting pitch

  Borrowed from: College Football 25's recruiting. Every recruit ranks what they care about
  (playing time, a contender, closeness to home), some have dealbreakers, and you pitch
  your strengths.
  In WrestleCraft: every free agent wants three things from a short list: money, TV time, a
  shot at a title, a home market, creative freedom, the company's standing, less travel, or a
  famous name to learn from. The Offer window says how well you offer each one, in words
  ("You can give them this", "A hard sell"). One can be a dealbreaker. Rivals pitch for the
  same people, so you can lose a star you could afford.
  Builds on: clausesWanted() and E.sign ( 97-clauses.js ), hometowns and markets
  ( homeKm() , S.mkt ), the title picture ( rankFor() ) and career goals ( 87-goals.js ),
  which already say what each wrestler wants.
  Size: M.

 5. Free agency week

  Borrowed from: the opening of NBA free agency, and deadline day in Football Manager. A
  short window where everything happens at once, with a live news ticker.
  In WrestleCraft: once a year, at the end of the business year, a wave of contracts across
  the world run out together. For one week the Net becomes a live ticker of rumours, offers
  and signings. Rivals bid, the press leaks names, and the reporter with the best sources
  ( 99-press.js ) gets it right first.
  Builds on: the Net ( 94-net.js ), the press, raids (wish 60), the indies ( 88-indies.js )
  and contract lengths (roadmap 28).

                                                                                                                                                                                                                                                    Page 3 of 10
What other genres can teach WrestleCraft

  Size: M.

 6. The path to the Hall (Visual)

  Borrowed from: Baseball-Reference's Hall of Fame Monitor and the career pages in Out of
  the Park Baseball. Every active player has a career line and a reading of whether they are
  on track.
  In WrestleCraft: every wrestler's file gets a career line (days as champion, main events,
  average stars, match-of-the-year awards, flagship wins) and a line in words: "Building a
  case", "On the path", "A lock". It feeds the Hall of Fame night (wish 76) and gives Bill's top-
  10 and champion pictures real numbers to stand on.
  Builds on: the record book (wish 98), title histories, awards (wish 75) and the ranking in
   70-season.js , which already keeps a top fifty.
  Size: S.

 7. Eras mode (Visual)

  Borrowed from: NBA 2K's MyNBA Eras. Start a league in an earlier decade, and the rules,
  money and presentation fit that time.
  In WrestleCraft: start in the territory days, with regional TV, packed armories and a
  newsletter by post. Over a long save the industry changes under you: national cable, pay-
  per-view, internet message boards, social media, streaming. Each era changes where the
  money comes from and what the crowd rewards. The Net changes its look too: mailed
  newsletter, phone hotline, message boards, the feed, and finally a weekly podcast. That
  makes Bill's podcast the last stage of a long arc.
  Builds on: networks and their tastes ( 89-networks.js ), streaming ( 89-streaming.js ),
  the Net ( 94-net.js ), "The bar moves" (wish 68) and the company models. It grows
  A++++ 147 ("New media arrives") into a full mode.
  Size: L.

 8. Wrestling families

  Borrowed from: Crusader Kings III's dynasties, where a family name carries renown
  across generations, and College Football 25's legacy recruits.

                                                                                                                                                                                                                                                    Page 4 of 10
What other genres can teach WrestleCraft

  In WrestleCraft: second- and third-generation wrestlers. A rookie class can include a
  legend's son or daughter, with some of the parent's look, style and finisher. The name
  brings an early lift and early expectations. Each file shows a family tree, and a family that
  keeps winning titles becomes a dynasty the commentary and the Net talk about.
  Builds on: the rookie class (wish 67), Create a Wrestler's looks, finishers (wish 4), the Hall
  of Fame and the world's history ( 86-history.js ). It grows IDEAS A19 ("Family ties").
  Size: M.

 Grand strategy

 9. The war as a struggle

  Borrowed from: Crusader Kings III's Struggles. A regional conflict moves through phases
  (Opportunity, Hostility, Conciliation, Compromise) depending on what every side does,
  and ends in one of several outcomes.
  In WrestleCraft: a war between two big companies becomes one thing with phases:
  Competition, Escalation, Open war, Settlement. Running head to head, raiding stars, giving
  away the rival's results and invading push it hotter. Working agreements and talent loans
  cool it down. Each phase changes the rules (in Open war every raid costs more and a
  head-to-head win counts double). It ends in a buyout, a truce, or one side folding.
  Builds on: head-to-head nights ( 88-nights.js ), raids (wish 60), giving away results (wish
  85), invasions ( 81-invasion.js ), rivals that die (wish 62) and buying a rival (TASKS 0b).
  Size: L.

 10. Coalitions

  Borrowed from: Europa Universalis IV's aggressive expansion. Grow too fast and your
  neighbours band together against you.
  In WrestleCraft: raid too often, take over too many markets, or sign every hot free agent,
  and the rival owners team up. They share talent, book against your big nights and refuse
  you working agreements until things cool off.
  Builds on: rival owners as people (wish 59), working agreements (wish 61), raids and
  markets.
  Size: M.

                                                                                                                                                                                                                                                    Page 5 of 10
What other genres can teach WrestleCraft

 11. Power blocs and privileges

  Borrowed from: Europa Universalis IV's estates and Victoria 3's interest groups. Groups
  inside your country have loyalty and clout, and a privilege buys peace now and hands
  them power later.
  In WrestleCraft: five blocs: the locker room, the network, the sponsors, the fans and the
  owner. Each has loyalty and clout. Privileges are concrete: creative control for the top
  stars, network approval of every main event, a sponsor's name on a title. Each buys calm
  now, and a bloc with too much clout starts forcing your hand.
  Builds on: numbers the game already keeps (the network's patience S.clocks.net ,
  owner's trust, room mood, sponsors, creative control from wish 39), gathered under one
  idea the player can see.
  Size: M to L. It changes how the game feels, so it is an "ask Ryan" item.

 12. Succession

  Borrowed from: Crusader Kings III. When the ruler goes, who inherits decides everything,
  and the heirs scheme long before.
  In WrestleCraft: the owner gets old. Their children work in the company, one on screen
  and one in the office, and each wants it. Who you back decides whether you keep your
  job, lose it, or end up running the place. Rival companies go through it too, and a bad
  succession can sink one.
  Builds on: owner mode (wish 93), rival owners (wish 59), the kayfabe layer ( 99-
  kayfabe.js ) for secrets, and the on-screen boss (wish 34).
  Size: M.

 13. Company mission trees

  Borrowed from: Europa Universalis IV's mission trees and Endless Legend's faction
  quests. Each side has its own chain of long goals with rewards.
  In WrestleCraft: each of the nine company models gets its own tree of goals that take
  years. The startup's is about surviving and landing a TV deal. The outlaw's is about getting
  banned in one state and selling out the next town over. The all-women company's ends in a
  stadium main event. Each goal finished opens the next and leaves a lasting bonus.
  Builds on: 78-models.js , company arcs ( 99-arcs.js ) and the SCN_WIN checks.
  Size: M.

                                                                                                                                                                                                                                                    Page 6 of 10
What other genres can teach WrestleCraft

 4X

 14. The territory map (Visual)

  Borrowed from: Civilization's culture borders. You can read the whole game from one map
  coloured by who owns what.
  In WrestleCraft: one cut-paper map where each city is coloured by the company that
  rules it. Contested cities are striped, and a city you flip gets a pin on your desk. The war,
  the road and the markets on one screen, and the picture players will screenshot.
  Builds on: the road's maps ( 91-shapes.js , drawShape() ), markets ( S.mkt , where "Your
  territory" is already the top word) and regions ( regionOf() ). Rival companies need
  markets of their own first.
  Size: M to L.

 15. The Alliance (Visual)

  Borrowed from: Stellaris's Galactic Community, where empires vote on laws that bind
  everyone, and the real territory-era alliance of promotions that shared one touring world
  champion.
  In WrestleCraft: member promotions pay dues and vote once a year: who holds the
  touring world title, a no-raiding pact, a rule on blood. The touring champion is booked into
  each member's territory for a fee, and a visit draws. Join, lead the vote, or quit and go
  national, which is how wars start. The touring belt's path across the map is a picture of its
  own.
  Builds on: working agreements (wish 61), titles and their histories, the road, and the
  territory map (idea 14).
  Size: L.

 16. Rival owners with agendas

  Borrowed from: Civilization VI. Each leader has a known agenda and a hidden one you
  learn over time, and both decide how they treat you.
  In WrestleCraft: every rival owner has an agenda you know ("hates losing a night") and
  one you find out ("is quietly looking for a buyer", "wants your champion at any price"). The
  press and your own contacts reveal the hidden one, and knowing it changes your next
  move.

                                                                                                                                                                                                                                                    Page 7 of 10
What other genres can teach WrestleCraft

  Builds on: rival owners (wish 59), the press and its sources ( 99-press.js ) and the
  kayfabe layer.
  Size: S to M.

 17. World firsts (Visual)

  Borrowed from: Civilization's wonders. Only one civilization can build each one, so
  everyone races.
  In WrestleCraft: a list of firsts only one company in the world can ever claim: the first
  stadium show over 50,000, the first national TV deal, the first million-dollar gate, the first
  women's main event at a flagship. When a rival gets one, it is gone. Each is a plaque on the
  company page and a headline on the Net.
  Builds on: the milestone wall (wish 91), which already tracks your own firsts, and the week
  around the world ( 99-worldweek.js ).
  Size: S to M.

 18. Rival plans

  Borrowed from: XCOM 2's Dark Events. Each month you see what the enemy is preparing,
  and you can stop only one.
  In WrestleCraft: each month the office hears of two or three moves rivals are planning: a
  raid on your champion, a show on your flagship's night, a bid for the hottest free agent.
  Spend booking power or call in a source to stop one. The rest happen.
  Builds on: fog of war ( 99-fog.js ), the press, rival booking and raids.
  Size: M.

 Simulation and tycoon

 19. The industry votes on rules

  Borrowed from: Motorsport Manager. Every season the teams vote on rule changes, and
  the rules that pass change what wins.
  In WrestleCraft: once a year the networks, or the Alliance, put forward rules: no blood on
  TV, no chair shots to the head, a time limit on TV matches. Companies vote. A rule that
  passes changes the match library and what a network allows, and companies built on the

                                                                                                                                                                                                                                                    Page 8 of 10
What other genres can teach WrestleCraft

  old way have to adapt.
  Builds on: the library of match types (wish 16), network tastes ( NET_TASTE ) and house
  rules (wish 43).
  Size: M.

 20. Reinvent the company

  Borrowed from: Humankind, where you pick a new culture each era and keep a legacy
  trait from each one you leave.
  In WrestleCraft: at big turning points (a new decade, a new owner, after a flagship), a
  company can change its model. A lucha spectacle can go corporate, an outlaw can go
  mainstream. It keeps one trait from the old model, so its history shows in how it runs.
  Builds on: 78-models.js and Eras mode (idea 7).
  Size: M.

 21. Trends

  Borrowed from: Game Dev Tycoon. What the market wants shifts every few years, and
  the first to catch a trend earns the most.
  In WrestleCraft: fads that sweep the world for a year or two: a hardcore craze, a
  cruiserweight boom, a reality-show era, a tag-team revival. The first company to ride one
  gets the most from it, late arrivals get less, and the company that did it before it was cool
  gets a lift.
  Builds on: "The bar moves" (wish 68), regional tastes (wish 64) and the four kinds of fan.
  Check first: wish 68 may already cover part of this.
  Size: S to M.

 Suggested order

  Small wins with visible results first, then the systems that give a save a long shape, then
  the two big modes.

                                                                                                                                                                                                                                                    Page 9 of 10
What other genres can teach WrestleCraft

Order Idea                                Size Why then

1  The path to the Hall (6)               S     Quick, and gives the top-10 and champion

                                                pictures real numbers

2  World firsts (17)                      S to Small and visual; makes the world feel like a

                                          M     race

3  The owner's five-year                  M     Gives every save a shape across years

   vision (3)

4  The recruiting pitch (4)               M     Makes signing a choice, not just a price
                                          M to  The picture that sells the game
5  The territory map (14)                 L
                                          L     Ties the existing war systems into one arc
6  The war as a struggle (9)              L     The biggest new mode
                                          L     The world-builder centrepiece, with the
7  Wrestler career mode (1)                     podcast as its last stage

8  Eras mode (7)

The other thirteen can come in any order once the systems they lean on are in.

What I left out, and why

    Emergent storytelling, procedural generation and relationships (RimWorld, Dwarf
    Fortress, Crusader Kings opinions and secrets, the Nemesis system, Football Manager
    squad dynamics, Wildermyth) are covered in the killer-features PDF in the project
    files.
    Tycoon ideas already on the A++++ list: your own arena and TV studio, shares and a
    board, buying a rival, economic cycles, the league table, unions and strikes, and every
    multiplayer idea.
    The booker's skill tree is already planned (roadmap 19 to 22).
    Things the game already has: rookie classes, brackets and leagues, the brand-split
    draft, scouting, the assistant, scenarios, owner mode, legacy, contract clauses, working
    agreements, raids and invasions. Several ideas above build on these.

Game details come from memory of each title, not from pages opened for this doc, so
check the specifics before quoting them in public.

                                                                                       Page 10 of 10

