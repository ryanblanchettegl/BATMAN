#!/usr/bin/env python3
"""Build the soundtrack's data: app/music/music-data.js.

Reads the fourteen MIDI files in tools/music/midi/ (real scores from the Mutopia Project, see CREDITS.md) and the Fluid R3
instrument samples (CC BY 3.0), and writes one script the game loads before app/addons/soundtrack.js (build.js puts it beside the page):

  window.EWF_MUSIC_DATA = { inst: {...}, pieces: [...] }

Each instrument is a run of single notes, every third semitone across its range, cut to a few seconds, mono, packed
one after another into one Opus file and kept as base64. Held notes loop the steady middle of a sample, so the loop is
cross-faded here. Each piece lists its parts (instrument, level, place left to right) and its notes in time order, packed as bytes in
base64: for each note a varint gap since the last note and a varint length (both in hundredths of a second), then the
pitch, the loudness and the part.

Needs: python3 with numpy and mido, and ffmpeg. The samples come from https://github.com/gleitz/midi-js-soundfonts
(MusyngKite/<instrument>-mp3/<note>.mp3); point SF_DIR at that folder.

  SF_DIR=/path/to/MusyngKite python3 tools/music/build-music.py
"""
import base64, json, os, subprocess, sys
import numpy as np
import mido

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MIDI_DIR = os.path.join(ROOT, 'tools', 'music', 'midi')
OUT = os.path.join(ROOT, 'app', 'music', 'music-data.js')   # build.js copies it beside the page, so the page itself stays small
SF_DIR = os.environ.get('SF_DIR', '/home/user/sf/mjs/MusyngKite')   # the Musyng Kite set (CC BY-SA 3.0): the most real of the free sets
RATE = 48000
NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

# instrument: (sample folder, lowest, highest MIDI note, holds (loops), length in seconds, attack, release)
INST = {
    'piano':   ('acoustic_grand_piano', 21, 108, False, 3.1, 0.004, 0.35),
    'strings': ('string_ensemble_1', 28, 100, True, 2.5, 0.06, 0.35),
    'violin':  ('violin', 55, 103, True, 2.5, 0.03, 0.25),
    'viola':   ('viola', 48, 88, True, 2.5, 0.03, 0.25),
    'cello':   ('cello', 36, 76, True, 2.5, 0.03, 0.3),
    'bass':    ('contrabass', 28, 60, True, 2.5, 0.03, 0.3),
    'harpsichord': ('harpsichord', 29, 89, False, 2.6, 0.002, 0.3),
    'pizz':    ('pizzicato_strings', 28, 96, False, 1.4, 0.002, 0.15),
    'trumpet': ('trumpet', 52, 86, True, 2.5, 0.02, 0.18),
    'horn':    ('french_horn', 34, 77, True, 2.5, 0.04, 0.3),
    'trombone': ('trombone', 40, 74, True, 2.5, 0.03, 0.22),
    'tuba':    ('tuba', 26, 58, True, 2.5, 0.03, 0.25),
    'flute':   ('flute', 60, 98, True, 2.5, 0.03, 0.2),
    'oboe':    ('oboe', 58, 91, True, 2.5, 0.02, 0.18),
    'clarinet': ('clarinet', 50, 94, True, 2.5, 0.02, 0.2),
    'bassoon': ('bassoon', 34, 75, True, 2.5, 0.02, 0.2),
    'timpani': ('timpani', 36, 57, False, 2.6, 0.002, 0.4),
    'organ':   ('church_organ', 24, 96, True, 2.5, 0.03, 0.3),
    'choir':   ('choir_aahs', 40, 84, True, 2.5, 0.08, 0.35),
}
STEP = 2          # strings: one sample every second semitone; the player tunes the rest by a semitone at most
LOOP = (0.9, 2.25)  # the steady middle of a sample, looped for a long note
XF = 0.14         # the cross-fade that hides the loop's seam

# Each piece: id, title, composer, mood, and one plan per part (in the order the MIDI file's parts come).
# A plan is a list of (instrument, level, pan, lowest, highest): a note goes to every instrument whose range holds it.
def a(inst, g=1.0, pan=0.0, lo=0, hi=127): return (inst, g, pan, lo, hi)
VLN1 = [a('strings', 0.9, -0.35), a('violin', 0.45, -0.35)]
VLN2 = [a('strings', 0.8, -0.15), a('violin', 0.35, -0.15)]
VLA = [a('strings', 0.6, 0.15), a('viola', 0.5, 0.15)]
VC = [a('cello', 0.9, 0.35), a('strings', 0.35, 0.35, 0, 60)]
CB = [a('bass', 0.9, 0.45)]
CHOIR = lambda p: [a('choir', 0.75, p)]
PIANO = [[a('piano', 1.0, -0.12)], [a('piano', 1.0, 0.12)]]   # the right hand a touch left of the left hand, as a listener hears a grand
PIECES = [   # Ryan, 22 October: only the mellow classics, as quiet background music
    # Ryan, 22 October: every piece with the instruments it was written for. Bach's Air and Pachelbel's Canon have a continuo
    # (cello, double bass and harpsichord on the bass line); the Prelude in C was written for harpsichord, before the piano.
    ('air', 'Air', 'J. S. Bach', 'Strings', [[a('violin', 0.9, -0.3), a('strings', 0.5, -0.3)], VLN2, VLA, VC + CB + [a('harpsichord', 0.5, 0.1)]]),
    ('canon', 'Canon in D', 'Johann Pachelbel', 'Strings', [[a('violin', 0.8, -0.4), a('strings', 0.4, -0.4)], [a('violin', 0.75, 0.0), a('strings', 0.35, 0.0)], [a('violin', 0.75, 0.4), a('strings', 0.35, 0.4)], VC + [a('bass', 0.6, 0.45), a('harpsichord', 0.5, 0.1)]]),
    ('nachtmusik', 'Eine kleine Nachtmusik', 'W. A. Mozart', 'Strings', [VLN1, VLN2, VLA, VC + [a('bass', 0.6, 0.45)]]),
    ('ase', 'The Death of Ase', 'Edvard Grieg', 'Strings', [VLN1, VLN2, VLA, VC, CB]),
    ('cellosuite', 'Cello Suite No. 1, Prelude', 'J. S. Bach', 'Strings', [[a('cello', 1.0, 0.0)]]),
    ('moonlight', 'Moonlight Sonata', 'Ludwig van Beethoven', 'Piano', PIANO),
    ('gymnopedie1', 'Gymnopedie No. 1', 'Erik Satie', 'Piano', PIANO),
    ('gymnopedie2', 'Gymnopedie No. 2', 'Erik Satie', 'Piano', PIANO),
    ('gymnopedie3', 'Gymnopedie No. 3', 'Erik Satie', 'Piano', PIANO),
    ('gnossienne', 'Gnossienne No. 1', 'Erik Satie', 'Piano', PIANO),
    ('preludec', 'Prelude in C', 'J. S. Bach', 'Harpsichord', [[a('harpsichord', 1.0, -0.1)], [a('harpsichord', 1.0, 0.1)]]),
    ('nocturne', 'Nocturne Op. 9 No. 2', 'Frederic Chopin', 'Piano', PIANO),
    ('elise', 'Fur Elise', 'Ludwig van Beethoven', 'Piano', PIANO),
    ('traumerei', 'Traumerei', 'Robert Schumann', 'Piano', PIANO),
]

# who typeset each score for the Mutopia Project, and its licence (tools/music/CREDITS.md); the jukebox shows this
CRED = {'air': 'Jeff Covey, CC BY-SA 3.0', 'canon': 'Michael Fischer v. Mollard, CC BY 4.0', 'nachtmusik': 'Anonymous, public domain',
        'ase': 'Deborah Lowrey, public domain', 'cellosuite': 'Andreas Scherer, public domain', 'moonlight': 'Stewart Holmes, CC BY-SA 2.5',
        'gymnopedie1': 'Evin Robertson, public domain', 'gymnopedie2': 'Evin Robertson, public domain', 'gymnopedie3': 'Evin Robertson, public domain',
        'gnossienne': 'Knute Snortum, CC BY-SA 4.0', 'preludec': 'Tobias Erbsland, public domain', 'nocturne': 'Renato Biolcati Rinaldi, CC BY-SA 3.0',
        'elise': 'Stelios Samelis, public domain', 'traumerei': 'Ying-Chun Liu, public domain'}

def note_name(m): return NAMES[m % 12] + str(m // 12 - 1)

def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(RATE), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def build_inst(key):
    folder, lo, hi, holds, length, att, rel = INST[key]
    notes = list(range(lo, hi + 1, 1 if key == 'piano' else STEP))   # the piano has a sample on every key, so no note is ever re-tuned
    if notes[-1] != hi: notes.append(hi)
    gap = int(0.08 * RATE); parts = []; offs = []; pos = 0
    for m in notes:
        x = decode(os.path.join(SF_DIR, folder + '-mp3', note_name(m) + '.mp3'))
        n = int(length * RATE); x = np.pad(x, (0, max(0, n - len(x))))[:n]
        if holds:   # cross-fade the end of the loop into its start, so a long note loops without a click
            l0, l1, xf = int(LOOP[0] * RATE), int(LOOP[1] * RATE), int(XF * RATE)
            w = np.linspace(0, 1, xf, dtype=np.float32)
            x[l1 - xf:l1] = x[l1 - xf:l1] * (1 - w) + x[l0 - xf:l0] * w
        fade = int(0.04 * RATE); x[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
        peak = float(np.max(np.abs(x))) or 1.0
        offs.append([m, round(pos / RATE, 5), round(peak, 3)])
        parts.append(x); parts.append(np.zeros(gap, dtype=np.float32)); pos += n + gap
    pcm = np.concatenate(parts)
    enc = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(RATE), '-ac', '1', '-i', '-', '-c:a', 'libopus', '-b:a', '56k', '-application', 'audio', '-f', 'ogg', '-'],
                         input=pcm.tobytes(), capture_output=True, check=True).stdout
    return {'b64': base64.b64encode(enc).decode('ascii'), 'notes': offs, 'len': round(length, 3), 'hold': 1 if holds else 0,
            'loop': [LOOP[0], LOOP[1]] if holds else None, 'att': att, 'rel': rel}

def tempo_map(mf):
    ev = []
    for t in mf.tracks:
        tick = 0
        for msg in t:
            tick += msg.time
            if msg.type == 'set_tempo': ev.append((tick, msg.tempo))
    ev.sort(); m = [(0, 0.0, 500000)]
    for tick, tempo in ev:
        t0, s0, q = m[-1]; s = s0 + (tick - t0) * q / 1e6 / mf.ticks_per_beat
        if tick == t0: m[-1] = (t0, s0, tempo)
        else: m.append((tick, s, tempo))
    return m

def secs(m, tick, tpb):
    i = len(m) - 1
    while m[i][0] > tick: i -= 1
    t0, s0, q = m[i]; return s0 + (tick - t0) * q / 1e6 / tpb

def piece_notes(path, plans):
    mf = mido.MidiFile(path); tm = tempo_map(mf); tpb = mf.ticks_per_beat
    tracks = [t for t in mf.tracks if any(x.type == 'note_on' and x.velocity > 0 for x in t)]
    if len(tracks) != len(plans): raise SystemExit('%s: %d parts in the file, %d in the plan' % (path, len(tracks), len(plans)))
    parts = []; notes = []
    for ti, (t, plan) in enumerate(zip(tracks, plans)):
        tick = 0; on = {}; ped = False; held = []; raw = []
        for msg in t:
            tick += msg.time
            if msg.type == 'control_change' and msg.control == 64:
                ped = msg.value >= 64
                if not ped:
                    for (k, s0, v) in held: raw.append((s0, tick, k, v))
                    held = []
            elif msg.type == 'note_on' and msg.velocity > 0: on.setdefault(msg.note, []).append((tick, msg.velocity))
            elif msg.type in ('note_off', 'note_on'):
                if on.get(msg.note):
                    s0, v = on[msg.note].pop(0)
                    if ped: held.append((msg.note, s0, v))
                    else: raw.append((s0, tick, msg.note, v))
        for (k, s0, v) in held: raw.append((s0, tick, k, v))
        for s0, s1, k, v in raw:
            ts, te = secs(tm, s0, tpb), secs(tm, s1, tpb)
            for inst, g, pan, lo, hi in plan:
                if lo <= k <= hi:
                    key = (inst, g, pan)
                    if key not in [p[:3] for p in parts]: parts.append((inst, g, pan))
                    pi = [p[:3] for p in parts].index(key)
                    notes.append((ts, max(0.05, te - ts), k, v, pi))
    notes.sort(key=lambda n: (n[0], n[4], n[2]))
    out = bytearray(); last = 0
    def vi(n):
        while True:
            b = n & 127; n >>= 7
            if n: out.append(b | 128)
            else: out.append(b); return
    for ts, d, k, v, pi in notes:
        cs = int(round(ts * 100)); vi(cs - last); vi(max(1, int(round(d * 100)))); out += bytes([k, v, pi]); last = cs
    return [{'i': p[0], 'g': p[1], 'p': p[2]} for p in parts], base64.b64encode(bytes(out)).decode('ascii'), len(notes), round(notes[-1][0] + notes[-1][1], 1) if notes else 0

def main():
    used = set(); pieces = []
    for pid, title, comp, mood, plans in PIECES:
        parts, packed, count, dur = piece_notes(os.path.join(MIDI_DIR, pid + '.mid'), plans)
        used.update(p['i'] for p in parts)
        pieces.append({'id': pid, 'n': title, 'c': comp, 'mood': mood, 'by': CRED[pid], 'dur': dur, 'parts': parts, 'count': count, 'notes': packed})
        print('%-14s %5.0fs %6d notes %4d KB  %s' % (pid, dur, count, len(packed) // 1024, ', '.join(sorted(set(p['i'] for p in parts)))))
    inst = {}
    for k in INST:
        if k in used:
            inst[k] = build_inst(k); print('%-10s %4d KB' % (k, len(inst[k]['b64']) * 3 // 4 // 1024))
    data = {'inst': inst, 'pieces': pieces, 'samples': 'Musyng Kite sound set, rendered by Benjamin Gleitzman, CC BY-SA 3.0'}
    with open(OUT, 'w') as f:
        f.write('/* The soundtrack\'s data, written by tools/music/build-music.py: fourteen mellow classical pieces from Mutopia Project scores and the\n'
                '   Musyng Kite instrument samples (CC BY-SA 3.0). Credits and licences: tools/music/CREDITS.md. Do not edit by hand. */\n')
        f.write('window.EWF_MUSIC_DATA=' + json.dumps(data, separators=(',', ':')) + ';\n')
    print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB')

if __name__ == '__main__':
    main()
