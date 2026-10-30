# Target data model for a created worker

All fields below are **additive and optional**. A worker created before this change must
still load, render and book identically. Nothing here may become required without a
migration.

## Additive fields

```js
worker = {
  // ...existing: id, name, age, weight, hometown, side, style, cardPosition,
  //             finisher, lockerRole, division, manager_id, face, pinned...

  height: null,            // cm, integer. null = unknown/inherit from weight+style
  weightMin: null,         // kg. null = weight is fixed (current behaviour)
  weightMax: null,
  gimmick: null,           // { id, name, basis, rating }
  traits: [],              // ids from TRAITS in 76-locker.js, e.g. 'grudge'
  statsOverride: null,     // advanced mode only; see contract below
  seed: null,              // creation seed, for reproducible re-derivation
  createdWeek: null,       // provenance: when this worker entered the world
}
```

### Why each one

| Field | Purpose | Source of the idea |
|---|---|---|
| `height` | skill caps, weight-class eligibility, match legality | TEW IX exact height/weight `[hb 19.3]` |
| `weightMin/Max` | weight drift over time instead of a fixed number | TEW IX min/max weight `[hb 19.3]` |
| `gimmick` | segment rating bonuses/penalties; creative expression | TEW gimmick system `[hb 7.7, 29]` |
| `traits` | incident colouring; already implemented as `TRAITS` | TEW attributes/personalities `[hb 19.23–19.24]` |
| `statsOverride` | explicit stat authoring, gated | TEW direct skill editing |
| `seed` | re-derive the same worker; enables "randomise again" | WrestleCraft determinism convention |

## The derivation contract (do not fork it)

```
edRatings(st, pop, push, style)  ->  stats
```

Rules:

1. **Default path is unchanged.** If `statsOverride` is null, `edRatings` produces stats
   exactly as today.
2. **`statsOverride` is an override, not a second formula.** It replaces the *output* of
   `edRatings`, never its inputs, and it must be a full stat object (all skills present)
   so nothing downstream sees holes.
3. **Overrides must be budgeted.** Enforce a total budget derived from `push` and `pop`;
   reject writes above it in `E.edCheck`. Suggested shape:

```
budget = BASE[push] + Math.round(pop * 0.8)     // tune once, then leave alone
sum(stats) <= budget                            // else edCheck fails
```

4. **Caps still apply.** Per-skill caps from age/style/height are a hard ceiling on
   overrides, same as on derived values.

## Gimmick at creation

```js
gimmick = { id, name, basis, rating }
```

- `basis` is the gimmick archetype list already implied by `99-gimmicks.js`.
- `rating` is generated from `mic`/`charisma`/`starQuality` and the fit with `style`.
- A gimmick with no `rating` must render as "unrated", never as zero.

**Acceptance:** a worker with a gimmick and one without must produce identical show
ratings when `enableGimmickEffects` is off.

## Traits at creation

Reuse `TRAITS` (`76-locker.js`). Do not define a second trait table.

- Multi-select, max 3 by default (concentrate the character).
- Traits that modify `stress` (`grudge`) must keep their existing magnitude.
- A trait id that no longer exists must be silently dropped on load, not crash.

## Relationships at creation

Do not model it as a field on the worker. Call the existing edge API:

```js
E.edAddRel(pkg, a, b, type)
```

The creator should offer: pick a second worker → pick type (`REL_TYPES`) → optionally
strength. This keeps one canonical relationship representation (see
`docs/tew9-workbook/reference/tew9-relationships.md` if you later add the multi-axis
model; the edge helper is where that would live).

## Migration

- No version bump needed: every field is optional and null-safe.
- `E.edCheck(pkg)` gains budget validation only when `statsOverride` is present, so old
  packages validate unchanged.
- Bulk generators (`edFill`, `edFillFree`) should populate `seed` and `createdWeek` and
  leave the new expressive fields null.

## Anti-patterns

- **Do not** add `overall` to the worker. Overall is derived and must stay derived.
- **Do not** store a display string for position/gimmick; store ids, resolve in UI.
- **Do not** let the creator write directly into `S.w` — go through `E.ed*` so validation
  and signing side-effects (`E.edSign`) still run.
- **Do not** make `height` required; hundreds of existing workers have none.
