---
name: wrestlecraft-architecture
description: Use before designing or adding any WrestleCraft engine system, data model, save field, event or screen data flow. Gives the layout, the state, the hooks and the rules.
---
# wrestlecraft-architecture

Source of truth: `CLAUDE.md` (How the code is laid out, Rules) and `docs/adr/`. A new system first passes rule 9d (blueprint, questions, approval).

Adding a system:
1. **Where:** one module `engine/NN-name.ts`. The number sets its load order: after everything it reads or wraps. Prefer a hook list (`MQX`, `CRX`, `FINX`, `EFX`, `POST`, `SHOWX`, `WEEKX`, `NEWX`, `PREX`, `TASKX`) to wrapping another module's function; if it must wrap, say `wraps:` in its header (`test-buildorder.js`).
2. **State:** fields on `S` (the save, rule 9) are optional with a default, so old saves load. A change that breaks old saves needs a version bump and a migration. Run `node tools/state-types.js` afterwards.
3. **Randomness:** `rnd(S)` for outcomes, `h01()` for words and flavour, never the clock (`test-lint.js`).
4. **Screens:** read through `E.*` functions; write only through an `E.*` command inside `act()` (rule 1; `test-lint.js` checks).
5. **Content a modder could want** (kinds, rules, words) is data a world file can carry, as `pkg.segkinds` and `pkg.stips` are, edited in the World Editor through `E.ed*`.
6. **People:** a decision says what it does to the people in it through `relBump()` and `youRemember()` (rule 9b). A booking choice has a scene (rule 9c).
7. **Budget (rule 9g):** name its Director tag (problem, chance, colour), what it hands the next phase (rule 7a), and what it replaces.
8. **Tests:** a headless `test-<name>.js` (picked up by `tools/headless-tests.js`), 60 weeks with errs 0 and NaN 0, and re-record `tests/golden.json` only when play is meant to change, saying so.
9. A look, sound or name involved: the `design-decision` skill.
10. Update `CLAUDE.md` (the layout line) and `TASKS.md` in the same change.
