#!/usr/bin/env python3
"""Build the soundtrack from real recordings (Ryan, 22 October 2026: "all real music").

Twenty mellow classical recordings by real orchestras, quartets and pianists, every one free to use: the Musopen
Kickstarter recordings and Musopen's Chopin collection (public domain and CC0), Kimiko Ishizaka's Well-Tempered Clavier
and Karine Gilanyan's Beethoven (public domain), and the United States Air Force Band (a work of the US government).
Credits and licences: tools/music/CREDITS.md. The jukebox shows who recorded each piece.

Each recording is brought to the same loudness, given a short fade in and out, and written as an Opus file to
app/music/<id>.ogg; app/addons/music-list.js is the list the jukebox reads. build.js copies the recordings beside the
page as dist/music/. The originals are not kept in the repository: point REC_DIR at a folder holding them, named <id>.mp3
or <id>.ogg (download them from the archive.org items in REC below).

  REC_DIR=/path/to/recordings python3 tools/music/build-recordings.py
"""
import json, os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REC_DIR = os.environ.get('REC_DIR', '/home/user/sf/rec')
OUT_DIR = os.path.join(ROOT, 'app', 'music')
LIST = os.path.join(ROOT, 'app', 'addons', 'music-list.js')
TARGET = -23.0   # loudness every recording is brought to (LUFS): quiet music sits under the game, and no piece jumps out
PD, CC0, USG = 'Public domain', 'CC0', 'Public domain (US government work)'
MCOL = 'https://archive.org/details/MusopenCollectionAsFlac'
CHOPIN = 'https://archive.org/details/musopen-chopin'

# id, title, composer, who recorded it, group, licence, where it came from
REC = [
    ('air', 'Air (Orchestral Suite No. 3)', 'J. S. Bach', 'United States Air Force Band', 'Orchestra', USG, 'https://archive.org/details/AirSuiteNo.3InDMajor'),
    ('morning', 'Morning Mood (Peer Gynt)', 'Edvard Grieg', 'Czech National Symphony Orchestra, for Musopen', 'Orchestra', PD, MCOL),
    ('ase', 'The Death of Ase (Peer Gynt)', 'Edvard Grieg', 'Czech National Symphony Orchestra, for Musopen', 'Orchestra', PD, MCOL),
    ('brahms3', 'Symphony No. 3, Poco allegretto', 'Johannes Brahms', 'Czech National Symphony Orchestra, for Musopen', 'Orchestra', PD, MCOL),
    ('brahms2', 'Symphony No. 2, Adagio non troppo', 'Johannes Brahms', 'Czech National Symphony Orchestra, for Musopen', 'Orchestra', PD, MCOL),
    ('mozart40', 'Symphony No. 40, Andante', 'W. A. Mozart', 'Czech National Symphony Orchestra, for Musopen', 'Orchestra', PD, MCOL),
    ('scottish', 'Scottish Symphony, Adagio', 'Felix Mendelssohn', 'Czech National Symphony Orchestra, for Musopen', 'Orchestra', PD, MCOL),
    ('suk', 'Meditation on an Old Czech Chorale', 'Josef Suk', 'Musopen String Quartet', 'Strings', PD, MCOL),
    ('borodin', 'String Quartet No. 2, Nocturne', 'Alexander Borodin', 'Czech National Symphony Orchestra, for Musopen', 'Strings', PD, MCOL),
    ('dvorak', 'String Quartet "American", Lento', 'Antonin Dvorak', 'Musopen String Quartet', 'Strings', PD, MCOL),
    ('haydn', 'String Quartet "The Lark", Adagio cantabile', 'Joseph Haydn', 'Musopen String Quartet', 'Strings', PD, MCOL),
    ('nocturne', 'Nocturne Op. 9 No. 2', 'Frederic Chopin', 'Frank Levy', 'Piano', PD, 'https://archive.org/details/nocturneineflatmajorop.9no.2'),
    ('nocturne272', 'Nocturne Op. 27 No. 2', 'Frederic Chopin', 'Parts Unknown', 'Piano', CC0, CHOPIN),
    ('nocturne721', 'Nocturne Op. 72 No. 1', 'Frederic Chopin', 'Parts Unknown', 'Piano', CC0, CHOPIN),
    ('raindrop', 'Prelude Op. 28 No. 15 "Raindrop"', 'Frederic Chopin', 'Parts Unknown', 'Piano', CC0, CHOPIN),
    ('waltz691', 'Waltz Op. 69 No. 1', 'Frederic Chopin', 'Parts Unknown', 'Piano', CC0, CHOPIN),
    ('preludec', 'Prelude in C (The Well-Tempered Clavier)', 'J. S. Bach', 'Kimiko Ishizaka', 'Piano', PD, 'https://archive.org/details/bach-well-tempered-clavier-book-1'),
    ('goldberg', 'Goldberg Variations, Aria', 'J. S. Bach', 'Shelley Katz, for Musopen', 'Piano', PD, MCOL),
    ('schubert', 'Sonata in A major D. 664, Andante', 'Franz Schubert', 'Paul Pitman, for Musopen', 'Piano', PD, MCOL),
    ('beethoven15', 'Sonata No. 15 "Pastoral", Andante', 'Ludwig van Beethoven', 'Karine Gilanyan', 'Piano', PD,
     'https://archive.org/details/karine-gilanyan-beethoven-piano-sonata-nr.-15-in-d-major-op.-28-pastoral'),
]

def source(rid):
    for ext in ('.mp3', '.ogg', '.flac', '.wav'):
        p = os.path.join(REC_DIR, rid + ext)
        if os.path.exists(p): return p
    raise SystemExit('missing recording: ' + rid)

def loudness(path):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', err)[-1])

def duration(path):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout)

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    keep = set(); pieces = []
    for rid, title, comp, by, group, lic, link in REC:
        src = source(rid); dur = duration(src); gain = TARGET - loudness(src); out = os.path.join(OUT_DIR, rid + '.ogg')
        af = 'volume=%.2fdB,alimiter=limit=0.89:level=false,afade=t=in:d=1.5,afade=t=out:st=%.2f:d=3' % (gain, max(0, dur - 3))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', '48000', '-ac', '2', '-c:a', 'libopus', '-b:a', '64k', '-vbr', 'on', out], check=True)
        keep.add(rid + '.ogg')
        pieces.append({'id': rid, 'n': title, 'c': comp, 'by': by, 'mood': group, 'lic': lic, 'link': link, 'dur': round(dur, 1), 'src': 'music/' + rid + '.ogg'})
        print('%-12s %5.0fs %+5.1f dB %5d KB  %s' % (rid, dur, gain, os.path.getsize(out) // 1024, by))
    for f in os.listdir(OUT_DIR):
        if f not in keep: os.remove(os.path.join(OUT_DIR, f))
    with open(LIST, 'w') as f:
        f.write('/* The soundtrack: twenty real recordings, written by tools/music/build-recordings.py. Credits: tools/music/CREDITS.md. */\n')
        f.write('window.EWF_MUSIC_DATA=' + json.dumps({'pieces': pieces}, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('wrote', len(pieces), 'recordings,', sum(os.path.getsize(os.path.join(OUT_DIR, k)) for k in keep) // 1024 // 1024, 'MB')

if __name__ == '__main__':
    main()
