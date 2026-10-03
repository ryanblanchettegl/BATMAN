# Universe packages (schema version 1)

Every roster the game plays is a universe package. The built-in Public Domain Universe is one; so is anything a player imports from the title screen.

This build reads the **packed form**: one JSON file holding a manifest and eight tables. The folder form described in the architecture doc (one file per table plus a `graphics/` folder) carries the same data and is what the desktop/Workshop build will read.

## Shape

```json
{
  "manifest":   { "id": "my_universe", "name": "My universe", "author": "", "version": "1.0",
                  "schema_version": 1, "start_year": 1997, "start_month": 10, "free_agents": 36 },
  "promotions": [ { "id": "pdw", "name": "PDW", "full_name": "Public Domain Wrestling", "popularity": 72, ... } ],
  "shows":      [ { "id": "pdw_wed", "promotion_id": "pdw", "name": "Wednesday Night Folio", "weight": 1 } ],
  "titles":     [ { "id": "pdw_world", "promotion_id": "pdw", "name": "...", "gender": "M", "level": 3, "tag": false, "holder_ids": ["king_arthur"] } ],
  "workers":    [ { "id": "king_arthur", "ring_name": "King Arthur", "age": 36, "gender": "M", "disposition": "face",
                    "roles": ["wrestler"], "style": "all_rounder", "finisher": "Sword in the Stone",
                    "ratings": { "brawling": 82, "technical": 80, "aerial": 55, "stamina": 85, "charisma": 92, "promo_skill": 84, "overness": 95 } } ],
  "contracts":  [ { "worker_id": "king_arthur", "promotion_id": "pdw", "contract_type": "exclusive", "push_level": "main_eventer" } ],
  "teams":      [ { "id": "pdw_baker_street", "name": "Baker Street", "kind": "tag", "member_ids": ["sherlock_holmes", "dr_john_watson"], "experience": 85, "chemistry": 6, "promotion_id": "pdw" } ],
  "relationships": [ { "a": "julius_caesar", "b": "brutus", "type": "friendship", "strength": 70, "ring_chemistry": 4 } ],
  "events":     [ { "month": 3, "name": "Ides of March", "rule": "betrayal" } ]
}
```

Ids are lowercase slugs: 2 to 40 letters, digits or underscores.

## Required and optional

- **Worker**: `id`, `ring_name`, `gender` (M/F), `disposition` (face/heel/tweener), `style`, and `ratings` with at least `brawling`, `technical`, `aerial`, `stamina`, `promo_skill`, `overness`. Everything else is optional and derived when missing: `charisma`, `hardcore`, `durability`, `safety`, `star_quality`, `consistency`, `potential`, `morale`, `gimmick_rating`, `age`, `peak_years`, `age_cliff`.
- **Styles**: brawler, technician, flyer, powerhouse, all_rounder, striker, entertainer.
- **Roles**: wrestler, manager, announcer, referee, road_agent, owner, booker. A worker without `wrestler` cannot be booked in matches but can manage.
- **Promotion**: `id`, `name`, `popularity`. Money fields (`cash`, `wage_scale`, `tv_rate`, `production_cost`, `target_weekly_net`) are derived from popularity when missing.
- **Model** (`model` on a promotion, optional): how the company is run. It changes what its crowd rewards, where its money comes from, how much risk it can carry, who it pushes and who it hires. A missing or unknown id gives a warning and the promotion runs as `classic`. The ids are:
  - `classic`: no house system. The crowd takes each show as it comes.
  - `corporate`: a corporate giant. Big television money, a board with a monthly review, no risky products.
  - `workrate`: wrestling for the diehards. Match quality counts above all.
  - `purist`: sport first. Clean finishes and technical wrestling.
  - `underdog`: a resilient underdog. Cheap castoffs from bigger companies arrive with a point to prove.
  - `startup`: new money. It pays over the odds for names and bleeds cash until it lands a better television deal.
  - `outlaw`: an edgy company where gimmick matches are the house style.
  - `spectacle`: lucha spectacle. Multi-man matches and sponsors on every turnbuckle.
  - `tradition`: lucha tradition. Trios, family names and a top spot earned over years.
  - `joshi`: an all-women company. It signs only women (`gender` F). If a promotion with this model has men or men's titles in the package, the loader warns, and the game will not sign men for it.
- **Contract**: `monthly_salary` or `per_show_fee`, `weeks_left`, `tenure_weeks` (how long they have been with the promotion; the lucha tradition company rewards it) and `push_level` are optional; the game rolls them when missing.
- **Event rules**: `no_turning_back`, `betrayal`, `gimmick_free`, `all_titles`.
- `manifest.free_agents`: how many unsigned newcomers the game generates at the start (0 to 120).
- `names`: `first_m`, `first_f`, `last` lists used for generated rookies.

## Validation

`E.validateUniverse(pkg)` returns `{ ok, errors, warnings }`. Errors block loading; warnings do not. It checks, in order: the manifest and schema version; every record against its table (types, allowed values, unknown fields with a "did you mean"); references between tables; world rules (roster sizes, one exclusive deal each, title holders under contract); media paths.

## Making one in the game

The **World Editor** on the title screen builds a package without touching a file: companies, shows, belts, wrestlers, teams. Its Check and share tab runs the same validation and writes the package out as text or a file. Ids are made from names as you type.

## Tools

    node tools/build-public-domain.js          # rebuilds universes/public_domain.json from its row table
    node tools/roster-to-package.js > x.json   # converts the legacy roster.js into a package
    node test-uni.js universes/public_domain.json 60   # validates a package and plays every promotion in it

In the game, Company > Export this world writes the current state of a save as a package.
