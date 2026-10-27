# ADR-0002: Imports, and what stays on the bridge

**Status:** Accepted
**Date:** 27 October 2026
**Builds on:** ADR-0001 (every engine file is now a module in `engine/`)

## Context

After the move every module still reached every other through the bridge `$L`. ADR-0001 planned to replace it with plain
imports. Two things stop a plain import everywhere:

- **Load order.** esbuild runs an imported module before the one importing it. A module that imported a *later* module
  would make that later one load first, and the hook lists (`WEEKX`, `SHOWX` and the rest) would fill in a new order.
  That changes play.
- **Wraps.** 33 names are written through the bridge by other modules (`$L.heatUp = function(){...}` wrapping the old
  one). An imported binding cannot be replaced from outside, so a caller that imported the name would miss the wrap.

## Decision

- A reference becomes a plain import when its name lives in the same or an earlier module **and** nothing writes that
  name through the bridge. `tools/to-imports.js` does this mechanically; about 6,900 references moved.
- Forward references and the 33 written names stay on `$L`. `$L` is now the engine's registry of extension points:
  a module that wants to extend another assigns `$L.name`, and every caller that goes through `$L` sees it.
- The legacy block is empty and `L` is a plain registry built by `build.js`.

## Consequences

- Most of the engine reads as ordinary imports, and the type-checker can follow them once types come in (step 3).
- `$L.name` in the code now means one of two things: "this is defined later" or "this can be extended". Both are
  real dependencies worth seeing.
- To revisit in cleanup: turning each wrap into a named hook list, so `$L` can shrink to the extension points alone.
