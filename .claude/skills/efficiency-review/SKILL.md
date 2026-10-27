---
name: efficiency-review
description: Use at every milestone in WrestleCraft (rule 9e's tech-debt check), or when Ryan asks, to make the build, the tests, the code and the docs faster and leaner.
---
# efficiency-review

Check each, then fix the three biggest wins (each its own small commit, every test passing):

- **Build and tests:** time `node build.js`, `node test-golden.js`, `node tools/headless-tests.js` and the browser suites. Script any step still done by hand. Split slow tests across CI shards (`SHARD` in `tools/headless-tests.js`).
- **Code:** dead code, duplication, hot loops in the weekly sim (profile a 60-week `test-uni.js` with `node --cpu-prof`), wraps that could be hook lists (ADR-0002).
- **Docs:** shorten `CLAUDE.md` towards a short core with area notes (rule 9i): drop stale lines, merge repeats. Every line costs reading time on every session.
- **Tools:** run the `free-tools-first` skill for any slow manual step.
- **Workflow:** plugins and skills worth adding (`SearchPlugins`).

Also run the `engineering:tech-debt` skill. Record what was found and fixed as a dated line in `TASKS.md` (0av, the short core) so the next review starts from it.
