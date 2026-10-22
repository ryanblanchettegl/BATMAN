# Traits, and perks at 60, 70, 80 and 90

Bill, 21 October 2026: "p2 - yes i want this. along with attributes each character should have traits, that defines what they want, how they react and their personality, research how madden currently does this. I would also like wrestlers to get a perk at level 60, 70, 80, and 90. These perks have specific benefits to specific style. Research how madden does this." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea P2). Nothing here is built. One step at a time (rule 9a).

## What Madden does

**Personality and motives.**

- *Madden 26* gives each player in franchise mode **motivations**, three things they care about when choosing a team: close to home, a big market, the highest offer, a head coach with a winning record, a mentor at their position, a team that wins titles, a scheme that fits them, no state income tax, a team with a franchise quarterback, a Super Bowl chase, a warm-weather state, top of the depth chart. Meeting them makes a player cheaper and more willing to sign or stay. Players also carry **tags** for the role they play on a team: Franchise QB, QB of the Future, Bridge Player, Day 1 Starter, Future Starter, Mentor (only players with the Leader personality), Award Winner, Trade Target. (Deltia's Gaming guides to Madden 26 motivations and tags.)
- *Madden 27* replaces this with the **Persona Engine**: each player has "Persona DNA", one of 65+ types that sets their mindset, career focus, motivation and how they react to what happens. A player can gain a different DNA for a while after something happens to them. Personas drive holdouts, trade demands, conversations with the coach and weekly "emergent actions"; contract talks have Patience and Interest meters that the persona moves. (EA, "Madden 27 Franchise Mode Deep Dive".)
- Older Maddens had four personality types (Leader, Team Player, Reserved, Unpredictable) and on-field traits (Clutch, High Motor, Covers Ball, Big Hitter, Sense Pressure) that change how a player acts in a game, not what they want.

**Abilities at rating thresholds.**

- Each player has a number of **ability slots** set by their overall rating. In *Madden 24* a Superstar gets three slots at 75, 80 and 85 overall, and a fourth only as an X-Factor at 95; quarterbacks have five, at 70, 75, 80, 85 and 90. (Madden School.)
- Abilities belong to an **archetype**: a power back cannot equip a receiving back's ability. Since *Madden 23* each ability also has its own entry rule (some need 90 or 95 in the archetype, others 70). (Madden School.)
- **X-Factors** are the top tier. They are dormant until a player meets an in-game condition (a run of completions, a few big plays) and then switch on, until something switches them off (a sack, an interception). Examples: Bazooka, Run & Gun, Freight Train, Shutdown. (GamesRadar.)
- If a player's rating falls below a slot's threshold, they lose what was in it.

**What we take.** Motives that change what a person will agree to (Madden 26); a personality that changes how they react, which can shift for a while after something happens to them (Madden 27); perks tied to a style, unlocked by rating thresholds and lost if the rating falls (Madden 23 and 24); and a top tier that has to be switched on by what happens in the match (X-Factors). **What we leave.** 65 hidden types: every trait here has to be one the player can read and understand in a sentence.

## Three kinds of thing a wrestler carries

The game already has **earned traits** (`TRAITS` in `src/60-rpg.js`: Big-match performer, Closer, Workhorse and the rest), which a wrestler earns by what they do. Those stay as they are and are called **reputations** on screen, so the word "trait" is free for what Bill asked for. A wrestler then carries:

| Kind | How many | Where it comes from | What it changes |
| --- | --- | --- | --- |
| **Wants** | Two or three | Their backstory and what has happened to them | What they ask for, what they will sign for, when they are happy |
| **Personality** | Two | Set at creation, rarely changes | How they react to your choices, to a loss, to a rival, to the room |
| **Moods** | None or one at a time | Something that just happened to them | A personality bent out of shape for a few weeks |
| **Reputations** | Any | Earned in the ring (today's `TRAITS`) | How they perform |
| **Perks** | Up to four | Their overall rating and their style | Specific benefits in the ring and on the mic |

All of it sits in the backstory block planned in `docs/plans/characters.md` (step 1), which already lists `traits`, `wants` and `fears`. This plan replaces that plan's single list of ten traits with wants and personality, and adds moods and perks.

## Wants (what they want)

The wrestling version of Madden's motivations. Each want has a check the game can make and a line in the wrestler's file that says where it came from (P2: "released twice, so wants security above money").

| Want | Happy when | Tied to |
| --- | --- | --- |
| The top title | They are in the title picture, or holding it | Titles, title promises |
| Money | They are paid at or above their worth | Contracts |
| Security | A long contract, no release threat | Contracts, `w.cut` |
| A spot on the big shows | Booked on every big event | The calendar |
| Home | Booked near their home town; time off for family | `homeKm()`, life events |
| Respect of the room | High standing with the locker room | The relationship matrix, cliques |
| Creative say | Their ideas taken; creative control | Requests at your door |
| A worthy rival | A long feud with someone at their level | Feuds |
| Legacy | Matches with legends, a big send-off | Last run (wish 10) |
| Revenge | A match with the person who wronged them | Memories (`youRemember()`, `mem`) |
| To be the face of the company | Main events and the cover of the magazine | Card position, magazine (0af) |
| To teach | Young wrestlers to work with | Teacher and student |
| A good company | Their company winning the ratings war | The world |

**What wants do.** A want met lifts morale each week; a want ignored for a season drags it. Wants feed contract talks (the Madden idea: a met want lowers the price, an unmet one raises it, and a rival company that meets it can steal them), requests at your door, walkouts and leaks.

## Personality (how they react)

Two from this list per wrestler, never two that contradict (no Loyal and Mercenary). It sets how big a reaction is, not which choices are good. It works through `relBump()` and `youRemember()` (rule 9b).

| Personality | How they react |
| --- | --- |
| Loyal | Remembers good treatment longer; a rival's offer tempts less |
| Mercenary | Goes where the money is; forgets loyalty fast |
| Hothead | Real heat builds faster; a loss or a slight hits hard; trouble on the night |
| Cool head | Slow to anger; steadies a partner |
| Proud | Hates losing clean; may refuse a finish (live call 25) |
| Humble | Takes losses well; asks for little |
| Ambitious | Asks for shots sooner; a push lifts them more; a stall drags harder |
| Leader | The room follows their mood; can be a mentor (Madden: Mentor needs Leader) |
| Loner | Ignores cliques; bonds slowly but deeply |
| Party animal | Trouble on the road; the room likes them |
| Professional | Never late, never fights; a little dull on the mic |
| Showman | Loves the camera; forgives a bad match if the promo landed |
| Jealous | Watches who gets pushed; jealousy builds faster (the soap opera arc) |
| Family first | Wants time at home; steadier when they get it |

## Moods (Madden 27's temporary DNA)

Something happens, and for a few weeks the wrestler carries a mood that bends their personality. It is shown in their file with the reason. It runs out on its own, or something ends it.

| Mood | Brought on by | For a while |
| --- | --- | --- |
| Bitter | Buried, a promise broken, a title taken in a screwjob | Ignores good news; leaks more |
| On a roll | A hot run, a big win | Asks for more; carries the room |
| Rattled | A bad injury, a botch on a big night | Plays it safe; worse in big moments |
| Proving it | Released, then signed (today's `w.chip` in `src/78-models.js`) | Works harder; a bigger reaction |
| Homesick | Long time on the road, a life event | Wants home; gets home time or drags |
| Hungry | A long time off the card | Grabs any chance; good for a breakout |

## Perks at 60, 70, 80 and 90

Each wrestler gets a perk slot when their **overall rating** (`overallOf()`, 1 to 99, in `src/99-overall.js`) reaches 60, then 70, 80 and 90. These use the overall rating rather than the progression level (`w.lv`), because levels run on a different scale (a star is around level 30 to 45) and the overall is the number shown on every list, as Madden does. At each threshold the player picks one of two perks for that **style** (or the game picks for wrestlers on other rosters, by gimmick). If the overall falls below a threshold, that perk sleeps until it climbs back, as in Madden.

- **60, 70, 80**: always on, small and specific.
- **90**: a **signature perk**, like an X-Factor: it switches on when something happens in the match and switches off when the other side does something specific. Only the best wrestlers in the world ever see it, and a match with one switching on gets a line in the match story.

The game has seven styles (`STYLE_NAME` in `src/00-core.js`). Fourteen perks per style, two choices per tier:

### Brawler

| Overall | Choice A | Choice B |
| --- | --- | --- |
| 60 | **Street fighter**: better in hardcore, street fight and cage matches | **Thick skin**: loses less condition in a brawl |
| 70 | **Plunder**: weapon spots lift the crowd more | **Crowd brawl**: fights in the crowd and brawls (angle) heat a feud more |
| 80 | **Bad blood**: a match in a hot feud rates higher | **Tough as nails**: less chance of getting hurt in stipulation matches |
| 90 | **Unleashed**: switches on after they are knocked down three times without being pinned; their strikes land harder; off if they are pinned to a near fall twice | **Last man standing**: switches on when behind; cannot lose by count-out or disqualification; off when they take the lead |

### Technician

| Overall | Choice A | Choice B |
| --- | --- | --- |
| 60 | **Chain wrestler**: matches with another technician rate higher | **Fundamentals**: fewer botches |
| 70 | **Submission specialist**: better in submission matches; submission finishes count as protected | **Ring general**: carries a weaker opponent to a better match |
| 80 | **Counter for everything**: a better chance to survive a finisher | **Clinic**: long matches (20 minutes and more) rate higher |
| 90 | **Locked in**: switches on after they work one body part through the match; their submission ends it; off if the opponent hits a finisher | **The scientist**: switches on in the last third of a long match; the crowd rating climbs every minute; off if the match is cut short |

### High flyer

| Overall | Choice A | Choice B |
| --- | --- | --- |
| 60 | **Spot monkey**: better in ladder and multi-man matches | **Soft landing**: less chance of getting hurt on a dive |
| 70 | **The dive**: catching fire (live call 1) happens more often for them | **Crowd surfer**: a bigger pop on entrances in big buildings |
| 80 | **Breathtaking**: a highlight spot lifts the whole show's buzz | **Springboard**: tag and six-man matches rate higher |
| 90 | **Flying high**: switches on after two big spots land; finishers from the top rope cannot be kicked out of; off if they are caught in mid-air (a counter) | **Death defier**: switches on in ladder and stipulation matches; the crowd rating cannot fall; off if they are hurt |

### Powerhouse

| Overall | Choice A | Choice B |
| --- | --- | --- |
| 60 | **Immovable**: harder to knock down; good in battle royals | **Big man's stamina**: tires less in long matches |
| 70 | **Feat of strength**: a power spot gets a bigger pop | **Protected**: losses hurt their standing less |
| 80 | **Monster's aura**: a squash match builds them more | **Tag powerhouse**: the partner gets a lift in tag matches |
| 90 | **Juggernaut**: switches on after they hit a power move; kick-outs against them are harder; off if they are taken off their feet by a high flyer | **Unstoppable**: switches on on a long winning streak; the crowd believes they cannot lose; off at the first loss |

### All-rounder

| Overall | Choice A | Choice B |
| --- | --- | --- |
| 60 | **Adaptable**: no penalty for any match type | **Good hand**: any opponent works well with them (chemistry) |
| 70 | **Utility player**: can be moved up or down the card without losing momentum | **Safe pair of hands**: opponents get hurt less with them |
| 80 | **Workhorse**: wrestles twice on a night without losing more condition | **Main event ready**: no penalty for being a first-time main eventer |
| 90 | **Second wind**: switches on when they are behind late in the match; their comeback rates higher; off once they lead | **Anything you can do**: switches on when the opponent's signature switches on; cancels it; off when it ends |

### Striker

| Overall | Choice A | Choice B |
| --- | --- | --- |
| 60 | **Stiff**: matches feel more real; the crowd rating climbs in a feud | **Quick hands**: better in short matches |
| 70 | **Kickboxer**: a better pop with a fast-paced opponent | **Counter puncher**: a better chance to survive a finisher |
| 80 | **One-hit finish**: their finisher, when it lands, cannot be kicked out of | **Fighting spirit**: strike exchanges lift the crowd more |
| 90 | **Knockout artist**: switches on after a run of strikes; any big strike can end the match; off if they are taken down to the mat | **Fighting champion**: switches on when defending a title; open challenges rate higher; off if they lose a fall |

### Entertainer

| Overall | Choice A | Choice B |
| --- | --- | --- |
| 60 | **Mic skills**: promos grade higher | **Entrance**: a better entrance pop |
| 70 | **Merch machine**: more merchandise; catchphrases stay fresh longer | **Crowd work**: the crowd forgives a weaker match |
| 80 | **Promo of the night**: one promo a show can lift the whole show's buzz | **Guest star magnet**: guest stars and celebrities work well with them |
| 90 | **Electrifying**: switches on when the crowd is hot; every segment they are in rates higher; off if the crowd goes quiet | **Main event of the show**: switches on when they close the show; the show's last segment counts double |

## How the two halves meet

- **Personality picks perks** for the computer: a Hothead brawler picks Unleashed; a Professional technician picks Fundamentals.
- **Wants react to perks**: a wrestler with "the top title" who reaches 90 and is not in the title picture asks why.
- **The live show** (0ae) and **the Director** (0aa) see perks: a high flyer with The dive makes catching fire more likely, and a Proud wrestler makes "I am not doing the job" possible.
- **Promos** (P4, `docs/plans/promos.md`) read wants, personality and moods: a Bitter wrestler sounds bitter.

## Steps, in build order

1. **Wants and personality in the backstory block**, generated for everyone from style, gimmick, age and history by hash (no `rnd(S)`), shown in the wrestler's file in words. Headless test: 60 weeks, errs 0, NaN 0, and the same seed gives the same people.
2. **Reactions**: personality changes `relBump()` and `youRemember()`; wants move morale each week and change contract prices.
3. **Moods**, with what starts and ends each one. `w.chip` becomes the Proving it mood.
4. **Perks at 60, 70, 80 and 90**: the slots, the pick on screen (the level-up pop-up from `src/99-progress.js`), the computer's pick, sleeping below a threshold. Always-on perks first.
5. **Signature perks at 90**, switching on and off inside the match, with a line in the match story.
6. **Wants in contract talks** and rival companies that meet them.

## Open questions for Bill

- Should a player be able to swap a perk later (for a cost), or is the pick for life?
- Is 90 too rare? Today only a handful of wrestlers in the world reach 90 overall, which suits a signature perk.
- Can a wrestler with a gimmick that fights their style (a powerhouse entertainer) pick from both lists?
