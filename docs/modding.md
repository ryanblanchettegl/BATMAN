# Making a world

A world is every company, wrestler, title and year of history the game starts from. The game ships two: the public-domain world and the parody world. This guide shows how to make your own, a real-life roster for example, starting from the parody world.

**Get legal review before you ship or share a world built on real people.** Names, likenesses, nicknames and catchphrases can be protected. What you make for yourself is up to you; what you share is your responsibility.

## 1. Where a world lives

A world is kept as a folder, one file for each part, so you can change one company without touching the rest:

```
universes/parody/
  manifest.json          the world: its name, the start date, the disclaimer
  companies/wwc.json     one file for each company
  companies/ewe.json
  ...
  free_agents.json       wrestlers nobody has signed, legends among them
  relationships.json     who likes, hates, trained or is related to whom
  history/2020.json      what happened each year before the game starts
  ...
  history/2026.json
```

Pack the folder into the one file the game loads:

```
node build.js                                   # once, so the game's own checks are up to date
node tools/build-parody.js                      # universes/parody/ -> universes/parody.json
node tools/build-parody.js my_world my.json     # any folder of your own
```

The pack checks everything with the game's own rules first. It reports any broken link, missing field or impossible date, and writes nothing until the world is clean.

Then play it headless for a few months to be sure it runs:

```
node test-uni.js universes/parody.json 36       # 36 weeks of every company; want errs 0 and NaN 0
```

## 2. Ids never change

Everybody and everything has an id: short, lowercase, with underscores (`colt_highway`, `wwc_undisputed`).

- **Names can change; ids stay.** Rename Colt Highway to anything you like and keep the id `colt_highway`. Titles, history, teams and relationships keep pointing at him.
- **A new person needs a new id.** Use 2 to 40 letters, digits or underscores.

## 3. A company file

```json
{
 "promotion": { ... },
 "shows":   [ ... ],
 "titles":  [ ... ],
 "roster":  [ ... ],
 "teams":   [ ... ]
}
```

### promotion

| field | what it is |
| --- | --- |
| `id`, `name`, `full_name` | the short name on menus, and the long one |
| `model` | how the company is run: `corporate`, `workrate`, `purist`, `outlaw`, `underdog`, `startup`, `spectacle`, `tradition`, `joshi` (women only). It decides what its crowds reward and where its money comes from. |
| `popularity` | 5 to 100. Sets the company's money, TV deal and crowds. Rough guide: 90 or more for the giant, 70s for the big rival, 50s for national companies, 30s for an indie. |
| `cash` | money in the bank on day one |
| `owner` | `name`, and what the owner wants: `style` is `stars` (the biggest names win), `merit` (the better wrestler on a roll wins), `drama` (villains cheat through the build) or `heroes` (heels win on TV, heroes win the big one); `roots` is `tradition`, `rebellion` or `family`; `pledge` (what the locker room was promised) is `pay`, `chance` or `stable` |
| `staff` | `road_agent` and `head_writer` names |
| `announcers` | two names: play-by-play and colour |
| `cities` | the towns the company tours, in any order. The road works out the loop. |
| `flagship_month` | 1 to 12: the month of the biggest show of the year |
| `brands` | for a brand split: `[{ "id": "rawr", "name": "RAWR" }]`. Add `"dev": true` for a developmental brand. |
| `events` | twelve big events, January first: `{ "n": name, "t": kind }`. Kinds: `flag` (the flagship), `tent` (a tentpole), `arena`, `ballroom`, `gimmick`, `rumble`, `tourn`, `taped`, `dark` (no event that month). |
| `tv_slot`, `production_level`, `risk_level` | 0 to 2, 0 to 4, 0 to 3 |

### shows

`{ "id": "wwc_rawr", "name": "Monday Night RAWR", "brand": "rawr", "weight": 1 }`

- `brand`: the show books only that brand's roster. Leave it out and the show books everybody, the way one company with several shows does.
- `weight`: how big the show is (1 is the main show, 0.4 a small one).
- A show's night comes from its name (Monday, Wednesday, Sábado and so on). Two companies in the same region on the same night go head to head.
- `network`, `network_size`, `years_on_air`: the network the show is on, how big it is (0 small, 1 cable, 2 major) and how many years it has run. Leave them out and the game works them out from the company's size. A show with years behind it starts with a standing to match.
- The world's file can carry its own match rules: `"stips": [{ "id": "c_shark_tank", "n": "Shark tank", "base": "hardcore", "set": "inferno", "d": "Over a tank of water.", "lines": ["Nobody wants to fall in."] }]`. A rule fights like its `base` (`std`, `hardcore`, `tables`, `ladder`, `cage`, `cell`, `fire`, `sub`). `set` is where the broadcast shows it: empty for the ring, or `cage`, `cell`, `inferno`, `ladder`, `ballroom`, `gym`, `bigstadium`. An entry with the id of an included rule (`cage`, `ladder` and so on) renames it and changes its set, note and lines for the world.
- The world's file can name its own networks by size: `"networks": { "small": [...], "cable": [...], "major": [...] }`, two names or more in a list. A word in a name says what the network wants: Sports, Family or Kids, Late or Midnight, Indie or Cult.

### titles

`{ "id": "wwc_ic", "name": "...", "gender": "M", "level": 2, "brand": "rawr", "tag": false, "holder_ids": ["dirty_junior"] }`

- `level` is 3 for a world title, 2 for a secondary one, 1 for a minor one.
- A tag title has `"tag": true` and two holders.

### roster: one wrestler

```json
{
 "id": "hype_hopkins",
 "ring_name": "Hype Hopkins",
 "gender": "M",
 "disposition": "face",
 "style": "brawler",
 "age": 40,
 "hometown": "San Francisco",
 "roles": ["wrestler"],
 "ratings": { "brawling": 87, "technical": 77, "aerial": 70, "stamina": 78, "charisma": 71, "promo_skill": 71,
              "overness": 79, "star_quality": 77, "potential": 82, "durability": 73, "consistency": 83 },
 "gimmick_category": "Hype Machine",
 "gimmick": "Two or three sentences about who they are.",
 "catchphrase": "HYPE! HYPE! HYPE!",
 "finisher": "The Hopkins Splash",
 "finisher_description": "What it looks like.",
 "finisher_move": "Frog splash",
 "signatures": [ { "name": "Hype Kick", "move": "Superkick" }, { "name": "Bounce House", "move": "Running hip attack" } ],
 "peak_years": [27, 36],
 "debut_year": 2007,
 "legend": false,
 "contract": { "type": "exclusive", "monthly_salary": 165000, "weeks_left": 128, "push": "main_eventer", "brand": "rawr" }
}
```

| field | what it is |
| --- | --- |
| `disposition` | `face` (the crowd cheers), `heel` (the crowd boos), `tweener` |
| `style` | `brawler`, `technician`, `flyer`, `powerhouse`, `all_rounder`, `striker`, `entertainer` |
| `roles` | `wrestler`, plus `manager`, `announcer`, `referee`, `road_agent`, `owner`, `booker` for people who do other jobs |
| `finisher_move`, `signatures[].move` | the plain wrestling name of the move, so anyone can see what it really is |
| `legend` | `true` for a part-timer: an authority figure, a surprise in a battle royal, one last match |
| `contract.push` | `main_eventer`, `upper_midcarder`, `midcarder`, `lower_midcarder`, `jobber`, `non_wrestler` |
| `contract.type` | `exclusive`, or `pwa` (pay per appearance) |

**Ratings run from 0 to 100.**

| rating | what it means | rough guide |
| --- | --- | --- |
| `overness` | how much the crowd cares | 95: the biggest star in the world. 80: a main eventer. 65: a solid midcarder. 45: a newcomer. |
| `brawling`, `technical`, `aerial` | the three ways of wrestling | 90 is the best in the world at it; 60 is competent |
| `stamina`, `durability` | how long they last, how hard they are to hurt | they fall with age |
| `charisma`, `promo_skill` | presence, and talking | |
| `star_quality` | the thing nobody can teach | |
| `potential` | how good they can become | young wrestlers have more room |
| `consistency` | how often they have a good night | |

### teams

- A tag team: `{ "id": "...", "name": "...", "kind": "tag", "member_ids": [a, b], "experience": 0-100, "chemistry": 0-10 }`.
- A faction: `"kind": "stable"`, with `leader_id` and any number of members.

## 4. Free agents

`free_agents.json` is a list of wrestlers in the same shape as a roster entry, without a contract. Legends go here, so they can be brought in for one night.

## 5. Relationships

```json
{ "a": "rodeo_regret", "b": "detour_dante", "type": "rivalry", "strength": -85, "ring_chemistry": 9, "note": "Why, in one line." }
```

| field | what it is |
| --- | --- |
| `type` | `rivalry`, `friendship`, `mentor` (a trained b), `family`, `partners`, `dislike` |
| `strength` | -100 (hatred) to 100 (devotion) |
| `ring_chemistry` | 0 to 10: how well they work together in the ring |

They are where the game starts from. Every show and every decision changes them after that.

## 6. History

One file a year. Every list is optional. Dates are a year and a month, before the world's start date.

```json
{
 "reigns":  [ { "title": "wwc_undisputed", "holders": ["colt_highway"], "from": "2024-04", "to": "2025-04", "defs": 14, "event": "WrestleMoney" } ],
 "matches": [ { "a": "colt_highway", "b": "rocco_rule", "winner": "colt_highway", "date": "2024-04", "event": "WrestleMoney", "stars": 5, "note": "One line." } ],
 "feuds":   [ { "a": ["rocco_rule"], "b": ["colt_highway"], "from": "2023-01", "to": "2024-04", "heat": 92, "ended": "finished", "note": "One line." } ],
 "moments": [ { "who": "chad_champ", "date": "2025-12", "k": "retire", "text": "One line." } ]
}
```

- **reigns:** the line of champions. The reign that is still going has `"to": null`, and its holder must be the title's holder in the company file.
- **matches:** head-to-head records. A match of 4.5 stars or more, or one with a note, goes into both careers.
- **feuds:** old rivalries. Both sides start with real heat between them. A feud that ended in the year before the start can be picked up again with a head start.
- **moments:** a line in a career. Kinds are `debut`, `turn`, `injury`, `return`, `leave`, `retire`, `sign`, `title`, `honour`.

History does not stop when the game starts. Every title change, match, feud and career line from your games is written into the same records, so the world's story carries on from where the files leave off.

## 7. Scenarios

A world can bring its own scenarios: a company, a deadline, a problem, and one way to win. Put a list in `scenarios` at the top of the packed world (or in a `scenarios.json` beside `manifest.json` if you pack with your own tool). They sit beside the built-in ones on the title screen.

```json
{
 "id": "rescue", "name": "Save the company", "promotion": "ttt", "weeks": 26,
 "description": "What the player reads before they start.",
 "setup": [ { "op": "cash", "inc0": 0.8 }, { "op": "wages", "mult": 1.25, "round": 50 } ],
 "win": { "type": "cash", "atLeast": 1500000 },
 "text": { "win": "The company is safe: {cash} in the bank.", "lose": "Only {cash} is in the bank." },
 "figures": [ "Cash {cash} (target $1.5M)" ]
}
```

| setup step | what it does |
| --- | --- |
| `cash` | sets the money to `inc0` times a normal week's income |
| `wages` | multiplies every wage by `mult`, rounded to `round` |
| `target` | picks the player's project: `g` (M or F), `maxAge`, `nth` from the bottom of the roster |
| `image` | sets a company's popularity: `who` is `player` or a company id, `v` the value |
| `rival` | names a rival company whose shows are measured against yours |
| `war` | starts a ratings war with the company in `with` |

| win type | met when | words it fills |
| --- | --- | --- |
| `cash` | the money is at least `atLeast` | `{cash}` |
| `holdsTop` | the project holds the company's top title | `{name}`, `{title}`, `{ovr}`, `{o0}` |
| `beatRival` | your shows beat expectations by `by` more than the rival's | `{m}`, `{r}`, `{mFig}`, `{rFig}` |

Every scenario ends with a score from 0 to 100. It is also lost if the booker is fired or the money runs out first. The world check reports a scenario with an unknown company, step or win type.

## 8. The parody world's rules

The parody world parodies real companies and people under changed names. If you add to it, keep to the rules it was built on:

- never a real name, a near-copy or a sound-alike;
- no real logo, trademarked nickname, catchphrase or named finisher;
- the plain move name (`finisher_move`, `signatures[].move`) is the generic name of the move, never someone's named version of it;
- the joke comments on the original.

The design team keeps a note of who each character parodies outside the repository. It is never part of the world file.

A world you make for yourself can follow whatever rules you choose. What you share is your responsibility.

## 9. Sharing a world

A packed world is one file. It can be loaded from the title screen (World Editor, Load), and later shared on the Steam Workshop. The World Editor in the game can also open any packed world, change it and save it again.
