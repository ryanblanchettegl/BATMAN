#!/usr/bin/env python3
"""Build the sound effects (Ryan, 23 October 2026). Only sounds Ryan picked by ear on the audition page are built
(docs/plans/sound.md, section 14). The broadcast: professional recordings from the Sonniss game audio bundles (royalty
free, no credit required, credited anyway) and a tubular bell from the VSCO 2 orchestral library (CC0). Credits and
licences: tools/sfx/CREDITS.md.

Each sound is trimmed, brought to an even level and written, as Opus in base64, into app/addons/sfx-bank.js
(window.EWF_SFX_DATA), so the sounds are in the page itself: they play at once, offline, from disk or the desktop build.

  SFX_DIR=/path/to/sources python3 tools/sfx/build-sfx.py

SFX_DIR holds the originals under the names in BANK: keep/<id>.flac (downloaded from the Sonniss mirrors on
archive.org; the item and path of each are in CREDITS.md) and the VSCO 2 checkout (VSCO_DIR).
"""
import base64, json, os, subprocess, tempfile
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.environ.get('SFX_DIR', '/home/user/sf')
VSCO = os.environ.get('VSCO_DIR', '/home/user/sf/VSCO-2-CE')
OUT = os.path.join(ROOT, 'app', 'addons', 'sfx-bank.js')
SR = 48000

# id: (group, [source], kind) where kind is 'shot' (trimmed, peak-normalised), 'loop' (loudness-normalised, seamless)
# or ('cut', start, length, lufs) for a piece of a longer recording.
BANK = {
    # the broadcast (Ryan's picks, audition rounds 1 to 3)
    'bell':   ('big',   [os.path.join(VSCO, 'Percussion', 'TB_hit_F5_v3_rr1.wav')], ('cut', 0.0, 3.0, -18)),
    'bed':    ('crowd', [os.path.join(SRC, 'keep', 'bed_stadium.flac')], 'loop'),
    'pop':    ('crowd', [os.path.join(SRC, 'keep', 'pop_rosebowl.flac')], ('cut', 0.0, 10.9, -18)),
    'gasp':   ('crowd', [os.path.join(SRC, 'keep', 'gasp_goalmiss.flac')], ('cut', 0.0, 9.0, -18)),
    'hit':    ('ring',  [os.path.join(SRC, 'keep', 'hit_body.flac')], 'shot'),
    'slam':   ('ring',  [os.path.join(SRC, 'keep', 'slam_bodyfall.flac')], 'shot'),
}
# the voices (audition rounds 7 to 9; rendered by tools/sfx/build-voices.py): the crowd shouting the count, a big house
# and a small hall, and wah-wah talk, the takes of each voice sorted shortest first so the game can fit one to a line
VOX = os.path.join(SRC, 'keep', 'voices')
for size in ('big', 'small'):
    for w in ('one', 'two', 'three', 'thr', 'eight', 'nine', 'ten'):
        BANK['cnt_%s_%s' % (size, w)] = ('crowd', [os.path.join(VOX, 'crowd_%s_%s.wav' % (size, w))], 'shot')
# the office: piano figures (audition rounds 4 to 6; rendered by tools/sfx/build-piano.py), loudness set per figure
PNO = os.path.join(SRC, 'keep', 'piano')
for k, l in (('pn_small', -30), ('pn_big', -24), ('pn_pop', -26), ('pn_good', -22), ('pn_bad', -24), ('pn_week', -22),
             ('pn_grade_a', -20), ('pn_grade_b', -21), ('pn_grade_c', -22), ('pn_grade_d', -23), ('pn_grade_f', -24),
             ('pn_feud', -20), ('pn_champ', -20), ('pn_star', -21)):
    BANK[k] = ('ui', [os.path.join(PNO, k + '.wav')], ('lufs', l))
for v in ('wah_pbp', 'wah_col', 'mic_woman', 'mic_man', 'mic_big'):
    BANK[v] = ('voice', sorted(os.path.join(VOX, f) for f in os.listdir(VOX) if f.startswith(v + '_')), 'shot')

def decode(path, start=None, length=None):
    cmd = ['ffmpeg', '-v', 'error']
    if start is not None: cmd += ['-ss', str(start)]
    if length is not None: cmd += ['-t', str(length)]
    cmd += ['-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()

def loudness(x):
    # the meter needs 0.4 seconds to read anything (a shorter clip reads as silence and was boosted into noise), so a
    # short clip is measured repeated end to end, which reads the same loudness as the clip itself
    if len(x) < 1.2 * SR: x = np.tile(x, int(np.ceil(1.2 * SR / max(1, len(x)))))
    with tempfile.NamedTemporaryFile(suffix='.wav') as f:
        encode_wav(x, f.name)
        err = subprocess.run(['ffmpeg', '-hide_banner', '-i', f.name, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float([l for l in err.splitlines() if 'I:' in l and 'LUFS' in l][-1].split()[1])

def encode_wav(x, path):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', path], input=x.astype(np.float32).tobytes(), check=True)

def trim(x, floor=0.004):
    a = np.abs(x); idx = np.where(a > floor * a.max())[0]
    if not len(idx): return x
    x = x[max(0, idx[0] - int(0.002 * SR)): idx[-1] + int(0.03 * SR)]
    n = min(len(x), int(0.004 * SR)); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x

def seamless(x, fade=1.5):
    """A loop with no seam: the last `fade` seconds are mixed into the first, fading out as the start fades in."""
    n = int(fade * SR); body, tail = x[:-n].copy(), x[-n:]
    w = np.linspace(0, 1, n); body[:n] = body[:n] * np.sqrt(w) + tail * np.sqrt(1 - w)
    return body

def opus(x, br):
    with tempfile.NamedTemporaryFile(suffix='.ogg') as f:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libopus', '-b:a', br, '-vbr', 'on', f.name],
                       input=x.astype(np.float32).tobytes(), check=True)
        return open(f.name, 'rb').read()

def main():
    bank = {}; total = 0
    for sid, (group, takes, kind) in BANK.items():
        out = []
        for t in takes:
            p = t
            if not os.path.exists(p): raise SystemExit('missing sound: ' + p)
            if isinstance(kind, tuple) and kind[0] == 'lufs':
                x = trim(decode(p)); x *= 10 ** ((kind[1] - loudness(x)) / 20)
            elif isinstance(kind, tuple):
                x = trim(decode(p, kind[1], kind[2])); n = int(0.02 * SR); x[:n] *= np.linspace(0, 1, n); f = int(min(1.5, kind[2] * 0.4) * SR); x[-f:] *= np.linspace(1, 0, f)
                x *= 10 ** ((kind[3] - loudness(x)) / 20)
            elif kind == 'loop':
                x = seamless(decode(p)); x *= 10 ** ((-23 - loudness(x)) / 20)
            else:
                x = trim(decode(p)); x *= 0.89 / max(1e-6, np.abs(x).max())
            if (np.abs(x) > 0.98).mean() > 0.005: raise SystemExit('%s comes out clipped: check its level' % sid)   # never ship noise
            x = np.clip(x, -0.98, 0.98)
            b = opus(x, {'crowd': '40k', 'voice': '32k'}.get(group, '64k')); total += len(b)
            out.append(base64.b64encode(b).decode())
        bank[sid] = {'g': group, 'loop': kind == 'loop', 't': out}
        print('%-10s %-6s %d takes' % (sid, group, len(out)))
    with open(OUT, 'w') as f:
        f.write('/* The sound effects, written by tools/sfx/build-sfx.py: recordings free to use (tools/sfx/CREDITS.md), as Opus in base64.\n'
                '   app/src/audio/ decodes them the first time sound plays. */\n')
        f.write('window.EWF_SFX_DATA=' + json.dumps(bank, separators=(',', ':')) + ';\n')
    print('wrote', len(bank), 'sounds,', total // 1024, 'KB of audio,', os.path.getsize(OUT) // 1024, 'KB as text')

if __name__ == '__main__':
    main()
