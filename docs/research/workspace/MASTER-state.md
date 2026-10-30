# MASTER — WrestleCraft

## State
- impl_count: 0
- next_efficiency_review_at: 5
- engine: TBD (default candidate: Godot 4 — decide via design-decision)
- concept: wrestling game (details TBD)

## Codebase: BATMAN/ (github.com/ryanblanchettegl/BATMAN, cloned 2026-10-26)
- Game: "WrestleCraft: Be The Booker", v0.88.0. Electron + Preact/TS UI (`app/`), ES5 sim (`src/*.js` → `engine.js` via `build.js`), output `dist/index.html`.
- Size: 741 files, 210MB working tree, 214MB git pack. Breakdown: ogg 138MB, png 46MB, js 6.4MB, html 16MB (2 builds).
- Docs: root CLAUDE.md 86KB (~32k tokens, read every session), TASKS.md 145KB, docs/*.md ~122k tokens, 69 md files total.
- Tests: 59 `test-*.js` at root + 42 browser tests in `app/tests/`.

## Optimization plan for BATMAN (ranked by payoff)
| # | action | why | gain |
|---|---|---|---|
| O1 | Stop committing build outputs: untrack `dist/`, `engine.js`; add them to .gitignore; CI builds them | `dist/music/*.ogg` duplicates `app/music/*.ogg` byte-for-byte (~69MB); two 8.2MB html builds per commit bloat history | repo −85MB/working tree; smaller pack going forward |
| O2 | Move audio/images to Git LFS (`git lfs track "*.ogg" "*.png" "*.woff2" "*.pdf"`), optionally `git lfs migrate import` history | 214MB pack, slow clones | fast clone/CI |
| O3 | Split root CLAUDE.md (86KB) → CLAUDE.md ≤8KB (rules, commands, layout index) + `docs/systems/<area>.md` per system, loaded on demand | ~32k tokens paid every session; most bullets only matter when touching that system | −25k tokens/session |
| O4 | Archive done work: move ticked items from TASKS.md (145KB), NEXT.md, TWEAKS.md, WISHLIST.md to `docs/archive/`; NEXT.md says TWEAKS/WISHLIST "finished" | finished lists still read as live | less context, clearer queue |
| O5 | One task source: merge NEXT.md + TASKS.md open items + docs/roadmap.md into one `TASKS.md` (open only) + decisions table | 3–4 overlapping queues | no conflicting priorities |
| O6 | Move 59 root `test-*.js` → `tests/engine/`; add `tests/run-all.js` (parallel, worker_threads) and `npm test` runs all | root clutter; tests run one by one | faster full check, clean root |
| O7 | Delete/park `docs/mockups/` (129 files, triplicated libs `marks2.js`, `dotlib.js`, `final.a.js`, `maplib.js`) → keep only chosen PNGs in `docs/screens/` | dead prototypes; duplicates | −files, less noise |
| O8 | Remove `legacy/` (ui.js 178KB) and `test8.js`/`test9.js` if unreferenced (grep first) | dead code | clarity |
| O9 | `app/addons/sfx-bank.js` 2.1MB base64 Opus inside JS → ship as `.ogg`/`.opus` files loaded on demand | base64 +33% size, parse cost on boot | faster startup, smaller page |
| O10 | `src/` naming: 105 files where order = numeric prefix and many `99-*` share a slot ("wraps:" headers). Replace with an explicit order list in `build.js` (or ES modules + esbuild) | prefix collisions; `test-buildorder.js` exists only to police it | simpler build, real imports |
| O11 | Big data JSON (`universes/parody.json` 1MB, packed from `universes/parody/`): treat as build output too (O1) | duplicate of source folder | −1MB per change in history |
| O12 | Large TS (`kit/puppet.ts` 135KB, `kit/scene.ts` 117KB, `diorama3d.ts` 74KB): split by concern (parts/shapes/render) | hard to read in one pass; costly for Claude | targeted reads |
| O13 | Free tools (per rule 1): Blender already used (`tools/creator/ui-pieces.py`); add Blender headless renders for stills/3D props in `MODELS3`; FFmpeg/`loudnorm` for music loudness; ImageMagick to batch-compress PNGs (`magick mogrify -strip -quality 85` or `oxipng`) | 46MB png | est. −30–50% image size |

## Do-first order
O1 → O3 → O4/O5 → O6 → O7/O8 → O9 → O2 → rest. Each one is its own PR on BATMAN, tests (`npm run check`) green before merge.

## Systems
| system | status | owner-skill | notes |
|---|---|---|---|
| toolchain | installing | free-tools-first | see TOOLSET.md |
| decision flow | ready | design-decision | tools/decision-picker.html |
| efficiency cycle | ready | efficiency-review | every 5 impls |
| TS architecture | draft v0.2 | wrestlecraft-architecture | docs/ARCHITECTURE.md; D1–D7 decided §15; D2, D5 need Bill's OK |
| Desk concepts | superseded (did not match real screens) | design-decision | tools/concepts/screens.html |
| Booking screen | Clock Wall chosen; blueprint docs/plans/booking-clock-wall.md answered (14/14), approved; build AFTER the TS engine switch, on the new engine | design-decision + critic agent | tools/concepts/booker.html ?v=wall (8.6) / truck (8.3, gated on scene.ts render cost) / cork (8.2); 5 critic rounds, history booker-r1..r4.html, shots tools/concepts/review/; real v0.88 screens in tools/concepts/current/; picker ?set=2026-10-26-booker |
| Wrestler look | Blueprint gate 2 answered (§11: layer editor like SmackDown on skin + all gear, push-by-type proportions, 3 poses, whole-world uniqueness, turn + age changes, local + Workshop images); build AFTER the TS switch, EWE first; gimmick types → signature table done: 20 types (10 TEW-modelled, renamed: Bruiser, Hotshot, Funny Man, Chill, Loose Cannon, Straight Shooter, Custom, Rat, Nut, Good Guy; 10 ours), docs/plans/gimmick-signatures.md. Gimmicks drive ONLY acting, dialogue, relationships (Ryan); looks are 20 separate presets. Engine GIMS 14→20 + removing GFX match effects need rule 9d gates. G · Paper doll (?v=doll) SIGNED OFF by critic 9.3/10 as matching Ryan's reference current/ryan-ref-paper-doll.jpg (rounds D1 7.0 → D2 8.7 → D3 9.3, 2026-10-27). Create a Player fit check passes on 9 bodies (&show=cap). Shots review/d1..d3-doll-*, final-doll-*; backups characters-r13..r15.html. Blueprint docs/plans/wrestler-look-scrapbook.md (gate 2 questions open). Earlier: F Scrapbook (9.0) vs C Human (8.8). Ink + Lit dropped by Ryan. Knee + elbow pads on everyone (Ryan, pad colour = a.pad or g2; none over jeans). Next: blueprint + questions (rule 9d) for porting to puppet.ts recipes | design-decision + character critic | tools/concepts/characters.html ?v=human / scrap, &show=figs/heads/women/broadcast/scene/stars/starheads. stars = 15 real wrestlers (AEW/WWE/legends top 5), concept-only, never ships. 11 critic rounds, history characters-r1..r10.html, shots tools/concepts/review/c8..c12 + final-*.png; picker ?set=2026-10-26-characters. Risks: puppet.ts recipeOf() must produce this variety for the whole roster (test 20 random); rig needs action poses (scene view uses per-pose overrides) |
| ES5→TS port | not started | ts-engine-port | strangler + parity harness, ARCHITECTURE §13 |

## Layout rule (Ryan, 2026-10-27)
- **The three window sizes are uniform across the game:** every main page uses the Clock Wall's three columns. Left list 22%, centre wall **56%**, right picked pane **22%** (Ryan changed it from 22/45/33 the same day; the Clock Wall blueprint is updated to match), with the top menu and notification bar and the bottom line with SPACE. Pages differ only in what each window holds.

## Implementations log
| # | date | what | files |
|---|---|---|---|

## Decisions log
| date | question | options | chosen | by |
|---|---|---|---|---|
| 2026-10-26 | D1 popularity storage | per region / global+markets / hybrid | per region | Ryan |
| 2026-10-26 | D2 relationship types | after launch / during port / now+UI | now, full UI (confirm vs Bill's pause) | Ryan |
| 2026-10-26 | D3 schema lib | zod / valibot / typia | zod | Ryan |
| 2026-10-26 | D4 engine build | esbuild / Vite / tsc | esbuild | Ryan |
| 2026-10-26 | D5 Steam default world | public domain / parody / both | public domain, parody opt-in (confirm with Bill) | Ryan |
| 2026-10-26 | D6 morale vs backstage | two modules / one / in people | two modules | Ryan |
| 2026-10-26 | D7 health | one+tag / four pools / as is | four pools | Ryan |
| 2026-10-26 | Booking screen | Clock Wall 8.6 / Production Truck 8.3 / Corkboard 8.2 | Clock Wall | Ryan |
| 2026-10-26 | Wrestler look (body + head) | Marker on card 8.5 / Paper collage 8.4 / Human 8.1 | Paper collage, then switched to Human as favourite | Ryan |
| 2026-10-26 | Human variants | C Human / D Ink / E Lit / F Scrapbook | polish C + F only; Ink and Lit dropped | Ryan |
| 2026-10-26 | Final wrestler look | F Scrapbook 9.0 / C Human 8.8 | F Scrapbook; polish to 9.8 + blueprint signature style | Ryan |
| 2026-10-27 | Wrestler look, final target | Ryan's own reference image (tools/concepts/current/ryan-ref-paper-doll.jpg): "This is perfect" | G · Paper doll: human build, felt-grain card, thick cream die-cut border, soft shadow on navy, solid gear, brass pins, glossy pads | Ryan |

## Efficiency reviews
| at impl | findings | changes |
|---|---|---|
