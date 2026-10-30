# WrestleCraft vs TEW IX — gap audit

Method: REA artifact analysis of `src/` (structural), then source probes for each TEW
domain (behavioural), with spot-reads to confirm what the probes implied. Probe counts
are keyword frequencies, not feature proofs — every classification below was checked
against at least one assignment site or function name.

## Part 1 — what REA says about the artifact

`analyze_javascript_application` on `src/` (105 files, 1,405,419 bytes):

| Metric | Value | Meaning |
|---|---|---|
| relevant / parsed / skipped files | 105 / 105 / 0 | clean parse, nothing unread |
| visited AST nodes | 327,067 | substantial codebase |
| **modules** | **0** | **no module system at all** |
| parse failures | 0 | |
| findings | 41 | |
| semantic graph | partial, 33,808 unknowns | data-flow beyond simple coercion |
| Electron windows / preload / IPC channels | 0 / 0 / 0 | none declared in `src/` |
| child-process / timer / request family relations | 0 / 0 / 0 | no I/O in the sim core |

The zero-modules result is the headline. 105 files in **global scope**, loaded in
filename order (`00-`, `10-`, `20-` prefixes), which is why `build.js` can concatenate
them into a single 1.36 MB `engine.js`.

Consequences, in descending order of pain:

1. **No dependency graph.** Nothing declares what it uses, so load order is the only
   contract. A new file that references something from a later-numbered file breaks at
   runtime, not at build.
2. **No tree-shaking, no lazy loading.** One bundle, always fully evaluated.
3. **Name collisions are silent.** Two files defining `function clamp` — last one wins.
4. **Testing is whole-world.** You cannot unit-test `66-relations.js` without loading
   the other 104 files.
5. **Merge conflicts scale badly** — 13 branches, all touching shared globals.

This is a legitimate architecture for a solo project (it is fast, simple, debuggable),
so the fix is not "convert to ESM tomorrow". The cheapest increment is boundaries:
freeze the public surface of a few files (`00-core`, `85-universe`) and make everything
else `const`-scoped IIFEs that return an object. That buys 80% of the benefit for 10% of
the migration. `[infer]`

**Build freshness: good.** `dist/index.html` was written 1 second after the newest
source file, so the shipped bundle is current.

## Part 2 — coverage matrix

`mature` = deep, multiple systems; `partial` = present but thin relative to TEW;
`absent` = no implementation found.

| TEW domain | Status | Evidence |
|---|---|---|
| Matches & finishes | mature | `10-match.js`, `141` hits |
| Angles / segments | mature | `20-story.js`, `93-segments.js`, `139` |
| Storylines / feuds | mature | `98-plot.js` (27), `51` |
| Titles & reigns | mature | `89-belts.js`, `99-reigns.js`, `701` |
| Morale | **mature but different** | `83-moments.js`, `76-locker.js`, `282` |
| Momentum | partial | `w.mom` −10..10 in `10-match.js`, `19` |
| Backstage / locker room | mature | `76-locker.js`, `77-backstage.js`, `52` |
| Relationships | **partial** | `66-relations.js`, single type + strength |
| Chemistry | partial | `85-universe.js`, `56` |
| Broadcast / networks / streaming | mature | `88-shows.js`, `89-networks.js`, `89-streaming.js`, `174` |
| Sponsors / merchandising | mature | `50-company.js` (13), `78-models.js` (12) |
| Contracts | mature | `99-contracts.js`, `86-editor.js` (20), `121` |
| Finance | mature | `88-finance.js`, `97-time.js` |
| Owner goals | mature | `87-goals.js` (31), `41` |
| Promises / quests | mature | `34-night.js` (8), `75` |
| Road agents / referees / commentary | mature | `99-fog.js` (22), `10-match.js` (13), `85-universe.js` |
| Gimmicks | mature | `99-gimmicks.js` (14), `69` |
| Kayfabe / press / dirtsheet | partial | `99-kayfabe.js`, `99-press.js` |
| Stables | mature | `60-rpg.js` (22), `69` |
| Tag teams | **thin** | `98-plot.js` (3), `16` |
| Venues / attendance / tickets | mature | `99-venues.js`, `95-tasks.js`, `108` |
| Regions / tours | mature | `89-regions.js` (18), `28` |
| Brands / divisions | mature | `00-core.js` (19), `133` |
| Training / development | **thin** | `87-develop.js` (5), `16` |
| Injuries | mature | `77-backstage.js`, `48` |
| Hall of fame / awards | partial | `82-wishes.js` (13), `36` |
| Tournaments | partial | `42-events.js` (8), `21` |
| Editor | **thin** | `86-editor.js`, 8 tables |
| **Perception** | **absent** | no `perception` literal; `0` hits |
| **Scandals** | **thin** | `99-kayfabe.js` (9), `99-press.js` (5), no entity |
| **Narratives** | **absent** | `42-events.js` (3), no trigger/effect model |
| **Alliances (cross-company)** | **thin** | `88-finance.js` (10), `88-indies.js` (1), `4` |
| **Excursions / loans** | **thin** | `88-finance.js` (15) — appears to be *financial* loans, not talent loans |
| **Young lions** | **thin** | `75-people.js` (5), `12` |
| **Drug policy** | **thin** | `77-backstage.js` (5), `6` |
| **Figurehead** | **absent** | literal `0`; synonym hits were regex noise |
| **Dirty tricks** | **thin** | `92-shape.js` (7) — looks like dirty *finishes*, not dirty tricks |
| **Power 500 / Top 100s** | **thin** | `76-friends.js` (4) — likely substring, not a ranking system |
| Eras | unclear | `77-backstage.js` (4) — likely substring; treat as absent until confirmed |

## Part 3 — the gaps that actually matter

### G1. No Perception system (highest impact)
TEW computes every worker's **Perception** at the *start of each show* from popularity
plus momentum, and then uses it for cooperation decisions ("who will they lose to"),
leave-off-show tolerance, and morale sensitivity `[hb 7.4]`. It is the hinge between
booking and relationships.

WrestleCraft has `w.ovr` (static overall) and `w.mom`, but no per-show, per-company
standing snapshot. So feuds and title changes cannot respect "this person believes they
are too big to lose to that person".

**Port:** `perception(S, w, company)` computed once at show start, stored on a
`S.perc = {workerId: value}` snapshot; read it in match booking (`10-match.js:271`), in
willingness checks, and in AI pushes. Effort: **medium-low** — it is mostly a derived
value plus three call sites.

### G2. Morale is a scalar, not an incident ledger
This is the subtlest and most interesting finding. Yours:

```js
w.morale = clamp(w.morale ± N, 0, 100)   // scalar, many mutation sites
w.stress                                 // separate accumulator, triggers at 75
w.arc = {t:'grievance'}                  // single transient state
```

TEW's `[hb 7.8]`: morale is the **aggregate of currently-active incidents**, each with
polarity and a hidden decaying duration; severe negatives outweigh several minor
positives; the same incident can hit two workers differently.

What you lose with a scalar:
- **Provenance.** You cannot show the player *why* morale is 42.
- **Independent decay.** Two incidents that arrive together cannot fade at different
  rates; `stress` decays uniformly.
- **Composition.** "One huge betrayal + three small kindnesses" nets to a number and
  forgets the shape.

What you gain: simplicity, and `stress` already gives you a second axis (accumulated
pressure that triggers a walkout). You are closer than the scalar suggests — `grievance`
arcs are proto-incidents.

**Port (incremental, not a rewrite):** keep `w.morale` as the roll-up, add
`w.incidents = [{kind, polarity, severity, duration, age}]`; define
`morale = base + Σ(active incidents)`; let `stress` remain the pressure gauge. The UI
can then list incidents, and each decays on its own. Effort: **medium**.

### G3. Scandals have no entity
`99-kayfabe.js` and `99-press.js` handle reputation *reactions*, but there is no
discrete, publishable incident with severity that damages a worker or company
independent of a show. TEW's `Scandals` table is the public-consequence bridge from
private state.

**Port:** `scandal {id, a, b?, company?, kind, severity, week, public}` spawned from
extreme relationship states, drug incidents, or morale collapse; feeds
`99-press.js` and popularity. Effort: **medium**.

### G4. Narratives absent
TEW's Narratives are data-authored triggers (date range, chance, requirements, effects,
strength) used to script history `[hb 38.1]`. You have `42-events.js` and `92-scenarios.js`
but no general trigger→requirement→effect engine.

**Port:** a small rule engine, not content. Your `S.quests` pattern already resembles it.
Effort: **medium**; payoff is enormous for modding.

### G5. Alliances thin
`4` references, one in `88-indies.js`. TEW has 7 alliance types (public, consortium,
bordered, territorial, protective, trading) plus titles, loans, and membership filters
`[hb 33]`.

**Port:** an `alliances` array with an eligibility predicate and three effects: title
sharing, talent loans, and no-poach. Effort: **medium**.

### G6. Excursions, young lions, figurehead
- Excursion hits in `88-finance.js` are almost certainly **financial loans**. TEW's
  excursion is a worker going abroad and returning improved `[hb 7.13]`.
- Young lions: `75-people.js` has 5 hits — likely an age/rookie check, not TEW's formal
  rookie system (limited moveset, mandatory losses, graduation) `[hb 16.39]`.
- Figurehead: no implementation.

**Port:** all three are small, self-contained systems. Excursion = temporary
`away` + skill delta on return; young lion = skill cap + loss policy flag; figurehead =
one worker flagged, with company-wide popularity/finance modifiers. Effort: **low each**.

### G7. Editor surface and thin subsystems
`ED_TABLES` has 8 entries vs TEW's 45. Tag teams (16 hits), training (16), tournaments
(21), Power 500 (4) are all present but shallow relative to TEW's dedicated chapters.

Your own inconsistency is the cheapest win: **stables (69 references) and venues (33)
are not in `ED_TABLES`** — systems that exist and cannot be authored. Fix that first;
it is a one-line-per-table change plus a `test-*` case.

## Part 4 — divergences worth keeping

| WrestleCraft | Why keep it |
|---|---|
| Numeric relationship `strength` | TEW's categorical-only affect cannot express "cooling off". You have both axes possible. |
| `stress` as a second gauge | TEW folds this into morale incidents; a separate pressure/trigger dial is clearer and easier to tune. |
| `w.arc = {t:'grievance'}` | Cheap narrative state that pairs well with a future incident ledger. |
| Deterministic seeding (`test-determinism`) | TEW hides its randomness; yours is reproducible and testable. |
| Global-scope 105-file layout | Don't rewrite for purity. Add boundaries incrementally. |

## Part 5 — recommended order

1. `stables` + `venues` into `ED_TABLES` (fixes an internal inconsistency; ~1 hour)
2. Perception snapshot + three call sites (G1; unlocks believable feuds)
3. Incident ledger on top of `morale` (G2; keep the scalar as roll-up)
4. Scandals (G3; gives press/kayfabe something concrete to report)
5. Excursion + young lion + figurehead (G6; three small wins)
6. Alliances (G5)
7. Narratives engine (G4; the modding payoff)

## Limitations of this audit

- Classifications come from keyword probes plus targeted reads. A probe count of `0`
  means "no literal match" — a synonym could still implement the concept (I checked the
  obvious ones: perception, scandal, excursion, young lion, figurehead).
- `creative` and `perception` probe counts were contaminated by `create`/`Array.push`
  and were discarded rather than reported.
- REA's graph was `partial` with 33,808 unknowns, so absence of a relation in the graph
  is not evidence of absence in the code.
- Nothing here is a code review: I did not read all 105 files line by line.
