# TEW IX — settings inventory

The handbook separates settings by **scope**. This distinction matters more than the
individual toggles: if you rebuild the game, these become three different storage
locations, not one settings screen.

| Scope | Where it lives | Changes | Refs |
|---|---|---|---|
| **World / database** | Options, Eras, Narratives, editor | the whole simulation for every player | hb 35, 37, 38, 40 |
| **Company** | Product, Backstage Rules, sizes, production, tickets, drug policy | one company's behaviour | hb 16–18 |
| **Player** | User Preferences | only that player's experience, "not the game world as a whole" | hb 36 (quote) |

## World settings — Options (hb 35)

33 entries. Grouped by what they actually do:

**Save & pacing** — Auto Save · Fast Advance E-Mails · Return To Office · Booking Times
(pref) · Annual Backup.

**World simulation** — Regeneration · Auto Fix Imbalances · New Worker Highlights ·
Regeneration · Organic Biographies · Organic Companies · Celebrity Generation ·
Graduation · Oversaturation · Natural Growth Limits · Strict Boom And Bust ·
Dirty Tricks · Chemistry Effects.

**Presentation of the world** — Picture Requirement · Area Battle Status ·
Regional Battle Status · Restricted Areas · PPV Rating Unit · TV Rating Unit ·
Loading Screen Profiles · Background Logos · Default Backdrop · Change Skin/Pictures.

**Tone & difficulty** — Injury Frequency · Randomness Frequency · Death Frequency ·
'Kenny' Deaths (comedy deaths) · Strict Storylines.

**Tools** — Sandbox Editor · Create MDB File.

**Interesting design note:** difficulty here is not a single "Easy/Normal/Hard" slider.
It is a set of independent frequencies (injury, randomness, death) plus strictness
toggles. A player builds their own difficulty curve.

## Player settings — User Preferences (hb 36)

32 toggles, explicitly "only impact their gameplay experience". These are mostly
**on/off switches for entire systems**, which is the hidden feature-flag architecture:

`Coloured Text` · `Small Roster Penalty` · `Repetitive Booking Penalty` ·
`Crowd Management` · `Gimmick Effects` · `Owner Goals` · `Worker Morale` ·
`Locker Room Morale` · `Dirt Sheet` · `Industry & Economy` · `Booking Times` ·
`Crowd Burn Out` · `Match Ratios` · `Scouting` · `Pro Mode` ·
`Disposition Change Timings` · `Momentum` · `Mandatory Event Pre-Booking` ·
`Mandatory TV Pre-Booking` · `Pre-Booking Bonuses` · `Pre-Book Reminders` ·
`Left Off Show Complaints` · `Match Aim Requirements` · `Overuse Penalties` ·
`Overuse Warnings` · `Road Agent Tips` · `Production Effects` · `Lifestyle Effects` ·
`Main Event Header Mode` · `Book Main Event First` · `CE Requirements Per Show` ·
`Skip Give The Night Off`.

Note what is switchable: **momentum, morale, locker room morale, gimmick effects,
crowd burn-out, industry/economy, scouting, owner goals**. So the "core" of TEW is
actually modular — a rebuild can ship each as a flag and get a coherent game with any
subset enabled.

## Company settings

### Product (hb 17) — 11 settings
Current Product · Core Product · Gender Setting · Match Focus · Angle Focus ·
Face/Heel Divide · Men's Weight Split · Minis Divisions · Stables · Managers ·
In-Ring Settings.

Product is the single most influential company setting: it governs expectations,
match/angle weighting, and advertiser appeal (hb 17.1). Changing it is time-gated and
only possible between *related* products.

### Backstage rules (hb 18) — 7 settings
No drugs/alcohol/smoking · Arriving and leaving times · Dress code · No outsiders ·
Catering / masseuse / chiropractor · Transport and hotels · Dirty doctor.

These generate or suppress **morale incidents**; they are the lever that makes a
locker room easy or hostile, so they are settings that *feed the relationship system*.

### Production ladders (hb 8.39–8.44)

| Ladder | Values |
|---|---|
| Production Values | Limited · Amateur · Semi-Pro · Professional · High Quality · Majestic · Industry Leader |
| Broadcast Quality | Amateur · Semi-Pro · Hired Pro · In House · Industry Standard · Cutting Edge |
| Music | Small Time · Generic · Local · In House · Minor Licensed · Licensed · Major Licensed |
| Live Event Experience | 7 levels (names not recovered) |
| Merchandising | levels exist; names not recovered |

Each rung costs money and buys segment-rating or revenue modifiers — the economy's
"spend to improve quality" axis.

### Other company-level knobs
Size (hb 16.1) · ticket prices (8.47) · drug policy (16.29) · brand split (16.11) ·
divisions (16.26) · show priority/order (16.30) · touring settings (16.40) ·
home arena (16.6) · corporate HQ (16.41) · owner goals (16.22) · figurehead (16.14).

## Era settings (hb 37)

An era is a date-bounded preset with three layers:
1. **Universal settings** — apply everywhere.
2. **Settings by area** — per region overrides.
3. **Product trends** — which products are fashionable.

Only one era active at a time; outside eras the built-in defaults apply. Eras are how
TEW models "the 1980s" vs "the 2020s" without touching code.

## Narrative settings (hb 38) — 9 controls

Trigger date range · Chance of happening · Importance · Single use · Presentation ·
Requirements · Effects · Effect strength.

Narratives are the scripted-event layer: data-authored, date-windowed, probability-gated,
requirement-checked, and displayed to the player. This is the mechanism a database maker
uses to reproduce real-world history.

## Rules of thumb for a rebuild

1. **Separate scope physically.** `world.settings`, `company.settings`,
   `player.preferences` — never a single blob.
2. **Make each major system a flag** in `player.preferences`, mirroring hb 36. It makes
   testing and onboarding dramatically easier and costs one boolean per system.
3. **Model difficulty as frequencies**, not a multiplier (hb 35 injury/randomness/death).
4. **Keep the tuning ladders as data** (production, broadcast quality, music) so the
   economy rebalances without code changes.
5. **Company settings that generate incidents** (backstage rules) are the cheapest way
   to give the player control over relationship dynamics without exposing the matrix.
