# TEW IX: every option, every create surface, and what WrestleCraft lacks

Sources: `[hb]` Player's Handbook (42 ch / 707 sections); `[doc]` Grey Dog external-editor
reference (45 tables); `[code]` WrestleCraft `src/`.

---

# Part A — Every option

## A1. World options (hb 35) — 33

These change the simulation for every player, and are set when a database is authored.

| # | Option | What it controls |
|---|---|---|
| 1 | Auto Save | saves at end of turn (always on in multiplayer) |
| 2 | Fast Advance E-Mails | mail volume while advancing |
| 3 | Return To Office | auto-return after advancing |
| 4 | Regeneration | procedural replacement workers |
| 5 | Auto Fix Imbalances | repairs broken database states |
| 6 | New Worker Highlights | flags newly generated workers |
| 7 | Picture Requirement | whether pictures are mandatory |
| 8 | Area Battle Status | visibility of area battles |
| 9 | Regional Battle Status | visibility of regional battles |
| 10 | Restricted Areas | regions unavailable for booking |
| 11 | PPV Rating Unit | how PPV numbers are displayed |
| 12 | TV Rating Unit | how TV numbers are displayed |
| 13 | Injury Frequency | injury rate |
| 14 | Randomness Frequency | general variance |
| 15 | Death Frequency | worker death rate |
| 16 | 'Kenny' Deaths | comedic deaths on/off |
| 17 | Strict Storylines | enforce storyline rules |
| 18 | Strict Boom And Bust | force industry cycles |
| 19 | Organic Biographies | auto-written bios |
| 20 | Organic Companies | AI company evolution |
| 21 | Dirty Tricks | allow dirty-trick actions |
| 22 | Chemistry Effects | whether chemistry matters |
| 23 | Natural Growth Limits | caps on organic skill/pop growth |
| 24 | Loading Screen Profiles | loading screen content |
| 25 | Background Logos | backdrop logos |
| 26 | Default Backdrop | default backdrop image |
| 27 | Oversaturation | penalty for too much product |
| 28 | Graduation | training-facility graduation |
| 29 | Celebrity Generation | procedural celebrities |
| 30 | Annual Backup | yearly backup |
| 31 | Sandbox Editor | free-form editing during play |
| 32 | Change Skin / Pictures | skin switching |
| 33 | Create MDB File | export a database file |

## A2. Player preferences (hb 36) — 32

Scope: *"only impact their gameplay experience, not the game world as a whole."*
Functionally these are **system feature flags**.

Coloured Text · Small Roster Penalty · Repetitive Booking Penalty · Crowd Management ·
Gimmick Effects · Owner Goals · Worker Morale · Locker Room Morale · Dirt Sheet ·
Industry & Economy · Booking Times · Crowd Burn Out · Match Ratios · Scouting ·
Pro Mode · Disposition Change Timings · Momentum · Mandatory Event Pre-Booking ·
Mandatory TV Pre-Booking · Pre-Booking Bonuses · Pre-Book Reminders ·
Left Off Show Complaints · Match Aim Requirements · Overuse Penalties ·
Overuse Warnings · Road Agent Tips · Production Effects · Lifestyle Effects ·
Main Event Header Mode · Book Main Event First · CE Requirements Per Show ·
Skip Give The Night Off

## A3. Company settings

**Product (hb 17), 11 settings** — Current Product · Core Product · Gender Setting ·
Match Focus · Angle Focus · Face/Heel Divide · Men's Weight Split · Minis Divisions ·
Stables · Managers · In-Ring Settings.

**Backstage rules (hb 18), 7** — No drugs/alcohol/smoking · Arriving & leaving times ·
Dress code · No outsiders · Catering/masseuse/chiropractor · Transport & hotels ·
Dirty doctor.

**Production ladders** — Production Values (7) · Live Event Experience (7) ·
Broadcast Quality (6) · Music (7) · Merchandising (levels).

**Other** — size, ticket prices, drug policy, brand split, divisions, show priority,
touring settings, home arena, corporate HQ, owner goals, figurehead.

---

# Part B — Every create surface

TEW's creation model is the **editor**: you create rows in tables. 45 tables exist
`[doc]`; the ones that represent *creatable things* are below, with WrestleCraft status.

Legend: **yes** = create flow exists · **partial** = data/noun exists but no authoring
surface · **no** = absent.

| # | TEW creatable | Table (doc) | WrestleCraft |
|---|---|---|---|
| 1 | Worker | `Workers` | **yes** (`addWrestler`) |
| 2 | Worker name pool | `Worker_Names` | no |
| 3 | Alter ego / mask / persona | `Alter_Egos` | no |
| 4 | Company | `Companies` | **yes** (`newCompany`) |
| 5 | Contract | `Contracts` | **yes** (`99-contracts.js`) |
| 6 | Event | `Events` | **yes** (editor) |
| 7 | TV show | `TV_Shows` | **yes** (`addShow`) |
| 8 | Show name | `Show_Names` | no |
| 9 | Title belt | `Title_Belts` | **yes** (`addTitle`) |
| 10 | Title name | `Title_Names` | no |
| 11 | Title lineage | `Title_Lineages` | **partial** (`99-reigns.js`) |
| 12 | Tag team | `Tag_Teams` | **partial** (editor table only) |
| 13 | Tag team name | `Tag_Team_Names` | no |
| 14 | Stable | `Stables` | **no** (69 refs, not in `ED_TABLES`) |
| 15 | Stable name | `Stable_Names` | no |
| 16 | Alliance | `Alliances` | **no** (4 refs) |
| 17 | Broadcaster | `Broadcasters` | **partial** (`89-networks.js`, no create fn found) |
| 18 | Broadcasting deal | `Broadcasting_Deals` | **partial** |
| 19 | Broadcaster change (rule) | `Broadcaster_Changes` | no |
| 20 | Venue / location | `Venues_And_Locations` | **partial** (`99-venues.js`, not in `ED_TABLES`) |
| 21 | Match type | `Match_Types` | **partial** |
| 22 | Gimmick | `Gimmicks` | **partial** (`99-gimmicks.js`) |
| 23 | Wrestling move | `Wrestling_Moves` | no |
| 24 | Training facility | `Training_Facilities` | **partial** (`87-develop.js`) |
| 25 | Injury | `Injuries` | **partial** |
| 26 | Injury history | `Injury_Histories` | **partial** |
| 27 | Scandals | `Scandals` | **no** |
| 28 | Excursion | `Excursions` | **no** |
| 29 | Starting morale | `Starting_Morale` | **partial** (`w.morale`) |
| 30 | Starting injuries | `Starting_Injuries` | **partial** |
| 31 | Starting absences | `Starting_Absences` | **partial** (`w.away`) |
| 32 | Chemistry record | `Chemistry` | **partial** (`ring_chemistry`) |
| 33 | Commentary experience | `Commentary_Experience` | **partial** (44 refs) |
| 34 | Relationship | `Worker_Relationships` | **yes** (`edAddRel`) |
| 35 | Business history | `Business_Histories` | **partial** (`86-history.js`) |
| 36 | Mask/hair history | `Mask_Hair_Histories` | no |
| 37 | Hall of fame | `Halls_Of_Fame` | **partial** |
| 38 | Hall of immortals | `Hall_Of_Immortals` | no |
| 39 | Power 500 entry | `Power_500s` | no |
| 40 | Free picture | `Free_Pictures` | no |
| 41 | Picture changer | `Picture_Changers` | no |
| 42 | Tribute show | `Tribute_Shows` | no |
| 43 | On-this-day entry | `On_This_Day` | no |
| 44 | Narrative | §38 | **no** |
| 45 | Era | §37 | **no** |

**Also createable in-game (not tables):** user avatar (§6.1), company (starting your
own, §6.6), storylines, stables, brands, divisions, tournaments, promises, shortlists,
bookings/pre-bookings.

**WrestleCraft's authoring surface today:** `ED_TABLES = promotions, shows, titles,
workers, contracts, teams, relationships, events` — 8 of 45 — plus programmatic
creators `addWrestler`, `addTitle`, `addShow`, `newCompany`, `newGoal`, `newSaga`.

---

# Part C — Features TEW has that WrestleCraft does not

Ordered by impact on the player experience, not by difficulty.

## Tier 1 — structural, affects everything downstream

| Feature | TEW behaviour | WrestleCraft |
|---|---|---|
| **Perception per show** | recomputed at show start from popularity + momentum; gates who will lose to whom, leave-off tolerance, morale sensitivity | absent — only static `ovr` |
| **Morale as incident ledger** | aggregate of active incidents, each with polarity + hidden decay; severe beats several minor | scalar `morale` + `stress` + single `arc` |
| **Narratives** | data-authored triggers (date range, chance, requirements, effects, strength) | absent |
| **Eras** | date-bounded presets: universal + per-area + product trends | absent |
| **Scandals** | discrete public incidents with severity | absent (press reactions only) |
| **Editor breadth** | 45 authorable tables | 8 |

## Tier 2 — whole systems missing

| Feature | TEW | WrestleCraft |
|---|---|---|
| Excursions (work abroad, return improved) | hb 7.13 | absent (only financial loans) |
| Young lion system (rookie limits, forced losses, graduation) | hb 16.39 | thin (~5 refs) |
| Figurehead (company ace with modifiers + heirs) | hb 16.14 | absent |
| Cross-company alliances (7 types, titles, loans, no-poach) | hb 33 | 4 refs |
| Drug policy / testing | hb 16.29 | ~6 refs |
| Dirty tricks | hb 8.53 | absent (dirty *finishes* only) |
| Power 500 / Top 100s | hb 8.24, 41.10 | absent |
| Hall of Immortals | hb 41.9 | absent |
| Free pictures / picture changers | hb 40.9–40.10 | absent |
| Tribute shows / on-this-day | hb 41.3 | absent |
| Mask & hair history | `Mask_Hair_Histories` | absent |
| Alter egos | hb 19.28 | absent |
| Company relationships: war/hostile/friendly, no-signing, no-stealing | hb 30 | thin |
| Area & regional battles | hb 34.10–34.11 | absent |
| Media scrum, dirt sheet, in-game website | hb 13.6, 36.9, 34.13 | partial |

## Tier 3 — depth gaps in systems you already have

| System | You have | TEW adds |
|---|---|---|
| Relationships | type + strength + chemistry | 4 axes (family/personal/romantic/mentor), hidden drift counters, seniority, isolation, reporting thresholds |
| Tag teams | table + 16 refs | team types, tag experience, tag finisher, tag relationships, company-specific teams |
| Stables | 69 refs | 5 stable types (faction/brotherhood/cult/gang/alliance), strength score, member roles, AI stables |
| Training | 16 refs | 14 subsystems: facility type, affiliation, location, training level, facility level, styles taught, graduation, first refusal, AI hiring, closures, performance centre, takeover |
| Tournaments | 21 refs | annual competitions, title-linked tournaments, AI participation |
| Broadcasting | networks/TV/streaming | media groups, owned broadcasters, coverage calc, viewership formula, exclusivity, breach of contract, counter-programming, tape schedules |
| Contracts | 121 refs | 10 intended roles, creative control, hiring veto, wage matching, merch cut, downside, iron-clad, travel clause, limited appearances, stored templates |
| Owner goals | 31 refs | patience, roster turnover, finance targets, owner specialism, consequences |
| Product | present | 11 explicit settings + product-change gating + product trends |
| Backstage | locker room + rules | 7 formal rules + address-the-locker-room + pre/post-show incident phases |

## The five cheapest wins

1. **Stables + venues into `ED_TABLES`** — you already have both systems; they just
   aren't authorable. One line each.
2. **Perception snapshot** — a derived value plus 3 call sites; makes feuds believable.
3. **Excursion** — reuse `w.away`; add a return-on-date with skill delta.
4. **Figurehead** — one flag, two modifiers.
5. **Narratives** — small trigger engine; huge modding payoff; your `S.quests` already
   has the pattern.

## Caveats

- "No create fn found" means no `add*`/`new*` function matched; a flow could exist under
  another name. Treat `partial` rows as "verify in code".
- The handbook omits some internals by design; where it is silent this document says so
  rather than guessing.
