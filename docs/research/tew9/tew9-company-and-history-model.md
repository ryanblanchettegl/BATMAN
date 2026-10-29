# TEW IX: the company model and the history model

Recovered from `Companies` (148 columns) in the authored schema, plus the save-side history
tables. `[db]` = read from the schema.

## `Companies` — 148 columns, grouped

### Identity and dates
`Name` · `Initials` (String 12 — the join key used everywhere) · `Logo` · `Backdrop` ·
`Banner` · `Profile` (memo) · `Website_Address` ·
`Set_To_Open` · `Dont_Open_Before` · `Dont_Open_After` · `Closed_On`.

Four separate date fields, not one. A company can be scheduled to open inside a window and
closed independently — which is how historical databases model promotions that come and go.

### Standing
`Prestige Int16` · `Momentum String` · `Money Int32` · `Maximum_Size` · `Loyalty` ·
`Drug_Policy` · `Fix_Belts` · `Pre_Alliance` · `Young_Lion_System` ·
`Built_Headquarters` · `Built_Hall_Of_Fame`.

Note `Momentum` and `Loyalty` are **strings**, not numbers — they are banded values, and
`Pre_Alliance` records alliance membership *before* the game starts.

### Geography — 57 explicit columns
Every region is a column of its own: `Great_Lakes`, `Mid_Atlantic` … `Western_India`, each
`Int16`. **Popularity is not a join table.** That is a deliberate denormalisation: it makes
per-region queries trivial and adding a region a schema migration.

Geo tags are also per company size: `Geo_Tag_Insignificant`, `Geo_Tag_Tiny`, `Geo_Tag_Small`
— so a company can be placed differently in a small venue than a large one.

### Product and in-ring rules
`Product_Style_Name` · `Core_Product` · `Current_Product` (String 100 each) ·
`Gender_Setting` · `Match_Focus` · `Angle_Focus` · `AI_Booking_Style` ·
`Face_Heel_Divide` + `Face_Heel_Type` + `Face_Heel_Strict` · `Mens_Weight_Split` ·
`Junior_Division_Weight_Limit Int16` · `Mens_Minis_Division` · `Womens_Minis_Division` ·
`Stables` · `Managers`.

**In-ring rule flags** — the ones that change how a match is judged:
`Spinal_Impact_Moves_Disallowed` · `Scripted_Matches` · `High_Risk_Moves_Disallowed` ·
`Angle_Dialogue_Scripted` · `Matches_Called_In_Ring`.

These are the mechanical meaning of "product": not flavour text, but which move classes are
legal and whether matches are called or scripted.

### The office — named role slots
This is the most interesting column block, because it reveals a **backstage office system**
the handbook only hints at:

| Slot | Count |
|---|---|
| `Owner` + `Owner_Type` | 1 |
| `Potential_Founder_1..3` + `Founders_Are_Mandatory` | 3 |
| `Head_Booker` | 1 |
| `Booking_Team_1..5` | 5 |
| `Locker_Room_Leader_1..5` | 5 |
| `Chief_Enforcer_1..3` | 3 |
| `Head_Of_Talent_Relations` | 1 |
| `Morale_Officer` | 1 |
| `Senior_Road_Agent` | 1 |
| `Senior_Referee` | 1 |
| `Head_Mens_Trainer`, `Head_Womens_Trainer` | 2 |
| `Travel_Organiser` | 1 |
| **`Stooge`** | 1 |

Who holds these offices changes the simulation — a Morale Officer, a Chief Enforcer and a
Stooge are distinct social roles, and the locker room is influenced by who is in them.

### Figurehead
`Figurehead` · `Figurehead_Since` (String) · `Figurehead_Heir` · `Figurehead_Heir_Since`.

The **heir** is stored, not computed — succession is authored and dated.

### Presentation ladders
`Merchandising` · `Production_Values` · `Live_Event_Experience` · `Broadcast_Quality` ·
`Music` — all strings, holding the tier name rather than an index.

### Defaults
`Default_Commentary_1..3` · `Show_Priority` · `Event_Order` · `TV_Order`.

## The region taxonomy (57 columns, exact list)

| Area | Regions |
|---|---|
| USA (11) | Great Lakes · Mid Atlantic · Mid South · Mid West · New England · North West · South East · South West · Tri State · Puerto Rico · Hawaii |
| Canada (7) | Maritimes · Quebec · Ontario · Alberta · Saskatchewan · Manitoba · British Columbia |
| Mexico (6) | Noreste · Noroccidente · Sureste · Sur · Centro · Occidente |
| British Isles (6) | Midlands · Northern England · Scotland · Southern England · Ireland · Wales |
| Japan (8) | Tohoku · Kanto · Chubu · Kinki · Chugoku · Shikoku · Kyushu · Hokkaido |
| Europe (8) | Western Europe · Iberia · Southern Med · Southern Europe · Central Europe · Northern Europe · Eastern Central Europe · Eastern Europe |
| Oceania (7) | New South Wales · Queensland · South Australia · Victoria · Western Australia · Tasmania · New Zealand |
| India (4) | Northern · Eastern · Southern · Western India |

That is **57 regions**, matching the handbook's "0 to 56" `Minimum_Regions` bound (inclusive
count). Copy this list wholesale — it is the game's geography.

## History tables (save side)

### `Match_Histories`
```
UID, PreviousShowUID, Match_Description, CompanyUID/Name, Match_Type, Rating,
Which_Side_Won, Title1 + TitleName1, Title2 + Title2Name, Title3 + Name3,
Extra_Notes, PreShowMatch, PostShowMatch
```

- Up to **three titles** can be on the line in one match — a hard cap worth copying.
- `Which_Side_Won` records the outcome independently of the participants, so the same row
  works for singles, tags and multi-ways.
- `PreShowMatch` / `PostShowMatch` boosters mark dark matches.

### `Title_Histories`
```
BeltUID, BeltName, Holder1..3 + Holder_Name1..3, Reign_Began, Reign_Ended, Defences
```

- Up to **three holders** (trios titles).
- `Reign_Ended` empty ⇒ current champion.
- `Defences` is a counter on the reign, not derived from match history — cheap and fast.

### `Game_World_Areas`
```
Game_Area, Active, Economy, Is_Economy_Rising, Industry, Is_Industry_Rising
```

Per-area world state: the 0–100 economy and industry from the handbook, each with its own
direction flag, plus an `Active` flag for eras that disable regions.

### `Database_Info`
`Database_Title`, `Version_Number`, `Author`, `Description` — a single row. This is how a
database self-describes, and the only populated row in the template.

## Lessons for a rebuild

1. **Denormalise regions if the count is fixed.** 57 columns beats a popularity join table for
   a game that queries "this company's popularity in this region" constantly.
2. **Office slots are content.** Owner, booker, enforcers, morale officer, stooge — these
   change outcomes and deserve to be first-class, not just a `staff[]` array.
3. **Figurehead heirs are stored**, not calculated; succession survives save/load.
4. **Four company dates** (open window ×2, closed, set-to-open) model history better than one.
5. **History rows carry their own denormalised names**, so deleting a worker does not orphan
   the record — the save is readable decades later.
6. **Cap ambiguous cardinality explicitly**: 3 titles per match, 3 holders per reign, 5 booking
   team, 5 locker-room leaders, 3 enforcers. The caps are the design.
