# Sound effects: sources and credits

Every sound in the game was picked by Ryan, by ear, on the audition page (23 October 2026; `docs/plans/sound.md`,
section 14). Each is free to use in a commercial game. `tools/sfx/build-sfx.py` trims them, evens their levels and
writes them into the page (`app/addons/sfx-bank.js`); the code that plays them is `app/src/audio/`.

## The broadcast

| In the game | Recording | Made by | Licence | Source |
| --- | --- | --- | --- | --- |
| The ring bell (`bell`) | Tubular bell, F5, struck (`Percussion/TB_hit_F5_v3_rr1.wav`) | Versilian Studios, VSCO 2 Community Edition | CC0 | https://github.com/sgossner/VSCO-2-CE |
| The crowd under the show (`bed`) | SBssa_Crowd Talking 010 (Soccer Stadium Ambience) | Sonic Bat | Sonniss GDC bundle licence: royalty free, commercial use, no credit required | archive.org item `gameaudiogdc-part1through7`, GDC 2020 bundle |
| The pop (`pop`) | Crowd Cheering Exterior, Big Surge, Rose Bowl Stadium, Applause (Surround At The Show 1) | 2496SoundEffects | Sonniss GDC bundle licence | archive.org item `gameaudiogdc-part1through7`, GDC 2019 bundle |
| The gasp on a kick-out (`gasp`) | SBssa_Goal Miss 002 (Soccer Stadium Ambience) | Sonic Bat | Sonniss GDC bundle licence | archive.org item `gameaudiogdc-part1through7`, GDC 2020 bundle |
| Strikes (`hit`) | punch_general_body_impact_03 (Punch Sound Pack) | Gamemaster Audio | Sonniss GDC bundle licence | archive.org item `SonnissGameAudioGDCPart3`, GDC 2017 bundle |
| Slams (`slam`) | RL_bodyfall_Wood_Rustic_M2_Distant_Mono_Soft_Impact_07 (Bodyfall) | Red Libraries | Sonniss GDC bundle licence | archive.org item `gameaudiogdc-part1through7`, GDC 2019 bundle |

The Sonniss licence (in each bundle as `License.pdf`) grants a worldwide, royalty-free licence to use the sounds in
commercial games without attribution. The game credits the makers anyway.

## The voices

| In the game | How it is made | Licence |
| --- | --- | --- |
| The crowd shouting the count (`cnt_big_*`, `cnt_small_*`: one, two, three, a broken-off "thr", eight, nine, ten) | Rendered by `tools/sfx/build-voices.py` with Piper, a free offline speech engine (a GPL program; its licence covers the program, not the sound it makes), from its LibriTTS-R voices: 44 voices for a big house, 12 for a small hall, layered with small differences in timing and pitch and given a room's echo | LibriTTS-R, CC BY 4.0: credited in the game's credits (Y. Koizumi et al., LibriTTS-R; https://www.openslr.org/141/) |
| The commentators' wah-wah talk (`wah_pbp`, `wah_col`) | Made-up words spoken by two LibriTTS-R voices, turned into a soft muted horn that follows their rhythm and pitch | as above |
| Wrestlers on the microphone (`mic_woman`, `mic_man`, `mic_big`) | The same, sharper and louder (Ryan's pick) | as above |

## The office (next step)

Piano figures played on the Salamander Grand Piano by Alexander Holm (CC BY 3.0: credited in the game's credits),
https://github.com/sfzinstruments/SalamanderGrandPiano.

## Still to find

Boos, and a mixed reaction for tweeners. Every booing recording in the libraries reachable from the build machine was
rejected; Freesound.org has more but is blocked by the cloud environment's network settings.

## Rebuilding

Download the originals into `<folder>/keep/` under the names in `BANK` (the archive.org items above hold each file as
FLAC), check out VSCO 2 (`VSCO_DIR`), and run `SFX_DIR=<folder> python3 tools/sfx/build-sfx.py`, then `node build.js`.
It needs ffmpeg and numpy.
