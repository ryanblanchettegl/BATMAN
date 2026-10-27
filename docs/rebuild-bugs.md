# Old bugs found during the TypeScript rebuild

Ryan's answer (docs/plans/typescript-engine.md, question 4): an old bug found while moving the engine is kept exactly as it
is, logged here, and fixed as its own change after the move, so the recorded games still prove the move changed nothing.

| Found | Where | What | Fix after the move |
| --- | --- | --- | --- |
| 27 October, step 2b | `engine/10-match.ts`, the match context `ctx` | The object literal sets `rep` twice (esbuild warns: duplicate key). Both are the same value today, so it is harmless, but it is a slip. | Fixed 28 October: the second `rep` removed; the recorded games still match. |
