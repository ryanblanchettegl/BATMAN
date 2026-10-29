# Paper wrestlers in 3D: figures, setups, moves and the ring

Ryan, 29 October: "instead of the characters being completely flat and the ring ... being 3D, could the characters also be 3D like Paper Mario ... set up their moves and how they walk, like SmackDown versus Raw ... base moves ... collision detection ... the ring would bounce". This is the blueprint (rule 9d, gate 1). Ryan answered all eighteen questions on 29 October (section 18) and the body below is written to those answers. Nothing is built; no code until Ryan says go.

## 1. The idea in one paragraph

The wrestlers become thin-card paper figures standing in the 3D stage that already exists (`app/src/kit/diorama3d.ts`: the ring, the cage, the rooms, the lights, the crowd already drawn in batches). Each figure is a tree of rigid card pieces on split-pin joints, so it turns and is seen from the front, the side and the back. Moves are not simulated: they are paired animations that start from a **setup** (a known pose for two or three people, hands locked on known points) and end in another setup or a landing, so moves chain the way SmackDown vs Raw did. A light physics layer keeps bodies out of each other, makes the mat wobble where somebody lands, makes the ropes throw back, lets a body go loose on a big fall, and breaks tables. The match engine still decides everything; this only shows it.

## 2. Why

- Rule 0: the diorama renderer is the graphics engine of the game. Flat figures in a 3D ring are the weakest part of every scene: they cannot turn, they cut through each other, and any camera off the hard camera shows paper edges.
- Create a Move today poses two flat dolls by hand in every key. Setups make a move a few keys from a known start, so stock moves look consistent and players can make their own.
- Moves that chain and land with weight are what make a broadcast feel like wrestling.
- It keeps the figures and setups ready for the later career mode where you play as a wrestler (Ryan: built after the main game is polished; not part of this plan).

## 3. What stays the same

- **The look (rule 2a).** Wrestlers stay clean: flat colour, no shading on the wrestler, one shadow on the set, thin card with a pale cut edge. No scan lines, no CRT.
- **The wrestler record.** The 3D figure reads the Create a Player record (`w.look`) as it is. Nobody remakes a wrestler.
- **Scenes as data.** A scene is still `{slots, keys, set, cam3}`; old 2D keys convert on load (section 5.4).
- **The engine owns the game (rule 1).** Match quality, finishes and kick-outs stay in `engine/`. The renderer never calls `rnd(S)`; every choice it makes is hashed from the report, so the same show draws the same frames (section 12).

## 4. Scope

**In this plan:** 3D paper figures (High: true profile; Low: playing-card turn; very slow machines: the old flat figures); the whole crowd in 3D in tiers; up to 8 people in the ring at full detail plus the referee; setups (the eleven, two-on-one tag doubles, three-person, ladder and table); moves that chain; the beat picker; blending; the referee's count and position; strikes and selling (hit reactions, get-ups); the spring mat, ropes, floor, cage; light loose falls on big falls; breakable tables; walks and loops; the entrance walk on the 3D ramp; automatic cameras; the Create a Move, Create a Scene and Create a Player editors; the converter; tests and a speed gate.

**Deferred, named so nobody builds them by accident:** ropes and the ring breaking; facial expressions beyond today's set (`e` keeps working on the 3D head as a texture swap); live control (the later career mode); a physics library for anything but loose falls.

## 5. The figure

### 5.1 The rig

A figure is a hierarchy of three.js `Object3D` nodes, one rigid card mesh per piece. Not a skinned mesh: rigid card pieces on pins are exactly what the paper look is, and rigid pieces are cheaper to draw and simpler to pose.

| Node | Parent | Joint | Axes and limits (degrees) |
|---|---|---|---|
| root | world | position and a facing quaternion | free |
| pelvis | root | waist | pitch -60..90, yaw -45..45, roll -30..30 |
| chest | pelvis | spine | pitch -30..60, yaw -40..40, roll -20..20 |
| head | chest | neck | pitch -45..60, yaw -80..80, roll -30..30 |
| upper arm (n, f) | chest | shoulder `sh` | pitch -180..180, yaw -90..120, roll -90..90 (today's keys use up to plus or minus 175) |
| lower arm | upper arm | elbow `el` | pitch 0..150 (one axis) |
| hand | lower arm | wrist `wr` | pitch -70..70, roll -45..45 |
| upper leg (n, f) | pelvis | hip `hip` | pitch -120..45, yaw -45..60, roll -40..40 |
| lower leg | upper leg | knee `kn` | pitch 0..150 (one axis) |
| foot | lower leg | ankle `an` | pitch -45..45 |

**The limits come from the data.** Before step 1a is done, the converter runs over every included scene, move and setup, and any limit an included key goes past is widened to fit it. A test then checks that no included key is outside the limits, so the editor's limits never break an existing scene.

**Joint names in `Fig3.j`, exactly:** `waist`, `spine`, `neck`, `sh_n`, `el_n`, `wr_n`, `sh_f`, `el_f`, `wr_f`, `hip_n`, `kn_n`, `an_n`, `hip_f`, `kn_f`, `an_f` (one per row of the table above, near and far).

Rotations are stored as quaternions and edited as Euler angles in the order YXZ (yaw, pitch, roll), so a turn of the body never flips a limb. `n` and `f` stay the near and far sides of today's dolls; in 3D they are the figure's left and right, mirrored when it faces the other way.

### 5.2 The pieces and the views

- **Card.** Each piece is the outline `puppet()` already cuts for the body, extruded to 0.04 scene units (thin card) with a pale bevel on the cut edge. Front and back faces carry today's front and back drawings (`Place.b`, `headBack()`).
- **High quality: the true profile.** Head, chest and pelvis get a side cut, made by the same `puppet()` code from the body's depth (new `profile()` outlines from the record's build sliders). Each of these three pieces is three cards (front, back and side) and the camera's angle to the figure picks which is shown, crossfading over 15 degrees around 45 and 135.
- **Low quality: the playing-card turn.** One card per piece; it turns with the figure and swaps front for back at 90 degrees, as Paper Mario does.
- **The fallback.** The old flat figure, for machines that fail the speed gate even on Low (Ryan: kept only as the Low fallback, not as a style).
- **Clothes and lettering** ride their piece through the sockets they already have; lettering placed on the back shows only from behind, on the chest only from the front, and on a profile cut never (a profile carries colour only).
- **Paper texture.** All the paper grains go into one texture atlas, so a figure is one material and a few draw calls.

### 5.3 What a 3D key holds

```ts
interface Fig3 {
  pos: [number, number, number];      // root, in scene units (x across, y up, z toward the hard camera)
  rot: [number, number, number, number]; // root facing, quaternion
  j: Record<string, [number, number, number, number]>; // joint name -> quaternion (names as section 5.1: waist, spine, neck, sh_n, el_n, ...)
  s?: number;                          // scale (height from the record, set once)
  e?: string;                          // face (as today)
  hold?: Hold[];                       // contact this key keeps (section 7)
  loose?: boolean;                     // this figure is in a loose fall from this key (section 9.4)
}
```

### 5.4 From a 2D key to a 3D key (the converter)

Today a figure is `{x, y, r, f, z, p, on}`: `x` across and `y` up on the hard camera's plane, `z` depth (a small offset toward or away from the camera), `r` the body's lean in degrees about the camera axis, `f` facing (+1 right, -1 left), `p` one angle per joint about the camera axis, `on` a hold (`'A:hands'`: carried by A's hands).

- `pos = [x, y, z]`; `rot` = yaw 90 degrees times `f` (side-on to the hard camera, as today), then the lean `r` as roll about the camera axis.
- Each `p[joint]` becomes a pitch of that angle in the figure's own side plane (the plane the 2D doll was drawn in), so a converted figure looks exactly as it did from the hard camera.
- `f` is not kept. A converted figure's facing lives in `rot`; `n` and `f` limbs stay attached to the same body side, so when a figure later turns past 90 degrees its near arm becomes the arm away from the camera, as on a real body. The front and back cards swap with the turn.
- `on: 'A:hands'` becomes a hold `{effector: 'body', target: 'A', socket: 'hands'}`.

Worked example (the clothesline's first key, `POSED('charge', -6, 0, 1)`): `pos = [-6, WAIST, 0]`, `rot` = yaw +90, and the charge pose's `sh_n: -100` becomes a shoulder pitch of -100 degrees in the side plane. From the hard camera it is the same picture; from any other camera it is a figure seen properly in 3D.

Old custom moves are converted on load, a setup is guessed from their first key (the nearest setup by pose distance, section 6), and they are marked "Check this move" in Create a Move (Ryan, answer 16). `tools/convert-moves.js` runs the same conversion over a world file and prints a report of every move it changed and its guessed setup.

## 6. Setups

```ts
interface Setup {
  id: string; n: string;
  roles: ('A' | 'B' | 'C' | 'D')[];             // 2, 3 or 4 figures
  figs: Record<string, Fig3>;                     // the pose of each, A at the origin facing +x
  holds: Hold[];                                  // who holds whom, and where
  stretch?: 'scale' | 'reach';                    // how it fits a size gap (section 7.3)
  maxRatio?: number;                              // refused when the lifted figure outweighs the lifter by more than this
  props?: string[];                               // 'ladder', 'table': the setup needs that prop placed
  tags?: string[];                                // 'standing', 'lift', 'mat', 'corner', 'top', 'tag', 'three', 'ladder', 'table'
}
```

The first library (Ryan, answer 4):

| Setup | Roles | Leads into |
|---|---|---|
| Collar and elbow | A, B standing locked | any standing grapple |
| Front facelock | B bent forward, head under A's arm | DDT, suplex lift, brainbuster |
| Bent over, head between the legs | B bent below A's knees | powerbomb, piledriver, the pedigree kind of finisher |
| Vertical suplex lift | B held upside down above A | vertical suplex, brainbuster, a drop forward |
| Waistlock from behind | A behind B | German suplex, back suplex, roll-up |
| Fireman's carry | B across A's shoulders | fireman's carry slam, a spinning drop |
| Scoop | B cradled across A | body slam, a sideways drop |
| Corner | B against the turnbuckle | strikes, a running splash, superplex setup |
| Top rope | A on the top turnbuckle | elbow drop, splash, moonsault, a dive |
| On the mat | B down, A standing over | the pin (only right after a finisher), a submission, a drop |
| Irish whip | both moving, B sent to the ropes | clothesline, spear, hip toss |
| Double team | A and C on B | double suplex, a doomsday device, a double powerbomb |
| Three-person | A, B and C | a tower of doom from the corner, a double DDT, a triple suplex |
| Ladder | A on or by a ladder | a dive off it, a slam onto it, a fall off it |
| Table | B laid on a table | a splash or a powerbomb through it |

Players make setups in Create a Move from day one (answer 5); a world carries its own.

## 7. Contact, holds and fitting bodies together

### 7.1 Holds

```ts
interface Hold { fig: string; effector: 'hand_n' | 'hand_f' | 'hands' | 'body'; target: string; socket: string; w?: number }
```

`socket` is one of today's `HOLDS` (hands, shoulders, chest, waist, head) plus `neck`, `thigh_n`, `thigh_f`. A hold on `body` carries the whole figure (the lifted man in a suplex): his root follows the target socket.

### 7.2 The solve, every frame, in this order

1. **Animation:** the key's joints are blended (section 8).
2. **Carried roots:** a figure held on `body` has its root set from its target's socket (the existing `on` parenting, now in 3D).
3. **Two-bone IK** for each hand or foot on a hold: the analytic two-bone solution for shoulder, elbow and wrist (or hip, knee, ankle), with the elbow or knee kept pointing where the key's pose pointed it, and the joint limits of section 5.1 clamped. A hold whose target is out of reach (more than 105% of the arm's length) keeps the arm straight toward it and reports the gap.
4. **Capsules:** a small push to separate overlapping capsules (section 9.1), then IK again for any hold the push moved.

### 7.3 Size gaps (answer 17)

- A setup stretches to fit: `scale` moves B's root so the sockets meet (a tall man bends lower into a front facelock), `reach` leaves the roots and lets IK reach.
- A lift is refused when the lifted man outweighs the lifter by more than the setup's `maxRatio`, by `poundsOf()`. The picker then takes another move (section 10).

| Setup | maxRatio |
|---|---|
| Vertical suplex lift | 1.6 |
| Bent over (powerbomb, piledriver) | 1.6 |
| Fireman's carry | 1.6 |
| Waistlock from behind (German suplex) | 1.8 |
| Scoop (body slam) | 2.0 |
| Double team (two lifting one) | 3.0, against the two lifters' weight together |
| Every other setup | no limit |

## 8. Moves, blending and transitions

```ts
interface Move {
  id: string; n: string;
  from: string; to: string | 'land';             // setup ids
  keys: { t: number; figs: Record<string, Fig3>; hold?: Hold[]; cam3?: Cam3 }[];
  impacts?: { t: number; who: string; where: 'mat' | 'floor' | 'table' | 'rope' | 'turnbuckle' | 'body'; force: number }[];
  loose?: { t: number; who: string };              // a big fall goes loose here (section 9.4)
  breaks?: { t: number; prop: 'table' };           // a table breaks here
  tags: string[];                                   // 'strike', 'grapple', 'lift', 'dive', 'top', 'submission', 'pin', 'finisher'
  needs?: { agility?: number; maxAge?: number; noInjury?: string[] }; // the body (answer 18)
}
interface Loop { id: string; n: string; keys: Move['keys']; speed: number; root: boolean }  // walk, run, circle, climb, roll in, get up
```

- **Blending.** Two poses blend by joint quaternion slerp. Between moves in a chain the end of one and the start of the next crossfade over 0.25 seconds; the roots are aligned first, so A of the next move stands where A of the last one ended.
- **From walking into a setup.** A loop moves the root toward the setup's position for A and B; when both are within 0.3 units, it blends into the setup over 0.2 seconds.
- **Get-ups and selling.** A strike plays a hit reaction on the one struck: six reactions (head left, head right, body, legs, a stagger, a drop to one knee), made in Create a Move as moves tagged `sell`; after a landing, one of four get-ups (from the back, from the front, using the ropes, rolling out of the ring) plays unless the next beat starts on the mat.
- **The stock moves** (`MOVES`, `CLASSIC`) are moved onto setups and given tags.

## 9. Physics, kept light

Fixed step of 1/120 second, run in step with the animation clock, never the wall clock.

### 9.1 Bodies
Each piece has a capsule (radius and length from the piece's outline). Capsules of different figures push apart by half the overlap each, two passes a step. Capsules of figures in a hold are not pushed against each other where the hold touches.

### 9.2 The mat (answer 8)
The mat is a 24 by 24 grid of damped springs (stiffness 60, damping 8) worked out on the CPU on the fixed step (576 points, a trivial cost). The heights go up to the GPU each frame as a small texture; the mat's vertex shader displaces by it, and so does its depth material, so the shadow map sees the same moving surface. Figures sample the same grid for the height they stand at. An impact pushes the points near it down by `force` times the weight factor (`poundsOf() / 220`), a big stylised wobble that spreads and settles in about 0.6 seconds. Figures standing on the mat ride its height; shadows are cast onto the moving surface.

### 9.3 The ropes
Each rope is a line of 12 points, each a spring to its rest place. A figure that hits a rope (an Irish whip, a rope run) pushes the points and is pushed back; the Irish whip's move times its rebound to the rope's return. A figure over the top rope takes the floor setup.

### 9.4 Loose falls (answer 9)
A light ragdoll only for dives to the floor, falls off ladders and through tables: Rapier, the build `@dimforge/rapier3d-deterministic` (free, Apache 2.0; the compat build, which carries its WebAssembly inside the script, so it is the same on every machine and works offline in the single-file page and the Electron build; about 1.5 MB, credited in `tools/CREDITS.md`). It is loaded only when the next segment can have a loose fall or a broken table (a dive, a ladder, tables rules) with one rigid body per piece and the section 5.1 limits as joints. The move says when (`loose`); the body hands from the animation to Rapier with the pieces' current velocities, and back to animation when it has settled (speed under 0.2 for 0.3 seconds) through a get-up that starts from the pose it landed in. Rapier runs only while a fall is loose. On Low, and while Rapier is still loading, the fall plays as a set animation instead: four of them, made in Create a Move like any move (a flat back bump to the floor, a fall off a ladder, through a table, over the top rope).

### 9.5 Tables (answer 10)
A table is pre-cut into eight card pieces (the top in four, the legs). The engine already logs a table spot in a match with tables rules (`STIP`); the picker places the table setup and the move's `breaks`. On the break the pieces go to Rapier, fall and stay where they land until the segment ends. Ropes and the ring breaking are deferred.

## 10. The beat picker: from the engine to a chain

The engine writes the broadcast's beats (`sg.bc`, from `callMatch()` in `engine/10-match.ts`): the entrances (`ent`), the opening bell and the opening line by style, the middle (`mid`), a near fall (`near`, `h: 1`), the finish (and the finisher by name when it has one), a new champion (`newchamp`, `h: 2`), and in battle royals the eliminations (`br_elim`).

| Beat | Moves picked from |
|---|---|
| Opening | collar and elbow, then a strike or a grapple of the wrestler's style |
| Middle | a chain of two or three: strike, grapple, lift, by style |
| Near fall | a finisher, then the pin and a kick-out. After step 0 the engine only records a near fall when somebody kicks out of a finisher (`FINX` in `engine/86-looks.ts`), so the picture and the engine always agree |
| Signature | a signature (`look` signatures with their `stage`) on its own, never followed by a pin |
| Finish | the full chain (answer 6): the finisher's setup, the finisher (`FIN_SCENES`), the pin and the referee's count |
| New champion | the finish, then the belt handed over (the existing champion still) |
| Elimination | a move toward the ropes and over the top to the floor |

**How a match ends.** The engine already says how each finish happened (`fin`: clean, flash, cheap, interference, DQ, count-out, draw, foiled) and under what rules (`STIP`). The chain always plays in full (answer 6); what closes it depends on the finish:

| Finish | The chain ends with | The referee |
|---|---|---|
| Clean, under standard rules | finisher, pin | counts three |
| Flash (a roll-up out of nowhere) | the roll-up as the finishing move, pin | counts three |
| Cheap (feet on the ropes, a tight or a weapon) | the cheat, the finisher, pin | counts three, not seeing it |
| Interference | the run-in's move, the finisher, pin | counts three |
| Disqualification | the illegal move (a weapon, a low blow) | calls for the bell |
| Count-out | a fight to the floor, one stays down | counts to ten from the ring |
| Draw | both down, or time runs out | counts both, or calls for the bell |
| Foiled (the finish stopped) | the finisher stopped or countered, then a pin | counts three for the other one |
| Submission rules | finisher as a hold, the tap | calls for the bell on the tap |
| Tables | through the table | calls for the bell |
| Ladder | the climb and the belt pulled down | none; the ring announcer calls it |
| Steel cage or cell | out of the door or over the top, or a pin | none, or counts three |
| Mask or hair | the finisher and the pin, then the mask or the hair | counts three |
| Iron man | each fall as above; the last one closes the match | counts each fall |
| Lumberjack | as clean, with people round the ring | counts three |
| Battle royal | over the top rope to the floor | watches the feet |

So "always the full chain" means: the setup, the finishing move, and whatever this finish ends with.

**Pins (Ryan, 29 October):** a pin attempt only ever follows a move tagged `finisher`. That tag covers the wrestler's own finisher and, for the match where the engine says so, a roll-up, a small package or a cheap pin (Ryan: roll-ups are finish moves). A signature, a strike or any other move is never followed by a pin. The pin is its own move tagged `pin`, and the picker only places it right after a `finisher`; a test checks that no chain in 60 recorded matches puts a pin after anything else.

**Filters, in order:** the move's `needs` against the wrestler (Agility, age, injury: answer 18), the size gap (section 7.3), the ring position (a top-rope move needs a corner), the stipulation (tables, ladders). **The pick:** among what passes, `h01(seed + segment + beat index)`, never `rnd(S)`. **Fallback:** a strike exchange, which needs nothing.

**Tag matches.** The legal man is in the ring and his partner stands on the apron in the corner; a tag is its own short move (a hand slap, the partner steps through the ropes). The double-team setup is played only right after a tag or when the referee is turned away (the run-in or the cheat beats). **Battle royals.** At most 8 in the ring (answer 12); the others wait on the floor by the ramp in order of entry and come in when somebody goes over the top, so the ring never holds more than 8. The engine logs only some eliminations by name (`br_elim`); the rest are shown quickly between the logged beats, a body over the top with no line, so the count of people in the ring always matches. **Ladder, cage and cell.** The ladder finish is a climb loop and a belt grab; the cage finish is a climb loop and a drop to the floor, or a walk out of the door. **Beats with a move kind.** `mid_<kind>` beats (the commentary already names the kind) pick only moves with that tag.

**Timing (answer 7):** the TV pace stays (`tvKeys()`: four seconds a minute on the clock for a match). The picker fills each kept beat's time with as few moves as fit in full; a move never plays cut short. Results pace shows only the finish's last move, and still plays its impact sound and the bell.

## 11. Cameras, the referee and the entrance

- **Cameras.** Each move carries its own shot (`cam3` per key, as `CLASSIC` already does). Between moves the camera glides; on an impact with force 0.7 or more (forces run from 0 to 1) it cuts to a low shot for 0.5 seconds. A camera that would sit inside a rope or post moves to the nearest clear spot along its line.
- **The referee** is a full 3D figure (the 9th in the ring). He keeps to a spot 2 units off the action, faces it, and on a pin drops to the mat and counts with his hand on each count the crowd shouts (`cues.ts` already times "ONE! TWO! THR-").
- **The entrance.** The entrance walk is a loop on the 3D ramp with the pyro and lights it already has (`dressEntrance()`).

## 11a. The 2D renderer

The 2D canvas renderer (`paper.ts`, `puppet.ts`) is kept and kept in step: it is the fallback for very slow machines, and it still draws the stills on the desk and the calls (`moment.tsx`), the posters and covers from Create a Scene's templates, and the small portraits in lists. A change to a figure (a new part, a new piece of clothing) lands in `puppet()` once, and both renderers cut from it. During the move to 3D the editors keep their 2D view beside the 3D one until step 3 is done; the 2D view then becomes a "Flat preview" toggle.

## 12. Determinism

The same report draws the same frames. Every choice is hashed from the seed, the segment and the beat. Physics runs on the fixed step from a hashed start, Rapier is deterministic, and nothing reads the wall clock. A save loaded mid-show (`S.live`) restarts the current segment from its first beat and plays to the same frame. Test: a pose hash per frame for a recorded show, the same twice.

## 13. Speed: the budget and the gate

The target (answer 11): 60 frames a second on High on about a GTX 1060, measured, not claimed.

| Item | High | Medium | Low |
|---|---|---|---|
| Ring figures (up to 8 plus the referee) | profile cuts, 3 cards a torso piece | profile cuts | card turn |
| Triangles a figure | 3,000 | 2,000 | 800 |
| Draw calls a figure | 3 (atlas) | 3 | 1 |
| Crowd near the ring (first rows, about 300) | 3D figures, instanced, swaying in the vertex shader | same, half | flat instanced cards |
| Crowd far away (up to 5,000) | low figures, instanced, 2 poses | flat cards | flat cards, no motion |
| Shadows | soft, 2048 map, figures and props | 1024 | blob under each figure |
| Depth of field | on | off | off |
| Physics | full | full | mat and ropes only; loose falls play as a set fall |

Fans are never a CPU skeleton: they sway by a few stored poses blended in the shader.

The arithmetic on High: 9 figures at 3,000 triangles is 27,000; 300 near fans at 400 triangles is 120,000; 4,700 far fans at 40 triangles is 188,000; the ring, ramp, building and props about 50,000. Total about 385,000, under the 400,000 budget. Draw calls: 9 figures at 3 is 27; the crowd is 2 instanced batches a tier (4); the set, props and shadows under 150. Total under 400.

**The gate, in two parts.** Headless Chromium in CI draws with software (SwiftShader), so it cannot measure a GTX 1060.
- **Automated budget (nightly):** `app/tests/bench3d.js` reads `renderer.info` on the benchmark scene at each quality and fails if draw calls or triangles go over the table above.
- **Reference machine (each milestone):** the same benchmark run by hand on a GTX 1060 machine. The 95th percentile frame time must be under 16.7 ms on High, and the result is written into `docs/perf/3d.md` with the date.

**The benchmark scene:** (8 wrestlers and the referee in a full arena of 5,000, a loose fall and a table breaking) includes 8 wrestlers, the referee, a full arena, a loose fall and a table breaking. The game picks a starting quality by running 2 seconds of it on first launch. A machine that cannot hold Low gets the flat fallback.

## 14. The editors and tools

- **Create a Move:** a Setups list and a Moves list; "Start from" (a setup) and "Ends in" (a setup or a landing); a 3D gizmo on each joint (rotate rings) and IK handles on hands and feet (drag the hand, the arm follows); holds set and released per key; mirror a pose left to right; impacts, loose falls and breaks placed on the timeline; a play button that runs the solve and the physics as the broadcast will.
- **Create a Scene and Animation:** the 3D figures, the turn handle, the same gizmos.
- **Create a Player:** the wrestler on a turntable (front, side, back) with the profile cut shown.
- **`tools/convert-moves.js`:** converts a world's moves and prints its report.

## 15. Steps, each one playable and tested

| Step | What is built | Done when (tests) |
|---|---|---|
| 0. Near falls in the engine | Ryan, 29 October: a near fall only happens when somebody kicks out of a finisher. `callMatch()` in `engine/10-match.ts` stops writing a `near` beat for every match over 8 minutes and writes one only when the `FINX` hook records a finisher kick-out. This changes play a little (finisher wear, momentum), so it goes through the critic on its own, the golden games are recorded again, and `test-balance.js` must still pass | headless: every `near` beat in 60 recorded games has a finisher kick-out behind it; `test-balance.js` passes; `app/tests/sound.js` passes (the crowd's count follows `near`); the report says how many near falls a match has before and after |
| 1a. Rig and cards | the rig, card pieces with front and back, the atlas, the converter on every included scene, the flat fallback kept | `app/tests/scene.js` sweep: every included scene renders in 3D with no errors; no included key outside the joint limits; converted keys match their 2D pose from the hard camera: every joint and piece centre, projected to the screen at 1080p, within 6 pixels of where the 2D renderer puts it, plus a look by eye at a contact sheet of every included scene |
| 1b. Views | the High profile cuts and the Low card turn, lettering by view | the sweep again at both qualities; a figure turned a full circle shows front, side, back, side with no gap or flicker |
| 1c. Crowd and quality | the 3D crowd in tiers, the quality setting, the first-launch pick | `bench3d.js` budget check passes at every quality with figures standing; the reference machine run is recorded |
| 2. Setups and holds | the setup library (all fifteen), Holds, IK, the solve order, size stretch and refusal | headless: every setup solves with hold error under 0.02 units for small, standard and giant bodies; refusal fires at the ratio and the picker falls back |
| 3. Moves that chain | Move data, blending, the stock moves on setups, the beat picker, the referee's count | headless: every beat kind of 60 recorded matches gets a chain; long matches still fill their TV time with full moves after step 0; the same seed picks the same chain; a finish always plays its full chain; no move cut short at TV pace |
| 4. The ring | capsules, the spring mat, the ropes, the floor and cage | headless: no capsule overlap over 0.03 units after a step in 1,000 recorded frames; same input, same pose hash |
| 5. Loose falls and tables | Rapier falls, get-ups, breakable tables | the pose hash test holds with Rapier on; `bench3d.js` holds the gate with a fall and a break |
| 6. Walks, the entrance, cameras | the loops, walking into setups, the 3D entrance, automatic cameras | browser: a full show at TV pace with no camera inside a rope (a ray test per frame) |

Each step goes through the critic (rule 9j) before it is committed.

## 16. Risks and fallbacks

| Risk | Fallback |
|---|---|
| The GTX 1060 misses 60 on High | fewer near fans, shadows to Medium; then Low's card turn for the ring figures |
| IK shakes or snaps in a hold | hold the solved pose for a frame when the target jumps; clamp joint speed; the key's own pose wins over IK when the gap is over 105% |
| A loose fall looks wrong in the paper style | stiffen the joints (paper does not flop) and keep falls short; worst case a set fall animation |
| Old moves convert badly | they stay marked "Check this move" and the hard-camera picture is unchanged |
| The editor grows too hard to use | setups first, so a player poses only the keys between two known positions; mirror and IK handles do most of the work |
| World files change shape | worlds get a version number and the converter runs on load (saves are not protected yet, rule 9) |


## 17. The questions (asked 29 October)

Asked one at a time; the answers are in section 18.

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

## 18. Ryan's answers (29 October)

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
| 19 | Pins | **Pins only on finishers, never on signatures** (added 29 October). |
| 20 | Near falls | **Engine change:** a near fall only happens when somebody kicks out of a finisher (step 0) (29 October). |
| 21 | Roll-ups | **Roll-ups are finish moves:** a roll-up, small package or cheap pin counts as the finishing move of that match, so its pin is allowed (29 October). |

## 19. What it hands the next phase, and what it replaces (rule 9g)

- **Director tag:** colour (it changes how things look, not what reaches the desk).
- **Hands on:** the base for the later career mode where you play as a wrestler, and scenes good enough for posters and the Steam page.
- **Replaces:** posing flat dolls by hand in every key; the 2D-only figure in the 3D stage (kept only as the fallback for very slow machines).
