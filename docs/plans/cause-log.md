# The cause log (MASTER §7 row L1)

Tier L tool: short blueprint, no vault (Ryan, 30 October: "start the cause log now"). It measures the game; it never changes play.

## What it does
Every change to four running meters is booked to a named cause, and each cause says whether it was a player decision:

| meter | read from |
|---|---|
| cash | `P.cash` (the player's company) |
| popularity | `P.image` |
| owner trust | `S.trust` |
| morale | the mean of `w.morale` over the player's roster |

The fifth meter, crowd score (`rep.cs`), is a per-show result, not a running total: the log keeps its season sum and count for the player's shows (`cs`).

## How (changed from the plan in MASTER, and why)
MASTER planned a `meterAdd()` funnel at every write: about 22 files for cash and 36 to 39 for morale, each edit risking a change in play. Instead the log takes **frames**: a frame snapshots the four meters when it opens and books the change when it closes, minus what its child frames booked, so nothing counts twice.
- **Every `E.*` function called from outside the engine is a frame** (about 500 are wrapped; the engine's own calls to `E.*` belong to whatever called them, so they can never be booked as a player decision, and a cause is marked a decision only when it moved a meter). A function that answers a choice is a decision (`d:<name>`, e.g. `d:resolveEvent`, `d:release`); one that runs the game is not (`show:night` for the player's show, `other` for the rest of the week, `booking aid` for Suggest and its helpers).
- Each weekly hook (`WEEKX`) and show hook (`SHOWX`) is a frame named after the first engine function it calls (`week:pressWeek`).
- Phase markers inside `E.endWeek` name its parts: rival shows, the books, roster upkeep, feuds, promises, rival hiring, next week.
- **Nothing is lost:** a change made outside every frame is booked as `untracked` when the next top-level frame opens.
- **Morale is split:** the roster mean moves either because moods changed (people on the roster at both ends of a frame) or because people joined or left. The second part is booked as `roster mix:<top-level cause>` and is a decision when that cause is (a release by the player).
- A frame books to the week it opened, so a season's last week stays in that season.
- Open frames live on `S` as a property that is never saved; a frame left open is closed and counted in `bad`.
The log only reads the game, so `test-golden.js` stays identical; its state lives in `S.cz`, left out of the golden fingerprint like the Director's `S.dir`. It never calls `rnd(S)`.
Cost: one roster scan per top-level frame (about 8 µs; a redraw of about 100 calls costs under 1 ms), checked by the test. Known limits: morale changed outside every engine call would land in the next frame rather than `untracked` (screens never write `S`, rule 1); a frame books the net change, so a gain and a loss inside one frame cancel. Gross flows would need the write-site funnel; the bot report does not need them yet.

## Data
`S.cz = {y, sum: {meter: {cause: [signed, abs]}}, dec: {cause: 1}, cs: [sum, count], bad, r, last}`: the current season (48 weeks) and the last one, so a save carries at most two seasons of sums (a few KB).

## Gates
- `test-golden.js`: all games identical.
- `test-cause.js` (60 weeks, 3 seeds, 3 companies): booked changes add up to the real change (± 0.5%); `other` ≤ 5% and `untracked` ≤ 1% of each meter (median); every frame closes; no hook falls back to a number; a change made outside every frame shows up as `untracked`; a release books to `d:release` and moves morale through `roster mix`; errs 0, NaN 0.
- `E.causeInfo(S)` returns the season's table for the bot report (row L2).

## For the bot report
Trace share counts each cause once. Roster mix is booked under the top-level action it happened in (`roster mix:d:release`, `roster mix:other`), so it counts as a decision exactly when that action was one. It is never added on top of the mood change, so nothing is counted twice.

## Handoff
Row L2 reads `E.causeInfo` to compute trace share; the spine (row 1) adds ledger lines as decisions.
