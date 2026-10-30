# WrestleCraft gap analysis vs TEW IX

Everything below was checked against the cloned repo at `src\` (105 JS files).
Line references are `[code]` evidence.

## What WrestleCraft already has

| System | Evidence |
|---|---|
| Relationship matrix with numeric heat | `src/66-relations.js:24` — `REL_MEM=6, REL_ON=30, REL_STRONG=60` |
| Six relationship types | `src/85-universe.js:10` — `rivalry, friendship, mentor, family, partners, dislike` |
| Pair schema incl. chemistry | `src/85-universe.js:19` — `a, b, type, strength, ring_chemistry?, note?` |
| World editor with 8 tables | `src/86-editor.js:9` — `promotions, shows, titles, workers, contracts, teams, relationships, events` |
| Editor mutation helpers | `src/86-editor.js:71` — `edAddRel` |
| History → relationship seeding | `src/86-history.js:25` |
| Backstage reports | `src/94-net.js:117` |
| Booking creates friends/enemies | `src/82-wishes.js:331` |
| Record extraction incl. matrix | `src/84-sift.js:3` |
| Retirement pruning | `src/70-season.js:222` — "relationships with somebody retired are never read again" |
| Morale system | 282 `morale` hits across `src/*.js` |
| Contracts | 121 hits |
| Networks / TV / sponsors | 135 / 78 / 72 hits |
| Stables | 69 hits |
| Venues | 33 hits |
| Mentor system | 25 hits |

WrestleCraft is **not** a blank slate. It already has the hard parts: a seeded,
deterministic relationship matrix with decay thresholds, a morale system, contracts,
and an editor. The gap is in *expressive range*, not in existence.

## Verified gaps, ranked

### 1. Relationships are single-axis `[code]` vs three-axis `[doc]`
**Impact: high. Effort: medium.** TEW lets a pair be *siblings + hostile + divorced*;
WrestleCraft can express exactly one of those. `family` is currently a **type**, which
means a family member cannot simultaneously be a rival without discarding one fact.

**Port:** add `family`, `personal`, `romantic` as optional enum fields on the existing
pair record; keep `type`/`strength` as the simulation spine for backward compatibility.

### 2. No bulk relationship editing `[code]` vs `editRelationshipMass` `[bin]`
**Impact: medium. Effort: low.** The editor can add one edge (`edAddRel`) but not
retype a filtered set. TEW's mass editor implies filter-then-patch.

**Port:** `edEditRelMass(pkg, predicate, patch)` iterating canonical keys.

### 3. No "notable relationships" surface `[code]` vs `Notable Relationships` `[bin]`
**Impact: medium. Effort: low.** The matrix is dense; the player needs the top-N by
magnitude and kind. WrestleCraft surfaces backstage *events* (`94-net.js`) but not the
standing relationship summary.

**Port:** `notableRels(S, workerId, {minStrength, kinds, limit})`.

### 4. No scandals concept `[code: 0 hits]` vs `Scandals` table `[doc]`
**Impact: high. Effort: medium.** This is the missing bridge from private state to
public consequence. WrestleCraft has grievances (7 hits) but no discrete, publishable
incident entity that damages popularity/company standing.

**Port:** a `scandals` table `{id, a, b?, company?, kind, severity, week, public}`,
spawned from extreme relationship states + morale collapse.

### 5. Alliances are thin `[code: 4 hits]` vs threshold-driven `Alliances` `[doc]`
**Impact: medium. Effort: medium.** TEW encodes join rules as data
(`Maximum_Members`, `Sizes`, `Companies`, `Gender Settings`).

**Port:** an `alliances` entry with an eligibility predicate, not a hardcoded check.

### 6. Chemistry is a field, not a table `[code]` vs `Chemistry` table `[doc]`
**Impact: low-medium. Effort: low.** TEW separates in-ring chemistry from personal
affect so "hate each other, work great together" is representable. WrestleCraft already
stores `ring_chemistry` per relationship, so it is representable — but only where a
relationship row exists.

**Port:** allow chemistry-only pairs (no affect) by relaxing the requirement that a
pair must have a `type`.

### 7. Editor exposes 8 tables `[code]` vs 45 `[doc]`
**Impact: medium. Effort: medium (incremental).** Notably `stables` (69 feature hits)
and `venues` (33 hits) are *not* in `ED_TABLES` — the systems exist but world authors
cannot edit them. That is a self-consistency bug worth fixing regardless of TEW.

**Port:** extend `ED_TABLES` one table at a time, each with a `test-*.js`.

## Suggested sequence

1. `stables` + `venues` into `ED_TABLES` (fixes an internal inconsistency, no new model).
2. Three-axis relationship fields + migration from `type` (unlocks gap 1).
3. Mass edit + notable view (cheap, immediate editor quality-of-life).
4. Scandals (biggest new player-facing system).
5. Alliance eligibility data model.
6. Chemistry-only pairs.

## Migration mapping (single type → three axes)

Existing `REL_TYPES` map cleanly, with one judgement call:

| Current `type` | `family` | `personal` | `romantic` | Notes |
|---|---|---|---|---|
| `family` | `Sibling` (default) | `Like Family` | — | type carried no *which* relative; needs author input |
| `friendship` | — | `Friendship` | — | |
| `rivalry` | — | `Open Hostility` | — | or `Strong Dislike` if `strength` is mild |
| `dislike` | — | `Strong Dislike` | — | |
| `mentor` | — | `Mutual Respect` | — | mentor remains a separate edge; see below |
| `partners` | — | `Mutual Respect` | — | partnership is better modelled as `Tag_Teams` than as affect |

`mentor` and `partners` are **role** relationships, not affect — TEW keeps those in
separate tables (`Tag_Teams`, contracts). Keep them as WrestleCraft `type` values and
do not force them onto the three axes. That is a deliberate divergence, not a bug.

## Divergences to keep

- **Numeric `strength`** is a WrestleCraft strength, not a weakness: TEW's purely
  categorical affect cannot express "cooling off" gradually. Keep both.
- **Deterministic seeding** (`test-determinism.js`) must be preserved; any new rolls
  take the seeded RNG, never `Math.random()`.
