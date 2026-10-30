# WrestleCraft: Be The Booker — MASTER

The first thing every development session reads. Written for Opus 5.5. Loaded automatically through `CLAUDE.md`.
Owner: Ryan (decides design, art, names). Co-planner: Bill. Built 30 October 2026 from every doc, plan, review and the code.
**Precedence:** §1 golden rules > Ryan's words in this session > `docs/notes/rules.md` > everything else. Source files win on detail.

---

## 0. Session boot (do this, in order, and no more)

1. This file is already in context. Do **not** re-read `CLAUDE.md`, `TASKS.md` or the whole code map.
2. `git status -sb && git log --oneline -5` — know the branch and the last work.
3. Read §7 (the queue) and pick the top unblocked item, or do what Ryan asked.
4. Open only what that item needs: the one blueprint in `docs/plans/`, the one bullet in `docs/notes/code-map.md` (grep the file name), the one skill.
5. Work the pipeline in §2. End with §9 (update this file if anything here changed).

## 1. Golden rules (Ryan, 30 October 2026 — these win)

1. **Great, not good.** Act as a master game designer. Before any addition: check which tools, skills and plugins apply (§5) and research what already solves it (`free-tools-first`). Every new addition or feature is reviewed by a separate critic agent and scored 1–10. **Only 8.5 or higher passes** (replaces rule 9j's "over 8"). Below 8.5: rework what the critic named, fresh critic, again.
2. **Art direction = three concepts.** Any art, look, style or visual-UX decision goes to Ryan as **exactly three concepts, each of which has already passed a critic run at ≥ 8.5**. Ryan picks; never decide a look alone (`design-decision` skill).
3. **Spend fewer tokens every session.** Keep this file short and current; read narrowly; delegate wide searches to one Explore agent instead of dumping files; never paste large outputs; log every saving in §10. Each session should leave the next one cheaper.

## 2. The pipeline for every change

| step | what | tool |
|---|---|---|
| 0 | Is it new (mode, system, major feature)? → rule 9d gates first: blueprint `docs/plans/<x>.md` → question vault (one question at a time) → Ryan's plain go-ahead, dated in `TASKS.md`. Small fixes, polish, tools: skip. | `AskUserQuestion` |
| 1 | Research: tools already here, free/OSS that solves it, skills/plugins that apply | `free-tools-first`, `SearchPlugins`, `SearchSkills` |
| 2 | Design the data/hooks before code | `wrestlecraft-architecture`; big change → `engineering:architecture` ADR in `docs/adr/` |
| 3 | Build: engine first (`engine/NN-name.ts`, `E.*`, headless `test-name.js`, 60 weeks errs 0 NaN 0), then the screen | — |
| 4 | **Critic ≥ 8.5** (separate agent, no edits) | `critic-review` |
| 5 | Page touched → `design:design-critique`, `design:accessibility-review`; new words → `design:ux-copy` | design plugin |
| 6 | Tests: `npm run check`, `node tools/headless-tests.js`, `node test-golden.js` (after engine change that should not change play), browser test for the section + `journey.js` | — |
| 7 | `simplify` + `engineering:code-review`; saves/files/network/Steam → `security-review` | — |
| 8 | Commit (what changed for the player + critic score + one-line reasons), push to the session branch, open PR, subscribe | git, GitHub MCP |
| 9 | `impl_count += 1` (§8). At every 5th → `efficiency-review` before the next task. Nightly/milestone → publish live page (§6) | — |

Art/look: steps 1→ three concepts → critic each ≥ 8.5 → Ryan picks → then steps 2–9.

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

## 7. The queue (top first; detail and boxes in `TASKS.md`)

| # | item | state | gate |
|---|---|---|---|
| 1 | **Default world switch** (D5: original/public-domain leads, parody opt-in) | decided, unbuilt | Bill + lawyer confirm |
| 2 | **0ao move 2: the promise ledger** (one visible ledger of promised wins, title shots, open threads, ripe feuds, each with a payoff window) | idea | 9d blueprint `docs/plans/promise-ledger.md` |
| 3 | **0ao move 3: three clocks with ceremonies** (week stamp, monthly magazine 0af, era verdict) | idea | 9d `docs/plans/three-clocks.md` |
| 4 | **0ao move 4: preview before consequence** (pencil marks in words on every choice) | idea | 9d or Ryan rules it polish |
| 5 | **0aq booking demands** (forced finishes/matches from writers, wrestlers, business) | approved, after Director | build |
| 6 | **Booking Clock Wall** (22/56/22 card builder; summary in `docs/archive/MASTER-2026-10-28.md` §9) | approved (critic 8.6, clears 8.5) | build |
| 7 | **0ap loops**: feud ending window, slights come due, cold city → home market, renewal countdown, feed/starve a reporter | listed | short 9d each |
| 8 | **0at** backstage decisions on the desk list | approved | build |
| 9 | **0au** animation weight (twos, hit-stop, TV camera, crowd density, choreography, UI motion) | polish | each motion picked by Ryan (3 concepts) |
| 10 | **Wrestler style C** (in progress, critic rounds 1–11) and paper 3D wrestlers / movesets blueprints | in progress | critic ≥ 8.5 per round |
| 11 | **Ship path**: Windows installer + icon, Steam achievements on app 480, cloud save, Workshop worlds | not started | Ryan go-ahead (spends/publishes) |
| 12 | Strict TS module by module; wraps → hook lists | ongoing | `engine-next` |
| 13 | D1 regional popularity, D2 relationship types, D7 four health pools | decided, unbuilt | 9d blueprints |
| Later | 0ar scouting anomalies, 0as industry wear, magazine, traits/perks, word travels, hallway, politics, corkboard, careers, owner mode (post-launch) | parked | — |

Scope guard (Bill's review, 21 Oct): finish and polish before adding. A new idea goes to `TASKS.md` "Later" unless it closes a gap in the core loop.

## 8. Counters

| key | value |
|---|---|
| impl_count | 0 (reset 30 Oct with this file) · next `efficiency-review` at 5 |
| critic bar | 8.5 |
| last game review | 30 Oct 2026: **68 / 100** (see `docs/reviews/2026-10-30-game-review.md`) |

## 9. Keeping this file true (every session, last step)

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
| next | Archive done items in `TASKS.md` (233 open boxes, 1,090 lines) to `docs/archive/`; untrack `dist/` + `engine.js` (−85 MB, CI builds); parallel headless runner. |

## 11. Where things live

| file | holds |
|---|---|
| `docs/MASTER.md` | this: boot, golden rules, pipeline, queue, counters |
| `docs/notes/rules.md` · `code-map.md` · `commands.md` | full rules · per-area code notes + things that bite · every command |
| `TASKS.md` | Ryan's decisions (do not reopen) and task boxes |
| `NEXT.md`, `docs/roadmap.md` | old unattended queues, mostly done; superseded by §7 |
| `docs/plans/*.md` | blueprints (rule 9d) |
| `docs/research/` | Bill's reviews (`plans/*.md` text copies), TEW IX research, genre lessons, UI study |
| `docs/design.md`, `docs/feature-list.md` | design target and feature wording (older; pillars still hold) |
| `docs/reviews/` | dated game reviews with scores |
| `docs/archive/` | retired docs |
| `.claude/skills/` | project skills (§5) |
