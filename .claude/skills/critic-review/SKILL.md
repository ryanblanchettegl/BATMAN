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
   It returns a score from 1 to 10, the reasons, and a short list of what would raise it, most important first. It must not edit files. Brief it with paths and the diff range, not pasted code (golden rule 3).
3. 8.5 or higher: run the tests (`node tools/headless-tests.js`, `node test-golden.js`, the browser tests for the section touched), then commit with the score and one line of reasons, and push.
4. Under 8.5: fix what the critic named (most important first) and review again, still uncommitted, with a fresh agent. Repeat until it scores 8.5 or higher, or bring Ryan the critic's points if a fix needs his decision.
