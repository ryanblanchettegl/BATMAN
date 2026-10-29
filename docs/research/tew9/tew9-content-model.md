# TEW IX: the content model — matches, gimmicks, broadcasters, facilities, titles

The remaining authored tables, recovered from `TEW9Access.mdb` `[db]`. Together they show the
same design signature repeated: **compositional boolean flags plus 57-column region maps.**

## `Match_Types` — 56 columns, a rule grammar rather than a list

A match type is not a name and a multiplier. It is a **set of independent flags** that compose
the stipulation.

**Environment / props (20 booleans)**
`Steel_Cage` · `Steel_Cell` · `Steel_Chamber` · `Tables` · `Ladders` · `Overhead_Wires` ·
`Pole` · `Barbed_Wire` · `Scaffold` · `Fire` · `Trapping_Item` · `Light_Tubes` ·
`Bed_Of_Nails` · `Thumbtacks` · `Barbed_Wire_Cage` · `Barbed_Wire_Boards` · `Weapons` ·
`Glass` · `Explosives` · `Strap_Or_Chain`

**Victory conditions (19 booleans)**
`Pinfall` · `Submission` · `Count_Out` · `Disqualification` · `Time_Limit` · `Stoppage` ·
`Table_Break` · `Item_Retrieval` · `Cage_Escape` · `Throw_From_Ring` · `First_Blood` ·
`Trap_Within_Item` · `Strip` · `Ten_Count` · `Ten_Count_Following_Pinfall` ·
`Throw_From_Scaffold` · `Knock_Out` · `Set_On_Fire` · `Touch_Each_Corner`

**Metadata**
`Match_Prestige` · `Min_Fed_Size` · `Non_Wrestling_Time Byte` · `Minimum_Time Byte` ·
`Maximum_Time Byte` · `Match_Held` · `Match_Entrances` · `Match_Rules` · `Injury_Risk` ·
`Content_Risk` · `Has_Name_Value` · `Default_Match` · `Basic_Match`.

**Why this matters:** "Hell in a Cell" is not a special case in the code — it is
`Steel_Cell = true` plus `Pinfall = true`. A ladder match is `Ladders` plus `Item_Retrieval`.
That means a new stipulation is a **row**, and combinations the designer never shipped are
representable. Time limits are a `Byte` (1–255 minutes) and match length caps come from here,
not from code.

This is the single most copyable idea in the whole schema.

## `Broadcaster_Changes` — 76 columns, a dated override

```
Record_Name, Broadcaster, Name, Logo, Change_Applied DateTime, Profile,
Broadcast_Style, Wrestling_Stance, Risk_Levels,
Minimum_Company_Size, Minimum_Company_Base, Minimum_Popularity, Minimum_Regions,
Minimum_Only_Within, Minimum_Production_Values, Minimum_Broadcast_Quality, Minimum_Music,
Maximum_Companies Byte, Maximum_Broadcast_Slots Byte,
<57 region columns, String(10)>
```

A change row is applied to a broadcaster **on a date**, replacing its eligibility and reach.
So an outlet's requirements can tighten over time without touching the base `Broadcasters`
row — history is modelled as a sequence of dated overrides.

The **57 region columns** hold the `'None' … 'Enormous'` reach scale as strings. So broadcaster
reach is a 57-cell map per change row — the same denormalisation as popularity.

## `Gimmicks` — 48 columns, an eligibility filter

This is the table I most misread from the handbook. A gimmick is not just a name and a rating:
it declares **who it can be applied to**.

| Group | Columns |
|---|---|
| Identity | `Name`, `Description`, `Gimmick_Basis`, `Face_Gimmick`, `Heel_Gimmick` |
| Demographics | `Age`, `Gender_Limit`, `Minimum_Weight`, `Maximum_Weight` |
| Race gates | 8 booleans — `Race_White` … `Race_Other` |
| Body gates | 8 booleans — `Body_Type_Average` … `Body_Type_Obese` |
| **Skill minimums** | Aerial, Technical, Power, Athletic, Psychology, Selling, Charisma, Microphone, Menace, Sex_Appeal, Acting |
| **Skill maximums** | the same eleven again |

So "Monster" is not a label — it is *min Power, min Menace, max Microphone, max Aerial,
body-type gates*. The game can therefore tell you a gimmick **won't work** on a given worker
before you book it, which is exactly what the handbook means by gimmick pros and cons.

Eleven skills with both a floor and a ceiling is a real requirement spec, not flavour.

## `Training_Facilities` — 35 columns

```
Name, Logo, Profile, Facility_Type, Owned_By_Worker, Owned_By_Company_Initials,
Affiliated_With, Location, Training, Facilities, Graduates, AI_Graduate_Hiring,
Graduation, Allow_Graduations, Set_To_Open, Set_To_Close, Hard_Close,
Minimum_Weight, Maximum_Weight,
<15 style booleans: Style_Regular … Style_MMA_Crossover>
```

- `Training` and `Facilities` are **two separate levels** — quality of teaching and size of
  premises, which is exactly the handbook's "training level vs facility level" distinction.
- **15 style booleans** define what the school teaches. A school that teaches no style a worker
  needs is a wasted investment.
- `Hard_Close` vs soft close is a column, not a state machine.
- Ownership is either a worker or a company (`Owned_By_Worker` / `Owned_By_Company_Initials`).

## `Title_Belts` — 32 columns

```
Name, Picture, Profile, Owned_By_Initials, Original_Owner_Initials, Alliance_Name,
Status, Type, Matches, Gender_Limit, Division_Limit, Minimum_Weight, Maximum_Weight,
Minis_Division, Belt_Level, Prestige, Fix_Area_Region, Function, Brand,
Event_Frequency, Tour_Frequency, TV_Frequency,
Holder_1..3_Name, Reign_Began, Defences,
Is_An_Achievement, Annual_Competition, Annual_Held_At_Event, Annual_Format,
Annual_Retain_After_Victory
```

Notable:

- **`Matches`** — the belt declares which *match types* it can be defended in, which is why the
  handbook says a trios title cannot go on a singles match.
- **Three frequency columns** — `Event_Frequency`, `Tour_Frequency`, `TV_Frequency` — matching
  the three different probability bands (1-in-6 / 1-in-8 / 1-in-10) exactly.
- **Eligibility as data**: `Gender_Limit`, `Division_Limit`, `Minimum_Weight`,
  `Maximum_Weight`, `Minis_Division`.
- **Annual competition block**: `Annual_Competition`, `Annual_Held_At_Event`, `Annual_Format`,
  `Annual_Retain_After_Victory` — tournaments are configured on the belt, not in a
  tournaments table.
- **Current holders live on the belt** (`Holder_1..3_Name`, `Reign_Began`, `Defences`) *and* in
  `Title_Histories`. Current state is denormalised for speed; history is the ledger.

## The design signature, stated plainly

Across `Companies`, `Workers`, `Broadcaster_Changes`, `Match_Types`, `Gimmicks`,
`Training_Facilities` and `Title_Belts`, the same three moves recur:

1. **Enumerate the domain as boolean columns.** Match props, win conditions, races, body types,
   taught styles, region availability. Cheap to filter, ugly to extend.
2. **Store the region map inline, 57 times over.** Popularity, broadcaster reach, availability.
3. **Make requirements data, not code.** Gimmick skill floors/ceilings, title eligibility,
   broadcaster minimums, facility styles — all rows the editor can change.

The cost is wide tables and migration pain. The benefit is that a **database maker, not a
programmer**, can define a new match type, a new gimmick, or a new broadcaster era.

## What to copy into WrestleCraft, in order

1. **Compositional match types** — `flags[] + winConditions[] + timeBounds`. Highest leverage,
   smallest change.
2. **Gimmick requirement specs** — skill floors and ceilings, so the creator can refuse an
   impossible gimmick instead of silently penalising it.
3. **Three-band title frequency** (event / TV / tour), which matches your existing event/TV split.
4. **Training as two axes** (quality vs capacity), not one number.

## Still unread

`Broadcasters` (80), `Events` (27), `Free_Pictures` (36), `Alliances` (39) and the `_Names`
pools are structurally the same patterns; nothing there is likely to change a design decision.
`Scouting`/`Potential`/`Destiny` remain absent from every readable schema.
