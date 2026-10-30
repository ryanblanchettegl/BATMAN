# TEW IX relationship system

The most transferable part of the model: **relationships are three independent
categorical axes on the same unordered pair**, not one typed edge.

## The pair record `[doc]`

`Worker_Relationships` holds one row per pair of workers with three fields:

| Axis | Allowed values |
|---|---|
| `Family_Relationship` | `None`, `Parent`, `Sibling`, `Cousin`, `Grandparent`, `Aunt / Uncle`, `Distant Relative` |
| `Personal_Relationship` | `None`, `Mutual Respect`, `Friendship`, `Deep Friendship`, `Like Family`, `Strong Dislike`, `Open Hostility`, `Hatred`, `Mutual Loathing` |
| `Romantic_Relationship` | `None`, `Married`, `Engaged`, `Dating`, `Divorced`, `Broken Up`, `Permanent Split` |

Consequences of that shape:

1. **Axes are orthogonal.** A pair can be siblings, openly hostile, and divorced at
   the same time. A single `type` enum cannot express this without duplicate rows.
2. **No magnitude.** Affect is ordinal by name, not a −100..100 number. TEW gets its
   granularity from *more categories* instead of from a scalar.
3. **`None` is the default and is meaningful** — absence of a relationship is itself
   a state you can query, not a null to be patched.
4. **Orientation is unresolved.** The document does not say whether a pair is stored
   once or twice. Because the names are symmetric (`Mutual Respect`, `Hatred`,
   `Divorced`), a single undirected row is the natural reading. `[infer]`

## Supporting tables `[doc]`

- **`Chemistry`** — in-ring chemistry is a *separate table*, not a relationship field.
  So "they hate each other but work beautifully together" is representable.
- **`Commentary_Experience`** — a distinct pairing axis for announce teams, showing
  that TEW models per-role pair quality separately from personal affect.
- **`Tag_Teams` / `Tag_Team_Names`** — the formalised version of a working
  partnership: a persistent entity, not an edge attribute.

## Relationship-adjacent management tables `[doc]`

- **`Scandals`** — discrete incidents that attach to people/companies; the bridge from
  private relationship state to public consequence.
- **`Business_Histories`** — append-only record of employment/ownership changes.
- **`Starting_Morale`** — morale is seeded per worker at world-gen time, i.e. it is a
  first-class stored value rather than a derived transient.

`Morale` (`×106`) and `Chemistry` (`×38`) string hits in `TEW9.exe` show both are
substantial in-engine systems rather than documentation-only concepts. `[bin]`

## UI surfaces `[bin]`

| String | Reading |
|---|---|
| `Worker Relationships` | the per-worker relationship list screen |
| `Edit Relationship` | single-pair editor |
| `editRelationshipMass` | **bulk** editor over many pairs |
| `Current Relationship Status` | status readout on a worker profile |
| `Notable Relationships` | filtered view surfacing only significant pairs |
| `frmOptionsRelationship` | global options (behaviour toggles) |

`editRelationshipMass` is the design tell: TEW treats the relationship set as a
**matrix you can filter and rewrite in bulk**, which is only practical if pair
records are keyed canonically (`a < b`) and the editor can iterate them.

## Transfer recipe (for WrestleCraft)

1. Key pairs canonically: `key = min(idA,idB) + '-' + max(idA,idB)`. WrestleCraft
   already builds matrix keys this way in `src/66-relations.js`. `[code]`
2. Add three nullable enum fields alongside the existing `type`/`strength`:
   `family`, `personal`, `romantic`. Leave them empty until authored.
3. Keep `strength` as the sim's continuous "heat" and use the categorical axes for
   *narrative kind*; derive a display label from the pair of both.
4. Add `massEdit(filter, patch)` mirroring `editRelationshipMass`, so the editor can
   retype every `Dislike` involving a promotion's roster in one action.
5. Give the player a `notableRelationships(workerId, threshold)` view rather than
   dumping the whole matrix.

## Unknowns

- Whether TEW stores asymmetric "one-sided" affect. Names suggest symmetric. `[infer]`
- The concrete morale↔relationship coupling (how `Hatred` shifts morale per week) is
  not in the shipped document and was not recovered from the binary. `[infer]`
- Whether `Chemistry` is a 0–100 scalar or an enum — the reference omits its values. `[infer]`
