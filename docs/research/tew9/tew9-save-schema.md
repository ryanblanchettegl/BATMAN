# TEW IX: the save-game schema (runtime model)

`System\TEW9MDB.mdb` is not a database — it is the **save-game template**. It opened without
a password and contains **39 tables, 800 columns**, several of which exist in no authored
database at all. This is the layer that has been inferred from the handbook until now.

## The structural revelation: keys change at runtime

| Layer | Key style | Example |
|---|---|---|
| Authored database (`TEW9Access.mdb`) | **names as keys** | `Contracts.Worker String(30)`, `Company_Initials String(12)` |
| Save game (`TEW9MDB.mdb`) | **integer UIDs** | `Morale_Effects.WorkerUID Int32`, `Company_Relationships.CompanyUID1 Int32` |

Every save table carries both `...UID Int32` **and** `...Name String(30)` — the UID for joins,
the name as a denormalised display copy. That is why renaming a record is safe in-game: the
save no longer depends on the name, but the database does.

## Save-only tables — systems that live only once the game starts

| Table | What it is |
|---|---|
| `Morale_Effects` | the morale incident ledger |
| `Chemistry_Discovered` | chemistry **the player has learned** |
| `Chemistry_Preset` | chemistry authored into the world |
| `Company_Relationships` | company-to-company agreements |
| `Attributes` | per-worker personality attributes, some `Hidden` |
| `AI_Feuds` | AI-tracked feuds, up to 4 workers |
| `Broadcast_Slots` | the TV schedule as data |
| `Media_Groups` | media ownership above broadcasters |
| `Match_Histories` + `Match_Histories_Wrestlers` | every match, with participants |
| `Title_Histories` (+ `_PreGame`) | reign history, split pre-game/current |
| `Financial_Histories` | money over time |
| `Player_Storylines` (+ `Player_Storyline_Involved`) | the player's own storyline tracking |
| `Previous_Shows`, `Worker_Absences`, `Power_500s`, `Morale_Effects` | rolling history |

## `Morale_Effects` — the ledger, exactly

```
Player_Involved    Byte
WorkerUID          Int32      WorkerName   String(30)
CompanyUID         Int32      CompanyName  String(12)
MoraleReason       String(1GB memo)
Level1_Lowest      Int16
Level2             Int16
Level3             Int16
Level4_Highest     Int16
Happened           String(50)
Associated_Name    String(50)
```

What this tells us:

1. **Morale is an effect ledger**, not a scalar — confirming the handbook.
2. Each reason carries **four severity levels** (Lowest → Highest) as separate values, so the
   *same reason* can hit a main eventer and a midcarder with different magnitudes.
3. `Happened` is a **string**, so the timestamp/description is recorded per effect.
4. There is **no duration column** — the decay described in the handbook is computed from the
   recorded moment, not stored as a countdown.
5. `Player_Involved` marks effects caused by the player, which is how the game separates "the
   world did this" from "you did this".

## `Chemistry_Discovered` vs `Chemistry_Preset` — fog of war on pairings

**Preset** (authored):
```
Worker1/Worker2 (UID) + names, Chemistry_Type String(10), Quality_Level String(7)
```

**Discovered** (learned in play):
```
Player_Who_Discovered Byte, Worker1/Worker2, Chemistry_Type String(30)
```

- Chemistry has a **Quality_Level**, separate from its **type** — so "tag chemistry, great" is
  a pair of fields, not one.
- Discovery is **per player** (`Player_Who_Discovered`) — this is why the handbook says the
  chemistry screen is "player-specific". In multiplayer, two players know different chemistry.
- Preset overrides natural chemistry, and the two live in different tables — so the runtime
  merges them.

## `Company_Relationships` — ten agreement slots

```
CompanyUID1/2 + names,
Agreement1 … Agreement10   (String(250) each)
```

Company-to-company relations are **up to ten named agreements per pair**, stored as strings,
not as an enum. That is how friendly / war / hostile / no-stealing / no-signing / talent
trading coexist on one pair: they are concurrent agreement records, not a single state.

## `Attributes` — and the `Hidden` flag

```
WorkerUID, Worker_Name, Attribute String(75), Hidden Boolean
```

Attributes are **rows, not columns** — a worker can hold any number, and some are `Hidden`.
That is the fog-of-war implementation: the data is there, the UI withholds it.

## `AI_Feuds`

```
CompanyUID, Worker1..Worker4 (UID + name)
```

Feuds are tracked by the AI as **up to four participants**, which matches the handbook's
storyline rule of "at least two workers, at least one Major role".

## `Broadcast_Slots`

```
BroadcasterUID/Name, CompanyUID/Name, TVShow + name, ShowTime,
ContractedEpisodes, EpisodesLeft, DaysLeft, MinimumQuality
```

The TV schedule is a first-class table with its own countdown, which is why deals can expire
independently of the show definition.

## Session state lives in the save too

The table with `Player_Turn_Number`, `Player_Avatar_UID/Name` also carries booleans:
`Owner_Goals`, `Small_Roster_Penalty`, `Repetitive_Booking_Penalty`, `Crowd_Management`,
`Gimmick_Effects`, `Worker_Morale` …

So **user preferences are persisted per save**, not per install — confirming the handbook's
claim that they affect "only their gameplay experience" while still travelling with the game.

## What this corrects in the earlier volumes

| Earlier claim | Correction |
|---|---|
| Morale is "a ledger with polarity and duration" | It is a ledger of **reasons**, each with **four severity levels**; there is no duration column, decay is computed |
| Chemistry is a per-relationship field | Chemistry has **type + quality** and is split **preset vs discovered per player** |
| Company relationships are a state (war/friendly) | They are **up to ten concurrent agreements** per pair |
| Attributes are a worker column | Attributes are **rows**, some hidden |
| Relationships have hidden drift counters | Confirmed: still no counter column anywhere — drift is in-memory only |

## Rebuild lessons

1. **Two schemas, not one.** Authored world (names as keys, editable) and runtime state (UIDs,
   history) are genuinely different shapes. Trying to unify them early causes pain.
2. **Model morale as reason + severity bands + timestamp.** Four bands let one reason scale by
   seniority without duplicating the reason.
3. **Chemistry needs a discovery layer** if you want fog of war; per-player discovery is the
   only way multiplayer stays honest.
4. **Store agreements as rows**, not an enum on the pair — then war and a trade agreement can
   coexist.
5. **Denormalise the name next to the UID** in save rows; it makes debugging and saves-as-cases
   vastly easier.
