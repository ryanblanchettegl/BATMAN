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
| Packaging | Config added, Windows build not run | `npm run pack:dir` (electron-builder 25.1.8) produced a Linux unpacked app whose asar holds only `desktop/`, `dist/index.html`, `package.json` and `steamworks.js`. The Windows installer (`npm run pack`, NSIS) has not been built; it needs a Windows build host or Wine. No icon yet (needs art). Saves use the browser storage inside Electron's per-user folder; not yet checked on Windows |
| Cinematic matches | Missing | Needs an art decision from Ryan |

## Biggest risks (opinion)
1. No Windows installer built yet, no icon, and Steam calls have never run.
2. Cinematic match art is large and unscheduled; the live broadcast screen is the current presentation.
3. Most browser tests are slow and were not all rerun this session.

## Next
Build the NSIS installer on Windows with an icon, then Steam achievements against app id 480 with the Steam client. Both need Ryan's go-ahead for anything that spends money or publishes.

## Save size (measured 13 October)
One game of PDW: 1.19 MB at week 50, 1.42 MB at week 100, 1.75 MB at week 200, growing about 3 KB a week. Browser storage holds about 5 million characters, so this is safe for several game years, but the wrestler records (885 of them, about 1.3 KB each, 1.1 MB in all) are the place to trim first if it becomes a problem. Saves can now also be kept as a file (Options, Save to a file).
