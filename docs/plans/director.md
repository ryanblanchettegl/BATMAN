# The Director: one gate for the week

Bill, 21 October 2026: "I like this feature add it to the plan" (killer features research, idea E1). Ryan, 23 October: it becomes move 1 of the review's four moves (TASKS.md 0ao), "the single gate every event, call and matter passes through", with a cap on interruptions. Ryan, 28 October: "director it is". Nothing here is built. Rule 9d: this blueprint, then the questions one at a time, then the go-ahead.

## 1. The idea in one paragraph

The Director decides **what reaches the player and when**. It does not invent events. Every matter for the desk, every call from the gorilla position and every knock at the office door is offered to it first. It reads how tense the company is, picks one headline for the week and a couple of supporting threads, holds the rest back or turns them into quiet lines in The week, and caps how many calls interrupt a show. After a big night it lets the player enjoy it; when things have been quiet too long it lets a fire through. The player picks its style when a game starts.

## 2. Why: what the game does today

Measured on 28 October over a 48-week year (EWE seeds 3 and 11, the public-domain LDD seed 29, Suggest a card every week):

| Measure | Today |
| --- | --- |
| New matters on the desk a week | about 5 on average (4.5 to 5.4) |
| Worst week | 14 matters |
| Weeks with nothing new | none in any of the three games |
| Calls on the air a show | 2.6 on average, at most 4; after-the-bell calls come on almost every show (152 in 156 shows) |
| Places that put a matter on the desk | 38 calls to `pushEv()` in 26 files; 31 kinds turned up in one year |
| Most frequent matters | the writers' room (23), contract clauses (18), a last contract year (18), contracts ending (17), an upset (15), an act that caught fire (14) |

So the problem is not dead weeks. It is noise: five matters every week, never a quiet one, and no matter is more important than another on the desk. The review calls it sprawl: forty systems compete for the desk and the queue adds more. The events themselves are good; nothing ranks or paces them.

## 3. What passes through it

| Kind | Where it comes from today | What the Director does |
| --- | --- | --- |
| Matters on the desk | `pushEv()` (office events, `EVMAKE`, `nightMatter()`, the systems' own matters) | Picks the headline and the threads; holds or quiets the rest |
| Calls on the air | `LIVEK` offers (`pre` and `post`) in `31-live.ts`, `32-direction.ts`, `33-ring.ts` | Caps calls a show; picks which by tension and kind |
| Knocks at your door | the `ask` kinds in `peopleNow()` (Backstage) | Counts toward the week's budget; free answers stay free |
| Tasks | `TASKX` | Never held: tasks are the player's own to-do list, not drama |

**Never held back (forced):** the first year's required actions, anything with a date (a contract running out, a network deal up, a promise falling due), and anything the player started (a reply to their own offer). Forced items still count toward the week, so a week full of them lets nothing else in.

## 4. The tension reading

One number from 0 to 100, worked out at the start of every week from what is already true. Never shown as a number.

| Part | Read from |
| --- | --- |
| Open matters | Unanswered matters in `S.inbox`, and how many have deadlines |
| Clocks near full | `S.clocks` (mutiny, raid, stale, network patience) |
| The room | Average morale, how many are below the breaking point, real heat in the matrix |
| Money | Weeks of wages in the bank |
| Stories | The hottest feud's heat, a feud about to pay off, a company arc chapter waiting |
| Since the last fire | Weeks since the last matter that needed an answer |

It keeps the last eight weeks, so it knows whether the company is building, at a peak, or coming down.

## 5. What it does with it

1. **Tags everything.** Each kind of matter and call carries a tag: a **problem** (a holdout, a raid, someone furious), a **chance** (a breakout, a sponsor, an act catching fire) or **colour** (life outside the ring, the writers' room chatter). The tag lives with the kind (one line per `EVR` entry and `LIVEK` entry), so a new system names its tag (rule 9g).
2. **One headline, two threads.** Each week the desk gets at most one headline (the biggest offered problem or chance, shown first and larger) and two supporting threads, plus anything forced. The style sets the numbers.
3. **What happens to the rest.** A held matter waits in a queue while its cause is still true and can arrive in a later week. Colour that is held becomes a line in The week (no answer needed). A held matter whose cause is gone is dropped.
4. **Which kind.** At high tension it prefers chances and colour; at low tension, problems. After a long quiet spell it lets a problem through.
5. **Calls on the air.** At most two calls on a weekly show and three on a big night (style sets it). The Director picks the ones that matter most tonight. After-the-bell calls stop coming every show.
6. **The rhythm around big nights.** It builds toward a big event (the weeks before carry more), and the week after is calm unless the night itself left a problem.

Rules it keeps:

- It only chooses among things whose cause is already true. It never makes something happen with no reason (cause, warning, choice, payoff).
- Seeded and repeatable: picks use `h01()` on the seed and the week, never `rnd(S)`, so holding something back cannot change other rolls.
- Rival companies are not directed. Only the player's company.

## 6. The styles

Picked when a game starts, beside the difficulty, and shown on Career.

| Style | How it plays |
| --- | --- |
| **The Promoter** | Steady pressure. One headline most weeks, rarely more than two open problems. The default. |
| **The Carny** | Wild swings. Quiet spells, then several things at once. Bigger chances and bigger trouble. |
| **The Purist** | Slow burns. Fewer matters, more about stories and people than money; shocks are rare and large. |

Each style is a small table of numbers (headline and thread counts, calls per show, how fast tension rises, how long it rests), so a world file can add one.

## 7. Data

`S.dir = { st: style id, t: [last eight tension readings], held: [held matters], log: [what it let through and held, last eight weeks] }`. A save from before it has no `S.dir`; it is made on load with The Promoter and an empty history. No other part of the save changes.

## 8. The screens

- **The desk:** On your desk shows the headline first and larger, then the threads. Nothing else changes on the desk (it must still fit at 1280 by 720).
- **The week in full:** gains a short "Also this week" list of quiet lines (held colour).
- **Career:** the style, in one line.
- **The broadcast:** no change in look; fewer calls.

## 9. Balance and money

Fewer matters means fewer chances to earn and fewer to lose. Held chances still reach the player in a later week, and nothing forced is held, so the money loop keeps its inputs. `test-balance.js` (Suggest a card lands around a C and risks the job; a thinking booker keeps it) must still pass. This changes play, so the golden games are re-recorded at the step that turns it on, with the numbers before and after shown to Ryan.

## 10. What it hands the next phase (rule 7a) and what it replaces (rule 9g)

- **Hands on:** every week opens on one headline with a cause the player can see, and every show ends with at most one matter left for the desk: the fire for next week. Its tags and its log feed move 2, the promise ledger, and move 3's clocks.
- **Replaces:** the flat `want` in `genEvents()`, the flat chances in `E.chaos` and `LIVEK.disaster`, and each maker's own cooldown chance where the Director's spacing covers it.
- **Its own tag:** none; it is the system that gives every other system its tag.

## 11. Steps, in build order

1. **The reading only.** `engine/9x-director.ts` with `dirTension(S)`, the eight-week history and the tags. `test-director.js`: 60 weeks of every company, errs 0 and NaN 0, the tension line printed against what happened. Nothing in play changes; the golden games still match.
2. **The gate for the desk.** `pushEv()` offers to the Director; the headline, threads, held queue and quiet lines. Measure the table in section 2 again, before and after, and show Ryan.
3. **The gate on the air.** The call cap and the pick by tension.
4. **The styles.** The choice at the start of a game, the line on Career; old saves get The Promoter.
5. **The rhythm.** Sizes and the build and rest around big nights, after the first four feel right in play.

## 12. Questions for Ryan

Asked one at a time; the answers are written here.

- Edge cases: in a week with nothing urgent, does the Director let a fire through or let the week be quiet?
- Edge cases: when two hard matters fall due the same week, which waits, and does waiting cost anything?
- Player psychology: should the player see the Director at all (a word on the desk), or only feel it?
- Player psychology: will a player who loves to manage everything feel robbed when the cap holds matters back? Should there be a way to see what was held?
- One more turn: must every show end on a hook, or can a great night end clean as a reward?
- One more turn: how often should a chance come instead of a problem?
- The cap: how many matters a week (headline plus threads), and how many calls a show?
- Balance: is the style a difficulty setting, and can it change mid-game?
- Scope: three styles to start, or The Promoter first and the others after it plays well?
- Odd situations: a save from before it existed, and does each booker in multiplayer get their own?
