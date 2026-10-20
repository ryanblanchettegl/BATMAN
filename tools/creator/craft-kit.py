"""The craft kit: textures and cut pieces for the hand-made look (Ryan, 19 October: "it has to look like every page you
are looking at was hand crafted by someone using art supplies"). Three concepts, each a folder of PNGs in app/ui/:

    craft  the workbench, the core look (Ryan, 19 October: "we are switching to concept a"): a green cutting mat,
           torn cream paper, washi and masking tape, navy card, cut card buttons, index cards and sticky notes
    b  the cardboard box: corrugated kraft board with cut edges, manila tags, twine, stamped ink
    c  the scrapbook zine: cork, construction paper cut with pinking shears, notebook paper, a Polaroid, pushpins
       and marker doodles

Everything is drawn here from noise and geometry, so it is repeatable (a fixed seed) and nothing is fetched (rule 2).
A frame is a nine-slice image for CSS border-image: its corners keep their cut, its edges repeat. A texture tiles.
    python3 tools/creator/craft-kit.py        # needs numpy and Pillow
"""
import os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
R = np.random.default_rng(1926)

def out(look, name, im):
    d = os.path.join(ROOT, 'app', 'ui', look); os.makedirs(d, exist_ok=True)
    p = os.path.join(d, name + '.png'); im.save(p, optimize=True); print(look, name, im.size, os.path.getsize(p) // 1024, 'KB')

def hexc(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)

def noise(w, h, scale, octaves=4, tile=True):
    """Fractal value noise, 0..1, seamless when tile is set (each octave is a wrapped random grid, resized)."""
    acc = np.zeros((h, w), np.float32); amp, tot = 1.0, 0.0
    for o in range(octaves):
        gw, gh = max(2, int(w / scale * 2 ** o)), max(2, int(h / scale * 2 ** o))
        g = R.random((gh, gw)).astype(np.float32)
        if tile: g = np.tile(g, (3, 3))
        im = Image.fromarray((g * 255).astype(np.uint8)).resize(((gw * 3 if tile else gw) * 1, (gh * 3 if tile else gh)), Image.NEAREST)
        big = im.resize((w * 3 if tile else w, h * 3 if tile else h), Image.BICUBIC)
        a = np.asarray(big, np.float32) / 255
        if tile: a = a[h:2 * h, w:2 * w]
        acc += a * amp; tot += amp; amp *= 0.5
    return acc / tot

def fibres(w, h, n, length, col, alpha):
    """Short curved fibres scattered over the sheet (seamless: drawn three by three and cropped)."""
    im = Image.new('RGBA', (w * 3, h * 3), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for _ in range(n):
        x, y = R.random() * w + w, R.random() * h + h; a = R.random() * math.pi; L = length * (0.4 + R.random())
        pts = []
        for k in range(6):
            t = k / 5; a += (R.random() - .5) * .5; pts.append((x + math.cos(a) * L * t, y + math.sin(a) * L * t))
        c = tuple(int(v) for v in col) + (int(alpha * (0.4 + R.random() * .6)),)
        for ox in (-w, 0, w):
            for oy in (-h, 0, h): d.line([(p[0] + ox, p[1] + oy) for p in pts], fill=c, width=1)
    return im.crop((w, h, 2 * w, 2 * h))

def sheet(w, h, base, mottle=.08, grain=.06, fib=None):
    """A tileable sheet of paper or card: a base colour, blotchy colour, fine grain and fibres."""
    b = hexc(base); m = noise(w, h, 90, 3); g = noise(w, h, 3, 2)
    v = b[None, None, :] * (1 + (m[..., None] - .5) * mottle * 2 + (g[..., None] - .5) * grain * 2)
    im = Image.fromarray(np.clip(v, 0, 255).astype(np.uint8)).convert('RGBA')
    if fib: im = Image.alpha_composite(im, fibres(w, h, *fib))
    return im

def edge_mask(w, h, inset, rough, kind='torn', seed=0, corner=0):
    """A mask for a piece of paper w by h with its edge `inset` from the image border. kind: torn (fibrous, wandering),
    cut (scissors: nearly straight, a little off the line), zig (pinking shears)."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    def wob(n, amp, fine):
        s = np.cumsum(rng.normal(0, 1, n)); s = (s - np.linspace(s[0], s[-1], n)); s = s / (np.abs(s).max() + 1e-6) * amp
        return s + rng.normal(0, fine, n)
    if kind == 'zig':
        per = 9.0
        top = inset + (np.abs(((xx[0] / per) % 1) - .5) * 2) * rough; left = inset + (np.abs(((yy[:, 0] / per) % 1) - .5) * 2) * rough
        bot = top; right = left
    else:
        amp, fine = (rough, rough * .35) if kind == 'torn' else (rough * .5, rough * .08)
        top, bot = inset + wob(w, amp, fine), inset + wob(w, amp, fine); left, right = inset + wob(h, amp, fine), inset + wob(h, amp, fine)
    m = (yy >= top[None, :]) & (yy <= h - 1 - bot[None, :]) & (xx >= left[:, None]) & (xx <= w - 1 - right[:, None])
    m = m.astype(np.float32)
    if corner:
        c = corner
        for (cx, cy) in [(inset + c, inset + c), (w - 1 - inset - c, inset + c), (inset + c, h - 1 - inset - c), (w - 1 - inset - c, h - 1 - inset - c)]:
            sx = (xx < cx) if cx < w / 2 else (xx > cx); sy = (yy < cy) if cy < h / 2 else (yy > cy)
            m[sx & sy & (((xx - cx) ** 2 + (yy - cy) ** 2) > c * c)] = 0
    return m

def piece(w, h, tex, mask, shadow=(5, 7, 6, .42), core=None, outline=None):
    """Cut a texture with a mask; add the paler core of the card along a torn edge, an outline, and a soft shadow down
    and to the right on a transparent ground."""
    t = tex.resize((w, h)) if tex.size != (w, h) else tex
    a = np.asarray(t, np.float32).copy(); m = mask
    if core is not None:   # the torn edge shows the paper's white core: a lighter fringe just inside the edge
        er = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(core[0] * 2 + 1)), np.float32) / 255
        fringe = np.clip(m - er, 0, 1)[..., None]
        a[..., :3] = a[..., :3] * (1 - fringe * core[1]) + 255 * fringe * core[1]
    if outline:
        er = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(outline[0] * 2 + 1)), np.float32) / 255
        ring = np.clip(m - er, 0, 1)[..., None]; oc = hexc(outline[1])
        a[..., :3] = a[..., :3] * (1 - ring) + oc * ring
    a[..., 3] = m * 255
    top = Image.fromarray(a.astype(np.uint8), 'RGBA')
    dx, dy, blur, op = shadow
    sh = Image.fromarray((m * 255 * op).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
    sh = ImageChops.offset(sh, dx, dy)
    base = Image.new('RGBA', (w, h), (0, 0, 0, 0)); base.putalpha(sh)
    return Image.alpha_composite(base, top)

def light(im, k=.06):
    """Light from the upper left across a piece: brighter there, darker toward the lower right, and darker still in a
    soft band just inside the edge, the way a sheet that is not quite flat catches the light."""
    a = np.asarray(im, np.float32).copy(); h, w = a.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]
    g = 1 + k * 1.6 * (1 - (xx / w + yy / h))
    al = Image.fromarray(a[..., 3].astype(np.uint8)); inner = np.asarray(al.filter(ImageFilter.GaussianBlur(6)), np.float32) / 255
    rim = np.clip(1 - inner, 0, 1) * (a[..., 3] / 255) * .14
    a[..., :3] = np.clip(a[..., :3] * g[..., None] * (1 - rim[..., None]), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def tape(w, h, col, alpha, seed):
    """A strip of tape: translucent, with a fine crinkle and torn ends."""
    rng = np.random.default_rng(seed); t = sheet(w, h, col, .1, .12)
    a = np.asarray(t, np.float32).copy(); yy, xx = np.mgrid[0:h, 0:w]
    l = 3 + rng.normal(0, 1.2, h).cumsum() * .4; r = 3 + rng.normal(0, 1.2, h).cumsum() * .4
    l = np.clip(l - l.mean() + 4, 0, 9); r = np.clip(r - r.mean() + 4, 0, 9)
    m = (xx >= l[:, None]) & (xx <= w - 1 - r[:, None]); stripes = (np.sin(yy / 2.2) * .5 + .5) * .08
    a[..., :3] = a[..., :3] * (1 - stripes[..., None])
    a[..., 3] = m * 255 * alpha
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def doodle(w, h, paths, col, width, seed):
    """Lines drawn by hand with a marker: each a little shaky, a little thicker where the pen paused."""
    rng = np.random.default_rng(seed); im = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for path in paths:
        pts = [(x * 2 + rng.normal(0, 1.2), y * 2 + rng.normal(0, 1.2)) for (x, y) in path]
        dense = []
        for i in range(len(pts) - 1):
            for k in range(8): t = k / 8; dense.append((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t + rng.normal(0, .6), pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t + rng.normal(0, .6)))
        dense.append(pts[-1])
        for i in range(len(dense) - 1): d.line([dense[i], dense[i + 1]], fill=col, width=int(width * 2 * (0.85 + rng.random() * .3)))
        for p in dense[::3]: d.ellipse([p[0] - width, p[1] - width, p[0] + width, p[1] + width], fill=col)
    return im.resize((w, h), Image.LANCZOS)

# ---------------------------------------------------------------- A: the workbench, the core look (app/ui/craft)
mat = sheet(480, 480, '#2f6658', .1, .05)
d = ImageDraw.Draw(mat, 'RGBA')
for i in range(0, 480, 16): d.line([(i, 0), (i, 480)], fill=(220, 240, 230, 46 if i % 80 else 92), width=1); d.line([(0, i), (480, i)], fill=(220, 240, 230, 46 if i % 80 else 92), width=1)
for _ in range(14):   # knife scratches
    x, y, a, L = R.random() * 480, R.random() * 480, R.random() * math.pi, 40 + R.random() * 120
    d.line([(x, y), (x + math.cos(a) * L, y + math.sin(a) * L)], fill=(200, 230, 215, 40), width=1)
out('craft', 'mat', mat.convert('RGB'))
cream = sheet(360, 360, '#f3ebd6', .1, .05, (260, 14, (150, 130, 100), 60)); out('craft', 'paper', cream.convert('RGB'))
navy = sheet(240, 240, '#2c3561', .12, .08, (120, 10, (200, 205, 230), 40)); out('craft', 'navy', navy.convert('RGB'))
win = light(piece(240, 240, cream, edge_mask(240, 240, 12, 5.5, 'torn', 3), (6, 9, 7, .6), core=(3, .7)), .06); out('craft', 'win', win)
note = light(piece(240, 240, sheet(240, 240, '#fff1a6', .08, .05), edge_mask(240, 240, 10, 1.8, 'cut', 5), (5, 8, 6, .5)), .09); out('craft', 'note', note)
card = light(piece(240, 240, sheet(240, 240, '#fbf8ee', .05, .04, (120, 10, (160, 150, 130), 40)), edge_mask(240, 240, 10, 1.6, 'cut', 6), (5, 8, 6, .5)), .07); out('craft', 'card', card)
for n, c in [('green', '#3f9a4a'), ('blue', '#3f6fbf'), ('red', '#d9443a'), ('yellow', '#f6c93a'), ('navy', '#2c3561'), ('off', '#b9b09c'), ('cream', '#f3ebd6')]:
    out('craft', 'btn-' + n, light(piece(160, 96, sheet(160, 96, c, .1, .07, (60, 6, (255, 255, 255), 50)), edge_mask(160, 96, 8, 1.4, 'cut', hash(n) % 999, corner=6), (4, 6, 4, .6)), .14))
out('craft', 'tape-y', tape(150, 40, '#f4d35e', .78, 1)); out('craft', 'tape-p', tape(150, 40, '#f29bb4', .75, 2)); out('craft', 'tape-m', tape(150, 40, '#e8dcb8', .85, 3))
out('craft', 'scrib', doodle(220, 60, [[(6, 40), (40, 20), (80, 44), (120, 18), (160, 42), (210, 22)]], (230, 70, 60, 255), 2.2, 4))

# ---------------------------------------------------------------- B: the cardboard box
def kraft(w, h, base='#b88a55'):
    t = sheet(w, h, base, .14, .1, (300, 10, (90, 60, 30), 70))
    a = np.asarray(t, np.float32).copy(); yy = np.mgrid[0:h, 0:w][0]
    flutes = (np.sin(yy / 4.2 * math.pi) * .5 + .5) * .035   # the flutes inside, faintly through the face
    a[..., :3] *= (1 - flutes[..., None]); return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
kr = kraft(400, 400); out('b', 'kraft', kr.convert('RGB'))
out('b', 'kraft-dark', kraft(300, 300, '#8a6338').convert('RGB'))
def boxpanel(w, h, seed, face='#c79a62'):
    """A panel cut from corrugated board: the face, and along the cut edge the wavy flutes inside showing."""
    m = edge_mask(w, h, 9, 1.2, 'cut', seed, corner=3)
    base = piece(w, h, kraft(w, h, face), m, (5, 7, 5, .5))
    a = np.asarray(base, np.float32).copy(); yy, xx = np.mgrid[0:h, 0:w]
    er = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9)), np.float32) / 255
    band = np.clip(m - er, 0, 1)
    wave = (np.sin((xx + yy) / 3.0) * .5 + .5)
    edge = np.stack([np.full_like(band, 150), np.full_like(band, 110), np.full_like(band, 66)], -1) * (0.75 + .35 * wave[..., None])
    a[..., :3] = a[..., :3] * (1 - band[..., None] * .85) + edge * band[..., None] * .85
    return light(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA'), .07)
out('b', 'win', boxpanel(240, 240, 7)); out('b', 'tv', boxpanel(300, 300, 8, '#a87b48'))
tag = piece(240, 160, sheet(240, 160, '#e9d6a6', .08, .06, (90, 8, (120, 90, 50), 50)), edge_mask(240, 160, 8, 1.0, 'cut', 9, corner=10), (4, 6, 4, .4))
dd = ImageDraw.Draw(tag); dd.ellipse([18, 70, 32, 84], fill=(0, 0, 0, 0)); dd.ellipse([14, 66, 36, 88], outline=(150, 120, 70, 255), width=3)
out('b', 'tag', light(tag, .06))
for n, c in [('green', '#5d9a4c'), ('blue', '#4a74b8'), ('red', '#c4452f'), ('yellow', '#e7b93c'), ('navy', '#3b3a4a'), ('off', '#a59479'), ('cream', '#e9d6a6')]:
    out('b', 'btn-' + n, boxpanel(160, 96, hash(n) % 999, c))
tw = Image.new('RGBA', (200, 16), (0, 0, 0, 0)); td = ImageDraw.Draw(tw)
for x in range(0, 200, 6): td.line([(x, 3), (x + 7, 12)], fill=(176, 140, 92, 255), width=3); td.line([(x + 3, 3), (x + 10, 12)], fill=(130, 98, 60, 255), width=1)
out('b', 'twine', tw)
ink = noise(256, 256, 4, 3); ink = (np.clip((ink - .25) * 2.4, 0, 1) * 255).astype(np.uint8); out('b', 'ink', Image.fromarray(ink, 'L'))

# ---------------------------------------------------------------- C: the scrapbook zine
cork = sheet(360, 360, '#b98552', .14, .2)
cd = ImageDraw.Draw(cork, 'RGBA')
for _ in range(1800):
    x, y, r = R.random() * 360, R.random() * 360, R.random() * 2.2 + .5; c = (60, 35, 15, int(60 + R.random() * 90)) if R.random() < .6 else (230, 190, 140, 70)
    cd.ellipse([x - r, y - r, x + r, y + r], fill=c)
out('c', 'cork', cork.convert('RGB'))
for n, c in [('white', '#fbf7ee'), ('yellow', '#ffd23f'), ('pink', '#ff7aa8'), ('blue', '#4ea3e6'), ('green', '#5cc46a'), ('purple', '#9a6bd6'), ('black', '#232027')]:
    out('c', 'zig-' + n, light(piece(240, 240, sheet(240, 240, c, .1, .07, (120, 8, (255, 255, 255), 45)), edge_mask(240, 240, 10, 5, 'zig', hash(n) % 999), (5, 7, 4, .45)), .07))
nb = sheet(240, 240, '#fdfcf6', .04, .03)
nd = ImageDraw.Draw(nb, 'RGBA')
for y in range(30, 240, 18): nd.line([(0, y), (240, y)], fill=(120, 165, 220, 110), width=1)
nd.line([(34, 0), (34, 240)], fill=(230, 90, 90, 140), width=2)
nbp = piece(240, 240, nb, edge_mask(240, 240, 8, 3, 'torn', 11), (4, 6, 4, .4), core=(2, .3))
ndd = ImageDraw.Draw(nbp)
for y in range(30, 230, 34): ndd.ellipse([13, y, 23, y + 10], fill=(0, 0, 0, 0))
out('c', 'notebook', light(nbp, .05))
pol = Image.new('RGBA', (300, 300), (0, 0, 0, 0)); pm = edge_mask(300, 300, 8, .6, 'cut', 12)
pol = light(piece(300, 300, sheet(300, 300, '#f9f7f1', .03, .03), pm, (6, 9, 7, .5)), .05); out('c', 'polaroid', pol)
pin = Image.new('RGBA', (64, 64), (0, 0, 0, 0)); pdr = ImageDraw.Draw(pin)
pdr.ellipse([22, 30, 50, 44], fill=(0, 0, 0, 70)); pdr.line([(30, 34), (34, 50)], fill=(150, 150, 160, 255), width=3)
pdr.ellipse([14, 8, 42, 36], fill=(220, 52, 52, 255), outline=(120, 20, 20, 255), width=2); pdr.ellipse([20, 13, 28, 21], fill=(255, 190, 190, 220))
out('c', 'pin', pin.filter(ImageFilter.SMOOTH))
out('c', 'star', doodle(80, 80, [[(40, 6), (50, 32), (76, 32), (55, 48), (63, 74), (40, 58), (17, 74), (25, 48), (4, 32), (30, 32), (40, 6)]], (255, 210, 63, 255), 2.4, 13))
out('c', 'arrow', doodle(160, 70, [[(6, 50), (40, 30), (90, 24), (140, 30)], [(122, 14), (142, 30), (124, 46)]], (35, 32, 39, 255), 2.6, 14))
out('c', 'circle', doodle(200, 90, [[(100 + 92 * math.cos(t / 20 * 2 * math.pi + .3), 45 + 38 * math.sin(t / 20 * 2 * math.pi + .3)) for t in range(23)]], (230, 60, 60, 255), 2.2, 15))
out('c', 'tape-c', tape(150, 40, '#9fe0d0', .7, 16))

# ---------------------------------------------------------------- the board under the workbench: black construction paper
# (Ryan, 19 October: "can you make the background color black? black construction paper?"). Last, so the pieces above
# keep the random numbers they were drawn with.
out('craft', 'black', sheet(480, 480, '#26252a', .22, .1, (300, 14, (120, 116, 124), 34)).convert('RGB'))
