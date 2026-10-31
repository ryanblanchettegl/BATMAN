# Stage 7: critic review of docs/plans/spine.md, round 1 (31 October 2026)

Reviewers (fresh context, run in parallel): `egm:egm-design` and `egm:egm-structural` (against the feature-spec standard), `egm:egm-style` (plus MASTER rule 8). All three completed. Verdict: **FAIL**, 3 blockers.

## 🔴 Blockers
- **design-1-1 / structural-1-1. No "Alternatives considered".** One design is proposed and none rejected: for example extending `S.quests` in place, separate promise, preview and clock systems, or no per-card cap. The standard fails a spec without this.
- **design-1-2 (= zoom-out blocker). Attribution assumes `meterAdd`, which L1 replaced with frames.** Pays and breaks inside `E.endWeek` would land under phases like `week:promises`, not a line id, so the trace-share gate has nothing to read. Fix: a child frame per settled line, named by its line id (`ledger:<id>`), or justify the write-site funnel.
- **design-1-7. The 0.80 gate is probably unreachable by construction.** The baseline is about 4% (pop) and 1.6–4.5% (trust). In §6 the ledger's only popularity effect is ±0.3 × stake/2 on crowd lines, while the season's popularity swing comes from show grades. Add an estimate, or redefine the gate (for example, ledger plus the shows that paid a line).

## 🟡 Major
- **design-1-3. Stake-3 title shot formula.** −18 × 1.5 = −27 capped to −20 vs −12 × 1.5 = −18. Give one formula and a worked example per kind.
- **design-1-4. "Due = ripe + 2, as `S.quests` today" is false for title shots.** Today's shot windows are +4 to +12 weeks (`34-night.ts:171`, `40-week.ts:191`, `60-rpg.ts:50`, `97-clauses.ts:45`, `87-goals.ts:78`). Keep each source's window, or justify the balance shift.
- **design-1-5 / structural-1-2. No Risks section, and open risks:**
  - conflicting lines;
  - the 8-cap vs the forced handoff;
  - what breaks the same night when 5 lines are due but only 3 can pay;
  - how fuzzy lines are judged paid (o_strong, o_elevate, network targets).
- **design-1-6. The release rule's triggers are not listed.** Which call paths are "a booker's release" vs a contract expiry or a raid (`40-week.ts:20` drops quests for every departure).
- **structural-1-3/4. No Goals and Non-goals, and no Problem statement.** The motivation (+8 in the review's thesis) lives only in the game review.
- **structural-1-5. The gate is incomplete against MASTER row 1.**
  - The direct-share +10 points gate is missing.
  - The Book the show strip has no empty state.
  - "Per meter" doesn't say which meters.
- **style-1-1…7. Sentences that are too long (rule 8):**
  - status line (l.3);
  - windows paragraph (l.27, about 110 words: make it a table);
  - pay rules (l.29);
  - magazine cell (l.40);
  - broken-row cell (l.22);
  - tie-break (l.25);
  - "thinking booker" vs "thoughtful bot" (l.63).

## 🟢 Nits
- Vault numbering: Q13 sits before Q11 and Q12.
- "7b" has no 7a heading.
- Group labels are bold text, not headings.
- `40-week.ts:143` should read about 147–152.
- The quest count is given as a range.
- Undefined terms: golden-identical, fog of war, farming test, trace share, pencil marks, 22/56/22, 0ao/0aq/0ap/0af/0ah, `s`.
- Figurative lines (l.6), "usually" (l.32), "so it should lose" (l.61).
- One citation form for Ryan's answers.

## Verified as accurate
- 26 `quests.push` sites in 13 files, and the per-type counts.
- `feudPayMult`, `jealOf`, `hasQuest`, `QEND`, and Suggest's handling at `99-fog.ts:239–244`.

## Traceability
| finding | reviewers | also raised in |
|---|---|---|
| meterAdd attribution | design | zoom-out (blocker) |
| alternatives missing | design, structural | — |
| gate unreachable | design | — |
| vault order | design, structural, style | comprehension |
| replacements without migration | — | zoom-out |
| ripe/due contradiction, windows typed as weeks | — | comprehension |
