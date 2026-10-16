"""Shared by every company script in tools/parody/: turns a compact row into a full wrestler entry, and writes a
company file. The numbers come from a tier (1 to 5) and the style, with a small fixed nudge from the id, so every
run writes the same file. Modders edit the JSON, not this."""
import json, os, hashlib

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "universes", "parody", "companies")
TIER_OVR = {1: 38, 2: 55, 3: 68, 4: 80, 5: 91}          # overness: how much the crowd cares
TIER_SKILL = {1: 50, 2: 62, 3: 72, 4: 80, 5: 86}        # the base the ring skills are built from
STYLE_SHAPE = {  # brawling, technical, aerial, stamina
    "brawler": (8, -4, -10, 2), "technician": (-2, 9, -2, 4), "flyer": (-6, 2, 12, 2), "powerhouse": (9, -6, -14, 0),
    "all_rounder": (2, 3, 2, 3), "striker": (6, 2, -4, 2), "entertainer": (-2, -6, -8, -2)}
PAY = {"main_eventer": 165000, "upper_midcarder": 70000, "midcarder": 38000, "lower_midcarder": 22000, "jobber": 12000, "non_wrestler": 28000}

def nudge(i, k, span=6):
    h = int(hashlib.md5((i + ":" + k).encode()).hexdigest()[:6], 16)
    return h % (2 * span + 1) - span

def clamp(v, a=1, b=99): return max(a, min(b, int(round(v))))

def worker(i, name, g, disp, style, tier, age, town, cat, gim, say, fin, fdesc, push="midcarder", brand=None, promo=None, roles=None, legend=False, debut=None):
    base, sh = TIER_SKILL[tier], STYLE_SHAPE.get(style, (0, 0, 0, 0))
    older = max(0, age - 38)                              # a body past its best: less stamina, less flying
    r = {
        "brawling": clamp(base + sh[0] + nudge(i, "b")), "technical": clamp(base + sh[1] + nudge(i, "t")),
        "aerial": clamp(base + sh[2] + nudge(i, "a") - older * 2), "stamina": clamp(base + sh[3] + nudge(i, "s") - older * 2),
        "charisma": clamp(TIER_OVR[tier] - 4 + nudge(i, "c", 8) + (8 if style == "entertainer" else 0)),
        "promo_skill": clamp(TIER_OVR[tier] - 6 + nudge(i, "p", 9) + (8 if style == "entertainer" else 0)),
        "overness": clamp(TIER_OVR[tier] + nudge(i, "o", 4)), "star_quality": clamp(TIER_OVR[tier] + nudge(i, "q", 6)),
        "potential": clamp(TIER_OVR[tier] + (14 if age < 27 else (6 if age < 31 else 0)) + nudge(i, "pot", 4)),
        "durability": clamp(76 - older * 2 + nudge(i, "d", 8)), "consistency": clamp(70 + tier * 3 + nudge(i, "k", 6)),
    }
    w = {"id": i, "ring_name": name, "gender": g, "disposition": disp, "style": style, "age": age, "hometown": town,
         "roles": roles or ["wrestler"], "ratings": r, "gimmick_category": cat, "gimmick": gim, "catchphrase": say,
         "peak_years": [27, 36] if tier < 5 else [28, 38], "debut_year": debut or max(1995, 2026 - max(1, age - 21))}
    if fin: w["finisher"] = fin
    if fdesc: w["finisher_description"] = fdesc
    if legend: w["legend"] = True
    if promo:
        w["contract"] = {"type": "exclusive", "monthly_salary": PAY.get(push, 30000) * (1.25 if tier == 5 else 1), "weeks_left": 20 + abs(nudge(i, "w", 60)) * 2,
                         "push": push}
        if brand: w["contract"]["brand"] = brand
    return w

def write_company(cid, data):
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, cid + ".json"), "w") as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
    print("wrote companies/%s.json: %d people" % (cid, len(data["roster"])))

def add_moves(roster, move, sig):
    """move: id -> the plain name of the finisher. sig: id -> "Name|plain move; Name|plain move" (two signatures)."""
    for w in roster:
        if w["id"] in move: w["finisher_move"] = move[w["id"]]
        if w["id"] in sig:
            w["signatures"] = [{"name": a.split("|")[0].strip(), "move": a.split("|")[1].strip()} for a in sig[w["id"]].split(";")]
