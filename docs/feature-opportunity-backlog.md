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

## The show, round one (13 October, Ryan: "making the shows themselves funner, including scrolling text with less clicks")

Done, each with tests (`app/tests/auto.js`, `test-segments.js`, `test-shape.js`), and 60 weeks of every company checked to play out the same:
- Auto-play: the broadcast moves on at a reading pace, stops for every call, never rings the opening bell or leaves the sign-off. P or a button pauses it; a switch in Options.
- One press rings the bell, even while the welcome is typing.
- Big moments: near falls, finishes, new champions, upsets and broken streaks are marked (`h` on a beat), land brighter, and fill the sign-off's "Tonight's moments".
- A crowd meter climbs through each match and ends on the crowd score the match got.
- Longer matches have more in them (a second swing, a teased finish, chants, a second near fall), picked by hash.
- Promos and angles air as scenes: who walks out, the story a sentence at a time, the quote said by its speaker, the crowd, the desk.
- The main event is announced; the best match of the night so far is called out.
- An opening promo is judged in words, not scores out of 10.
- Fixes found while playing: a catchphrase could go to somebody not in the promo; the owner's verdict repeated itself and praised while marking down; a C read "Died in front of them"; the desk countdown cut off the number of weeks.

Next ideas for the show: rival shows the same week (needs the rivals to run before the player's show), crowd signs and chants for the hottest acts, a replay that plays back at auto pace.

The flaky map check in `app/tests/desk.js` (13 October) was the map redrawing after a resize. The test now samples until it settles; three runs in a row pass.

Intermittent (13 October): `app/tests/roster.js` failed once in seven runs after the market got pages; six reruns passed and the failure was not caught again. Rosters differ run to run, so a check may depend on who is in the game.
