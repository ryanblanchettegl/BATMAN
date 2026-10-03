# EWF 9000: task list

The hand-over from the build thread, written 2 October 2026 at version 0.11. Work top to bottom unless Ryan says otherwise. Read `CLAUDE.md` first for how the project works, and `docs/feature-list.md` for the full wording of each feature.

Two more lists sit beside this one:

- `TWEAKS.md`: 100 small jobs, one commit each, none needing a decision. Good for an unattended run. Start there.
- `WISHLIST.md`: 100 ideas that make the game deeper. Bigger than a tweak, smaller than a task. Some are marked as part of a task below, and some need Ryan's say first.

## Where things stand

- **Built and tested:** the engine, the rebuilt interface (six sections), nine company models, the nine-promotion public-domain universe set in the present day, attempts instead of dice wording, action notes on the desk, the Music button, Free agents with a Fit column.
- **Built, not fully tested:** click-anywhere pop-ups (task 1).
- **The live page** (a Claude artifact Ryan plays from) is one step behind this repository: it does not have the pop-ups yet.
- **Sims:** all nine promotions ran 80 weeks headless with no errors and no bad numbers.

## Ryan's decisions (do not reopen these)

| Topic | Decision |
| --- | --- |
| Calendar | The game starts in the present day (October 2026). The 1990s PC look stays exactly as it is. |
| Screens | Office is the hub and opens on "Before the show" with a **Book the next show** button. Manage holds every choice. Company is information only. Music sits top right. |
| Wording | No dice or rolls anywhere. An attempt has a percentage chance, with what helps and what hurts. |
| Action points | Every action point spent leaves a note of what happened, on the desk and on the next show report. |
| Booking screen | Replaces the current card editor. Card size is set by show length: 1 hour is 3 matches and 3 promos, 2 hours is 4 and 4, 3 hours or pay-per-view is 5 and 5. |
| Promos | The player picks who and what kind; the game writes and grades it. |
| The week | The player can pre-book every show of the week. Each show affects the next one. |
| The goal | Open-ended, like a tycoon game: a world top 500 of every wrestler (yearly, with a weekly top ten), level-up pop-ups after shows, yearly awards, numbers that visibly climb, more dynamic events. |
| Events | Backstage incidents, the business calling, wrestler life events, fan and internet moments, and situations modelled on famous moments in wrestling history. |
| Storylines | Templates modelled on famous and infamous real storylines. The player spends booking power to start the epic ones. |
| Rivals | Each company keeps its own night, as in real life. Moving a show onto a rival's night is a choice made with the network or streamer, and it starts a ratings war. |
| TV money | The network pays per hour of programming. Streaming is available from week one. |
| Arena pick | Pick the city, then a building in it. |
| Sponsors | Three per federation. |
| Fast mode | One button books the week with suggested cards, skips the broadcast, and stops for anything that needs a decision. |
| Free agents | The Market page is now Free agents. Indies are mini federations (task 9). |
| Roster | Figures still honoured in living traditions were swapped out of the default universe. |
| Names | Company models and storylines follow how real companies and angles worked, but every name in the game is invented or public domain. No real promotion, wrestler, stable or event names in game content. Real-world rosters stay out of this repository. |
| Publishing | Two threads publish to the same live page. Whoever publishes merges the other's changes first. |

## Tasks

### 1. Finish the pop-ups (small)
Feature list items 10 and 11. Code: `app/src/shared/cards.tsx`, `Name`, `TitleName`, `TeamName` and `Txt` in `app/src/kit/index.tsx`, the card stack in `app/src/store.ts`.

- [x] Wrestler, tag team and title pop-ups; names inside open more; Back steps out; Close shuts all.
- [x] Names in news, the inbox, reports, stories and tables are links.
- [x] `app/tests/cards.js`, `office.js`, `roster.js`, `stories.js` pass.
- [x] Run `app/tests/booking.js`, `start.js`, `company.js` and `journey.js` on this build and fix what they find. All pass. One TV check in `company.js` was too strict: after scrapping a house rule the only live controls left are the page tabs, so the highlight goes there.
- [x] Team **record** on the tag team card (wins and losses are now stored on the team; older saves start at 0 and 0).
- [ ] Still not built: names in the live broadcast (typed out letter by letter, so not linked). Wrestler goals on the card are done (wish 1).

### 2. Storylines from wrestling history
The player spends booking power to start an epic storyline; smaller ones can start by themselves or be offered by the writer.

- [ ] A storyline template: a name, who it needs (roles such as leader, defector, rival, champion), a cost in booking power, three to six beats spread over weeks, what each beat needs on a show (a match, a promo, a run-in, a title change), a payoff, and how it can backfire.
- [ ] Templates under original names, each modelled on a real pattern. Epic ones: a renegade faction of outsiders takes over; an elite four-member stable built around a champion; two top stars trade the title across three big events; a personal blood feud that escalates through gimmick matches; the owner against the rebel wrestler; the long underdog chase for the title; partners who explode over jealousy. Infamous ones that can go wrong: an invasion nobody takes seriously; a title handed over without a match; a champion leaving with the belt; a mystery attacker whose reveal disappoints.
- [ ] A Storylines page section to start one, see its beats, and see what the next show needs. Missing a beat cools it; hitting the payoff lifts everyone in it.
- [ ] Rival promotions run them too, and the news reports it.
- Engine starting points: feuds in four acts and the angle generator in `src/20-story.js`, stables in `src/60-rpg.js`, the saga in `src/80-world.js`.

### 3. The new booking screen (large; the core loop)
Feature list item 6. Replaces `app/src/screens/booking/` card editing; the engine's match maths stays.

- [ ] Shows have a length: 1, 2 or 3 hours, or pay-per-view. The length sets the card: 3+3, 4+4 or 5+5 matches and promos.
- [ ] Slot cards for matches and promos, and one time bar the player drags to split the show. Each segment shows its ideal length; too short or too long costs it.
- [ ] Promos as booked segments: pick the people and a kind (interview, challenge, brawl, contract signing, and so on). Today angles are generated automatically (`genAngle`) and only the opening promo is planned (`planPromo`); both need to become player choices with suggestions.
- [ ] Suggested picks and quick-fill buttons. Booking power to call finishes carries over unchanged.
- [ ] The show plays out segment by segment with points popping up, a grade per segment, and a grade for the show. Keep the work score and the crowd score separate and visible (they already exist as `mq` and `cr`).
- [ ] Crowd heat shown while booking; creative energy as a resource the booking team generates.
- [ ] **Pre-book the week:** a tab per show; cards for later shows are kept until they run. Today `S.card` holds one card for `S.queue[S.qi]`.
- [ ] **Each show feeds the next:** a strong ending lifts the next show's audience, a thread left hanging costs it, and the booking screen says what carried over.
- [ ] **Fast mode:** one button books and runs the week with suggested cards and stops for decisions.
- [ ] Works with mouse, touch, keyboard and remote. Dragging needs a button alternative.

### 4. Arena pick, gate report, popularity per city
Feature list items 1 and 2, plus weather, star names and event intent from the table.

- [ ] Cities with a popularity score per federation; good shows raise it, bad shows lower it, absence fades it, overexposure shrinks the gain. Rivals have their own scores.
- [ ] Before a show: pick the city, then a building (capacity, rent, crowd type), with an attendance forecast as a range.
- [ ] Gate report pop-up after the show: tickets against capacity, why it drew, gate minus rent, the city's score before and after.
- [ ] Sellout streaks, bigger buildings unlocking, crowd heat feeding match ratings, seasonal weather.
- [ ] A city list on Company with trend and weeks since the last visit.
- Engine starting points: `demand`, `capFor`, `ticket` and `venueFor` in `src/00-core.js` and `src/10-match.js`; each promotion already has a `cities` list.

### 5. TV deals paid per hour, streaming, same-night wars
Feature list items 3 and 4. Replaces the three-level broadcast slot (`P.slot`, `E.askSlot`).

- [ ] Networks with tastes; deals with an hourly rate, a night and slot, a length and a ratings target. Ratings reported per hour.
- [ ] Executive calls, content rules, renewal countdowns, bidding wars, cancellation warnings.
- [ ] Streaming: pays per subscriber, grows with back catalogue and match quality, lifts popularity in cities not toured, exclusivity that can conflict with TV.
- [ ] Every promotion has a night. Moving onto a rival's night is offered by the network or streamer and starts a ratings war with a weekly winner.
- [ ] The startup model's "land a better TV deal" pressure (`MODELS.startup.month` in `src/78-models.js`) should move onto this system.

### 6. Event calendar, promotion spending, sponsor tiers
Feature list items 5 and 7.

- [ ] A year planner: schedule events by type (flagship, arena, ballroom, gimmick night, battle royal, tournament). The flagship has an original name per promotion.
- [ ] Weekly promotion spend on this month's event, next month's and the flagship; a hype meter per event; a buy rate report after each.
- [ ] Sponsors with tiers, their own boosts and an ongoing goal; tier-up pop-ups, unhappy warnings, conflicts between sponsors. Today sponsors are flat deals with one condition (`src/50-company.js`).

### 7. The tycoon layer
- [ ] A world ranking of every wrestler across all promotions and free agents: a yearly top 500 and a weekly top ten. `E.power` in `src/90-api.js` is the seed of it.
- [ ] Level-up pop-ups after a show for wrestlers who improved, saying what went up.
- [ ] Yearly awards across the world (the engine has awards and a hall of fame for the player's company).
- [ ] Momentum should matter more, and say so (fan wish list).

### 8. All-federation dirt sheet and dynamic events
Feature list item 9.

- [ ] A dirt sheet page: lead story, a section per federation, rumours with a reliability level, business news, match of the week, next week, and a review of the player's booking. Today there is a per-show dirt sheet (`src/30-show.js`) and a fan board.
- [ ] Rival backstage drama, "on this day", media scrums after big events.
- [ ] Dynamic events of four kinds, on top of the inbox events in `src/40-week.js`.
- [ ] History-moment events under original names: the player is put in a famous situation and makes the call. Examples of patterns: a champion is leaving and will not lose the title on the way out; a wrestler shows up on a rival's show with your belt; a live microphone goes off script; a faction's contract talks collapse the night before the big event.

### 9. Free agents and the indie scene
- [ ] Indies as mini federations with their own small systems. They open and close over time.
- [ ] A free agent can work for any number of indies.
- [ ] An indie cannot book a signed wrestler on that wrestler's event nights, or at all if the home federation forbids outside dates (the corporate model does).
- [ ] The player does not compete with indies. Rarely, one grows into a real federation.

### 10. Locker-room and long-term items
From the table in `docs/feature-list.md`. Check each against the engine first; several exist in part.

- [ ] Career goals per wrestler; inner circle roles with political weight; canvas the locker room before a signing.
- [ ] Team bonding, interventions and call-outs (extend the backstage actions in `src/77-backstage.js`).
- [ ] Promoter friendliness per rival owner; cash in talent trades; joint super shows with shared money.
- [ ] Owner goals with visible progress; headquarters and hall of fame building projects; wrestling school affiliations.
- [ ] Custom house styles; per-title statistics.
- [ ] Rivals competing for time slots, cities and talent (finishes feature list item 8).

### 11. Balance and known problems
- [ ] **The underdog is too hard.** Playing the underdog company on autopilot, owner trust fell until the booker was fired around week 73. Suggested cards score about 1 to 1.5 points under the crowd's expectation there.
- [ ] **Big companies bank too much.** The corporate giant went from $110M to about $400M in 80 weeks against a planned $1.5M a week.
- [ ] **The startup is too easy once it gets a better slot** (about +$470K a week), and bleeds as intended while it does not (about -$340K a week).
- [ ] Watch roster churn among rivals after 100+ weeks (releases and signings by fit are new).
- [ ] The first-day screens grew; keep them readable (design goal: easy to read and quick to do).

### 12. Not tested or not decided
- [ ] The Steam wrapper in `desktop/` has never been run.
- [ ] TV and gamepad input were tested with simulated keys only, never on hardware.
- [ ] Portraits are drawn by code from eight numbers. Ryan's brief mentioned layered images passed as Base64; ask before changing.
- [ ] Open question for Ryan: should the default product carry the name "World History Wrestling"?

## After each task

1. `node build.js`
2. `node test-uni.js universes/public_domain.json 60` (no errors, NaN 0 on every line)
3. The browser tests for the sections touched, then `app/tests/journey.js`
4. Tick the boxes here, commit, push.
5. If the live page is being updated: read the live version first and merge anything the other thread changed.
