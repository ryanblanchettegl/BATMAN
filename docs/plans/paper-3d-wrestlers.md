# Paper wrestlers in 3D: figures, setups, moves and the ring

Ryan, 29 October: "instead of the characters being completely flat and the ring ... being 3D, could the characters also be 3D like Paper Mario ... set up their moves and how they walk, like SmackDown versus Raw ... base moves ... collision detection ... the ring would bounce ... and later on ... sync punch kicks". This is the blueprint (rule 9d, gate 1). Nothing is built. The questions are in section 12 and Ryan answered all eighteen on 29 October (section 13); no code until Ryan says go.

## 1. The idea in one paragraph

The wrestlers become paper figures standing in the 3D stage that already exists (`app/src/kit/diorama3d.ts`: the ring, the cage, the rooms, the lights). Each figure is flat-coloured cut card with real thickness, built from pieces on a skeleton (the split pins we already have), so it can turn and be seen from the front, the side and the back, the way Paper Mario's people do. Moves are not simulated. They are paired animations that start from a set position, the way SmackDown vs Raw did it: a **setup** puts both wrestlers in a known pose with their hands locked on known points, and a **move** plays from one setup and ends in another, so moves chain (a vertical suplex lift into a brainbuster; a front facelock into a DDT). A light layer of collision keeps limbs out of each other and out of the mat, makes the mat dip and bounce where somebody lands, and makes the ropes stretch and throw back. Later, the same skeleton and setups can be driven by a player in real time for single player.

## 2. Why

- Rule 0 says the diorama renderer is the graphics engine of the game: how good its pictures look is how good the game looks. Flat figures in a 3D ring are the weakest part of every scene today: they cannot turn, they cut through each other, and a camera move off the hard camera shows them as paper edges.
- Create a Move today poses two flat dolls by hand for every keyframe. A library of setups makes a move a few keys from a known start, so the stock moves look consistent and players can make their own without fighting the poses.
- Moves that chain and land with weight (the mat giving, a heavy man landing harder, `poundsOf()`) are what make a wrestling broadcast feel like wrestling.
- It is the base single player will need: the same figures and setups, driven by a pad.

## 3. What stays the same

- **The look (rule 2a).** Wrestlers stay clean: flat colour, no shading on them, one shadow on the set. The card gets thickness and a pale cut edge, like every other piece. No scan lines, no CRT.
- **The data.** A wrestler is still the Create a Player record (`w.look`: body, three outfits, lettering and shapes, finisher and two signatures, entrance, taunts). The 3D figure reads the same record. Nobody remakes a wrestler.
- **Scenes as data.** A scene is still `{slots, keys, set, cam3}` in `kit/scene.ts`, kept in worlds and played on the broadcast. A key gains 3D placement; an old 2D key is read as standing on the hard camera's plane.
- **The engine owns the game (rule 1).** Nothing here changes how a match is scored. Match quality, finishes and kick-outs stay in `engine/`. The 3D layer only shows what the engine decided. Never `rnd(S)` in the renderer; anything that varies is hashed.

## 4. The figure

| Part | What it is |
|---|---|
| Skeleton | The joints we already pose (`sh`, `el`, `wr`, `hip`, `kn`, `an` near and far, neck, waist), now as 3D rotations, plus a root (where the figure stands and which way it faces). |
| Pieces | Head, torso, pelvis, upper and lower arms, hands, upper and lower legs, feet. Each is a card shape cut by `puppet()` to the body's proportions, given thickness (a few millimetres at scene scale) and a cut edge. |
| Views | Front and back exist (`Place.b`, `headBack()`). A side view is new: the head, torso and pelvis need a profile cut. Pieces between views blend by turning the card, as Paper Mario does, and swap to the right cut past a set angle. |
| Clothes and lettering | Already pieces with sockets; they ride their body piece. Lettering on the back shows only from behind (as now). |
| Size | Height and weight from the record scale the skeleton; weight also sets how hard a landing is. |
| Quality | A setting (Low, Medium, High): thickness on or off, shadow quality, how many figures get the full skeleton before the rest are drawn as simple standing cards (a battle royal, the crowd). |

## 5. Setups (base positions)

A setup is a named starting position for two wrestlers (sometimes one, sometimes three), held as data:

- the pose of each figure (joint rotations);
- where they stand relative to each other (offset and facing);
- **contact points**: which hand holds which body point (`HOLDS` in `scene.ts` already names hands, shoulders, chest, waist, head), so a move can keep them locked together while it plays.

The first library, from Ryan's list and the moves we already ship (`CLASSIC`, `MOVES`):

| Setup | Who does what | Leads into |
|---|---|---|
| Collar and elbow | Both standing, locked | Any standing grapple |
| Front facelock | Defender bent forward, head under the attacker's arm | DDT, suplex lift, brainbuster |
| Bent over, head between the legs | Defender bent below the attacker's knees | Powerbomb, piledriver, the pedigree kind of finisher |
| Vertical suplex lift | Defender held upside down above the attacker | Vertical suplex, brainbuster, a drop forward |
| Waistlock from behind | Attacker behind, arms round the waist | German suplex, back suplex, roll-up |
| Fireman's carry | Defender across the shoulders | Fireman's carry slam, a spinning drop |
| Scoop | Defender cradled across the body | Body slam, a sideways drop |
| Corner | Defender against the turnbuckle | Strikes, a run-in splash, superplex setup |
| Top rope | Attacker on the top turnbuckle | Elbow drop, splash, moonsault, a dive |
| On the mat | Defender down, attacker standing over | Pin, submission, a drop |
| Irish whip | Both moving, one sent to the ropes | Clothesline, spear, a hip toss |

A setup is made in Create a Move (a new **Setups** list) like any other scene, and a world can bring its own.

## 6. Moves

A move is: **from** a setup, a few keyframes (both figures, with contact points held or let go at a set key), **to** a setup or a landing. Because every move starts and ends on a known position, they chain:

- collar and elbow → front facelock → DDT → on the mat → pin;
- front facelock → vertical suplex lift → vertical suplex → on the mat;
- bent over → (lift) → powerbomb → landing.

The broadcast plays a match as a chain picked from the engine's beats (a move kind already in the match log, the finisher's own scene from `FIN_SCENES`). A wrestler's finisher and signatures (`look.fin`, the two signatures with their `stage`) pick a move by its setup. A move with no setup (an old custom one) plays as it does today.

**Walking and moving.** A small set of loops (walk, run to the ropes, circle, climb the turnbuckle, roll in under the ropes, the entrance walk) are scenes of their own with `loop: true`, played on the root while it moves.

## 7. Contact, collision and the ring

Kept light on purpose, not full ragdoll physics: floppy ragdolls look wrong in a hand-made style and are hard to hold at 60 frames a second.

- **Bodies.** Each body piece has a simple capsule. Within a move, contact points keep the holds locked; between moves, capsules stop limbs passing through each other or the mat by a small push.
- **Landing.** When a body hits the mat, the mat is a spring: it dips where they land (wider and deeper for a heavier wrestler, `poundsOf()`), shakes outward and settles. The sound already knows a landing (`cues.ts`: a body fall, heavier for bigger wrestlers), so picture and sound use the same moment.
- **Ropes.** The ropes are springs: they stretch when somebody hits them and throw them back (the Irish whip, a rope-run). A body over the top rope can go to the floor.
- **The floor, the barricade, the steps, the cage.** Solid; a body that hits one stops and drops.
- **A physics library later, if wanted.** Rapier or cannon-es (both free) could take over falls and bumps outside a set move (a dive to the floor, a man falling off a ladder) without changing the figures or the setups.

## 8. The screens

- **Create a Move** gains the Setups list, a "Start from" choice (a setup), and contact points you can set and release per key. The 3D view is the default; a figure can be turned by hand.
- **Create a Scene** and **Animation** get the 3D figures and the turn handle.
- **Create a Player** shows the wrestler as a 3D figure on a turntable (front, side, back).
- **The broadcast** plays the chains on the same stage it already uses, with the cameras it already has (`cam3`).
- **Options** gets the quality setting.

## 9. Data

- `Fig` gains `rot` (the figure's facing in 3D) and joint rotations in 3D where today there is one angle a joint; a 2D key is read with its angles as rotations about the camera's axis, so every old scene still plays.
- `Setup = {id, n, figs: {a, b, c?}, rel, holds: [{from, joint, to, point}]}`.
- `Move` keeps `Scene` and gains `from` (a setup id), `to` (a setup id or `land`), `holds` per key and `land` (who lands, where, how hard).
- A world's own setups and moves travel in its package, as scenes do today.
- Saves: nothing in `S` changes. All of this lives in worlds and the renderer.

## 10. Money, balance and play

No money or balance changes. The match engine decides who wins, how good it was and what happened; the 3D layer shows it. What it can change, once Ryan wants it, is reading: a move that lands harder looks harder, and the crowd and commentary already follow the engine's beats. Single player (section 11, step 6) is the first place play would change, and it gets its own blueprint.

## 11. Steps, each one playable on its own

1. **3D paper figures** in Create a Scene and Animation: the skeleton in 3D, thickness, front, side and back views, the turn handle, the quality setting. Every old scene still plays.
2. **The setup library** and Create a Move's "Start from", with contact points held through a move. Ten setups from section 5.
3. **Moves that chain**: from and to, the stock moves (`MOVES`, `CLASSIC`) moved onto setups, the broadcast playing a match as a chain.
4. **Landing and the ring**: capsules, the mat that gives, the ropes that throw back, the floor and the cage.
5. **Walks and loops**: walking, running the ropes, climbing, rolling in, the entrance walk in 3D.
6. **Later, its own blueprint:** live control for single player (strikes timed to a press, grapples from setups, reversals), on the same figures.

## 12. Questions for Ryan

Asked one at a time; the answers go in section 13.

**The look**
1. How deep should the paper be: thin card that reads as paper from every side, or chunky foam board you can see the thickness of?
2. From the side, should a figure show a true profile (a new cut for the head and body), or stay a front-facing card that turns like a playing card (pure Paper Mario)?
3. Should the crowd stay flat cards (cheaper, more paper-like) while only the wrestlers, referee and people at ringside are 3D?

**Moves and setups**
4. Are the eleven setups in section 5 the right first set? What is missing that you want on day one (a tag-team double setup, a three-person setup, a ladder)?
5. Should a player be able to make a setup in Create a Move, or only moves from the included setups at first?
6. When the engine says "a finisher", should the broadcast always play the full chain into it (facelock, then the move, then the pin), or only the finisher itself with the chain on big nights?
7. How long should a chained match play on the broadcast at the TV pace: more moves shown, or the same length with fewer, fuller moves?

**Collision and the ring**
8. How much bounce: a stylised big wobble (toy-like, fits the paper look) or a small, real-looking give?
9. Should bodies ever go loose (a light ragdoll for a dive to the floor or a fall off a ladder), or should every fall be a set animation?
10. Should anything in the ring break (a table, the ropes, the mat in a big finish), and is that for this plan or later?

**Speed and quality**
11. What is the modest PC we must hold 60 frames a second on (a laptop with built-in graphics, or a few-years-old gaming PC)?
12. In a battle royal of 30, is it fine for most people to be simple standing cards with only those in the action fully posed?

**Scope and order**
13. Is the order in section 11 right, or do you want the ring bounce (step 4) before the setups (step 2) because it shows best?
14. Should the old 2D figures stay as an option (a "flat" look in Options), or go once 3D is in?
15. Single player (step 6): is it a mode on its own (you play one match), or something the booker can step into on the night (play the main event yourself)?

**Odd cases**
16. A custom move made today in 2D with no setup: keep playing it flat, or convert it as best the game can and mark it for checking?
17. Two wrestlers of very different sizes in a setup (a giant and a small high-flyer): should the setup stretch to fit, or should some moves refuse (no powerbombing a man twice your size)?
18. Should the engine ever refuse a move the body cannot do (age, injury, Agility), or is the picture only ever a picture?

## 13. Ryan's answers

| # | Topic | Answer |
| --- | --- | --- |
| 1 | Paper depth | **Thin card.** Reads as paper from every side, with a pale cut edge just visible (29 October). |
| 2 | Side view | **Both, by quality.** A true profile cut on High; the playing-card turn on Low (29 October). |
| 3 | Crowd | **Whole crowd 3D.** Every fan is a 3D paper figure. To hold 60 frames a second the crowd is drawn in batches (one shape copied many times, instancing), simpler figures further back, and fewer moving fans on Low quality (29 October). |
| 4 | Setups on day one | **The eleven, plus tag-team doubles (two on one), three-person setups, and setups on and around a ladder and a table** (29 October). |
| 5 | Own setups | **Yes, from day one.** Create a Move has a Setups list; a world carries its own (29 October). |
| 6 | Finish chain | **Always the full chain:** the setup, the finisher, then the pin, on every show (29 October). |
| 7 | Match length | **Same length, fuller moves.** The TV pace stays; fewer moves, each shown in full (setup, move, landing) (29 October). |
| 8 | Bounce | **A stylised big wobble,** toy-like, bigger for heavier wrestlers (29 October). |
| 9 | Ragdoll | **Only big falls:** a light loose fall for dives to the floor, falls off ladders and through tables; set animations everywhere else (29 October). |
| 10 | Breakables | **Tables break in this plan;** ropes and the ring breaking come later (29 October). |
| 11 | Target PC | **A few-years-old gaming PC** (about a GTX 1060) holds 60 frames a second on High; Low runs on lesser machines (29 October). |
| 12 | Big matches | **At most 8 people in the ring at once,** all at full detail (a battle royal keeps the rest outside or still to enter). Fans close to the ring are decent quality; fans far away are low quality (29 October). |
| 13 | Order | **Keep the order** in section 11 (29 October). |
| 14 | Old 2D look | **Kept only as the Low quality fallback** for very slow machines, not as a style (29 October). |
| 15 | Single player | **A later career mode where you play as a wrestler,** built only after the main game is fully polished. This plan only keeps the figures and setups ready for it (29 October). |
| 16 | Old moves | **Convert and mark:** 2D angles become 3D turns, a setup is guessed from the first pose, and the move is marked 'Check this move' in Create a Move (29 October). |
| 17 | Size gaps | **Stretch, some refuse:** setups stretch to fit most pairs; a few lifts are refused when the gap is too big (no powerbombing a man twice your weight) and the broadcast picks another move (29 October). |
| 18 | Body limits | **The picture follows the body:** the broadcast picks moves that fit (an old or hurt wrestler does fewer flips and lifts, a high-Agility one more dives). The result still comes only from the engine (29 October). |

What changes in the blueprint from these answers:
- Section 4: the side view is a true profile cut on High and the playing-card turn on Low; the old flat figures stay only as the Low fallback for very slow machines.
- Section 4 and step 1: the whole crowd is 3D, drawn in batches (instancing), decent near the ring and low quality far away. At most 8 people in the ring at once, all at full detail.
- Section 5: the first library adds tag-team doubles (two on one), three-person setups, and setups on and around a ladder and a table. Players make setups in Create a Move from day one.
- Section 6: every finish plays its full chain (setup, finisher, pin) on every show, at the same TV pace with fewer, fuller moves. The broadcast picks moves that fit each body and refuses lifts across too big a size gap.
- Section 7: the ring wobbles big and toy-like; a light loose fall only for dives to the floor and falls off ladders and through tables; tables break (ropes and the ring later).
- Section 11: the order stands. Step 6 is not part of this plan: single player is a later career mode where you play as a wrestler, built after the main game is fully polished.
- Old custom moves are converted and marked 'Check this move'.
- The target: about a GTX 1060 at 60 frames a second on High.

## 14. What it hands the next phase, and what it replaces (rule 9g)

- **Director tag:** colour (it changes how things look, not what reaches the desk).
- **Hands on:** the base for single player, and for scenes that look as good as the paper cover art Ryan wants on posters and the Steam page.
- **Replaces:** posing flat dolls by hand in every key; the 2D-only figure in the 3D stage.
