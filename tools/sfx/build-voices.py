#!/usr/bin/env python3
"""Render the broadcast's voices (Ryan, 23 October; docs/plans/sound.md, section 16): the crowd shouting the count and
the commentators' wah-wah talk. They are made with Piper, a free offline speech engine, and its LibriTTS-R voices
(recordings under CC BY 4.0, credited in tools/sfx/CREDITS.md). The game cannot run Piper, and its lines are written
while the show runs, so this renders banks ahead of time: every count word for a big house and a small hall, and a
set of wah-wah phrases of different lengths for each commentator. tools/sfx/build-sfx.py puts them in the page.

  python3 -m venv <dir> && <dir>/bin/pip install piper-tts
  (download en_US-libritts_r-medium.onnx and .onnx.json from huggingface.co/rhasspy/piper-voices into PIPER_DIR)
  PIPER_DIR=<dir> OUT_DIR=<dir>/voices <dir>/bin/python tools/sfx/build-voices.py
"""
import io, os, re, random, subprocess, wave
import numpy as np
from piper import PiperVoice, SynthesisConfig

PIPER = os.environ.get('PIPER_DIR', '/home/user/sf/piper')
OUT = os.environ.get('OUT_DIR', '/home/user/sf/keep/voices')
SR, OSR = 22050, 48000
V = PiperVoice.load(os.path.join(PIPER, 'en_US-libritts_r-medium.onnx'))
# speakers picked from a pitch survey of the 904: a lively mid voice for play-by-play, a low one for colour,
# and a crowd pool of men and women
PBP, COL = 102, 36
MEN = [36, 438, 600, 132, 426, 564, 456, 816, 102, 270, 510, 390, 6, 12, 24, 42, 66, 78, 84, 96, 108, 114, 120, 126]
WOMEN = [162, 408, 378, 150, 60, 54, 18, 30, 48, 72, 90, 138, 144, 168, 174, 180]

def say(text, spk, length=1.0, noise=0.667):
    b = io.BytesIO(); w = wave.open(b, 'wb')
    V.synthesize_wav(text, w, syn_config=SynthesisConfig(speaker_id=spk, length_scale=length, noise_scale=noise))
    w.close(); b.seek(0); r = wave.open(b, 'rb')
    x = np.frombuffer(r.readframes(r.getnframes()), np.int16).astype(np.float32) / 32768
    a = np.abs(x); i = np.where(a > 0.02 * a.max())[0]
    x = x[max(0, i[0] - 60):i[-1] + 200] if len(i) else x
    return resample(x, SR / OSR)

def resample(x, rate):
    idx = np.arange(0, len(x) - 1, rate); return np.interp(idx, np.arange(len(x)), x).astype(np.float32)

def place(parts, total):
    out = np.zeros((int(total * OSR), 2), np.float32)
    for t, x, g in parts:
        s = int(t * OSR); e = min(len(out), s + len(x)); out[s:e] += x[:e - s] * g
    return out

def reverb(st, secs, mix, seed):
    r = np.random.default_rng(seed); n = int(secs * OSR); t = np.arange(n) / OSR
    ir = np.stack([r.standard_normal(n) * np.exp(-t * 4.5) for _ in (0, 1)], 1).astype(np.float32)
    L = len(st) + n; N = 1 << (L - 1).bit_length()
    wet = np.stack([np.fft.irfft(np.fft.rfft(st[:, c], N) * np.fft.rfft(ir[:, c], N), N)[:len(st)] for c in (0, 1)], 1)
    wet *= np.abs(st).max() / max(1e-6, np.abs(wet).max())
    return (st * (1 - mix) + wet * mix).astype(np.float32)

def lowpass(x, hz, poles=4):
    a = np.exp(-2 * np.pi * hz / OSR); y = x.astype(np.float64)
    for _ in range(poles):
        out = np.empty_like(y); s = 0.0
        for i in range(len(y)): s = (1 - a) * y[i] + a * s; out[i] = s
        y = out
    return y.astype(np.float32)

def write(st, name):
    path = os.path.join(OUT, name + '.wav')
    st = st / max(1e-6, np.abs(st).max()) * 0.89
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(OSR), '-ac', '2', '-i', '-', path],
                   input=st.astype(np.float32).tobytes(), check=True)

# ---- the crowd shouting the count: many voices, a little apart in time and pitch, in the room's echo
def crowd_word(word, n, seed, room):
    r = random.Random(seed); m = int(n * 0.6)
    spk = r.sample(MEN * 2, min(m, len(MEN) * 2)) + r.sample(WOMEN * 3, min(n - m, len(WOMEN) * 3))
    parts = []
    for s in spk:
        x = say(word + '!', s, length=r.uniform(1.15, 1.45), noise=0.8); x = resample(x, r.uniform(0.95, 1.07))
        x = np.tanh(x * 2.2) / np.tanh(2.2)
        pan = r.uniform(-0.8, 0.8); parts.append((r.uniform(0, 0.13), np.stack([x * (1 - max(0, pan)), x * (1 + min(0, pan))], 1), r.uniform(0.45, 1.0)))
    st = place(parts, max(len(p[1]) for p in parts) / OSR + 0.2)
    return reverb(st, 1.6 * room + 0.3, 0.18 + 0.15 * room, seed)

def thr(x):
    """The third count, broken off: the crowd stops the moment the shoulder comes up."""
    y = x[:int(0.16 * OSR)].copy(); f = int(0.04 * OSR); y[-f:] *= np.linspace(1, 0, f)[:, None]; return y

# ---- wah-wah talk: made-up words spoken by the commentator's voice, turned into a soft muted horn that follows
#      the rhythm and pitch of the speech (the Charlie Brown adults, but more chill)
NONSENSE = ['sul sul', 'dag dag', 'nooboo', 'fleeba', 'zibba', 'woona', 'grifta', 'lalo', 'vadish', 'oobee', 'shimma',
            'nerba', 'dabba', 'fizzo', 'gorpa', 'bimby', 'tullo', 'meeka', 'rondo', 'vappa', 'yibble', 'kosha', 'pelly']
def babble(n, r, end):
    words = []; got = 0
    while got < n:
        w = r.choice(NONSENSE); words.append(w); got += len(re.findall(r'[aeiouy]+', w))
    out = ''
    for i, w in enumerate(words): out += w + (', ' if i % 4 == 3 and i < len(words) - 1 else ' ')
    return out.strip() + end

def wah(x):
    fr = int(0.02 * OSR); n = len(x) // fr
    env = np.array([np.sqrt((x[i * fr:(i + 1) * fr] ** 2).mean()) for i in range(n)])
    pitch = np.zeros(n)
    for i in range(n):
        f = x[max(0, i * fr - fr):(i + 1) * fr + fr]; f = f - f.mean()
        if len(f) < 3 * fr or env[i] < 0.15 * env.max(): continue
        c = np.correlate(f, f, 'full')[len(f) - 1:]; lo, hi = int(OSR / 350), int(OSR / 70); k = lo + np.argmax(c[lo:hi])
        if c[k] > 0.25 * c[0]: pitch[i] = OSR / k
    last = 0
    for i in range(n):
        if pitch[i] > 0: last = pitch[i]
        elif env[i] > 0.15 * env.max() and last: pitch[i] = last
    fp = np.repeat(pitch, fr); ep = np.convolve(np.repeat(env / env.max(), fr), np.ones(fr * 2) / (fr * 2), 'same')
    saw = (2 * (np.cumsum(fp / OSR) % 1) - 1) * (fp > 0); y = saw * ep
    y = lowpass(y, 380) * (1 - ep) + lowpass(y, 900) * ep
    return np.stack([y, y], 1).astype(np.float32)

def main():
    os.makedirs(OUT, exist_ok=True)
    for size, n, room in (('big', 44, 1.0), ('small', 12, 0.2)):
        for i, w in enumerate(['One', 'Two', 'Three', 'Eight', 'Nine', 'Ten']):
            x = crowd_word(w, n, 1000 * (size == 'big') + i, room)
            write(x, 'crowd_%s_%s' % (size, w.lower()))
            if w == 'Three': write(thr(x), 'crowd_%s_thr' % size)
        print('crowd', size)
    for role, spk, rate in (('pbp', PBP, 1.05), ('col', COL, 0.95)):
        r = random.Random(role)
        for k, n in enumerate([3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32]):
            x = resample(say(babble(n, r, '!' if role == 'pbp' and k % 3 == 0 else '.'), spk, noise=0.7), rate)
            write(wah(x), 'wah_%s_%02d' % (role, k))
        print('wah', role)

if __name__ == '__main__':
    main()
