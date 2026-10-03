# Plan: contract clauses (wish 40)

Not started.

## What it is

Dates per month, a merchandise share, paid travel, a no-cut promise, outside dates and a title promise. A talk goes back and forth two or three times before it settles.

## What exists

- `E.ask`, `E.sign`, `E.renew` in `src/90-api.js` and `src/75-people.js`: a wrestler asks for a wage and a length.
- Job terms for a booker (`E.JOB_TERMS`): a small version of the same back-and-forth. Copy its shape.
- Road wear (`w.rd`) and travel level (`P.trv`): paid travel can lower road wear for one person.
- Merchandise lines (`P.lines`): a merchandise share takes a cut of a wrestler's own lines.
- Creative control (`w.cc`) and holdouts (`w.hold`) already live in `src/86-room.js`. A clause is a way to promise one of them up front.

## Steps

1. Data: `w.clauses = {dates, merch, travel, nocut, outside, title}` with defaults, and a `clauses` field on `E.ask`'s result.
2. A negotiation object on the wrestler: round 1 to 3, what they want, what you offered, a mood.
3. Each clause has a price and an effect: dates cap how often they can be booked, a merchandise share moves money from lines to the wrestler, paid travel halves their road wear, a no-cut promise stops you releasing them for two years without a payout, outside dates let them work elsewhere on a fixed week, a title promise creates a `shot` quest.
4. A contract pop-up with the clauses as toggles, the cost of each, and "they would accept" odds (an attempt with a percentage and a list of what helps and hurts).
5. Breaking a clause is a morale hit and a news line. Tests for each effect.

## Risks

- Too many toggles on a phone. Show at most three clauses a wrestler cares about, chosen by their traits.
- Save compatibility: all fields are new, so a missing `clauses` means "none".
