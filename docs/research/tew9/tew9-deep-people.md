# TEW IX deep dive — Volume 2: people, skills, relationships, contracts

Handbook chapters 19–23. `[hb §]` throughout.

## Ages and the life cycle

Five calculated ages per worker: **maturity, decline, relevancy, retirement, death** —
pre-rolled from settings plus a hidden destiny value, but adjustable in play (a successful
worker with a big contract may retire later). `[hb 19.5]`

- Minimum worker age **5**; recommended **16–18** or skill learning runs too long. `[hb 19.5]`
- **Time Decline is cap-decline, not skill decline** (IX change): stats keep rising while
  caps fall, so decline is invisible until output drops. `[hb 8.5]`
- February 29 birthdays are treated as Feb 28 in non-leap years. `[hb 19.5]`

## Health

Four health levels. `[hb 19.7]`

| Level | Effect |
|---|---|
| ≥80% | healthy, no side effect |
| <80% / <65% / <55% / <40% / <20% | progressively noticeable performance penalties |
| 0% | immediate retirement through injury |

Penalties **stack** across levels, so low Head *and* Body is worse than either alone.

## Skill model

30 skills, displayed 0–100 whole numbers but **stored with decimals** (51.7 shows as 51 —
always rounded down). `[hb 20.1]`

### Learning rules `[hb 20.2]`

- Learn faster working with people **1+ point better** (matches) or **5+ points better**
  (angles).
- Matches must be **≥5 minutes** to trigger learning; in-ring learning is faster at
  **≥10 minutes**.
- Angles require the worker to be on-screen **≥3 minutes**.

### Caps

Caps come from age, style, height/weight and initial roll; decline lowers caps, not values.
`[hb 20.3]`

### Individual skill thresholds that matter

| Skill | Threshold | Effect |
|---|---|---|
| **Basics** | ≤40 | penalised for not being grounded; no benefit above 40 |
| **Selling** | ≤40 / ≥75 | penalty / bonus |
| **Psychology** | ≤60 penalty, >74 bonus; absolute | 60-minute match needs **85** |
| **Consistency** | probabilistic | even 99.9 can have an off night; only **100** is immune |
| **Stamina** | scales with length | 40 = minor at 7–10 min, severe at 35–50 |
| **Resilience** | never immune | even 100 can be injured |
| **Experience** | ≤20 | green penalty; high Exp reduces booking-issue penalties and covers botches |
| **Charisma** | ≥66 | mild in-ring boost |
| **Star Quality** | ≥66 | small match boost; hiring, contracts, incidents |
| **Play By Play** | ≤15 / ≥20 below; ≥80 immune | contextual to match rating |
| **Colour** | same banding | may substitute 70% of Microphone |

`[hb 20.4–20.30]`

**Experience** is unique: cannot go down and is **uncapped** — everyone reaches 100
eventually. Rough rate: **+0.3 per 2–3 matches** early, then **+0.2 per 3–5**. `[hb 20.11]`

**Respect** is inverse-curved: everyone reaches **50** from working; beyond that it tracks
popularity and match ratings, and a **75+ rated match** helps. Non-wrestlers track their
skill **+15** (a 75 referee trends to ~90 Respect). `[hb 20.12]`

**Reputation** starts at **50** for new workers and drifts monthly. `[hb 20.13]`

### Scouting

Six categories (in ring, physical, entertainment, performance, broadcasting, refereeing)
set the **width of the reported range** — e.g. "30–70" means unknown inside that band.
`[hb 20.32]`

## Business skills (owners and bookers)

**Booking skill** gates AI behaviour in explicit tiers `[hb 21.12–21.13]`:

| Booking skill | AI capability |
|---|---|
| < 65 | no special pushes or de-pushes at all |
| < 75 | cannot de-push ageing workers |
| < 85 | cannot give big or mega pushes |
| 0 | never applies for or takes a booking job |

Booking skill rises through the 30s and early 40s and declines after **50**, never below 1.
`[hb 21.13]`

## Relationships — the four-axis model

Each pair carries **Family, Personal, Romantic, Mentor/Protege**, and the whole works as the
**sum of its parts** — a pair can be family and hostile. Family is the weakest element: a bad
personal or romantic reading overrides it, but family alone tilts positive. `[hb 22.1]`

| Axis | Values |
|---|---|
| Family | None, Parent, Sibling, Cousin, Grandparent, Aunt/Uncle, Distant Relative |
| Personal | None, Mutual Respect, Friendship, Deep Friendship, Like Family, Strong Dislike, Open Hostility, Hatred, Mutual Loathing |
| Romantic | None, Married, Engaged, Dating, Divorced, Broken Up, Permanent Split |

**Shifting** `[hb 22.7]`: each relationship holds **hidden counters**. An argument adjusts a
counter, not a level; several adjustments are needed to move a tier, and stronger
interactions shift further. That is why a single incident rarely re-tiers a relationship.

**Reporting** `[hb 22.8]`: only significant changes reach the News feed — a deliberate cap on
data churn. Minor changes appear only in the internet section or a direct message.

Other modifiers: **seniority**, **mentor/protege** (mentor ≈ a Friendship plus skill tips;
mentors can take multiple proteges, proteges almost never take multiple mentors), and
**isolation** through relationships. `[hb 22.5–22.9]`

**Chemistry** is generated per save from a hidden Destiny value; editor presets override
it; it never changes over time — but **tag teams with ≥40 Tag Experience ignore teamwork
chemistry penalties**. `[hb 19.29, 26.3]`

## Contracts

### Types `[hb 23.1]`

| | Written | Handshake |
|---|---|---|
| Pay locked against popularity rise | yes | no |
| Worker can walk | only after notice | can leave |
| Release compensation | yes | no |
| Renegotiation window | **final 30 days** | ongoing allowed |
| AI offers when | > Medium size, or Medium with prestige >70 / >$10M / Flashy owner | otherwise |

**Ongoing** handshake deals have no expiry; ending one starts a standard **30-day notice**.

### Wages

- Skill and figurehead status can raise demands **up to +10%**; unused workers' demands decay.
  `[hb 23.5]`
- A worker values themselves at **no less than 80%** of their current wage of that type — so
  per-show demands can exceed a monthly figure in extreme cases. `[hb 23.5]`
- **Per-show pay is flat** regardless of workload — one promo costs the same as three
  matches. Exception: **Tour shows pay 25%**. `[hb 23.6, 24.15]`
- **Multiple shows in one night**: first show full, second **−25%**, third **−50%**, any
  further **−75%**. `[hb 23.6]`

### Downside agreements

A monthly floor: if earnings fall short, the company makes up the difference; if exceeded,
nothing extra. Expectations scale with size — **Big ≈ 5 shows/month, Huge ≈ 6, Titanic ≈ 7**;
workers on ≤$100/show or below Big rarely expect one; special attractions and nostalgia acts
usually waive it. `[hb 23.9]`

### Release, notice, compensation

- Notice is **always 30 days**, or the remaining term if shorter. `[hb 23.11]`
- Release compensation for monthly pay is **six months'** pay, or the remaining term if
  shorter. `[hb 23.12]`

### Travel

| Journey | Cost |
|---|---|
| Between game areas | **$200** |
| USA–Mexico, USA–Canada, Britain–Europe | **$100** |
| Long distance within an area | **$50** |
| Short distance within an area | **$20** |

"Long distance" ≈ outside the worker's base-region spillover. `[hb 23.13]`

### Limited appearances

**1–25** appearances; each physical appearance consumes one; video-only does not count.
Monthly-paid limited deals carry a **minimum 30 days** of pay so you cannot hire a big name
for one appearance and discard them. `[hb 23.14]`

### Intended roles (10)

Normal · Icon · Special Attraction · Gatekeeper · Passing The Torch · Future Main Eventer ·
Backbone · Blue Chipper · Nostalgia Act · Developing. `[hb 23.16–23.28]`

Each changes how the AI books and how the worker reacts to wins/losses.

### Clauses

Creative control · hiring veto · wage matching · merchandise cut · shows control · bonus
type/amount · stored templates. `[hb 23.29–23.36]`

## Young lions

Any active wrestler with **<25 Experience** who debuted **<3 years ago**. A young lion beating
a non-young-lion in a company running the system **upsets the fans**; in companies without
the system it is irrelevant. `[hb 16.39, 19.27]`

## Legacies and masks

- **Mask respect** 1–100 decides willingness to lose the mask and its cost. It rises with
  matches, always reaching **70**, and only passes 70 through significant wins or high-rated
  matches. `[hb 19.28]`
- **Legacy**: checked once a year between ages **35–50**; requires average popularity **≥55**
  in one area and active status; one successor per career; needs `Regeneration = Yes As A
  Legacy`. `[hb 19.30]`

## Minimum popularity floor

Each worker has an invisible per-region **minimum popularity**, updated to about **70% of the
highest popularity ever achieved there** — so fame never collapses to zero. `[hb 19.17]`
