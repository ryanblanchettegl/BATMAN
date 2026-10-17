# Characters with backstories (a plan for Ryan)

17 October 2026. Not started. Nothing here is built until Ryan says go, one step at a time (rule 9a).

## The idea in one paragraph

Make the default world original: wrestlers the game invented, each with a backstory it can read. A backstory is data, not flavour text: where they came from, who trained them, what they want, what they fear, who they are tied to, and what they hide. The story systems (story sifting, requests at your door, the writers' room, leaks, company arcs, story mode) then build storylines from real motives instead of numbers. The World Editor gets the tools to write any character with a full history, so a player can build a real-world world for themselves. The game itself never ships real people.

## Why

- **Better storylines.** A parody character borrows meaning from a real person the game cannot model. Players expect the real-life arc, the simulation goes somewhere else, and it feels wrong. An original character's story is whatever happens in the game.
- **The game knows why.** "Ambitious, trained by the champion's rival, wants the title before turning 30" gives sifting, requests and the writers a reason. Today they mostly have ratings, mood and records.
- **No legal exception needed.** The parody world was allowed on a lawyer's advice (rule 3). An original world needs no exception.
- **A proven model.** Text wrestling sims have long shipped fictional worlds, and their players build real-world packages themselves.

## What exists today

The world format already holds much of this (`docs/modding.md`):

| Already there | Where |
|---|---|
| Gimmick, gimmick category, catchphrase, finisher and its description | each worker |
| Hometown, debut year, peak years, disposition, style, roles | each worker |
| Relationships with a type, a strength, ring chemistry and a note | `relationships` |
| Reigns, famous matches, feuds and moments before the game starts | `history` (loaded by `src/86-history.js`) |
| Teacher and student (`w.coach`), hometowns, family | the engine |

What is missing is the inner life: what a character wants, fears and hides, and their traits. Those are the parts the story systems need most.

## Step 1: the backstory block

One optional block on each worker. Anything missing is filled in by the generator (step 3), so old worlds and saves load unchanged (rule 9).

```json
"backstory": {
  "origin": "Grew up over his father's gym in a mill town; the gym closed when the mill did.",
  "trained_by": "old_dutch_vance",
  "path": ["indies", "japan", "tv"],
  "traits": ["ambitious", "proud"],
  "wants": { "k": "title", "text": "To hold the top title before he turns 30, the age his father quit." },
  "fears": { "k": "forgotten", "text": "Being the guy people used to talk about." },
  "ties": [ { "who": "kid_comet", "k": "brother" } ],
  "secrets": [ { "k": "hurt", "text": "Has wrestled on a bad knee for two years." } ],
  "defining": [ { "date": "2019-08", "text": "Lost a hair match in front of his home town and walked out of the building in silence." } ]
}
```

| Field | What it is | What reads it |
|---|---|---|
| `origin` | One or two sentences | The file, promo words, the dirt sheet |
| `trained_by` | A worker id | Teacher and student (`w.coach`) |
| `path` | Where their career went | Promo callbacks, rival interest |
| `traits` | Two or three from a fixed list | How they react to your choices |
| `wants` | A kind (`title`, `money`, `respect`, `home`, `legacy`, `revenge`, `family`) and a sentence | Requests at your door, sifting, story mode |
| `fears` | A kind (`forgotten`, `injury`, `replaced`, `failure`) and a sentence | Mood swings, walkouts, leaks |
| `ties` | Family, best friend, old grudge, mentor | The relationship matrix at the start |
| `secrets` | A kind and a sentence | The kayfabe layer (leaks) |
| `defining` | Dated moments | History, promo callbacks |

### Traits (the fixed list)

Ten to start, each with one clear effect, so a trait always means something:

| Trait | What it does |
|---|---|
| Ambitious | Asks for title shots sooner; a push lifts mood more |
| Loyal | A rival's offer tempts less; remembers good treatment longer |
| Hothead | Real heat builds faster; a loss hits mood harder |
| Proud | Hates losing clean; refuses some finishes |
| Mentor | Helps young wrestlers grow; works late with them |
| Showman | Promos land better; the crowd forgives a weak match |
| Grinder | Recovers from a bad night quickly; asks for little |
| Party animal | More likely to make trouble on the road |
| Family first | Asks for time at home; happier booked near their home town |
| Locker-room leader | Steadies the room; the room follows their mood |

A trait changes how a person reacts through `relBump()` and `youRemember()` (rule 9b). It is shown in words in the wrestler's file.

## Step 2: storylines that use it

Each story system reads the backstory. Nothing new on screen except better reasons.

| System | What it gains |
|---|---|
| Story sifting (`src/84-sift.js`) | New patterns: the student and the teacher's rival; brothers on opposite sides; an old grudge from the history; a want blocked by another person (both want the same title) |
| Requests at your door (`src/79-people.js`) | Requests come from wants: a `home` want asks for a show in their town; a `legacy` want asks for a match with a legend |
| The writers' room (`src/99-writers.js`) | Pitches built from a want or a fear, in the writer's style |
| Kayfabe (`src/99-kayfabe.js`) | Backstory secrets become secrets the press can find |
| Promo words (`src/60-grammar.js`) | Callbacks to origin and defining moments |
| Story mode (planned) | Chapter beats pick the person whose want or fear fits ("Walkout" picks the star whose fear is being replaced) |
| After the show | "That win meant more: he finally did it in front of his home town" |

## Step 3: the generator

A seeded generator writes a believable backstory for anyone without one. It uses `h01()` and the world's seed, never `rnd(S)`, so games stay repeatable. It is used for the undercard, free agents and anyone a world leaves blank.

- Picks an origin from region, age and style.
- Picks traits that fit the style and disposition (no dice wording anywhere it is shown).
- Sets a want and a fear that fit the career stage: young wrestlers want a break, veterans want a legacy.
- Ties people who share a home town, a trainer or a team.
- Gives one in four a secret.
- Writes it all through the text grammar (`src/60-grammar.js`), so lines vary and are only used when true.

## Step 4: an original world

A new default world with hand-written stars and generated depth.

- 4 to 6 companies with clear identities drawn from the nine company models.
- 30 to 40 hand-written characters at the top: full backstories, ties between them, a history from a few years before the game starts.
- The rest generated (step 3), then checked by hand.
- Original names, places and events throughout (rule 3).
- Built in `universes/<name>/` like the parody world, packed and checked by a tool.

## Step 5: the World Editor's history tools

So anyone can write a world with full histories, including a real-world one for their own use.

- A backstory page for each character: every field in step 1, with the trait list and the generator's suggestion one press away.
- A history builder: add reigns, famous matches, feuds, moments and relationships on a timeline with dates.
- Import and export of a character or a whole roster as JSON.
- The engine turns that history into relationships and memories when a game starts, as `src/86-history.js` does today.

### Real-world characters made by players

- The game ships no real people. The editor is a tool; what a player builds is theirs.
- A shared world shows a line when it loads: "This world was made by a player. It is not part of the game."
- If worlds are shared through Steam Workshop later, take-down rules and a report button come with it.
- The exact wording and the Workshop rules go past Ryan's lawyer first.

## What happens to the parody world

Three options, Ryan's call:

1. **Keep it as an optional world** on the title screen, as it is now, but not the default.
2. **Move it out as a separate download** (a world package), so it is not part of the shipped game.
3. **Retire it.**

Option 2 keeps the work and takes the parody out of what is sold. The lawyer should weigh in.

## Tests

- `test-characters.js`: every worker in every world gets a full backstory; generated ones are the same on the same seed; old worlds and saves load; 60 weeks with errs 0 and NaN 0.
- Sifting, requests and the writers' room each produce at least one storyline from a want or a tie in a 60-week run.
- The editor's history builder: build a world with history from nothing, play it, check the relationships and memories it made.
- `test-wording.js` covers generated backstories.

## The order

1. The backstory block and traits, shown in the wrestler's file.
2. Sifting, requests and the writers' room read them.
3. The generator.
4. The original world.
5. The World Editor's backstory page and history builder.
6. Ryan picks the default world and what happens to the parody world.

## Decisions for Ryan

1. Make an original world the default: yes or no?
2. The parody world: keep, separate download, or retire?
3. The ten traits: add, cut or rename any?
4. How many hand-written stars in the original world (30 to 40 suggested)?
5. The wording for player-made worlds, and Workshop rules, for the lawyer.
