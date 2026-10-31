# WrestleCraft: Be The Booker — MASTER

The first thing every development session reads. Written for Opus 5.5. Loaded automatically through `CLAUDE.md`.
Owner: Ryan (decides design, art, names). Co-planner: Bill. Built 30 October 2026 from every doc, plan, review and the code.
**Precedence:** §1 golden rules > Ryan's words in this session > `docs/notes/rules.md` > everything else. Source files win on detail.

---

## 0. Session boot (do this, in order, and no more)

1. This file is already in context. Do **not** re-read `CLAUDE.md`, `TASKS.md` or the whole code map.
2. `git status -sb && git log --oneline -5` — know the branch and the last work. Read the last 10 lines of `docs/LESSONS.md`.
3. Read §7 (the queue) and pick the top unblocked item, or do what Ryan asked.
4. Open only what that item needs: the one blueprint in `docs/plans/`, the one bullet in `docs/notes/code-map.md` (grep the file name), the one skill.
5. Work the pipeline in §2. End with §9 (update this file if anything here changed).

## 1. Golden rules (Ryan, 30 October 2026 — these win)

1. **Great, not good.** Act as a master game designer. Before any addition: check which tools, skills and plugins apply (§5) and research what already solves it (`free-tools-first`). Every new addition or feature is reviewed by a separate critic agent and scored 1–10. **Only 8.5 or higher passes** (replaces rule 9j's "over 8"). Below 8.5: rework what the critic named, fresh critic, again.
2. **Art direction = three concepts.** Any art, look, style or visual-UX decision goes to Ryan as **exactly three concepts, each of which has already passed a critic run at ≥ 8.5**. Ryan picks; never decide a look alone (`design-decision` skill).
3. **Spend fewer tokens every session.** Keep this file short and current; read narrowly; delegate wide searches to one Explore agent instead of dumping files; never paste large outputs; log every saving in §10. Each session should leave the next one cheaper.

## 2. The pipeline, sized by tier

| tier | what counts | steps | done means |
|---|---|---|---|
| **S** | fix, polish, wording, tool, doc | build → tests for the area → commit | tests green, nothing else moved |
| **M** | feature inside an approved plan | S + `free-tools-first` + critic ≥ 8.5 + design skills if a page changed | S + critic score in commit, handoff to next phase named (rule 7a) |
| **L** | new mode, system, major feature | rule 9d gates (blueprint → question vault → Ryan's dated go-ahead) → `wrestlecraft-architecture` (ADR if big) → M steps → bot-booker run (§7 row 0) → `security-review` if saves/files/network/Steam | M + Director tag, what it replaces, measurable gate met |
| **Art** | any look, style, visual UX, motion | three concepts → each critic ≥ 8.5 → Ryan picks → M steps | Ryan's pick logged in `TASKS.md` |

Common to all: engine first (`engine/NN-name.ts`, `E.*`, headless test 60 weeks errs 0 NaN 0), then the screen. Commit says what changed for the player. Push the session branch, open a PR, subscribe. M and L: `impl_count += 1`; every 5th → `efficiency-review`. Nightly/milestone → live page (§6).

**Critic protocol** (`critic-review`): written rubric (fun, fit with the spine, correctness and tests, readability and look, cost in code and tokens), each 1–10, total is the mean; two independent critics on L and Art, take the median; cap 3 rounds, then Ryan decides with the critic's notes; log every score in `docs/notes/critic-log.md`. Calibration: every 5th review also re-scores 3 frozen past changes (listed in the log); drift ≥ 0.5 → recalibrate the brief. Two critics ≥ 1.5 apart → Ryan decides. Audit: each `efficiency-review` re-files a sample of 5 tier-S commits; any that was really M gets a late critic.

## 3. Hard rules (short form; full text and Ryan's quotes: `docs/notes/rules.md`)

| # | rule |
|---|---|
| 0 | Steam desktop game (Electron, `desktop/`). 1080p base, scales to 1440p/4K/ultrawide. No tablet/TV/phone/portrait layouts or tests. Every control still works by touch, mouse, keys, pad (Android later). Diorama renderer is the graphics engine: real depth, 60 fps on a modest PC. |
| 1 | Engine owns the game. Screens never write `S`; they call `E.x(S, …)` in `act()`. `test-lint.js` enforces. |
| 2 | External assets OK if free for commercial use, credited in a `CREDITS.md` beside their tool, shipped offline. Fonts embedded. |
| 2a | The look: the workbench, made by hand. Black construction-paper board, torn cream windows, navy strips with yellow marker, cut-card buttons slightly off straight. Permanent Marker / Patrick Hand / Gochi Hand. No dot matrix, no CRT. Wrestlers flat colour, one shadow. Very readable. `app/styles/craft.css` last. |
| 3 | Original content only. No real promotion/wrestler/title/event names. Public-domain world rules. Parody world allowed (changed joking names, no logos/photos, disclaimer). |
| 4 | No dice wording: "attempts" with % chance and what helps/hurts. |
| 5 | Every control a real button/select/input with a `data-t`. Nothing hover-only. |
| 5a | Top: menu bar (company + date right), notification bar. Bottom: one line — numbers, Help/Options/Music, SPACE key right. Never wraps at 1920×1080. Tasks live on the desk only. |
| 5b | One screen, no page scroll (`.onescreen`, `fits(page)`). Windows may scroll inside. Wrestler lists scroll. |
| 5c | Wrestler always drawn full length beside wrestler lists. |
| 5d/5e | World Editor: dropdowns for word choices; labels are short nouns; "Included" for shipped content. |
| 5f | New/rebuilt main pages: 22 / 56 / 22 (list · wall · picked pane). Old pages move one at a time with Ryan's go-ahead. |
| 6/6a | Sections: Office, Booking, Roster, Web, Manage, Company. Manage holds choices; Company and Web are information. Choices = buttons that open pop-ups. |
| 7/7a | Readable first; every action shows its result. No clean stopping point: Office → Booking → Show each hands the next something unresolved. |
| 8–8c | Plain writing, no em dashes. Stars after the bell only, never forecasts. Show = letter grade vs its own crowd (`crowdScore`, `E.repGrade`, `E.showVerdict`). Money: `cash()` short, `full()` headline. |
| 9 | Save key `ewf9000-save-4`. Old saves not protected during development (Ryan, 29 Oct). |
| 9a/9f | Approved plans run unattended. Tests are the gate: nothing merges unless every headless test passes. |
| 9b/9c | Relationships are the centre (`relBump`, `youRemember`). Every booking choice is a scene (`SEG_SCENES`, `BEAT_SCENES`). |
| 9g | Every new system names its Director tag (problem/chance/colour), what it hands the next phase, what it replaces. |
| 9h | Ryan plays an hour at every milestone; his notes become the next plan (`design:research-synthesis`). |
| 10/10a | Small commits; tick `TASKS.md` in the same commit. `VER` (`app/src/store.ts`) moves after ≥ 5 changes. |
| 10b | **Always rebuild before you commit** (Ryan: "always update dist"): a change to `engine/`, `app/` or `universes/`, or a merge from main, runs `node build.js` and commits `engine.js` and `dist/` with it. CI fails when they do not match the source. |
| Never | `Math.random` or the clock in the engine (use `rnd(S)`; flavour via `h01()`). No `rnd(S)` at all in: Director, relations, net, podcast, sound. Never omit keys on Preact lists. No model IDs in game text, source or PR bodies (the commit attribution line is fine). |

### Things that bite (full list: end of `docs/notes/code-map.md`)
- `node build.js` before any test; tests open `dist/index.html` and `engine.js`.
- `calibrate()` sets crowd expectations from sample shows: after a scoring change compare rating minus expectation, never raw ratings.
- A game year is 48 weeks (12 × 4, `cal()`).
- While a show is on air the report is `S.live.st.rep`, not `S.reports[0]`.
- A call ignores input for 400 ms; browser tests wait before picking. Calls have cooldowns in `S.lcd`: clear it to test one (`app/tests/calls.js`).
- Browser tests start with tasks as reminders (`E.setGate(S,false)`); pass `gate: true` to test stopping. They run on the public-domain world unless `uni: 'parody'`.
- A show's city is the next road stop; `venueFor()` still burns one number so seeds replay.
- New symbols need `tools/build-font.py`. A pop-up focuses its close button unless a control has `data-first`.
- One-screen pages: menu and bottom line must not be offset (`fits(page)` checks).
- Headless sims never sign anyone, so rosters shrink: that is the sim, not a bug.

## 4. The game in one screen

**Pitch:** you are the booker. Build the card, run the live show from the gorilla position, and live with people who remember every call. Paper-diorama broadcast. Extreme Warfare / TEW tradition, with a stronger live show.
**Loop:** Office (desk: a fire with a deadline, tasks, backstage people) → Booking (run sheet on a 2h/3h clock; chemistry, wear, morale, promises; fog of war, agent reads) → Show (live broadcast, 2–3 calls, stars, grade) → After the show (one matter to answer) → desk. Clocks: week (grade), month (big event), year (flagship, arc payoff).
**Facts (30 Oct):** v0.88 · 110 engine modules (`engine/*.ts`, esbuild → `engine.js`) · Preact/TS UI `app/src/` · 58 root `test-*.js` + 42 browser tests (`app/tests/*.js`, helpers included) · balance suite green (Suggest ≈ C and risks the job; a thinking booker B to B+ and grows) · default world `universes/parody/` (EWE first); public-domain world built in · CI runs headless shards + golden on push, browser nightly · Steam calls and a Windows installer never run.

**Built systems** (detail: `docs/notes/code-map.md`): match sim + 9 company models · living storylines (heat/freshness) · relationship matrix + memory · live show & gorilla-position calls (`LIVEK`) · Director (tension 0–100, event gate, call caps, 3 styles) · After the show · fog of war & agent reads · running order & show clock · segments/promos with grammar · road, maps, markets, tickets, hometowns · networks, streaming, nights, cancellation · contracts, clauses, pay by size · progression/regression, overall rating, gimmicks · staff · booker levels + 4-branch skill tree · rival bookers · company arcs · invasions · press, podcast, Web section, writers' room, kayfabe, post-mortems · belts, logos, Create a Player, Create a Scene (3 studios), World Editor (stories, rules, backdrops) · soundtrack + broadcast/office SFX (Ryan-picked).

## 5. Tools, skills, plugins — when to use which

| need | use |
|---|---|
| Before building anything | `free-tools-first` (docs/toolset.md), `SearchPlugins`/`SearchSkills` once per new kind of work |
| Engine system / save field / hook | `wrestlecraft-architecture`; reshaping without play change → `engine-next` + `test-golden.js` |
| TEW-style systems (editor tables, politics, morale) | `tew9-systems-transfer` (+ `docs/research/tew9/`) |
| Creator suite | `create-a-player` |
| Score a change | `critic-review` (threshold 8.5) |
| Art / look / visual UX | `design-decision`: three concepts, each critic-passed ≥ 8.5, Ryan picks |
| Sound, words, names | `design-decision`: three options, Ryan picks (no critic gate needed) |
| Every 5th implementation, each milestone | `efficiency-review`, `engineering:tech-debt` |
| Bug not obvious | `engineering:debug` |
| Test planning | `engineering:testing-strategy` |
| Pages | `design:design-critique`, `design:accessibility-review`, `design:ux-copy` |
| Ryan's play notes | `design:research-synthesis` |
| Visual concept pages, picker, live page | `Artifact` (load `artifact-design` first; picker via `artifact-capabilities`) |
| Design review of a blueprint | `egm` plugin (Google's Elephant-Goldfish Model, Apache 2.0; `.claude/settings.json`): `/egm:egm-brainstorm`, `/egm:egm-draft`, `/egm:egm-review` (fresh reviewers: comprehension, antagonistic, readiness) |
| Wide code search | one `Explore` agent with a precise question; never several |
| Run/screenshot the game | `run` skill, Playwright (pre-installed; `NODE_PATH` per `docs/notes/commands.md`) |
| GitHub | GitHub MCP tools (`mcp__github__*`) per the session's instructions; Figma/Canva/Notion etc. need auth |

## 6. Commands and the live page

```
cd app && npm ci && cd ..          # once
node build.js                       # always before tests
npm run check                       # build + types + 20-week sim
node tools/headless-tests.js        # all headless (SHARD=1/4 for a quarter)
node test-golden.js                 # 60 recorded games, engine changes that keep play
NODE_PATH=<pw dir> node app/tests/<name>.js
```
Full list: `docs/notes/commands.md`. Live page: https://claude.ai/artifact/J6CziDiPFPTsrCNhhy39qa — nightly + milestone builds only. Read the live version first (another thread publishes too), merge anything missing, then publish `dist/gorilla-position.html`; note the version in the report.

## 7. The queue, in thesis order (detail and boxes in `TASKS.md`; why: `docs/reviews/2026-10-30-game-review.md`)

No new system starts until rows 1–3 meet their gates. Every gate is a number a script checks. Thresholds are set as margins over the L2 baseline; revise once after it is recorded, then fix them.

| # | epic | tier | measurable gate |
|---|---|---|---|
| L1–L2 | ✅ Done 30 Oct: the cause log (`docs/plans/cause-log.md`) and two nightly bots (`tools/bots/`). **Baseline** (lta, 3 seeds, 2 seasons; full table in `docs/notes/bot-baseline.md`): direct trace share pop ≈ 4%, trust 1.6–4.5%, morale 18–24%, cash ≈ 1% (money settles in the weekly books, so cash is not gated); weeks 1–3: thoughtful B, Suggest C- (fired on all 3 seeds) | — | met |
| L3 | **Grow the lab**: greedy, story-first, chaos and an **exploit bot** that searches one-action loops; report fails if one repeated action causes > 25% of the season's grade, popularity or cash gain, or a meter never changes an outcome in 2 seasons; every bot gate is the median of 3 seeds | M | nightly report green or names the exploit |
| 1 | **The spine** (its blueprint and question vault start now, beside L1–L3, so Ryan's answers are ready when the lab is): one blueprint merging the promise ledger, preview before consequence and three clocks (0ao moves 2–4); Director (built) is its gate | L | `docs/plans/spine.md` (approved 30 Oct: "Go, after L1"); ledger-line trace share ≥ 0.80 for the thoughtful bot, defined in `docs/plans/spine.md` §7 (Σ\|delta\| with `decision` = a line id ÷ Σ\|delta\| of all `meterAdd` entries, per meter, per season, median of 3 seeds; the bar is absolute since lines do not exist before row 1) and the **direct** decision share (not booked) ≥ L2 baseline + 10 points on pop and trust; Book the show and After the show carry a `data-t="ledger"` line in every browser run: the most urgent open promise, or "No promises open: make one" with a button (a browser assertion) |
| 2 | **First hour**: 0ac the last booker's mess as the default new game | L | thoughtful bot's median grade over weeks 1–3, 3 seeds, ≥ B (today's year median: B- to B+; Suggest C, from `test-balance.js`); week-1 desk ≤ 3 tasks and ≤ half the baseline words (browser test; record the browser baseline first, the L2 headless count is task+matter words only); 5 outside players then reorder this queue (`design:research-synthesis`) |
| 3 | **Art bible and look freeze**: finish wrestler style C, page chrome, motion language; then freeze until launch and convert every page to craft + 22/56/22 | Art | Ryan approves a baseline screenshot per page first; then lint: no page uses the old window CSS tokens; nightly screenshot diff at 1080p/1440p/4K against approved baselines; vision critic (rubric in `critic-review`) ≥ 8.5 per page |
| 4 | **Broadcast weight** (0au): poses on twos, hit-stop by weight, TV-director camera, crowd density, boos | Art + M | p95 frame time ≤ 16.7 ms on the CI reference profile; Ryan watches a big event without skipping |
| 5 | **Merges**: press + podcast + Web + magazine → one media voice; booking demands (0aq) + writers' room → rows in the ledger under the Director | L | fewer screens and fewer desk words than today (counted by test); bots show no lost depth |
| 6 | **Ship**: Windows installer + icon, Steam achievements, cloud save, Workshop worlds, default world switch (D5, needs Bill + lawyer) | L | clean install on a fresh Windows VM plays a scripted year; Steam calls pass on app 480 |
| 7 | **Outside proof**: 20 outside players, two fix rounds | — | ≥ 50% start a second season unprompted |
| After | Clock Wall (approved 8.6), 0ap loops, 0at desk list, D1 regions, D2 relationship types, D7 health pools, 0ar, 0as, traits, careers, owner mode | — | each re-scoped as a ledger row or parked |
| Always | strict TS module by module, wraps → hook lists (`engine-next`) | S | `test-golden.js` identical |

Risk register: `docs/notes/risks.md` (art pivots, scope creep, critic loops, D5 lawyer, Steam untested, performance).

## 8. Counters

| key | value |
|---|---|
| impl_count | 2 (cause log, bot lab) · next `efficiency-review` at 5 |
| critic bar | 8.5 |
| last game review | 30 Oct 2026: **68 / 100** (see `docs/reviews/2026-10-30-game-review.md`) |

## 9. Keeping this file true (every session, last step)

- **Learn:** add one line to `docs/LESSONS.md` (what went wrong or was wasted, and the rule or skill that prevents it). Promote a lesson seen twice into this file or a skill.
- Changed a rule, system, decision, queue item or command? Edit the one line here in the same commit.
- Finished a queue item → delete its row (history lives in git and `TASKS.md`).
- This file stays under ~16 KB. If it grows, move detail to `docs/notes/` and leave a one-line pointer.
- MASTER and a note disagree? MASTER wins; fix the note in the same commit.
- Decisions: Ryan's words + date into `TASKS.md` "Ryan's decisions"; only rule-level ones get a line in §1/§3.

## 10. Token economy (log every saving)

Standing habits: grep before read; read with offset/limit; `| tail`/`| head` long outputs; one Explore agent for wide sweeps; critic agents get paths, not pasted diffs; never re-read a file already in context; tests run by section, full suites before push only.

| date | saving |
|---|---|
| 30 Oct | `CLAUDE.md` 95 KB → ~1.5 KB core that imports this file; code map, rules, commands moved verbatim to `docs/notes/` and read on demand (≈ 22k tokens less per session). Old master archived. |
| target | Always-loaded text (CLAUDE.md + MASTER) ≤ 18 KB (30 Oct after L2: 20.0 KB; next trim: "Things that bite" to a note), measured each session with `wc -c CLAUDE.md docs/MASTER.md` and written here when it moves. Promote a lesson to MASTER or a skill when it appears twice. |
| next | Archive done items in `TASKS.md` (233 open boxes, 1,090 lines) to `docs/archive/`; untrack `dist/` + `engine.js` (−85 MB, CI builds); parallel headless runner. |

## 11. Where things live

| file | holds |
|---|---|
| `docs/MASTER.md` | this: boot, golden rules, pipeline, queue, counters |
| `docs/notes/rules.md` · `code-map.md` · `commands.md` | full rules · per-area code notes + things that bite · every command |
| `TASKS.md` | Ryan's decisions (do not reopen) and task boxes |
| `docs/LESSONS.md`, `docs/notes/critic-log.md`, `bot-baseline.md`, `risks.md` | lessons; critic scores; the bot baseline; risks |
| `docs/archive/NEXT.md`, `docs/archive/roadmap.md` | retired queues (superseded by §7) |
| `docs/plans/*.md` | blueprints (rule 9d) |
| `docs/research/` | Bill's reviews (`plans/*.md` text copies), TEW IX research, genre lessons, UI study |
| `docs/design.md`, `docs/feature-list.md` | design target and feature wording (older; pillars still hold) |
| `docs/reviews/` | dated game reviews with scores |
| `docs/archive/` | retired docs |
| `.claude/skills/` | project skills (§5) |
