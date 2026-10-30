# TEW IX deep dive — Volume 5: settings, data, and the machinery underneath

Handbook chapters 35–42, plus the systems that only exist as configuration. `[hb §]`.

## The settings matrix

Three scopes, and they are genuinely different storage:

| Scope | Where | Who changes it | Affects |
|---|---|---|---|
| **World options** (§35) | database | database maker | every player's simulation |
| **User preferences** (§36) | save | the player | only that player's experience |
| **Company settings** | in-game | the player as booker | one company |

The handbook is explicit that preferences are "a subset of Options" that "only impact their
own gameplay experience, not the game world as a whole" `[hb 36]`.

### World options with mechanical weight

| Option | Effect where documented |
|---|---|
| **PPV Rating Unit** | divisor for buyrate; default **500,000** (1,050,000 viewers ÷ 500,000 = 2.1) `[hb 35.11]` |
| **TV Rating Unit** | divisor for TV rating; default **750,000** `[hb 35.12]` |
| **Natural Growth Limits** | per-region popularity ceilings; full = home min **55**, foreign min **35**; weak adds **+20**; off disables `[hb 35.23]` |
| **Strict Boom And Bust** | forces strict cyclical economy/industry instead of random reversals `[hb 34.2]` |
| **Strict Storylines** | enforces storyline participation rules more tightly `[hb 35.17]` |
| **Chemistry Effects** | toggles whether chemistry applies at all `[hb 35.22]` |
| **Auto Fix Imbalances** | repairs broken database states at load |
| **Injury / Randomness / Death Frequency** | independent dials — the game's real difficulty control |
| **Oversaturation** | penalty for too much product in a region |
| **Create MDB File** | exports a database from a running game |

### User preferences — system flags

These read as a feature list because that is what they are: **momentum, morale, locker-room
morale, gimmick effects, crowd burn-out, crowd management, industry/economy, scouting, owner
goals, match ratios, production effects, lifestyle effects, booking times, CE requirements,
pre-booking, overuse penalties/warnings, road agent tips, left-off-show complaints,
disposition change timings, main-event header mode, book main event first** and more.
`[hb 36]`

Where documented, the numeric consequences are:

- **Repetitive Booking Penalty**: same match-up **>3 times in 6 months** in a region is
  penalised unless it beats prior encounters (1v1, 2v2, 3-way, 4-way singles). `[hb 36.3]`
- **CE Requirements Per Show**: 20 CE per hour of show; disabling removes the check. `[hb 36.31]`
- **Match Ratios**: enforcing the product's match/angle ratio; off allows pure fantasy
  booking. `[hb 36.13]`

### Eras — percentage dials

Era settings are mostly **percentages with 100% as the default**: Attendance, Merchandise,
Sponsorship, Wage demands, and so on — "changing Attendance to 1% means a company that would
draw 1,000 gets 10". `[hb 37.2]`

Per-area settings and **product trends** sit on top. **Sexuality** settings are *probabilities*
applied in order: `10% gay` then `10% bisexual`, else heterosexual. `[hb 37.3]`

Eras also carry the **extra spillover** variant (Super/Ultra) described in Volume 4.

## Narratives (configuration, not code)

Trigger range · **daily** percentage chance · requirements · effects with **strength 1–10** ·
single use · importance · presentation. Popularity effects pay **5 points per strength level**
(5 → +25). `[hb 38]`

## Databases and saves

| Item | Rule |
|---|---|
| Database file | always `TEW9.mdb` |
| Save file | `TEW9Save.mdb` |
| Save location | `…\Grey Dog Software\TEW9\Databases\<Database>\SaveGames\<Save>` |
| Multiplayer | zip the save folder and send it; the next player drops it in place `[hb 39.9]` |
| Unknown date sentinel | **01 January 1666** means "unknown / not filled in" `[hb 40.4]` |
| Item limit | no hard cap, but **>32,000** items in a section breaks the lists `[hb 40.7]` |
| Picture limit | **>32,000** files in a folder greys out assignment (OS limit) `[hb 40.14]` |
| Intro splash | **1000×500** images `[hb 39.10]` |
| Money ceiling | **±$999,999,999**, silently capped `[hb 41.12]` |

### Start variance

Per-stat randomisation applied when a database starts: **Minor ±1**, **Medium ±5**,
**Major ±9**, **Extreme ±15**. `[hb 40.8]`

### TEW 2020 conversion

The converter "best guesses" or defaults new-IX-only fields:

- **Relationships**: TEW2020 only had "blood relatives"; the converter infers **parent vs
  sibling from the age gap** (≥25 years ⇒ parent/child).
- Dates get ballpark estimates because the calendar models differ.
- New features are left at defaults or inactive — converted databases are playable but need
  hand-tuning. `[hb 40.6]`

## The external editor's matching rule

These tables **match on Record Name** and create a new record when nothing matches `[hb 40.2]`:

Alliance Members · Alter Egos · Broadcaster Changes · Broadcasting Deals · Chemistry ·
Commentary Experience · Excursions · Halls Of Fame · Hall Of Immortals · Injury Histories ·
Mask & Hair Histories · Match Types · On This Days · Picture Changes · Power 500s · Scandals ·
Starting Absences · Starting Injuries · Starting Morale · Tag Teams · Title Lineage ·
Venues & Locations

That is the whole referential-integrity strategy: names are keys, and misses become inserts.
It is why the reference document lists legal values instead of foreign keys.

## Prestige and legacy systems

- **Power 500**: score = average of the **ten best match ratings** in the previous 12 months;
  needs **10 matches** to qualify; **house shows excluded**; ranked descending; workers who
  died in the period get a small sentimentality boost; the list is only published if
  **>75 workers** qualify. Cosmetic only. `[hb 41.10]`
- **Hall of Immortals** (high bar) vs a company **Hall of Fame** (lower bar, includes
  successful midcarders). `[hb 8.34, 41.9]`
- **Top 100s** are informational, computed from in-game stats. `[hb 8.24]`

## Editing surfaces

| Surface | Use |
|---|---|
| Main editor | full database authoring, TEW2020 conversion button |
| External editor | table export/import against the reference document |
| In-game editor | live corrections during a game |
| Sandbox editor | option that allows free editing mid-game `[hb 35.31]` |

Editing rules worth copying for a rebuild: **soft vs hard closes** for companies (a soft close
keeps history visible, a hard close removes it), **ageing/de-ageing** whole rosters with care
about debut dates, **importing** records between databases, **logos vs backdrops** as separate
asset classes. `[hb 40.11–40.15]`

## What the configuration layer reveals about the design

1. **Difficulty is a set of independent frequencies**, not one multiplier — injury, randomness
   and death are separate dials. Players build their own curve.
2. **Eras are percentage dials over the economy**, which is how one codebase simulates 1980 and
   2020 without branches.
3. **Narratives are the modding contract**: data-only triggers with requirements and graded
   effects.
4. **Every heavy system has an off switch** in preferences, which is how a 20-year-old sim stays
   playable for people who want only part of it.
5. **Names are the schema.** The external editor resolves references by record name, which is
   why the vendor documents legal values rather than foreign keys.

## Coverage note

These five volumes synthesise all 42 handbook chapters plus the shipped external-editor
reference and binary evidence. The handbook deliberately withholds some internals ("potentially
over a hundred" rating factors, hidden counters, hidden destiny) — those gaps are marked as
such rather than guessed. Where a number is quoted above, it is quoted from the handbook.
