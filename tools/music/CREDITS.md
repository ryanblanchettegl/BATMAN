# The soundtrack: sources and credits

The game's music is fourteen mellow classical pieces, quiet background music by default (Ryan, 22 October 2026). The
compositions are all in the public domain. The notes come from scores typeset by volunteers for the Mutopia Project
(https://www.mutopiaproject.org), turned into MIDI with LilyPond, and are played in the game by recorded piano,
harpsichord and string samples from the Musyng Kite sound set.

## Instrument samples

Musyng Kite sound set, rendered by Benjamin Gleitzman (https://github.com/gleitz/midi-js-soundfonts), licensed under
Creative Commons Attribution-ShareAlike 3.0 (https://creativecommons.org/licenses/by-sa/3.0/).

## Scores

| Piece | Composer | Typeset by (Mutopia) | Licence of the score |
| --- | --- | --- | --- |
| Air (Orchestral Suite No. 3, BWV 1068) | J. S. Bach | Jeff Covey, Mutopia-2008/10/28-242 | CC BY-SA 3.0 |
| Canon in D for three violins and bass | Johann Pachelbel | Michael Fischer v. Mollard, Mutopia-2015/09/02-2047 | CC BY 4.0 |
| Eine kleine Nachtmusik, first movement (K. 525) | W. A. Mozart | Anonymous, Mutopia-2007/01/01-900 | Public domain |
| The Death of Ase (Peer Gynt) | Edvard Grieg | Deborah Lowrey, Mutopia-2014/03/24-247 | Public domain |
| Cello Suite No. 1, Prelude (BWV 1007) | J. S. Bach | Andreas Scherer, Mutopia-2018/01/19-517 | Public domain |
| Moonlight Sonata, first movement (Op. 27 No. 2) | Ludwig van Beethoven | Stewart Holmes, Mutopia-2007/02/11-276 | CC BY-SA 2.5 |
| Gymnopedie No. 1 | Erik Satie | Evin Robertson, Mutopia-2014/12/14-37 | Public domain |
| Gymnopedie No. 2 | Erik Satie | Evin Robertson, Mutopia-2012/12/23-38 | Public domain |
| Gymnopedie No. 3 | Erik Satie | Evin Robertson, Mutopia-2012/12/23-39 | Public domain |
| Gnossienne No. 1 | Erik Satie | Knute Snortum, Mutopia-2015/07/23-2035 | CC BY-SA 4.0 |
| Prelude in C (The Well-Tempered Clavier, BWV 846) | J. S. Bach | Tobias Erbsland, Mutopia-2011/09/12-5 | Public domain |
| Nocturne Op. 9 No. 2 | Frederic Chopin | Renato Biolcati Rinaldi, Mutopia-2014/12/18-1590 | CC BY-SA 3.0 |
| Fur Elise (WoO 59) | Ludwig van Beethoven | Stelios Samelis, Mutopia-2015/08/18-931 | Public domain |
| Traumerei (Scenes from Childhood, Op. 15 No. 7) | Robert Schumann | Ying-Chun Liu, Mutopia-2005/12/27-504 | Public domain |

## What is under which licence

The MIDI files in `tools/music/midi/` and the note data the build writes into `app/music/music-data.js` are derived
from the scores above, and each piece's notes carry that score's licence: share-alike pieces (CC BY-SA) stay free for
anyone to reuse under the same licence, with this credit. The instrument samples in `app/music/music-data.js` carry
CC BY-SA 3.0. The game's own code, including the player in `app/addons/soundtrack.js` and the arrangements in
`tools/music/build-music.py`, stays all rights reserved (Ryan, 22 October 2026). The jukebox in the game names the
typesetter and licence of each piece and the sample set.

## Rebuilding

The MIDI files were made with LilyPond 2.25 (`pip install lilypond`, then `convert-ly` and `lilypond` on each Mutopia
score). The samples come from a clone of https://github.com/gleitz/midi-js-soundfonts (`MusyngKite/<instrument>-mp3`).
`SF_DIR=<that folder> python3 tools/music/build-music.py` writes `app/music/music-data.js`; `node build.js` copies it
beside the page as `dist/music-data.js`.
