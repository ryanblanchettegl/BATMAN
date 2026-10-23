# ADR-0001: How the engine moves to TypeScript modules

**Status:** Accepted
**Date:** 23 October 2026
**Deciders:** Ryan (the rebuild was approved under rule 9d: `docs/plans/typescript-engine.md`)

## Context

`build.js` concatenates 105 ES5 files from `src/` into one closure. A scan of the files on 23 October found:

- about 1,029 top-level names (functions and `var`s), all visible to every file;
- 332 forward references in 52 files: a file calls a function that a later file defines (it works today because every
  function in one closure is hoisted, and calls happen at run time, after every file has loaded);
- 31 places where a later file replaces an earlier file's function (`heatUp = function(){...}` wrapping the old one),
  which is why file order matters (`test-buildorder.js`);
- hook lists (`WEEKX`, `SHOWX` and the rest) that files push onto at load time, in file order.

The golden masters (`tests/golden.json`: 60 games, 100 weeks, fingerprinted every 10 weeks) must match after every step.
The game must stay playable after every step, and new features are paused (Ryan's answers).

## Decision

**Option C: a two-way bridge, moving files one at a time, from the last file in build order towards the first.**

- The remaining ES5 files are still concatenated, as one module, `legacy`. The build scans their top-level names and
  generates an object `L` with a getter and a setter for each name, closing over the real bindings. A moved module reads
  `L.name`, calls `L.name()`, and wraps by assigning `L.name = ...`: the legacy callers see the new function, because
  the setter writes the closure binding they call.
- A name that now lives in a moved module keeps a stub `var name;` in the legacy closure, and the module assigns
  `L.name = name` when it loads. Forward references from legacy code keep working, because they run after load.
- Modules load in the old file order, after the legacy block, so hook lists fill in the same order as today.
- Moving from the end backwards means a moved module only ever depends on legacy names and on modules already moved,
  so no step needs a cycle. When every file is a module, the bridge is replaced by plain imports, file by file from the
  start, and `L` is deleted.
- esbuild bundles it all into the same `engine.js` with the same `GP`/`E` surface, so tests and screens change nothing.

## Options considered

### Option A: convert everything in one go

| Dimension | Assessment |
|-----------|------------|
| Complexity | High: 1,029 names and 332 forward references untangled at once |
| Cost | One very large change; a golden-master failure would be hard to locate |
| Risk | High |
| Familiarity | Same for any option (the agent builds it) |

**Pros:** no temporary bridge. **Cons:** cannot be checked step by step; breaks Ryan's "small steps, every test after each".

### Option B: global object (`window.G`) for shared names

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium |
| Risk | High: legacy code calls bare names, so a function replaced through `G` is not seen by legacy callers |

**Pros:** simple to set up. **Cons:** the 31 wraps silently stop applying to legacy callers; the golden masters would
catch it, but the fix leads back to Option C.

### Option C: the two-way bridge, last file first (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium: one generator for `L` and stubs in `build.js` |
| Cost | About 105 small steps, each checked by the golden masters |
| Risk | Low: any change in play shows as a fingerprint mismatch in the step that caused it |

**Pros:** every step is small and provable; wraps, hooks and forward references keep working unchanged.
**Cons:** a temporary layer (`L`) that exists until the end; accessors are slightly slower (to be measured: the golden
run takes about 4 minutes today).

## Trade-off analysis

Option C costs a temporary bridge to buy what matters most here: a proof after every step that nothing changed. Options
A and B are cheaper on paper but lose that proof, and with 332 forward references and 31 wraps, a failure without a small
step to blame would be expensive.

## Consequences

- Easier: each module gets types and imports; wraps become visible as `L.name = ...`; a later lint can ban writes to `S`
  outside commands.
- Harder for a while: two ways to reach a name (bare in legacy, `L.` in modules).
- To revisit: the speed of accessors on the weekly simulation; the final step that replaces `L` with imports.

## Action items

1. [ ] Step 2a: `build.js` bundles with esbuild: the legacy concatenation, the generated `L`, and an empty `engine/`.
       Golden masters, every headless test and the type-check pass with nothing moved.
2. [ ] Step 2b: move the last file in build order (`src/99-zpodcast.js`) to `engine/` as TypeScript through `L`.
3. [ ] Continue file by file; a milestone report to Ryan at about a third, two thirds and the end.
4. [ ] Final: replace `L` with imports, delete the bridge and `test-buildorder.js`, update `CLAUDE.md`.
