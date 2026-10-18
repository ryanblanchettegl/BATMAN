"""Construction paper wrestlers, full body: a concept (Ryan, 17 October).

A wrestler is a paper doll: each part of the body is its own piece of card, joined to the next by a brass split
pin, the way a cut-out puppet is made. The pieces are cut from the wrestler's recipe (height, build, skin, gear,
face), so one set of poses fits anybody. A scene is a backdrop and a list of poses; the two people in it are
whoever is on the card.

Renders, into docs/mockups/paper/:
    body-<name>.png      a wrestler standing against the height chart, as in Create a wrestler
    body-parts.png       the same body taken apart: the pieces and the pins
    scene-lockup-1..3    the opening lock-up, three keyframes
    scene-cover-1..3     the cover, the count and the kick-out, three keyframes
Run with Blender's Python (bpy), from the repo root:  python tools/creator/paper-puppets.py
Then  python tools/creator/paper-frames.py  puts them in the game's grey windows.
Everybody here is made up.
"""
import importlib.util, math, os, random, sys
import bpy, bmesh
from mathutils import Euler

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('pc', os.path.join(HERE, 'paper-concept.py')); pc = importlib.util.module_from_spec(spec); spec.loader.exec_module(pc)
PAL, SKIN, card, ell, head_poly, strip, almond, star, scissor = pc.PAL, pc.SKIN, pc.card, pc.ell, pc.head_poly, pc.strip, pc.almond, pc.star, pc.scissor
OUT = pc.OUT
SAMPLES = int(os.environ.get('PS', 32))
T = 0.03

# ---------------------------------------------------------------- one piece of card at a given height
def piece(poly, color, z, rnd, rough=0.012):
    poly = scissor(poly, rnd, rough, 0.08)
    bm = bmesh.new(); vs = [bm.verts.new((x, y, 0)) for x, y in poly]
    try: f = bm.faces.new(vs)
    except ValueError: bm.free(); return
    r = bmesh.ops.extrude_face_region(bm, geom=[f]); top = [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, T), verts=top)
    for fc in bm.faces: fc.material_index = 0 if abs(fc.normal.z) > 0.9 else 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('p'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('p', me); bpy.context.collection.objects.link(o); o.location.z = z
    for m in card(color): me.materials.append(m)
    return o

def text(s, x, y, z, size, color=PAL['black'], align='CENTER'):
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = s; cu.align_x = align; cu.align_y = 'CENTER'; cu.size = size; cu.extrude = 0.01
    o = bpy.data.objects.new('t', cu); bpy.context.collection.objects.link(o); o.location = (x, y, z); cu.materials.append(card(color)[0])

def pin(x, y, z, rnd, s=0.07):
    """A brass split pin through a joint."""
    piece(ell(x, y, s, s, 12), (0.86, 0.64, 0.22), z, rnd, 0.002)
    piece(ell(x - s * 0.3, y + s * 0.3, s * 0.35, s * 0.35, 8), (1.0, 0.9, 0.55), z + 0.01, rnd, 0.001)

# ---------------------------------------------------------------- 2D joints
def rot(p, a):
    c, s = math.cos(a), math.sin(a); return (p[0] * c - p[1] * s, p[0] * s + p[1] * c)

class Frame:
    """Where a piece's joint is in the world and which way it points."""
    def __init__(self, x, y, a, face, rootx): self.x, self.y, self.a, self.face, self.rootx = x, y, a, face, rootx
    def child(self, off, ang, e=1.0):
        dx, dy = rot((off[0] * e, off[1] * e), self.a); return Frame(self.x + dx, self.y + dy, self.a + math.radians(ang), self.face, self.rootx)
    def world(self, poly):
        out = []
        for p in poly:
            dx, dy = rot(p, self.a); x = self.x + dx; y = self.y + dy
            if self.face < 0: x = 2 * self.rootx - x
            out.append((x, y))
        return out
    def at(self, p=(0, 0)):
        return self.world([p])[0]

# ---------------------------------------------------------------- a wrestler as a paper doll
def taper(w0, w1, L, cap=True):
    """A limb piece: the joint at the top (0, 0), the next joint at (0, -L)."""
    pts = [(w0 / 2, 0.0), (w1 / 2, -L), (-w1 / 2, -L), (-w0 / 2, 0.0)]
    if cap:
        pts = [(w1 / 2 * math.cos(-math.pi * i / 8), -L + w1 / 2 * math.sin(-math.pi * i / 8)) for i in range(9)] + \
              [(-w0 / 2 * math.cos(math.pi * i / 8), w0 / 2 * math.sin(math.pi * i / 8)) for i in range(9)]
    return pts

STAND = dict(torso=0, head=0, sh_n=10, el_n=5, wr_n=0, sh_f=-10, el_f=-5, wr_f=0, hip_n=-4, kn_n=0, an_n=4, hip_f=4, kn_f=0, an_f=-4)

def puppet(r, x, y, z0, face=1, pose=None, rot0=0.0, seed=1, explode=1.0, expr=None):
    """Cut and pin a wrestler. (x, y) is the waist; `face` 1 looks right, -1 left; `pose` is angles in degrees."""
    rnd = random.Random(seed); P = dict(STAND); P.update(pose or {})
    h, w = r.get('h', 1.0), r.get('w', 1.0); sk = r['skin']; dk = tuple(c * 0.74 for c in sk)
    gear, gear2 = PAL[r.get('gear', 'black')], PAL[r.get('gear2', r.get('gear', 'black'))]
    shirt = PAL[r['shirt']] if r.get('shirt') else None; pants = PAL[r['pants']] if r.get('pants') else None
    root = Frame(x, y, math.radians(rot0), face, x); e = explode
    L = dict(up=1.0 * h, fore=0.92 * h, thigh=1.3 * h, shin=1.22 * h, torso=1.95 * h)
    pins = []
    def arm(side, z):
        sh = root.child((0, 0), P['torso'], e).child(((0.74 if side == 'n' else -0.74) * w, L['torso'] - 0.12), P['sh_' + side], e)
        col = shirt if r.get('sleeves') and shirt else sk
        piece(sh.world(taper(0.46 * w, 0.36 * w, L['up'])), col, z, rnd); pins.append((sh.at(), z + T))
        piece(sh.world(ell(0, -0.08, 0.27 * w, 0.32 * w, 16)), col, z + 0.02, rnd)   # the shoulder
        el = sh.child((0, -L['up']), P['el_' + side], e)
        piece(el.world(taper(0.36 * w, 0.29 * w, L['fore'])), sk, z + 0.04, rnd); pins.append((el.at(), z + 0.04 + T))
        if r.get('tape', True): piece(el.world([(-0.17 * w, -L['fore'] + 0.25), (0.17 * w, -L['fore'] + 0.25), (0.16 * w, -L['fore'] + 0.02), (-0.16 * w, -L['fore'] + 0.02)]), PAL['white'], z + 0.06, rnd, 0.006)
        wr = el.child((0, -L['fore']), P['wr_' + side], e)
        piece(wr.world(ell(0.02, -0.17, 0.17 * w, 0.22, 14)), sk, z + 0.08, rnd)
    def leg(side, z):
        hp = root.child(((0.32 if side == 'n' else -0.32) * w, -0.42), P['hip_' + side], e)
        col = pants or sk
        piece(hp.world(taper(0.66 * w, 0.46 * w, L['thigh'])), col, z, rnd); pins.append((hp.at(), z + T))
        kn = hp.child((0, -L['thigh']), P['kn_' + side], e)
        piece(kn.world(taper(0.47 * w, 0.36 * w, L['shin'])), pants or sk, z + 0.03, rnd); pins.append((kn.at(), z + 0.03 + T))
        if not pants:
            piece(kn.world(ell(0, -0.05, 0.21 * w, 0.24 * w, 16)), gear2, z + 0.05, rnd)                                       # knee pad
            piece(kn.world([(-0.2 * w, -L['shin'] * 0.42), (0.2 * w, -L['shin'] * 0.42), (0.19 * w, -L['shin'] + 0.05), (-0.19 * w, -L['shin'] + 0.05)]), gear, z + 0.05, rnd)   # boot top
        an = kn.child((0, -L['shin']), P['an_' + side], e)
        piece(an.world([(-0.22 * w, 0.12), (0.2 * w, 0.12), (0.24 * w, -0.12), (0.55 * w, -0.14), (0.58 * w, -0.3), (-0.24 * w, -0.3)]), PAL['black'] if pants else gear, z + 0.07, rnd)
    # back to front: far arm, far leg, near leg, trunks, body, head, near arm
    arm('f', z0); leg('f', z0 + 0.12); leg('n', z0 + 0.24)
    tf = root.child((0, 0), 0, e)
    piece(tf.world([(-0.62 * w, 0.06), (0.62 * w, 0.06), (0.66 * w, -0.5), (0.1 * w, -0.62), (-0.1 * w, -0.62), (-0.66 * w, -0.5)]), pants or gear, z0 + 0.36, rnd)
    to = root.child((0, 0), P['torso'], e); pins.append((to.at(), z0 + 0.52 + T))
    bw, belly = w, r.get('belly', 0.0)
    body = [(-0.58 * bw - belly, 0.0), (0.58 * bw + belly, 0.0), (0.68 * bw + belly * 0.8, 0.55), (0.86 * bw, 1.45 * h), (0.74 * bw, 1.86 * h), (0.28, 1.98 * h), (-0.28, 1.98 * h), (-0.74 * bw, 1.86 * h), (-0.86 * bw, 1.45 * h), (-0.68 * bw - belly * 0.8, 0.55)]
    piece(to.world(body), shirt or sk, z0 + 0.42, rnd)
    if not shirt:   # the shade under the chest and down one side
        piece(to.world([(0.05, 1.2 * h), (0.75 * bw, 1.25 * h), (0.6 * bw, 1.05 * h), (0.1, 1.08 * h)]), dk, z0 + 0.45, rnd)
        piece(to.world([(-0.75 * bw, 1.25 * h), (-0.05, 1.2 * h), (-0.1, 1.08 * h), (-0.6 * bw, 1.05 * h)]), dk, z0 + 0.45, rnd)
        piece(to.world([(0.5 * bw + belly * 0.6, 0.1), (0.62 * bw + belly * 0.7, 0.1), (0.8 * bw, 1.4 * h), (0.68 * bw, 1.4 * h)]), dk, z0 + 0.45, rnd)
    else:
        for i in range(-2, 3):   # a referee's stripes
            sx = i * 0.3 * bw; piece(to.world([(sx - 0.07, 0.05), (sx + 0.07, 0.05), (sx * 1.25 + 0.07, 1.85 * h), (sx * 1.25 - 0.07, 1.85 * h)]), PAL['black'], z0 + 0.45, rnd, 0.004)
    if r.get('straps') and not shirt:
        for s in (-1, 1): piece(to.world([(s * 0.3 * bw, 1.95 * h), (s * 0.52 * bw, 1.9 * h), (s * 0.5 * bw, 0.0), (s * 0.22 * bw, 0.0)]), gear, z0 + 0.47, rnd)
    if r.get('belt'):
        piece(to.world([(-0.62 * bw - belly, 0.42), (0.62 * bw + belly, 0.42), (0.6 * bw + belly, 0.05), (-0.6 * bw - belly, 0.05)]), PAL['gold'], z0 + 0.48, rnd)
        piece(to.world(ell(0, 0.24, 0.32, 0.26, 18)), PAL['yellow'], z0 + 0.5, rnd)
    nk = to.child((0, 1.95 * h), P['head'], e)
    piece(nk.world([(-0.26 * w, -0.1), (0.26 * w, -0.1), (0.22 * w, 0.45), (-0.22 * w, 0.45)]), dk, z0 + 0.5, rnd)
    head(nk, r, z0 + 0.56, rnd, expr or r.get('expr'))
    arm('n', z0 + 0.95)
    for (px, py), pz in pins: pin(px, py, pz + 0.04, rnd)
    return root

def head(fr, r, z, rnd, expr):
    """The face at body size, from the same recipe as the portrait. A three-quarter turn: the features sit a little
    toward the way the wrestler faces."""
    s = 0.47; hd = dict(cx=0.0, cy=0.98, rx=r.get('rx', 1.18) * s, ryt=1.42 * s, ryb=r.get('ryb', 1.62) * s, sq=r.get('sq', 2.6), chin=r.get('chin', 0.25))
    tq = 0.09   # how far the features slide toward the front
    def put(poly, col, dz, rough=0.008): piece(fr.world(poly), col, z + dz, rnd, rough)
    sk = r['skin']; dk = tuple(c * 0.74 for c in sk); deep = tuple(c * 0.5 for c in sk)
    if r.get('hairstyle') == 'pony':
        put(ell(-0.05, hd['cy'] + hd['ryt'] + 0.12, 0.17, 0.14, 16), PAL[r['hair']], -0.02)
    put(ell(-hd['rx'] * 0.95 + tq * 0.4, hd['cy'] - 0.02, 0.09, 0.13, 12), sk, 0.0)
    put(head_poly(hd), sk, 0.02)
    if r.get('mask'):
        m = r['mask']; put(head_poly(hd, 1.04), PAL[m['base']], 0.04)
        put([(x + tq * 0.5, y) for x, y in head_poly(hd, 0.95, math.pi + 0.6, 2 * math.pi - 0.6, dy=-0.01)], sk, 0.06)
        for sd in (-1, 1):
            fl = [(sd * 0.03, 0.34), (sd * 0.34, 0.36), (sd * 0.42, 0.52), (sd * 0.3, 0.45), (sd * 0.36, 0.62), (sd * 0.2, 0.46), (sd * 0.1, 0.4)]
            fl = [(x + tq, y + hd['cy'] - 0.27) for x, y in fl]
            put(fl if sd > 0 else fl[::-1], PAL[m['trim']], 0.08)
        put(strip((tq * 0.6, hd['cy'] + hd['ryt'] * 0.98), (tq, hd['cy']), 0.07, 0.03), PAL[m['trim']], 0.08)
    else:
        put(head_poly(hd, 1.0, -1.25, 1.1) + [(x - 0.04, y) for x, y in head_poly(hd, 0.86, 1.1, -1.25, dy=-0.01)], dk, 0.04)
    ey = hd['cy'] + 0.1
    for sd in (-1, 1):
        cx = sd * 0.16 + tq
        if expr == 'hurt':
            put(strip((cx - 0.08, ey + 0.01), (cx + 0.08, ey - 0.02), 0.035, 0.03, -0.03), PAL['black'], 0.1)
        else:
            put(almond(cx, ey, 0.17, 0.075, 0), PAL['white'], 0.1, 0.003)
            put(ell(cx + 0.03, ey + 0.005, 0.038, 0.038, 10), PAL['black'], 0.12, 0.002)
        if r.get('brow', 0.1) > 0 and not r.get('mask'):
            ang = -0.05 if expr in ('shout', 'hurt') else 0.0
            put(strip((cx - 0.1 * sd, ey + 0.1 + ang * sd), (cx + 0.1 * sd, ey + 0.11 - ang * sd), 0.06, 0.035), PAL[r.get('browcol', 'black')], 0.14)
    put([(tq - 0.03, ey - 0.02), (tq + 0.03, ey - 0.02), (tq + 0.1, ey - 0.22), (tq + 0.02, ey - 0.26), (tq - 0.06, ey - 0.22)], dk, 0.13)
    my = ey - 0.36
    if r.get('beard'):
        bo = head_poly(hd, 1.05, math.pi + 0.05, 2 * math.pi - 0.05); bo = [(x, y - 0.08 * max(0, -(y - hd['cy'])) / hd['ryb']) for x, y in bo]
        bi = [(x * 0.7 + tq, my + 0.04 + (y - my) * 0.12) for x, y in head_poly(hd, 1.0, 2 * math.pi - 0.3, math.pi + 0.3)]
        put(bo + bi, PAL[r['beard']], 0.15, 0.02)
    open_ = expr in ('shout', 'hurt')
    put(almond(tq, my, 0.2 if not open_ else 0.17, 0.035 if not open_ else 0.11, 0), PAL['black'] if open_ else ((0.55, 0.2, 0.18) if r.get('beard') else deep), 0.17, 0.004)
    if r.get('hairstyle') == 'mohawk':
        fin = [(-0.08, hd['cy'] + 0.3)] + [(-0.08 + 0.16 * i / 6, hd['cy'] + hd['ryt'] + 0.2 + (0.1 if i % 2 == 0 else 0.0)) for i in range(7)] + [(0.08, hd['cy'] + 0.3)]
        put(fin, PAL[r['hair']], 0.18)
    elif r.get('hairstyle') in ('cap', 'pony'):
        top = head_poly(hd, 1.07, -0.1, math.pi + 0.1, 24)
        fr_ = [(hd['rx'] * 0.98 - 2 * hd['rx'] * 0.98 * i / 8, hd['cy'] + hd['ryt'] * (0.5 + 0.15 * math.sin(math.pi * i / 8))) for i in range(9)]
        put(top + fr_[::-1][::-1], PAL[r['hair']], 0.18, 0.015)
    if r.get('earring'): put(ell(-hd['rx'] * 0.95, hd['cy'] - 0.18, 0.03, 0.03, 8), PAL['gold'], 0.2)

# ---------------------------------------------------------------- the cast: two wrestlers and a referee
RUFUS = dict(name='BIG RUFUS', skin=SKIN[3], h=1.05, w=1.32, belly=0.18, sq=4.0, chin=0.05, rx=1.3, ryb=1.55, beard='black', gear='black', gear2='maroon',
             straps=True, brow=0.12, browcol='black', height="6'5\"  305 lb")
COMETA = dict(name='EL COMETA', skin=SKIN[2], h=0.94, w=0.9, mask=dict(base='gold', trim='red'), gear='red', gear2='gold', brow=0, height="5'9\"  198 lb")
REF = dict(name='REFEREE', skin=SKIN[1], h=0.98, w=0.95, shirt='white', sleeves=True, pants='black', hair='grey', hairstyle='cap', brow=0.08, browcol='grey', tape=False)

# ---------------------------------------------------------------- the sets
def setup(width, height, scale):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    pc._mats.clear()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = width, height
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'Medium High Contrast'
    w = bpy.data.worlds.new('w'); sc.world = w
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.5, 0.5, 0.52, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 2.7; sun.angle = math.radians(6)
    so = bpy.data.objects.new('sun', sun); bpy.context.collection.objects.link(so); so.rotation_euler = Euler((math.radians(20), math.radians(-16), 0))
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = scale
    co = bpy.data.objects.new('cam', cam); bpy.context.collection.objects.link(co); sc.camera = co
    co.location = (0, 0, 40); co.rotation_euler = Euler((0, 0, 0))
    return sc

def shoot(sc, name):
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True); print('saved', name)

def chart(rnd, bg):
    """Create a wrestler: a backdrop card with a height chart, like a police line-up."""
    piece([(-4.2, -4.6), (4.2, -4.6), (4.2, 4.6), (-4.2, 4.6)], PAL[bg], -0.3, rnd, 0.02)
    for i in range(9):
        y = -3.7 + i * 0.95
        piece([(-4.0, y - 0.02), (4.0, y - 0.02), (4.0, y + 0.02), (-4.0, y + 0.02)], tuple(c * 0.7 for c in PAL[bg]), -0.25, rnd, 0.004)
        text("%d'" % (i + 0), -3.6, y + 0.22, -0.24, 0.32, tuple(c * 0.6 for c in PAL[bg]), 'LEFT')
    piece([(-4.2, -4.6), (4.2, -4.6), (4.2, -3.75), (-4.2, -3.75)], PAL['grey'], -0.2, rnd, 0.02)   # the floor

def ring(rnd, crowd_seed=3, front=True):
    """A ring cut from card, side on: the crowd behind, the back ropes, the mat and the apron."""
    cr = random.Random(crowd_seed)
    piece([(-8.5, -5), (8.5, -5), (8.5, 5), (-8.5, 5)], (0.03, 0.04, 0.12), -1.0, rnd, 0.02)
    for row in range(4):   # the crowd: a head and shoulders each, in rows
        y = 3.3 - row * 0.85; n = 22 + row
        for i in range(n):
            x = -8.2 + (i + cr.random() * 0.4) * 16.6 / n + (row % 2) * 0.3
            shirt = cr.choice([PAL['red'], PAL['black'], PAL['white'], PAL['blue'], PAL['grey'], PAL['maroon'], PAL['yellow'], PAL['teal']])
            skin = cr.choice(SKIN); sz = 0.24 + row * 0.03
            piece(ell(x, y - sz * 1.4, sz * 1.6, sz * 1.2, 12), tuple(c * (0.55 + row * 0.12) for c in shirt), -0.9 + row * 0.04, rnd, 0.01)
            piece(ell(x, y, sz * 0.75, sz * 0.9, 12), tuple(c * (0.55 + row * 0.12) for c in skin), -0.88 + row * 0.04, rnd, 0.01)
            if cr.random() < 0.08: piece(ell(x + 0.2, y + 0.25, 0.05, 0.07, 6), (1, 1, 0.95), -0.85 + row * 0.04, rnd, 0.002)   # a phone held up
    piece([(-8.5, 0.55), (8.5, 0.55), (8.5, 0.45), (-8.5, 0.45)], (0.1, 0.1, 0.12), -0.7, rnd, 0.01)   # the barrier
    for i in range(7): piece(ell(-7.2 + i * 2.4, 4.55, 0.22, 0.22, 14), PAL['yellow'], -0.65, rnd, 0.01)   # the lights
    for sx in (-7.6, 7.6):
        piece([(sx - 0.14, -2.6), (sx + 0.14, -2.6), (sx + 0.14, 1.9), (sx - 0.14, 1.9)], (0.7, 0.7, 0.74), -0.6, rnd, 0.008)
        for y in (-1.55, -0.55, 0.45): piece(ell(sx, y, 0.26, 0.2, 12), PAL['red'], -0.55, rnd, 0.008)
    for y in (-1.55, -0.55, 0.45): piece([(-7.6, y - 0.05), (7.6, y - 0.05), (7.6, y + 0.05), (-7.6, y + 0.05)], PAL['white'], -0.5, rnd, 0.004)
    piece([(-8.5, -3.15), (8.5, -3.15), (8.5, -2.45), (-8.5, -2.45)], (0.86, 0.86, 0.84), -0.45, rnd, 0.01)   # the mat
    piece([(-8.5, -5), (8.5, -5), (8.5, -3.1), (-8.5, -3.1)], PAL['red'], 2.5, rnd, 0.015)              # the apron, in front of everyone
    piece([(-8.5, -3.35), (8.5, -3.35), (8.5, -3.1), (-8.5, -3.1)], PAL['white'], 2.55, rnd, 0.008)
    if front: piece([(-8.5, -2.35), (8.5, -2.35), (8.5, -2.27), (-8.5, -2.27)], PAL['white'], 2.6, rnd, 0.004)    # the bottom rope, across the front

def burst(x, y, txt, col='yellow', size=0.6, z=3.0, rnd=None):
    piece(star(x, y, 1.0 * size * 1.6, 12, 0.7), PAL['black'], z, rnd, 0.01)
    piece(star(x, y, 0.9 * size * 1.6, 12, 0.7), PAL[col], z + 0.04, rnd, 0.01)
    text(txt, x, y, z + 0.1, min(size * 0.8, 1.7 / (0.72 * len(txt))))

# ---------------------------------------------------------------- the renders
FOOT = -2.9   # where feet stand on the mat (waist height comes from the legs)
def waist(r): return FOOT + (1.3 + 1.22) * r.get('h', 1.0) + 0.42 + 0.28

def bodies():
    for r, bg in ((RUFUS, 'maroon'), (COMETA, 'blue')):
        sc = setup(560, 620, 9.0); rnd = random.Random(5)
        chart(rnd, 'sky' if bg == 'blue' else 'pink')
        y = -3.75 + (1.3 + 1.22) * r['h'] + 0.42 + 0.28
        puppet(r, 0.0, y, 0.0, 1, dict(sh_n=12, sh_f=-12, el_n=6, el_f=-6, wr_n=0, wr_f=0), seed=7)
        shoot(sc, 'body-' + r['name'].split()[-1].lower())
    sc = setup(900, 620, 15.0); rnd = random.Random(5)
    piece([(-11, -8), (11, -8), (11, 8), (-11, 8)], PAL['cream'], -0.3, rnd, 0.02)
    puppet(RUFUS, 0.0, 0.2, 0.0, 1, dict(sh_n=35, sh_f=-35, el_n=10, el_f=-10, hip_n=12, hip_f=-12), seed=7, explode=1.45)
    shoot(sc, 'body-parts')

def lockup():
    stand_a = dict(sh_n=25, el_n=60, sh_f=20, el_f=70, hip_n=10, kn_n=-12, an_n=2, hip_f=-12, kn_f=-6)
    frames = [
        # 1: the stare-down, a step apart, the referee between them
        dict(a=(-2.6, stand_a, 0, 'shout'), b=(2.6, dict(sh_n=15, el_n=80, sh_f=10, el_f=85, hip_n=6, kn_n=-6, hip_f=-8), 0, None), ref=(0.0, dict(sh_n=70, el_n=10, sh_f=75, el_f=10), 'shout'), txt=None),
        # 2: they come in, arms out
        dict(a=(-1.5, dict(torso=8, sh_n=75, el_n=20, sh_f=60, el_f=35, hip_n=28, kn_n=-30, an_n=4, hip_f=-20, kn_f=-10), 8, None), b=(1.4, dict(torso=6, sh_n=80, el_n=15, sh_f=55, el_f=40, hip_n=25, kn_n=-25, hip_f=-18, kn_f=-12), 6, None), ref=(-4.5, dict(sh_n=10, el_n=30), None), txt=None),
        # 3: the lock-up: a hand behind the neck, a hand on the elbow, heads together
        dict(a=(-0.95, dict(torso=14, head=-6, sh_n=105, el_n=25, sh_f=70, el_f=50, hip_n=30, kn_n=-30, an_n=4, hip_f=-26, kn_f=-14), 14, 'shout'), b=(0.85, dict(torso=12, head=-4, sh_n=100, el_n=35, sh_f=65, el_f=55, hip_n=26, kn_n=-26, hip_f=-24, kn_f=-14), 12, 'shout'), ref=(-4.6, dict(sh_n=40, el_n=30, sh_f=20), None), txt=('LOCK-UP!', 0.0, 3.6)),
    ]
    for i, f in enumerate(frames):
        sc = setup(960, 540, 16.0); rnd = random.Random(9); ring(rnd)
        rx, rp, rexpr = f['ref']; puppet(REF, rx, waist(REF), -0.3, 1 if rx < 0 else -1, rp, seed=4, expr=rexpr)
        ax, ap, arot, aexpr = f['a']; puppet(RUFUS, ax, waist(RUFUS), 0.0, 1, ap, rot0=-arot, seed=7, expr=aexpr)
        bx, bp, brot, bexpr = f['b']; puppet(COMETA, bx, waist(COMETA), 1.2, -1, bp, rot0=brot, seed=8, expr=bexpr)
        if f['txt']: burst(f['txt'][1], f['txt'][2], f['txt'][0], 'yellow', 0.55, 3.0, rnd)
        shoot(sc, 'scene-lockup-%d' % (i + 1))

def cover():
    """The cover. Turning a doll a quarter turn lays it down: +90 is on the back with the head to the left, -90 is
    face down with the head to the right. El Cometa is on his back, Big Rufus lies across his chest, and the
    referee is down on his knees beside them, counting with a hand on the mat."""
    mat_y = -2.75
    frames = [
        dict(arm=dict(sh_n=165, el_n=5), txt=('ONE!', -4.6, 2.9), up=False),
        dict(arm=dict(sh_n=25, el_n=5), txt=('TWO!', -4.6, 2.9), up=False),
        dict(arm=dict(sh_n=150, el_n=40, sh_f=-150, el_f=-40), txt=('KICK OUT!', 1.6, 3.1), up=True),
    ]
    for i, f in enumerate(frames):
        sc = setup(960, 540, 16.0); rnd = random.Random(9); ring(rnd, front=False)
        # the referee by their heads, facing them: knees on the mat, shins flat behind, leaning in
        ref = dict(torso=-30, head=10, hip_n=-5, kn_n=-90, an_n=60, hip_f=5, kn_f=-95, an_f=60, sh_f=-30, el_f=-20)
        ref.update(f['arm'])
        puppet(REF, 4.6, mat_y + 1.3 * REF['h'] + 0.12, -0.4, -1, ref, seed=4, expr='shout')
        if not f['up']:
            # on his back, head to the right, one knee up, an arm flung out on the mat
            puppet(COMETA, -0.8, mat_y + 0.6, 0.0, -1, dict(sh_n=160, el_n=5, sh_f=140, el_f=-10, hip_n=35, kn_n=-60, an_n=20), rot0=90, seed=8, expr='hurt')
            # draped across his chest at an angle, legs back on the mat, an arm hooking the leg
            puppet(RUFUS, -0.7, -1.75, 1.0, 1, dict(sh_n=-120, el_n=-30, sh_f=-60, el_f=-40, kn_n=-10, kn_f=-20, an_n=-30, an_f=-30, head=25), rot0=-65, seed=7)
        else:
            # the shoulder comes up and Rufus is thrown up and off
            puppet(COMETA, -0.8, mat_y + 0.75, 0.0, -1, dict(sh_n=120, el_n=40, sh_f=60, el_f=30, hip_n=60, kn_n=-90, an_n=20, hip_f=15, kn_f=-20), rot0=72, seed=8, expr='shout')
            puppet(RUFUS, -2.0, -1.0, 1.0, 1, dict(sh_n=150, el_n=40, sh_f=-150, el_f=-40, hip_n=30, kn_n=-60, hip_f=-20, kn_f=-30, head=20), rot0=-35, seed=7, expr='shout')
        burst(f['txt'][1], f['txt'][2], f['txt'][0], 'yellow' if not f['up'] else 'red', 0.55, 3.0, rnd)
        shoot(sc, 'scene-cover-%d' % (i + 1))

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    want = sys.argv[1:] or ['bodies', 'lockup', 'cover']
    if 'bodies' in want: bodies()
    if 'lockup' in want: lockup()
    if 'cover' in want: cover()
