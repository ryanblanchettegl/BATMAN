"""WPW in the default world (Ryan, 20 October: "Add this to the game as one fed called WPW, with the WPW titles, but all
the wrestlers from all the histories, and the pcw championship").

Reads tools/wpw/wrestlepower_game_data.json (Ryan's own e-fed universe: PCW, WPW, EWE and POWER CW, 2005 to 2013; its
README is README-data.md beside it) and writes universes/parody/companies/wpw.json: one company, every character from
every fed on its roster, the WPW titles with their last champions, and the PCW World title.

The archive has no ratings. As its README asks, they are derived, and said to be: the level of the titles a character
held (suggested_tier) sets how over they are, and the words on their sign-up sheet set their style and what they are
good at. Nothing is invented about their history: titles go to whoever held them last.

Rule 3 (original content only): a character who carries a real wrestler's name gets a joking parody name, and move
names in brackets that point at a real wrestler are replaced by the plain name of the move.

    python3 tools/wpw/build-wpw.py && node tools/build-parody.js
"""
import json, os, re, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
D = json.load(open(os.path.join(HERE, 'wrestlepower_game_data.json'), encoding='utf-8'))

def h(s, n=1000):
    return int(hashlib.md5(s.encode('utf-8')).hexdigest(), 16) % n

# names that are a real wrestler's: a parody name instead (rule 3)
RENAME = {'mvp': 'Em-Vee-Pea', 'nick-comoroto': 'Nicky Comet', 'x-pc': 'Zed-Pack', 'sheet-violent-j': 'Vicious Jester'}
REAL = ['Goldberg', 'Rikishi', 'Tazz', 'Lesnar', 'Benoit', 'Regal', 'Styles', 'Paul London', 'Tommy Dreamer', 'Undertaker', 'Austin', 'Hogan', 'Flair',
        'Cena', 'Orton', 'Jericho', 'Angle', 'Michaels', 'Hardy', 'Mysterio', 'Batista', 'Foley', 'Sabu', 'Van Dam', 'Sting', 'McMahon', 'WWE', 'WWF', 'TNA',
        'ECW', 'WCW', 'Schiavone', 'Rock Bottom', 'Pedigree', 'Cillian Murphy']

def clean_name(w):
    if w['id'] in RENAME: return RENAME[w['id']]
    n = w['name']
    n = n.split(' / ')[-1]                                  # The Stallion / The Royal Knight: the name they ended with
    n = re.sub(r'\s*\(.*?\)\s*', ' ', n)                    # Michael Maddox (The Main Man)
    n = re.sub(r',\s*A\.K\.A.*$', '', n)                   # Vincent Van Zandt, A.K.A- V.V.Z
    n = re.sub(r' and his vallet .*$', '', n)               # Jordan Reject and his valet
    return re.sub(r'\s+', ' ', n).strip()

def slug(s):
    return re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')[:28]

MOVES = [('moonsault', 'Moonsault'), ('shooting star', 'Shooting star press'), ('450', '450 splash'), ('frog splash', 'Frog splash'), ('elbow', 'Elbow drop'),
         ('piledriver', 'Piledriver'), ('powerbomb', 'Powerbomb'), ('bomb', 'Powerbomb'), ('ddt', 'DDT'), ('neckbreaker', 'Neckbreaker'), ('suplex', 'Suplex'),
         ('spear', 'Spear'), ('superkick', 'Superkick'), ('kick', 'Kick'), ('clothesline', 'Lariat'), ('lariat', 'Lariat'), ('sleeper', 'Sleeper hold'),
         ('sharpshooter', 'Sharpshooter'), ('crossface', 'Crossface'), ('armbar', 'Armbar'), ('omoplata', 'Omoplata'), ('clutch', 'Cobra clutch'), ('lock', 'Submission hold'),
         ('stretch', 'Submission hold'), ('choke', 'Chokehold'), ('stunner', 'Stunner'), ('cutter', 'Cutter'), ('slam', 'Slam'), ('splash', 'Splash'), ('punch', 'Punch'),
         ('knuckle', 'Brass knuckle punch'), ('f5', 'Fireman\'s carry spinning slam'), ('c4', 'Flipping piledriver'), ('destroyer', 'Flipping piledriver'), ('driver', 'Driver'),
         ('backbreaker', 'Backbreaker'), ('bulldog', 'Bulldog'), ('facebuster', 'Facebuster'), ('crucifix', 'Crucifix bomb')]

def move_of(text):
    t = text.lower()
    for k, v in MOVES:
        if k in t: return v
    return ''

def move_name(text):
    """The character's own name for a move, without the bracket that says what it really is."""
    n = re.sub(r'\s*\(.*?\)\s*', ' ', text).strip(' -.')
    n = re.split(r' - |: ', n)[0].strip()
    if not n or len(n) > 40 or any(r.lower() in n.lower() for r in REAL): return ''
    return n[0].upper() + n[1:]

STYLE_WORDS = {
    'flyer': ['high flyer', 'high-flyer', 'highflyer', 'moonsault', 'shooting star', '450', 'aerial', 'flyer', 'dive', 'cruiserweight', 'x-division', 'flip', 'springboard'],
    'technician': ['technic', 'submission', 'mat ', 'armbar', 'lock', 'suplex', 'counter', 'scientific', 'pure'],
    'powerhouse': ['power', 'monster', 'giant', 'strong', 'bomb', 'big man', 'huge', 'massive'],
    'brawler': ['brawl', 'hardcore', 'street', 'fight', 'garbage', 'knuckle', 'weapon', 'chair', 'table'],
    'striker': ['kick', 'strike', 'martial', 'mma', 'karate', 'kickbox'],
    'entertainer': ['comedy', 'funny', 'joke', 'entertain', 'dance', 'crowd', 'showman', 'charisma'],
}

def text_of(w):
    return ' '.join([w.get('style', '')] + w.get('characteristics', []) + w.get('moves', []) + w.get('signature_moves', []) + w.get('finishers', []) + [w.get('summary', ''), w.get('original_signup_bio', '')]).lower()

def style_of(w):
    t = text_of(w); best, bs = 'all_rounder', 1
    for s, ws in STYLE_WORDS.items():
        n = sum(t.count(x) for x in ws)
        if n > bs: best, bs = s, n
    m = re.search(r'(\d{3})', w.get('weight', '') or '')
    if m and int(m.group(1)) >= 275 and best in ('all_rounder', 'brawler'): best = 'powerhouse'
    return best

def disp_of(w):
    a = (w.get('alignment') or '').lower()
    if 'tween' in a: return 'tweener'
    if 'heel' in a: return 'heel'
    if 'face' in a: return 'face'
    return ['face', 'heel', 'tweener'][h(w['id'], 3)]

FEMALE = {'amanda-rhyme', 'brooke-baker', 'super-sexy-girl', 'sophie-cassius', 'tiffany-perez', 'amy-carson', 'aurora-callisto', 'sheet-mikala', 'sheet-sexxiie-goregous',
          'sheet-tiffany-perez', 'sheet-amy-carson', 'sheet-aurora-callisto', 'raelis-shy'}
def gender_of(w):
    g = ((w.get('other_facts') or {}).get('gender') or '').lower()
    if g.startswith('f'): return 'F'
    if g.startswith('m'): return 'M'
    return 'F' if w['id'] in FEMALE or any(x in w['name'] for x in ['Amanda', 'Brooke', 'Sophie', 'Tiffany', 'Amy ', 'Aurora', 'Mikala', 'Sexxiie', 'Super Sexy Girl', 'Raelis']) else 'M'

TIER = {'main_event': (80, 'main_eventer', 60000), 'upper_midcard': (68, 'upper_midcarder', 34000), 'midcard': (57, 'midcarder', 18000), 'lower_card': (45, 'lower_midcarder', 8000)}
FOCUS = {'brawler': ('brawling', 10), 'technician': ('technical', 10), 'flyer': ('aerial', 12), 'powerhouse': ('brawling', 8), 'striker': ('brawling', 6), 'entertainer': ('charisma', 10), 'all_rounder': ('technical', 4)}

def ratings(w, style):
    over, _, _ = TIER[w['suggested_tier']]; k = w['id']
    j = lambda s, r=10: h(k + s, r * 2 + 1) - r
    base = 46 + (over - 45) * 0.55
    R = {'brawling': base + j('b'), 'technical': base + j('t'), 'aerial': base - 8 + j('a'), 'stamina': base + j('s'), 'charisma': base + j('c'), 'promo_skill': base + 4 + j('p'),
         'overness': over + j('o', 6), 'star_quality': over - 4 + j('q', 8), 'potential': 62 + j('pt', 14), 'durability': 65 + j('d', 12), 'consistency': base + j('k')}
    f, add = FOCUS[style]; R[f] += add
    if style == 'flyer': R['aerial'] += 14
    if style == 'powerhouse': R['durability'] += 6
    if w['detail_level'] == 'full': R['promo_skill'] += 6; R['charisma'] += 4   # the ones the archive remembers wrote the most
    return {x: int(max(20, min(95, round(v)))) for x, v in R.items()}

def first_sentences(t, n=200):
    out = ''
    for s in re.split(r'(?<=[.!?])\s+', (t or '').strip()):
        if any(r.lower() in s.lower() for r in REAL): continue
        if len(out) + len(s) > n: break
        out = (out + ' ' + s).strip()
    return out

def worker(w, wid, name, gender=None):
    st = style_of(w); over, push, pay = TIER[w['suggested_tier']]
    of = w.get('other_facts') or {}
    age = of.get('age')
    try: age = int(re.sub(r'\D', '', str(age))[:2]) if age else None
    except ValueError: age = None
    age = age or 24 + h(wid + 'age', 15)
    ch = [c for c in w.get('characteristics', []) if c and len(c) < 30 and not any(r.lower() in c.lower() for r in REAL)]
    fins = [m for m in w.get('finishers', []) if move_name(m)]
    sigs = [m for m in w.get('signature_moves', []) if move_name(m)][:2]
    o = {'id': wid, 'ring_name': name, 'gender': gender or gender_of(w), 'disposition': disp_of(w), 'style': st, 'age': age, 'hometown': (w.get('hometown') or '').strip() or 'Kingsport',
         'roles': ['wrestler'], 'ratings': ratings(w, st), 'gimmick_category': (ch[0][:1].upper() + ch[0][1:]) if ch else ('A WPW original' if w['detail_level'] != 'signup_sheet_only' else 'A WPW hopeful'),
         'gimmick': first_sentences(w.get('summary') or w.get('original_signup_bio') or '') or 'Came through the WrestlePower forums and never left.',
         'peak_years': [27, 36], 'debut_year': 2006 if 'WPW' in (w.get('promotions') or []) else 2005}
    cp = of.get('Catchphrase') or of.get('catchphrase')
    if cp and not any(r.lower() in cp.lower() for r in REAL): o['catchphrase'] = cp.strip('"')[:60]
    if fins:
        o['finisher'] = move_name(fins[0]); mv = move_of(fins[0])
        if mv: o['finisher_move'] = mv; o['finisher_description'] = 'A ' + mv.lower() + '.'
    if sigs: o['signatures'] = [{'name': move_name(s), 'move': move_of(s) or 'Signature move'} for s in sigs]
    o['contract'] = {'type': 'exclusive', 'monthly_salary': pay, 'weeks_left': 48 + h(wid + 'wk', 80), 'push': push}
    return o

roster, ids, by_name = [], {}, {}
for w in D['wrestlers']:
    n = w['name']
    if n.startswith('Connie and Tina'):
        parts = [('wpw_connie', 'Connie Bee', 'F'), ('wpw_tina', 'Tina Bee', 'F')]
    elif n.startswith('Red Dragon:'):
        parts = [('wpw_seto_uchiha', 'Seto Uchiha', 'M'), ('wpw_vendetta', 'Vendetta', 'M')]
    else:
        nm = clean_name(w); parts = [('wpw_' + slug(nm), nm, None)]
    for wid, nm, g in parts:
        while any(r['id'] == wid for r in roster): wid += '_2'
        roster.append(worker(w, wid, nm, g)); ids.setdefault(w['id'], []).append(wid); by_name[nm.lower()] = wid

def holder(reign):
    out = [x for cid in reign.get('champion_ids') or [] for x in ids.get(cid, [])]
    if out: return out
    names = re.split(r'\s*&\s*|\s+and\s+', re.sub(r'\s*\(\d+\)', '', reign['champion']))
    for nm in names:
        nm = nm.strip().lower()
        bare = lambda x: re.sub(r'\s+', ' ', re.sub(r'"[^"]*"', ' ', x)).strip()   # 'blade "the future" lavigne' is blade lavigne
        hit = next((wid for k, wid in by_name.items() if nm and (nm in k or k in nm or bare(k) == bare(nm))), None)
        if hit: out.append(hit)
    return out

T = {c['id']: c for c in D['championships']}
TITLES = [('title-wpw-world', 'wpw_world', 'WPW World Heavyweight Championship', 3, False), ('title-florida', 'wpw_florida', 'WPW Florida State Championship', 2, False),
          ('title-wpw-tag', 'wpw_tag', 'WPW World Tag Team Championship', 2, True), ('title-canadian', 'wpw_pure', 'WPW Canadian Pure Championship', 2, False),
          ('title-hardcore', 'wpw_hardcore', 'WPW Hardcore Championship', 1, False), ('title-pcw-world', 'pcw_world', 'PCW World Heavyweight Championship', 3, False)]
# Ryan's champions for the start of a game (22 October); the rest come from the last recorded reign
CHAMPS = {'wpw_world': ['wpw_the_judge'], 'wpw_florida': ['wpw_unstoppable_mike_adams'], 'wpw_tag': ['wpw_the_dream', 'wpw_jokester'],
          'wpw_pure': ['wpw_raelis_shy'], 'wpw_hardcore': ['wpw_dan_murph'], 'pcw_world': ['wpw_the_one']}
titles = []
for src, tid, name, lvl, tag in TITLES:
    c = T[src]; hold = CHAMPS.get(tid) or (holder(c['reigns'][-1]) if c['reigns'] else [])
    t = {'id': tid, 'name': name, 'gender': 'M', 'level': lvl, 'holder_ids': hold[:2] if tag else hold[:1]}
    if tag: t['tag'] = True
    titles.append(t)
teams = []
tagt = next(t for t in titles if t['id'] == 'wpw_tag')
if len(tagt['holder_ids']) == 2: teams.append({'id': 'wpw_tag_champs', 'name': 'The Dream and Jokester', 'kind': 'tag', 'member_ids': tagt['holder_ids'], 'experience': 60, 'chemistry': 7})
teams.append({'id': 'wpw_the_bees', 'name': 'The Bees', 'kind': 'tag', 'member_ids': ['wpw_connie', 'wpw_tina'], 'experience': 50, 'chemistry': 7})
teams.append({'id': 'wpw_red_dragon', 'name': 'Red Dragon', 'kind': 'tag', 'member_ids': ['wpw_seto_uchiha', 'wpw_vendetta'], 'experience': 50, 'chemistry': 6})

company = {
    'promotion': {'id': 'wpw', 'model': 'classic', 'name': 'WPW', 'full_name': 'WrestlePower Wrestling', 'intergender': True,
                  'blurb': 'The fed that grew out of PCW and took in everybody who ever signed up: four feds of history, one locker room, and a World title first held by a Shakespearean.',
                  'owner': {'name': 'Carlos Gonzalez', 'style': 'stars', 'roots': 'tradition', 'pledge': 'stable'},
                  'staff': {'road_agent': 'Ethan Frost', 'head_writer': 'The Judge'}, 'announcers': ['Daniel Justice', 'Max Stockton'],
                  'cities': ['Kingsport', 'Knoxville', 'Nashville', 'Atlanta', 'Jacksonville', 'Orlando', 'Tampa', 'Miami'],
                  'cash': 9000000, 'popularity': 50, 'flagship_month': 4, 'tv_slot': 0, 'production_level': 1,
                  'events': [{'n': 'When Worlds Collide', 't': 'tent'}, {'n': 'Proving Ground', 't': 'arena'}, {'n': 'Brawl For It All', 't': 'gimmick'}, {'n': 'Redemption', 't': 'flag'},
                             {'n': 'Payback', 't': 'arena'}, {'n': 'Ruined Fate', 't': 'taped'}, {'n': 'Greed', 't': 'arena'}, {'n': 'Activation', 't': 'tent'},
                             {'n': 'ReActivation', 't': 'arena'}, {'n': 'Hallowicked', 't': 'gimmick'}, {'n': 'Whiplash', 't': 'arena'}, {'n': 'Mutiny', 't': 'taped'}]},
    'shows': [{'id': 'wpw_tnt', 'name': 'Tuesday Night Turmoil', 'weight': 1}],
    'titles': titles, 'roster': roster, 'teams': teams}
out = os.path.join(ROOT, 'universes', 'parody', 'companies', 'wpw.json')
# belts designed since (tools/design-belts.js, or by hand) are kept
if os.path.exists(out):
    old = {t['id']: t.get('belt') for t in json.load(open(out, encoding='utf-8')).get('titles', [])}
    for t in titles:
        if old.get(t['id']): t['belt'] = old[t['id']]
json.dump(company, open(out, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('wrote', out, len(roster), 'wrestlers,', len(titles), 'titles:', ', '.join(t['name'] + ' (' + (', '.join(t['holder_ids']) or 'vacant') + ')' for t in titles))
