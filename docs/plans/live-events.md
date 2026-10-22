# Catching fire, and forty calls for the live show

Bill, 21 October 2026: "E2 - I like this idea, we also need to have like 40 events that could happen on a show to give the director." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea E2), and the Director (`docs/plans/director.md`). Nothing here is built. One step at a time (rule 9a).

## What exists today

The live show stops for a call from the gorilla position (`src/31-live.js`). A kind of call is one entry in `LIVEK` with `pre` or `post` (offered only when its cause is true of the next step) and `run` (applies the answer). A show takes at most three calls, four on a big night (`liveMax()`). The thirteen kinds today:

| Kind | File |
| --- | --- |
| Trouble on the air (lights out, the truck loses power, a real fight, a riot, a bad landing) | `src/31-live.js`, `src/77-backstage.js` |
| The title is on the line, a rival at the curtain, off the script, after the bell | `src/31-live.js` |
| The owner on the headset, who the show is built around, the network, the sponsor | `src/32-direction.js` |
| Somebody is hurt, the crowd has gone quiet, they are not going home | `src/33-ring.js` |
| Trouble in the building (power, the ring, weather, the crowd) | `src/99-venues.js` |

The forty below are new, and none repeats one of these. Several of today's still use a flat chance (`chance(S, 0.13...)` in `E.chaos`, a hashed chance in `LIVEK.disaster`); the Director replaces those too.

## The Director on the night

The same Director as the week (`docs/plans/director.md`), at a smaller scale:

- **Which calls.** Every kind still decides for itself whether it *can* happen (its cause is true). The Director decides which of those that can happen *do*, up to the show's limit.
- **When.** A show has a shape: open hot, breathe in the middle, peak at the main event. The Director keeps problems away from the opener, never puts two problems back to back, and saves the biggest call for the last third.
- **What kind.** Each call is tagged **problem**, **chance** or **colour**. A tense week gets more chances on the night; a quiet week gets a problem. The Carny gets more calls and bigger ones, the Purist fewer and slower.
- **Never a call for its own sake.** A call that is not caused by something true of tonight's people does not exist.

## E2. Catching fire (the first one to build)

When an act lower on the card is beating what the card expected (the crowd meter in the match climbing well past its prediction), the headset says so while it is happening:

- **Give them two more minutes.** Better match, the show runs long, the network notices.
- **Send them back out with a microphone after the bell.** A big lift for them, and the next segment starts on a hot crowd or a tired one.
- **Stick to the sheet.** Nothing changes on the night; the wrestler remembers that you did not see it (`youRemember()`).

Seizing it moves the breakout clock (`src/77-backstage.js`) on by a step. It is a **chance**.

## The forty

Each one names its cause (what must be true for it to be offered), the answers, and its kind. Answers go through `relBump()`, `youRemember()`, the feuds and the titles as today's calls do.

### In the ring

| # | Call | Caused by | The answers | Kind |
| --- | --- | --- | --- | --- |
| 1 | **Catching fire** | A lower-card match running well above its predicted crowd | Two more minutes; the mic after the bell; stick to the sheet | Chance |
| 2 | **The finish is lost** | A tired or worn-down worker in the match, or a pair who have never worked together | Go home now with a roll-up; let them try the spot again; the referee calls it a disqualification | Problem |
| 3 | **Kicked out of the finish** | A wrestler with ego or real heat with the other, against a protected finisher | Let it stand (the crowd erupts, the finisher loses its protection); finish with a second one; the referee counts fast | Problem |
| 4 | **Not selling** | Real heat and low respect between the two | Tell the agent to get to the finish; let it run (worse match, real heat on screen); fine them after | Problem |
| 5 | **The dive nobody planned** | A high flyer chasing a spot, with a hot crowd | Let it happen (bigger pop, a risk of injury); wave it off through the referee | Chance |
| 6 | **Bleeding the hard way** | A brawl or a stipulation match, with a family network, sponsor or house rule against blood | Stop it to clean up; let it go (crowd up, the network or sponsor down) | Problem |
| 7 | **The rookie freezes** | A first-year wrestler in a big spot | A veteran takes over; cut it short; let them find their feet (a lesson, or a flop) | Problem |
| 8 | **A team is born** | Two wrestlers thrown together in a tag match whose styles work | Note it and book them again; give it more time tonight | Chance |
| 9 | **They are cheering the villain** | A villain whose crowd reaction is running hotter than the hero's | Lean in and tease a turn; have them cheat harder; let it go | Chance |
| 10 | **Into the crowd** | Two people with real heat in a brawl | Follow them with the cameras (a big moment, a security risk); the referee calls them back | Chance |
| 11 | **The referee is down for real** | A referee bump in a match with a weak or tired referee | Send in the back-up referee; let the wrestlers call their own finish | Problem |
| 12 | **The cash-in** | A wrestler promised a title shot, and the champion laid out after a hard match | Cash in now; save it for a bigger night | Chance |

### Promos and segments

| # | Call | Caused by | The answers | Kind |
| --- | --- | --- | --- | --- |
| 13 | **The promo is dying** | A weak talker with a quiet crowd | Send out a rival to interrupt; play music and cut it; let them dig out of it (an attempt) | Problem |
| 14 | **The secret said on air** | A speaker who is unhappy and knows a true kayfabe secret (`src/99-kayfabe.js`) | Cut the microphone; let it go (the secret is out, a star may be made); work it into the story | Problem |
| 15 | **A line lands** | A good talker whose line got a huge reaction | Have them say it again; rush the shirts (costs money); leave it alone | Chance |
| 16 | **The interview walks off** | A wrestler unhappy about their booking, in an interview | Send them back; the desk covers; make it an angle | Problem |
| 17 | **The table breaks early** | A contract signing between two people with real heat | Leave it unsigned for next week (a cliffhanger); sign it in the wreckage | Colour |
| 18 | **The wrong music** | A low production level | Play along as a joke; restart the entrance | Colour |
| 19 | **They are singing along** | A popular wrestler's entrance in their home city or on a big night | Let the entrance run long (time cost, big pop); cut it | Chance |
| 20 | **The microphone dies** | Low production, mid-promo | Talk without it (a charisma attempt); throw in a new one; cut to backstage | Problem |
| 21 | **Commentary at war** | Two commentators with no chemistry | Let it play out; cut one of them off | Colour |
| 22 | **The guest star freezes** | A guest star from outside wrestling (wish 74) on tonight | A wrestler covers for them; cut the segment short | Problem |

### Backstage, during the show

| # | Call | Caused by | The answers | Kind |
| --- | --- | --- | --- | --- |
| 23 | **A fight in catering** | Two people with real heat, both in the building | Send the agents; film it as an angle (risky for the kayfabe layer); let them sort it out | Problem |
| 24 | **Not in the building** | Someone on the card with travel trouble or low morale | Move them down the card; replace them; stall with a promo | Problem |
| 25 | **"I am not doing the job"** | The booked loser is a star with ego, creative control or a grievance | Change the finish (booking power); hold firm (an attempt); pay them | Problem |
| 26 | **The surprise is spoiled** | A surprise return or debut whose secret has leaked | Go ahead anyway; swap in a different surprise; hold it for next week | Problem |
| 27 | **A legend in the building** | A retired legend visiting, often in their home city | A cameo (big pop, some egos bruised); let them watch; ask them to talk to a rookie (a mentor bond) | Chance |
| 28 | **A rival's star in the front row** | A rival company's wrestler with a contract running down | Put the camera on them (the war heats up); have security remove them; invite them backstage (a signing chance) | Chance |
| 29 | **The doctor says no** | A wrestler on the card with a badly worn body part | Pull them; clear them (a risk); give them a promo instead | Problem |
| 30 | **The family is in the front row** | A wrestler with a life event (`src/84-life.js`) and family at the show | Show them on camera; bring them into an angle (a risk); leave them be | Colour |
| 31 | **A proposal in the ring** | A wrestler with a wedding coming (life events) | Yes, live on air (a pop, the sponsor likes it); after the show | Colour |

### The crowd

| # | Call | Caused by | The answers | Kind |
| --- | --- | --- | --- | --- |
| 32 | **A sign gets on camera** | A wrestler who is hot, or a crowd that has turned on one | Put the camera on it (followers move); keep it off | Colour |
| 33 | **The home town will not let them lose** | A home-town wrestler booked to lose in their own city | Change the finish; hold firm and take the boos | Problem |
| 34 | **A fan in the ring** | A rowdy crowd and thin security | Let the villain deal with it (heat, and a risk of trouble in public); security takes over | Problem |
| 35 | **They are chanting the other company** | A ratings war, or a rival with a hot product in this city | A villain calls them out; ignore it | Chance |
| 36 | **They want somebody who is not on the show** | A popular wrestler left off tonight's card | Send them out; the desk acknowledges it; ignore it (the crowd sours) | Chance |

### Stories on the night

| # | Call | Caused by | The answers | Kind |
| --- | --- | --- | --- | --- |
| 37 | **The turn is ready now** | A wrestler whose turn has been teased and a crowd primed for it | Turn them tonight; wait for the big night | Chance |
| 38 | **The jealous partner** | A tag partner with high jealousy (the soap opera arc) in a tag match | Walk away tonight (the turn happens live); save it; stay loyal for now | Chance |
| 39 | **The stable hesitates** | A stable with low unity, a member slow to help the leader | Let the hesitation show (tease the split); have them help | Chance |
| 40 | **Champion meets champion** | Two champions of different belts crossing paths backstage | Book it right now; tease it for the next big night | Chance |

That is eighteen problems, sixteen chances and six colour, so the Director always has something of each kind to pick from.

## Steps, in build order

1. **Catching fire** (call 1) as a `LIVEK` entry, with a headless test that it is offered only when a lower-card match beats its prediction, and plays 60 weeks with errs 0 and NaN 0.
2. **The tags.** Today's thirteen kinds tagged problem, chance or colour.
3. **The Director on the night**, once the Director's weekly steps 1 to 3 are in: it picks among the calls that can happen and spaces them through the show. Replace the flat chances in `E.chaos` and `LIVEK.disaster` with it.
4. **The forty**, a few at a time, in the order above within each group. Each one is a `LIVEK` entry with its cause, its answers and a line in the report; each batch is shown to Bill before the next.
5. **Stills for the new calls** as the scene work reaches them (TASKS 0w, 0u).
