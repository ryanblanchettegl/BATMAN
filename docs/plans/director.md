# The Director: drama on a rhythm

Bill, 21 October 2026: "I like this feature add it to the plan." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea E1). Nothing here is built. One step at a time (rule 9a).

## The idea in one paragraph

The Director decides **when** trouble reaches the desk. It does not invent events. Every week it reads how tense the company already is, then chooses which of the events that could happen this week actually do, and how big they are. When things have been quiet too long, a fire lands. When the player is already fighting three fires, it holds back or offers a chance instead of a problem. After a big night there is a quiet week to enjoy it, then the pressure builds again. The player picks the Director's style at the start of a game.

## Why

- **The rhythm is left to chance today.** `genEvents()` in `src/40-week.js` picks how many office events a week gets with flat chances (none one week in five, then one or two), and each `EVMAKE` maker gates itself with its own chance and cooldown (`src/83-moments.js`: after week 8, ten weeks apart, a 22% chance). So a player can get three disasters in one week and then a dead month. The events are good; nothing shapes their timing.
- **It makes "one more turn" a system.** Design rule 2a asks that the Office opens on a fire and every phase hands the next something unresolved. The Director is the part that makes sure of it.
- **Proven in other games.** Left 4 Dead's AI Director cycles build-up, peak and relax from the players' stress. RimWorld lets the player pick a storyteller (steady, gentle, or chaotic) and reviewers single it out.

## The tension reading

One number, 0 to 100, worked out at the start of every week from what is already true. Never shown as a number; the player sees it only through what happens (and, later, one line in words on the desk if Bill wants it).

| Part | Read from |
| --- | --- |
| Open matters | Unanswered events in `S.inbox`, and how many have deadlines |
| Clocks near full | `S.clocks` in `src/77-backstage.js` (mutiny, raid, stale, network patience) |
| The room | Average morale of the roster, how many are below the breaking point, real heat in the matrix |
| Money | Weeks of wages in the bank |
| Stories | Hottest feud's heat, a feud about to pay off, a company arc chapter waiting |
| Since the last fire | Weeks since the last event that needed an answer |

It also keeps a short history (the last eight weeks) so it knows whether the company is building, at a peak, or coming down.

## What it does with it

1. **How many events this week.** It replaces the flat `want` in `genEvents()`: low tension and a long quiet spell ask for more, high tension asks for fewer.
2. **Which kind.** Each event maker gets a tag: a problem (a holdout, a raid, a walkout), a chance (a breakout, a sponsor, a surprise arrival) or colour (life outside the ring). At high tension it prefers chances; at low tension, problems.
3. **How big.** Where a maker has sizes (a small leak or a big one, one unhappy wrestler or a clique), the Director picks the size.
4. **The rhythm around big nights.** It builds toward a big event (the weeks before carry more), and the week after a big night is calm unless the night itself left a problem.

Rules it keeps:

- It only chooses among events whose cause is already true. It never makes something happen with no reason (the soap opera rule: cause, warning, choice, payoff).
- Seeded and repeatable. Choices use `h01()` on the seed and the week where they can, as the Net and the kayfabe layer do, so the same save plays out the same way.
- Required tasks of the first year (`src/96-first.js`) and anything with a fixed date are never held back.
- Rival companies are not directed. Only the player's company.

## The styles

Picked when a game starts, next to the difficulty settings, and shown on Career. Can be changed between shows at a cost to the owner's trust, or not at all in iron man.

| Style | How it plays |
| --- | --- |
| **The Promoter** | Steady pressure. A fire most weeks, rarely more than two open at once, few disasters. The default. |
| **The Carny** | Wild swings. Long quiet spells, then several things at once. Bigger chances and bigger trouble. |
| **The Purist** | Slow burns. Fewer events, more of them about stories and people than money, and shocks are rare and large. |

Each style is a small table of numbers (how fast tension should rise, where it peaks, how long it rests), so a modder or a world file can add one.

## Steps, in build order

1. **The reading only.** `src/9x-director.js` with `dirTension(S)` and the eight-week history. Headless test `test-director.js`: 60 weeks of every company, errs 0 and NaN 0, and print the tension line so it can be checked against what happened. Nothing in play changes.
2. **How many.** `genEvents()` asks the Director for `want`. Compare 60 weeks before and after: events per week, longest quiet spell, worst pile-up. Show Bill the numbers.
3. **Which kind.** Tag every event maker (problem, chance, colour) and let the Director prefer by tension.
4. **The styles.** The three styles, the choice at the start of a game, and the line on Career. Old saves get The Promoter.
5. **Sizes and the big-night rhythm.** Only after the first four feel right in play.
6. **Later, if wanted:** one line on the desk in words ("A storm is coming", "A quiet week") and the Director's picks in the save's history.

## Open questions for Bill

- Should the player see the Director at all (a word on the desk), or only feel it?
- Can the style be changed mid-game?
- Three styles to start, or one (The Promoter) first and the others after it plays well?
