"""The parody world's history, 2020 to September 2026: universes/parody/history/<year>.json.
Run: python3 tools/parody/history.py
Every line is plain data a modder can rewrite. The game reads it into the same records it keeps while you play
(title lineages, head to head, careers, old feuds), so history carries straight on from here. Dates are year-month.
reigns: title, holders, from, to (null for the champion today), defs, event
matches: a, b, winner (null for a draw), date, event, stars, note
feuds: a, b, from, to, heat (how much the crowd cared), ended (how), note
moments: who, date, k (debut, turn, injury, return, leave, retire, sign, title, honour), text"""
import json, os
from collections import defaultdict
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "universes", "parody", "history")

def reign(t, h, f, to, defs=0, ev=None): return ("reigns", {"title": t, "holders": h, "from": f, "to": to, "defs": defs, "event": ev})
def match(a, b, w, d, ev, st, note=None): return ("matches", {"a": a, "b": b, "winner": w, "date": d, "event": ev, "stars": st, "note": note})
def feud(a, b, f, to, heat, ended, note): return ("feuds", {"a": [a] if isinstance(a, str) else a, "b": [b] if isinstance(b, str) else b, "from": f, "to": to, "heat": heat, "ended": ended, "note": note})
def moment(who, d, k, text): return ("moments", {"who": who, "date": d, "k": k, "text": text})

H = [
 # ---------------- WWC, the giant ----------------
 reign("wwc_undisputed", ["angus_robbedmore"], "2020-04", "2021-03", 9, "WrestleMoney"),
 reign("wwc_undisputed", ["brutus_biceps"], "2021-03", "2021-09", 5, "Monday Night RAWR"),
 reign("wwc_undisputed", ["rocco_rule"], "2021-09", "2024-04", 31, "Extreme Rules of Etiquette"),
 reign("wwc_undisputed", ["colt_highway"], "2024-04", "2025-04", 14, "WrestleMoney"),
 reign("wwc_undisputed", ["chad_champ"], "2025-04", "2025-08", 4, "WrestleMoney"),
 reign("wwc_undisputed", ["colt_highway"], "2025-08", None, 8, "Summer Splashdown"),
 reign("wwc_heavyish", ["velvet_visionary"], "2023-05", "2024-04", 12, "Night of Big Champions"),
 reign("wwc_heavyish", ["father_punishment"], "2024-04", "2024-08", 4, "WrestleMoney"),
 reign("wwc_heavyish", ["wilt_wellness"], "2024-08", "2025-04", 11, "Summer Splashdown"),
 reign("wwc_heavyish", ["hype_hopkins"], "2025-04", "2025-06", 2, "WrestleMoney"),
 reign("wwc_heavyish", ["wilt_wellness"], "2025-06", None, 9, "Monday Night RAWR"),
 reign("wwc_ic", ["wilt_wellness"], "2022-06", "2024-04", 25, "Friday Night SlapDown"),
 reign("wwc_ic", ["sully_sweats"], "2024-04", "2024-08", 5, "WrestleMoney"),
 reign("wwc_ic", ["brick_breakwater"], "2024-08", "2025-04", 10, "Summer Splashdown"),
 reign("wwc_ic", ["dirty_junior"], "2025-04", None, 12, "WrestleMoney"),
 reign("wwc_us", ["mack_midlife"], "2024-08", "2024-12", 4, "Summer Splashdown"),
 reign("wwc_us", ["big_iosefa"], "2025-04", "2025-08", 6, "WrestleMoney"),
 reign("wwc_us", ["silent_sione"], "2025-08", None, 5, "Summer Splashdown"),
 reign("wwc_womens_world", ["mama_morbid"], "2023-06", "2024-04", 9, "Night of Big Champions"),
 reign("wwc_womens_world", ["vendetta_viv"], "2024-05", "2025-02", 7, "King and Queen of the Ring"),
 reign("wwc_womens_world", ["mama_morbid"], "2025-02", "2025-03", 1, "Monday Night RAWR"),
 reign("wwc_womens_world", ["kumo_cloud"], "2025-03", None, 13, "Monday Night RAWR"),
 reign("wwc_womens", ["brielle_braidwhip"], "2023-04", "2023-08", 3, "WrestleMoney"),
 reign("wwc_womens", ["leilani_landslide"], "2024-09", "2025-01", 4, "Friday Night SlapDown"),
 reign("wwc_womens", ["tiara_orbit"], "2025-01", None, 15, "Friday Night SlapDown"),
 reign("wwc_tag_rawr", ["kojo_crown", "xerxes_woodwind"], "2025-06", None, 6, "Monday Night RAWR"),
 reign("wwc_tag_slap", ["block_party_ace", "block_party_deuce"], "2025-08", None, 4, "Friday Night SlapDown"),
 reign("wwc_notyet", ["king_kayode"], "2025-01", None, 14, "NOT YET Tuesday"),
 reign("wwc_notyet_w", ["la_primera_paloma"], "2025-06", None, 8, "NOT YET Tuesday"),
 match("colt_highway", "rocco_rule", "colt_highway", "2024-04", "WrestleMoney", 5, "Colt finished the story. The family came to ringside; so did everybody else."),
 match("chad_champ", "colt_highway", "chad_champ", "2025-04", "WrestleMoney", 3.5, "The Invisible Franchise turned on the fans and won his last title. Nobody liked it, which was the point."),
 match("colt_highway", "chad_champ", "colt_highway", "2025-08", "Summer Splashdown", 4, "Colt took the title back. The farewell tour went on without it."),
 match("wilt_wellness", "sully_sweats", "wilt_wellness", "2024-04", "WrestleMoney", 4.5, "The general and the underdog: the match of the night."),
 match("straightedge_stan", "angus_robbedmore", "straightedge_stan", "2024-08", "Summer Splashdown", 4, "A real grudge, settled with belts and fists."),
 match("straightedge_stan", "velvet_visionary", "straightedge_stan", "2025-01", "Monday Night RAWR", 4.5, "Their first match after years of real hatred. The first night on the streaming deal."),
 match("velvet_visionary", "rocco_rule", "velvet_visionary", "2025-04", "WrestleMoney", 5, "A three-way with Stan. The Visionary's adviser turned on Stan; the Visionary turned on everybody."),
 match("molly_omalley", "carlotta_woo", "molly_omalley", "2022-04", "WrestleMoney", 4.5, "Two queens. Molly went on to have a baby and come back meaner."),
 feud("rocco_rule", "colt_highway", "2023-01", "2024-04", 92, "finished", "Two years building to one night. Colt finished the story."),
 feud("straightedge_stan", "angus_robbedmore", "2024-02", "2024-10", 85, "finished", "A grudge with blood in it, ended in a cage."),
 feud("vendetta_viv", "mama_morbid", "2024-03", "2025-02", 88, "finished", "Viv stole everything Mama had; Mama took most of it back."),
 feud("velvet_visionary", "straightedge_stan", "2025-04", "2026-03", 90, "finished", "The longest hate in the company, settled in a cage at the Royal Grumble."),
 moment("chad_champ", "2025-12", "retire", "Retired after a farewell tour of the whole world. Nobody saw it coming, as usual."),
 moment("straightedge_stan", "2023-11", "return", "Came back to the giant after nine years away, at Last Team Standing."),
 moment("the_cerebral_shovel", "2022-07", "honour", "Took over creative when the chairman was pushed out."),
 moment("chairman_mcstrut", "2023-09", "leave", "Pushed out of the company he owned, by the board of the company that bought it."),
 moment("velvet_visionary", "2025-10", "injury", "Hurt his shoulder and gave up the world title."),
 moment("king_kayode", "2023-06", "debut", "Debuted in NOT YET and lifted a man over the top rope with one hand."),
 moment("brick_breakwater", "2023-04", "debut", "Came up from NOT YET barking."),
 # ---------------- EWE, the upstart ----------------
 reign("ewe_world", ["barbwire_burke"], "2020-02", "2020-12", 6, "Revolving Door"),
 reign("ewe_world", ["zed_zenith"], "2020-12", "2021-11", 10, "Wednesday Night Detonation"),
 reign("ewe_world", ["rodeo_regret"], "2021-11", "2022-05", 4, "Half Gear"),
 reign("ewe_world", ["straightedge_stan"], "2022-05", "2022-09", 0, "Double or Something"),
 reign("ewe_world", ["barbwire_burke"], "2022-09", "2022-11", 1, "All Out of Breath"),
 reign("ewe_world", ["long_island_lux"], "2022-11", "2023-12", 9, "Half Gear"),
 reign("ewe_world", ["tavita_tusi"], "2023-12", "2024-04", 3, "The Apocalypse Special"),
 reign("ewe_world", ["detour_dante"], "2024-04", "2024-08", 3, "Family Business"),
 reign("ewe_world", ["kale_kenway"], "2024-08", "2024-10", 1, "All Inn"),
 reign("ewe_world", ["barbwire_burke"], "2024-10", "2025-07", 6, "WrestleDaydream"),
 reign("ewe_world", ["rodeo_regret"], "2025-07", None, 7, "All Inn"),
 reign("ewe_womens_world", ["lightning_lupe"], "2022-03", "2022-08", 2, "Wednesday Night Detonation"),
 reign("ewe_womens_world", ["hardcase_hattie"], "2022-11", "2023-02", 2, "Half Gear"),
 reign("ewe_womens_world", ["hollywood_hazel"], "2024-03", "2024-08", 5, "Revolving Door"),
 reign("ewe_womens_world", ["poppy_pinup"], "2024-08", "2025-02", 5, "All Inn"),
 reign("ewe_womens_world", ["hollywood_hazel"], "2025-02", None, 12, "Grand Slammed: Down Under"),
 reign("ewe_international", ["zed_zenith"], "2025-01", "2025-05", 3, "Wednesday Night Detonation"),
 reign("ewe_international", ["billy_kestrel"], "2025-05", None, 9, "Double or Something"),
 reign("ewe_continental", ["reiji_ameda"], "2024-12", None, 14, "The Apocalypse Special"),
 reign("ewe_cable", ["kid_comet"], "2025-08", None, 4, "All Inn"),
 reign("ewe_basic_cable", ["coco_capital"], "2024-05", None, 22, "Double or Something"),
 reign("ewe_tag", ["mitch_fawn", "nicky_fawn"], "2024-03", "2024-10", 6, "Revolving Door"),
 reign("ewe_tag", ["burt_bluecollar", "dex_diesel"], "2025-10", None, 3, "WrestleDaydream"),
 reign("ror_world", ["captain_thesaurus"], "2024-12", "2025-04", 2, "Ring of Respectable TV"),
 reign("ror_world", ["el_forajido"], "2025-04", None, 7, "Ring of Respectable TV"),
 reign("ror_womens", ["minerva_forever"], "2022-12", None, 31, "Ring of Respectable TV"),
 reign("ror_pure", ["leg_lock_lee"], "2025-03", None, 6, "Ring of Respectable TV"),
 reign("ror_tv", ["shane_slabs"], "2025-05", None, 5, "Ring of Respectable TV"),
 match("rodeo_regret", "zed_zenith", "rodeo_regret", "2021-11", "Half Gear", 5, "The cowboy finally beat his best friend. The crowd cried; so did the cowboy."),
 match("long_island_lux", "billy_kestrel", "long_island_lux", "2024-08", "All Inn", 5, "In front of eighty thousand in London. The best match anybody there had ever seen."),
 match("billy_kestrel", "zed_zenith", None, "2023-06", "Forbidden Screen Door", 5, "Seven stars, according to a newsletter that stopped counting at five."),
 match("detour_dante", "rodeo_regret", "rodeo_regret", "2024-12", "The Apocalypse Special", 4.5, "A lights-out cage match: the end of the worst real hatred in the company."),
 match("barbwire_burke", "rodeo_regret", "rodeo_regret", "2025-07", "All Inn", 4.5, "The cowboy took the title and ended the Hard Ride's reign."),
 match("kale_kenway", "barbwire_burke", "barbwire_burke", "2024-10", "WrestleDaydream", 4, "Kale's neck gave out. He kept wrestling. Then he stopped."),
 match("mitch_fawn", "burt_bluecollar", "burt_bluecollar", "2022-06", "Forbidden Screen Door", 5, "The best tag match of the decade, in the eyes of both teams."),
 feud("detour_dante", "rodeo_regret", "2023-11", "2024-12", 95, "finished", "Dante went to Rodeo's home. The cowboy did not forgive."),
 feud("barbwire_burke", "rodeo_regret", "2025-01", "2025-07", 85, "finished", "The Hard Ride held everything. The cowboy took it back."),
 feud("burt_bluecollar", "mitch_fawn", "2021-06", "2022-06", 90, "finished", "Tag wrestling's old argument, settled in a classic."),
 feud("hollywood_hazel", "poppy_pinup", "2024-08", "2025-02", 88, "finished", "The starlet and her stolen understudy."),
 moment("straightedge_stan", "2022-09", "leave", "A brawl backstage after a press conference. Stan left the upstart a year later."),
 moment("kale_kenway", "2024-10", "retire", "Retired from full-time wrestling with a bad neck. Comes back when the crowd chants, which is always."),
 moment("zed_zenith", "2023-12", "injury", "Fell ill and was out for most of a year. Came back flipping."),
 moment("rodeo_regret", "2022-05", "turn", "Lost the title, lost his way, and spent a year as the bitterest man in the company."),
 moment("billy_kestrel", "2024-03", "sign", "Signed with the upstart after years in Japan."),
 moment("reiji_ameda", "2024-03", "sign", "Left Japan to sign with the upstart, to everybody's surprise but his."),
 moment("captain_thesaurus", "2025-10", "leave", "Left the upstart after six years. The list of synonyms stayed."),
 # ---------------- TBA ----------------
 reign("tba_world", ["niles_nevermind"], "2024-10", "2025-01", 3, "Bound for Somewhere"),
 reign("tba_world", ["believe_barnaby"], "2025-01", "2025-06", 6, "Genesis (Working Title)"),
 reign("tba_world", ["whoop_wallace"], "2025-06", "2025-10", 4, "Birthday Slam"),
 reign("tba_world", ["santo_santiago"], "2025-10", None, 8, "Bound for Somewhere"),
 reign("tba_knockouts", ["masha_meanslam"], "2025-03", None, 12, "Sacrifice Bunt"),
 reign("tba_x", ["leon_launchpad"], "2025-04", None, 9, "Rebellion Pending"),
 reign("tba_tag", ["brother_ladder", "brother_ladder_b"], "2025-03", None, 10, "Sacrifice Bunt"),
 match("santo_santiago", "whoop_wallace", "santo_santiago", "2025-10", "Bound for Somewhere", 4.5, "The hometown saviour beat the giant's loaned-out star and won the title at last."),
 match("whoop_wallace", "believe_barnaby", "whoop_wallace", "2025-06", "Birthday Slam", 4, "A developmental star from the giant took the little company's title, and the internet argued for a month."),
 feud("santo_santiago", "moose_mountain", "2025-04", "2025-12", 80, "finished", "The hometown saviour against the man who ran the place."),
 moment("believe_barnaby", "2024-02", "debut", "Debuted singing his own theme song. The crowd learned it in a week."),
 moment("santo_santiago", "2024-08", "return", "Came home to the little company after years at the upstart."),
 moment("tess_trouble", "2025-01", "return", "Came back after years away. Nobody asked; everybody watched."),
 # ---------------- OTPW ----------------
 reign("otpw_world", ["reiji_ameda"], "2022-06", "2023-04", 7, "Dominion"),
 reign("otpw_world", ["sakuma_cold"], "2023-04", "2024-01", 5, "Cherry Blossom Beginning"),
 reign("otpw_world", ["hiro_goto_again"], "2025-01", "2025-06", 3, "Dome Kingdom"),
 reign("otpw_world", ["simon_submission"], "2025-06", None, 8, "Domination Over Lunch"),
 reign("otpw_global", ["tsubasa_tomorrow"], "2025-10", None, 3, "King of Something"),
 reign("otpw_junior", ["el_solitario"], "2025-08", None, 4, "Summer Sweat Climax Final"),
 reign("otpw_never", ["grudge_gallagher"], "2026-02", None, 4, "New Beginning Again"),
 reign("otpw_tag", ["drill_sergeant_dorsey", "nurlan_ironarm"], "2026-01", None, 3, "Dome Kingdom"),
 reign("otpw_women", ["lady_khaos"], "2025-05", None, 5, "Golden Week Grapple"),
 match("simon_submission", "hiro_goto_again", "simon_submission", "2025-06", "Domination Over Lunch", 4.5, "Hiro waited fifteen years for the title. Simon took it from him in thirty-one minutes."),
 match("sunny_ace", "reiji_ameda", "sunny_ace", "2026-01", "Dome Kingdom", 5, "The ace's last match. His oldest rival came back from America for it. Fifty thousand cried."),
 match("reiji_ameda", "zed_zenith", "zed_zenith", "2020-01", "Dome Kingdom", 5, "The last of their great series before Zed left for America."),
 moment("sunny_ace", "2026-01", "retire", "Retired at the dome, after twenty-six years, and became president of the company."),
 moment("haru_wave", "2024-01", "debut", "Came back from training abroad in a leather jacket."),
 moment("lady_khaos", "2025-05", "title", "Became the first women's champion of the men's company."),
 # ---------------- Supernova, Mexico, ARK, DDW ----------------
 reign("nova_world", ["phoenix_fumika"], "2025-04", None, 12, "All Star Grand Something"),
 reign("nova_wonder", ["twinkle_mask"], "2025-06", None, 8, "Flashing Lights Champions"),
 reign("nova_tag", ["summer_sprite", "ticktock_tomoe"], "2025-11", None, 4, "Goddesses of Nova Tag League"),
 match("phoenix_fumika", "twinkle_mask", "phoenix_fumika", "2025-12", "Queen of Dreams Night", 5, "The two aces; the best women's match of the year."),
 moment("peach_menace", "2024-12", "turn", "Left the Golden Flock and took half of it with her."),
 reign("ayy_mega", ["el_senoron"], "2024-08", "2025-08", 6, "Tripleplosión"),
 reign("ayy_mega", ["hijo_del_drakkar"], "2025-08", None, 6, "Tripleplosión"),
 reign("ayy_reina", ["dama_serpiente"], "2025-06", None, 5, "Verano de Escandalito"),
 match("hijo_del_drakkar", "el_senoron", "hijo_del_drakkar", "2025-08", "Tripleplosión", 4.5, "The night after the American giant bought the company. The flyer took the title from the boss."),
 moment("payaso_siniestro", "2024-08", "honour", "Lost his hair in the bullring; the crowd cut it themselves."),
 reign("call_heavy", ["ultimo_soldado"], "2025-09", None, 5, "Aniversario Número Muchos"),
 reign("call_middle", ["el_sagrado_celestial"], "2025-03", None, 9, "Homenaje a Tres Leyendas"),
 match("el_sagrado_celestial", "ultimo_soldado", "el_sagrado_celestial", "2025-09", "Aniversario Número Muchos", 5, "Mask against mask; the soldier kept his mask by a single count. Or so he says."),
 moment("poseidon_viejo", "2024-09", "honour", "Wrestled at his fortieth anniversary and has never lost his mask."),
 reign("ark_crown", ["young_ace_kazuma"], "2025-11", None, 4, "The Long Voyage"),
 reign("ddw_world", ["gutter_gary"], "2025-04", None, 8, "The Whole Dumpster World"),
 match("gutter_gary", "tremor_tommy", "gutter_gary", "2024-04", "Balcony Spring Breakdown", 4, "Four hundred light tubes, two ambulances, one winner."),
 # ---------------- legends ----------------
 moment("brother_bronzer", "2020-04", "honour", "Inducted into a hall of fame he founded."),
 moment("tepid_tex_granite", "2022-04", "return", "Came out of retirement for one match at WrestleMoney, drank warm soda, and went home."),
 moment("the_electrifying_eyebrow", "2024-01", "honour", "Joined the giant's board. Raised one eyebrow about it."),
 moment("mr_lastrites", "2020-11", "retire", "Retired after thirty years. Said so twice. Means it, this time, probably."),
 moment("the_robe_collector", "2022-07", "retire", "Had his last match at seventy-three. Then another."),
 moment("face_paint_phantom", "2024-03", "retire", "Retired undefeated in the upstart, in his home town, on his seventy-fifth birthday-ish."),
]

def build():
    by = defaultdict(lambda: {"reigns": [], "matches": [], "feuds": [], "moments": []})
    for kind, x in H:
        d = x.get("from") or x.get("date")
        by[d[:4]][kind].append({k: v for k, v in x.items() if v is not None or k == "to"})
    os.makedirs(OUT, exist_ok=True)
    for y in sorted(by):
        with open(os.path.join(OUT, y + ".json"), "w") as f: json.dump(by[y], f, indent=1, ensure_ascii=False)
    return {y: sum(len(v) for v in by[y].values()) for y in sorted(by)}

if __name__ == "__main__":
    print("wrote history:", build())
