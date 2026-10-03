# Plan: storyline templates with beats (wish 25, TASKS 2)

Not started in the game. The engine half exists as a work-in-progress file and is not in `src/` yet.

## What it is

A template is a cast, a cost in booking power, three to six beats spread over weeks, a payoff, and a way to go wrong. The player pays to start one. The writers can also pitch one. Rival promotions run them too.

## What exists

- Feuds in four acts and the angle generator: `src/20-story.js`.
- Stables: `src/60-rpg.js`. Stable roles and unity: `src/82-wishes.js` (wish 32).
- The long plan for the flagship: `src/91-wishes-late.js` and `E.longPlan` (wish 26). A template beat can reuse its "built" count.
- A draft plots engine (265 lines, seven templates) was written earlier and set aside. It is in the git stash on this branch ("WIP on claude/fervent-cannon-uqqay2"). Read it before writing anything. It keeps its state in `S.plots`, `S.plotLog` and `S.plotOffer`.

## Steps

1. Put the draft in `src/63-plots.js`. Make it pass `test-uni.js` for 60 weeks with errs 0 and NaN 0.
2. Add a "Start a storyline" section to the Storylines page: pick a template, see the cast it would choose, see the cost, press start.
3. Show each live plot as a card with its beats and what the next show needs. Missing a beat cools it. Hitting the payoff lifts everyone in it.
4. Hook the autobook (`autoBook`) so the next beat is on the suggested card.
5. Rival promotions: run one template at a time per rival from `WEEKX`, and put a line in the news.
6. A browser test in `app/tests/stories.js`: start one, run its first beat, see the card change.

## Risks

- Beats that need a match between two named people collide with injuries and holdouts. A beat needs a "skip" rule (wait two weeks, then cool the plot).
- Booking power is already tight. Cost 4 to 6 for an epic one, 1 to 2 for a small one.
