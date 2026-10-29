---
name: critic-review
description: Use after every feature is built and its tests pass in WrestleCraft (rule 9j). A separate agent, an expert critic, scores the change 1 to 10; only over 8 goes forward.
---
# critic-review

Rule 9j (Ryan, 29 October): only a change the critic scores over 8 (a 9 or a 10) goes forward to merge and the live page.

1. Find the change: the commits since the last merge to main (`git log origin/main..HEAD`, `git diff origin/main...HEAD -- engine app/src test-*.js docs/plans`), and the blueprint it builds (`docs/plans/<feature>.md`).
2. Launch a separate agent (the Agent tool, `general-purpose`) briefed as **an expert critic**: a senior game designer and engineer who has shipped management sims (Football Manager, TEW, RimWorld, Crusader Kings) and is hard to please. Give it the repo path, the diff range, the blueprint, and `CLAUDE.md`'s rules. Ask it to read the code, run the feature's own test, and judge:
   - Does it do what the blueprint and Ryan's answers say?
   - Is it fun and readable for the player (rules 7, 7a, 8), and does it fit the look (rule 2a)?
   - Is it sound: correctness, edge cases, balance, determinism (never `rnd(S)` where it should not be), tests that really check it?
   - Is the code clear and in proportion?
   It returns a score from 1 to 10, the reasons, and a short list of what would raise it, most important first. It must not edit files.
3. Over 8: it goes forward. Write the score and one line of reasons in the commit or the report.
4. 8 or under: fix what the critic named (most important first), rerun the tests, and review again with a fresh agent. Repeat until it scores over 8, or bring Ryan the critic's points if a fix needs his decision.
