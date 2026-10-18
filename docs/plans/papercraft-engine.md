# The papercraft engine: the master plan

Ryan, 18 October. This is the blueprint for the construction paper game, in his words, with notes on how each part
fits the code we have today. Rule 2a in `CLAUDE.md` is the look; `docs/plans/character-creator.md` is the detail
of the wrestlers' faces and parts. Where this plan and an older plan disagree, this one wins.

**The look:** a handmade construction paper diorama, like stop motion. Matte card, edges cut and folded by hand,
a shadow under every piece worked out from its height, and limbs held on by brass split pins. The reference
pictures are in `docs/mockups/paper/` (the desk, the portraits, the bodies, the lock-up and the cover).

## 1. Making the parts in Blender

- Every piece of clothing, hair, beard and extra is made in Blender: few polygons, flat card with a matte paper
  finish.
- Every part has the same attachment points (sockets): `head_socket`, `chest_socket`, `waist_socket`, and one at
  every split pin (shoulders, elbows, wrists, hips, knees, ankles). The game fits a part to any body by its
  sockets: it scales and stretches it to the wrestler's proportions.

**How it fits today's code.** The game draws by code and keeps no image files (rule 2). So a Blender part is
exported as data: each piece's outline, its colour slots, its height in the stack, and its sockets, written to
JSON by a script in `tools/creator/`. The game cuts the piece from that outline at run time and draws its paper
grain, its pale cut edge and its shadow. A part is a few hundred bytes, the world stays one small page, and a
modder can add a part without an image.

## 2. Create a wrestler, and what a wrestler is

A wrestler is a small JSON record:

| Field | What it holds |
|---|---|
| `id` | A unique id |
| `name`, `moniker`, `hometown` | Ring name, nickname, home town (the hometown already counts on the road: `homeKm()`) |
| `physical_attributes` | Height in inches, weight in pounds, body type, and the body's sliders: `torso_width`, `limb_length`, `muscle_mass` (and the rest in `character-creator.md`) |
| `attires` | Outfits: `primary_ring`, `entrance_gear`, `street_clothes`. Each lists the parts worn, their colours, and the text and shapes stamped on them |
| `finishing_moves` | The finisher and signature moves: `impact_damage`, `kickout_difficulty`, `position`, `category`, and the pose the picture shows |

**How it fits today's code.** Ryan's answer: a file per wrestler. Today a wrestler lives inside the save (`S.w`, the save key
`ewf9000-save-4`) and inside a world package; the record above moves out into its own `.json` file
(`/save/wrestlers/` on the desktop build), the save points to it by `id`, and old saves are split into files by a
migration (rule 9). The same file is what goes to the Steam Workshop (section 6). The finisher numbers feed the match engine through the
hooks it already has (`MQX`, `FINX` in `src/10-match.js`), so a big finish is harder to kick out of.

## 3. The gear studio: lettering and shapes

- **Lettering:** a team name or a slogan set in card, with sliders to bend it into an arch or a curve. It takes
  the paper grain and throws its own shadow.
- **Shapes and patterns:** drop shapes, straps and plates onto a piece of gear to build something new (a vest
  with straps, a jacket in layers), with stencil and spray paint effects.

Both are stored as data on the outfit, never as a picture.

## 4. The diorama and match picture studio (built first)

This comes first because everything else draws through it: every match card, poster, rivalry graphic and
celebration in the game is a diorama it renders.

- **The renderer:** places paper pieces in layers, sorts them by height, and draws each with its grain, its cut
  edge and a soft shadow that grows with its height and follows the light. It runs in the game (a canvas), not in
  Blender, so it can draw whoever is on tonight's card.
- **The scene builder:** an in-game sandbox where the player places figures, props (tables, chairs, belts) and
  backdrops on a stage, and sets the camera, the zoom and the light. A scene they make can be saved and used as a
  template (section 5).

## 5. Canned scenes and the match

A canned scene is a `.scene.json` file: the backdrop, the props and where they stand, the slots for the people
(`Slot_A`, `Slot_B`, the referee), the pose in each slot, and the camera.

When the game books a match it:
1. reads the wrestlers' records;
2. picks a scene that fits (a stare-down, a brawl in the corner, a title celebration);
3. puts each wrestler's body, gear, colours and proportions into the slots;
4. draws it, and keeps it with the match in the report and the history.

**How it fits today's code.** The broadcast already marks its big moments (`h` on a beat: a near fall, a finish,
a new champion, set in `callMatch()`), and After the show already lists what the night left. Those are where the
scenes go: a scene on the broadcast at the moment, and the night's best scene on After the show and in History.
The moments are made up and the people in them are made up or parody characters (rule 3), so a title celebration
is "a new champion held up on a shoulder", never a real wrestler's moment by name.

## 6. Steam Workshop and total conversions

A roster, a wrestler, a scene, a pack of match moments or a company's history is a small bundle of JSON. A player
subscribes on the Workshop, and the game downloads it and reads it in at start-up. A world package (`universes/`,
`src/85-history.js`) is already the right shape for a roster and its history; the Workshop is a way to ship it.
The desktop build already has `steamworks.js` as an optional part.

## The order of work (one step at a time, rule 9a)

1. **The paper renderer in the game:** one canvas routine that cuts a piece from an outline and draws its grain,
   cut edge and shadow. Checked against the Blender pictures until the two match.
2. **A wrestler drawn from a recipe** with it: the portrait first (it replaces the pixel faces), then the full
   paper doll.
3. **The scene file and two canned scenes** (the lock-up, the cover) played on the broadcast at the right
   moments.
4. **The record in section 2** in the save and the world packages, with the migration.
5. **Create a wrestler** in the paper look, then the gear studio.
6. **The scene builder** for players.
7. **The parts library** filled out from Blender, with the export script.
8. **Steam Workshop.**

## Ryan's answers (18 October)

1. **Real names:** the named celebration was only an example. Scenes copy the kind of moment, never the person.
2. **Where wrestlers live:** a file per wrestler. The game reads and writes each wrestler as its own `.json` file
   (`/save/wrestlers/` on the desktop build; the browser build keeps the same records in its own storage). The
   save points to the wrestlers by `id`. A world package is a folder of these files plus the companies and the
   history.
3. **What comes first:** the diorama renderer, with wrestlers drawn from what the game already knows about them,
   then canned scenes on the broadcast; Create a wrestler after that (the order of work above stands).

## What Create a Scene must be able to do (Ryan, 18 October)

Create a Scene should work like a photo mode with enough options to make any picture: breaking news, talk show
highlights, posters, magazine covers, portraits, and wrestling's big moments. Ryan gave a list of famous moments from
the 1980s and 1990s as inspiration. We do not rebuild them by name (rule 3: no real wrestlers, events or logos in the
game). They tell us which tools the studio needs, and players can stage their own versions.

| The kind of moment | What the studio needs for it |
|---|---|
| A champion holding the belt high in a packed house | A packed stadium set, the belt held overhead (built), confetti (built), a low camera |
| A giant and a hero nose to nose | Size per person (a giant beside a normal man), a close camera (built), snarling faces |
| A giant lifted for a slam | One person held in another's hands (a figure fixed to a hand), motion lines, camera flashes in the crowd |
| Partners screaming at each other backstage | More backstage sets (hallway, locker room, office), shouting faces (built) |
| One man holding two belts | Several belts, a belt worn on the shoulder or the waist, pyro and smoke |
| A wrestler lifting his manager while the crowd cries | People who are not wrestlers (a dress, a suit), lifting a person, tears |
| A champion on his knees, crying, clutching the belt | A library of poses (kneel, sit, lie, lift, carry, cover, hold, point, celebrate), tears, sweat |
| Three men side by side as the crowd turns on them | Groups of three or more (built, up to six), rubbish thrown into the ring, matching shirts with lettering |
| A bloody man screaming in a submission hold | Blood (a cut, a trickle, a face covered), pain faces, two bodies locked together (each limb in front or behind) |
| A figure in the rafters with a bat | A rafters set, a bat, a spotlight in a dark building |
| A man thrown off the roof of a steel cage | A cage over the ring with a roof, a body in mid-air (built), an announce table below, a high wide camera |
| A man spraying his rivals from a truck | A truck, a spray of liquid, men in suits |

### The toolkit, by kind

- **People:** size per person (from small to a giant); more faces (snarl, smirk, crying, pain, roar, eyes shut);
  clothes for people who are not wrestlers (suit, dress, T-shirt, jeans; the referee's shirt is built); one person
  held in another's hands; each limb in front of or behind the body, for holds; a library of poses to start from.
- **Marks on people:** blood in three steps, sweat, tears, bruises.
- **Effects:** motion lines, impact stars, camera flashes, smoke and pyro, sparks, a spray of liquid, confetti (built),
  rubbish thrown in.
- **Props:** more belts (held, on the shoulder, round the waist), chairs and tables (built; a broken table), ladders,
  a bat, a kendo stick, steel steps, a bin, a truck, a hose, signs (built), headlines (built).
- **Sets:** the ring (built), a packed stadium, backstage (built) plus hallway, locker room and office, the parking
  lot, the entrance ramp, the rafters, a steel cage with a roof, the announce desk, a talk show set, a news desk.
- **Light and camera:** a spotlight, a dark building, coloured light, flashes; the camera (built: zoom, pan, tilt);
  tall pictures for posters and covers, square ones for portraits.
- **Lettering:** headlines and bursts (built), captions, a magazine masthead.

### The order to build it in (one batch at a time, each shown to Ryan)

1. **People and marks:** size per person, more faces, blood, sweat and tears, and the pose library.
2. **Holding and lifting:** a person fixed to another's hands, each limb in front or behind. *Built:* a figure can be
   held by another's hands, shoulders, chest, waist or head (`Fig.on`, "A:hands"; Held by on the Pose tab), and any arm
   or leg can be brought in front of everyone or sent behind (`Fig.lz`). Three scenes use it: the slam, the sleeper
   hold and the carry over the shoulders. In 3D a held person is cut on the card of the one holding them, so the two
   turn together and an arm round a neck stays in front.
3. **Light and effects:** spotlight and a dark building, motion lines, camera flashes, smoke, sparks, spray.
4. **Sets:** the packed stadium, the steel cage, the rafters, the hallway and the office, a talk show and a news desk.
5. **Props and clothes:** ladders, a bat, steps, a bin, a truck; suits, dresses and T-shirts.
6. **Frames:** tall and square pictures, captions and a masthead, for posters, covers and portraits.

### Hooks: who a scene is about (Ryan, 18 October; for when the scene library is bigger)

A scene's people are not fixed wrestlers. Each slot is a **hook**: the part somebody plays in the story, such as the
Protagonist, the Villain, Heel group member 1, 2 and 3, the Champion, the Challenger, the Manager, the Authority
figure, the Interviewer or the Referee. The game fills each hook from what is happening: the face of the company, the
members of the heel stable in the feud, the holder of the title on the line, the general manager who made the match.
So one scene of a faction beating down a hero plays for any faction and any hero, and a player making a scene picks
hooks, not people.

Today a slot has a role of `a`, `b`, `ref` or `c`, and the broadcast fills it from the match (the winner, the one
covering, the one on the microphone). Hooks replace those roles with named parts and give the game rules for filling
each one. This comes once there is a bigger list of kinds of scene to build them for: beat-downs, run-ins, contract
signings, interviews, title presentations, celebrations, and the rest of the big moments above.

*Built (18 October):* a slot can carry a `hook` (the Cast and props tab, "the part in the story"). `E.sceneHooks(S, o)`
in `src/86-scenes.js` fills the parts from a moment of the show and what the game knows: the hero and the villain by
side, the villain's group (the stable's leader first, then the rest, a tag partner, the manager), the hero's partner,
the manager, the champion of the title on the line and the challenger, the winner and the loser, the one talking,
the attacker and who gets attacked, and the face of the company. A slot whose part nobody in the moment can play is
left out of the picture. The first scene built on hooks is the beat-down (an attack, an ambush or a brawl on the
broadcast): the villain and two of the villain's group on the hero. `node test-scenes.js` checks the rules.
Still to come: the authority figure, the interviewer, and the referee as a named person.
