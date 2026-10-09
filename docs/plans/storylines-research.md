# Research: how wrestling stories really run

8 October 2026. Ryan: "research wrestling storylines before you continue. Wrestling doesn't really have seasons."

This is how real companies have built stories, so the game can follow it (rule 3: models and storylines may follow how real companies and angles worked; game content never names them). Sources are at the end. Where a point comes from general knowledge of the business rather than a source found today, it says so.

## 1. There are no seasons

Wrestling runs every week of the year. There is no off-season and no point where everything resets. One network's guide to the biggest stretch of the year says it plainly: the company "has no off-season".

What the year does have is a rhythm of big nights, and those nights are not equal:

- **One show a year is the biggest.** Everything important is aimed at it. The weeks before it have a name of their own, "the road to" that show, starting about ten to twelve weeks out at a January event whose winner earns a place in its main event. Stories on that road "are meant to reach conclusions and end".
- **Some companies hang the year on two anchors.** One Japanese company's summer round-robin tournament runs about four weeks, and its winner earns a title match at the January flagship show. The year is built around getting there.
- **Some companies build to only a few matches a year.** The big Mexican company runs its main arena three times a week and builds to a few big stakes matches a year, usually at its anniversary show.
- **In between, a big event comes round about once a month** in the modern television era, and most stories end at one of them.

So the game should not talk about a season. It should talk about **the next big night**, and about **the road to the flagship**, the one show a year that matters most. The game already has this: every company has a flagship month (`P.flagship`), and the long plan pencils in its main event.

## 2. The unit of a story: build on television, pay off at the big show

- **Modern era:** weekly television is episodic, each week building on the last, and the payoff comes at the special event. Fans should not get the big match for free on television; giving it away early is called hotshotting.
- **Territory era:** a company ran a weekly loop of towns (one territory: Monday in one city, Tuesday in the next, Friday and Saturday in two more). Television was the advertisement; the arena was the payoff. A hot program could fill the same towns for months. A program was set up on television and blown off at the arena.
- **Indie companies selling recordings:** every show roughly equal, each building to the next, stories ending whenever they end.

What the game has (weekly shows building to a big event every fourth week) is the modern pattern, and it is right.

## 3. The shape of a feud

A feud is a rivalry built through matches, promos and angles, usually lasting several months. It starts with an angle (often an attack that calls for revenge), builds, and ends with **the blow-off**, the last match.

- **How it ends:** the blow-off is often a match with stakes that make it final: a cage, no disqualification, the loser leaves town (the loser is gone from the company for a while, the old territory way of writing somebody out), or in Mexico a bet of a mask or hair (luchas de apuestas), which can be the end of a rivalry years in the making.
- **The rubber match:** two meetings split one each, and a third settles it. This is a common shape for a feud that runs past one big event.
- **The finish that settles nothing:** a win taken away on a technicality, by interference or a referee's mistake. Bookers used it so that the hero seemed to win but nothing changed, and the rematch drew more. Used too often, fans felt cheated and stopped believing a big match would settle anything.
- **The chase:** a hero chasing a villain champion for months, cheated again and again, until the win at the biggest show. "The agony is the ecstasy": the win means more for the struggle before it. One famous chase lasted five years.
- **Two common ways to ruin a feud:** running it past its climax (one example had nine meetings in three months; another kept going two months after the biggest show of the year), and peaking the stakes too early. Fans need breaks between meetings; a match that happens rarely feels special.

## 4. Lengths are real, but they are set by the big nights, not by a number of weeks

- **Short:** a few weeks of television and a match, often a challenger for a month or a quick grudge. It ends on television or at the next big event. (General knowledge: this is how a company keeps its mid-card busy.)
- **Medium:** the common case, built to one big event about a month or two away.
- **Long:** months, sometimes a year: a chase, a slow burn, a story that runs through several big events and ends at the flagship. Long stories work when there is an overarching thread rather than the same two people meeting every week.

## 5. Rivals are real, and they come back

- A real rivalry outlives any one feud. One Mexican rivalry ran about ten years across two companies and abroad: a first bet of mask against hair, years of regular meetings, a role switch (the hero turned villain and the villain turned hero), a title lost through the other's interference, and a final bet at an anniversary show.
- Rivalries are revisited after breaks, and a break makes the next meeting bigger.
- A rivalry is renewed by a change: a turn, a title, a betrayal.
- Rivals can settle a series later with a rubber match.
- Rivals follow the people, not the company: a rivalry can carry on when one of them changes company.

## 6. What this changes in the plan (`docs/plans/storylines.md`)

1. **Drop the word season.** The calendar on the Storylines page becomes "The next twelve weeks", and its lights say the next big night. Nothing in the game uses "season" for stories.
2. **A long story is the road to the flagship.** It ends at the company's flagship show, and its chapters are the big events on the way there. A long story started after the flagship ends at next year's. (Today: three chapters over 12 to 24 weeks, which is a number, not a reason.)
3. **The finish that settles nothing is a real move.** A blow-off ended by disqualification, count-out or interference does not settle a story; it carries on to the next big night. It already does this by accident (`feudDue()` needs a clean finish). Make it a choice with a cost: the crowd tires of it the second time.
4. **The rubber match:** when a story's two big meetings have split one each, the game offers a third at the next big night as the decider.
5. **Too many meetings cool a story.** Every meeting before the blow-off after the second or third takes a little heat ("they have seen it"), and a break of a few weeks between meetings gives some back.
6. **Stakes that end things:** loser leaves town (the loser is off the roster for some weeks, then comes back with a reason), and mask or hair for a company whose model fits it.
7. **Rivals come back.** As planned: a rivalry lasts years, follows people between companies, is renewed by a turn or a title, and a meeting after a long break draws more.
8. **The checks stay**, worded for nights rather than a season: a big night with no story ending there, too many ending on one night, a story past its night, someone in two stories, a champion with no challenger.

## Sources

- [What does the Road to WrestleMania mean? (USA Network)](https://www.usanetwork.com/usa-insider/wwe-what-does-the-road-to-wrestlemania-mean)
- [What is the NJPW G1 Climax? (F4W)](https://www.f4wonline.com/event-guides/njpw-g1-climax-guide-what-is)
- [Differences in the booking calendar (Pro Wrestling Only forum)](https://forums.prowrestlingonly.com/topic/31780-differences-in-the-booking-calendar/)
- [Tri-State territory introduction (Kayfabe Memories)](https://kayfabememories.com/Regions/tristate/tristateintro-2.htm)
- [Back to the territories: Houston wrestling (Culture Crossfire)](https://culturecrossfire.com/wrestling/kayfabe-lies-and-alibis-back-to-the-territories-houston-wrestling-w-bruce-prichard-and-jim-cornette/)
- [The art of the Dusty finish (Grantland)](https://grantland.com/features/the-art-dusty-finish-cm-punk-reference-wrestling-lore-wwe-night-champions-event/?print=1)
- [Delayed gratification and the chase (Grantland)](https://grantland.com/features/daniel-bryan-wwe-championship-art-delayed-gratification/?print=1)
- [What is a rubber match? (Sportskeeda)](https://sportskeeda.com/wwe/what-rubber-match-the-real-meaning-cody-rhodes-challenge-brock-lesnar-wwe-raw)
- [Feuds that last forever with no ending (AIPT)](https://aiptcomics.com/2020/12/15/wwe-feuds-last-forever-no-ending/)
- [A decade-long lucha rivalry (Big Egg)](https://bigegg.substack.com/p/el-hijo-del-santo-vs-negro-casas)
- [List of professional wrestling terms (Pro Wrestling Wiki)](https://prowrestling.fandom.com/wiki/List_of_professional_wrestling_terms)
- [House show (Grokipedia)](https://grokipedia.com/page/House_show)
- [The territorial era (Wrestling Profiles)](https://wrestlingprofiles.com/era/territorial-era/)
- [Building an invasion storyline (Slam Wrestling)](https://slamwrestling.net/?p=15646)
