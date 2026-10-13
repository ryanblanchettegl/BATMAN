# Feature opportunity backlog

Baseline, 13 October 2026 (run, not assumed): `node build.js` builds; `tsc --noEmit` clean; `test-uni.js` 60 weeks, every company errs 0 NaN 0; `test-determinism`, `test-wording`, `test-relations`, and the browser `net` test pass. Browser tests other than `net` were not run.

What already exists (see `CLAUDE.md`): relationship matrix and memories, live show with calls, Backstage, Storylines with feud lengths, the Net (dirt sheet, feed, boards), the road, markets, rival promotions, logos, World Editor.

| # | Opportunity | Value | Effort | Risk | Status |
|---|---|---|---|---|---|
| 1 | Dirt sheet reports what people did to each other, with Sure/Likely/Thin by closeness | High | S | Low | Done (Backstage panel, `test-backstage.js`) |
| 2 | Rumours that resolve: a Thin item later shown true or false, with a correction | High | M | Low | Done (Follow-ups panel, `S.rumF`, `S.rumR`) |
| 3 | Feed posts for relationship turns (new friends, new heat) from different voices | Med | S | Low | Done (`netTurn`, called from `relBump`) |
| 4 | Archive page: champions, rivalries and careers from `S.reports` and `S.news` | High | L | Med | Partly there (History page, record book); throwbacks on the sheet done |
| 5 | Illustrated cinematic match moments, picked from the simulated beats | High | L | High | Open, needs art decision from Ryan |
| 6 | Desktop packaging and Steam: Electron scaffold exists in `desktop/`, untested here | High | M | Med | Open |

Rules for all of these: read-only against `S`, no `rnd(S)` in Net code, one step at a time (CLAUDE.md 9a).
