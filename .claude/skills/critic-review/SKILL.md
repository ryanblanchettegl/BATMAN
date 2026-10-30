---
name: critic-review
description: Use right after every feature, setting or engine change is built in WrestleCraft, before the tests, the commit and the push (rule 9j). A separate agent, an expert critic, scores the change 1 to 10; only 8.5 or higher goes forward (golden rule 1, Ryan 30 October).
---
# critic-review

Rule 9j (Ryan, 29 October): the order is build, critic review, tests, commit, push. Never commit or push before the critic passes the change. Golden rule 1 (Ryan, 30 October) raised the bar: only a change the critic scores **8.5 or higher** goes forward to merge and the live page. Scores may be given to one decimal.

1. Find the change: what is built and not yet committed (`git diff -- . ':!dist' ':!engine.js'`), and the blueprint it builds (`docs/plans/<feature>.md`).
2. Launch a separate agent (the Agent tool, `general-purpose`) briefed as **an expert critic**: a senior game designer and engineer who has shipped management sims (Football Manager, TEW, RimWorld, Crusader Kings) and is hard to please. Give it the repo path, the diff range, the blueprint, and `CLAUDE.md`'s rules. Ask it to read the code, run the feature's own test, and judge:
   - Does it do what the blueprint and Ryan's answers say?
   - Is it fun and readable for the player (rules 7, 7a, 8), and does it fit the look (rule 2a)?
   - Is it sound: correctness, edge cases, balance, determinism (never `rnd(S)` where it should not be), tests that really check it?
   - Is the code clear and in proportion?
   **This rubric is canonical; every critic brief points here, never to its own.** Score with it, each 1–10, total the mean: **fun** (does it create a question the player wants answered next week?), **spine** (does it feed the promise ledger / Director and hand the next phase something, rule 7a?), **sound** (correctness, determinism, tests that check it), **readable and on-look** (rules 2a, 7, 8), **cost** (code and tokens in proportion). Anchors: 10 = would ship in Into the Breach; 8.5 = clean, fun, nothing to cut; 7 = works but adds noise; 5 = a chore.
   It returns a score from 1 to 10, the reasons, and a short list of what would raise it, most important first. It must not edit files. Brief it with paths and the diff range, not pasted code (golden rule 3).
3. 8.5 or higher: run the tests (`node tools/headless-tests.js`, `node test-golden.js`, the browser tests for the section touched), then commit with the score and one line of reasons, and push.
For tier L and Art, run two critics independently and take the median. Log every score in `docs/notes/critic-log.md`.
4. Under 8.5: fix what the critic named (most important first) and review again, still uncommitted, with a fresh agent. Repeat up to 3 rounds; then bring Ryan the critic's points instead of looping. Stop early once it scores 8.5 or higher, or bring Ryan the critic's points if a fix needs his decision.

## Vision critic (pages and art)
Give the agent a screenshot at 1920x1080 (and 2560x1440) from Playwright plus the approved baseline. Rubric, each 1–10: **hand-made look** (rule 2a: cut paper, marker lettering, no old window chrome), **readable** (dark on light, running text in Patrick Hand at a comfortable size), **one choice is obvious** (what to press next), **fits** (no clipping, no page scroll, 22/56/22 where rebuilt), **consistent** with the approved pages. Total is the mean.

## Calibration set
Frozen past code changes to re-score every 5th review (never the plan under review): the Director step 5 commit, the skill tree respec commit (`fd58377`), and the movesets blueprint commit (`e48af98`). Their first calibrated scores are recorded in the log on first use. Record the re-scores in `docs/notes/critic-log.md`.

Stop rule: if a score moves by 1 or more between rounds with no change to the files under review, discard both and escalate to Ryan.
