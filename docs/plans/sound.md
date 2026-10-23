# Sound effects, the redo: blueprint

Status: **gate 3 of 3** (CLAUDE.md rule 9d). The blueprint is written and Ryan has answered every question (section 13,
23 October). No code is written until he says go.

## 1. Where we are and why the first try failed

- The soundtrack works: twenty real classical recordings, quiet by default, in a random order, with a Jukebox.
- On 23 October a first set of sound effects went in and Ryan's verdict was "It sounds terrible". It is switched off
  (`SFX_ON = false` in `app/src/audio/engine.ts`). The game is silent apart from the music.
- Why it failed:
  1. **Nobody listened before it shipped.** The sounds were picked by measuring files, not by ear.
  2. **Cheap sources.** Kenney's packs are made for small arcade games; they sound like a toy next to an orchestra.
     The crowd was a church applause and a street crowd shouting, not an arena.
  3. **A bell that is not a bell.** A heavy metal clank pitched up.
  4. **Too much of it.** A sound on every press, every hover and every line of commentary. Even good sounds tire.
- What carries over: the engine (`engine.ts`) works well. Groups, a limiter, voice limits, a minimum gap before a
  sound repeats, takes with small changes in pitch and level, crowd loops that glide, ducking. It never touches the
  game. The redo keeps it and changes what goes in and when.

## 2. The direction (Ryan, 23 October)

> "The sound doesn't need to match papercraft. It can work well with the classical music. It just needs to feel good."

What "feels good" means here, as working principles:

1. **It belongs with the music.** The music is a concert hall: strings, piano, a symphony orchestra. Sounds on the
   desk and in menus come from that world: plucked strings, a piano, a celesta, soft mallets, a piano note, a page
   turning. Nothing electronic, nothing arcade.
2. **One instrument, one fixed voice.** The office speaks in piano (Ryan's pick, after hearing harp), with fixed
   notes that do not follow the key of the music.
3. **Quiet and few.** A sound is a reward, not a reflex. Most presses are silent or nearly so. The sounds people
   remember are the few that mark something that matters.
4. **The size of the sound matches the size of the moment.** A routine choice gets a whisper; signing a star, a new
   champion or an A-grade show gets a real moment.
5. **The broadcast is the one loud place.** On the air the world becomes an arena: the bell, the crowd, the ring. It
   is mixed the way television mixes it: under the commentary, never on top of it. The music keeps playing as normal.
6. **Approved by ear, one sound at a time.** Nothing goes into the game that Ryan has not heard and picked.

## 3. The moments (what makes a sound)

Each moment has a tier: **1** must have, **2** good to have, **3** probably never (listed so the answer is on record).

### The office (music playing)

| Moment | Tier | Idea |
| --- | --- | --- |
| Pressing a big action (Book the show, Run show, Sign, End week) | 1 | A clear piano pluck |
| Opening and closing a pop-up | 2 | A soft page turn or paper slide, very low |
| A good result (signed, deal made) | 1 | Two piano notes rising |
| A refusal or a problem | 1 | One low, soft note; never a buzzer |
| Something new needs you (a matter on the desk, a call) | 1 | A single chime, the kind that makes you look up |
| A week ends | 2 | A short rising figure, the page turns on the week |
| Pointing at a button, moving the highlight | 3 | Silent by default |
| Ordinary small presses (tabs, lists) | 2 | Silent, or a very soft tick; Ryan decides |
| Typing commentary | 3 | Silent |

### The broadcast (on the air)

| Moment | Tier | Idea |
| --- | --- | --- |
| The show goes on the air | 1 | The crowd rises from nothing as the picture comes up |
| The opening bell | 1 | A real timekeeper's bell, one or two rings |
| The finishing bell | 1 | The real bell, rung several times |
| The crowd under the whole show | 1 | A real arena murmur that follows the crowd meter |
| A near fall | 1 | The crowd's rising "two!" and the gasp on the kick-out |
| The three count | 1 | The crowd counting with the referee, then the pop |
| A new champion | 1 | The biggest pop of the night |
| Entrances | 2 | The crowd's reaction (cheer for a hero, boos for a villain) |
| Strikes, slams, the turnbuckle | 2 | Real ring impacts, mixed well back; only on big moves |
| A cheap finish, a DQ, a count-out | 2 | Boos and jeers |
| A call from the gorilla position | 1 | The same chime as the desk's "something needs you" |
| The sign-off | 2 | The crowd fades, the music comes back up |

### After the show

| Moment | Tier | Idea |
| --- | --- | --- |
| The grade appears | 1 | A short musical sting sized to the grade: warm for an A, flat for a D |
| A matter the night left | 1 | The "something needs you" chime |

## 4. The palette: three ways to go

**A. All music.** Every sound is an instrument: the office as in section 3, and the broadcast too (a struck bell,
timpani for slams, strings swelling for a near fall). The crowd is the only real-world sound, or none.
Feels like a film score. Risk: the broadcast loses the feel of a live show.

**B. All real.** Real arena, real ring, real bell, and real-world desk sounds (paper, a pen, a stapler). Feels like
a documentary. Risk: real-world sounds clash with a symphony, which is what went wrong last time.

**C. Both, in their places (recommended).** The office and menus are musical, in piano (A). The broadcast is a real
arena mixed like television (B), with the music playing as normal (Ryan's pick). Each world sounds right in
its own place, and the switch between them marks going on the air.

## 5. How it moves (the states)

```
            first press
 [Silent] ─────────────▶ [Office]  music at its level, office sounds
                            │  ▲
              Run show      │  │  Office (SPACE) after the show
                            ▼  │
                       [On the air]  music as normal, crowd bed up, arena sounds
                            │
                  sign-off  ▼
                      [After the show]  crowd fades over a few seconds, piano sting for the grade
                            │
                            └──▶ [Office]

 Any state ── window hidden ──▶ [Paused]  everything holds; returns to where it was
 Any state ── Sound off ──────▶ [Silent]
```

- On the air the music keeps playing at its own level (Ryan).
- A call from the gorilla position holds the crowd at its level while the call waits (Ryan).

## 6. What it keeps (data)

Nothing about sound goes in the save. It lives in preferences and in the page.

- **Sound bank entry:** `{ id, group, takes: [file], gain, approved: bool, source, licence, by }`. Only entries with
  `approved: true` are built into the page. Credits in `tools/sfx/CREDITS.md`.
- **Moment table:** `{ moment, sound, tier, gainByScale, every }` in `cues.ts`: which sound, how loud for how big a
  moment, and the least time between two of them.
- **Preferences:** Sound effects on or off, effects volume, crowd volume, and (if Ryan wants it) Button sounds on or
  off. Only the music starts Low; everything else starts at Normal (Ryan, 23 October).

## 7. Mixing and fatigue

- **Levels:** the music is brought to -23 LUFS. Office sounds sit at or under the music. The broadcast's crowd bed sits
  under the commentary's reading pace, peaks only on a pop.
- **How often:** every sound has a least time before it plays again; office sounds also have a budget (for example,
  no more than one musical note every 300 ms, so fast clicking stays calm).
- **Variety:** two to five takes of everything that repeats, picked at random, with a small change in pitch and level.
- **Ducking:** a big moment lowers the crowd for a beat; the grade sting lowers the music for a beat.

## 8. The reward loop

Sound has no effect on the game: it never reads or writes the game's state and cannot change a result. Its job is
the feel of the "one more turn" loop:

- **Scale:** each moment has a size from 1 to 5 (a routine press is 1; signing a top star, a new champion or an A show
  is 5). The sound grows with the size: more notes, a richer instrument, a longer tail, a bigger pop.
- **Rarity:** the big sounds are rare, so they stay special. A size-5 sound might play once or twice an evening.
- **Escalation on the broadcast:** the crowd bed follows the meter, so a hot show sounds hotter as it builds, and the
  main event's finish is the loudest moment of the night.
- **No punishment noise:** a bad result is a low, soft note, never a buzzer. A bad night should feel heavy, not mocked.

## 9. How Ryan picks the sounds (the audition)

The first try failed because nobody listened. The fix is a listening step before anything reaches the game:

1. Claude gathers two to four candidates for each tier-1 and tier-2 moment from the sources in section 10.
2. They go on a private **audition page** (an artifact Ryan opens in the browser): every moment, its candidates side by
   side, a play button each, and **Keep** or **Reject** on each one. A "With the music" switch plays each candidate
   over a few seconds of the soundtrack, so he hears it in place.
3. Ryan's picks are saved on the page; Claude reads them back and builds only what was kept.
4. Anything rejected outright gets new candidates in a second round.

The audition page is a tool for choosing, not part of the game.

## 10. Where the sounds can come from

All free to use in a commercial Steam game; each file's source and licence goes in the credits.

| Source | What it is good for | Licence | Reachable from here |
| --- | --- | --- | --- |
| Sonniss GDC game audio bundles (mirrored on archive.org) | Professional arena crowds, a boxing bell, ring and body impacts, cloth, paper | Royalty-free, commercial use, no credit required (the Sonniss licence comes inside each bundle) | Yes, through archive.org. The bundles are large (gigabytes), so only the needed folders are taken |
| VSCO 2 Community Edition | Orchestral samples: piano, plucked strings, celesta and mallets, chimes, timpani | CC0 | Yes, file by file |
| University of Iowa instrument samples | Piano, mallets and bells, recorded note by note | Free to use without restriction | Yes |
| Freesound, Pixabay, ZapSplat | Huge libraries | Varies (some CC0) | **No: blocked by this environment's network policy.** Ryan can add the domains in the environment settings if needed |

## 11. The steps after approval

Each step is shown to Ryan before the next (rule 9a).

1. **Candidates and the audition page** for the broadcast (Ryan: the broadcast first): the bell, the crowd bed in
   sizes (indie hall to stadium), cheers, boos, a mixed reaction, the crowd counting, pops, gasps, ring impacts.
   Ryan picks, a few moments at a time.
2. **The broadcast in the game**: the arena with the music playing as normal, the bell, the crowd following the meter
   and sized by building and company, entrance reactions, impacts on every move. Ryan plays it.
3. **Piano candidates and audition** for the office. Ryan picks.
4. **The office in the game**, fixed piano notes, with the fatigue limits. Ryan plays it.
5. Options (Sound effects, Effects volume, Crowd volume, Button sounds), credits, tests (`app/tests/sound.js` back
   to checking sounds), and the live page.

## 12. Risks

- **Taste.** "Feels good" is Ryan's ear. The audition step is the answer to that.
- **Page size.** Arena loops are the heavy part (a few megabytes). They can live beside the page as files, like the
  soundtrack, instead of inside it.
- **Mirror trust.** The archive.org copies of the Sonniss bundles are mirrors; each bundle's own licence file is
  checked before any file is used, and anything uploaded under a doubtful label is skipped, as before.
- **The desktop build.** The Steam build loads the page from disk; sound files beside the page must load there too.
  Tested in the Electron build before shipping.

## 13. The questions and Ryan's answers (23 October)

**Direction**
1. Which way? **C: both, in their places.** A musical office, a real arena on the broadcast.
2. Office sounds in the key of the music? **No: one fixed sound.**
3. Instruments? **Harp** at first; after hearing it, **piano** (Ryan, 23 October: "harp is wrong piano is right"). Every office sound is piano: the Salamander Grand Piano (CC BY 3.0, credited).

**How much sound**
4. Ordinary presses (tabs, lists, small buttons)? **Very soft.**
5. Pointing at a button, moving the highlight? **Silent.**
6. Pop-ups opening and closing? **A soft piano note.**

**The broadcast**
7. The music while a show is on the air? **Keeps playing as normal.**
8. Ring impacts? **On every move** the picture or the call shows, mixed back like television.
9. Entrance reactions? **Yes: cheers for heroes, boos for villains, and a mixed reaction for tweeners** ("we will
   need tweeners"; the game already marks them, `w.twn`, `disposition: 'tweener'`). Louder for bigger stars.
10. The crowd counting along on near falls and finishes? **Yes.**
11. Big shows sound bigger than a weekly show in a small building? **Yes.**
12. A small company's crowd sounds thinner? **Yes.**

**Rewards and feel**
13. A sound for the grade? **A piano sting by grade:** warm and rising for an A, plain for a C, low for a D or F.
14. The biggest moments: **a new champion, signing a top star, an A-grade show, the end of a feud.** All four.
15. Bad news? **A soft low piano note.**
16. Ending the week? **A short piano run.**

**Settings**
17. A separate switch for button sounds? **Yes.**
18. Defaults? **Only the music starts at Low**; effects and the crowd start at Normal (already decided).

**Process**
19. How to pick? **The audition page, a few moments at a time.**
20. First? **The broadcast.**

**Edge cases**
21. The crowd during a call from the gorilla position? **Holds its level.**
22. The fastest auto-play pace (Results)? **Only the results:** bells, the finish and the pop; no per-move sounds.
23. A hidden or minimised window? **Everything stops, like the music.**

### What the answers change in the plan

- Office: piano only, fixed notes. Big actions get a clear piano pluck; small presses a very soft one; pop-ups a soft
  piano note; good news two rising notes; bad news one low note; the week a short run; the grade a sting by grade.
- Broadcast: ring impacts on every move (with the voice limits and the minimum gap keeping it from turning into a
  racket), entrance reactions in three kinds (cheer, boo, mixed), the crowd counting along, the size of the building
  and of the company setting how big the crowd sounds. The music is not ducked or paused.
- Options: Sound effects, Effects volume, Crowd volume, and Button sounds on or off.
- Step order: broadcast candidates and audition first (bell, crowd bed in sizes, cheers, boos, mixed, the count,
  pops, gasps, impacts), then the broadcast in the game, then the office.

## 14. Picks so far (the audition page, rounds 1 to 4)

- **Kept:** the tubular bell for the ring bell (VSCO 2), the stadium crowd under the show (Sonic Bat), the Rose Bowl
  stadium surge for the pop (2496SoundEffects), the stadium chant for the crowd counting along (Sonic Bat), the
  stadium near miss for the kick-out gasp (Sonic Bat), the body blow for strikes (Gamemaster Audio), the body fall
  on wood for slams (Red Libraries).
- **Rejected:** three bells from Sonniss and four from VSCO, two small-hall crowds, four other pops, every boo tried
  (three), a built count, both built mixed reactions, the other slams and strikes, and the harp.
- **Piano, kept (rounds 4 to 6):** small presses (a soft high note), pop-ups (a quick flick up), good news (three
  rising notes), bad news (a deeper low note), the end of the week (a quick run up), the grade (A rising to a high
  sparkle, B a gentle lift, C two plain notes, D three falling, F a low minor chord), the end of a feud (a chord
  resolving home), big actions (a soft sparkle up), a new champion (a run up to two high notes ringing), signing a
  top star (good news with a sparkle).
- **Open:** boos and the mixed reaction for tweeners (waiting on Freesound.org, blocked from this environment).

## 15. Built

- **Step 2, the broadcast (23 October):** in the game. `app/src/audio/cues.ts`, `tools/sfx/build-sfx.py`.
- **Step 4, the office piano (23 October):** in the game. Next (Ryan, 23 October): the commentators saying the real
  lines, a neural voice in the game, with wah-wah kept as a fallback; it gets its own blueprint and questions.

## 16. Every moment of a match, and voices (addendum, 23 October)

Ryan, after hearing step 2: "the sound is a lot better ... first we need to make sure we have sounds for every moment
of the match. Cuts back to the commentary where they make ramble noises. The crowd going 1... 2... 2! on a kick out and
1... 2... ...3! then the bell sound. I'm okay with us making video game like synthetic voices to fill these parts out."
After the match comes more of the bank: different clicks and moments through the rest of the game.

### The moments of a match, in order, and what each should sound like

| Moment (the line or picture that marks it) | Now | Proposed |
| --- | --- | --- |
| Ring announcer's introductions (`ring` lines) | silence | The ring announcer's voice: a long, drawn-out ramble with arena echo, the crowd rising under each name |
| Entrances (`ent`) | pop for a hero | Cheer, boos or a mixed reaction (boos still need a source) |
| The opening bell | tubular bell | as now |
| Play-by-play and colour lines (`pbp`, `col`), the cut to the commentators | silence | Each commentator rambles while their line is on screen: play-by-play fast and excited, colour slower and lower |
| The road agent in your ear (`ear`) | silence | A quiet voice through a headset filter |
| Moves, signatures, taunts (the picture's keyframes) | body blow, body fall | as now, plus a crowd reaction on a big move |
| A near fall that is kicked out of | the count chant, then the gasp | The crowd shouting **"ONE! ... TWO! ... T-"** and breaking off into the gasp |
| A finisher kicked out of | as a near fall | The same, bigger, and the commentator shouting |
| The pin that wins | the count chant, then the pop | The crowd shouting **"ONE! ... TWO! ... THREE!"**, the bell three times, the pop |
| A submission | the pop | The crowd rising as it is locked in, the pop and the bell when they tap |
| A count-out | bell and gasp | The referee's count **"... EIGHT! NINE! TEN!"**, then the bell |
| A disqualification, a time limit | bell, gasp | as now, plus the ring announcer |
| "Here is your winner" (`ring` after the bell) | silence | The ring announcer, drawn out, over the pop |
| A new champion | pop and bell | as now, the commentator shouting over it |
| A call from the gorilla position | silence | A headset chime (office step) |
| Promos and angles | silence | The speaker rambles in their own voice (deeper for bigger wrestlers), the crowd cheering a hero and booing a villain |
| The sign-off | the crowd | The commentators sign off, the crowd fades out |

### How the voices would be made

- **Rambles** (commentators, the ring announcer, wrestlers in promos, the agent): made in code while the line is on
  screen, one sound per syllable of the caption so the voice starts and stops with the words, in the manner of the
  talking in Animal Crossing or Banjo-Kazooie. Each person gets a fixed voice (pitch, speed, tone) that stays theirs all
  game. Nothing has to be recorded; nothing changes the game.
- **Words the crowd shouts** (the count) and **the referee's count**: real words from Piper, a free, offline speech
  engine. Its voices come with their own licences; only voices whose recordings are public domain or CC BY (credited)
  are used. The crowd is many different voices layered with small differences in timing and pitch, over the stadium
  crowd, so it sounds like a building and not a robot.
- Ryan picks by ear on the audition page, as before.

### Ryan's answers (23 October)

1. The ramble style: **let me hear all three** (Animal Crossing chirps, Banjo-Kazooie mumbles, Simlish-like made-up
   words) on the audition page.
2. Who talks: **the commentators and wrestlers in promos.** Not the ring announcer, not the agent in your ear.
3. Fixed voices? **No: vary them** a little each line.
4. The crowd count: **real words, many voices.**
5. A count-out: **the crowd counts the last numbers** with the referee, then the bell.
6. Level: **like TV**, the voices clear on top of the crowd, which dips a little while they talk.
7. When: **every commentary line**, whatever the picture shows.
8. Promos: **the crowd reacts to who is talking** (cheers for a hero; boos once a source is found).

The steps: an audition round of the three ramble styles, voices for play-by-play, colour and a wrestler, and the
crowd's counts ("ONE! TWO!" breaking off, "ONE! TWO! THREE!", "EIGHT! NINE! TEN!"); Ryan picks; then they go into
the broadcast.

### Picks and build (23 October)

- **Kept:** the crowd shouting the count (round 7); wah-wah for the commentators (round 8: the Charlie Brown adults,
  but chill); wah-wah for promos, the sharpest of three (round 9: "keep wah wah but it needs to be a slightly more
  sharp louder direction for promos").
- **Rejected:** the Animal Crossing, Banjo-Kazooie and Simlish styles, muffled speech through a wall, and the softer,
  slower muffle.
- **Built:** all three in the broadcast. Voices fit the length of each line and vary a little; the crowd dips under
  them; a hero's promo line gets a cheer.


## 17. Button presses: low, soft clicks (rounds 12 and 13)

Ryan, 23 October: "i want low clicks for the ui instead of piano notes", then "these clicks have to be low and soft".
Round 12 (six clicks from Kenney's interface sounds and code) was too sharp. Round 13 kept one: a soft low thump made
in code (a sine at 120 Hz that drops a little in pitch as it starts, gone in about a fifth of a second, its start rounded
off). A big action (a green button, the SPACE key) gets the same at 95 Hz. The piano stays for pop-ups, news, the week,
the grade, champions and signings. Built by `tools/sfx/build-sfx.py` as `ui_tap` and `ui_tap_big`.
