---
name: engine-next
description: Use when changing the shape of the WrestleCraft engine (engine/*.ts) without changing play: turning wraps into hook lists, tightening types, moving code between modules. Keeps the recorded games identical.
---
# engine-next

The move from `src/*.js` to `engine/*.ts` is done (ADR-0001, ADR-0002; merged 27 October). This is how later reshaping is done safely.

1. Read the module and every later module whose `wraps:` header names it (`grep -n "wraps:" engine/*.ts`). A name on `$L` is either defined later or wrapped; keep both working.
2. **Wrap to hook list:** replace `var was=$L.f; $L.f=function(...){... was(...) ...}` with a named list the first module runs in load order (as `WEEKX` and `SHOWX` are). Keep the order exactly: the last module's wrap runs outermost today.
3. **Types:** replace an `any` with a type from `engine/types.ts` (regenerate it with `node tools/state-types.js` if a field is missing). Work one module at a time towards `"strict": true` in `engine/tsconfig.json`.
4. Randomness never moves: `rnd(S)` stays where it is and in the same order; `h01()` for flavour. `test-lint.js` bans `Math.random` and the clock.
5. Prove nothing changed: `node build.js`, `node test-golden.js` (all 60 games match), `node tools/headless-tests.js`, `app/node_modules/.bin/tsc -p engine`, then `app/tests/journey.js` (`WEEKS=5`).
6. No balance or feature change in the same commit. Note the step in `TASKS.md` 0an2.
