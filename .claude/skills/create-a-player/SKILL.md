---
name: wrestlecraft-create-a-player
description: Audit and improve WrestleCraft's create-a-player / world-editor worker suite (identity, appearance, position, derived ratings, validation). Use when adding creator fields, fixing creator UX, seeding relationships or gimmicks at creation, adding presets/randomisation, or when the creator feels thin next to TEW IX.
---

# WrestleCraft create-a-player: fix and extend

> Copied into the project from `Desktop/cool stuff/create-a-player/` on 2026-10-28. Ryan's later decisions win over this file:
> - Create a Player is **modular**: every piece (tops, bottoms, accessories, hair...) is picked separately (`docs/plans/wrestler-look-scrapbook.md` §4b).
> - Every part **morphs to the body** (§4a); decals are a SmackDown-style layer editor (§11, 1.4).
> - The target look is the **Paper doll** (§11); gimmicks never set looks (`docs/plans/gimmick-signatures.md`).

A skill for an agent working on the worker-creation path of WrestleCraft (repo
`BATMAN`, codename WrestleCraft). Read `reference/current-state.md` first — it records
what exists today with file evidence, so you don't rebuild what's already there.

## The one thing to understand before changing anything

**The creator does not let you type stats.** It collects identity + appearance +
position, then *derives* ratings from `(pop, push, style)` via `edRatings()` in
`BATMAN/src/86-editor.js`. That is a deliberate design choice, not an omission, and it is the
main thing that makes the suite feel thin to a TEW IX player.

So there are exactly three honest ways to "fix" the creator, and you must pick one
before editing files:

| Approach | What it means | Use when |
|---|---|---|
| **A. Widen inputs** | add fields that feed the existing derivation (gimmick, attributes, height, weight, traits) | default; preserves the "derived, not typed" philosophy |
| **B. Add an advanced mode** | optional manual stat editing with a point budget and caps | the player explicitly wants TEW-style control |
| **C. Improve presentation** | presets, randomise-with-locks, live preview, validation messages, shareable codes | the model is fine but the flow is clunky |

Doing A and B together is how creators become unusable. Choose, state the choice in the
commit message, and follow `reference/ux-and-testing.md` for the flow rules.

## Workflow

1. **Read the current state** — `reference/current-state.md` lists every existing field
   and the functions behind it.
2. **Pick the target** from the ranked gap list there. Do not batch unrelated gaps.
3. **Change the data model first** — `reference/data-model.md` has the target shape.
   All new fields must be optional and defaulted so old saves keep loading.
4. **Wire the engine, then the UI.** Engine functions live in `BATMAN/src/86-editor.js`
   (`E.ed*`); the screen is `BATMAN/app/src/screens/editor/People.tsx`.
5. **Keep determinism.** Anything random must use the seeded path (`edRnd`/`edPick`,
   never `Math.random()`), or `node test-determinism.js` will fail.
6. **Add a test case** to `test-create.js` (root) following its existing `ok(id,label,pass,detail)`
   pattern, then run the full suite.
7. **Check the save/load round trip** — `E.edCheck(pkg)` must stay clean for a package
   that was created, saved, reloaded and re-validated.

## Non-negotiables

- **No breaking saves.** New fields are additive and optional. A worker with no `gimmick`
  must behave exactly as it does today.
- **No silent stat inflation.** If you add manual stats, they need a budget, or every
  created worker becomes a 100/100 god and the sim's economy breaks.
- **Never fork the deriviation.** `edRatings` stays the single source of derived stats;
  advanced mode overrides the *output*, it does not add a second formula.
- **Portraits stay optional.** `w.face` unset means "let the game derive one" — that
  behaviour is load-bearing for generated wrestlers (`derive('ed'…)`).

## Where the code lives

| Concern | File |
|---|---|
| Creator screen (fields, face editor) | `BATMAN/app/src/screens/editor/People.tsx` |
| Engine editor API (`E.ed*`) | `BATMAN/src/86-editor.js` |
| World/package schema + validation | `BATMAN/src/85-universe.js` (`ED_TABLES`, `REL_TYPES`) |
| Name pools / random names | `BATMAN/src/86-editor.js` (`edNames`, `E.edRandomName`) |
| Appearance params | `BATMAN/app/src/kit` (`FaceCanvas`, `faceOf`, `derive`) |
| Creator test harness | `test-create.js` (repo root) |
| Determinism test | `test-determinism.js` (repo root) |

## Definition of done

- The new field round-trips: create → save → reload → still set.
- `node test-create.js` passes, including a new case for the field.
- `node test-determinism.js` passes with the same seed producing the same worker.
- A worker created with no new fields renders and books exactly as before.
- The UI has one clear primary action; secondary actions are behind "more".

## Related

This skill is a companion to the `tew9-systems-transfer` skill (notes in `docs/research/tew9/`), which
holds the reference model for what a wrestling sim's worker record should contain. Use it
for *what* to add; use this skill for *how* to add it here.
