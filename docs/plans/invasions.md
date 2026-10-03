# Plan: invasions (wish 66)

Not started.

## What it is

A cross-promotion story where a rival's wrestlers appear on your shows. Both sides must agree the winners. Done badly, one side looks weak for a year.

## What exists

- Supershows and wars (`startXf`, `E.xfPropose`, `endXf`) in `src/80-world.js`: guests from a rival, a series score, an end-of-arrangement report.
- Working agreements (`S.agree`) in `src/89-regions.js`: a partner who can be asked to cooperate.
- Rival temperament (`E.temperOf`): a raider invades readily, a gentleman does not.
- The saga (`E.sagaInfo`) and the news for story lines.

## Steps

1. Extend `S.xf` with `kind: 'invasion'`: eight weeks, six invaders (two top names, four others), a "winners agreed" ledger.
2. Before it starts, a negotiation with the rival owner: how many of the first six matches each side wins. Their temperament sets what they accept. An attempt with a percentage.
3. During it, each match result is checked against the ledger. Breaking it costs relations and the rival's news line says so.
4. At the end, each side's popularity moves by the series, and the weaker side "looks weak for a year": a hidden malus on draw and merchandise that fades over 52 weeks.
5. The report names the winner of the war and the loser's loss of face.
6. A browser test: propose, agree, run two shows, see the series score.

## Risks

- The existing `xf` machinery assumes one arrangement at a time. Keep that.
- The ledger must survive injuries (a named winner who cannot work).
