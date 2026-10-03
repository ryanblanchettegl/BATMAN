# EWF 9000: 100 wishes

Things that would make the game deeper. Each one adds a system, a choice or a memory that the player can feel over a long save. They are bigger than the jobs in `TWEAKS.md` and smaller than the features in `TASKS.md`. Read `CLAUDE.md` first.

**How to work this list**

- Do `TWEAKS.md` section B (tests) before anything here. Wishes change the engine, and the tests are what keep it honest.
- Pick by size. **S** is one commit. **M** is two or three: the engine part, then the place the player sees it, then a test. **L** is a week of commits; write a short plan in `docs/plans/<name>.md` first and commit that.
- Engine first. A wish is real when a headless sim uses it for 60 weeks with errs 0 and NaN 0. Then give it one clear place in the interface, not a new page, unless the wish says so.
- The player must see it. Every wish needs a line the player reads when it happens (a note, a pop-up line, a report line) and a place to look it up later. A hidden number that changes nothing the player can read is not done.
- Old saves must load. New fields on `S` need a default when missing. If that is not possible, bump the save version and write the migration (rule 9).
- **(TASKS n)** means the wish belongs to that task in `TASKS.md`. Build it as part of the task, or build only the engine half and leave the screen to the task. Do not build a screen that task 3 will replace.
- **(ask Ryan)** means the wish changes how the game feels or what it shows. Do not build it unasked. Write a half-page proposal in `docs/proposals/<name>.md` and move on.
- "Check first" means the engine may already do part of this. Read the file named before writing anything.
- Every rule in `CLAUDE.md` holds: original or public-domain names only, no real promotions, wrestlers, stables, titles or events, no dice wording, no external assets, four inputs.
- Tick the box in the commit that finishes the wish. If a wish turns out to be a bad idea, tick it and say why in the commit message.

## A. Wrestlers as people

- [ ] **1. Career goals.** Each wrestler has one or two goals: hold the top title, main-event the flagship, win a tournament, team with a hero, reach a wage. The pop-up card shows progress. Meeting a goal lifts morale and loyalty. A goal blocked for a year starts a clock. *M. Builds on `src/75-people.js` and the cards. (TASKS 10)*
- [x] **2. Careers have a shape.** High flyers peak young and fade fast. Brawlers and talkers last. The card says "rising", "in his prime", "past her best" in words, and the yearly change is reported once a year in the inbox. *M. Check the yearly aging code in `src/75-people.js` first.*
- [x] **3. Wear and tear.** A body score that hard matches and stipulations wear down and rest restores. A worn body works worse and gets hurt more. The player sees a word, not a number: fresh, sore, banged up, running on fumes. *M. Builds on `E.rest`, `E.workHurt`, `E.medInfo`.*
- [x] **4. Finishers.** Every wrestler has a named finishing move, built from word lists by style. A finisher nobody kicks out of lifts the crowd. Booking kick-outs spends that protection. *M. Hooks: `MQX`, `CRX`.*
- [x] **5. Gimmicks go stale.** A gimmick has freshness. It climbs, peaks and fades. A repackage or a turn resets it. Freshness shows on the card as a short bar. *M. Builds on `E.repackage`, `E.gimFit`.*
- [x] **6. Turns need a build.** A turn teased over two shows lands harder. A wrestler who turned inside the last year lands softer, and the fans say so. *S. Check how turns work in `src/20-story.js` first.*
- [x] **7. Life outside the ring.** A wedding, a new baby, a move across the country, a film part, a book. Each is an inbox event with a real choice: time off, a lighter schedule, or work it into a story. *M. (TASKS 8)*
- [x] **8. Booking makes friends and enemies.** Pairs who travel together, who made each other look good, or who refused to lose to each other, build a score. That score feeds chemistry and backstage incidents. *M. Builds on `E.chem`, `E.relations`.*
- [x] **9. Who trained whom.** Store the trainer of every wrestler the player develops. The card lists trainer and students. Students pick up a little of the trainer's style. Add a "family tree" pop-up drawn in text. *S. Builds on `E.setMentor`, `E.mentorsFor`.*
- [x] **10. The last year.** A veteran announces a final year. The farewell tour lifts gates, the last match is a draw, and the player chooses who gets the honour of the final win. *M.*
- [x] **11. Second careers.** A retired wrestler can stay as a road agent, trainer, commentator, manager or on-screen boss. Each role uses one of their old skills. *M. Leads into wishes 19, 34 and 46.*
- [x] **12. Comebacks.** A wrestler back from injury gets a returning pop that fades over four weeks. Bringing them back early is an attempt with a chance of re-injury. *S. Builds on `E.workHurt`.*

## B. In the ring

- [x] **13. The crowd has a night.** Crowd energy is one pool across the show. Two hot matches back to back tire it. A talking segment lets it breathe. The booking screen shows the predicted energy line in text. *M. (TASKS 3)*
- [x] **14. Agent notes.** One instruction per match: go long, keep it short, protect the loser, work the crowd, steal the show, work safe. Each trades quality against risk and the loser's standing. *M. (TASKS 3 for the screen)*
- [x] **15. Finishes have a price.** Clean, roll-up, count-out, disqualification, interference, time-limit draw. Each protects or hurts the people in it and heats or cools the feud. Too many unclean finishes in a month and the crowd turns sour. *M. Check `FINX` in `src/10-match.js` first.*
- [x] **16. A library of match types.** Ladder, cage, iron man, submission, lumberjack, mask against mask, hair against hair, tables. Each rewards its own skills, carries its own risk, and suits some models better than others. *M. Check `E.MT` first.*
- [x] **17. Gimmick matches wear out.** Each match type draws a little less every time it is used inside a year, and recovers with rest. The booking screen says "fresh" or "overused". *S.*
- [x] **18. Referees.** Three or four named referees with a skill score. A weak one can miss a call, which becomes a story. A good one lifts the main event. *S.*
- [ ] **19. The commentary desk.** A play-by-play voice and a colour voice, signed like anyone else, with chemistry between them. They change the broadcast score and how well stories get across. *M.*
- [x] **20. Managers who meddle.** Managers exist. Add interference attempts at ringside, heat that belongs to the manager, and the manager turning on the client. *S. Builds on `E.setManager`, `E.mouthpieces`.*
- [x] **21. Teams grow together.** A team gains experience as a unit, earns a team finisher at a threshold, and keeps a record of wins and losses as a team. *M. Finishes the open box in TASKS 1.*
- [x] **22. Botches and saves.** Rarely, a risky move goes wrong. A veteran in the match can attempt to cover for it. The report says what happened in one line. *S.*
- [x] **23. Match of the year, live.** A running top ten of the year's best matches across every promotion, on the History page, with a pop-up for each. *S. (TASKS 7)*
- [x] **24. Styles clash and blend.** A grid of style against style. Some pairs are magic and some are dull. The player finds out by booking them, and the card then lists "works well with" and "avoid". *M. Builds on `E.STYLES`, `E.chem`.*

## C. Telling stories

- [ ] **25. Storyline templates with beats.** The system in TASKS 2: roles, a cost in booking power, beats over weeks, a payoff and a way to backfire. *L. (TASKS 2)*
- [x] **26. The long plan.** Pencil in the flagship main event months ahead. The game tracks whether each show builds toward it and pays a bonus when a plan made early is paid off. Changing the plan late costs. *M. Builds on `E.setPlan`.*
- [ ] **27. Promo kinds.** Interview, challenge, brawl, contract signing, taped vignette, sit-down, celebration. Each uses different skills and fails in its own way. *M. (TASKS 3)*
- [x] **28. Catchphrases.** A promo that lands can coin a catchphrase from a word list. It lifts pops and merchandise until it is overused. *S.*
- [x] **29. Titles have prestige.** Prestige rises with good defences and credible reigns. It falls with quick changes and champions losing non-title matches. A prestigious title lifts every match it is in. *M. Check `E.showTitles` first.*
- [x] **30. Contender ladders.** A ranked top five per title, earned by wins. A challenger who earned the shot lifts the match. Jumping the queue costs most in the purist and tradition models. *M. Builds on `E.rankFor`.*
- [ ] **31. Brackets and leagues.** Tournaments exist. Add a bracket drawn in text, a round-robin league with a points table for the purist model, and upsets that become stories. *M. Builds on `E.startTourn`.*
- [ ] **32. Stable roles.** Leader, enforcer, mouthpiece, young gun, workhorse. A stable has unity. A member with no role or no wins is a split waiting to happen. *M. Builds on stables in `src/60-rpg.js`.*
- [x] **33. Debuts with a build.** Run teaser vignettes for weeks before a debut. A hyped debut starts hot. An over-hyped one that flops costs more than no hype. *S.*
- [ ] **34. The on-screen boss.** A general manager character who makes matches and feuds with a rebel. Used well it explains the booking. Used too much it overshadows the wrestlers, and the fans say so. *M.*
- [ ] **35. The game remembers.** Who betrayed whom, who has never beaten whom, who has never met. "First time ever" and "they have history" become bonuses, report lines and news. *M.*
- [x] **36. Cliffhangers.** End a show on an open question and the next show opens to a bigger audience. Leave three open at once and the crowd stops caring. *S. (TASKS 3, each show feeds the next)*

## D. The locker room

- [x] **37. Locker-room leaders.** One or two respected veterans keep order. Lose them and incidents rise. The Locker room page names them. *S. Builds on `src/76-locker.js`.*
- [ ] **38. Cliques.** Friends form a group. A clique with a top star asks for favours as a block: a push for a friend, a rival held down. Say yes, say no, or break them up. *M.*
- [ ] **39. Creative control.** A top star can win the right to refuse a loss. Overriding it costs booking power and trust. *M.*
- [ ] **40. Contract clauses.** Dates per month, a merchandise share, paid travel, a no-cut promise, outside dates, a title promise. Talks go back and forth two or three times. *L. Builds on `E.ask`, `E.sign`, `E.renew`.*
- [x] **41. Ask the room.** Before a signing, find out who is glad and who is angry about it. *S. (TASKS 10)*
- [x] **42. A court with a memory.** The wrestlers' court exists. Add a record of verdicts, harsher results for repeat offenders, and a judge chosen from the veterans. *S. Builds on `E.court`.*
- [x] **43. House rules that bite.** Dress code, curfew, testing. Each trades morale against incidents, and each model has a view. *S. Check `E.RULES` first.*
- [ ] **44. The road.** A heavy schedule tires people. Travel partners become friends or come to blows. A bus or a charter is a spend that helps. *M.*
- [ ] **45. Holdouts.** A star who earns less than a peer sits at home. Pay up, make a promise, or call the bluff. *M.*
- [ ] **46. Road agents.** Assign an agent to a match. A good one lifts young wrestlers and lowers risk. One agent covers two matches a night. *M. Needs wish 11.*

## E. The business

- [ ] **47. Merchandise lines.** Commission a design for a wrestler. Each design has a sales curve. A hot catchphrase or a title win sells. *M. Builds on `merchWeek` in `src/00-core.js`.*
- [ ] **48. Ticket prices.** Price tiers per building. Too high leaves seats empty, too low leaves money on the table. The game suggests a price. *M. (TASKS 4)*
- [x] **49. Production values.** Spend on lights, set, pyro and cameras. It lifts the broadcast and the big matches. The corporate model expects it. The outlaw model does not care. *S. Check `E.budget` first.*
- [ ] **50. The tape library.** Every show joins a back catalogue with a value. The library earns streaming money and can be licensed out or sold in a crisis. *M. (TASKS 5)*
- [ ] **51. A developmental show.** A small weekly show that runs by itself, with a short report on each prospect and a call-up moment. *M. Builds on `E.callUp`, `E.sendCamp`.*
- [ ] **52. The wrestling school.** Take students for a fee. One in several becomes a prospect. The trainer's quality decides how good. *M. (TASKS 10)*
- [ ] **53. Loans and investors.** A bank loan with interest, or an investor who takes a share and has opinions about the product. *M.*
- [x] **54. Medical staff.** Pay for a doctor and trainers. Injuries are fewer and shorter, and wear (wish 3) recovers faster. *S. Builds on `E.medInfo`.*
- [ ] **55. Tours abroad.** Two or three weeks overseas: big gates, a tired roster, and a following in a new region. *M. Builds on `E.zones`.*
- [ ] **56. Licensing.** Toys, a video game, trading cards. They unlock as popularity grows, pay once a year, and want stars on long contracts. *M.*
- [x] **57. The annual report.** A year-end window: money by source as a text chart, best draw, best match, biggest signing, and a letter from the owner. *S.*
- [ ] **58. Department budgets.** Monthly budgets for talent, production, travel and promotion, with a warning when one runs over. *S. Check `E.budget` first.*

## F. The world

- [ ] **59. Rival owners are people.** Each rival owner has a temperament: raider, gentleman, hermit, showman. It decides how they raid, trade and talk about you. *M. (TASKS 10)*
- [ ] **60. Raids.** A rival makes a run at your star as the contract runs down. Match it, beat it, appeal to loyalty, or let them go. *M.*
- [ ] **61. Working agreements.** A formal partnership: talent exchange, a title recognised by both, a joint show. Agreements can sour. *M. Builds on `E.xfPropose`, `E.trade`.*
- [ ] **62. Rivals can die.** A broke rival folds or is bought. Its roster floods the free agents, and its titles and tape library go up for sale. *M.*
- [ ] **63. New companies appear.** Every few years a backer starts a company and signs free agents. Sometimes it grows out of an indie. *M. (TASKS 9)*
- [ ] **64. Regional tastes.** Each region likes a kind of wrestling: work rate, brawling, spectacle. The wrong product draws less there. *M. Builds on `E.zones`.*
- [ ] **65. Title histories of the world.** Every title in every promotion keeps its full line of champions, open from any title pop-up. Partner promotions can unify titles. *M.*
- [ ] **66. Invasions.** A cross-promotion story where a rival's wrestlers appear on your shows. Both sides must agree the winners. Done badly, one side looks weak for a year. *L. Builds on `E.sagaInfo` and the cross-promotion code in `src/80-world.js`.*
- [ ] **67. The rookie class.** Each year a class of new wrestlers arrives by region, with a scouting report and a "class of" list to look back on. This also fixes the free-agent pool running dry. *M. Builds on `E.scout`.*
- [x] **68. The bar moves.** When a rival has a great night in a city you share, your next show there has more to live up to. The news says so. *S.*

## G. Fans, press and culture

- [x] **69. Four kinds of fan.** Casuals, diehards, families and kids, each with their own view of your product. Every model weights them differently. Company shows four bars. *L. Changes crowd maths everywhere. (ask Ryan)*
- [ ] **70. The crowd takes over.** A crowd that rejects the pushed star chants for someone else. It shows in the report and happens more in diehard cities. *M.*
- [ ] **71. The fan board grows up.** Posts name matches, give them stars and argue with each other. One invented critic keeps a ratings list the wrestlers care about. *M. Builds on the net page.*
- [x] **72. Followers.** Each wrestler has a following that grows with big moments. A clip can spread, bringing casual fans and merchandise. *S.*
- [x] **73. Speaking out.** A released wrestler gives an interview. It can hurt morale, reveal a rival's plans, or settle a score. *S.*
- [x] **74. Guest stars.** An actor, athlete or singer made up by the game does a one-night spot. Casuals tune in, diehards groan, and the match itself is a risk. *S.*
- [ ] **75. Awards night.** A yearly ceremony screen with categories and short speeches. Winners gain morale and ask for more money. *M. (TASKS 7)*
- [x] **76. Hall of fame night.** The hall of fame exists. Add an induction on the flagship weekend with a speech and a lift for the crowd. *S.*
- [x] **77. Trouble in public.** A star makes the wrong kind of news. Suspend, bury, or stand by them. Keep it light and vague. *M. (ask Ryan about tone)*
- [x] **78. Home-town heroes.** A wrestler in their home city gets a pop. Beating them there costs. A home-town title win lifts the city. *S. Needs a home city per wrestler in the universe file.*

## H. Moments from wrestling history

Situations modelled on famous nights, each under an original name with invented people. The player is put in the room and makes the call. Each is an inbox event with three or four choices, an attempt where luck matters, and results that last for months. *All (TASKS 8). Each is S once the first one has set the pattern.*

- [x] **79. The champion who is leaving.** The contract ends the night of the big show and the champion will not lose in that city. Trust them, change the finish behind their back, strip the title, or pay to keep them.
- [x] **80. The belt on the wrong show.** A departing champion turns up on a rival's broadcast with your title. Sue, laugh it off, or crown a new champion in a hurry.
- [x] **81. The live microphone.** A wrestler with real grievances goes off script on live television. Cut the feed, let it run, or fine them after. Letting it run can make a star.
- [x] **82. The curtain call.** Friends on opposite sides of a story hug in the ring at a farewell. Someone has to be punished, and the only one you can afford to punish is your next big thing.
- [x] **83. The title handed over.** A group with clout wants the title passed to their friend without a real match. Agree and the title's prestige collapses. Refuse and they turn on you.
- [x] **84. The surprise arrival.** A rival's biggest star is free tonight and willing to walk onto your show unannounced. It costs a fortune and your locker room is watching.
- [x] **85. Giving away their result.** Your show is live and theirs is taped. Announce their result on air to spoil it. It can send your viewers over to watch.
- [x] **86. The walkout.** Two wrestlers unhappy with their booking leave the building before a live show. Rebook in ten minutes, and decide what happens to them.
- [x] **87. Not fit to perform.** Your main-event star arrives at the biggest show of the year in no state to wrestle. Send them out, swap the match, or tell the crowd the truth.
- [x] **88. The wrong hero.** The flagship crowd boos the hero you spent a year building and cheers the villain. Change the finish on the night, or hold your nerve.

## I. Your career

- [ ] **89. A reputation as a booker.** Traits earned by how you book: star maker, hot-shot booker, friend of the workhorse, keeper of titles. Each gives a small edge and a small cost, and rivals and wrestlers mention it. *M. Builds on `E.career`, `src/65-you.js`.*
- [x] **90. Job offers with terms.** Offers exist. Add terms to bargain over: budget, creative freedom, one signing of your choice. *S. Builds on `E.jobOffers`.*
- [x] **91. The milestone wall.** A long list of firsts with dates: first sell-out, first top-grade match, hundredth show, first champion you built from nothing. Shown on Career, with a pop-up when one lands. *S. (TASKS 7)*
- [ ] **92. Legacy.** When you are fired or step down: a timeline of the career, the stars you made, your best matches, and a score to beat next time. *M.*
- [x] **93. Owner mode.** As owner, hire a booker for a second brand, set their goals, and sell or buy shares. *L. (ask Ryan)*
- [ ] **94. The assistant.** Train an assistant booker who learns your habits and can book the small shows your way. This is what fast mode uses. *M. (TASKS 3, fast mode)*

## J. Modes and tools

- [ ] **95. Scenarios.** Start with a problem and a deadline: save a company in 26 weeks, make a world champion from the bottom of the roster, win a ratings war. Each ends with a result screen. *M.*
- [x] **96. Difficulty by part.** Separate settings for money, injuries, egos and rival aggression, chosen at the start and shown on Career. *S. Builds on `E.DIFF`.*
- [x] **97. One save, no going back.** A mode with a single save written every week. Marked on Career. *S.*
- [ ] **98. The record book.** Sortable records: most reigns, longest reign, best average match grade, biggest gates, longest winning run. Every name opens its pop-up. *M.*
- [x] **99. The universe editor.** Edit promotions and wrestlers inside the game, with problems explained in plain words. *L. Builds on `E.validateUniverse`. (ask Ryan about scope)*
- [ ] **100. The weekly challenge.** A dated seed: the same world for everyone, twelve weeks, one score. No server. The score is a short code the player can copy and share. *M.*
