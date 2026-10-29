# Gimmick types and look presets

- Built with Ryan, 2026-10-27. Part of `docs/plans/wrestler-look-scrapbook.md`. Build after the TS engine switch (rule 9d gates before engine code).
- **Rule (Ryan): "gimmicks only apply into how your character acts and their dialogue and relationship system."**
  - A gimmick never sets a look.
  - A gimmick never changes match ratings or win/loss popularity.
  - A gimmick drives three things only:
    1. how the character **acts** (backstage behaviour, choices, at-your-door requests);
    2. what they **say** (promo words, feed posts, podcast lines, interviews);
    3. how **relationships** move (who they click with or clash with, how they react to what the booker does).
- **Looks** are a separate set of 20 presets (part B). Create a Player is modular: every piece is picked on its own, and a preset is only an optional starting point (blueprint §4b).

## A. The 20 gimmick types (our names)
- 10 are modelled on TEW's type categories, renamed by Ryan. TEW's Gimmicky and Legitimate are dropped.
- 10 are ours, from the game's current `GIMS`.
- The old Brute, Cocky, Comedy and Hero fold into Bruiser, Hotshot, Funny Man and Good Guy.

| # | gimmick | from | acts like (draft) | talks like (draft) | relationships (draft) |
|---|---|---|---|---|---|
| 1 | Bruiser | TEW model | settles things physically; respects strength | short, blunt threats | clicks with tough workers; clashes with Funny Man, Rat |
| 2 | Hotshot | TEW model | demands spots and money; sulks after losses | brags, talks down to others | jealous of stars; friends with whoever helps him rise |
| 3 | Funny Man | TEW model | lightens the room; pranks | jokes, callbacks, nicknames | liked by most; annoys Bruiser, Straight Shooter |
| 4 | Chill | TEW model | unbothered; slow to anger, slow to forgive | laid-back, cool lines | steady friendships; little drama |
| 5 | Loose Cannon | TEW model | unpredictable; may go off script | rants, shouting, threats | volatile: big swings either way |
| 6 | Straight Shooter | TEW model | professional, reliable | plain, sincere, no fluff | respects workers who work hard; dislikes clowns |
| 7 | Custom | TEW model | set by the player (pick traits) | player-written lines and tags | set by the player |
| 8 | Rat | TEW model | schemes, takes shortcuts, runs from danger | excuses, whining, lies | trusts nobody; betrays allies; hated by Good Guy |
| 9 | Nut | TEW model | odd choices nobody expects | strange, off-topic lines | few close friends; fascinates some |
| 10 | Good Guy | TEW model | loyal, keeps promises, helps young workers | earnest, about the fans and hometown | trusted by most; clashes with Rat, Hotshot |
| 11 | Underdog | ours | never quits; hungry for a chance | humble, fired up | bonds with fans and fellow strugglers |
| 12 | Daredevil | ours | takes risks, ignores injury warnings | excited, short bursts | friends with other flyers |
| 13 | Technician | ours | studies opponents; perfectionist | precise, about skill | respects good workers; looks down on brawlers |
| 14 | Monster | ours | intimidates; keeps to himself | few words or none | feared; few bonds |
| 15 | Old hand | ours | mentors; speaks up to management | stories, wisdom, warnings | teacher to the young; respected backstage |
| 16 | Rebel | ours | defies the office; breaks rules | anti-authority, crude | clashes with the owner; bonds with outsiders |
| 17 | Showman | ours | wants the spotlight and the big entrance | flamboyant catchphrases | loves an audience; competes for attention |
| 18 | Mystic | ours | aloof, theatrical | cryptic, slow, eerie | keeps a distance; unsettles rivals |
| 19 | Workhorse | ours | asks for more matches; works hurt | modest, about the work | respected; gets on with almost everyone |
| 20 | Outlaw | ours | lives by his own code; holds grudges | tough talk about loyalty | small loyal crew; long feuds |

Every gimmick also keeps three settings:
- **Risk:** how much it can offend.
- **Difficulty:** how hard it is to get over.
- **Subtlety:** from cartoonish to subtle.

It also keeps who can realistically play it (skill floors and ceilings). In the game these feed `GR_PROMO` words, the relationship matrix (`relBump()` bias, rule 9b) and backstage requests (`peopleNow()`).

## B. The 20 look presets (not tied to gimmicks)
- Used to dress generated wrestlers, and offered in Create a Player as optional starting points.
- A generated wrestler takes one preset as its base: about 70% of its 2 to 4 signature pieces come from it, and 30% from any preset. The preset is picked from body and style plus a hash of the name, never `rnd(S)`.
- Looks are unique across the whole world.
- Heel turn: gear goes darker and the poses change. Age: greyer hair, heavier build.

| # | preset | palette | hair / face | gear + finish | decal layers | outerwear | accessories | poses: entrance / win / taunt |
|---|---|---|---|---|---|---|---|---|
| 1 | Street brawler | black, grey, red | shaved or buzz; full beard | jeans or trunks; tank (fabric) | barbed-wire band, scar | none | wrist tape | guard / roar / knuckle crack |
| 2 | Rich kid | white, gold | slicked hair | trunks, gold foil trim | own-initials logo | suit jacket | sunglasses | brush shoulder / money toss / chin up |
| 3 | Goof | clashing brights | wild hair | mismatched gear | rubber chicken, stickers | oversized hat | mismatched boots | dance / pratfall / wave |
| 4 | Street cool | black, white, one bright | fresh fade | joggers or trunks | small logo, chain | bomber jacket | chain | arms crossed / chin up / shrug |
| 5 | Hardcore maniac | blood red, black | wild hair; scars | ripped gear | scars, tape | none | tape everywhere | arms out / slap chest / beckon |
| 6 | Pro athlete | team colours | short hair | compression gear | number or crest | warm-up top | taped joints | stretch / focus / clap |
| 7 | Sneak | brown, mustard | slicked hair, thin moustache | trunks under a shiny jacket (foil) | none | cheap jacket | none | point and hide / rub hands / cower |
| 8 | Oddball | clashing patterns | odd hair colour | mismatched gear | random shapes | none | one sock, one boot | stare / sniff / wave slowly |
| 9 | Hometown hero | local colours | neat hair | bright trunks | city name text | team-style jacket | wristbands | wave / fist pump / point to crowd |
| 10 | Everyman | bright primary | scruffy hair | plain trunks | hometown text | none | taped fists | fist pump / point to crowd / back up |
| 11 | Skater | neon, black | messy hair or beanie | baggy shorts (fabric) | sticker-bomb | hoodie | beanie | hang loose / spin / point up |
| 12 | Amateur | navy, white | neat short hair | singlet | club crest | headgear | wrestling shoes | ready stance / arm raised / count on fingers |
| 13 | Beast | black, dark red, brown | matted or shaved; face paint | dark gear (leather) | claw scratches | fur shoulder | none | roar / chest beat / crouch |
| 14 | Veteran | black, one classic colour | grey hair | classic black trunks | one old tattoo | robe | knee braces | nod / point to sky / hand on heart |
| 15 | Punk | black, hot pink or lime | mohawk or dyed | studded leather, ripped jeans (denim) | safety pins, slogan text | leather jacket | studded wristbands | rock horns / arms out / spit |
| 16 | Glam | gold, pink, purple | big hair | sequins (glitter) | stars, sparkles | feather robe | sunglasses | spin / blow kiss / arms wide |
| 17 | Undead | pale, black, grey | long dark hair | black gear | ghost, smoke | long coat and hat | gloves | sit up / eyes roll / slow point |
| 18 | Grappler | plain singlet colours | short hair; cauliflower ear | singlet | number text | none | wrestling shoes | stance / nod / arm raise |
| 19 | Jailbird | orange, white, grey | shaved or messy | trunks with number | prisoner number, chain | orange jumpsuit | broken shackle | shackle break / grin / point |
| 20 | (blank) | player's choice | | | | | | |

## Open (for the port)
- The engine today ties gimmicks to match and crowd effects (`GFX` in `BATMAN/src/99-gimmicks.js`: rules they shine in, hot and flat pairings, main-event play). Ryan's rule removes those. **Decide at the engine blueprint (rule 9d):** drop them, or move them to traits.
- The acts/talks/relationships columns are drafts, to be confirmed with Ryan.
- Heel pose sets for each preset.
- Jailbird, Undead and Rat stay generic (rule 3).
