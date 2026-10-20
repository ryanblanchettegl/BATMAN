"""Puts the paper renders in the game's own frames: grey windows with a blue title bar and a hard drop shadow on
the blue desktop (Ryan, 17 October: the borders keep the retro look). Run after paper-puppets.py:
    python tools/creator/paper-frames.py     # docs/mockups/paper/creator-bodies.png, show-lockup.png, show-cover.png
Needs Pillow and fontTools (with brotli) to read the game's VT323 typeface."""
import io, os
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
D = os.path.join(ROOT, 'docs', 'mockups', 'paper')
BLUE, GREY, DGREY, WHITE, YELLOW, BLACK, GREEN, DRED = '#0000AA', '#AAAAAA', '#555555', '#FFFFFF', '#FFFF55', '#000000', '#55FF55', '#AA0000'

def font(size):
    f = TTFont(os.path.join(ROOT, 'app', 'node_modules', '@fontsource', 'vt323', 'files', 'vt323-latin-400-normal.woff2')); f.flavor = None
    b = io.BytesIO(); f.save(b); b.seek(0); return ImageFont.truetype(b, size)
F, FS = font(30), font(24)

def window(desk, x, y, img, title, foot=None):
    """A grey window: white and dark grey bevel, a blue title bar with the title in yellow, a black drop shadow."""
    pad, bar = 8, 34; w = img.width + pad * 2; h = img.height + bar + pad * 2 + (40 if foot else 0)
    d = ImageDraw.Draw(desk, 'RGBA')
    d.rectangle([x + 14, y + 12, x + w + 14, y + h + 12], fill=(0, 0, 0, 140))
    d.rectangle([x, y, x + w, y + h], fill=GREY)
    d.line([x, y, x + w, y], WHITE, 3); d.line([x, y, x, y + h], WHITE, 3)
    d.line([x, y + h, x + w, y + h], DGREY, 3); d.line([x + w, y, x + w, y + h], DGREY, 3)
    d.rectangle([x + 4, y + 4, x + w - 4, y + bar], fill=BLUE)
    tw = d.textlength(title, font=F); d.text((x + (w - tw) / 2, y + 3), title, fill=YELLOW, font=F)
    ix, iy = x + pad, y + bar + pad
    d.rectangle([ix - 2, iy - 2, ix + img.width + 1, iy + img.height + 1], outline=DGREY, width=2)
    desk.paste(img, (ix, iy))
    if foot:   # buttons along the bottom: green with a hard black shadow
        bx = ix
        for label in foot:
            bw = int(d.textlength(label, font=FS)) + 24; by = iy + img.height + 8
            d.rectangle([bx + 3, by + 3, bx + bw + 3, by + 29], fill=BLACK); d.rectangle([bx, by, bx + bw, by + 26], fill=GREEN)
            d.text((bx + 12, by), label, fill=BLACK, font=FS); bx += bw + 14
    return w, h

def sheet(name, items, cols, cell_w, cell_h, heading):
    rows = (len(items) + cols - 1) // cols
    desk = Image.new('RGB', (cols * cell_w + 60, rows * cell_h + 110), BLUE)
    d = ImageDraw.Draw(desk); d.text((30, 18), heading, fill=WHITE, font=F)
    for i, (img, title, foot) in enumerate(items):
        window(desk, 30 + (i % cols) * cell_w, 70 + (i // cols) * cell_h, img, title, foot)
    desk.save(os.path.join(D, name + '.png')); print('saved', name)

def load(f, scale=1.0):
    im = Image.open(os.path.join(D, f + '.png')).convert('RGB')
    return im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS) if scale != 1 else im

if __name__ == '__main__':
    s = 0.8
    sheet('creator-bodies', [
        (load('body-rufus', s), 'Create a wrestler: Big Rufus', ['Face', 'Hair', 'Body', 'Gear']),
        (load('body-cometa', s), 'Create a wrestler: El Cometa', ['Face', 'Mask', 'Body', 'Gear']),
        (load('body-parts', 0.62), 'How a body is cut and pinned', None),
    ], 3, 600, 620, 'Construction paper wrestlers, full body (concept, made-up people)')
    for scene, steps in (('lockup', ['The stare-down', 'They come in', 'The lock-up']), ('cover', ['The cover: one', 'Two', 'Kick out at two'])):
        sheet('show-' + scene, [(load('scene-%s-%d' % (scene, i + 1), 0.6), 'On the air  %d/3  %s' % (i + 1, t), None) for i, t in enumerate(steps)],
              3, 620, 420, 'A canned scene on the broadcast: ' + ('the opening lock-up' if scene == 'lockup' else 'the cover and the kick-out'))
