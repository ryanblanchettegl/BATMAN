# Rebuilding from scratch — implementation order

For a clean-room build that reproduces TEW IX's *behaviour* without reusing its code or
data. Ordered so every phase is playable and testable before the next begins.

## Phase 0 — the clock

Nothing else works until time advances and shows sit on a calendar.

```
day -> week -> month -> year
each day: AI companies act, contracts tick, injuries heal, incidents decay
show: scheduled entities with venue, broadcaster, roster availability
```

Deliverable: advance 10 years with no shows and no crash. Deterministic seed in, same
world out (`test-determinism`).

## Phase 1 — people and popularity

Minimum worker model: `id, name, style, gender, age, popularity{region}, skills{}, morale,
momentum, perception, contract_ref, health`.

Popularity is **per region** — the single most important modelling decision. A scalar
`overness` will not reproduce TEW behaviour (falls in one market, rises in another).

## Phase 2 — shows and the rating formula

```
segment.base   = popularity(region) × w1 + performance(skills) × w2
segment.rating = base + modifiers(agent, chemistry, gimmick, crowd, prestige, intensity)
show.match_rating  = weighted match aggregate (by match focus)
show.angle_rating  = weighted angle aggregate (by angle focus)
show.rating = match_rating × match_minutes_share + angle_rating × angle_minutes_share
```

Then the growth rule:

```
delta = show.rating - company.popularity[region]
if delta >= 6  -> gain, scaled by delta, viewers, ticket price, trend, industry
if -6 < delta < 6 -> stable
if delta <= -6 -> decline
```

This is the minimum viable game: book a show, get a number, watch the company move.

## Phase 3 — momentum and perception

```
momentum: short-term accumulator (invisible) feeding long-term momentum (visible)
perception: recomputed at the START of every show, from popularity + momentum + push
```

Perception must be **frozen at show start** (new signings have none until their first
show), because workers consult it during booking decisions.

## Phase 4 — relationships

Four elements per pair, canonical key `min(a,b)-max(a,b)`:

```js
relationship = {
  a, b,
  family:   REL_FAMILY,     // None..Distant Relative
  personal: REL_PERSONAL,   // None..Mutual Loathing
  romantic: REL_ROMANTIC,   // None..Permanent Split
  mentor:   {mentorId?, protegeIds[]},
  counters: { personal: 0 } // hidden drift accumulator
}
```

Rules that matter:
- elements are **independent** and sum ("functions as the sum of its parts")
- shifts move **counters**, not levels; crossing a threshold re-tiers
- severity of a shift is contextual, not a constant

## Phase 5 — incidents and morale

Morale is a **ledger**, not a scalar:

```js
incident = { id, workerId, source, polarity, severity, duration, remaining }
morale = aggregate(active incidents)   // severe negative outweighs several positives
```

This is the key architectural difference from a naive `morale = 50` field: because
incidents decay, morale recovers over time without any per-tick formula, and the same
event can hit two workers differently.

Locker room:

```
locker% = personalities_section + clamp(relationship_section, -25, +25) + other_section
```
Relationships capped at ±25%; the other two uncapped (hb 16.9).

## Phase 6 — economy

Cash in/out: gate (attendance × ticket price), broadcast deals, merchandise, wages,
production costs. Then the improvement ladders (production values, broadcast quality,
music) as purchasable data rows.

## Phase 7 — the data-driven layers

Only once the simulation is stable:
- **Products** (11 settings) and product-change gating
- **Eras** (date-bounded presets, per-area overrides, product trends)
- **Narratives** (date range, chance, requirements, effects, strength)
- **Options / preferences** split by scope (world / company / player)

## Tick order that avoids feedback bugs

```
1. advance date
2. AI companies plan (read yesterday's state)
3. contracts / injuries / incidents decay
4. narrative triggers for this date
5. if show today: pre-show incidents -> freeze perception -> book -> run segments
6. apply results atomically: ratings -> popularity -> momentum -> morale
7. finance reconciliation
8. write events to history
```

Apply step 6 atomically — partial application is how popularity double-counts.

## Non-obvious traps

1. **Popularity is 2D** (worker × region, company × region). One axis will break
   everything downstream.
2. **Perception is a snapshot**, not a live value.
3. **Morale as ledger** beats morale as number; it gives decay for free.
4. **Relationship drift is counters**, which is what makes it feel organic and stops
   one argument from undoing a friendship.
5. **Show rating is minutes-weighted**, not an average of segment ratings.
6. **Difficulty is frequencies**, not multipliers.
7. **Every major system needs a flag** — the vendor ships 32 of them.
8. **Do not expose constants.** The original hides durations, counters and "over a
   hundred factors"; exposing them changes how the game feels to play.

## Mapping to WrestleCraft

| Phase | WrestleCraft status |
|---|---|
| 0 clock | exists (`src/70-season.js`) |
| 1 popularity | exists — verify it is per-region |
| 2 show rating | exists (segments, ratings) — verify minutes weighting |
| 3 momentum/perception | momentum exists; perception equivalent unclear |
| 4 relationships | single-axis today → add three axes |
| 5 incidents/morale | morale exists (282 refs); verify it is a decaying ledger |
| 6 economy | networks/sponsors exist; ladders absent |
| 7 data layers | editor has 8 tables → extend |

The cheapest high-value work is phases 4 and 7: three relationship axes, and pushing
`stables`/`venues` into the editor.
