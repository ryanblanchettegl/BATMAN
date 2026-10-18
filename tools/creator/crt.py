"""A CRT filter for a finished render: the picture as if seen on a tube of the early 90s. The glass is flat
(Ryan, 18 October: no curve); bend > 0 brings the curve and the rounded bezel back.

    python tools/creator/crt.py docs/mockups/paper/desk.png        # writes desk-crt.png beside it

What it does, in order: bends the picture onto curved glass, splits the colours a little toward the edges, adds
the glow bright things have on a tube, lays the scanlines and the phosphor stripes over it, darkens the corners,
adds a little noise, then rounds the corners of the glass and sets it in a dark bezel with a faint reflection.
Needs numpy and Pillow."""
import sys, os
import numpy as np
from PIL import Image, ImageFilter

def sample(img, xs, ys):
    """Bilinear lookup of img (h, w, c) at float coordinates."""
    h, w = img.shape[:2]
    xs = np.clip(xs, 0, w - 1.001); ys = np.clip(ys, 0, h - 1.001)
    x0 = xs.astype(int); y0 = ys.astype(int); fx = (xs - x0)[..., None]; fy = (ys - y0)[..., None]
    a = img[y0, x0]; b = img[y0, x0 + 1]; c = img[y0 + 1, x0]; d = img[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy

def crt(src, dst, bend=0.0, fringe=1.6, glow=0.35, lines=0.2, mask=0.1, vignette=0.35, seed=1):
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255.0
    h, w = im.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (xx / (w - 1)) * 2 - 1; ny = (yy / (h - 1)) * 2 - 1
    r2 = nx * nx * (w / h) ** 0 + ny * ny
    out = np.zeros_like(im)
    for ch, k in ((0, bend + 0.0006 * fringe), (1, bend), (2, bend - 0.0006 * fringe)):   # the glass bends red and blue a hair differently
        f = (1 + k * r2) / (1 + k)   # the middle of each edge stays at the edge; only the corners bow
        sx = ((nx * f) + 1) / 2 * (w - 1); sy = ((ny * f) + 1) / 2 * (h - 1)
        out[..., ch] = sample(im[..., ch:ch + 1], sx, sy)[..., 0]
    fb = (1 + bend * r2) / (1 + bend)
    edge = (np.abs(nx * fb) > 1) | (np.abs(ny * fb) > 1)
    # glow: what is bright bleeds a little light round itself
    pil = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
    bright = np.asarray(pil.filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255.0
    wide = np.asarray(pil.filter(ImageFilter.GaussianBlur(22))).astype(np.float32) / 255.0
    out = out + glow * (np.clip(bright - 0.45, 0, 1) * 0.8 + np.clip(wide - 0.5, 0, 1) * 0.6)
    # scanlines: a soft dark line every third row; phosphor stripes: red, green, blue columns
    out *= (1 - lines * (0.5 + 0.5 * np.cos(yy * 2 * np.pi / 3.0)))[..., None]
    stripe = np.ones((h, w, 3), np.float32) * (1 - mask)
    for c in range(3): stripe[:, c::3, c] = 1.0
    out *= stripe * (1 + mask * 0.6)
    # the corners darken, and a little noise
    out *= (1 - vignette * np.clip(r2 / 2.0, 0, 1) ** 1.6)[..., None]
    out += np.random.default_rng(seed).normal(0, 0.012, out.shape).astype(np.float32)
    # the glass: rounded corners, a dark bezel, a faint reflection across the top left
    cx = np.abs(nx * fb); cy = np.abs(ny * fb); rad = 0.06
    qx = np.clip(cx - (1 - rad), 0, None) / rad; qy = np.clip(cy - (1 - rad * w / h), 0, None) / (rad * w / h)
    inside = (((qx * qx + qy * qy) <= 1) & ~edge) if bend else np.ones_like(edge)
    refl = np.clip(1 - np.hypot(nx + 0.55, ny + 0.75) / 0.9, 0, 1) ** 2 * 0.07
    out = out + refl[..., None]
    bezel = np.array([0.05, 0.05, 0.055], np.float32) * (1 - 0.4 * np.clip(r2 / 2, 0, 1))[..., None]
    out = np.where(inside[..., None], out, bezel)
    Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(dst)
    print('saved', dst)

if __name__ == '__main__':
    src = sys.argv[1]; base, ext = os.path.splitext(src)
    crt(src, sys.argv[2] if len(sys.argv) > 2 else base + '-crt' + ext)
