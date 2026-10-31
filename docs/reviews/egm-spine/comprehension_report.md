# Stage 6: comprehension test of docs/plans/spine.md (31 October 2026)

Reviewer: `egm:egm-comprehension` (fresh context, the target document only).

## What this proposes
Every promise the game makes (a promised win, a title shot, a feud ending, a rematch, a debut, a network or sponsor target, an owner's directive, a booking demand) becomes a typed line in one list, `S.ledger`, which replaces `S.quests`, open threads, the run-sheet promise flags and booking demands. Each line has a payoff window (opened, then ripe, then due) and an engine-set stake from 1 to 3. A card pays at most 3 lines. A line paid while ripening pays full; paid early it pays less and costs some crowd score; broken it costs morale, momentum, trust and popularity, scaled by stake. Expired lines cost nothing. The UI previews in words what each pick pays or breaks. Three ceremonies read the ledger: a weekly stamp, a monthly magazine where the player picks the cover story, and a yearly verdict from the owner. Constraints: every show must leave at least one open line, nothing in the ledger is random, every pay or break goes through `meterAdd`, and at least 80% of the trace share must come from ledger lines.

## How the existing system works, per this document
Promises live in `S.quests`, pushed from 26 sites in 13 files (types win, shot, dream, network/netvow, sponsor, prove and three o_* owner types). Fixed weights live in `engine/40-week.ts`: a broken shot is −18 morale, a broken win −12 morale and −2 momentum. Kept wins pay +4 to +6 at sites such as `34-night.ts`. Feuds pay through `E.feudPlan`/`feudPayMult()`. A release filter drops a released wrestler's quests. Suggest pays affordable wins and title shots falling due. `meterAdd` does not exist yet and must come first, as MASTER L1.

## Findings
1. 🟡 **Major. §3 table vs "Due, exactly" (l.18–25): contradictory transitions.** opened → ripening is "week ≥ ripe" in the table but "the payoff would land best now" in the ripening row. Due is "week ≥ due" in the table, but "the last show before `due`" in the paragraph. Which trigger is authoritative?
2. 🟡 **Major. §3 "Windows by kind" (l.27): show-relative windows typed as weeks.** "Weeks counted from `opened`", yet most windows are in shows or events. How does a show-relative window become a week number? Also unclear: "paying it counts as ripe" (network, sponsor) and "owner's directive: as the directive says".
3. 🟡 **Major. Cap vs handoff (Q3, §7).** Eight shown, 40 kept, and a mandatory Director offer when nothing opened: what happens at the cap? "Eight shown" also does not match the desk's three (§4).
4. 🟡 **Major. Stake rule (l.11).** "The face of the company" maps to no kind. The `dream` quest maps to "rematch or dream match", but the kind list has only "rematch owed": what stake and window does a dream match get?
5. 🟡 **Major. Undefined, load-bearing references:** the Director and its budget/tags; 0ao, 0aq, 0ap, 0af, 0ah, "vault 7"; MASTER rows, rules 7a/9, gates 1–3, the trace-share gate; Suggest and the thoughtful bot; `youRemember`, `relBump`, `QEND`, `hasQuest`; heat, freshness, big night / big event / flagship; 22/56/22, fog of war, the arc's payoff, crowd lines. "The full rule is 0ap's" delegates to another document.
6. 🟢 **Nit. §6 (l.50).** Is "title shot −18" stake-2 only and scaled by s/2? The −27 → −20 example implies it is.
7. 🟢 **Nit. §5 era row vs Q10.** "A year with no promises made" vs "no lines kept or broken": which costs −3 trust?
8. 🟢 **Nit. §8.** Question 13 sits between 10 and 11 under a heading that says "in this order".
9. 🟢 **Nit. l.3.** The status line is dense and does not explain "promised-win flags" or "open threads".
