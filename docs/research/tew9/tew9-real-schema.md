# TEW IX: the real database schema

Recovered from the **unlocked** system databases shipped with the game, not from
documentation.

| Source | Access | Contents |
|---|---|---|
| `System\TEW9Access.mdb` | **opened, no password** | **48 real tables, 1,283 columns** — the full schema |
| `System\TEW9MDB.mdb` | **opened, no password** | 39 tables — runtime/system subset |
| `System\TEW9Settings.mdb` | locked | settings |
| `Databases\Default\TEW9.mdb` | **locked** (Jet password) | the actual CornellVerse data, 16 MB |

So the *schema* was free; only the *data* is behind the password. Read via 32-bit Jet/ODBC;
columns read from result-set schemas because `GetSchema("Columns")` returns nothing on this
driver.

## Tables the vendor's 45-table document omits

The external-editor reference lists 45 tables. The real database has **48**, and these five
appear only in the database:

| Table | What it implies |
|---|---|
| `Alliance_Members` | alliance membership is its own table, with `Permanent_Member` and `Current_Member` — you can be a lapsed member |
| `Employment_Histories` | separate from `Business_Histories`: per-worker employment record |
| `End_Of_Year_Awards` | awards are data, not a hardcoded list |
| `End_Of_Year_Company_Awards` | company-level awards as a separate table |
| `Graduates` | dojo output is recorded, not just generated |

(`Picture_Changes` here vs `Picture_Changers` in the document is the same table, renamed.)

## Full table list with column counts

| Table | Cols | Table | Cols |
|---|---|---|---|
| Companies | **148** | Tag_Team_Names | 30 |
| Workers | **138** | Events | 27 |
| Broadcasters | 80 | Stable_Names | 27 |
| Broadcaster_Changes | 76 | End_Of_Year_Awards | 26 |
| Match_Types | 56 | Title_Names | 25 |
| Worker_Names | 55 | End_Of_Year_Company_Awards | 24 |
| Contracts | 49 | Broadcasting_Deals | 23 |
| Gimmicks | 48 | Injuries | 22 |
| Alliances | 39 | Title_Belts | 32 |
| Free_Pictures | 36 | Training_Facilities | 35 |
| Others (to 48 total) | <20 each | | |

## The four tables that matter most

### `Worker_Relationships` — 7 columns

```
Record_Name          String(30)
Worker_1             String(30)
Worker_2             String(30)
Family_Relationship  String(16)
Personal_Relationship String(15)
Romantic_Relationship String(15)
Mentor_And_Protege   Boolean(1)
```

This **settles the model**. There is:
- **no numeric strength or heat column** — affect is purely categorical, confirming the
  handbook;
- **no stored drift counters** — the "hidden counters" from `[hb 22.7]` are **runtime-only**,
  so they are recalculated or held in memory and are not saved state;
- **no direction field** — the pair is undirected, with `Worker_1`/`Worker_2` as the only
  ordering;
- mentor/protege is a **flag**, not a separate relationship row.

### `Workers` — 138 columns

Identity: `Name`, `Short_Name`, `Picture`, `Biography` (memo), `Organic_Biography`,
`Is_An_Avatar`, `Birthday`, `Debut_Date`, `Death_Date`.

Demographics: `Gender_ID` (18 chars — enough for the full list), `Sexuality`, `Body_Type`,
`Height` (string!), `Weight`/`Minimum_Weight`/`Maximum_Weight` (Int16), `Nationality`,
`Based_In`, `Race`, `Celebrity`, `Style`.

State flags: `Left_The_Business`, `Deceased`, `Retired_Wrestler`, `Non_Wrestler`, `Freelance`.

**Region availability as eight booleans** — `Active_In_USA` … `Active_In_India`.
**Roles as booleans** — `Role_As_Wrestler`, `Role_As_Occasional_Wrestler`, `Role_As_Referee`,
`Role_As_Announcer`, `Role_As_Colour`, `Role_As_Manager`, `Role_As_Personality`,
`Role_As_Road_Agent`.

Gimmicks live **on the worker**, not the contract: `Face_Gimmick`, `Face_Gimmick_Basis`,
`Heel_Gimmick`, and the full `Heel_Gimmick_Basis`.

Note `Height` is a **string** while weights are integers — heights carry unit/format text,
which matters if you ever import data.

### `Contracts` — 49 columns

Type flags: `Written_Contract`, `Exclusive_Contract`, `Touring_Contract`, `Paid_Monthly`,
`On_Loan`, `Developmental_Contract`, `Iron_Clad`.

Money: `Wage` (Int32), `Downside` (Int32), `Merchandise_Cut`, `Bonus_Type`, `Bonus_Amount`.

Dates and limits: `Contract_Began` (DateTime), `Expires` (**string** — the game's own
"3 months / 2 years / Random" enum), `Appearances_Left` (string).

Per-company worker state is duplicated onto the contract: `Alignment`, `Last_Turn`,
`Competes_In`, `Brand`, `Division`, `Manager`, `Mask`, `Move_Set`, `Momentum`, plus the
**gimmick triple** `Gimmick`, `Gimmick_Basis`, `Gimmick_Rating`, `Gimmick_Status`.

Clauses: `Creative_Control`, `Hiring_Veto`, `Wage_Matching`, `Shows_Control`,
`Roster_Usage`, `Intended_Role`, `Travel_Cover` — and roles repeated again here.

**This is the key structural insight:** the same worker has *different* alignment, gimmick,
mask, manager and momentum per employer. Those fields belong to the employment, not the
person. Getting that wrong is how a clone breaks the moment someone works two companies.

### `Scandals` — 5 columns

```
Record_Name, Worker, Scandal, Severity, Ends_Specific_Date | Ends_Duration
```

So a scandal is a **timed condition attached to a worker**, with severity, and either a
fixed end date or a duration — a persistent modifier, not a one-off event message.

## Schema design patterns worth copying

1. **`Record_Name` String(30) is the primary key everywhere**, and foreign keys are names
   (`Company_Initials` String(12), `Worker` String(30)). That is why the external editor
   matches records by name.
2. **Sets are boolean columns, not join tables.** Region availability, company sizes, alliance
   types, stable sizes (`Size_3_People` … `Size_10_Plus_People`), match availability — all
   exploded into flags. Cheap to query, painful to extend.
3. **Enumerations are stored as short strings**, not integers: `Severity String(12)`,
   `Intended_Role String(19)`, `Expires String(9)`. Self-describing but not normalised.
4. **Memo fields hold prose**: `Biography`, `Profile` (both 1 GB max).
5. **Per-employment state is duplicated onto `Contracts`** rather than normalised into an
   assignment entity.
6. **Two history tables, not one**: `Employment_Histories` and `Business_Histories`.

## What this adds to the picture

- The relationship system is **even simpler than documented**: three categorical strings and
  a flag. All the nuance lives in code, not data.
- Gimmicks are **per-worker (face/heel) and per-contract (current)**, which is how a heel run
  and a face run can coexist.
- Scandals are the only table that models a **timed state**; morale, momentum and popularity
  are all derived at runtime from other data.

## Still locked

`Databases\Default\TEW9.mdb` needs the Jet password. Nothing above required it — the schema
was in the clear. Unlocking the data would give real CornellVerse rows, which is not needed
for design work and not something to redistribute.
