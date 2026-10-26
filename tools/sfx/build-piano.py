#!/usr/bin/env python3
"""Render the office's piano figures (Ryan's picks, audition rounds 4 to 6; docs/plans/sound.md, section 14) from the
Salamander Grand Piano by Alexander Holm (CC BY 3.0, credited in the game's Help, Credits). Each figure is a few notes
from the piano's own samples, moved by at most a semitone and a half; tools/sfx/build-sfx.py puts them in the page.

  SAMPLES=<SalamanderGrandPiano/Samples> OUT_DIR=<dir> python3 tools/sfx/build-piano.py
"""
import os, re, subprocess
import numpy as np

SAMP = os.environ.get('SAMPLES', '/home/user/sf/SalamanderGrandPiano/Samples')
OUT = os.environ.get('OUT_DIR', '/home/user/sf/keep/piano')
SR = 48000
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
S = {}
for f in os.listdir(SAMP):
    m = re.match(r'([A-G]#?)(\d)v(\d+)\.flac', f)
    if m: S[(12 * (int(m.group(2)) + 1) + NOTE[m.group(1)], int(m.group(3)))] = f
cache = {}

def dec(f):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                                        capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()

def trim(x, floor=0.003):
    a = np.abs(x).mean(1); i = np.where(a > floor * a.max())[0]; return x[max(0, i[0] - 20):]

def fadeout(x, secs):
    n = min(len(x), int(secs * SR)); x = x.copy(); x[-n:] *= np.linspace(1, 0, n)[:, None]; return x

def note(name, vel, ring):
    m = re.match(r'([A-G]#?)(\d)', name); midi = 12 * (int(m.group(2)) + 1) + NOTE[m.group(1)]
    base = min({k[0] for k in S if k[1] == vel}, key=lambda k: abs(k - midi))
    if (base, vel) not in cache: cache[(base, vel)] = trim(dec(os.path.join(SAMP, S[(base, vel)])))
    x = cache[(base, vel)]; r = 2 ** ((midi - base) / 12); x = x[:int(ring * SR * r) + 2]; idx = np.arange(0, len(x) - 1, r)
    y = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1).astype(np.float32)
    return fadeout(y[:int(ring * SR)], min(ring * 0.6, 0.9))

def play(events, ring):
    total = max(t for t, *_ in events) + ring + 0.1; out = np.zeros((int(total * SR), 2), np.float32)
    for t, n, v, g in events:
        x = note(n, v, ring); s = int(t * SR); e = min(len(out), s + len(x)); out[s:e] += x[:e - s] * g
    return out

def seq(notes, gap, vel, g=1.0, start=0): return [(start + i * gap, n, vel, g) for i, n in enumerate(notes)]
def chord(notes, t, vel, g=0.8, roll=0.0): return [(t + i * roll, n, vel, g) for i, n in enumerate(notes)]

# id: (events, ring) exactly as auditioned
FIG = {
    'pn_small': (seq(['E6'], 0, 4), 0.35),                                                    # small presses
    'pn_big': (seq(['C6', 'E6', 'G6'], 0.045, 4), 1.0),                                       # big actions
    'pn_pop': (seq(['G5', 'C6'], 0.06, 4), 0.9),                                              # a pop-up opens
    'pn_good': (seq(['C5', 'E5', 'G5'], 0.1, 8), 1.6),                                        # good news
    'pn_bad': (seq(['A2'], 0, 4), 2.0),                                                       # bad news
    'pn_week': (seq(['C5', 'D5', 'E5', 'G5', 'C6'], 0.06, 8), 1.6),                           # the week ends
    'pn_grade_a': (seq(['C5', 'E5', 'G5', 'C6'], 0.09, 8) + seq(['E6'], 0, 12, 1, start=0.42), 2.4),
    'pn_grade_b': (seq(['E4', 'G4'], 0.14, 8) + chord(['C5', 'E5'], 0.3, 8, .8), 2.0),
    'pn_grade_c': (seq(['G4', 'C5'], 0.22, 8), 1.6),
    'pn_grade_d': (seq(['E4', 'C4', 'A3'], 0.22, 4), 2.0),
    'pn_grade_f': (chord(['A2', 'C3', 'E3'], 0, 4, .8, 0.03), 2.8),
    'pn_feud': (chord(['G3', 'D4', 'B4'], 0, 8, .8) + chord(['C3', 'C4', 'E4', 'G4', 'C5'], 0.55, 12, .8, 0.02), 3.0),
    'pn_champ': (seq(['G5', 'C6', 'E6', 'G6'], 0.07, 8) + seq(['C7', 'E7'], 0.12, 8, 1, start=0.34), 2.4),
    'pn_star': (seq(['E5', 'G5', 'C6'], 0.1, 8) + seq(['E6', 'G6'], 0.08, 4, 1, start=0.38), 2.0),
}

def main():
    os.makedirs(OUT, exist_ok=True)
    for k, (ev, ring) in FIG.items():
        x = play(ev, ring); x = x / max(1e-6, np.abs(x).max()) * 0.89
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', os.path.join(OUT, k + '.wav')],
                       input=x.astype(np.float32).tobytes(), check=True)
        print(k)

if __name__ == '__main__':
    main()
