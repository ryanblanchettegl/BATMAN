# Plan: short, medium and long feuds, and rivals

Concept 8 October. Pictures: `docs/mockups/storylines/`. Steps 1 and 2 of the build order are done (`src/21-feudlen.js`, `app/src/screens/stories/StartStory.tsx`, `node test-stories.js`); the rest is not built. Ryan's answers to the questions at the end are still to come, so the build follows the defaults written here.

Ryan, 8 October: "We want short, medium and long feuds. We also want rivals."

## Where it stands today

- A feud is `S.feuds[i]`: two sides, heat 0 to 100, a log, wins each way, maybe a title (`startFeud()` in `src/00-core.js`).
- Its act comes from heat alone (`feudAct()` in `src/20-story.js`): under 30 Spark, under 60 Escalation, 60 and up Twist, a twist played makes it Blow-off.
- It ends when heat runs out or nobody touches it for five weeks (`src/40-week.js`). It never ends because it was meant to. Nothing knows when it should pay off.
- Once it ends it is forgotten. Twelve finished feuds are kept, then dropped. Two people can have the same feud four times and the game does not notice.
- Backstage, `S.rm` already says how two people feel about each other (`bondOf`, `respOf`, `jealOf`). The file calls the worst of those "rivals", which is real-life dislike, not a story.

So two things are missing: a story has no length and no planned end, and nothing lasts after a story is over.

## 1. Three lengths of feud

The player picks a length when a story starts. The length sets how many acts it has, how hot it can get, where it ends, what the ending is worth and what it costs.

| | Short | Medium | Long |
|---|---|---|---|
| Runs | 2 to 4 weeks | 5 to 8 weeks | 12 to 24 weeks |
| Acts | Spark, Blow-off | Spark, Escalation, Twist, Blow-off | Spark, Escalation, then chapters: each chapter is a Twist and a match, and the last is the Blow-off |
| Ends at | a weekly show, or the next big event if it is close | the next big event at least five weeks away | two or three big events; the last is the biggest of the season |
| Heat can reach | Hot (60) | White hot (85) | 100 |
| Cost to start | 1 booking power | 2 | 3 |
| Ends with | one match | one match with stakes if a twist set them | a match at each chapter end, the last one with the biggest stakes |
| If you miss the ending | one week of grace, then cools fast | moves once to the next big event, then cools | a chapter moves once; missed again it is lost and the story goes on |
| What it leaves | a little popularity, a winner | a lift for both, maybe rivals | rivals for sure, a lift for both, a line in History |

What each length is for:

- **Short.** A challenger of the month for a champion, a reason for a newcomer to be on the card, a gap filled before a big event, a grudge that should not last. Cheap, quick, safe. It cannot carry a main event at a big show: the crowd has not been given long enough to care.
- **Medium.** The bread and butter. One big event, four acts, a planned blow-off. Most stories are this.
- **Long.** The story of the year. It needs a twist in each chapter or the crowd tires of it ("They have seen this", heat falls a little each week with nothing new). One injury can break it, so it is a risk. When it lands, both people come out of it bigger, and the company with them.

### Planned endings (this is 6.9 in the art direction plan)

- Every feud gets `len: 's' | 'm' | 'l'` and `pay`, the week it is meant to end (`end` was already the week a feud ended). A long feud also gets `ch`, the weeks of its chapter ends, `chd`, how many have closed, and `chw`, who won each.
- The ending is set when the story starts (the default is the one the table says) and can be moved on the Storylines page.
- `feudAct()` reads the length and the weeks to the ending, not heat alone. Heat says how well it is going; the calendar says where it is.
- Paid off on its ending: a lift (bigger for longer). Run past its ending: it cools. Ended early: no payoff.
- A short feud whose ending is a weekly show is fine. A long feud must end at a big event.

### What the player sees

- **The season** (the calendar already in the Storylines mock-up) draws each story as a bar with its length on it: S, M or L. A long story has a star at each chapter end and two stars at its last.
- **Start a story** (a pop-up from "Start a rivalry", renamed "Start a story"): pick the two, pick the length from three buttons that say what each gives, see where it ends, see what the road agent says about them. If the two are rivals already, it says so and starts further on.
- **The story's pane** on the right: the acts or chapters as a track, heat, weeks to go, what this week needs, where it ends.
- **The checks** under the calendar get two new lines: "A long story with no twist in five weeks" and "A short story in the main event of a big show".

### Rivals run them too

- A rival company starts a short feud for a title defence and a medium one for each big event, and one long story a year for its top title. Its model can change the mix (a cruiserweight touring company runs short ones; a big television company runs a long one each year). One more number on each model.
- The Net reports how they end: "Their long story paid off at the winter show" or "They let it fizzle".

## 2. Rivals

A rivalry is two people who have history. It is not a story: a story is a few weeks of television, a rivalry is what is left when the story is over. It lasts years.

### What a rivalry is

`S.rv[rkey(a, b)] = {a, b, since, fs: [feud ids], aw, bw, dr, best, last, lvl}`:

- `since`: the week it began.
- `fs`: every feud they have had. Each is one chapter of the rivalry.
- `aw`, `bw`, `dr`: the series, every singles match between them, wins and draws.
- `best`: the best match they have had, in stars, and where.
- `last`: the last week they were in a story together.
- `lvl`: how deep it runs, said only in words: Old foes, Rivals, Bitter rivals, Rivalry of the age.

### How one begins

- A medium feud that paid off on its ending with a good match (three stars or more).
- Every long feud.
- Three or more singles matches between the same two inside a year, story or not.
- Two people with real heat backstage (bond at or below `-REL_STRONG`) who are put in a story together.

### What it does

- **History sells.** A match between rivals draws a little more and the crowd is louder, more for a deeper rivalry. The road agent says so in the ear ("These two have history"), and the desk names it.
- **Rekindling.** A new story between rivals is cheaper (one less booking power) and starts at Escalation, with heat from the last chapter. The commentary tells the old story.
- **The crowd needs a rest from it.** Rekindled within eight weeks of the last chapter, it starts cooler ("Not this again"). Left alone for six months or more, it starts hotter ("They have been waiting for this").
- **It deepens.** Each chapter that pays off moves the level up. A chapter that fizzles moves it down. A rivalry with no chapter in two years goes quiet: kept in History, no longer on the page.
- **One rival each.** A person's main rival is the rivalry with the highest level. The file shows it, the Roster shows it, and a free agent remembers who their rival was.

### Respect or real heat

Two people can be rivals in the ring and friends in catering, or hate each other in both. The game already knows which (`S.rm`). That changes how the rivalry plays:

- **Respect** (`respOf` high): they make each other. Matches between them are better, the rivalry deepens faster. Each chapter is a `relBump()` toward respect.
- **Real heat** (`bondOf` low): the crowd can tell. Bigger reactions, but the match is stiff, a hurt is more likely, and the gorilla position can get a call ("They are really hitting each other"). Each chapter can make it worse.

### People remember (rule 9b)

- Starting a story, a chapter end, and who you had win each one go through `youRemember()`: "You gave him the last word in our rivalry", "You made me lose to her three times".
- A rivalry that was promised a payoff and never got one is remembered by both.
- Each chapter end puts a line on the notification bar, and the dirt sheet calls the series ("Washington leads it 4 to 3").

### What the player sees

- **Rivalries**, a window on the Storylines page under the season: each rivalry a line with both faces, its level in words, the series, how long since the last chapter. Live ones first, then the ones that are resting.
- **The rivalry file** (a pop-up from that list, the Roster and a person's file): both faces, the level, the series, every chapter with its length, ending and grade, the best match, respect or real heat, how long it has rested and what that does, and Rekindle with its cost.
- **The person's file** gets a line: Rival, with the name and the level. What it calls "rivals" today, people they dislike backstage, becomes "At odds with" so the two are not mixed up.

## 3. How it hands on (rule 7a)

- The Office: a story's ending is a countdown on the desk ("Two weeks to the blow-off"). A rivalry resting long enough to be hot again is a line on the desk.
- Booking: the run sheet flags a match between rivals, and a match that is a story's ending.
- The show: a chapter end can leave a matter ("The loser wants a rematch now"). That is a choice: a short rematch story, or make him wait and the next chapter starts hotter.

## 4. Build order

One step at a time, each shown before the next.

1. (Built 8 October.) Engine: `len`, `pay` and `ch` on feuds; `feudAct()` from the calendar; the payoff and the cooling; old saves get a length the first time a feud is read, so no version bump was needed. `test-uni.js` 60 weeks clean, and a new `test-stories.js`.
2. (Built 8 October.) Start a story pop-up with the three lengths. The rivals' discount comes with step 4.
3. The season calendar on the Storylines page, with the bars and the checks.
4. Rivalries in the engine: `S.rv`, how one begins, the series, the level, the crowd lift, the rekindle.
5. The Rivalries window and the rivalry file.
6. Rivals in the file, the Roster, the ear, the desk, the dirt sheet.
7. Rival companies run lengths by model.

## Questions for Ryan

1. By "rivals" this takes you to mean two wrestlers with lasting history. If you meant rival companies, say so and that half changes.
2. Are the weeks right? Short 2 to 4, medium 5 to 8, long 12 to 24.
3. Can a long story run through a title change in the middle (the title moves at a chapter end and the story goes on)? This plan says yes.
4. Should a tag team or a stable be able to have a rival too, or only one person against one person to start?
5. "Start a rivalry" on the Storylines page becomes "Start a story". Rivalries are made by stories, not bought. Agree?

## What step 1 decided

- A story nobody chose a length for runs medium; a dream match runs short. Long is only by choice (step 2) or, later, a rival company's story of the year.
- A story is not settled before its night, even if the two meet at an earlier big event. That match heats it instead.
- On its night the autobooker books it first, for every company, and its people are kept out of other title matches; if one of them holds a title, the match is for the title.
- A weekly limit on how fast heat climbs was tried and dropped: it made a call from the gorilla position do nothing late in a busy week.
- What the ending is worth: short 0.6, medium 1, long 1.6, times the heat (a cold blow-off is worth half), times 0.7 if late. Both people's mood rises when it lands on its night.
- Over 60 weeks of every company the numbers stay where they were: no errors, rating against expectation within noise. Fewer stories fizzle (in one year of the second company: 24 ended, 20 on their night, 4 fizzled).
