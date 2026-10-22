# Promos written from everything that is going on

Bill, 21 October 2026: "p4 = This is a main idea. Since it will make promos much better. I would like this to work so good, that promos can be procedurally generated based on whats going in the show, feuds and other stuff that hooks in with the wrestler." From the killer features research (project file `killer-features/WrestleCraft-killer-features.pdf`, idea P4, "every voice its own"). Nothing here is built. One step at a time (rule 9a). This is a main feature.

## What exists today

`promoSpeech()` in `src/60-grammar.js` writes a promo from four parts (an opener, a callback, the point, a closer) with the grammar engine (`GR_PROMO`, Tracery style, each line allowed only when it is true, picked by `h01()` so words never change a game). It knows: heel or face, how good they are on the mic (three tiers), the opponent, a title held or wanted, their last result against the opponent, a winning streak, the home town, how long the feud has run and their finisher. Every wrestler draws from the same lines, so two heels sound alike, and nothing stops the same line coming back next week. Catchphrases (`src/82-wishes.js`) come from a short fixed list.

## The change in one paragraph

A promo is built in two steps. First the game gathers **what this wrestler could talk about tonight**: every true fact about them, the show, the feud and the world, each with a weight for how much it matters right now. Then it writes the promo **in their own voice**: a lexicon built from their gimmick, style, personality, home town and backstory, so a Monster, a Showman and a Technician say the same thing three different ways. A memory stops a line or a topic coming back too soon. The result: no two promos the same, and every one about something that really happened.

## 1. What they can talk about (the topics)

Each topic is a fact with a weight. The promo picks the top two or three by weight, with a little hash so it varies.

| Topic | Comes from | Example |
| --- | --- | --- |
| **Tonight's match** | The card, the stipulation, the opponent | "Tonight it is a cage. Nowhere to run, {them}." |
| **The feud's history** | The feud, head-to-head, the beats so far | "Three weeks ago you put me through that table." |
| **Last week** | Last show's results, angles, run-ins | "Last week you hid behind your friends." |
| **A title** | Held, wanted, lost, a title promise | "I lost that belt in a screwjob, and you all saw it." |
| **The big event coming** | The calendar, advertised matches | "Sixty days to the Grand Slam, and I am counting." |
| **Their want** | Wants (`docs/plans/traits-and-perks.md`) | "All I ever wanted was a fair shot." |
| **A grievance** | Grievances (`docs/plans/come-back-changed.md`) | "You fired me in this building." |
| **A mood** | Bitter, On a roll, Proving it | "Nobody believed in me. I believed in me." |
| **A partner or stable** | Tag teams, stables, unity | "My brothers have my back. Do yours?" |
| **A betrayal** | The relationship matrix, live call 38 | "I carried you for two years." |
| **Real heat** | High heat in the matrix, said in kayfabe terms | "This is not business. This is personal." |
| **The home town** | `homeKm()` | Today's lines, kept |
| **A streak or a slump** | `w.ws` | Today's lines, kept |
| **An injury** | Coming back, or the opponent's bad knee | "I have heard about that knee, {them}." |
| **The crowd** | Tonight's crowd, the city, a chant | "They are chanting my name in {city}." |
| **The company arc** | The year's arc and its cast (`src/99-arcs.js`) | "This company belongs to us now." |
| **A legend or a teacher** | Teacher and student, legends | "The one who trained me is watching." |
| **The rival company** | The ratings war, a rival's star | "Over there they would never give me this." |
| **A secret** | The kayfabe layer, if they are spilling it (live call 14) | Risky, and the game says so |
| **History** | Pre-history and the save's own past | "Ten years ago my father stood in this ring." |

## 2. How they say it (the voice)

Each wrestler gets a small **lexicon**, built by hash from what is true of them and stored as a few ids, not words:

| Part | Comes from | Example |
| --- | --- | --- |
| **Register** | Gimmick | Monster: short and blunt; Showman: loud, third person; Technician: precise; Mystic: riddles; Comedy: jokes; Old hand: stories |
| **Favourite words** | Gimmick and home town | A Brute says "hurt"; a Southern talker says "y'all" (from the region) |
| **A tic** | Hash | Repeats the last word; ends on a question; names the crowd |
| **How they insult** | Personality | A Hothead threatens, a Proud one belittles, a Cool head is dismissive |
| **How they praise** | Personality | A Loyal one thanks their partner, a Leader the room |
| **Topics they come back to** | Wants and backstory | "My family", "respect", "the gold" |
| **Their catchphrase** | Earned (wish 28), or generated from their lexicon | No more fixed list |

The grammar gets per-character symbols, so `#insult#` expands differently for each wrestler. Mic skill still sets the tier (polished, says what it needs to, fumbles), and charisma decides how well a line lands.

## 3. The shape

A promo is a shape, not a script, chosen from the segment kind (`SEGK` in `src/93-segments.js`: interview, call-out, war of words, challenge, face-off, contract signing) and the moment:

- **Interview**: open, one or two topics, the point, a closer.
- **Call-out** and **challenge**: open, the grievance or the reason, the call-out, the stakes.
- **War of words**: the two speak in turns, each answering the other's last topic ("You talk about last week? Let us talk about Grand Slam."), three or four exchanges, an interruption if real heat is high.
- **Contract signing**: the build, the signing, the last word.

A two-person promo answers itself: the second speaker picks up the first speaker's topic and turns it. That is what makes it read like a real exchange.

## 4. No repeats

A small memory on each wrestler of the last lines and topics they used (kept for eight weeks, a few ids). A line is not reused inside that window, and a topic used two weeks running gets less weight. Stored as ids, so the save stays small.

## 5. What the promo does

The words are not decoration. A promo that hits the hottest topics (the ones with the most weight) grades higher than a generic one, because it is about what the crowd cares about. That uses the existing promo grading, with a bonus for **relevance**. A promo that names a secret, a real grievance or the rival company carries the risks those already have. A great line can coin a catchphrase from the wrestler's own lexicon.

## 6. Where promos appear

The interview, call-out, war of words, challenge, face-off and signing segments (today's `src/20-story.js` calls), the writers' pick, the magazine's interview (0af), the returns (P3), the hallway lines (R2) and the feed. Scenes (TASKS 0u) show the promo as speech bubbles.

## Steps, in build order

1. **Topics**: gather every fact a wrestler can talk about, with weights, as one function (`promoTopics()`). Headless test: 60 weeks of every company, errs 0, NaN 0, every promo has at least one topic that is true, and the same seed writes the same promos.
2. **Lines for each topic**: the twenty topics as grammar rules, a few at a time, starting with tonight's match, the feud's history, last week and a title.
3. **The voice**: the lexicon by gimmick and personality; per-character grammar symbols. Show Bill three wrestlers saying the same thing.
4. **No repeats**: the line and topic memory.
5. **War of words as an exchange**: two speakers answering each other.
6. **Relevance in the grade**, and catchphrases from the lexicon.
7. **Everywhere else**: magazine, hallway, returns, feed.

## Open questions for Bill

- Should the player be able to read the whole promo before the show (from the booking screen), or only after it runs?
- Should the player be able to pick the topic ("talk about the screwjob") as a booking choice, at a cost of booking power?
