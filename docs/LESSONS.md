# Lessons (one line each, newest last; read the last 10 at boot)

Format: date · what went wrong or was wasted · the rule or skill that prevents it. A lesson seen twice moves into `docs/MASTER.md` or a skill.

- 30 Oct · first master stated counts from memory (111 modules, 66 tests) and the critic caught it · count with `ls | wc -l` before writing any number.
- 30 Oct · the queue did not follow the review's own thesis · after writing a thesis, rebuild the queue from it in the same change.
- 30 Oct · gates written as taste ("Ryan can say") cannot be checked · every gate is a number a script checks; taste gates go to Ryan's hour of play only.
- 30 Oct · a 95 KB CLAUDE.md loaded every session · keep always-loaded text under 17 KB; detail lives in `docs/notes/`.
- 30 Oct · gates named metrics the game does not have ("wins") · check a metric exists in `S` before writing a gate on it.
- 30 Oct · calibration set included the plan being judged · calibrate only on frozen, finished code changes.
- 30 Oct · sized a refactor by guess ("about 8 modules"); real was 22 files and 40 writes · count write sites with grep before sizing any refactor.
- 30 Oct · a plan claimed Suggest never pays promises; the engine already does · read the current code path before stating how a system behaves.
- 30 Oct · a coverage test read 100% because the instrument covered everything by construction · every measurement test needs a case that must fail (inject a change outside the instrument).
- 30 Oct · a cleanup `pkill -f <pattern>` matched its own shell and killed the run · never pkill by a pattern that appears in the same command line; use the background task id.
