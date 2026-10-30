# Creator UX rules and acceptance tests

## Flow rules

These follow what the existing screens already do well. Consistency matters more than
novelty — a creator that behaves differently from `Create.tsx` reads as unfinished.

1. **One primary action per window.** "Create" is the primary; everything else is
   secondary. The existing `Window ... ok="Done"` pattern is the model.
2. **Progressive disclosure.** Section order: *Identity → Look → Role → Position →
   Extras*. Extras (traits, relationships, overrides) collapsed by default. The current
   screen is already roughly in this order; keep it.
3. **Live preview.** The face canvas updates as sliders move. Any new appearance field
   must also preview live — do not make the player press "Preview".
4. **Randomise with locks.** Randomise should respect locked sections. TEW players
   routinely reroll a name while keeping the face. Implement as a per-section lock toggle,
   not a global one.
5. **Two-press destructive actions.** Deleting a worker must confirm, matching the
   `Remove` component in `Create.tsx` ("Delete" → "Yes, delete" / "Keep it").
6. **Inline validation, at the field.** "Name already used" belongs next to the name
   input, not in a toast after pressing Create.
7. **Never lose typed input.** Validation failures keep the form populated.
8. **Escape hatch always visible.** "Let the game decide" (`delete w.face`) must remain
   reachable for every generative field, not only the face.
9. **Presets are a starting point, not a mode.** Applying a preset fills fields; it does
   not lock them or switch the form into a reduced view.
10. **Keyboard.** Tab order follows visual order; Enter submits the primary action.

## The advanced-mode switch

If (and only if) you implement manual stats:

- Off by default. A player who never touches it sees today's behaviour.
- When on, show the **budget meter** persistently, and disable Create while over budget.
- Provide "reset to derived" so the player can escape.
- Never auto-enable it because a worker happens to be over budget.

## Test cases to add to `test-create.js`

The harness already exposes `ok(id, label, pass, detail)`. Add one case per change,
following the existing style.

```
TC-01  edAddWorker with no new fields produces a worker whose stats equal edRatings(...)
TC-02  gimmick: null renders as unrated and does not change show rating when effects off
TC-03  gimmick set + effects on changes segment rating in the expected direction
TC-04  traits: invalid id is dropped on load, worker still books
TC-05  height: null behaves as today for title eligibility
TC-06  weightMin/Max: weight drifts within bounds over N weeks, never outside
TC-07  statsOverride: over-budget package fails E.edCheck with a specific code
TC-08  statsOverride: valid override reproduces exact stat object after save/reload
TC-09  edFillFree still produces workers with seed + createdWeek populated
TC-10  determinism: same seed -> identical worker including new fields
TC-11  relationship seeding creates one canonical edge (no duplicate a-b pair)
TC-12  duplicate-name detection fires on second worker with same ring name
```

## Acceptance checklist (run before claiming done)

- [ ] `node test-create.js` — all cases pass, including new ones
- [ ] `node test-determinism.js` — same seed, same world
- [ ] `npm run check` — build + `tsc --noEmit` + universe test
- [ ] Manual: create a worker with only the old fields → books exactly as before
- [ ] Manual: create with every new field → save, reload, reopen → values intact
- [ ] Manual: delete a created worker → confirm step appears
- [ ] Manual: bulk-fill a roster of 50 → no worker has null required fields
- [ ] `E.edCheck` returns clean for both a fully-authored and a bare package

## Failure modes to watch for

| Symptom | Likely cause |
|---|---|
| Show ratings shift after adding fields | a new field leaked into `edRatings` inputs |
| Determinism test fails | used `Math.random()`/`Date.now()` instead of the seeded RNG |
| Old saves crash on load | a field was made required, or `edCheck` now fails on absent fields |
| Creator feels slower | derived stats recomputed per keystroke; cache per worker, invalidate on commit |
| Gimmick always "rated 0" | rating defaulted to 0 instead of null/wizard-unrated |
| Two relationships for one pair | seeding bypassed `edAddRel`'s canonicalisation |
