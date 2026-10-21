# Careers and the long game: four features from other genres

Bill, 21 October 2026: "I like ideas 1-5 add those to long term planning", then "one life in wrestling is awesome too", and dropped free agency week ("wrestling doesn't have a free agency week, lets not do that"). These come from the genre research doc (career, sports management, dynasty, 4X, grand strategy and simulation games): https://claude.ai/artifact/VGDEmfsJv4LgCXPwn8TyUQ. Nothing here is built. They sit in `TASKS.md` section 14, after the balance and first-hour work (Bill paused new features until that is done).

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
