"""Builds the interface typeface: Inter (SIL Open Font License 1.1) cut down to the letters the game uses, in three
weights, as woff2 files the build embeds (rule 2: nothing is fetched). The paper look's text face (Ryan, 19 October:
"the DOS days are over"). Needs fontTools and brotli, and Inter installed (Debian: fonts-inter).
    python3 tools/build-ui-font.py      # app/fonts/inter-400.woff2, inter-600.woff2, inter-800.woff2"""
import os
from fontTools import subset
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = '/usr/share/fonts/opentype/inter'
# Latin, Latin-1, the punctuation the game writes (curly quotes, dashes, the dot, arrows) and a few signs
TEXT = ''.join(chr(c) for c in range(0x20, 0x7f)) + ''.join(chr(c) for c in range(0xa0, 0x180)) + '‘’“”–—…·•′″€£¥←↑→↓▲▼►◄★☆✓✕×÷±≈≤≥♫'
for w, f in [(400, 'Inter-Regular.otf'), (600, 'Inter-SemiBold.otf'), (800, 'InterDisplay-ExtraBold.otf')]:
    out = os.path.join(ROOT, 'app', 'fonts', 'inter-%d.woff2' % w)
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['kern', 'liga', 'calt', 'tnum', 'ss01']; opts.name_IDs = ['*']; opts.notdef_outline = True
    font = subset.load_font(os.path.join(SRC, f), opts); s = subset.Subsetter(opts); s.populate(text=TEXT); s.subset(font)
    subset.save_font(font, out, opts); print(out, os.path.getsize(out))
