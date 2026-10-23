#!/usr/bin/env python3
"""Build the sound effects (Ryan, 23 October 2026: external assets are allowed; the game gets real recorded sound).

Every sound is a recording that is free to use in a commercial game: Kenney's sound packs (CC0), crowd recordings
from OpenGameArt (CC0) and Wikimedia Commons (public domain). Credits and licences: tools/sfx/CREDITS.md.

Each sound has one to five takes. A short sound is trimmed of silence and brought to the same peak; a crowd loop is
brought to the same loudness and made seamless by crossfading its end into its start. Everything is encoded as small
Opus files and written, base64, into app/addons/sfx-bank.js (window.EWF_SFX_DATA), so the sounds are in the page
itself: they play the moment they are asked for, offline, from a file on disk or in the desktop build.

  SFX_DIR=/path/to/sources python3 tools/sfx/build-sfx.py

SFX_DIR holds the four Kenney packs unzipped (kenney_impact-sounds, kenney_interface-sounds, kenney_rpg-audio,
kenney_ui-audio, under src/) and the crowd recordings (under crowd/), named as in BANK below.
"""
import base64, json, os, subprocess, tempfile
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.environ.get('SFX_DIR', '/home/user/sf/sfx')
OUT = os.path.join(ROOT, 'app', 'addons', 'sfx-bank.js')
SR = 48000

def K(pack, *names):
    return [os.path.join('src', 'kenney_' + pack, 'Audio', n) for n in names]

# id: (group, takes, kind) where kind is 'shot' (trimmed, peak-normalised) or 'loop' (loudness-normalised, seamless)
# or ('cut', start, length) for a piece of a longer recording.
BANK = {
    # the interface: card and paper in the hand
    'ui_press':  ('ui', K('ui-audio', 'click1.ogg', 'click2.ogg', 'click3.ogg', 'click4.ogg'), 'shot'),
    'ui_go':     ('ui', K('rpg-audio', 'bookPlace1.ogg', 'bookPlace2.ogg', 'bookPlace3.ogg'), 'shot'),
    'ui_hover':  ('ui', K('ui-audio', 'rollover1.ogg', 'rollover2.ogg', 'rollover3.ogg'), 'shot'),
    'ui_open':   ('ui', K('rpg-audio', 'bookFlip1.ogg', 'bookFlip2.ogg', 'bookFlip3.ogg'), 'shot'),
    'ui_close':  ('ui', K('rpg-audio', 'bookClose.ogg', 'bookOpen.ogg'), 'shot'),
    'ui_toggle': ('ui', K('interface-sounds', 'toggle_001.ogg', 'toggle_002.ogg', 'toggle_003.ogg'), 'shot'),
    'ui_ok':     ('ui', K('interface-sounds', 'confirmation_001.ogg', 'confirmation_002.ogg'), 'shot'),
    'ui_err':    ('ui', K('interface-sounds', 'error_004.ogg', 'error_006.ogg'), 'shot'),
    'ui_tick':   ('ui', K('interface-sounds', 'tick_001.ogg', 'tick_002.ogg'), 'shot'),
    'ui_call':   ('ui', K('interface-sounds', 'question_001.ogg', 'question_002.ogg'), 'shot'),
    'ui_scroll': ('ui', K('interface-sounds', 'scroll_001.ogg', 'scroll_002.ogg', 'scroll_003.ogg'), 'shot'),
    # the ring: hands, bodies, boards and steel
    'hit':       ('ring', K('impact-sounds', *['impactPunch_medium_00%d.ogg' % i for i in range(5)]), 'shot'),
    'hit_heavy': ('ring', K('impact-sounds', *['impactPunch_heavy_00%d.ogg' % i for i in range(5)]), 'shot'),
    'body':      ('ring', K('impact-sounds', *['impactSoft_heavy_00%d.ogg' % i for i in range(5)]), 'shot'),
    'boards':    ('ring', K('impact-sounds', *['impactWood_heavy_00%d.ogg' % i for i in range(5)]), 'shot'),
    'mat':       ('ring', K('impact-sounds', *['impactSoft_medium_00%d.ogg' % i for i in range(5)]), 'shot'),
    'steel':     ('ring', K('impact-sounds', *['impactMetal_medium_00%d.ogg' % i for i in range(5)]), 'shot'),
    'grab':      ('ring', K('rpg-audio', 'cloth1.ogg', 'cloth2.ogg', 'cloth3.ogg', 'cloth4.ogg'), 'shot'),
    'step':      ('ring', K('impact-sounds', *['footstep_wood_00%d.ogg' % i for i in range(5)]), 'shot'),
    'bell':      ('big', K('impact-sounds', 'impactBell_heavy_000.ogg', 'impactBell_heavy_001.ogg', 'impactBell_heavy_002.ogg'), 'shot'),
    # the crowd
    'crowd_bed': ('crowd', [os.path.join('crowd', 'crowd_shouting.ogg')], 'loop'),
    'crowd_hot': ('crowd', [os.path.join('crowd', 'applause_church.wav')], 'loop'),
    'pop':       ('crowd', [os.path.join('crowd', 'wm-Applause_i.ogg')], ('cut', 0.0, 7.0)),
    'pop_big':   ('crowd', [os.path.join('crowd', 'wm-Slow_starting_applause.ogg')], ('cut', 12.0, 9.0)),
    'ooh':       ('crowd', [os.path.join('crowd', 'ooo.ogg'), os.path.join('crowd', 'wm-Ohhh_ahhh.ogg')], 'shot'),
}

def decode(path, start=None, length=None):
    cmd = ['ffmpeg', '-v', 'error']
    if start is not None: cmd += ['-ss', str(start)]
    if length is not None: cmd += ['-t', str(length)]
    cmd += ['-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()

def loudness(x):
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
            p = os.path.join(SRC, t)
            if not os.path.exists(p): raise SystemExit('missing sound: ' + p)
            if isinstance(kind, tuple):
                x = decode(p, kind[1], kind[2]); n = int(0.4 * SR); x[:n] *= np.linspace(0, 1, n); x[-int(1.5 * SR):] *= np.linspace(1, 0, int(1.5 * SR))
                x *= 10 ** ((-20 - loudness(x)) / 20)
            elif kind == 'loop':
                x = seamless(decode(p)); x *= 10 ** ((-23 - loudness(x)) / 20)
            else:
                x = trim(decode(p)); x *= 0.89 / max(1e-6, np.abs(x).max())
            x = np.clip(x, -0.98, 0.98)
            b = opus(x, '40k' if group == 'crowd' else '64k'); total += len(b)
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
