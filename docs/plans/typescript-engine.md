# The engine in TypeScript modules: blueprint

Status: **gate 3 of 3, waiting** (CLAUDE.md rule 9d). Questions answered (section 7); Ryan said "not yet" to starting. Ryan, 23 October: "so rebuild in typescript modules?" then "do it". The
blueprint is written; the questions are asked one at a time; no code until he says go. It is phase A, Foundation, of the
long-term plan (`docs/plans/WrestleCraft-review-and-long-term-roadmap.pdf`, section 8).

## 1. What changes, and what does not

Today `build.js` glues 105 plain ES5 files in `src/` into one shared closure (`engine.js`): every file sees every other
file's variables, about 510 `E.*` functions form the outside surface, systems plug in through hook lists (`MQX`, `CRX`,
`FINX`, `EFX`, `POST`, `SHOWX`, `WEEKX`, `NEWX`, `PREX`, `TASKX`), and 32 files wrap functions from earlier files, which
is why file order matters (`test-buildorder.js`).

After: `engine/` holds TypeScript modules. Each system is a module that imports what it uses. The state `S` has a type.
Every change to the state goes through a named command. The hooks become registries that modules add to explicitly.
Wrapping by file order becomes explicit extension points.

What does not change: how the game plays (proved by golden masters, section 4), the interface (already TypeScript),
the saves (rule 9: the same `S`, the same key), the 3D renderer, Electron and the Steam wrapper, and `E` as the name the
screens call. The browser page still gets one `engine.js`, now bundled by esbuild instead of glued.

## 2. The steps

1. **Golden masters.** Record a dozen seeds: the full state after 100 weeks of every company model and both worlds, the
   reports of every show, and screenshots of every page at 1080p, 1440p and 4K. A test replays them and must match byte
   for byte. Nothing else starts until this exists.
2. **The build takes TypeScript.** esbuild bundles `engine/` into `engine.js`, still exposing `GP`/`E`. The ES5 files keep
   working beside it: a file moves only when its module is ready.
3. **Types for the state.** A type for `S`, a promotion, a wrestler, a show, a report, written from what the code reads.
   No behaviour changes.
4. **Move file by file, in build order.** Each file becomes a module; its shared variables become imports and exports;
   its wraps become named extension points. After every file: the golden masters, every headless test, the type-check.
5. **One command layer.** Every write to `S` from the screens goes through a named command (`E.*` already mostly is);
   a lint forbids writes to `S` elsewhere and bans `Math.random`, the clock and unordered iteration in the engine.
6. **CI grows.** GitHub Actions runs every headless test, the golden masters and the Playwright suites on every push.
7. **Clean up.** Remove the glue, `test-buildorder.js` (file order no longer matters), and update `CLAUDE.md`, split into a
   short core and area notes.

## 3. Data

No change to the save. The state type is a description of `S`, not a new shape. A field that turns out unused is left
alone until a later, separate change.

## 4. How it is kept safe

- Golden masters after every step: same seeds, same weeks, same bytes.
- Every headless test (52) and every browser suite (42) after every file moved.
- Small pull requests, one or a few files each, watched by CI.
- Determinism: the same rules as now (`rnd(S)` only; never the clock), now enforced by a lint.

## 5. Cost and pace

About 2 months, in many small steps, built by Opus 5.5. Feature work pauses during it, except fixes. The game stays
playable after every step.

## 6. What it hands the next phase

A codebase the agent can change safely and quickly; a command layer that multiplayer, replays and one-file bug reports
build on; a full CI wall that lets approved plans run unattended (the rule change proposed in the review).

## 7. Questions for Ryan

(Asked one at a time; answers recorded here.)

1. During the rebuild: **new features pause; fixes only.** Plans and question lists for later systems can still be written.
2. Unattended: **yes, approved steps run unattended**; each must pass the recorded games and every test before it merges,
   and Ryan gets a short report at each milestone (about every third of the rebuild).
3. The live page: **published at each milestone**, so Ryan can play and check nothing changed.
4. An old bug found during the move: **kept exactly, logged, and fixed as its own change afterwards**, so the recorded
   games still prove the move changed nothing.
5. Go-ahead (23 October): **not yet.** The plan waits for Ryan's word.
