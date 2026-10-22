# The soundtrack: recordings and credits

The game's music is twenty mellow classical recordings by real orchestras, string quartets and pianists (Ryan,
22 October 2026: all real music, quiet background music by default, in a random order). Every recording is free to use
in the game: released into the public domain or under CC0 by the people who made it, or made by the United States
government. The jukebox names who recorded each piece; where the performer is not named by the source, the credit is
"Parts Unknown" (Ryan's choice).

| Piece | Composer | Recorded by | Licence | Source |
| --- | --- | --- | --- | --- |
| Air (Orchestral Suite No. 3) | J. S. Bach | United States Air Force Band | Public domain (US government work) | https://archive.org/details/AirSuiteNo.3InDMajor |
| Morning Mood (Peer Gynt) | Edvard Grieg | Czech National Symphony Orchestra, for Musopen | Public domain | https://archive.org/details/MusopenCollectionAsFlac |
| The Death of Ase (Peer Gynt) | Edvard Grieg | Czech National Symphony Orchestra, for Musopen | Public domain | same |
| Symphony No. 3, Poco allegretto | Johannes Brahms | Czech National Symphony Orchestra, for Musopen | Public domain | same |
| Symphony No. 2, Adagio non troppo | Johannes Brahms | Czech National Symphony Orchestra, for Musopen | Public domain | same |
| Symphony No. 40, Andante | W. A. Mozart | Czech National Symphony Orchestra, for Musopen | Public domain | same |
| Scottish Symphony, Adagio | Felix Mendelssohn | Czech National Symphony Orchestra, for Musopen | Public domain | same |
| Meditation on an Old Czech Chorale | Josef Suk | Musopen String Quartet | Public domain | same |
| String Quartet No. 2, Nocturne | Alexander Borodin | Czech National Symphony Orchestra players, for Musopen | Public domain | same |
| String Quartet "American", Lento | Antonin Dvorak | Musopen String Quartet | Public domain | same |
| String Quartet "The Lark", Adagio cantabile | Joseph Haydn | Musopen String Quartet | Public domain | same |
| Goldberg Variations, Aria | J. S. Bach | Shelley Katz, for Musopen | Public domain | same |
| Sonata in A major D. 664, Andante | Franz Schubert | Paul Pitman, for Musopen | Public domain | same |
| Nocturne Op. 9 No. 2 | Frederic Chopin | Frank Levy | Public domain (marked by the YIVO Institute, which uploaded it) | https://archive.org/details/nocturneineflatmajorop.9no.2 |
| Nocturne Op. 27 No. 2 | Frederic Chopin | Parts Unknown | CC0 (Musopen) | https://archive.org/details/musopen-chopin |
| Nocturne Op. 72 No. 1 | Frederic Chopin | Parts Unknown | CC0 (Musopen) | same |
| Prelude Op. 28 No. 15 "Raindrop" | Frederic Chopin | Parts Unknown | CC0 (Musopen) | same |
| Waltz Op. 69 No. 1 | Frederic Chopin | Parts Unknown | CC0 (Musopen) | same |
| Prelude in C (The Well-Tempered Clavier) | J. S. Bach | Kimiko Ishizaka | Public domain | https://archive.org/details/bach-well-tempered-clavier-book-1 |
| Sonata No. 15 "Pastoral", Andante | Ludwig van Beethoven | Karine Gilanyan | Public domain | https://archive.org/details/karine-gilanyan-beethoven-piano-sonata-nr.-15-in-d-major-op.-28-pastoral |

Musopen asks, as a courtesy and not a condition, that its recordings be credited and not sold on their own. The game
credits them in the jukebox and does not sell the recordings.

## Rebuilding

`tools/music/build-recordings.py` brings every recording to the same loudness, adds a short fade in and out, and writes
`app/music/<id>.ogg` (Opus) and `app/addons/music-list.js`. The originals are not kept in the repository: download them
from the sources above into a folder, named `<id>.mp3` or `<id>.ogg` with the ids in the script, and run
`REC_DIR=<that folder> python3 tools/music/build-recordings.py`. `node build.js` copies the recordings beside the page as
`dist/music/`; publish that folder with the page.
