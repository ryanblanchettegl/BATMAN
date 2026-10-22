#!/usr/bin/env python3
"""Build the soundtrack: app/addons/music-notes.js (the pieces) and app/music/<instrument>.js (the recorded instruments).

Ryan, 22 October 2026: fourteen mellow classics, each with the instruments it was written for, as close to a great
orchestra as free recordings allow. The notes come from real scores (the Mutopia Project, tools/music/midi/, see
CREDITS.md). The instruments are recorded players:

  - the string sections and the double bass of the Versilian Studios Chamber Orchestra 2 (VSCO 2 CE, CC0), each in three
    ways of playing: held (sustained with vibrato), short (spiccato) and plucked (pizzicato), at two or three loudness
    levels, with alternate takes for the short and plucked notes so repeats never sound copied;
  - the VSCO 2 solo violin (soft and loud), for the Canon's three violins;
  - the Salamander Grand Piano by Alexander Holm (CC BY 3.0), a Yamaha C5, at three loudness levels;
  - the Musyng Kite harpsichord and solo cello (CC BY-SA 3.0), for the continuo and Bach's Prelude in C and Cello Suite.

Each instrument is one stereo Opus file of its samples one after another, kept as base64 in its own script, so the game
loads only what the piece playing needs. Long held notes loop the steady middle of a sample; the loop is cross-faded here.

Needs python3 with numpy and mido, and ffmpeg with libopus. Point the folders at clones of
  VSCO_DIR   https://github.com/sgossner/VSCO-2-CE
  SAL_DIR    https://github.com/sfzinstruments/SalamanderGrandPiano  (Samples/<note>v4|v8|v12.flac)
  SF_DIR     https://github.com/gleitz/midi-js-soundfonts            (MusyngKite)
  python3 tools/music/build-music.py
"""
import base64, glob, json, os, re, subprocess
import numpy as np
import mido

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MIDI_DIR = os.path.join(ROOT, 'tools', 'music', 'midi')
NOTES_OUT = os.path.join(ROOT, 'app', 'addons', 'music-notes.js')
INST_OUT = os.path.join(ROOT, 'app', 'music')   # build.js copies these beside the page as dist/music/
VSCO = os.environ.get('VSCO_DIR', '/home/user/sf/VSCO-2-CE')
SAL = os.environ.get('SAL_DIR', '/home/user/sf/SalamanderGrandPiano')
SF = os.environ.get('SF_DIR', '/home/user/sf/mjs/MusyngKite')
RATE = 48000
NN = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

def midi_of(name):
    m = re.match(r'([A-G])(#?)(-?\d)', name)
    return 12 * (int(m.group(3)) + 1) + NN[m.group(1)] + (1 if m.group(2) else 0)

# Instruments. 'off' corrects a library's octave names: VSCO's sections and double bass call middle C "C3" (checked
# against each sample's harmonics), so their names sound an octave higher than they read.
# Each way of playing: folder, the length of sample kept, and whether a long note loops.
VS = VSCO + '/Strings/'
INST = {
    'vln':   {'n': 'Violins', 'off': 12, 'att': 0.06, 'rel': 0.45, 'arts': {
        'sus': (VS + 'Violin Section/susVib', 5.0, True), 'spic': (VS + 'Violin Section/Spic', 1.6, False), 'pizz': (VS + 'Violin Section/Pizz', 1.2, False)}},
    'vla':   {'n': 'Violas', 'off': 12, 'att': 0.06, 'rel': 0.45, 'arts': {
        'sus': (VS + 'Viola Section/susvib', 5.0, True), 'spic': (VS + 'Viola Section/spic', 1.0, False), 'pizz': (VS + 'Viola Section/pizz', 0.8, False)}},
    'vc':    {'n': 'Cellos', 'off': 12, 'att': 0.06, 'rel': 0.5, 'arts': {
        'sus': (VS + 'Cello Section/susvib', 5.0, True), 'spic': (VS + 'Cello Section/spic', 1.5, False), 'pizz': (VS + 'Cello Section/pizzT', 2.0, False)}},
    'cb':    {'n': 'Double bass', 'off': 12, 'att': 0.05, 'rel': 0.5, 'arts': {
        'sus': (VS + 'Solo Contrabass/SusVib', 5.0, True), 'spic': (VS + 'Solo Contrabass/Spic', 1.1, False), 'pizz': (VS + 'Solo Contrabass/Pizz', 1.8, False)}},
    'vsolo': {'n': 'Solo violin', 'off': 0, 'att': 0.05, 'rel': 0.4, 'arts': {
        'sus': (VS + 'Solo Violin/Arco Vib', 6.0, True)}},
    'piano': {'n': 'Grand piano', 'off': 0, 'att': 0.002, 'rel': 0.35, 'arts': {
        'sus': (SAL + '/Samples', 6.0, False)}},
    'harpsichord': {'n': 'Harpsichord', 'off': 0, 'att': 0.002, 'rel': 0.25, 'mk': ('harpsichord', 29, 89, 2), 'arts': {
        'sus': (None, 2.6, False)}},
    'cellosolo': {'n': 'Solo cello', 'off': 0, 'att': 0.04, 'rel': 0.35, 'mk': ('cello', 36, 76, 2), 'arts': {
        'sus': (None, 2.5, True)}},
}
LOOP = (2.0, 4.6)    # the steady middle of a held string note, looped when the score holds it longer
XF = 0.3             # the cross-fade that hides the loop's seam
LAYER_RANK = {'p': 0, 'f': 1}

def layer_of(name):
    m = re.search(r'_(v\d+|[pf])(?:_|\.)', name) or re.search(r'v(\d+)\.flac$', name)
    s = m.group(1)
    if s in LAYER_RANK: return LAYER_RANK[s]
    return int(s.lstrip('v'))

def samples_of(key, art):
    I = INST[key]; folder, length, holds = I['arts'][art]
    if 'mk' in I:
        name, lo, hi, step = I['mk']
        return [(m, 0, 0, os.path.join(SF, name + '-mp3', NAMES[m % 12] + str(m // 12 - 1) + '.mp3')) for m in range(lo, hi + 1, step)]
    out = []
    for f in sorted(glob.glob(folder + '/*.wav') + glob.glob(folder + '/*.flac')):
        b = os.path.basename(f)
        nm = re.search(r'(?:^|_)([A-G]#?\d)(?=_|v\d)', b)
        if not nm: continue
        rr = re.search(r'_(?:rr|RR)(\d)', b) or re.search(r'_v\d_(\d)\.wav$', b)
        out.append((midi_of(nm.group(1)) + I['off'], layer_of(b), int(rr.group(1)) - 1 if rr else 0, f))
    # loudness layers become 0, 1, 2 ... in order, whatever a library numbers them
    ranks = sorted(set(s[1] for s in out)); out = [(m, ranks.index(l), r, f) for (m, l, r, f) in out]
    return out

def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(RATE), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()

def trim_start(x):
    """Cut the silence before the note speaks, keeping a few milliseconds of its attack."""
    a = np.abs(x).max(axis=1); pk = a.max() or 1.0
    i = int(np.argmax(a > pk * 0.02)); return x[max(0, i - int(0.004 * RATE)):]

def build_inst(key):
    I = INST[key]; chunks = []; arts = {}; pos = 0; gap = int(0.06 * RATE)
    for art, (folder, length, holds) in I['arts'].items():
        rows = []
        lp = ((0.9, 2.25) if 'mk' in I else LOOP) if holds else None
        for (m, layer, rr, f) in samples_of(key, art):
            x = trim_start(decode(f)); n = int(length * RATE)
            x = np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n]
            if holds:
                l0, l1, xf = int(lp[0] * RATE), int(lp[1] * RATE), int((0.14 if 'mk' in I else XF) * RATE)
                w = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
                x[l1 - xf:l1] = x[l1 - xf:l1] * (1 - w) + x[l0 - xf:l0] * w
            fade = int(0.08 * RATE); x[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)[:, None]
            peak = float(np.abs(x).max()) or 1.0
            rows.append([m, layer, rr, round(pos / RATE, 5), round(peak, 3)])
            chunks.append(x); chunks.append(np.zeros((gap, 2), dtype=np.float32)); pos += n + gap
        arts[art] = {'s': rows, 'len': length, 'loop': list(lp) if lp else None, 'nl': 1 + max(r[1] for r in rows)}
    pcm = np.concatenate(chunks)
    enc = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(RATE), '-ac', '2', '-i', '-', '-c:a', 'libopus', '-b:a', '64k', '-application', 'audio', '-f', 'ogg', '-'],
                         input=pcm.tobytes(), capture_output=True, check=True).stdout
    return {'n': I['n'], 'att': I['att'], 'rel': I['rel'], 'arts': arts, 'b64': base64.b64encode(enc).decode('ascii')}

# ---- the pieces: each part of the score, played by the instruments it was written for ----
def a(inst, g=1.0, pan=0.0, lo=0, hi=127): return (inst, g, pan, lo, hi)
VLN1 = [a('vln', 1.0, -0.4)]
VLN2 = [a('vln', 0.9, -0.15)]
VLA = [a('vla', 0.9, 0.15)]
VC = [a('vc', 0.95, 0.35)]
CB = [a('cb', 0.8, 0.5)]
CONTINUO = [a('vc', 0.8, 0.3), a('cb', 0.6, 0.45), a('harpsichord', 0.45, 0.1)]
PIANO = [[a('piano', 1.0, -0.1)], [a('piano', 1.0, 0.1)]]   # the right hand a touch left of the left, as a listener hears a grand
PIECES = [   # Ryan, 22 October: only the mellow classics, as quiet background music, each with its own instruments
    ('air', 'Air', 'J. S. Bach', 'Strings', [VLN1, VLN2, VLA, CONTINUO]),
    ('canon', 'Canon in D', 'Johann Pachelbel', 'Strings', [[a('vsolo', 0.9, -0.45)], [a('vsolo', 0.85, 0.0)], [a('vsolo', 0.85, 0.45)], CONTINUO]),
    ('nachtmusik', 'Eine kleine Nachtmusik', 'W. A. Mozart', 'Strings', [VLN1, VLN2, VLA, VC + [a('cb', 0.6, 0.5)]]),
    ('ase', 'The Death of Ase', 'Edvard Grieg', 'Strings', [VLN1, VLN2, VLA, VC, CB]),
    ('cellosuite', 'Cello Suite No. 1, Prelude', 'J. S. Bach', 'Strings', [[a('cellosolo', 1.0, 0.0)]]),
    ('moonlight', 'Moonlight Sonata', 'Ludwig van Beethoven', 'Piano', PIANO),
    ('gymnopedie1', 'Gymnopedie No. 1', 'Erik Satie', 'Piano', PIANO),
    ('gymnopedie2', 'Gymnopedie No. 2', 'Erik Satie', 'Piano', PIANO),
    ('gymnopedie3', 'Gymnopedie No. 3', 'Erik Satie', 'Piano', PIANO),
    ('gnossienne', 'Gnossienne No. 1', 'Erik Satie', 'Piano', PIANO),
    ('nocturne', 'Nocturne Op. 9 No. 2', 'Frederic Chopin', 'Piano', PIANO),
    ('elise', 'Fur Elise', 'Ludwig van Beethoven', 'Piano', PIANO),
    ('traumerei', 'Traumerei', 'Robert Schumann', 'Piano', PIANO),
    ('preludec', 'Prelude in C', 'J. S. Bach', 'Harpsichord', [[a('harpsichord', 1.0, -0.1)], [a('harpsichord', 1.0, 0.1)]]),
]
# who typeset each score for the Mutopia Project, and its licence (tools/music/CREDITS.md); the jukebox shows this
CRED = {'air': 'Jeff Covey, CC BY-SA 3.0', 'canon': 'Michael Fischer v. Mollard, CC BY 4.0', 'nachtmusik': 'Anonymous, public domain',
        'ase': 'Deborah Lowrey, public domain', 'cellosuite': 'Andreas Scherer, public domain', 'moonlight': 'Stewart Holmes, CC BY-SA 2.5',
        'gymnopedie1': 'Evin Robertson, public domain', 'gymnopedie2': 'Evin Robertson, public domain', 'gymnopedie3': 'Evin Robertson, public domain',
        'gnossienne': 'Knute Snortum, CC BY-SA 4.0', 'preludec': 'Tobias Erbsland, public domain', 'nocturne': 'Renato Biolcati Rinaldi, CC BY-SA 3.0',
        'elise': 'Stelios Samelis, public domain', 'traumerei': 'Ying-Chun Liu, public domain'}

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
    """Every note of every part: start, length, pitch, loudness, part and whether it is plucked (the score switches the
    part to pizzicato strings, General MIDI program 45, for those bars). The sustain pedal lengthens piano notes."""
    mf = mido.MidiFile(path); tm = tempo_map(mf); tpb = mf.ticks_per_beat
    tracks = [t for t in mf.tracks if any(x.type == 'note_on' and x.velocity > 0 for x in t)]
    if len(tracks) != len(plans): raise SystemExit('%s: %d parts in the file, %d in the plan' % (path, len(tracks), len(plans)))
    parts = []; notes = []
    for t, plan in zip(tracks, plans):
        tick = 0; on = {}; ped = False; held = []; raw = []; prog = 0
        for msg in t:
            tick += msg.time
            if msg.type == 'program_change': prog = msg.program
            elif msg.type == 'control_change' and msg.control == 64:
                ped = msg.value >= 64
                if not ped:
                    for (k, s0, v, pz) in held: raw.append((s0, tick, k, v, pz))
                    held = []
            elif msg.type == 'note_on' and msg.velocity > 0: on.setdefault(msg.note, []).append((tick, msg.velocity, 1 if prog == 45 else 0))
            elif msg.type in ('note_off', 'note_on'):
                if on.get(msg.note):
                    s0, v, pz = on[msg.note].pop(0)
                    if ped: held.append((msg.note, s0, v, pz))
                    else: raw.append((s0, tick, msg.note, v, pz))
        for (k, s0, v, pz) in held: raw.append((s0, tick, k, v, pz))
        for s0, s1, k, v, pz in raw:
            ts, te = secs(tm, s0, tpb), secs(tm, s1, tpb)
            for inst, g, pan, lo, hi in plan:
                if lo <= k <= hi:
                    key = (inst, g, pan)
                    if key not in parts: parts.append(key)
                    notes.append((ts, max(0.05, te - ts), k, v, parts.index(key), pz))
    notes.sort(key=lambda n: (n[0], n[4], n[2]))
    out = bytearray(); last = 0
    def vi(n):
        while True:
            b = n & 127; n >>= 7
            if n: out.append(b | 128)
            else: out.append(b); return
    for ts, d, k, v, pi, pz in notes:
        cs = int(round(ts * 100)); vi(cs - last); vi(max(1, int(round(d * 100)))); out += bytes([k, v, pi, pz]); last = cs
    return ([{'i': p[0], 'g': p[1], 'p': p[2]} for p in parts], base64.b64encode(bytes(out)).decode('ascii'), len(notes),
            round(notes[-1][0] + notes[-1][1], 1) if notes else 0)

def main():
    os.makedirs(INST_OUT, exist_ok=True)
    used = set(); pieces = []
    for pid, title, comp, group, plans in PIECES:
        parts, packed, count, dur = piece_notes(os.path.join(MIDI_DIR, pid + '.mid'), plans)
        used.update(p['i'] for p in parts)
        pieces.append({'id': pid, 'n': title, 'c': comp, 'mood': group, 'by': CRED[pid], 'dur': dur, 'parts': parts, 'count': count, 'notes': packed})
        print('%-12s %4.0fs %6d notes  %s' % (pid, dur, count, ', '.join(sorted(set(p['i'] for p in parts)))))
    for old in glob.glob(os.path.join(INST_OUT, '*.js')): os.remove(old)
    sizes = {}
    for k in INST:
        if k not in used: continue
        d = build_inst(k)
        with open(os.path.join(INST_OUT, k + '.js'), 'w') as f:
            f.write('/* %s for the soundtrack, written by tools/music/build-music.py. Credits: tools/music/CREDITS.md. */\n' % d['n'])
            f.write('(window.EWF_MUSIC_INST=window.EWF_MUSIC_INST||{})[' + json.dumps(k) + ']=' + json.dumps(d, separators=(',', ':')) + ';\n')
        sizes[k] = os.path.getsize(os.path.join(INST_OUT, k + '.js')) // 1024
        print('%-12s %5d KB  %s' % (k, sizes[k], ', '.join('%s %d' % (a_, len(v['s'])) for a_, v in d['arts'].items())))
    data = {'pieces': pieces, 'inst': sorted(used), 'credit': 'Scores from the Mutopia Project. Instruments: Versilian Studios Chamber Orchestra 2 (CC0), '
            'Salamander Grand Piano by Alexander Holm (CC BY 3.0), Musyng Kite harpsichord and solo cello (CC BY-SA 3.0).'}
    with open(NOTES_OUT, 'w') as f:
        f.write('/* The soundtrack\'s pieces, written by tools/music/build-music.py from real scores (tools/music/midi/). The instruments are\n'
                '   app/music/<instrument>.js, loaded when a piece needs them. Credits and licences: tools/music/CREDITS.md. Do not edit by hand. */\n')
        f.write('window.EWF_MUSIC_DATA=' + json.dumps(data, separators=(',', ':')) + ';\n')
    print('wrote', NOTES_OUT, os.path.getsize(NOTES_OUT) // 1024, 'KB and', len(sizes), 'instruments,', sum(sizes.values()), 'KB')

if __name__ == '__main__':
    main()
