"""Create a Player looks for the parody world's legends (22 October 2026): the free-agent legends and the
legends signed to CALL, OTPW and TBA, who had no look of their own. Writes them into the world folder.
    python3 tools/parody/legend_looks.py && node tools/build-parody.js"""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'universes', 'parody')

def kit(desc, head, top, bottom, feet, acc, p, s, t='swatch_white_paper', h='swatch_silver_foil', top_col=None):
    k = {"description": desc, "equipped_assets": {"head": head, "upper_body": top, "lower_body": bottom, "footwear": feet, "accessories": acc},
         "palette_slots": {"primary": p, "secondary": s, "trim": t, "hardware": h}, "custom_layers": []}
    if top_col: k["part_colours"] = {"upper_body": top_col}
    return k

def mv(name, pose, cat='Pinfall Impact', pos='Standing', dmg=88, ko='Protected', stage=None):
    m = {"name": name, "impact_damage": dmg, "kickout_difficulty": ko, "position": pos, "category": cat, "preview_pose_id": pose}
    if stage: m["stage"] = stage
    return m

# id: (height, weight, archetype, scalers, appearance, ring, entrance, street, moves, entrance, fx)
L = {
 'brother_bronzer': (79, 302, 'Powerhouse', (1.14, 1.04, 1.04, 1.2), {"face": {"sk": 40}, "hair_colour": "hair_platinum", "facial_hair": "horseshoe", "mood": "happy", "cheeks": "tan"},
   kit('In-ring gear', 'hair_long_01', 'shirt_tank', 'tights_long_01', 'boots_knee', ['bandana', 'wrist_tape_white'], 'swatch_red_paper', 'swatch_yellow_paper', 'swatch_yellow_paper', 'swatch_gold_foil', 'swatch_yellow_paper'),
   kit('Ring walk and entrance', 'hair_long_01', 'shirt_tshirt_base', 'tights_long_01', 'boots_knee', ['bandana', 'chain_gold'], 'swatch_red_paper', 'swatch_yellow_paper', 'swatch_yellow_paper', 'swatch_gold_foil', 'swatch_yellow_paper'),
   kit('Backstage and promos', 'hair_long_01', 'shirt_tshirt_base', 'jeans_distressed', 'boots_short', ['bandana', 'sunglasses_aviator'], 'swatch_black_matte', 'swatch_red_paper', 'swatch_yellow_paper', 'swatch_gold_foil', 'swatch_red_paper'),
   [mv('The Thirty-Year Leg Drop', 'slam'), mv('Ear Cup', 'strike', dmg=40, ko='Easy', stage='early'), mv('Big Boot of Destiny', 'strike', dmg=55, ko='Easy', stage='late')], 'ent_flex', {"pyro": "sparks", "lights": "spot", "music": "Real American Bronze"}),
 'tepid_tex_granite': (74, 252, 'Brawler', (1.08, 1.0, 1.0, 1.1), {"face": {"sk": 14}, "hair_colour": "hair_dirty_blonde", "facial_hair": "goatee", "mood": "fierce"},
   kit('In-ring gear', 'hair_bald', 'bare', 'trunks_brief_01', 'boots_knee', ['knee_pads', 'elbow_pads'], 'swatch_black_matte', 'swatch_black_matte', 'swatch_white_paper'),
   kit('Ring walk and entrance', 'hair_bald', 'vest_open', 'trunks_brief_01', 'boots_knee', ['knee_pads', 'elbow_pads'], 'swatch_black_matte', 'swatch_black_matte', 'swatch_white_paper', top_col='swatch_leather_black'),
   kit('Backstage and promos', 'hair_bald', 'shirt_tshirt_base', 'jeans_distressed', 'boots_laced_heavy', [], 'swatch_black_matte', 'swatch_blue_denim', 'swatch_white_paper', top_col='swatch_black_matte'),
   [mv('Tepid Stunner', 'move_ddt'), mv('Mudhole Stomp', 'strike', dmg=50, ko='Easy', stage='early'), mv('Middle Finger Salute', 'strike', dmg=30, ko='Easy', stage='mid')], 'ent_stare', {"pyro": "flash", "lights": "red", "music": "Glass Breaking Somewhere"}),
 'chairman_mcstrut': (74, 240, 'Heavyweight', (1.06, 1.02, 1.0, 1.0), {"face": {"sk": 16}, "hair_colour": "hair_salt_pepper", "facial_hair": "none", "mood": "cocky", "cheeks": "flush"},
   kit('In-ring gear', 'hair_slick_01', 'suit_jacket', 'trousers_suit', 'shoes_dress', [], 'swatch_navy_paper', 'swatch_navy_paper', 'swatch_white_paper', top_col='swatch_navy_paper'),
   kit('Ring walk and entrance', 'hair_slick_01', 'suit_jacket', 'trousers_suit', 'shoes_dress', [], 'swatch_charcoal_paper', 'swatch_charcoal_paper', 'swatch_white_paper', top_col='swatch_charcoal_paper'),
   kit('Backstage and promos', 'hair_slick_01', 'suit_jacket', 'trousers_suit', 'shoes_dress', [], 'swatch_black_matte', 'swatch_black_matte', 'swatch_white_paper', top_col='swatch_black_matte'),
   [mv('The Strut', 'strike', dmg=40), mv('Severance', 'strike', dmg=35, ko='Easy', stage='early'), mv('Board Vote', 'strike', dmg=45, ko='Easy', stage='late')], 'ent_point', {"lights": "spot", "music": "No Chance in Accounting"}),
 'mr_lastrites': (82, 309, 'Giant', (1.1, 1.08, 1.08, 1.08), {"face": {"sk": 4}, "hair_colour": "hair_jet_black", "facial_hair": "none", "mood": "fierce", "tattoos": ["sleeve_near", "sleeve_far"]},
   kit('In-ring gear', 'hair_long_01', 'shirt_tank', 'tights_long_01', 'boots_laced_heavy', ['gloves_fingerless'], 'swatch_black_matte', 'swatch_charcoal_paper', 'swatch_grey_paper', top_col='swatch_charcoal_paper'),
   kit('Ring walk and entrance', 'hair_long_01', 'coat_long', 'tights_long_01', 'boots_laced_heavy', ['hat_cowboy', 'gloves_fingerless'], 'swatch_black_matte', 'swatch_black_matte', 'swatch_purple_paper', top_col='swatch_leather_black'),
   kit('Backstage and promos', 'hair_long_01', 'coat_long', 'trousers_suit', 'boots_laced_heavy', ['hat_cowboy'], 'swatch_black_matte', 'swatch_black_matte', 'swatch_grey_paper', top_col='swatch_black_matte'),
   [mv('The Last Rites Piledriver', 'move_powerbomb'), mv('Old School Rope Walk', 'move_topdive', pos='Top Rope', dmg=50, ko='Easy', stage='mid'), mv('Last Breath', 'slam', dmg=60, ko='Easy', stage='late')], 'ent_stare', {"pyro": "fire", "lights": "dark", "music": "The Bell Tolls Eleven Times"}),
 'the_electrifying_eyebrow': (77, 260, 'Heavyweight', (1.14, 1.02, 1.02, 1.22), {"face": {"sk": 48}, "hair_colour": "hair_jet_black", "facial_hair": "none", "mood": "cocky", "tattoos": ["shoulder"]},
   kit('In-ring gear', 'hair_bald', 'bare', 'trunks_brief_01', 'boots_knee', ['knee_pads', 'elbow_pads'], 'swatch_black_matte', 'swatch_black_matte', 'swatch_white_paper'),
   kit('Ring walk and entrance', 'hair_bald', 'vest_open', 'trunks_brief_01', 'boots_knee', ['sunglasses_aviator', 'chain_gold'], 'swatch_black_matte', 'swatch_gold_foil', 'swatch_gold_foil', 'swatch_gold_foil', top_col='swatch_leather_black'),
   kit('Backstage and promos', 'hair_bald', 'suit_jacket', 'trousers_suit', 'shoes_dress', ['sunglasses_aviator'], 'swatch_charcoal_paper', 'swatch_charcoal_paper', 'swatch_white_paper', top_col='swatch_charcoal_paper'),
   [mv('The People’s Premiere', 'slam'), mv('Eyebrow Raise', 'strike', dmg=30, ko='Easy', stage='early'), mv('Matinee Slam', 'slam', dmg=60, ko='Easy', stage='late')], 'ent_taunt', {"pyro": "fountains", "lights": "spot", "music": "If You Smell the Popcorn"}),
 'the_robe_collector': (73, 236, 'Technical', (1.0, 1.0, 1.0, 0.94), {"face": {"sk": 22}, "hair_colour": "hair_platinum", "facial_hair": "none", "mood": "cocky", "cheeks": "flush"},
   kit('In-ring gear', 'hair_slick_01', 'bare', 'trunks_brief_01', 'boots_knee', [], 'swatch_maroon_paper', 'swatch_black_matte', 'swatch_gold_foil', 'swatch_gold_foil'),
   kit('Ring walk and entrance', 'hair_slick_01', 'robe_long', 'trunks_brief_01', 'boots_knee', ['feather_boa'], 'swatch_purple_foil', 'swatch_black_matte', 'swatch_gold_foil', 'swatch_gold_foil', top_col='swatch_purple_foil'),
   kit('Backstage and promos', 'hair_slick_01', 'suit_jacket', 'trousers_suit', 'shoes_dress', ['chain_gold', 'sunglasses_aviator'], 'swatch_royal_blue', 'swatch_royal_blue', 'swatch_white_paper', 'swatch_gold_foil', top_col='swatch_royal_blue'),
   [mv('Forty-Thousand-Dollar Figure Four', 'sleeper', cat='Submission'), mv('Strut and Chop', 'strike', dmg=45, ko='Easy', stage='early'), mv('Face-First Flop', 'strike', dmg=20, ko='Easy', stage='mid')], 'ent_point', {"pyro": "sparks", "lights": "strobe", "music": "Also Sprach Robe-athustra"}),
 'showstopping_preacher': (73, 225, 'High Flyer', (0.98, 1.0, 1.02, 0.96), {"face": {"sk": 15}, "hair_colour": "hair_dirty_blonde", "facial_hair": "beard_short", "mood": "happy"},
   kit('In-ring gear', 'hair_long_01', 'bare', 'tights_long_01', 'boots_knee', ['knee_pads'], 'swatch_black_matte', 'swatch_hot_pink', 'swatch_hot_pink', 'swatch_silver_foil'),
   kit('Ring walk and entrance', 'hair_long_01', 'vest_open', 'jeans_distressed', 'boots_short', ['hat_cowboy', 'sunglasses_aviator'], 'swatch_black_matte', 'swatch_hot_pink', 'swatch_hot_pink', 'swatch_silver_foil', top_col='swatch_leather_black'),
   kit('Backstage and promos', 'hair_long_01', 'shirt_tshirt_base', 'jeans_distressed', 'boots_short', ['hat_cowboy'], 'swatch_black_matte', 'swatch_blue_denim', 'swatch_white_paper', top_col='swatch_white_paper'),
   [mv('Sermon on the Chin', 'strike', pos='Running'), mv('Elbow From Heaven', 'move_topdive', pos='Top Rope', dmg=55, ko='Easy', stage='mid'), mv('Kip-Up', 'strike', dmg=20, ko='Easy', stage='late')], 'ent_taunt', {"pyro": "fountains", "lights": "strobe", "music": "Sexy Boy (Saved Version)"}),
 'hardcore_uncle_mittens': (74, 287, 'Brawler', (1.12, 1.04, 1.0, 1.0), {"face": {"sk": 12}, "hair_colour": "hair_chestnut", "facial_hair": "beard_full", "mood": "happy", "scars": ["brow"]},
   kit('In-ring gear', 'hair_wild_01', 'shirt_tshirt_base', 'trousers_suit', 'boots_laced_heavy', [], 'swatch_chocolate_paper', 'swatch_white_paper', 'swatch_red_paper', top_col='swatch_white_paper'),
   kit('Ring walk and entrance', 'hair_wild_01', 'shirt_tshirt_base', 'trousers_suit', 'boots_laced_heavy', ['bat'], 'swatch_chocolate_paper', 'swatch_red_paper', 'swatch_black_matte', top_col='swatch_red_paper'),
   kit('Backstage and promos', 'hair_wild_01', 'shirt_tshirt_base', 'jeans_distressed', 'sneakers_retro', [], 'swatch_red_paper', 'swatch_blue_denim', 'swatch_white_paper', top_col='swatch_red_paper'),
   [mv('Mittens’ Mandible Claw', 'sleeper', cat='Submission'), mv('Over-the-Top Hug', 'move_clothesline', dmg=55, ko='Easy', stage='early'), mv('Elbow Off the Apron', 'move_topdive', dmg=55, ko='Easy', stage='mid')], 'ent_stare', {"lights": "dark", "music": "Have a Nice Day, Partner"}),
 'olympic_ollie': (72, 220, 'Technical', (1.06, 0.98, 0.98, 1.1), {"face": {"sk": 14}, "hair_colour": "hair_dirty_blonde", "facial_hair": "none", "mood": "fierce"},
   kit('In-ring gear', 'hair_bald', 'singlet_full', 'trunks_brief_01', 'boots_knee', ['knee_pads'], 'swatch_red_paper', 'swatch_white_paper', 'swatch_royal_blue', 'swatch_gold_foil', top_col='swatch_red_paper'),
   kit('Ring walk and entrance', 'hair_bald', 'jacket_satin', 'trunks_brief_01', 'boots_knee', ['chain_gold'], 'swatch_royal_blue', 'swatch_white_paper', 'swatch_red_paper', 'swatch_gold_foil', top_col='swatch_royal_blue'),
   kit('Backstage and promos', 'hair_bald', 'shirt_tshirt_base', 'jeans_distressed', 'sneakers_retro', ['chain_gold'], 'swatch_white_paper', 'swatch_blue_denim', 'swatch_red_paper', 'swatch_gold_foil', top_col='swatch_white_paper'),
   [mv('Ankle Lock, Ankle Lock, Ankle Lock', 'sleeper', cat='Submission'), mv('Gold Suplexes', 'move_suplex', dmg=60, ko='Easy', stage='mid'), mv('Medal Slam', 'carry', dmg=70, ko='Easy', stage='late')], 'ent_flex', {"pyro": "fountains", "lights": "blue", "music": "Medal, Medal, Medal"}),
 'streak_stallworth': (76, 285, 'Powerhouse', (1.16, 1.02, 1.0, 1.26), {"face": {"sk": 18}, "hair_colour": "hair_jet_black", "facial_hair": "goatee", "mood": "fierce", "tattoos": ["shoulder"]},
   kit('In-ring gear', 'hair_bald', 'bare', 'trunks_brief_01', 'boots_laced_heavy', ['gloves_fingerless', 'knee_pads'], 'swatch_black_matte', 'swatch_black_matte', 'swatch_black_matte'),
   kit('Ring walk and entrance', 'hair_bald', 'bare', 'trunks_brief_01', 'boots_laced_heavy', ['gloves_fingerless', 'knee_pads'], 'swatch_black_matte', 'swatch_black_matte', 'swatch_black_matte'),
   kit('Backstage and promos', 'hair_bald', 'shirt_tshirt_base', 'jeans_distressed', 'boots_laced_heavy', [], 'swatch_black_matte', 'swatch_black_denim', 'swatch_white_paper', top_col='swatch_black_matte'),
   [mv('Streak Breaker', 'move_powerbomb'), mv('Streak', 'move_spear', pos='Running', dmg=70, ko='Easy', stage='late'), mv('Steam', 'strike', dmg=20, ko='Easy', stage='early')], 'ent_stare', {"pyro": "sparks", "lights": "spot", "music": "Who's Counting"}),
 'five_time_felix': (75, 256, 'Brawler', (1.06, 1.0, 1.04, 1.06), {"face": {"sk": 72}, "hair_colour": "hair_jet_black", "facial_hair": "goatee", "mood": "happy"},
   kit('In-ring gear', 'hair_dreads_01', 'shirt_tank', 'tights_long_01', 'boots_knee', ['wrist_tape_white'], 'swatch_gold_foil', 'swatch_black_matte', 'swatch_black_matte', 'swatch_gold_foil', top_col='swatch_black_matte'),
   kit('Ring walk and entrance', 'hair_dreads_01', 'jacket_satin', 'tights_long_01', 'boots_knee', ['sunglasses_round'], 'swatch_gold_foil', 'swatch_black_matte', 'swatch_black_matte', 'swatch_gold_foil', top_col='swatch_gold_foil'),
   kit('Backstage and promos', 'hair_dreads_01', 'suit_jacket', 'trousers_suit', 'shoes_dress', ['headset'], 'swatch_charcoal_paper', 'swatch_charcoal_paper', 'swatch_gold_foil', 'swatch_gold_foil', top_col='swatch_charcoal_paper'),
   [mv('The Fifth-Time Axe Kick', 'strike'), mv('Floor Spin', 'strike', dmg=20, ko='Easy', stage='mid'), mv('Uptown Kick', 'strike', dmg=55, ko='Easy', stage='early')], 'ent_taunt', {"pyro": "sparks", "lights": "strobe", "music": "Can You Dig It, Sucka (Five Times)"}),
 'stratosphere_tess': (64, 125, 'High Flyer', (0.92, 0.98, 1.0, 1.04), {"face": {"sk": 10}, "hair_colour": "hair_honey_blonde", "facial_hair": "none", "mood": "happy", "eye_colour": "#3f6c94"},
   kit('In-ring gear', 'hair_long_01', 'top_sports', 'shorts_fight', 'boots_knee', ['knee_pads'], 'swatch_hot_pink', 'swatch_black_matte', 'swatch_white_paper', 'swatch_silver_foil', top_col='swatch_hot_pink'),
   kit('Ring walk and entrance', 'hair_long_01', 'jacket_satin', 'shorts_fight', 'boots_knee', [], 'swatch_hot_pink', 'swatch_black_matte', 'swatch_white_paper', 'swatch_silver_foil', top_col='swatch_hot_pink'),
   kit('Backstage and promos', 'hair_long_01', 'top_sports', 'jeans_distressed', 'sneakers_retro', [], 'swatch_white_paper', 'swatch_blue_denim', 'swatch_hot_pink', top_col='swatch_white_paper'),
   [mv('Stratusphere DDT', 'move_ddt', pos='Running'), mv('Bend Back Dodge', 'strike', dmg=20, ko='Easy', stage='early'), mv('Toronto Kick', 'strike', dmg=55, ko='Easy', stage='late')], 'ent_point', {"pyro": "fountains", "lights": "spot", "music": "Time to Rock-a-Bye"}),
 'lady_lightning_rod': (66, 135, 'High Flyer', (0.94, 1.0, 1.02, 1.0), {"face": {"sk": 8}, "hair_colour": "hair_ginger", "facial_hair": "none", "mood": "cocky", "tattoos": ["sleeve_near"]},
   kit('In-ring gear', 'hair_long_01', 'top_crop', 'pants_flared', 'boots_laced_heavy', ['wrist_wraps'], 'swatch_black_matte', 'swatch_red_paper', 'swatch_red_paper', top_col='swatch_black_matte'),
   kit('Ring walk and entrance', 'hair_long_01', 'jacket_leather_biker', 'pants_flared', 'boots_laced_heavy', ['fishnets'], 'swatch_black_matte', 'swatch_red_paper', 'swatch_red_paper', top_col='swatch_leather_black'),
   kit('Backstage and promos', 'hair_long_01', 'shirt_tank', 'jeans_distressed', 'boots_laced_heavy', [], 'swatch_black_matte', 'swatch_black_denim', 'swatch_red_paper', top_col='swatch_black_matte'),
   [mv('Lightning Moonsault', 'move_moonsault', pos='Top Rope'), mv('Huracan', 'move_ddt', dmg=55, ko='Easy', stage='mid'), mv('Twist', 'move_ddt', dmg=50, ko='Easy', stage='early')], 'ent_taunt', {"pyro": "flash", "lights": "red", "music": "Lose Control (Again)"}),
 'poseidon_viejo': (70, 210, 'Technical', (1.0, 1.0, 1.0, 0.95), {"face": {"sk": 30}, "hair_colour": "hair_silver", "facial_hair": "none", "mood": "face", "mask_design": "plain"},
   kit('In-ring gear', 'mask_full_01', 'bare', 'tights_long_01', 'boots_knee', [], 'swatch_silver_foil', 'swatch_blue_foil', 'swatch_royal_blue', 'swatch_silver_foil'),
   kit('Ring walk and entrance', 'mask_full_01', 'cape', 'tights_long_01', 'boots_knee', ['cape'], 'swatch_silver_foil', 'swatch_blue_foil', 'swatch_royal_blue', 'swatch_silver_foil'),
   kit('Backstage and promos', 'mask_full_01', 'suit_jacket', 'trousers_suit', 'shoes_dress', [], 'swatch_navy_paper', 'swatch_navy_paper', 'swatch_silver_foil', top_col='swatch_navy_paper'),
   [mv('Rack of the Deep', 'carry', cat='Submission'), mv('Tide', 'move_tope', pos='Running', dmg=50, ko='Easy', stage='early'), mv('Trident', 'sleeper', cat='Submission', dmg=55, ko='Easy', stage='mid')], 'ent_point', {"pyro": "fountains", "lights": "blue", "music": "Bajo el Mar Viejo"}),
 'sunny_ace': (71, 225, 'Technical', (1.0, 1.0, 1.02, 1.04), {"face": {"sk": 20}, "hair_colour": "hair_chestnut", "facial_hair": "none", "mood": "happy"},
   kit('In-ring gear', 'hair_long_01', 'bare', 'tights_long_01', 'boots_knee', ['knee_pads'], 'swatch_hot_pink', 'swatch_white_paper', 'swatch_gold_foil', 'swatch_gold_foil'),
   kit('Ring walk and entrance', 'hair_long_01', 'vest_open', 'tights_long_01', 'boots_knee', ['guitar'], 'swatch_hot_pink', 'swatch_white_paper', 'swatch_gold_foil', 'swatch_gold_foil', top_col='swatch_white_paper'),
   kit('Backstage and promos', 'hair_long_01', 'suit_jacket', 'trousers_suit', 'shoes_dress', [], 'swatch_white_paper', 'swatch_white_paper', 'swatch_hot_pink', top_col='swatch_white_paper'),
   [mv('High Fly Sunshine', 'move_topdive', pos='Top Rope'), mv('Sunny Spin', 'move_ddt', dmg=55, ko='Easy', stage='mid'), mv('Air Guitar', 'strike', dmg=20, ko='Easy', stage='early')], 'ent_taunt', {"pyro": "sparks", "lights": "spot", "music": "Go Ace (Air Guitar Mix)"}),
 'director_santo': (73, 230, 'Brawler', (1.02, 1.0, 1.0, 1.0), {"face": {"sk": 22}, "hair_colour": "hair_jet_black", "facial_hair": "stubble", "mood": "happy"},
   kit('In-ring gear', 'hair_slick_01', 'bare', 'trunks_brief_01', 'boots_knee', [], 'swatch_green_paper', 'swatch_white_paper', 'swatch_red_paper'),
   kit('Ring walk and entrance', 'hair_slick_01', 'jacket_satin', 'trunks_brief_01', 'boots_knee', [], 'swatch_green_paper', 'swatch_white_paper', 'swatch_red_paper', top_col='swatch_green_paper'),
   kit('Backstage and promos', 'hair_slick_01', 'suit_jacket', 'trousers_suit', 'shoes_dress', [], 'swatch_charcoal_paper', 'swatch_charcoal_paper', 'swatch_white_paper', top_col='swatch_charcoal_paper'),
   [mv('The Cobra Strike', 'strike'), mv('Salute', 'slam', dmg=40, ko='Easy', stage='early'), mv('Paperwork', 'slam', dmg=40, ko='Easy', stage='mid')], 'ent_point', {"lights": "green", "music": "Milan Is Calling"}),
 'gail_goldstandard': (64, 125, 'High Flyer', (0.92, 0.98, 1.0, 1.0), {"face": {"sk": 22}, "hair_colour": "hair_jet_black", "facial_hair": "none", "mood": "cocky"},
   kit('In-ring gear', 'hair_long_01', 'top_crop', 'shorts_fight', 'boots_knee', ['knee_pads'], 'swatch_black_matte', 'swatch_gold_foil', 'swatch_gold_foil', 'swatch_gold_foil', top_col='swatch_black_matte'),
   kit('Ring walk and entrance', 'hair_long_01', 'jacket_satin', 'shorts_fight', 'boots_knee', [], 'swatch_gold_foil', 'swatch_black_matte', 'swatch_gold_foil', 'swatch_gold_foil', top_col='swatch_gold_foil'),
   kit('Backstage and promos', 'hair_long_01', 'suit_jacket', 'trousers_suit', 'shoes_dress', [], 'swatch_black_matte', 'swatch_black_matte', 'swatch_gold_foil', 'swatch_gold_foil', top_col='swatch_black_matte'),
   [mv('Gold Standard Facebuster', 'move_ddt', pos='Running'), mv('Gold Kick', 'strike', dmg=55, ko='Easy', stage='late'), mv('Legend Lock', 'sleeper', cat='Submission', dmg=55, ko='Easy', stage='mid')], 'ent_point', {"pyro": "sparks", "lights": "strobe", "music": "Twenty-Four Karat"}),
}

def look(w, d):
    ht, wt, arch, (tw, th, ll, mm), ap, ring, ent, st, moves, entrance, fx = d
    return {"id": w['id'], "name": w['ring_name'], "hometown": w.get('hometown', ''), "archetype": arch,
            "physical_attributes": {"sex": w['gender'], "height_inches": ht, "weight_lbs": wt, "body_archetype": arch, "proportional_scalers": {"torso_width": tw, "torso_height": th, "limb_length": ll, "muscle_mass": mm}},
            "appearance": ap, "attires": {"primary_ring": ring, "entrance_gear": ent, "street_clothes": st}, "finishing_moves": moves, "entrance": entrance, "entrance_fx": fx}

def put(path, get):
    raw = open(path, encoding='utf-8').read(); data = json.loads(raw); n = 0
    ind = len(raw.split('\n')[1]) - len(raw.split('\n')[1].lstrip(' '))
    for w in get(data):
        if w['id'] in L: w['look'] = look(w, L[w['id']]); n += 1
    open(path, 'w', encoding='utf-8').write(json.dumps(data, indent=ind, ensure_ascii=False) + ('\n' if raw.endswith('\n') else '')); return n

n = put(os.path.join(ROOT, 'free_agents.json'), lambda d: d)
for c in ('call', 'otpw', 'tba'): n += put(os.path.join(ROOT, 'companies', c + '.json'), lambda d: d['roster'])
print(n, 'legends dressed of', len(L))
