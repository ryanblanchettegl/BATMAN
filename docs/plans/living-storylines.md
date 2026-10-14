# Living storylines

Ryan, 14 October 2026: "I want storylines to be fluid, they end when you want them to end, a feud could stay hot for a
year, or just not work out. Get rid of the short, medium and long feuds. Feuds need to be organic, and you can use
shows, angles and other stuff to make them hotter."

This replaces the feud lengths of `docs/plans/storylines.md`, part 1 (short, medium and long, a planned ending week,
chapters on a timetable). A feud no longer knows when it ends. It has a temperature that the booking raises and time
lowers, and it ends when the booker ends it or when the crowd stops caring.

## What others do

- **Real booking.** A feud runs as long as it draws. Bookers talk about "heat" (how much the crowd cares) and about a
  feud "running its course" (the crowd has seen everything it has to offer). The best ones are given new life by a
  turn, a new partner, a title or a stipulation. Some last a year; many die in a month because the crowd never bought
  the two of them together.
- **Total Extreme Wrestling** offers chained storylines (scripted steps) and unchained ones, where any match or
  angle between two people in a storyline counts toward it. Fans prefer the unchained way: you build it on the fly.
  ([TEW review discussion](https://www.osftw.com/news/393929/total-extreme-wrestling-2010-review),
  [Total Extreme Wrestling](https://en.wikipedia.org/wiki/Total_Extreme_Wrestling))
- **WWE 2K Universe** gives a rivalry an intensity that climbs from sportsmanship to all-out attacks as the people in
  it interact, and in later games a momentum that is earned by winning and spent on actions: a handshake, a cheap
  shot, a beatdown. ([2K18 Universe details](https://mp1st.com/news/wwe-2k18-universe-mode-detailed-new-mechanics-explained),
  [2K23 Universe](https://wwe.2k.com/2k23/features/universe/))
- **Storylets and drama managers** (Fallen London's quality based narrative, Facade's drama manager): small pieces
  of story with conditions on the state of the world, picked by what is true now rather than by a script, with
  repeats pushed down so the same beat does not come round again too soon.
  ([Storylets and saliency](https://docs.yarnspinner.dev/write-yarn-scripts/advanced-scripting/storylets-and-saliency-a-primer))
- **Simulation storytellers** (a director that watches tension and paces events) and story sifting (Felt): let the
  simulation make events, then notice which ones form a story. This game already sifts (`src/84-sift.js`).

What they share: the story is not a timetable. It is a state (how hot, how fresh, who has the upper hand) that every
segment moves, and an ending the booker chooses at the right moment.

## Twenty ideas

1. **No length, no planned week.** A feud starts, and it runs until it is ended or dies. Built.
2. **Heat and freshness are two numbers.** Heat is how much the crowd cares. Freshness is how much the story still has
   to give. Every beat raises heat but costs freshness, so a feud that is only fed the same thing goes stale. Built.
3. **Diminishing returns.** The same kind of beat twice in a row is worth less, and a stale feud gains less from
   anything. Variety (a promo, then a brawl, then a match, then a stipulation) is how a feud keeps climbing. Built.
4. **Twists refresh it.** A turn, a betrayal, a title put on the line, a new partner, a stipulation: each gives
   freshness back. That is how a feud lasts a year. Built.
5. **Rest refreshes too.** A week with nothing in the feud cools the heat a little and gives a little freshness back,
   so a feud can be put on the back burner and brought back. Built.
6. **It can just not work.** A feud with no heat for three weeks running fizzles out: the crowd never bought it. Both
   remember, mildly. Built.
7. **The booker ends it.** Mark a match on the run sheet "End the story here" (a blow-off), or plan the ending for a
   night from the Storylines page. Built.
8. **The ending pays by the moment.** A blow-off at peak heat with freshness left pays the most; ending a hot feud a
   little early is better than ending a stale one late; ending a cold one pays little. Built.
9. **Long feuds earn more.** A feud that has stayed alive a long time and is still hot pays a longevity bonus at its
   end, and both wrestlers remember it as the story of their careers. Built.
10. **Every meeting is a round.** A match between the two that is not the ending is a round of the feud: the winner
    takes the upper hand, the loser wants it back. Built (rounds at big events, as chapters were).
11. **The crowd needs doubt.** If one side has won every round, the feud loses heat faster: nobody believes the
    other can win. Built.
12. **Split attention.** Somebody in two feuds at once heats both more slowly. Built.
13. **Real heat counts.** Two people who really do not like each other (the relationship matrix) heat faster.
    Built.
14. **Chemistry counts.** Two who work well together in the ring heat faster. Built.
15. **Big nights count more.** A beat on a big event is worth more than the same beat on weekly television. Built.
16. **Escalation unlocks.** Each stipulation needs the feud to be hot enough to believe it: a submission or lumberjack
    match fits early, tables and hardcore need a feud that is building, a cage a hot one, hair or mask a white hot one
    (`STIP_NEED`, `stipFitOf()`). Earned with room to spare adds the most heat; too soon takes heat away, and more the
    further off it is. The run sheet flags it either way. Built.
17. **Embers.** A finished feud leaves embers: the same two can be put back together months later with a head start,
    and Start a feud says they have history. Built (`S.embers`, kept a year).
18. **The heat line.** The Storylines page shows each feud's heat over the last twelve weeks as a line, with its
    phase in words: Spark, Building, Boiling, Stale, Cooling. Built.
19. **The calendar speaks to the state.** What the page says comes from the state: ripe to end (hot and getting
    stale), going stale, going cold, one sided, split attention, champion with no challenger. Built.
20. **Rivals book the same way.** Other companies would end a feud when it is hot and starting to go stale, or let
    it fizzle, by the same rules. The rule is written (`rivalRipe()`), but rival companies do not keep feuds of their
    own yet, so it waits for that. Built: each rival keeps two or three feuds near the top of its card, its television
    feeds them, its weekly cards book them, and it ends them by `rivalRipe()` on a big night.

## What changed in the code

- `src/21-feudlen.js` becomes `src/21-living.js`: freshness, rounds, endings, fizzling, the season view and Start a
  feud, with no `FLEN`, `f.len`, `f.pay` or `f.ch` left. An old save's feud simply keeps going; the old fields are
  ignored.
- `feudDue(S, f, show)` says 'end' only when the booker marked the ending (or, for a rival, when the rules above say
  so), and 'chapter' for a round on a big night.
- Start a feud costs 2 booking power and asks only for two people.
- On the run sheet a match between two in a feud has End the story here.

## Built since (14 October)

- **Things to do from the picked story** (`E.storyActs`, `E.storyDo`): raise the stakes (1 booking power, a twist that
  freshens it), a sit-down interview (1, a beat, once a week), put a champion's title on it (free), and the back
  burner (four weeks of rest: it freshens, cools slowly, never fizzles, and the suggested card leaves it alone).
- **After the show** says how each feud moved that night: hotter or cooler and by how much, and which ended.
- **Book the show** lists the feuds on the card in Tonight's stakes, and a match marked as the ending is billed as
  the final chapter on the broadcast.
- **The newsletter** has a Feud watch, and **the chat room** talks about the feud that is boiling, dragging or over.
