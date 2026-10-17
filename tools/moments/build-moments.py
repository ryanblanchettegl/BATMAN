"""Match moments: pictures of the big moments of a match, rendered in Blender (Ryan, 17 October).

Each picture is a moment, not a person. The wrestlers are figures under the lights: dark shapes with a coloured rim
of light, no faces, no hair, no gear that could be anybody's. So any picture can stand for any two people on the
card, and nothing in it copies a real wrestler or a real photograph (rule 3).

Run with Blender's Python (bpy), from the repo root:
    python tools/moments/build-moments.py [name ...]      # renders app/moments/<name>.webp
The pictures are built from code only: the ring, the crowd and the figures are made here, nothing is loaded.
"""
import math, os, random, sys
import bpy
from mathutils import Vector, Quaternion

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'app', 'moments')
W, H = int(os.environ.get('MW', 960)), int(os.environ.get('MH', 540))
SAMPLES = int(os.environ.get('MS', 48))
MAT_Z = 1.2          # the top of the ring mat
HALF = 3.05          # half the ring's width
BLUE, RED, GOLD, WHITE = (0.25, 0.5, 1.0), (1.0, 0.18, 0.12), (1.0, 0.72, 0.25), (0.9, 0.92, 1.0)

# ---------------------------------------------------------------- materials
def mat(name, color, rough=0.6, emit=None, strength=0.0, metal=0.0, alpha=1.0, attr=None):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    if attr:   # colour from a per-vertex attribute (the crowd)
        a = nt.nodes.new('ShaderNodeAttribute'); a.attribute_name = attr
        nt.links.new(a.outputs['Color'], b.inputs['Base Color'])
        if emit:
            mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MULTIPLY'
            nt.links.new(a.outputs['Color'], b.inputs['Emission Color'])
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m

def beam_mat(name, color, strength):
    """A shaft of light: emission that fades out along the cone, see-through."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 1.0; ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*color, 1)
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mix = nt.nodes.new('ShaderNodeMixShader')
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = strength
    nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], mul.inputs[0]); nt.links.new(mul.outputs[0], mix.inputs['Fac'])
    nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    return m

def obj(name, mesh_fn, material, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    mesh_fn()
    o = bpy.context.active_object; o.name = name
    o.location = loc; o.rotation_euler = rot; o.scale = scale
    if material: o.data.materials.append(material)
    return o

def cube(name, size, loc, material, rot=(0, 0, 0)):
    return obj(name, lambda: bpy.ops.mesh.primitive_cube_add(size=1), material, loc, rot, size)

def cyl(name, r, depth, loc, material, rot=(0, 0, 0), verts=16):
    return obj(name, lambda: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, vertices=verts), material, loc, rot)

def rod(name, a, b, r, material, verts=10):
    """A cylinder from point a to point b."""
    a, b = Vector(a), Vector(b); d = b - a
    o = cyl(name, r, d.length, (a + b) / 2, material, verts=verts)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    return o

# ---------------------------------------------------------------- the building
def ring():
    mat_mat = mat('canvas', (0.55, 0.56, 0.6), 0.85)
    apron = mat('apron', (0.05, 0.05, 0.06), 0.7)
    skirt = mat('skirt', (0.35, 0.03, 0.03), 0.5, emit=(0.6, 0.05, 0.03), strength=0.15)
    cube('mat', (HALF * 2 + 0.4, HALF * 2 + 0.4, 0.12), (0, 0, MAT_Z - 0.06), mat_mat)
    cube('apron', (HALF * 2 + 0.38, HALF * 2 + 0.38, MAT_Z - 0.12), (0, 0, (MAT_Z - 0.12) / 2), skirt)
    cube('apron_band', (HALF * 2 + 0.42, HALF * 2 + 0.42, 0.12), (0, 0, MAT_Z - 0.16), apron)
    post = mat('post', (0.75, 0.76, 0.8), 0.25, metal=0.9)
    pad = mat('pad', (0.04, 0.04, 0.05), 0.4)
    rope = mat('rope', (0.95, 0.95, 0.97), 0.35, emit=(1, 1, 1), strength=0.25)
    corners = [(-HALF, -HALF), (HALF, -HALF), (HALF, HALF), (-HALF, HALF)]
    for i, (x, y) in enumerate(corners):
        cyl('post%d' % i, 0.06, 1.75, (x * 1.03, y * 1.03, MAT_Z + 0.75), post)
        for z in (0.45, 0.9, 1.35):
            obj('pad%d' % i, lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, segments=16, ring_count=8), pad, (x, y, MAT_Z + z), scale=(1, 1, 0.75))
    for k in range(4):
        a, b = corners[k], corners[(k + 1) % 4]
        for z in (0.45, 0.9, 1.35):
            rod('rope', (a[0], a[1], MAT_Z + z), (b[0], b[1], MAT_Z + z), 0.022, rope)
    floor = mat('floor', (0.01, 0.01, 0.012), 0.9)
    obj('floor', lambda: bpy.ops.mesh.primitive_plane_add(size=200), floor)
    rail = mat('rail', (0.02, 0.02, 0.025), 0.5)
    for s in (-1, 1):
        cube('rail', (16, 0.1, 1.0), (0, s * 6.2, 0.5), rail)
        cube('rail', (0.1, 12.4, 1.0), (s * 8, 0, 0.5), rail)

def crowd(seed, front=True, density=1.0):
    """The crowd: thousands of people in rising rows, each a head and shoulders with their own colour. Drawn out of
    focus behind the ring, it reads as a wall of people. A few hold up a phone (a small light)."""
    import bmesh
    rnd = random.Random(seed)
    shirts = [(0.35, 0.03, 0.03), (0.03, 0.03, 0.035), (0.04, 0.04, 0.05), (0.3, 0.3, 0.32), (0.03, 0.06, 0.18), (0.25, 0.04, 0.04), (0.12, 0.12, 0.13), (0.4, 0.28, 0.08)]
    skins = [(0.8, 0.6, 0.48), (0.65, 0.45, 0.32), (0.45, 0.3, 0.2), (0.3, 0.2, 0.13), (0.9, 0.72, 0.6)]
    bm = bmesh.new(); col = bm.loops.layers.color.new('col')
    def person(x, y, z, face):
        sh = rnd.choice(shirts); sk = rnd.choice(skins)
        for (dz, r, c, sx) in ((0.0, 0.24, sh, 1.15), (0.36, 0.12, sk, 1.0)):
            g = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
            for v in g['verts']:
                v.co.x *= sx; v.co += Vector((x, y, z + dz + (rnd.random() - 0.5) * 0.08))
            for f in {f for v in g['verts'] for f in v.link_faces}:
                for l in f.loops: l[col] = (*c, 1)
    rows = 26
    for side in ((0, 1), (1, 0), (-1, 0), (0, -1)) if front else ((0, 1), (1, 0), (-1, 0)):
        for r in range(rows):
            d = 7.2 + r * 0.85; z = 0.9 + max(0, r - 2) * 0.45; width = d * 2.2
            n = int(width / 0.55 * density)
            for i in range(n):
                if rnd.random() < 0.06: continue          # an empty seat here and there
                t = -width / 2 + (i + rnd.random() * 0.3) * width / n
                x, y = (t, d * side[1]) if side[1] else (d * side[0], t)
                person(x, y, z, side)
    me = bpy.data.meshes.new('crowd'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('crowd', me); bpy.context.collection.objects.link(o)
    m = bpy.data.materials.new('crowd'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']; a = m.node_tree.nodes.new('ShaderNodeVertexColor'); a.layer_name = 'col'
    m.node_tree.links.new(a.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.8
    o.data.materials.append(m)
    # phones and camera flashes held up in the crowd, all in one mesh
    ph = mat('phone', (1, 1, 1), emit=(0.85, 0.9, 1.0), strength=18)
    bm = bmesh.new()
    for i in range(int(140 * density)):
        side = rnd.choice(((0, 1), (1, 0), (-1, 0)))
        r = rnd.randrange(0, rows); d = 7.2 + r * 0.85; z = 0.9 + max(0, r - 2) * 0.45 + 0.75; t = (rnd.random() - 0.5) * d * 2
        x, y = (t, d * side[1]) if side[1] else (d * side[0], t)
        q = [bm.verts.new((x + dx, y, z + dz)) for dx, dz in ((-0.04, -0.06), (0.04, -0.06), (0.04, 0.06), (-0.04, 0.06))]
        bm.faces.new(q)
    me = bpy.data.meshes.new('phones'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('phones', me); bpy.context.collection.objects.link(o); o.data.materials.append(ph)

def lights(rim_a, rim_b, key=1.0, beams=True, gold=False):
    """Lights over the ring: a hard key from above, a coloured rim behind each figure, a warm glow on the crowd, and
    shafts of light from the rafters."""
    def area(name, loc, target, color, energy, size):
        bpy.ops.object.light_add(type='AREA', location=loc); l = bpy.context.active_object; l.name = name
        l.data.color = color; l.data.energy = energy; l.data.size = size
        l.rotation_mode = 'QUATERNION'; l.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(Vector(target) - Vector(loc))
    def spot(name, loc, target, color, energy, angle):
        bpy.ops.object.light_add(type='SPOT', location=loc); l = bpy.context.active_object; l.name = name
        l.data.color = color; l.data.energy = energy; l.data.spot_size = angle; l.data.spot_blend = 0.6; l.data.shadow_soft_size = 0.3
        l.rotation_mode = 'QUATERNION'; l.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(Vector(target) - Vector(loc))
    area('key', (0, 1.5, 11), (0, 0, MAT_Z), (1, 0.96, 0.9), 900 * key, 4)
    spot('rimA', (-5, 5.5, 3.6), (-0.4, 0, MAT_Z + 1.3), rim_a, 16000, 0.6)
    spot('rimB', (5, 5.5, 3.6), (0.4, 0, MAT_Z + 1.3), rim_b, 16000, 0.6)
    spot('front', (0, -10, 6), (0, 0, MAT_Z + 1), (0.8, 0.85, 1), 500 if not gold else 1200, 0.5)
    area('crowdglow', (0, 14, 12), (0, 20, 4), (1, 0.6, 0.45) if not gold else (1, 0.7, 0.3), 3500, 20)
    area('crowdsides', (0, 0, 14), (0, 12, 2), (0.9, 0.7, 0.6), 1200, 18)
    if beams:
        bm_ = beam_mat('beam', (0.6, 0.75, 1.0) if not gold else (1.0, 0.8, 0.45), 0.35)
        for i, x in enumerate((-13, -7, -2.5, 2.5, 7, 13)):
            top = Vector((x, 26, 22)); bot = Vector((x * 0.55 + (i % 2 - 0.5) * 3, 9, 0))
            d = bot - top
            bpy.ops.mesh.primitive_cone_add(radius1=0.05, radius2=1.4, depth=d.length, vertices=24, location=(top + bot) / 2)
            c = bpy.context.active_object; c.rotation_mode = 'QUATERNION'
            c.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d)
            c.data.materials.append(bm_); c.visible_shadow = False

# ---------------------------------------------------------------- the figures
SEGS = [  # joint, joint, radius at the first, radius at the second
    ('pelvis', 'chest', 0.17, 0.2), ('chest', 'neck', 0.17, 0.08), ('neck', 'head', 0.075, 0.075),
    ('chest', 'lsh', 0.13, 0.11), ('chest', 'rsh', 0.13, 0.11),
    ('lsh', 'lel', 0.095, 0.075), ('lel', 'lwr', 0.072, 0.055), ('rsh', 'rel', 0.095, 0.075), ('rel', 'rwr', 0.072, 0.055),
    ('pelvis', 'lhip', 0.15, 0.13), ('pelvis', 'rhip', 0.15, 0.13),
    ('lhip', 'lkn', 0.13, 0.085), ('lkn', 'lan', 0.09, 0.06), ('rhip', 'rkn', 0.13, 0.085), ('rkn', 'ran', 0.09, 0.06),
    ('lan', 'lto', 0.065, 0.05), ('ran', 'rto', 0.065, 0.05),
]

def ellipsoid(name, centre, up, side, size, material):
    """An egg shape whose long axis runs along `up` and whose width runs along `side`."""
    from mathutils import Matrix
    z = Vector(up).normalized(); y = (Vector(side) - z * Vector(side).dot(z)).normalized(); x = y.cross(z)
    o = obj(name, lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=32, ring_count=16), material, centre)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Matrix((x, y, z)).transposed().to_quaternion(); o.scale = size
    bpy.ops.object.shade_smooth()
    return o

def figure(name, J, skin, gear=None, scale=1.0):
    """A figure from its joints (a dict of points, metres). Limbs are a skeleton of edges dressed by Blender's Skin
    modifier and smoothed, the trunk and head are eggs, so it reads as a body under the lights. The head is a plain
    egg: no face, no hair. Trunks and boots, if any, are plain bands of one colour."""
    import bmesh
    J = {k: Vector(v) for k, v in J.items()}
    sk = mat('skin_' + name, skin, 0.32); b = sk.node_tree.nodes['Principled BSDF']
    b.inputs['Specular IOR Level'].default_value = 0.8; b.inputs['Coat Weight'].default_value = 0.4
    me = bpy.data.meshes.new(name); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    bm = bmesh.new(); idx = {}; radii = []
    def v(key, co, r):
        if key in idx: return idx[key]
        idx[key] = bm.verts.new(co); radii.append(r * scale); return idx[key]
    def limb(a, b, ra, rmid, rb):
        va = v(a, J[a], ra); vb = v(b, J[b], rb); vm = v(a + b, J[a].lerp(J[b], 0.45), rmid)
        bm.edges.new((va, vm)); bm.edges.new((vm, vb))
    # the spine and the limbs, radius at the start, the middle (the muscle) and the end
    limb('pelvis', 'chest', 0.16, 0.15, 0.17); limb('chest', 'neck', 0.17, 0.11, 0.075)
    limb('chest', 'lsh', 0.12, 0.12, 0.1); limb('chest', 'rsh', 0.12, 0.12, 0.1)
    for s in 'lr':
        limb(s + 'sh', s + 'el', 0.1, 0.095, 0.062); limb(s + 'el', s + 'wr', 0.062, 0.07, 0.045)
        limb('pelvis', s + 'hip', 0.14, 0.13, 0.12); limb(s + 'hip', s + 'kn', 0.12, 0.115, 0.07); limb(s + 'kn', s + 'an', 0.07, 0.075, 0.045)
        limb(s + 'an', s + 'to', 0.05, 0.045, 0.035)
    bm.to_mesh(me); bm.free()
    mod = o.modifiers.new('skin', 'SKIN')
    for i, r in enumerate(radii): me.skin_vertices[0].data[i].radius = (r, r)
    me.skin_vertices[0].data[0].use_root = True
    sub = o.modifiers.new('sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
    me.materials.append(sk)
    for p in me.polygons: p.use_smooth = True
    # the trunk, the shoulders, the hands and the head
    up = J['neck'] - J['pelvis']; side = J['lsh'] - J['rsh']
    ellipsoid(name + '_chest', J['chest'].lerp(J['neck'], 0.1), up, side, (0.17 * scale, 0.26 * scale, 0.24 * scale), sk)
    ellipsoid(name + '_belly', J['pelvis'].lerp(J['chest'], 0.45), up, side, (0.16 * scale, 0.19 * scale, 0.24 * scale), sk)
    for s in 'lr':
        ellipsoid(name + '_delt', J[s + 'sh'], J[s + 'el'] - J[s + 'sh'], up, (0.11 * scale, 0.11 * scale, 0.12 * scale), sk)
        hand = J[s + 'wr'] + (J[s + 'wr'] - J[s + 'el']).normalized() * 0.07
        ellipsoid(name + '_hand', hand, J[s + 'wr'] - J[s + 'el'], side, (0.05 * scale, 0.06 * scale, 0.08 * scale), sk)
    ellipsoid(name + '_head', J['head'], J['head'] - J['neck'], side, (0.105 * scale, 0.1 * scale, 0.13 * scale), sk)
    if gear:
        g = mat('gear_' + name, gear, 0.3)
        mid = (J['lhip'] + J['rhip']) / 2
        ellipsoid(name + '_trunks', mid.lerp(J['pelvis'], 0.4), up, side, (0.165 * scale, 0.215 * scale, 0.15 * scale), g)
        for s in 'lr':
            rod(name + '_boot', J[s + 'an'] + (J[s + 'kn'] - J[s + 'an']) * 0.45, J[s + 'an'] - Vector((0, 0, 0.05)), 0.075 * scale, g, 16)
    return o

def pose(base, at=(0, 0), turn=0.0, **joints):
    """Place a pose: `base` is joints for a figure standing at the origin facing +x; `at` moves it, `turn` turns it
    (radians, about the vertical), and keyword joints override single points first."""
    J = dict(base); J.update(joints)
    c, s = math.cos(turn), math.sin(turn); out = {}
    for k, (x, y, z) in J.items():
        out[k] = (at[0] + x * c - y * s, at[1] + x * s + y * c, MAT_Z + z)
    return out

STAND = {  # a big man, about 1.95 m, standing square, facing +x
    'head': (0, 0, 1.78), 'neck': (0, 0, 1.6), 'chest': (0, 0, 1.38), 'pelvis': (0, 0, 1.0),
    'lsh': (0, 0.24, 1.5), 'rsh': (0, -0.24, 1.5), 'lel': (0.05, 0.32, 1.2), 'rel': (0.05, -0.32, 1.2),
    'lwr': (0.15, 0.3, 0.95), 'rwr': (0.15, -0.3, 0.95),
    'lhip': (0, 0.13, 0.92), 'rhip': (0, -0.13, 0.92), 'lkn': (0.04, 0.16, 0.5), 'rkn': (0.04, -0.16, 0.5),
    'lan': (0, 0.17, 0.09), 'ran': (0, -0.17, 0.09), 'lto': (0.18, 0.18, 0.03), 'rto': (0.18, -0.18, 0.03),
}

# ---------------------------------------------------------------- the moments
def m_strike():
    """Trading blows: one throws a right hand, the other rocks back from it. A referee watches from the corner."""
    a = pose(STAND, at=(-0.55, 0.05), turn=0.0,
             chest=(0.12, 0, 1.36), neck=(0.17, 0, 1.58), head=(0.22, 0.02, 1.76),
             rsh=(0.15, -0.22, 1.5), rel=(0.5, -0.2, 1.52), rwr=(0.85, -0.08, 1.6),            # the punch, landing
             lsh=(0.05, 0.25, 1.48), lel=(0.2, 0.36, 1.2), lwr=(0.32, 0.2, 1.38),              # the guard
             lkn=(0.3, 0.2, 0.52), lan=(0.42, 0.22, 0.09), lto=(0.6, 0.22, 0.03), lhip=(0.02, 0.14, 0.92),
             rkn=(-0.2, -0.17, 0.5), ran=(-0.45, -0.18, 0.1), rto=(-0.3, -0.2, 0.02))
    b = pose(STAND, at=(0.75, -0.05), turn=math.pi,
             chest=(-0.12, 0, 1.36), neck=(-0.2, 0.03, 1.56), head=(-0.28, 0.08, 1.72),        # head snapped back
             rsh=(-0.08, -0.24, 1.48), rel=(0.05, -0.45, 1.25), rwr=(0.1, -0.55, 1.0),
             lsh=(-0.1, 0.24, 1.48), lel=(-0.05, 0.48, 1.3), lwr=(0.08, 0.6, 1.5),              # arm flung out
             lkn=(0.1, 0.18, 0.52), lan=(0.05, 0.2, 0.09), rkn=(-0.25, -0.15, 0.5), ran=(-0.5, -0.17, 0.09), rto=(-0.35, -0.2, 0.02))
    figure('A', a, (0.1, 0.09, 0.09), (0.04, 0.04, 0.05))
    figure('B', b, (0.1, 0.09, 0.09), (0.04, 0.04, 0.05))
    ref = pose(STAND, at=(-2.2, 1.9), turn=-0.7, lwr=(0.05, 0.32, 0.98), rwr=(0.2, -0.25, 1.05))
    figure('ref', ref, (0.06, 0.06, 0.07), None, 0.92)
    return dict(cam=(0.2, -6.4, 1.7), look=(0.05, 0, MAT_Z + 1.15), lens=38, focus=6.4, fstop=0.8, rim=(BLUE, RED))

def m_lift():
    """The big lift: one hoists the other high, upside down, at the top of a slam."""
    a = pose(STAND, at=(0.0, 0), turn=0.25,
             lkn=(0.25, 0.25, 0.5), rkn=(0.25, -0.25, 0.5), lan=(0.05, 0.3, 0.09), ran=(0.05, -0.3, 0.09), lto=(0.22, 0.32, 0.03), rto=(0.22, -0.32, 0.03),
             lhip=(-0.02, 0.15, 0.88), rhip=(-0.02, -0.15, 0.88), pelvis=(-0.02, 0, 0.95), chest=(0.0, 0, 1.33), neck=(0.02, 0, 1.55), head=(0.04, 0, 1.72),
             lsh=(0, 0.25, 1.48), rsh=(0, -0.25, 1.48), lel=(-0.05, 0.4, 1.78), rel=(0.08, -0.38, 1.78), lwr=(0.0, 0.25, 2.05), rwr=(0.15, -0.22, 2.02))
    # the one in the air: hips at the top, body straight down behind, legs up
    up = {'pelvis': (0.05, 0.0, 2.35), 'chest': (-0.05, 0.05, 1.98), 'neck': (-0.1, 0.08, 1.78), 'head': (-0.12, 0.1, 1.62),
          'lsh': (-0.05, 0.3, 1.92), 'rsh': (-0.08, -0.2, 1.92), 'lel': (-0.25, 0.48, 1.7), 'rel': (-0.3, -0.35, 1.72), 'lwr': (-0.38, 0.6, 1.5), 'rwr': (-0.45, -0.42, 1.52),
          'lhip': (0.08, 0.12, 2.42), 'rhip': (0.05, -0.12, 2.42), 'lkn': (0.3, 0.2, 2.75), 'rkn': (0.32, -0.08, 2.8), 'lan': (0.55, 0.28, 3.1), 'ran': (0.62, -0.02, 3.12),
          'lto': (0.6, 0.3, 3.3), 'rto': (0.7, 0.0, 3.3)}
    b = pose(up, at=(0.0, 0), turn=0.25)
    figure('A', a, (0.1, 0.09, 0.09), (0.04, 0.04, 0.05))
    figure('B', b, (0.1, 0.09, 0.09), (0.04, 0.04, 0.05))
    return dict(cam=(-0.8, -5.6, 1.45), look=(0.0, 0, MAT_Z + 1.7), lens=32, focus=5.6, fstop=0.8, rim=(RED, BLUE))

MOMENTS = {'strike': m_strike, 'lift': m_lift}

# ---------------------------------------------------------------- render
def render(name):
    import time; T = time.time()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 4; sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.004, 0.005, 0.012, 1)
    shot = MOMENTS[name]()
    ring(); crowd(7); lights(*shot['rim'], gold=shot.get('gold', False))
    print('scene seconds', round(time.time() - T))
    bpy.ops.object.camera_add(location=shot['cam']); cam = bpy.context.active_object; sc.camera = cam
    cam.data.lens = shot['lens']; cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (Vector(shot['look']) - Vector(shot['cam'])).to_track_quat('-Z', 'Y')
    cam.data.dof.use_dof = True; cam.data.dof.focus_distance = shot['focus']; cam.data.dof.aperture_fstop = shot['fstop']
    os.makedirs(OUT, exist_ok=True)
    png = os.path.join(OUT, name + '.png'); sc.render.filepath = png
    import time; t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print('render seconds', round(time.time() - t0))
    try:
        from PIL import Image
        Image.open(png).convert('RGB').save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=80, method=6); os.remove(png)
    except ImportError:
        pass
    print('rendered', name)

if __name__ == '__main__':
    names = [a for a in sys.argv[1:] if a in MOMENTS] or list(MOMENTS)
    for n in names: render(n)
