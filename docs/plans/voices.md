# The commentators say the real lines: blueprint

Status: **shelved** (Ryan, 23 October). The audition (round 10: three commentary pairs, two promos and sixty hard
names, all in real words) was heard, and Ryan's verdict was "I think wah-wah is better". The game keeps wah-wah for
the commentators and the wrestlers (`docs/plans/sound.md`, section 16). Nothing below was built. The blueprint and the
answers are kept in case real voices come back.

## 1. What we have and what changes

- Today every commentary line is wah-wah talk (`docs/plans/sound.md`, section 16): pre-rendered phrases picked to fit
  the line's length. The crowd's count is real words from the same voices, rendered ahead of time.
- The commentary is written while the show runs (`callMatch()` in `src/10-match.js`, the grammar in
  `src/60-grammar.js`): names, moves, titles, cities, the crowd's mood. It cannot be recorded ahead.
- The change: a speech model ships inside the game and speaks each line as it is written, in the play-by-play and
  colour voices. Wah-wah stays for machines too slow to keep up, and as a choice in Options.

## 2. How it works

1. **The model.** Piper's speech model (the same family that made the crowd's count), run inside the game by ONNX
   Runtime Web (MIT licence). The voice set is LibriTTS-R (recordings under CC BY 4.0, already credited in Help), so
   the play-by-play and colour voices can be the ones Ryan has already heard in the count. The model file is about
   78 MB; a smaller voice set (about 25 MB) is a possible trade.
2. **Turning words into sounds** (the step that usually needs espeak, which is GPL and cannot ship in a paid game):
   - every word the commentary grammar can use is known when the game is built, so its pronunciation is worked out
     then and shipped as a word list (data, not code);
   - every name in the built-in worlds (wrestlers, companies, titles, cities, moves) the same way;
   - a name the game has never seen (a wrestler made in Create a Player, a world from the editor) is sounded out by
     simple spelling rules written for the game, and the World Editor can take a "say it like" spelling.
3. **Speaking ahead.** A segment's lines are all known the moment it goes on the air (`seg.bc`), so a background
   worker starts speaking them then, in order, and keeps a line or two ahead of the screen. A line that is not ready
   in time falls back to wah-wah for that line only.
4. **On the air.** When a line appears, its speech plays in the right voice, the crowd dips under it (as now), and it
   stops when the next line comes. At the fastest auto-play pace (Results) only the big lines are spoken.
5. **Slow machines.** The first show times how fast the model runs. If it cannot keep up, the game switches to
   wah-wah and says so once; Options can switch either way.

## 3. What it keeps

Nothing in the save. Preferences gain `voice: 'real' | 'wah'`. The shipped data: the model, the word list, and the
voice choices (which LibriTTS-R speaker is play-by-play, which is colour). Spoken lines are kept for the rest of a
segment and thrown away after it.

## 4. Cost and size

- About 80 MB more on disk with the full model (the game is around 10 MB today plus the 70 MB soundtrack).
- Memory: about 150 to 250 MB while a show is on the air.
- Speed: on a typical desktop the model speaks several times faster than real time; a Steam Deck-class machine is
  borderline, hence the timing check and the fallback.
- The live test page cannot carry an 80 MB file in one piece; it would be split, or the live page keeps wah-wah and
  the Steam build has the real voices.

## 5. What could go wrong

- **Pronunciation.** Parody names and made-up words may come out oddly. The word list and the "say it like" field are
  the fix; Ryan hears samples before anything ships.
- **Repetition.** Real words make repeated lines obvious. The grammar already varies its lines; this may push for
  more variety.
- **Voice quality.** The model is good but not a professional announcer; an audition comes first.
- **Licence.** ONNX Runtime Web is MIT; Piper's own code is GPL and is not shipped, only the model it trained,
  which carries the voice set's licence (CC BY 4.0). To be checked line by line before any build.

## 6. The steps after approval

1. An audition: the same commentary lines spoken by a few speaker pairs, and a page of hard names, so Ryan can hear
   the quality before anything is built.
2. The word list and the spelling rules, tested on every name in the built-in worlds.
3. The model running in the game in a background worker, with the timing check and the fallback.
4. On the broadcast: real voices for the commentators.
5. Options, credits, tests, the live page.

## 7. The questions

Ryan's answers (23 October), one at a time:

1. Size: **the best voice, the full model (about 80 MB).**
2. Who speaks real words: **play-by-play, colour, and wrestlers in promos.** Not the ring announcer.
3. Wrestlers: **each has their own voice**, picked from the hundreds to suit their gender and size, and kept all game.
4. **A voice picker**: a Voice choice with a play button in Create a Player (and the World Editor), and a
   "say it like" spelling for the name.
5. A slow PC: **switch to wah-wah and say so once**; Options can switch back.
6. The live test page: **split the model** so the live page talks too.
7. The fastest pace (Results): **only the big lines are spoken** (near falls, finishes, new champions).
8. The TV pace: **waits for the voice**, so a line is always said in full, even if a show takes a little longer.

What the answers change: section 2's step 4 gains the wait (auto-play moves on when the line has been said); wrestlers'
promo quotes are spoken in their own voices (`w.voice`, a LibriTTS-R speaker, chosen by gender and size the first time,
kept, and changeable in Create a Player); Create a Player gains Voice and a "say it like" field (`look.voice`,
`look.say`).
