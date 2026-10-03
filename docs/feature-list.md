# EWF 9000 feature list

Copied on 2 October 2026 from Ryan's "EWF 9000 Feature List" doc (brainstormed in a side session, handed to the build thread). Every item is locked in by Ryan unless marked otherwise. `TASKS.md` at the repo root says what is built and in what order the rest comes.

## Design goal

The game should have the Civilization "one more turn" pull, with the easy readability of Game Dev Story.

- **Every turn and every page has something to do.** No dead screens.
- **Every action has a reaction.** Decisions change relationships, and the change is shown at once in a pop-up.
- **Something is always about to pay off.** Countdowns, streaks and progress bars stay in view.
- **Easy to read and quick to do.** Big simple choices, then watch the results come in. Depth without the density fans complain about in Total Extreme Wrestling.

## Ryan's core features

### 1. Arena pick and gate report
- Before booking, pick the building for the next show from a few options, each with capacity, rent and crowd type.
- Show an attendance forecast as a range.
- After hitting "book next show", a gate report pop-up shows tickets sold against capacity, why it drew, and gate minus rent.
- Follow-on effects: crowd heat on match ratings, wrestler mood, owner reaction, sellout streaks, bigger buildings unlocking.

### 2. Popularity per city
- Each city keeps its own popularity score for your federation, separate from the overall number.
- Good shows raise it, bad shows lower it, absence fades it, overexposure shrinks the gain.
- Drives the attendance forecast and which buildings you can fill.
- Shown on a city list or map with trend and weeks since last visit, and in the gate report ("Chicago: 54 to 61").
- Rivals have their own score in each city.

### 3. TV deals, paid per hour
- Networks with different tastes offer deals with an hourly rate, time slot, length and ratings target.
- You are paid per hour of programming, so a one, two or three hour show is a money choice.
- Ratings are reported per hour after each show.
- Executive calls, content rules, renewal countdowns, bidding wars and cancellation warnings.

### 4. Streaming deals
- Pays per subscriber and grows slowly, driven by back catalogue and match quality.
- Lifts popularity in cities you have not toured.
- Exclusivity offers that can conflict with TV.
- Answered: the game now starts in the present day, so streaming is available from week one.

### 5. Event calendar and promotion spending
- A year planner where you schedule pay-per-view events by type: flagship spectacle (the once-a-year biggest show), arena show, ballroom show, gimmick night, battle royal event, tournament event.
- Each week you can pay to promote three things: this month's event, next month's event, and the next big spectacle.
- Each event has a hype meter. Money, hot feuds and strong weekly TV raise it.
- A buy rate report after each event explains the result.
- Use an original name for the flagship; do not use the real "WrestleMania" name in the game.

### 6. Booking screen with time splitting
- Booking a show means picking 3 to 5 matches and 3 to 5 promos, then dividing the available time.
- Time available depends on the show: one hour, two hours, three hours, or pay-per-view.
- Must be easy to read and do, in the style of building a game in Game Dev Story: slot cards, one time bar you drag to split, suggested picks, quick-fill buttons.
- Each segment shows its ideal length; too short or too long hurts it.
- When booked, segments play out in order with points popping up and a grade per segment and per show.

### 7. Sponsorships
- Each federation can hold up to three sponsorships at a time.
- Each sponsor has its own tiers and its own boosts, plus an ongoing goal.
- Tier-up pop-ups, unhappy sponsor warnings, and conflicts between sponsors.

### 8. Concurrent world
- Every week the other federations run their own shows with their own storylines, using the same rules as the player.
- They sign and release talent, chase deals, tour cities and run big events.
- They compete with you head to head for time slots, cities and talent.

### 9. Dirt sheet covering all federations
- The dirt sheet page reports on every federation, not only the player's.
- Lead story, a section per federation, backstage rumors, business news, match of the week, and what is coming next week.
- Rumors have a reliability level. Your own booking gets reviewed too.

### 10. Clickable wrestler and tag team profiles
- Click any wrestler or tag team name anywhere and a profile pops up.
- Wrestler: portrait, alignment, popularity, momentum, mood, record, feud, titles, relationships, contract, goals, quick actions.
- Tag team: members, chemistry, record, title reigns, links to each member.
- Build on the existing scouting report pop-up.

### 11. Clickable title histories
- Click any title anywhere and its history comes up.
- Current champion, full lineage with dates and lengths, records, and a prestige bar.
- Names in the lineage open that wrestler's profile. Pop-ups stack with a back button.

## From the newer Ryland games

Ryan asked to add everything from Total Extreme Wrestling 2020 and IX that the game does not already have. Sources: [What's New in TEW IX](https://tewdb.com/whats-new-in-tew-ix-every-new-feature-announced-so-far/) and the [TEW 2020 launch list](https://gmgames.org/2020/05/15/the-wait-is-over-total-extreme-wrestling-2020-tew2020-has-launched/).

| Feature | What it does | Ties into |
| --- | --- | --- |
| Pre-show build-up | Set steps before each show: night off, venue, broadcaster, incidents, team meeting, locker room address | Arena pick |
| Wrestling and crowd ratings | Each match gets one score for the work and one for the crowd | Booking payoff |
| Crowd heat while booking | See the crowd's energy as you build the card | Booking screen |
| Event intent | Tag a show as normal, lesser, tour or throwaway | Event calendar |
| Star names drive attendance | The gate depends on who is advertised | Gate report |
| Seasonal weather | Affects attendance and availability | Arena pick |
| Rival backstage drama | Other federations suffer incidents and morale swings | Concurrent world, dirt sheet |
| Creative energy | Booking team generates energy and ideas you spend on shows | Booking screen |
| Promises | Wrestlers ask for and remember promises, including putting someone over | Relationships |
| Career goals | Each wrestler wants fame, money or something else | Relationships, profiles |
| Inner circle | Named locker room roles with political consequences | Relationships |
| Media scrums | Journalists question you after big events; answers have effects | Pop-ups |
| Team bonding, interventions, call-outs | Direct actions you take in the locker room | Weekly actions |
| Canvas opinions | Poll the locker room before signing someone | Signings |
| Owner goals with progress | Goals show specific progress | Front office |
| Headquarters and hall of fame | Long-term building projects with prestige bonuses | Long-term goals |
| Company awards and title records | Yearly honors and per-title statistics | Title histories |
| On this day | History feed that grows as the save ages | Dirt sheet |
| Cash in talent trades | Money added to trades with rivals | Concurrent world |
| Wrestling school affiliations | Share costs and get access to graduates | Talent pipeline |

## From fan wish lists

Also locked in. Sources were thin: a [Steam discussion](https://steamcommunity.com/app/1157700/discussions/0/4422058023930040596) and reviews from [Games Freezer](https://www.gamesfreezer.co.uk/2024/11/total-extreme-wrestling-9-pc-review-910.html) and [Slam Wrestling](https://slamwrestling.net/news/total-extreme-wrestling-2020-game-review/).

- **Visible cause and effect:** ratings for title prestige, events, storylines, gimmicks and team pairings that respond to booking.
- **Stronger momentum:** momentum should matter more directly.
- **Joint super shows:** allied federations run a shared event with cross-promotion title matches and negotiated money.
- **Promoter friendliness:** a relationship score between you and each rival owner that affects deals.
- **Custom house styles:** define your own product instead of picking a preset.
- **Fast mode:** a streamlined way to move through weeks without managing everything.
- **Clear crowd reactions:** always say why a crowd reacted the way it did.
- **Gentle learning curve:** the top complaint about TEW IX is density, so keep screens simple.

## Brainstormed but not locked in

Countdown strip, end-of-week teaser, visible ripple pop-up after booking, wrestlers remembering specific slights, favors and debts, one knock on the door per week, a weekly offer on the finances page, event chains.

## Not yet discussed

Storyline planning, wrestler growth and aging, injuries, contract negotiation, merchandise, the player's own career. (Several of these already exist in the engine; check before building.)
