"""Relationships between the people of the parody world: universes/parody/relationships.json.
Run: python3 tools/parody/relationships.py
type: rivalry, friendship, mentor (a is the mentor), family, partners, dislike. strength: -100 (hatred) to 100 (devotion).
ring_chemistry: 0 to 10, how well they work together in the ring. note: why, in one line, for modders and for the game."""
import json, os
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "universes", "parody", "relationships.json")
# a, b, type, strength, ring chemistry, note
R = [
 # families
 ("rocco_rule", "hype_hopkins", "family", 55, 8, "Cousins from the same wrestling dynasty. They fell out, made up, and fell out again over who is the real head of the family."),
 ("rocco_rule", "silent_sione", "family", -40, 6, "Cousins. Sione tried to take the family over while Rocco was away and Rocco has not forgiven him."),
 ("silent_sione", "big_iosefa", "family", 70, 8, "Cousins who run the new family together."),
 ("el_abuelo_enigma", "dirty_junior", "family", -30, 7, "Father and son. The son turned on the father on live television and has been sorry ever since, mostly not."),
 ("brother_ladder", "brother_ladder_b", "family", 90, 10, "Brothers who have climbed every ladder in the business together."),
 ("colt_highway", "gold_dust_darren", "family", 65, 9, "Brothers, sons of the same dreaming legend. One went to the giant, one stayed with the upstart."),
 ("mitch_fawn", "nicky_fawn", "family", 95, 10, "Brothers and partners for twenty years."),
 ("the_robe_collector", "carlotta_woo", "family", 70, 6, "Father and daughter. She has won more than he did and he still takes the credit."),
 ("brick_breakwater", "big_tad_tsunami", "partners", 40, 7, "Muscle for the Vision Board."),
 # the giant (WWC)
 ("straightedge_stan", "velvet_visionary", "rivalry", -80, 8, "They hate each other for real. Stan thinks the Visionary sold out; the Visionary thinks Stan never stopped whining."),
 ("straightedge_stan", "chairman_mcstrut", "dislike", -95, 3, "Stan walked out on McStrut years ago and has said so in every promo since."),
 ("colt_highway", "rocco_rule", "rivalry", -60, 9, "Colt finished his story by beating Rocco at WrestleMoney. Rocco wants the ending rewritten."),
 ("wilt_wellness", "sully_sweats", "rivalry", -55, 8, "The general and the underdog: the best match of last year, and the bruises still show."),
 ("mama_morbid", "kumo_cloud", "rivalry", -45, 9, "Former friends, now competing for the same title."),
 ("vendetta_viv", "dirty_junior", "partners", 70, 7, "An on-screen couple that the crowd hates and the merchandise sells."),
 ("vendetta_viv", "mama_morbid", "rivalry", -75, 8, "Viv stole Mama's title, Mama's boyfriend and Mama's entrance pose."),
 ("molly_omalley", "carlotta_woo", "rivalry", -70, 9, "Two of the greatest of their generation who have fought each other in every building on earth."),
 ("tiara_orbit", "brielle_braidwhip", "rivalry", -45, 7, "The new star and the old one. Neither will move over."),
 ("the_cerebral_shovel", "king_kayode", "mentor", 50, 5, "The boss built NOT YET and treats King Kayode as his project."),
 ("the_cerebral_shovel", "chairman_mcstrut", "dislike", -65, 4, "The son-in-law who took over the company and the man pushed out of it."),
 ("chad_champ", "rocco_rule", "rivalry", -40, 8, "The old face of the company and the one who replaced him."),
 ("declan_demonne", "jp_punchbagan", "friendship", 60, 7, "Irishmen in the same gang. Declan lets JP take the hits."),
 ("angus_robbedmore", "straightedge_stan", "rivalry", -85, 8, "A real grudge. Angus says Stan cost him a title; Stan says Angus cost him a haircut."),
 ("vinny_venomson", "the_cerebral_shovel", "friendship", 45, 7, "Old comrades from a famous faction."),
 # the upstart (EWE)
 ("rodeo_regret", "zed_zenith", "friendship", 40, 10, "Best friends, then enemies, then friends again. They have wrestled each other in the best match of three different years."),
 ("rodeo_regret", "mitch_fawn", "friendship", 25, 9, "Once in the same group, now cautious."),
 ("rodeo_regret", "detour_dante", "rivalry", -85, 9, "Real heat. Dante came to Rodeo's home and Rodeo has never let it go."),
 ("rodeo_regret", "long_island_lux", "rivalry", -70, 8, "Lux has been needling the cowboy for five years."),
 ("barbwire_burke", "rodeo_regret", "rivalry", -60, 8, "Burke wants the title back and the cowboy out of the business."),
 ("zed_zenith", "reiji_ameda", "rivalry", -50, 10, "Their matches in Japan made both of their names. They have never agreed who won the series."),
 ("billy_kestrel", "long_island_lux", "rivalry", -65, 9, "Lux insults Billy's town; Billy keeps kicking Lux's head."),
 ("billy_kestrel", "kid_comet", "friendship", 45, 10, "Training partners who keep stealing the show from each other."),
 ("spike_sharpe", "crispin_crate", "rivalry", -60, 9, "Best friends and tag partners for decades, until Crispin betrayed him."),
 ("captain_thesaurus", "leather_jacket_jr", "mentor", 25, 6, "The old man taught the kid to cheat, and the kid learned too well."),
 ("kale_kenway", "leather_jacket_jr", "mentor", 60, 8, "The underdog trained the kid in the old ways."),
 ("barbwire_burke", "klaus_cuckoo", "partners", 60, 8, "Leaders of the Hard Ride."),
 ("burt_bluecollar", "mitch_fawn", "rivalry", -75, 10, "The Mustache Union and the Old Fawns have been fighting about how tag wrestling should be done for six years."),
 ("hollywood_hazel", "poppy_pinup", "rivalry", -70, 9, "Hazel made Poppy a star, and Poppy stole the spotlight and the bathrobe."),
 ("coco_capital", "hollywood_hazel", "rivalry", -50, 8, "Two divas, one spotlight."),
 ("kay_starchart", "wilma_warbler", "friendship", 75, 9, "Best friends and tag partners who now want the same belt."),
 ("uncle_puppetstrings", "shinji_skyscraper", "mentor", 50, 5, "Puppetstrings manages Shinji and takes half."),
 ("uncle_puppetstrings", "zed_zenith", "dislike", -70, 5, "Puppetstrings betrayed Zed and turned his family against him."),
 ("tommy_spreadsheet", "long_island_lux", "dislike", -30, 3, "The owner and his loudest star argue on social media every week."),
 ("ed_borough", "barbwire_burke", "rivalry", -65, 8, "Old friends from the indies who now cannot stand each other."),
 ("el_forajido", "minerva_forever", "friendship", 30, 5, "The brand's two champions, who carry it between them."),
 # TBA
 ("santo_santiago", "moose_mountain", "rivalry", -60, 8, "The hometown saviour and the man who ran the place before he came home."),
 ("masha_meanslam", "tess_trouble", "rivalry", -55, 8, "The two best women in the company, and neither will say it about the other."),
 ("believe_barnaby", "niles_nevermind", "rivalry", -40, 7, "The crowd's favourite and the man who thinks the crowd is beneath him."),
 ("director_santo", "gail_goldstandard", "friendship", 70, 5, "The two who run the place, mostly agreeing."),
 # OTPW
 ("simon_submission", "sunny_ace", "rivalry", -30, 9, "The ace retired before Simon could finish beating him."),
 ("simon_submission", "hiro_goto_again", "rivalry", -40, 8, "Hiro waited fifteen years for the title; Simon took it off him in one."),
 ("wicked_wataru", "sakuma_cold", "partners", 55, 6, "The leaders of the House of Evil."),
 ("haru_wave", "sunny_ace", "mentor", 70, 7, "The retired ace trained the rock-and-roll rookie."),
 ("takeo_shogun", "haruki_hypersonic", "friendship", 60, 9, "Stablemates who keep stealing each other's nights."),
 # women's companies and Mexico
 ("phoenix_fumika", "twinkle_mask", "rivalry", -60, 10, "The phoenix and the star, the two aces of Supernova."),
 ("peach_menace", "phoenix_fumika", "dislike", -50, 8, "Peach left Fumika's group and took half of it with her."),
 ("el_sagrado_celestial", "ultimo_soldado", "rivalry", -70, 9, "The técnico and the rudo general, who have fought in the old arena for twenty years."),
 ("poseidon_viejo", "el_sagrado_celestial", "mentor", 70, 8, "The old idol passed the torch to the new one."),
 ("hijo_del_drakkar", "el_senoron", "rivalry", -55, 8, "The flyer and the big boss who came home to take his title."),
 ("payaso_siniestro", "el_hereje", "rivalry", -60, 8, "The clown and the heretic have bled on each other in every bullring in Mexico."),
 # ARK and DDW
 ("kensei_kicker", "young_ace_kazuma", "rivalry", -55, 9, "The rebel and the chosen one."),
 ("salt_chop_shiro", "genius_maestro", "friendship", 50, 9, "Two veterans who built the company's reputation."),
 ("gutter_gary", "tremor_tommy", "rivalry", -60, 8, "They have bled together more than any two men in the business."),
 ("bobby_balcony", "brad_dumpster", "friendship", 60, 5, "The owner gave Bobby his own show; Bobby gave him a lot of headaches."),
 # legends
 ("brother_bronzer", "mr_lastrites", "rivalry", -50, 6, "Their old feud is a famous bad match that both have spent thirty years blaming on the other."),
 ("tepid_tex_granite", "chairman_mcstrut", "dislike", -90, 9, "The most famous feud the giant ever had: the worker against the boss."),
 ("tepid_tex_granite", "the_electrifying_eyebrow", "rivalry", -50, 10, "They main-evented the giant's biggest shows three times."),
 ("the_robe_collector", "showstopping_preacher", "friendship", 70, 9, "The preacher retired the robe man, and they still cry about it together."),
 ("hardcore_uncle_mittens", "mr_lastrites", "rivalry", -40, 8, "The night Mittens fell off the cell is still the most famous night in the giant's history."),
 ("olympic_ollie", "tepid_tex_granite", "friendship", 40, 8, "Old rivals who now tell the stories together."),
 ("stratosphere_tess", "lady_lightning_rod", "rivalry", 20, 9, "The two who made the women's division matter: rivals then, friends now."),
]
if __name__ == "__main__":
    out = [{"a": a, "b": b, "type": t, "strength": s, "ring_chemistry": c, "note": n} for (a, b, t, s, c, n) in R]
    with open(OUT, "w") as f: json.dump(out, f, indent=1, ensure_ascii=False)
    print("wrote relationships.json: %d" % len(out))
