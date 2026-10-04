# Plan: the ADVANCE button

Ryan, 3 October: a button at the bottom, in the style of the next-turn button in Civilization 6, that always leads to the next big action (next day, book the show, next day, book the show), with the things to do first stacked above it. It is a core part of how the game is played. Notifications move to the top of the screen. Research first, then build.

Status: **built in 0.17.** Ryan said go with the recommended answers to both questions, then shaped it while it was being built. As built: the button is laid **over the right end of the top menu bar** (the bar keeps its original height and look), big, bold, **always yellow**, **one or two words**. When tasks are in the way it says only **Attention**, a note opens under it on hover or focus, and pressing it goes to **the desk**, where the tasks that cannot be skipped are marked and flash. There is **no strip of to-do chips**: Ryan found it clutter and likes the list on the desk. "Coming up" is a line on the desk. **Options, Help and Music are at the bottom right.** Code: `src/96-advance.js`, `app/src/shell/Advance.tsx`. Test: `app/tests/advance.js`. The sections below are the plan as first written; where they differ from this paragraph, this paragraph is what was built.

## Why the button works in Civilization

1. **It is a guide, not an "end turn" button.** Its label is the next thing that needs a decision ("Choose production", "A unit needs orders"), and pressing it takes you there. Only when nothing is left does it say "Next turn". One writer calls it "a brilliant piece of game design" that "takes a massive, complex game and turns it into a series of micro-decisions that can each be made in context."
2. **One place, one key.** It never moves. Players bind it to the space bar and stop looking for anything else.
3. **Must-do and nice-to-know are different things.** What must be decided holds the button. What is only news stacks beside it and can be waved away.
4. **Every turn pays something.** "Every single turn of the game is a mini-compulsion loop": you act, you reach something, you are shown something new.
5. **Something is always about to finish.** Research, a wonder, a unit, a border: several timers of different lengths run at once and never finish together, so there is never a clean place to stop. "There's always a reason to play one more turn."
6. **The player can see the countdown.** Progress is a number going down, in view.
7. **Sid Meier's rules behind it:** a game is a series of interesting decisions; "keep the player focused on what's yet to come"; limit the choices on offer at any moment so nobody is swamped.
8. **The warning.** The same pull exists in poor games. If a press brings no real decision and no real result, it feels like a slot machine and people regret the evening. The button is only as good as what each press delivers.

## What that means for EWF 9000

The game already has the parts: this week's tasks (`src/95-tasks.js`), the show queue, the report, the week closing, and many timers (the next big event, contracts, feud acts, promises, the owner's clocks, title reigns). They are spread over seven sections. The button gathers them.

### The button

- Fixed at the bottom right on desk and TV; a full-width bar at the bottom on a phone. On every page. One key (space bar; the A button stays "select", so the remote gets its own key).
- Its label is the next thing the week needs, in this order:
  1. a task that cannot wait ("Set your house style", "Answer the inbox: 2");
  2. the other open tasks, one at a time ("Pick a play-by-play voice", "Sponsor offers: 2");
  3. "Book Wednesday Night Folio", then "Run the show" once the card is valid;
  4. the report, then the next show;
  5. "End the week".
- Pressing it **goes** to the place for a decision. It only **acts** for the two things that are already one press: run the show, end the week.
- The engine decides the label: `E.advance(S)` returns `{label, to, act, blocked, why}` from the tasks, the queue and the card. The screen draws it. No rule lives in the screen.

### Above the button

- **To do first:** the open tasks as short chips, the ones that hold the button in one colour, the "worth doing" ones in another. Press a chip to go there. A chip that can wait has "Not this week".
- **Coming up:** the two or three nearest countdowns, so there is always something about to pay off: "Big event in 2 weeks", "Dracula's contract: 3 weeks", "King Arthur and Mordred: one show from boiling over", "Owner review in 2 weeks". `E.comingUp(S)` picks them, nearest first, never more than three.

### Notifications

They move to the top of the screen, under the menu, and keep their colours. The bottom belongs to the button and the status line.

### What each press should give

A press that only moves the clock is the hollow kind. Each step must end with something shown: a decision, a result, or a line of what changed. The week closing already has its window; the show has its report. Days with nothing in them are skipped, not clicked through.

## Two questions for Ryan

1. **Days.** Today a week is a list of shows and then "end the week". "Next day, book show, next day" could mean real days. Recommended: the week plays as the days that have something in them (Monday the office, Wednesday the show, Thursday what the rivals did, Saturday the show, Sunday the week closes), and empty days are skipped. The other choice is seven real days a week with something small on each, which is a much bigger change to the engine.
2. **Guide or do.** Recommended: the button guides (takes you to the decision) and only acts for running the show and ending the week. The other choice is a button that also fills in what it can (suggested card, safe answers), which is fast mode, already on the list as its own item.

## Sources

- https://mssv.net/2010/08/16/one-more-turn/
- https://gamedeveloper.com/blogs/just-one-more-turn---game-development-tips-and-tricks-from-the-creator-of-civilization-sid-meier-
- https://rmcphersonnarrativedesign.wordpress.com/2017/01/18/just-one-more-turn/
- https://theahura.substack.com/p/on-towards-the-stars-game-settings
- https://aftermath.site/podcasts/aftermath-hours-podcast-civilization-vii-one-more-turn/
