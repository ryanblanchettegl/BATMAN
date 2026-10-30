# The spine: promises, previews and three clocks (blueprint)

Status: gate 1 written and gate 2 answered by Ryan, 30 October 2026 (all 13 questions); gate 3, Ryan's go-ahead: "Go, after L1"; no code until Ryan answers and says go. Merges TASKS.md 0ao moves 2, 3 and 4. MASTER §7 row 1. Director tag: problem and chance (a promise coming due is both). Replaces: `S.quests` promises (recount with `grep -rho "S.quests" engine | wc -l`; 56 to 59 depending on the pattern), open threads (`E.openThreads`), promised-win flags on the run sheet, booking demands 0aq (become ledger kinds).

## 1. Aim
One readable line from every choice to every result. Every promise the game makes is a ledger line with a payoff window. The card is the act of paying them off. The week, the month and the era each end on a ceremony that reads the ledger. "One more turn" lives in a line that is always about to come due.

## 2. A ledger line
`S.ledger: Line[]`, `Line = {id, kind, who: id[], to: 'crowd'|'wrestler'|'owner'|'network'|'sponsor', opened: week, ripe: week, due: week, stake: 1|2|3, src: cause id, state}`.

**Stake** is set by the engine when the line opens, never by the player: 3 for anything about a title or the face of the company, or opened by the owner; 2 for a promised win, a rematch, a feud ending and a network target; 1 for a sponsor's ask, a debut and a booking demand. Morale losses from one break are capped at −20 per wrestler (so a stake-3 title shot costs −20, not −27).

Kinds (first set): a promised win, a title shot asked for, a feud's ending (ripe in `E.feudPlan`), a rematch owed, a debut planned, a network target, a sponsor's ask, an owner's directive, a booking demand (0aq).

## 3. States and what moves them
| state | entered when | leaves when |
|---|---|---|
| opened | a choice makes a promise (an answer at your door, a matter, a call on the air, a feud started) | week ≥ `ripe` → ripening |
| ripening | the payoff would land best now (heat high, freshness falling, a big night ahead) | paid on a card; or week ≥ `due` → due |
| due | the last show before `due` | paid; or the show passes → broken |
| paid | the card delivers it (a match, a result, a segment) | closed; the night's ceremony names it |
| broken | the window passes, or the booker reverses it | closed; `youRemember` and `relBump` on everyone in `who`; the Director may bring it back on a big night as a call (tag: problem; at most once a month, counted in the Director's budget; the full rule is 0ap's) |
| expired | the reason went away (the wrestler left, hurt long term) | closed, no penalty |

**Due, exactly.** A line is due at the last player show (weekly or big; not a house show, not a cancelled one) whose week is < `due`. If the company has no show before `due`, the window stretches to its next show. A card pays at most 3 lines. When more than 3 could pay, the 3 settled are the highest stake first, then the earliest `due`, then the lowest id; within the card they settle in running order, the main event last. A headless test books a card that could pay 5 and checks which 3 pay.

**Windows by kind** (weeks counted from `opened`): promised win and title shot: ripe = the next show the wrestler can be booked on, due = `ripe` + 2 (as `S.quests` today); feud ending: ripe when `E.feudPlan` phase is Boiling or Going stale; it has **no due date** unless the booker plans an ending (`f.endAt`), which becomes `due` (the booker still ends a story when they choose; living storylines' fizzle rules stay); rematch owed: ripe = the next big night, due = the one after; network target and sponsor ask: ripe = due = the show named, and paying it counts as ripe; owner's directive: as the directive says; booking demand: the next show.

Paid inside `ripening` pays most; paid early (only for kinds whose ripe week is after the next show: feud endings, rematches, owner's directives) pays less; a promised win and a title shot ripen at once, so they have no early pay; broken costs by `stake`. **Prerequisite:** `meterAdd` does not exist yet; it is MASTER §7 row L1, built and golden-identical before this. Every pay or break is a `meterAdd` with `decision = line id` (MASTER §7 L1), which is what the trace-share gate counts.

## 4. Screens (one screen, 22/56/22 where rebuilt)
- **Desk:** the three most urgent lines, each one sentence and its window in words ("ripe now", "due Saturday"). The fire with a deadline (rule 7a) is usually one of these.
- **Book the show:** a `data-t="ledger"` strip: lines this card could pay, marked as the card pays them. Preview = pencil marks in words on each pick ("pays Rook's promised win; breaks nothing"), never a percentage. Fog of war holds: the preview never says how a match will go.
- **After the show:** paid and broken lines first, stamped; then lines that opened tonight. With no line open: "No promises open: make one" and a button to Storylines.

## 5. Three clocks and their ceremonies
| clock | rings | ceremony |
|---|---|---|
| week | after each show | the grade arrives as a stamp beside the lines paid and broken |
| month | the big event | **The magazine** (0af): a cover and three stories, each a line paid or broken this month in words; the player picks the cover story (one of three): that act gets next month's crowd lean, and the two left off the cover lose 2 morale each only if they are jealous of the cover act (`jealOf()` in `engine/66-relations.ts`; shown on the choice before it is made), never the same act two months running; hands on: one new line from the cover act |
| era | the flagship | **The year's verdict** (a year with no promises made costs owner trust −3, Ryan Q10): kept and broken by kind, the arc's payoff, the owner's judgment in a letter; the player answers one question from the owner (a goal for next year, three choices), which opens next year's first stake-3 line |

## 6. Balance
**Weights.** Stake 2 is today's quest weights (`engine/40-week.ts`: a broken title shot −18 morale, a broken win −12 and momentum −2). Kept wins pay +4 to +8 morale across today's sites (e.g. `engine/34-night.ts` +4 and +6); stake 2 takes +6, the middle, and `test-balance.js` decides if it moves. Stake 1 is half, stake 3 is one and a half.

| outcome | morale (each in `who`) | momentum `w.mom` | owner trust `S.trust` | popularity `P.image` |
|---|---|---|---|---|
| paid while ripening | +6 × s/2 | +1 × s/2 | +1 × s/2 | +0.3 × s/2 (crowd lines only) |
| paid early | +3 × s/2 | 0 | 0 | 0, and the show's crowd score −0.5 (Ryan, Q6) |
| broken | −12 × s/2 (title shot −18) | −2 × s/2 (shot and win alike, as today) | −2 × s/2 | −0.3 × s/2 (crowd lines only) |
| expired | 0 | 0 | 0 | 0 |

**No double pay.** A feud ending keeps its payout through `feudPayMult()` (`engine/21-living.ts`); its ledger line adds only morale, momentum and trust, never popularity or buys. The same rule holds for any kind whose system already pays.

All numbers are tunables in one table (`LEDGER_W`), so `test-balance.js` holds; a thoughtful bot that pays ripe lines must beat Suggest by at least today's margin.

## 7. Handoff (rule 7a), saves, determinism
- Every show ends with at least one line opened or ripening. If nothing opened naturally, the Director offers one at the door (a free ask, never forced). Headless test: over 60 weeks, 3 seeds, every player show leaves ≥ 1 open line.
- Saves: closed lines fold into a yearly summary (count kept and broken by kind) with the career archive (`test-archive.js`); at most 40 lines open. Old saves are not protected in development (rule 9): `S.ledger` starts empty and old `S.quests` are dropped on load.
- Determinism: state changes never call `rnd(S)`; windows come from weeks and `E.feudPlan`. `test-golden.js` is rerecorded once when quests are replaced, in its own commit.
- Farming test (headless): a bot that opens only easy lines and pays them at once must not beat the thoughtful bot on trust or popularity over 2 seasons, 3 seeds (early pay is half, so it should lose).
- Trace share is counted by `tools/bots/report.js` (MASTER §7 L2): Σ|delta| of `meterAdd` entries with `decision` = a line id ÷ Σ|delta| of all entries, per meter per season, median of 3 seeds; pass ≥ 0.80 for the thoughtful bot.
- Suggest a card keeps today's behaviour: it pays promised wins it can afford and books title shots falling due (`E.suggest`, `engine/99-fog.ts` lines 239 to 244), but leaves feud endings, rematches, owner's directives, network and sponsor lines untimed. That timing is the gap a thinking booker opens: the thoughtful bot must keep at least today's `test-balance.js` margin over Suggest.

## 7b. Migration from `S.quests` (push sites by type)
| quest type (push sites) | ledger kind |
|---|---|
| `win` (8) | promised win |
| `shot` (9) | title shot asked for |
| `dream` (1) | rematch or dream match at a big night |
| `network`, `netvow` (3) | network target |
| `sponsor` (1) | sponsor's ask |
| (new) debut planned | debut: opened by Book a debut, ripe = the debut's show, due = ripe + 1 |
| (new) booking demand (0aq) | demand: opened by a writer, wrestler or business ask, ripe = due = the next show |
| `prove` (1), `o_strong`, `o_belt`, `o_elevate` (3, `engine/65-you.ts`) | owner's directive |

All 26 push sites (`grep -rn "quests.push" engine`, 13 files) are in this table.
Side effects that move too: the release filter (`engine/40-week.ts:20`, drops a released wrestler's quests) becomes **broken** for a booker's release and **expired** otherwise (vault 7's default); `hasQuest` keeps its inbox clause; the dream match's buy bonus (`40-week.ts:143`) stays with the big event and its line adds no popularity or buys (§6, no double pay). Reads of `S.quests` (`hasQuest`, the run sheet's promise flags, `QEND`) move to `S.ledger` in the same commit; `grep -rn S.quests engine` must return nothing after it.

## 8. Question vault (gate 2, asked one at a time, in this order)
**Feel**
1. Should a broken promise ever be forgiven without a cost (a good reason, a hurt wrestler), or is every break remembered? *Default: forgiven only for injury or a rival's signing (it expires).* **Ryan, 30 Oct: Only injury or a rival's signing (default).**
2. When a broken promise comes back on a big night (the star walks out), should the player get a warning a week ahead? *Default: yes, one line on the desk the week before.* **Ryan, 30 Oct: A week ahead (default).**
**Limits and exploits**
3. How many open lines at most before the game stops offering new ones: five, eight, or no cap? *Default: eight shown to the player; at most 40 kept in the save (§7).* **Ryan, 30 Oct: Eight (default).**
4. Can one card pay several lines at once (one match paying a win and a feud ending), and should that pay more or the same? *Default if unanswered: yes, each pays its own weight, no bonus.* **Ryan, 30 Oct: Each pays its own, no bonus (default).**
5. Two lines that conflict (paying one breaks another): show the clash on the card in advance, or let the player find it? *Default: shown as a pencil mark (preview before consequence).* **Ryan, 30 Oct: Show it on the card (default).**
6. Paying early is worth less. Should it also annoy the crowd, so it is never the safe move? *Default: no crowd cost; the lower pay is enough.* **Ryan, 30 Oct: Small crowd cost: a rushed payoff also dents the show's crowd reaction a little.**
7. Expired lines cost nothing. Could a player release a wrestler to escape a promise? Should that count as broken? *Default: a release by the booker counts as broken; only injury, retirement or a rival's signing expire.* **Ryan, 30 Oct: Counts as broken (default).**
**Edges**
8. A line whose wrestler turns, is hurt, or leaves mid-window: expire it, move it, or let the player choose? *Default: hurt or left expires; a turn keeps the line.* **Ryan, 30 Oct: Hurt or left expires; a turn keeps it (default).**
9. Can a line open in the middle of a show (a call on the air promising a rematch)? *Default: yes; it shows on After the show.* **Ryan, 30 Oct: Yes, shown on After the show (default).**
10. The year's verdict with no lines kept or broken at all: a neutral year, or a warning from the owner? *Default: a neutral year with the owner's warning letter.* **Ryan, 30 Oct: Counts against you: a year with no promises costs owner trust.**
13. Should leaving an act off the magazine cover ever cost morale? *Default: only for acts jealous of the cover act, shown before the pick.* **Ryan, 30 Oct: Only acts jealous of the cover act, shown before the pick (default).**
**The world**
11. Should rival bookers keep ledgers the player can see on the Web, with their broken promises as news? *Default: not in the first build; later on the Web.* **Ryan, 30 Oct: Later, on the Web (default).**
12. Should wrestlers with good memory (traits later) remember a broken promise longer than others? *Default: not until traits (0ah) exist.* **Ryan, 30 Oct: After traits exist (default).**
