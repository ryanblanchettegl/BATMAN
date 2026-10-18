"""The desk as a construction paper diorama: a concept for the whole look (Ryan, 18 October).

The screen is a table top of card. The desktop is a sheet of blue paper; every window is a sheet of cream card
lying on it, with a title bar cut from blue paper in the pinstripes of an early 90s computer and a close box.
Group boxes are a slightly darker card with a tab for the heading. Buttons are two or three layers of card
stacked up, so they stand off the window and throw a shadow. The road map is a mosaic of paper squares cut from
the game's own map board (src/91-maps.js), with paper map pins and a red thread for the route. The marquee keeps
its lights.

Run with Blender's Python (bpy) from the repo root:  python tools/creator/paper-desk.py
Writes docs/mockups/paper/desk.png (1920 by 1080). Needs fontTools to read the game's VT323 typeface.
"""
import io, json, math, os, random, subprocess, tempfile
import bpy, bmesh
from mathutils import Euler, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'mockups', 'paper')
W, H = 1920, 1080
SAMPLES = int(os.environ.get('PS', 48))
rnd = random.Random(4)

# ---------------------------------------------------------------- colours of card
C = dict(   # the ring scene's colours: a deep navy house, a red apron, white ropes, yellow lights
    desk=(0.03, 0.04, 0.12), cream=(0.9, 0.86, 0.76), cream2=(0.8, 0.75, 0.64), navy=(0.03, 0.04, 0.12), stripe=(0.07, 0.1, 0.28),
    ink=(0.05, 0.05, 0.06), red=(0.78, 0.06, 0.04), green=(0.04, 0.38, 0.06), lgreen=(0.2, 0.55, 0.06), gold=(0.95, 0.62, 0.04),
    sea=(0.03, 0.06, 0.2), land=(0.2, 0.5, 0.16), black=(0.02, 0.02, 0.025), yellow=(1.0, 0.82, 0.08), grey=(0.55, 0.56, 0.6),
    steel=(0.05, 0.16, 0.5), white=(0.97, 0.96, 0.93), pink=(0.88, 0.3, 0.32), muted=(0.3, 0.28, 0.26),
    bar=(0.03, 0.04, 0.12), pin=(0.08, 0.12, 0.32), maroon=(0.5, 0.03, 0.05), dgreen=(0.02, 0.32, 0.05),
)
_m = {}
def card(col, glow=0.0):
    """Construction paper: matte, a coarse fibre in the colour and the bump. The cut edge is paler."""
    key = (tuple(round(c, 3) for c in col), glow)
    if key in _m: return _m[key]
    out = []
    for core in (False, True):
        m = bpy.data.materials.new('card'); nt = m.node_tree; b = nt.nodes['Principled BSDF']
        c = tuple(x + (1 - x) * 0.35 for x in col) if core else col
        b.inputs['Roughness'].default_value = 0.95; b.inputs['Specular IOR Level'].default_value = 0.12
        tc = nt.nodes.new('ShaderNodeTexCoord'); n = nt.nodes.new('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value = 3.2; n.inputs['Detail'].default_value = 14; n.inputs['Roughness'].default_value = 0.72
        nt.links.new(tc.outputs['Object'], n.inputs['Vector'])
        r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.elements[0].position = 0.38; r.color_ramp.elements[1].position = 0.62
        r.color_ramp.elements[0].color = (0.8, 0.8, 0.8, 1)
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.0
        mx.inputs['A'].default_value = (*c, 1); nt.links.new(n.outputs['Fac'], r.inputs['Fac']); nt.links.new(r.outputs['Color'], mx.inputs['B'])
        n2 = nt.nodes.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 0.35; n2.inputs['Detail'].default_value = 3
        nt.links.new(tc.outputs['Object'], n2.inputs['Vector'])
        r2 = nt.nodes.new('ShaderNodeValToRGB'); r2.color_ramp.elements[0].position = 0.3; r2.color_ramp.elements[1].position = 0.7
        r2.color_ramp.elements[0].color = (0.9, 0.9, 0.9, 1); nt.links.new(n2.outputs['Fac'], r2.inputs['Fac'])
        mx2 = nt.nodes.new('ShaderNodeMix'); mx2.data_type = 'RGBA'; mx2.blend_type = 'MULTIPLY'; mx2.inputs['Factor'].default_value = 1.0
        nt.links.new(mx.outputs['Result'], mx2.inputs['A']); nt.links.new(r2.outputs['Color'], mx2.inputs['B'])
        nt.links.new(mx2.outputs['Result'], b.inputs['Base Color'])
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.7; bp.inputs['Distance'].default_value = 0.05
        nt.links.new(n.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
        if glow:
            b.inputs['Emission Color'].default_value = (*col, 1); b.inputs['Emission Strength'].default_value = glow
        out.append(m)
    _m[key] = out
    return out

# ---------------------------------------------------------------- pieces, in screen pixels (x right, y down)
def P(x, y): return (x / 10.0 - W / 20.0, H / 20.0 - y / 10.0)

def scissor(poly, amt, step=1.2):
    out = []
    for i in range(len(poly)):
        a, b = Vector(poly[i]), Vector(poly[(i + 1) % len(poly)]); n = max(1, int((b - a).length / step))
        for k in range(n):
            p = a.lerp(b, k / n); out.append((p.x + rnd.uniform(-amt, amt), p.y + rnd.uniform(-amt, amt)))
    return out

def rrect(x, y, w, h, r=0.0, n=6):
    if r <= 0: return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
    pts = []
    for cx, cy, a0 in ((x + w - r, y + r, -90), (x + w - r, y + h - r, 0), (x + r, y + h - r, 90), (x + r, y + r, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def ellp(cx, cy, rx, ry, n=20): return [(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n)) for i in range(n)]

def cut(polys, col, z, thick=0.22, rough=0.25, glow=0.0):
    """Cut one or more pieces (polygons in pixels) from one colour of card and lay them at height z."""
    if polys and isinstance(polys[0][0], (int, float)): polys = [polys]
    bm = bmesh.new()
    for poly in polys:
        pts = scissor(poly, rough) if rough else poly
        vs = [bm.verts.new((*P(x, y), 0)) for x, y in pts]
        try: f = bm.faces.new(vs)
        except ValueError: continue
        r = bmesh.ops.extrude_face_region(bm, geom=[f]); top = [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, vec=(0, 0, thick), verts=top)
    for fc in bm.faces: fc.material_index = 0 if abs(fc.normal.z) > 0.9 else 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('c'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('c', me); bpy.context.collection.objects.link(o); o.location.z = z
    for m in card(col, glow): me.materials.append(m)
    return o

FONT = None
def text(s, x, y, size, col=C['ink'], z=0.0, align='LEFT', glow=0.0):
    """Lettering in the game's typeface, printed on the card (x, y is the left or centre of the line, in pixels)."""
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.font = FONT; cu.size = size / 10.0; cu.align_x = align; cu.align_y = 'CENTER'
    cu.extrude = 0.004
    o = bpy.data.objects.new('t', cu); bpy.context.collection.objects.link(o); o.location = (*P(x, y), z + 0.01)
    cu.materials.append(card(col, glow)[0])

# ---------------------------------------------------------------- the parts of the look
def window(x, y, w, h, title, info=None, z=3.5):
    """A window as on a mid 90s Macintosh, cut from card: a black outline, a pinstriped grey title bar with a
    close box and a zoom box, the title on a patch in the middle, and the info strip under it (left and right)."""
    cut(rrect(x - 3, y - 3, w + 6, h + 6, 2), C['black'], z, 0.3, 0.12)
    cut(rrect(x, y, w, h, 1), C['cream'], z + 0.3, 0.3, 0.15)
    bar = 34
    cut(rrect(x + 2, y + 2, w - 4, bar, 1), C['bar'], z + 0.6, 0.1, 0.1)
    cut([rrect(x + 6, y + 7 + i * 5, w - 12, 2) for i in range(5)], C['pin'], z + 0.7, 0.05, 0.05)
    for bx, inner in ((x + 16, False), (x + w - 44, True)):
        cut(rrect(bx - 2, y + 5, 30, 28), C['bar'], z + 0.75, 0.08, 0.05)
        cut(rrect(bx, y + 7, 24, 24), C['black'], z + 0.83, 0.08, 0.05); cut(rrect(bx + 2, y + 9, 20, 20), C['cream'], z + 0.91, 0.08, 0.05)
        if inner: cut(rrect(bx + 3, y + 10, 11, 11), C['black'], z + 0.99, 0.05, 0.03); cut(rrect(bx + 4, y + 11, 9, 9), C['cream'], z + 1.04, 0.05, 0.03)
    tw = len(title) * 14 + 34
    cut(rrect(x + (w - tw) / 2, y + 4, tw, 30), C['bar'], z + 0.75, 0.1, 0.08)
    text(title, x + w / 2, y + 19, 32, C['yellow'], z + 0.85, 'CENTER')
    zz = z + 0.6
    if info:
        cut(rrect(x + 2, y + bar + 2, w - 4, 34), C['cream2'], z + 0.6, 0.08, 0.1)
        cut(rrect(x + 2, y + bar + 36, w - 4, 2), C['black'], z + 0.68, 0.04, 0.05)
        text(info[0], x + 16, y + bar + 19, 26, C['ink'], z + 0.68)
        if info[1]: text(info[1], x + w - 16, y + bar + 19, 26, C['ink'], z + 0.68, 'RIGHT')
    return zz

def group(x, y, w, h, head, z):
    """A group box: a darker card with a tab that carries the heading in red."""
    cut(rrect(x, y, w, h, 5), C['cream2'], z, 0.12, 0.2)
    tw = len(head) * 13 + 22
    cut(rrect(x + 12, y - 16, tw, 30, 4), C['cream'], z + 0.12, 0.12, 0.15)
    text(head, x + 12 + tw / 2, y - 1, 28, C['red'], z + 0.24, 'CENTER')
    return z + 0.12

def button(x, y, w, h, label, kind='go', z=3.0, size=28):
    """A button built up from card: a dark base, a coloured face raised on it, and the label on top."""
    face = dict(go=C['green'], navy=C['navy'], danger=C['red'], less=C['steel'], gold=C['gold'])[kind]
    base = tuple(c * 0.45 for c in face); ink = C['ink'] if kind == 'gold' else C['white']
    cut(rrect(x, y + 4, w, h, h * 0.3), C['black'], z, 0.35, 0.15)
    cut(rrect(x, y, w, h, h * 0.3), base, z + 0.35, 0.35, 0.12)
    cut(rrect(x + 2, y + 1, w - 6, h - 6, h * 0.28), face, z + 0.7, 0.3, 0.1)
    text(label, x + w / 2 - 1, y + h / 2 - 2, size, ink, z + 1.0, 'CENTER')

def tag(x, y, label, col, ink=C['white'], z=3.0):
    w = len(label) * 13 + 20; cut(rrect(x, y, w, 30, 3), col, z, 0.15, 0.15); text(label, x + w / 2, y + 15, 26, ink, z + 0.15, 'CENTER'); return w

def meter(x, y, w, h, parts, z):
    cut(rrect(x, y, w, h, 2), (0.2, 0.2, 0.24), z, 0.1, 0.12); cx = x + 3
    for frac, col in parts:
        cw = (w - 6) * frac; cut(rrect(cx, y + 3, cw, h - 6, 1), col, z + 0.1, 0.1, 0.1); cx += cw

def light(x, y, col, z, r=8):
    cut(ellp(x, y, r + 2, r + 2, 16), C['black'], z, 0.1, 0.05); cut(ellp(x, y, r, r, 16), col, z + 0.1, 0.1, 0.05)

# ---------------------------------------------------------------- the road map: a mosaic of paper squares
def road_map(x, y, w, h, z, stops):
    cut(rrect(x, y, w, h, 4), C['sea'], z, 0.15, 0.3)
    e = json.load(open(os.environ.get('EUROPE', os.path.join(os.path.dirname(__file__), '.europe.json'))))
    cw, ch = w / 59.0, h / 32.0; shades = [(0.06, 0.3, 0.06), (0.1, 0.38, 0.08), (0.04, 0.24, 0.05), (0.14, 0.42, 0.1)]
    by = {}
    for r, row in enumerate(e['g']):
        for c, k in enumerate(row):
            if k == ' ': continue
            col = (0.32, 0.36, 0.26) if k == '-' else shades[('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.find(k)) % 4]
            by.setdefault(col, []).append(rrect(x + c * cw + 1, y + r * ch + 1, cw - 1.5, ch - 1.5))
    for col, polys in by.items(): cut(polys, col, z + 0.15, 0.12, 0.35)
    f = e['f']
    def at(lat, lon): return (x + (lon - f[0]) / f[1] * cw, y + (f[2] - lat) / f[3] * ch)
    pts = [at(*s[1]) for s in stops]
    for a, b in zip(pts, pts[1:]):   # the red thread of the route
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy); nx, ny = -dy / L * 1.6, dx / L * 1.6
        cut([(a[0] + nx, a[1] + ny), (b[0] + nx, b[1] + ny), (b[0] - nx, b[1] - ny), (a[0] - nx, a[1] - ny)], C['red'], z + 0.5, 0.05, 0.1)
    for (name, _, now), (px, py) in zip(stops, pts):   # paper map pins and flags
        col = C['red'] if now else C['gold']
        cut([(px - 7, py - 20), (px + 7, py - 20), (px, py)], tuple(c * 0.7 for c in col), z + 0.7, 0.15, 0.05)
        cut(ellp(px, py - 24, 11, 11, 18), col, z + 0.85, 0.2, 0.08); cut(ellp(px - 3, py - 27, 3.5, 3.5, 10), C['white'], z + 1.05, 0.05, 0.02)
        fw = len(name) * 12 + 14
        cut(rrect(px + 14, py - 38, fw, 26, 2), C['cream'], z + 1.1, 0.12, 0.15); text(name, px + 14 + fw / 2, py - 25, 24, C['ink'], z + 1.22, 'CENTER')

# ---------------------------------------------------------------- the desk
def desk():
    z0 = 0.0
    cut(rrect(-20, -20, W + 40, H + 40), C['desk'], z0, 0.2, 0.0)
    # the menu bar, as on a mid 90s Macintosh: white, a black rule under it, a belt where the apple was
    cut(rrect(0, 0, W, 48), C['white'], 1.0, 0.3, 0.2); cut(rrect(0, 48, W, 3), C['black'], 1.0, 0.32, 0.1)
    cut(rrect(20, 14, 44, 22, 6), C['black'], 1.3, 0.12, 0.1); cut(ellp(42, 25, 15, 13, 20), C['gold'], 1.42, 0.12, 0.08)
    cut(ellp(42, 25, 7, 6, 14), C['yellow'], 1.54, 0.08, 0.04)
    mx = 96
    for i, m in enumerate(['Office', 'Booking', 'Roster', 'Web', 'Manage', 'Company']):
        mw = len(m) * 16 + 30
        if i == 0: cut(rrect(mx - 6, 4, mw, 40), C['black'], 1.3, 0.1, 0.08)
        text(m, mx + 9, 24, 36, C['white'] if i == 0 else C['ink'], 1.42); mx += mw + 8
    text('Week 1, Dec 2026', 1660, 24, 34, C['ink'], 1.3, 'RIGHT')
    cut(ellp(1700, 24, 17, 15, 20), C['yellow'], 1.3, 0.15, 0.08); cut([(1690, 34), (1700, 36), (1688, 44)], C['yellow'], 1.3, 0.15, 0.04)
    text('?', 1700, 23, 30, C['ink'], 1.45, 'CENTER')
    cut(rrect(1740, 6, 80, 36, 4), C['maroon'], 1.3, 0.15, 0.1); text('PDW', 1780, 24, 30, C['white'], 1.45, 'CENTER')
    cut(rrect(0, 56, W, 34), C['navy'], 0.9, 0.2, 0.3)
    text('Cleopatra is under strain (stress 75).  Dublin sold out.', 24, 73, 26, C['yellow'], 1.1)
    # the road window
    z = window(24, 106, 1872, 548, 'The road: Europe')
    stops = [('DUBLIN', (53.35, -6.26), False), ('EDINBURGH', (55.95, -3.19), False), ('LONDON', (51.51, -0.13), False), ('PARIS', (48.86, 2.35), False), ('VERONA', (45.44, 10.99), True)]
    road_map(44, 166, 760, 410, z + 0.2, stops)
    cut(rrect(836, 168, 360, 52, 4), C['cream2'], z + 0.2, 0.15, 0.2); text('VERONA, ITALY', 1016, 194, 42, C['ink'], z + 0.35, 'CENTER')
    text('Verona Coliseum · the first of 2 shows left', 836, 244, 28, C['ink'], z + 0.2)
    g = group(830, 284, 520, 136, 'The building', z + 0.2)
    for i, (k, v) in enumerate([('Sold', '7,640 of 8,800'), ('This week', '1,018 sold'), ('Gate so far', '$534,442 at $76 a seat')]):
        text(k, 850, 310 + i * 36, 28, C['ink'], g + 0.02); text(v, 1010, 310 + i * 36, 28, C['ink'], g + 0.02)
    meter(1230, 298, 108, 24, [(0.78, C['gold']), (0.22, C['navy'])], g + 0.02); meter(1230, 334, 108, 24, [(0.7, C['lgreen']), (0.3, C['green'])], g + 0.02)
    g = group(830, 448, 520, 128, 'The crowd', z + 0.2)
    for i, (k, v) in enumerate([('Market', 'They know you. They like you.'), ('Last here', '5 weeks ago, a B-, sold out'), ('In town', 'Nobody else lately')]):
        text(k, 850, 474 + i * 34, 28, C['ink'], g + 0.02); text(v, 1010, 474 + i * 34, 28, C['ink'], g + 0.02)
    g = group(1380, 168, 494, 70, 'Hometown', z + 0.2)
    cut(rrect(1396, 186, 40, 40, 3), C['pink'], g + 0.02, 0.12, 0.1); text('Juliet Capulet: the crowd is hers', 1446, 206, 28, C['ink'], g + 0.02)
    g = group(1380, 268, 494, 300, 'The road', z + 0.2)
    rows = [('Dublin · sold out', C['red'], C['grey']), ('Edinburgh · 5,771', C['ink'], C['grey']), ('London · sold out', C['red'], C['grey']),
            ('Paris · sold out', C['red'], C['grey']), ('Verona, this week', C['white'], C['lgreen']), ('Boston next · 4,590 sold', C['ink'], C['gold']), ('New York · 6,022 sold', C['ink'], C['gold'])]
    for i, (s, ink, lt) in enumerate(rows):
        yy = 296 + i * 38
        if i == 4: cut(rrect(1394, yy - 16, 466, 34, 3), C['green'], g + 0.05, 0.12, 0.12)
        light(1412, yy + 1, lt, g + 0.1); text(s, 1432, yy, 28, ink, g + 0.2)
    # the marquee, in lights
    cut(rrect(44, 594, 1150, 46, 3), C['black'], z + 0.2, 0.15, 0.15)
    text('VERONA · WEDNESDAY NIGHT FOLIO · 7,640 SOLD · COLISEUM', 619, 617, 34, C['yellow'], z + 0.36, 'CENTER', glow=2.2)
    button(1420, 590, 200, 50, 'The schedule', 'less', z + 0.2); button(1640, 590, 220, 50, 'Ticket prices', 'navy', z + 0.2)
    # the three windows along the bottom
    y2 = 668
    z = window(24, y2, 600, 340, 'On your desk', ('Nothing waiting', '2 answered'))
    text('Nothing needs an answer.', 48, y2 + 112, 30, C['dgreen'], z + 0.05); text('Worth knowing:', 48, y2 + 148, 30, C['dgreen'], z + 0.05)
    text('Cleopatra is under strain (stress 75).', 48, y2 + 184, 30, C['ink'], z + 0.05)
    cut(rrect(48, y2 + 200, 128, 3), C['red'], z + 0.05, 0.04, 0.05)
    z = window(650, y2, 620, 340, "This week's tasks", ('4 tasks', '3 to do'))
    tasks = [('To do', C['cream2'], C['ink'], 'A play-by-play voice', ('Assign', 'less')), ('To do', C['cream2'], C['ink'], 'A colour voice', ('Assign', 'less')),
             ('Required', C['red'], C['white'], 'Your first sponsor', ('See offers', 'danger')), ('Worth doing', C['green'], C['white'], 'Action points to spend', ('Backstage', 'navy'))]
    for i, (t, col, ink, s, (b, kind)) in enumerate(tasks):
        yy = y2 + 96 + i * 56
        tw = tag(670, yy, t, col, ink, z + 0.05); text(s, 680 + tw, yy + 15, 28, C['ink'], z + 0.05)
        button(1100, yy - 4, 150, 40, b, kind, z + 0.05, 26)
    text('Reminders only. Tasks do not hold the week.', 670, y2 + 318, 24, C['muted'], z + 0.05)
    z = window(1296, y2, 600, 340, 'Next show', ('Wednesday', '2 left this week'))
    cut(rrect(1316, y2 + 92, 440, 46, 3), C['black'], z + 0.05, 0.12, 0.12)
    text('WEDNESDAY NIGHT FOLIO', 1536, y2 + 115, 34, C['yellow'], z + 0.2, 'CENTER', glow=2.2)
    cut(rrect(1770, y2 + 88, 104, 80, 4), C['cream2'], z + 0.05, 0.15, 0.15)   # a small ring cut from card
    cut(rrect(1782, y2 + 124, 80, 30), C['red'], z + 0.2, 0.12, 0.1); cut(rrect(1782, y2 + 112, 80, 14), C['white'], z + 0.32, 0.1, 0.1)
    for yy in (y2 + 100, y2 + 108): cut(rrect(1778, yy, 88, 3), C['white'], z + 0.44, 0.04, 0.03)
    text('The crowd expects a strong show:', 1316, y2 + 168, 28, C['ink'], z + 0.05); text('matches of **** or better.', 1316, y2 + 200, 28, C['ink'], z + 0.05)
    text('Next: a promise is due', 1316, y2 + 238, 28, C['dgreen'], z + 0.05)
    button(1316, y2 + 268, 180, 44, 'Backstage', 'navy', z + 0.05); button(1510, y2 + 268, 200, 44, 'Book the show', 'go', z + 0.05)
    button(1724, y2 + 268, 150, 44, 'The week', 'less', z + 0.05)
    # the bottom line as a control strip: a row of tiles with a rounded end, then the SPACE key
    cut(rrect(0, 1026, W, 54), C['navy'], 1.0, 0.3, 0.25); cut(rrect(0, 1024, W, 3), C['black'], 1.0, 0.32, 0.1)
    tiles = [('Cash $5.3M', '+', 196), ('Pop 72.0', '', 150), ('Owner 73', '+11', 196)]
    tx = 10
    for s_, up, tw in tiles:
        cut(rrect(tx, 1032, tw, 42, 3), C['black'], 1.2, 0.12, 0.08); cut(rrect(tx + 2, 1034, tw - 4, 38, 2), C['cream'], 1.32, 0.12, 0.08)
        text(s_, tx + 14, 1053, 30, C['ink'], 1.46)
        if up: text(up, tx + tw - 12, 1053, 28, C['green'], 1.46, 'RIGHT')
        tx += tw + 4
    cut(rrect(tx, 1032, 30, 42, 15), C['black'], 1.2, 0.12, 0.08); cut(rrect(tx + 2, 1034, 24, 38, 12), C['cream2'], 1.32, 0.12, 0.08)   # the strip's end
    for i, (k, s_) in enumerate([('F1', 'Help'), ('F2', 'Options'), ('F3', 'Music')]):
        xx = 1010 + i * 170; cut(rrect(xx, 1034, 44, 38, 3), C['black'], 1.3, 0.15, 0.1); text(k, xx + 22, 1053, 26, C['white'], 1.45, 'CENTER')
        button(xx + 48, 1034, 108, 38, s_, 'less', 1.3, 26)
    cut(rrect(1530, 1032, 110, 42, 3), C['black'], 1.3, 0.2, 0.1); text('SPACE', 1585, 1053, 28, C['white'], 1.5, 'CENTER')
    button(1646, 1030, 256, 46, 'BOOK THE SHOW', 'gold', 1.3, 30)

def render():
    global FONT
    bpy.ops.wm.read_factory_settings(use_empty=True)
    from fontTools.ttLib import TTFont
    f = TTFont(os.path.join(ROOT, 'app', 'node_modules', '@fontsource', 'vt323', 'files', 'vt323-latin-400-normal.woff2')); f.flavor = None
    ttf = os.path.join(tempfile.gettempdir(), 'ewf-vt323.ttf'); f.save(ttf); FONT = bpy.data.fonts.load(ttf)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'Medium High Contrast'; sc.view_settings.exposure = 0.0
    w = bpy.data.worlds.new('w'); sc.world = w
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.55, 0.58, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.32
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.4; sun.angle = math.radians(3)
    so = bpy.data.objects.new('sun', sun); bpy.context.collection.objects.link(so); so.rotation_euler = Euler((math.radians(24), math.radians(-22), 0))
    zoom = float(os.environ.get('ZOOM', 1)); cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = W / 10.0 / zoom
    co = bpy.data.objects.new('cam', cam); bpy.context.collection.objects.link(co); sc.camera = co; co.location = (*P(float(os.environ.get('CX', W / 2)), float(os.environ.get('CY', H / 2))), 60)
    desk()
    os.makedirs(OUT, exist_ok=True); sc.render.filepath = os.path.join(OUT, os.environ.get('PN', 'desk') + '.png')
    bpy.ops.render.render(write_still=True); print('saved desk')

if __name__ == '__main__':
    render()
