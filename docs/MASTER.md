<!-- Saved 29 October 2026 from Ryan's upload (built 28 October in another workspace). Ryan's answer: "Merge its decisions in".
     How it fits this repo:
     - Its decisions (section 7) and its layout rule are now in TASKS.md ("Ryan's decisions") and CLAUDE.md (rule 5f).
     - Its section 6 (the ES5 to TS port) is DONE here a different way: every file is a module in engine/*.ts, with
       imports and the $L registry for wraps (docs/adr/0001, 0002), not engine/systems/<domain>/ with api/ and events.
       The systems/, api/, events and zod layout in its section 5 is a target, not the current shape.
     - Files it names that are not in this repo yet: docs/ARCHITECTURE.md, docs/TOOLSET.md (here: docs/toolset.md),
       docs/plans/booking-clock-wall.md, docs/plans/wrestler-look-scrapbook.md, docs/plans/gimmick-signatures.md,
       tools/decision-picker.html, docs/research/tew9/. The plans in its section 9 are summarised there only.
     - Its "one step per go-ahead" (section 2, rule 9) differs from CLAUDE.md rule 9a (approved plans run unattended,
       Ryan 23 October); rule 9a stands until Ryan says otherwise.
     - impl_count starts at 0 here on 29 October. -->
# WrestleCraft — Master Document for Claude

One file that gives a fresh Claude session the whole project: rules, state, architecture, decisions, plans and workflows.
Built 2026-10-28 from `CLAUDE.md`, `docs/MASTER.md`, `docs/ARCHITECTURE.md`, `docs/TOOLSET.md`, `docs/plans/*`, `.claude/skills/*`.
Source docs win on detail. Change any of them → update this file in the same change.

---

## 1. Project
| key | value |
|---|---|
| game | WrestleCraft: Be The Booker, v0.88.0 |
| repo | `BATMAN/` — github.com/ryanblanchettegl/BATMAN |
| owner | Ryan (decides design/art). Bill = co-planner (6 plan PDFs, 21 Oct) |
| stack today | Electron + Preact/TS UI (`app/`), ES5 sim (`src/*.js` → `engine.js` via `build.js`), output `dist/index.html` |
| stack target | TypeScript engine package `engine/` (strangler port, §6) |
| tests | 59 root `test-*.js` + 42 browser tests `app/tests/`; `npm run check` green before merge |
| impl_count | 0 · next efficiency review at 5 |

## 2. Hard rules
1. **Free-first** — before building/buying: skill `free-tools-first`. Record picks in `docs/TOOLSET.md`.
2. **Decisions** — any design/art/UX/audio/naming choice → skill `design-decision`: 3 best options in `tools/decision-picker.html`, Ryan picks. Never decide silently. Concepts pass the critic agent first; only scores ≥ Ryan's bar reach him (desk: 8.5).
3. **Efficiency cycle** — `impl_count += 1` per finished implementation in `docs/MASTER.md`; every multiple of 5 → skill `efficiency-review` before the next task.
4. **Doc sync** — any system/tool/decision change → update the matching Master Document in the same turn.
5. **Assets** — sources `assets/src/`, exports `assets/export/`, large binaries via Git LFS.
6. **Style** — bullets, tables, key:value. Paths + exact commands. No padding.
7. **Layout** — every main page uses three windows **22 / 56 / 22** (left list · centre wall · right picked pane), plus top menu, notification bar, bottom line with SPACE.
8. **Naming** — no real-world or TEW names in game content. Research = mechanics only.
9. **Blueprint gates (rule 9d)** — blueprint → Ryan's questions answered → go-ahead → build, one step per go-ahead.

## 3. Master documents
| file | holds |
|---|---|
| `CLAUDE.md` | rules |
| `docs/MASTER.md` | state, systems, decisions log, impl counter, efficiency reviews |
| `docs/ARCHITECTURE.md` | TS engine target (draft v0.2) |
| `docs/TOOLSET.md` | free/OSS tools + install status |
| `docs/research/README.md` | research index: Bill's PDFs, TEW IX notes, Create a Player, UI study |
| `docs/plans/` | blueprints: booking Clock Wall, wrestler look, gimmick signatures |

## 4. Skills (installed project + user level)
| skill | use when |
|---|---|
| `free-tools-first` | before building any feature/asset/pipeline step |
| `design-decision` | any design/art/UX/audio/naming choice |
| `efficiency-review` | impl_count hits a multiple of 5 |
| `wrestlecraft-architecture` | before any engine system, data model, save field, event, screen data flow |
| `ts-engine-port` | porting ES5 `src/*.js` → TS `engine/` |
| `tew9-systems-transfer` | editor tables, relationships, backstage, morale, company management |
| `create-a-player` (`wrestlecraft-create-a-player`) | creator / world-editor worker suite |

### Skill workflows (short)
- **free-tools-first**: read TOOLSET → else `gh search repos "<concept> godot" --sort stars --limit 10` + web (itch, OpenGameArt, Kenney, Poly Haven) → filter license (CC0/MIT/BSD/Apache/zlib; GPL tool OK; NC → flag), commit < 2y, Windows → table `tool | fits | license | effort | install` → add to TOOLSET, `winget install --id <id> -e`.
- **design-decision**: 3 distinct options (title, pitch, pros, cons, visual) → `tools/decisions/<yyyy-mm-dd>-<slug>.json` + `.js` (`window.DECISIONS = {...}`) → open picker → wait → log in MASTER decisions → apply.
- **efficiency-review**: top 3 wins across build time, dead code/dupes, doc compression, slow manual steps, new plugins → log row, `next_efficiency_review_at += 5`.
- **wrestlecraft-architecture**: pick module → optional state fields + migrate → events/modifiers, never wraps → `rng`/`hash01` → moddable content as schema → expose via `api/` → pref flag if heavy → tests → update ARCHITECTURE + MASTER.
- **ts-engine-port**: read domain files + every `wraps:` touching them → types from a real save → move to `engine/systems/<domain>/` → wraps → events/modifiers in original order → `rnd(S)`→`rng`, `h01`→`hash01` → re-export via `api/` → parity seeds 3/11/29 × 60 weeks, diff empty → no behaviour change → tick MASTER, bump impl_count.
- **tew9-systems-transfer**: start `docs/research/tew9/wrestlecraft-tew9-gap-audit.md` + `tew9-the-loop.md`; evidence tags `[doc] [bin] [code] [infer]` (never promote `[infer]`); additive migrations; never copy TEW text/data; unknown constants = labelled tunables.
- **create-a-player**: creator derives stats via `edRatings()` (`src/86-editor.js`); pick one approach — A widen inputs (default) · B advanced mode with point budget · C presentation. New fields optional; seeded random only (`edRnd`/`edPick`); test in `test-create.js`; `E.edCheck(pkg)` clean after round trip.

## 5. Architecture (target TS engine)
Pure deterministic TS sim owns all state as plain JSON; typed command/query API; UI only reads queries and sends commands; systems talk via events; content is schema-validated data; the live show is the centre.

### Principles
| # | rule |
|---|---|
| P1 | engine owns state; UI never writes `S` |
| P2 | same seed + same commands = byte-identical state |
| P3 | `rng(stream)` for outcomes, `hash01(key)` for flavour; flavour never touches `rng` |
| P4 | save = versioned JSON; new fields optional with default; old saves always load |
| P5 | no module reaches into another's state; events or public API only |
| P6 | content is data with a schema |
| P7 | direction legible, magnitude hidden (words for player, numbers in debug "dirt sheet") |
| P8 | every heavy system has an on/off pref |
| P9 | player is an entity, same rules as rival bookers |
| P10 | perf budgets in CI: new game < 3 s, week advance < 300 ms |

### Layout
```
app/      Preact UI — reads engine/api only
engine/
  core/     state, rng, hash, events, clock, tick, schema (zod), save, flags
  systems/  match show live night story people relations morale perception backstage
            company world media road titles net meta editor
  api/      commands.ts (mutations) · queries.ts (pure, memoised)
  content/  schemas + loaders
data/     world packages (parody, public_domain)
tools/    Blender bpy, builders, balance probes
tests/    unit, headless, golden saves, browser (Playwright)
```
Import rules enforced in CI (ESLint `import/no-restricted-paths` or dependency-cruiser).

### Week tick (`core/tick.ts`)
1 week.start (decay) → 2 world.plan (AI, read-only snapshot) → 3 contracts/health → 4 narratives → 5 director → 6 each show: pre-show → perception.freeze → card → live → grade → apply atomically (ratings → popularity → momentum → morale → money) → 7 after-show → 8 week.end (finance, history, podcast, yearly archive).
Old hooks → events: `MQX`→`match.quality`, `CRX`→`match.crowd`, `FINX`→`match.finish`, `EFX`→`match.effects`, `POST`→`match.post`, `SHOWX`→`show.done`, `WEEKX`→`week.end`, `NEWX`→`game.new`, `PREX`→`show.pre`, `TASKX`→`tasks.collect`. Value wraps → `modifiers.register(name, fn, {order})`.

### Key models
| model | shape |
|---|---|
| Worker vs Contract | Worker = identity, body, attributes 1–100, health, look, traits, popularity; Contract = per employer: alignment, gimmick, momentum, role, clauses, pay |
| Popularity | worker × region, company × region (regions = road areas) |
| Morale | incident ledger `{reason, sev 1..4, week, source, playerCaused}`, decayed sum; `stress` gauge |
| Perception | frozen snapshot at `liveBegin` |
| Relationships | numeric `strength` + memory, plus optional `family`/`personal`/`romantic` enums |
| Chemistry | `preset` + `discovered` (fog of war) |
| Match type | composable `{props[], winConditions[], timeMin/Max, injuryRisk, contentRisk}` |
| Health | four pools head/body/arms/legs; any at 0 = career over |
| Aging | lowers caps, not stats |
| rng streams | `match live world people ai gen` |

### Saves and tests
- Envelope `{v, created, game}`, `migrate[v]` chain, golden saves in CI, errors surfaced, yearly archive (< 1.5 MB at week 150).
- Gates: unit · 60-week headless (errs 0, NaN 0) · golden state hash · balance (3 seeds, 2 years) · parity (during port) · browser nightly · perf.

## 6. ES5 → TS port (strangler, no big-bang)
1. Scaffold `engine/` (strict TS, esbuild), types from a real save.
2. Wrap: `engine/legacy.ts` loads old engine; typed API re-exports `E.*`; UI switches to it.
3. Parity harness old vs new per seed, per week.
4. Port leaf first: net → titles → road → media → company → people/relations → story → show/match → live.
5. Cut legacy (`build.js` concat, `test-buildorder.js`, numeric prefixes).
6. Then new models one at a time behind flags, each with a save migration.
No behaviour change in steps 1–5. Old-file → module map: `docs/ARCHITECTURE.md` §3.1.

## 7. Decisions (Ryan)
| date | topic | chosen |
|---|---|---|
| 10-26 | D1 popularity | per region |
| 10-26 | D2 relationship types | now, full UI (confirm vs Bill's feature pause) |
| 10-26 | D3 schema lib | zod |
| 10-26 | D4 engine build | esbuild |
| 10-26 | D5 Steam default world | public domain, parody opt-in (confirm with Bill, lawyer read) |
| 10-26 | D6 morale vs backstage | two modules |
| 10-26 | D7 health | four pools |
| 10-26 | booking screen | Clock Wall (8.6) |
| 10-27 | wrestler look final | G · Paper doll, from `tools/concepts/current/ryan-ref-paper-doll.jpg` (critic 9.3) |
| 10-27 | layout | 22/56/22 game-wide |
| 10-27 | gimmicks | drive only acting, dialogue, relationships — never looks or match ratings |

## 8. Systems status
| system | status | next |
|---|---|---|
| toolchain | installing | retry Blender, Pixelorama, LibreSprite, OpenToonz, Tiled, MuseScore |
| decision flow | ready | — |
| efficiency cycle | ready | first at impl 5 |
| TS architecture | draft v0.2 | D2, D5 need Bill's OK |
| ES5→TS port | not started | step 1 scaffold |
| Booking Clock Wall | blueprint approved (14/14 answered) | build first on TS engine |
| Wrestler look | blueprint gate 2 answered | build after TS switch, EWE first |
| Gimmicks | 20 types + 20 look presets drafted | confirm draft columns; decide fate of `GFX` match effects (gate 9d) |

## 9. Plans
### Booking Clock Wall (`docs/plans/booking-clock-wall.md`)
- Left 22%: roster cards (bust, overall, side, belt, feud dots, Body/Mood bars), chips All/Men/Women/Faces/Heels/Free/Teams.
- Centre 56%: ruler 0:00–2:00 (3:00 squeezed to fit), pieces height = minutes, "N MIN OPEN", red 2:00 line, feud gutter, loose-thread strip (3 + "+N").
- Right 22%: picked segment, option tiles → pop-ups, Who fits / agent facts, knock-on lines, tab buttons (Notes, Order, Clock, Promo, Stories, Targets).
- States: Empty → Building → Ready → Over; SPACE label follows.
- Win chances in words only; Finish BP costs stay numbers. Suggest fills gaps, then "Suggest all". Drop on full = swap. Hurt = red, player decides. Battle royal = one piece with name grid. Corkboard texture on ruler/open block. Render gate fail → one still per piece.
- New queries: `fitsFor(S, slot)`, `cardKnock(S, card)`, `looseThreads(S, card)` in `engine/systems/show/` + `story/`.
- Build: queries + test → layout → wall → right pane → feud gutter → storyboards → browser tests at 1080p/1440p/4K.

### Wrestler look (`docs/plans/wrestler-look-scrapbook.md`)
- Paper doll: 6.8 heads pushed by type, felt-grain card, cream die-cut border (`hu × 0.19`), soft shadow on navy, solid gear, brass joint pins, glossy knee + elbow pads on everyone (none over jeans).
- Signature layer: 2–4 of 8 slots (silhouette, hair, face marks, gear, layers, outerwear, accessories, pose). Unique across the whole world.
- Layer editor like old SmackDown games: image/shape/text layers with opacity on skin and all gear, in the part's own frame. Local files + Steam Workshop.
- Every part morphs to the body; Create a Player is modular (each piece picked separately); finishes glitter/foil/leather/denim.
- Three poses (entrance, win, taunt); signature pose on cards/posters; promo camera waist-up 2×.
- Turn = palette + poses; age = greyer, heavier (from age, no `rnd(S)`).
- Perf: doll < 1 ms, 30 at 60 fps.

### Gimmicks + looks (`docs/plans/gimmick-signatures.md`)
- 20 gimmicks: Bruiser, Hotshot, Funny Man, Chill, Loose Cannon, Straight Shooter, Custom, Rat, Nut, Good Guy, Underdog, Daredevil, Technician, Monster, Old hand, Rebel, Showman, Mystic, Workhorse, Outlaw. Each has Risk, Difficulty, Subtlety, skill floors/ceilings.
- 20 look presets (Street brawler … Jailbird, blank). Generated wrestler: ~70% pieces from one preset, 30% any, picked by hash of name.

## 10. BATMAN repo optimization queue
Order: O1 → O3 → O4/O5 → O6 → O7/O8 → O9 → O2 → rest. One PR each.
| # | action |
|---|---|
| O1 | untrack `dist/`, `engine.js`; CI builds them (−85 MB) |
| O2 | Git LFS for ogg/png/woff2/pdf |
| O3 | split 86 KB `CLAUDE.md` → ≤ 8 KB + `docs/systems/<area>.md` (−25k tokens/session) |
| O4 | archive done items from TASKS/NEXT/TWEAKS/WISHLIST |
| O5 | one task source `TASKS.md` |
| O6 | tests → `tests/engine/`, parallel `tests/run-all.js` |
| O7 | park `docs/mockups/` |
| O8 | remove `legacy/`, `test8.js`, `test9.js` if unreferenced |
| O9 | sfx-bank base64 → real audio files |
| O10 | explicit build order list instead of numeric prefixes |
| O11 | `universes/parody.json` as build output |
| O12 | split `puppet.ts`, `scene.ts`, `diorama3d.ts` |
| O13 | ImageMagick/oxipng PNGs, FFmpeg loudnorm, Blender headless stills |

## 11. Tools (free/OSS)
- Installed: Godot, Krita, GIMP, Inkscape, Blockbench, Synfig, Audacity, LMMS, Kdenlive, OBS, FFmpeg, ImageMagick, Git LFS, GitHub CLI, Material Maker.
- Failed/manual: Blender, Pixelorama, LibreSprite, OpenToonz, Tiled, MuseScore.
- Engine stack: TypeScript, esbuild, zod, Vitest, Playwright, ESLint + dependency-cruiser, Preact, Electron + steamworks.js, Piper TTS.
- Assets CC0 first: Kenney, Poly Haven, ambientCG, Quaternius; check per asset on OpenGameArt/Freesound.
- License: commercial-safe = CC0/MIT/BSD/Apache/zlib; GPL tools OK; non-commercial weights (e.g. MusicGen) → flag before use.

## 12. Roadmap after the switch
1 Balance · 2 First hour · 3 Screens (Clock Wall first) · 4 Live show core (Director, 40 new calls) · 5 People/world (perception, morale ledger, regional popularity, relationship types, health pools) · 5b Wrestler look · 6a Public-domain default world · 6 Sound + ship (Steam) · 7 Post-launch (politics, scandals, narratives, eras, alliances, career/owner modes).

<!-- 29 October: the decision sets and concept pages from the other workspace are saved beside this file:
     tools/decisions/2026-10-26-{architecture,booker,characters,screens}.js (and architecture.json), and the concept pages
     docs/concepts/booker-r4.html (the booking screen finalists: Clock Wall 8.6, Production Truck 8.3, ...) and
     docs/concepts/characters-r15.html. Images they point to (concepts/review/*.jpg) were not uploaded. -->
