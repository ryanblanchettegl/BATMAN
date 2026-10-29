# TEW IX: the worker model, in full

`Workers` is 138 columns, and it is the least denormalised table in the game — every skill is
its own column. Recovered from `TEW9Access.mdb` `[db]`.

## Anatomy of the 138

| Block | Columns |
|---|---|
| Identity | 9 — `Name`, `Short_Name`, `Picture`, `Biography`, `Organic_Biography`, `Is_An_Avatar`, `Birthday`, `Debut_Date`, `Death_Date` |
| Demographics and state | 17 — `Gender_ID`, `Sexuality`, `Body_Type`, `Height`, `Weight`, `Minimum_Weight`, `Maximum_Weight`, `Nationality`, `Based_In`, `Race`, `Left_The_Business`, `Deceased`, `Retired_Wrestler`, `Non_Wrestler`, `Celebrity`, `Style`, `Freelance` |
| Work regions | 8 booleans — `Active_In_USA` … `Active_In_India` |
| Roles | 8 booleans — Wrestler, Occasional Wrestler, Referee, Announcer, Colour, Manager, Personality, Road Agent |
| Gimmicks | 4 — `Face_Gimmick`, `Face_Gimmick_Basis`, `Heel_Gimmick`, `Heel_Gimmick_Basis` |
| Health | 4 — `Head_Condition`, `Body_Condition`, `Arms_Condition`, `Legs_Condition` |
| Skills | **28** Int16 |
| Popularity | **57** Int16 — one per region, identical list to `Companies` |
| Business | 3 — `Business_Reputation`, `Booking_Reputation`, `Booking_Skill` |

## The 28 skills, exactly

**In-ring (6)** Brawling · Puroresu · Hardcore · Technical · Aerial · Flashiness
**Performance (5)** Psychology · Experience · Respect · Reputation · Charisma
**Entertainment (4)** Microphone · Acting · Star_Quality · Sex_Appeal · Menace *(5 with Menace)*
**Basics (5)** Basics · Selling · Consistency · Safety · Stamina
**Physical (4)** Athleticism · Power · Toughness · Resilience
**Broadcast (3)** Play_By_Play · Colour · Refereeing

Count them: 28.

**The handbook lists 30** — `Scouting` and `Potential` are documented as skills but exist in
neither the database nor the save schema. Neither does `Destiny`, which the handbook says
drives natural chemistry and regeneration. So three documented concepts are **not stored
anywhere I can read**: they are either generated at runtime from seed data, or they live in
`TEW9Settings.mdb`, which is the one file still locked.

That is the single remaining reason to care about that file, and it is a small one: scouting
only widens the *reported* range of a skill, and potential only caps growth.

## Health is four independent pools

```
Head_Condition, Body_Condition, Arms_Condition, Legs_Condition   (Int16 each)
```

Four, not one. The handbook's "if any of the four health levels reaches 0% it causes immediate
retirement" now has a concrete shape: **head, body, arms, legs** each degrade, each inflicts
its own penalty band, and they stack.

## Popularity is 57 columns, again

Identical region list to `Companies` — the same 57 columns, one per region. So popularity is
a **matrix stored denormalised on both sides**: worker × region and company × region. There is
no `Popularity` table anywhere.

Consequence: adding a region means migrating two 57-column tables. That is the cost of the
design, and it is worth knowing before copying it.

## Gimmicks live on the worker; the *current* gimmick lives on the contract

`Workers` holds **both** a face gimmick and a heel gimmick, each with its basis. `Contracts`
holds the **current** `Gimmick`, `Gimmick_Basis`, `Gimmick_Rating`, `Gimmick_Status`.

So the model is: a worker owns two prepared gimmicks (one per alignment), and each employer
decides which one is live. That is how the same worker can be a cartoon babyface for one
promotion and a grim heel for another.

## What is deliberately *not* on the worker

| Concept | Where it lives instead |
|---|---|
| Attributes / personality | `Attributes` table (save), rows with a `Hidden` flag |
| Morale | computed from `Morale_Effects`, never stored as a value |
| Momentum | `Contracts.Momentum` — per employer, not per person |
| Alignment, brand, division, manager, mask | `Contracts` — per employment |
| Current gimmick | `Contracts` |
| Chemistry | `Chemistry_Preset` / `Chemistry_Discovered` |

The rule the schema enforces: **anything that depends on where you work belongs to the
contract; anything intrinsic belongs to the worker.**

## Contract-side duplication worth noting

Of `Contracts`' 49 columns, these duplicate worker fields: `Name`, `Short_Name`, `Picture`,
`Biography`, plus the role booleans. That is denormalisation for display and for
save-after-release: the history row stays readable even if the worker is deleted.

## Mapping to WrestleCraft

| TEW column | WrestleCraft today |
|---|---|
| 57 popularity columns | `w.ovr` + per-region? — verify |
| 28 skill columns | partial (`w.mic`, style-derived ratings) |
| 4 health pools | `w.cond` single value |
| `Contracts.Momentum` | `w.mom` (−10..10) |
| morale via `Morale_Effects` | scalar `w.morale` + `w.stress` |
| `Attributes` rows | `TRAITS` array (already close) |
| face/heel gimmicks on worker | `gimmick` field? |

Two changes would move WrestleCraft materially closer:

1. **Split health into head/body/arms/legs.** Cheap, and it makes injury consequences specific
   instead of a single `cond` number.
2. **Move alignment/gimmick/momentum onto the contract.** This is the structural correction
   that matters most, and it is the same lesson as the save schema.

## Open threads

- `Scouting`, `Potential`, `Destiny` — not in either readable schema. Only `TEW9Settings.mdb`
  (locked) or runtime generation could explain them.
- The `Attributes` vocabulary itself is data (rows), not schema — reading actual attribute
  strings would need a populated save, which does not exist on this machine yet.
