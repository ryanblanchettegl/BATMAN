---
name: tew9-systems-transfer
description: Design and implement Total Extreme Wrestling IX style world-editor, relationship, and management systems inside WrestleCraft. Use when adding or reworking editor tables, worker relationship models, backstage politics, morale coupling, company management, or when deciding which TEW IX feature to port next.
---

# TEW IX → WrestleCraft systems transfer

> Copied into the project from `Desktop/cool stuff/` on 2026-10-28. Game rule: no TEW names or content in the game (rule 3; Ryan, 27 October: "use our own naming").

This workbook teaches an agent how TEW IX organises its simulation data, how its
relationship and management systems are shaped, and how to port those *designs*
into WrestleCraft without copying anything proprietary.

## Read this first

- `docs/research/tew9/tew9-schema-index.md` — **the capstone index**: all four database files and their lock status, every authored table (48 / 1,283 columns) and save table (39 / 800), which subsystem lives where, and what the locked files would still add.
**Start here for the complete picture**

- `docs/research/tew9/tew9-the-loop.md` — the day→show→year loop, the two currencies, the two hidden rails (momentum/perception), and the rating/popularity formulas that couple everything.
- `docs/research/tew9/tew9-system-inventory.md` — every subsystem in the game, grouped by domain, with reads/writes.
- `docs/research/tew9/tew9-settings-inventory.md` — all settings split by scope (world / company / player), including 33 Options, 32 User Preferences, products, backstage rules, production ladders, eras, narratives.
- `docs/research/tew9/tew9-options-and-create.md` — every option, all 45 creatable table types, and the full "TEW has / WrestleCraft lacks" feature list in three tiers.
- `docs/research/tew9/tew9-vs-tew2020.md` — 14 confirmed changes from TEW 2020 to IX, the design themes behind them, and which deltas are worth copying.
- `docs/research/tew9/tew-series-evolution.md` — EWR 2002 → TEW IX release archaeology: what changed each era, the seven recurring design patterns, and what to adopt per era.
- `docs/research/tew9/tew9-build-order.md` — clean-room implementation order, tick sequence, and the non-obvious traps.

**System detail**

- `docs/research/tew9/tew9-deep-show-engine.md` — **deep dive vol 1**: attendance, CE, matches, commentary/referee/agent thresholds, angle caps, segment and show rating math, ±6 growth rule, audience state.
- `docs/research/tew9/tew9-deep-people.md` — **vol 2**: ages, health, 30 skills and their threshold values, learning and caps, business skills, four-axis relationships, full contract economics.
- `docs/research/tew9/tew9-deep-company.md` — **vol 3**: sizes/importance/rankings, finance and bankruptcy, 10 merchandise levels, all five production ladders with costs, products, storylines, brands, backstage, child companies.
- `docs/research/tew9/tew9-deep-world.md` — **vol 4**: event dates and traps, multi-day series, PPV overuse, TV taping, tag experience, stables, title frequencies, alliances, training, broadcast viewership formula, world economy, narratives.
- `docs/research/tew9/tew9-deep-settings-data.md` — **vol 5**: options with numeric effects, preference flags, eras as percentage dials, databases and limits, editor matching rules, Power 500.
- `docs/research/tew9/tew9-world-editor.md` — the 45-table data model and its editor conventions.
- `docs/research/tew9/tew9-recovered-screen-map.md` — all **343 screens** recovered from `TEW9.exe` (string/identifier archaeology), including systems the handbook under-documents: round-robin tournaments, broadcaster purchase, locker-room meddling/ribbing, company pacts, takeovers, social-media decisions.
- `docs/research/tew9/tew9-real-schema.md` — the **actual database schema**: 48 tables, 1,283 columns recovered from the unlocked system `.mdb`s, with the four critical tables dissected and the six schema patterns worth copying.
- `docs/research/tew9/tew9-save-schema.md` — the **runtime/save schema**: 39 tables, 800 columns, including `Morale_Effects` (the incident ledger with four severity bands), discovered vs preset chemistry, ten agreement slots per company pair, and the name-key→UID switch.
- `docs/research/tew9/tew9-company-and-history-model.md` — the 148-column `Companies` table (office slots, in-ring rule flags, figurehead heirs, 57 region columns), the exact region taxonomy, and the match/title history tables.
- `docs/research/tew9/tew9-worker-model.md` — the 138-column `Workers` table: the exact 28 skills, four health pools, 57 popularity columns, per-alignment gimmicks, and the worker-vs-contract split.
- `docs/research/tew9/tew9-content-model.md` — `Match_Types` as a compositional rule grammar (20 props + 19 win conditions), `Gimmicks` as skill floor/ceiling requirement specs, broadcaster dated overrides, facility dual levels, and title eligibility/frequency columns.
- `docs/research/tew9/tew9-relationships.md` — the four-element pair model, chemistry, and UI surfaces.
- `docs/research/tew9/tew9-management.md` — companies, contracts, morale, scandals, alliances, history tables.
- `docs/research/tew9/wrestlecraft-gap-analysis.md` — what WrestleCraft already has, what is missing, prioritised.
- `docs/research/tew9/wrestlecraft-tew9-gap-audit.md` — REA artifact audit of `src/` plus a per-domain coverage matrix and the seven real gaps (start with this one for implementation).
- `docs/research/tew9/evidence-log.md` — how each claim was verified, and what is still unknown.

## Evidence tags used throughout

| Tag | Meaning |
|---|---|
| `[doc]` | Stated in the shipped external-editor reference document |
| `[bin]` | String/structural evidence observed inside `TEW9.exe` |
| `[code]` | Read directly from WrestleCraft source |
| `[infer]` | Reasoned conclusion — not yet verified, treat as a hypothesis |

Never upgrade `[infer]` to fact without new evidence. When you add findings, tag
them and append to `docs/research/tew9/evidence-log.md`.

## Workflow

1. **Pick a target system.** One of: relationship axes, mass editing, scandals,
   alliances, editor table coverage, notable-relationships surface.
2. **Read its reference file.** Confirm what is `[doc]`/`[bin]` versus `[infer]`.
3. **Check current WrestleCraft behaviour** in `BATMAN/src/` before writing anything.
   The relationship core is `BATMAN/src/66-relations.js`; the schema is `BATMAN/src/85-universe.js`;
   the editor lives in `BATMAN/src/86-editor.js`. After the TS switch, check `docs/ARCHITECTURE.md` for where each system moved.
4. **Design the migration as additive.** WrestleCraft stores `type` + numeric
   `strength`; TEW stores three independent categorical axes. Extend, don't replace:
   keep `strength` for the numeric model and add the categorical axes alongside it.
5. **Implement with a test first.** WrestleCraft's convention is a root-level
   `test-<topic>.js` harness plus `app/tests/`. `npm test` runs the headless sim.
6. **Verify determinism.** Call `node test-determinism.js` after touching the RNG
   path; relationship rolls must stay reproducible from the seed.

## Guardrails

- **Mechanics only.** Port rules, data shapes, and flow. Do not copy TEW's text,
  pictures, database contents, or tables of wrestler data. Ideas and game rules are
  not copyrightable; their expression and data are.
- **Do not extract the shipped database.** `TEW9.mdb` is password-protected and the
  trial licence does not grant redistribution. We describe schemas, not rows.
- **Respect the licence.** TEW IX is commercial; its EULA may restrict reverse
  engineering. Keep analysis to shipped documentation and to your own copy, and do
  not ship derived binaries or decompiled output.
- **Do not "fix" numbers by inventing precision.** If TEW's tuning constants are
  unknown (`[infer]`), expose them as tunables and label them as guesses.

## Quick map of the design difference

| Concern | TEW IX | WrestleCraft today |
|---|---|---|
| Relationship identity | pair record, 3 categorical axes `[doc]` | pair record, 1 type enum + strength `[code]` |
| Relationship magnitude | none — categories carry meaning `[doc]` | `strength` −100..100 `[code]` |
| Bulk editing | `editRelationshipMass` `[bin]` | not present `[code]` |
| In-ring chemistry | separate `Chemistry` table `[doc]` | `ring_chemistry` field per relationship `[code]` |
| Editor scope | 45 tables `[doc]` | 8 tables `[code]` |
| Scandals | `Scandals` table `[doc]` | none found `[code]` |
