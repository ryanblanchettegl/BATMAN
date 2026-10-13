# Commercial viability roadmap

Facts here come from running things on 13 October 2026. Opinions are marked. Nothing here is market research; none was done.

## Where the product stands

| Area | State | Evidence |
|---|---|---|
| Simulation | Working, deterministic | `test-uni` 60 weeks, 9 companies, errs 0 NaN 0; `test-determinism` passes |
| Relationships as the centre | Working | `test-relations` passes; now feeds the dirt sheet, the feed and rumours |
| The Net (dirt sheet, feed) | Improved this run | Backstage, Follow-ups, Looking back, relationship posts; `test-backstage`, browser `net` pass |
| Desktop wrapper | Launches | Electron 33 under a virtual display: title screen reached, `gpSteam` bridge present, no console errors (`tools/desktop-smoke.js`) |
| Steam (achievements, Workshop) | Untested | `steamworks.js` is not installed here and needs the Steam client. Do not claim Steam readiness |
| Packaging (installer, icons, save location) | Missing | No electron-builder config in the repo |
| Cinematic matches | Missing | Needs an art decision from Ryan |

## Biggest risks (opinion)
1. No installer or Steam depot yet, and Steam calls have never run.
2. Cinematic match art is large and unscheduled; the live broadcast screen is the current presentation.
3. Most browser tests are slow and were not all rerun this session.

## Next
Packaging (electron-builder, Windows icon, saves in the user folder), then Steam achievements against app id 480 with the Steam client. Both need Ryan's go-ahead for anything that spends money or publishes.
