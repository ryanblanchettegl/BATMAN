# TEW IX — the loop and how systems couple

Sources: `[hb]` TEW IX Player's Handbook (42 chapters, 707 sections, shipped in the
community repo as `output/handbook.docx`); `[doc]` Grey Dog external-editor reference;
`[bin]` strings from `TEW9.exe`. Mechanics quoted from `[hb]` are the vendor's own
descriptions.

## The unit of play

TEW has no win condition — it is a sandbox in which you advance **days**, and days
contain **shows**. `[hb 5.1]`

```
day advance ──► pre-show ──► booking ──► running ──► post-show ──► day advance
   (AI world)    (venue,      (order,     (segment     (injuries,
                  broadcast,   agents,     ratings)     finances,
                  incidents,   finishes)                popularity,
                  CE meeting)                            media scrum)
```

Everything below is a consumer or producer inside that pipe. The design principle is
that **nothing resolves instantly**: a decision made at booking time surfaces as
rating, then popularity, then money, then morale, often over several weeks.

## The two currencies

- **Popularity** — per worker *per region*, and per company *per region*. This is the
  real scoreboard: it gates contracts, show size, broadcaster interest and growth.
- **Money** — company cash, worker wages, gate, merchandise, broadcast revenue.

## The two hidden rails

**Momentum** is per worker *per company* and drives Perception, popularity-growth
eligibility, and morale. `[hb 7.5]` It is explicitly **two layered systems**: a visible
long-term value and an invisible short-term value. Wins, strong performances and
successful angles raise it; losses, poor performances and reverses lower it.

**Perception** is computed **at the start of every show** for every rostered worker —
never for someone the audience has not seen yet. `[hb 7.4]` It is the worker's *standing
in the fans' eyes*, derived from popularity in the home region plus other factors, and
it is what other workers consult in their own decisions ("who will I agree to lose
to?", "how often can I be left off a show?").

That chain — `booking → momentum → perception → who will cooperate → morale` — is the
core feedback loop of the whole game.

## Ratings: the central formula

`[hb 11.1]` A segment's rating has "potentially over a hundred" inputs, but the base is
**two** values:

```
segment base  ≈  f( popularity of each participant in the show's region,
                   performance of each participant )   # in-ring skills for matches,
                                                       #  mic/acting/charisma for angles
```

Everything else (road agent, chemistry, gimmick bonuses, crowd state, match prestige,
intensity, fatigue) is a modifier on that base.

`[hb 11.8]` The show's **final rating** is not an average of segments:

```
show rating = (overall match rating × match share) + (overall angle rating × angle share)
```

with the shares set by the minutes booked, so a 60-minute show with 6 minutes of angles
is 90/10. A pure-match show is 100% matches. Match Focus and Angle Focus in the product
determine how the two aggregates are themselves calculated.

## Popularity growth: the ±6 rule

`[hb 11.9]` Company popularity in a region compares the **final show rating against
current popularity in that region**:

- rating **≥ popularity + 6** → gain (bigger gap, bigger gain)
- rating **≥ popularity + 1..5** → slight gain
- parity → stable
- below → decline

Modifiers: viewers, ticket price (cheap/free boosts gains), whether the product is
*trending*, and the current **industry** level. Audience boredom or a recent size drop
**blocks** positive growth.

`[hb 11.5]` Worker popularity growth is gated by **company size** — a company drawing
100 people cannot make anyone a national star. Inputs: segment ratings, booking
(win/loss, context, match type), show level, viewers, momentum, company size.

## Relationships → morale → backstage

`[hb 22.1]` Each relationship is **four elements**: Family, Personal, Romantic,
Mentor/Protege, and "functions as the sum of its parts" — a pair can be
family *and* hostile. Family is the weakest; a bad personal or romantic element
overrides family warmth, but family alone tilts the pair positive.

`[hb 22.7]` Relationship change is **not** instantaneous. Each relationship carries
hidden counters; an argument nudges a counter, and several nudges are needed to move a
Personal level. Stronger interactions move counters further. This is why the player
rarely sees one incident re-tier a relationship.

`[hb 7.8]` Morale is an **incident ledger**, not a number that drifts: each active
incident is positive or negative with a hidden duration that decays in power until it
vanishes, and severe negatives outweigh several minor positives. The same incident can
land differently on two workers.

`[hb 16.9]` Locker-room morale aggregates three sections — **notable personalities,
relationships, other factors**. Relationship contributions are **capped at ±25%**; the
other two are uncapped. Workers with higher Perception move the room more.

So: `relationships → locker room % → incidents → individual morale → performance`.

## Creative economy

`[hb 7.14]` **Creative Energy (CE)** is generated at booking meetings, capped at 250,
and spent on Creative Ideas (which modify booking). Shows can have **CE requirements**
(a User Preference), so the resource is also a gate.

## Time scales that matter

| Layer | Cadence | Example systems |
|---|---|---|
| Segment | per match/angle | rating, feedback, crowd state |
| Show | per event/TV | final rating, injuries, finances |
| Week | between shows | morale decay, relationship counter drift |
| Month/Year | calendar | contracts, title reigns, owner goals, awards |
| Era | years | economy/industry curves, product trends |
| Narrative | any date window | scripted world events |

`[hb 37.1]` **Eras** are date-bounded presets; only one is active at a time; outside any
era the game uses built-in defaults. `[hb 38.1]` **Narratives** are database-authored
triggers with a date range, display, requirements and effects.

## Coupling diagram (reads → writes)

```
Product ──► what ratings mean ──► show rating ──► company popularity ──► size ──► budgets
   │                                    ▲                                        │
   ▼                                    │                                        ▼
Match/Angle focus              segment ratings ◄── worker popularity ◄── popularity growth
                                        ▲                    ▲
                              momentum ─┘                    │
                                 │                     company size cap
                                 ▼
                            perception ──► cooperation, morale sensitivity
                                 │
Relationships ──► locker room % ──► incidents ──► morale ──► performance ──► ratings
```

Every arrow is a real dependency in the handbook. When rebuilding from scratch, this
ordering is also a safe implementation order: ratings first, popularity second,
momentum/perception third, relationships and morale fourth, economy last.

## Deliberate opacity

The handbook repeatedly withholds exact numbers — "potentially over a hundred"
factors, "hidden" durations, "hidden counters". `[hb 7.5, 7.8, 22.7]` This is a design
choice: the systems are legible in *direction* and opaque in *magnitude*, so the player
reasons qualitatively. A from-scratch remake that exposes every constant will feel
different even if the maths matches.
