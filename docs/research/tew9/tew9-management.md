# TEW IX management systems

Management in TEW is a set of **threshold rows and history ledgers** rather than a
single "management" module. Grouped by what they govern.

## Company structure `[doc]`

- `Companies` — size, home base, popularity per region, product values.
- `Alliances` — multi-company groups. Fields: `Founded`, `Closed`,
  `Maximum_Members` (`'No Limit'` or 3–10), plus multi-value `Types`, `Companies`,
  `Sizes`, `Gender Settings`.
- `Stables` / `Stable_Names` — within-company factions.
- `Training_Facilities` — development pipeline entities.

**Pattern:** an alliance carries the *filter* that decides which companies may join
(`Sizes`, `Companies`, `Gender Settings`), so recruitment is data-driven. `[doc]`

## Contracts and movement `[doc]`

- `Contracts` — the employment edge.
- `Business_Histories` — append-only ledger of business events.
- `Excursions` — temporary out-of-territory work.
- `Free_Pictures`, `Picture_Changers`, `Starting_Absences`.

**Pattern:** current employment is a *derived view* over `Contracts` +
`Business_Histories`; nothing rewrites history in place. `[infer]`

## Morale and backstage `[doc]`

- `Starting_Morale` — morale seeded at world generation, per worker.
- `Scandals` — discrete, public incidents.
- Relationship axes (see `tew9-relationships.md`) provide the private substrate that
  morale and scandals react to. `[infer]`

`Morale` appears 106 times in `TEW9.exe`, far more than any other single concept I
counted, which is consistent with morale being recalculated and displayed constantly
rather than stored once. `[bin]`

## Broadcast economy `[doc]`

Three cooperating tables:

- `Broadcasters` — the outlet (size `None`…`Enormous`, type
  `Terrestrial/Cable/Internet` × `Pay-Per-View/Commercial/Public/Subscription`,
  broad style, wrestling stance, risk level, production/music quality gates).
- `Broadcasting_Deals` — the contract between a company and an outlet
  (`TV_Show`, `Time_Slot` from `On Demand` … `Graveyard`, `Expires` 3 months … 5 years
  or `Random`).
- `Broadcaster_Changes` — **rule rows** that mutate outlet eligibility over time via
  `Minimum_*` thresholds and a per-region reach map.

**Pattern:** the economy is tunable entirely from the editor — no code change needed to
rebalance how hard it is to get a TV deal in Japan versus the Great Lakes. `[doc]`

## Prestige and legacy `[doc]`

`Hall_Of_Immortals`, `Halls_Of_Fame`, `Power_500s`, `Title_Lineages`,
`Mask_Hair_Histories`, `Tribute_Shows`, `On_This_Day`.

These are all **read-only views over history** with the exception of `Tribute_Shows`
(scheduled content) and the name pools. `[infer]`

## Match and rules data `[doc]`

`Match_Types`, `Gimmicks`, `Wrestling_Moves`, `Venues_And_Locations`, `Events`,
`TV_Shows`, `Title_Belts`, `Tag_Teams`.

`Workers.Style` (17 values, including `'Never Wrestles'`) and the
`Minimum_Weight`/`Maximum_Weight` range pair let match legality be computed from
entity fields instead of a hardcoded compatibility table. `[doc]`

## Transferable design principles

1. **Threshold rows over code branches.** Eligibility = data (`Broadcaster_Changes`).
2. **Ledgers over mutation.** History tables never update in place; current state is
   a projection.
3. **Seed what the sim will later derive.** `Starting_Morale` exists so world-gen is
   reproducible before any tick has run.
4. **Separate public consequence from private state.** Scandals are entities;
   relationships are edges; morale is a value. All three interact but none subsumes
   another.
5. **Name pools as first-class tables** so procedural worlds still read plausibly.

## Unknowns

- Exact morale tick formula, scandal probability model, and alliance break-up rules
  are not documented in the shipped reference and were not recovered. `[infer]`
- `Maximum_Members` being 3–10 while `Minimum` is unstated implies a hard floor of 2
  or 3. `[infer]`
