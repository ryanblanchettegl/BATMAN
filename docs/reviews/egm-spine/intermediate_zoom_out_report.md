# Stage 8: intermediate zoom-out of docs/plans/spine.md (31 October 2026)

Reviewer: `egm:egm-zoom-out` (fresh context; read stages 5–7). Verdict: **needs rework, fixable**. Adding every requested fix as new prose would double the blueprint and over-build it. Each addition has to be paid for with the cuts stage 5 proposed.

## 🔴 Blocker: fix the gate without adding attribution machinery
- The 0.80 ledger share cannot be reached: the ledger moves popularity by only ±0.3 × stake/2, while the season's popularity comes from show grades (baseline: pop about 4%, trust 1.6–4.5%).
- Crediting "the shows that paid a line" adds a second attribution layer and is easy to game.
- **Proposed:**
  - drop the 0.80 ledger share as pass/fail;
  - keep MASTER row 1's other gate (direct decision share at least the L2 baseline + 10 points on pop and trust) as the gate;
  - report the ledger share as information only until a season of data exists;
  - change MASTER row 1 in the same commit.
- **Ryan decides**: row 1's gate is his approved text.

## 🟡 Major: name causes by kind, not by line id
- L1 is done and there is no `meterAdd`: delete the prerequisite paragraph.
- Use `ledger:<kind>` (about 9 causes), marked as a decision, rather than one cause per line, which would bloat `S.cz`.
- One sentence should say that this is a deliberate exception: settlement runs inside engine phases, but the player made the promise.

## 🟡 Major: the cuts must land with the additions
- **Magazine:** move it to MASTER row 5 (the media voice). The month ceremony becomes a ledger block on the big event's After the show. This makes Ryan's Q13 answer moot. **Ryan decides.**
- **Year's verdict:** keep it to the kept/broken summary plus the owner's letter.
  - Drop the three-choice goal that opens a stake-3 line.
  - The −3 trust for a promise-free year (Ryan's Q10) is nearly unreachable while rule 7a holds. **Ryan decides.**
- **Anti-farming:** keep one guard. Dropping the 3-per-card cap removes the tie-break and the "5 due, 3 pay" risks.
- **The `to:` field:** replace it with a `crowd` flag derived from `kind`.
- **Replaces:** drop `E.openThreads`/`S.open` from "Replaces" unless it really gets a migration.

## 🟡 Major: each source keeps its own window
- Push sites already set `due` today: shots +4 to +12 weeks, `o_strong` +3, `o_elevate` +7 (`engine/65-you.ts`).
- One sentence replaces the 110-word windows paragraph: the source sets `ripe` and `due` in weeks; the ledger adds only the ripe/early split.
- Feud endings stay the one exception.

## 🟡 Major: keep Alternatives and Risks short, and reuse what exists
- **Alternatives, three bullets:**
  - extend `S.quests` in place (give it honest weight: the ledger is mostly `S.quests` plus a ripe week and a stake);
  - separate promise, preview and clock systems;
  - per-card cap vs farming test.
- **Risks:**
  - fuzzy lines keep today's judgment (`QEND`/`directiveDone`, `engine/65-you.ts:201–208`);
  - list the call paths into the release filter (`40-week.ts:20`);
  - at the 8-line cap the Director makes no offer, and rule 7a is met.
- **Problem, Goals, Non-goals:** a few lines each. Non-goals take the magazine, rival ledgers (Q11) and memory traits (Q12).

## 🟢 Nits
- Stakes: one formula and one example (−12 × s/2; shot −18 × s/2; cap −20). Tunables go under `LEDGER_W`.
- Glossary: one "Terms" line linking MASTER and the 0a* task ids.

## Decisions for Ryan
1. MASTER row 1 gate wording.
2. Move the magazine to row 5 (makes Q13 moot).
3. Keep or drop the year-goal mechanic and the −3 trust (Q10).
