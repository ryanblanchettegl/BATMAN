"""The Stardom parody: Supernova Joshi. Run: python3 tools/parody/nova.py"""
from common import company

PROMO = {"id": "nova", "model": "joshi", "name": "SUPERNOVA", "full_name": "Supernova Joshi",
 "blurb": "The best women's wrestling company in the world, by its own count and most other people's. Idol singing, factions with colour schemes, and a summer league that runs longer than some marriages.",
 "owner": {"name": "A Mobile Game Company", "style": "stars", "roots": "family", "pledge": "pay"},
 "staff": {"road_agent": "Coach Kawaii", "head_writer": "The Faction Committee"}, "announcers": ["Nami Narrator", "Mika Microphone"],
 "cities": ["Tokyo", "Osaka", "Nagoya", "Yokohama", "Kobe", "Fukuoka", "Sendai", "Sapporo"],
 "cash": 12000000, "popularity": 58, "flagship_month": 12, "tv_slot": 1, "production_level": 2,
 "events": [{"n": "New Year Nova", "t": "arena"}, {"n": "Supreme Fight-ish Night", "t": "arena"}, {"n": "Cinderella Bracket", "t": "tourn"},
  {"n": "All Star Grand Something", "t": "tent"}, {"n": "Flashing Lights Champions", "t": "arena"}, {"n": "New Blood Transfusion", "t": "taped"},
  {"n": "Summer Star League", "t": "tourn"}, {"n": "Summer League Final", "t": "tent"}, {"n": "Queen of Dreams Rehearsal", "t": "taped"},
  {"n": "Goddesses of Nova Tag League", "t": "tourn"}, {"n": "Crossover Chaos", "t": "arena"}, {"n": "Queen of Dreams Night", "t": "flag"}]}
SHOWS = [{"id": "nova_weekly", "name": "Supernova Weekly Live", "weight": 1}]
TITLES = [{"id": "nova_world", "name": "World of Supernova Championship (Red Belt-ish)", "gender": "F", "level": 3},
 {"id": "nova_wonder", "name": "Wonder of Supernova Championship (White Belt-ish)", "gender": "F", "level": 3},
 {"id": "nova_tag", "name": "Goddesses of Supernova Tag Championship", "gender": "F", "level": 2, "tag": True},
 {"id": "nova_artist", "name": "Artistes of Supernova Trios Championship", "gender": "F", "level": 1},
 {"id": "nova_future", "name": "Future of Supernova Championship", "gender": "F", "level": 1}]
R = [
 ("phoenix_fumika", "Phoenix Fumika", "F", "heel", "flyer", None, "main_eventer", 5, 31, "Kanagawa", "Golden Phoenix Champion", "A soaring, smirking ace who wins with a phoenix splash and a speech about how nobody else is ready.", "Rise. Then bow.", "The Golden Ascent", "A 450 splash with a flame-coloured robe flourish.", "450 splash", "Gold Kick|Superkick; Phoenix Feather|Moonsault", "Saya Kamitani"),
 ("twinkle_mask", "Twinkle Mask", "F", "face", "flyer", None, "main_eventer", 4, 28, "Tokyo", "Masked Star Child", "A masked flyer who has worn the mask since childhood and plans to take it off only for a better mask.", "Wish upon me.", "The Black Hole Splash", "A top-rope moonsault into a cradle.", "Moonsault", "Star Spin|Tornado DDT; Comet Tail|Hurricanrana", "Starlight Kid"),
 ("hana_hammer", "Hana Hammer", "F", "face", "powerhouse", None, "main_eventer", 4, 29, "Tokyo", "The Cutie Powerhouse", "A sweet singer with a death-valley-driver smile who lifts people twice her size.", "Cute. And CRUSHING.", "The Death Valley Lullaby", "A death valley driver.", "Death valley driver", "Idol Lariat|Lariat; Karaoke Bomb|Powerbomb", "Maika"),
 ("peach_menace", "Peach Menace", "F", "heel", "striker", None, "upper_midcarder", 4, 25, "Fukuoka", "Black Peach of Doom", "A sharp-kicking heel who changed factions more times than outfits, and has many outfits.", "Peach. Bruised.", "The Peach Sunrise", "A spinning back kick to the jaw.", "Spinning back kick", "Peach Kick|Running kick; Bruise|Lariat", "Momo Watanabe"),
 ("ticktock_tomoe", "Tick-Tock Tomoe", "F", "heel", "flyer", None, "upper_midcarder", 3, 22, "Tokyo", "The Youngest Veteran", "A twenty-two-year-old with ten years in the business who roll-ups people faster than they can blink.", "I was here before you could walk.", "The Pocket Watch", "A rolling cradle into a quick pin.", "Small package", "Tick Tock|Crossbody; Snap|Hurricanrana", "AZM"),
 ("summer_sprite", "Summer Sprite", "F", "face", "flyer", None, "upper_midcarder", 3, 29, "Kumamoto", "Fairy of the Summer Ring", "A fairy who flutters, flies and occasionally forgets which faction she is in.", "Flutter, flutter, PIN.", "The Fairy Splash", "A diving splash.", "Diving splash", "Wing Kick|Dropkick; Glitter|Hurricanrana", "Natsupoi"),
 ("sequin_sachiko", "Sequin Sachiko", "F", "face", "entertainer", None, "upper_midcarder", 3, 37, "Tokyo", "The Glamorous Grappler", "A former actress who wrestles in sequins and makes her rivals feel underdressed.", "Dress for the occasion.", "The Figure-Eight Fashion", "A figure-four leg lock, with a pose.", "Figure-four", "Glamour Elbow|Elbow drop; Runway|Running knee", "Mina Shirakawa"),
 ("jingle_jun", "Jingle Jun", "F", "heel", "brawler", None, "upper_midcarder", 3, 22, "Kanagawa", "The Sweet Bully", "A pigtailed bully who smiles as she kicks you and giggles as she pins you.", "Ring-a-ding, you're done.", "The Jingle Drop", "A sit-out powerbomb.", "Sit-out powerbomb", "Bell Kick|Running kick; Giggle|Lariat", "Suzu Suzuki"),
 ("comeback_kanna", "Comeback Kanna", "F", "heel", "brawler", None, "midcarder", 3, 28, "Tokyo", "The Returning Brawler", "A tough brawler who retired, came back, and acts like she never left.", "Back. Obviously.", "The Moonrise Kick", "A running knee strike.", "Running knee", "Hazy Lariat|Lariat; Eclipse|Rolling elbow", "Hazuki"),
 ("bear_koguma", "Little Bear Kokoro", "F", "face", "powerhouse", None, "midcarder", 3, 28, "Tokyo", "Tiny Bear Powerhouse", "A small, round, happy powerhouse who body-slams people while humming.", "Bear hug incoming!", "The Cub Slam", "A swinging side slam.", "Swinging side slam", "Bear Hug|Bear hug; Honey|Hip attack", "Koguma"),
 ("silent_shizuka", "Silent Shizuka", "F", "heel", "technician", None, "midcarder", 3, 31, "Tokyo", "The Cool Technician", "A cool, silent technician who mostly communicates through submissions.", "...", "The Silent Lock", "A crossface.", "Crossface", "Silent Kick|Spinning heel kick; Fold|German suplex", "Saori Anou"),
 ("unstoppable_umeko", "Unstoppable Umeko", "F", "face", "powerhouse", None, "upper_midcarder", 4, 26, "Kanagawa", "The Powerhouse Ace", "A former ace who powerbombs people and then politely helps them up, then powerbombs them again.", "Again? Again.", "The Unstoppable Bomb", "A lifting sit-out powerbomb.", "Sit-out powerbomb", "Power Lariat|Lariat; Again Slam|Spinebuster", "Utami Hayashishita"),
 ("rookie_rei", "Rookie Rei", "F", "face", "flyer", None, "midcarder", 2, 22, "Tokyo", "Rising Rookie", "A young flyer the company is betting on, who loses the coin toss and wins the crowd.", "Next year. Definitely.", "The Rookie Sault", "A moonsault.", "Moonsault", "Kick-Off|Dropkick; Serene Spin|Hurricanrana", "Mei Seira"),
 ("toxic_theresia", "Toxic Theresia", "F", "heel", "brawler", None, "midcarder", 3, 31, "Vienna", "The Austrian Toxin", "A snarling Austrian who calls herself poison and is right about the effects.", "Poison is patient.", "The Toxic Spiral", "A spinning sit-down powerbomb.", "Spinning powerbomb", "Venom Kick|Superkick; Antidote|Neckbreaker", "Thekla"),
 ("homework_hikari", "Homework Hikari", "F", "face", "technician", None, "lower_midcarder", 2, 21, "Tokyo", "Youngest Heroine", "A teenager-turned-adult who has been the future so long she is the present.", "Present!", "The Homework Bridge", "A bridging German suplex.", "Bridging German suplex", "Bell Ringer|Dropkick; Pop Quiz|Crossbody", "Hanan"),
 ("old_man_orita", "Old Man Orita", "F", "heel", "entertainer", None, "lower_midcarder", 2, 39, "Tokyo", "The Veteran President's Return", "A veteran who once owned the place, sold it, and now wrestles there to annoy the new owners.", "I built this. You rent it.", "The Founder's Fist", "A lariat.", "Lariat", "Board Meeting|Chop; Shareholder|Hip attack", "Rossy Ogawa-era role"),
]
HOLD = {"nova_world": ["phoenix_fumika"], "nova_wonder": ["twinkle_mask"], "nova_tag": ["summer_sprite", "ticktock_tomoe"], "nova_future": ["rookie_rei"]}
TEAMS = [{"id": "nova_crystal_clock", "name": "The Crystal Clock", "kind": "tag", "member_ids": ["summer_sprite", "ticktock_tomoe"], "experience": 80, "chemistry": 8},
 {"id": "nova_emperors_of_peach", "name": "The Peach Empire", "kind": "stable", "member_ids": ["peach_menace", "toxic_theresia", "silent_shizuka"], "leader_id": "peach_menace"},
 {"id": "nova_golden_flock", "name": "The Golden Flock", "kind": "stable", "member_ids": ["phoenix_fumika", "jingle_jun", "comeback_kanna"], "leader_id": "phoenix_fumika"},
 {"id": "nova_star_squad", "name": "The Star Squad", "kind": "stable", "member_ids": ["twinkle_mask", "hana_hammer", "bear_koguma", "rookie_rei"], "leader_id": "twinkle_mask"}]
if __name__ == "__main__":
    company("nova", PROMO, SHOWS, TITLES, R, HOLD, TEAMS)
