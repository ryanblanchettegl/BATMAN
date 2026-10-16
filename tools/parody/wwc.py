"""The WWE parody company, WWC, written as compact rows and expanded into universes/parody/companies/wwc.json.
Run: python3 tools/parody/wwc.py
Every wrestler's parody target is kept here for the design team only (the TARGET column); it is never written to the
game's data. Ratings come from a tier and the style, then a small fixed nudge per person, so the output is the same
every run. The JSON is what modders edit; this script is just how the first draft was made."""
import json, os, hashlib
from common import worker, write_company, add_moves

PROMO = {
    "id": "wwc", "model": "corporate", "name": "WWC", "full_name": "Wrestling World Class",
    "blurb": "The giant. Owned by a sports and entertainment conglomerate that counts everything twice, run by a former champion who swears the old days are over. Three brands, two stadiums a year, and more cameras than wrestlers.",
    "owner": {"name": "The TK-Owe Holdings board", "style": "stars", "roots": "family", "pledge": "pay"},
    "staff": {"road_agent": "Ace Turnbuckle", "head_writer": "The Writers' Room"},
    "announcers": ["Marty Ohmy", "Punter Pete"],
    "cities": ["New York", "Philadelphia", "Boston", "Chicago", "Detroit", "Atlanta", "Houston", "Dallas", "Phoenix", "Los Angeles", "San Francisco", "Seattle", "Denver", "St. Louis", "Toronto", "London"],
    "cash": 160000000, "popularity": 92, "flagship_month": 4, "tv_slot": 2, "production_level": 4,
    "brands": [{"id": "rawr", "name": "RAWR"}, {"id": "slap", "name": "SlapDown"}, {"id": "notyet", "name": "NOT YET", "dev": True}],
    "events": [
        {"n": "The Royal Grumble", "t": "rumble"}, {"n": "Elimination Chamber Pot", "t": "gimmick"}, {"n": "Road to Somewhere", "t": "arena"},
        {"n": "WrestleMoney", "t": "flag"}, {"n": "Backlash Against Backlash", "t": "arena"}, {"n": "Money in the Bank Account", "t": "gimmick"},
        {"n": "Night of Big Champions", "t": "arena"}, {"n": "SummerSlamdunk", "t": "tent"}, {"n": "Clash at the Parking Lot", "t": "arena"},
        {"n": "Bad Blood Pressure", "t": "gimmick"}, {"n": "Survivor Series of Unfortunate Events", "t": "tent"}, {"n": "Saturday Night's Main Expense", "t": "arena"}]
}
SHOWS = [
    {"id": "wwc_rawr", "name": "Monday Night RAWR", "brand": "rawr", "weight": 1},
    {"id": "wwc_slap", "name": "Friday Night SlapDown", "brand": "slap", "weight": 1},
    {"id": "wwc_notyet", "name": "NOT YET Tuesday", "brand": "notyet", "weight": 0.45},
]
TITLES = [
    {"id": "wwc_undisputed", "name": "WWC Undisputed-ish Championship", "gender": "M", "level": 3, "brand": "slap"},
    {"id": "wwc_heavyish", "name": "World Heavyish Championship", "gender": "M", "level": 3, "brand": "rawr"},
    {"id": "wwc_ic", "name": "Intercontinental Breakfast Championship", "gender": "M", "level": 2, "brand": "rawr"},
    {"id": "wwc_us", "name": "United Snakes Championship", "gender": "M", "level": 2, "brand": "slap"},
    {"id": "wwc_womens_world", "name": "Woman's World-ish Championship", "gender": "F", "level": 3, "brand": "rawr"},
    {"id": "wwc_womens", "name": "WWC Women's Championship", "gender": "F", "level": 3, "brand": "slap"},
    {"id": "wwc_tag_rawr", "name": "RAWR Tag Team Championship", "gender": "M", "level": 2, "tag": True, "brand": "rawr"},
    {"id": "wwc_tag_slap", "name": "SlapDown Tag Team Championship", "gender": "M", "level": 2, "tag": True, "brand": "slap"},
    {"id": "wwc_notyet", "name": "NOT YET Championship", "gender": "M", "level": 2, "brand": "notyet"},
    {"id": "wwc_notyet_w", "name": "NOT YET Women's Championship", "gender": "F", "level": 2, "brand": "notyet"},
]

# id | ring name | gender | disposition | style | brand | push | tier 1-5 | age | hometown | gimmick category | gimmick | catchphrase | finisher | finisher description | TARGET (design only)
R = [
 # RAWR men
 ("rocco_rule", "Rocco Rule", "M", "heel", "powerhouse", "rawr", "main_eventer", 5, 41, "Pensacola", "Head of the Buffet", "The self-appointed Head of the Buffet, who demands to be thanked before every meal. He appears four times a year, takes all the credit, and leaves before the dishes.", "THANK me. Then pay the bill.", "The Spear-mint", "A charging tackle through the midsection, finished with a breath-freshening point to the crowd.", "Roman Reigns"),
 ("wilt_wellness", "Wilt Wellness", "M", "heel", "technician", "rawr", "main_eventer", 5, 38, "Vienna", "Ring General", "An Austrian drill sergeant who believes wrestling is corporal punishment. He chops chests until they file a complaint and calls everyone 'small person', including taller people.", "Is this... a WRESTLING?", "The Strict Powerbomb", "A stiff, perfectly vertical powerbomb, followed by a lecture on posture.", "Gunther"),
 ("hype_hopkins", "Hype Hopkins", "M", "face", "brawler", "rawr", "main_eventer", 4, 40, "San Francisco", "Hype Machine", "A twin who left the family business to become the most cheered man in any arena. He has one word, and the crowd says it louder than he does.", "HYPE! HYPE! HYPE!", "The Hopkins Splash", "A frog splash off the top rope, preceded by three arm swings and a bounce.", "Jey Uso"),
 ("straightedge_stan", "Straightedge Stan", "M", "tweener", "technician", "rawr", "main_eventer", 5, 47, "Chicago", "Straight-Edge Prophet", "A tattooed, soda-swilling rebel who once quit wrestling, then quit quitting. He talks for twenty minutes, insults everyone in the building, and somehow gets cheered for it.", "I'm the best in the building. Ask the building.", "Lights Out, Kid", "He drapes his opponent over his shoulders and drops them face-first onto his rising knee, then tucks them in.", "CM Punk"),
 ("velvet_visionary", "The Velvet Visionary", "M", "heel", "all_rounder", "rawr", "main_eventer", 5, 40, "Davenport", "Fashion Messiah", "A man who dresses like a sofa at a royal wedding and calls himself a visionary. He leads a faction of young believers and never wears the same blazer twice.", "Fashion forward. You, backward.", "The Stomp Sale", "A running curb stomp, sold at full price.", "Seth Rollins"),
 ("brick_breakwater", "Brick Breakwater", "M", "heel", "powerhouse", "rawr", "upper_midcarder", 4, 28, "Pensacola", "Second-Generation Bulldozer", "A barking, bounding son of a famous family who tackles people for a warm-up. He has never once walked to the ring.", "WOOF. WOOF. WOOF.", "The Military Press Release", "He presses his opponent overhead and slams them, then issues a statement.", "Bron Breakker"),
 ("big_tad_tsunami", "Big Tad Tsunami", "M", "heel", "powerhouse", "rawr", "upper_midcarder", 3, 37, "Adelaide", "Australian Tidal Wave", "A giant from down under who splashes people from the top rope and then sits down to admire it.", "Tsunami warning: you.", "The Tidal Splash", "A full-weight senton from the top rope that registers on the local seismograph.", "Bronson Reed"),
 ("dirty_junior", "Dirty Junior", "M", "heel", "brawler", "rawr", "upper_midcarder", 3, 29, "San Diego", "Prison-Cred Nepo Baby", "A legend's son who claims he did hard time for one weekend. He is booed out of every building and loves it.", "Ask my dad. Actually, don't.", "The Frog Spoiler", "A frog splash his father taught him, done badly on purpose.", "Dominik Mysterio"),
 ("declan_demonne", "Declan Demonne", "M", "tweener", "all_rounder", "rawr", "upper_midcarder", 3, 45, "Bray", "Prince of Receipts", "An Irishman who paints himself as a demon twice a year and keeps receipts the rest of it.", "Paid in full. Or else.", "The Coup de Grâce Period", "A double foot stomp from the top rope, with a short window to pay.", "Finn Bálor"),
 ("sully_sweats", "Sully Sweats", "M", "face", "all_rounder", "rawr", "upper_midcarder", 4, 42, "Montreal", "The Underdog Everyone Loves", "A bearded, sweaty, emotional Canadian who has almost been world champion more times than anyone alive.", "Ole! Ole! Ole! (pause) Ole!", "The Very Big Kick", "A running kick to the face in the corner, still pending review.", "Sami Zayn"),
 ("the_hexagon", "The Hexagon", "M", "face", "flyer", "rawr", "upper_midcarder", 3, 41, "Mexico City", "Masked Fear-Free Luchador", "A masked high flyer who breaks his opponent's arm and then asks the crowd to count the sides of his mask with him.", "Six sides. Zero fear.", "The Sacrifice Bunt", "An arm-trap package piledriver, followed by a theatrical arm snap.", "Penta"),
 ("el_abuelo_enigma", "El Abuelo Enigma", "M", "face", "flyer", "rawr", "midcarder", 3, 51, "San Diego", "Masked Legend Grandad", "The masked legend who has outlived three eras and his own son's respect. Still flies; lands slower.", "Abuelo, OUT!", "The Six-Seventeen", "A springboard into the ropes and a dropkick through the middle, one number short of famous.", "Rey Mysterio"),
 ("kojo_crown", "Kojo Crown", "M", "heel", "flyer", "rawr", "midcarder", 2, 45, "Accra", "Bitter Former Feel-Gooder", "Once half of the happiest act in wrestling, now furious that nobody remembers their anniversary.", "Positivity is cancelled.", "The Trouble at the Nest", "A double-team boot and a seated senton.", "Kofi Kingston"),
 ("xerxes_woodwind", "Xerxes Woodwind", "M", "heel", "entertainer", "rawr", "midcarder", 2, 39, "Columbus", "Trombone Malcontent", "Kojo Crown's partner, who plays a sad trombone at every opponent's misfortune.", "Wah wah waaah.", "The Limit Break", "A top-rope elbow that ends in a slide whistle.", "Xavier Woods"),
 ("jp_punchbagan", "J.P. Punchbagan", "M", "heel", "technician", "rawr", "lower_midcarder", 2, 35, "Dublin", "Professional Punching Bag", "A pale Irishman who absorbs more punishment than any human in the company and keeps volunteering.", "I'll take another one, thanks.", "The Punchbag Moonsault", "A moonsault from the top rope that rarely hits anybody but himself.", "JD McDonagh"),
 ("blaze_clickbait", "Blaze Clickbait", "M", "heel", "entertainer", "rawr", "upper_midcarder", 3, 31, "Westlake", "Influencer Supervillain", "A social media celebrity who wrestles like a natural and sells an energy drink between every move.", "Smash that bell button.", "The Brass Endorsement", "A right hand with something shiny in it, then a sponsored pin.", "Logan Paul"),
 ("boris_bulgarovich", "Boris Bulgarovich", "M", "heel", "powerhouse", "rawr", "midcarder", 3, 38, "Plovdiv", "The Bulgarian Brute, Again", "A Bulgarian strongman who left, came back, and now crushes everybody without a holiday to celebrate it.", "CRUSH. Then tax.", "The Award Ceremony", "A camel clutch so deep the opponent sees the back of their own knees.", "Rusev"),
 # RAWR women
 ("mama_morbid", "Mama Morbid", "F", "face", "powerhouse", "rawr", "main_eventer", 5, 30, "Adelaide", "Mother of the Mosh Pit", "A gothic Australian powerhouse who calls herself everyone's mother and bites if you disagree.", "Mother knows best. Mother hits hardest.", "The Mother's Day", "A pumphandle lift into a sit-out powerbomb, with a card.", "Rhea Ripley"),
 ("kumo_cloud", "Kumo Cloud", "F", "face", "flyer", "rawr", "upper_midcarder", 4, 31, "Tokyo", "Genius of the Heavens", "A tiny Japanese daredevil who moonsaults from places nobody has insured.", "The sky has no ceiling. My insurance does.", "The Over-the-Moonsault", "A moonsault from the top rope with impossible hang time.", "IYO SKY"),
 ("vendetta_viv", "Vendetta Viv", "F", "heel", "entertainer", "rawr", "main_eventer", 4, 32, "Elmwood Park", "Revenge Tour Manager", "She keeps a list of everyone who ever wronged her and works through it alphabetically.", "Watch me. No really, watch.", "The Revenge Receipt", "A swinging reverse DDT, with late fees.", "Liv Morgan"),
 ("big_rosa_ruiz", "Big Rosa Ruiz", "F", "heel", "powerhouse", "rawr", "midcarder", 3, 34, "La Feria", "Enforcer for Hire", "Vendetta Viv's very large best friend and accountant of violence.", "Business is business.", "The Texas Two-Story", "A powerbomb from a great height.", "Raquel Rodriguez"),
 ("molly_omalley", "Molly O'Malley, The Man-ager", "F", "heel", "brawler", "rawr", "main_eventer", 5, 39, "Dublin", "The Man(ager)", "A fiery Irish legend who returned to remind everyone she runs this place, lunch break included.", "The Man-ager will see you now.", "The Arm Day", "A seated armbar so tight it hands back a receipt.", "Becky Lynch"),
 ("freya_fairwing", "Freya Fairwing", "F", "face", "technician", "rawr", "upper_midcarder", 3, 28, "Dublin", "Valkyrie on Work Experience", "A young Irish technician with wings on her robe and a lot to prove.", "Watch the wings.", "The Wing Clip", "A top-rope elbow drop with a flutter.", "Lyra Valkyria"),
 ("hug_life_hannah", "Hug Life Hannah", "F", "face", "technician", "rawr", "upper_midcarder", 3, 36, "San Jose", "Role Model (Self-Appointed)", "A former hugger turned bitter turned hugger again, depending on the week.", "Hug it out or get out.", "The Hug Drop", "A face-first driver into the mat, delivered with a hug.", "Bayley"),
 # SLAPDOWN men
 ("colt_highway", "Colt Highway", "M", "face", "all_rounder", "slap", "main_eventer", 5, 41, "Marietta", "The American Daydream", "The son of a dreaming legend who finished his story and then kept going, because the merchandise kept selling.", "Let's finish the next chapter.", "The Highway Exit", "He spins his opponent into a falling cutter, then points at the eagle on his shirt.", "Cody Rhodes"),
 ("angus_robbedmore", "Angus Robbedmore", "M", "heel", "brawler", "slap", "main_eventer", 4, 41, "Ayr", "Furious Scottish Warrior", "A kilted Scot who has been robbed of everything he ever held and talks about it constantly.", "I was ROBBED. Again.", "The Highland Bill", "A running jumping kick to the face, the size of a parking ticket.", "Drew McIntyre"),
 ("vinny_venomson", "Vinny Venomson", "M", "face", "technician", "slap", "main_eventer", 5, 46, "St. Louis", "Viper with Back Problems", "A third-generation legend who strikes from out of nowhere, if his back allows it.", "Strike first. Stretch later.", "The Out-of-Nowhere", "A jumping cutter from out of nowhere. Nowhere is the corner.", "Randy Orton"),
 ("silent_sione", "Silent Sione", "M", "heel", "brawler", "slap", "upper_midcarder", 3, 33, "Sacramento", "The Silent Usurper", "A family enforcer who tried to take over the family and now leads a smaller one.", "...", "The Drop-off", "A spike to the throat into a cobra hold, then a drop-off at the curb.", "Solo Sikoa"),
 ("big_iosefa", "Big Unhinged Iosefa", "M", "heel", "powerhouse", "slap", "upper_midcarder", 4, 34, "Sacramento", "Moonsaulting Monster", "A huge man who moonsaults as if gravity owes him money.", "Gravity owes me.", "The Moon-Sold-Out", "A moonsault from the top by a man who should not be able to do one.", "Jacob Fatu"),
 ("mack_midlife", "Megastar Mack Midlife", "M", "face", "brawler", "slap", "upper_midcarder", 3, 43, "Hagerstown", "Megastar Late Bloomer", "A gravel-voiced veteran who became famous at forty and talks like a movie trailer.", "Lemme tell ya something. Slowly.", "The Midlife Crisis", "A running neckbreaker, delivered with a sunglasses toss.", "LA Knight"),
 ("father_punishment", "Father Punishment", "M", "tweener", "powerhouse", "slap", "upper_midcarder", 3, 43, "Ponce", "Punisher of the Back Room", "A tall, spooky Puerto Rican who used to judge people and now just punishes them.", "Confess. Then lie down.", "The Downward Sermon", "A chokeslam that ends in a short homily.", "Damian Priest"),
 ("pierre_poutine", "Prizefighter Pierre Poutine", "M", "heel", "brawler", "slap", "upper_midcarder", 4, 42, "Marieville", "Furious Canadian Prizefighter", "A pudgy, ferocious Quebecer who swears at children and powerbombs men onto ring aprons.", "Fight me. Then buy me fries.", "The Apron Special", "A powerbomb onto the hardest part of the ring apron.", "Kevin Owens"),
 ("himself_hollis", "Himself Hollis", "M", "heel", "flyer", "slap", "midcarder", 3, 31, "Worcester", "Self-Proclaimed Main Character", "A slick high flyer who insists he is the main character, whoever that is.", "Main character energy. Side character results.", "Hang Time Hollis", "A falling leg drop off the top rope with a long pause.", "Carmelo Hayes"),
 ("block_party_ace", "Ace of the Block Party Boys", "M", "face", "flyer", "slap", "midcarder", 3, 38, "Tampa", "Party Tag Team", "Half of a tag team that turns every entrance into a block party.", "We brought the speakers.", "The Block Party Splash", "A frog splash with a party horn.", "Street Profits (Montez Ford)"),
 ("block_party_deuce", "Deuce of the Block Party Boys", "M", "face", "powerhouse", "slap", "midcarder", 3, 36, "Cincinnati", "Party Tag Team", "The other half, who carries the speakers.", "Turn it UP.", "The Speaker Drop", "A spinning spinebuster.", "Street Profits (Angelo Dawkins)"),
 # SLAPDOWN women
 ("tiara_orbit", "Tiara Orbit", "F", "heel", "flyer", "slap", "main_eventer", 4, 27, "Prior Lake", "Center of the Universe", "A blonde former gymnast who believes the universe revolves around her, and the camera crew agrees.", "Orbit me, peasants.", "The Orbit", "A moonsault with a full pause to pose.", "Tiffany Stratton"),
 ("carlotta_woo", "Carlotta Woo", "F", "heel", "all_rounder", "slap", "main_eventer", 5, 40, "Charlotte", "Queen of Everything", "A second-generation legend who has held every title, twice, and is offended you forgot.", "Bow down. Twice.", "The Royal Decree", "A forward somersault into a cutter, then a ten-minute strut.", "Charlotte Flair"),
 ("leilani_landslide", "Leilani Landslide", "F", "heel", "powerhouse", "slap", "upper_midcarder", 4, 41, "Sacramento", "Irresistible Force (Do Not Resist)", "A massive Samoan who sits on people and calls it a submission.", "Not like most people. Like most buildings.", "The Landslide", "A leg drop off the top rope, followed by the building's structural engineer.", "Nia Jax"),
 ("onyx_olympia", "Onyx Olympia", "F", "face", "powerhouse", "slap", "main_eventer", 4, 34, "Vero Beach", "Living Statue", "A sculpted powerhouse who looks like a superhero and does not need to tell you so.", "That's... that.", "The Onyx Cutter", "A rolling cutter so fast the replay needs a replay.", "Jade Cargill"),
 ("brielle_braidwhip", "Brielle Braidwhip", "F", "face", "powerhouse", "slap", "main_eventer", 4, 37, "Knoxville", "Strongest Braid Alive", "A sprinter with a braid that is legally a weapon.", "Mind the braid.", "The Braid Breaker", "A fireman's carry into a facebuster.", "Bianca Belair"),
 ("neon_nyla", "Neon Nyla", "F", "heel", "flyer", "slap", "upper_midcarder", 3, 39, "Sanford", "Glow-in-the-Dark Veteran", "A dancing veteran with glowing gear who turned nasty after twenty years of being nice.", "Lights off. Glow on.", "The Glow Bump", "A running hip attack that leaves a mark you can see in the dark.", "Naomi"),
 ("la_bella_furia", "La Bella Furia", "F", "heel", "brawler", "slap", "upper_midcarder", 4, 32, "Milan", "Beautiful Madness Import", "An Italian-Japanese bruiser who came from the best women's company in the world and wants everyone to know it.", "Arrivederci.", "The Northern Lights Bomb", "A northern lights suplex turned into a powerbomb.", "Giulia"),
 ("karen_kompleint", "Karen Kompleint", "F", "heel", "entertainer", "slap", "midcarder", 2, 35, "Victoria", "Speaks to the Manager", "A Canadian who demands to speak to the manager of every match she loses.", "I want to speak to the MANAGER.", "The Complaint Form", "A double-arm DDT that leaves a form to fill in.", "Chelsea Green"),
 # NOT YET (developmental)
 ("king_kayode", "King Kayode", "M", "heel", "powerhouse", "notyet", "main_eventer", 4, 28, "Lagos", "Ruler of NOT YET", "A towering Nigerian who lifts men like luggage and wonders why the main roster has not called.", "The king does not ask.", "The Royal Drop", "A pop-up powerbomb from shoulder height.", "Oba Femi"),
 ("whoop_wallace", "Whoop Wallace", "M", "face", "all_rounder", "notyet", "main_eventer", 3, 32, "Columbia", "The Song the Crowd Sings", "A charismatic leaper the crowd sings about, whether he wants them to or not.", "WHOOP! WHOOP!", "The Whistle Kick", "A running kick to the face, delivered with a whistle.", "Trick Williams"),
 ("young_og_jaylen", "Young OG Jaylen", "M", "face", "flyer", "notyet", "midcarder", 3, 21, "Durham", "The Young Old Head", "The youngest man in the building, who flips like he has no bones and a lot of years left.", "Young. Old head. Next.", "The Backflip Cutter", "A springboard cutter with a backflip on the way down.", "Je'Von Evans"),
 ("eli_everest", "Egomaniac Eli Everest", "M", "heel", "technician", "notyet", "upper_midcarder", 3, 37, "Hamilton", "Self-Published Legend", "A veteran who writes his own reviews and they are glowing.", "Read my book. I wrote it.", "The Ego Driver", "A spinning driver into the mat, with an autograph.", "Ethan Page"),
 ("juggernaut_josie", "Juggernaut Josie", "F", "face", "powerhouse", "notyet", "main_eventer", 4, 30, "Austin", "Lifts Everything", "A powerhouse who lifts men in her spare time and women in her main time.", "Pump. Lift. Repeat.", "The Freight Train", "A fireman's carry into a driver.", "Jordynne Grace"),
 ("la_primera_paloma", "La Primera Paloma", "F", "face", "technician", "notyet", "main_eventer", 4, 33, "Santiago", "Champion of Three Continents", "A Chilean technician who has held titles on three continents and plans a fourth.", "First. Always.", "The Chilean Smooch", "A face-down submission with a lifted leg.", "Stephanie Vaquer"),
 ("pixie_paz", "Prodigy Pixie Paz", "F", "heel", "flyer", "notyet", "upper_midcarder", 3, 24, "Laredo", "The Prodigy Who Peaked", "A gifted young star who was told she was the future and now acts like it is overdue.", "The future is now. And annoyed.", "The Fizzy Driver", "A spinning cradle into a driver.", "Roxanne Perez"),
]
# legends and non-wrestlers who live in WWC
PEOPLE = [
 ("the_cerebral_shovel", "The Cerebral Shovel", "M", "heel", "brawler", "main_eventer", 4, 57, "Nashua", "Chief Content Officer", "A former champion who runs creative and swears the old days are over while booking the old days.", "Board meeting's in session.", "The Family Tree", "A double underhook facebuster, bloodline not included.", "Triple H", ["booker", "wrestler"], True),
 ("chad_champ", "Chad Champ, the Invisible Franchise", "M", "face", "powerhouse", "main_eventer", 5, 49, "West Newbury", "Retired Face of the Company", "The face of the company for twenty years, retired after a farewell tour, and very easy to miss in a crowd.", "Did anybody see that? No? Good.", "The Mood Changer", "A fireman's carry into a body slam, with a salute nobody saw.", "John Cena", ["wrestler"], True),
 ("al_gavel", "Al Gavel", "M", "face", "technician", "non_wrestler", 1, 47, "Chicago", "Exhausted General Manager", "The RAWR general manager, who shouts for security into a microphone forty times a night.", "Security! SECURITY!", "-", "-", "Adam Pearce (Raw GM)", ["booker"], False),
 ("nigel_strictly", "Nigel Strictly", "M", "face", "technician", "non_wrestler", 1, 39, "King's Lynn", "Stern General Manager", "The SlapDown general manager, a British former champion who is disappointed in all of you.", "This is not a debate.", "-", "-", "Nick Aldis (SmackDown GM)", ["booker"], False),
 ("marty_ohmy", "Marty Ohmy", "M", "face", "entertainer", "non_wrestler", 1, 58, "Kansas City", "Voice of the Company", "Has called every big moment for thirty years and says 'oh my' about all of them.", "Oh my... oh my.", "-", "-", "Michael Cole", ["announcer"], False),
 ("punter_pete", "Punter Pete", "M", "face", "entertainer", "non_wrestler", 1, 39, "Plum", "Shouting Sports Guy", "A former kicker who yells on commentary and occasionally kicks somebody.", "BANGER!", "-", "-", "Pat McAfee", ["announcer"], False),
]


# the plain wrestling name of each finisher, for modders: what the move really is
MOVE = {"rocco_rule": "Spear", "wilt_wellness": "Powerbomb", "hype_hopkins": "Frog splash", "straightedge_stan": "Fireman's carry knee strike",
 "velvet_visionary": "Curb stomp", "brick_breakwater": "Military press slam", "big_tad_tsunami": "Top-rope senton", "dirty_junior": "Frog splash",
 "declan_demonne": "Top-rope double foot stomp", "sully_sweats": "Running corner kick", "the_hexagon": "Package piledriver", "el_abuelo_enigma": "Springboard dropkick through the ropes",
 "kojo_crown": "Double-team boot and senton", "xerxes_woodwind": "Top-rope elbow drop", "jp_punchbagan": "Moonsault", "blaze_clickbait": "Loaded punch",
 "boris_bulgarovich": "Camel clutch", "mama_morbid": "Pumphandle sit-out powerbomb", "kumo_cloud": "Moonsault", "vendetta_viv": "Swinging reverse DDT",
 "big_rosa_ruiz": "Powerbomb", "molly_omalley": "Seated armbar", "freya_fairwing": "Top-rope elbow drop", "hug_life_hannah": "Face-first driver",
 "colt_highway": "Spinning cutter", "angus_robbedmore": "Running jumping kick", "vinny_venomson": "Jumping cutter", "silent_sione": "Throat spike into a cobra hold",
 "big_iosefa": "Moonsault", "mack_midlife": "Running neckbreaker", "father_punishment": "Chokeslam", "pierre_poutine": "Apron powerbomb",
 "himself_hollis": "Top-rope leg drop", "block_party_ace": "Frog splash", "block_party_deuce": "Spinning spinebuster", "tiara_orbit": "Moonsault",
 "carlotta_woo": "Somersault cutter", "leilani_landslide": "Top-rope leg drop", "onyx_olympia": "Rolling cutter", "brielle_braidwhip": "Fireman's carry facebuster",
 "neon_nyla": "Running hip attack", "la_bella_furia": "Northern lights powerbomb", "karen_kompleint": "Double-arm DDT", "king_kayode": "Pop-up powerbomb",
 "whoop_wallace": "Running kick", "young_og_jaylen": "Springboard cutter", "eli_everest": "Spinning driver", "juggernaut_josie": "Fireman's carry driver",
 "la_primera_paloma": "Face-down leg-lift submission", "pixie_paz": "Spinning cradle driver", "the_cerebral_shovel": "Double underhook facebuster", "chad_champ": "Fireman's carry slam"}

SIG = {"rocco_rule": "Shrug Punch|Superman punch; Buffet Line|Running drive-by", "wilt_wellness": "The Lecture|Knife-edge chop; Posture Check|Sleeper hold",
 "hype_hopkins": "Hype Kick|Superkick; Bounce House|Running hip attack", "straightedge_stan": "Bedtime Story|Running knee; Soda Pop|Anaconda vise",
 "velvet_visionary": "Runway Walk|Buckle bomb; Couture Kick|Superkick", "brick_breakwater": "Dog Pile|Spear; Fetch|Gorilla press slam",
 "big_tad_tsunami": "High Tide|Running splash; Undertow|Death valley driver", "dirty_junior": "Triple Trouble|Triple vertical suplex; Dad's Move|Springboard dropkick",
 "declan_demonne": "Blade Shuffle|Running clothesline; Receipt|Shotgun dropkick", "sully_sweats": "Sweat Drop|Exploder suplex; Blue Thunder|Blue thunder bomb",
 "the_hexagon": "Six Sides|Package piledriver; Snap|Arm snap", "el_abuelo_enigma": "Abuelo Sault|Springboard hurricanrana; Abuelo Kick|Springboard seated senton",
 "kojo_crown": "Crown Jewel|Fireman's carry neckbreaker; Bitter Kick|Corner kick", "xerxes_woodwind": "Trombone Solo|Diving knee drop; Honk|Shining wizard",
 "jp_punchbagan": "Spin Cycle|Spanish fly; Bruise|Running knee", "blaze_clickbait": "Viral Lariat|Springboard lariat; Like and Subscribe|Frog splash",
 "boris_bulgarovich": "Machka Kick|Superkick; Bear Hug Tax|Bear hug", "mama_morbid": "Prism Trap|Inverted cloverleaf; Nursery Rhyme|Headbutt",
 "kumo_cloud": "Cloud Burst|Missile dropkick; Weather Warning|Tope con hilo", "vendetta_viv": "Grudge Breaker|Double knee facebuster; Grudge|Thesz press",
 "big_rosa_ruiz": "Rosa Bomb|Chokebomb; Big Hug|Fallaway slam", "molly_omalley": "Manhandle Slam|Manhandle slam; Dublin Drop|Exploder suplex",
 "freya_fairwing": "Feather Kick|Spinning heel kick; Shieldmaiden|Fisherman's suplex", "hug_life_hannah": "Group Hug|Bridging belly-to-back; Hug Bomb|Top-rope elbow",
 "colt_highway": "Dreamer's Elbow|Bionic elbow; Daydream Kick|Springboard cutter", "angus_robbedmore": "Kilt Kick|Double underhook DDT; Robbery|Glasgow kiss",
 "vinny_venomson": "Draping DDT|Draping DDT; Coiled Punt|Punt kick", "silent_sione": "Shush|Superkick; Quiet Drop|Uranage",
 "big_iosefa": "Tongan Thunder|Pop-up Samoan drop; Unhinged Headbutt|Headbutt", "mack_midlife": "Midlife Elbow|Jumping elbow drop; Crisis Kick|Running knee",
 "father_punishment": "Reckoning|Crucifix powerbomb; Sermon Kick|Spinning kick", "pierre_poutine": "Gravy Bomb|Pop-up powerbomb; Fries With That|Frog splash",
 "himself_hollis": "Main Character Kick|Spinning kick; Plot Twist|Double knee facebuster", "block_party_ace": "Dance Break|Spinning kick; Speaker Stack|Frog splash",
 "block_party_deuce": "Bass Drop|Spinebuster; Volume Up|Sit-out powerbomb", "tiara_orbit": "Gravity Kick|Spinning heel kick; Crash Landing|Swanton",
 "carlotta_woo": "Big Boot of Royalty|Big boot; Figure-Eight Ego|Figure-eight leg lock", "leilani_landslide": "Earthquake Hip|Running hip attack; Tremor|Samoan drop",
 "onyx_olympia": "Statue Slam|Pump-handle slam; Plinth Kick|Spinning kick", "brielle_braidwhip": "Braid Whip|Hair whip; Sprint Slam|Spinning sit-out powerbomb",
 "neon_nyla": "Split Kick|Split-legged moonsault; Blacklight|Enzuigiri", "la_bella_furia": "Furious Kick|Running kick; Milano Lock|Leg lock",
 "karen_kompleint": "Manager Call|Running hurricanrana; Coupon Clip|Dropkick", "king_kayode": "Crown Toss|Fallaway slam; Royal Decree Drop|Powerbomb",
 "whoop_wallace": "Whistle Dunk|Flying elbow; Chorus Kick|Big boot", "young_og_jaylen": "OG Flip|Standing shooting star press; Old Head Kick|Spinning heel kick",
 "eli_everest": "Book Signing|Superkick; Ego Trip|Spinebuster", "juggernaut_josie": "Squat Rack|Muscle buster; Deadlift|Deadlift German suplex",
 "la_primera_paloma": "Andes Kick|Running knee; Chilean Spin|Spinning backbreaker", "pixie_paz": "Fizz Kick|Spinning heel kick; Prodigy Bridge|Bridging German suplex",
 "the_cerebral_shovel": "Sledgehammer Shrug|Spinebuster; Board Meeting|Knee drop", "chad_champ": "The Five-Step Routine|Fist drop; Invisible Lock|STF"}

def build():
    roster = []
    for row in R:
        (i, n, g, d, st, br, push, tier, age, town, cat, gim, say, fin, fdesc, target) = row
        roster.append(worker(i, n, g, d, st, tier, age, town, cat, gim, say, fin, fdesc, push=push, brand=br, promo="wwc"))
    for row in PEOPLE:
        (i, n, g, d, st, push, tier, age, town, cat, gim, say, fin, fdesc, target, roles, legend) = row
        roster.append(worker(i, n, g, d, st, tier, age, town, cat, gim, say, fin if fin != "-" else None, fdesc if fdesc != "-" else None, push=push, brand=None, promo="wwc", roles=roles, legend=legend))
    holders = {"wwc_undisputed": ["colt_highway"], "wwc_heavyish": ["wilt_wellness"], "wwc_ic": ["dirty_junior"], "wwc_us": ["silent_sione"],
               "wwc_womens_world": ["kumo_cloud"], "wwc_womens": ["tiara_orbit"], "wwc_tag_rawr": ["kojo_crown", "xerxes_woodwind"],
               "wwc_tag_slap": ["block_party_ace", "block_party_deuce"], "wwc_notyet": ["king_kayode"], "wwc_notyet_w": ["la_primera_paloma"]}
    titles = [dict(t, holder_ids=holders.get(t["id"], [])) for t in TITLES]
    teams = [
        {"id": "wwc_sour_daze", "name": "The Sour Daze", "kind": "tag", "member_ids": ["kojo_crown", "xerxes_woodwind"], "experience": 95, "chemistry": 9},
        {"id": "wwc_block_party_boys", "name": "The Block Party Boys", "kind": "tag", "member_ids": ["block_party_ace", "block_party_deuce"], "experience": 85, "chemistry": 8},
        {"id": "wwc_the_vision_board", "name": "The Vision Board", "kind": "stable", "member_ids": ["velvet_visionary", "brick_breakwater", "big_tad_tsunami"], "leader_id": "velvet_visionary"},
        {"id": "wwc_judgment_daze", "name": "The Judgment Daze", "kind": "stable", "member_ids": ["declan_demonne", "dirty_junior", "jp_punchbagan", "big_rosa_ruiz", "vendetta_viv"], "leader_id": "declan_demonne"},
        {"id": "wwc_the_family_tree", "name": "The Family Tree", "kind": "stable", "member_ids": ["silent_sione", "big_iosefa"], "leader_id": "silent_sione"},
    ]
    add_moves(roster, MOVE, SIG)
    return {"promotion": PROMO, "shows": SHOWS, "titles": titles, "roster": roster, "teams": teams}

if __name__ == "__main__":
    write_company("wwc", build())
    # the design team's reference: who each one parodies. Never shipped.
    with open(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "parody", "targets-wwc.md"), "w") as f:
        f.write("# WWC: who each one parodies (design reference, never shipped)\n\n")
        for row in R: f.write("- %s: %s\n" % (row[1], row[15]))
        for row in PEOPLE: f.write("- %s: %s\n" % (row[1], row[14]))
