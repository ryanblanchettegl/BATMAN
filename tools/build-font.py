#!/usr/bin/env python3
"""Builds app/fonts/ewf-blocks.woff2: the box-drawing, block and shape characters the game draws its charts,
banners and frames with. VT323 (the game's typeface) does not have them, and a fallback font from the player's
device has a different cell width, which knocks multi-line art out of line. Every glyph here is drawn in code
on VT323's own cell (400 x 1000 units, baseline at 200 from the bottom), so art lines up on every device.

Needs: pip install fonttools brotli.   Run: python3 tools/build-font.py
The output is committed, so building the game does not need Python.
"""
import math, os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM, ADV, ASC, DESC = 1000, 400, 800, -200     # VT323's metrics
CX, CY = 200, 280                               # centre of a box-drawing cell (CY matches VT323's hyphen)
HX, HY = 40, 40                                 # half the stroke: vertical strokes 80 wide, horizontal 80 tall
GX, GY = 80, 100                                # offset of the two strokes of a double line

def rect(pen, x0, y0, x1, y1):
    if x1 <= x0 or y1 <= y0: return
    pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()

def poly(pen, pts, hole=False):
    # outer contours run clockwise; holes run the other way
    area = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
    cw = area < 0
    if cw == hole: pts = pts[::-1]
    pen.moveTo(pts[0])
    for p in pts[1:]: pen.lineTo(p)
    pen.closePath()

def box(pen, u, r, d, l):
    """One box-drawing character from its four arms: 0 none, 1 light, 2 double."""
    # horizontal arms
    for arm, is_right in ((r, True), (l, False)):
        if not arm: continue
        def span(xin, y):
            if is_right: rect(pen, xin, y - HY, ADV, y + HY)
            else: rect(pen, 0, y - HY, xin, y + HY)
        s = 1 if is_right else -1
        if arm == 1:
            if u == 2 and d == 2: xin = CX + s * (GX - HX)
            elif u == 2 or d == 2: xin = CX - s * (GX + HX)
            else: xin = CX - s * HX
            span(xin, CY)
        else:
            top = CX + s * ((GX if u == 2 else 0) - HX) if u else CX - s * ((GX if d == 2 else 0) + HX)
            bot = CX + s * ((GX if d == 2 else 0) - HX) if d else CX - s * ((GX if u == 2 else 0) + HX)
            span(top, CY + GY); span(bot, CY - GY)
    # vertical arms
    for arm, is_up in ((u, True), (d, False)):
        if not arm: continue
        def span(yin, x):
            if is_up: rect(pen, x - HX, yin, x + HX, ASC)
            else: rect(pen, x - HX, DESC, x + HX, yin)
        s = 1 if is_up else -1
        if arm == 1:
            if l == 2 and r == 2: yin = CY + s * (GY - HY)
            elif l == 2 or r == 2: yin = CY - s * (GY + HY)
            else: yin = CY - s * HY
            span(yin, CX)
        else:
            left = CY + s * ((GY if l == 2 else 0) - HY) if l else CY - s * ((GY if r == 2 else 0) + HY)
            right = CY + s * ((GY if r == 2 else 0) - HY) if r else CY - s * ((GY if l == 2 else 0) + HY)
            span(left, CX - GX); span(right, CX + GX)

def shade(pen, keep):
    """A dot pattern over the whole cell: 10 columns by 25 rows of 40-unit dots. Runs of dots are merged."""
    for row in range(25):
        y0 = DESC + row * 40; col = 0
        while col < 10:
            if keep(col, row):
                start = col
                while col < 10 and keep(col, row): col += 1
                rect(pen, start * 40, y0, col * 40, y0 + 40)
            else: col += 1

def star(cx, cy, R, r, n=5):
    pts = []
    for i in range(n * 2):
        a = math.pi / 2 + i * math.pi / n; rad = R if i % 2 == 0 else r
        pts.append((round(cx + rad * math.cos(a)), round(cy + rad * math.sin(a))))
    return pts

# u, r, d, l
BOX = {
    0x2500: (0, 1, 0, 1), 0x2502: (1, 0, 1, 0), 0x250C: (0, 1, 1, 0), 0x2510: (0, 0, 1, 1), 0x2514: (1, 1, 0, 0), 0x2518: (1, 0, 0, 1),
    0x251C: (1, 1, 1, 0), 0x2524: (1, 0, 1, 1), 0x252C: (0, 1, 1, 1), 0x2534: (1, 1, 0, 1), 0x253C: (1, 1, 1, 1),
    0x2550: (0, 2, 0, 2), 0x2551: (2, 0, 2, 0),
    0x2552: (0, 2, 1, 0), 0x2553: (0, 1, 2, 0), 0x2554: (0, 2, 2, 0), 0x2555: (0, 0, 1, 2), 0x2556: (0, 0, 2, 1), 0x2557: (0, 0, 2, 2),
    0x2558: (1, 2, 0, 0), 0x2559: (2, 1, 0, 0), 0x255A: (2, 2, 0, 0), 0x255B: (1, 0, 0, 2), 0x255C: (2, 0, 0, 1), 0x255D: (2, 0, 0, 2),
    0x255E: (1, 2, 1, 0), 0x255F: (2, 1, 2, 0), 0x2560: (2, 2, 2, 0), 0x2561: (1, 0, 1, 2), 0x2562: (2, 0, 2, 1), 0x2563: (2, 0, 2, 2),
    0x2564: (0, 2, 1, 2), 0x2565: (0, 1, 2, 1), 0x2566: (0, 2, 2, 2), 0x2567: (1, 2, 0, 2), 0x2568: (2, 1, 0, 1), 0x2569: (2, 2, 0, 2),
    0x256A: (1, 2, 1, 2), 0x256B: (2, 1, 2, 1), 0x256C: (2, 2, 2, 2),
    0x2574: (0, 0, 0, 1), 0x2575: (1, 0, 0, 0), 0x2576: (0, 1, 0, 0), 0x2577: (0, 0, 1, 0),
}
MID = (ASC + DESC) // 2
def other(pen, cp):
    if cp == 0x2588: rect(pen, 0, DESC, ADV, ASC)                                  # full block
    elif cp == 0x2580: rect(pen, 0, MID, ADV, ASC)                                 # upper half
    elif cp == 0x2584: rect(pen, 0, DESC, ADV, MID)                                # lower half
    elif cp == 0x2581: rect(pen, 0, DESC, ADV, DESC + 125)                         # lower eighth
    elif cp == 0x2594: rect(pen, 0, ASC - 125, ADV, ASC)                           # upper eighth
    elif cp == 0x258C: rect(pen, 0, DESC, ADV // 2, ASC)                           # left half
    elif cp == 0x2590: rect(pen, ADV // 2, DESC, ADV, ASC)                         # right half
    elif cp == 0x2591: shade(pen, lambda c, r: (c + 2 * r) % 4 == 0)               # light shade
    elif cp == 0x2592: shade(pen, lambda c, r: (c + r) % 2 == 0)                   # medium shade
    elif cp == 0x2593: shade(pen, lambda c, r: (c + 2 * r) % 4 != 0)               # dark shade
    elif cp == 0x25A0: rect(pen, 40, 40, 360, 440)                                 # black square
    elif cp == 0x25A1: rect(pen, 40, 40, 360, 440); poly(pen, [(120, 120), (280, 120), (280, 360), (120, 360)], hole=True)
    elif cp == 0x25B2: poly(pen, [(20, 40), (200, 480), (380, 40)])                # up triangle
    elif cp == 0x25BC: poly(pen, [(20, 480), (380, 480), (200, 40)])               # down triangle
    elif cp in (0x25B6, 0x25BA): poly(pen, [(40, 0), (40, 480), (380, 240)])       # right pointer
    elif cp in (0x25C0, 0x25C4): poly(pen, [(360, 0), (20, 240), (360, 480)])      # left pointer
    elif cp == 0x25C6: poly(pen, [(200, 500), (390, 240), (200, -20), (10, 240)])  # black diamond
    elif cp == 0x25C7: poly(pen, [(200, 500), (390, 240), (200, -20), (10, 240)]); poly(pen, [(200, 380), (290, 240), (200, 100), (110, 240)], hole=True)
    elif cp == 0x2605: poly(pen, star(200, 250, 230, 95))                          # black star
    elif cp == 0x2191: rect(pen, 160, 0, 240, 360); poly(pen, [(40, 300), (200, 560), (360, 300)])     # up arrow
    elif cp == 0x2193: rect(pen, 160, 200, 240, 560); poly(pen, [(40, 260), (360, 260), (200, 0)])    # down arrow
    elif cp == 0x2190: rect(pen, 140, 240, 380, 320); poly(pen, [(200, 80), (20, 280), (200, 480)])   # left arrow
    elif cp == 0x2192: rect(pen, 20, 240, 260, 320); poly(pen, [(200, 80), (200, 480), (380, 280)])   # right arrow
    elif cp == 0x2571: poly(pen, [(0, DESC), (0, DESC + 150), (ADV - 60, ASC), (ADV, ASC), (ADV, ASC - 150), (60, DESC)])   # diagonal /
    elif cp == 0x2572: poly(pen, [(0, ASC), (60, ASC), (ADV, DESC + 150), (ADV, DESC), (ADV - 60, DESC), (0, ASC - 150)])   # diagonal \
    elif cp == 0x2248:                                                             # almost equal: two stepped waves
        for y in (320, 160):
            rect(pen, 40, y, 120, y + 80); rect(pen, 120, y + 40, 200, y + 120); rect(pen, 200, y, 280, y + 80); rect(pen, 280, y - 40, 360, y + 40)
    elif cp == 0x2715:                                                             # multiplication x
        poly(pen, [(40, 440), (100, 500), (360, 100), (300, 40)]); poly(pen, [(300, 500), (360, 440), (100, 40), (40, 100)])
    elif cp == 0x266B:                                                             # beamed eighth notes
        rect(pen, 110, 160, 150, 600); rect(pen, 310, 160, 350, 600); rect(pen, 110, 520, 350, 600); rect(pen, 30, 80, 150, 200); rect(pen, 230, 80, 350, 200)
    elif cp == 0x266A:                                                             # eighth note
        rect(pen, 200, 160, 240, 600); rect(pen, 100, 80, 240, 200); rect(pen, 240, 440, 320, 600)
OTHER = [0x2588, 0x2580, 0x2584, 0x2581, 0x2594, 0x258C, 0x2590, 0x2591, 0x2592, 0x2593, 0x25A0, 0x25A1, 0x25B2, 0x25BC, 0x25B6, 0x25BA, 0x25C0, 0x25C4,
         0x25C6, 0x25C7, 0x2605, 0x2190, 0x2191, 0x2192, 0x2193, 0x2571, 0x2572, 0x2248, 0x2715, 0x266A, 0x266B]

def main():
    order, cmap, glyphs, metrics = ['.notdef'], {}, {}, {'.notdef': (ADV, 0)}
    pen = TTGlyphPen(None); glyphs['.notdef'] = pen.glyph()
    for cp in sorted(list(BOX) + OTHER):
        name = 'uni%04X' % cp; pen = TTGlyphPen(None)
        if cp in BOX: box(pen, *BOX[cp])
        else: other(pen, cp)
        order.append(name); cmap[cp] = name; glyphs[name] = pen.glyph(); metrics[name] = (ADV, 0)
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order); fb.setupCharacterMap(cmap); fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics({k: (v[0], glyphs[k].xMin if getattr(glyphs[k], 'numberOfContours', 0) else 0) for k, v in metrics.items()})
    fb.setupHorizontalHeader(ascent=ASC, descent=DESC, lineGap=0)
    fb.setupNameTable({'familyName': 'EWF Blocks', 'styleName': 'Regular'})
    fb.setupOS2(version=4, sTypoAscender=ASC, sTypoDescender=DESC, sTypoLineGap=0, usWinAscent=1040, usWinDescent=240, fsSelection=0xC0, sxHeight=400, sCapHeight=560)
    fb.setupPost(isFixedPitch=1)
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'app', 'fonts')
    os.makedirs(out, exist_ok=True)
    fb.font.flavor = 'woff2'; fb.save(os.path.join(out, 'ewf-blocks.woff2'))
    fb.font.flavor = None; fb.save(os.path.join(out, 'ewf-blocks.ttf'))
    print('wrote', len(order) - 1, 'glyphs to app/fonts/ewf-blocks.woff2 (%d bytes)' % os.path.getsize(os.path.join(out, 'ewf-blocks.woff2')))

if __name__ == '__main__': main()
