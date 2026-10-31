# Bot baseline (MASTER §7 row L2), 30 October 2026

`node tools/bots/report.js`: model lta, seeds 3/11/29, 96 weeks, medians over complete seasons only (n/of shown).
**Direct** trace share = the player's own answers and actions; **booked** = direct plus what the player's own shows did. The spine (row 1) gates on direct, for popularity and trust.

| bot | season | complete | share | cash | pop | trust | morale |
|---|---|---|---|---|---|---|---|
| thoughtful | 1 | 3/3 | direct | 0.8% | 4.1% | 4.5% | 17.7% |
| thoughtful | 1 | 3/3 | booked | 0.8% | 92.5% | 63.5% | 37.1% |
| thoughtful | 2 | 3/3 | direct | 0.8% | 4.6% | 1.6% | 23.8% |
| thoughtful | 2 | 3/3 | booked | 0.8% | 98.5% | 52.7% | 37.4% |
| suggest | 1 | 2/3 (low n) | direct | 1.5% | 2.5% | 3.6% | 21.3% |
| suggest | 1 | 2/3 (low n) | booked | 1.5% | 93.5% | 52.1% | 37.5% |

- Weeks 1–3 grade: thoughtful B (73.0), Suggest C- (50.7).
- Suggest was fired on all 3 seeds (weeks 22, 82, 89), so it has no complete second season.
- Desk task+matter words, week 1 (headless count): 22. Row 2 needs its own browser count of the desk page.
- Cash is about 1% for both bots: show money is held in the ledger and settles in the weekly books (`week:books`), so it is booked there. Cash is not used in any gate.
