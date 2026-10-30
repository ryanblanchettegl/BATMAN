# Movesets: a finisher, a super finisher, a signature and a set of moves

Ryan, 29 October: "wrestlers should have one signature, one finisher, and one super finisher, or they do it in a certain location that's their signature ... and then the wrestler can have three moves each ... that all have their own animations, or ... the critic can decide how much moves they have each, so we can have fun and dynamic matches that are always different." This is the blueprint (rule 9d, gate 1). Ryan answered all eight questions on 29 October (section 13) and left the number of everyday moves to the critic, who set it at eight (section 3). Nothing is built.

## 1. The idea

Every wrestler carries a moveset: three named special moves (a finisher, a super finisher and a signature), eight everyday moves, and up to three taunts, each move with its own animation. The broadcast builds each match from the two movesets in it, so no two matches look alike and a wrestler looks like themselves. It sits on the 3D plan (`docs/plans/paper-3d-wrestlers.md`): a move starts from a setup, and that plan's beat picker draws from the moveset. Until the 3D setups exist, every move plays as one of today's 2D move pictures (section 6).

## 2. What a wrestler has today

`w.look.finishing_moves` holds three: the finisher and two signatures (`Finisher` in `app/src/kit/caw.ts`: name, impact, `kickout_difficulty`, position, category, `preview_pose_id`, and a `stage` for a signature). `threeMoves()` fills any missing by style from `SIGS`. Taunts are `w.look.taunts` (up to three scene ids). The broadcast plays a signature or a taunt in the middle of a match (`scenePick()` in `Live.tsx`) and the finisher at the finish. Finisher kick-outs and wear are in the engine (`FINX` and `w.fko` in `engine/86-looks.ts`; `FIN_KO` is the chance of a kick-out by protection: Easy 0.5, Medium 0.28, Protected 0.06, Instant 0.015).

## 3. The moveset

| Slot | How many | What it does | Pin after it? |
|---|---|---|---|
| Finisher | 1, always | wins the match; kick-outs and wear as today | yes |
| Super finisher | 1, always (answer 2) | the bigger version, for the moments in section 5.3 | yes |
| Signature | 1, always | the calling card, at its stage; an optional place (answer 4) | never |
| Everyday moves | 8 | the body of every match | never |
| Taunts | 0 to 3 (answer 8) | now and then instead of a move | never |

### Why eight everyday moves (the critic's number)

A match at the TV pace shows about 6 to 10 moves across both wrestlers, so each wrestler shows 3 to 5. With 8 each, a single match never needs to repeat a move, and the hashed pick and the opponent's set make the next match different. Twelve would have meant six groups of one move, and a group of one repeats every time it is drawn, which breaks the promise exactly where it matters; it would also have made Create a Player too long for one screen. The data allows more later without a change of shape (`max` per group below).

| Group (`key`) | Moves | Max | From the setups |
|---|---|---|---|
| Strikes (`strike`) | 2 | 4 | standing, collar and elbow |
| Grapples (`grapple`) | 2 | 4 | front facelock, vertical suplex lift, scoop, fireman's carry, bent over |
| Running and corner (`run`) | 2 | 4 | Irish whip, corner |
| Behind and on the mat (`mat`) | 1 | 3 | waistlock from behind, on the mat |
| Top and floor (`top`) | 1 | 3 | top rope, to the floor |

A group may be empty (a big man with nothing from the top). The picker never draws from an empty group.

## 4. Data

```ts
type Group = 'strike' | 'grapple' | 'run' | 'mat' | 'top';
interface Moveset {
  fin: Finisher;                                  // as today
  sup: Finisher;                                  // the super finisher (required, answer 2)
  sig: Finisher & { at?: 'top' | 'corner' | 'floor' | 'ropes' };  // the place is optional (answer 4)
  moves: Record<Group, string[]>;                 // move ids, in order; empty allowed; at most the group's max
  taunts: string[];                               // 0 to 3 taunt scene ids (moved from look.taunts)
}
```

- `w.look.finishing_moves` and `w.look.taunts` become `w.look.moveset`.
- **Move ids:** `move_<kind>` for an included move, `c_<id>` for a world's own (as scenes are today). A move id that points at nothing (a world deleted it) is replaced by the style default for its group when `lookClean()` reads the record.
- **What is stored:** only what differs from the style default. A wrestler whose moveset is the default for their style stores nothing; it is worked out from the style and a hash of their name each time. This keeps saves small.

## 5. How a match uses it

All of this chooses pictures and words only. It reads `h01()` on the seed, the week, the match and the beat, never `rnd(S)`, so recorded play (`test-golden.js`) does not change, apart from the super finisher's one engine rule (5.3).

### 5.1 Everyday moves
- For each beat the 3D plan's picker shows, the wrestler in control is the one the engine's line names; the other sells. Control goes to the line's wrestler three times in four, the opponent once (a hope spot).
- The group follows the beat: the opening draws strikes and grapples; the middle all five groups; the top and floor group only where the ring position allows it.
- No move repeats in a match while its group has another unused. Between two matches of the same pair the pick also hashes the week, so the same two do not open the same way twice running.
- Body limits from the 3D plan (its answer 18) still apply: a move the body cannot do is skipped for another in the same group, and if none is left, for a strike.

### 5.2 The signature
- Once a match, twice when the match runs 15 minutes or more on the clock, at its stage (early, middle, late).
- A signature with a place (answer 4) comes out only there: the match builds to it (the wrestler climbs, or whips the other into the corner) as the move's lead-in. When the place is impossible (a top-rope signature in a cage or cell, or a wrestler who cannot climb), the signature plays from standing.
- Never followed by a pin (Ryan).

### 5.3 The finisher and the super finisher (answers 2 and 3)
- The finish plays the finisher, then the pin.
- The super finisher comes out in two cases. On a big night, it is the finish of the main event only (the rest of the card use the finisher, so the finisher is still seen). On any night, when the engine records that the loser kicked out of the winner's finisher (`FINX`, `ko.again`), the winner's next finish is the super finisher.
- **Its engine rule (the only change to play):** a super finisher can be kicked out of only on a big night, at a quarter of the finisher's chance (`FIN_KO` of its level times 0.25) and never more than 0.02. A kick-out from it is the biggest moment a match can have: +4 to the match (a finisher kick-out is +1.5 or +3 today), the crowd meter to the top, and a line in After the show. It wears like a finisher on its own count (`w.sko`, back a step a month). "One level more protection" stops at Instant: a finisher already at Instant gives a super finisher at Instant, and then only the quarter rule and the 0.02 cap apply. The +4 is in the same units as the finisher kick-out bonus in `FINX` (+1.5 or +3 today, added to the match's quality), and the crowd meter's jump comes from the existing crowd hook (`CRX`). The kick-out is read from the field `FINX` already sets (`ko.again`: the winner's own finisher was kicked out before it finally landed). `test-balance.js` must still pass, and the share of matches with a super-finisher kick-out stays under 1 in 100.

### 5.4 Commentary (answer 7)
Every move shown is named: each move carries its name, and a new rule set `GR_MOVE` in `engine/60-grammar.ts` gives the play-by-play line by group (`{a} hits {b} with a {move}`, guarded by group with `if`). The beats in `callMatch()` are not changed; naming applies to the moves the TV pace shows (`tvKeys()`), never adds a beat, and never slows a show.

### 5.5 Taunts (answer 8)
Played now and then instead of an everyday move: one draw in eight normally, one in four for the `showman` or `cocky` gimmick (`GIMS` in `engine/60-rpg.ts`) or a heel in control, never twice in a row.

### 5.6 A borrowed finisher (answer 5)
- **When:** a wrestler uses another's finisher when there is a story: a close friend (`bondOf` 60 or more) or the one who trained them (`w.coach`), as a tribute; or a real rival (`bondOf` -60 or less, or a feud between them), as an insult. The owner of the move must be on the roster.
- **How often:** at most once a match, on the finish or a near fall, with a chance of one in ten when the story is there, hashed; then not again by that wrestler for twelve weeks (`S.lcd['bf' + id]`).
- **What it does:** a tribute: `relBump` +8 bond between the two. An insult: `relBump` -10 bond (both directions, as bond always is) and +6 jealousy from the owner toward the one who used it (read by `jealOf`). A kick-out from a borrowed finisher counts against the owner's move (`w.fko` of the owner), not the user's. Commentary calls it out, and `note()` puts it on the notification bar ("Ace used Duke's finisher. Duke took it personally.").
- **Director tag:** colour (a line on the bar, never a matter on the desk).

## 6. The move library

### 6.1 The starter list (2D first)
Until step 2 of the 3D plan lands, every move plays as one of today's 2D pictures (`FIN_SCENES`: `slam`, `carry`, `sleeper`, `strike`, and the ten `move_` scenes), named by the move. When 3D lands, each is remade from its setup and keeps its id; the moves whose 2D picture is only a stand-in (Leg Drop and Elbow Drop on `slam`, Running Shoulder Block on `move_spear`, Top-Rope Elbow on `move_topdive`, the strikes on `strike`) are remade first. The release needs at least three moves a group, so every default moveset has a choice; the starter list:

| Group | Moves (2D picture until 3D) |
|---|---|
| Strikes | Clothesline (`move_clothesline`), Big Boot (`strike`), Dropkick (`strike`), Knife-edge Chop (`strike`), Spinning Back Kick (`strike`), Forearm Smash (`strike`) |
| Grapples | Vertical Suplex (`move_suplex`), DDT (`move_ddt`), Body Slam (`slam`), Powerbomb (`move_powerbomb`), Fireman's Carry Slam (`carry`), Neckbreaker (`slam`) |
| Running and corner | Spear (`move_spear`), Running Shoulder Block (`move_spear`), Hip Toss (`slam`), Corner Splash (`move_cornerhit`), Back Body Drop (`slam`), Corner Clothesline (`move_cornerhit`) |
| Behind and on the mat | German Suplex (`slam`), Sleeper Hold (`sleeper`), Leg Drop (`slam`), Figure Four (`sleeper`), Elbow Drop (`slam`) |
| Top and floor | Splash off the Top (`move_topdive`), Moonsault (`move_moonsault`), Dive to the Outside (`move_tope`), Superplex (`move_superplex`), Top-Rope Elbow (`move_topdive`) |

Names are general wrestling terms, never a real wrestler's named move (rule 3); the parody world's own named finishers stay as they are.

### 6.2 Defaults by style
`SIGS` becomes `MOVESET_BY_STYLE`: for each style code (B, T, H, P, A, S, E) the groups' candidate moves, weighted to the style (a high-flyer's top group full, a powerhouse's empty). A wrestler's default is a hashed pick from their style, so two brawlers do not share eight moves. The super finisher's default is the finisher's picture with "Super" before its name and one level more protection.

## 7. Create a Player: the Moves tab

One screen at 1920 by 1080 (rule 5b), the doll in the middle (rule 5c), the moveset in the right pane:
- **Specials:** Finisher, Super finisher, Signature, each a name field and a dropdown of moves (rule 5d); the signature has a Place dropdown (none, top, corner, floor, ropes).
- **Moves:** five rows, one per group, each with its dropdowns (two, two, two, one, one), filtered to the group and to what the body can do.
- **Taunts:** up to three dropdowns.
- **Play** is one button: it plays whichever slot is picked on the doll in the middle.
- **Fill by style** resets the moveset to the style default.

The same tab is used in the World Editor (Edit wrestler), in a game (Edit wrestler on the Roster, `E.setLook`) and in Create a wrestler on Free agents.

## 8. Converting what exists

Old saves are not protected (rule 9); world files and `.wrestler.json` files are converted when read (`lookClean()`), and `tools/build-parody.js` writes the converted parody world (`universes/parody/*`, where EWE and WPW have hand-made looks):

| Old | New |
|---|---|
| `finishing_moves[0]` | `fin` |
| `finishing_moves[1]` | `sig` (its stage kept) |
| `finishing_moves[2]` | one everyday move, in the group its picture fits (below) |
| none | `sup`: the finisher, "Super" before its name, one level more protection |
| `look.taunts` | `moveset.taunts` |
| the rest | the style default |

Picture to group: `strike`, `move_clothesline` to Strikes; `slam`, `carry`, `move_suplex`, `move_ddt`, `move_powerbomb` to Grapples; `move_spear`, `move_cornerhit` to Running and corner; `sleeper` to Behind and on the mat; `move_topdive`, `move_moonsault`, `move_tope`, `move_superplex` to Top and floor.

## 9. Steps, each tested

| Step | What is built | Done when (tests) |
|---|---|---|
| 1. Data and defaults | the Moveset type, `MOVESET_BY_STYLE`, the starter list in 2D, the converter in `lookClean()`, `build-parody.js` | `test-movesets.js` (new): every wrestler in both worlds has a full moveset within the group maxima; the same name gives the same moveset; a dangling id falls back; `test-scenes.js` and a `.wrestler.json` round trip still pass; saves store only what differs |
| 2. Create a Player's Moves tab | section 7 | `app/tests/player.js`: every slot can be set by mouse and keys, Fill by style works, `fits(page)` at 1920 by 1080 and 2560 by 1440 |
| 3. The picker and the words | sections 5.1, 5.2, 5.4, 5.5 | over 60 recorded matches: no repeat while a group has another; the signature appears where it could and is never followed by a pin; no pin after anything but a finisher or super finisher; `test-grammar.js` finds no unfilled `{move}`; `test-golden.js` still matches (pictures and words only) |
| 4. The super finisher | section 5.3 | its kick-out rate under 1 in 100 matches; `test-balance.js` passes; golden games recorded again |
| 5. Borrowed finishers | section 5.6 | over 60 recorded games: at most 1 in 10 eligible matches have one, and 0 matches with no story behind it; `relBump` and the bar line fire; the cooldown holds; determinism |

Each step goes through the critic (rule 9j).

## 10. Risks

| Risk | What we do |
|---|---|
| Making the library is a lot of work | ship in 2D on today's pictures; remake in 3D group by group |
| The commentary repeats itself | at least four lines a group in `GR_MOVE`, and the grammar's hash skips the last line used |
| Save size | store only what differs from the style default |
| Real move names (rule 3) | general terms only in the included library |
| Matches with their own rules (tag, battle royal, cage, ladder) | the 3D plan's staging applies; a place-tied signature falls back to standing where its place is impossible |

## 11. What it hands the next phase, and what it replaces (rule 9g)

- **Director tag:** colour (the moveset and the borrowed finisher's bar line).
- **Hands on:** matches that look different every time, wrestlers who look like themselves, and a moveset ready for the later career mode.
- **Replaces:** the three-move list (`threeMoves()`, `SIGS`), `look.taunts` on its own, and the stock picture for every beat that is not a finish.

## 12. The questions (asked 29 October)

1. Is twelve everyday moves right, or should the critic's number be different?
2. The super finisher: on every wrestler, or only the top of the card?
3. When does the super finisher come out?
4. Should the signature's place be required or optional?
5. Can a wrestler use another's finisher, and should it mean something?
6. Should a wrestler learn new moves over a career?
7. Should the commentary name every move?
8. Taunts: keep them, fold them into the moveset, or remove them?

## 13. Ryan's answers (29 October)

| # | Topic | Answer |
| --- | --- | --- |
| 1 | Size | **The critic decides.** The critic set it at eight in five groups (section 3). |
| 2 | Super finisher | **Everyone has one;** how often it comes out keeps it special. |
| 3 | Super timing | **On big nights, and after the opponent has already kicked out of the finisher in this match.** On a big night it is the main event's finish (section 5.3). |
| 4 | Signature place | **Optional.** A signature that names a place comes out only there, and the match builds to it. |
| 5 | Borrowed finishers | **Yes, and it means something:** a tribute or an insult, through the relationships (section 5.6). |
| 6 | Learning moves | **Fixed.** The moveset only changes when the player edits it. |
| 7 | Commentary | **Every move is named** as it is shown. |
| 8 | Taunts | **Part of the moveset,** up to three. |
