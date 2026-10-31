# Stage 5: zoom-out review of docs/plans/spine.md (31 October 2026)

Reviewer: `egm:egm-zoom-out` (fresh context). Context: docs/MASTER.md, docs/reviews/2026-10-30-game-review.md, linked docs. Verdict: **needs rework**. 1 blocker, 4 major, 2 nits.

## 🔴 Blocker: the gate rests on a `meterAdd` that will never exist
- §3 (line 29), §7 trace-share bullet (line 62) and MASTER row 1 define the 0.80 gate over `meterAdd` entries.
- L1 deliberately did not build `meterAdd`: `docs/plans/cause-log.md` replaced the write-site funnel with frames (`engine/99-zzcause.ts`); causes are named after the `E.*` function or hook, not a line id.
- **Fix:** make ledger pay and break their own cause in the existing cause log (e.g. `ledger:<kind>`, marked a decision, line id on the frame). Restate the gate in `E.causeInfo` terms; fix MASTER row 1 in the same commit.

## 🟡 Major: the month ceremony builds the magazine (0af) inside the spine
- MASTER row 5 merges press, podcast, Web and magazine into one media voice; building the magazine now adds a screen row 5 must merge away.
- **Proposed:** the month ceremony reads the ledger in an existing slot (the big event's After the show), no cover pick; leave the magazine to row 5.
- **Note for Ryan:** this contradicts your answer to vault question 13 (cover cost only for jealous acts), which assumes a cover pick.

## 🟡 Major: the year's verdict adds mechanics beyond the ledger summary
- Owner letter, a three-choice goal that opens a stake-3 line, and −3 trust for a promise-free year.
- The −3 overlaps rule 7a's "every show ends with ≥ 1 open line": if that holds, a promise-free year almost never happens.
- **Note for Ryan:** the −3 is your answer to vault question 10 ("counts against you").

## 🟡 Major: two claimed replacements have no migration
- `E.openThreads` (`engine/82-wishes.ts:148`, reading `S.open`) is a different store from `S.quests`; §7b maps only `quests.push`. Map `S.open` to a kind or drop it from "Replaces".
- Booking demands 0aq: a kind is defined, but nothing says what code is removed.

## 🟡 Major: altitude drops into tuning detail
- The 3-line tie-break, "lowest id", the 40-line save cap and the 8-shown cap belong in a tunables appendix under `LEDGER_W`.
- The 3-lines-per-card cap duplicates the farming test as an anti-farming guard; keep one.

## 🟢 Nit: §2 `to:` field
Five audiences, but the only stated use is "crowd lines only" for popularity. A `crowd` flag, or deriving it from `kind`, is enough.

## 🟢 Nit: line 3 `S.quests` count
Given as a range plus a grep recipe. State it once or drop it. (§7b push-site claims verified: 26 sites in 13 files.)

## Reuse confirmed
`jealOf` (`engine/66-relations.ts:53`), `feudPayMult` (`engine/21-living.ts:74`), `youRemember`, `relBump`, `E.feudPlan`, `test-balance.js`, `test-golden.js`.
