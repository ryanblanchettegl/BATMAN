# WrestlePower game data

`wrestlepower_game_data.json` is the whole WrestlePower e-fed universe (PCW, WPW, EWE and POWER CW, 2005–2013)
in one file, built for importing into a wrestling sim. It is plain UTF-8 JSON, about 400 KB.

**Raw link for Claude or scripts:**
`https://raw.githubusercontent.com/ryanblanchettegl/cool/main/game-data/wrestlepower_game_data.json`
(This works while the repository is public. If it is private, attach the file instead.)

Rebuild it after editing the encyclopedia with `python encyclopedia/export_game.py`.

## Instructions for Claude

When asked to add this data to a wrestling sim game:

1. Read `meta.counts` first to see what's there, then read the game's own roster or save format.
2. Use `id` fields as stable keys. Relationships are by id: `wrestlers[].championship_ids` → `championships[].id`,
   `wrestlers[].stable_ids` → `stables[].id`, `championships[].reigns[].champion_ids` → `wrestlers[].id`,
   `feuds[].participant_ids` → `wrestlers[].id`.
3. Treat `detail_level` as data quality: `full` entries were written from the archive; `short` entries have a
   one-line summary; `signup_sheet_only` characters exist only as the player's original character sheet.
4. Signup-sheet text (`moves`, `signature_moves`, `characteristics`, `entrance`, `appearance`,
   `original_signup_bio`, and `alignment`/`height`/`weight` for most characters) is the player's own 2006–07
   wording, lightly cleaned. Expect jokes, typos and formats like `6"2` or `6'4 245`. Normalise as needed.
5. The archive has **no numeric ratings**. `suggested_tier` (`main_event`, `upper_midcard`, `midcard`,
   `lower_card`) is derived only from the titles each character held. If the game needs stats, derive them from
   tier, style, size and characteristics, and say they are derived.
6. Don't invent results or reigns. Gaps are real: there are no show records for January–October 2007, and
   EWE and POWER CW are thin.

## Top-level structure

| Key | What it holds |
|---|---|
| `meta` | Title, description, source repo, `counts` per list |
| `promotions` | The 4 feds: `id`, `name`, `years`, `summary`, `history`, `sources` |
| `wrestlers` | 116 characters (see below) |
| `championships` | 9 title histories, each with ordered `reigns` |
| `events` | 17 PPVs, TV specials and show runs, with `results` as text lines (winner first) |
| `stables` | 7 entries (factions plus one "other teams and groups" entry) |
| `feuds` | 9 major feuds with `participant_ids` and `story` |
| `storylines_and_controversies` | 15 entries; `type` is `storyline`, `real forum dispute`, or both |
| `staff` | On-screen staff (owners, GMs, commentators, ring announcer, referees), shows, and the forum members who wrote each character |

## Wrestler fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable key. Signup-only characters start with `sheet-` |
| `name`, `nicknames` | string, list | |
| `promotions` | list | Fed names, e.g. `["PCW", "WPW", "EWE"]` |
| `writer` | string | Forum member who played the character |
| `hometown`, `height`, `weight`, `alignment`, `style`, `theme_music` | string | Often blank for short entries |
| `finishers`, `signature_moves`, `moves`, `characteristics` | list | Move names usually include the real-life move in brackets, e.g. `"Cyclone (F5)"` |
| `entrance`, `appearance` | string | From the signup sheet |
| `other_facts` | object | Extras such as manager, partner, real name, age, gender, faction, catchphrase |
| `championships` | list | Human-readable title list, including titles outside the lineages |
| `championship_ids`, `stable_ids` | list | Links to `championships` and `stables` |
| `summary`, `biography` | string | Encyclopedia text (kayfabe career) |
| `original_signup_bio` | string | The character's backstory from the 2006 signup sheet |
| `suggested_tier` | string | Derived from titles only |
| `detail_level` | string | `full`, `short`, `signup_sheet_only` |
| `sources` | list | Wayback Machine or fan-wiki URLs |

## Championship reigns

`reigns[]`: `order`, `champion` (text, can be a team), `champion_ids`, `won` (date text such as `"8 Aug 2006"`,
sometimes approximate), `event`, `notes`.

## Example prompt

> Here is my game's roster format: (paste it). Using wrestlepower_game_data.json, create a roster entry for every
> wrestler with detail_level "full", map finishers and signature moves to the game's move list, set alignment from
> the data, and give stats derived from suggested_tier and characteristics. Then add the WPW World, Florida State
> and Tag Team titles with their current champions as of the end of each lineage.
