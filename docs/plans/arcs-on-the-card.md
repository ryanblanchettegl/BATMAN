# Storylines on the card

Ryan, 21 October 2026: "a new core feature". This is the plan, and what was built on the first day.

## What Ryan asked for

1. **Arcs.** New segments the writers force onto the show to continue a story arc. The booker does not book them. On the booking screen the booker decides certain things about the arc instead of booking a match, and each decision sends the story in a different direction. Make one arc now; more come later.
2. **The first show is the tutorial.** Every new game starts right before the biggest show of the year. Booking it is the tutorial: book all your champions, use a title suggest button, and other first things. It also shows the ending of a storyline arc that the booker has to book after the main event.
3. **Storyline matches are red.** A match with two people in a storyline together is highlighted in red.
4. **Guest commentary on every match**, so feud members are easy to add.
5. **Run-ins on every match**, to keep shows going. How the match ends is still up to the writers or an action event during the show.
6. **Promises lock the card.** A rematch or a title match promised at the next big event is on that card already, locked with at least that wrestler. The same for promised promos. This gives emergent storytelling.

## How it is built

### Arcs (`src/99-tale.js`)

- An arc is `TALES[k]`: a name, a `cast(S)` that picks its people from the roster as it stands, a start chapter, and chapters (`nodes`).
- A chapter has its text, the people in it (roles), the storyline beat it plays as a scene (rule 9c), one question, and three answers. Each answer has `next` (the chapter it leads to), and what it does: bonds through `relBump()`, a turn, a feud started or heated, a team split or formed, a match locked on the next big event, a push.
- A chapter can wait for a big event (`at: 'big'`) and can come after the main event (`post`). Segments after the main event are new: `sg.post`, and `pos` keeps its old meaning.
- The writers put the chapter on the run sheet when its show comes (`SEGNEW`, run when a show's segment list starts). It is `sg.forced`: Remove refuses, Clear keeps it, Suggest keeps it, the time fitter never cuts it, and the "they are not going home" call never cuts it.
- The booker's answer lives on the arc (`S.sa.ch`), not on the segment, so suggesting or clearing never loses it. An arc waiting for an answer is a task (`card: true`, cannot be waved off), so the screens stop for it and a headless game never waits. A chapter that airs with no answer goes the writers' way (the answer marked `safe`).
- An arc ends on a chapter marked `end`. It lands by how much the crowd came to care (`S.sa.heat`): popularity, booking power and the owner's trust. A new arc begins four weeks later, with people who were not in the last two (`taleRecent()`).
- **The first arc: The betrayal.** Two partners (a regular team, or two friends on the same side), and a villain who can tempt one of them. Seven chapters: Cracks, An offer, The turn, Two against one, The answer, The last word, Standing tall. It can end with the hero getting the last word, the villain winning the night, the partners reuniting, the team standing tall, or the villain joining them.

### Storyline matches (`storyOfMatch()` in `src/99-tale.js`)

Two people on the same running feud, or both in the arc, make a storyline match. The run sheet draws it red with a `[Storyline]` mark, and the match's detail line names the story.

### Guest commentary and run-ins (`src/99-ringside.js`)

- `m.gc`: a guest at the commentary desk. `m.ri`: somebody booked to run in. The match editor has a dropdown for each; the ones with a story with somebody in the match come first and say why.
- A guest with a story lifts the crowd, heats the feud and says two lines on the call (a beat with `g`). The broadcast cuts to the desk's third chair for those lines (`desk3`).
- A booked run-in is at the curtain when the match comes up, every time: a call of its own (`LIVEK.bookrun`, outside the night's limit). After the bell (a beat-down, the finish untouched, and what a game nobody plays does), during the match to cost somebody it, during the match and fought off, or kept in the back. The finish only changes if the booker sends them in during the match.

### Promises lock the card (locks, in `src/99-tale.js`)

- `S.locks`: a match or a promo promised for a later show. A title shot asked for, a rematch after a title change, a title shot said yes to backstage, and an arc's "a match at the next big event" all make one. A wrestler can now ask Backstage for a promo on the next show (`askpromo`), and yes makes a locked promo.
- When the show comes (`SHOWON`), the match is on the card already (`m.pm`, `m.lock`) with the promised wrestler in it; for a title, the champion of the night. The booker fills any open spot. Remove refuses, Clear keeps it, Suggest keeps it, and the show cannot run without it.
- Clashes move a promise to the big event after it, and the wrestler is told: the same title promised twice for one night, a champion promised to two challengers, a champion who cannot work that night.

### The first show (`src/99-tutorial.js`)

- `E.newGame(..., { start: 'flag' })` opens the game in the fourth week of the flagship's month (`CAL0.o`, kept in the save as `S.db.startOff`). That week holds only the flagship.
- The betrayal is on it at its last chapter, after the main event, with the three chapters before it already written. The match the hero asked for is promised on the card.
- The steps (`E.tutInfo()`, a "First show" tab beside the run sheet): book every champion (or as many as the show has room for; Title matches books them, the biggest titles first, locked in place so Suggest fills around them), the promise, the arc's ending, storyline matches and the new match options, filling the time, going on the air. Booking the champions is a task that cannot be waved off.
- Options has a switch for it ("Open on the big show"). Browser tests start the old way unless `open({ tut: true })`.

## What comes next

- More arcs (Ryan: "we will create more later"). Each is one entry in `TALES`. Company arcs (`src/99-arcs.js`, the desk's yearly arc) could move onto this system: chapters on the run sheet instead of the desk.
- A World Editor builder for arcs, beside the Stories and Rules tabs (rule 9c asks for one).
- The booking notes should warn when a planned feud ending and a promise want the same wrestler on the same night.
- A promised promo could carry what it is about (a title, a rival).
