# Current state of the create-a-player suite

Recorded from the repo at the time of writing. Re-verify line numbers before editing.

## What exists

**Screen:** `app/src/screens/editor/People.tsx` (~12.5 KB) — the World Editor's person
tab. It edits an existing package's workers; creation rides the same field set.

**Fields currently exposed** (extracted from the screen's labels):

| Field | Notes |
|---|---|
| Ring name | plus "Random name" button |
| Age | |
| Weight | no height, no min/max range |
| Hometown | |
| Side | face/heel |
| Style | feeds `edRatings` |
| Card position | the push value that feeds `edRatings` |
| Finishing move | |
| Locker room role | |
| Division | |
| Company | assigns a contract |
| Contract weeks left | |
| Manager | |
| Skin tone | range slider, part of `w.face` |
| Hair colour | range slider, part of `w.face` |

Plus a **face editor** with `PARTS`, a Randomise button (`ed-face-rnd`) and a
"Let the game decide" reset (`ed-face-auto` that deletes `w.face`).

**Engine surface** (`src/86-editor.js`):

- `E.edAddWorker(pkg, o)` — create
- `E.edDup(pkg, table, id)` — duplicate
- `E.edRandomName(pkg, gender, seed)`, `edNames(pkg)` with `FALLBACK_NAME`
- `E.edSetTier(pkg, wid, push, seed)` — position
- `edRatings(st, pop, push, style)` — **derives** skills; not player-entered
- `E.edQuick(kind, name, seed)` — quick create
- `E.edFill(pkg, pid, n, seed)` / `E.edFillFree(pkg, n, seed)` — bulk generate
- `E.edCheck(pkg)` — validation
- `E.edHealth(pkg, pid)` — roster sanity
- `E.edAddRel(pkg, a, b, type)` — relationship (separate from creation)
- `E.edAddBrand`, `E.edSetTier`, `E.edSign`, `E.edRemove`, `E.edRename`

## The core design fact

`edRatings(st, pop, push, style)` means **skills are a function of position, not of user
input**. A creator therefore cannot express "great worker, bad talker" — that shape comes
from the seed and style, not the author.

This is the single biggest perceived limitation versus TEW IX, where skills are edited
directly.

## Ranked gaps

Ordered by (player-visible value ÷ risk).

### 1. No gimmick at creation
TEW: gimmick is chosen and rated, affects segment bonuses/penalties `[hb 7.7, 29]`.
WrestleCraft has `99-gimmicks.js` (69 refs, 14 in that file) but creation does not let you
pick one. **Highest value**: it is expressive, cheap, and already implemented elsewhere.

### 2. No personality/attributes
TEW: attributes and personalities colour incidents `[hb 19.23–19.24]`; WrestleCraft has
`TRAITS` (e.g. `grudge`) in `76-locker.js`, but creation cannot choose them.
**Cheap**: wire existing traits into the creator.

### 3. No height, no weight range
TEW IX uses exact height/weight for skill caps, title eligibility and hiring; weight moves
within min/max `[hb 19.3]`. WrestleCraft has a single `Weight`.
**Medium**: adds a field now, but weight-class/title rules later.

### 4. No skills, only derived
See above. The "advanced mode" question. **High impact, high risk** — needs a budget.

### 5. No relationship seeding at creation
TEW lets you define family/personal/romantic when building the world. WrestleCraft has
`edAddRel` but the creator flow does not offer it, so new workers enter socially isolated.
**Medium**: a "relationships" section in the creator that calls the existing API.

### 6. No presets or templates
TEW has `Stored_Templates` for contracts, and products/sizes as presets. The creator opens
empty every time.
**Low risk, high polish**: presets like "Young Lion", "Veteran Heel", "Monster".

### 7. No duplicate / collision feedback
`E.edDup` exists and `E.edCheck` validates, but the creator does not surface
"a wrestler with this name already exists" at the point of typing.
**Low risk**: inline validation.

### 8. No undo
Deleting via `E.edRemove` is immediate. TEW's editor is not better here, but a creator
that can destroy a worker with one click needs either undo or a confirm.
**Low risk**: confirm step, matching `Create.tsx`'s two-press remove pattern.

### 9. Appearance is four numbers
`skin tone`, `hair colour`, `PARTS`. No body type, age-linked change, mask, attire.
**Medium**, and the natural bridge to Blender-generated portraits.

## What is already good — do not "fix" these

- **Two-press destructive actions** (`Create.tsx` uses this pattern; mirror it).
- **"Let the game derive" escape hatch** (`ed-face-auto`) — excellent for generated workers.
- **Bulk fill** (`edFill`, `edFillFree`) — this is the TEW "fill roster" workflow, already built.
- **Validation exists** (`edCheck`) — the gap is surfacing it, not writing it.
- **Occasion-gating** for shows/belts in `Create.tsx` — a strong idea worth reusing for
  "big" creations (a new promotion, a new title lineage).

## Verification commands

```bash
node test-create.js          # creator/editor behaviour
node test-determinism.js     # seeded randomness
npm test                     # headless sim, 60 years
npm run check                # build + tsc + universe test
```
