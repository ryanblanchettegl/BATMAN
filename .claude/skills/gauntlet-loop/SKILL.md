---
name: gauntlet-loop
description: Use for the next feature implementation in WrestleCraft when Ryan asks for the gauntlet (Ryan, 31 October). Builder sub-agents make the change; an isolated critic sub-agent, which never builds, reviews it against top-tier standards for the genre; the loop cycles until the critic explicitly passes it. Builders never approve their own work.
---
# gauntlet-loop

Ryan, 31 October: "fan out specialized sub-agents to execute the code modifications, while deploying an entirely separate, isolated critic sub-agent to strictly review the output ... Do not let the builder agents approve their own work. Keep cycling the build-and-review loop ... until the critic sub-agent explicitly verifies that the code is completely optimized, bug-free, and perfectly matches the target gameplay standards."

It is `critic-review` made into a loop with separate roles. The bar, the rubric and the log are `critic-review`'s (8.5 or higher on the canonical rubric, every score in `docs/notes/critic-log.md`); this skill adds the roles, the verdict and the cycle.

## Roles

| role | who | may | may not |
|---|---|---|---|
| **Lead** | the session itself | split the work, run the loop, run tests, commit | write a verdict |
| **Builders** | one sub-agent per independent slice (a file or a screen area), run in parallel when slices do not touch the same file | edit files, build, run the tests for their slice | judge, score or approve anything, edit tests to make them pass, touch another slice's files |
| **Critic** | one separate sub-agent per round, started fresh each round, given paths only (golden rule 3), never shown a builder's opinion of its own work | read files, build, run tests, take Playwright screenshots | edit any file |

The critic is isolated: it gets the target spec, the paths and the diff range, never the builders' summaries. A builder's "done" is a claim for the critic to check, not evidence.

## The critic's brief

A master game engineer and art critic for this genre: has shipped wrestling and management games (SmackDown vs Raw, Fire Pro, TEW, Football Manager) and is hard to please. Two reviews every round:
- **Functional:** run it. Build, the headless tests for the area, the browser test for the screen, and Playwright frames of every state and animation (1920x1080 and 2560x1440). Every requirement in the spec is checked by doing it, not by reading the code.
- **Structural:** read the diff. Correctness, edge cases, determinism (no `rnd(S)` in screens, no `Math.random`), rule 1 (screens never write `S`), rule 5 (every control a real button with a `data-t`), the look (rule 2a), one screen at 1920x1080 (rule 5b), cost in code.

It returns JSON: `{ "verdict": "PASS" | "FAIL", "score": n, "rubric": {...}, "defects": [{ "id", "severity": "blocker"|"major"|"minor", "where", "what", "repro" }], "improvements": [ ... ] }`. **PASS only when** the score is 8.5 or higher, there is no blocker or major defect left, and every spec requirement was verified by doing it. Anything else is FAIL with the defects to fix.

## The loop

1. **Spec.** The Lead writes the target as a numbered checklist of requirements, each one a thing the critic can do and see (Ryan's words, quoted). If it is a new system, rule 9d's gates come first.
2. **Build.** The Lead splits the work into slices and starts one builder per slice, each with its requirements and its files.
3. **Review.** A fresh critic reviews the whole change (functional + structural) and returns the verdict.
4. **FAIL** → the Lead hands each defect to the builder whose slice it is in (a new builder if no slice owns it), back to 2. Defects are fixed most severe first.
5. **PASS** → the Lead runs the full gate (`node tools/headless-tests.js`, `node test-golden.js`, the section's browser tests), rebuilds (rule 10b) and commits with the score and the round count. Improvements the critic listed as options go to Ryan as options, never built unasked.

**Stopping.** Ryan asked for the loop to keep cycling until the critic passes. Two guards still apply: if a round fixes nothing (the same defects come back unchanged), or after six rounds, the Lead stops and brings Ryan the critic's open defects with what each fix would take. A score that moves by 1 or more with no change to the files is discarded (`critic-review`'s stop rule).

## Running it

Use the `Workflow` tool (Ryan asked for the fan-out): builders with `agent()` in `parallel()` per slice, the critic as its own `agent()` with a schema for the verdict, inside a loop over rounds. Builders run in the main checkout one slice at a time if slices share files; otherwise in parallel on disjoint files. The Lead never lets a builder's return value end the loop; only the critic's `verdict === 'PASS'` does.
