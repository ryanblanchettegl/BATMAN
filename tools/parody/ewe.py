"""The AEW parody, EWE (Everyone Wrestles Everyone), with its sister brand Ring of Respectable (the ROH parody).
Run: python3 tools/parody/ewe.py   ->   universes/parody/companies/ewe.json
The TARGET column is the design team's reference only and is never written to the game's data (see docs/parody/).
Detonation and Fender Bender use the whole roster, as the real company does; Ring of Respectable TV uses only the
people signed to that brand."""
import os
from common import worker, write_company, add_moves

PROMO = {
    "id": "ewe", "model": "workrate", "name": "EWE", "full_name": "Everyone Wrestles Everyone",
    "blurb": "The upstart that stopped being an upstart. Owned by a football heir with a spreadsheet for every feeling, it books long, hard matches, signs everybody, and argues with the internet every Wednesday night.",
    "owner": {"name": "Tommy Spreadsheet", "style": "workrate", "roots": "tradition", "pledge": "pay"},
    "staff": {"road_agent": "Uncle Puppetstrings", "head_writer": "Tommy Spreadsheet's group chat"},
    "announcers": ["Exposition", "Tommy Tangent"],
    "cities": ["Jacksonville", "Chicago", "Philadelphia", "New York", "Boston", "Pittsburgh", "Cleveland", "Atlanta", "Dallas", "Houston", "Denver", "Los Angeles", "Seattle", "Toronto", "London", "Melbourne"],
    "cash": 70000000, "popularity": 74, "flagship_month": 8, "tv_slot": 2, "production_level": 3,
    "brands": [{"id": "ror", "name": "Ring of Respectable"}],
    "events": [
        {"n": "Homecoming Nap", "t": "taped"}, {"n": "Grand Slammed: Down Under", "t": "tent"}, {"n": "Revolving Door", "t": "arena"},
        {"n": "Family Business", "t": "arena"}, {"n": "Double or Something", "t": "tent"}, {"n": "Forbidden Screen Door", "t": "tent"},
        {"n": "Blood and Guts and Gravy", "t": "gimmick"}, {"n": "All Inn", "t": "flag"}, {"n": "All Out of Breath", "t": "arena"},
        {"n": "WrestleDaydream", "t": "arena"}, {"n": "Half Gear", "t": "tent"}, {"n": "The Apocalypse Special", "t": "arena"}]
}
SHOWS = [
    {"id": "ewe_detonation", "name": "Wednesday Night Detonation", "weight": 1},
    {"id": "ewe_fender", "name": "Saturday Night Fender Bender", "weight": 0.7},
    {"id": "ewe_ror", "name": "Ring of Respectable TV", "brand": "ror", "weight": 0.35},
]
TITLES = [
    {"id": "ewe_world", "name": "EWE World Championship", "gender": "M", "level": 3},
    {"id": "ewe_womens_world", "name": "EWE Women's World Championship", "gender": "F", "level": 3},
    {"id": "ewe_international", "name": "EWE International-ish Championship", "gender": "M", "level": 2},
    {"id": "ewe_continental", "name": "Continental Drift Crown", "gender": "M", "level": 2},
    {"id": "ewe_cable", "name": "Cable Television Championship", "gender": "M", "level": 2},
    {"id": "ewe_basic_cable", "name": "Basic Cable Women's Championship", "gender": "F", "level": 2},
    {"id": "ewe_tag", "name": "EWE World Tag Team Championship", "gender": "M", "level": 2, "tag": True},
    {"id": "ror_world", "name": "Ring of Respectable World Championship", "gender": "M", "level": 2, "brand": "ror"},
    {"id": "ror_womens", "name": "Ring of Respectable Women's Championship", "gender": "F", "level": 2, "brand": "ror"},
    {"id": "ror_tv", "name": "Ring of Respectable Television Championship", "gender": "M", "level": 1, "brand": "ror"},
    {"id": "ror_pure", "name": "Pure-ish Rules Championship", "gender": "M", "level": 1, "brand": "ror"},
]

# id | ring name | gender | disposition | style | brand | push | tier | age | hometown | category | gimmick | catchphrase | finisher | finisher description | TARGET (design only)
R = [
 # the top of the card
 ("rodeo_regret", "Rodeo Regret", "M", "face", "all_rounder", None, "main_eventer", 5, 34, "Halifax, Virginia", "The Anxious Millennial Cowboy", "A sad-eyed cowboy who drank his way out of the top spot, found himself in a field, and came back to win everything. He still apologises after every buckshot lariat.", "Sorry. (Lariat.) Sorry.", "The Buckshot Apology", "He springs off the top rope as his opponent stands, and clotheslines them out of their boots. Then he says sorry.", "Hangman Adam Page"),
 ("zed_zenith", "Zed Zenith", "M", "tweener", "all_rounder", None, "main_eventer", 5, 42, "Winnipeg", "Best Bout Machine (Factory Refurbished)", "A video-game-loving genius who has had the best match of the year so often it is now in his contract. He nearly died, came back, and still flips like he is twenty-five.", "Game over. Insert coin.", "The Final Boss Drop", "A fireman's carry lifted high and dropped into a sit-out driver.", "Kenny Omega"),
 ("barbwire_burke", "Barbwire Burke", "M", "heel", "brawler", None, "main_eventer", 5, 40, "Cincinnati", "Purveyor of Violence (Wholesale)", "A bleeding, grinning street fighter who has wrapped his own fists in things that are not tape. He runs a gang of believers and wants wrestling to hurt again.", "I came here to hurt. You came here to watch.", "The Shift Change", "A double underhook DDT, delivered after a twelve-hour shift.", "Jon Moxley"),
 ("detour_dante", "Detour Dante", "M", "face", "all_rounder", None, "main_eventer", 5, 35, "Tacoma", "Realest in the Building", "A smooth, dangerous former champion who took the long way round to the top and sends everyone the bill for the trip.", "This is my neighbourhood. You're trespassing.", "The House Call", "He hoists his opponent into a pumphandle and drives them into his knee.", "Swerve Strickland"),
 ("long_island_lux", "Long Island Lux", "M", "heel", "technician", None, "main_eventer", 5, 30, "Plainview", "Salt of the Earth (Imported)", "A rich, smirking Long Islander who knows he is better than you, and that you know it. He has a ring, a scarf and a lawyer for every occasion.", "I'm rich. You're not. Discuss.", "The Long Island Iced Driver", "A cradled tombstone piledriver, finished with a wave to the cheap seats.", "MJF"),
 ("billy_kestrel", "Billy Kestrel", "M", "face", "flyer", None, "main_eventer", 5, 33, "Havering", "Best Wrestler in the World (He Checked)", "A Cockney daredevil who does things in the air that make doctors write letters. He calls his finishes by number and never runs out.", "Mate. Mate. MATE.", "The Kestrel Strike", "A running elbow to the back of the head from out of a handspring.", "Will Ospreay"),
 ("reiji_ameda", "Reiji Ameda", "M", "heel", "technician", None, "main_eventer", 5, 39, "Anjo", "Drizzle-Maker", "A Japanese legend who once made it rain money in arenas and now just makes it drizzle. He is unbearably smug and unbearably good.", "Drip. Drip. Money.", "The Light Shower", "He spins his opponent by the wrist into a short-arm lariat that does not let go.", "Kazuchika Okada"),
 ("coffin_kid_corwin", "Coffin Kid Corwin", "M", "face", "flyer", None, "main_eventer", 4, 33, "Seattle", "Skateboard Daredevil", "A painted skater who throws himself off things that are too high, onto things that are too hard. He climbed a real mountain to prove a point nobody had made.", "Nothing to lose. I already lost it.", "The Coffin Drop-in", "A falling senton off the top rope, feet first, eyes closed.", "Darby Allin"),
 ("clementine_casual", "Clementine Casual", "M", "face", "entertainer", None, "upper_midcarder", 4, 41, "Hollywood", "Laziest Man Alive", "A sunglassed slacker who wrestles with his hands in his pockets and, somehow, wins. He has never been in a hurry and never will be.", "(He puts his hands in his pockets. That is the catchphrase.)", "The Pocket Punch", "A running punch thrown with his hands still almost in his pockets.", "Orange Cassidy"),
 ("crispin_crate", "Crispin Crate", "M", "heel", "technician", None, "main_eventer", 4, 52, "Kitchener", "The Patriarch", "A smirking veteran who has betrayed every partner he ever had and now leads a family of people he insults.", "Respect your elders. Then step aside for them.", "The Family Feud", "A double-arm-trap twisting slam, the switch flipped off.", "Christian Cage"),
 ("spike_sharpe", "Spike Sharpe", "M", "face", "brawler", None, "main_eventer", 4, 52, "Orangeville", "Rated PG-13 Superstar", "A Canadian legend who came back from a broken neck and a quiet retirement, to spear people he used to tag with.", "Rated PG-13. Parental guidance strongly suggested.", "The Speared Edge", "A running tackle so hard it leaves a crater.", "Adam Copeland"),
 ("captain_thesaurus", "Captain Thesaurus", "M", "heel", "entertainer", None, "upper_midcarder", 4, 55, "Winnipeg", "The Wizard of Twelve Thousand Words", "A veteran who knows twelve thousand holds and has named all of them in a promo. He reinvents himself every year and keeps a list of everybody who did not notice.", "You just made the list. Of synonyms.", "The Dictionary Crab", "A single-leg crab with a knee in the back, and a definition read aloud.", "Chris Jericho"),
 ("klaus_cuckoo", "Klaus Cuckoo", "M", "heel", "powerhouse", None, "upper_midcarder", 4, 41, "Lucerne", "The Swiss Army Man", "A precise, giant Swiss strongman who swings people round by the ankles and keeps perfect time while doing it.", "Tick. Tock. Swing.", "The Cuckoo Swing", "He spins his opponent by the ankles for as long as the crowd counts.", "Claudio Castagnoli"),
 ("leather_jacket_jr", "Leather Jacket Jr.", "M", "heel", "technician", None, "midcarder", 3, 29, "Wilmington", "Apprentice Bad Boy", "A clean-cut student of the mat who joined a gang, bought a leather jacket and now practises sneering in the mirror.", "I'm dangerous now. Ask my mum.", "The Seatbelt Clutch", "A trapped-arm rear submission he learned in school.", "Wheeler Yuta"),
 ("geordie_gremlin", "Geordie Gremlin", "M", "heel", "flyer", None, "upper_midcarder", 4, 39, "Newcastle", "The Nastiest Man in the Building", "A small, sharp, angry Englishman who does not care if you like him, which you do not.", "Rubbish. All of you. Rubbish.", "The Gremlin Twist", "A corkscrew senton from the top rope.", "PAC"),
 ("shinji_skyscraper", "Shinji Skyscraper", "M", "heel", "all_rounder", None, "main_eventer", 4, 30, "Osaka", "The Alpha (Taller Than You)", "A huge Japanese athlete who moves like a cruiserweight and hits like a crane. He belongs to a family of people who think they own wrestling.", "Look up.", "The Raging Crane", "A lifting knee to the jaw from a man who should not jump that high.", "Konosuke Takeshita"),
 ("kid_comet", "Kid Comet", "M", "heel", "all_rounder", None, "upper_midcarder", 4, 26, "Sydney", "The Rising Star That Will Not Stop Rising", "A lanky Australian prodigy who has had more great matches than birthdays.", "Watch the sky. I'm in it.", "The Comet Tail", "A spinning tombstone into the mat.", "Kyle Fletcher"),
 ("bounce_rebound", "Bounce Rebound", "M", "face", "flyer", None, "upper_midcarder", 4, 37, "Paducah", "Human Highlight Reel", "A flyer who has never once taken the stairs when he could take the air instead.", "Highlights. Only highlights.", "The Rebound Bomb", "A springboard 630 senton, the full turn and a bit.", "Ricochet"),
 ("tavita_tusi", "Tavita Tusi", "M", "heel", "brawler", None, "main_eventer", 4, 47, "Huntington Beach", "The Island Choke Machine", "A thick-necked veteran who chokes people to sleep and then does a promo over them in a calm voice.", "Hush. Sleep now.", "The Island Nap", "A rear naked choke, delivered gently, until it isn't.", "Samoa Joe"),
 ("mount_mack", "Mount Mack", "M", "heel", "powerhouse", None, "upper_midcarder", 3, 35, "Oakland", "Powerhouse For Hire", "A giant who never says much and does not need to.", "(Grunt.)", "The Landslide Slam", "A spinebuster from twice the usual height.", "Powerhouse Hobbs"),
 ("sinker", "Sinker", "M", "face", "brawler", None, "midcarder", 3, 27, "Long Island", "Commentator's Son With a Grudge", "The silent, scowling son of a commentator, who throws people around like wet laundry and never smiles.", "...", "The Gone Fishing Clutch", "A sleeper hold from behind, until the lights go out.", "Hook"),
 ("rooster_rhett", "Rooster Rhett", "M", "face", "brawler", "ror", "upper_midcarder", 3, 40, "Laurel, Delaware", "Chicken Farmer of Fury", "A Delaware farmer who wrestles like the roosters are watching and he owes them money.", "Cock-a-doodle-DO SOMETHING!", "The Rooster Drop", "A shooting star elbow drop.", "Mark Briscoe"),
 ("mitch_fawn", "Mitch Fawn", "M", "heel", "flyer", None, "upper_midcarder", 4, 41, "Hesperia", "Old Fawn (Executive Vice President)", "One half of a brother tag team who hold executive titles in the company and use them mostly to give themselves good matches.", "Kick. Kick. Paperwork.", "The Six-Kick Special", "A thrust kick to the jaw, usually in a set of six.", "Matt Jackson"),
 ("nicky_fawn", "Nicky Fawn", "M", "heel", "flyer", None, "upper_midcarder", 4, 37, "Hesperia", "Old Fawn (Executive Vice President)", "The younger brother, who does more flips and fewer meetings.", "Brothers first. Flips second.", "The Fawn Ballet", "A springboard into a spinning kick, then a bow.", "Nick Jackson"),
 ("brutus_biceps", "Brutus Biceps", "M", "heel", "powerhouse", None, "main_eventer", 4, 50, "Junction City", "The All-Powerful (Self-Certified)", "A muscle-bound legend who joined the business of hurting people for money and keeps the receipts in his biceps.", "Hurt is business. Business is booming.", "The Hurting Lock", "A full nelson that squeezes until a contract is signed.", "Bobby Lashley"),
 ("professor_pinnacle", "Professor Pinnacle", "M", "heel", "technician", None, "upper_midcarder", 3, 51, "Orangeburg", "The Gold Standard of Being Underrated", "A veteran athlete who was told he was underrated for twenty years and decided to make everybody pay for it.", "Grade A. Every time.", "The Pay Dirt", "A step-up knee to the face.", "Shelton Benjamin"),
 ("montel_mogul", "Montel Mogul", "M", "heel", "entertainer", None, "midcarder", 2, 52, "Miami", "Most Valuable Pitchman", "The manager of the hurting business, who sells you a deal you did not want and a beating you did not ask for.", "Ballin'. On a budget.", "The Mogul's Ending", "A running knee in the corner while his clients hold you.", "MVP"),
 ("butterfly_knife_bentley", "Butterfly Knife Bentley", "M", "heel", "technician", None, "upper_midcarder", 4, 33, "Auckland", "The Catch-and-Release Rogue", "A smirking New Zealander who once ruled the biggest faction in Japan and now leads a cowboy gang that sells hats.", "It's still real to me, mate.", "The Switchback", "A spinning reverse STO.", "Jay White"),
 ("smoothie_sullivan", "Smoothie Sullivan", "M", "heel", "brawler", None, "midcarder", 3, 37, "Joliet", "Flamboyant Brawler", "A loud, sequinned brawler who talks too fast and punches too hard.", "Juiced up and nowhere to go!", "The Pulp Friction", "A left-handed punch from the top rope.", "Juice Robinson"),
 ("lyric_lyle", "Lyric Lyle", "M", "heel", "entertainer", None, "midcarder", 3, 36, "Boston", "Battle Rapper of the Ring", "A rapper who writes a diss track about every opponent and occasionally wrestles them.", "Mic drop. Then a real drop.", "The Mic Drop Elbow", "A top-rope elbow, then the microphone.", "Max Caster"),
 ("anton_applause", "Anton Applause", "M", "face", "all_rounder", None, "midcarder", 3, 35, "Meriden", "Crowd-Pleasing Partner", "The likeable half of a rapping tag team, who makes the crowd do a hand gesture they all pretend not to love.", "Clap. Clap. Clap that.", "The Arrival", "A sit-out powerbomb from a fireman's carry.", "Anthony Bowens"),
 ("big_daddy_rifle", "Big Daddy Rifle", "M", "face", "brawler", None, "lower_midcarder", 2, 62, "Orlando", "Ageless Dad of the Tag Division", "A legend in his sixties who manages younger men and still throws a better punch.", "Respect your elders. Especially this one.", "The Old Faithful", "A fireman's carry into a jumping neckbreaker.", "Billy Gunn"),
 ("burt_bluecollar", "Burt Bluecollar", "M", "heel", "technician", None, "upper_midcarder", 4, 40, "Whiteville", "Mustache Union Member", "Half of a moustached tag team who think tag wrestling died in 1989 and are trying to dig it up.", "Old school. No school. Top guys.", "The Union Break", "A double-team bulldog into a backbreaker.", "Dax Harwood"),
 ("dex_diesel", "Dex Diesel", "M", "heel", "technician", None, "upper_midcarder", 4, 38, "Lumberton", "Mustache Union Member", "The other half, who drives the van and fixes the trophies.", "We're the best. Ask anyone over sixty.", "The Gut-Buster Union", "A double-team neckbreaker.", "Cash Wheeler"),
 ("ed_borough", "Ed Borough", "M", "face", "brawler", None, "upper_midcarder", 3, 44, "Yonkers", "Cranky King of the Bronx", "A furious, pudgy, beloved brawler who cuts promos about his feelings and backfists the people who caused them.", "I'm tired. I'm angry. I'm here.", "The Bronx Backhand", "A spinning backfist, the size of a bin lid.", "Eddie Kingston"),
 ("guitar_gerry", "Guitar Gerry", "M", "heel", "brawler", None, "lower_midcarder", 2, 59, "Nashville", "The Last Outlaw (With a Guitar)", "A country veteran who breaks guitars over heads and then sells the strings.", "Ain't my first rodeo. Or second guitar.", "The Encore Faceplant", "A falling facebuster, guitar optional.", "Jeff Jarrett"),
 ("gold_dust_darren", "Gold Dust Darren", "M", "face", "brawler", None, "lower_midcarder", 2, 57, "Austin", "The Natural Glitter", "A veteran in a gold bodysuit who has been wrestling since before most of the roster was born.", "Glitter is forever.", "The Final Reckoning", "A bulldog off the ropes.", "Dustin Rhodes"),
 ("brick_bodhi", "Brick Bodhi", "M", "heel", "brawler", None, "midcarder", 3, 38, "Los Angeles", "Gang Leader With a Beard", "A huge, bearded brawler who leads a gang of dark misfits and punches like a slammed door.", "Lock the doors.", "The Gloom Bomb", "A sit-out powerbomb from a cutter position.", "Brody King"),
 ("fastball_finnegan", "Fastball Finnegan", "M", "face", "flyer", None, "upper_midcarder", 4, 35, "Montreal", "The Kicking Speedster", "A tiny Canadian who kicks faster than people can blink and once kicked his way through a whole tournament.", "Too fast. Sorry.", "The Fastball Driver", "A cradled, spinning driver after a flurry of kicks.", "Speedball Mike Bailey"),
 ("jetstream_jace", "Jetstream Jace", "M", "face", "flyer", None, "midcarder", 3, 29, "Columbus", "The Jet (Commercial Class)", "A high-flying athlete who leaps like he is late for a flight.", "Fasten your seatbelts.", "The Jetstream Splash", "A frog splash from the far corner.", "Kevin Knight"),
 ("zap_zeller", "Zap Zeller", "M", "face", "flyer", None, "midcarder", 3, 31, "Lakeland", "Flash of Lightning", "A small, fast, shouting flyer who arrives at full speed and leaves at fuller speed.", "ZAP!", "The Lightning Rod", "A frog splash from the top rope.", "Lio Rush"),
 ("stunt_double_sal", "Stunt Double Sal", "M", "face", "flyer", None, "lower_midcarder", 2, 28, "Hamilton", "Human Stunt", "A daredevil who leaps off things for a living and has a stunt double for his stunt double.", "Action!", "The Stunt Fall", "A corkscrew shooting star press.", "Action Andretti"),
 ("kale_kenway", "Kale Kenway", "M", "face", "technician", None, "upper_midcarder", 4, 45, "Aberdeen, Washington", "The Organic Underdog (Semi-Retired)", "A small, bearded technician who grows his own vegetables and lives in a van to save money. Semi-retired, he wrestles when the crowd chants for him, which is always.", "He points to the sky and the arena chants: YAY! YAY! YAY!", "The Compost Lock", "He traps one arm with his legs, cranks the face back with a forearm, and asks politely whether they would like to tap before he composts them.", "Bryan Danielson"),
 # Ring of Respectable (the ROH parody)
 ("el_forajido", "El Forajido", "M", "face", "flyer", "ror", "main_eventer", 4, 30, "Torreón", "The Outlaw Luchador", "A masked Mexican athlete who can lift a man with one arm while doing a handstand, and often does.", "Arriba, outlaw!", "The Outlaw Plex", "A handstand into a lifted bridging suplex.", "Bandido"),
 ("mascara_brillante", "Máscara Brillante", "M", "face", "flyer", "ror", "upper_midcarder", 3, 36, "Guadalajara", "The Golden Mask", "A shining luchador who flips across the ring like a coin someone threw for luck.", "Brilla. Siempre.", "The Golden Twist", "A springboard shooting star press.", "Mascara Dorada"),
 ("capitan_cuerda", "Capitán Cuerda", "M", "face", "flyer", "ror", "midcarder", 3, 28, "Torreón", "Captain of the Ropes", "A luchador who walks the top rope like it is a sidewalk and lands everything on the way down.", "Cuerda floja. Corazón firme.", "The Tightrope", "A rope-walk into a moonsault.", "Komander"),
 ("strongarm_rod", "Strongarm Rod", "M", "heel", "technician", "ror", "upper_midcarder", 3, 43, "Eastpointe", "Messiah of the Backbreaker", "A veteran who has broken more backs than a bad mattress and is proud of it.", "Back-breaking news.", "The Spine Mailbox", "A backbreaker into a powerbomb.", "Roderick Strong"),
 ("leg_lock_lee", "Leg Lock Lee", "M", "heel", "technician", "ror", "midcarder", 3, 31, "Pittsburgh", "Taiga-Style Submission Artist", "A quiet technician who twists legs like pretzels and gets very annoyed at noise.", "Shh. Tap.", "The Border City Stretch", "A pretzel-shaped leg lock.", "Lee Moriarty"),
 ("shane_slabs", "Shane Slabs", "M", "heel", "brawler", "ror", "midcarder", 3, 38, "Cleveland", "Promotions Boss of the Back Room", "A huge, slow-talking brawler who runs a crew of hard men and tells them where to stand.", "Respect the business.", "The Welcome to the Land", "A package piledriver.", "Shane Taylor"),
 ("dandy_castleton", "Dandy Castleton", "M", "face", "entertainer", "ror", "lower_midcarder", 2, 40, "Rochester", "The Peacock Prince", "A flamboyant veteran who comes to the ring with two attendants and a peacock feather and leaves with neither.", "Dandy is as dandy does.", "The Peacock Plex", "A Northern lights suplex into a German.", "Dalton Castle"),
 ("nick_waynewright", "Nick Waynewright", "M", "heel", "flyer", "ror", "midcarder", 3, 21, "Seattle", "Teen Prodigy With a Mother Problem", "A teenage wonder whose mother manages him, books him, and is on his match card more than he is.", "Ask my mum. She's in charge.", "The Mum's Orders", "A spinning cutter from the top rope.", "Nick Wayne"),
 # women
 ("hollywood_hazel", "Hollywood Hazel", "F", "heel", "entertainer", None, "main_eventer", 5, 30, "Gold Coast", "Timeless Starlet", "A woman who speaks only in old movie lines, wears pearls to fight, and believes it is 1948. The crowd believes it too.", "Darling... you're in my close-up.", "The Final Close-Up", "A cradle piledriver, delivered with a fan's flutter.", "Toni Storm"),
 ("coco_capital", "Coco Capital, the CEO-ish", "F", "heel", "all_rounder", None, "main_eventer", 5, 34, "Boston", "Chief Executive Officer of Herself", "A champion who calls herself the boss, wears a cape, and bills every opponent by the hour.", "The CEO-ish will see you now. Invoice to follow.", "The Hostile Takeover", "A short-arm, cross-legged crossface that stays until the shares change hands.", "Mercedes Moné"),
 ("kay_starchart", "Kay Starchart", "F", "face", "powerhouse", None, "main_eventer", 4, 30, "Islip", "The Galaxy's Greatest Visitor", "A strongwoman from outer space, or Long Island, who lifts people like groceries and stares at the lights.", "Take me to your leader. Then I'll lift them.", "The Close Encounter", "A lifting powerbomb with a spin.", "Kris Statlander"),
 ("wilma_warbler", "Wilma Warbler", "F", "face", "powerhouse", None, "upper_midcarder", 4, 31, "Wilmington", "The Babe With the Power", "A beaming, singing, laughing powerhouse who powerbombs people while smiling.", "Sing along! (She powerbombs you.)", "The Encore Bomb", "A lifting sit-out powerbomb.", "Willow Nightingale"),
 ("hardcase_hattie", "Hardcase Hattie", "F", "heel", "brawler", None, "upper_midcarder", 4, 30, "Southampton", "Rock-Hard English Brawler", "A tough, smoking English brawler who lariats people and buys them a drink afterwards.", "Hard case. Soft drink.", "The Hayride", "A running lariat to the back of the head.", "Jamie Hayter"),
 ("lightning_lupe", "Lightning Lupe", "F", "face", "brawler", None, "upper_midcarder", 4, 39, "Tijuana", "The Thunderous Mexican Legend", "A fiery Mexican legend who fights for her people and paints her face for battle.", "¡Por mi gente!", "The Lightning Driver", "A Michinoku driver.", "Thunder Rosa"),
 ("poppy_pinup", "Poppy Pinup", "F", "heel", "entertainer", None, "upper_midcarder", 3, 27, "Southampton", "The Glamour", "A former starlet's assistant who stole the act, the gown and the spotlight.", "Glamour is a weapon.", "The Glamour Shot", "A running knee to the face.", "Mariah May"),
 ("bubblegum_bonnie", "Bubblegum Bonnie", "F", "face", "entertainer", None, "midcarder", 2, 31, "Sydney", "Bubblegum Pop Star", "A singing, dancing Australian who writes a jingle for every match and loses most of them.", "Pop! Pop! Pop!", "The Bubble Burst", "A diving crossbody.", "Harley Cameron"),
 ("azure_azalea", "Azure Azalea", "F", "face", "flyer", None, "midcarder", 3, 26, "Chicago", "Sky-Blue Darling", "A cheerful flyer who wears blue from head to toe and kicks people in the head.", "Clear skies ahead.", "The Code Blue", "A kick to the head that she calls a diagnosis.", "Skye Blue"),
 ("raven_heartless", "Raven Heartless", "F", "heel", "technician", None, "upper_midcarder", 3, 24, "Somerset", "Goth Witch of the House", "A young goth who joined a dark family and speaks in riddles nobody asked for.", "Your heart is mine. Literally.", "The Heartbreaker", "A seated arm-trap lock.", "Julia Hart"),
 ("chokehold_cassie", "Chokehold Cassie", "F", "face", "technician", None, "midcarder", 3, 27, "Brunswick", "Queen Slayer", "A pretty, quiet assassin who chokes people out with a smile.", "Sleep tight.", "The Lullaby", "A rear naked choke from behind.", "Anna Jay"),
 ("kendo_kumiko", "Kendo Kumiko", "F", "face", "technician", None, "upper_midcarder", 4, 37, "Kanagawa", "Kendo Stick Champion", "A Japanese veteran who brings a kendo stick to the ring and uses it more politely than you'd think.", "Bow first. Then stick.", "The Bamboo Knee", "A running knee strike.", "Hikaru Shida"),
 ("dana_diligent", "The Professor, Dana Diligent", "F", "heel", "technician", None, "midcarder", 3, 38, "Fairfax", "Professor of Pain", "A cold, precise technician who teaches the women's division a lesson every week and grades it harshly.", "Class is in session.", "The Final Exam", "A sit-out powerbomb into a leg lock.", "Serena Deeb"),
 ("punk_princess_paris", "Punk Princess Paris", "F", "heel", "entertainer", None, "upper_midcarder", 3, 33, "Norwich", "The Punk Princess", "An English punk from a wrestling family who came back from a career-ending injury and has never stopped talking about it.", "Never say never. Say Paris.", "The Punk Rock Drop", "A DDT from the corner.", "Saraya"),
 ("bertha_bulwark", "Bertha Bulwark", "F", "heel", "powerhouse", None, "upper_midcarder", 3, 29, "Dallas", "The Megasaurus", "A hulking, roaring powerhouse who treats every match as a hunt.", "RAWR. (Copyright WWC.)", "The Fang Bomb", "A lifting cutter into a powerbomb.", "Megan Bayne"),
 ("teenage_riot_rory", "Teenage Riot Rory", "F", "heel", "brawler", None, "midcarder", 2, 20, "Cleveland", "Teenage Riot Machine", "A teenager who started wrestling before she could drive and treats every crowd like detention.", "I'm grounded. You're on the ground.", "The Detention Drop", "A swinging side slam.", "Billie Starkz"),
 ("minerva_forever", "Minerva, the Forever Goddess", "F", "heel", "all_rounder", "ror", "main_eventer", 4, 37, "Austin", "The Forever Champion", "A fallen goddess who has held the brand's title longer than some shows have been on the air, and expects to be worshipped for it.", "Forever. Get used to it.", "The Temple Drop", "A lifting powerbomb into a neckbreaker.", "Athena"),
 ("billie_bombshell", "Billie Bombshell", "F", "face", "flyer", "ror", "midcarder", 2, 26, "Philadelphia", "Brand Prospect", "A young flyer the brand has bet on, who keeps losing and keeps being loved.", "Next time. Definitely next time.", "The Bombshell Bulldog", "A running bulldog.", "Queen Aminata (role)"),
]

PEOPLE = [
 ("tommy_spreadsheet", "Tommy Spreadsheet", "M", "face", "entertainer", "non_wrestler", 1, 43, "Champaign", "The Owner Who Reads the Comments", "The football heir who owns the company, books the shows, reads every comment and answers some of them.", "Bigger than ever. (By my numbers.)", "-", "-", "Tony Khan", ["owner", "booker"], False),
 ("uncle_puppetstrings", "Uncle Puppetstrings", "M", "heel", "entertainer", "non_wrestler", 1, 61, "Winnipeg", "The Invisible Hand", "A smug Canadian manager who leads a family of the best wrestlers in the company and talks while they work.", "Don't look at me. Look at my family.", "-", "-", "Don Callis", ["manager", "road_agent"], False),
 ("exposition", "Exposition", "M", "face", "entertainer", "non_wrestler", 1, 45, "Unknown", "Masked Announcer", "A masked commentator who knows every match in history and explains all of them, during the current one.", "Remember when? He does.", "-", "-", "Excalibur", ["announcer"], False),
 ("tommy_tangent", "Tommy Tangent", "M", "face", "entertainer", "non_wrestler", 1, 68, "Atlanta", "Veteran Interviewer", "A veteran voice who has interviewed everybody, twice, and starts every answer with 'well'.", "Well... there you have it.", "-", "-", "Tony Schiavone", ["announcer"], False),
 ("grandpa_gravy", "Grandpa Gravy", "M", "face", "entertainer", "non_wrestler", 1, 74, "Westville", "Legendary Voice, Retired-ish", "The legendary voice of a generation, who still calls the big ones and calls everybody 'partner'.", "Business is about to pick up, partner.", "-", "-", "Jim Ross", ["announcer"], True),
 ("face_paint_phantom", "The Face-Paint Phantom", "M", "face", "brawler", "main_eventer", 4, 67, "Omaha", "The Icon (Retired)", "A face-painted legend who retired undefeated in his last company and now appears from the rafters on birthdays.", "One more time. Just once. Probably.", "The Phantom Lock", "A sharpshooter-shaped leg lock with a scorpion's sting.", "Sting", ["wrestler"], True),
]

MOVE = {"rodeo_regret": "Springboard lariat", "zed_zenith": "Fireman's carry sit-out driver", "barbwire_burke": "Double underhook DDT", "detour_dante": "Pumphandle into a knee",
 "long_island_lux": "Cradle tombstone piledriver", "billy_kestrel": "Handspring elbow to the back of the head", "reiji_ameda": "Short-arm lariat", "coffin_kid_corwin": "Top-rope coffin drop",
 "clementine_casual": "Superman punch", "crispin_crate": "Double-arm-trap twisting slam", "spike_sharpe": "Spear", "captain_thesaurus": "Elevated Boston crab",
 "klaus_cuckoo": "Giant swing", "leather_jacket_jr": "Seatbelt clutch", "geordie_gremlin": "Corkscrew senton", "shinji_skyscraper": "Running knee", "kid_comet": "Spinning tombstone",
 "bounce_rebound": "630 senton", "tavita_tusi": "Rear naked choke", "mount_mack": "Spinebuster", "sinker": "Sleeper hold", "rooster_rhett": "Shooting star elbow drop",
 "mitch_fawn": "Superkick", "nicky_fawn": "Springboard spinning kick", "brutus_biceps": "Full nelson", "professor_pinnacle": "Step-up knee", "montel_mogul": "Corner running knee",
 "butterfly_knife_bentley": "Spinning reverse STO", "smoothie_sullivan": "Top-rope punch", "lyric_lyle": "Top-rope elbow drop", "anton_applause": "Fireman's carry sit-out powerbomb",
 "big_daddy_rifle": "Fireman's carry neckbreaker", "burt_bluecollar": "Bulldog into a backbreaker", "dex_diesel": "Double-team neckbreaker", "ed_borough": "Spinning backfist",
 "guitar_gerry": "Falling facebuster", "gold_dust_darren": "Running bulldog", "brick_bodhi": "Sit-out powerbomb", "fastball_finnegan": "Spinning cradle driver",
 "jetstream_jace": "Frog splash", "zap_zeller": "Frog splash", "stunt_double_sal": "Corkscrew shooting star press", "kale_kenway": "Triangle crossface",
 "el_forajido": "Handstand lifting suplex", "mascara_brillante": "Springboard shooting star press", "capitan_cuerda": "Rope-walk moonsault", "strongarm_rod": "Backbreaker into a powerbomb",
 "leg_lock_lee": "Pretzel leg lock", "shane_slabs": "Package piledriver", "dandy_castleton": "Northern lights into a German suplex", "nick_waynewright": "Top-rope spinning cutter",
 "hollywood_hazel": "Cradle piledriver", "coco_capital": "Cross-legged crossface", "kay_starchart": "Spinning lifting powerbomb", "wilma_warbler": "Sit-out powerbomb",
 "hardcase_hattie": "Running lariat", "lightning_lupe": "Michinoku driver", "poppy_pinup": "Running knee", "bubblegum_bonnie": "Diving crossbody", "azure_azalea": "Head kick",
 "raven_heartless": "Arm-trap lock", "chokehold_cassie": "Rear naked choke", "kendo_kumiko": "Running knee", "dana_diligent": "Sit-out powerbomb into a leg lock",
 "punk_princess_paris": "Corner DDT", "bertha_bulwark": "Cutter into a powerbomb", "teenage_riot_rory": "Swinging side slam", "minerva_forever": "Powerbomb into a neckbreaker",
 "billie_bombshell": "Running bulldog", "face_paint_phantom": "Sharpshooter"}

SIG = {"rodeo_regret": "Apology Driver|Reverse piledriver; Lasso Lariat|Running lariat",
 "zed_zenith": "Button Masher|Snap dragon suplex; Combo Breaker|Running knee",
 "barbwire_burke": "Rider's Choke|Bulldog choke; Forearm Fiesta|Flurry of forearms",
 "detour_dante": "Neighbourhood Watch|Top-rope double stomp; Wristband Toss|Rolling flatliner",
 "long_island_lux": "Salt Shaker|Kangaroo kick; The Ring Finger|Loaded punch",
 "billy_kestrel": "The Bird Strike|Springboard cutter; Thunder Clap|Double underhook neckbreaker",
 "reiji_ameda": "Money Clip|Cobra clutch; Rain Delay|Tombstone piledriver",
 "coffin_kid_corwin": "Skate Park Senton|Suicide dive senton; Last Supper|Leg-trap cradle",
 "clementine_casual": "Lazy Kick|Low dropkick; Beach Break|Michinoku driver",
 "crispin_crate": "Spear Plagiarism|Spear; Elders' Frog Splash|Frog splash",
 "spike_sharpe": "Crossbody Crash|Crossbody; Edge of Reason|Spinning facebuster",
 "captain_thesaurus": "Code Word|Double knee facebuster; Moonsault of Synonyms|Springboard moonsault",
 "klaus_cuckoo": "Swiss Clockwork|European uppercut; Alpine Bomb|Cradle powerbomb",
 "leather_jacket_jr": "Bridge Repair|Bridging German suplex; Leather Lariat|Running lariat",
 "geordie_gremlin": "The Gremlin Grip|Arm-trap crossface; Gremlin Kick|Enzuigiri",
 "shinji_skyscraper": "Tower Drop|Spinning sit-out powerbomb; Skyline|Tornado DDT",
 "kid_comet": "Comet Kick|Spinning heel kick; Comet Landing|Spinning sit-out piledriver",
 "bounce_rebound": "Rebound Bounce|Springboard crossbody; Recoil|Shooting star press",
 "tavita_tusi": "Island Buster|Muscle buster; Island Facebuster|Senton splash",
 "mount_mack": "Mountain Range|Spinebuster; Mack Truck|Pounce",
 "sinker": "Line and Sinker|Belly-to-belly throw; Bobber|Lariat",
 "rooster_rhett": "Rooster Elbow|Jumping elbow drop; Cluckers|Dive through the ropes",
 "mitch_fawn": "Executive Knees|Double knee strike; Fawn Spike|Spike tombstone",
 "nicky_fawn": "Ballet Kick|Springboard kick; Nest Builder|Swanton bomb",
 "brutus_biceps": "Bicep Bomb|Spear; Bicep Curl|Dominator",
 "professor_pinnacle": "Gold Standard Spin|Exploder suplex; Report Card|Belly-to-belly",
 "montel_mogul": "Drive-By|Corner dropkick; Ballin' Elbow|Running elbow",
 "butterfly_knife_bentley": "Kiwi Kick|Superkick; Sleeper Agent|Sleeper suplex",
 "smoothie_sullivan": "Blender Bomb|Pop-up powerbomb; Fruit Punch|Left hand",
 "lyric_lyle": "Freestyle Facebuster|Facebuster; Verse Chorus Verse|Diving elbow",
 "anton_applause": "Encore|Fireman's carry; Standing Ovation|Spin kick",
 "big_daddy_rifle": "Recoil Punch|Right hand; Old School Slam|Leg drop bulldog",
 "burt_bluecollar": "Union Rules|Sharpshooter; Brainbuster Breakroom|Brainbuster",
 "dex_diesel": "Overtime|Slingshot powerbomb; Clock Puncher|Bridging German suplex",
 "ed_borough": "Bin Lid|Exploder suplex; Chop Chop|Machine-gun chops",
 "guitar_gerry": "Unplugged|Figure-four leg lock; Encore Strum|Guitar shot",
 "gold_dust_darren": "Glitterbomb|Powerslam; Shattered Glass|Running bulldog",
 "brick_bodhi": "Brick Wall|Lariat; Gloom Signs|Sit-out powerbomb",
 "fastball_finnegan": "Final Kick|Moonsault knees; Fastball Special|Spinning kick flurry",
 "jetstream_jace": "Turbulence|Springboard dropkick; Boarding Pass|Running uppercut",
 "zap_zeller": "Static Kick|Spinning kick; Overcharge|Frog splash",
 "stunt_double_sal": "Retake|Springboard moonsault; Stunt Pad|Running dropkick",
 "kale_kenway": "Running Kale|Running knee; Kale Knee|Running knee",
 "el_forajido": "Outlaw Lariat|Lariat; Bandit Bomb|Sit-out powerbomb",
 "mascara_brillante": "Golden Hurricanrana|Hurricanrana; Brillo|Moonsault to the floor",
 "capitan_cuerda": "Rope Bridge|Springboard hurricanrana; Cuerda Cutter|Springboard cutter",
 "strongarm_rod": "Strong Kick|Running knee; Back Brace Slam|Olympic slam",
 "leg_lock_lee": "Ankle Pretzel|Ankle lock; Quiet Kick|Spinning kick",
 "shane_slabs": "Cleveland Rocks|Spinebuster; Slab Slam|Body slam",
 "dandy_castleton": "Peacock Plex|German suplex; Feather Drop|Senton",
 "nick_waynewright": "Mum's Kick|Spinning kick; Wayne Train|Running knee",
 "hollywood_hazel": "Black and White Kick|Hip attack; Pearl Necklace|Bridging German suplex",
 "coco_capital": "Board Meeting Suplexes|Rolling vertical suplexes; Bankruptcy|Frog splash",
 "kay_starchart": "UFO Slam|Spinning slam; Moon Landing|Senton",
 "wilma_warbler": "Pounce Ballad|Pounce; Harmony Bomb|Powerbomb",
 "hardcase_hattie": "Pint Glass|Lariat; Last Orders|Piledriver",
 "lightning_lupe": "Day of the Dead Drop|Spinning DDT; Flash Flood|Running dropkick",
 "poppy_pinup": "Stiletto Kick|Running knee; Close-Up|Lungblower",
 "bubblegum_bonnie": "Chewing Gum|Neckbreaker; Pop Song|Crossbody",
 "azure_azalea": "Blue Moon|Springboard crossbody; Sky High|Moonsault",
 "raven_heartless": "Black Feather|Moonsault; Hex Kick|Spinning heel kick",
 "chokehold_cassie": "Chokehold Kiss|Sleeper; Queen's Gambit|Jumping knee",
 "kendo_kumiko": "Kendo Arrow|Falcon arrow; Bamboo Kick|Running knee",
 "dana_diligent": "Grade F|Spear; Homework|Leg lock",
 "punk_princess_paris": "Glasgow Kiss|Headbutt; Punk Pop|Running knee",
 "bertha_bulwark": "Tail Swipe|Spinning backfist; Meteor|Running crossbody",
 "teenage_riot_rory": "Detention|Sleeper; Pop Quiz|DDT",
 "minerva_forever": "Goddess Kick|Superkick; Olympus|Lifting powerbomb",
 "billie_bombshell": "Bombshell Kick|Superkick; Hopeful|Crossbody",
 "face_paint_phantom": "Rafter Splash|Splash from the rafters; Phantom Splash|Corner splash"}

def build():
    roster = []
    for row in R:
        (i, n, g, d, st, br, push, tier, age, town, cat, gim, say, fin, fdesc, target) = row
        roster.append(worker(i, n, g, d, st, tier, age, town, cat, gim, say, fin, fdesc, push=push, brand=br, promo="ewe"))
    for row in PEOPLE:
        (i, n, g, d, st, push, tier, age, town, cat, gim, say, fin, fdesc, target, roles, legend) = row
        roster.append(worker(i, n, g, d, st, tier, age, town, cat, gim, say, fin if fin != "-" else None, fdesc if fdesc != "-" else None, push=push, brand=None, promo="ewe", roles=roles, legend=legend))
    add_moves(roster, MOVE, SIG)
    holders = {"ewe_world": ["rodeo_regret"], "ewe_womens_world": ["hollywood_hazel"], "ewe_international": ["billy_kestrel"], "ewe_continental": ["reiji_ameda"],
               "ewe_cable": ["kid_comet"], "ewe_basic_cable": ["coco_capital"], "ewe_tag": ["burt_bluecollar", "dex_diesel"],
               "ror_world": ["el_forajido"], "ror_womens": ["minerva_forever"], "ror_tv": ["shane_slabs"], "ror_pure": ["leg_lock_lee"]}
    titles = [dict(t, holder_ids=holders.get(t["id"], [])) for t in TITLES]
    teams = [
        {"id": "ewe_old_fawns", "name": "The Old Fawns", "kind": "tag", "member_ids": ["mitch_fawn", "nicky_fawn"], "experience": 99, "chemistry": 10},
        {"id": "ewe_mustache_union", "name": "The Mustache Union", "kind": "tag", "member_ids": ["burt_bluecollar", "dex_diesel"], "experience": 96, "chemistry": 10},
        {"id": "ewe_the_applauded", "name": "The Applauded", "kind": "tag", "member_ids": ["lyric_lyle", "anton_applause"], "experience": 85, "chemistry": 8},
        {"id": "ewe_pain_partnership", "name": "The Pain Partnership", "kind": "stable", "member_ids": ["montel_mogul", "brutus_biceps", "professor_pinnacle"], "leader_id": "montel_mogul"},
        {"id": "ewe_puppetstring_family", "name": "The Puppetstring Family", "kind": "stable", "member_ids": ["shinji_skyscraper", "kid_comet", "zed_zenith"], "leader_id": "shinji_skyscraper"},
        {"id": "ewe_hard_ride", "name": "The Hard Ride", "kind": "stable", "member_ids": ["barbwire_burke", "klaus_cuckoo", "leather_jacket_jr"], "leader_id": "barbwire_burke"},
        {"id": "ewe_gold_ammo_club", "name": "The Gold Ammo Club", "kind": "stable", "member_ids": ["butterfly_knife_bentley", "smoothie_sullivan"], "leader_id": "butterfly_knife_bentley"},
        {"id": "ewe_the_patriarchy", "name": "The Patriarchy", "kind": "stable", "member_ids": ["crispin_crate", "nick_waynewright"], "leader_id": "crispin_crate"},
        {"id": "ewe_house_of_gloom", "name": "The House of Gloom", "kind": "stable", "member_ids": ["brick_bodhi", "raven_heartless"], "leader_id": "brick_bodhi"},
    ]
    return {"promotion": PROMO, "shows": SHOWS, "titles": titles, "roster": roster, "teams": teams}

if __name__ == "__main__":
    write_company("ewe", build())
    with open(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "parody", "targets-ewe.md"), "w") as f:
        f.write("# EWE and Ring of Respectable: who each one parodies (design reference, never shipped)\n\n")
        for row in R: f.write("- %s: %s\n" % (row[1], row[15]))
        for row in PEOPLE: f.write("- %s: %s\n" % (row[1], row[14]))
