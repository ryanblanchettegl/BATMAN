# TEW IX deep dive — Volume 4: world objects, media, scheduling

Handbook chapters 24–34. `[hb §]` throughout.

## Events and dates

**Positioning** options: exact day number (monthly) or day+month (annual), nth weekday of the
month, plus a **Positioning Shift** in days. Example: *Fourth Thursday of the month + 1 day*
= Black Friday. `[hb 24.7]`

Known traps:

- **Exact Same Date on Feb 29** → the event runs once every four years.
- **Day 31 to a 30-day month** clamps to the 30th and **never returns** to the 31st — over
  years events drift to the 28th.
- Shifting across a year boundary can **skip a year**, because annual events add 1 to the year
  first, then apply positioning. `[hb 24.7]`

**Postfixes**: none · Year ("Winter Slam 2020") · Short Year ("Winter Slam '20") · Numbered
(auto-increments after each running). `[hb 24.4]`

**Multi-day series**: matching `Multi Day Event` text on **successive days** groups events.
Any number can join, locations may differ, but all must belong to one company. Effects
`[hb 24.10]`:

1. The series counts as **one event** for the "left off shows" counter.
2. Counts as **one** for PPV-overuse calculations.
3. Later events are compared to earlier ones; a **quality dip annoys the crowd**.

**Importance** rises through held shows and high ratings. From Above Average upward, only
**Normal-intent** shows with sufficient ratings advance it: **Highly Regarded 75**,
**Historic 85**, **Legendary 90** (slightly lower for season finales). Weekly and monthly
shows cap at **Normal**. `[hb 24.13]`

**Event intent** changes everything `[hb 24.12]`:

| Intent | Behaviour |
|---|---|
| Normal | standard; can raise importance |
| Lesser | widened popularity targets, hard to gain/lose |
| Tour | not broadcast, tiny attendance, **25% pay**, lenient fans, no importance change |
| Throwaway | charity/tribute shows; almost no popularity movement |

**PPV overuse**: buyrates look at how many PPVs ran in the **last 31 days**; the closer
together, the bigger the penalty (two "monthly" PPVs within **14 days** is severe).
`[hb 24.3]`

**Attendance caps by importance**: a Normal card struggles past a *base* of 20,000 regardless
of popularity; small attendances unaffected. `[hb 24.12]`

## Television

- 'A' vs 'B' shows; B shows are exempt from pre-booking expectations. `[hb 25.1]`
- **Held on** vs **shown on** defines live vs taped. Taped shows always lose viewers, and the
  loss is **larger in later eras** (social media spreads results); pre-Internet eras barely
  lose any. The only taping benefit is dodging a clashing broadcast. `[hb 25.3, 32.24]`
- TV numbering, prestige, avoiding dates, fixed locations, show priority. `[hb 25.4–25.9]`
- **Counter-programming**: same night, same timeslot, and **≥100,000 more viewers** in a
  region to hurt a rival; the bigger the gap, the bigger the effect. `[hb 32.29]`

## Tag teams

- **Tag Experience** measures time teamed; from **40** upward the pair **ignores teamwork
  chemistry penalties**. `[hb 26.3]`
- Team types, tag finishers, company-specific teams, and tag relationships. `[hb 26.1–26.5]`

## Stables

- Up to **18 members**, each with a defined role; the role determines how that worker's
  **Perception and Momentum** feed the stable's strength. `[hb 27.6–27.8]`
- Five types: Faction · Brotherhood · Cult · Gang · Alliance. `[hb 27.1–27.5]`

## Titles

**Booking frequency** (chance an attempt is made) `[hb 28.8]`:

| Context | Not Often | Normal | Often |
|---|---|---|---|
| Events | 1 in 6 | 50% | 5 in 6 |
| TV | 1 in 8 | 1 in 4.5 | 1 in 3.5 |
| Tours | 1 in 10 | 1 in 7 | 1 in 4 |

Season finales almost always use major belts regardless of frequency. If the champion is
unavailable the attempt simply fails, and flukes happen.

**Age rules**: 'Youngsters' = **≤30**, 'Veterans' = **≥32**. `[hb 28.5]`

Other title systems: owned-by vs original owner, alliance titles, limits, level, prestige,
fixed area, function, achievements, annual competitions, AI reign lengths, lineages.
`[hb 28.1–28.12]`

**AI reign lengths by era**: before **1991**, average AI title reigns are **+25%** longer;
before **1980**, **+70%**. `[hb 34.19]`

## Alliances

- Membership is gated by eligibility criteria; a company that becomes ineligible need not
  leave, but AI companies usually do. `[hb 33.1]`
- **Alliance titles belong to the alliance**, not a company; members can borrow a title for
  one night, and the champion travels with it. `[hb 33.2]`
- **Loans**: unlimited in IX — no cap on repeats, source companies or total loans per member.
  Each loan costs an **admin fee of 25% of the worker's per-show pay, minimum $20, rounded up
  to the nearest ten**. `[hb 33.3]`
- Types: public · consortium · bordered · territorial · protective · trading. `[hb 33.4–33.9]`

## Training facilities

| Type | Notes |
|---|---|
| Dojo | company-owned |
| School | can affiliate with a company: company pays **25% of running costs** and gets **first refusal** on graduates |
| Performance Centre | "super dojo": higher chance of ex-athletes (football, MMA), can produce **non-wrestlers**, and hosts workers sent to sharpen skills |

- **Facility level** sets size and output: **2–12 graduates per year**; for Performance Centres
  it also sets how many workers can attend at once. `[hb 31.4–31.5]`
- **Training level** (not owner skill) sets graduate quality, and it is probabilistic — 100%
  means better odds, not guarantees. `[hb 31.4]`
- Closed facilities produce nothing; preset graduations are ignored (the worker still
  appears). `[hb 31.11]`
- The AI will not build Performance Centres **before 2015**. `[hb 31.13]`

## Broadcasting — the viewership formula

```
draw%  = company popularity in region        (e.g. 50 → 50%)
         modified by show rating, PPV/TV trends, show importance,
         timeslot, intent, over-use penalties
         then ±5% random variance
viewers = ideal_viewership(coverage) × draw%
```

`[hb 32.11]`

**Ideal viewership by coverage** `[hb 32.11]`:

| Coverage | Ideal viewers |
|---|---|
| Tiny | 10,000 |
| Very Small | 50,000 |
| Small | 100,000 |
| Medium | 200,000 |
| Big | 350,000 |
| Very Big | 500,000 |
| Huge | 750,000 |
| Enormous | 1,000,000 |

Worked example: Enormous coverage + a huge potential fan base + 50 popularity with no other
modifiers ≈ **500,000 viewers**.

**Industry modifier**: industry below **50%** reduces viewership (worse as it falls), above
**80%** adds.

**Owned broadcasters** use per-region break-even popularity: Tiny 30 · Very Small 40 ·
Small 50 · Medium 60 · Big 65 · Very Big 70 · Huge 75 · Enormous 80. Above break-even is
profit, below is loss; subscription outlets also earn on subscriber numbers tied to
popularity. `[hb 32.2]`

**Pre-1985**: the AI never seeks event broadcast deals (simulating pre-PPV); TV deals still
happen. `[hb 34.14]`

## The game world

- **Economy** and **Wrestling Industry** are each 0–100 per area, always rising or falling,
  shown only as text. With **Strict Boom And Bust** they cycle strictly; otherwise direction
  can reverse at predefined points at random. `[hb 34.2–34.3]`
- **Potential fan base** is a percentage applied to attendance *and* viewership: a show that
  would draw 50,000 in a 50% region draws 25,000. `[hb 34.6]`
- **Spillover**: popularity bleeds between adjacent regions — New England's 40% spill into Tri
  State means 10 popularity there implies **4** minimum. `[hb 34.8]`
- **Extra spillover** (set by era; Ultra by default when no era is active) applies only to
  workers averaging **≥60** popularity in an area. Ultra: cumulative **+5%** at 60/65/70 and
  **+15%** at 75/80/85/90 — **+75%** at 90. Super: same ladder with **2%** and **5%**.
  `[hb 34.8]`
- **Regional battles**: winning raises that region's attendance **5%** for a month; second no
  change; last **−10%**; any other position **−5%**. `[hb 34.10]`
- **Area battles** combine ratings; on "Combined" a company's score is **50% best show + 50%
  stars**. `[hb 35.8, 34.11]`
- **Venue costs** (non-generic) by capacity tier: 10,000+ → **$20,000 rising in $20,000 steps
  per 10,000** up to $160,000; 1,000+ → **$1,000 in $2,000 steps per 1,000** up to $17,000;
  below 1,000 → **$900 at 900, down to $200 minimum**. Owning a venue cuts hire cost **40%**.
  `[hb 34.1, 34.5]`
- **Geo tags**: up to 5 per venue, 30 chars each, to place it inside sub-divisions.
  `[hb 34.1, 34.4]`
- **Era-driven presentation**: website skins change by period (newsletter pre-1984, magazine
  1984–96, 90s internet 1997–2004, modern 2005+); web sites aren't named before **1997**;
  "social media" isn't mentioned before **2015**. `[hb 34.13–34.14]`
- **Holidays** exist per area (US, Canada, Mexico, Australia, India) for scheduling logic.

## Narratives

A narrative is **data**, not code `[hb 38]`:

- **Trigger date range** + **chance of happening as a percentage applied every day** of that
  range (1% across a year ≈ near-certain).
- **Requirements** must be valid when it fires.
- **Effects** each have an optional **strength 1–10**; e.g. a Popularity Boost gives **5
  points per level** (strength 5 = +25 popularity). Strength ~5 is "significant but not
  overpowered".
- **Single use**, **importance**, and **presentation** (how it reads on the main screen).

## Eras

Eras are date-bounded presets with three layers: **universal settings**, **per-area
settings**, and **product trends**; exactly one era active at a time, built-in defaults
otherwise. `[hb 37]`

## Implementation notes

1. **Date arithmetic is a real subsystem** — clamping, leap years and year shifts produce
   silent schedule drift.
2. **Multi-day series are a first-class concept** touching complaints, PPV overuse and crowd
   mood.
3. **Viewership is multiplicative**, not additive: `coverage × draw%`.
4. **Alliances are free talent at a 25% fee**, not a negotiation.
5. **Narratives are the modding backbone** — trigger, requirement, effect, strength, display.
