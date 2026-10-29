# TEW IX world editor — data model

Source: the shipped *TEW IX External Editor Reference List v1.04*
(`Documentation\External Editor Reference List.docx`) `[doc]`, cross-checked
against strings in `TEW9.exe` `[bin]`.

## How the editor is built

- The live database is **Microsoft Access** — `Databases\<name>\TEW9.mdb` (16 MB for
  the default universe, 23 MB for `Default_Alt`). The file is **password-protected**:
  a 32-bit Jet/ODBC connection fails with *"Not a valid password"* before any table
  is readable. `[bin]`
- TEW IX introduced an **external editor** contract: the game exports/imports table
  data, and the reference document lists, per table, the **legal values** for each
  field. That document is the de-facto schema. `[doc]`
- Conventions that repeat across every table `[doc]`:
  - `Can be left blank to indicate no value` — empty is a real state, not an error.
  - Enumerations are **title-case strings**, not integers (e.g. `'Mutual Respect'`).
  - Range fields state bounds inclusively (`between 5 and 100`).
  - Reference fields hold **the initials of a company** or a table name, so the editor
    resolves by key, not by row order.
  - Lists marked `At least one option must be selected` are bitmask-style multi-values
    (e.g. a worker's `Active_In` regions, an alliance's `Types`, `Companies`, `Sizes`).
  - `_Names` tables are **name pools** used by generators, separate from live rows.

## The 45 tables, grouped by domain

**People and roster** — `Workers`, `Worker_Names`, `Alter_Egos`, `Contracts`,
`Starting_Morale`, `Starting_Injuries`, `Starting_Absences`, `Injuries`,
`Injury_Histories`, `Excursions`, `Free_Pictures`, `Picture_Changers`.

**Relationships and chemistry** — `Worker_Relationships`, `Chemistry`,
`Commentary_Experience`.

**Companies and business** — `Companies`, `Alliances`, `Stables`, `Stable_Names`,
`Contracts`, `Business_Histories`, `Scandals`, `Training_Facilities`,
`Broadcasters`, `Broadcasting_Deals`, `Broadcaster_Changes`.

**Content and shows** — `Events`, `TV_Shows`, `Show_Names`, `Match_Types`,
`Venues_And_Locations`, `Title_Belts`, `Title_Lineages`, `Title_Names`,
`Tag_Teams`, `Tag_Team_Names`, `Gimmicks`, `Wrestling_Moves`, `Tribute_Shows`,
`On_This_Day`.

**History and prestige** — `Hall_Of_Immortals`, `Halls_Of_Fame`, `Power_500s`,
`Mask_Hair_Histories`, `Business_Histories`.

> Counts and names above are exactly the headings present in the reference document.
> Tables with no enumerated values are intentionally absent from that document, so
> there are likely **more** tables in the real database than the 45 listed. `[infer]`

## Field-level patterns worth copying

### 1. Multi-value restriction bitmasks
`Alliances` carries `Types`, `Companies`, `Sizes`, `Gender Settings` — each
"at least one option". A single alliance row therefore encodes several independent
eligibility predicates. `[doc]`

`Broadcaster_Changes` goes further: it is a **rule row**, not an entity —
`Minimum_Company_Size`, `Minimum_Popularity`, `Minimum_Regions`,
`Minimum_Only_Within`, `Minimum_Production_Values`, `Minimum_Broadcast_Quality`,
`Minimum_Music`, `Maximum_Companies`, `Maximum_Broadcast_Slots`, plus a
region-by-region reach map (`Great_Lakes` … `Western_India`) using the
`'None' … 'Enormous'` scale. `[doc]`

**Design lesson:** TEW encodes "who may buy what" as data rows with thresholds,
rather than as code branches. That makes the world editor able to retune the entire
economy without touching the binary.

### 2. Domain enums on entities
`Workers` is the widest row type: `Gender_ID`, `Sexuality`, `Body_Type`, `Height`,
`Weight`/`Minimum_Weight`/`Maximum_Weight` (a range, used for weight-class rules),
`Nationality` (~190 values), `Based_In`, `Race`, `Style` (17 values incl.
`'Never Wrestles'`), `Celebrity` (`'No'`, `A-List` … `Z-List`, `Fad`),
`Active_In` (multi), `Face_Gimmick_Basis` / heel equivalent. `[doc]`

**Design lesson:** ranges (`Minimum_Weight`/`Maximum_Weight`) express *match rules*
on the entity, so the sim never stores a canonical "weight class".

### 3. History tables are append-only
`Business_Histories`, `Injury_Histories`, `Mask_Hair_Histories`,
`Title_Lineages`, `Power_500s` all record events rather than mutating an entity's
current state. Current state is derived from the newest row. `[doc]`/`[infer]`

### 4. Name pools separated from instances
`Worker_Names`, `Tag_Team_Names`, `Title_Names`, `Show_Names`, `Stable_Names`
exist so generated entities can draw from curated pools while hand-authored
entities keep stable names. `[doc]`

## Editor UX surfaces observed in the binary

`modRelationships`, `frmOptionsRelationship`, `editRelationship`,
`editRelationshipMass`, and the labels `Worker Relationships`, `Edit Relationship`,
`Current Relationship Status`, `Notable Relationships`. `[bin]`

The presence of a *mass* editor is the important one: TEW supports bulk mutation of
many pair records at once, which implies the editor treats relationships as a
filterable matrix rather than as per-worker detail screens.

## Open questions

- Actual column order, indexes, and the Jet password are unknown (encrypted DB). `[infer]`
- Whether "more tables than 45" is true — needs either the password or a Ghidra
  pass over the data-access layer. `[infer]`
