# TEW IX: complete schema index

The capstone of the binary/database investigation. Every table and column in every readable
file, with what remains inaccessible and why.

## The four databases

| File | Size | Access | Role |
|---|---|---|---|
| `System\TEW9Access.mdb` | 3.0 MB | ✅ **open, no password** | authored-world schema, **48 tables, 1,283 columns**, zero rows |
| `System\TEW9MDB.mdb` | 1.4 MB | ✅ **open, no password** | save-game schema, **39 tables, 800 columns**, one row (`Database_Info`) |
| `System\TEW9Settings.mdb` | 1.6 MB | 🔒 locked | settings, defaults, and probably the missing worker fields |
| `System\TEW9Default.mdb` | 2.6 MB | 🔒 locked | the "Included" content library |
| `Databases\Default\TEW9.mdb` | 16 MB | 🔒 locked | the CornellVerse world data |

Both templates are valid Jet 4 databases (`Standard Jet DB` header); both locked files fail
with the same `Not a valid password` error, so this is a genuine Jet database password, not a
format problem.

## Authored world — 48 tables, 1,283 columns

Sorted by width. This is the shape of a TEW world.

| Table | Cols | | Table | Cols |
|---|---|---|---|---|
| Companies | 148 | | Title_Names | 25 |
| Workers | 138 | | End_Of_Year_Company_Awards | 24 |
| Broadcasters | 80 | | Broadcasting_Deals | 23 |
| Broadcaster_Changes | 76 | | Injuries | 22 |
| Match_Types | 56 | | Tribute_Shows | 22 |
| Worker_Names | 55 | | TV_Shows | 19 |
| Contracts | 49 | | Halls_Of_Fame | 18 |
| Gimmicks | 48 | | Venues_And_Locations | 18 |
| Alliances | 39 | | Wrestling_Moves | 16 |
| Free_Pictures | 36 | | Alter_Egos | 15 |
| Training_Facilities | 35 | | Excursions | 15 |
| Title_Belts | 32 | | Stables | 15 |
| Tag_Team_Names | 30 | | Show_Names | 14 |
| Events | 27 | | Title_Lineages | 12 |
| Stable_Names | 27 | | Hall_Of_Immortals | 11 |
| End_Of_Year_Awards | 26 | | Employment_Histories | 10 |

**Narrow tables** (≤10 columns) — mostly ledgers and link rows:
`Mask_Hair_Histories` 10 · `Starting_Morale` 10 · `Tag_Teams` 10 · `Picture_Changes` 9 ·
`Business_Histories` 7 · **`Worker_Relationships` 7** · `Injury_Histories` 6 · `Scandals` 6 ·
`Chemistry` 5 · `Power_500s` 5 · `Starting_Absences` 5 · `Starting_Injuries` 5 ·
**`Alliance_Members` 5** · `Commentary_Experience` 4 · `Graduates` 4 · `On_This_Day` 4.

The distribution is the story: **four tables carry 442 of the 1,283 columns** (Companies,
Workers, Broadcasters, Broadcaster_Changes). Everything else is ledger or lookup.

## Save game — 39 tables, 800 columns

| Table | Cols | | Table | Cols |
|---|---|---|---|---|
| Workers | 135 | | Title_Histories | 11 |
| Companies | 113 | | Hall_Of_Immortals | 11 |
| Broadcasters | 66 | | Mask_And_Hair_Losses | 11 |
| Stables | 45 | | Previous_Shows | 11 |
| Contracts | 44 | | Player_Storyline_Involved | 8 |
| Alliances | 39 | | **Worker_Relationships** | 8 |
| Training_Facilities | 31 | | Player_Storylines | 7 |
| Title_Belts | 28 | | Alliance_Members | 6 |
| Financial_Histories | 24 | | **Chemistry_Discovered** | 6 |
| Hall_Of_Fames | 19 | | **Chemistry_Preset** | 6 |
| Match_Histories | 17 | | Game_World_Areas | 6 |
| TV_Shows | 17 | | Graduates | 5 |
| Save_Game_Info | 15 | | Injury_Histories | 5 |
| Company_Relationships | 14 | | **Attributes** | 4 |
| Tag_Teams | 14 | | Database_Info | 4 |
| **Morale_Effects** | 12 | | Power_500s | 4 |
| Player_Information | 12 | | Worker_Absences | 4 |
| Title_Histories_PreGame | 12 | | Match_Histories_Wrestlers | 3 |
| Broadcast_Slots | 11 | | Media_Groups | 2 |

`AI_Feuds` (10) makes the 39th.

Note the save's `Workers` is **135**, not 138 — three columns drop out (the business-skill trio
or the founder/user trio, depending on how the save template trims). `Companies` drops from 148
to **113**, so ~35 authored columns are not carried into a save.

## Every subsystem now has a table

| Subsystem | Where it lives |
|---|---|
| World economy/industry | `Game_World_Areas` (save) |
| Popularity (worker + company) | 57 columns in each of `Workers`, `Companies` |
| Relationships | `Worker_Relationships` (7 authored / 8 save) |
| Chemistry | `Chemistry` (authored) → `Chemistry_Preset` + `Chemistry_Discovered` (save) |
| Morale | not stored on the worker; `Morale_Effects` (12 cols, 4 severity bands) |
| Attributes/personality | `Attributes` (save, rows, `Hidden` flag) |
| Injuries | `Injuries` + `Injury_Histories` + `Worker_Absences` |
| Contracts | `Contracts` (49) + `Employment_Histories` |
| Titles | `Title_Belts` (32) + `Title_Lineages` (authored) + `Title_Histories` (save) |
| Shows/matches | `Events`, `TV_Shows`, `Match_Histories` |
| Media | `Broadcasters`, `Broadcasting_Deals`, `Broadcaster_Changes`, `Broadcast_Slots`, `Media_Groups` |
| Alliances | `Alliances` + `Alliance_Members` |
| Company relations | `Company_Relationships` (10 agreement slots) |
| Training | `Training_Facilities` + `Graduates` |
| Awards | `End_Of_Year_Awards`, `End_Of_Year_Company_Awards`, `Power_500s`, `Hall_Of_Immortals` |
| Storylines | `Player_Storylines` + `Player_Storyline_Involved` (save) |
| Scandals | `Scandals` (6 cols, timed) |

## What the locked files would add

**`TEW9Settings.mdb`** — the missing trio. `Scouting`, `Potential` and `Destiny` are documented
as mechanics and exist in **no readable table**. Settings is the only plausible home: scouting
governs the reported skill range, potential caps growth, destiny drives chemistry and
regeneration. It also likely holds the numeric defaults the handbook talks around.

**`TEW9Default.mdb`** — the "Included" content: the default match types, gimmick library, name
pools and award definitions that every new database inherits.

**`Databases\Default\TEW9.mdb`** — the CornellVerse data itself. Not needed for structure.

None of the three is required to rebuild any system. They are needed only to *calibrate*
numbers or to *copy content*, and copying content is the one thing that was never on the table.

## How to use this set

| Question | Read |
|---|---|
| How does the game actually play? | `tew9-the-loop.md`, `tew9-deep-*` (5 volumes) |
| What screens exist? | `tew9-recovered-screen-map.md` (343) |
| What data exists, authored? | this file + `tew9-real-schema.md`, `tew9-worker-model.md`, `tew9-company-and-history-model.md`, `tew9-content-model.md` |
| What data exists, runtime? | `tew9-save-schema.md` |
| What changed between versions? | `tew9-vs-tew2020.md`, `tew-series-evolution.md` |
| What should WrestleCraft build? | `wrestlecraft-tew9-gap-audit.md`, `tew9-build-order.md` |

## Confidence

Schema and column counts: **read directly, exact**. Screen inventory: **recovered identifiers,
exact names but inferred purpose**. Mechanics: **quoted from the vendor handbook**. The three
absent worker fields: **verified absent from both readable schemas**, cause unknown.
