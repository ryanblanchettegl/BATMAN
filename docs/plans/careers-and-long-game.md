# Careers and the long game: nine features from other genres

Bill, 21 October 2026: "I like ideas 1-5 add those to long term planning", then "one life in wrestling is awesome too", and dropped free agency week ("wrestling doesn't have a free agency week, lets not do that"), then added "Path to the Hall of Fame i like" "i like wrestling families" "I like coalitions" "love 13" (company mission trees) and the territory map coloured by the most popular company in each region. He turned down power blocs. These come from the genre research doc (career, sports management, dynasty, 4X, grand strategy and simulation games): https://claude.ai/artifact/VGDEmfsJv4LgCXPwn8TyUQ. Nothing here is built. They sit in `TASKS.md` section 14, after the balance and first-hour work (Bill paused new features until that is done).

Sizes follow `WISHLIST.md`: S is one commit, M is two or three, L is a week with this plan as its start.

## 1. Wrestler career mode, "Road to the Main Event" (L)

Borrowed from NBA 2K MyCareer, MLB The Show's Road to the Show, EA FC Player Career and WWE 2K MyRise.

The player makes one wrestler in Create a Wrestler and signs with any company in the world. That company's AI booker books them, the same way rival shows are booked now. The player's week is spent backstage: asking for a title shot, a turn, a team or time off; building friendships and heat; cutting promos when they get the microphone; spending progression points; and weighing offers when the contract runs down. Being buried, losing at home, or a push promised and never given now happen to the player.

What it uses:

- Rival shows already run with no player (`livePlay()`); the player's company is booked that way.
- The seven asks people bring to Your office (`ask*` in `peopleNow()`) become the player's own moves, pointed at the booker.
- Progression (`src/99-progress.js`), contract clauses (`src/97-clauses.js`), job offers (wish 90), followers (wish 72), the live microphone (wish 81) and the relationship matrix (`relBump()`, `youRemember()`) work as they are.

Steps:

1. Engine: a game where `S.you` is a wrestler id and no company is the player's. A headless sim of 60 weeks with errs 0 and NaN 0.
2. The booker as a person who remembers what the player asked for and how they answered (the matrix, with the booker as one side).
3. The player's week: Backstage and the desk from the wrestler's side, the card they are on, the asks, offers.
4. The show on the air from the wrestler's side: the player's segments play, the gorilla calls are the booker's.

Open questions for Bill: does the player see the whole card before the show, or only their own spot? Can the player wrestle for two companies at once (outside dates clause)?

## 2. One life in wrestling (M, after 1)

Borrowed from Crusader Kings III (play on as your heir) and Football Manager (one save follows a manager across clubs for decades).

A wrestler's career keeps going after the boots come off. Retire into a second career as a manager, commentator or road agent, take the pencil as booker, and one day own the company. When that character is done, carry on as the student they trained.

What it uses: second careers already exist for everyone else (`src/85-second.js`, `SROLES`), who trained whom (`w.coach`), owner mode (wish 93) and careers with no end (roadmap 30). It grows A++++ 3 ("From ring crew to booker") and 42 ("New game plus").

Steps:

1. Switching the player from wrestler to staff to booker in one save, keeping the matrix and memories.
2. Taking the booker's job: an offer from the owner when trust and standing are high enough, or a job at another company.
3. Carrying on as a student when the character retires for good or dies.

## 3. The owner's five-year vision (M)

Borrowed from Football Manager's Club Vision.

The owner's opening letter sets a five-year plan that fits the company model. A public giant wants to double its television money and fill a stadium. A purist wants three new stars and a five-star match every month. A lucha traditionalist wants a mask against mask main event at the anniversary show. Each wrestling year (flagship to flagship) has a checkpoint and a review on the desk after the flagship, and owner's trust follows the plan as well as the last few weeks.

What it uses: the welcome letter (`E.welcome`, `src/96-first.js`), owner's trust, the annual report (wish 57), the nine models (`src/78-models.js`) and the win conditions in `src/92-scenarios.js` (`SCN_WIN`), which can already test most goals. Booker Mode only; Sandbox can switch it off.

Steps:

1. Goals as data per model, checked by `SCN_WIN`-style tests; the plan stored on `S`.
2. The plan in the welcome letter, and a yearly review after the flagship that moves trust.
3. A line on the desk saying how the year's goals stand.

## 4. The recruiting pitch (M)

Borrowed from College Football 25's recruiting (priorities, dealbreakers, pitching your strengths).

Every free agent wants three things from a short list: money, television time, a shot at a title, a home market, creative freedom, the company's standing, less travel, or a famous name to learn from. The Offer window says how well the company offers each one, in words ("You can give them this", "A hard sell"), never a grade. One can be a dealbreaker. Rivals pitch for the same people, so a star the player can afford can still say no.

What it uses: `clausesWanted()` and `E.sign` (`src/97-clauses.js`), hometowns and markets (`homeKm()`, `S.mkt`), the title picture (`rankFor()`) and career goals (`src/87-goals.js`).

Steps:

1. Priorities per wrestler, from goals, age, hometown and mood; how each company meets each, read from the game.
2. The Offer window shows the three and the dealbreaker; a signing depends on them as well as the wage.
3. Rivals compete for the same free agent, and After the show or the Net says who went where and why.

## 5. The path to the Hall (S)

Bill, 21 October 2026: "Path to the Hall of Fame i like". Borrowed from Baseball-Reference's Hall of Fame Monitor and the career pages in Out of the Park Baseball.

Every wrestler's file gets a career line (days as champion, main events, average stars, match-of-the-year awards, flagship wins) and one line in words on their case for the Hall: "Building a case", "On the path", "A lock". Never a number or a percentage. It feeds the Hall of Fame night (wish 76), the magazine's rankings (TASKS 0af) and the pictures planned for champions and the top ten.

What it uses: the record book (wish 98), title histories, awards (wish 75), the ranking in `src/70-season.js` and the Hall of Fame itself. It only reads the game and never calls `rnd(S)`.

Steps:

1. `E.hallPath(S, id)`: the career line and the words, from what the game already keeps; a headless test that a long career climbs the words and a short one does not.
2. The line on the wrestler's file, and the Hall of Fame night names who was "A lock" when they went in.

## 6. Wrestling families (M)

Bill, 21 October 2026: "i like wrestling families". Borrowed from Crusader Kings III's dynasties, where a family name carries renown across generations, and College Football 25's legacy recruits.

Second- and third-generation wrestlers. A rookie class can include a legend's son or daughter, with some of the parent's look, style and finisher. The family name brings an early lift with the crowd and early expectations: a second-generation wrestler who flops is a story too. Each file shows a family tree, the crowd remembers the parent's great nights in that wrestler's matches, and a family that keeps winning titles becomes a dynasty the commentary, the Net and the magazine talk about. A world package can name families, so a world's history carries them.

What it uses: the rookie class (wish 67), Create a Wrestler's looks, finishers (wish 4), the Hall of Fame, the world's history (`src/86-history.js`), the relationship matrix's family bond (gold in the corkboard plan) and the path to the Hall (5). It grows IDEAS A19 ("Family ties").

Steps:

1. Family links on wrestlers (`w.fam`: parent, siblings) kept in a world package and made by the rookie class, with a headless test over a long save.
2. What the name does: the early lift, expectations, the parent's history in the commentary and promos.
3. The family tree on the file, and dynasties on the Net and in the magazine.

## 7. Coalitions (M)

Bill, 21 October 2026: "I like coalitions". Borrowed from Europa Universalis IV's aggressive expansion: grow too fast and your neighbours band together against you.

Raid rivals too often, take over too many markets, or sign every hot free agent, and the rival owners team up against the player. A coalition shares talent among its members, books against the player's big nights, and refuses working agreements until things cool down. How close the world is to one is said in words on the World page ("They are watching you", "Talk of a pact", "A pact against you"), and the press reports it as it forms. It cools on its own over time, faster if the player makes peace (a working agreement, a talent loan, a fair invasion deal). A coalition can also form against a rival that grows too fast, and the player can join it.

What it uses: rival owners as people (wish 59), working agreements (wish 61), raids (wish 60), markets (`S.mkt`), invasions (`src/81-invasion.js`), head-to-head nights (`src/88-nights.js`) and the press (`src/99-press.js`). No `rnd(S)` outside the rivals' own decisions.

Steps:

1. A world measure of how aggressive each company has been (raids, markets taken, signings over the last year), headless, with a test that a calm game never forms a coalition.
2. The coalition itself: who joins (rival owners' attitudes), what it does each week, how it cools.
3. The line on the World page, the press, and a matter on the desk when one forms or breaks up.

## 8. Company mission trees (M)

Bill, 21 October 2026: "love 13" (idea 13 in the genre doc). Borrowed from Europa Universalis IV's mission trees and Endless Legend's faction quests: each side has its own chain of long goals, and each one finished opens the next.

Each of the nine company models gets its own tree of goals that take years. The startup's tree is about surviving the first year and landing a television deal. The outlaw's is about getting banned in one state and selling out the next town over. The lucha traditionalist's runs through a mask against mask main event at the anniversary show. The all-women company's ends in a stadium main event. Each goal finished opens the next ones and leaves a lasting bonus that fits the model (a better crowd for one kind of match, a cheaper building, a network that trusts you more). A company the player founds picks a tree from the model it is closest to. Rival companies follow their own trees too, so the world can see a rival closing in on its big goal.

What it uses: the nine models (`src/78-models.js`), company arcs (`src/99-arcs.js`, so a goal can start an arc), the `SCN_WIN` checks in `src/92-scenarios.js`, the milestone wall (wish 91) and the owner's five-year vision (3), whose yearly goals can be drawn from the tree.

Steps:

1. Trees as data, one per model, each goal a `SCN_WIN`-style test and a bonus; the player's place in the tree kept on `S`; a headless test that every tree's first goals can be met in 60 weeks.
2. A page of the tree on Company (the goals done, the ones open, what each gives), with a note when one is finished.
3. Rival companies follow their trees, and the Net reports a rival close to a big goal.

## 9. The territory map (M to L)

Bill, 21 October 2026: "14. I love this too, but it should be the color of the current most popular company in that region". Borrowed from Civilization's culture borders: one map, coloured by who holds what, that tells the state of the world at a glance.

One cut-paper map of the world. Each region is coloured by the company that is most popular there right now, in that company's own colour (from its logo). The colour changes when another company overtakes it, so the map shows the war as it moves. A region where two companies are close is striped in both colours. A region the player takes over gets a pin and a line on the desk, and a region the player loses is a matter. Pressing a region shows each company's standing there, in words, and its last few months.

Popularity by region comes from what each company draws there: its markets in the region's cities, its shows and tours there, its television reach and its hometown stars. The player's markets already exist (`S.mkt`, where "Your territory" is the top word); rival companies need the same, kept the same way, before the map can be honest.

What it uses: the road's maps and shapes (`src/91-shapes.js`, `drawShape()` in `kit/roadmap.tsx`), regions (`regionOf()`, `src/89-regions.js`), markets (`S.mkt`, `mktMult()`), tours abroad (wish 55), networks and their size (`src/88-shows.js`) and company logos (`src/89-logos.js`) for the colours. It feeds coalitions (7), since a company that holds too many regions is the one others band against.

Steps:

1. Markets for rival companies, moved by their own shows the same way the player's are; a headless test over 60 weeks that regions change hands sometimes and not every week.
2. `E.territory(S)`: the most popular company in each region, how close the next one is, and how it has moved. Only reads the game.
3. The map: a page of its own reached from the World page and the desk's road window, regions filled in company colours, stripes for close ones, a region's standings on press.
4. Lines on the desk and the Net when a region changes hands.
