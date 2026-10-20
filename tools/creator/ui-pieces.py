"""Renders the interface's paper pieces in Blender (Ryan, 19 October: "make the pages pop and have depth like our
scenes"; TASKS.md 0x). Each piece is real card, modelled in layers the way the desk mockup is cut: a black outline
sheet, a coloured face, and for a button a darker lip under the face. The edges are cut by hand (a little off the
line), the card has a fibre bump, a sun from the upper left throws a short crisp shadow down and to the right, and
the camera looks straight down so one Blender unit is one pixel. The renders are frames for CSS border-image: the
corners keep their shape, the edges repeat, and the middle is drawn by CSS, so a piece fits any size.

Run with Blender's Python (bpy 4.5 from pip works headless):
    <python with bpy> tools/creator/ui-pieces.py      # app/ui/*.png, embedded by build.js
"""
import bpy, bmesh, math, os, random

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'app', 'ui')
os.makedirs(OUT, exist_ok=True)
S = 2   # render at twice the CSS size, so the pieces stay crisp on a 1440p or 4K screen

def hexrgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c) + (1,)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True
    sc.render.film_transparent = True; sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (1, 1, 1, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.55
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.data.energy = 2.2; sun.data.angle = math.radians(2)
    sun.rotation_euler = (math.radians(30), math.radians(-30), math.radians(-35))   # from the upper left of the screen
    return sc

def card_mat(name, col, bump=0.35, rough=0.85):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rough
    # fibre: fine noise into a bump, and a little blotchy colour
    tex = nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = 0.9; tex.inputs['Detail'].default_value = 12
    bm = nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value = bump; bm.inputs['Distance'].default_value = 0.4
    nt.links.new(tex.outputs['Fac'], bm.inputs['Height']); nt.links.new(bm.outputs['Normal'], b.inputs['Normal'])
    mot = nt.nodes.new('ShaderNodeTexNoise'); mot.inputs['Scale'].default_value = 0.05
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.inputs['Factor'].default_value = 0.06
    c = hexrgb(col); mix.inputs['A'].default_value = c; mix.inputs['B'].default_value = tuple(x * 0.82 for x in c[:3]) + (1,)
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0; mr.inputs['To Max'].default_value = 0.14
    nt.links.new(mot.outputs['Fac'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], mix.inputs['Factor'])
    nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    return m

def slab(sc, name, x0, y0, x1, y1, z, th, mat, cut=0.6, seed=1, r=0.0):
    """A sheet of card from (x0, y0) to (x1, y1) in pixels (y down, as on the screen), its top at z, th thick.
    Its edge is cut by hand: points every few pixels, each nudged off the line by up to `cut`. `r` rounds the corners."""
    rnd = random.Random(seed); pts = []
    def edge(ax, ay, bx, by):
        n = max(2, int(math.hypot(bx - ax, by - ay) / 11))
        for i in range(n):
            t = i / n; pts.append((ax + (bx - ax) * t, ay + (by - ay) * t))
    if r > 0:
        k = 6
        for (cx, cy, a0) in [(x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)]:
            for i in range(k + 1):
                a = math.radians(a0 + 90 * i / k); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
            # and the straight run to the next corner
        out = []
        for i in range(len(pts)):
            p, q = pts[i], pts[(i + 1) % len(pts)]; out.append(p)
            d = math.hypot(q[0] - p[0], q[1] - p[1]); n = int(d / 11)
            for j in range(1, n): out.append((p[0] + (q[0] - p[0]) * j / n, p[1] + (q[1] - p[1]) * j / n))
        pts = out
    else:
        edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0)
    pts = [(x + rnd.uniform(-cut, cut), y + rnd.uniform(-cut, cut)) for (x, y) in pts]
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((x, -y, z)) for (x, y) in pts]; f = bm.faces.new(vs)
    ex = bmesh.ops.extrude_face_region(bm, geom=[f]); top = [v for v in ex['geom'] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, -th), verts=[v for v in bm.verts if v not in top])
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])   # a flat, even top: no shading crease across it
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); ob.data.materials.append(mat)
    bv = ob.modifiers.new('bev', 'BEVEL'); bv.width = min(0.5, th * 0.4); bv.segments = 2; bv.limit_method = 'ANGLE'; bv.angle_limit = math.radians(60)
    return ob

def ground(sc, w, h):
    me = bpy.data.meshes.new('g'); bm = bmesh.new()
    vs = [bm.verts.new(p) for p in [(-50, 50, 0), (w + 50, 50, 0), (w + 50, -h - 50, 0), (-50, -h - 50, 0)]]; bm.faces.new(vs); bm.to_mesh(me); bm.free()
    g = bpy.data.objects.new('g', me); sc.collection.objects.link(g); g.is_shadow_catcher = True

def shoot(sc, name, w, h):
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam)
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = max(w, h); cam.location = (w / 2, -h / 2, 200); sc.camera = cam
    sc.render.resolution_x = w * S; sc.render.resolution_y = h * S; sc.render.resolution_percentage = 100
    if w != h: cam.data.sensor_fit = 'HORIZONTAL' if w > h else 'VERTICAL'
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    print('wrote', name, w * S, 'x', h * S)

INK = '#17171b'
# a window: a black sheet, the cream card on it; 96 by 96 with room for the shadow at the right and bottom
def window(name, face, edge=2.5, lift=3.0, seed=3):
    sc = reset(); ground(sc, 104, 104)
    slab(sc, 'ink', 4, 4, 96, 96, lift + 1.4, 1.2, card_mat('ink', INK, 0.1, 0.6), 0.25, seed)
    slab(sc, 'face', 4 + edge, 4 + edge, 96 - edge, 96 - edge, lift + 2.4, 1.0, card_mat('face', face), 0.22, seed + 7)
    shoot(sc, name, 104, 104)

# a group box: darker card, no outline, lying low
def group(name, face, seed=5):
    sc = reset(); ground(sc, 104, 104)
    slab(sc, 'face', 4, 4, 96, 96, 1.8, 1.2, card_mat('face', face), 0.3, seed, r=3)
    shoot(sc, name, 104, 104)

# a button: a black sheet, a dark lip under the face, the face on top, corners rounded a little
def button(name, face, lip, seed=9):
    sc = reset(); ground(sc, 72, 52)
    slab(sc, 'ink', 4, 4, 64, 44, 4.2, 1.2, card_mat('ink', INK, 0.1, 0.6), 0.4, seed, r=7)
    slab(sc, 'lip', 5.6, 8, 62.4, 42.4, 5.2, 1.0, card_mat('lip', lip), 0.3, seed + 3, r=6)
    slab(sc, 'face', 5.6, 5.6, 62.4, 38.6, 6.4, 1.2, card_mat('face', face, 0.25), 0.3, seed + 5, r=6)
    shoot(sc, name, 72, 52)

# a tile: a small cream card with an outline (the bottom strip, fields)
def tile(name, face, seed=11):
    sc = reset(); ground(sc, 72, 52)
    slab(sc, 'ink', 4, 4, 64, 44, 2.6, 1.0, card_mat('ink', INK, 0.1, 0.6), 0.4, seed, r=3)
    slab(sc, 'face', 6, 6, 62, 42, 3.4, 0.8, card_mat('face', face), 0.3, seed + 2, r=2)
    shoot(sc, name, 72, 52)

window('win', '#efe6cf')
group('grp', '#ddd0b2')
for n, f, l in [('green', '#3a9a45', '#1e5a26'), ('blue', '#406fba', '#22406f'), ('red', '#e0402f', '#7d1a12'), ('yellow', '#f9cd3b', '#9a7a10'),
                ('navy', '#343b61', '#1a1e33'), ('off', '#b7ad97', '#8a8270'), ('cream', '#f4ecd6', '#a99c7c')]:
    button('btn-' + n, f, l)
tile('tile', '#efe6cf')
tile('field', '#fbf6ea', 13)
