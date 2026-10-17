"""Construction paper portraits: a concept sheet (Ryan, 17 October: construction paper, replacing the pixel faces).

A portrait is a stack of shapes cut from coloured card: the background card, the shoulders, the neck, the ears, the
head, a darker piece for the shade on one cheek, then the features, the hair and anything worn on top. Each piece
is a thin slab with a hand-cut edge, a little raised from the one under it, so the light leaves a soft shadow
round every piece. The cut edge shows the paler core of the card, and the face of the card has a fibre texture.

Every person here is made up. Run with Blender's Python (bpy), from the repo root:
    python tools/creator/paper-concept.py          # docs/mockups/paper/portraits-1.png
"""
import math, os, random
import bpy, bmesh
from mathutils import Vector, Euler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'docs', 'mockups', 'paper')
W, H, SAMPLES = int(os.environ.get('PW', 1680)), int(os.environ.get('PH', 560)), int(os.environ.get('PS', 32))
T = 0.035          # how thick a sheet of card is
GAP = 0.03        # how far each layer sits above the one under it

# ---------------------------------------------------------------- the card
PAL = {   # construction paper colours: strong, a little chalky
    'blue': (0.06, 0.22, 0.55), 'sky': (0.25, 0.55, 0.85), 'maroon': (0.42, 0.04, 0.06), 'red': (0.78, 0.08, 0.06),
    'grey': (0.38, 0.38, 0.4), 'black': (0.025, 0.025, 0.03), 'white': (0.92, 0.9, 0.84), 'gold': (0.95, 0.66, 0.08),
    'yellow': (0.98, 0.84, 0.18), 'green': (0.1, 0.45, 0.18), 'purple': (0.32, 0.1, 0.45), 'orange': (0.95, 0.38, 0.06),
    'pink': (0.95, 0.45, 0.55), 'teal': (0.05, 0.45, 0.45), 'brown': (0.28, 0.14, 0.06), 'cream': (0.95, 0.88, 0.7),
}
SKIN = [(0.93, 0.74, 0.6), (0.85, 0.6, 0.44), (0.72, 0.47, 0.3), (0.55, 0.33, 0.2), (0.38, 0.22, 0.13), (0.24, 0.14, 0.09)]
_mats = {}

def card(color, name=None):
    """A sheet of construction paper: matte, a fibre texture in the colour and the bump, and a paler core on the cut edge."""
    key = tuple(round(c, 3) for c in color)
    if key in _mats: return _mats[key]
    out = []
    for core in (False, True):
        m = bpy.data.materials.new((name or 'card') + ('_core' if core else ''))
        nt = m.node_tree; b = nt.nodes['Principled BSDF']
        c = tuple(x + (1 - x) * 0.32 for x in color) if core else color
        b.inputs['Roughness'].default_value = 0.95; b.inputs['Specular IOR Level'].default_value = 0.15
        tc = nt.nodes.new('ShaderNodeTexCoord')
        fib = nt.nodes.new('ShaderNodeTexNoise'); fib.inputs['Scale'].default_value = 140; fib.inputs['Detail'].default_value = 15; fib.inputs['Roughness'].default_value = 0.7
        nt.links.new(tc.outputs['Object'], fib.inputs['Vector'])
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 0.6
        mix.inputs['A'].default_value = (*c, 1)
        rmp = nt.nodes.new('ShaderNodeValToRGB'); rmp.color_ramp.elements[0].position = 0.35; rmp.color_ramp.elements[1].position = 0.65; rmp.color_ramp.elements[0].color = (0.8, 0.8, 0.8, 1); rmp.color_ramp.elements[1].color = (1, 1, 1, 1)
        nt.links.new(fib.outputs['Fac'], rmp.inputs['Fac']); nt.links.new(rmp.outputs['Color'], mix.inputs['B'])
        nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
        bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.5; bump.inputs['Distance'].default_value = 0.01
        nt.links.new(fib.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
        out.append(m)
    _mats[key] = out
    return out

# ---------------------------------------------------------------- shapes (lists of points, in portrait units)
def ell(cx, cy, rx, ry, n=36, a0=0.0, a1=2 * math.pi):
    return [(cx + rx * math.cos(a0 + (a1 - a0) * i / n), cy + ry * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n)]

def head_at(t, rx, ryt, ryb, sq, chin):
    """A point on the outline of a head. The top is round; the jaw goes from round (sq 2) to square (sq 4) and
    narrows to the chin by `chin`."""
    c, s = math.cos(t), math.sin(t)
    if s >= 0: return rx * c, ryt * s
    e = 2.0 / sq; x = rx * math.copysign(abs(c) ** e, c) * (1 - chin * s * s); y = ryb * math.copysign(abs(s) ** e, s)
    return x, y

def head_poly(h, k=1.0, t0=0.0, t1=2 * math.pi, n=48, dy=0.0):
    return [(h['cx'] + k * x, h['cy'] + dy + k * y) for x, y in (head_at(t0 + (t1 - t0) * i / n, h['rx'], h['ryt'], h['ryb'], h['sq'], h['chin']) for i in range(n + 1))]

def star(cx, cy, r, n=5, inner=0.45, rot=math.pi / 2):
    return [(cx + (r if i % 2 == 0 else r * inner) * math.cos(rot + i * math.pi / n), cy + (r if i % 2 == 0 else r * inner) * math.sin(rot + i * math.pi / n)) for i in range(2 * n)]

def almond(cx, cy, w, h, tilt=0.0, n=14):
    pts = [(-w / 2 + w * i / n, h * math.sin(math.pi * i / n)) for i in range(n + 1)] + [(w / 2 - w * i / n, -0.55 * h * math.sin(math.pi * i / n)) for i in range(1, n)]
    c, s = math.cos(tilt), math.sin(tilt)
    return [(cx + x * c - y * s, cy + x * s + y * c) for x, y in pts]

def strip(a, b, w0, w1, bow=0.0, n=10):
    """A tapered strip from a to b (a brow, a strap), bowed up by `bow`."""
    ax, ay = a; bx, by = b; dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy); nx, ny = -dy / L, dx / L
    top, bot = [], []
    for i in range(n + 1):
        t = i / n; w = (w0 + (w1 - w0) * t) / 2; bw = bow * math.sin(math.pi * t)
        px, py = ax + dx * t + nx * bw, ay + dy * t + ny * bw
        top.append((px + nx * w, py + ny * w)); bot.append((px - nx * w, py - ny * w))
    return top + bot[::-1]

def mirror(poly, cx):
    return [(2 * cx - x, y) for x, y in poly][::-1]

def scissor(poly, rnd, amt=0.012, step=0.09):
    """A hand cut: the outline is cut in short straight snips, each a little off the line."""
    out = []
    for i in range(len(poly)):
        a, b = Vector(poly[i]), Vector(poly[(i + 1) % len(poly)]); n = max(1, int((b - a).length / step))
        for k in range(n):
            p = a.lerp(b, k / n); out.append((p.x + rnd.uniform(-amt, amt), p.y + rnd.uniform(-amt, amt)))
    return out

# ---------------------------------------------------------------- one piece of card
class Portrait:
    def __init__(self, ox, seed):
        self.ox, self.z, self.rnd = ox, 0.0, random.Random(seed)

    def cut(self, poly, color, lift=GAP, rough=0.012, turn=0.6):
        """Cut a piece from `poly` and stick it on top of everything so far."""
        self.z += lift
        poly = scissor(poly, self.rnd, rough)
        bm = bmesh.new(); vs = [bm.verts.new((x, y, 0)) for x, y in poly]
        try: f = bm.faces.new(vs)
        except ValueError: bm.free(); return
        r = bmesh.ops.extrude_face_region(bm, geom=[f]); top = [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, vec=(0, 0, T), verts=top)
        for fc in bm.faces: fc.material_index = 0 if abs(fc.normal.z) > 0.9 else 1
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new('piece'); bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new('piece', me); bpy.context.collection.objects.link(o)
        for m in card(color): me.materials.append(m)
        cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
        # a hand-placed piece is never quite square: a small turn about its own middle
        a = math.radians(self.rnd.uniform(-turn, turn))
        o.location = (self.ox + cx - (cx * math.cos(a) - cy * math.sin(a)), cy - (cx * math.sin(a) + cy * math.cos(a)), self.z)
        o.rotation_euler = (0, 0, a)
        o.location.x += 0; me.transform(__import__('mathutils').Matrix.Translation((0, 0, 0)))
        return o

    def same_layer(self):
        self.z -= GAP   # the next piece goes on the same layer as the last (two eyes, two ears)

# ---------------------------------------------------------------- a wrestler, from a recipe
def wrestler(ox, r, seed):
    P = Portrait(ox, seed); sk = r['skin']; dark = tuple(c * 0.72 for c in sk); deep = tuple(c * 0.5 for c in sk)
    h = dict(cx=0.0, cy=0.55, rx=r.get('rx', 1.18), ryt=1.42, ryb=r.get('ryb', 1.62), sq=r.get('sq', 2.6), chin=r.get('chin', 0.25))
    # the background: two cards, the second a little smaller and turned, in the wrestler's side colour
    P.cut([(-2.45, -3.0), (2.45, -3.0), (2.45, 3.05), (-2.45, 3.05)], PAL[r['bg2']], 0, 0.02, 0.3)
    P.cut([(-2.25, -2.85), (2.25, -2.85), (2.25, 2.88), (-2.25, 2.88)], PAL[r['bg']], GAP, 0.02, 1.2)
    for s in r.get('bgstars', []): P.cut(star(*s), PAL[r.get('starcol', 'gold')], 0.01); P.same_layer()
    P.z += GAP
    if r.get('long'):   # long hair falls behind the head and shoulders
        P.cut(head_poly(h, 1.18, -0.25, math.pi + 0.25, dy=0.05) + [(-1.55, -1.7), (-1.0, -2.1), (1.0, -2.1), (1.55, -1.7)], PAL[r['hair']] if r['hair'] in PAL else r['hair'])
    sw = r.get('shoulders', 2.15)
    P.cut([(-sw, -2.85), (sw, -2.85), (sw * 0.98, -2.05), (sw * 0.8, -1.62), (0.5, -1.3), (-0.5, -1.3), (-sw * 0.8, -1.62), (-sw * 0.98, -2.05)], sk)
    if r.get('gear'):  # a singlet or a vest across the chest
        g = PAL[r['gear']]
        P.cut([(-sw * 0.62, -2.86), (sw * 0.62, -2.86), (sw * 0.55, -2.2), (0.42, -1.95), (0.0, -2.35), (-0.42, -1.95), (-sw * 0.55, -2.2)], g)
        P.same_layer(); P.cut(strip((-0.85, -1.58), (-0.6, -2.3), 0.28, 0.32), g); P.same_layer(); P.cut(strip((0.85, -1.58), (0.6, -2.3), 0.28, 0.32), g)
    nw = r.get('neck', 0.62)
    P.cut([(-nw, -1.7), (nw, -1.7), (nw * 0.92, -0.4), (-nw * 0.92, -0.4)], dark)
    for s in (-1, 1):   # the ears; a cauliflower ear is a lumpy one
        er = 0.24 if s < 0 or not r.get('cauli') else 0.3
        P.cut(ell(h['cx'] + s * h['rx'] * 0.96, h['cy'] - 0.05, er, er * 1.5, 18), sk, rough=0.03 if r.get('cauli') and s > 0 else 0.012)
        P.same_layer()
    P.z += GAP
    P.cut(head_poly(h), sk)
    if r.get('mask'):
        m = r['mask']; P.cut(head_poly(h, 1.03), PAL[m['base']])
        P.cut(head_poly(h, 0.98, math.pi + 0.55, 2 * math.pi - 0.55, dy=-0.02) , sk)   # the mouth and chin left open
        for s in (-1, 1):   # flames round the eyes
            fl = [(s * 0.1, 0.95), (s * 0.95, 1.05), (s * 1.12, 1.45), (s * 0.85, 1.25), (s * 1.0, 1.75), (s * 0.6, 1.3), (s * 0.55, 1.6), (s * 0.3, 1.15)]
            fl = [(x, y - 0.25) for x, y in fl]
            P.cut(fl if s > 0 else fl[::-1], PAL[m['trim']]); P.same_layer()
        P.z += GAP
        P.cut(strip((0, h['cy'] + h['ryt'] * 0.98), (0, h['cy'] - 0.05), 0.2, 0.08), PAL[m['trim']])   # the stripe down the middle
    else:
        # the shade: a darker piece down one side of the face
        P.cut(head_poly(h, 1.0, -1.25, 1.1) + [(x - 0.12, y) for x, y in head_poly(h, 0.86, 1.1, -1.25, dy=-0.02)], dark, rough=0.01)
    hl = h['cy'] + 0.28   # eye line
    if r.get('paint') == 'stripe':   # face paint: a band across the eyes
        P.cut([(-1.22, hl - 0.18), (1.22, hl - 0.25), (1.2, hl + 0.3), (-1.2, hl + 0.32)], PAL[r['paintcol']])
    for s in (-1, 1):   # the eyes: white, iris, pupil, and a punched dot of light
        cx = s * r.get('eyegap', 0.46)
        P.cut(almond(cx, hl, 0.48, r.get('eyeh', 0.2), s * r.get('eyetilt', 0.0)), PAL['white'], rough=0.006); P.same_layer()
    P.z += GAP
    for s in (-1, 1):
        cx = s * r.get('eyegap', 0.46); P.cut(ell(cx + 0.02, hl + 0.02, 0.11, 0.11, 16), PAL[r.get('eyes', 'brown')] if r.get('eyes') in PAL else (0.25, 0.14, 0.06), rough=0.004); P.same_layer()
    P.z += GAP
    for s in (-1, 1):
        cx = s * r.get('eyegap', 0.46); P.cut(ell(cx + 0.02, hl + 0.02, 0.055, 0.055, 12), PAL['black'], rough=0.003); P.same_layer()
    P.z += GAP
    for s in (-1, 1):
        cx = s * r.get('eyegap', 0.46); P.cut(ell(cx + 0.06, hl + 0.07, 0.025, 0.025, 8), PAL['white'], rough=0.002); P.same_layer()
    P.z += GAP
    if r.get('brow', 0.13) > 0:   # brows
        bw = r.get('brow', 0.13); ang = r.get('browang', 0.0)
        for s in (-1, 1):
            a = (s * 0.18, hl + 0.3 - ang * 0.5); b = (s * 0.78, hl + 0.33 + ang * 0.5)
            P.cut(strip(a, b, bw, bw * 0.55, 0.05), PAL[r['browcol']] if r.get('browcol') in PAL else r.get('browcol', PAL['black'])); P.same_layer()
        P.z += GAP
    # the nose: a darker piece and two nostrils
    nl = r.get('nose', 0.62); nb = r.get('nosew', 0.42); bend = r.get('bent', 0.0)
    P.cut([(-0.08 + bend * 0.3, hl - 0.05), (0.08 + bend * 0.3, hl - 0.05), (nb / 2 + bend, hl - nl), (bend, hl - nl - 0.1), (-nb / 2 + bend, hl - nl)], dark, rough=0.008)
    for s in (-1, 1): P.cut(ell(s * nb * 0.28 + bend, hl - nl + 0.02, 0.07, 0.04, 10), deep, rough=0.004); P.same_layer()
    P.z += GAP
    my = hl - nl - 0.42
    if r.get('beard'):
        bc = PAL[r['beard']] if r['beard'] in PAL else r['beard']
        b_out = head_poly(h, 1.04, math.pi + 0.05, 2 * math.pi - 0.05)
        b_in = [(x * 0.72, my + 0.1 + (y - my) * 0.15) for x, y in head_poly(h, 1.0, 2 * math.pi - 0.3, math.pi + 0.3)]
        if r.get('beardlen'): b_out = [(x, y - r['beardlen'] * max(0, -(y - h['cy'])) / h['ryb']) for x, y in b_out]
        P.cut(b_out + b_in, bc, rough=0.03)
    # the mouth
    mw = r.get('mouthw', 0.62)
    P.cut(almond(0, my, mw, 0.1 if not r.get('shout') else 0.32, 0), deep if not r.get('shout') else PAL['black'], rough=0.006)
    if r.get('mustache'):
        mc = PAL[r['mustache']] if r['mustache'] in PAL else r['mustache']
        P.cut([(-0.08, my + 0.25), (0.08, my + 0.25), (0.55, my + 0.08), (0.62, my - 0.35), (0.48, my - 0.1), (0.0, my + 0.08), (-0.48, my - 0.1), (-0.62, my - 0.35), (-0.55, my + 0.08)], mc, rough=0.02)
    for (fx, fy) in r.get('freckles', []):
        P.cut(ell(fx, fy, 0.03, 0.03, 8), deep, 0.0, 0.002);
    if r.get('paint') == 'star':
        P.cut(star(0.62, hl - 0.38, 0.24, inner=0.42), PAL[r['paintcol']], rough=0.004)
    # hair on top
    hc = PAL[r['hair']] if r.get('hair') in PAL else r.get('hair')
    style = r.get('hairstyle')
    if style == 'mohawk':
        P.cut(head_poly(h, 1.005, 0.35, math.pi - 0.35) + head_poly(h, 0.96, math.pi - 0.45, 0.45, dy=-0.12), (0.2, 0.18, 0.18), 0.02, 0.02)   # shaved sides
        fin = [(-0.24, h['cy'] + 0.95)] + [(-0.24 + 0.48 * i / 8, h['cy'] + h['ryt'] + 0.55 + (0.3 if i % 2 == 0 else 0.0) - abs(i - 4) * 0.08) for i in range(9)] + [(0.24, h['cy'] + 0.95)]
        P.cut(fin, hc, rough=0.015)
    elif style in ('cap', 'curls', 'long'):
        top = head_poly(h, 1.07, -0.12, math.pi + 0.12, 32)
        fringe = []
        for i in range(13):
            t = i / 12; x = -h['rx'] * 0.98 + 2 * h['rx'] * 0.98 * t
            y = h['cy'] + h['ryt'] * (0.42 + 0.18 * math.sin(math.pi * t)) - (0.12 if i % 2 else 0.0) * (style != 'cap')
            fringe.append((x, y))
        P.cut(top + fringe[::-1], hc, rough=0.02 if style != 'curls' else 0.05)
        if style == 'curls':
            for i in range(9):
                a = math.pi * (0.08 + 0.84 * i / 8); P.cut(ell(h['rx'] * 1.05 * math.cos(a), h['cy'] + h['ryt'] * 1.05 * math.sin(a), 0.3, 0.3, 14), hc, 0.0, 0.03)
    elif style == 'pony':
        P.cut(head_poly(h, 1.05, -0.05, math.pi + 0.05, 32) + [(h['rx'] * 0.95 - 2 * h['rx'] * 0.95 * i / 10, h['cy'] + h['ryt'] * 0.55 + 0.08 * math.sin(math.pi * i / 10)) for i in range(11)][::-1], hc, rough=0.02)
        P.cut(ell(0.2, h['cy'] + h['ryt'] + 0.42, 0.4, 0.34, 20), hc, rough=0.04)   # the puff on top
        P.cut(ell(0.0, h['cy'] + h['ryt'] + 0.08, 0.3, 0.08, 12), PAL[r.get('tie', 'pink')])
    if r.get('earring'):
        P.cut(ell(-h['rx'] * 0.98, h['cy'] - 0.45, 0.08, 0.08, 12), PAL['gold']); P.same_layer(); P.cut(ell(h['rx'] * 0.98, h['cy'] - 0.45, 0.08, 0.08, 12), PAL['gold'])
    if r.get('headband'):
        P.cut(strip((-h['rx'] * 1.06, h['cy'] + 0.8), (h['rx'] * 1.06, h['cy'] + 0.8), 0.24, 0.24, 0.12), PAL[r['headband']])
    # the name on a strip of card along the bottom
    P.cut([(-1.9, -2.72), (1.9, -2.75), (1.9, -2.25), (-1.9, -2.22)], PAL['white'], GAP, 0.01, 1.5)
    cu = bpy.data.curves.new('name', 'FONT'); cu.body = r['name']; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.size = 0.36; cu.extrude = 0.008
    o = bpy.data.objects.new('name', cu); bpy.context.collection.objects.link(o); o.location = (ox, -2.49, P.z + T + 0.01)
    cu.materials.append(card(PAL['black'])[0])

# ---------------------------------------------------------------- four made-up wrestlers
CAST = [
    dict(name='BIG RUFUS', bg='maroon', bg2='black', skin=SKIN[3], sq=4.0, chin=0.05, rx=1.3, ryb=1.55, neck=0.95, shoulders=2.3, cauli=True,
         beard='black', beardlen=0.25, browcol='black', brow=0.2, browang=-0.18, nose=0.6, nosew=0.6, bent=0.08, eyeh=0.15, mouthw=0.5, gear='black'),
    dict(name='EL COMETA', bg='blue', bg2='gold', skin=SKIN[2], mask=dict(base='gold', trim='red'), browcol='red', brow=0.0, eyeh=0.24, eyetilt=0.12,
         nose=0.55, nosew=0.4, mouthw=0.55, shout=True, gear='red', bgstars=[(-1.75, 2.3, 0.25), (1.8, 1.9, 0.18), (-1.9, -0.6, 0.15)]),
    dict(name='PUNK DEVLIN', bg='grey', bg2='green', skin=SKIN[0], hair='orange', hairstyle='mohawk', browcol='orange', brow=0.1, browang=0.1,
         mustache='orange', beard='orange', beardlen=0.0, freckles=[(-0.62, 0.4), (-0.5, 0.33), (-0.7, 0.28), (0.55, 0.36), (0.66, 0.3), (0.5, 0.27)],
         nose=0.5, nosew=0.36, chin=0.3, sq=2.2, rx=1.1, earring=True),
    dict(name='NOVA REIGN', bg='purple', bg2='teal', skin=SKIN[4], hair='black', hairstyle='pony', tie='yellow', browcol='black', brow=0.09, browang=0.12,
         eyeh=0.21, eyetilt=0.1, nose=0.48, nosew=0.42, mouthw=0.5, chin=0.4, sq=2.0, rx=1.08, ryb=1.5, neck=0.5, shoulders=1.85,
         paint='star', paintcol='yellow', earring=True, gear='teal'),
]

def render():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = W, H
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'Medium High Contrast'
    w = bpy.data.worlds.new('w'); sc.world = w
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.5, 0.5, 0.52, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    # the table the cards lie on
    me = bpy.data.meshes.new('table'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=30); bm.to_mesh(me); bm.free()
    t = bpy.data.objects.new('table', me); bpy.context.collection.objects.link(t); t.location.z = -0.05; me.materials.append(card((0.62, 0.55, 0.45))[0])
    for i, r in enumerate(CAST): wrestler((i - 1.5) * 5.4, r, 11 + i)
    # light from the upper left, low enough to throw a shadow under every piece
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 2.7; sun.angle = math.radians(6)
    so = bpy.data.objects.new('sun', sun); bpy.context.collection.objects.link(so); so.rotation_euler = Euler((math.radians(22), math.radians(-18), 0))
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = float(os.environ.get('PZ', 22.2))
    co = bpy.data.objects.new('cam', cam); bpy.context.collection.objects.link(co); sc.camera = co
    co.location = (float(os.environ.get('PX', 0.6)), float(os.environ.get('PY', -2.2)), 30); co.rotation_euler = Euler((math.radians(4), math.radians(1), 0))
    os.makedirs(OUT, exist_ok=True); sc.render.filepath = os.path.join(OUT, os.environ.get('PN', 'portraits-1') + '.png')
    bpy.ops.render.render(write_still=True)
    print('saved', sc.render.filepath)

if __name__ == '__main__':
    render()
