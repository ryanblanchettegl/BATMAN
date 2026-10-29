# WrestleCraft — TypeScript Engine Architecture (target)

Status: DRAFT v0.2, 2026-10-26 (7 decisions applied, §15). Owner: Ryan. Applies after the ES5 → TS engine switch.
Sources: BATMAN repo v0.88 (`src/` 105 files, `app/` Preact+TS), research (now in `docs/research/`, index `docs/research/README.md`; originals in `Desktop/cool stuff`) (TEW IX workbook, create-a-player skill, cyberpunkdreams UI study, Bill's 6 PDFs of 21 Oct).
Tags: `[keep]` = proven in v0.88, carry over · `[new]` = add during/after switch · `[decide]` = open, needs Ryan/Bill (use `design-decision` skill).

---

## 0. One-paragraph summary
A pure, deterministic TypeScript simulation package (`engine/`) owns all game state as plain JSON and exposes a typed command/query API. The UI (`app/`, Preact) only reads queries and sends commands. Systems are modules that subscribe to a typed event pipeline instead of wrapping each other's functions. World content (match types, gimmicks, titles, narratives, eras) is data validated by schemas. The live show from the gorilla position is the centre; every other system exists to feed it or be fed by it.

## 1. Non-negotiable principles
| # | Rule | Origin |
|---|---|---|
| P1 | Engine owns state; UI never writes `S` | `[keep]` CLAUDE.md rule 1 |
| P2 | Determinism: same seed + same commands = same state, byte-identical | `[keep]` test-determinism |
| P3 | Two randomness sources only: `rng(stream)` for outcomes, `hash01(key)` for flavour (text, pictures, sound). Flavour never touches `rng` | `[keep]` `rnd(S)` vs `h01()` |
| P4 | Save = plain JSON, versioned, every new field optional with a default; old saves always load | `[keep]` rule 9 |
| P5 | No module reaches into another module's state slice; cross-system effects go through events or the public API | `[new]` replaces 32 "wraps:" files |
| P6 | Content is data with a schema, not code branches | `[new]` TEW lesson |
| P7 | Direction legible, magnitude hidden: words/grades for the player, numbers in a debug "dirt sheet" view | `[keep]` fog of war + TEW opacity |
| P8 | Every heavy system has an on/off flag in player prefs | `[new]` TEW hb36 |
| P9 | The player is an entity, not an exception (same rules for rival bookers) | `[new]` TEW IX lesson |
| P10 | Performance is a feature: a week advance and a new game have time budgets checked in CI | `[new]` TEW 2010/2020 lesson |

## 2. Layers
```
app/ (Preact UI, screens, kit, audio)      ── reads queries, sends commands, renders
   │  typed API only (engine/api)
engine/
   api/        commands + queries (public surface, the old E.*)
   systems/    one folder per domain (match, show, live, people, ...)
   core/       state types, rng, hash, events, clock, schema, save/migrate
   content/    schemas + loaders for world packages
data/          world packages (parody, public_domain), JSON, validated at build
tools/         Blender/bpy, map/font/music builders, balance probes
tests/         engine (headless), browser (Playwright), golden saves
```
Rules: `systems/*` import `core/*` and other systems' **public** `index.ts` only. `api/` imports systems. `app/` imports `engine/api` + types only. Enforced with ESLint `import/no-restricted-paths` (or dependency-cruiser) in CI.

## 3. Folder layout (target)
```
engine/
  core/
    state.ts        GameState root type, slices registry
    rng.ts          seeded PRNG, named streams (match, world, people, ai)
    hash.ts         hash01(key) for flavour
    events.ts       typed event bus (sync, ordered, deterministic)
    clock.ts        week/month/year, 48-week year, calendar math
    tick.ts         the week pipeline (§6)
    schema.ts       zod schemas (D3); types inferred from schemas
    save.ts         serialize, version, migrate chain, compaction/archive
    flags.ts        world settings / company settings / player prefs (§9)
  systems/
    match/          rating, finishes, win odds, ring work, royal, stips
    show/           card, clock/time budget, shape (running order), segments, grading
    live/           liveBegin/Next/Decide, calls (LIVEK registry), director, ring calls, direction calls, livefeed
    night/          after the show, matters, post-show report
    story/          living feuds (heat/freshness), arcs, plot, sift, beats, debut
    people/         workers, attributes, progression/regression, overall, gimmicks, looks, staff
    relations/      relationship matrix, memory (youRemember), chemistry (preset + discovered)
    morale/         incident ledger, stress, locker room aggregate          [new ledger]
    perception/     per-show snapshot                                        [new]
    backstage/      rooms, people-now, dossier, asks, scenes
    company/        models (9), finance, merch, production ladders, owner/goals, contracts, clauses
    world/          rivals, AI booking, indies, newco, invasions, alliances [alliances new], wars
    media/          shows/networks/streaming, nights (head-to-head), cancel, audience share
    road/           cities, markets, maps/shapes, venues, tickets
    titles/         titles, belts, reigns, lineage, title-show
    net/            dirt sheet, feed, press, kayfabe, podcast, grammar, words
    meta/           tasks, advance, first year, scenarios, challenge, archive, postmortem, awards
    editor/         world package edit ops (ed*), validation
  api/
    commands.ts     every mutation, one function each, returns events/result
    queries.ts      read-only views for screens (pure, memoisable)
    index.ts
  content/
    schemas/        worker, company, title, matchType, gimmick, narrative, era, segKind, venue ...
    load.ts         package → validated content → initial state
```

### 3.1 Old file → new module map (from v0.88 `src/`)
| new module | old files |
|---|---|
| core | 00-core, 90-api, 70-season (clock parts), 99-archive |
| match | 10-match, 99-ringwork, 99-royal, 92-shape (finishes), 93-stipworld |
| show | 30-show, 97-time, 92-shape, 93-segments, 93-segworld, 55-preshow, 99-tonight, 99-suggest-flat, 99-suggest-short, 86-asst |
| live | 31-live, 32-direction, 33-ring, 94-livefeed |
| night | 34-night |
| story | 20-story, 21-living, 99-arcs, 98-plot, 84-sift, 99-debut, 99-midstory |
| people | 60-rpg, 75-people, 99-progress, 99-overall, 99-gimmicks, 86-looks, 99-staff, 85-second, 76-student, 76-friends, 87-develop |
| relations | 66-relations, 65-you, 84-kept, 84-life |
| morale/backstage | 76-locker, 77-backstage, 79-people, 79-dossier, 86-room, 83-moments, 82-wishes, 91-wishes-late |
| company | 50-company, 78-models, 88-finance, 99-contracts, 97-clauses, 87-goals, 66-owner-year, 86-rep, 99-points |
| world | 80-world, 81-invasion, 88-indies, 88-newco, 99-worldweek, 86-history |
| media | 88-shows, 89-networks, 89-streaming, 88-nights, 90-cancel, 99-audience |
| road | 91-road, 91-maps, 91-shapes, 89-regions, 99-venues |
| titles | 89-belts, 99-reigns, 99-titleshow, 89-board |
| net | 94-net, 99-press, 99-kayfabe, 99-zpodcast, 60-grammar, 98-words, 99-writers |
| meta | 95-tasks, 96-advance, 96-first, 92-scenarios, 92-challenge, 99-postmortem, 87-desk, 87-create, 42-events, 40-week |
| editor | 85-universe, 86-editor, 86-scenes, 89-logos |
| perception | — new |

`[decide]` granularity: whether `backstage` and `morale` merge; whether `net` splits into `press` and `media-content`.

## 4. State model

### 4.1 Three shapes, kept apart (TEW lesson: authored vs runtime schemas differ)
| shape | keyed by | edited by | lives in |
|---|---|---|---|
| **WorldPackage** (authored) | stable string ids (`c_…`, slugs) | World Editor, modders | `data/*.json`, Workshop |
| **GameState** (runtime save) | numeric/short ids + denormalised display names in history rows | engine only | IndexedDB/file save |
| **View models** | n/a | derived by `queries.ts` | memory only |

### 4.2 GameState root (slices)
```ts
interface GameState {
  v: number;              // save version, migrate chain
  seed: number; rng: RngState;   // per-stream state
  clock: Clock;           // week, year, phase of week
  flags: { world: WorldSettings; player: PlayerPrefs };
  db: ContentSnapshot;    // match types, gimmicks, segkinds, stips merged from package
  workers: Record<WId, Worker>;
  contracts: Record<CId, Contract>;      // employment, per company  [new split]
  companies: Record<PId, Company>;
  titles: Record<TId, Title>;
  rel: RelationMatrix;    // pair key `${min}-${max}`
  morale: MoraleLedger;   // incidents per worker                     [new]
  perception?: PerceptionSnapshot;  // written at show start          [new]
  feuds: Record<FId, Feud>; arcs: ...; live?: LiveShow; ...
  history: { matches: MatchRow[]; reigns: ReignRow[]; ... };  // append-only, archived yearly
  ui: never;              // UI state is NOT in the save
}
```

### 4.3 Person vs employment (structural correction)
`Worker` = intrinsic: identity, body (height, weight min/max), attributes 1–100, health pools, look, traits, popularity per region, relationships.
`Contract` = per employer: alignment, current gimmick, momentum, manager, brand/division, role, clauses, pay type (yearly/per show/handshake). Supports later multi-company/indie dates cleanly.

### 4.4 Specific models adopted from research
| model | shape | why |
|---|---|---|
| Popularity | worker × region and company × region (region list = the road's areas) | D1 decided; TEW's single best decision |
| Morale | `incidents[]: {reason, sev: 1..4 by seniority band, week, source, playerCaused}`; `morale = base + Σ decayed`; `stress` kept as pressure gauge | provenance ("why is morale 42"), independent decay |
| Perception | computed at `liveBegin`, frozen for the show; feeds "will they lose to X", left-off tolerance, morale sensitivity | hinge between booking and people |
| Relationships | keep numeric `strength` + memory; add optional `family`, `personal`, `romantic` enums with full UI before launch (D2); mentor/partners stay roles | expressiveness without losing "cooling off" |
| Chemistry | `preset` (authored) + `discovered` (fog of war) | already partly in `S.know` |
| Match type | `{props[], winConditions[], timeMin/Max, injuryRisk, contentRisk, set}` composable | new stipulation = data row |
| Gimmick | eligibility spec: attribute floors/ceilings, body, alignment | creator can refuse bad fits |
| Health | head/body/arms/legs pools, penalties stack, any pool at 0 = career over (D7) | specific injuries |
| Aging | lower caps, not stats | invisible gradual decline |
| Show rating | minutes-weighted match/angle blend; product focus weights | stops cheap-card overvalue |

## 5. API surface
- `commands.ts`: every state change. Signature `(s: GameState, args) => Result<Events>`. Commands validate, mutate via system functions, emit events. Old `E.*` mutators map 1:1 at first.
- `queries.ts`: pure reads for screens (`advance(s)`, `road(s)`, `afterShow(s)`, `dossier(s,id)` ...). Memoise by `(stateVersion, args)`.
- The UI gets a `Store` that holds `GameState`, calls commands, bumps `stateVersion`.
- Headless tests call the same API: the UI is never needed to play.

## 6. The week pipeline (tick order)
Explicit, single file `core/tick.ts`. Systems register handlers for phases; order inside a phase is declared, not file-name order.
```
1 week.start        clocks, decay (morale incidents, freshness, markets cooling)
2 world.plan        AI companies plan from last week's state (read-only snapshot)
3 contracts/health  expiries, injuries heal, absences
4 narratives        data-triggered world events for this date            [new]
5 director          tension score → which eligible events fire           [new, Bill phase 4]
6 for each show this week (player shows wait for the player):
    pre-show → perception.freeze → card (player or AI) → live (calls) → grade
    apply results ATOMICALLY: ratings → popularity → momentum → morale → money
7 after-show       matters, report, press/podcast inputs
8 week.end         finance reconcile, history append, podcast/dirt sheet write, archive yearly
```
Old hook lists map to events: `MQX`→`match.quality`, `CRX`→`match.crowd`, `FINX`→`match.finish`, `EFX`→`match.effects`, `POST`→`match.post`, `SHOWX`→`show.done`, `WEEKX`→`week.end`, `NEWX`→`game.new`, `PREX`→`show.pre`, `TASKX`→`tasks.collect`.
Handlers that changed a value by wrapping (`E.validate` ×6, `runPlayerShow` ×3, `heatUp`, `segMean`, `airRate` …) become **modifier pipelines**: `modifiers.register('segMean', fn, {order})`. Order is explicit and testable.

## 7. Determinism and randomness
- `rng` streams: `match`, `live`, `world`, `people`, `ai`, `gen` (world generation). Adding a call in one stream does not shift others → balance changes stay local.
- `hash01(...keys)` for any flavour pick (grammar, pictures, sounds, podcast). Lint rule: files under `net/`, `app/` cannot import `rng`.
- Golden test: fixed seed, 60 weeks, state hash equals checked-in value; change requires a deliberate update.

## 8. Content and modding
- World package = JSON validated by `content/schemas`. Types inferred from schemas (single source of truth).
- Editable tables now: promotions, shows, titles, workers, contracts, teams, relationships, events + segkinds, stips. Add next: **stables, venues** (systems exist, not authorable), then match types, gimmicks, narratives, eras, alliances.
- Narratives `[new]`: `{window, chancePerWeek, requires: Predicate[], effects: Effect[] (strength 1–10), once, presentation}`. Predicates/effects are a small typed DSL, not eval.
- Eras `[new]`: date-bounded percentage dials (attendance, merch, wages, TV) + Net skin per era (newsletter → boards → feed → podcast).
- Workshop: ship two kinds first (wrestler, whole world), file check + report button.

## 9. Settings scopes (separate storage)
| scope | stored in | examples |
|---|---|---|
| World settings | package + `S.flags.world` | injury/randomness frequency, chemistry on, natural growth limits |
| Company settings | `Company` | product focus, backstage rules, production ladders, ticket prices |
| Player prefs | `S.flags.player` (travels with save) | system on/off flags, pace, auto-play, captions |
| Device prefs | localStorage | resolution, volume, window mode |

## 10. UI architecture (app/)
- Preact + TS strict (`noImplicitAny` on; burn down the 740 `any`).
- Screens read `queries`, never `GameState` directly; one dominant object per screen (cyberpunkdreams lesson).
- Booking desk target: three zones (status · run sheet · consequences); booked segments stay on the sheet dimmed; motion 0.3s state / 0.5s movement, translate + opacity only, "settle" instead of blur.
- Paper look (rule 2a) locked until launch.
- `fits()` adds ellipsis + contrast checks; base 1920×1080, scale to 1440p/4K/ultrawide.
- Pictures (`kit/scene.ts`, `puppet.ts`, `diorama3d.ts`) split by concern: parts/shapes/render/sets; painted-once caches keyed by recipe.

## 11. Saves
- Versioned envelope `{v, created, game: GameState}`; `migrate[v]` chain; `tests/golden-saves/*` load in CI.
- Named slots, visible files, Steam Cloud, **error surfaced on failure** (fixes `save()` returning `!!db || true`).
- Yearly archive folds old rows into summaries; target < 1.5 MB at week 150.

## 12. Testing
| layer | what | gate |
|---|---|---|
| unit | each system's pure functions | per PR |
| headless sim | 60 weeks every company, errs 0, NaN 0 | per PR |
| golden state hash | determinism | per PR |
| balance | per company model, 3 seeds, 2 years: fired rate, bankrupt rate, popularity drift, Suggest grade spread ≈ C | per PR (fast) / nightly (full) |
| parity (migration only) | old ES5 engine vs new TS engine, same seed, compare state per week | until switch done |
| browser | Playwright per section + journey | nightly + before release |
| perf | new game < 3 s, week advance < 300 ms on target PC | per PR |

## 13. Migration plan ES5 → TS (strangler, never big-bang)
1. **Scaffold**: `engine/` package, tsconfig strict, esbuild bundle; `core/` types for `S` written from the current save shape (generate from a real save + hand-tune).
2. **Wrap**: `engine/legacy.ts` loads the old concatenated engine; the API re-exports old `E.*` with types. UI switches to the typed API. Nothing behaves differently.
3. **Parity harness**: run old and new side by side per seed; diff state each week.
4. **Port by domain**, leaf systems first: net → titles → road → media → company → people/relations → story → show/match → live. Each port: move code, replace wraps with events/modifiers, keep parity green.
5. **Cut legacy** when every domain is ported; delete `build.js` concat, `test-buildorder.js`, numeric prefixes.
6. **Then** apply new models (§4.4) one at a time behind flags, each with a save migration.
Rule: no behaviour change in steps 1–5. Balance work (Bill phase 1) runs on whichever engine is live; parity keeps them equal.

## 14. Roadmap after the switch (merges Bill's plan + TEW gaps)
| phase | content | architecture hook |
|---|---|---|
| 1 Balance | free winner pick, booking power buys extras, yearly owner goal, coasting fails, EWE money, balance test in CI | `company/owner`, `tests/balance` |
| 2 First hour | Booker Mode, seat commentary, owner letter restyle, interruption cap (top 3 matters/week), progress card on new game | `meta/first`, perf budget |
| 3 Screens | 1080p fit, ellipsis/contrast, save errors, roster bars with words; **Clock Wall booking screen** (docs/plans/booking-clock-wall.md, approved; first screen built on the TS engine) | `app/`, `save.ts`, `systems/show` (`fitsFor`, `cardKnock`), `systems/story` (`looseThreads`) |
| 4 Live show core | Director, catching fire, word travels, promos from state, hallway, arcs from beats, 40 new calls | `live/` LIVEK registry, `director` |
| 5 People/world slice | traits/wants/moods, **perception**, **morale ledger**, **per-region popularity (D1)**, **relationship types + UI (D2)**, **four health pools (D7)**, magazine, champions with belts, Power Ten board | `perception/`, `morale/`, `relations/`, `people/` |
| 5b Wrestler look | Paper collage (Ryan, 2026-10-26): cranium+jaw cards, glued feature cards, torn hair strips, patterned gear, cut-letter trunks, simplified 64px face; must generate variety for the whole roster, not only hand-tuned recipes | `app/kit/puppet.ts` → TS `app/kit/doll/` |
| 6a World default | public-domain default, parody opt-in (D5) | `content/`, title screen |
| 6 Sound + ship | crowd beds, Steam calls, installer, options, lawyer, demo | `app/audio`, desktop |
| 7 Post-launch | backstage politics, pre-history sim, scandals, narratives, eras, alliances/territory map/war, career mode, owner mode, creator suite | `content/` narratives/eras, `world/` |

## 15. Decisions (Ryan, 2026-10-26, via decision picker)
| # | topic | decided | consequence |
|---|---|---|---|
| D1 | Popularity | **Per region**, worker × region and company × region (regions = road areas) | migration from `w.ovr`/markets; crowd + TV rebalance; enables territory map/war |
| D2 | Relationship types | **Now, with full UI**: optional `family`, `personal`, `romantic` on the pair + editor + dossier display, before launch | conflicts with Bill's feature pause (phases 1–3) → confirm with Bill; build after the TS port, behind a flag |
| D3 | Schema library | **Zod** | `core/schema.ts`; types inferred from schemas |
| D4 | Engine build tool | **esbuild** | app build unchanged |
| D5 | Default Steam world | **Public domain default, parody opt-in** after a lawyer's read | overrides Bill's earlier call → confirm with Bill; title-screen world switch keeps both |
| D6 | Morale vs backstage | **Two modules**: `morale/` (ledger + stress), `backstage/` (rooms, people, asks; reads morale) | §3 layout as drawn |
| D7 | Health | **Four pools** (head, body, arms, legs), stacking penalties | replaces `w.cond`; migration splits old value evenly; injury + fatigue rebalance; UI shows pools in words |
Still open: none from v0.1. New ones get added here.

## 16. Free/OSS tools in this architecture (rule: free-tools-first)
TypeScript, esbuild/Vite, zod, Vitest, Playwright, ESLint + dependency-cruiser, Preact, Electron + steamworks.js, Blender (bpy headless renders: UI pieces, props, stills), Piper TTS (voices, already used), FFmpeg (loudness/convert), ImageMagick/oxipng (image compression), Git LFS (audio/images).
